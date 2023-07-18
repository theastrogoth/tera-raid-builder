import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Button from "@mui/material/Button";

import { Pokemon, Generations } from "../calc";
import { RaidBattleInfo, RaidTurnInfo, Raider, RaidState } from "../raidcalc/interface";
import { Field } from "../calc";
import { Hash } from "crypto";

const gen = Generations.get(9);

type BuildInfo = {
    pokemon: Raider[],
    turns: RaidTurnInfo[],
}

function deserializeInfo(hash: string): BuildInfo | null {
    try {
        const obj = deserialize(hash);
        const turns = obj.turns as RaidTurnInfo[];
        console.log(obj)
        //@ts-ignore
        const pokemon = obj.pokemon.map((r) => new Raider(r.id, r.role, 
            new Pokemon(gen, r.name, {
                name: r.name,
                ability: r.ability || undefined,
                item: r.item || undefined,
                nature: r.nature || undefined,
                evs: r.evs || undefined,
                ivs: r.ivs || undefined,
                level: r.level || undefined,
                teraType: r.teraType || undefined,
                bossMultiplier: r.bossMultiplier || undefined,
                moves: r.moves || undefined
            }), 
        r.bossMoves || undefined));
        console.log(turns)
        console.log(pokemon)
        return {pokemon, turns}
    } catch (e) {
        console.log(e)
        return null;
    }
}

function serializeInfo(info: RaidBattleInfo): string {
    const obj: BuildInfo = {
        pokemon: info.startingState.raiders,
        turns: info.turns,
    }
    return serialize(obj);
}

function LinkButton({info, setInfo}: {info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const location = useLocation();
    const hash = location.hash
    useEffect(() => {
        console.log(hash)
        try {
            if (hash !== ""){
                const res = deserializeInfo(hash);
                console.log(res)
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
            console.log(e)
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