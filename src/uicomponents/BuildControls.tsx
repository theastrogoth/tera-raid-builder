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
import IconButton from "@mui/material/IconButton";
import MenuIcon from '@mui/icons-material/Menu';
import ConstructionIcon from '@mui/icons-material/Construction';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import TuneIcon from '@mui/icons-material/Tune';
import Popper from "@mui/material/Popper";
import Switch from "@mui/material/Switch";
import Menu from "@mui/material/Menu";
import { createFilterOptions } from "@mui/material/Autocomplete";

import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import { alpha, darken, lighten, styled, SxProps, Theme } from '@mui/material/styles';

import { Move, Pokemon, StatsTable, Generations, Field } from '../calc';
import { Nature, MoveName, AbilityName, StatID, SpeciesName, ItemName, NatureName, TypeName } from "../calc/data/interface";
import { toID } from '../calc/util';

import StatsControls from "./StatsControls";
import ImportExportArea from "./ImportExportArea";

import { MoveData, MoveSetItem, ShieldData } from "../raidcalc/interface";
import { Raider } from "../raidcalc/Raider";
import PokedexService from "../services/getdata";
import { getItemSpriteURL, getMoveMethodIconURL, getPokemonSpriteURL, getTeraTypeIconURL, getTypeIconURL, getAilmentReadableName, getLearnMethodReadableName, arraysEqual } from "../utils";

import RAIDER_SETDEX_SV from "../data/sets/raiders.json";
import BOSS_SETDEX_SV from "../data/sets/raid_bosses.json";
import BOSS_SETDEX_TM from "../data/sets/tm_raid_bosses.json";

type SetOption = {
    name: string,
    pokemon: SpeciesName,
    shiny?: boolean,
    level?: number,
    item?: ItemName,
    ability?: AbilityName,
    nature?: NatureName,
    ivs?: Partial<StatsTable>,
    evs?: Partial<StatsTable>,
    moves?: MoveName[],
    extraMoves?: MoveName[],
    bossMultiplier?: number,
    teraType?: TypeName,
    shieldData?: ShieldData,
}

// we will always use Gen 9
const gen = Generations.get(9);

function setdexStats(input: any): Partial<StatsTable> | undefined {
    if (!input) return undefined;
    const stats: Partial<StatsTable> = {};
    for (let id of Object.keys(input)) {
        let val = input[id];
        if (typeof(val) === "string") { val = parseInt(val) };
        switch (id) {
            case "hp":
                stats.hp = val;
                break;
            case "at":
                stats.atk = val;
                break;
            case "df":
                stats.def = val;
                break;
            case "sa":
                stats.spa = val;
                break;
            case "sd":
                stats.spd = val;
                break;
            case "sp":
                stats.spe = val;
                break;
        }
    }
    return stats;
}
function setdexToOptions(dex: Object): SetOption[] {
    const options: SetOption[] = [];
    for (let pokemon of (Object.keys(dex) as SpeciesName[])) {
        // @ts-ignore
        for (let setname of (Object.keys(dex[pokemon]))) {
            // @ts-ignore
            const set = dex[pokemon][setname];
            let level = set.level || 100;
            if (typeof(level) === "string") { level = parseInt(level)};
            let bossMultiplier = set.bossMultiplier || 100;
            if (typeof(bossMultiplier) === "string") { bossMultiplier = parseInt(bossMultiplier)};
            const option: SetOption = {
                name: setname,
                pokemon: pokemon,
                shiny: !!set.shiny,
                level: level,
                item: set.item,
                ability: set.ability,
                nature: set.nature,
                ivs: setdexStats(set.ivs),
                evs: setdexStats(set.evs),
                moves: set.moves,
                extraMoves: set.extraMoves,
                bossMultiplier: bossMultiplier,
                teraType: set.teraType,
                shieldData: set.shieldData,
            }
            if (pokemon === "Mewtwo") {
                console.log("Loaded Option", setname, option)
            }
            options.push(option);
        }
    }
    return options.sort((a,b) => (a.pokemon + a.name) < (b.pokemon + b.name) ? -1 : 1);
}

const raiderSetOptions = setdexToOptions(RAIDER_SETDEX_SV);
const bossSetOptions = [...setdexToOptions(BOSS_SETDEX_SV), ...setdexToOptions(BOSS_SETDEX_TM)].sort((a,b) => (a.pokemon + a.name) < (b.pokemon + b.name) ? -1 : 1);

function findOptionFromPokemonName(name: string): string {
    return name;
}

function findOptionFromTeraTypeName(name?: string): string {
    return name !== undefined && name !== "???" ? name : "Inactive";
}

function findOptionFromMoveName(name: string, moveSet: MoveSetItem[]): MoveSetItem {
    const option = moveSet.find((move) => move.name === name);
    return option || {name: "(No Move)" as MoveName, method: "level-up", type: "Normal"};
}

function findOptionFromAbilityName(name: string, abilities: {name: AbilityName, hidden: boolean}[]): {name: AbilityName, hidden: boolean} {
    const option = abilities.find((ability) => ability.name === name);
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
    if (nature.plus === nature.minus) { return nature.name }
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
        if (statChange.change !== 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            const statAbbr = prettyStatName(statChange.stat);
            const change = statChange.change;
            str = str + (change < 0 ? " " : " +" ) + statChange.change + " " + statAbbr;
        }
    }
    if (str.length === 0) { return "none"; }
    return str;
}

function evsToString(pokemon: Pokemon) {
    let str = '';
    let empty = true
    for (let keyval of Object.entries(pokemon.evs)) {
        if (keyval[1] !== 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            let statAbbr = prettyStatName(keyval[0]);
            const nature = gen.natures.get(toID(pokemon.nature));
            const natureEffect = nature ? (keyval[0] === nature.minus ? '-' : (keyval[0] === nature.plus ? '+' : '')) : '';
            str = str + statAbbr + ' ' + keyval[1] + natureEffect;
        }
    } 
    if (str.length === 0) { return "none"; }
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

const filterSetOptions = createFilterOptions({
    stringify: (option: SetOption) => option.pokemon + " " + option.name
});

const LeftCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    textAlign: 'right',
    justifyContent: 'right',
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
    }, [name, pokemon, showPopper])
    
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
    }, [moveItem, moveData, showPopper])

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
                        <img src={getTypeIconURL(move.type)} height="25px" alt="" />
                    }
                <Typography variant={prettyMode ? "body1" : "body2"} sx={prettyMode ? {paddingRight: 0.5 } : {paddingLeft: 0.5, paddingRight: 0.5}}>
                    {move.name}
                </Typography>
                    {move.method === "egg" && prettyMode &&
                        <img src={getMoveMethodIconURL("egg")} height="20px" alt="" />
                    }
                    {move.method === "machine" && prettyMode &&
                        <img src={getMoveMethodIconURL(move.type)} height="20px" alt="" />
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
                <img src={getMoveMethodIconURL("ability_patch")} height="20px" alt="" />
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
        <Box onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave} sx={{ width: "100%" }}>
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

const GroupHeader = styled('div')(({ theme }) => ({
    top: '-8px',
    padding: '4px 10px',
    backgroundColor:
      theme.palette.mode === 'light'
        ? lighten(theme.palette.primary.light, 0.7)
        : darken(theme.palette.primary.main, 0.6),
}));

const StyledTextField = styled(TextField)(({theme}) => ({
    [`& .${outlinedInputClasses.root} .${outlinedInputClasses.notchedOutline}`]: {
      borderColor: theme.palette.primary.main
    },
    [`&:hover .${outlinedInputClasses.root} .${outlinedInputClasses.notchedOutline}`]: {
      borderColor: theme.palette.primary.main,
      borderWidth: 1.5,
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    },
    [`& .${outlinedInputClasses.root}.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]: {
      borderColor: theme.palette.primary.main,
      borderWidth: 1.5,
    },
    [`& .${outlinedInputClasses.input}`]: {
      color: theme.palette.primary.main
    },
    [`&:hover .${outlinedInputClasses.input}`]: {
      color: theme.palette.primary.main
    },
    [`& .${outlinedInputClasses.root}.${outlinedInputClasses.focused} .${outlinedInputClasses.input}`]: {
      color: theme.palette.mode === 'light'
        ? "black"
        : "white",
    },
  }));

function SetLoadGroupHeader({pokemon}: {pokemon: SpeciesName}) {
    return (
        <GroupHeader>
            <Stack direction="row" alignItems="center" spacing={0.25}>
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getPokemonSpriteURL(pokemon)}) no-repeat center center / contain`,
                    }}
                />
                <Typography variant={"body1"} sx={{ fontWeight: "Bold", paddingLeft: 0.5, paddingRight: 0.5 }}>
                    {pokemon}
                </Typography>
            </Stack>
        </GroupHeader> 
    )
}

function SetLoadField({setOptions, loadSet, placeholder="Load Set", sx={width: 150}}: {setOptions: SetOption[], loadSet: (opt: SetOption) => Promise<void>, placeholder?: string, sx?: SxProps<Theme>}) {
    return (
        <Autocomplete 
            disablePortal
            disableClearable
            autoHighlight={true}    
            size="small"
            value={{name:"", pokemon:"Umbreon" as SpeciesName}}
            sx={sx}
            options={setOptions}
            filterOptions={filterSetOptions}
            groupBy={(option: SetOption) => option.pokemon}
            renderOption={(props, option) => <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{option.name}</Typography></li>}
            renderGroup={(params) => {
                return  (
                    <li>
                        <SetLoadGroupHeader pokemon={params.group as SpeciesName} />
                        {params.children}
                    </li>
                );
            }}
            getOptionLabel={(option: SetOption) => option.name}
            renderInput={(params) => 
                <StyledTextField 
                    {...params} variant="outlined" placeholder={placeholder} size="small"
                    sx={{
                        "& .MuiInputBase-input": {
                            overflow: "hidden",
                            textOverflow: "clip",
                        },
                        }}
                />}
            onChange={(event: any, newValue: SetOption) => {
                if (!newValue) return;
                try {
                    loadSet(newValue);
                } catch (e) {
                    console.log(e)
                }
            }}
            componentsProps={{ popper: { style: { width: 'fit-content' } } }}
            style={{ whiteSpace: "pre-wrap" }}
        />
    )
}

function ShinySwitch({pokemon, setShiny}: {pokemon: Raider, setShiny: ((sh: boolean) => void)}) {
    return (
        <Box>
            <Stack direction="column" spacing={0} alignItems="center" justifyContent="center">
                <Typography variant="body2" fontWeight="bold" sx={{ paddingX: 1}} >Shiny</Typography>
                <Switch
                    size='small'
                    checked={pokemon.shiny || false}
                    onChange={(e) => setShiny(!pokemon.shiny)}
            
                />
            </Stack>
        </Box>
    );
}

function BuildControls({pokemon, abilities, moveSet, setPokemon, prettyMode, isBoss = false}: 
        {pokemon: Raider, abilities: {name: AbilityName, hidden: boolean}[], moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, prettyMode: boolean, isBoss?: boolean}) 
    {
    const [genSpecies, ] = useState([...gen.species].map(specie => specie.name).sort());
    const [teratypes, ] = useState([...gen.types].map(type => type.name).sort());
    const [genNatures, ] = useState([...gen.natures].sort());
    const [genItems, ] = useState([...gen.items].map(item => item.name).sort());
    
    const [editStatsOpen, setEditStatsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newPokemon = pokemon.clone();
            // @ts-ignore
            newPokemon[propName] = val;
            setPokemon(newPokemon.clone())
        }
    }

    const setPokemonProperties = (propNames: string[]) => {
        return (vals: any[]) => {
            const newPokemon = pokemon.clone();
            propNames.forEach((propName, i) => {
                // @ts-ignore
                newPokemon[propName] = vals[i];
            })
            setPokemon(newPokemon.clone())
        }
    }

    const loadSet = async (set: SetOption) => { 
        const moveData = await Promise.all(
            (set.moves || []).map(
                async (move) => await PokedexService.getMoveByName(move)
            ).map(
                (md, index) => md || {name: set.moves![index] as MoveName, target: "user"} as MoveData
            )
        ) as MoveData[];
    
        const poke = new Pokemon(gen, set.pokemon, {
            level: set.level || 100,
            bossMultiplier: undefined,
            teraType: undefined,
            ability: set.ability || "(No Ability)" as AbilityName,
            item: set.item || undefined,
            nature: (set.nature || "Hardy"),
            moves: (set.moves || ["(No Move)", "(No Move)", "(No Move)", "(No Move)"] as MoveName[]),
            ivs: set.ivs || {},
            evs: set.evs || {},
        });

        setPokemon(new Raider(pokemon.id, poke.species.baseSpecies || poke.name, set.shiny, new Field(), poke, moveData));
    }

    const handleChangeSpecies = (val: string) => {
        setPokemon(new Raider(pokemon.id, pokemon.role, pokemon.shiny, pokemon.field, new Pokemon(gen, val, {nature: "Hardy", ability: "(No Ability)"}), []))
    }

    return (
        <Box justifyContent="center" alignItems="top" width="250px" sx={{ zIndex: 2 }}>
            {!prettyMode &&
                <Stack direction="column" alignItems="center">
                    {!isBoss &&
                        <Stack direction="row" spacing={1.25} justifyContent="center" alignItems="center">
                            <ShinySwitch 
                                pokemon={pokemon}
                                setShiny={setPokemonProperty("shiny")}
                            />
                            <SetLoadField
                                setOptions={raiderSetOptions}
                                loadSet={loadSet}
                                placeholder="Load Build"
                                sx={{ width: 140 }}
                            />
                        </Stack>
                    }
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
                                <GenericIconSummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies} optionFinder={findOptionFromPokemonName} spriteFetcher={getPokemonSpriteURL} prettyMode={prettyMode} ModalComponent={PokemonPopper} />
                                <GenericIconSummaryRow name="Tera Type" value={pokemon.teraType || "???"} setValue={setPokemonProperty("teraType")} options={teratypes} optionFinder={findOptionFromTeraTypeName} spriteFetcher={getTeraTypeIconURL} prettyMode={prettyMode}/>
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
                                            name={index === 0 ? "Moves" : ""}
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

function ShieldOptions({pokemon, setPokemon}: {pokemon: Raider, setPokemon: (r: Raider) => void}) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };

    const setShieldData = (newData: ShieldData) => {
        const newPokemon = pokemon.clone();
        newPokemon.shieldData = newData;
        setPokemon(newPokemon);
    }
    const setShieldHPTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
        let safeVal = parseInt(e.target.value);
        safeVal = Math.min(100, Math.max(0, safeVal));
        const newShieldData = {...pokemon.shieldData} as ShieldData;
        newShieldData.hpTrigger = safeVal;
        setShieldData(newShieldData);
    }

    const setShieldTimeTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
        let safeVal = parseInt(e.target.value);
        safeVal = Math.min(100, Math.max(0, safeVal));
        const newShieldData = {...pokemon.shieldData} as ShieldData;
        newShieldData.timeTrigger = safeVal;
        setShieldData(newShieldData);
    }

    const setShieldCancelDamage = (e: React.ChangeEvent<HTMLInputElement>) => {
        let safeVal = parseInt(e.target.value);
        safeVal = Math.min(100, Math.max(0, safeVal));
        const newShieldData = {...pokemon.shieldData} as ShieldData;
        newShieldData.shieldCancelDamage = safeVal;
        setShieldData(newShieldData);
    }

    const setShieldDamageRate = (e: React.ChangeEvent<HTMLInputElement>) => {
        let safeVal = parseInt(e.target.value);
        safeVal = Math.max(0, safeVal);
        const newShieldData = {...pokemon.shieldData} as ShieldData;
        newShieldData.shieldDamageRate = safeVal;
        setShieldData(newShieldData);
    }

    const setShieldDamageRateTera = (e: React.ChangeEvent<HTMLInputElement>) => {
        let safeVal = parseInt(e.target.value);
        safeVal = Math.max(0, safeVal);
        const newShieldData = {...pokemon.shieldData} as ShieldData;
        newShieldData.shieldDamageRateTera = safeVal;
        setShieldData(newShieldData);
    }

    const setShieldDamageRateTeraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let safeVal = parseInt(e.target.value);
        safeVal = Math.max(0, safeVal);
        const newShieldData = {...pokemon.shieldData} as ShieldData;
        newShieldData.shieldDamageRateTeraChange = safeVal;
        setShieldData(newShieldData);
    }

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
                <TableRow>
                    <TableCell sx={{width: "150px", textAlign: "right"}}>HP Trigger (%)</TableCell>
                    <TableCell sx={{width: "70px"}}>
                        <TextField 
                            size="small"
                            variant="standard"
                            type="number"
                            InputProps={{
                                inputProps: { 
                                    step: 1,
                                }
                            }}
                            fullWidth={false}
                            value={pokemon.shieldData!.hpTrigger}
                            onChange={setShieldHPTrigger}
                        />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{width: "150px", textAlign: "right"}}>Time Trigger (%)</TableCell>
                    <TableCell sx={{width: "70px"}}>
                        <TextField 
                            size="small"
                            variant="standard"
                            type="number"
                            InputProps={{
                                inputProps: { 
                                    step: 1,
                                }
                            }}
                            fullWidth={false}
                            value={pokemon.shieldData!.timeTrigger}
                            onChange={setShieldTimeTrigger}
                        />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{width: "150px", textAlign: "right"}}>Bar Size (%)</TableCell>
                    <TableCell sx={{width: "70px"}}>
                        <TextField 
                            size="small"
                            variant="standard"
                            type="number"
                            InputProps={{
                                inputProps: { 
                                    step: 1,
                                }
                            }}
                            fullWidth={false}
                            value={pokemon.shieldData!.shieldCancelDamage}
                            onChange={setShieldCancelDamage}
                        />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{width: "150px", textAlign: "right"}}>Damage Rate (%)</TableCell>
                    <TableCell sx={{width: "70px"}}>
                    <TextField 
                            size="small"
                            variant="standard"
                            type="number"
                            InputProps={{
                                inputProps: { 
                                    step: 1,
                                }
                            }}
                            fullWidth={false}
                            value={pokemon.shieldData!.shieldDamageRate}
                            onChange={setShieldDamageRate}
                        />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{width: "150px", textAlign: "right"}}>Tera Damage Rate (%)</TableCell>
                    <TableCell sx={{width: "70px"}}>
                        <TextField 
                            size="small"
                            variant="standard"
                            type="number"
                            InputProps={{
                                inputProps: { 
                                    step: 1,
                                }
                            }}
                            fullWidth={false}
                            value={pokemon.shieldData!.shieldDamageRateTera}
                            onChange={setShieldDamageRateTera}
                        />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{width: "150px", textAlign: "right"}}>Mismatched Tera Damage Rate (%)</TableCell>
                    <TableCell sx={{width: "70px"}}>
                        <TextField 
                            size="small"
                            variant="standard"
                            type="number"
                            InputProps={{
                                inputProps: { 
                                    step: 1,
                                }
                            }}
                            fullWidth={false}
                            value={pokemon.shieldData!.shieldDamageRateTeraChange}
                            onChange={setShieldDamageRateTeraChange}
                        />
                    </TableCell>
                </TableRow>
            </Menu>
        </Box>
    )
}

function BossBuildControls({moveSet, pokemon, setPokemon, prettyMode}: 
    {pokemon: Raider, moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, prettyMode: boolean}) 
{
    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newPokemon = pokemon.clone();
            // @ts-ignore
            newPokemon[propName] = val;
            setPokemon(newPokemon.clone())
        }
    }

    const setHPMultiplier = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (val < 1) val = 1;
        const newPokemon = pokemon.clone();
        newPokemon.bossMultiplier = val;
        setPokemon(newPokemon.clone())        
    }

    const setBMove = (index: number) => async (move: MoveName) => {
        const newPoke = pokemon.clone();
        const newExtraMoves = [...newPoke.extraMoves!]
        newExtraMoves[index] = move;
        newPoke.extraMoves = newExtraMoves;
        const newExtraMoveData = [...pokemon.extraMoveData!];
        newExtraMoveData[index] = (await PokedexService.getMoveByName(move)) || {name: "(No Move)" as MoveName, target: "user"};
        newPoke.extraMoveData = newExtraMoveData;
        setPokemon(newPoke);
    }

    const loadSet = async (set: SetOption) => { 
        const moveData = await Promise.all(
            (set.moves || []).map(
                async (move) => await PokedexService.getMoveByName(move)
            ).map(
                (md, index) => md || {name: set.moves![index] as MoveName, target: "user"} as MoveData
            )
        ) as MoveData[];

        const extraMoveData = await Promise.all(
            (set.extraMoves || []).map(
                async (move) => await PokedexService.getMoveByName(move)
            ).map(
                (md, index) => md || {name: set.moves![index] as MoveName, target: "user"} as MoveData
            )
        ) as MoveData[];

        const poke = new Pokemon(gen, set.pokemon, {
            level: set.level || 100,
            bossMultiplier: set.bossMultiplier || 100,
            teraType: set.teraType || undefined,
            ability: set.ability || "(No Ability)" as AbilityName,
            item: set.item || undefined,
            nature: (set.nature || "Hardy"),
            moves: (set.moves || ["(No Move)", "(No Move)", "(No Move)", "(No Move)"] as MoveName[]),
            ivs: set.ivs || {},
            evs: set.evs || {},
            shieldData: set.shieldData,
        });
    
        setPokemon(new Raider(
            pokemon.id, 
            poke.species.baseSpecies || poke.name, 
            set.shiny, 
            new Field(), 
            poke, 
            moveData,
            set.extraMoves || ["(No Move)","(No Move)","(No Move)","(No Move)"] as MoveName[],
            extraMoveData,
        ));
    }

    return (
        <Box justifyContent="center" alignItems="top" width="300px">
            <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                <TableContainer>
                    <Table size="small" width="100%">
                        <TableBody>
                            {!prettyMode &&
                            <TableRow>
                                <LeftCell sx={{ paddingBottom: 1 }}>
                                    <Stack direction="row">
                                        <Box flexGrow={1}/>
                                        <ShinySwitch
                                            pokemon={pokemon}
                                            setShiny={setPokemonProperty("shiny")}
                                        />
                                    </Stack>
                                </LeftCell>
                                <RightCell sx={{ paddingBottom: 2 }}>
                                    <SetLoadField
                                        setOptions={bossSetOptions}
                                        loadSet={loadSet}
                                        placeholder="Load Boss Set"
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
                            {!prettyMode &&
                                <TableRow>
                                    <LeftCell>Shield Options</LeftCell>
                                    <RightCell>
                                        <ShieldOptions pokemon={pokemon} setPokemon={setPokemon} />
                                    </RightCell>
                                </TableRow>
                            }
                            {
                                [0,1,2,3].map((index) => {
                                    return <MoveSummaryRow 
                                        key={index}
                                        name={index === 0 ? "Extra Moves" : ""}
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