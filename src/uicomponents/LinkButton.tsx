import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Button from "@mui/material/Button";

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { RaidBattleInfo, Raider, RaidState, BuildInfo } from "../raidcalc/interface";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";

import delphox from "../data/official_strats/delphox.json"

const OFFICIAL_STRATS = {
    "delphox": delphox as LightBuildInfo,
}

const gen = Generations.get(9);

function deserializeInfo(hash: string): BuildInfo | null {
    try {
        const obj = deserialize(hash);
        return lightToFullBuildInfo(obj);
    } catch (e) {
        return null;
    }
}

function lightToFullBuildInfo(obj: LightBuildInfo): BuildInfo | null {
    try {
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
                group: t.group,
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
        const groups = obj.groups || [];
        const name = obj.name || "";

        console.log("obj", obj)

        return {name, pokemon, turns, groups}
    } catch (e) {
        return null;
    }
}

function serializeInfo(info: RaidBattleInfo): string {
    const obj: LightBuildInfo = {
        name: info.name || "",
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
                bossMultiplier: r.bossMultiplier,
                extraMoves: r.extraMoves,
            }}
        ),
        turns: info.turns.map((t) => {
            return {
                id: t.id,
                group: t.group,
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
        groups: info.groups || [],
    }
    return serialize(obj);
}

function LinkButton({info, setInfo}: {info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const location = useLocation();
    const hash = location.hash
    useEffect(() => {
        try {
            let res: BuildInfo | null = null;
            if (hash !== ""){
                const lcHash = hash.slice(1).toLowerCase();
                //@ts-ignore
                if (OFFICIAL_STRATS[lcHash] !== undefined) {
                    //@ts-ignore
                    res = lightToFullBuildInfo(OFFICIAL_STRATS[lcHash])
                } else {
                    res = deserializeInfo(hash);
                }
                if (res) {
                    const {name, pokemon, turns, groups} = res;
                    const startingState = new RaidState(pokemon, pokemon.map((r) => new Field()));
                    setInfo({
                        name: name,
                        startingState: startingState,
                        turns: turns,
                        groups: groups,
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