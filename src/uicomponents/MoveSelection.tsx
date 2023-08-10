import React, { useState, useEffect, useRef }  from "react"
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import Collapse from '@mui/material/Collapse';

import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";

import { MoveName } from "../calc/data/interface";
import { MoveData, RaidMoveInfo, RaidMoveOptions, RaidTurnInfo, Raider } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
// import PokedexService from "../services/getdata";
import { getPokemonSpriteURL, arraysEqual } from "../utils";

const handleAddTurn = (turns: RaidTurnInfo[], groups: number[][], setTurns: (t: RaidTurnInfo[]) => void, setGroups: (g: number[][]) => void, setTransitionIn: (n: number) => void) => (index: number) => () => {
    let uniqueId = 0;
    turns.forEach((turn) => {
        if (turn.id >= uniqueId) {
            uniqueId = turn.id + 1;
        }
    })
    let group: number | undefined = undefined;
    if (index > 0 && index < turns.length) {
        const prev = turns[index-1].group;
        const next = turns[index].group;
        if (prev !== undefined && prev === next) {
            group = prev;
        }
    }
    let newTurns = [...turns];
    const newTurn: RaidTurnInfo = {
        id: uniqueId,
        group: group,
        moveInfo: {userID: 1, targetID: 0, moveData: {name: "(No Move)" as MoveName}, options: {crit: false, secondaryEffects: false, roll: "min", hits: 1 }},
        bossMoveInfo: {userID: 0, targetID: 1, moveData: {name: "(Most Damaging)" as MoveName}, options: {crit: true, secondaryEffects: true, roll: "max", hits: 10 }},
    }
    newTurns.splice(index, 0, newTurn);

    const newGroups = [...groups];
    if (group !== undefined) {
        newGroups[group].push(uniqueId);
    }
    const preparedGroups = prepareGroups(newTurns, newGroups);
    setTurns(preparedGroups.turns);
    setGroups(preparedGroups.groups);
    setTransitionIn(uniqueId);
}

function MoveOptionsControls({moveInfo, setMoveInfo}: {moveInfo: RaidMoveInfo, setMoveInfo: (m: RaidMoveInfo) => void}) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };
    
    const critChecked = moveInfo.options ? (moveInfo.options.crit || false) : false; 
    const effectChecked = moveInfo.options ? (moveInfo.options.secondaryEffects || false) : false;
    const roll = moveInfo.options ? (moveInfo.options.roll) || "avg" : "avg";

    return (
        <Box>
            <IconButton 
                onClick={handleClick}
            >
                <MenuIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
            >
                <Stack direction="column" spacing={1} sx={{ p: 1 }}>
                    <Typography variant="body1" fontWeight="bold" paddingLeft={1.5}>Options:</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell>Crit</TableCell>
                                    <TableCell>
                                        <Checkbox 
                                            size="small" 
                                            style={{ padding: "4px"}}
                                            checked={critChecked}
                                            onChange={
                                                (e) => {
                                                    setMoveInfo({...moveInfo, options: {...moveInfo.options, crit: !critChecked}});
                                                }
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Effect</TableCell>
                                    <TableCell>
                                        <Checkbox 
                                            size="small" 
                                            style={{ padding: "4px"}}
                                            checked={effectChecked}
                                            onChange={
                                                (e) => {
                                                    setMoveInfo({...moveInfo, options: {...moveInfo.options, secondaryEffects: !effectChecked}});
                                                }
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Roll</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>
                                        <Select
                                            size="small"
                                            variant="standard"
                                            value = {roll}
                                            onChange={(e) => setMoveInfo({...moveInfo, options: {...moveInfo.options, roll: e.target.value as "min" | "max" | "avg" }})}
                                            sx={{ width : "40px"}}
                                        >
                                            {["min", "avg", "max"].map((r, i) => <MenuItem key={i} value={r}><Typography variant="body2">{r}</Typography></MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                { (moveInfo.moveData.maxHits && moveInfo.moveData.maxHits > 1) &&
                                    <TableRow>
                                        <TableCell sx={{ borderBottom: 0 }}># Hits</TableCell>
                                        <TableCell sx={{ borderBottom: 0 }}>
                                            <Select
                                                size="small"
                                                variant="standard"
                                                value = {moveInfo.options ? moveInfo.options.hits : 1}
                                                onChange={(e) => setMoveInfo({...moveInfo, options: {...moveInfo.options, hits: Number(e.target.value) }})}
                                                sx={{ width : "40px"}}
                                            >
                                                {[...Array(moveInfo.moveData.maxHits!+1).keys()].slice(moveInfo.moveData.minHits || 1)
                                                    .map((r, i) => <MenuItem key={i} value={r}><Typography variant="body2">{r}</Typography></MenuItem>)
                                                }
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </Menu>
        </Box>
    )
}

function MoveDropdown({index, raiders, turns, setTurns}: {index: number, raiders: Raider[], turns: RaidTurnInfo[], setTurns: (t: RaidTurnInfo[]) => void}) {
    const roles = raiders.map((raider) => raider.role);
    const moveInfo = turns[index].moveInfo;
    const moveName = moveInfo.moveData.name;

    const moves = raiders[moveInfo.userID].moves;
    const moveSet = ["(No Move)", "(Most Damaging)", ...moves, "Attack Cheer", "Defense Cheer", "Heal Cheer"];
    // const moveSet = ["(No Move)", "(Most Damaging)", ...moves, "Attack Cheer", "Defense Cheer", "Heal Cheer"];

    const [disableTarget, setDisableTarget] = useState<boolean>(
            moveInfo.moveData.name === "(No Move)" ||
            moveInfo.moveData.target === undefined ||
            moveInfo.moveData.target === "user-and-allies" ||
            moveInfo.moveData.target === "all-other-pokemon" ||
            moveInfo.moveData.target === "user" ||
            moveInfo.moveData.target === "all-pokemon" ||
            moveInfo.moveData.target === "entire-field"   
    );
    const [validTargets, setValidTargets] = useState<number[]>(disableTarget ? [moveInfo.userID] : [0,1,2,3,4].filter((id) => id !== moveInfo.userID));
    
    const setMoveInfo = (moveInfo: RaidMoveInfo) => {
        let newTurns = [...turns];
        newTurns[index].moveInfo = moveInfo;
        setTurns(newTurns);

        const newDisableTarget = (
            moveInfo.moveData.name === "(No Move)" ||
            moveInfo.moveData.target === undefined ||
            moveInfo.moveData.target === "user-and-allies" ||
            moveInfo.moveData.target === "all-other-pokemon" ||
            moveInfo.moveData.target === "user" ||
            moveInfo.moveData.target === "all-pokemon" ||
            moveInfo.moveData.target === "entire-field"
        );
        const newValidTargets = newDisableTarget ? [moveInfo.userID] : [0,1,2,3,4].filter((id) => id !== moveInfo.userID);
        setDisableTarget(newDisableTarget);
        setValidTargets(newValidTargets);
    }

    const setInfoParam = (param: string) => (val: any) => {
        setMoveInfo({...moveInfo, [param]: val});
    }
    
    useEffect(() => {
        if (!moves.includes(moveName)) {
            setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: "(No Move)" as MoveName}});
        }
    }, [moves])

    // useEffect(() => {
    //     if (moveName === "(No Move)") {
    //         setMoveInfo({...moveInfo, moveData: {name: moveName}});
    //     } else if (moveName === "(Most Damaging)") {
    //         setMoveInfo({...moveInfo, moveData: {name: moveName, target: "selected-pokemon"}});
    //     } else if (moveName === "Attack Cheer" || moveName === "Defense Cheer") {
    //         setMoveInfo({...moveInfo, moveData: {name: moveName, priority: 10, category: "field-effect", target: "user-and-allies"}})
    //     } else if (moveName === "Heal Cheer") {
    //         setMoveInfo({...moveInfo, moveData: {name: moveName, priority: 10, category: "heal", target: "user-and-allies"}})
    //     } else {
    //         // async function fetchData() {
    //         //     let mData = await PokedexService.getMoveByName(moveName) as MoveData;     
    //         //     setMoveInfo({...moveInfo, moveData: mData});
    //         // }
    //         // fetchData().catch((e) => console.log(e));
    //         const mData = raiders[moveInfo.userID].moveData.find((m) => m.name === moveName) as MoveData;
    //         setMoveInfo({...moveInfo, moveData: mData});
    //     }
    // }, [moveName])

    return (
        <Stack direction="row" spacing={-0.5} alignItems="center" justifyContent="right">
            <Stack width="510px" direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                <Box flexGrow={4} />
                <Box>
                    <Select
                        size="small"
                        variant="standard"
                        value = {moveInfo.userID}
                        onChange={(e) => setInfoParam("userID")(e.target.value)}
                        MenuProps={{
                            anchorOrigin: {
                                vertical: "bottom",
                                horizontal: "left"
                            },
                        }}
                        sx={{ maxWidth : "175px" }}
                    >
                        {roles.slice(1).map((role, i) => {
                            const raider = raiders[i+1];
                            const name = raider.name;
                            return (
                            <MenuItem key={i} value={i+1}>
                                <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                    <Box
                                        sx={{
                                            width: "25px",
                                            height: "25px",
                                            overflow: 'hidden',
                                            background: `url(${getPokemonSpriteURL(name)}) no-repeat center center / contain`,
                                        }}
                                    />
                                    <Typography variant="body2">{role}</Typography>
                                </Stack>
                            </MenuItem>
                            )}
                        )}
                    </Select>
                </Box>
                <Box flexGrow={1} />
                <Typography variant="body2">uses</Typography>
                <Box flexGrow={1} />
                <Box>
                    <Select 
                        size="small"
                        variant="standard"
                        value = {moveInfo.moveData.name}
                        renderValue={(value) => <Typography variant="body2">{value}</Typography>}
                        onChange={(e) => {
                            const name = e.target.value as MoveName;
                            let mData: MoveData = {name: name};
                            if (name === "(No Move)") {
                            } else if (name === "(Most Damaging)") {
                                mData = {name: name, target: "selected-pokemon"};
                            } else if (name === "Attack Cheer" || name === "Defense Cheer") {
                                mData = {name: name, priority: 10, category: "field-effect", target: "user-and-allies"};
                            } else if (name === "Heal Cheer") {
                                mData = {name: name, priority: 10, category: "heal", target: "user-and-allies"};
                            } else {
                                mData = raiders[moveInfo.userID].moveData.find((m) => m.name === name) as MoveData;
                            }
                            setMoveInfo({...moveInfo, moveData: mData})}
                        }
                        sx={{ maxWidth : "130px" }}
                    >
                        {moveSet.map((move, i) => <MenuItem key={i} value={move}>{move}</MenuItem>)}
                    </Select>
                </Box>
                <Box flexGrow={1} />
                <Typography variant="body2">on</Typography>
                <Box flexGrow={1} />
                <Box>
                    <Select
                        size="small"
                        variant="standard"
                        value = {disableTarget ? moveInfo.userID : moveInfo.targetID}
                        disabled = {disableTarget}
                        onChange={(e) =>setInfoParam("targetID")(e.target.value)}
                        sx={{ maxWidth : "175px"}}
                    >
                        {validTargets.map((id, i) => {
                            const raider = disableTarget ? raiders[moveInfo.userID] : raiders[id];
                            const role = raider.role;
                            const name = raider.name;
                            return (
                            <MenuItem key={i} value={id}>
                                <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                    <Box
                                        sx={{
                                            width: "25px",
                                            height: "25px",
                                            overflow: 'hidden',
                                            background: `url(${getPokemonSpriteURL(name)}) no-repeat center center / contain`,
                                        }}
                                    />
                                    <Typography variant="body2">{role}</Typography>
                                </Stack>
                            </MenuItem>
                            )}
                        )}
                    </Select>
                </Box>
                <Box flexGrow={4} />
            </Stack>
            <MoveOptionsControls moveInfo={moveInfo} setMoveInfo={setMoveInfo} />
        </Stack>
    )
}

function BossMoveDropdown({index, boss, turns, setTurns}: {index: number, boss: Raider, turns: RaidTurnInfo[], setTurns: (t: RaidTurnInfo[]) => void}) {
    const moveInfo = turns[index].bossMoveInfo;
    const turnID = turns[index].id;
    const moveSet = ["(No Move)", "(Most Damaging)", ...boss.moves, ...(boss.extraMoves) || []];

    const [moveName, setMoveName] = useState<MoveName>(moveInfo.moveData.name);
    const [options, setOptions] = useState(moveInfo.options || {crit: true, secondaryEffects: true, roll: "max"});

    const setMoveInfo = (newMoveInfo: RaidMoveInfo) => {
        let newTurns = [...turns];
        newTurns[index].bossMoveInfo = newMoveInfo;
        setTurns(newTurns);
        setMoveName(newMoveInfo.moveData.name);
        setOptions(newMoveInfo.options as RaidMoveOptions);
    }

    // useEffect(() => {
    //     if (moveName === "(No Move)" || moveName === "(Most Damaging)") {
    //         setMoveInfo({...moveInfo, moveData: {name: moveName}});
    //     } else {
    //         // async function fetchData() {
    //         //     let mData = await PokedexService.getMoveByName(moveName) as MoveData;     
    //         //     setMoveInfo({...moveInfo, moveData: mData});
    //         // }
    //         // fetchData().catch((e) => console.log(e));
    //         const mData = [...boss.moveData, ...boss.extraMoveData!].find((m) => m.name === moveName) as MoveData;
    //         console.log("Set moveData", mData)
    //         setMoveInfo({...moveInfo, moveData: mData});
    //     }
    //   }, [moveName, turnID])
    
    return (
        <Stack direction="row" spacing={-0.5} alignItems="center" justifyContent="right">
            <Stack direction="row" width="510px" spacing={0.5} alignItems="center" justifyContent="right">
                <Box flexGrow={6} />
                <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                    <Box
                        sx={{
                            width: "25px",
                            height: "25px",
                            overflow: 'hidden',
                            background: `url(${getPokemonSpriteURL(boss.name)}) no-repeat center center / contain`,
                        }}
                    />
                    <Typography variant="body2">{boss.role}</Typography>
                </Stack>
                <Box flexGrow={1} />
                <Typography variant="body2">uses</Typography>
                <Box flexGrow={1} />
                <Select 
                    size="small"
                    variant="standard"
                    value = {moveName}
                    onChange={(e) => {
                        const name = e.target.value as MoveName;
                        let mData: MoveData = {name: name};
                        if (name !== "(No Move)" && name !== "(Most Damaging)") {
                            mData = [...boss.moveData, ...boss.extraMoveData!].find((m) => m.name === name) as MoveData;
                        }
                        setMoveInfo({...moveInfo, moveData: mData})}
                    }
                    sx={{ maxWidth : "150px"}}
                >
                    {moveSet.map((move, i) => <MenuItem key={i} value={move}><Typography variant="body2">{move}</Typography></MenuItem>)}
                </Select>
                <Box flexGrow={6} />
            </Stack>
            <MoveOptionsControls moveInfo={moveInfo} setMoveInfo={setMoveInfo} />
        </Stack>
    )
}

function MoveSelectionContainer({raiders, index, turns, setTurns, groups, setGroups, buttonsVisible, transitionIn, setTransitionIn, transitionOut, setTransitionOut}: 
    {raiders: Raider[], index: number, turns: RaidTurnInfo[], setTurns: (t: RaidTurnInfo[]) => void, groups: number[][], setGroups: (g: number[][]) => void, buttonsVisible: boolean, transitionIn: number, setTransitionIn: (i: number) => void, transitionOut: number, setTransitionOut: (i: number) => void}) 
{
    const turnID = turns[index].id;
    const collapseIn = transitionOut !== turnID && transitionIn !== turnID;

    useEffect(() => {
        if (transitionIn === turnID) {
            setTransitionIn(-1);
        }
    }, [transitionIn])

    return (
        <Draggable
            key={turnID.toString()}
            draggableId={turnID.toString()}
            index={index}
        >
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Collapse in={collapseIn} timeout={250}>
                        <MoveSelectionCardMemo raiders={raiders} index={index} turns={turns} setTurns={setTurns} groups={groups} setGroups={setGroups} buttonsVisible={buttonsVisible} setTransitionIn={setTransitionIn} setTransitionOut={setTransitionOut} />
                    </Collapse>
                </div>
            )}

        </Draggable>
    )
}

function AddButton({onClick, visible, disabled=false}: {onClick: () => void, visible: boolean, disabled?: boolean}) {
    const [color, setColor] = useState<"inherit" | "primary">("inherit");
    return (
        <Box height="30px" alignSelf="center" alignContent="center">
            <Box hidden={!visible}>
                <Button
                    color={color}
                    onMouseOver={() => { setColor("primary") }}
                    onMouseOut={() => { setColor("inherit") }}
                    disabled={disabled}
                    // sx={{ padding: "2px"}}
                    onClick={onClick}
                    startIcon={<AddIcon/>}
                >
                    Add Move
                </Button>
            </Box>
        </Box>
    )
}

function CloseButton({onClick, visible, disabled=false}: {onClick: () => void, visible: boolean, disabled?: boolean}) {
    const [color, setColor] = useState<"default" | "primary">("default");
    return (
        <Box hidden={!visible}>
            <IconButton
                color={color}
                onMouseOver={() => { setColor("primary") }}
                onMouseOut={() => { setColor("default") }}
                disabled={disabled}
                // sx={{ padding: "2px"}}
                onClick={onClick}
            >
                <CloseIcon/>
            </IconButton>
        </Box>
    )
}

function MoveSelectionCard({raiders, index, turns, setTurns, groups, setGroups, buttonsVisible, setTransitionIn, setTransitionOut}: {raiders: Raider[], index: number, turns: RaidTurnInfo[], setTurns: (t: RaidTurnInfo[]) => void, groups: number[][], setGroups: (g: number[][]) => void, buttonsVisible: boolean, setTransitionIn: (i: number) => void, setTransitionOut: (i: number) => void}) {
    const timer = useRef<NodeJS.Timeout | null>(null);
    const handleRemoveTurn = () => {
        setTransitionOut(turns[index].id);
        timer.current = setTimeout(() => {
            let newTurns = [...turns];
            newTurns.splice(index, 1);
            const preparedGroups = prepareGroups(newTurns, groups);
            setTurns(preparedGroups.turns);
            setGroups(preparedGroups.groups);
            setTransitionOut(-1);
            timer.current = null;
        }, 300)
    }

    const group = turns[index].group;
    const color = group !== undefined ? "group" + group.toString().slice(-1) + ".main" : undefined;

    return (        
        <Stack direction="column" spacing={0}>
            <Paper 
                sx={{ maxWidth: "585px", backgroundColor: color, my: 1}} 
            >

                <Stack direction="row">
                    <Stack
                        direction = "column"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ p: 0.5 }}
                    >
                        <MoveDropdown index={index} raiders={raiders} turns={turns} setTurns={setTurns} />
                        {/* <Box width="80%">
                            <Divider />
                        </Box> */}
                        <BossMoveDropdown index={index} boss={raiders[0]} turns={turns} setTurns={setTurns}/>
                    </Stack>
                    <Stack alignItems="center" justifyContent={"center"} paddingRight={0.5}>
                        <CloseButton onClick={handleRemoveTurn} visible={true} disabled={(turns.length <= 1) || !buttonsVisible}/>
                    </Stack>
                </Stack>
            </Paper>
            <AddButton onClick={handleAddTurn(turns, groups, setTurns, setGroups, setTransitionIn)(index+1)} visible={buttonsVisible} />
        </Stack>
    )
}
const MoveSelectionCardMemo = React.memo(MoveSelectionCard, (prevProps, nextProps) => (
    prevProps.index === nextProps.index && 
    prevProps.turns[prevProps.index].id === nextProps.turns[nextProps.index].id &&
    prevProps.turns[prevProps.index].moveInfo.userID === nextProps.turns[nextProps.index].moveInfo.userID &&
    prevProps.turns[prevProps.index].moveInfo.targetID === nextProps.turns[nextProps.index].moveInfo.targetID &&
    prevProps.turns[prevProps.index].moveInfo.moveData.name === nextProps.turns[nextProps.index].moveInfo.moveData.name &&
    prevProps.turns[prevProps.index].bossMoveInfo.moveData.name === nextProps.turns[nextProps.index].bossMoveInfo.moveData.name &&
    prevProps.turns[prevProps.index].moveInfo.moveData.maxHits === nextProps.turns[nextProps.index].moveInfo.moveData.maxHits &&
    prevProps.turns[prevProps.index].bossMoveInfo.moveData.maxHits === nextProps.turns[nextProps.index].bossMoveInfo.moveData.maxHits &&
    prevProps.turns[prevProps.index].moveInfo.options?.crit === nextProps.turns[nextProps.index].moveInfo.options?.crit &&
    prevProps.turns[prevProps.index].moveInfo.options?.secondaryEffects === nextProps.turns[nextProps.index].moveInfo.options?.secondaryEffects &&
    prevProps.turns[prevProps.index].moveInfo.options?.roll === nextProps.turns[nextProps.index].moveInfo.options?.roll &&
    prevProps.turns[prevProps.index].moveInfo.options?.hits === nextProps.turns[nextProps.index].moveInfo.options?.hits &&
    prevProps.turns[prevProps.index].bossMoveInfo.options?.crit === nextProps.turns[nextProps.index].bossMoveInfo.options?.crit &&
    prevProps.turns[prevProps.index].bossMoveInfo.options?.secondaryEffects === nextProps.turns[nextProps.index].bossMoveInfo.options?.secondaryEffects &&
    prevProps.turns[prevProps.index].bossMoveInfo.options?.roll === nextProps.turns[nextProps.index].bossMoveInfo.options?.roll &&
    prevProps.turns[prevProps.index].bossMoveInfo.options?.hits === nextProps.turns[nextProps.index].bossMoveInfo.options?.hits &&
    arraysEqual(prevProps.raiders.map((r) => r.name), nextProps.raiders.map((r) => r.name)) &&
    arraysEqual(prevProps.raiders.map((r) => r.role), nextProps.raiders.map((r) => r.role)) &&
    arraysEqual(prevProps.raiders[prevProps.turns[prevProps.index].moveInfo.userID].moves, nextProps.raiders[nextProps.turns[nextProps.index].moveInfo.userID].moves) &&
    arraysEqual(prevProps.raiders[0].moves, nextProps.raiders[0].moves) &&  
    arraysEqual(prevProps.raiders[0].extraMoves!, nextProps.raiders[0].extraMoves!) &&
    prevProps.buttonsVisible === nextProps.buttonsVisible &&
    prevProps.turns.length === nextProps.turns.length
));

function prepareGroups(turns: RaidTurnInfo[], groups: number[][]) {
    const newTurns = [...turns];
    let newGroups = [...groups];
    // ensure adjacenty
    for (let i=0; i<newTurns.length; i++) {
        const currGroup = newTurns[i].group;
        const prevGroup = i === 0 ? undefined : newTurns[i-1].group;
        const nextGroup = i === newTurns.length-1 ? undefined : newTurns[i+1].group;
    
        if (currGroup !== undefined && !(prevGroup === currGroup || currGroup === nextGroup)) {
            newGroups[currGroup].splice(newGroups[currGroup].indexOf(newTurns[i].id), 1);
            newTurns[i].group = undefined;
        }
    }
    // ensure no singletons
    newGroups = newGroups.filter((group) => group.length > 1);
    // clear old group assignments
    for (let turn of newTurns) {
        turn.group = undefined;
    }
    // add new group assignments
    for (let i=0; i<newGroups.length; i++) {
        const group = newGroups[i];
        for (let turnID of group) {
            const turn = newTurns.find((turn) => turn.id === turnID);
            if (turn) {
                turn.group = i;
            }
        }
    }
    return {turns: newTurns, groups: newGroups};
}

function MoveSelection({raidInputProps}: {raidInputProps: RaidInputProps}) {
    const [buttonsVisible, setButtonsVisible] = useState(true);
    const [transitionIn, setTransitionIn] = useState(-1);
    const [transitionOut, setTransitionOut] = useState(-1);

    const onDragStart = () => {
        setButtonsVisible(false);
    }

    const onDragEnd = (result: DropResult) => {
        setButtonsVisible(true);
        const {destination, source, draggableId, combine} = result;
        const newTurns = [...raidInputProps.turns];
        const newGroups = [...raidInputProps.groups];
        let destinationIndex = destination ? destination.index : source.index;
        if (combine) {
            const movedIndex = result.source.index;
            const movedID = newTurns[movedIndex].id;
            const targetID = parseInt(combine.draggableId);
            const idsByIndex = newTurns.map((turn) => turn.id);
            const targetIndex = idsByIndex.indexOf(targetID);
            destinationIndex = movedIndex > targetIndex ? targetIndex : targetIndex-1;

            const movedFromGroup = newTurns[movedIndex].group;
            const targetGroup = newTurns[targetIndex].group;

            // remove membership from former group
            if (movedFromGroup !== undefined) {
                const groupIndex = newGroups[movedFromGroup].indexOf(movedID);
                newGroups[movedFromGroup].splice(groupIndex, 1);
            }
            // create new group or add membership to existing group
            if (targetGroup === undefined) {
                newTurns[movedIndex].group = newGroups.length;
                newTurns[targetIndex].group = newGroups.length;
                newGroups.push([targetID, movedID]);
            } else {
                newTurns[movedIndex].group = targetGroup;
                newGroups[targetGroup].push(movedID);
            } 
        }
        if (!destination && !combine) { return }; 
        if (!combine && (!destination || (destination.droppableId === source.droppableId &&
            destination.index === source.index))) { return }; 
        const movedTurn = newTurns.splice(source.index, 1)[0];
        newTurns.splice(destinationIndex, 0, movedTurn);
        const preparedGroups = prepareGroups(newTurns, newGroups);
        raidInputProps.setTurns(preparedGroups.turns);
        raidInputProps.setGroups(preparedGroups.groups);
    };
    return (
        <Box>
            <DragDropContext
                onDragStart={onDragStart}
                // onDragUpdate={}
                onDragEnd={onDragEnd}
            >
                <Droppable droppableId={"raid-turns"} isCombineEnabled>
                    {(provided) => (
                        <Stack direction="column" spacing={0} sx = {{ my: 1}}
                            ref={provided.innerRef}
                            {...provided.droppableProps} 
                        >
                            <AddButton onClick={handleAddTurn(raidInputProps.turns, raidInputProps.groups, raidInputProps.setTurns, raidInputProps.setGroups, setTransitionIn)(0)} visible={buttonsVisible}/>
                            {
                                raidInputProps.turns.map((turn, index) => (
                                    <MoveSelectionContainer 
                                        key={index}
                                        raiders={raidInputProps.pokemon} 
                                        index={index} 
                                        turns={raidInputProps.turns}
                                        setTurns={raidInputProps.setTurns}
                                        groups={raidInputProps.groups}
                                        setGroups={raidInputProps.setGroups}
                                        buttonsVisible={buttonsVisible}
                                        transitionIn={transitionIn}
                                        setTransitionIn={setTransitionIn}
                                        transitionOut={transitionOut}
                                        setTransitionOut={setTransitionOut}
                                    />
                            ))}
                                {provided.placeholder}
                            </Stack>
                        )
                    }
                </Droppable>
            </DragDropContext>
        </Box>
    )
}

export default React.memo(MoveSelection);