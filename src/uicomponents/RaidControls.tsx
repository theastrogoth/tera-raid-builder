import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import { RaidBattleInfo, RaidBattleResults } from "../raidcalc/interface";


const raidcalcWorker = new Worker(new URL("../workers/raidcalc.worker.ts", import.meta.url));

function RaidControls({info, setInfo}: {info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const [value, setValue] = useState<number>(1);
    const [results, setResults] = useState<RaidBattleResults | null>(null);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };  

    useEffect(() => {
        raidcalcWorker.onmessage = (event: MessageEvent<RaidBattleResults>) => {
            if (event && event.data) {
                setResults(event.data);
            }
        }
    }, [raidcalcWorker]);

    useEffect(() => {
        raidcalcWorker
            .postMessage({info});
    }, [info]);

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
                    <Box maxHeight={560} sx={{ overflowY: "auto" }}>
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