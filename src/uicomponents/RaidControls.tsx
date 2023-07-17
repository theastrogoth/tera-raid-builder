import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import { Raider, RaidState, RaidBattleInfo, RaidTurnInfo } from "../raidcalc/interface";
import { Field } from "../calc";
import { MoveName } from '../calc/data/interface';
import { RaidBattle } from '../raidcalc/RaidBattle';

function RaidControls({raiders}: {raiders: Raider[]}) {
    const [value, setValue] = useState<number>(1);
    const [info, setInfo] = useState<RaidBattleInfo>(
        {
            startingState: new RaidState(raiders, raiders.map((r) => new Field())),
            turns: [0].map((id) => ({
                id: id, 
                moveInfo: {userID: id+1, targetID: 0, options: {crit: false, secondaryEffects: false, roll: "min" }, moveData: {name: "(No Move)" as MoveName}}, 
                bossMoveInfo: {userID: 0, targetID: id+1, options: {crit: false, secondaryEffects: false, roll: "max" }, moveData: {name: "(No Move)" as MoveName}},
            })),
        }
    )

    useEffect(() => {
        setInfo({...info, startingState: new RaidState(raiders, raiders.map((r) => new Field()))})
    }, [raiders])

    const battle = new RaidBattle(info);
    const results = battle.result();

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box width={575} sx={{ mx: 1}}>
            <Box paddingBottom={1}>
                <Tabs value={value} onChange={handleChange} centered>
                    <Tab label="Move Controls" value={1} />
                    <Tab label="Move Calc Results" value={2} />
                </Tabs>
            </Box>
            <Box hidden={value !== 1}>
                <Stack direction="column" spacing={1} >
                    <Box maxHeight={510} sx={{ overflowY: "auto" }}>
                        <MoveSelection info={info} setInfo={setInfo} />
                    </Box>
                </Stack>
            </Box>
            <Box hidden={value !== 2} maxHeight={525} sx={{ overflowY: "auto" }}>
                <RaidResults results={results} />
            </Box>
        </Box>
    )
}

export default RaidControls;