import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { RaidState, RaidBattleResults, RaidTurnResult, RaidMoveResult } from "../raidcalc/interface"
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

function moveResultText(name: string, flags: string[]) {
    if (flags.length > 0) {
        return "\t" + name + " — " + flags.join(", ");
    } else {
        return null
    }
}

function moveResultDisplay(state: RaidState, moveResult: RaidMoveResult) {
    const desc = moveResult.desc.filter((s) => s !== "")[0];
    const texts = state.raiders.map((r,i) => moveResultText(state.raiders[i].role, moveResult.flags[i]));
    return (
        <Stack direction="column" spacing={0}>
            {
                desc === "" ? <></> :
                <CopyTextButton text={desc}></CopyTextButton>
            }
            {
                texts.map((text, idx) => (
                    <Typography key={idx} variant="body2" style={{ whiteSpace: "pre-wrap" }}>{text}</Typography>
                ))
            }
        </Stack>
    )
}

function TurnResultDisplay({state, turnResult, index}: {state: RaidState, turnResult: RaidTurnResult, index: number}) { 
    return (
        <Stack direction="column" spacing={0} key={index}>
            <Typography variant="h6">Move {index+1}</Typography>
            { moveResultDisplay(state, turnResult.results[0]) }
            { moveResultDisplay(state, turnResult.results[1]) }
        </Stack>
    )
}

function RaidResults({results}: {results: RaidBattleResults | null}) {
    return (
        <Stack direction="column" spacing={1} justifyContent="left" sx={{ p: 2 }}>
            {results && 
                results.turnResults.map((turnResult, index) => (
                    <TurnResultDisplay key={index} state={results.endState} turnResult={turnResult} index={index} />
                ))
            }
        </Stack>
    )
}

export default RaidResults;