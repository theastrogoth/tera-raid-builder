import React, { useState, useEffect, useRef } from "react";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import PokemonSummary from "./PokemonSummary";
import { RaidInputProps } from "../raidcalc/inputs";
import { SubstituteBuildInfo, TurnGroupInfo} from "../raidcalc/interface";
import { Raider } from "../raidcalc/Raider";

function swapGroupRaiderIds(groups: TurnGroupInfo[], firstId: number, secondId: number) {
    return groups.map(group => { 
        const newTurns = group.turns.map(turn => { return (
            {
                id: turn.id,
                group: turn.group,
                moveInfo: {
                    userID: turn.moveInfo.userID === firstId ? secondId : (turn.moveInfo.userID === secondId ? firstId : turn.moveInfo.userID),
                    targetID: turn.moveInfo.targetID === firstId ? secondId : (turn.moveInfo.targetID === secondId ? firstId : turn.moveInfo.targetID),
                    moveData: {...turn.moveInfo.moveData},
                    options: {...turn.moveInfo.options}
                },
                bossMoveInfo: {
                    userID: turn.bossMoveInfo.userID,
                    targetID: turn.bossMoveInfo.targetID === firstId ? secondId : (turn.bossMoveInfo.targetID === secondId ? firstId : turn.bossMoveInfo.targetID),
                    moveData: {...turn.bossMoveInfo.moveData},
                    options: {...turn.bossMoveInfo.options}
                },
            }
        )});
        return ({
            id: group.id,
            turns: newTurns,
            repeats: group.repeats
        })
    });
}

function replaceSubstituteIds(substitutes: SubstituteBuildInfo[], firstId: number, secondId: number) {
    return substitutes.map(substitute => { 
        const newRaider = substitute.raider.clone() as Raider;
        newRaider.id = substitute.raider.id === firstId ? secondId : (substitute.raider.id === secondId ? firstId : substitute.raider.id);
        return ({
            raider: newRaider,
            substituteMoves: substitute.substituteMoves,
            substituteTargets: substitute.substituteTargets.map(target => target === firstId ? secondId : (target === secondId ? firstId : target))
    })});            
}

function RaiderSummaries(
    {raidInputProps, substitutes, groupsCounter, setGroupsCounter, setSubstitutes, allSpecies, allMoves, setAllSpecies, setAllMoves, prettyMode, translationKey}: 
    {raidInputProps: RaidInputProps, substitutes: SubstituteBuildInfo[][], setSubstitutes: ((s: SubstituteBuildInfo[]) => void)[], groupsCounter: number, setGroupsCounter: (c: number) => void, allSpecies: any, allMoves: any, setAllSpecies: any, setAllMoves: any, prettyMode: boolean, translationKey: any}
) {
    const [swapIDs, setSwapIDs] = useState<[number, number] | undefined>(undefined);

    useEffect(() => {
        if (swapIDs !== undefined) {
            const newRaider1 = raidInputProps.pokemon[swapIDs[0]].clone();
            const newRaider2 = raidInputProps.pokemon[swapIDs[1]].clone();
            newRaider1.id = swapIDs[1];
            newRaider2.id = swapIDs[0];

            const newGroups = swapGroupRaiderIds(raidInputProps.groups, swapIDs[0], swapIDs[1]);
            const newSubstitutes1 = replaceSubstituteIds(substitutes[swapIDs[0]-1], swapIDs[0], swapIDs[1]);
            const newSubstitutes2 = replaceSubstituteIds(substitutes[swapIDs[1]-1], swapIDs[1], swapIDs[0]);

            raidInputProps.setPokemon[swapIDs[0]](newRaider2);
            raidInputProps.setPokemon[swapIDs[1]](newRaider1);
            raidInputProps.setGroups(newGroups);
            setSubstitutes[swapIDs[0]-1](newSubstitutes2);
            setSubstitutes[swapIDs[1]-1](newSubstitutes1);

            setSwapIDs(undefined);
            setGroupsCounter(groupsCounter+1);
        }
    }, [swapIDs]);

    return (
    <>
        <Grid item>
            <Stack direction="row">
                <PokemonSummary pokemon={raidInputProps.pokemon[1]} setPokemon={raidInputProps.setPokemon[1]} groups={raidInputProps.groups} setGroups={raidInputProps.setGroups} groupsCounter={groupsCounter} substitutes={substitutes[0]} setSubstitutes={setSubstitutes[0]} allSpecies={allSpecies} allMoves={allMoves} swapIDs={swapIDs} setSwapIDs={setSwapIDs} setAllSpecies={setAllSpecies} setAllMoves={setAllMoves} prettyMode={prettyMode} translationKey={translationKey} />
                <PokemonSummary pokemon={raidInputProps.pokemon[2]} setPokemon={raidInputProps.setPokemon[2]} groups={raidInputProps.groups} setGroups={raidInputProps.setGroups} groupsCounter={groupsCounter} substitutes={substitutes[1]} setSubstitutes={setSubstitutes[1]} allSpecies={allSpecies} allMoves={allMoves} swapIDs={swapIDs} setSwapIDs={setSwapIDs} setAllSpecies={setAllSpecies} setAllMoves={setAllMoves} prettyMode={prettyMode} translationKey={translationKey} />
            </Stack>
        </Grid>
        <Grid item>
            <Stack direction="row">
                <PokemonSummary pokemon={raidInputProps.pokemon[3]} setPokemon={raidInputProps.setPokemon[3]} groups={raidInputProps.groups} setGroups={raidInputProps.setGroups} groupsCounter={groupsCounter} substitutes={substitutes[2]} setSubstitutes={setSubstitutes[2]} allSpecies={allSpecies} allMoves={allMoves} swapIDs={swapIDs} setSwapIDs={setSwapIDs} setAllSpecies={setAllSpecies} setAllMoves={setAllMoves} prettyMode={prettyMode} translationKey={translationKey} />
                <PokemonSummary pokemon={raidInputProps.pokemon[4]} setPokemon={raidInputProps.setPokemon[4]} groups={raidInputProps.groups} setGroups={raidInputProps.setGroups} groupsCounter={groupsCounter} substitutes={substitutes[3]} setSubstitutes={setSubstitutes[3]} allSpecies={allSpecies} allMoves={allMoves} swapIDs={swapIDs} setSwapIDs={setSwapIDs} setAllSpecies={setAllSpecies} setAllMoves={setAllMoves} prettyMode={prettyMode} translationKey={translationKey} />
            </Stack>
        </Grid> 
    </>
    )
}

export default React.memo(RaiderSummaries,
    (prevProps, nextProps) => {
        return prevProps.raidInputProps === nextProps.raidInputProps &&
               prevProps.substitutes === nextProps.substitutes &&
               prevProps.groupsCounter === nextProps.groupsCounter &&
               prevProps.setGroupsCounter === nextProps.setGroupsCounter &&
               prevProps.setSubstitutes === nextProps.setSubstitutes &&
               prevProps.allSpecies === nextProps.allSpecies &&
               prevProps.allMoves === nextProps.allMoves &&
               prevProps.setAllSpecies === nextProps.setAllSpecies &&
               prevProps.setAllMoves === nextProps.setAllMoves &&
               prevProps.prettyMode === nextProps.prettyMode &&
               prevProps.translationKey === nextProps.translationKey;
    }
);