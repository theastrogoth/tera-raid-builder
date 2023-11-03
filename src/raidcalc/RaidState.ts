import { Field, Generations, Pokemon, StatsTable } from "../calc";
import { Raider } from "./Raider";
import { getModifiedStat, getQPBoostedStat } from "../calc/mechanics/util";
import * as State from "./interface";
import { AbilityName, ItemName, MoveName, SpeciesName, StatIDExceptHP, StatusName, Terrain, TypeName, Weather } from "../calc/data/interface";
import persistentAbilities from "../data/persistent_abilities.json"

const gen = Generations.get(9);

const WIND_MOVES = [
    "Air Cutter",
    "Bleakwind Storm",
    "Blizzard",
    "Fairy Wind",
    "Gust",
    "Heat Wave",
    "Hurricane",
    "Icy Wind",
    "Petal Blizzard",
    "Sandsear Storm",
    "Springtide Storm",
    "Tailwind",
    "Twister",
    "Whirlwind",
    "Wildbolt Storm",
];

export class RaidState implements State.RaidState{
    raiders: Raider[]; // raiders[0] is the boss, while raiders 1-5 are the players

    constructor(raiders: Raider[]) {
        this.raiders = raiders;
    }

    clone(): RaidState {
        return new RaidState(
            this.raiders.map(raider => raider.clone()) 
        )
    }

    public get fields(): Field[] {
        return this.raiders.map(raider => raider.field);
    }

    public getPokemon(id: number): Raider {
        return this.raiders[id];
    }

    public applyDamage(id: number, damage: number, nHits: number = 0, isCrit: boolean = false, isSuperEffective: boolean = false, moveName?: MoveName, moveType?: TypeName, moveCategory?: "Physical" | "Special" | "Status" | undefined) {
        const pokemon = this.getPokemon(id);
        if (pokemon.originalCurHP === 0) { return; } // prevent healing KOd Pokemon, and there's no need to subtract damage from 0HP
        const originalHP = pokemon.originalCurHP;
        if (nHits > 0 && damage > 0) {
            pokemon.applyDamage(damage * nHits); // damage is per-hit for multi-hit moves
        } else {
            pokemon.applyDamage(damage);
        }
        const maxHP = pokemon.maxHP();
        const opponents = id === 0 ? [1,2,3,4] : [0];
        let unnerve = false;
        let fainted = pokemon.originalCurHP <= 0;
        for (let i of opponents) {
            if (this.getPokemon(i).ability === "Unnerve") { unnerve = true; break; }
        }
        if (nHits > 0 && damage > 0) { // checks that the pokemon was attacked, and that the damage was not due to recoil or chip damage
            if (damage > 0) {
                pokemon.hitsTaken = pokemon.hitsTaken + nHits;
            }
            // Item consumption / Ability Activation triggered by damage
            // Focus Sash
            if (pokemon.item === "Focus Sash" || pokemon.ability === "Sturdy") {
                if (pokemon.originalCurHP <= 0 && originalHP === maxHP) { 
                    pokemon.originalCurHP = 1;
                    if (pokemon.ability !== "Sturdy") { this.loseItem(id); } 
                    fainted = false;
                }
            }
            // Ice Face
            if (pokemon.ability === "Ice Face" && !pokemon.abilityOn && moveCategory === "Physical") {
                pokemon.abilityOn = true;
                pokemon.originalCurHP = originalHP; // no damage is done
                fainted = false;
                return; // don't trigger item use
            }
            // Air Balloon
            if (pokemon.item === "Air Balloon") {
                this.loseItem(id);
            }
            // Disguise
            if (pokemon.ability === "Disguise" && !pokemon.abilityOn) {
                pokemon.abilityOn = true;
                pokemon.originalCurHP = originalHP; // negate damage from attack
                pokemon.applyDamage(Math.floor(pokemon.maxHP()/8)); // bust disguise, 1/8 max HP damage
                if (pokemon.originalCurHP === 0) {
                    this.faint(id);
                }
                return; // don't trigger item use (except for Air Balloon)
            }
            // Weakness Policy and Super-Effective reducing Berries
            // TO DO - abilities that let users use berries more than once
            if (damage > 0 && isSuperEffective) {
                if (!fainted && pokemon.item === "Weakness Policy") { // weakness policy isn't consumed if the target faints (?)
                    this.applyStatChange(id, {atk: 2, spa: 2}, true, true)
                    this.loseItem(id);
                } else if (!unnerve) {
                    switch (pokemon.item) {
                        case "Occa Berry":  // the calc alread takes the berry into account, so we can just remove it here
                            if (moveType === "Fire") { this.loseItem(id); }
                            break;
                        case "Passho Berry":
                            if (moveType === "Water") { this.loseItem(id); }
                            break;
                        case "Wacan Berry":
                            if (moveType === "Electric") { this.loseItem(id); }
                            break;
                        case "Rindo Berry":
                            if (moveType === "Grass") { this.loseItem(id); }
                            break;
                        case "Yache Berry":
                            if (moveType === "Ice") { this.loseItem(id); }
                            break;
                        case "Chople Berry":
                            if (moveType === "Fighting") { this.loseItem(id); }
                            break;
                        case "Kebia Berry":
                            if (moveType === "Poison") { this.loseItem(id); }
                            break;
                        case "Shuca Berry":
                            if (moveType === "Ground") { this.loseItem(id); }
                            break;
                        case "Coba Berry":
                            if (moveType === "Flying") { this.loseItem(id); }
                            break;
                        case "Payapa Berry":
                            if (moveType === "Psychic") { this.loseItem(id); }
                            break;
                        case "Tanga Berry":
                            if (moveType === "Bug") { this.loseItem(id); }
                            break;
                        case "Charti Berry":
                            if (moveType === "Rock") { this.loseItem(id); }
                            break;
                        case "Kasib Berry":
                            if (moveType === "Ghost") { this.loseItem(id); }
                            break;
                        case "Haban Berry":
                            if (moveType === "Dragon") { this.loseItem(id); }
                            break;
                        case "Colbur Berry":
                            if (moveType === "Dark") { this.loseItem(id); }
                            break;
                        case "Babiri Berry":
                            if (moveType === "Steel") { this.loseItem(id); }
                            break;
                        case "Roseli Berry":
                            if (moveType === "Fairy") { this.loseItem(id); }
                            break;
                        default: break;
                    }
                }
            }
            if (!unnerve && pokemon.item === "Chiban Berry" && moveType === "Normal") {
                this.loseItem(id);
            }
            /// abilities triggered by damage even if the target faints
            // Seed Sower
            if (pokemon.ability === "Seed Sower") {
                this.applyTerrain("Grassy");
            }
            /// the rest can be skipped if the target faints
            if (fainted) { this.faint(id); return; }
            /// abilities triggered by damage if the target survives
            // Anger Point
            if (isCrit && pokemon.ability === "Anger Point") { 
                const boost = {atk: 12};
                this.applyStatChange(id, boost, true, true);
            };
            // Steam Engine
            if ((moveType === "Fire" || moveType === "Water" ) && pokemon.ability === "Steam Engine") {
                const boost = {spe: 6};
                this.applyStatChange(id, boost, true, true);
            }
            // Water Compaction
            if (moveType === "Water" && pokemon.ability === "Water Compaction") {
                const boost = {def: 2 * nHits};
                this.applyStatChange(id, boost, true, true);
            }
            // Justified
            if (moveType === "Dark" && pokemon.ability === "Justified") {
                const boost = {atk: nHits};
                this.applyStatChange(id, boost, true, true);
            }    
            // Weak Armor
            if (pokemon.ability === "Weak Armor") {
                const boost = {def: -1 * nHits, spe: 2 * nHits};
                this.applyStatChange(id, boost, true, true);
            }
            // Stamina
            if (pokemon.ability === "Stamina") {
                const boost = {def: nHits};
                this.applyStatChange(id, boost, true, true);
            }
            // Anger Shell
            if (pokemon.ability === "Anger Shell" && originalHP > maxHP/2 && pokemon.originalCurHP <= maxHP/2) {
                const boost = {atk: 1, spa: 1, spe: 1};
                this.applyStatChange(id, boost, true, true);
            }
            // Berserk
            if (pokemon.ability === "Berserk" && originalHP > maxHP/2 && pokemon.originalCurHP <= maxHP/2) {
                const boost = {spa: 1};
                this.applyStatChange(id, boost, true, true);
            }
            // Electromorphosis
            if (pokemon.ability ===  "Electromorphosis") {
                pokemon.field.attackerSide.isCharged = true;
            }
            // Rattled
            if (pokemon.ability === "Rattled" && ["Dark", "Ghost", "Bug"].includes(moveType || "")) {
                const boost = {spe: 1};
                this.applyStatChange(id, boost, true, true);
            }
            // Wind Power
            if (pokemon.ability === "Wind Power" && 
                WIND_MOVES.includes(moveName as MoveName)) {
                pokemon.field.attackerSide.isCharged = true;
            }
        }
        /// Berry Consumption triggered by damage
        if (!unnerve && pokemon.item && pokemon.item?.includes("Berry")) {
            // 50% HP Berries
            if (pokemon.originalCurHP <= maxHP / 2) {
                if (pokemon.item === "Sitrus Berry") {
                    pokemon.originalCurHP += Math.floor(maxHP / 4);
                    this.loseItem(id);
                } else if (pokemon.item === "Oran Berry") {
                    pokemon.originalCurHP = Math.min(maxHP, pokemon.originalCurHP + 10);
                    this.loseItem(id);
                }
            }
            // 33% HP Berries
            // TO DO
            // if (pokemon.originalCurHP <= maxHP / 3) {
            //     switch (pokemon.item) {

            //     }
            // }
            // 25% HP Berries
            if ((pokemon.originalCurHP <= maxHP / 4) || (pokemon.hasAbility("Gluttony") && (pokemon.originalCurHP <= maxHP / 2))) {
                switch (pokemon.item) {
                    case "Liechi Berry":
                        this.applyStatChange(id, {atk: 1}, true, true);
                        this.loseItem(id);
                        break;
                    case "Ganlon Berry":
                        this.applyStatChange(id, {def: 1}, true, true);
                        this.loseItem(id);
                        break;
                    case "Petaya Berry":
                        this.applyStatChange(id, {spa: 1}, true, true);
                        this.loseItem(id);
                        break;
                    case "Apicot Berry":
                        this.applyStatChange(id, {spd: 1}, true, true);
                        this.loseItem(id);
                        break;
                    case "Salac Berry":
                        this.applyStatChange(id, {spe: 1}, true, true);
                        this.loseItem(id);
                        break;
                    case "Lansat Berry":
                        pokemon.isPumped = true;
                        this.loseItem(id);
                        break;
                    case "Micle Berry":
                        pokemon.isMicle = true;
                        this.loseItem(id);
                        break;
                }
            }
        }
    }

    public applyStatChange(id: number, boosts: Partial<StatsTable>, copyable: boolean = true, fromSelf: boolean = false, ignoreAbility: boolean = false): StatsTable {
        const pokemon = this.getPokemon(id);
        // Clear Amulet, Clear Body, White Smoke, Full Metal Body
        if (!fromSelf && (pokemon.item === "Clear Amulet" || (!ignoreAbility && pokemon.hasAbility("Clear Body", "White Smoke", "Full Metal Body")))) {
            for (const stat in boosts) {
                const statId = stat as StatIDExceptHP;
                if ((boosts[statId] || 0) < 0) {
                    boosts[statId] = 0;
                    this.loseItem(id);
                }
            }
        }
        // Apply stat changes
        const diff = pokemon.applyStatChange(boosts);
        // Defiant and Competitive
        if (!fromSelf && (pokemon.ability === "Defiant" || pokemon.ability === "Competitive")) {
            const numNegativeBoosts = Object.values(diff).reduce((p, c) => p + (c < 0 ? 1 : 0), 0);
            if (numNegativeBoosts > 0) {
                const boost = pokemon.ability === "Defiant" ? {atk: 2 * numNegativeBoosts} : {spa: 2 * numNegativeBoosts};
                this.applyStatChange(id, boost, true, true);
            }
        }
        // Mirror Herb and Opportunist
        if (copyable) { // Stat changes that are being copied shouldn't be copied in turn
            const opponentIds = id === 0 ? [1,2,3,4] : [0];
            for (const opponentId of opponentIds) {
                const opponent = this.getPokemon(opponentId);
                const mirrorHerb = opponent.item === "Mirror Herb";
                const opportunist = opponent.ability === "Opportunist";
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
                        this.applyStatChange(opponentId, positiveDiff, false, true);
                        if (opponent.item === "Mirror Herb") { this.loseItem(opponentId); }
                    }
                }
            }
        }
        // White Herb
        if (pokemon.item === "White Herb") {
            let used = false
            for (const stat in pokemon.boosts) {
                const statId = stat as StatIDExceptHP;
                if ((pokemon.boosts[statId] || 0) < 0) {
                    pokemon.boosts[statId] = 0;
                    used = true;
                }
            }
            if (used) { this.loseItem(id); }
        }
 
        return diff;
    }

    public applyStatus(id: number, status: StatusName) {
        const pokemon = this.getPokemon(id);
        if (pokemon.status === "" || pokemon.status === undefined) {
            pokemon.status = status;
        }
        // Status curing berries
        if (pokemon.item === "Cheri Berry" && pokemon.status === "par") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Chesto Berry" && pokemon.status === "slp") { pokemon.status = ""; pokemon.isSleep = 0; this.loseItem(id); }
        if (pokemon.item === "Pecha Berry" && pokemon.status === "psn") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Rawst Berry" && pokemon.status === "brn") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Aspear Berry" && pokemon.status === "frz") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Lum Berry" && pokemon.status !== "") { 
            pokemon.status = ""; 
            pokemon.volatileStatus = pokemon.volatileStatus.filter(status => status !== "confusion"); 
            this.loseItem(id); 
        }
    }

    public applyVolatileStatus(id: number, ailment: string, firstMove?: boolean, source?: number) {
        const pokemon = this.getPokemon(id);
        if (ailment === "confusion" && pokemon.hasItem("Lum Berry", "Persim Berry")) {
            this.loseItem(id);
        } else if (["infatuation", "taunt", "encore", "disable", "torment", "heal-block"].includes(ailment) && pokemon.hasItem("Mental Herb")){
            this.loseItem(id);
        } else {
            pokemon.volatileStatus.push!(ailment);
            if (ailment === "taunt") {
                pokemon.isTaunt = (firstMove ? 3 : 4) * (id === 0 ? 4 : 1);
            } else if (ailment === "yawn") {
                pokemon.isYawn = 2;
                pokemon.yawnSource = source;
            } else if (ailment === "ingrain") {
                pokemon.isIngrain = true;
            }
        }


    }

    public loseItem(id: number) {
        const pokemon = this.getPokemon(id);
        pokemon.loseItem();
        // Symbiosis
        if (id > 0) {
            const symbiosisIds: number[] = []
            for (let sid=1; sid<5; sid++) {
                if (sid !== id && this.getPokemon(sid).ability === "Symbiosis" && this.getPokemon(sid).item !== undefined) {
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
                    const field = poke.field;
                    if ( (!field.isTrickRoom && speed > fastestSymbSpeed) || (field.isTrickRoom && speed < fastestSymbSpeed) ) {
                        fastestSymbId = symbiosisIds[i];
                        fastestSymbPoke = poke;
                        fastestSymbSpeed = speed;
                    } 
                }
                // symbiosis item transfer
                this.recieveItem(id, fastestSymbPoke.item!);
                fastestSymbPoke.item = undefined; // don't call loseItem because it will trigger symbiosis again
            }
        }
    }

    public recieveItem(id: number, item: ItemName | undefined) {
        const pokemon = this.getPokemon(id);
        pokemon.item = item;
        /// Items that activate upon reciept or switch in
        // Booster Energy
        if (pokemon.item === "Booster Energy" && (pokemon.ability === "Protosynthesis" || pokemon.ability === "Quark Drive") && !pokemon.abilityOn) {
            pokemon.abilityOn = true;
            const statId = getQPBoostedStat(pokemon, gen) as StatIDExceptHP;
            pokemon.boostedStat = statId;
            pokemon.usedBoosterEnergy = true;
            this.loseItem(id)
        }
        // Terrain Seeds
        if (item && item.includes("Seed")) {
            this.applyTerrain(pokemon.field.terrain, pokemon.field.terrainTurnsRemaining, [id]);
        }
        // Berries consumed immediately upon reciept (via Symbiosis, Trick, etc) if their conditions are met
        this.applyDamage(id, 0, 0);
    }

    public applyTerrain(terrain: Terrain | undefined, turns: number = 20, ids: number[] = [0,1,2,3,4]) {
        for (let id of ids) {
            const pokemon = this.getPokemon(id);
            pokemon.field.terrain = terrain;
            pokemon.field.terrainTurnsRemaining = turns;
            // Quark Drive
            if (pokemon.ability === "Quark Drive" && !pokemon.usedBoosterEnergy) {
                if (pokemon.field.terrain === "Electric" && !pokemon.abilityOn) {
                    pokemon.abilityOn = true;
                    const statId = getQPBoostedStat(pokemon, gen) as StatIDExceptHP;
                    pokemon.boostedStat = statId;
                } else if (pokemon.field.terrain !== "Electric" && pokemon.abilityOn) {
                    pokemon.abilityOn = false;
                    pokemon.boostedStat = undefined;
                    if (pokemon.item === "Booster Energy") { this.recieveItem(id, "Booster Energy" as ItemName); }
                }
            }
            // Terrain Seeds
            if (pokemon.item === "Electric Seed" && pokemon.field.terrain === "Electric") {
                this.applyStatChange(id, {def: 1}, true, true);
                this.loseItem(id);
            } else if (pokemon.item === "Grassy Seed" && pokemon.field.terrain === "Grassy") {
                this.applyStatChange(id, {def: 1}, true, true);
                this.loseItem(id);
            } else if (pokemon.item === "Psychic Seed" && pokemon.field.terrain === "Psychic") {
                this.applyStatChange(id, {spd: 1}, true, true);
                this.loseItem(id);
            } else if (pokemon.item === "Misty Seed" && pokemon.field.terrain === "Misty") {
                this.applyStatChange(id, {spd: 1}, true, true);
                this.loseItem(id);
            }
        }
    }

    public applyWeather(weather: Weather | undefined, turns = 20, ids: number[] = [0,1,2,3,4]) {
        for (let id of ids) {
            const pokemon = this.getPokemon(id);
            pokemon.field.weather = weather;
            pokemon.field.weatherTurnsRemaining = turns;
            // Protosynthesis
            if (pokemon.ability === "Protosynthesis" && !pokemon.usedBoosterEnergy) {
                if ((pokemon.field.weather || "").includes("Sun") && !pokemon.abilityOn) {
                    pokemon.abilityOn = true;
                    const statId = getQPBoostedStat(pokemon, gen) as StatIDExceptHP;
                    pokemon.boostedStat = statId;
                } else if ((pokemon.field.weather || "").includes("Sun")  && pokemon.abilityOn) {
                    pokemon.abilityOn = false;
                    pokemon.boostedStat = undefined;
                    if (pokemon.item === "Booster Energy") { this.recieveItem(id, "Booster Energy" as ItemName); }
                }
            }
        }
    }

    public activateTera(id: number): boolean {
        const pokemon = this.getPokemon(id);
        return pokemon.activateTera();
    }

    public changeAbility(id: number, ability: AbilityName | "(No Ability)", restore: boolean = false) {
        const pokemon = this.getPokemon(id);
        if (pokemon.hasItem("Ability Shield")) { return; }
        if (ability === "(No Ability)") {
            if (persistentAbilities.unsuppressable.includes(pokemon.ability || "")) { return; }
        } else {
            if (persistentAbilities.unreplaceable.includes(pokemon.ability || "")) { return; }
        }
        const oldAbility = pokemon.ability;
        pokemon.ability = ability as AbilityName;
        if (pokemon.ability !== oldAbility) {
            // lost field effects
            this.removeAbilityFieldEffect(id, oldAbility);
            // gained field effects
            this.addAbilityFieldEffect(id, ability, false, restore);
        }
    }

    public addAbilityFieldEffect(id: number, ability: AbilityName | "(No Ability)" | undefined, switchIn: boolean = false, restore: boolean = false): string[][] {
        const pokemon = this.getPokemon(id);
        const flags: string[][] = [[],[],[],[],[]];
        /// Trace (handled separately so the traced ability can activate if applicable)
        if (ability === "Trace") {
            const opponentIds = id === 0 ? [1,2,3,4] : [0];
            for (let oid of opponentIds) { // Trace might be random for bosses, but we'll check abilities in order
                const copiedAbility = this.raiders[oid].ability;
                if (copiedAbility && !persistentAbilities["uncopyable"].includes(copiedAbility)) {
                    pokemon.ability = copiedAbility;
                    ability = copiedAbility;
                    flags[id].push("Trace copies " + copiedAbility);
                    break;
                }
            } 
        }
        //// Abilities only activated upon switch-in
        if (switchIn) {
            /// Weather Abilities
            if (ability === "Drought") {
                this.applyWeather("Sun", pokemon.item === "Heat Rock" ? 32 : 20);
                flags[id].push("Drought summons the Sun");
            } else if (ability === "Drizzle") {
                this.applyWeather("Rain", pokemon.item === "Damp Rock" ? 32 : 20);
                flags[id].push("Drizzle summons the Rain");
            } else if (ability === "Sand Stream") {
                this.applyWeather("Sand", pokemon.item === "Smooth Rock" ? 32 : 20);
                flags[id].push("Sand Stream summons a Sandstorm");
            } else if (ability === "Snow Warning") {
                this.applyWeather("Snow", pokemon.item === "Icy Rock" ? 32 : 20);
                flags[id].push("Snow Warning summons a Snowstorm");
            } else if (ability === "Orichalcum Pulse") {
                this.applyWeather("Sun", pokemon.item === "Heat Rock" ? 32 : 20);
                flags[id].push("Orichalcum Pulse summons the Sun");
            /// Terrain Abilities
            } else if (ability === "Grassy Surge") {
                this.applyTerrain("Grassy", pokemon.item === "Terrain Extender" ? 32 : 20);
                flags[id].push("Grassy Surge summons Grassy Terrain");
            } else if (ability === "Electric Surge") {
                this.applyTerrain("Electric", pokemon.item === "Terrain Extender" ? 32 : 20);
                flags[id].push("Electric Surge summons Electric Terrain");
            } else if (ability === "Misty Surge") {
                this.applyTerrain("Misty", pokemon.item === "Terrain Extender" ? 32 : 20);
                flags[id].push("Misty Surge summons Misty Terrain");
            } else if (ability === "Psychic Surge") {
                this.applyTerrain("Psychic", pokemon.item === "Terrain Extender" ? 32 : 20);
                flags[id].push("Psychic Surge summons Psychic Terrain");
            } else if (ability === "Hadron Engine") {
                this.applyTerrain("Electric", pokemon.item === "Terrain Extender" ? 32 : 20);
                flags[id].push("Hadron Engine summons Electric Terrain");
            /// Ruin Abilities (should be uncopyable / unsupressable)
            } else if (ability === "Sword of Ruin") {
                for (let field of this.fields) {
                    field.isSwordOfRuin = true;
                }
                flags[id].push("Sword of Ruin lowers Defenses");
            } else if (ability === "Beads of Ruin") {
                for (let field of this.fields) {
                    field.isBeadsOfRuin = true;
                }
                flags[id].push("Beads of Ruin lowers Special Defenses");
            } else if (ability === "Vessel of Ruin") {
                for (let field of this.fields) {
                    field.isVesselOfRuin = true;
                }
                flags[id].push("Vessel of Ruin lowers Special Attacks");
            } else if (ability === "Tablets of Ruin") {
                for (let field of this.fields) {
                    field.isTabletsOfRuin = true;
                }
                flags[id].push("Tablets of Ruin lowers Attacks");
            /// others
            // Supersweet Syrup
            } else if (ability === "Supersweet Syrup") {
                const affectedPokemon = id === 0 ? this.raiders.slice(1) : [this.raiders[0]];
                for (let opponent of affectedPokemon) {
                    const origEva = opponent.boosts.eva || 0;
                    this.applyStatChange(opponent.id, {eva: -1}, true, false);
                    flags[opponent.id].push("Eva: " + origEva + "->" + opponent.boosts.eva + " (Supersweet Syrup)");
                }
            // Hospitality 
            } else if (ability === "Hospitality") {
                if (id !== 0) {
                    const allies = this.raiders.slice(1).splice(id-1, 1);
                    for (let ally of allies) {
                        const healing = Math.floor(ally.maxHP() / 4);
                        this.applyDamage(ally.id, -healing, 0)
                    }
                }
            // Intrepid Sword
            } else if (ability === "Intrepid Sword") {
                const origAtk = pokemon.boosts.atk;
                this.applyStatChange(id, {atk: 1}, true, true);
                flags[id].push("Atk: " + origAtk + "->" + pokemon.boosts.atk + " (Intrepid Sword)");
            // Dauntless Shield
            } else if (ability === "Dauntless Shield") {
                const origDef = pokemon.boosts.def;
                this.applyStatChange(id, {def: 1}, true, true);
                flags[id].push("Def: " + origDef + "->" + pokemon.boosts.def + " (Dauntless Shield)");
            // Protosynthesis and Quark Drive  (should be uncopyable / unsupressable)
            } else if (ability === "Protosynthesis" || ability === "Quark Drive") {
                if (pokemon.item === "Booster Energy" && !pokemon.abilityOn) {
                    this.recieveItem(id, "Booster Energy" as ItemName); // consume Booster Energy
                }
            }
        }
        /// Other Field-Related Abilities
        // Intimidate (activated on switch in OR ability change, but not when restored after nullification)
        if (!restore && ability === "Intimidate") {
            const affectedPokemon = id === 0 ? this.raiders.slice(1) : [this.raiders[0]];
            for (let opponent of affectedPokemon) {
                if (!["Oblivious", "Own Tempo", "Inner Focus", "Scrappy"].includes(opponent.ability || "")) {
                    const origAtk = opponent.boosts.atk ||  0;
                    this.applyStatChange(opponent.id, {atk: -1}, true, false);
                    flags[opponent.id].push("Atk: " + origAtk + "->" + opponent.boosts.atk + " (Intimidate)");
                }
                if (opponent.hasAbility("Rattled")) {
                    const origSpe = opponent.boosts.spe || 0;
                    this.applyStatChange(opponent.id, {spe: 1}, true, true);
                    flags[opponent.id][flags[opponent.id].length-1] += ", Spe: " + origSpe + "->" + opponent.boosts.spe + " (Rattled)";
                }
            }
        }
        // Cloud Nine / Air Lock
        if (ability === "Cloud Nine" || ability === "Air Lock") {
            for (let field of this.fields) {
                field.isCloudNine = true;
            }
            flags[id].push("Cloud Nine negates the weather");
        // Steely Spirit
        } else if (ability === "Steely Spirit") {
            if (id === 0) {
                this.fields[0].attackerSide.steelySpirits += 1;
            }
            else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.steelySpirits += 1;
                }
            }
            flags[id].push("Steely Spirit boosts Allies' Steel-type attacks");
        // Aroma Veil
        } else if (ability === "Aroma Veil") {
            if (id === 0) {
                this.fields[0].attackerSide.isAromaVeil = true;
            } else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.isAromaVeil = true;
                }
            }
            flags[id].push("Aroma Veil protects allies");
        // Power Spot
        } else if (ability === "Power Spot") {
            if (id === 0) {
                this.fields[0].attackerSide.powerSpots += 1;
            } else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.powerSpots += 1;
                }
            }
            flags[id].push("Power Spot boosts attack power");
        } else if (ability === "Battery") {
            if (id === 0) {
                this.fields[0].attackerSide.batteries += 1;
            } else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.batteries += 1;
                }
            }
            flags[id].push("Battery boosts special attack power");
        // Friend Guard
        } else if (ability === "Friend Guard") {
            if (id !== 0) {
                for (let fid=1; fid<5; fid++) {
                    if (id !== fid) {
                        this.fields[fid].attackerSide.friendGuards += 1;
                    }
                }
            }
            flags[id].push("Friend Guard reduces allies' damage taken");
        } else {
            // 
        }
        return flags;
    }

    public removeAbilityFieldEffect(id: number, ability: AbilityName | "(No Ability)" | undefined) {
        // on/off field-based abilties
        if (ability === "Cloud Nine") {
            if (
                !this.raiders
                .filter(r => r.id !== id && r.originalCurHP !== 0)
                .map(r => r.ability).includes("Cloud Nine" as AbilityName)
            ) {
                for (let field of this.fields) {
                    field.isCloudNine = false;
                }
            }
        } else if (ability === "Sword of Ruin") {
            if (
                !this.raiders
                .filter(r => r.id !== id && r.originalCurHP !== 0)
                .map(r => r.ability).includes("Sword of Ruin" as AbilityName)
            ) {
                for (let field of this.fields) {
                    field.isSwordOfRuin = false;
                }
            }
        } else if (ability === "Beads of Ruin") {
            if (
                !this.raiders
                .filter(r => r.id !== id && r.originalCurHP !== 0)
                .map(r => r.ability).includes("Beads of Ruin" as AbilityName)
            ) {
                for (let field of this.fields) {
                    field.isBeadsOfRuin = false;
                }
            }
        } else if (ability === "Vessel of Ruin") {
            if (
                !this.raiders
                .filter(r => r.id !== id && r.originalCurHP !== 0)
                .map(r => r.ability).includes("Vessel of Ruin" as AbilityName)
            ) {
                for (let field of this.fields) {
                    field.isVesselOfRuin = false;
                }
            }
        } else if (ability === "Tablets of Ruin") {
            if (
                !this.raiders
                .filter(r => r.id !== id && r.originalCurHP !== 0)
                .map(r => r.ability).includes("Tablets of Ruin" as AbilityName)
            ) {
                for (let field of this.fields) {
                    field.isTabletsOfRuin = false;
                }
            }
        // stackable abilities
        } else if (ability === "Steely Spirit") {
            if (id === 0) {
                this.fields[0].attackerSide.steelySpirits -= 1;
            } else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.steelySpirits -= 1;
                }
            }
        } else if (ability === "Power Spot") {
            if (id === 0) {
                this.fields[0].attackerSide.powerSpots -= 1;
                if (this.fields[0].attackerSide.powerSpots === 0) {
                }
            } else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.powerSpots -= 1;
                    if (field.attackerSide.powerSpots === 0) {
                    }
                }
            }
        } else if (ability === "Battery") {
            if (id === 0) {
                this.fields[0].attackerSide.batteries -= 1;
                if (this.fields[0].attackerSide.batteries === 0) {
                    this.fields[0].attackerSide.isBattery = false;
                }
            } else {
                for (let field of this.fields.slice(1)) {
                    field.attackerSide.batteries -= 1;
                    if (field.attackerSide.batteries === 0) {
                        field.attackerSide.isBattery = false;
                    }
                }
            }
        } else if (ability === "Friend Guard") {
            if (id !== 0) {
                for (let fid=1; fid<5; fid++) {
                    if (id !== fid) {
                        this.fields[fid].attackerSide.friendGuards -= 1;
                        if (this.fields[fid].attackerSide.friendGuards === 0) {
                        }
                    }
                }
            }
        // single-side field abilities
        } else if (ability === "Aroma Veil") {
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
        }
    }

    public faint(id: number) {
        let pokemon = this.getPokemon(id);
        const ability = pokemon.ability;
        // check Reciever / Power of Alchemy
        for (let i=1; i<5; i++) {
            if (i === id) { continue; }
            const ally = this.getPokemon(i);
            if ((ally.ability === "Receiver" || ally.ability === "Power Of Alchemy") && ally.originalCurHP !== 0) {
                if (ability && !persistentAbilities["uncopyable"].includes(ability)) {
                    ally.ability = ability;
                }
            }
        }
        // reset stats, status, etc, keeping a few things. HP is reset upon switch-in
        pokemon.ability = pokemon.originalAbility as AbilityName; // restore original ability
        pokemon.abilityOn = false;
        pokemon.boosts = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, eva: 0, acc: 0};
        pokemon.isPumped = false;
        pokemon.isMicle = false;
        pokemon.randomBoosts = 0;
        pokemon.alliesFainted = (pokemon.alliesFainted || 0) + 1;
        pokemon.status = "";
        pokemon.volatileStatus = [];
        pokemon.originalCurHP = 0;
        pokemon.isEndure = false;
        pokemon.isCharging = false;
        pokemon.isRecharging = false;
        pokemon.abilityNullified = 0;
        pokemon.moveRepeated = undefined;
        pokemon.changedTypes = undefined;
        pokemon.types = new Pokemon(9, pokemon.name).types;
        
        // remove ability effects that are removed upon fainting
        this.removeAbilityFieldEffect(id, ability);
    }

    public switchIn(id: number): string[][] {
        const pokemon = this.getPokemon(id);
        let ability = pokemon.ability;
        // reset HP
        pokemon.originalCurHP = pokemon.maxHP();
        // add abilites that Take Effect upon switch-in
        const flags = this.addAbilityFieldEffect(id, ability, true);
        // Mew stat boosts for Mewtwo event.
        if (id !== 0 && pokemon.name === "Mew" && this.raiders[0].name === "Mewtwo") {
            this.raiders[id] = new Raider(
                id,
                pokemon.role,
                pokemon.shiny,
                pokemon.field.clone(),
                new Pokemon(
                    gen,
                    pokemon.name as SpeciesName,
                    {
                        ...pokemon,
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
}
