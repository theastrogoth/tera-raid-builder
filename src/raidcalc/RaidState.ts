import { Field, Generations, Pokemon, StatsTable, toID } from "../calc";
import { Raider } from "./Raider";
import { getModifiedStat, getQPBoostedStat } from "../calc/mechanics/util";
import * as State from "./interface";
import { AbilityName, ItemName, SpeciesName, StatIDExceptHP, StatusName, Terrain, TypeName, Weather } from "../calc/data/interface";
import persistentAbilities from "../data/persistent_abilities.json"
import { hasNoStatus, pokemonIsGrounded } from "./util";
import { CumulativeRolls } from "./rolls";

const gen = Generations.get(9);

export class RaidState implements State.RaidState{
    raiders: Raider[];      // raiders[0] is the boss, while raiders 1-5 are the players
    lastMovedID?: number;   // id of the last Pokemon to move

    constructor(raiders: Raider[], lastMovedID?: number) {
        this.raiders = raiders;
        this.lastMovedID = lastMovedID;
    }

    clone(): RaidState {
        return new RaidState(
            this.raiders.map(raider => raider.clone()),
            this.lastMovedID,
        )
    }

    public get fields(): Field[] {
        return this.raiders.map(raider => raider.field);
    }

    public getPokemon(id: number): Raider {
        return this.raiders[id];
    }

    public applyDamage(id: number, damage: number, damageRolls: Map<number,number> | undefined = undefined, nHits: number = 0, isCrit: boolean = false, isSuperEffective: boolean = false, moveType?: TypeName, moveCategory?: "Physical" | "Special" | "Status" | undefined, blockSymbiosis: boolean = false, isWind: boolean = false, bypassSubstitute: boolean = false, isSheerForceBoosted = false, blockWhiteHerb: boolean = false) {
        const pokemon = this.getPokemon(id);
        const originalHP = pokemon.originalCurHP;
        const originalDamageRolls = pokemon.cumDamageRolls.clone();
        if (pokemon.originalCurHP === 0) {          // prevent healing KOd Pokemon, and there's no need to subtract damage from 0HP
            if (damage !== 0 && damageRolls) {
                pokemon.addDamageRoll(damageRolls); // but we should still record the damage rolls
            }
            return; 
        } 

        if (pokemon.substitute && !bypassSubstitute) {
            pokemon.substitute = pokemon.substitute <= 0 ? undefined : pokemon.substitute - damage;
        } else {
            pokemon.applyDamage(damage, damageRolls);
        }

        const maxHP = pokemon.maxHP();
        const opponents = id === 0 ? [1,2,3,4] : [0];
        let unnerve = false;
        let fainted = pokemon.originalCurHP <= 0;
        for (let i of opponents) {
            if (this.getPokemon(i).hasAbility("Unnerve")) { unnerve = true; break; }
        }
        if (nHits > 0 && damage > 0) { // checks that the pokemon was attacked, and that the damage was not due to recoil or chip damage
            if (damage > 0) {
                pokemon.hitsTaken = pokemon.hitsTaken + 1;
            }
            // Item consumption / Ability Activation triggered by damage
            if (pokemon.hasAbility("Ice Face") && !pokemon.abilityOn && pokemon.name.includes("Eiscue") && moveCategory === "Physical") {
                pokemon.changeForm("Eiscue-Noice" as SpeciesName);
                pokemon.abilityOn = true;
                pokemon.originalCurHP = originalHP; // no damage is done
                pokemon.cumDamageRolls = originalDamageRolls;
                fainted = false;
                return; // don't trigger item use
            }
            if (pokemon.hasAbility("Disguise") && !pokemon.abilityOn && pokemon.name.includes("Mimikyu")) {
                pokemon.abilityOn = true;
                pokemon.originalCurHP = originalHP; // negate damage from attack
                pokemon.cumDamageRolls = originalDamageRolls;
                pokemon.applyDamage(Math.floor(pokemon.maxHP()/8)); // bust disguise, 1/8 max HP damage                
                if (pokemon.originalCurHP === 0) {
                    this.faint(id);
                }
                return; // don't trigger item use (except for Air Balloon)
            }
            if (pokemon.item === "Focus Sash" || pokemon.hasAbility("Sturdy")) {
                if (pokemon.originalCurHP <= 0 && originalHP === maxHP) { 
                    pokemon.originalCurHP = 1;
                    if (pokemon.ability !== "Sturdy") { this.consumeItem(id, pokemon.item!, true, blockSymbiosis); } 
                    fainted = false;
                }
            }
            if (pokemon.item === "Air Balloon") {
                this.loseItem(id, true, blockSymbiosis);
            }
            // Weakness Policy and Super-Effective reducing Berries
            // TO DO - abilities that let users use berries more than once
            if (isSuperEffective) {
                if (!fainted && pokemon.item === "Weakness Policy") { // weakness policy isn't consumed if the target faints (?)
                    this.consumeItem(id, pokemon.item, true, blockSymbiosis);
                } else if (!unnerve) {
                    switch (pokemon.item) {
                        case "Enigma Berry":
                            this.consumeItem(id, pokemon.item, true, blockSymbiosis);
                            break;
                        case "Occa Berry":  // the calc alread takes the berry into account, so we can just remove it here
                            if (moveType === "Fire") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Passho Berry":
                            if (moveType === "Water") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Wacan Berry":
                            if (moveType === "Electric") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Rindo Berry":
                            if (moveType === "Grass") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Yache Berry":
                            if (moveType === "Ice") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Chople Berry":
                            if (moveType === "Fighting") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Kebia Berry":
                            if (moveType === "Poison") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Shuca Berry":
                            if (moveType === "Ground") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Coba Berry":
                            if (moveType === "Flying") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Payapa Berry":
                            if (moveType === "Psychic") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Tanga Berry":
                            if (moveType === "Bug") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Charti Berry":
                            if (moveType === "Rock") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Kasib Berry":
                            if (moveType === "Ghost") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Haban Berry":
                            if (moveType === "Dragon") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Colbur Berry":
                            if (moveType === "Dark") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Babiri Berry":
                            if (moveType === "Steel") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        case "Roseli Berry":
                            if (moveType === "Fairy") { this.consumeItem(id, pokemon.item, true, blockSymbiosis); }
                            break;
                        default: break;
                    }
                }
            }
            /// Non-super effective items consumed after damage
            if ( (!unnerve && pokemon.item === "Chilan Berry" && moveType === "Normal") ||
                 (pokemon.item === "Absorb Bulb" && moveType === "Water") ||
                 (pokemon.item === "Cell Battery" && moveType === "Electric") || 
                 (pokemon.item === "Luminous Moss" && moveType === "Water") ||
                 (pokemon.item === "Snowball" && moveType === "Ice") ||
                 (pokemon.item === "Kee Berry" && moveCategory === "Physical" && !isSheerForceBoosted) ||
                 (pokemon.item === "Maranga Berry" && moveCategory === "Special" && !isSheerForceBoosted)
                ) {
                this.consumeItem(id, pokemon.item, true, blockSymbiosis);
            }
 
            /// abilities triggered by damage even if the target faints
            if (pokemon.hasAbility("Seed Sower")) {
                this.applyTerrain("Grassy", pokemon.hasItem("Terrain Extender") ? 8 : 5);
            } else if (pokemon.hasAbility("Sand Spit")){
                this.applyWeather("Sand", pokemon.hasItem("Smooth Rock") ? 8 : 5)
            }

            /// the rest can be skipped if the target faints
            if (fainted) { this.faint(id); return; }
            /// abilities triggered by damage if the target survives
            if (isCrit && pokemon.hasAbility("Anger Point")) { 
                const boost = {atk: 12};
                this.applyStatChange(id, boost, true, id);
            } else if ((moveType === "Fire" || moveType === "Water" ) && pokemon.hasAbility("Steam Engine")) {
                const boost = {spe: 6};
                this.applyStatChange(id, boost, true, id);
            } else if (moveType === "Water" && pokemon.hasAbility("Water Compaction")) {
                const boost = {def: 2};
                this.applyStatChange(id, boost, true, id);
            } else if (moveType === "Dark" && pokemon.hasAbility("Justified")) {
                const boost = {atk: 1};
                this.applyStatChange(id, boost, true, id);
            } else if (moveType === "Fire" && pokemon.hasAbility("Thermal Exchange")) {
                const boost = {atk: 1};
                this.applyStatChange(id, boost, true, id);
            }  else if (moveCategory === "Physical" && pokemon.hasAbility("Weak Armor")) {
                const boost = {def: -1, spe: 2};
                this.applyStatChange(id, boost, true, id, false, false, blockWhiteHerb);
            } else if (pokemon.hasAbility("Stamina")) {
                const boost = {def: 1};
                this.applyStatChange(id, boost, true, id);
            } else if (pokemon.hasAbility("Anger Shell") && !isSheerForceBoosted && originalHP > maxHP/2 && pokemon.originalCurHP <= maxHP/2) {
                const boost = {atk: 1, spa: 1, spe: 1};
                this.applyStatChange(id, boost, true, id);
            } else if (pokemon.hasAbility("Berserk") && !isSheerForceBoosted && originalHP > maxHP/2 && pokemon.originalCurHP <= maxHP/2) {
                const boost = {spa: 1};
                this.applyStatChange(id, boost, true, id);
            } else if (pokemon.hasAbility( "Electromorphosis")) {
                pokemon.field.attackerSide.isCharged = true;
            } else if (pokemon.hasAbility("Rattled") && ["Dark", "Ghost", "Bug"].includes(moveType || "")) {
                const boost = {spe: 1};
                this.applyStatChange(id, boost, true, id);
            } else if (pokemon.hasAbility("Wind Power") && isWind){
                pokemon.field.attackerSide.isCharged = true;
            }
        }
        /// Abilities activated by HP %
        // Shields Down
        if (pokemon.hasAbility("Shields Down") && pokemon.name.includes("Minior")) {
            if (pokemon.originalCurHP < maxHP/2 && pokemon.species.name === "Minior-Meteor") {
                pokemon.changeForm("Minior" as SpeciesName);
            } else if (pokemon.originalCurHP >= maxHP/2 && pokemon.species.name === "Minior") {
                pokemon.changeForm("Minior-Meteor" as SpeciesName);
            }
        }
        /// Berry Consumption triggered by damage
        if (!unnerve && pokemon.item && pokemon.item?.includes("Berry")) {
            // 50% HP Berries
            if (pokemon.originalCurHP <= maxHP / 2) {
                if (pokemon.item === "Sitrus Berry" || pokemon.item === "Oran Berry") {
                    this.consumeItem(id, pokemon.item as ItemName, true, blockSymbiosis)
                }
            }
            // 25% HP Berries
            if ((pokemon.originalCurHP <= maxHP / 4) || (pokemon.hasAbility("Gluttony") && (pokemon.originalCurHP <= maxHP / 2))) {
                switch (pokemon.item) {
                    case "Liechi Berry":
                    case "Ganlon Berry":
                    case "Petaya Berry":
                    case "Apicot Berry":
                    case "Salac Berry":
                    case "Lansat Berry":
                    case "Micle Berry":
                    case "Aguav Berry":
                    case "Figy Berry":
                    case "Iapapa Berry":
                    case "Mago Berry":
                    case "Wiki Berry":
                        this.consumeItem(id, pokemon.item as ItemName, true, blockSymbiosis);
                        break;
                }
            }
        }
        // Final Check for fainting
        if (fainted) { this.faint(id); }
    }

    public consumeItem(id: number, item: ItemName, lost: boolean = true, blockSymbiosis = false) {
        const pokemon = this.getPokemon(id);
        switch (item) {
            case "White Herb":
                for (let stat in pokemon.boosts) {
                    const statId = stat as StatIDExceptHP;
                    if ((pokemon.boosts[statId] || 0) < 0) { 
                        pokemon.boosts[statId] = 0; 
                        pokemon.lastConsumedItem = item as ItemName;
                    }
                }
                break;
            // Status-Curing Berries
            case "Cheri Berry":
                if (pokemon.status === "par") { 
                    pokemon.status = "";
                    pokemon.lastConsumedItem = item as ItemName; 
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Chesto Berry":
                if (pokemon.status === "slp") { 
                    pokemon.status = "";
                    pokemon.lastConsumedItem = item as ItemName; 
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Pecha Berry":
                if (pokemon.status === "psn") { 
                    pokemon.status = "";
                    pokemon.lastConsumedItem = item as ItemName; 
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Rawst Berry":
                if (pokemon.status === "brn") { 
                    pokemon.status = "";
                    pokemon.lastConsumedItem = item as ItemName; 
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Aspear Berry":
                if (pokemon.status === "frz") { 
                    pokemon.status = "";
                    pokemon.lastConsumedItem = item as ItemName; 
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Lum Berry":
                if (pokemon.status !== "") { 
                    pokemon.status = "";
                    pokemon.lastConsumedItem = item as ItemName; 
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                if (pokemon.volatileStatus.includes("confusion")) { 
                    pokemon.volatileStatus = pokemon.volatileStatus.filter(status => status !== "confusion"); 
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Persim Berry": 
                if (pokemon.volatileStatus.includes("confusion")) { 
                    pokemon.volatileStatus = pokemon.volatileStatus.filter(status => status !== "confusion"); 
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            // Stat-Boosting Berries
            case "Liechi Berry":
                const atkDiff = this.applyStatChange(id, {atk: (pokemon.hasAbility("Ripen") ? 2 : 1)});
                if (atkDiff.atk){
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Kee Berry":
            case "Ganlon Berry":
                const defDiff = this.applyStatChange(id, {def: (pokemon.hasAbility("Ripen") ? 2 : 1)});
                if (defDiff.def){
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Petaya Berry":
                const spaDiff = this.applyStatChange(id, {spa: (pokemon.hasAbility("Ripen") ? 2 : 1)});
                if (spaDiff.spa){
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Maranga Berry":
            case "Apicot Berry":
                const spdDiff = this.applyStatChange(id, {spd: (pokemon.hasAbility("Ripen") ? 2 : 1)});
                if (spdDiff.spd){
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Salac Berry":
                const speDiff = this.applyStatChange(id, {spe: (pokemon.hasAbility("Ripen") ? 2 : 1)});
                if (speDiff.spe){
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Starf Berry":
                pokemon.randomBoosts += pokemon.boostCoefficient * (pokemon.hasAbility("Ripen") ? 4 : 2);
                pokemon.lastConsumedItem = item as ItemName;
                if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                break;
            case "Lansat Berry":
                if (!pokemon.isPumped) {
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                pokemon.isPumped = 2;
                break;
            case "Micle Berry":
                if (!pokemon.isMicle) {
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                pokemon.isMicle = true;
                break;
            // Healing Berries (TO DO, other healing berries that confuse depending on nature)
            case "Enigma Berry":
            case "Sitrus Berry":
                let maxhp = pokemon.maxHP();
                if (pokemon.originalCurHP < maxhp) {
                    pokemon.applyDamage(-Math.floor(maxhp / (pokemon.hasAbility("Ripen") ? 2 : 4)), undefined, true);
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Oran Berry":
                if (pokemon.originalCurHP < pokemon.maxHP()) {
                    pokemon.applyDamage(-Math.min(pokemon.maxHP() - pokemon.originalCurHP, pokemon.hasAbility("Ripen") ? 20 : 10), undefined, true);
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                }
                break;
            case "Aguav Berry":
            case "Figy Berry":
            case "Iapapa Berry":
            case "Mago Berry":
            case "Wiki Berry":
                maxhp = pokemon.maxHP();
                if (pokemon.originalCurHP < maxhp) {
                    pokemon.applyDamage(-Math.floor(pokemon.maxHP() * (pokemon.hasAbility("Ripen") ? 2 : 1) / 3), undefined, true);
                    pokemon.lastConsumedItem = item as ItemName;
                    if (pokemon.hasAbility("Cud Chew")) { pokemon.isCudChew = 2; }
                    const nature = gen.natures.get(toID(pokemon.nature));
                    if ((item === "Aguav Berry"  && (nature!.plus !== "spd" && nature!.minus === "spd")) ||
                        (item === "Figy Berry"   && (nature!.plus !== "atk" && nature!.minus === "atk")) ||
                        (item === "Iapapa Berry" && (nature!.plus !== "def" && nature!.minus === "def")) ||
                        (item === "Mago Berry"   && (nature!.plus !== "spe" && nature!.minus === "spe")) ||
                        (item === "Wiki Berry"   && (nature!.plus !== "spa" && nature!.minus === "spa"))
                    ) {
                        this.applyVolatileStatus(id, "confusion", false, id);
                    }
                }
                break;
            // Terrain Seeds
            case "Electric Seed": 
            case "Grassy Seed":
                const gsdiff = this.applyStatChange(id, {def: 1}, true, id);
                if (gsdiff.def){
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            case "Psychic Seed":
            case "Misty Seed":
                const msdiff = this.applyStatChange(id, {spd: 1}, true, id);
                if (msdiff.spd){
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            // Other boosting items
            case "Weakness Policy":
                const wpdiff = this.applyStatChange(id, {atk: 2, spa: 2}, true, id);
                if (wpdiff.atk || wpdiff.spa){
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            case "Absorb Bulb":
            case "Throat Spray":
                const tsdiff = this.applyStatChange(id, {spa: 1}, true, id);
                if (tsdiff.spa){
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            case "Luminous Moss":
                const lmdiff = this.applyStatChange(id, {spd: 1}, true, id);
                if (lmdiff.spd){
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            case "Cell Battery":
            case "Snowball":
                const sbdiff = this.applyStatChange(id, {atk: 1}, true, id);
                if (sbdiff.atk){
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            // Other
            case "Mental Herb":
                const vslen = pokemon.volatileStatus.length;
                pokemon.volatileStatus = [...pokemon.volatileStatus].filter(status => !["infatuation", "taunt", "encore", "disable", "torment", "heal-block"].includes(status));
                if (pokemon.volatileStatus.length < vslen) {
                    pokemon.lastConsumedItem = item as ItemName;
                }
                break;
            default: 
                pokemon.lastConsumedItem = item as ItemName;
                break;
        }
        if (lost) { this.loseItem(id, true, blockSymbiosis); }
    }

    public applyStatChange(id: number, boosts: Partial<StatsTable>, copyable: boolean = true, sourceID: number = id, ignoreAbility: boolean = false, fromMirrorArmor = false, blockWhiteHerb = false): StatsTable {
        const pokemon = this.getPokemon(id);
        const fromSelf = id === sourceID;
        const fromEnemy = (id === 0) ? (sourceID !== 0) : (sourceID === 0)
        const boostCoef = pokemon.boostCoefficient;
        // Mirror Armor
        if (!fromSelf && !fromMirrorArmor && !ignoreAbility && pokemon.hasAbility("Mirror Armor")) {
            for (const stat in boosts) {
                const mirroredBoosts: Partial<StatsTable> = {};
                const statId = stat as StatIDExceptHP;
                if ((boosts[statId] || 0) < 0) {
                    mirroredBoosts[statId] = boosts[statId]!;
                    boosts[statId] = 0;
                }
                this.applyStatChange(sourceID, mirroredBoosts, false, id, false, true);
            }
        }
        // Clear Amulet, Clear Body, White Smoke, Full Metal Body
        if (!fromSelf && (pokemon.item === "Clear Amulet" || (!ignoreAbility && pokemon.hasAbility("Clear Body", "White Smoke", "Full Metal Body")))) {
            for (const stat in boosts) {
                const statId = stat as StatIDExceptHP;
                if (((boosts[statId] || 0) * boostCoef) < 0) {
                    boosts[statId] = 0;
                }
            }
        }
        if (!fromSelf && !ignoreAbility) {
            if (pokemon.hasAbility("Keen Eye", "Illuminate")) {
                boosts["acc"] = Math.max(0, boosts["acc"] || 0);
            }
            else if (pokemon.hasAbility("Hyper Cutter")) {
                boosts["atk"] = Math.max(0, boosts["atk"] || 0);
            }
            else if (pokemon.hasAbility("Big Pecks")) {
                boosts["def"] = Math.max(0, boosts["def"] || 0);
            }
            if (pokemon.field.attackerSide.isFlowerVeil && pokemon.hasType("Grass")) {
                for (const stat in boosts) {
                    const statId = stat as StatIDExceptHP;
                    if (((boosts[statId] || 0) * boostCoef) < 0) {
                        boosts[statId] = 0;
                    }
                }
            }
        }
        // Apply stat changes
        const diff = pokemon.applyStatChange(boosts, ignoreAbility);
        // Defiant and Competitive
        if (!fromSelf && fromEnemy && !ignoreAbility && (pokemon.hasAbility("Defiant", "Competitive"))) {
            const numNegativeBoosts = Object.values(diff).reduce((p, c) => p + (c < 0 ? 1 : 0), 0);
            if (numNegativeBoosts > 0) {
                const boost = pokemon.hasAbility("Defiant") ? {atk: 2 * numNegativeBoosts} : {spa: 2 * numNegativeBoosts};
                this.applyStatChange(id, boost, true, id);
            }
        }
        // Mirror Herb and Opportunist
        if (copyable) { // Stat changes that are being copied shouldn't be copied in turn
            const opponentIds = id === 0 ? [1,2,3,4] : [0];
            for (const opponentId of opponentIds) {
                const opponent = this.getPokemon(opponentId);
                const mirrorHerb = opponent.item === "Mirror Herb";
                const opportunist = opponent.hasAbility("Opportunist");
                if (mirrorHerb || opportunist)  {
                    const both = mirrorHerb && opportunist;
                    const positiveDiff = {...diff};
                    let hasPositiveBoost = false;
                    for (const stat in positiveDiff) {
                        const statId = stat as StatIDExceptHP;
                        if (both) {
                            positiveDiff[statId] *= 2;
                        }
                        if ((positiveDiff[statId] || 0) <= 0) {
                            positiveDiff[statId] = 0;
                        } else {
                            hasPositiveBoost = true;
                        }
                    }
                    if (hasPositiveBoost) {
                        const changes = this.applyStatChange(opponentId, positiveDiff, false, id);
                        if (Object.values(changes).some(val => val > 0) && opponent.item === "Mirror Herb") { 
                            this.consumeItem(opponentId, opponent.item); 
                        }
                    }
                }
            }
        }
        // White Herb
        if (!blockWhiteHerb && pokemon.item === "White Herb" && Object.values(pokemon.boosts).some(val => val < 0)) {
            const preWhiteHerbBoosts = {...pokemon.boosts};
            this.consumeItem(id, pokemon.item, true, false);
            for (let stat in diff) {
                const statId = stat as StatIDExceptHP;
                diff[statId] = (diff[statId] || 0) + (pokemon.boosts[statId] || 0) - (preWhiteHerbBoosts[statId] || 0);
            }
        }
 
        return diff;
    }

    public applyStatus(id: number, status: StatusName, source: number, isSecondaryEffect: boolean = false, fromHeldItem: boolean | undefined = false, roll: "max" | "min" | "avg" | undefined = "avg") {
        const pokemon = this.getPokemon(id);
        const field = pokemon.field;
        const sourcePoke = this.getPokemon(source);
        const sourceAbility = sourcePoke.abilityNullified ? undefined : sourcePoke.ability;
        const attackerIgnoresAbility = (!this.getPokemon(source).abilityNullified && !this.getPokemon(source).abilityNullified && ["Mold Breaker", "Teravolt", "Turboblaze"].includes(sourceAbility || "") && !pokemon.hasItem("Ability Shield")) || (sourcePoke.hasAbility("Mycelium Might") && !isSecondaryEffect);
        const selfInflicted = id === source;

        if (hasNoStatus(pokemon)) {
            let success = true;
            // Secondary effect blockers
            if (!selfInflicted && isSecondaryEffect && (pokemon.item === "Covert Cloak" || pokemon.hasAbility("Shield Dust"))) { success = false; }
            // Purifying Salt blocks all non-volatile statuses
            if (pokemon.hasAbility("Purifying Salt")) { success = false; }
            // field-based immunities
            if (selfInflicted) {
                if (fromHeldItem && (field.hasTerrain("Misty") && pokemonIsGrounded(pokemon, field))) { success = false; }
            } else {
                if ((field.attackerSide.isSafeguard && sourceAbility !== "Infiltrator") || (field.hasTerrain("Misty") && pokemonIsGrounded(pokemon, field)) || field.attackerSide.isProtected) { success = false; }
            }
            if (status === "slp" && (field.hasTerrain("Electric") && pokemonIsGrounded(pokemon, field))) { success = false; }
            // type-based and ability-based immunities
            if (status === "brn" && (pokemon.hasType("Fire") || pokemon.hasAbility("Water Veil") || pokemon.hasAbility("Thermal Exchange") || pokemon.hasAbility("Water Bubble"))) { success = false; }
            if (status === "frz" && (pokemon.field.hasWeather("Sun") || pokemon.hasType("Ice") || (!attackerIgnoresAbility && pokemon.hasAbility("Magma Armor")))) { success = false; }
            if ((status === "psn" || status === "tox") && ((!attackerIgnoresAbility && pokemon.hasAbility("Immunity")) || (sourceAbility !== "Corrosion" && pokemon.hasType("Poison", "Steel")))) { success = false; }
            if ((status === "par" && (pokemon.hasType("Electric") || (!attackerIgnoresAbility && pokemon.hasAbility("Limber"))))) { success = false; }
            if (status === "slp" && !attackerIgnoresAbility && (
                ["Insomnia", "Vital Spirit"].includes(pokemon.ability as string) || 
                (id === 0 ? [0] : [1,2,3,4]).map(i => this.getPokemon(i)).some(poke => poke.hasAbility("Sweet Veil"))
            )) { success = false; }
            if (pokemon.field.hasWeather("Sun") && !attackerIgnoresAbility && pokemon.hasAbility("Leaf Guard")) { success = false; }
            
            if (success) {
                pokemon.status = status;
                if (status === "slp") { // lasts 1-3 turns
                    pokemon.isSleep = roll === "max" ? 3 : roll === "min" ? 1 : 2;
                } else if (status === "frz") { // lasts indefinitely, average of 3 turns
                    pokemon.isFrozen = roll === "max" ? 10 : roll === "min" ? 1 : 3;
                }
            }
        }

        // Status curing berries
        if ( (pokemon.item === "Cheri Berry" && pokemon.status === "par") || 
             (pokemon.item === "Chesto Berry" && pokemon.status === "slp") ||
             (pokemon.item === "Pecha Berry" && pokemon.status === "psn") ||
             (pokemon.item === "Rawst Berry" && pokemon.status === "brn") ||
             (pokemon.item === "Aspear Berry" && pokemon.status === "frz") ||
             (pokemon.item === "Lum Berry" && pokemon.status !== "") ) { 
            this.consumeItem(id, pokemon.item, true);
        }
    }

    public applyVolatileStatus(id: number, ailment: string, isSecondaryEffect: boolean = false, source: number, firstMove?: boolean) {
        const pokemon = this.getPokemon(id);
        const field = pokemon.field;
        const sourcePoke = this.getPokemon(source);
        const sourceAbility = sourcePoke.abilityNullified ? undefined : sourcePoke.ability;
        const attackerIgnoresAbility = (["Mold Breaker", "Teravolt", "Turboblaze"].includes(sourceAbility || "") && !pokemon.hasItem("Ability Shield")) || (sourcePoke.hasAbility("Mycelium Might") && !isSecondaryEffect);
        const selfInflicted = id === source;

        if (!pokemon.volatileStatus.includes(ailment)) {
            let success = true;
            // Any non-volatile status, Electric Terrain, and Safeguard block Yawn
            if (ailment === "yawn" && ((pokemon.status !== "") || field.hasTerrain("Electric") || field.attackerSide.isSafeguard)) { success = false; }
            // Safeguard and Misty Terrain block confusion
            if (ailment === "confusion" && ((field.attackerSide.isSafeguard && sourceAbility !== "Infiltrator") || (field.hasTerrain("Misty") && pokemonIsGrounded(pokemon, field)))) { success = false; }
            // Covert Cloak
            if (ailment === "confusion" && !selfInflicted && isSecondaryEffect && (pokemon.item === "Covert Cloak" || pokemon.ability === "Shield Dust")) { success = false; }
            // Aroma Veil
            if (field.attackerSide.isAromaVeil && ["confusion", "taunt", "encore", "disable", "infatuation", "yawn"].includes(ailment)) {
                success = false;
            // Own Tempo
            } else if (!attackerIgnoresAbility && pokemon.hasAbility("Own Tempo") && ailment === "confusion") {
                success = false;
            // Oblivious
            } else if (!attackerIgnoresAbility && pokemon.hasAbility("Oblivious") && (ailment === "taunt" || ailment === "infatuation")) {
                success = false;
            // yawn immunity
            } else if (ailment === "yawn" && !attackerIgnoresAbility && (pokemon.hasAbility("Vital Spirit", "Insomnia") || (pokemon.hasAbility("Leaf Guard") && pokemon.field.hasWeather("Sun")))) {
                success = false;
            } 

            if (success) {
                pokemon.volatileStatus.push!(ailment);
                if (ailment === "taunt") {
                    pokemon.isTaunt = 3; // (firstMove ? 3 : 4);
                } else if (ailment === "encore") {
                    pokemon.isEncore = 3;
                } else if (ailment === "torment") {
                    pokemon.isTorment = true;
                } else if (ailment === "disable" && pokemon.lastMove) {
                    pokemon.isDisable = 4;
                    pokemon.disabledMove = pokemon.lastMove!.name;
                } else if (ailment === "yawn") {
                    pokemon.isYawn = 2;
                } else if (ailment === "ingrain") {
                    pokemon.isIngrain = true;
                }
            }
        }

        // Volatile Status curing berries + Mental Herb
        if ( (pokemon.hasItem("Persim Berry", "Lum Berry") && pokemon.volatileStatus.includes("confusion")) || 
             (pokemon.hasItem("Mental Herb") && ["infatuation", "taunt", "encore", "disable", "torment", "heal-block"].includes(ailment)) ) {
            this.consumeItem(id, pokemon.item!, true);
        } 
    }

    public loseItem(id: number, consumed: boolean = false, blockSymbiosis: boolean = false) {
        const pokemon = this.getPokemon(id);
        if (!consumed) {
            pokemon.cumDamageRolls.removeSequentialCondition(pokemon.item);
        }
        pokemon.loseItem();
        // Symbiosis
        if (id > 0 && !blockSymbiosis) {
            const symbiosisIds: number[] = []
            for (let sid=1; sid<5; sid++) {
                if (sid !== id && this.getPokemon(sid).hasAbility("Symbiosis") && this.getPokemon(sid).item !== undefined) {
                    symbiosisIds.push(sid);
                }
            }
            if (symbiosisIds.length > 0) {
                // speed check for symbiosis
                let fastestSymbId = symbiosisIds[0];
                let fastestSymbPoke = this.getPokemon(fastestSymbId);
                let fastestSymbSpeed = fastestSymbPoke.effectiveSpeed;
                for (let i=1; i<symbiosisIds.length; i++) {
                    const poke = this.getPokemon(symbiosisIds[i]);
                    const speed = getModifiedStat(poke.stats.spe, poke.boosts.spe, gen);
                    // Apparently, Trick Room isn't considered for this check
                    // const field = poke.field;
                    // if ( (!field.isTrickRoom && speed > fastestSymbSpeed) || (field.isTrickRoom && speed < fastestSymbSpeed) ) {
                    if ( speed > fastestSymbSpeed ) {
                        fastestSymbId = symbiosisIds[i];
                        fastestSymbPoke = poke;
                        fastestSymbSpeed = speed;
                    } 
                }
                // symbiosis item transfer
                const passedItem = fastestSymbPoke.item!;
                fastestSymbPoke.item = undefined; // don't call loseItem because it will trigger symbiosis again
                fastestSymbPoke.isChoiceLocked = false;
                fastestSymbPoke.cumDamageRolls.removeSequentialCondition(passedItem);
                // NOTE: it is important to clear the item from the Symbiosis passer FIRST to avoid an infinite loop in case the item is immediately consumed after passing
                this.receiveItem(id, passedItem);
            }
        }
    }

    public receiveItem(id: number, item: ItemName | undefined) {
        const pokemon = this.getPokemon(id);
        pokemon.item = item;
        pokemon.cumDamageRolls.addSequentialCondition(item);
        /// Items that activate upon reciept or switch in
        // Booster Energy
        if (pokemon.item === "Booster Energy" && pokemon.hasAbility("Protosynthesis", "Quark Drive") && !pokemon.abilityOn) {
            pokemon.abilityOn = true;
            const statId = getQPBoostedStat(pokemon, !!pokemon.field.isWonderRoom, gen) as StatIDExceptHP;
            pokemon.boostedStat = statId;
            pokemon.usedBoosterEnergy = true;
            this.loseItem(id)
        }
        // Terrain Seeds
        if (item && item.includes("Seed")) {
            this.applyTerrain(pokemon.field.terrain, pokemon.field.terrainTurnsRemaining, [id]);
        }
        // Berries consumed immediately upon reciept (via Symbiosis, Trick, etc) if their conditions are met
        this.applyDamage(id, 0);
    }

    public applyTerrain(terrain: Terrain | "Teraform Zero" | undefined, turns: number = 5, ids: number[] = [0,1,2,3,4]) {
        const setTeraformZero = terrain === "Teraform Zero";
        for (let id of ids) {
            const pokemon = this.getPokemon(id);
            if (setTeraformZero) {
                pokemon.field.isTeraformZero = true;
            } else if (!!terrain) {
                pokemon.field.terrain = terrain;
                pokemon.field.terrainTurnsRemaining = turns;
            }
            // Quark Drive
            if (pokemon.hasAbility("Quark Drive") && !pokemon.usedBoosterEnergy) {
                if (pokemon.field.hasTerrain("Electric") && !pokemon.abilityOn) {
                    pokemon.abilityOn = true;
                    const statId = getQPBoostedStat(pokemon, !!pokemon.field.isWonderRoom, gen) as StatIDExceptHP;
                    pokemon.boostedStat = statId;
                } else if (!pokemon.field.hasTerrain("Electric") && pokemon.abilityOn) {
                    pokemon.abilityOn = false;
                    pokemon.boostedStat = undefined;
                    if (pokemon.item === "Booster Energy") { this.receiveItem(id, "Booster Energy" as ItemName); }
                }
            }
            // Terrain Seeds
            if ( (pokemon.item === "Electric Seed" && pokemon.field.hasTerrain("Electric")) ||
                 (pokemon.item === "Grassy Seed" && pokemon.field.hasTerrain("Grassy")) ||
                 (pokemon.item === "Psychic Seed" && pokemon.field.hasTerrain("Psychic")) ||
                 (pokemon.item === "Misty Seed" && pokemon.field.hasTerrain("Misty")) ) {
                this.consumeItem(id, pokemon.item, true);
            }
        }
    }

    public applyWeather(weather: Weather | "Cloud Nine" | undefined, turns = 5, ids: number[] = [0,1,2,3,4]) {
        const setCloudNine = weather === "Cloud Nine";
        for (let id of ids) {
            const pokemon = this.getPokemon(id);
            if (setCloudNine) {
                pokemon.field.isCloudNine = true;
            } else if (!!weather) {
                pokemon.field.weather = weather;
                pokemon.field.weatherTurnsRemaining = turns;
            }
            // Protosynthesis
            if (pokemon.hasAbility("Protosynthesis") && !pokemon.usedBoosterEnergy) {
                if (pokemon.field.hasWeather("Sun") && !pokemon.abilityOn) {
                    pokemon.abilityOn = true;
                    const statId = getQPBoostedStat(pokemon, !!pokemon.field.isWonderRoom, gen) as StatIDExceptHP;
                    pokemon.boostedStat = statId;
                } else if (!pokemon.field.hasWeather("Sun") && pokemon.abilityOn) {
                    pokemon.abilityOn = false;
                    pokemon.boostedStat = undefined;
                    if (pokemon.item === "Booster Energy") { this.receiveItem(id, "Booster Energy" as ItemName); }
                } 
            }
            // Ice Face
            if ((weather === "Snow" || weather === "Hail") && pokemon.hasAbility("Ice Face") && pokemon.name.includes("Eiscue") && pokemon.abilityOn) {
                pokemon.changeForm("Eiscue" as SpeciesName);
                pokemon.abilityOn = false;
            }
            
        }
    }

    public activateTera(id: number): boolean {
        const pokemon = this.getPokemon(id);
        const terastalized = pokemon.activateTera();
        if (terastalized) {
            if (pokemon.name.includes("Terapagos")) {
                this.changeAbility(id, "Teraform Zero" as AbilityName);
            }
            if (pokemon.name.includes("Ogerpon")) {
                this.addAbilityFieldEffect(id, pokemon.ability);
            }
        }
        return terastalized
    }

    public changeAbility(id: number, ability: AbilityName | "(No Ability)", isSkillSwap: boolean = false) {
        const pokemon = this.getPokemon(id);
        if (pokemon.hasItem("Ability Shield")) { return; }
        if (!isSkillSwap && persistentAbilities["CantSuppress"].includes(pokemon.ability || "")) { return; }
        const oldAbility = pokemon.ability;
        pokemon.ability = ability as AbilityName;
        pokemon.abilityOn = false;
        // lost field effects
        if (!pokemon.abilityNullified) {
            this.removeAbilityFieldEffect(id, oldAbility);
        }
        pokemon.abilityNullified = undefined;
        // gained field effects
        this.addAbilityFieldEffect(id, ability);
    }

    public nullifyAbility(id: number)  {
        const pokemon = this.getPokemon(id);
        if (pokemon.hasItem("Ability Shield")) { return; }
        const oldAbility = pokemon.ability;
        // pokemon.ability = undefined;
        pokemon.abilityOn = false;
        // lost field effects
        this.removeAbilityFieldEffect(id, oldAbility);
    }

    public addAbilityFieldEffect(id: number, ability: AbilityName | "(No Ability)" | undefined, restore: boolean = false): string[][] {
        const pokemon = this.getPokemon(id);
        const flags: string[][] = [[],[],[],[],[]];
        if (pokemon.abilityNullified) { return flags; }
        /// Imposter
        if (ability === "Imposter") {
            const target = id === 0 ? this.raiders[1] : this.raiders[0];
            this.transform(id, target.id);
            flags[id].push("Imposter transforms " + pokemon.name + " into " + target.name);
        }
        /// Tera Shift
        if (ability === "Tera Shift" && pokemon.species.name === "Terapagos") {
            pokemon.changeForm("Terapagos-Terastal" as SpeciesName);
            pokemon.originalCurHP = pokemon.maxHP(); // this should only happen at the beginning of a battle
            flags[id].push("Tera Shift transforms Terapagos into Terapagos-Terastal");
        }
        /// Trace (handled separately so the traced ability can activate if applicable)
        if (ability === "Trace") {
            const opponentIds = id === 0 ? [1,2,3,4] : [0];
            for (let oid of opponentIds) { // Trace might be random for bosses, but we'll check abilities in order
                const copiedAbility = this.raiders[oid].ability;
                if (copiedAbility && !this.raiders[oid].abilityNullified && !persistentAbilities["NoTrace"].includes(copiedAbility)) {
                    pokemon.ability = copiedAbility;
                    ability = copiedAbility;
                    flags[id].push("Trace copies " + copiedAbility);
                    break;
                }
            } 
        }

        // add relevant effects to the damage rolls
        pokemon.cumDamageRolls.addPersistentCondition(ability);

        //// Abilities only activated upon switch-in or skill change
        if (!restore) {
            switch (ability) {
            /// Weather Abilities
            case "Drought":
                if (this.fields[0].weather !== "Sun") {
                    this.applyWeather("Sun", pokemon.item === "Heat Rock" ? 8 : 5);
                    flags[id].push("Drought summons the Sun");
                }
                break;
            case "Drizzle":
                if (this.fields[0].weather !== "Rain") {
                    this.applyWeather("Rain", pokemon.item === "Damp Rock" ? 8 : 5);
                    flags[id].push("Drizzle summons the Rain");
                }
                break;
            case "Sand Stream":
                if (this.fields[0].weather !== "Sand") {
                    this.applyWeather("Sand", pokemon.item === "Smooth Rock" ? 8 : 5);
                    flags[id].push("Sand Stream summons a Sandstorm");
                }
                break;
            case "Snow Warning":
                if (this.fields[0].weather !== "Snow") {
                    this.applyWeather("Snow", pokemon.item === "Icy Rock" ? 8 : 5);
                    flags[id].push("Snow Warning summons a Snowstorm");
                }
                break;
            case "Orichalcum Pulse":
                if (this.fields[0].weather !== "Sun") {
                    this.applyWeather("Sun", pokemon.item === "Heat Rock" ? 8 : 5);
                    flags[id].push("Orichalcum Pulse summons the Sun");
                }
                break;
            /// Terrain Abilities
            case "Grassy Surge":
                if (this.fields[0].terrain !== "Grassy") {
                    this.applyTerrain("Grassy", pokemon.item === "Terrain Extender" ? 8 : 5);
                    flags[id].push("Grassy Surge summons Grassy Terrain");
                }
                break;
            case "Electric Surge":
                if (this.fields[0].terrain !== "Electric") {
                    this.applyTerrain("Electric", pokemon.item === "Terrain Extender" ? 8 : 5);
                    flags[id].push("Electric Surge summons Electric Terrain");
                }
                break;
            case "Misty Surge":
                if (this.fields[0].terrain !== "Misty") {
                    this.applyTerrain("Misty", pokemon.item === "Terrain Extender" ? 8 : 5);
                    flags[id].push("Misty Surge summons Misty Terrain");
                }
                break;
            case "Psychic Surge":
                if (this.fields[0].terrain !== "Psychic") {
                    this.applyTerrain("Psychic", pokemon.item === "Terrain Extender" ? 8 : 5);
                    flags[id].push("Psychic Surge summons Psychic Terrain");
                }
                break;
            case "Hadron Engine":
                if (this.fields[0].terrain !== "Electric") {
                    this.applyTerrain("Electric", pokemon.item === "Terrain Extender" ? 8 : 5);
                    flags[id].push("Hadron Engine summons Electric Terrain");
                }
                break;
            /// Ruin Abilities (should be uncopyable / unsupressable)
            case "Sword of Ruin":
                for (let field of this.fields) {
                    field.isSwordOfRuin = true;
                }
                flags[id].push("Sword of Ruin lowers Defenses");
                break;
            case "Beads of Ruin":
                for (let field of this.fields) {
                    field.isBeadsOfRuin = true;
                }
                flags[id].push("Beads of Ruin lowers Special Defenses");
                break;
            case "Vessel of Ruin":
                for (let field of this.fields) {
                    field.isVesselOfRuin = true;
                }
                flags[id].push("Vessel of Ruin lowers Special Attacks");
                break;
            case "Tablets of Ruin":
                for (let field of this.fields) {
                    field.isTabletsOfRuin = true;
                }
                flags[id].push("Tablets of Ruin lowers Attacks");
                break;
            /// others
            case "Supersweet Syrup":
                const affectedSSPokemon = id === 0 ? this.raiders.slice(1) : [this.raiders[0]];
                for (let opponent of affectedSSPokemon) {
                    const origEva = opponent.boosts.eva || 0;
                    this.applyStatChange(opponent.id, {eva: -1}, true, id);
                    flags[opponent.id].push("Eva: " + origEva + " → " + opponent.boosts.eva + " (Supersweet Syrup)");
                }
                break;
            case "Hospitality":
                if (id !== 0) {
                    const allies = this.raiders.slice(1).splice(id-1, 1);
                    for (let ally of allies) {
                        const healing = Math.floor(ally.maxHP() / 4);
                        this.applyDamage(ally.id, -healing)
                    }
                }
                break;
            case "Download":
                const target = id === 0 ? this.raiders[1] : this.raiders[0];
                let def = target.stats.def;
                let spd = target.stats.spd;
                def = getModifiedStat(def, target.boosts.def, target.gen);
                spd = getModifiedStat(spd, target.boosts.spd, target.gen);
                if (spd <= def && !this.fields[0].isWonderRoom) {
                    const origSpa = pokemon.boosts.spa;
                    this.applyStatChange(id, {spa: 1}, true, id);
                    flags[id].push("SpA: " + origSpa + " → " + (pokemon.boosts.spa > 0 ? "+" : "") + pokemon.boosts.spa + " (Download)");
                } else {
                    const origAtk = pokemon.boosts.atk;
                    this.applyStatChange(id, {atk: 1}, true, id);
                    flags[id].push("Atk: " + origAtk + " → " + (pokemon.boosts.atk > 0 ? "+" : "") + pokemon.boosts.atk + " (Download)");
                }
                break;
            case "Intrepid Sword":
                const origAtk = pokemon.boosts.atk;
                this.applyStatChange(id, {atk: 1}, true, id);
                flags[id].push("Atk: " + origAtk + " → " + pokemon.boosts.atk + " (Intrepid Sword)");
                break;
            case "Dauntless Shield":
                const origDef = pokemon.boosts.def;
                this.applyStatChange(id, {def: 1}, true, id);
                flags[id].push("Def: " + origDef + " → " + pokemon.boosts.def + " (Dauntless Shield)");
                break;
            case "Embody Aspect (Teal)":
                this.applyStatChange(id, {spe: 1}, true, id);
                break;
            case "Embody Aspect (Wellspring)":
                this.applyStatChange(id, {spd: 1}, true, id);
                break;
            case "Embody Aspect (Hearthflame)":
                this.applyStatChange(id, {atk: 1}, true, id);
                break;           
            case "Embody Aspect (Cornerstone)":
                this.applyStatChange(id, {def: 1}, true, id);
                break;     
            case "Protosynthesis": 
            case "Quark Drive":
                if (pokemon.item === "Booster Energy" && !pokemon.abilityOn) {
                    this.receiveItem(id, "Booster Energy" as ItemName); // consume Booster Energy
                }
                break;
            case "Slow Start":
                pokemon.slowStartCounter = 5;
                pokemon.abilityOn = true;
                break;
            case "Intimidate":
                const affectedPokemon = id === 0 ? this.raiders.slice(1) : [this.raiders[0]];
                for (let opponent of affectedPokemon) {
                    if (opponent.hasAbility("Guard Dog")) {
                        const origAtk = opponent.boosts.atk ||  0;
                        this.applyStatChange(opponent.id, {atk: 1}, true, id);
                        flags[opponent.id].push("Atk: " + origAtk + " → " + opponent.boosts.atk + " (Guard Dog)");
                    } else if (opponent.abilityNullified || !["Oblivious", "Own Tempo", "Inner Focus", "Scrappy"].includes(opponent.ability || "")) {
                        const origAtk = opponent.boosts.atk ||  0;
                        const origSourceAtk = pokemon.boosts.atk || 0;
                        this.applyStatChange(opponent.id, {atk: -1}, true, id);
                        if (opponent.hasAbility("Mirror Armor")) {
                            flags[id].push("Atk: " + origSourceAtk + " → " + pokemon.boosts.atk + " (Mirror Armor)");
                        } else {
                            flags[opponent.id].push("Atk: " + origAtk + " → " + opponent.boosts.atk + " (Intimidate)");
                        }
                    }
                    if (opponent.hasAbility("Rattled")) {
                        const origSpe = opponent.boosts.spe || 0;
                        this.applyStatChange(opponent.id, {spe: 1}, true, opponent.id);
                        flags[opponent.id][flags[opponent.id].length-1] += ", Spe: " + origSpe + " → " + opponent.boosts.spe + " (Rattled)";
                    }
                }
            }
        }
        /// Other Field-Related Abilities
        switch (ability) {
            case "Neutralizing Gas":
                for (let i = 0; i < 5; i++) {
                    if (i !== id ) {
                        const target = this.raiders[i];
                        const targetAbility = this.raiders[i].ability;
                        if (
                            target.hasItem("Ability Shield") ||
                            (targetAbility === "Neutralizing Gas")
                        ) { 
                            continue; 
                        }
                        this.removeAbilityFieldEffect(i, target.ability)
                        target.abilityNullified = -1;
                        flags[i].push("Ability suppressed by Neutralizing Gas");
                    }
                }
                break;
                        case "Cloud Nine":
            case "Air Lock": 
                this.applyWeather("Cloud Nine");
                flags[id].push(ability + " negates the weather");
                break;
            case "Teraform Zero":
                this.applyWeather("Cloud Nine");
                this.applyTerrain("Teraform Zero");
                flags[id].push("Teraform Zero negates the weather and terrain");
                break;
            case "Steely Spirit":
                if (id !== 0) {
                    for (let [index, field] of this.fields.entries()) {
                        if (index !== 0 && index !== id) {
                            field.attackerSide.steelySpirits += 1;
                        }
                    }
                }
                flags[id].push("Steely Spirit boosts Allies' Steel-type attacks");
                break;
            case "Aroma Veil":
                if (id === 0) {
                    this.fields[0].attackerSide.isAromaVeil = true;
                } else {
                    for (let field of this.fields.slice(1)) {
                        field.attackerSide.isAromaVeil = true;
                    }
                }
                flags[id].push("Aroma Veil protects allies");
                break;
            case "Power Spot":
                if (id !== 0) {
                    for (let [index,field] of this.fields.entries()) {
                        if (index !== 0 && index !== id) {
                            field.attackerSide.powerSpots += 1;
                        }
                    }
                }
                flags[id].push("Power Spot boosts attack power");
                break;
            case "Battery":
                if (id !==0 ) {
                    for (let [index,field] of this.fields.entries()) {
                        if (index !== 0 && index !== id) {
                            field.attackerSide.batteries += 1;
                        }
                    }
                }
                flags[id].push("Battery boosts special attack power");
                break;
            case "Friend Guard":
                if (id !== 0) {
                    for (let fid=1; fid<5; fid++) {
                        if (id !== fid) {
                            this.fields[fid].attackerSide.friendGuards += 1;
                        }
                    }
                }
                flags[id].push("Friend Guard reduces allies' damage taken");
                break;
            case "Flower Veil":
                if (id !== 0) {
                    for (let fid=1; fid<5; fid++) {
                        this.fields[fid].attackerSide.isFlowerVeil = true;
                    }
                } else {
                    this.fields[0].attackerSide.isFlowerVeil = true;
                }
                break;
            case "Dazzling":
            case "Queenly Majesty":
            case "Armor Tail":
                if (id !== 0) {
                    for (let fid=1; fid<5; fid++) {
                        this.fields[fid].attackerSide.isDazzling = true;
                    }
                } else {
                    this.fields[0].attackerSide.isDazzling = true;
                }
                break;
            case "Plus":
            case "Minus":
                const allyIDs = id !== 0 ? [1,2,3,4].filter(i => i !== id) : [];
                for (id of allyIDs) {
                    const ally = this.getPokemon(id);
                    if (ally.originalCurHP > 0 && ally.ability === "Minus" || ally.ability === "Plus") {
                        pokemon.abilityOn = true;
                        ally.abilityOn = true;
                        flags[id].push(ability + " activated");
                    }
                }
                break;
            default: break;
        }
        return flags;
    }

    public removeAbilityFieldEffect(id: number, ability: AbilityName | "(No Ability)" | undefined) {
        const poke = this.getPokemon(id);
        if (ability === undefined || ability === "(No Ability)" || poke.abilityNullified) { return; }
        // remove relevant effects from the damage rolls
        poke.cumDamageRolls.removePersistentCondition(ability);
        switch (ability) {
            // on/off field-based abilties
            case "Neutralizing Gas":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Neutralizing Gas" as AbilityName)
                ) {
                    for (let i = 0; i < 5; i++) {
                        if (i !== id ) {
                            const target = this.raiders[i];
                            if ((target.abilityNullified || 0) < 0 && target.originalAbility !== "(No Ability)") {
                                target.abilityNullified = undefined;
                                this.addAbilityFieldEffect(i, target.ability, true);
                            }
                        }
                    }
                }
                break;
            case "Cloud Nine":
            case "Air Lock":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .some(r => ["Cloud Nine", "Air Lock", "Teraform Zero"].includes(r.ability as AbilityName))
                ) {
                    for (let field of this.fields) {
                        field.isCloudNine = false;
                    }
                    this.applyWeather(undefined);
                }
                break;
            case "Teraform Zero":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .some(r => ["Cloud Nine", "Air Lock", "Teraform Zero"].includes(r.ability as AbilityName))
                ) {
                    for (let field of this.fields) {
                        field.isCloudNine = false;
                    }
                    this.applyWeather(undefined);
                }
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Teraform Zero" as AbilityName)
                ) {
                    for (let field of this.fields) {
                        field.isTeraformZero = false;
                    }
                    this.applyTerrain(undefined);
                }
            
                break;
            case "Sword of Ruin":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Sword of Ruin" as AbilityName)
                ) {
                    for (let field of this.fields) {
                        field.isSwordOfRuin = false;
                    }
                }
                break;
            case "Beads of Ruin":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Beads of Ruin" as AbilityName)
                ) {
                    for (let field of this.fields) {
                        field.isBeadsOfRuin = false;
                    }
                }
                break;
            case "Vessel of Ruin":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Vessel of Ruin" as AbilityName)
                ) {
                    for (let field of this.fields) {
                        field.isVesselOfRuin = false;
                    }
                }
                break;
            case "Tablets of Ruin":
                if (
                    !this.raiders
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Tablets of Ruin" as AbilityName)
                ) {
                    for (let field of this.fields) {
                        field.isTabletsOfRuin = false;
                    }
                }
                break;
            // stackable abilities
            case "Steely Spirit":
                if (id !== 0) {
                    for (let [index,field] of this.fields.entries()) {
                        if (index !== 0 && index !== id) {
                            field.attackerSide.steelySpirits -= 1;
                        }
                    }
                }
                break;
            case "Power Spot":
                if (id !== 0) {
                    for (let [index,field] of this.fields.entries()) {
                        if (index !== 0 && index !== id) {
                            field.attackerSide.powerSpots -= 1;
                        }
                    }
                }
                break;
            case "Battery":
                if (id !==0) {
                    for (let [index,field] of this.fields.entries()) {
                        if (index !== 0 && index !== id) {
                            field.attackerSide.batteries -= 1;
                            if (field.attackerSide.batteries === 0) {
                                field.attackerSide.isBattery = false;
                            }
                        }
                    }
                }
                break;
            case "Friend Guard":
                if (id !== 0) {
                    for (let fid=1; fid<5; fid++) {
                        if (id !== fid) {
                            this.fields[fid].attackerSide.friendGuards -= 1;
                            if (this.fields[fid].attackerSide.friendGuards === 0) {
                            }
                        }
                    }
                }
                break;
            // single-side field abilities
            case "Aroma Veil":
                if (id === 0) {
                    this.fields[0].attackerSide.isAromaVeil = false;
                } else if (
                    !this.raiders.slice(1)
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Aroma Veil" as AbilityName)
                ) {
                    for (let field of this.fields.slice(1)) {
                        field.attackerSide.isAromaVeil = false;
                    }
                }
                break;
            case "Flower Veil":
                if (id === 0) {
                    this.fields[0].attackerSide.isFlowerVeil = false;
                } else if (
                    !this.raiders.slice(1)
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .map(r => r.ability).includes("Flower Veil" as AbilityName)
                ) {
                    for (let field of this.fields.slice(1)) {
                        field.attackerSide.isFlowerVeil = false;
                    }
                }
                break;
            case "Dazzling":
            case "Queenly Majesty":
            case "Armor Tail":
                if (id === 0) {
                    this.fields[0].attackerSide.isDazzling = false;
                } else if (
                    !this.raiders.slice(1)
                    .filter(r => r.id !== id && r.originalCurHP !== 0)
                    .some(r => ["Dazzling", "Queenly Majesty", "Armor Tail"].includes(r.ability as AbilityName))
                ) {
                    for (let field of this.fields.slice(1)) {
                        field.attackerSide.isDazzling = false;
                    }
                }
                break;
            // Plus-Minus check
            case "Plus":
            case "Minus":
                const allyIDs = id !== 0 ? [1,2,3,4].filter(i => i !== id) : [];
                const plusMinusCount = allyIDs.reduce((p, c) => p + (this.getPokemon(c).ability === "Minus" || this.getPokemon(c).ability === "Plus" ? 1 : 0), 0);
                for (id of allyIDs) {
                    const ally = this.getPokemon(id);
                    if (ally.originalCurHP > 0 && ally.ability === "Minus" || ally.ability === "Plus") {
                        ally.abilityOn = plusMinusCount > 1;
                    }
                }
                break;
            // Individuual changes
            case "Protosynthesis":
            case "Quark Drive":
            case "Orichalcum Pulse":
            case "Hadron Engine":
                poke.boostedStat = undefined;
                poke.isQP = false;
                poke.usedBoosterEnergy = false;
                break;
            default: break;
        }
    }

    public faint(id: number) {
        let pokemon = this.getPokemon(id);
        const ability = pokemon.ability;
        // check Receiver / Power of Alchemy
        for (let i=1; i<5; i++) {
            if (i === id) { continue; }
            const ally = this.getPokemon(i);
            if ((ally.ability === "Receiver" || ally.ability === "Power Of Alchemy") && ally.originalCurHP !== 0) {
                if (ability && !persistentAbilities["NoReceiver"].includes(ability)) {
                    ally.ability = ability;
                }
            }
        }
        // check Soul-Heart
        for (let i=0; i<5; i++) {
            if (i === id) { continue; }
            const poke = this.getPokemon(i);
            if (poke.ability === "Soul-Heart" && poke.originalCurHP !== 0) {
                this.applyStatChange(i, {spa: 1}, true, i);
            }
        }
        // handle permanent cheer stacking
        if (pokemon.field.attackerSide.isAtkCheered) {
            pokemon.permanentAtkCheers += 1;
        }
        if (pokemon.field.attackerSide.isDefCheered) {
            pokemon.permanentDefCheers += 1;
        }
        pokemon.field.attackerSide.isAtkCheered = 0;
        pokemon.field.attackerSide.isDefCheered = 0;
        // remove some "field" modifiers
        pokemon.field.attackerSide.isHelpingHand = false;
        pokemon.field.attackerSide.isCharged = false;
        pokemon.field.attackerSide.isProtected = false;
        pokemon.field.attackerSide.isWideGuard = false;
        pokemon.field.attackerSide.isQuickGuard = false;
        // reset stats, status, etc, keeping a few things. HP is reset upon switch-in
        const originalSpecies = new Pokemon(9, pokemon.originalSpecies || pokemon.name, {
            level: pokemon.level,
            ivs: pokemon.ivs,
            evs: pokemon.evs,
            nature: pokemon.nature,
            statMultipliers: pokemon.statMultipliers,
            bossMultiplier: pokemon.bossMultiplier,
        });
        pokemon.name = originalSpecies.name;
        pokemon.species = originalSpecies.species;
        pokemon.weightkg = originalSpecies.weightkg;
        pokemon.types = originalSpecies.types;
        pokemon.stats = originalSpecies.stats;
        pokemon.rawStats = originalSpecies.rawStats;
        pokemon.isTransformed = false;
        pokemon.isChangedForm = false;
        pokemon.originalAbility = pokemon.originalFormAbility as AbilityName;
        if (pokemon.originalMoves) {
            pokemon.moveData = pokemon.originalMoves;
            pokemon.moves = pokemon.originalMoves.map(m => m.name);
        }
        pokemon.ability = pokemon.originalAbility as AbilityName; // restore original ability
        pokemon.abilityOn = false;
        pokemon.boosts = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0};
        pokemon.isPumped = 0;
        pokemon.isMicle = false;
        pokemon.isMinimize = false;
        pokemon.randomBoosts = 0;
        pokemon.alliesFainted = (pokemon.alliesFainted || 0) + 1;
        pokemon.status = "";
        pokemon.isSleep = 0;
        pokemon.isFrozen = 0;
        pokemon.isYawn = 0;
        pokemon.syrupBombDrops = 0;
        pokemon.volatileStatus = [];
        pokemon.originalCurHP = 0;
        pokemon.isEndure = false;
        pokemon.isTaunt = 0;
        pokemon.isCharging = false;
        pokemon.isRecharging = false;
        pokemon.abilityNullified = undefined;
        pokemon.moveRepeated = undefined;
        pokemon.isChoiceLocked = false;
        pokemon.isSaltCure = false;
        pokemon.usedBoosterEnergy = false;
        pokemon.boostedStat = undefined;
        pokemon.isIngrain = false;
        pokemon.isSmackDown = false;
        pokemon.stockpile = 0;
        pokemon.isEncore = 0;
        pokemon.isTorment = false;
        pokemon.isDisable = 0;
        pokemon.disabledMove = undefined;
        pokemon.isThroatChop = 0;
        pokemon.hasExtraType =false;
        pokemon.substitute = undefined;
        pokemon.moveData = pokemon.originalMoves || pokemon.moveData;
        pokemon.moves = pokemon.moveData.map(m => m.name);
        
        pokemon.delayedMoveCounter = undefined;
        pokemon.delayedMoveSource = undefined;
        pokemon.delayedMove = undefined;        

        // increment fainted count
        pokemon.timesFainted += 1;
        
        // remove ability effects that are removed upon fainting
        this.removeAbilityFieldEffect(id, ability);
    }

    public switchIn(id: number): string[][] {
        const pokemon = this.getPokemon(id);
        let ability = pokemon.ability;
        // reset HP and damage rolls
        pokemon.originalCurHP = pokemon.maxHP();
        pokemon.cumDamageRolls = new CumulativeRolls();
        pokemon.cumDamageRolls.addSequentialCondition(pokemon.item)
        // check Neutralizing Gas
        const neutralizingGas = this.raiders.reduce((p, c) => p || c.ability === "Neutralizing Gas", false);
        if (neutralizingGas && !pokemon.hasItem("Ability Shield") && ability !== "Neutralizing Gas") { 
            pokemon.abilityNullified = -1;
        }
        // add abilites that Take Effect upon switch-in
        const flags = this.addAbilityFieldEffect(id, ability);
        // Mew stat boosts for Mewtwo event.
        if (id !== 0 && pokemon.name === "Mew" && this.raiders[0].name === "Mewtwo") {
            this.raiders[id] = new Raider(
                id,
                pokemon.role,
                pokemon.shiny,
                false,
                pokemon.field.clone(),
                new Pokemon(
                    gen,
                    pokemon.name as SpeciesName,
                    {
                        ...pokemon,
                        rawStats: undefined,
                        stats: undefined,
                        statMultipliers: {
                            hp: 1.5,
                            atk: 1.2,
                            def: 1.2,
                            spa: 1.2,
                            spd: 1.2,
                            spe: 1.2,
                        }
                    }
                ),
                [...pokemon.moveData],
                [...(pokemon.extraMoves || [])],
                [...(pokemon.extraMoveData || [])],

            );
            this.raiders[id].originalCurHP = this.raiders[id].maxHP();
            flags[id].push(pokemon.name + " is going to go all out against this formidable opponent!")
        }
        return flags;
    }

    public transform(id:number, target: number): boolean {
        const pokemon = this.getPokemon(id);
        const targetPokemon = this.getPokemon(target);
        if (!pokemon.isTransformed && !targetPokemon.isTransformed) {
            pokemon.transformInto(targetPokemon);
            this.changeAbility(id, targetPokemon.ability || "(No Ability)");
            return true;
        } else {
            return false;
        }
    }
}
