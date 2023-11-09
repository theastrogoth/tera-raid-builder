import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import styled from '@mui/material/styles/styled';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import MoveDisplay from './MoveDisplay';
import { RaidInputProps } from "../raidcalc/inputs";
import { RaidBattleResults } from "../raidcalc/RaidBattle";
import { Pokemon } from '../calc';
import { Slider, Typography } from '@mui/material';
import { getPokemonSpriteURL, getTeraTypeIconURL } from "../utils";


const raidcalcWorker = new Worker(new URL("../workers/raidcalc.worker.ts", import.meta.url));

const HpBar = styled(LinearProgress)(({ theme }) => ({
    height: 8,
    borderRadius: 4,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 4,
      backgroundColor: "#30B72D",
    },
}));

function HpDisplayLine({role, name, curhp, lasthp, maxhp, kos}: {role: string, name: string, curhp: number, lasthp: number, maxhp: number, kos: number}) {
    const hpPercent = curhp / maxhp * 100;
    const lasthpPercent = lasthp / maxhp * 100;
    const color = (hpPercent > 50 ? "#30B72D" : hpPercent >= 20 ? "#F1C44F" : "#EC5132");
    return (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: "100%" }}>
            <Box sx={{ width: 200 }}>
                <Stack direction="row">
                    <Box flexGrow={1}/>
                    <Typography>
                        {role}
                    </Typography>
                    <Box
                        sx={{
                            width: "18px",
                            height: "18px",
                            margin: "0px 8px",
                            overflow: 'hidden',
                            background: `url(${getPokemonSpriteURL(name)}) no-repeat center center / contain`,
                        }}
                    />
                </Stack>
            </Box>
            <Box sx={{ width: "100%" , position: "relative"}}>
                
                <HpBar 
                    sx={{
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                        },
                        opacity: "100%",
                        position: "absolute",
                        width: "100%"
                    }}
                    variant="determinate" 
                    value={hpPercent} 
                />
                {(hpPercent !== lasthpPercent) && <HpBar 
                    sx={{
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: "#000000",
                        },
                        opacity: "10%",
                        position: "absolute",
                        width: "100%"
                    }}
                    variant="determinate" 
                    value={lasthpPercent} 
                />
                }
            </Box>
            <Box sx={{ width: 150 }}>
                <Typography>
                    { curhp + " / " + maxhp }
                </Typography>
            </Box>
            <Box sx={{ width: 75 }}>
                <Typography>
                    {kos > 0 ? ( kos  + (kos > 1 ? " KOs" : " KO")) : ""}
                </Typography>
            </Box>
        </Stack>
    );
}

function HpDisplay({results}: {results: RaidBattleResults}) {
    const [displayedTurn, setDisplayedTurn] = useState<number>(0);
    const [snapToEnd, setSnapToEnd] = useState<boolean>(true);
    const maxhps = results.endState.raiders.map((raider) => ( raider.maxHP === undefined ? new Pokemon(9, raider.name, {...raider}).maxHP() : raider.maxHP()) );
    
    const turnState = (displayedTurn === 0 || displayedTurn > results.turnResults.length) ? results.endState : results.turnResults[Math.min(results.turnResults.length, displayedTurn) - 1].state;
    const lastTurnState = (displayedTurn <= 1 || displayedTurn > results.turnResults.length) ? results.endState: results.turnResults[Math.min(results.turnResults.length, displayedTurn) - 2].state;
    const currenthps = displayedTurn === 0 ? maxhps : turnState.raiders.map((raider) => raider.originalCurHP); 
    const lasthps = displayedTurn <= 1 ? maxhps : lastTurnState.raiders.map((raider) => raider.originalCurHP);

    const koCounts = [0,1,2,3,4].map((i) => results.turnResults.slice(0,displayedTurn).reduce((kos, turn, idx) => 
            kos + ((turn.state.raiders[i].originalCurHP === 0 && (i === 0 || turn.moveInfo.userID === i)) ? 1 : 0),
        0));
    koCounts[0] = Math.min(koCounts[0], 1);
    const roles = results.endState.raiders.map((raider) => raider.role);
    const names = results.endState.raiders.map((raider) => raider.name);

    const currentRaiderRole = displayedTurn === 0 ? roles[0] : roles[results.turnResults[displayedTurn - 1].moveInfo.userID];
    const currentRaiderMove = (displayedTurn === 0 || results.turnResults[displayedTurn - 1].raiderMoveUsed === "(No Move)") ? "" : currentRaiderRole + " used " + results.turnResults[displayedTurn - 1].raiderMoveUsed;
    const currentBossMove = (displayedTurn === 0 || results.turnResults[displayedTurn - 1].bossMoveUsed === "(No Move)") ? "" : roles[0] + " used " + results.turnResults[displayedTurn - 1].bossMoveUsed;
    const currentActions = (currentRaiderMove && currentBossMove) ? currentRaiderMove + " : " + currentBossMove : (!currentRaiderMove && !currentBossMove) ? "No Moves Used": currentRaiderMove + currentBossMove;

    useEffect(() => { 
        if (snapToEnd || displayedTurn > results.turnResults.length) {
            setDisplayedTurn(results.turnResults.length);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results.turnResults.length]);

    useEffect(() => {
        if (displayedTurn === results.turnResults.length) {
            setSnapToEnd(true);
        } else {
            setSnapToEnd(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayedTurn]);

    return (
        <Stack spacing={1} sx={{marginBottom: 2}}>
            <HpDisplayLine role={roles[0]} name={names[0]} curhp={currenthps[0]} lasthp={lasthps[0]} maxhp={maxhps[0]} kos={koCounts[0]} />
            <HpDisplayLine role={roles[1]} name={names[1]} curhp={currenthps[1]} lasthp={lasthps[1]} maxhp={maxhps[1]} kos={koCounts[1]} />
            <HpDisplayLine role={roles[2]} name={names[2]} curhp={currenthps[2]} lasthp={lasthps[2]} maxhp={maxhps[2]} kos={koCounts[2]} />
            <HpDisplayLine role={roles[3]} name={names[3]} curhp={currenthps[3]} lasthp={lasthps[3]} maxhp={maxhps[3]} kos={koCounts[3]} />
            <HpDisplayLine role={roles[4]} name={names[4]} curhp={currenthps[4]} lasthp={lasthps[4]} maxhp={maxhps[4]} kos={koCounts[4]} />
            <Stack direction="column" justifyContent="center" alignItems="center">
                <Typography fontSize={10} noWrap={true}>
                    {currentActions}
                </Typography>
                <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ width: "100%" }}>
                    <Box sx={{ width: 115 }}>
                        <Stack direction="row">
                            <Box flexGrow={1}/>
                            <Typography>
                                {displayedTurn === 0 ? "Battle Start" : "Turn " + displayedTurn}
                            </Typography>
                        </Stack>
                    </Box>
                    <Slider 
                        value={displayedTurn}
                        onChange={(event, newValue) => setDisplayedTurn(newValue as number)}
                        step={1}
                        marks
                        min={0}
                        max={results.turnResults.length}
                    />
                    <Box sx={{ width: 50 }} />
                </Stack>
            </Stack>
        </Stack>
    )
}

function RaidControls({raidInputProps, results, setResults, prettyMode}: {raidInputProps: RaidInputProps, results: RaidBattleResults, setResults: (r: RaidBattleResults) => void, prettyMode: boolean}) {
    const [value, setValue] = useState<number>(1);
    const groups = raidInputProps.groups;
    const boss = raidInputProps.pokemon[0];
    const pokemon1 = raidInputProps.pokemon[1];
    const pokemon2 = raidInputProps.pokemon[2];
    const pokemon3 = raidInputProps.pokemon[3];
    const pokemon4 = raidInputProps.pokemon[4];
    
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };  

    useEffect(() => {
        raidcalcWorker.onmessage = (event: MessageEvent<RaidBattleResults>) => {
            if (event && event.data) {
                setResults(event.data);
            }
        }
    }, [setResults]);

    useEffect(() => {
        const info = {
            raiders: raidInputProps.pokemon,
            groups: raidInputProps.groups,
        }
        raidcalcWorker
            .postMessage(info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups, 
        boss, 
        pokemon1, 
        pokemon2, 
        pokemon3, 
        pokemon4
      ]
    );

    return (
        <Box width={610} sx={{ mx: 1}}>
            <Stack>
                <Box paddingBottom={1}>
                    <Tabs value={value} onChange={handleChange} centered>
                        <Tab label="Move Order" value={1} />
                        <Tab label="Calc Results" value={2} />
                    </Tabs>
                </Box>
                <Box hidden={value !== 1}>
                    <HpDisplay results={results} />
                </Box>
                <Box hidden={value !== 1}>
                    <Box sx={{ height: 560, overflowY: "auto" }}>
                        {!prettyMode &&
                            <MoveSelection raidInputProps={raidInputProps} />
                        }
                        {prettyMode &&
                            <MoveDisplay groups={raidInputProps.groups} raiders={raidInputProps.pokemon} results={results}/>
                        }
                    </Box>
                </Box>
                <Box hidden={value !== 2} sx={{ height: 560, overflowY: "auto" }}>
                    <RaidResults results={results} />
                </Box>
            </Stack>
        </Box>
    )
}

export default React.memo(RaidControls);