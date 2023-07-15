import React, { useState, useEffect }  from "react"
import FormControl from "@mui/material/FormControl"
import Select from "@mui/material/Select"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"

import Stack from "@mui/material/Stack"
import TableContainer from "@mui/material/TableContainer"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"

import { MoveName } from "../calc/data/interface"
import { MoveData, RaidBattleInfo, RaidMoveInfo, RaidTurnInfo, Raider } from "../raidcalc/interface"
import PokedexService from "../services/getdata"
import { Input } from "@mui/material"
import { CheckBox } from "@mui/icons-material"


function MoveDropdown({raiders, info, setInfo}: {raiders: Raider[], info: RaidMoveInfo, setInfo: React.Dispatch<React.SetStateAction<RaidMoveInfo>>}) {
    const roles = raiders.map((raider) => raider.role);
    
    const setInfoParam = (param: string) => (val: any) => {
        setInfo({...info, [param]: val});
    }
    
    const [moveName, setMoveName] = useState<MoveName>(info.moveData.name);
    const [targetDisabled, setTargetDisabled] = useState<boolean>(true);
    const [validTargets, setValidTargets] = useState([info.userID])

    useEffect(() => {
        if (!raiders[info.userID].moves.includes(moveName)) {
            setMoveName("(No Move)" as MoveName);
        }
    }, [raiders[info.userID].moves])

    useEffect(() => {
        if (moveName === "(No Move)") {
            setInfo({...info, moveData: {name: moveName}});
        } else if (moveName == "Attack Cheer" || moveName == "Defense Cheer") {
            setInfo({...info, moveData: {name: moveName, priority: 10, category: "field-effect", target: "user-and-allies"}})
        } else if (moveName === "Heal Cheer") {
            setInfo({...info, moveData: {name: moveName, priority: 10, category: "heal", target: "user-and-allies"}})
        } else {
            async function fetchData() {
                let mData = await PokedexService.getMoveByName(moveName) as MoveData;     
                setInfo({...info, moveData: mData});
            }
            fetchData().catch((e) => console.log(e));
        }
    }, [moveName])

    useEffect(() => {
        const disableTarget = info.moveData.name === "(No Move)" ||
                              info.moveData.category === "field-effect" || 
                              info.moveData.category === "whole-field-effect" || 
                              info.moveData.target === "user-and-allies" ||
                              info.moveData.target === "all-other-pokemon" ||
                              info.moveData.target === "user" ||
                              info.moveData.target === "all-pokemon" ||
                              info.moveData.target === "entire-field";

        const newValidTargets = disableTarget ? [info.userID] : raiders.map((raider) => raider.id).filter((id) => id !== info.userID);
        if (!newValidTargets.includes(info.targetID)) {
            const newInfo = {...info, targetID: newValidTargets[0]};
            setInfo(newInfo);
        }
        setTargetDisabled(disableTarget);
        setValidTargets(newValidTargets);
    }, [info.moveData.name])

    const moveSet = ["(No Move)", ...raiders[info.userID].moves, "Attack Cheer", "Defense Cheer", "Heal Cheer"];
    return (
        <>
            <TableCell>
                <FormControl>
                    <InputLabel id={"user-label"}>User</InputLabel>
                    <Select
                        size="small"
                        labelId="user-label"
                        label="User"
                        value = {info.userID}
                        onChange={(e) => setInfoParam("userID")(e.target.value)}
                    >
                        {roles.slice(1).map((role, index) => <MenuItem value={index+1}>{role}</MenuItem>)}
                    </Select>
                </FormControl> 
            </TableCell>
            <TableCell>
                <FormControl>
                    <InputLabel id={"target-label"}>Target</InputLabel>
                    <Select
                        size="small"
                        labelId="target-label"
                        label="Target"
                        value = {info.targetID}
                        disabled = {targetDisabled}
                        onChange={(e) =>setInfoParam("targetID")(e.target.value)}
                    >
                        {validTargets.map((id) => <MenuItem value={id}>{roles[id]}</MenuItem>)}
                    </Select>
                </FormControl>
            </TableCell>
            <TableCell>
                <FormControl>
                    <InputLabel id={"move-label"}>Move</InputLabel>
                    <Select 
                        size="small"
                        labelId="move-label"
                        label="Move"
                        value = {moveName}
                        onChange={(e) => setMoveName((e.target.value || "(No Move)") as MoveName)}
                    >
                        {moveSet.map((move) => <MenuItem value={move}>{move}</MenuItem>)}
                    </Select>
                </FormControl>
            </TableCell>
            {/* <TableCell>
                <FormControl>
                    <CheckBox>

                    </CheckBox>
                    <CheckBox>
                        
                    </CheckBox>
                    <Input>

                    </Input>
                </FormControl>
            </TableCell> */}
        </>
    )
}

function BossMoveDropdown({boss, info, setInfo}: {boss: Raider, info: RaidMoveInfo, setInfo: React.Dispatch<React.SetStateAction<RaidMoveInfo>>}) {
    const [moveName, setMoveName] = useState<MoveName>(info.moveData.name);
    const moveSet = ["(No Move)", ...boss.moves];

    useEffect(() => {
        if (moveName === "(No Move)") {
            setInfo({...info, moveData: {name: moveName}});
        } else {
            async function fetchData() {
                let mData = await PokedexService.getMoveByName(moveName) as MoveData;     
                setInfo({...info, moveData: mData});
            }
            fetchData().catch((e) => console.log(e));
        }
      }, [moveName])
    
    return (
        <>
            <TableCell>
                <FormControl>
                    <InputLabel id={"boss-move-label"}>Boss Move</InputLabel>
                    <Select 
                        size="small"
                        labelId="boss-move-label"
                        label="Boss Move"
                        value = {moveName}
                        onChange={(e) => setMoveName((e.target.value || "(No Move)") as MoveName)}
                    >
                        {moveSet.map((move) => <MenuItem value={move}>{move}</MenuItem>)}
                    </Select>
                </FormControl>
            </TableCell>
        </>
    )
}

function MoveSelectionRow({raiders, turnID, turns, setTurns}:{raiders: Raider[], turnID: number, turns: RaidTurnInfo[], setTurns: React.Dispatch<React.SetStateAction<RaidTurnInfo[]>>}) {
    const [moveInfo, setMoveInfo] = useState<RaidMoveInfo>(turns[turnID].moveInfo);
    const [bossMoveInfo, setBossMoveInfo] = useState<RaidMoveInfo>(turns[turnID].bossMoveInfo);    
    useEffect(() => {
        setTurns(turns.map((turn) => {
            if (turn.id === turnID) {
                return {...turn, moveInfo: moveInfo, bossMoveInfo: bossMoveInfo};
            } else {
                return turn;
            }
        }))
    }, [moveInfo, bossMoveInfo])
    return (
        <TableRow>
            <MoveDropdown raiders={raiders} info={moveInfo} setInfo={setMoveInfo} />
            <BossMoveDropdown boss={raiders[0]} info={bossMoveInfo} setInfo={setBossMoveInfo}/>
        </TableRow>
    )
}

function MoveSelection({info, setInfo}:{info: RaidBattleInfo, setInfo: React.Dispatch<React.SetStateAction<RaidBattleInfo>>}) {
    const [turns, setTurns] = useState(info.turns);
    useEffect(() => {
        setInfo({...info, turns: turns});
    }, [turns])
    return (
        <Stack>
            <TableContainer>
                <Table>
                    <TableBody>
                        {
                            turns.map((turn, turnID) => <MoveSelectionRow raiders={info.startingState.raiders} turnID={turnID} turns={turns} setTurns={setTurns} />)
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    )
}

export default MoveSelection;