import { RaidMoveOptions, ShieldData } from "./interface"

export type LightPokemon = {
    id: number,
    role: string,
    name: string,
    shiny?: boolean,
    ability?: string,
    item?: string,
    nature?: string,
    evs?: {[k: string]: number},
    ivs?: {[k: string]: number},
    level?: number,
    gender?: string,
    teraType?: string,
    bossMultiplier?: number,
    moves?: string[],
    extraMoves?: string[],
    shieldData?: ShieldData,
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

export type LightSubstituteBuildInfo = {
    raider: LightPokemon,
    substituteMoves: string[],
    substituteTargets: number[],
}

export type LightBuildInfo = {
    name?: string,
    notes?: string,
    credits?: string,
    pokemon: LightPokemon[],
    turns: LightTurnInfo[],
    groups?: number[][],
    repeats?: number[],
    substitutes?: LightSubstituteBuildInfo[][]
}

