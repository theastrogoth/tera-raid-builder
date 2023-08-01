import { Pokemon, Field, StatID } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";

export type MoveSetItem = {
    name: MoveName,
    method: string,
    type: TypeName,
}

export type MoveCategory =   "net-good-stats" |         // stat changes (e.g. Screech, Swords Dance)
                             "whole-field-effect" |     // weather, terrain, gravity, etc.
                             "damage+ailment" |         // (e.g. Fire Blast, Blizzard)
                             "damage" |                 // (e.g. Tackle)
                             "unique" |                 // lots of things that don't neatly fit into other categories
                             "damage+lower" |           // damage + stat changes to target (e.g. Play Rough)
                             "ailment" |                // status condition (e.g. Thunder Wave) 
                             "damage+raise" |           // damage + stat changes to user (e.g. Close Combat)
                             "heal" |                   // restore HP (e.g. Recover, Heal Pulse)
                             "ohko" |                   // not going to implement for Tera Raids
                             "field-effect" |           // half-field effects (e.g. Reflect, Tailwind)
                             "damage+heal" |            // damage + restore HP (e.g. Drain Punch)
                             "swagger" |                // ailment and stat change for target (e.g. Swagger, Flatter)
                             "force-switch";            // not going to implement for Tera Raids

export type MoveTarget = "all-opponents" |              // Target
                         "entire-field" |               
                         "selected-pokemon" |           // Target
                         "user" |                       // Self
                         "random-opponent" |            // Target
                         "all-other-pokemon" |          // Target (Allies aren't affected in raids)
                         "all-pokemon" |                
                         "selected-pokemon-me-first" |  
                         "all-allies" |                 
                         "users-field" |    
                         "specific-move" |
                         "opponents-field" |
                         "user-and-allies" |            // Some healing moves, Heal Cheer
                         "ally" |
                         "user-or-ally" |
                         "fainting-pokemon";

export type AilmentName =   "confusion" |               // many of these are not implemented by smogon/calcs
                            "torment" |                 
                            "poison" |
                            "freeze" |
                            "burn" |
                            "paralysis" |
                            "sleep" |
                            "unknown" |
                            "heal-block" |
                            "trap" |
                            "nightmare" |
                            "disable" |
                            "silence" |
                            "yawn" |
                            "leech-seed" |
                            "no-type-immunity" |
                            "perish-song" |
                            "ingrain" |
                            "tar-shot" |
                            "embargo" |
                            "infatuation" |
                            "toxic" |
                            "encore" |
                            "taunt";

export type MoveData = {
    name:           MoveName
    category?:      MoveCategory,
    target?:        MoveTarget,
    type?:          TypeName,
    power?:         number,
    accuracy?:      number,
    priority?:      number,
    drain?:         number,
    healing?:       number,
    selfDamage?:    number,
    ailment?:       AilmentName,
    statChanges?:   {stat: StatID, change: number}[],
    flinchChance?:  number,
    statChance?:    number,
    ailmentChance?: number,
    minHits?:       number,
    maxHits?:       number,
}

export interface Raider extends Pokemon {
    id: number;
    role: string;
    field: Field;
    extraMoves?: MoveName[];// for special boss actions
    isEndure?: boolean;     // store that a Pokemon can't faint until its next move
    lastMove?: MoveData;    // stored for Instruct and Copycat
    lastTarget?: number;    // stored for Instruct and Copycat
}

export interface RaidState {
    raiders: Raider[]; // raiders[0] is the boss, while raiders 1-4 are the players
}

export type RaidMoveOptions = {
    crit?: boolean;
    secondaryEffects?: boolean;
    hits?: number;
    roll?: "max" | "min" | "avg"
}

export type RaidMoveInfo = {
    userID: number;
    targetID: number;
    moveData: MoveData;
    options?: RaidMoveOptions;
}

export type RaidTurnInfo ={
    id: number;
    group?: number;
    moveInfo: RaidMoveInfo;
    bossMoveInfo: RaidMoveInfo;
}
