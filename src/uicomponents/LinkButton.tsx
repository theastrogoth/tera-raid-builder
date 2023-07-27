import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Button from "@mui/material/Button";

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { RaidBattleInfo, Raider, RaidState, BuildInfo, RaidTurnInfo, RaidInputProps } from "../raidcalc/interface";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";

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
    }, []);

    useEffect(() => {
        try {
            let res: BuildInfo | null = null;
            if (buildInfo) {
                res = lightToFullBuildInfo(buildInfo);
            } else {
                res = deserializeInfo(hash);
            }
            if (res) {
                const {name, notes, credits, pokemon, turns, groups} = res;
                const startingState = new RaidState(pokemon, pokemon.map((r) => new Field()));
                // setInfo({
                //     name: name,
                //     notes: notes,
                //     credits: credits,
                //     startingState: startingState,
                //     turns: turns,
                //     groups: groups,
                // })
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
                    startingState: new RaidState(raidInputProps.pokemon, [new Field(), new Field(), new Field(), new Field(), new Field()]),
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