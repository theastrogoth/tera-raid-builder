import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { RaidTurnInfo, Raider, TurnGroupInfo } from "../raidcalc/interface";
import { RaidTurnResult } from "../raidcalc/RaidTurn";
import { getPokemonSpriteURL, getTeraTypeIconURL } from "../utils";
import { RaidBattleResults } from "../raidcalc/RaidBattle";

function MoveText({raiders, turn, result}: {raiders: Raider[], turn: RaidTurnInfo, result: RaidTurnResult}) {

    let name = raiders[turn.moveInfo.userID].name;
    let user = raiders[turn.moveInfo.userID].role;

    let target = raiders[turn.moveInfo.targetID].role;
    if (target === user) { 
        target = ""
    }
    if ([undefined, "user", "user-and-allies", "all-allies"].includes(turn.moveInfo.moveData.target)) {
        target = "";
    }
    let targetName = raiders[turn.moveInfo.targetID].name;

    let move: string = result.raiderMoveUsed;
    if (move == "(No Move)") {
        move = "";
    }
    let teraActivated = result.flags[turn.moveInfo.userID].includes("Tera activated");

    if (move === "") {
        name = raiders[0].name;
        user = raiders[0].role;
        target = raiders[turn.bossMoveInfo.targetID].role;
        if (target === user) { 
            target = ""
        }
        if ([undefined, "user", "user-and-allies", "all-allies"].includes(turn.moveInfo.moveData.target)) {
            target = "";
        }
        targetName = raiders[turn.bossMoveInfo.targetID].name;
        move = result.bossMoveUsed;
        if (move == "(No Move)") {
            move = "";
        }
        teraActivated = false;
    }
    return (
        <>
        {move !== "" &&
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Box
                        sx={{
                            width: "30px",
                            height: "30px",
                            overflow: 'hidden',
                            background: `url(${getPokemonSpriteURL(name)}) no-repeat center center / contain`,
                        }}
                    />
                    <Typography variant="body1" fontWeight="bold">
                        {user}
                    </Typography>
                </Stack>
                <Typography variant="body1">
                    uses
                </Typography>
                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center">
                    {teraActivated && 
                        <Box
                            sx={{
                                width: "25px",
                                height: "25px",
                                marginRight: "5px",
                                overflow: 'hidden',
                                background: `url(${getTeraTypeIconURL(result.state.raiders[turn.moveInfo.userID].teraType || "Inactive")}) no-repeat center center / contain`,
                            }}
                        />
                    }
                    <Typography variant="body1" fontWeight="bold">
                        {move}
                    </Typography>
                </Stack>
                {target !== "" &&
                    <Typography variant="body1">
                        on
                    </Typography>
                }
                {target !== "" &&
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <Box
                            sx={{
                                width: "30px",
                                height: "30px",
                                overflow: 'hidden',
                                background: `url(${getPokemonSpriteURL(targetName)}) no-repeat center center / contain`,
                            }}
                        />
                        <Typography variant="body1" fontWeight="bold">
                            {target}
                        </Typography>
                    </Stack>
                }
            </Stack>
        }
        </>

    )
}

function MoveGroup({group, results, raiders, index, max}: {group: TurnGroupInfo, results: RaidBattleResults, raiders: Raider[], index: number, max: number}) {
    const turns = group.turns;
    const color = "group" + group.id.toString().slice(-1) + ".main";
    return (
        <Stack direction="column">
            <Stack direction="row" alignItems="center">
                <Typography variant="h4" fontWeight="bold" margin="15px">
                    {index+1}
                </Typography>
                <Paper sx={{width: "480px", backgroundColor: color, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2}}>
                    <Stack direction="column" spacing={1}>
                    {
                        turns.map((t, i) => (
                            <MoveText key={i} raiders={raiders} turn={t} result={results.turnResults.find((r) => r.id === t.id)!} />
                        ))
                    }
                    </Stack>                    
                </Paper>
                { (group.repeats && group.repeats > 1) && 
                    <Typography variant="h4" fontWeight="bold" margin="15px">
                        {"×"+group.repeats}
                    </Typography>
                }
            </Stack>
            {index !== max - 1  && 
                <Typography align="center" variant="h5" fontWeight="bold" sx={{ my: 0.5}}>
                    ↓
                </Typography>
            }
        </Stack>
    )
}

function MoveDisplay({groups, raiders, results}: {groups: TurnGroupInfo[], raiders: Raider[], results: RaidBattleResults}) { 
    return (
        <Stack direction="column" spacing={0} alignItems="left" justifyContent="center">
            {
                groups.map((group, index) => (
                    <Box key={index}>
                        <MoveGroup group={group} raiders={raiders} results={results} index={index} max={groups.length}/>
                    </Box>
                ))

            }
        </Stack>
    )
}


export default React.memo(MoveDisplay);