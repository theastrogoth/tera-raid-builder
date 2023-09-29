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
import { Typography } from '@mui/material';


const raidcalcWorker = new Worker(new URL("../workers/raidcalc.worker.ts", import.meta.url));

const HpBar = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: "#30B72D",
    },
}));

function HpDisplay({role, curhp, maxhp}: {role: string, curhp: number, maxhp: number}) {
    const hpPercent = curhp / maxhp * 100;
    const color = (hpPercent > 50 ? "#30B72D" : hpPercent >= 20 ? "#F1C44F" : "#EC5132");
    return (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: "100%" }}>
            <Box sx={{ width: 125 }}>
                <Stack direction="row">
                    <Box flexGrow={1}/>
                    <Typography>
                        {role}
                    </Typography>
                </Stack>
            </Box>
            <Box sx={{ width: "100%" }}>
                <HpBar 
                    sx={{
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                        }
                    }}
                    variant="determinate" 
                    value={hpPercent} 
                />
            </Box>
            <Box sx={{ width: 150 }}>
                <Typography>
                    {`${curhp}` + " / " + `${maxhp}`}
                </Typography>
            </Box>
        </Stack>
    );
}

function RaidControls({raidInputProps, results, setResults, prettyMode}: {raidInputProps: RaidInputProps, results: RaidBattleResults, setResults: (r: RaidBattleResults) => void, prettyMode: boolean}) {
    const [value, setValue] = useState<number>(1);
    const groups = raidInputProps.groups;
    const boss = raidInputProps.pokemon[0];
    const pokemon1 = raidInputProps.pokemon[1];
    const pokemon2 = raidInputProps.pokemon[2];
    const pokemon3 = raidInputProps.pokemon[3];
    const pokemon4 = raidInputProps.pokemon[4];

    const currenthps = results.endState.raiders.map((raider) => raider.originalCurHP);
    const maxhps = results.endState.raiders.map((raider) => ( raider.maxHP === undefined ? new Pokemon(9, raider.name, {...raider}).maxHP() : raider.maxHP()) );

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
                    <Stack direction="column" spacing={1} >
                        <Box sx={{ height: 560, overflowY: "auto" }}>
                            {!prettyMode &&
                                <MoveSelection raidInputProps={raidInputProps} />
                            }
                            {prettyMode &&
                                <MoveDisplay groups={raidInputProps.groups} raiders={raidInputProps.pokemon} results={results}/>
                            }
                        </Box>
                    </Stack>
                </Box>
                <Box hidden={value !== 2} sx={{ height: 560, overflowY: "auto" }}>
                    <RaidResults results={results} />
                </Box>
                <Stack spacing={1.5} sx={{marginTop: 2}}>
                    <HpDisplay role={raidInputProps.pokemon[0].role} curhp={currenthps[0]} maxhp={maxhps[0]} />
                    <HpDisplay role={raidInputProps.pokemon[1].role} curhp={currenthps[1]} maxhp={maxhps[1]} />
                    <HpDisplay role={raidInputProps.pokemon[2].role} curhp={currenthps[2]} maxhp={maxhps[2]} />
                    <HpDisplay role={raidInputProps.pokemon[3].role} curhp={currenthps[3]} maxhp={maxhps[3]} />
                    <HpDisplay role={raidInputProps.pokemon[4].role} curhp={currenthps[4]} maxhp={maxhps[4]} />
                </Stack>
            </Stack>
        </Box>
    )
}

export default React.memo(RaidControls);