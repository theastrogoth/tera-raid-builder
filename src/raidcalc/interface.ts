import { Pokemon, Field, StatID } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import {toID, extend, assignWithout} from '../calc/util';


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

export class Raider extends Pokemon {
    id: number;
    role: string;
    extraMoves?: MoveName[];// for special boss actions
    isEndure?: boolean;     // store that a Pokemon can't faint until its next move
    lastMove?: MoveData;    // stored for Instruct and Copycat
    lastTarget?: number;    // stored for Instruct and Copycat

    constructor(id: number, role: string, pokemon: Pokemon, extraMoves: MoveName[] = [], isEndure: boolean = false, lastMove: MoveData | undefined = undefined, lastTarget: number | undefined = undefined) {
        super(pokemon.gen, pokemon.name, {...pokemon})
        this.id = id;
        this.role = role;
        this.extraMoves = extraMoves;
        this.isEndure = isEndure;
        this.lastMove = lastMove;
        this.lastTarget = lastTarget;
    }

    clone() {
        return new Raider(
            this.id, 
            this.role, 
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
}

export class RaidState {
    raiders: Raider[]; // raiders[0] is the boss, while raiders 1-5 are the players
    fields: Field[];   // each pokemon gets its own field to deal with things like Friend Guard and Protosynthesis

    constructor(raiders: Raider[], fields: Field[]) {
        this.raiders = raiders;
        this.fields = fields;
    }

    clone() {
        return new RaidState(
            this.raiders.map(raider => raider.clone()), 
            this.fields.map(field => field.clone()));
    }
}

export type RaidBattleInfo = {
    startingState: RaidState;
    turns: RaidTurnInfo[];
    groups: number[][];
}

export type RaidBattleResults = {
    endState: RaidState;
    turnResults: RaidTurnResult[]; 
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

export type RaidMoveResult= {
    state: RaidState;
    userID: number;
    targetID: number;
    damage: number[];
    drain: number[];
    healing: number[];
    eot: ({damage: number, texts: string[]} | undefined)[];
    desc: string[];
    flags: string[][];
}

export type RaidTurnResult = {
    state: RaidState;
    results: [RaidMoveResult, RaidMoveResult];
    raiderMovesFirst: boolean;
}

export type BuildInfo = {
    pokemon: Raider[],
    turns: RaidTurnInfo[],
    groups: number[][],
}