import { Pokemon, Field } from "../calc";
import { MoveName } from "../calc/data/interface";

export interface Raider extends Pokemon {
    id: number;
    damageRanges: number[][]; // [min, max] damage ranges for each move
}

export type RaidField = {
    boss: Raider;
    raiders: Raider[];
    fields: Field[];   // each pokemon gets its own field to deal with things like Friend Guard and Protosynthesis
}

export type RaidMoveInfo = {
    userID: number;
    targetID: number;
    userMoveName: MoveName | undefined;
    bossMoveName: MoveName | undefined;
}

export type RaidMoveResult= {
    field: RaidField;
    flags: string[];
}

export type RaidTurnInfo ={
    id: number;
    moveInfo: RaidMoveInfo;
    field: RaidField;
}

export type RaidBattle = {
    startingField: RaidField;
    turns: RaidTurnInfo[];
}