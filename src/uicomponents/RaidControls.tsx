import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import { Raider, RaidState, RaidBattleInfo } from "../raidcalc/interface";
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
                moveInfo: {userID: id+1, targetID: 1, moveData: {name: "(No Move)" as MoveName}}, 
                bossMoveInfo: {userID: 0, targetID: id+1, moveData: {name: "(No Move)" as MoveName}},
            })),
        }
    )

    useEffect(() => {
        setInfo({...info, startingState: new RaidState(raiders, raiders.map((r) => new Field()))})
    }, [raiders])

    const handleAddTurn = () => {
        let uniqueId = 0;
        info.turns.forEach((turn) => {
            if (turn.id >= uniqueId) {
                uniqueId = turn.id + 1;
            }
        })
        const newTurn = {
            id: uniqueId,
            moveInfo: {userID: 1, targetID: 1, moveData: {name: "(No Move)" as MoveName}},
            bossMoveInfo: {userID: 0, targetID: 1, moveData: {name: "(No Move)" as MoveName}},
        }
        setInfo({...info, turns: [...info.turns, newTurn]});
    }

    const handleRemoveTurn = () => {
        if (info.turns.length === 1) {
            return;
        }
        setInfo({...info, turns: info.turns.slice(0, info.turns.length-1)});
    }

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
                    <MoveSelection info={info} setInfo={setInfo} />
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                        <Button variant="contained" onClick={handleAddTurn}>Add Turn</Button>
                        <Button variant="contained" onClick={handleRemoveTurn} disabled={info.turns.length < 2}>Remove Turn</Button>
                    </Stack>
                </Stack>
            </Box>
            <Box hidden={value !== 2}>
                <RaidResults results={results} />
            </Box>
        </Box>
    )
}

export default RaidControls;