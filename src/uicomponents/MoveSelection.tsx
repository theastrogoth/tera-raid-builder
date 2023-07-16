import React, { useState, useEffect, useRef }  from "react"
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from '@mui/material/Divider';
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Input from "@mui/material/Input";

import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";

import { MoveName } from "../calc/data/interface";
import { MoveData, RaidBattleInfo, RaidMoveInfo, Raider } from "../raidcalc/interface";
import PokedexService from "../services/getdata";


function MoveDropdown({index, raiders, info, setInfo}: {index: number, raiders: Raider[], info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const roles = raiders.map((raider) => raider.role);
    const moveInfo = info.turns[index].moveInfo;
    const moveName = moveInfo.moveData.name;
    const targetRef = useRef(moveInfo.moveData.target);

    const [validTargets, setValidTargets] = useState([moveInfo.userID])

    const moveSet = ["(No Move)", ...raiders[moveInfo.userID].moves, "Attack Cheer", "Defense Cheer", "Heal Cheer"];
    
    const setMoveInfo = (moveInfo: RaidMoveInfo) => {
        let newTurns = [...info.turns];
        newTurns[index].moveInfo = moveInfo;
        setInfo({...info, turns: newTurns});
    }

    const setInfoParam = (param: string) => (val: any) => {
        setMoveInfo({...moveInfo, [param]: val});
    }
    
    useEffect(() => {
        if (!raiders[moveInfo.userID].moves.includes(moveName)) {
            setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: "(No Move)" as MoveName}});
        } else {
            if (!validTargets.includes(moveInfo.targetID)) {
                setValidTargets([...validTargets, moveInfo.userID]);
            }
        }
    }, [raiders[moveInfo.userID].moves])

    useEffect(() => {
        if (moveName === "(No Move)") {
            setMoveInfo({...moveInfo, moveData: {name: moveName}});
        } else if (moveName == "Attack Cheer" || moveName == "Defense Cheer") {
            setMoveInfo({...moveInfo, moveData: {name: moveName, priority: 10, category: "field-effect", target: "user-and-allies"}})
        } else if (moveName === "Heal Cheer") {
            setMoveInfo({...moveInfo, moveData: {name: moveName, priority: 10, category: "heal", target: "user-and-allies"}})
        } else {
            async function fetchData() {
                let mData = await PokedexService.getMoveByName(moveName) as MoveData;     
                setMoveInfo({...moveInfo, moveData: mData});
            }
            fetchData().catch((e) => console.log(e));
        }
    }, [moveName])

    useEffect(() => {
        const target = moveInfo.moveData.target;
        if (target === undefined || target === targetRef.current) {
            return
        }
        targetRef.current = target;
        const disableTarget = moveInfo.moveData.name === "(No Move)" ||
                            moveInfo.moveData.target === "user-and-allies" ||
                            moveInfo.moveData.target === "all-other-pokemon" ||
                            moveInfo.moveData.target === "user" ||
                            moveInfo.moveData.target === "all-pokemon" ||
                            moveInfo.moveData.target === "entire-field";

        const newValidTargets = disableTarget ? [moveInfo.userID] : raiders.map((raider) => raider.id).filter((id) => id !== moveInfo.userID);
        if (!newValidTargets.includes(moveInfo.targetID)) {
            const newMoveInfo = {...moveInfo, targetID: newValidTargets[0]};
            setMoveInfo(newMoveInfo);
        }
        setValidTargets(newValidTargets);
    }, [moveInfo.moveData])

    const disableTarget = moveInfo.moveData.name === "(No Move)" ||
            moveInfo.moveData.target === "user-and-allies" ||
            moveInfo.moveData.target === "all-other-pokemon" ||
            moveInfo.moveData.target === "user" ||
            moveInfo.moveData.target === "all-pokemon" ||
            moveInfo.moveData.target === "entire-field";
    
    const critChecked = moveInfo.options ? (moveInfo.options.crit || false) : false; 
    const effectChecked = moveInfo.options ? (moveInfo.options.secondaryEffects || false) : false;
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Box>
                <FormControl>
                    <InputLabel id={"user-label"}>User</InputLabel>
                    <Select
                        size="small"
                        labelId="user-label"
                        label="User"
                        value = {moveInfo.userID}
                        onChange={(e) => setInfoParam("userID")(e.target.value)}
                        sx={{ maxWidth : "150px"}}
                    >
                        {roles.slice(1).map((role, i) => <MenuItem value={i+1}>{role}</MenuItem>)}
                    </Select>
                </FormControl> 
            </Box>
            <Typography variant="body1">uses</Typography>
            <Box>
                <FormControl>
                    <InputLabel id={"move-label"}>Move</InputLabel>
                    <Select 
                        size="small"
                        labelId="move-label"
                        label="Move"
                        value = {moveInfo.moveData.name}
                        onChange={(e) => setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: (e.target.value || "(No Move)") as MoveName}})}
                        sx={{ maxWidth : "150px"}}
                    >
                        {moveSet.map((move) => <MenuItem value={move}>{move}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>
            <Typography variant="body1">on</Typography>
            <Box>
                <FormControl>
                    <InputLabel id={"target-label"}>Target</InputLabel>
                    <Select
                        size="small"
                        labelId="target-label"
                        label="Target"
                        value = {moveInfo.targetID}
                        renderValue={(value) => roles[value] !== undefined ? roles[value] : info.startingState.raiders[moveInfo.targetID].role}
                        disabled = {disableTarget}
                        onChange={(e) =>setInfoParam("targetID")(e.target.value)}
                        sx={{ maxWidth : "150px"}}
                    >
                        {validTargets.map((id) => <MenuItem value={id}>{roles[id]}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>
            <FormControl component="fieldset">
                <FormGroup>
                    <Stack direction="row" spacing={-0.5}>
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    size="small" 
                                    checked={critChecked}
                                    onChange={
                                        (e) => {
                                            setMoveInfo({...moveInfo, options: {...moveInfo.options, crit: !critChecked}});
                                        }
                                    }
                                />} 
                            label="Crit"
                            labelPlacement="top"
                        />
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    size="small" 
                                    checked={effectChecked}
                                    onChange={
                                        (e) => {
                                            setMoveInfo({...moveInfo, options: {...moveInfo.options, secondaryEffects: !effectChecked}});
                                        }
                                    }
                                />} 
                            label="Effect"
                            labelPlacement="top"
                        />
                    </Stack>
                </FormGroup>
            </FormControl>
        </Stack>
    )
}

function BossMoveDropdown({index, boss, info, setInfo}: {index: number, boss: Raider, info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const moveInfo = info.turns[index].bossMoveInfo;
    const moveName = moveInfo.moveData.name;
    const turnID = info.turns[index].id;
    const moveSet = ["(No Move)", ...boss.moves, ...boss.extraMoves];

    const setMoveInfo = (moveInfo: RaidMoveInfo) => {
        let newTurns = [...info.turns]; 
        newTurns[index].bossMoveInfo = moveInfo;
        setInfo({...info, turns: newTurns});
    }

    useEffect(() => {
        if (moveName === "(No Move)") {
            setMoveInfo({...moveInfo, moveData: {name: moveName}});
        } else {
            async function fetchData() {
                let mData = await PokedexService.getMoveByName(moveName) as MoveData;     
                setMoveInfo({...moveInfo, moveData: mData});
            }
            fetchData().catch((e) => console.log(e));
        }
      }, [moveName, turnID])

    const critChecked = moveInfo.options ? (moveInfo.options.crit || false) : false; 
    const effectChecked = moveInfo.options ? (moveInfo.options.secondaryEffects || false) : false;
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1">{info.startingState.raiders[0].role + " uses"}</Typography>
            <FormControl>
                <InputLabel id={"boss-move-label"}>Boss Move</InputLabel>
                <Select 
                    size="small"
                    labelId="boss-move-label"
                    label="Boss Move"
                    value = {moveName}
                    onChange={(e) => setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: (e.target.value || "(No Move)") as MoveName}})}
                    sx={{ maxWidth : "150px"}}
                >
                    {moveSet.map((move) => <MenuItem value={move}>{move}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl component="fieldset">
                <FormGroup>
                    <Stack direction="row" spacing={-0.5}>
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    size="small" 
                                    checked={critChecked}
                                    onChange={
                                        (e) => {
                                            setMoveInfo({...moveInfo, options: {...moveInfo.options, crit: !critChecked}});
                                        }
                                    }
                                />} 
                            label="Crit"
                            labelPlacement="top"
                        />
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    size="small" 
                                    checked={effectChecked}
                                    onChange={
                                        (e) => {
                                            setMoveInfo({...moveInfo, options: {...moveInfo.options, secondaryEffects: !effectChecked}});
                                        }
                                    }
                                />} 
                            label="Effect"
                            labelPlacement="top"
                        />
                    </Stack>
                </FormGroup>
            </FormControl>
        </Stack>
    )
}

function MoveSelectionRow({raiders, index, info, setInfo}: {raiders: Raider[], index: number, info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const turnID = info.turns[index].id;
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
                    <Paper sx={{ p: 1, my: 1}}>
                        <Stack
                            direction = "column"
                            spacing={1}
                            alignItems="center"
                            sx={{ p: 1 }}
                        >
                            <MoveDropdown index={index} raiders={raiders} info={info} setInfo={setInfo} />
                            <Box width="80%" paddingBottom={1}>
                                <Divider />
                            </Box>
                            <BossMoveDropdown index={index} boss={raiders[0]} info={info} setInfo={setInfo}/>
                        </Stack>
                    </Paper>
                </div>
            )}

        </Draggable>

    )
}

function MoveSelection({info, setInfo}:{info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const onDragEnd = (result: DropResult) => {
        const {destination, source, draggableId} = result;
        if (!destination) { return }; 
        if (destination.droppableId === source.droppableId &&
            destination.index === source.index) { return }; 
        const newTurns = [...info.turns];
        const movedTurn = newTurns.splice(source.index, 1)[0];
        newTurns.splice(destination.index, 0, movedTurn);
        setInfo({...info, turns: newTurns});
    };
    return (
        <DragDropContext
            // onDragStart={}
            // onDragUpdate={}
            onDragEnd={onDragEnd}
        >
            <Droppable droppableId={"raid-turns"}>
                {(provided) => (
                    <Stack direction="column" spacing={0}
                        ref={provided.innerRef}
                        {...provided.droppableProps} 
                    >
                        {
                            info.turns.map((turn, index) => (
                                <MoveSelectionRow 
                                    raiders={info.startingState.raiders} 
                                    index={index} 
                                    info={info} 
                                    setInfo={setInfo} 
                                />
                        ))}
                            {provided.placeholder}
                        </Stack>
                    )
                }
            </Droppable>
        </DragDropContext>
    )
}

export default MoveSelection;