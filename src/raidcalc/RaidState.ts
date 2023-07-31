import { Field, Generations, Move, StatsTable } from "../calc";
import { Raider } from "./Raider";
import { getModifiedStat } from "../calc/mechanics/util";
import { safeStatStage } from "./util";
import * as State from "./interface";
import { StatIDExceptHP } from "../calc/data/interface";

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

    public applyDamage(id: number, move: Move, damage: number) {
        if (damage <= 0) { return; }
        const pokemon = this.getPokemon(id);
        const originalHP = pokemon.originalCurHP;
        pokemon.applyDamage(damage);
        const finalHP = pokemon.originalCurHP;
        // abilities triggered by damage
        // Anger Point
        if (pokemon.ability === "Anger Point") { pokemon.boosts.atk = 6 };
        // Justified
        if (move.type === "Dark") {
            if (pokemon.ability === "Justified" && damage>0) { 
                const boost = {atk: 1};
                pokemon.boosts.atk = safeStatStage(pokemon.boosts.atk + move.hits); 
            }
        }    
        // Weak Armor
        if (pokemon.ability === "Weak Armor") {
            pokemon.boosts.def = safeStatStage(pokemon.boosts.def - 1);
            pokemon.boosts.spe = safeStatStage(pokemon.boosts.spe + 2);
        }

        // Electromorphosis
        if (pokemon.ability ===  "Electromorphosis") {
            pokemon.field.attackerSide.isCharged = true;
        }
        // Item consumption triggered by damage

    }

    public applyStatChange(id: number, boosts: StatsTable): StatsTable {
        const pokemon = this.getPokemon(id);
        const originalStats = {...pokemon.boosts} as StatsTable;
        const diff = pokemon.applyStatChange(boosts);
        // Mirror Herb
        const opponentIds = id === 0 ? [1,2,3,4] : [0];
        for (const opponentId of opponentIds) {
            const opponent = this.getPokemon(opponentId);
            if (opponent.item === "Mirror Herb") {
                this.loseItem(opponentId);
                this.applyStatChange(opponentId, diff);
            }
        }
        return diff;
    }

    public loseItem(id: number) {
        const pokemon = this.getPokemon(id);
        pokemon.loseItem();
        // Unburden
        if (pokemon.ability === "Unburden" && 
            pokemon.item === undefined && 
            pokemon.item !== undefined) 
        {
            pokemon.abilityOn = true;
        }
        // Symbiosis
        let lostItemId = -1;
        for (let i=0; i<5; i++) {
            if (pokemon.item === undefined && pokemon.item !== undefined) {
                lostItemId = i;
                break;
            }
        }
        if (lostItemId >=0) {
            const lostItemPokemon = this.getPokemon(lostItemId);
            const symbiosisIds: number[] = []
            for (let id=0; id<5; id++) {
                if (id !== lostItemId && this.getPokemon(id).ability === "Symbiosis" && this.getPokemon(id).item !== undefined) {
                    symbiosisIds.push(id);
                }
            }
            if (symbiosisIds.length > 0) {
                // speed check for symbiosis
                let fastestSymbId = symbiosisIds[0];
                let fastestSymbPoke = this.getPokemon(fastestSymbId);
                let fastestSymbSpeed = getModifiedStat(fastestSymbPoke.stats.spe, fastestSymbPoke.boosts.spe, gen);
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
                lostItemPokemon.item = fastestSymbPoke.item;
                fastestSymbPoke.item = undefined;
            }
        }
    }
}