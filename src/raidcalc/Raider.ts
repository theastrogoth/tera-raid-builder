import { Field, Pokemon } from "../calc";
import { MoveName, StatsTable, StatIDExceptHP } from "../calc/data/interface";
import { extend } from '../calc/util';
import { safeStatStage } from "./util";
import * as State from "./interface";

export class Raider extends Pokemon implements State.Raider {
    id: number;
    role: string;
    field: Field;               // each pokemon gets its own field to deal with things like Helping Hand and Protect
    extraMoves?: MoveName[];    // for special boss actions
    isEndure?: boolean;         // store that a Pokemon can't faint until its next move
    lastMove?: State.MoveData;  // stored for Instruct and Copycat
    lastTarget?: number;        // stored for Instruct and Copycat

    constructor(id: number, role: string, field: Field, pokemon: Pokemon, extraMoves: MoveName[] = [], isEndure: boolean = false, lastMove: State.MoveData | undefined = undefined, lastTarget: number | undefined = undefined) {
        super(pokemon.gen, pokemon.name, {...pokemon})
        this.id = id;
        this.role = role;
        this.field = field;
        this.extraMoves = extraMoves;
        this.isEndure = isEndure;
        this.lastMove = lastMove;
        this.lastTarget = lastTarget;
    }

    clone(): Raider {
        return new Raider(
            this.id, 
            this.role, 
            this.field.clone(),
            new Pokemon(this.gen, this.name, {
                level: this.level,
                bossMultiplier: this.bossMultiplier,
                ability: this.ability,
                abilityOn: this.abilityOn,
                isDynamaxed: this.isDynamaxed,
                dynamaxLevel: this.dynamaxLevel,
                isSaltCure: this.isSaltCure,
                alliesFainted: this.alliesFainted,
                boostedStat: this.boostedStat,
                usedBoosterEnergy: this.usedBoosterEnergy,
                item: this.item,
                gender: this.gender,
                nature: this.nature,
                ivs: extend(true, {}, this.ivs),
                evs: extend(true, {}, this.evs),
                boosts: extend(true, {}, this.boosts),
                originalCurHP: this.originalCurHP,
                status: this.status,
                teraType: this.teraType,
                toxicCounter: this.toxicCounter,
                moves: this.moves.slice(),
                overrides: this.species,
            }),
            this.extraMoves,
            this.isEndure,
            this.lastMove,
            this.lastTarget
        )
    }

    public get boostCoefficient(): number {
        const hasSimple = this.ability === "Simple";
        const hasContrary = this.ability === "Contrary";
        return hasSimple ? 2 : hasContrary ? -1 : 1;
    }

    public applyDamage(damage: number): number { 
        this.originalCurHP = Math.max(0, this.originalCurHP - damage);
        return this.originalCurHP;
    }

    public applyStatChange(boosts: StatsTable): StatsTable {
        const diff: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
        for (let stat in boosts) {
            const statId = stat as StatIDExceptHP;
            const originalStat = this.boosts[statId];
            this.boosts[statId] = safeStatStage(this.boosts[statId] + boosts[statId] * this.boostCoefficient)
            diff[statId] = this.boosts[statId] - originalStat;
        }
        return diff;
    }

    public loseItem(): void {
         // Unburden
         if (this.ability === "Unburden" && this.item !== undefined) {
            this.abilityOn = true;
        }
        this.item = undefined;
    }
}