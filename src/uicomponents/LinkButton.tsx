import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Button from "@mui/material/Button";

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { RaidInputProps, BuildInfo } from "../raidcalc/inputs";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";
import { Raider } from "../raidcalc/Raider";
import { RaidState } from "../raidcalc/RaidState";
import { RaidBattleInfo } from "../raidcalc/RaidBattle";

import PokedexService from "../services/getdata";
import { RaidTurnInfo } from "../raidcalc/interface";


const gen = Generations.get(9);

export async function deserializeInfo(hash: string): Promise<BuildInfo | null> {
    try {
        const obj = deserialize(hash);
        return await lightToFullBuildInfo(obj);
    } catch (e) {
        return null;
    }
}

export async function lightToFullBuildInfo(obj: LightBuildInfo): Promise<BuildInfo | null> {
    try {
        const pokemon = await Promise.all((obj.pokemon as LightPokemon[]).map(async (r) => new Raider(r.id, r.role, new Field(), 
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
            (r.moves ? (await Promise.all(r.moves.map((m) => PokedexService.getMoveByName(m)))).map((md, index) => md || {name: r.moves![index] as MoveName, target: "user"} ) : []),
            (r.extraMoves || undefined) as (MoveName[] | undefined),
            (r.extraMoves ? (await Promise.all(r.extraMoves.map((m) => PokedexService.getMoveByName(m)))).map((md, index) => md || {name: r.moves![index] as MoveName, target: "user"} ) : []),
        )));
        const turns: RaidTurnInfo[] = [];
        for (let t of obj.turns as LightTurnInfo[]) {
            const mdata = pokemon[t.moveInfo.userID].moveData.find((m) => m && m.name === t.moveInfo.name);
            const bmdata = pokemon[0].moveData.find((m) => m && m.name === t.bossMoveInfo.name);
            
            const turn = {
                id: t.id,
                group: t.group,
                moveInfo: {
                    userID: t.moveInfo.userID, 
                    targetID: t.moveInfo.targetID, 
                    options: t.moveInfo.options, 
                    moveData: mdata || {name: t.moveInfo.name as MoveName}
                },
                bossMoveInfo: {
                    userID: t.bossMoveInfo.userID,
                    targetID: t.bossMoveInfo.targetID,
                    options: t.bossMoveInfo.options,
                    moveData: bmdata || {name: t.bossMoveInfo.name as MoveName}
                },
            };
            turns.push(turn);
        };
        const groups = obj.groups || [];
        const name = obj.name || "";
        const notes = obj.notes || "";
        const credits = obj.credits || "";

        return {name, notes, credits, pokemon, turns, groups}
    } catch (e) {
        return null;
    }
}

function serializeInfo(info: RaidBattleInfo): string {
    const obj: LightBuildInfo = {
        name: info.name || "",
        notes: info.notes || "",
        credits: info.credits || "",
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
    console.log(obj); // for developer use
    return serialize(obj);
}

function LinkButton({title, notes, credits, raidInputProps, setTitle, setNotes, setCredits, setPrettyMode}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, 
      setTitle: (t: string) => void, setNotes: (t: string) => void, setCredits: (t: string) => void, 
      setPrettyMode: (p: boolean) => void}) {
    const [buildInfo, setBuildInfo] = useState(null);
    const [hasLoadedInfo, setHasLoadedInfo] = useState(false);
    const location = useLocation();
    const hash = location.hash

    useEffect(() => {
        try {
            if (hash !== "") {
                let lcHash = hash.includes('/') ? hash.slice(1).toLowerCase() : hash.slice(1).toLowerCase() + "/main";
                import(`../data/strats/${lcHash}.json`)
                .then((module) => {
                    setBuildInfo(module.default);
                })
                .catch((error) => {
                    console.error('Error importing JSON file:', error);
                });
            }
        } catch (e) {
            console.log(e);
        }
    }, [hash]);

    useEffect(() => {
        async function loadInfo() {
            try {
                let res: BuildInfo | null = null;
                if (buildInfo) {
                    res = await lightToFullBuildInfo(buildInfo);
                } else {
                    res = await deserializeInfo(hash);
                }
                if (res) {
                    const {name, notes, credits, pokemon, turns, groups} = res;
                    setTitle(name);
                    setNotes(notes);
                    setCredits(credits);
                    raidInputProps.setPokemon[0](pokemon[0]);
                    raidInputProps.setPokemon[1](pokemon[1]);
                    raidInputProps.setPokemon[2](pokemon[2]);
                    raidInputProps.setPokemon[3](pokemon[3]);
                    raidInputProps.setPokemon[4](pokemon[4]);
                    raidInputProps.setTurns(turns);
                    raidInputProps.setGroups(groups);
                    setHasLoadedInfo(true);
                }
            } catch (e) {
                console.log(e);
            }
        }
        loadInfo().catch((e) => console.log(e));
    }, [buildInfo]);

    useEffect(() => {
        if (hasLoadedInfo) {
            setPrettyMode(true);
            setHasLoadedInfo(false);
        }
    }, [hasLoadedInfo]);

    return (
        <Button
            variant="outlined"
            onClick={() => {
                const link = window.location.href.split("#")[0] + "#" + serializeInfo({
                    name: title,
                    notes: notes,
                    credits: credits,
                    startingState: new RaidState(raidInputProps.pokemon),
                    turns: raidInputProps.turns,
                    groups: raidInputProps.groups,
                });
                navigator.clipboard.writeText(link)
            }}
        >
            Copy Link to this Build!
        </Button>
    )
}

export default LinkButton;