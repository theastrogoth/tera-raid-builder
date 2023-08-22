import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { Raider } from "../raidcalc/interface";
import { RaidTurnResult } from "../raidcalc/RaidTurn";
import { getPokemonSpriteURL, getTeraTypeIconURL } from "../utils";

function MoveText({raiders, turn}: {raiders: Raider[], turn: RaidTurnResult}) {

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

    let move: string = turn.raiderMoveUsed;
    if (move == "(No Move)") {
        move = "";
    }
    let teraActivated = turn.flags[turn.moveInfo.userID].includes("Tera activated");

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
        move = turn.bossMoveUsed;
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
                                width: "30px",
                                height: "30px",
                                overflow: 'hidden',
                                background: `url(${getTeraTypeIconURL(turn.state.raiders[turn.moveInfo.userID].teraType || "Inactive")}) no-repeat center center / contain`,
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

function MoveGroup({turns, group, raiders, index}: {turns: RaidTurnResult[], group: number[], raiders: Raider[], index: number}) {
    const newTurns = turns.filter((t, i) => group.includes(i));
    const color = "group" + index + ".main";
    return (
        <Paper sx={{backgroundColor: color, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2}}>
            <Box position="relative">
                <Typography variant="h4" fontWeight="bold" sx={{ position: "absolute", transform: "translate(-60px,-7px)"}}>
                    {index+1}
                </Typography>
            </Box>
            <Stack direction="column" spacing={1}>
                {
                    newTurns.map((t, i) => (
                        <MoveText key={i} raiders={raiders} turn={t} />
                    ))
                }
            </Stack>
        </Paper>
    )
}

function MoveDisplay({turns, raiders}: {turns: RaidTurnResult[], raiders: Raider[]}) { 
    const displayGroups: number[][] = [];
    let currentGroupIndex = -1;
    let currentGroupID: number | undefined = -1;
    turns.forEach((t, index) => {
        const g = t.group;
        if (g === undefined || g !== currentGroupID) {
            currentGroupIndex += 1;
            displayGroups.push([index]);
        } else {
            displayGroups[currentGroupIndex].push(index);
        }
        currentGroupID = g;
    })

    return (
        <Stack direction="column" spacing={0} alignItems="center" justifyContent="center">
            {
                displayGroups.map((g, index) => (
                    <Box key={index}>
                        <MoveGroup turns={turns} group={g} raiders={raiders} index={index} />
                        {index !== displayGroups.length - 1  && 
                            <Typography align="center" variant="h5" fontWeight="bold" sx={{ my: 0.5}}>
                                ↓
                            </Typography>
                        }
                    </Box>
                ))

            }
        </Stack>
    )
}


export default React.memo(MoveDisplay);