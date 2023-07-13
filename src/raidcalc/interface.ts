import { Pokemon, Field } from "../calc";

export interface Raider extends Pokemon {
    id: number;
    damageRanges: number[][]; // [min, max] damage ranges for each move
}

export type RaidField = {
    boss: Raider;
    raiders: Raider[];
    field: Field;
}