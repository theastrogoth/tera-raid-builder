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
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import Popper from "@mui/material/Popper";
import Switch from "@mui/material/Switch";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { useTheme } from '@mui/material/styles';

import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import { alpha, darken, lighten, styled, SxProps, Theme } from '@mui/material/styles';

import { Move, Pokemon, StatsTable, Generations, Field } from '../calc';
import { Nature, MoveName, AbilityName, StatID, SpeciesName, ItemName, GenderName } from "../calc/data/interface";
import { toID } from '../calc/util';
import { SetOption } from "../raidcalc/interface";


import StatsControls from "./StatsControls";
import ImportExportArea from "./ImportExportArea";

import { MoveData, MoveSetItem, ShieldData, SubstituteBuildInfo, TurnGroupInfo } from "../raidcalc/interface";
import { Raider } from "../raidcalc/Raider";
import PokedexService, { PokemonData } from "../services/getdata";
import { getItemSpriteURL, getMoveMethodIconURL, getPokemonSpriteURL, getTeraTypeIconURL, getTypeIconURL, getAilmentReadableName, getLearnMethodReadableName, arraysEqual, getTranslation, setdexToOptions } from "../utils";

// import RAIDER_SETDEX_SV from "../data/sets/raiders.json";
import BOSS_SETDEX_SV from "../data/sets/raid_bosses.json";
import BOSS_SETDEX_TM from "../data/sets/tm_raid_bosses.json";
import BOSS_SETDEX_ID from "../data/sets/id_raid_bosses.json";

import PokemonLookup from "./PokemonLookup";


// we will always use Gen 9
const gen = Generations.get(9);
const genTypes = [...gen.types].map(type => type.name).sort();
const genItems = ["(No Item)", ...[...gen.items].map(item => item.name).sort()];
const arceusPlates = [
    "Insect Plate",
    "Dread Plate",
    "Draco Plate",
    "Zap Plate",
    "Pixie Plate",
    "Fist Plate",
    "Flame Plate",
    "Sky Plate",
    "Spooky Plate",
    "Meadow Plate",
    "Earth Plate",
    "Icicle Plate",
    "Toxic Plate",
    "Mind Plate",
    "Stone Plate",
    "Iron Plate",
    "Splash Plate"
]
const genNatures = [...gen.natures].sort();

const UNSELECTABLE_FORMS = [
    "Mimikyu-Busted", 
    "Minior-Meteor", 
    "Eiscue-Noice", 
    "Morpeko-Hangry", 
    "Terapagos-Stellar", 
    "Meloetta-Pirouette",
    "Zacian-Crowned",
    "Zamazenta-Crowned",
    "Dialga-Origin",
    "Palkia-Origin",
    "Giratina-Origin",
    "Ogerpon-Hearthflame",
    "Ogerpon-Wellspring",
    "Ogerpon-Cornerstone",
    "Arceus-Bug",
    "Arceus-Dark",
    "Arceus-Dragon",
    "Arceus-Electric",
    "Arceus-Fairy",
    "Arceus-Fighting",
    "Arceus-Fire",
    "Arceus-Flying",
    "Arceus-Ghost",
    "Arceus-Grass",
    "Arceus-Ground",
    "Arceus-Ice",
    "Arceus-Psychic",
    "Arceus-Poison",
    "Arceus-Rock",
    "Arceus-Steel",
    "Arceus-Water",
];

const genSpecies = [...gen.species].map(specie => specie.name).filter((n) => !UNSELECTABLE_FORMS.includes(n)).sort();

// const raiderSetOptions = setdexToOptions(RAIDER_SETDEX_SV);
const bossSetOptions = [...setdexToOptions(BOSS_SETDEX_SV), ...setdexToOptions(BOSS_SETDEX_TM), ...setdexToOptions(BOSS_SETDEX_ID)].sort((a,b) => (a.pokemon + a.name) < (b.pokemon + b.name) ? -1 : 1);

export function findOptionFromPokemonName(name: string, translationKey: any): string {
    // let option = getTranslation(name, translationKey, "pokemon");
    let option = translationKey ? translationKey["pokemon"][name] || undefined : name;
    if (!option) {
        const splitName = name.split('-')[0];
        option = translationKey ? translationKey["pokemon"][splitName] || splitName : splitName;
    }
    return option;
}

export function findOptionFromTeraTypeName(name: string | undefined, translationKey: any): string {
    if (name === undefined || name === "???") {
        return translationKey ? translationKey["types"]["???"] || "???" : "Inactive";
    } else if (!translationKey) {
        return name;
    } else {
        return translationKey["types"][name] || name;
    }
}

export function findOptionFromMoveName(name: string, moveSet: MoveSetItem[], translationKey: any): MoveSetItem {
    const option = moveSet.find((move) => move.name === name);
    if (!option) {
        const translatedName = getTranslation("(No Move)", translationKey, "moves");
        return {name: translatedName, engName: "(No Move)", method: "level-up", type: "Normal"} as MoveSetItem;
    } else if (!translationKey) {
        return option;
    } else {
        return {name: translationKey["moves"][name] || name, engName: option.engName, method: option.method, type: option.type} as MoveSetItem;
    }
}

export function findOptionFromAbilityName(name: string, abilities: {name: AbilityName, hidden: boolean}[], translationKey: any): {name: AbilityName, hidden: boolean} {
    const option = abilities.find((ability) => ability.name === name);
    if (!option) {
        const translatedName = getTranslation("(No Ability)", translationKey, "abilities");
        return {name: translatedName, hidden: false};
    } else if (!translationKey) {
        return option;
    } else {
        return {name: translationKey["abilities"][name] || name, hidden: option.hidden};
    }
}

function findOptionFromItemName(name: string | undefined, translationKey: any): string {
    if (name === undefined || name === "(No Item)") {
        return !translationKey ? "Any" : translationKey["items"][("(No Item)")] || ("(No Item)");
    } else if (!translationKey) {
        return name;
    } else {
        return translationKey["items"][name] || name;
    }
}

function findOptionFromNature(name: string, natures: Nature[], translationKey: any): Nature {
    let option = natures.find((nature) => nature.name === name); 
    option = option || {name: "Hardy", plus: "atk", minus: "atk", kind: "Nature", id: toID("Hardy")};
    if (translationKey) {
        option = {...option, name: translationKey["natures"][name] || name};
    }
    return option;
}

function createAbilityOptions(abilities: {name: AbilityName, hidden: boolean}[]) {
    return ["(No Ability)", ...abilities.map((ability) => ability.name)];
}

function createMoveOptions(moves: MoveSetItem[]) {
    return ["(No Move)", ...moves.map((move) => move.name)];
}

function natureToOption(nature: Nature, translationKey: any) {
    if (nature.plus === nature.minus) { return nature.name }
    return nature.name + " (+" + getTranslation(prettyStatName(nature.plus as string),translationKey,"stats") + ", -" + getTranslation(prettyStatName(nature.minus as string),translationKey,"stats") + ")";
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

function statChangesToString(statChanges: {stat: StatID, change: number}[], translationKey: any) {
    let str = '';
    let empty = true;
    for (let statChange of statChanges) {
        if (statChange.change !== 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            const statAbbr = getTranslation(prettyStatName(statChange.stat), translationKey, "stats");
            const change = statChange.change;
            str = str + (change < 0 ? " " : " +" ) + statChange.change + " " + statAbbr;
        }
    }
    if (str.length === 0) { return getTranslation("none", translationKey); }
    return str;
}

function evsToString(pokemon: Pokemon, translationKey: any) {
    let str = '';
    let empty = true
    for (let keyval of Object.entries(pokemon.evs)) {
        if (keyval[1] !== 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            let statAbbr = getTranslation(prettyStatName(keyval[0]), translationKey, "stats");
            const nature = gen.natures.get(toID(pokemon.nature));
            const natureEffect = (nature && (nature.plus !== nature.minus)) ? (keyval[0] === nature.minus ? '-' : (keyval[0] === nature.plus ? '+' : '')) : '';
            str = str + statAbbr + ' ' + keyval[1] + natureEffect;
        }
    } 
    if (str.length === 0) { return getTranslation("none", translationKey); }
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

function makeSubstituteInfo(pokemon: Raider, groups: TurnGroupInfo[]) {
    const newRaider = pokemon.clone();
    const newSubstituteMoves: MoveName[] = [];
    const newSubstituteTargets: number[] = [];
    for (let g of groups) {
        for (let t of g.turns) {
            if (t.moveInfo.userID === pokemon.id) {
                newSubstituteMoves.push(t.moveInfo.moveData.name);
                newSubstituteTargets.push(t.moveInfo.targetID);
            }
        }
    }
    const newSubstitute: SubstituteBuildInfo = {
        raider: newRaider,
        substituteMoves: newSubstituteMoves,
        substituteTargets: newSubstituteTargets,
    };
    return newSubstitute;
}

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
  
export function SummaryRow({name, value, setValue, options, prettyMode, optionFinder = (option: any) => option, translationKey, translationCategory}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], prettyMode: boolean, optionFinder?: Function, translationKey: any, translationCategory: string}) {
return (
    <>
    {((prettyMode && value !== "???" && value !== "(No Move)" && value !== "(No Item)" && value !== "(No Ability)") || !prettyMode) &&
        <TableRow>
            <LeftCell>{ getTranslation(name, translationKey, "ui") }</LeftCell>
            <RightCell colSpan={prettyMode ? 1 : 3} sx={{ width: "165px" }}>
                {prettyMode &&
                    <Typography variant="body1">{ getTranslation(value, translationKey, translationCategory) }</Typography>
                }
                {!prettyMode &&
                    <Autocomplete
                        disablePortal
                        disableClearable
                        autoHighlight={true}    
                        size="small"
                        value={value ? getTranslation(value, translationKey, translationCategory) : undefined}                        
                        options={options}
                        filterOptions={
                            createFilterOptions({
                                stringify: (option: string | undefined) => getTranslation(option || "", translationKey, translationCategory)
                            })
                        }
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

export function PokemonPopper({name, showPopper, anchorEl, allSpecies, translationKey}: {name: string, showPopper: boolean, anchorEl: HTMLElement | null, allSpecies: Map<SpeciesName,PokemonData> | null, translationKey: any}) {
    
    const [pokemon, setPokemon] = useState<PokemonData | null>(null);

    useEffect(() => {
        if (showPopper && (pokemon === null || pokemon.name !== name)) {
            if (allSpecies) {
                const newData = allSpecies.get(name as SpeciesName);
                if (newData) {
                    setPokemon(newData);
                }
            } else {
                async function fetchPokemonData() {
                    const newData = await PokedexService.getPokemonByName(name);
                    if (newData) {
                        setPokemon(newData);
                    }
                }
                fetchPokemonData().catch((e) => console.log(e));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                            <ModalRow name={getTranslation("Type", translationKey, "ui")} value="" iconURLs={pokemon ? pokemon.types.map(type => getTypeIconURL(type)) : []} />
                            <p style={{margin: "5px"}}></p>
                            { pokemon && pokemon.abilities.length > 0 &&
                                <ModalRow name={getTranslation("Ability", translationKey, "ui") + ":"} value={getTranslation(pokemon.abilities[0].name, translationKey, "abilities")} />
                            }
                            { pokemon && pokemon.abilities.slice(1).map((ability, index) => (
                                <ModalRow key={index} name={""} value={getTranslation(ability.name, translationKey, "abilities")} />
                            ))}
                            <p style={{margin: "5px"}}></p>
                            { pokemon && pokemon.weightkg &&
                                <ModalRow name={getTranslation("Weight", translationKey, "ui") + ":"} value={pokemon.weightkg + (" kg")} />
                            }
                            {/* { pokemon && pokemon.gender &&
                                <ModalRow name={getTranslation("Gender", translationKey) + ":"} value={getTranslation(pokemon.gender, translationKey)} />
                            } */}
                            <p style={{margin: "5px"}}></p>
                            <ModalRow name={getTranslation("Stats", translationKey, "ui") + ":"} value="" />
                            <ModalRow name={getTranslation("HP", translationKey, "stats")}  value={pokemon ? pokemon.stats.hp  : ""} />
                            <ModalRow name={getTranslation("Atk", translationKey, "stats")} value={pokemon ? pokemon.stats.atk : ""} />
                            <ModalRow name={getTranslation("Def", translationKey, "stats")} value={pokemon ? pokemon.stats.def : ""} />
                            <ModalRow name={getTranslation("SpA", translationKey, "stats")} value={pokemon ? pokemon.stats.spa : ""} />
                            <ModalRow name={getTranslation("SpD", translationKey, "stats")} value={pokemon ? pokemon.stats.spd : ""} />
                            <ModalRow name={getTranslation("Spe", translationKey, "stats")} value={pokemon ? pokemon.stats.spe : ""} />
                            <p style={{margin: "5px"}}></p>
                            <ModalRow name={getTranslation("BST", translationKey, "stats")} value={pokemon ? Object.entries(pokemon.stats).reduce((acc, [id,val]) => acc + val, 0)  : ""} />

                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Popper>
    )
}

function MovePopper({moveItem, showPopper, anchorEl, allMoves, translationKey}: {moveItem: MoveSetItem, showPopper: boolean, anchorEl: HTMLElement | null, allMoves: Map<MoveName,MoveData> | null, translationKey: any}) {
    const [moveData, setMoveData] = useState<MoveData | null>(null);
    const [move, setMove] = useState<Move | null>(null);
    useEffect(() => {
        if (showPopper && (moveData === null || moveData.name !== moveItem.engName)) {
            if (!allMoves) {
                async function fetchMoveData() {
                    const newData = await PokedexService.getMoveByName(moveItem.engName);
                    if (newData) {
                        setMoveData(newData);
                        setMove(new Move(gen, moveItem.engName));
                    }
                }
                fetchMoveData().catch((e) => console.log(e));
            } else {
                const newData = allMoves.get(moveItem.engName);
                if (newData) {
                    setMoveData(newData);
                    setMove(new Move(gen, moveItem.engName));
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {(moveData && move && moveData.name !== "(No Move)") &&
                <Paper sx={{ p: 1, backgroundColor: "modal.main" }} >
                    <TableContainer>
                        <Table size="small" width="100%">
                            <TableBody>
                                <ModalRow 
                                    name={getTranslation("Type", translationKey)}
                                    value={getTranslation(move.type, translationKey, "types")}
                                    show={move.type !== undefined}
                                />
                                <ModalRow 
                                    name={getTranslation("Category", translationKey)}
                                    value={getTranslation(move.category, translationKey, "ui")}
                                    show={move.category !== undefined}
                                />
                                <ModalRow 
                                    name={getTranslation("Power", translationKey)}
                                    value={move.bp}
                                    show={move.bp !== undefined && move.bp > 0}
                                />
                                <ModalRow
                                    name={getTranslation("Healing", translationKey)}
                                    value={moveData.healing}
                                    getString={(v: number): string => v.toString() + "%"}
                                    show={moveData.healing !== null && moveData.healing! !== 0}
                                />
                                <ModalRow
                                    name={(moveData.drain! > 0) ? getTranslation("Drain", translationKey) : getTranslation("Recoil", translationKey)}
                                    value={moveData.drain}
                                    getString={(v: number): string => Math.abs(v).toString() + "%"}
                                    show={moveData.drain !== null && moveData.drain! !== 0}
                                />
                                <ModalRow
                                    name={getTranslation("Accuracy", translationKey)}
                                    value={moveData.accuracy}
                                    getString={(v: number): string => v.toString() + "%"}
                                    show={moveData.accuracy !== null}
                                />
                                <ModalRow
                                    name={getTranslation("# Hits", translationKey)}
                                    value={[moveData.minHits, moveData.maxHits]}
                                    getString={(v: number[]): string => v[0].toString() + "-" + v[1].toString()}
                                    show={moveData.maxHits !== null && moveData.maxHits! > 1}
                                />
                                <ModalRow
                                    name={getTranslation("Priority", translationKey)}
                                    value={moveData.priority}
                                    getString={(v: number): string => (v > 0 ? "+" : "") + v.toString()}
                                    show={moveData.priority !== null && moveData.priority! !== 0}
                                />
                                <ModalRow
                                    name={getTranslation("Status", translationKey)}
                                    value={getTranslation(getAilmentReadableName(moveData.ailment) || "", translationKey, "status")}
                                    show={moveData.ailment !== null}
                                />
                                <ModalRow
                                    name=""
                                    value={moveData.ailmentChance}
                                    getString={(v: number): string => v.toString() + "% " + getTranslation("Chance", translationKey) }
                                    show={moveData.ailmentChance !== null && moveData.ailmentChance! > 0}
                                />
                                <ModalRow
                                    name={getTranslation("Stat Changes", translationKey)}
                                    value={moveData.statChanges}
                                    getString={(v: {stat: StatID, change: number}[]): string => statChangesToString(v, translationKey)}
                                    show={moveData.statChanges !== null}
                                />
                                <ModalRow
                                    name=""
                                    value={moveData.statChance}
                                    getString={(v: number): string => v.toString() + "% " + getTranslation("Chance", translationKey)}
                                    show={moveData.statChance !== null && moveData.statChance! > 0}
                                />
                                <ModalRow
                                    name=""
                                    value={moveData.flinchChance}
                                    getString={(v: number): string => v.toString() + "% " + getTranslation("Flinch", translationKey) + " " + getTranslation("Chance", translationKey)}
                                    show={moveData.flinchChance !== null && moveData.flinchChance! > 0}
                                />
                                { moveItem.method && 
                                    <ModalRow
                                        name={getTranslation("Learn Method", translationKey)}
                                        value={getTranslation(getLearnMethodReadableName(moveItem.method), translationKey)}
                                        show={moveItem.method !== undefined}
                                        iconURLs={spriteURL}
                                    />
                                }                                    
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            }
        </Popper>
    )
}

export function MoveWithIcon({move, allMoves, prettyMode, translationKey}: {move: MoveSetItem, allMoves: Map<MoveName,MoveData> | null, prettyMode: boolean, translationKey: any}) {
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
            <MovePopper moveItem={move} showPopper={showPopper} anchorEl={anchorEl} allMoves={allMoves} translationKey={translationKey}/>
        </Box>
    )
}

function MoveSummaryRow({name, value, setValue, options, moveSet, currentMoves, allMoves, disabled, prettyMode,translationKey}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], moveSet: MoveSetItem[], currentMoves: MoveName[], allMoves: Map<MoveName,MoveData> | null, disabled: boolean, prettyMode: boolean, translationKey: any}) {
    return (
        <>
        {((prettyMode && !checkSetValueIsDefault(value)) || !prettyMode) &&
            <TableRow>
                <LeftCell>{ getTranslation(name, translationKey) }</LeftCell>
                <RightCell colSpan={prettyMode ? 1 : 3} sx={{ width: "165px" }}>
                    {prettyMode &&
                        <MoveWithIcon move={findOptionFromMoveName(value, moveSet, translationKey)} allMoves={allMoves} prettyMode={prettyMode} translationKey={translationKey} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            disabled={disabled}
                            autoHighlight={true}    
                            size="small"
                            value={value ? getTranslation(value, translationKey, "moves") : undefined}
                            options={options}
                            filterOptions={
                                createFilterOptions({
                                    stringify: (option: string | undefined) => getTranslation(option || "", translationKey, "moves")
                                })
                            }
                            renderOption={(props, option) => 
                                <li {...props}><MoveWithIcon move={findOptionFromMoveName(option || "(No Move)", moveSet, translationKey)} allMoves={allMoves} prettyMode={prettyMode} translationKey={translationKey} /></li>
                            }
                            getOptionDisabled={(option) => option !== "(No Move)" && currentMoves.includes(option as MoveName)}
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

function AbilitySummaryRow({name, value, setValue, options, abilities, prettyMode, translationKey}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], abilities: {name: AbilityName, hidden: boolean}[], prettyMode: boolean, translationKey: any}) {
    return (
        <>
        {((prettyMode && !checkSetValueIsDefault(value)) || !prettyMode) &&
            <TableRow>
                <LeftCell>{ getTranslation(name, translationKey) }</LeftCell>
                <RightCell colSpan={prettyMode ? 1 : 3} sx={{ width: "165px" }}>
                    {prettyMode &&
                        <AbilityWithIcon ability={findOptionFromAbilityName(value, abilities, translationKey)} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value ? getTranslation(value, translationKey, "abilities") : undefined}
                            options={options}
                            filterOptions={
                                createFilterOptions({
                                    stringify: (option: string | undefined) => getTranslation(option || "", translationKey, "abilities")
                                })
                            }
                            renderOption={(props, option) => 
                                <li {...props}><AbilityWithIcon ability={findOptionFromAbilityName(option || "(No Ability)", abilities, translationKey)} prettyMode={prettyMode} /></li>
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

export function GenericWithIcon({name, engName, spriteFetcher, prettyMode, ModalComponent = null, modalProps = null}: {name: string, engName: string, spriteFetcher: Function, prettyMode: boolean, ModalComponent?: ((p: any) => JSX.Element) | null, modalProps?: any}) {
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
                        background: `url(${spriteFetcher(engName)}) no-repeat center center / contain`,
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

function GenericIconSummaryRow({name, value, setValue, options, optionFinder, spriteFetcher, prettyMode, translationKey, translationCategory, ModalComponent, modalProps}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], optionFinder: Function, spriteFetcher: Function, prettyMode: boolean, translationKey: any, translationCategory: string, ModalComponent?: ((p: any) => JSX.Element) | null, modalProps?: any}) {
    return (
        <>
        {((prettyMode && !checkSetValueIsDefault(value)) || !prettyMode) &&
            <TableRow>
                <LeftCell>{ getTranslation(name, translationKey) }</LeftCell>
                <RightCell colSpan={prettyMode ? 1 : 3} sx={{ width: "165px" }}>
                    {prettyMode &&
                        <GenericWithIcon name={optionFinder(value, translationKey)} engName={value} spriteFetcher={spriteFetcher} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value ? (
                                    translationCategory === "pokemon" ? findOptionFromPokemonName(value, translationKey) : getTranslation(value, translationKey, translationCategory) 
                                ) : undefined
                            }
                            options={options}
                            filterOptions={
                                createFilterOptions({
                                    stringify: (option: string | undefined) => (
                                        translationCategory === "pokemon" ? findOptionFromPokemonName(option || "", translationKey) : getTranslation(option || "", translationKey, translationCategory)
                                    )
                                })
                            }
                            renderOption={(props, option) => 
                                <li {...props}><GenericWithIcon name={optionFinder(option, translationKey)} engName={optionFinder(option, null)} spriteFetcher={spriteFetcher} prettyMode={prettyMode} ModalComponent={ModalComponent} modalProps={{...modalProps, name: option}} /></li>
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

// function PokemonSummaryRow({pokemon, setPokemon, allSpecies,  allMoves, setAllMoves, setAllSpecies, prettyMode, translationKey}: 
//     {pokemon: Raider, setPokemon: (n: string) => void, allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, setAllSpecies: (m: Map<SpeciesName,PokemonData> | null) => void, setAllMoves: (m: Map<MoveName,MoveData> | null) => void, prettyMode: boolean, translationKey: any}
// ) {
//     const name = pokemon.name;
//     return (
//         <>
//         {((prettyMode && !checkSetValueIsDefault(pokemon.name)) || !prettyMode) &&
//             <TableRow>
//                 <LeftCell>{ getTranslation("Pokémon", translationKey) }</LeftCell>
//                 <RightCell>
//                     {prettyMode &&
//                         <GenericWithIcon name={findOptionFromPokemonName(name, translationKey)} engName={name} spriteFetcher={getPokemonSpriteURL} prettyMode={prettyMode} />
//                     }
//                     {!prettyMode &&
//                         <PokemonLookup 
//                             pokemon={name}
//                             setPokemon={setPokemon}
//                             allSpecies={allSpecies}
//                             allMoves={allMoves}
//                             setAllSpecies={setAllSpecies}
//                             setAllMoves={setAllMoves}
//                             translationKey={translationKey}
//                         />
//                     }
//                 </RightCell>
//             </TableRow>
//         }
//         </>
//     )
// }

export const GroupHeader = styled('div')(({ theme }) => ({
    top: '-8px',
    padding: '4px 10px',
    backgroundColor:
      theme.palette.mode === 'light'
        ? lighten(theme.palette.primary.light, 0.7)
        : darken(theme.palette.primary.main, 0.6),
}));

export const StyledTextField = styled(TextField)(({theme}) => ({
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

export function SetLoadGroupHeader({pokemon, translationKey}: {pokemon: SpeciesName, translationKey: any}) {
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
                    {findOptionFromPokemonName(pokemon, translationKey)}
                </Typography>
            </Stack>
        </GroupHeader> 
    )
}

function SetLoadField({setOptions, loadSet, placeholder="Load Set", sx={width: 150}, translationKey}: {setOptions: SetOption[], loadSet: (opt: SetOption) => Promise<void>, placeholder?: string, sx?: SxProps<Theme>, translationKey: any}) {
    const filterSetOptions = createFilterOptions({
        stringify: (option: SetOption) => getTranslation(option.pokemon, translationKey, "pokemon") + " " + option.name
    });
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
                        <SetLoadGroupHeader pokemon={params.group as SpeciesName} translationKey={translationKey} />
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

function ShinySwitch({pokemon, setShiny, translationKey}: {pokemon: Raider, setShiny: ((sh: boolean) => void), translationKey: any }) {
    return (
        <Box alignItems="center" justifyContent="center" sx={{ width: "42px" }}>
            <Stack direction="column" spacing={0} alignItems="center" justifyContent="center">
                <Typography variant="body2" fontWeight="bold" sx={{ paddingX: 1}} >
                    { getTranslation("Shiny", translationKey) }
                </Typography>
                <Switch
                    size='small'
                    checked={pokemon.shiny || false}
                    onChange={(e) => setShiny(!pokemon.shiny)}
            
                />
            </Stack>
        </Box>
    );
}

function SubstitutesMenuButton({pokemon, setPokemon, substitutes, setSubstitutes, groups, setGroups, translationKey}: {pokemon: Raider, setPokemon: (r: Raider) => void, substitutes: SubstituteBuildInfo[], setSubstitutes: (s: SubstituteBuildInfo[]) => void, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, translationKey: any}) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };
    return (
        <Box>
            <Button
                variant="outlined"
                size="small"
                sx={{ textTransform: "none" }} 
                onClick={(e) => handleClick(e)}
                endIcon={<MenuIcon/>}
            >
                {getTranslation("Load Substitute", translationKey)}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <Stack direction="column" spacing={1}>
                {substitutes.map((sub, idx) => (
                    <SubstituteMenuItem 
                        idx={idx}
                        key={idx}
                        pokemon={pokemon}
                        setPokemon={setPokemon}
                        substitutes={substitutes}
                        setSubstitutes={setSubstitutes}
                        groups={groups}
                        setGroups={setGroups}
                        handleClose={handleClose}
                        translationKey={translationKey}
                    />
                ))}
                </Stack>
            </Menu>
        </Box>
    )
}

function SubstituteMenuItem({ idx, pokemon, setPokemon, substitutes, setSubstitutes, groups, setGroups, handleClose, translationKey }: 
    {idx: number, pokemon: Raider, setPokemon: (r: Raider) => void, substitutes: SubstituteBuildInfo[], setSubstitutes: (s: SubstituteBuildInfo[]) => void, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, handleClose: () => void, translationKey: any }) 
{
    const sub = substitutes[idx];

    const handleClick = () => {
        const newSubstitute = makeSubstituteInfo(pokemon, groups)
        const newSubstitutes = [...substitutes];
        const removedSubstitute = newSubstitutes.splice(idx, 1, newSubstitute)[0];
        const newGroups = [...groups];
        const pokemonInfo = removedSubstitute.raider;
        const newPokemon = new Raider(
            pokemon.id, 
            pokemonInfo.role, 
            pokemonInfo.shiny, 
            pokemonInfo.isAnyLevel,
            new Field(), 
            new Pokemon(
                gen, 
                pokemonInfo.name, 
                {...pokemonInfo},
            ),
            pokemonInfo.moveData,
        )
        let subMoveIdx = 0;
        const nSubMoves = removedSubstitute.substituteMoves.length;
        for (let g of newGroups) {
            for (let t of g.turns) {
                if (t.moveInfo.userID === pokemon.id) {
                    if (subMoveIdx < nSubMoves) {
                        const moveName = removedSubstitute.substituteMoves[subMoveIdx];
                        if (["Attack Cheer", "Defense Cheer", "Heal Cheer"].includes(moveName)) {
                            t.moveInfo.moveData = {name: moveName, priority: 10, target: "users-field"} as MoveData;
                        } else if (moveName === "(Most Damaging)") {
                            t.moveInfo.moveData = {name: "(Most Damaging)", target: "selected-pokemon"} as MoveData;
                        } else if (moveName === "(No Move)") {
                            t.moveInfo.moveData = {name: "(No Move)", target: "selected-pokemon"} as MoveData;
                        } else {
                            const moveData = newPokemon.moveData.find(md => md.name === moveName);
                            if (moveData) { 
                                t.moveInfo.moveData = moveData; 
                            } else {
                                t.moveInfo.moveData = {name: "(No Move)", target: "user"} as MoveData;
                            }
                        }
                        t.moveInfo.targetID = removedSubstitute.substituteTargets[subMoveIdx];
                        subMoveIdx++;
                    } else {
                        if (!["(No Move)", "(Most Damaging)", "Attack Cheer", "Defense Cheer", "Heal Cheer"].includes(t.moveInfo.moveData.name)) {
                            t.moveInfo.moveData = {name: "(No Move)", target: "selected-pokemon"} as MoveData;
                            t.moveInfo.targetID = 0;
                        }
                    }
                }
            }
        }
        setPokemon(newPokemon);
        setSubstitutes(newSubstitutes);
        setGroups(newGroups);
    }

    const handleDelete = () => {
        const newSubstitutes = [...substitutes];
        newSubstitutes.splice(idx, 1);
        setSubstitutes(newSubstitutes);
    }

    return (
        <Stack direction="row" justifyContent="center" alignItems="center">
            <MenuItem
                onClick={(e) => { handleClick(); handleClose(); }}
                sx={{width: "100%"}}
            >
                <GenericWithIcon name={findOptionFromPokemonName(sub.raider.name, translationKey)} engName={findOptionFromPokemonName(sub.raider.name, null)} spriteFetcher={getPokemonSpriteURL} prettyMode={false} />
            </MenuItem>
            <IconButton
                onClick={() => handleDelete()}
                size="small"
                sx={{ mx: "5px"}}
            >
                <CloseIcon />
            </IconButton>
        </Stack>
    )
}

function GenderSymbol({g}: {g: GenderName | undefined}) {
    const theme = useTheme();
    const maleColor = theme.palette.mode === "dark" ? "#61B1F2" : "#0085F2";
    const femaleColor = theme.palette.mode === "dark" ? "#F56349" : "#F52500";
    const color = g === "M" ? maleColor : g === "F" ? femaleColor : theme.palette.text.primary;
    return (
        <Typography variant="body1" color={color}>
            {g === "M" ? "♂" : g === "F" ? "♀" : "--"}
        </Typography>
    )
}

function BuildControls({pokemon, abilities, moveSet, setPokemon, substitutes, setSubstitutes, groups, setGroups, groupsCounter, allSpecies, allMoves, setAllSpecies, setAllMoves, prettyMode, translationKey, isBoss = false}: 
        {pokemon: Raider, abilities: {name: AbilityName, hidden: boolean}[], moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, 
         substitutes: SubstituteBuildInfo[], setSubstitutes: (s: SubstituteBuildInfo[]) => void, groups: TurnGroupInfo[], setGroups: (t: TurnGroupInfo[]) => void, groupsCounter: number,  allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, 
         setAllSpecies: (m: Map<SpeciesName,PokemonData> | null) => void, setAllMoves: (m: Map<MoveName,MoveData> | null) => void, prettyMode: boolean, translationKey?: any, isBoss?: boolean}
    ) {
    const [teraTypes, setTeraTypes] = useState(genTypes);
    const [items, setItems] = useState(genItems);
    
    const [editStatsOpen, setEditStatsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    const [level, setLevel] = useState(pokemon.level);

    useEffect(() => {
        // Locked items/teratypes
        if (pokemon.name.includes("Ogerpon")) {
            if (pokemon.name !== "Ogerpon" && !pokemon.hasItem("Hearthflame Mask", "Wellspring Mask", "Cornerstone Mask")) {
                setTeraTypes(["Grass"]);
                setItems(genItems);
                const poke = pokemon.clone();
                poke.teraType = "Grass";
                poke.ability = "Defiant" as AbilityName;
                handleForcedChangeSpecies("Ogerpon", poke);
            } else if (pokemon.hasItem("Hearthflame Mask")) {
                setTeraTypes(["Fire"]);
                setItems(["(No Item)", "Hearthflame Mask", "Wellspring Mask", "Cornerstone Mask"]);
                const poke = pokemon.clone();
                poke.teraType = "Fire";
                poke.item = "Hearthflame Mask" as ItemName;
                poke.ability = "Mold Breaker" as AbilityName;
                handleForcedChangeSpecies("Ogerpon-Hearthflame", poke);
            } else if (pokemon.hasItem("Wellspring Mask")) {
                setTeraTypes(["Water"]);
                setItems(["(No Item)", "Hearthflame Mask", "Wellspring Mask", "Cornerstone Mask"]);
                const poke = pokemon.clone();
                poke.teraType = "Water";
                poke.item = "Wellspring Mask" as ItemName;
                poke.ability = "Water Absorb" as AbilityName;
                handleForcedChangeSpecies("Ogerpon-Wellspring", poke);
            } else if (pokemon.hasItem("Cornerstone Mask")) {
                setTeraTypes(["Rock"]);
                setItems(["(No Item)", "Hearthflame Mask", "Wellspring Mask", "Cornerstone Mask"]);
                const poke = pokemon.clone();
                poke.teraType = "Rock";
                poke.item = "Cornerstone Mask" as ItemName;
                poke.ability = "Sturdy" as AbilityName;
                handleForcedChangeSpecies("Ogerpon-Cornerstone", poke);
            } else if (teraTypes.length !== 1 || teraTypes[0] !== "Grass") {
                setTeraTypes(["Grass"]);
                setItems(genItems);
            }
        } else if (pokemon.name.includes("Zacian")) {
            setTeraTypes(genTypes);
            if (pokemon.name !== "Zacian" && !pokemon.hasItem("Rusted Sword")) {
                setItems(genItems);
                const poke = pokemon.clone();
                handleForcedChangeSpecies("Zacian", poke);
            } else if (pokemon.name === "Zacian-Crowned" || pokemon.hasItem("Rusted Sword")) {
                setItems(["(No Item)", "Rusted Sword" as ItemName]);
                const poke = pokemon.clone();
                poke.item = "Rusted Sword" as ItemName;
                handleForcedChangeSpecies("Zacian-Crowned", poke);
            } else {
                setItems(genItems);
            }
        } else if (pokemon.name.includes("Zamazenta")) {
            setTeraTypes(genTypes);
            if (pokemon.name !== "Zamazenta" && !pokemon.hasItem("Rusted Shield")) {
                setItems(genItems);
                const poke = pokemon.clone();
                handleForcedChangeSpecies("Zamazenta", poke);
            } else if (pokemon.name === "Zamazenta-Crowned") {
                setItems(["(No Item)", "Rusted Shield" as ItemName]);
                const poke = pokemon.clone();
                poke.item = "Rusted Shield" as ItemName;
                handleForcedChangeSpecies("Zamazenta-Crowned", poke);
            } else {
                setItems(genItems);
            }
        } else if (pokemon.name.includes("Terapagos")) {
            setTeraTypes(["Stellar"]);
            setPokemonProperties(["teraType"])(["Stellar"]);
        } else if (pokemon.name.includes("Dialga")) {
            setTeraTypes(genTypes);
            if (pokemon.name !== "Dialga" && !pokemon.hasItem("Adamant Crystal")) {
                setItems(genItems);
                const poke = pokemon.clone();
                handleForcedChangeSpecies("Dialga", poke);
            } else if (pokemon.name === "Dialga-Origin" || pokemon.hasItem("Adamant Crystal")) {
                setItems(["(No Item)", "Adamant Crystal"]);
                const poke = pokemon.clone();
                poke.item = "Adamant Crystal" as ItemName;
                handleForcedChangeSpecies("Dialga-Origin", poke);
            } else {
                setItems(genItems);
            }
        } else if (pokemon.name.includes("Palkia")) {
            setTeraTypes(genTypes);
            if (pokemon.name !== "Palkia" && !pokemon.hasItem("Lustrous Globe")) {
                setItems(genItems);
                const poke = pokemon.clone();
                handleForcedChangeSpecies("Palkia", poke);
            } else if (pokemon.name === "Palkia-Origin" || pokemon.hasItem("Lustrous Globe")) {
                setItems(["(No Item)", "Lustrous Globe"]);
                const poke = pokemon.clone();
                poke.item = "Lustrous Globe" as ItemName;
                handleForcedChangeSpecies("Palkia-Origin", poke);
            } else {
                setItems(genItems);
            }
        } else if (pokemon.name.includes("Giratina")) {
            setTeraTypes(genTypes);
            if (pokemon.name !== "Giratina" && !pokemon.hasItem("Griseous Core")) {
                setItems(genItems);
                const poke = pokemon.clone();
                handleForcedChangeSpecies("Giratina", poke);
            } else if (pokemon.name === "Giratina-Origin" || pokemon.hasItem("Griseous Core")) {
                setItems(["(No Item)", "Griseous Core"]);
                const poke = pokemon.clone();
                poke.item = "Griseous Core" as ItemName;
                handleForcedChangeSpecies("Giratina-Origin", poke);
            } else {
                setItems(genItems);
            }
        }
        // Arceus Plate Types
        else if (pokemon.name.includes("Arceus") && !(pokemon.name === "Arceus" && !arceusPlates.includes(pokemon.item || ""))) {
            setTeraTypes(genTypes);
            if (!(pokemon.item || "").includes("Plate")) {
                setItems(genItems);
                const poke = pokemon.clone();
                handleForcedChangeSpecies("Arceus", poke);
            } else if (pokemon.name.includes("Arceus-") || pokemon.item?.includes("Plate")) {
                let form: string = pokemon.name;
                switch (pokemon.item) {
                    case "Insect Plate":   form = "Arceus-Bug";        break;
                    case "Dread Plate":    form = "Arceus-Dark";       break;
                    case "Draco Plate":    form = "Arceus-Dragon";     break;
                    case "Zap Plate":      form = "Arceus-Electric";   break;
                    case "Pixie Plate":    form = "Arceus-Fairy";      break;
                    case "Fist Plate":     form = "Arceus-Fighting";   break;
                    case "Flame Plate":    form = "Arceus-Fire";       break;
                    case "Sky Plate":      form = "Arceus-Flying";     break;
                    case "Spooky Plate":   form = "Arceus-Ghost";      break;
                    case "Meadow Plate":   form = "Arceus-Grass";      break;
                    case "Earth Plate":    form = "Arceus-Ground";     break;
                    case "Icicle Plate":   form = "Arceus-Ice";        break;
                    case "Toxic Plate":    form = "Arceus-Poison";     break;
                    case "Mind Plate":     form = "Arceus-Psychic";    break;
                    case "Stone Plate":    form = "Arceus-Rock";       break;
                    case "Iron Plate":     form = "Arceus-Steel";      break;
                    case "Splash Plate":   form = "Arceus-Water";      break;                 
                }
                setItems(["(No Item)", ...arceusPlates]);
                const poke = pokemon.clone();
                handleForcedChangeSpecies(form as SpeciesName, poke);
            } else {
                setItems(genItems);
            }
        } else {
            setTeraTypes(genTypes);
            setItems(genItems);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pokemon.name, pokemon.item])

    useEffect(() => {
        if (pokemon.isAnyLevel) {
            setLevel(0);
            if (pokemon.level !== 1) {
                setPokemonProperty("level")(1);
            }
        } else if ((pokemon.level !== level) && !(level === 0 && pokemon.level === 1)) {
            setLevel(pokemon.level);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pokemon.level, pokemon.isAnyLevel])

    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newProps = {...pokemon, [propName]: val};
            setPokemon(new Raider(
                newProps.id, 
                newProps.role, 
                newProps.shiny, 
                newProps.isAnyLevel,
                newProps.field, 
                new Pokemon(gen, newProps.name, {
                    nature: newProps.nature, 
                    level: newProps.level,
                    ability: newProps.ability,
                    teraType: newProps.teraType,
                    gender: newProps.gender,
                    item: newProps.item,
                    ivs: newProps.ivs,
                    evs: newProps.evs,
                    moves: newProps.moves,
                    bossMultiplier: newProps.bossMultiplier,
                    shieldData: newProps.shieldData,
                }), 
                newProps.moveData,
                newProps.extraMoves,
                newProps.extraMoveData
            ));
        }
    }

    const setPokemonProperties = (propNames: string[]) => {
        return (vals: any[]) => {
            const newProps = {...pokemon, ...Object.fromEntries(propNames.map((prop, idx) => [prop, vals[idx]]))};
            setPokemon(new Raider(
                newProps.id, 
                newProps.role, 
                newProps.shiny, 
                newProps.isAnyLevel,
                newProps.field, 
                new Pokemon(gen, newProps.name, {
                    nature: newProps.nature, 
                    level: newProps.level,
                    ability: newProps.ability,
                    teraType: newProps.teraType,
                    gender: newProps.gender,
                    item: newProps.item,
                    ivs: newProps.ivs,
                    evs: newProps.evs,
                    moves: newProps.moves,
                    bossMultiplier: newProps.bossMultiplier,
                    shieldData: newProps.shieldData,
                }), 
                newProps.moveData,
                newProps.extraMoves,
                newProps.extraMoveData
            ));
        }
    }

    const loadSet = async (set: SetOption) => { 
        const moveData = allMoves ? 
            (set.moves || []).map(
                (move) => allMoves.get(move) || {name: move, target: "user"} as MoveData
            ) :
            await Promise.all(
                (set.moves || []).map(
                    async (move) => await PokedexService.getMoveByName(move) || {name: move, target: "user"} as MoveData
                )
            ) as MoveData[];

        const poke = new Pokemon(gen, set.pokemon, {
            level: set.level || 100,
            gender: set.gender,
            bossMultiplier: undefined,
            teraType: undefined,
            ability: set.ability || "(No Ability)" as AbilityName,
            item: set.item || undefined,
            nature: (set.nature || "Hardy"),
            moves: (set.moves || ["(No Move)", "(No Move)", "(No Move)", "(No Move)"] as MoveName[]),
            ivs: set.ivs || {},
            evs: set.evs || {},
            shieldData: set.shieldData || {
                hpTrigger: 0,
                timeTrigger: 0,
                shieldCancelDamage: 0,
                shieldDamageRate: 0,
                shieldDamageRateTera: 0,
                shieldDamageRateTeraChange: 0,
            },
        });

        setPokemon(new Raider(pokemon.id, poke.species.baseSpecies || poke.name, set.shiny, set.isAnyLevel, new Field(), poke, moveData));
    }

    const handleChangeSpecies = (val: string) => {
        setPokemon(new Raider(
            pokemon.id, 
            pokemon.role, 
            pokemon.shiny, 
            false,
            pokemon.field, 
            new Pokemon(gen, val, {
                nature: "Hardy", 
                level: (val === "Carry Slot" || val === "NPC") ? 1 : 100,
                // ability: "(No Ability)",
                ivs: (val === "Carry Slot" || val === "NPC") ? {
                    hp: 0,
                    atk: 0,
                    def: 0,
                    spa: 0,
                    spd: 0,
                    spe: 0
                } : undefined,
                shieldData: !isBoss ? undefined : {
                    hpTrigger: 0,
                    timeTrigger: 0,
                    shieldCancelDamage: 0,
                    shieldDamageRate: 0,
                    shieldDamageRateTera: 0,
                    shieldDamageRateTeraChange: 0,
                },
            }), 
            [],
        ));
    }

    const handleForcedChangeSpecies = (val: string, poke: Raider) => {
        setPokemon(new Raider(
            poke.id, 
            poke.role, 
            poke.shiny, 
            false,
            poke.field, 
            new Pokemon(gen, val, {
                nature: poke.nature, 
                level: poke.level,
                ability: poke.ability,
                teraType: poke.teraType,
                item: poke.item,
                evs: poke.evs,
                ivs: poke.ivs,
                moves: poke.moves,
                shieldData: poke.shieldData,
            }), 
            poke.moveData,
            poke.extraMoves,
            poke.extraMoveData,
        ));
    }

    const handleAddSubstitute = () => {
        const newSubstitute = makeSubstituteInfo(pokemon, groups);
        setSubstitutes([...substitutes, newSubstitute]);
    }

    return (
        <Box justifyContent="center" alignItems="top" width="260px" sx={{ zIndex: 2 }}>
            {!prettyMode &&
                <Stack direction="column" alignItems="center" sx={{ width: "100%" }}>
                    {!isBoss &&
                        <Stack direction="row" spacing={1.25} justifyContent="left" alignItems="center" sx={{ paddingLeft: "32px", paddingRight: "18px", width: "100%" }}>
                            <ShinySwitch 
                                pokemon={pokemon}
                                setShiny={setPokemonProperty("shiny")}
                                translationKey={translationKey}
                            />
                            {/* <Box flexGrow={1}/> */}
                            <PokemonLookup loadSet={loadSet} allMoves={allMoves} allSpecies={allSpecies} setAllMoves={setAllMoves} setAllSpecies={setAllSpecies} translationKey={translationKey}/>
                            {/* <Box flexGrow={6}/> */}
                            {/* <SetLoadField
                                setOptions={raiderSetOptions}
                                loadSet={loadSet}
                                placeholder={getTranslation("Load Build", translationKey)}
                                sx={{ width: 140 }}
                                translationKey={translationKey}
                            /> */}
                        </Stack>
                    }
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ maxWidth: "280px", marginTop: 1, marginBottom: isBoss ? 2 : 0 }}>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ textTransform: "none" }} 
                            disabled={importExportOpen}
                            onClick={(e) => setEditStatsOpen(!editStatsOpen)}
                            startIcon={editStatsOpen ? <ConstructionIcon/> : <TuneIcon/>}
                        >
                            {editStatsOpen ? getTranslation("Edit Build",translationKey) : getTranslation("Edit EVs/IVs",translationKey)}
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ textTransform: "none" }} 
                            onClick={(e) => setImportExportOpen(!importExportOpen)}
                            endIcon={importExportOpen ? <ConstructionIcon/> : <ImportExportIcon/>}
                        >
                            {importExportOpen ? getTranslation("Edit Pok\u00E9mon",translationKey) : getTranslation("Import/Export",translationKey)}
                        </Button>
                    </Stack>
                </Stack>
            }
            { !isBoss && (!prettyMode || substitutes.length > 0) && 
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ marginTop: 1, marginBottom: 2 }}>
                    { !prettyMode &&
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ textTransform: "none" }} 
                            onClick={(e) => handleAddSubstitute()}
                            startIcon={<AddIcon/>}
                        >
                            {getTranslation("Add Substitute", translationKey)}
                        </Button>
                    }
                    { substitutes.length > 0 &&
                        <SubstitutesMenuButton 
                            pokemon={pokemon}
                            setPokemon={setPokemon}
                            substitutes={substitutes}
                            setSubstitutes={setSubstitutes}
                            groups={groups}
                            setGroups={setGroups}
                            translationKey={translationKey}
                        />
                    }
                </Stack>
            }
            {(!prettyMode && importExportOpen) &&
                <ImportExportArea pokemon={pokemon} setPokemon={setPokemon} allMoves={allMoves} translationKey={translationKey} />
            }
            {(!prettyMode && editStatsOpen && !importExportOpen) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 0 }}>
                    <StatsControls pokemon={pokemon} setPokemon={setPokemon} translationKey={translationKey} />    
                </Stack>
            }
            {(prettyMode || (!editStatsOpen && !importExportOpen)) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                    <TableContainer>
                        <Table size="small" width="100%">
                            <TableBody>
                                <GenericIconSummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies} optionFinder={findOptionFromPokemonName} spriteFetcher={getPokemonSpriteURL} prettyMode={prettyMode} ModalComponent={PokemonPopper} modalProps={{translationKey: translationKey}} translationKey={translationKey} translationCategory="pokemon"/>
                                <GenericIconSummaryRow name="Tera Type" value={pokemon.teraType || "???"} setValue={setPokemonProperty("teraType")} options={teraTypes} optionFinder={findOptionFromTeraTypeName} spriteFetcher={getTeraTypeIconURL} prettyMode={prettyMode} translationKey={translationKey} translationCategory="types"/>
                                <AbilitySummaryRow 
                                            name="Ability"
                                            value={pokemon.ability || "(No Move)"} 
                                            setValue={setPokemonProperty("ability")}
                                            options={createAbilityOptions(abilities)}
                                            abilities={abilities}
                                            prettyMode={prettyMode}
                                            translationKey={translationKey}
                                        /> 
                                <SummaryRow name="Nature" value={pokemon.nature === undefined ? "Hardy" : pokemon.nature} setValue={setPokemonProperty("nature")} options={genNatures.map((n) => n.name)} optionFinder={(name: string) => natureToOption(findOptionFromNature(name, genNatures, translationKey), translationKey)} prettyMode={prettyMode} translationKey={translationKey} translationCategory="natures"/>
                                { prettyMode && pokemon.gender && pokemon.gender !== "N" &&
                                    <TableRow>
                                        <LeftCell>{ getTranslation("Gender", translationKey) }</LeftCell>
                                        <RightCell>
                                            <GenderSymbol g={pokemon.gender}/>
                                        </RightCell>
                                    </TableRow>
                                }
                                <TableRow>
                                    <LeftCell>{ getTranslation("Level", translationKey) }</LeftCell>
                                    <RightCell sx={{ width: prettyMode ? "fit-content" : "51px" }}>
                                        {prettyMode &&
                                            <Typography variant="body1">
                                                {level || getTranslation("Any", translationKey)}
                                            </Typography>
                                        }
                                        {!prettyMode &&
                                            <TextField 
                                                size="small"
                                                variant="standard"
                                                type="number"
                                                InputProps={{
                                                    inputProps: { 
                                                        max: 100, min: isBoss ? 1 : 0 
                                                    }
                                                }}
                                                fullWidth={false}
                                                value={level || ""}
                                                placeholder={getTranslation("Any", translationKey)}
                                                onChange={(e) => {
                                                    const min = isBoss ? 1 : 0;
                                                    if (e.target.value === "") {
                                                        setLevel(min);
                                                        setPokemonProperties(["level", "isAnyLevel"])([1, min === 0]);
                                                        return;
                                                    }
                                                    let lvl = parseInt(e.target.value);
                                                    if (isNaN(lvl)) lvl = min;
                                                    if (lvl < min) lvl = min;
                                                    if (lvl > 100) lvl = 100;
                                                    setLevel(lvl);
                                                    setPokemonProperties(["level", "isAnyLevel"])([lvl || 1, lvl === 0]);
                                                }}
                                            />
                                        }
                                    </RightCell>
                                    { !prettyMode &&
                                    <>
                                        <LeftCell sx={{ width: 65 }} >{ getTranslation("Gender", translationKey) }</LeftCell>
                                        <RightCell>
                                            <Select
                                                size="small"
                                                variant="standard"
                                                value={pokemon.gender || "N"}
                                                renderValue={(v) => (<GenderSymbol g={v}/>)}
                                                onChange={(o) => setPokemonProperty("gender")(o.target.value)}
                                                sx={{ width: "32px" }}
                                            >
                                                { [...(pokemon.species.gender ? [pokemon.species.gender] : ["N","F","M"] as GenderName[])].map((g) => 
                                                    <MenuItem 
                                                        key={g} 
                                                        value={g}
                                                    >
                                                        <GenderSymbol g={g} />
                                                        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {g === "N" ? "" : g === "M" ? ` (${getTranslation("Male", translationKey)})` : ` (${getTranslation("Female", translationKey)})`}
                                                        </Typography>
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </RightCell>
                                    </>
                                    }
                                </TableRow>
                                <TableRow>
                                    <LeftCell>{getTranslation("IVs", translationKey)}</LeftCell>
                                    <RightCell colSpan={prettyMode ? 1 : 3}>{ivsToString(pokemon.ivs)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>{getTranslation("EVs", translationKey)}</LeftCell>
                                    <RightCell colSpan={prettyMode ? 1 : 3}>{evsToString(pokemon, translationKey)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '5px'}} />
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                    <GenericIconSummaryRow name="Item" value={pokemon.item || "(No Item)"} setValue={setPokemonProperty("item")} options={items} optionFinder={findOptionFromItemName} spriteFetcher={getItemSpriteURL} prettyMode={prettyMode} translationKey={translationKey} translationCategory="items" />
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
                                                newMoveData[index] = (
                                                    allMoves ?  allMoves.get(moveOption as MoveName) : (await PokedexService.getMoveByName(moveOption)) 
                                                ) || {name: "(No Move)" as MoveName, target: "user"};
                                                setPokemonProperties(["moves", "moveData"])([newMoves, newMoveData]);
                                            }}
                                            options={createMoveOptions(moveSet)}
                                            moveSet={moveSet}
                                            currentMoves={pokemon.moves}
                                            allMoves={allMoves}
                                            disabled={pokemon.moves.length < index}
                                            prettyMode={prettyMode}
                                            translationKey={translationKey}
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

function ShieldOptions({pokemon, setPokemon, translationKey}: {pokemon: Raider, setPokemon: (r: Raider) => void, translationKey: any}) {
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
                    <TableCell sx={{width: "150px", textAlign: "right"}}>
                    { getTranslation("HP Trigger", translationKey) + " (%)" }
                    </TableCell>
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
                    <TableCell sx={{width: "150px", textAlign: "right"}}>
                        { getTranslation("Time Trigger", translationKey) + " (%)" }
                    </TableCell>
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
                    <TableCell sx={{width: "150px", textAlign: "right"}}>
                        { getTranslation("Bar Size", translationKey) + " (%)" }
                    </TableCell>
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
                    <TableCell sx={{width: "150px", textAlign: "right"}}>
                    { getTranslation("Damage Rate", translationKey) + " (%)" }
                    </TableCell>
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
                    <TableCell sx={{width: "150px", textAlign: "right"}}>
                       { getTranslation("Tera Damage Rate", translationKey) + " (%)" }
                    </TableCell>
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
                    <TableCell sx={{width: "150px", textAlign: "right"}}>
                        { getTranslation("Mismatched Tera Damage Rate", translationKey) + " (%)" }
                    </TableCell>
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

function BossBuildControls({moveSet, pokemon, setPokemon, allMoves, prettyMode, translationKey}: 
    {pokemon: Raider, moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, allMoves: Map<MoveName,MoveData> | null, prettyMode: boolean, translationKey: any}) 
{
    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newProps = {...pokemon, [propName]: val};
            setPokemon(new Raider(
                newProps.id, 
                newProps.role, 
                newProps.shiny, 
                newProps.isAnyLevel,
                newProps.field, 
                new Pokemon(gen, newProps.name, {
                    nature: newProps.nature, 
                    level: newProps.level,
                    ability: newProps.ability,
                    teraType: newProps.teraType,
                    gender: newProps.gender,
                    item: newProps.item,
                    ivs: newProps.ivs,
                    evs: newProps.evs,
                    moves: newProps.moves,
                    bossMultiplier: newProps.bossMultiplier,
                    shieldData: newProps.shieldData,
                }), 
                newProps.moveData,
                newProps.extraMoves,
                newProps.extraMoveData
            ));
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
        newExtraMoveData[index] = ( allMoves ? allMoves.get(move) : await PokedexService.getMoveByName(move) ) || {name: "(No Move)" as MoveName, target: "user"};
        newPoke.extraMoveData = newExtraMoveData;
        setPokemon(newPoke);
    }

    const loadSet = async (set: SetOption) => { 
        const moveData = allMoves ? 
            (set.moves || []).map(
                (move) => allMoves.get(move) || {name: move, target: "user"} as MoveData
            ) :
            await Promise.all(
                (set.moves || []).map(
                    async (move) => await PokedexService.getMoveByName(move) || {name: move, target: "user"} as MoveData
                )
            ) as MoveData[];

        const extraMoveData = allMoves ? 
            (set.extraMoves || []).map(
                (move) => allMoves.get(move) || {name: move, target: "user"} as MoveData
            ) :
            await Promise.all(
                (set.extraMoves || []).map(
                    async (move) => await PokedexService.getMoveByName(move) || {name: move, target: "user"} as MoveData
                )
            ) as MoveData[];

        const poke = new Pokemon(gen, set.pokemon, {
            level: set.level || 100,
            gender: set.gender,
            bossMultiplier: set.bossMultiplier || 100,
            teraType: set.teraType || undefined,
            ability: set.ability, // || "(No Ability)" as AbilityName,
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
            set.isAnyLevel,
            new Field(), 
            poke, 
            moveData,
            set.extraMoves || ["(No Move)","(No Move)","(No Move)","(No Move)"] as MoveName[],
            extraMoveData,
        ));
    }

    const [sortedBossOptions, setSortedBossOptions] = useState(bossSetOptions);
    useEffect(() => {
        setSortedBossOptions(bossSetOptions.sort((a,b) => (getTranslation(a.pokemon, translationKey, "pokemon") + a.name) < (getTranslation(b.pokemon, translationKey, "pokemon") + b.name) ? -1 : 1));
    }, [translationKey])

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
                                            translationKey={translationKey}
                                        />
                                    </Stack>
                                </LeftCell>
                                <RightCell sx={{ paddingBottom: 2 }}>
                                    <SetLoadField
                                        setOptions={sortedBossOptions}
                                        loadSet={loadSet}
                                        placeholder={getTranslation("Load Boss Set", translationKey)}
                                        translationKey={translationKey}
                                    />
                                </RightCell>
                            </TableRow>
                            }
                            <TableRow>
                                <LeftCell>
                                    { getTranslation("HP Multiplier (%)", translationKey) }
                                </LeftCell>
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
                                    <LeftCell>
                                        { getTranslation("Shield Options", translationKey) }
                                    </LeftCell>
                                    <RightCell>
                                        <ShieldOptions pokemon={pokemon} setPokemon={setPokemon} translationKey={translationKey} />
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
                                        currentMoves={pokemon.extraMoves || []}
                                        allMoves={allMoves}
                                        disabled={(pokemon.extraMoves || []).length < index}
                                        prettyMode={prettyMode}
                                        translationKey={translationKey}
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
        (!!prevProps.allMoves === !!nextProps.allMoves) &&
        arraysEqual(prevProps.pokemon.extraMoves!, nextProps.pokemon.extraMoves!) &&
        arraysEqual(prevProps.moveSet, nextProps.moveSet) &&
        prevProps.prettyMode === nextProps.prettyMode &&
        prevProps.translationKey === nextProps.translationKey
    );

export default React.memo(BuildControls, 
    (prevProps, nextProps) => 
        JSON.stringify(prevProps.pokemon) === JSON.stringify(nextProps.pokemon) && 
        JSON.stringify(prevProps.substitutes) === JSON.stringify(nextProps.substitutes) &&
        arraysEqual(prevProps.abilities, nextProps.abilities) &&
        arraysEqual(prevProps.moveSet, nextProps.moveSet) &&
        (!!prevProps.allSpecies === !!nextProps.allSpecies) &&
        (!!prevProps.allMoves === !!nextProps.allMoves) &&
        prevProps.groupsCounter === nextProps.groupsCounter && 
        prevProps.prettyMode === nextProps.prettyMode &&
        prevProps.translationKey === nextProps.translationKey
    );