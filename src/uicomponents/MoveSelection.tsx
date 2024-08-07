import React, { useState, useEffect, useRef }  from "react"
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import MuiInput from '@mui/material/Input';
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import Collapse from '@mui/material/Collapse';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { styled } from '@mui/material/styles';

import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";

import { MoveName } from "../calc/data/interface";
import { MoveData, RaidMoveInfo, RaidTurnInfo, Raider, TurnGroupInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { getPokemonSpriteURL, arraysEqual, getTranslation, getSelectableTargets } from "../utils";
import { useTheme } from '@mui/material/styles';
import { alpha } from "@mui/material";
import { RaidBattleResults } from "../raidcalc/RaidBattle";
import { getSelectableMoves, isRegularMove } from "../raidcalc/util";

const RepeatsInput = styled(MuiInput)`
  width: 42px;
`;

const handleAddGroup = (groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, rollCase: "min" | "avg" | "max", setTransitionIn: (n: number) => void) => (index: number) => () => {
    let uniqueGroupId = 0;
    const takenGroupIds = groups.map((group) => group.id);
    for (let i=0; i<takenGroupIds.length+1; i++) {
        if (!takenGroupIds.includes(i)) {
            uniqueGroupId = i;
            break;
        }
    }
    let uniqueTurnId = 0;
    const takenTurnIds = groups.map((group) => group.turns.map((turn) => turn.id)).flat();
    for (let i=0; i<=takenTurnIds.length+1; i++) {
        if (!takenTurnIds.includes(i)) {
            uniqueTurnId = i;
            break;
        }
    }
    let newGroups = [...groups];
    const newGroup: TurnGroupInfo = 
    {   id: uniqueGroupId,
        repeats: 1,
        turns: [
            {
                id: uniqueTurnId,
                group: uniqueGroupId,
                moveInfo: {
                    userID: 1, 
                    targetID: 0, 
                    moveData: {name: "(No Move)" as MoveName}, 
                    options: {
                        crit: rollCase === "max", 
                        secondaryEffects: rollCase === "max", 
                        allowMiss: rollCase === "min",
                        roll: rollCase, 
                        hits: rollCase === "max" ? 10 : 1,
                    }
                },
                bossMoveInfo: {
                    userID: 0, 
                    targetID: 1,
                    moveData: {name: "(Most Damaging)" as MoveName}, 
                    options: {
                        crit: rollCase === "min", 
                        secondaryEffects: rollCase === "min", 
                        allowMiss: rollCase === "max",
                        roll: rollCase === "max" ? "min" : (rollCase === "min" ? "max" : rollCase), 
                        hits: rollCase === "min" ? 10 : 1, 
                    }
                },
            }
        ],
    };
    newGroups.splice(index, 0, newGroup);
    setGroups(newGroups);
    setTransitionIn(uniqueTurnId);
}

const handleAddTurn = (groupIndex: number, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, rollCase: "min" | "avg" | "max", setTransitionIn: (n: number) => void) => (turnIndex: number) => () => {
    let uniqueId = 0;
    const takenIds = groups.map((group) => group.turns.map((turn) => turn.id)).flat();
    for (let i=0; i<=takenIds.length+1; i++) {
        if (!takenIds.includes(i)) {
            uniqueId = i;
            break;
        }
    }
    let newGroups = [...groups];
    const newTurn: RaidTurnInfo = {
        id: uniqueId,
        group: newGroups[groupIndex].id,
        moveInfo: {
            userID: 1, 
            targetID: 0, 
            moveData: {name: "(No Move)" as MoveName}, 
            options: {
                crit: rollCase === "max", 
                secondaryEffects: rollCase === "max", 
                roll: rollCase, 
                allowMiss: rollCase === "min",
                hits: rollCase === "max" ? 10 : 1,
            }
        },
        bossMoveInfo: {
            userID: 0, 
            targetID: 1,
            moveData: {name: "(Most Damaging)" as MoveName}, 
            options: {
                crit: rollCase === "min", 
                secondaryEffects: rollCase === "min", 
                roll: rollCase === "max" ? "min" : (rollCase === "min" ? "max" : rollCase), 
                allowMiss: rollCase === "max",
                hits: rollCase === "min" ? 10 : 1, 
            }
        },
    };
    newGroups[groupIndex].turns.splice(turnIndex, 0, newTurn);
    setGroups(newGroups);
    setTransitionIn(uniqueId);
}

function MoveOptionsControls({moveInfo, setMoveInfo, raider, isBoss = false, translationKey}: {moveInfo: RaidMoveInfo, setMoveInfo: (m: RaidMoveInfo) => void, raider: Raider, isBoss?: boolean, translationKey: any}) {
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
    const allowMissChecked = moveInfo.options ? (moveInfo.options.allowMiss || false) : false;
    const roll = moveInfo.options ? (moveInfo.options.roll) || "avg" : "avg";
    const activateTeraChecked = moveInfo.options ? (moveInfo.options.activateTera || false) : false;

    return (
        <Box>
            <IconButton 
                onClick={handleClick}
            >
                <MenuIcon />
            </IconButton>
            <Popover
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
                <Stack direction="column" spacing={1} sx={{ py: 1.5 }}>
                    <Typography variant="body1" fontWeight="bold" paddingLeft={1.5}>
                        {getTranslation("Options",translationKey) + ":"}
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                { (!isBoss && raider.teraType && !raider.isTera && ((raider.teraCharge || 0) >= 3)) &&
                                    <TableRow>
                                        <TableCell>
                                            {getTranslation("Tera",translationKey)}
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                size="small" 
                                                style={{ padding: "4px"}}
                                                checked={activateTeraChecked}
                                                onChange={
                                                    (e) => {
                                                        setMoveInfo({...moveInfo, options: {...moveInfo.options, activateTera: !activateTeraChecked}});
                                                    }
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                }
                                <TableRow>
                                    <TableCell>
                                        {getTranslation("Crit",translationKey)}
                                    </TableCell>
                                    <TableCell>
                                        <Switch 
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
                                    <TableCell>
                                        {getTranslation("Effect",translationKey)}
                                    </TableCell>
                                    <TableCell>
                                        <Switch 
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
                                    <TableCell>
                                        {getTranslation("Allow Miss",translationKey)}
                                    </TableCell>
                                    <TableCell>
                                        <Switch 
                                            size="small" 
                                            style={{ padding: "4px"}}
                                            checked={allowMissChecked}
                                            onChange={
                                                (e) => {
                                                    setMoveInfo({...moveInfo, options: {...moveInfo.options, allowMiss: !allowMissChecked}});
                                                }
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>
                                        {getTranslation("Roll",translationKey)}
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>
                                        <Select
                                            size="small"
                                            variant="standard"
                                            value = {roll}
                                            renderValue = {(value) => <Typography variant="body2">{getTranslation(value, translationKey)}</Typography>}
                                            onChange={(e) => setMoveInfo({...moveInfo, options: {...moveInfo.options, roll: e.target.value as "min" | "max" | "avg" }})}
                                            sx={{ minWidth : "50px"}}
                                        >
                                            {["min", "avg", "max"].map((r, i) => <MenuItem key={i} value={r}><Typography variant="body2">{getTranslation(r, translationKey)}</Typography></MenuItem>)}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                { (moveInfo.moveData.maxHits && moveInfo.moveData.maxHits > 1) &&
                                    <TableRow>
                                        <TableCell sx={{ borderBottom: 0 }}>
                                            {getTranslation("# Hits", translationKey)}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 0 }}>
                                            <Select
                                                size="small"
                                                variant="standard"
                                                value = {moveInfo.options ? moveInfo.options.hits : 1}
                                                onChange={(e) => setMoveInfo({...moveInfo, options: {...moveInfo.options, hits: Number(e.target.value) }})}
                                                sx={{ minWidth : "50px"}}
                                            >
                                                {[...Array(moveInfo.moveData.maxHits!+1).keys()].slice(moveInfo.moveData.minHits || 1)
                                                    .map((r, i) => <MenuItem key={i} value={r}><Typography variant="body2">{r}</Typography></MenuItem>)
                                                }
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                }
                                {/* {isBoss &&
                                    <TableRow>
                                        <TableCell sx={{ borderBottom: 0 }}>
                                            {getTranslation("Steal Tera Charge", translationKey)}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 0 }}>
                                            <Switch 
                                                size="small" 
                                                style={{ padding: "4px"}}
                                                checked={moveInfo.options?.stealTeraCharge || false}
                                                onChange={
                                                    (e) => {
                                                        setMoveInfo({...moveInfo, options: {...moveInfo.options, stealTeraCharge: !moveInfo.options?.stealTeraCharge}});
                                                    }
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                } */}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </Popover>
        </Box>
    )
}

function MoveDropdown({groupIndex, turnIndex, raiders, groups, setGroups, selectableMoves, translationKey}: 
    {groupIndex: number, turnIndex: number, raiders: Raider[], groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, selectableMoves: MoveName[], translationKey: any}) 
{
    const roles = raiders.map((raider) => raider.role);
    const moveInfo = groups[groupIndex].turns[turnIndex].moveInfo;
    const moveName = moveInfo.moveData.name;

    const targetRef = useRef(moveInfo.moveData.target);

    const moves = getSelectableMoves(raiders[moveInfo.userID]); // raiders[moveInfo.userID].moves;
    const moveSet = ["(No Move)", "(Most Damaging)", ...moves, "Attack Cheer", "Defense Cheer", "Heal Cheer"];

    const [disableTarget, setDisableTarget] = useState<boolean>(
            moveInfo.moveData.name === "(No Move)" ||
            moveInfo.moveData.target === undefined ||
            moveInfo.moveData.target === "user" ||
            moveInfo.moveData.target === "user-and-allies" ||
            moveInfo.moveData.target === "all-allies" ||
            // moveInfo.moveData.target === "all-opponents" ||
            // moveInfo.moveData.target === "all-other-pokemon" ||
            // moveInfo.moveData.target === "all-pokemon" ||
            moveInfo.moveData.target === "users-field" ||
            moveInfo.moveData.target === "opponents-field" ||
            moveInfo.moveData.target === "entire-field"
    );
    const [validTargets, setValidTargets] = useState<number[]>(disableTarget ? [moveInfo.userID] : getSelectableTargets(moveInfo.moveData.target).filter((id) => id !== moveInfo.userID));
    
    const setMoveInfo = (moveInfo: RaidMoveInfo) => {
        let newGroups = [...groups];
        newGroups[groupIndex].turns[turnIndex].moveInfo = moveInfo;

        const newDisableTarget = (
            moveInfo.moveData.name === "(No Move)" ||
            moveInfo.moveData.target === undefined ||
            moveInfo.moveData.target === "user" ||
            moveInfo.moveData.target === "user-and-allies" ||
            moveInfo.moveData.target === "all-allies" ||
            // moveInfo.moveData.target === "all-opponents" ||
            // moveInfo.moveData.target === "all-other-pokemon" ||
            // moveInfo.moveData.target === "all-pokemon" ||
            moveInfo.moveData.target === "users-field" ||
            moveInfo.moveData.target === "opponents-field" ||
            moveInfo.moveData.target === "entire-field"
        );
        const newValidTargets = newDisableTarget ? [moveInfo.userID] : getSelectableTargets(moveInfo.moveData.target).filter((id) => id !== moveInfo.userID)
    
        setDisableTarget(newDisableTarget);
        setValidTargets(newValidTargets);
        if (!newValidTargets.includes(moveInfo.targetID)) {
            newGroups[groupIndex].turns[turnIndex].moveInfo.targetID = newValidTargets[0];
        }
        setGroups(newGroups);
    }

    const setInfoParam = (param: string) => (val: any) => {
        setMoveInfo({...moveInfo, [param]: val});
    }
    
    useEffect(() => {
        if (!moveSet.includes(moveName)) {
            setMoveInfo({...moveInfo, moveData: {name: "(No Move)" as MoveName}});
        }
        if (targetRef.current !== moveInfo.moveData.target) {
            targetRef.current = moveInfo.moveData.target;
            setMoveInfo(moveInfo);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moveSet, moveInfo.moveData.target])

    return (
        <Stack direction="row" spacing={-0.5} alignItems="center" justifyContent="right">
            <Stack width="450px" direction="row" spacing={0.5} alignItems="center" justifyContent="center">
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
                <Typography variant="body2">
                    {getTranslation("uses", translationKey)}
                </Typography>
                <Box flexGrow={1} />
                <Stack direction="row" justifyContent="center" alignItems="center">
                    {/* {(moveInfo.options!.activateTera && raiders[moveInfo.userID].teraType) &&
                        <Box
                            sx={{
                                width: "25px",
                                height: "25px",
                                overflow: 'hidden',
                                background: `url(${getTeraTypeIconURL(raiders[moveInfo.userID].teraType!)}) no-repeat center center / contain`,
                            }}
                        />

                    } */}
                    <Select 
                        size="small"
                        variant="standard"
                        value = {moveInfo.moveData.name}
                        renderValue={
                            (value) => <Typography variant="body2">{
                                getTranslation(value, translationKey, "moves")
                            }</Typography>
                        }
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
                        {moveSet.map((move, i) => 
                        <MenuItem 
                            key={i} 
                            value={move}
                        >
                            <Typography 
                                variant="body2"
                            >
                                { getTranslation(move, translationKey, "moves") }
                            </Typography>
                        </MenuItem>
                    )}
                    </Select>
                </Stack>
                <Box flexGrow={1} />
                <Typography variant="body2">
                {getTranslation("on", translationKey)}
                </Typography>
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
            <MoveOptionsControls moveInfo={moveInfo} setMoveInfo={setMoveInfo} raider={raiders[moveInfo.userID]} translationKey={translationKey}/>
        </Stack>
    )
}

function BossMoveDropdown({groupIndex, turnIndex, boss, groups, setGroups, selectableMoves, translationKey}: 
    {groupIndex: number, turnIndex: number, boss: Raider, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, selectableMoves: MoveName[], translationKey: any}) 
{
    const moveInfo = groups[groupIndex].turns[turnIndex].bossMoveInfo;
    const moveSet = ["(No Move)", "(Most Damaging)", "(Optimal Move)", ...selectableMoves, "Remove Negative Effects", "Clear Boosts / Abilities", "Steal Tera Charge", "Activate Shield"];

    const moveName = moveInfo.moveData.name;
    const [updateCount, setUpdateCount] = useState<number>(0); // just used to trigger rerender

    const setMoveInfo = (newMoveInfo: RaidMoveInfo) => {
        let newGroups = [...groups];
        newGroups[groupIndex].turns[turnIndex].bossMoveInfo = newMoveInfo;
        setGroups(newGroups);
        setUpdateCount(updateCount+1);
    }

    useEffect(() => {
        if (!moveSet.includes(moveName)) {
            setMoveInfo({...moveInfo, moveData: {name: "(No Move)" as MoveName}});
        } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moveSet])

    return (
        <Stack direction="row" spacing={-0.5} alignItems="center" justifyContent="right">
            <Stack direction="row" width="450px" spacing={0.5} alignItems="center" justifyContent="right">
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
                <Typography variant="body2">
                    {getTranslation("uses", translationKey)}
                </Typography>
                <Box flexGrow={1} />
                <Select 
                    size="small"
                    variant="standard"
                    value = {moveName}
                    renderValue={
                        (value) => <Typography variant="body2">{
                            getTranslation(value, translationKey, "moves")
                        }</Typography>
                    }
                    onChange={(e) => {
                        const name = e.target.value as MoveName;
                        let mData: MoveData = {name: name};
                        if (isRegularMove(name)) {
                            mData = [...boss.moveData, ...boss.extraMoveData!].find((m) => m.name === name) as MoveData;
                        }
                        setMoveInfo({...moveInfo, moveData: mData})}
                    }
                    sx={{ maxWidth : "150px"}}
                >
                    {moveSet.map((move, i) => 
                        <MenuItem 
                            key={i} 
                            value={move}
                        >
                            <Typography 
                                variant="body2"
                            >
                                { getTranslation(move, translationKey, "moves") }
                            </Typography>
                        </MenuItem>
                    )}
                </Select>
                <Box flexGrow={6} />
            </Stack>
            <MoveOptionsControls moveInfo={moveInfo} setMoveInfo={setMoveInfo} raider={boss} isBoss translationKey={translationKey} />
        </Stack>
    )
}

function MoveSelectionContainer({raiders, turnIndex, groupIndex, groups, setGroups, buttonsVisible, transitionIn, setTransitionIn, transitionOut, setTransitionOut, translationKey}: 
    {raiders: Raider[], turnIndex: number, groupIndex: number, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, buttonsVisible: boolean, transitionIn: number, setTransitionIn: (i: number) => void, transitionOut: number, setTransitionOut: (i: number) => void, translationKey: any}) 
{
    const turnID = groups[groupIndex].turns[turnIndex].id;
    const collapseIn = transitionOut !== turnID && transitionIn !== turnID;

    const raiderSelectableMoves = getSelectableMoves(raiders[groups[groupIndex].turns[turnIndex].moveInfo.userID]);
    const bossSelectableMoves = getSelectableMoves(raiders[0], groups[groupIndex].turns[turnIndex].moveInfo.moveData.name === "(No Move)");

    useEffect(() => {
        if (transitionIn === turnID) {
            setTransitionIn(-1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transitionIn])

    return (
        <Box sx={{ alignSelf: "center"}}>
            <Draggable
                key={"t"+turnID}
                draggableId={"t"+turnID}
                index={turnIndex}
            >
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        <Collapse in={collapseIn} timeout={250}>
                            <MoveSelectionCardMemo 
                                raiders={raiders} 
                                groupIndex={groupIndex} 
                                turnIndex={turnIndex} 
                                groups={groups} 
                                setGroups={setGroups} 
                                raiderSelectableMoves={raiderSelectableMoves}
                                bossSelectableMoves={bossSelectableMoves}
                                buttonsVisible={buttonsVisible} 
                                setTransitionIn={setTransitionIn} 
                                setTransitionOut={setTransitionOut} 
                                translationKey={translationKey}
                            />
                        </Collapse>
                    </div>
                )}
            </Draggable>
        </Box>
    )
}

function AddButton({label, onClick, visible, disabled=false, size="small"}: 
    {label: string, onClick: () => void, visible: boolean, disabled?: boolean, size?: "small" | "medium" | "large"}) 
{
    const [color, setColor] = useState<"inherit" | "primary">("inherit");
    return (
        <Box height="30px" alignSelf="center" justifySelf="center" alignContent="center">
            <Box hidden={!visible}>
                <Button
                    color={color}
                    size={size}
                    onMouseOver={() => { setColor("primary") }}
                    onMouseOut={() => { setColor("inherit") }}
                    disabled={disabled}
                    onClick={onClick}
                    startIcon={<AddIcon/>}
                >
                    {label}
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

function MoveSelectionCard({raiders, groupIndex, turnIndex, groups, setGroups, raiderSelectableMoves, bossSelectableMoves, buttonsVisible, setTransitionIn, setTransitionOut, translationKey}: 
    {raiders: Raider[], groupIndex: number, turnIndex: number, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, raiderSelectableMoves: MoveName[], bossSelectableMoves: MoveName[], buttonsVisible: boolean, setTransitionIn: (i: number) => void, setTransitionOut: (i: number) => void, translationKey: any}) 
{
    const timer = useRef<NodeJS.Timeout | null>(null);
    const handleRemoveTurn = () => {
        setTransitionOut(groups[groupIndex].turns[turnIndex].id);
        timer.current = setTimeout(() => {
            const newGroups: TurnGroupInfo[] = [...groups];
            newGroups[groupIndex].turns.splice(turnIndex, 1);
            setGroups(newGroups);
            setTransitionOut(-1);
            timer.current = null;
        }, 300)
    }

    const theme = useTheme();
    const color = alpha(theme.palette.background.paper, 0.5);

    return (        
        <Stack direction="column" spacing={0}>
            <Paper 
                sx={{ width: "550px", backgroundColor: color }} 
            >
                <Stack direction="row">
                    <Stack alignItems="center" justifyContent={"center"} paddingLeft={0.5}>
                        {/* @ts-ignore */}
                        <DragIndicatorIcon color="subdued" />
                    </Stack>
                    <Stack
                        direction = "column"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ p: 0.5 }}
                    >
                        <MoveDropdown groupIndex={groupIndex} turnIndex={turnIndex} raiders={raiders} groups={groups} setGroups={setGroups} selectableMoves={raiderSelectableMoves} translationKey={translationKey} />
                        {/* <Box width="80%">
                            <Divider />
                        </Box> */}
                        <BossMoveDropdown groupIndex={groupIndex} turnIndex={turnIndex} boss={raiders[0]} groups={groups} setGroups={setGroups} selectableMoves={bossSelectableMoves} translationKey={translationKey} />
                    </Stack>
                    <Stack alignItems="center" justifyContent={"center"} paddingRight={0.5}>
                        <CloseButton onClick={handleRemoveTurn} visible={true} disabled={!buttonsVisible}/>
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    )
}
const MoveSelectionCardMemo = React.memo(MoveSelectionCard, (prevProps, nextProps) => {
    const pGroup = prevProps.groups[prevProps.groupIndex];
    const nGroup = nextProps.groups[nextProps.groupIndex];
    const pTurn = pGroup.turns[prevProps.turnIndex];
    const nTurn = nGroup.turns[nextProps.turnIndex];
    const pRaider = pTurn ? prevProps.raiders[pTurn.moveInfo.userID] : undefined;
    const nRaider = nTurn ? nextProps.raiders[nTurn.moveInfo.userID] : undefined;
    return (
        prevProps.groupIndex === nextProps.groupIndex &&
        prevProps.turnIndex === nextProps.turnIndex && 
        pGroup.id === nGroup.id &&
        pGroup.repeats === nGroup.repeats &&
        (!!pTurn && !!nTurn) &&
        (pTurn === nTurn || (
            pTurn.id === nTurn.id &&
            pTurn.moveInfo.userID === nTurn.moveInfo.userID &&
            pTurn.moveInfo.targetID === nTurn.moveInfo.targetID &&
            pTurn.moveInfo.moveData.name === nTurn.moveInfo.moveData.name &&
            pTurn.bossMoveInfo.moveData.name === nTurn.bossMoveInfo.moveData.name &&
            pTurn.moveInfo.moveData.target === nTurn.moveInfo.moveData.target &&
            pTurn.bossMoveInfo.moveData.target === nTurn.bossMoveInfo.moveData.target &&
            pTurn.moveInfo.moveData.maxHits === nTurn.moveInfo.moveData.maxHits &&
            pTurn.bossMoveInfo.moveData.maxHits === nTurn.bossMoveInfo.moveData.maxHits &&
            pTurn.moveInfo.options?.crit === nTurn.moveInfo.options?.crit &&
            pTurn.moveInfo.options?.secondaryEffects === nTurn.moveInfo.options?.secondaryEffects &&
            pTurn.moveInfo.options?.roll === nTurn.moveInfo.options?.roll &&
            pTurn.moveInfo.options?.hits === nTurn.moveInfo.options?.hits &&
            pTurn.moveInfo.options?.allowMiss === nTurn.moveInfo.options?.allowMiss &&
            pTurn.bossMoveInfo.options?.crit === nTurn.bossMoveInfo.options?.crit &&
            pTurn.bossMoveInfo.options?.secondaryEffects === nTurn.bossMoveInfo.options?.secondaryEffects &&
            pTurn.bossMoveInfo.options?.roll === nTurn.bossMoveInfo.options?.roll &&
            pTurn.bossMoveInfo.options?.hits === nTurn.bossMoveInfo.options?.hits &&
            pTurn.bossMoveInfo.options?.allowMiss === nTurn.bossMoveInfo.options?.allowMiss
        )) &&
        (!!pRaider && !!nRaider) &&
        pRaider.teraCharge === nRaider.teraCharge &&
        pRaider.teraType === nRaider.teraType &&
        arraysEqual(prevProps.raiders.map((r) => r.name), nextProps.raiders.map((r) => r.name)) &&
        arraysEqual(prevProps.raiders.map((r) => r.role), nextProps.raiders.map((r) => r.role)) &&
        arraysEqual(prevProps.raiderSelectableMoves, nextProps.raiderSelectableMoves) &&
        arraysEqual(prevProps.bossSelectableMoves, nextProps.bossSelectableMoves) &&
        prevProps.buttonsVisible === nextProps.buttonsVisible &&
        prevProps.groups.length === nextProps.groups.length &&
        prevProps.translationKey === nextProps.translationKey
    )
});

function MoveGroupContainer({raidInputProps, results, groupIndex, firstMoveIndex, rollCase, buttonsVisible, transitionIn, setTransitionIn, transitionOut, setTransitionOut, translationKey}: 
    {raidInputProps: RaidInputProps, results: RaidBattleResults, groupIndex: number, firstMoveIndex: number, rollCase: "min" | "avg" | "max", buttonsVisible: boolean, transitionIn: number, setTransitionIn: (i: number) => void, transitionOut: number, setTransitionOut: (i: number) => void, translationKey: any}) {
    
    const color = "group" + raidInputProps.groups[groupIndex].id.toString().slice(-1) + ".main";
    const timer = useRef<NodeJS.Timeout | null>(null);

    const handleRemoveGroup = () => {
        const group = raidInputProps.groups[groupIndex];
        if (group.turns.length < 1) {
            const newGroups = [...raidInputProps.groups];
            newGroups.splice(groupIndex, 1);
            raidInputProps.setGroups(newGroups);
        } else  {
            const turnId = group.turns[0].id;
            const tempGroups = [...raidInputProps.groups];
            tempGroups[groupIndex].turns = [tempGroups[groupIndex].turns[0]];
            setTransitionOut(turnId);
            timer.current = setTimeout(() => {
                const newGroups = [...raidInputProps.groups];
                newGroups.splice(groupIndex, 1);
                raidInputProps.setGroups(newGroups);
                setTransitionOut(-1);
                timer.current = null;
            }, 300)
        }
    }

    return (
        <Stack spacing={0.75}>
            <Paper
                sx={{ backgroundColor: color, width: "585px", p:1 }}
            >
                <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" width="100%">
                    {/* @ts-ignore */}
                    <DragIndicatorIcon color="subdued" />
                    <Stack direction="column" width="100%">
                        <Droppable droppableId={`${groupIndex}`} type="turn">
                            {(provided) => (
                                <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    // sx={{ minHeight: "60px" }} 
                                >
                                    <MoveGroupCard raidInputProps={raidInputProps} results={results} groupIndex={groupIndex} firstMoveIndex={firstMoveIndex} buttonsVisible={buttonsVisible} transitionIn={transitionIn} setTransitionIn={setTransitionIn} transitionOut={transitionOut} setTransitionOut={setTransitionOut} translationKey={translationKey} />
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                        <Stack direction="row" justifyContent="center" alignItems="center" sx={{ paddingTop: 0.5, width: "100%" }}>
                            <Typography variant="body2" fontWeight="bold" paddingLeft={1}>
                                {
                                    getTranslation("Group", translationKey) + " # " + (groupIndex+1)
                                }
                            </Typography>
                            <Box flexGrow={5} />
                            <AddButton 
                                label={ getTranslation("Add Move", translationKey) }
                                onClick={handleAddTurn(groupIndex, raidInputProps.groups, raidInputProps.setGroups, rollCase, setTransitionIn)(raidInputProps.groups[groupIndex].turns.length)} 
                                visible={buttonsVisible}
                            />
                            <Box flexGrow={2} />
                            <Typography variant="body2" fontWeight="bold" paddingRight={1}>
                                {
                                    "# " + getTranslation("Executions", translationKey) + ":"
                                }
                            </Typography>
                            <RepeatsInput
                                value={(raidInputProps.groups[groupIndex].repeats || 1).toString()} 
                                onChange={(e) => {
                                    let val = e.target.value ? parseInt(e.target.value) : 1;
                                    val = Math.max(1, Math.min(20, val));
                                    const newGroups = [...raidInputProps.groups];
                                    newGroups[groupIndex].repeats = val;
                                    raidInputProps.setGroups(newGroups);
                                }} 
                                inputProps={{
                                    step: 0,
                                    min: 1,
                                    max: 20,
                                    type: 'number',
                                }}
                                sx={{
                                    paddingRight: 1,
                                }}
                            />
                            <Box paddingRight={0.5}>
                                <CloseButton
                                    disabled={raidInputProps.groups.length < 2 || !buttonsVisible}
                                    visible={true}
                                    onClick={handleRemoveGroup}
                                />
                            </Box>
                        </Stack>
                    </Stack>
                </Stack>
            </Paper>
            {/* <Droppable droppableId={`${groupIndex + 0.5}`} type="turn">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps} 
                    > */}
            <Stack
                direction="row"
                sx = {{ width: "100%"}}
            >   
                <Box flexGrow={1} />
                <AddButton 
                    label={ getTranslation("Add Group", translationKey) }
                    onClick={handleAddGroup(raidInputProps.groups, raidInputProps.setGroups, rollCase, setTransitionIn)(groupIndex+1)} 
                    visible={buttonsVisible}
                />
                <Box flexGrow={1} />
            </Stack>
                        {/* {provided.placeholder}
                    </div>
                )}
            </Droppable> */}
        </Stack>
    )
}
   
   
function MoveGroupCard({raidInputProps, results, groupIndex, firstMoveIndex, buttonsVisible, transitionIn, setTransitionIn, transitionOut, setTransitionOut, translationKey}: 
    {raidInputProps: RaidInputProps, results: RaidBattleResults, groupIndex: number, firstMoveIndex: number, buttonsVisible: boolean, transitionIn: number, setTransitionIn: (i: number) => void, transitionOut: number, setTransitionOut: (i: number) => void, translationKey: any}) 
{
    return  (
        <Stack direction="column" spacing={0.5} sx={{ minHeight: "1px" }}>
            {
                raidInputProps.groups[groupIndex].turns.map((turn, turnIndex) => {
                    const moveIndex = firstMoveIndex + turnIndex;
                    let raiders = raidInputProps.pokemon;
                    if (arraysEqual(raidInputProps.pokemon.map(p => p.role), results.turnZeroState.raiders.map(r => r.role))) {
                        try {
                            raiders = moveIndex > 0 ? results.turnResults[moveIndex-1].state.raiders : results.turnZeroState.raiders;
                        } catch (e) {
                            // Hiccup when loading from strat json ?
                        }
                    }
                    return (
                        <MoveSelectionContainer 
                            key={turn.id}
                            raiders={raiders}    
                            turnIndex={turnIndex} 
                            groupIndex={groupIndex}
                            groups={raidInputProps.groups}
                            setGroups={raidInputProps.setGroups}
                            buttonsVisible={buttonsVisible}
                            transitionIn={transitionIn}
                            setTransitionIn={setTransitionIn}
                            transitionOut={transitionOut}
                            setTransitionOut={setTransitionOut}
                            translationKey={translationKey}
                        />
                    )
                })}
            </Stack>
       )
   }


 
const reorder = (list: RaidTurnInfo[] | TurnGroupInfo[], startIndex: number, endIdex: number) => {
   const result = [...list];
   const [removed] = result.splice(startIndex, 1);
   result.splice(endIdex, 0, removed);
 
   return result;
};
 
const move = (source: TurnGroupInfo, destination: TurnGroupInfo, sourceIndex: number, destIndex: number) => {
    const sourceClone = {
        id: source.id,
        repeats: source.repeats,
        turns: [...source.turns]
    };
    const destClone = {
        id: destination.id,
        repeats: destination.repeats,
        turns: [...destination.turns]
    }
    const [removed] = sourceClone.turns.splice(sourceIndex, 1);
    removed.group = destClone.id;
    destClone.turns.splice(destIndex, 0, removed);
    return [sourceClone, destClone];
};

function MoveSelection({raidInputProps, results, rollCase, translationKey}: {raidInputProps: RaidInputProps, results: RaidBattleResults, rollCase: "min" | "avg" | "max",translationKey: any}) {
    const [buttonsVisible, setButtonsVisible] = useState(true);
    const [transitionIn, setTransitionIn] = useState(-1);
    const [transitionOut, setTransitionOut] = useState(-1);

    const onDragStart = () => {
        setButtonsVisible(false);
    }

    const onDragEnd = (result: DropResult) => {
        setButtonsVisible(true);
        const {destination, source, type} = result;
        if (!destination) { 
            return;
        }
        if (destination.droppableId === source.droppableId && 
            destination.index === source.index
        ) {
            return;
        }

        const sIdx = parseInt(source.droppableId);
        const dIdx = parseInt(destination.droppableId);

        let newGroups = [...raidInputProps.groups];
        if (type === "turn"){ // a turn was dragged
            if (destination.droppableId.slice(-2) === ".5") { // move to a new group
                let uniqueGroupId = 0;
                const takenIds = newGroups.map((g) => g.id);
                for (let i=0; i<=takenIds.length+1; i++) {
                    if (!takenIds.includes(i)) {
                        uniqueGroupId = i;
                        break;
                    }
                }
                const movedTurn = newGroups[sIdx].turns.splice(source.index, 1)[0];
                const newGroup = {
                    id: uniqueGroupId,
                    repeats: 1,
                    turns: [movedTurn],
                };
                newGroups.splice(Math.ceil(parseFloat(destination.droppableId)), 0, newGroup);
            } else if (sIdx === dIdx) { // reorder turns within a group
                const newGroup = {
                    id: newGroups[sIdx].id,
                    repeats: newGroups[sIdx].repeats,
                    turns: reorder(newGroups[sIdx].turns, source.index, destination.index) as RaidTurnInfo[],
                };
                newGroups[sIdx] = newGroup;
            } else { // move to an existing group
                const [sourceGroup, destGroup] = move(newGroups[sIdx], newGroups[dIdx], source.index, destination.index);
                newGroups[sIdx] = sourceGroup;
                newGroups[dIdx] = destGroup;
            }
        } else { // a group was dragged
            newGroups = reorder(newGroups, source.index, destination.index) as TurnGroupInfo[];
        }
        raidInputProps.setGroups(newGroups);
    };

    return (
        <Box justifyContent="center" alignItems="center" sx={{ width: "100%" }}>
            <DragDropContext
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                <Droppable droppableId={`-1`} type="group">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps} 
                        >
                            <Stack 
                                direction="column" 
                                spacing={0.25} 
                                sx={{ marginTop: 0.25 }}
                            >
                                {/* <Droppable droppableId={`${-0.5}`} type="turn">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps} 
                                        > */}
                                <Stack
                                    direction="row"
                                    sx={{ width: "100%" }}
                                >
                                    <Box flexGrow={1} />
                                    <AddButton 
                                        label={ getTranslation("Add Group", translationKey) }
                                        onClick={handleAddGroup(raidInputProps.groups, raidInputProps.setGroups, rollCase, setTransitionIn)(0)} 
                                        visible={buttonsVisible}
                                    />
                                    <Box flexGrow={1} />
                                </Stack>
                                            {/* {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable> */}
                                {
                                    raidInputProps.groups.map((group, index) => (
                                        <Draggable
                                            key={"g"+index}
                                            draggableId={"g"+index}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <MoveGroupContainer 
                                                        key={index}
                                                        raidInputProps={raidInputProps} 
                                                        results={results}
                                                        groupIndex={index} 
                                                        firstMoveIndex={raidInputProps.groups.slice(0, index).reduce((acc, g) => acc + (g.turns.length) * (g.repeats || 1), 0)}
                                                        rollCase={rollCase}
                                                        buttonsVisible={buttonsVisible}
                                                        transitionIn={transitionIn}
                                                        setTransitionIn={setTransitionIn}
                                                        transitionOut={transitionOut}
                                                        setTransitionOut={setTransitionOut}
                                                        translationKey={translationKey}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))
                                }
                            </Stack>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    )
}

export default React.memo(MoveSelection);