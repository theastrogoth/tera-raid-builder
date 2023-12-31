import React, { useState, useEffect } from "react";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { getTranslation } from "../utils";

function StratFooter({notes, setNotes, credits, setCredits, prettyMode, translationKey}: {notes: string, setNotes: (n: string) => void, credits: string, setCredits: (c: string) => void, prettyMode: boolean, translationKey: any}) {
    const [fieldNotes, setFieldNotes] = useState(notes);
    const [fieldCredits, setFieldCredits] = useState(credits);

    useEffect(() => {
        if (notes !== fieldNotes) {
            setFieldNotes(notes);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notes])

    useEffect(() => {
        if (credits !== fieldCredits) {
            setFieldCredits(credits);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [credits])
    
    return (
        <>
            <Grid item>
                <Stack width="575px" sx={{ mx: 1, my: 1}} >
                    { (!prettyMode || (notes && notes.length > 0 )) &&
                        <Typography variant="h5" sx={{ textAlign: "left" }}>
                            { getTranslation("Notes", translationKey, "ui") + ":" }
                        </Typography>
                    }
                    { prettyMode &&
                        <Typography variant="body1" style={{whiteSpace: 'pre-line'}} sx={{ textAlign: "left" }}>
                            {notes}
                        </Typography>
                    }
                    { !prettyMode &&
                        <TextField
                            multiline={true}
                            minRows={1}
                            maxRows={4}
                            placeholder={getTranslation("Enter any notes you want to save with this strategy.",translationKey)}
                            inputProps={{
                                spellCheck: 'false',
                                maxLength: 500
                            }}
                            sx={{
                                alignSelf: "center",
                                width: "100%",
                            }}
                            value={fieldNotes}
                            onChange={(e) => setFieldNotes(e.target.value)}
                            onBlur={(e) => setNotes(e.target.value)}
                        />
                    }
                </Stack>
            </Grid>
            <Grid item>
                <Stack width="575px" sx={{ mx: 1, my: 1}} >
                    { (!prettyMode || (credits && credits.length > 0 )) &&
                        <Typography variant="h5" sx={{ textAlign: "left" }}>
                            { getTranslation("Credits", translationKey, "ui") + ":" }
                     </Typography>
                    }
                    { prettyMode &&
                        <Typography variant="body1" style={{whiteSpace: 'pre-line'}} sx={{ textAlign: "left" }}>
                            {credits}
                        </Typography>
                    }
                    { !prettyMode &&
                        <TextField
                            multiline={true}
                            minRows={1}
                            maxRows={4}
                            placeholder={getTranslation("Enter any credits you want to save with this strategy.",translationKey)}
                            inputProps={{
                                spellCheck: 'false',
                                maxLength: 1000
                            }}
                            sx={{
                                alignSelf: "center",
                                width: "100%",
                            }}
                            value={fieldCredits}
                            onChange={(e) => setFieldCredits(e.target.value)}
                            onBlur={(e) => setCredits(e.target.value)}
                        />
                    }
                </Stack>
            </Grid>
        </>
    )
}

export default React.memo(StratFooter);