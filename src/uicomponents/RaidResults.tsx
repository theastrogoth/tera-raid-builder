import React from "react"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import ButtonBase from "@mui/material/ButtonBase"

import { RaidState } from "../raidcalc/interface"
import { RaidBattleResults } from "../raidcalc/RaidBattle"
import { RaidTurnResult } from "../raidcalc/RaidTurn"
import { RaidMoveResult } from "../raidcalc/RaidMove"

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
    const hasDesc = moveResult.desc.map((d) => d !== "" && d !== undefined);
    const texts = state.raiders.map((r,i) => moveResultText(state.raiders[i].role, moveResult.flags[i]));
    return (
        <Stack direction="column" spacing={0}>
            { hasDesc.map((hasd, idx) => {
                const desc = moveResult.desc[idx];
                return ( hasd ? 
                    <CopyTextButton text={desc}></CopyTextButton>
                    : <></>);
                })
            }
            {
                texts.map((text, idx) => (
                    <Typography key={idx} variant="body2" style={{ whiteSpace: "pre-wrap" }}>{text}</Typography>
                ))
            }
        </Stack>
    )
}

function TurnFlagDisplay({turnResult}: {turnResult: RaidTurnResult}) {
    const flags = turnResult.flags || [];
    const texts = flags.map((flags, idx) => moveResultText(turnResult.state.raiders[idx].role, flags));
    return (
        <Stack direction="column" spacing={0}>
            {
                texts.map((text, idx) => (
                    <Typography key={idx} variant="body2" style={{ whiteSpace: "pre-wrap" }}>{text}</Typography>  
                ))
            }
        </Stack>
    )
}

function EndTurnFlagDisplay({turnResult}: {turnResult: RaidTurnResult}) {
    const flags = turnResult.endFlags || [];
    const texts = flags.map((flag) => "\t"+flag)
    return (
        <Stack direction="column" spacing={0}>
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
            <TurnFlagDisplay turnResult={turnResult} />
            {
                turnResult.results.map((moveResult) => moveResultDisplay(state, moveResult))
            }
            <EndTurnFlagDisplay turnResult={turnResult} />
        </Stack>
    )
}

function TurnZeroDisplay({state, tZeroFlags, tZeroOrder}: {state: RaidState, tZeroFlags: string[][], tZeroOrder: number[]}) {
    const raiders = state.raiders;
    let texts = tZeroOrder.map((id) => moveResultText(raiders[id].role, tZeroFlags[id])); 
    texts = texts.concat(tZeroOrder.map((id) => moveResultText(raiders[id].role, tZeroFlags[id+5])));
    return (
        <Stack direction="column" spacing={0} >
            <Typography variant="h6">Battle Start</Typography>
            <Stack direction="column" spacing={0}>
                {
                    texts.map((text, idx) => (
                        <Typography key={idx} variant="body2" style={{ whiteSpace: "pre-wrap" }}>{text}</Typography>
                    ))
                }
            </Stack>
        </Stack>
    )
}

function RaidResults({results}: {results: RaidBattleResults | null}) {
    return (
        <Stack direction="column" spacing={1} justifyContent="left" sx={{ p: 2 }}>
            { results && 
                <TurnZeroDisplay state={results.endState} tZeroFlags={results.turnZeroFlags} tZeroOrder={results.turnZeroOrder} />
            }
            {results && 
                results.turnResults.map((turnResult, index) => (
                    <TurnResultDisplay key={index} state={results.endState} turnResult={turnResult} index={index} />
                ))
            }
        </Stack>
    )
}

export default React.memo(RaidResults);