import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Button from "@mui/material/Button";

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { RaidBattleInfo, RaidTurnInfo, Raider, RaidState, RaidMoveOptions, MoveData } from "../raidcalc/interface";



const gen = Generations.get(9);

type LightPokemon = {
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

type LightMoveInfo = {
    name: string,
    userID: number,
    targetID: number,
    options?: RaidMoveOptions,
}

type LightTurnInfo = {
    id: number,
    moveInfo: LightMoveInfo,
    bossMoveInfo: LightMoveInfo,
}

type LightBuildInfo = {
    pokemon: LightPokemon[],
    turns: LightTurnInfo[],
}

type BuildInfo = {
    pokemon: Raider[],
    turns: RaidTurnInfo[],
}


function deserializeInfo(hash: string): BuildInfo | null {
    try {
        const obj = deserialize(hash);
        const pokemon = (obj.pokemon as LightPokemon[]).map((r) => new Raider(r.id, r.role, 
            new Pokemon(gen, r.name, {
                ability: r.ability || undefined,
                item: r.item || undefined,
                nature: r.nature || undefined,
                evs: r.evs || undefined,
                ivs: r.ivs || undefined,
                level: r.level || undefined,
                teraType: (r.teraType || undefined) as (TypeName | undefined),
                bossMultiplier: r.bossMultiplier || undefined,
                moves: r.moves || undefined
            }), 
        (r.extraMoves || undefined) as (MoveName[] | undefined)));
        const turns = (obj.turns as LightTurnInfo[]).map((t) => {
            return {
                id: t.id,
                moveInfo: {
                    userID: t.moveInfo.userID, 
                    targetID: t.moveInfo.targetID, 
                    options: t.moveInfo.options, 
                    moveData: {name: t.moveInfo.name as MoveName}
                },
                bossMoveInfo: {
                    userID: t.bossMoveInfo.userID,
                    targetID: t.bossMoveInfo.targetID,
                    options: t.bossMoveInfo.options,
                    moveData: {name: t.bossMoveInfo.name as MoveName}
                },
            }
        });

        return {pokemon, turns}
    } catch (e) {
        return null;
    }
}

function serializeInfo(info: RaidBattleInfo): string {
    const obj: LightBuildInfo = {
        pokemon: info.startingState.raiders.map(
            (r) => { return {
                id: r.id,
                role: r.role,
                name: r.name,
                ability: r.ability,
                item: r.item,
                nature: r.nature,
                evs: r.evs,
                ivs: r.ivs,
                level: r.level,
                teraType: r.teraType,
                moves: r.moves,
                extraMoves: r.extraMoves,
            }}
        ),
        turns: info.turns.map((t) => {
            return {
                id: t.id,
                moveInfo: {
                    name: t.moveInfo.moveData.name,
                    userID: t.moveInfo.userID,
                    targetID: t.moveInfo.targetID,
                    options: t.moveInfo.options,
                },
                bossMoveInfo: {
                    name: t.bossMoveInfo.moveData.name,
                    userID: t.bossMoveInfo.userID,
                    targetID: t.bossMoveInfo.targetID,
                    options: t.bossMoveInfo.options,
                }
            }
        }),
    }
    return serialize(obj);
}

function LinkButton({info, setInfo}: {info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const location = useLocation();
    const hash = location.hash
    useEffect(() => {
        try {
            if (hash !== ""){
                const res = deserializeInfo(hash);
                if (res) {
                    const {pokemon, turns} = res;
                    const startingState = new RaidState(pokemon, pokemon.map((r) => new Field()));
                    setInfo({
                        startingState: startingState,
                        turns: turns,
                    })
                }
            }
        } catch (e) {
        }
    }, []);

    return (
        <Button
            variant="outlined"
            onClick={() => {
                const link = window.location.href.split("#")[0] + "#" + serializeInfo(info);
                navigator.clipboard.writeText(link)
            }}
        >
            Copy Link to this Build!
        </Button>
    )
}

export default LinkButton;