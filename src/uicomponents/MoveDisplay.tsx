import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { RaidBattleInfo, RaidTurnInfo, Raider } from "../raidcalc/interface";
import { Paper } from "@mui/material";

function MoveText({raiders, turn}: {raiders: Raider[], turn: RaidTurnInfo}) {

    const user = raiders[turn.moveInfo.userID].role;

    let target = raiders[turn.moveInfo.targetID].role;
    const targetType = turn.moveInfo.moveData.target;
    if ([null, undefined, "user", "entire-field", "user-and-allies", "all-allies", "entire-field", "all-pokemon", "all-other-pokemon" ].includes(targetType)) { 
        target = ""
    }

    let move: string = turn.moveInfo.moveData.name;
    if (move == "(No Move)") {
        move = "";
    }

    return (
        <>
        {move !== "" &&
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <Typography variant="body1" fontWeight="bold">
                    {user}
                </Typography>
                <Typography variant="body1">
                    uses
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                    {move}
                </Typography>
                {target !== "" &&
                    <Typography variant="body1">
                        on
                    </Typography>
                }
                {target !== "" &&
                    <Typography variant="body1" fontWeight="bold">
                        {target}
                    </Typography>
                }
            </Stack>
        }
        </>

    )
}

function MoveGroup({info, group, index}: {info: RaidBattleInfo, group: number[], index: number}) {
    const turns = info.turns.filter((t, i) => group.includes(i));
    const color = "group" + index + ".main";
    return (
        <Paper sx={{backgroundColor: color, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2}}>
            <Stack direction="column" spacing={1}>
                {
                    turns.map((t) => (
                        <MoveText raiders={info.startingState.raiders} turn={t} />
                    ))
                }
            </Stack>
        </Paper>
    )
}

function MoveDisplay({info}: {info: RaidBattleInfo}) { 
    const displayGroups: number[][] = [];
    let currentGroupIndex = -1;
    let currentGroupID: number | undefined = -1;
    info.turns.forEach((t, index) => {
        const g = t.group;
        if (g === undefined || g !== currentGroupID) {
            currentGroupIndex += 1;
            displayGroups.push([index]);
        } else {
            displayGroups[currentGroupIndex].push(index);
        }
        currentGroupID = g;
    })

    console.log("display groups", displayGroups)

    return (
        <Stack direction="column" spacing={0} alignItems="center" justifyContent="center">
            {
                displayGroups.map((g, index) => (
                    <>
                    <MoveGroup info={info} group={g} index={index} />
                    {index !== displayGroups.length - 1  && 
                        <Typography variant="h4" fontWeight="bold" sx={{ my: 0.25}}>
                            ↓
                        </Typography>
                    }
                    </>
                ))

            }
        </Stack>
    )
}


export default MoveDisplay;