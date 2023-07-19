import { RaidMoveOptions } from "./interface"

export type LightPokemon = {
    id: number,
    role: string
    name: string,
    ability?: string,
    item?: string,
    nature?: string,
    evs?: {[k: string]: number},
    ivs?: {[k: string]: number},
    level?: number,
    teraType?: string,
    bossMultiplier?: number,
    moves?: string[],
    extraMoves?: string[],
}

export type LightMoveInfo = {
    name: string,
    userID: number,
    targetID: number,
    options?: RaidMoveOptions,
}

export type LightTurnInfo = {
    id: number,
    group?: number,
    moveInfo: LightMoveInfo,
    bossMoveInfo: LightMoveInfo,
}

export type LightBuildInfo = {
    name?: string,
    pokemon: LightPokemon[],
    turns: LightTurnInfo[],
    groups?: number[][],
}

