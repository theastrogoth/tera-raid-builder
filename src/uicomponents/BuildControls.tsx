import React, { useEffect, useState, useRef } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from "@mui/material/Typography";
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import ConstructionIcon from '@mui/icons-material/Construction';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import TuneIcon from '@mui/icons-material/Tune';
import Popper from "@mui/material/Popper";

import { styled } from '@mui/material/styles';

import { Move, Pokemon, StatsTable, Generations } from '../calc';
import { Nature, MoveName, AbilityName, StatID } from "../calc/data/interface";
import { toID } from '../calc/util';

import StatsControls from "./StatsControls";
import ImportExportArea from "./ImportExportArea";

import { MoveData, MoveSetItem } from "../raidcalc/interface";
import { Raider } from "../raidcalc/Raider";
import PokedexService from "../services/getdata";
import { getItemSpriteURL, getMoveMethodIconURL, getPokemonSpriteURL, getTeraTypeIconURL, getTypeIconURL, getAilmentReadableName, getLearnMethodReadableName, arraysEqual } from "../utils";

import { BOSS_SETDEX_SV } from "../data/sets/raid_bosses";

// we will always use Gen 9
const gen = Generations.get(9);


function findOptionFromPokemonName(name: string): string {
    return name;
}

function findOptionFromTeraTypeName(name?: string): string {
    return name !== undefined && name !== "???" ? name : "Inactive";
}

function findOptionFromMoveName(name: string, moveSet: MoveSetItem[]): MoveSetItem {
    const option = moveSet.find((move) => move.name == name);
    return option || {name: "(No Move)" as MoveName, method: "level-up", type: "Normal"};
}

function findOptionFromAbilityName(name: string, abilities: {name: AbilityName, hidden: boolean}[]): {name: AbilityName, hidden: boolean} {
    const option = abilities.find((ability) => ability.name == name);
    return option || {name: "(No Ability)" as AbilityName, hidden: false};
}

function findOptionFromItemName(name?: string): string {
    return name !== undefined && name !== "(No Item)" ? name : "Any";
}

function findOptionFromNature(name: string, natures: Nature[]): Nature {
    const option = natures.find((nature) => nature.name === name); 
    return option || {name: "Hardy", plus: "atk", minus: "atk", kind: "Nature", id: toID("Hardy")};
}

function createAbilityOptions(abilities: {name: AbilityName, hidden: boolean}[]) {
    return ["(No Ability)", ...abilities.map((ability) => ability.name)];
}

function createMoveOptions(moves: MoveSetItem[]) {
    return ["(No Move)", ...moves.map((move) => move.name)];
}

function natureToOption(nature: Nature) {
    if (nature.plus == nature.minus) { return nature.name }
    return nature.name + " (+" + prettyStatName(nature.plus as string) + ", -" + prettyStatName(nature.minus as string) + ")";
}

function prettyStatName(stat: string) {
    switch (stat) {
        case 'hp':
            return 'HP';
        case 'atk':
            return 'Atk';
        case 'def':
            return 'Def';
        case 'spa':
            return 'SpA';
        case 'spd':
            return 'SpD';
        case 'spe':
            return 'Spe';
        default:
            return stat;
    }
}

function checkSetValueIsDefault(value: string) {
    return value === "???" || value === "(No Move)" || value === "(No Item)" || value === "(No Ability)"
}

function statChangesToString(statChanges: {stat: StatID, change: number}[]) {
    let str = '';
    let empty = true;
    for (let statChange of statChanges) {
        if (statChange.change != 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            const statAbbr = prettyStatName(statChange.stat);
            const change = statChange.change;
            str = str + (change < 0 ? " " : " +" ) + statChange.change + " " + statAbbr;
        }
    }
    if (str.length == 0) { return "none"; }
    return str;
}

function evsToString(pokemon: Pokemon) {
    let str = '';
    let empty = true
    for (let keyval of Object.entries(pokemon.evs)) {
        if (keyval[1] != 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            let statAbbr = prettyStatName(keyval[0]);
            const nature = gen.natures.get(toID(pokemon.nature));
            const natureEffect = nature ? (keyval[0] == nature.minus ? '-' : (keyval[0] == nature.plus ? '+' : '')) : '';
            str = str + statAbbr + ' ' + keyval[1] + natureEffect;
        }
    } 
    if (str.length == 0) { return "none"; }
    return str;
}

function ivsToString(ivs: StatsTable) {
    return  ivs.hp.toString()  + " / " +
            ivs.atk.toString() + " / " +
            ivs.def.toString() + " / " +
            ivs.spa.toString() + " / " +
            ivs.spd.toString() + " / " +
            ivs.spe.toString();
}

const LeftCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    textAlign: 'right',
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '8px',
    borderBottom: 0,
}));
  
const RightCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightMedium,
    textAlign: 'left',
    padding: '0px',
    borderBottom: 0,
})); 
  
function SummaryRow({name, value, setValue, options, prettyMode, optionFinder = (option: any) => option}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], prettyMode: boolean, optionFinder?: Function}) {
return (
    <>
    {((prettyMode && value !== "???" && value !== "(No Move)" && value !== "(No Item)" && value !== "(No Ability)") || !prettyMode) &&
        <TableRow>
            <LeftCell>
                {name}
            </LeftCell>
            <RightCell>
                {prettyMode &&
                    <Typography variant="body1">
                        {value}
                    </Typography>
                }
                {!prettyMode &&
                    <Autocomplete
                        disablePortal
                        disableClearable
                        autoHighlight={true}    
                        size="small"
                        value={value || undefined}
                        options={options}
                        renderOption={(props, option) => <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{optionFinder(option)}</Typography></li>}
                        renderInput={(params) => 
                            <TextField {...params} variant="standard" size="small" />}
                        onChange={(event: any, newValue: string) => {
                            setValue(newValue);
                        }}
                        componentsProps={{ popper: { style: { width: 'fit-content' } } }}
                        sx = {{width: '85%'}}
                        style={{ whiteSpace: "pre-wrap" }}
                    />
                }
            </RightCell>
        </TableRow>
    }
    </>
    )
}

function ModalRow({name, value, getString = (val: any) => val, show = true, iconURLs = null}: {name: string, value: any, getString?: (val: any) => string, show?: boolean, iconURLs?: string[] | null}) {
    return (show ? 
        <TableRow>
            <LeftCell>
                {name}
            </LeftCell>
            <RightCell sx={{display: "flex", flexDirection: "row"}}>
                {iconURLs !== null && iconURLs.map((iconURL, index) => (
                    <Stack key={index} direction="row" spacing={0.5} alignItems="center" >
                        <Box>{getString(value)}</Box>
                        <Box
                            sx={{
                                width: "20px",
                                height: "20px",
                                overflow: 'hidden',
                                background: `url(${iconURL}) no-repeat center center / contain`,
                            }}
                        />
                    </Stack>
                ))}
                {iconURLs === null && getString(value)}
            </RightCell>
        </TableRow>
        : <></>
    )   
}

function PokemonPopper({name, showPopper, anchorEl}: {name: string, showPopper: boolean, anchorEl: HTMLElement | null}) {
    
    const [pokemon, setPokemon] = useState<Pokemon | null>(null);

    useEffect(() => {
        if (showPopper && (pokemon === null || pokemon.name !== name)) {
            setPokemon(new Pokemon(gen, name));
        }
    }, [name, showPopper])
    
    return (
        <Popper
            open={showPopper}
            anchorEl={anchorEl}
            placement="bottom"
            disablePortal={false}
            sx={{ position: "relative", zIndex: 1000000 }}
        >
            <Paper sx={{ p: 1, backgroundColor: "modal.main" }} >
                <TableContainer>
                    <Table size="small" width="100%">
                        <TableBody>
                            <ModalRow name={(pokemon && pokemon.types.length > 1) ? "Types" : "Type"} value="" iconURLs={pokemon ? pokemon.types.map(type => getTypeIconURL(type)) : []} />
                            <ModalRow name="Stats:" value="" />
                            <ModalRow name="HP"  value={pokemon ? pokemon.species.baseStats.hp  : ""} />
                            <ModalRow name="Atk" value={pokemon ? pokemon.species.baseStats.atk : ""} />
                            <ModalRow name="Def" value={pokemon ? pokemon.species.baseStats.def : ""} />
                            <ModalRow name="SpA" value={pokemon ? pokemon.species.baseStats.spa : ""} />
                            <ModalRow name="SpD" value={pokemon ? pokemon.species.baseStats.spd : ""} />
                            <ModalRow name="Spe" value={pokemon ? pokemon.species.baseStats.spe : ""} />
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Popper>
    )
}

function MovePopper({moveItem, showPopper, anchorEl}: {moveItem: MoveSetItem, showPopper: boolean, anchorEl: HTMLElement | null}) {
    const [moveData, setMoveData] = useState<MoveData | null>(null);
    const [move, setMove] = useState<Move | null>(null);
    useEffect(() => {
        if (showPopper && (moveData === null || moveData.name !== moveItem.name)) {
            async function fetchMoveData() {
                const newData = await PokedexService.getMoveByName(moveItem.name);
                if (newData) {
                    setMoveData(newData);
                    setMove(new Move(gen, moveItem.name));
                }
            }
            fetchMoveData().catch((e) => console.log(e));
        }
    }, [moveItem, showPopper])

    const spriteURL = 
        moveItem.method === "level-up" ? [getMoveMethodIconURL("rare_candy")] :
        moveItem.method === "machine" ? [getMoveMethodIconURL(moveItem.type)] : 
        moveItem.method === "egg" ? [getMoveMethodIconURL("egg")] : null;

    return (
        <Popper 
            open={showPopper} 
            anchorEl={anchorEl} 
            placement="bottom"
            disablePortal={false}
            sx={{ position: "relative", zIndex: 1000000 }}
        >
            {(moveData && move) &&
                <Paper sx={{ p: 1, backgroundColor: "modal.main" }} >
                    <TableContainer>
                        <Table size="small" width="100%">
                            <TableBody>
                                <ModalRow 
                                    name="Type"
                                    value={move.type}
                                    show={move.type !== undefined}
                                />
                                <ModalRow 
                                    name="Category"
                                    value={move.category}
                                    show={move.category !== undefined}
                                />
                                <ModalRow 
                                    name="Power"
                                    value={move.bp}
                                    show={move.bp !== undefined && move.bp > 0}
                                />
                                <ModalRow
                                    name="Healing"
                                    value={moveData.healing}
                                    getString={(v: number): string => v.toString() + "%"}
                                    show={moveData.healing !== null && moveData.healing! !== 0}
                                />
                                <ModalRow
                                    name={(moveData.drain! > 0) ? "Drain" : "Recoil"}
                                    value={moveData.drain}
                                    getString={(v: number): string => Math.abs(v).toString() + "%"}
                                    show={moveData.drain !== null && moveData.drain! !== 0}
                                />
                                <ModalRow
                                    name="Accuracy"
                                    value={moveData.accuracy}
                                    getString={(v: number): string => v.toString() + "%"}
                                    show={moveData.accuracy !== null}
                                />
                                <ModalRow
                                    name="# Hits"
                                    value={[moveData.minHits, moveData.maxHits]}
                                    getString={(v: number[]): string => v[0].toString() + "-" + v[1].toString()}
                                    show={moveData.maxHits !== null && moveData.maxHits! > 1}
                                />
                                <ModalRow
                                    name="Priority"
                                    value={moveData.priority}
                                    getString={(v: number): string => (v > 0 ? "+" : "") + v.toString()}
                                    show={moveData.priority !== null && moveData.priority! !== 0}
                                />
                                <ModalRow
                                    name="Status"
                                    value={getAilmentReadableName(moveData.ailment)}
                                    show={moveData.ailment !== null}
                                />
                                <ModalRow
                                    name=""
                                    value={moveData.ailmentChance}
                                    getString={(v: number): string => v.toString() + "% Chance" }
                                    show={moveData.ailmentChance !== null && moveData.ailmentChance! > 0}
                                />
                                <ModalRow
                                    name="Stat Changes"
                                    value={moveData.statChanges}
                                    getString={(v: {stat: StatID, change: number}[]): string => statChangesToString(v)}
                                    show={moveData.statChanges !== null}
                                />
                                <ModalRow
                                    name=""
                                    value={moveData.statChance}
                                    getString={(v: number): string => v.toString() + "% Chance"}
                                    show={moveData.statChance !== null && moveData.statChance! > 0}
                                />
                                <ModalRow
                                    name=""
                                    value={moveData.flinchChance}
                                    getString={(v: number): string => v.toString() + "% Flinch Chance"}
                                    show={moveData.flinchChance !== null && moveData.flinchChance! > 0}
                                />
                                <ModalRow
                                    name="Learn Method"
                                    value={getLearnMethodReadableName(moveItem.method)}
                                    show={moveItem.method !== undefined}
                                    iconURLs={spriteURL}
                                />
                                    
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            }
        </Popper>
    )
}

function MoveWithIcon({move, prettyMode}: {move: MoveSetItem, prettyMode: boolean}) {
    const [showPopper, setShowPopper] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const timer = useRef<NodeJS.Timeout | null>(null);

    const handleMouseOver = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        if(timer.current === null) {
            timer.current = setTimeout(() => {
                setShowPopper(true);
                setAnchorEl(target);
                timer.current = null;
            }, 500)
        }
    }
    const handleMouseLeave = () => {
        setShowPopper(false);
        setAnchorEl(null);
        clearTimeout(timer.current as NodeJS.Timeout);
        timer.current = null;
    }
    return (
        <Box onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
            <Stack direction="row" alignItems="center" spacing={0.25} >
                    {!prettyMode &&
                        <img src={getTypeIconURL(move.type)} height="25px" />
                    }
                <Typography variant={prettyMode ? "body1" : "body2"} sx={prettyMode ? {paddingRight: 0.5 } : {paddingLeft: 0.5, paddingRight: 0.5}}>
                    {move.name}
                </Typography>
                    {move.method === "egg" && prettyMode &&
                        <img src={getMoveMethodIconURL("egg")} height="20px" />
                    }
                    {move.method === "machine" && prettyMode &&
                        <img src={getMoveMethodIconURL(move.type)} height="20px"/>
                    }
            </Stack>
            <MovePopper moveItem={move} showPopper={showPopper} anchorEl={anchorEl}/>
        </Box>
    )
}

function MoveSummaryRow({name, value, setValue, options, moveSet, prettyMode}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], moveSet: MoveSetItem[], prettyMode: boolean}) {
    return (
        <>
        {((prettyMode && !checkSetValueIsDefault(value)) || !prettyMode) &&
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    {prettyMode &&
                        <MoveWithIcon move={findOptionFromMoveName(value, moveSet)} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value || undefined}
                            options={options}
                            renderOption={(props, option) => 
                                <li {...props}><MoveWithIcon move={findOptionFromMoveName(option || "(No Move)", moveSet)} prettyMode={prettyMode} /></li>
                            }
                            renderInput={(params) => <TextField {...params} variant="standard" size="small" />}
                            onChange={(event: any, newValue: string) => {
                                setValue(newValue);
                            }}
                            componentsProps={{ popper: { style: { width: 'fit-content' } } }}
                            sx = {{width: '85%'}}
                        />
                    }
                </RightCell>
            </TableRow>
        }
        </>
    )
}

function AbilityWithIcon({ability, prettyMode}: {ability: {name: AbilityName, hidden: boolean}, prettyMode: boolean}) {
    return (
        <Stack direction="row" alignItems="center" spacing={0.25}>
            <Typography variant={prettyMode ? "body1" : "body2"} sx={{ paddingRight: 0.5 }}>
                {ability.name}
            </Typography>
            {ability.hidden === true &&
                <img src={getMoveMethodIconURL("ability_patch")} height="20px" />
            }
        </Stack>
    )
}

function AbilitySummaryRow({name, value, setValue, options, abilities, prettyMode}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], abilities: {name: AbilityName, hidden: boolean}[], prettyMode: boolean}) {
    return (
        <>
        {((prettyMode && !checkSetValueIsDefault(value)) || !prettyMode) &&
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    {prettyMode &&
                        <AbilityWithIcon ability={findOptionFromAbilityName(value, abilities)} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value || undefined}
                            options={options}
                            renderOption={(props, option) => 
                                <li {...props}><AbilityWithIcon ability={findOptionFromAbilityName(option || "(No Ability)", abilities)} prettyMode={prettyMode} /></li>
                            }
                            renderInput={(params) => <TextField {...params} variant="standard" size="small" />}
                            onChange={(event: any, newValue: string) => {
                                setValue(newValue);
                            }}
                            componentsProps={{ popper: { style: { width: 'fit-content' } } }}
                            sx = {{width: '85%'}}
                        />
                    }
                </RightCell>
            </TableRow>
        }
        </>
    )
}

function GenericWithIcon({name, spriteFetcher, prettyMode, ModalComponent = null, modalProps = null}: {name: string, spriteFetcher: Function, prettyMode: boolean, ModalComponent?: ((p: any) => JSX.Element) | null, modalProps?: any}) {
    const [showPopper, setShowPopper] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const timer = useRef<NodeJS.Timeout | null>(null);

    const handleMouseOver = (event: React.MouseEvent<HTMLElement>) => {
        if (ModalComponent === null) return;
        const target = event.currentTarget;
        if(timer.current === null) {
            timer.current = setTimeout(() => {
                setShowPopper(true);
                setAnchorEl(target);
                timer.current = null;
            }, 500)
        }
    }
    const handleMouseLeave = () => {
        if (ModalComponent === null) return;
        setShowPopper(false);
        setAnchorEl(null);
        clearTimeout(timer.current as NodeJS.Timeout);
        timer.current = null;
    }
    return (
        <Box onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
            <Stack direction="row" alignItems="center" spacing={0.25}>
                {!prettyMode &&
                    <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${spriteFetcher(name)}) no-repeat center center / contain`,
                    }}
                    />
                }
                <Typography variant={prettyMode ? "body1" : "body2"} sx={prettyMode ? {paddingRight: 0.5 } : {paddingLeft: 0.5, paddingRight: 0.5}}>
                    {name}
                </Typography>
                {ModalComponent !== null &&
                    <ModalComponent showPopper={showPopper} anchorEl={anchorEl} {...modalProps} />
                }
            </Stack>
        </Box>
    )
}

function GenericIconSummaryRow({name, value, setValue, options, optionFinder, spriteFetcher, prettyMode, ModalComponent, modalProps}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], optionFinder: Function, spriteFetcher: Function, prettyMode: boolean, ModalComponent?: ((p: any) => JSX.Element) | null, modalProps?: any}) {
    return (
        <>
        {((prettyMode && !checkSetValueIsDefault(value)) || !prettyMode) &&
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    {prettyMode &&
                        <GenericWithIcon name={value} spriteFetcher={spriteFetcher} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value || undefined}
                            options={options}
                            renderOption={(props, option) => 
                                <li {...props}><GenericWithIcon name={optionFinder(option)} spriteFetcher={spriteFetcher} prettyMode={prettyMode} ModalComponent={ModalComponent} modalProps={{name: option}} /></li>
                            }
                            renderInput={(params) => 
                                <TextField {...params} variant="standard" size="small" />}
                            onChange={(event: any, newValue: string) => {
                                //@ts-ignore
                                checkSetValueIsDefault(newValue) ? setValue(undefined) : setValue(newValue);
                            }}
                            componentsProps={{ popper: { style: { width: 'fit-content' } } }}
                            sx = {{width: '85%'}}
                        />
                    }
                </RightCell>
            </TableRow>
        }
        </>
    )
}

function BuildControls({pokemon, abilities, moveSet, setPokemon, prettyMode}: 
        {pokemon: Raider, abilities: {name: AbilityName, hidden: boolean}[], moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, prettyMode: boolean}) 
    {
    const [genSpecies, ] = useState([...gen.species].map(specie => specie.name).sort());
    const [teratypes, ] = useState([...gen.types].map(type => type.name).sort());
    const [genNatures, ] = useState([...gen.natures].sort());
    const [genItems, ] = useState([...gen.items].map(item => item.name).sort());
    
    const [editStatsOpen, setEditStatsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newPokemon = {...pokemon};
            // @ts-ignore
            newPokemon[propName] = val;
            setPokemon(new Raider(
                newPokemon.id, 
                newPokemon.role, 
                newPokemon.field,
                new Pokemon(gen, newPokemon.name, {
                    level: newPokemon.level,
                    ability: newPokemon.ability,
                    nature: newPokemon.nature,
                    item: newPokemon.item,
                    ivs: newPokemon.ivs,
                    evs: newPokemon.evs,
                    moves: newPokemon.moves,
                    teraType: newPokemon.teraType,
                    bossMultiplier: newPokemon.bossMultiplier,
                }),
                newPokemon.moveData,
                newPokemon.extraMoves,
            ))
        }
    }

    const setPokemonProperties = (propNames: string[]) => {
        return (vals: any[]) => {
            const newPokemon = {...pokemon};
            propNames.forEach((propName, i) => {
                // @ts-ignore
                newPokemon[propName] = vals[i];
            })
            setPokemon(new Raider(
                newPokemon.id, 
                newPokemon.role, 
                newPokemon.field,
                new Pokemon(gen, newPokemon.name, {
                    level: newPokemon.level,
                    ability: newPokemon.ability,
                    nature: newPokemon.nature,
                    item: newPokemon.item,
                    ivs: newPokemon.ivs,
                    evs: newPokemon.evs,
                    moves: newPokemon.moves,
                    teraType: newPokemon.teraType,
                    bossMultiplier: newPokemon.bossMultiplier,
                }),
                newPokemon.moveData,
                newPokemon.extraMoves,
            ))
        }
    }

    const handleChangeSpecies = (val: string) => {
        setPokemon(new Raider(pokemon.id, pokemon.role, pokemon.field, new Pokemon(gen, val, {nature: "Hardy", ability: "(No Ability)"}), []))
    }

    return (
        <Box justifyContent="center" alignItems="top" width="250px" sx={{ zIndex: 2 }}>
            {!prettyMode &&
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ marginTop: 1, marginBottom: 2 }}>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ width: "120px", textTransform: "none" }} 
                        disabled={importExportOpen}
                        onClick={(e) => setEditStatsOpen(!editStatsOpen)}
                        startIcon={editStatsOpen ? <ConstructionIcon/> : <TuneIcon/>}
                    >
                        {editStatsOpen ? "Edit Build" : "Edit EVs/IVs"}
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ width: "120px", textTransform: "none" }} 
                        onClick={(e) => setImportExportOpen(!importExportOpen)}
                        endIcon={importExportOpen ? <ConstructionIcon/> : <ImportExportIcon/>}
                    >
                        {importExportOpen ? "Edit Pok\u00E9mon" : "Import/Export"}
                    </Button>
                </Stack>
            }
            {(!prettyMode && importExportOpen) &&
                <ImportExportArea pokemon={pokemon} setPokemon={setPokemon}/>
            }
            {(!prettyMode && editStatsOpen && !importExportOpen) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 0 }}>
                    <StatsControls pokemon={pokemon} setPokemon={setPokemon}/>    
                </Stack>
            }
            {(prettyMode || (!editStatsOpen && !importExportOpen)) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                    <TableContainer>
                        <Table size="small" width="100%">
                            <TableBody>
                                {/* <SummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies} prettyMode={prettyMode} /> */}
                                <GenericIconSummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies} optionFinder={findOptionFromPokemonName} spriteFetcher={getPokemonSpriteURL} prettyMode={prettyMode} ModalComponent={PokemonPopper} />
                                <GenericIconSummaryRow name="Tera Type" value={pokemon.teraType || "???"} setValue={setPokemonProperty("teraType")} options={teratypes} optionFinder={findOptionFromTeraTypeName} spriteFetcher={getTeraTypeIconURL} prettyMode={prettyMode}/>
                                {/* <SummaryRow name="Ability" value={pokemon.ability || abilities[0]} setValue={setPokemonProperty("ability")} options={["(No Ability)", ...abilities]} prettyMode={prettyMode}/> */}
                                <AbilitySummaryRow 
                                            name="Ability"
                                            value={pokemon.ability || "(No Move)"} 
                                            setValue={setPokemonProperty("ability")}
                                            options={createAbilityOptions(abilities)}
                                            abilities={abilities}
                                            prettyMode={prettyMode}
                                        /> 
                                <SummaryRow name="Nature" value={pokemon.nature === undefined ? "Hardy" : pokemon.nature} setValue={setPokemonProperty("nature")} options={genNatures.map((n) => n.name)} optionFinder={(name: string) => natureToOption(findOptionFromNature(name, genNatures))} prettyMode={prettyMode}/>
                                <TableRow>
                                    <LeftCell>Level</LeftCell>
                                    <RightCell>
                                        {prettyMode &&
                                            <Typography variant="body1">
                                                {pokemon.level}
                                            </Typography>
                                        }
                                        {!prettyMode &&
                                            <TextField 
                                                size="small"
                                                variant="standard"
                                                type="number"
                                                InputProps={{
                                                    inputProps: { 
                                                        max: 100, min: 1 
                                                    }
                                                }}
                                                fullWidth={false}
                                                value={pokemon.level}
                                                onChange={(e) => {
                                                    if (e.target.value === "") return setPokemonProperty("level")(1);
                                                    let lvl = parseInt(e.target.value);
                                                    if (lvl < 1) lvl = 1;
                                                    if (lvl > 100) lvl = 100;
                                                    setPokemonProperty("level")(lvl)
                                                }}
                                                sx = {{ width: '30%'}}
                                            />
                                        }
                                    </RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>IVs</LeftCell>
                                    <RightCell>{ivsToString(pokemon.ivs)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>EVs</LeftCell>
                                    <RightCell>{evsToString(pokemon)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '5px'}} />
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                    <GenericIconSummaryRow name="Item" value={pokemon.item || "(No Item)"} setValue={setPokemonProperty("item")} options={["(No Item)", ...genItems]} optionFinder={findOptionFromItemName} spriteFetcher={getItemSpriteURL} prettyMode={prettyMode}/>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                {
                                    [0,1,2,3].map((index) => {
                                        return <MoveSummaryRow 
                                            key={index}
                                            name={index==0 ? "Moves" : ""}
                                            value={pokemon.moves[index] || "(No Move)"} 
                                            setValue={async (moveOption: string) => {
                                                const newMoves = [...pokemon.moves as string[]];
                                                newMoves[index] = moveOption;
                                                const newMoveData = [...pokemon.moveData];
                                                newMoveData[index] = (await PokedexService.getMoveByName(moveOption)) || {name: "(No Move)" as MoveName, target: "user"};
                                                setPokemonProperties(["moves", "moveData"])([newMoves, newMoveData]);
                                            }}
                                            options={createMoveOptions(moveSet)}
                                            moveSet={moveSet}
                                            prettyMode={prettyMode}
                                        /> 
                                    })
                                } 
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            }
        </Box>
    )
}

function BossBuildControls({moveSet, pokemon, setPokemon, prettyMode}: 
    {pokemon: Raider, moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, prettyMode: boolean}) 
{
    const setHPMultiplier = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (val < 1) val = 1;
        const newPokemon = {...pokemon};
        newPokemon.bossMultiplier = val;
        setPokemon(new Raider(pokemon.id, pokemon.role, pokemon.field,
            new Pokemon(gen, newPokemon.name, {
                level: newPokemon.level,
                ability: newPokemon.ability,
                nature: newPokemon.nature,
                item: newPokemon.item,
                ivs: newPokemon.ivs,
                evs: newPokemon.evs,
                moves: newPokemon.moves,
                teraType: newPokemon.teraType,
                bossMultiplier: newPokemon.bossMultiplier,
            }),
            pokemon.moveData,
            pokemon.extraMoves,
            pokemon.extraMoveData,
        ));
    }

    const loadSet = (name: string, set: Object) => { 
        //@ts-ignore
        const evs = set["evs"]
        let numberEVs: Partial<StatsTable> = {};
        if (evs) {
            numberEVs = {
                hp: parseInt(evs.hp),
                atk: parseInt(evs.at),
                def: parseInt(evs.df),
                spa: parseInt(evs.sa),
                spd: parseInt(evs.sd),
                spe: parseInt(evs.sp)
            };
        }
        // @ts-ignore
        setPokemon(new Raider(pokemon.id, name, new Pokemon(gen, pokemon.name, {
            // @ts-ignore
            level: parseInt(set["level"]),
            // @ts-ignore
            bossMultiplier: parseInt(set["bossMultiplier"]),
            // @ts-ignore
            ability: (set["ability"] ? set["ability"] : "(No Ability)"),
            // @ts-ignore
            nature: (set["nature"] ? set["nature"] : "Hardy"),
            // @ts-ignore
            moves: (set["moves"] ? set["moves"] : ["(No Move)", "(No Move)", "(No Move)", "(No Move)"]),
            evs: numberEVs,
        }), []));
    }

    const setBMove = (index: number) => (move: MoveName) => {
        const newPoke = pokemon.clone();
        const newExtraMoves = [...newPoke.extraMoves!]
        newExtraMoves[index] = move;
        newPoke.extraMoves = newExtraMoves;
        setPokemon(newPoke);
    }

    return (
        <Box justifyContent="center" alignItems="top" width="300px">
            <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                <TableContainer>
                    <Table size="small" width="100%">
                        <TableBody>
                            {!prettyMode &&
                            <TableRow>
                                <LeftCell sx={{ paddingBottom: 2 }}>
                                </LeftCell>
                                <RightCell sx={{ paddingBottom: 2 }}>
                                    <Autocomplete 
                                        disablePortal
                                        disableClearable
                                        autoHighlight={true}    
                                        size="small"
                                        value={""}
                                        sx={{ maxWidth: 140}}
                                        //@ts-ignore
                                        options={pokemon.name ? (BOSS_SETDEX_SV[pokemon.name] ? Object.keys(BOSS_SETDEX_SV[pokemon.name]) : []) : []}
                                        renderInput={(params) => 
                                            <TextField 
                                                {...params} variant="outlined" placeholder="Load Boss Set" size="small" 
                                                sx={{
                                                    "& .MuiInputBase-input": {
                                                      overflow: "hidden",
                                                      textOverflow: "clip"
                                                    }
                                                  }}
                                            />}
                                        onChange={(event: any, newValue: string) => {
                                            if (!newValue) return;
                                            try {
                                                //@ts-ignore
                                                const newSet = BOSS_SETDEX_SV[pokemon.name][newValue];
                                                loadSet(newValue, newSet);
                                            } catch (e) {
                                                console.log(e)
                                            }
                                        }}
                                    />
                                </RightCell>
                            </TableRow>
                            }
                            <TableRow>
                                <LeftCell>HP Multiplier (%)</LeftCell>
                                <RightCell>
                                    {prettyMode &&
                                        <Typography variant="body1">
                                            {pokemon.bossMultiplier}
                                        </Typography>
                                    }
                                    {!prettyMode &&
                                        <TextField 
                                            size="small"
                                            variant="standard"
                                            type="number"
                                            InputProps={{
                                                inputProps: { 
                                                    step: 100,
                                                }
                                            }}
                                            fullWidth={false}
                                            value={pokemon.bossMultiplier}
                                            onChange={setHPMultiplier}
                                            sx = {{ width: '30%'}}
                                        />
                                    }
                                </RightCell>
                            </TableRow>
                            {
                                [0,1,2,3].map((index) => {
                                    return <MoveSummaryRow 
                                        key={index}
                                        name={index==0 ? "Extra Moves" : ""}
                                        // @ts-ignore
                                        value={pokemon.extraMoves[index] || "(No Move)"}
                                        setValue={setBMove(index)}
                                        options={createMoveOptions(moveSet)}
                                        moveSet={moveSet}
                                        prettyMode={prettyMode}
                                    /> 
                                })
                            } 
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
        </Box>
    )
}
export const BossBuildControlsMemo = React.memo(BossBuildControls, 
    (prevProps, nextProps) => 
        JSON.stringify(prevProps.pokemon) === JSON.stringify(nextProps.pokemon) && 
        arraysEqual(prevProps.pokemon.extraMoves!, nextProps.pokemon.extraMoves!) &&
        arraysEqual(prevProps.moveSet, nextProps.moveSet) &&
        prevProps.prettyMode === nextProps.prettyMode);

export default React.memo(BuildControls, 
    (prevProps, nextProps) => 
        JSON.stringify(prevProps.pokemon) === JSON.stringify(nextProps.pokemon) && 
        arraysEqual(prevProps.abilities, nextProps.abilities) &&
        arraysEqual(prevProps.moveSet, nextProps.moveSet) &&
        prevProps.prettyMode === nextProps.prettyMode);