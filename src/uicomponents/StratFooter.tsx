import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { RaidBattleInfo } from "../raidcalc/interface";

function StratFooter({info, setInfo, prettyMode}: {info: RaidBattleInfo, setInfo: (i: RaidBattleInfo) => void, prettyMode: boolean}) {
    const [notes, setNotes] = useState(info.notes);
    const [credits, setCredits] = useState(info.credits);

    useEffect(() => {
        if (info.notes !== notes) {
            setNotes(info.notes);
        }
    }, [info.notes])

    useEffect(() => {
        if (info.credits !== credits) {
            setCredits(info.credits);
        }
    }, [info.credits])
    
    return (
        <>
            <Grid item>
                <Stack width="575px" sx={{ mx: 1, my: 1}} >
                    { (!prettyMode || (info.notes && info.notes.length > 0 )) &&
                        <Typography variant="h5" sx={{ textAlign: "left" }}>
                            Notes:
                        </Typography>
                    }
                    { prettyMode &&
                        <Typography variant="body1" style={{whiteSpace: 'pre-line'}} sx={{ textAlign: "left" }}>
                            {info.notes}
                        </Typography>
                    }
                    { !prettyMode &&
                        <TextField
                            multiline={true}
                            minRows={1}
                            maxRows={4}
                            placeholder="Enter any notes you want to save with this strategy."
                            inputProps={{
                                spellCheck: 'false',
                            }}
                            sx={{
                                alignSelf: "center",
                                width: "100%",
                            }}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={(e) => setInfo({...info, notes: e.target.value})}
                        />
                    }
                </Stack>
            </Grid>
            <Grid item>
                <Stack width="575px" sx={{ mx: 1, my: 1}} >
                    { (!prettyMode || (info.credits && info.credits.length > 0 )) &&
                        <Typography variant="h5" sx={{ textAlign: "left" }}>
                            Credits:
                        </Typography>
                    }
                    { prettyMode &&
                        <Typography variant="body1" style={{whiteSpace: 'pre-line'}} sx={{ textAlign: "left" }}>
                            {info.credits}
                        </Typography>
                    }
                    { !prettyMode &&
                        <TextField
                            multiline={true}
                            minRows={1}
                            maxRows={4}
                            placeholder="Enter any credits you want to save with this strategy."
                            inputProps={{
                                spellCheck: 'false',
                            }}
                            sx={{
                                alignSelf: "center",
                                width: "100%",
                            }}
                            value={credits}
                            onChange={(e) => setCredits(e.target.value)}
                            onBlur={(e) => setInfo({...info, credits: e.target.value})}
                        />
                    }
                </Stack>
            </Grid>
        </>
    )
}

export default StratFooter;