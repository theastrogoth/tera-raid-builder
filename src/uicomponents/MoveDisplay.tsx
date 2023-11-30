import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { RaidTurnInfo, Raider, TurnGroupInfo } from "../raidcalc/interface";
import { RaidTurnResult } from "../raidcalc/RaidTurn";
import { getPokemonSpriteURL, getTeraTypeIconURL, getTranslation, getTurnNumbersFromGroups, sortGroupsIntoTurns } from "../utils";
import { RaidBattleResults } from "../raidcalc/RaidBattle";

function MoveText({raiders, turn, result, translationKey}: {raiders: Raider[], turn: RaidTurnInfo, result: RaidTurnResult, translationKey: any}) {

    let name = raiders[turn.moveInfo.userID].name;
    let user = raiders[turn.moveInfo.userID].role;

    let target = raiders[turn.moveInfo.targetID].role;
    if (target === user) { 
        target = ""
    }
    if ([undefined, "user", "user-and-allies", "all-allies", "users-field", "opponents-field", "entire-field", ].includes(turn.moveInfo.moveData.target)) {
        target = "";
    }
    let targetName = raiders[turn.moveInfo.targetID].name;

    let move: string = result ? result.raiderMoveUsed : "";
    if (move ==="(No Move)") {
        move = result.bossMoveUsed === "(No Move)" ? "Waits" : "";
    }
    let teraActivated = result && result.flags[turn.moveInfo.userID].includes("Tera activated");

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
        move = result ? result.bossMoveUsed : "";
        if (move ==="(No Move)") {
            move = "";
        }
        teraActivated = false;
    }

    move = getTranslation(move, translationKey, "moves");

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
                    { move === "Waits" ? "" : getTranslation("uses", translationKey) }
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
                    <Typography variant="body1" fontWeight="bold" align="center">
                        {move}
                    </Typography>
                </Stack>
                {target !== "" &&
                    <Typography variant="body1">
                        { getTranslation("on", translationKey) }
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

function MoveGroup({group, results, raiders, index, max, translationKey}: {group: TurnGroupInfo, results: RaidBattleResults, raiders: Raider[], index: number, max: number, translationKey: any}) {
    const turns = group.turns;
    return (
        <Stack direction="column">
            <Stack direction="row" alignItems="center" justifyContent="center">
                <Stack direction="column" spacing={1}>
                    {
                        turns.map((t, i) => (
                            <MoveText key={i} raiders={raiders} turn={t} result={results.turnResults.find((r) => r.id === t.id)!} translationKey={translationKey} />
                        ))
                    }
                </Stack>                    
                { (group.repeats && group.repeats > 1) && 
                    <Typography variant="h6" fontWeight="bold" margin="15px">
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

function MoveTurn({turnNumber, groups, raiders, results, index, translationKey}: {turnNumber: number, groups: TurnGroupInfo[], raiders: Raider[], results: RaidBattleResults, index: number, translationKey: any}) {
    const color = "group" + index.toString().slice(-1) + ".main";
    return (
        <Stack direction="column">
            <Stack direction="row" alignItems="center">
                <Box sx={{ width: "45px" }}>
                    <Typography variant="h4" fontWeight="bold" margin="15px" style={{ whiteSpace: "pre-wrap" }}>
                        {turnNumber || ""}
                    </Typography>
                </Box>
                <Paper sx={{width: "520px", backgroundColor: color, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2}}>
                    <Stack direction="column" spacing={1}>
                        {
                            groups.map((group, index) => (
                                <MoveGroup key={index} group={group} raiders={raiders} results={results} index={index} max={groups.length} translationKey={translationKey} />
                            ))
                        }
                    </Stack>
                </Paper>
            </Stack>
        </Stack>
    )
}

function MoveDisplay({groups, raiders, results, translationKey}: {groups: TurnGroupInfo[], raiders: Raider[], results: RaidBattleResults, translationKey: any}) { 
    const turnNumbers = getTurnNumbersFromGroups(groups);
    const [turnGroups, turnLabels] = sortGroupsIntoTurns(turnNumbers, groups);
    return (
        <Stack direction="column" spacing={2} alignItems="left" justifyContent="center">
            {
                turnGroups.map((tGroups, index) => (
                    <Box key={index}>
                        {/* <MoveGroup group={group} raiders={raiders} results={results} index={index} max={groups.length} translationKey={translationKey} /> */}
                        <MoveTurn key={index} turnNumber={turnLabels[index]} groups={tGroups} raiders={raiders} results={results} index={index} translationKey={translationKey} />
                    </Box>
                ))

            }
        </Stack>
    )
}


export default React.memo(MoveDisplay);