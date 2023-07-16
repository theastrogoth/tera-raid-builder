import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { RaidBattleResults } from "../raidcalc/interface"
import ButtonBase from "@mui/material/ButtonBase"

function CopyTextButton({text}: {text: string}) {
    return (
        <Box>
            <ButtonBase 
                onClick={() => navigator.clipboard.writeText(text)}
                style={{ border: 0, textAlign: "left" }}
            >
                <Typography color="body" variant="body2">{text}</Typography>
            </ButtonBase>
        </Box>

    )
}

// function MoveResultDisplay({state, desc}: {state: RaidState, desc: string}) {
//     return (
//         <Box>
//             <Box width="40%">
//                 <CopyTextButton text={desc}></CopyTextButton>

//             </Box>
//             <Box flexGrow={1} />
//             <Box width="40%">

//             </Box>
//         </Box>
//     )
// }

function RaidResults({results}: {results: RaidBattleResults}) {
    return (
        <Stack direction="column" spacing={1} justifyContent="left" sx={{ p: 2 }}>
            {
                results.turnResults.map((turnResult, index) => (
                    <Stack direction="column" spacing={0} key={index}>
                        <Typography variant="h6">Move {index+1}</Typography>
                        {
                            turnResult.results[0].desc.map((desc, index) => (
                                desc === "" ? <></> :
                                <CopyTextButton key={index} text={desc}></CopyTextButton>
                            ))
                        }
                        {
                            turnResult.results[1].desc.map((desc, index) => (
                                desc === "" ? <></> :
                                <CopyTextButton key={index} text={desc}></CopyTextButton>
                            ))
                        }
                    </Stack>
                ))
            }
        </Stack>
    )
}

export default RaidResults;