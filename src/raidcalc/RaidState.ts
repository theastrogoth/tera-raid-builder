import { Field, Generations, Move, StatsTable } from "../calc";
import { Raider } from "./Raider";
import { getModifiedStat, getQPBoostedStat } from "../calc/mechanics/util";
import { safeStatStage } from "./util";
import * as State from "./interface";
import { ItemName, StatIDExceptHP, StatusName, Terrain, TypeName, Weather } from "../calc/data/interface";

const gen = Generations.get(9);

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

    public applyDamage(id: number, damage: number, nHits: number = 0, isCrit: boolean = false, isSuperEffective: boolean = false, moveType?: TypeName) {
        if (damage <= 0) { return; }
        const pokemon = this.getPokemon(id);
        const originalHP = pokemon.originalCurHP;
        pokemon.applyDamage(damage);
        const finalHP = pokemon.originalCurHP;
        /// Berry Consumption triggered by damage
        if (pokemon.item && pokemon.item?.includes("Berry")) {
            // 50% HP Berries
            if (finalHP <= pokemon.maxHP() / 2) {
                if (pokemon.item === "Sitrus Berry") {
                    pokemon.originalCurHP += Math.floor(pokemon.maxHP() / 4);
                    this.loseItem(id);
                }
            }
            // 33% HP Berries
            // TO DO
            // if (finalHP <= pokemon.maxHP() / 3) {
            //     switch (pokemon.item) {

            //     }
            // }
            // 25% HP Berries
            if (finalHP <= pokemon.maxHP() / 4) {
                switch (pokemon.item) {
                    case "Liechi Berry":
                        this.applyStatChange(id, {atk: 1});
                        this.loseItem(id);
                        break;
                    case "Ganlon Berry":
                        this.applyStatChange(id, {def: 1});
                        this.loseItem(id);
                        break;
                    case "Petaya Berry":
                        this.applyStatChange(id, {spa: 1});
                        this.loseItem(id);
                        break;
                    case "Apicot Berry":
                        this.applyStatChange(id, {spd: 1});
                        this.loseItem(id);
                        break;
                    case "Salac Berry":
                        this.applyStatChange(id, {spe: 1});
                        this.loseItem(id);
                        break;
                }
            }
        }
        if (nHits > 0) { // checks that the pokemon was attacked, and that the damage was not due to recoil or chip damage
            // Item consumption triggered by damage
            // Focus Sash
            if (pokemon.item === "Focus Sash" || pokemon.ability === "Sturdy") {
                if (finalHP <= 0 && originalHP === pokemon.maxHP()) { 
                    pokemon.originalCurHP = 1;
                    if (pokemon.ability !== "Sturdy") { this.loseItem(id); } 
                }
            }

            // Weakness Policy and Super-Effective reducing Berries
            // TO DO - abilities that let users use berries more than once
            if (damage > 0 && isSuperEffective) {
                switch (pokemon.item) {
                    case "Weakness Policy":
                        this.applyStatChange(id, {atk: 2, spa: 2})
                        this.loseItem(id);
                        break;
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
            if (pokemon.item === "Chiban Berry" && moveType === "Normal") {
                this.loseItem(id);
            }
            
            // abilities triggered by damage
            // Anger Point
            if (isCrit && pokemon.ability === "Anger Point") { 
                const boost = {atk: 12};
                this.applyStatChange(id, boost);
            };
            // Justified
            if (moveType === "Dark") {
                if (pokemon.ability === "Justified" && damage>0) { 
                    const boost = {atk: 1};
                    this.applyStatChange(id, boost);
                }
            }    
            // Weak Armor
            if (pokemon.ability === "Weak Armor") {
                const boost = {def: -1, spe: 2};
                this.applyStatChange(id, boost);
            }

            // Electromorphosis
            if (pokemon.ability ===  "Electromorphosis") {
                pokemon.field.attackerSide.isCharged = true;
            }
        }
    }

    public applyStatChange(id: number, boosts: Partial<StatsTable>, copyable: boolean = true): StatsTable {
        const pokemon = this.getPokemon(id);
        const diff = pokemon.applyStatChange(boosts);
        // Mirror Herb and Opportunist
        if (copyable) { // Stat changes that are being copied shouldn't be copied in turn
            const opponentIds = id === 0 ? [1,2,3,4] : [0];
            for (const opponentId of opponentIds) {
                const opponent = this.getPokemon(opponentId);
                if (opponent.item === "Opportunist" || opponent.item === "Mirror Herb")  {
                    const positiveDiff = {...diff};
                    let isPositiveBoost = false;
                    for (const stat in positiveDiff) {
                        const statId = stat as StatIDExceptHP;
                        if (positiveDiff[statId] <= 0) {
                            positiveDiff[statId] = 0;
                        } else {
                            isPositiveBoost = true;
                        }
                    }
                    console.log(positiveDiff, isPositiveBoost)
                    if (isPositiveBoost) {
                        this.applyStatChange(opponentId, positiveDiff, false);
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
                if (pokemon.boosts[statId] < 0) {
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
        if (pokemon.item === "Chesto Berry" && pokemon.status === "slp") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Pecha Berry" && pokemon.status === "psn") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Rawst Berry" && pokemon.status === "brn") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Aspear Berry" && pokemon.status === "frz") { pokemon.status = ""; this.loseItem(id); }
        if (pokemon.item === "Lum Berry" && pokemon.status !== "") { 
            pokemon.status = ""; 
            pokemon.volatileStatus = pokemon.volatileStatus.filter(status => status !== "confusion"); 
            this.loseItem(id); 
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
            this.applyTerrain(pokemon.field.terrain, [id]);
        }
        // Would berries be consumed immediately upon reciept (via Symbiosis, Trick, etc) if their conditions are met?
    }

    public applyTerrain(terrain: Terrain | undefined, ids: number[] = [0,1,2,3,4]) {
        for (let id of ids) {
            const pokemon = this.getPokemon(id);
            pokemon.field.terrain = terrain;
            // Quark Drive
            if (pokemon.ability === "Quark Drive" && !pokemon.usedBoosterEnergy) {
                if (pokemon.field.terrain === "Electric" && !pokemon.abilityOn) {
                    pokemon.abilityOn = true;
                    const statId = getQPBoostedStat(pokemon, gen) as StatIDExceptHP;
                    pokemon.boostedStat = statId;
                } else if (pokemon.field.terrain !== "Electric" && pokemon.abilityOn) {
                    pokemon.abilityOn = false;
                    pokemon.boostedStat = undefined;
                }
            }
            // Terrain Seeds
            if (pokemon.item === "Electric Seed" && pokemon.field.terrain === "Electric") {
                this.applyStatChange(id, {def: 1});
                this.loseItem(id);
            } else if (pokemon.item === "Grassy Seed" && pokemon.field.terrain === "Grassy") {
                this.applyStatChange(id, {def: 1});
                this.loseItem(id);
            } else if (pokemon.item === "Psychic Seed" && pokemon.field.terrain === "Psychic") {
                this.applyStatChange(id, {spd: 1});
                this.loseItem(id);
            } else if (pokemon.item === "Misty Seed" && pokemon.field.terrain === "Misty") {
                this.applyStatChange(id, {spd: 1});
                this.loseItem(id);
            }
        }
    }

    public applyWeather(weather: Weather | undefined, ids: number[] = [0,1,2,3,4]) {
        for (let id of ids) {
            const pokemon = this.getPokemon(id);
            pokemon.field.weather = weather;
            // Protosynthesis
            if (pokemon.ability === "Protosynthesis" && !pokemon.usedBoosterEnergy) {
                if ((pokemon.field.weather || "").includes("Sun") && !pokemon.abilityOn) {
                    pokemon.abilityOn = true;
                    const statId = getQPBoostedStat(pokemon, gen) as StatIDExceptHP;
                    pokemon.boostedStat = statId;
                } else if ((pokemon.field.weather || "").includes("Sun")  && pokemon.abilityOn) {
                    pokemon.abilityOn = false;
                    pokemon.boostedStat = undefined;
                }
            }
        }
    }
}