import { Field, Pokemon, Generations } from "../calc";
import { MoveName, StatsTable, StatIDExceptHP, ItemName } from "../calc/data/interface";
import { extend } from '../calc/util';
import { safeStatStage, modifyPokemonSpeedByAbility, modifyPokemonSpeedByField, modifyPokemonSpeedByItem, modifyPokemonSpeedByQP, modifyPokemonSpeedByStatus } from "./util";
import * as State from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";

const gen = Generations.get(9);

export class Raider extends Pokemon implements State.Raider {
    id: number;
    role: string;
    shiny: boolean;
    field: Field;               // each pokemon gets its own field to deal with things like Helping Hand and Protect
    moveData: State.MoveData[];   
    extraMoves?: MoveName[];    // for special boss actions
    extraMoveData?: State.MoveData[];

    isEndure?: boolean;         // store that a Pokemon can't faint until its next move
    lastMove?: State.MoveData;  // stored for Instruct and Copycat
    lastTarget?: number;        // stored for Instruct and Copycat

    constructor(id: number, role: string, shiny: boolean | undefined, field: Field, pokemon: Pokemon, moveData: State.MoveData[], extraMoves: MoveName[] = [], extraMoveData: State.MoveData[] = [], isEndure: boolean = false, lastMove: State.MoveData | undefined = undefined, lastTarget: number | undefined = undefined) {
        super(pokemon.gen, pokemon.name, {...pokemon})
        this.id = id;
        this.role = role;
        this.shiny = !!shiny;
        this.field = field;
        this.moveData = moveData;
        this.extraMoves = extraMoves;
        this.extraMoveData = extraMoveData;
        this.isEndure = isEndure;
        this.lastMove = lastMove;
        this.lastTarget = lastTarget;
    }

    clone(): Raider {
        return new Raider(
            this.id, 
            this.role, 
            this.shiny,
            this.field.clone(),
            new Pokemon(this.gen, this.name, {
                level: this.level,
                bossMultiplier: this.bossMultiplier,
                statMultipliers: this.statMultipliers,
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
                randomBoosts: this.randomBoosts,
                originalCurHP: this.originalCurHP,
                status: this.status,
                teraType: this.teraType,
                toxicCounter: this.toxicCounter,
                hitsTaken: this.hitsTaken,
                moves: this.moves.slice(),
                overrides: this.species,
            }),
            this.moveData,
            this.extraMoves,
            this.extraMoveData,
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

    public get effectiveSpeed(): number {
        let speed = getModifiedStat(this.stats.spe, this.boosts.spe, gen);
        speed = modifyPokemonSpeedByStatus(speed, this.status, this.ability);
        speed = modifyPokemonSpeedByItem(speed, this.item);
        speed = modifyPokemonSpeedByAbility(speed, this.ability, this.abilityOn, this.status);
        speed = modifyPokemonSpeedByQP(speed, this.field, this.ability, this.item, this.boostedStat as StatIDExceptHP);
        speed = modifyPokemonSpeedByField(speed, this.field);
        return speed;
    }

    public applyDamage(damage: number): number { 
        this.originalCurHP = Math.min(this.maxHP(), Math.max(0, this.originalCurHP - damage));
        if (this.isEndure && this.originalCurHP === 0) {
            this.originalCurHP = 1;
        }
        return this.originalCurHP;
    }

    public applyStatChange(boosts: Partial<StatsTable>): StatsTable {
        const diff: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
        for (let stat in boosts) {
            const statId = stat as StatIDExceptHP;
            const originalStat = this.boosts[statId];
            this.boosts[statId] = safeStatStage(this.boosts[statId] + boosts[statId]! * this.boostCoefficient)
            diff[statId] = this.boosts[statId] - originalStat;
        }
        return diff;
    }

    public loseItem() {
        // Unburden
        if (this.ability === "Unburden" && this.item !== undefined) {
            this.abilityOn = true;
        }
        this.item = undefined;
    }

    

}