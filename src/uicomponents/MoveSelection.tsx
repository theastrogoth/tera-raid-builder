import React, { useState, useEffect }  from "react"
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from '@mui/icons-material/Add';
// import Collapse from '@mui/material/Collapse';

import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";

import { MoveName } from "../calc/data/interface";
import { MoveData, RaidBattleInfo, RaidMoveInfo, RaidTurnInfo, Raider } from "../raidcalc/interface";
import PokedexService from "../services/getdata";
import { getPokemonSpriteURL } from "../utils";

// function timeout(delay: number) {
//     return new Promise( res => setTimeout(res, delay) );
// }

const handleAddTurn = (info: RaidBattleInfo, setInfo: (i: RaidBattleInfo) => void) => (index: number) => () => {
    let uniqueId = 0;
    info.turns.forEach((turn) => {
        if (turn.id >= uniqueId) {
            uniqueId = turn.id + 1;
        }
    })
    let group: number | undefined = undefined;
    if (index > 0 && index < info.turns.length) {
        const prev = info.turns[index-1].group;
        const next = info.turns[index].group;
        if (prev !== undefined && prev === next) {
            group = prev;
        }
    }
    let newTurns = [...info.turns];
    const newTurn: RaidTurnInfo = {
        id: uniqueId,
        group: group,
        moveInfo: {userID: 1, targetID: 0, moveData: {name: "(No Move)" as MoveName}, options: {crit: false, secondaryEffects: false, roll: "min" }},
        bossMoveInfo: {userID: 0, targetID: 1, moveData: {name: "(No Move)" as MoveName}, options: {crit: false, secondaryEffects: false, roll: "max" }},
    }
    newTurns.splice(index, 0, newTurn);

    const newInfo = {...info, turns: newTurns};
    if (group !== undefined) {
        newInfo.groups[group].push(uniqueId);
    }
    setInfo(prepareGroups(newInfo));
}

function MoveOptionsControls({moveInfo, setMoveInfo}: {moveInfo: RaidMoveInfo, setMoveInfo: (m: RaidMoveInfo) => void}) {
    const critChecked = moveInfo.options ? (moveInfo.options.crit || false) : false; 
    const effectChecked = moveInfo.options ? (moveInfo.options.secondaryEffects || false) : false;
    const roll = moveInfo.options ? (moveInfo.options.roll) || "avg" : "avg";

    return (
        <Stack direction="row">
        <FormControl component="fieldset" size="small">
            <FormGroup>
                <Stack direction="row" spacing={-1}>
                    <FormControlLabel 
                        control={
                            <Checkbox 
                                size="small" 
                                style={{ padding: "4px"}}
                                checked={critChecked}
                                onChange={
                                    (e) => {
                                        setMoveInfo({...moveInfo, options: {...moveInfo.options, crit: !critChecked}});
                                    }
                                }
                            />} 
                        label={<Typography variant="body2">Crit</Typography>}
                        labelPlacement="top"
                        
                    />
                    <FormControlLabel 
                        control={
                            <Checkbox 
                                size="small" 
                                style={{ padding: "4px"}}
                                checked={effectChecked}
                                onChange={
                                    (e) => {
                                        setMoveInfo({...moveInfo, options: {...moveInfo.options, secondaryEffects: !effectChecked}});
                                    }
                                }
                            />} 
                        label={<Typography variant="body2">Effect</Typography>}
                        labelPlacement="top"
                    />
                </Stack>
            </FormGroup>
        </FormControl>
        <Stack direction="column" sx={{ paddingLeft: 1.5}}>
            <Typography variant="body2">Roll</Typography>
            <Select
                size="small"
                variant="standard"
                value = {roll}
                onChange={(e) => setMoveInfo({...moveInfo, options: {...moveInfo.options, roll: e.target.value as "min" | "max" | "avg" }})}
                sx={{ width : "40px"}}
            >
                {["min", "avg", "max"].map((r, i) => <MenuItem key={i} value={r}><Typography variant="body2">{r}</Typography></MenuItem>)}
            </Select>
        </Stack>
    </Stack>
    )
}

function MoveDropdown({index, raiders, info, setInfo}: {index: number, raiders: Raider[], info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const roles = raiders.map((raider) => raider.role);
    const moveInfo = info.turns[index].moveInfo;
    const moveName = moveInfo.moveData.name;

    const moves = raiders[moveInfo.userID].moves;
    const moveSet = ["(No Move)", ...moves, "Attack Cheer", "Defense Cheer", "Heal Cheer"];
    
    const setMoveInfo = (moveInfo: RaidMoveInfo) => {
        let newTurns = [...info.turns];
        newTurns[index].moveInfo = moveInfo;
        setInfo({...info, turns: newTurns});
    }

    const setInfoParam = (param: string) => (val: any) => {
        setMoveInfo({...moveInfo, [param]: val});
    }
    
    useEffect(() => {
        if (!moves.includes(moveName)) {
            setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: "(No Move)" as MoveName}});
        }
    }, [moves])

    useEffect(() => {
        if (moveName === "(No Move)") {
            setMoveInfo({...moveInfo, moveData: {name: moveName}});
        } else if (moveName === "Attack Cheer" || moveName === "Defense Cheer") {
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

    const disableTarget = moveInfo.moveData.name === "(No Move)" ||
            moveInfo.moveData.target === "user-and-allies" ||
            moveInfo.moveData.target === "all-other-pokemon" ||
            moveInfo.moveData.target === "user" ||
            moveInfo.moveData.target === "all-pokemon" ||
            moveInfo.moveData.target === "entire-field";

    const renderPokemonMenuItem = (checkDisabled: boolean = false) => (value: number) => {
        const raider = checkDisabled ? (disableTarget ? raiders[moveInfo.userID] : raiders[value]) : raiders[value];
        const role = raider.role;
        const name = raider.name;
        return (
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
        )
    }
        

    let validTargets = [0,1,2,3,4];
    if (!disableTarget) { validTargets.splice(moveInfo.userID, 1); }
    
    return (
        <Stack direction="row" spacing={-0.5} alignItems="center" justifyContent="right">
            <Stack width="415px" direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                <Box flexGrow={1} />
                <Box>
                    <Select
                        size="small"
                        variant="standard"
                        value = {moveInfo.userID}
                        renderValue={renderPokemonMenuItem()}
                        onChange={(e) => setInfoParam("userID")(e.target.value)}
                        sx={{ maxWidth : "130px"}}
                    >
                        {roles.slice(1).map((role, i) => <MenuItem key={i} value={i+1}>{role}</MenuItem>)}
                    </Select>
                </Box>
                <Typography variant="body2">uses</Typography>
                <Box>
                    <Select 
                        size="small"
                        variant="standard"
                        value = {moveInfo.moveData.name}
                        renderValue={(value) => <Typography variant="body2">{value}</Typography>}
                        onChange={(e) => setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: (e.target.value || "(No Move)") as MoveName}})}
                        sx={{ maxWidth : "120px"}}
                    >
                        {moveSet.map((move, i) => <MenuItem key={i} value={move}>{move}</MenuItem>)}
                    </Select>
                </Box>
                <Typography variant="body2">on</Typography>
                <Box>
                    <Select
                        size="small"
                        variant="standard"
                        value = {moveInfo.targetID}
                        renderValue={renderPokemonMenuItem(true)}
                        disabled = {disableTarget}
                        onChange={(e) =>setInfoParam("targetID")(e.target.value)}
                        sx={{ maxWidth : "130px"}}
                    >
                        {validTargets.map((id, i) => <MenuItem key={i} value={id}>{roles[id]}</MenuItem>)}
                    </Select>
                </Box>
                <Box flexGrow={1} />
            </Stack>
            <MoveOptionsControls moveInfo={moveInfo} setMoveInfo={setMoveInfo} />
        </Stack>
    )
}

function BossMoveDropdown({index, boss, info, setInfo}: {index: number, boss: Raider, info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const moveInfo = info.turns[index].bossMoveInfo;
    const moveName = moveInfo.moveData.name;
    const turnID = info.turns[index].id;
    const moveSet = ["(No Move)", ...boss.moves, ...(boss.extraMoves) || []];

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
    
    return (
        <Stack direction="row" spacing={-0.5} alignItems="center" justifyContent="right">
            <Stack direction="row" width="415px" spacing={0.5} alignItems="center" justifyContent="right">
                <Box flexGrow={1} />
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
                <Typography variant="body2">uses</Typography>
                <Select 
                    size="small"
                    variant="standard"
                    value = {moveName}
                    onChange={(e) => setMoveInfo({...moveInfo, moveData: {...moveInfo.moveData, name: (e.target.value || "(No Move)") as MoveName}})}
                    sx={{ maxWidth : "150px"}}
                >
                    {moveSet.map((move, i) => <MenuItem key={i} value={move}>{move}</MenuItem>)}
                </Select>
                <Box flexGrow={1} />
            </Stack>
            <MoveOptionsControls moveInfo={moveInfo} setMoveInfo={setMoveInfo} />
        </Stack>
    )
}

function MoveSelectionContainer({raiders, index, info, setInfo, buttonsVisible}: {raiders: Raider[], index: number, info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>, buttonsVisible: boolean}) {
    const turnID = info.turns[index].id;
    // const [collapseIn, setCollapseIn] = useState(false);
    // const [initiateCollapse, setInitiateCollapse] = useState(false);
    // const [initiateGrow, setInitiateGrow] = useState(false);
    // const [triggerRemove, setTriggerRemove] = useState(false);
    // const [triggerAdd, setTriggerAdd] = useState(false);
    // const [waitAdd, setWaitAdd] = useState(false);

    // const brandNewTurnID = !turnIDs.current.includes(turnID);

    // const useCollapse = initiateCollapse || triggerAdd;
    // const hideCard = useCollapse || initiateGrow || brandNewTurnID;

    // useEffect(() => {
    //     if (brandNewTurnID) {
    //         setInitiateGrow(true);
    //         setCollapseIn(false);
    //     } else {
    //         setCollapseIn(true);
    //     }
    //     turnIDs.current = info.turns.map((turn) => turn.id);
    // }, [brandNewTurnID])

    // useEffect(() => {
    //     if (initiateGrow) {
    //         setCollapseIn(false);
    //         setTriggerAdd(true);
    //     }
    // }, [initiateGrow])

    // useEffect(() => {
    //     if (triggerAdd) {
    //         setCollapseIn(true);
    //         setWaitAdd(true);
    //     }
    // }, [triggerAdd])

    // useEffect(() => {
    //     if (waitAdd) {
    //         async function addTurn() {
    //             await timeout(400)
    //             setInitiateGrow(false);
    //             setTriggerAdd(false);
    //             setWaitAdd(false);
    //         }
    //         addTurn();
    //     }
    // }, [waitAdd])

    // useEffect(() => {
    //     if (initiateCollapse && !triggerAdd) {
    //         setCollapseIn(false);
    //         setTriggerRemove(true);
    //     }
    // }, [initiateCollapse])

    // useEffect(() => {
    //     if (triggerRemove) {
    //         async function removeTurn() {
    //             await timeout(400);
    //             handleRemoveTurn()
    //             setTriggerRemove(false);
    //             setInitiateCollapse(false);
    //             setCollapseIn(true);
    //         }
    //         removeTurn();
    //     }
    // }, [triggerRemove])

    // const handleRemoveTurn = () => {
    //     let newTurns = [...info.turns];
    //     newTurns.splice(index, 1);
    //     setInfo({...info, turns: newTurns});
    //     turnIDs.current = newTurns.map((turn) => turn.id);
    // }

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
                    {/* {useCollapse &&
                        <Collapse appear={false} in={collapseIn} timeout={250}>
                            <MoveSelectionCard raiders={raiders} index={index} info={info} setInfo={setInfo} setInitiateCollapse={setInitiateCollapse}/>
                        </Collapse>
                    }
                    {!hideCard &&
                        <MoveSelectionCard raiders={raiders} index={index} info={info} setInfo={setInfo} setInitiateCollapse={setInitiateCollapse}/>
                    } */}
                    <MoveSelectionCard raiders={raiders} index={index} info={info} setInfo={setInfo} buttonsVisible={buttonsVisible} />

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

function MoveSelectionCard({raiders, index, info, setInfo, buttonsVisible}: {raiders: Raider[], index: number, info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>, buttonsVisible: boolean}) {

    const handleRemoveTurn = () => {
        let newTurns = [...info.turns];
        newTurns.splice(index, 1);
        setInfo(prepareGroups({...info, turns: newTurns}));
    }

    const group = info.turns[index].group;
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
                        <MoveDropdown index={index} raiders={raiders} info={info} setInfo={setInfo} />
                        {/* <Box width="80%">
                            <Divider />
                        </Box> */}
                        <BossMoveDropdown index={index} boss={raiders[0]} info={info} setInfo={setInfo}/>
                    </Stack>
                    <Stack alignItems="center" justifyContent={"center"} paddingRight={0.5}>
                        <CloseButton onClick={handleRemoveTurn} visible={true} disabled={(info.turns.length <= 1) || !buttonsVisible}/>
                    </Stack>
                </Stack>
            </Paper>
            <AddButton onClick={handleAddTurn(info, setInfo)(index+1)} visible={buttonsVisible} />
        </Stack>
    )
}

function prepareGroups(info: RaidBattleInfo) {
    const newInfo = {...info};
    // ensure adjacenty
    for (let i=0; i<newInfo.turns.length; i++) {
        const currGroup = newInfo.turns[i].group;
        const prevGroup = i === 0 ? undefined : newInfo.turns[i-1].group;
        const nextGroup = i === newInfo.turns.length-1 ? undefined : newInfo.turns[i+1].group;
    
        if (currGroup !== undefined && !(prevGroup === currGroup || currGroup === nextGroup)) {
            newInfo.groups[currGroup].splice(newInfo.groups[currGroup].indexOf(newInfo.turns[i].id), 1);
            newInfo.turns[i].group = undefined;
        }
    }
    // ensure no singletons
    newInfo.groups = newInfo.groups.filter((group) => group.length > 1);
    // clear old group assignments
    for (let turn of newInfo.turns) {
        turn.group = undefined;
    }
    // add new group assignments
    for (let i=0; i<newInfo.groups.length; i++) {
        const group = newInfo.groups[i];
        for (let turnID of group) {
            const turn = newInfo.turns.find((turn) => turn.id === turnID);
            if (turn) {
                turn.group = i;
            }
        }
    }
    return newInfo;
}

function MoveSelection({info, setInfo}: {info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
        
    const [buttonsVisible, setButtonsVisible] = useState(true);

    const onDragStart = () => {
        setButtonsVisible(false);
    }

    const onDragEnd = (result: DropResult) => {
        setButtonsVisible(true);
        const {destination, source, draggableId, combine} = result;
        const newInfo = {...info};
        let destinationIndex = destination ? destination.index : source.index;
        if (combine) {
            const movedIndex = result.source.index;
            const movedID = newInfo.turns[movedIndex].id;
            const targetID = parseInt(combine.draggableId);
            const idsByIndex = info.turns.map((turn) => turn.id);
            const targetIndex = idsByIndex.indexOf(targetID);
            destinationIndex = movedIndex > targetIndex ? targetIndex : targetIndex-1;

            const movedFromGroup = info.turns[movedIndex].group;
            const targetGroup = info.turns[targetIndex].group;

            // remove membership from former group
            if (movedFromGroup !== undefined) {
                const groupIndex = info.groups[movedFromGroup].indexOf(movedID);
                newInfo.groups[movedFromGroup].splice(groupIndex, 1);
            }
            // create new group or add membership to existing group
            if (targetGroup === undefined) {
                newInfo.turns[movedIndex].group = newInfo.groups.length;
                newInfo.turns[targetIndex].group = newInfo.groups.length;
                newInfo.groups.push([targetID, movedID]);
            } else {
                newInfo.turns[movedIndex].group = targetGroup;
                newInfo.groups[targetGroup].push(movedID);
            } 
        }
        if (!destination && !combine) { return }; 
        if (!combine && (!destination || (destination.droppableId === source.droppableId &&
            destination.index === source.index))) { return }; 
        const movedTurn = newInfo.turns.splice(source.index, 1)[0];
        newInfo.turns.splice(destinationIndex, 0, movedTurn);
        setInfo(prepareGroups(newInfo));
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
                            <AddButton onClick={handleAddTurn(info, setInfo)(0)} visible={buttonsVisible}/>
                            {
                                info.turns.map((turn, index) => (
                                    <MoveSelectionContainer 
                                        key={index}
                                        raiders={info.startingState.raiders} 
                                        index={index} 
                                        info={info} 
                                        setInfo={setInfo} 
                                        buttonsVisible={buttonsVisible}
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