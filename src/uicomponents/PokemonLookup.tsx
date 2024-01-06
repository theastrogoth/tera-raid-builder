import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from "@mui/material/Typography";
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { styled, lighten, darken } from '@mui/material/styles';

import { AbilityName, MoveName, SpeciesName, StatsTable, TypeName } from "../calc/data/interface";
import PokedexService, { PokemonData } from "../services/getdata";
import { MoveData, MoveSetItem, SetOption } from "../raidcalc/interface";
import { ABILITIES, Generations, Move, toID } from "../calc";
import { setdexToOptions } from "../utils";

// import { GenericWithIcon, GroupHeader, MoveWithIcon, PokemonPopper, findOptionFromPokemonName, findOptionFromTeraTypeName } from "./BuildControls";
import { getPokemonSpriteURL, getTranslation, getTypeIconURL } from "../utils";

import RAIDER_SETDEX_SV from "../data/sets/raiders.json";

const gen = Generations.get(9);
const genTypes = [...gen.types].map(type => type.name).filter((t) => t !== "Stellar" && t !== "???").sort();
const genAbilities = ABILITIES[gen.num].filter((a) => a !== "(No Ability)").sort();
const genMoves = [...gen.moves].map(move => move.name).filter((m) => m !== "(No Move)").sort();
const genSpecies = [...gen.species].map(specie => specie.name)
    .filter((n) => !["Mimikyu-Busted", "Minior-Meteor", "Eiscue-Noice", "Morpeko-Hangry", "Terapagos-Stellar", "Meloetta-Pirouette"].includes(n))
    .sort();

const raiderSetOptions = setdexToOptions(RAIDER_SETDEX_SV);
const raiderSetMap = new Map<SpeciesName, SetOption[]>();
for (let set of raiderSetOptions) {
    const specie = set.pokemon;
    if (raiderSetMap.has(specie)) {
        const sets = raiderSetMap.get(specie)!;
        sets.push(set);
        raiderSetMap.set(specie, sets);
    } else {
        raiderSetMap.set(specie, [set]);
    }
}
for (let [specie, sets] of raiderSetMap) {
    const pokeData = gen.species.get(toID(specie));
    raiderSetMap.set(specie, [...sets, {
        name: "Blank Set",
        pokemon: specie,
        level: 100,
        nature: "Hardy",
        ability: (pokeData && pokeData.abilities)? (pokeData.abilities[0] === "" ? undefined : pokeData.abilities[0]) : undefined,
    }])
}



type SearchOption = {
    name: string,
    type: "Pokémon" | "Moves" | "Ability" | "Type" | "Custom",
}

const allOptions: SearchOption[] = [];
for (let specie of genSpecies) {
    allOptions.push({name: specie, type: "Pokémon"});
}
for (let type of genTypes) {
    allOptions.push({name: type, type: "Type"});
}
for (let ability of genAbilities) {
    allOptions.push({name: ability, type: "Ability"});
}
for (let move of genMoves) {
    allOptions.push({name: move, type: "Moves"});
}

function checkSpeciesForFilters(species: PokemonData, filters: SearchOption[], translationKey: any) {
    for (let filter of filters) {
        switch (filter.type) {
            case "Moves":
                const moveFilter = filter.name as MoveName;
                let moveFilterResult = false;
                for (let move of species.moves) {
                    if (moveFilter === move.name) {
                        moveFilterResult = true;
                        break;
                    }
                }
                if (!moveFilterResult) {
                    return false;
                }
            break;
            case "Ability":
                const abilityFilter = filter.name as AbilityName;
                let abilityFilterResult = false;
                for (let ability of species.abilities) {
                    if (abilityFilter === ability.name) {
                        abilityFilterResult = true;
                        break;
                    }
                }
                if (!abilityFilterResult) {
                    return false;
                }
            break;
            case "Type":
                const typeFilter = filter.name as TypeName;
                let typeFilterResult = false;
                for (let type of species.types) {
                    const uppercaseType = type[0].toUpperCase() + type.slice(1) as TypeName; // need to fix capitalization in assets branch
                    if (typeFilter === uppercaseType) {
                        typeFilterResult = true;
                        break;
                    }
                }
                if (!typeFilterResult) {
                    return false;
                }
            break;
            case "Custom":
                const filterComponents = filter.name.toLowerCase().split(/(?<=\sand\s|\sor\s|&&|\|\||&|\||,)|(?=\sand\s|\sor\s|&&|\|\||&|\||,)/i).map((s) => s.trim());
                const filterTerms = [];
                const filterOperators = [];
                for (let component of filterComponents) {
                    if (component === "and" || component === "or" || component === "&&" || component === "||" || component === "&" || component === "|" || component === ",") {
                        filterOperators.push(component);
                    } else {
                        filterTerms.push(component);
                    }
                }   
                const termsMatched = filterTerms.map((term) => {
                    let termMatched = false;
                    for (let move of species.moves) {
                        if (term.toLowerCase() === getTranslation(move.name, translationKey, "moves").toLowerCase()) {
                            termMatched = true;
                            break;
                        }
                    }
                    for (let ability of species.abilities) {
                        if (term.toLowerCase() === getTranslation(ability.name, translationKey, "abilities").toLowerCase()) {
                            termMatched = true;
                            break;
                        }
                    }
                    for (let type of species.types) {
                        const uppercaseType = type[0].toUpperCase() + type.slice(1) as TypeName; // data in the assets branch needs to be fixed
                        if (term.toLowerCase() === getTranslation(uppercaseType, translationKey, "types").toLowerCase()) {
                            termMatched = true;
                            break;
                        }
                    }
                    return termMatched;
                });
                let result = termsMatched[0];
                for (let i = 0; i < filterOperators.length; i++) {
                    if (i >= termsMatched.length) {
                        break;
                    }
                    if (filterOperators[i] === "and" || filterOperators[i] === "&&" || filterOperators[i] === "&" || filterOperators[i] === ",") {
                        result = result && termsMatched[i+1];
                    } else {
                        result = result || termsMatched[i+1];
                    }
                }
                if (!result) {
                    return false;
                }
            break;
        }
    }
    return true;
}

function checkOptionAgainstInput(option: SearchOption, inputValue: string, translationKey: any) {
    const translationCategory = 
        option.type === "Pokémon" ? "pokemon" : 
        option.type === "Moves" ? "moves" : 
        option.type === "Ability" ? "abilities" : 
        option.type === "Type" ? "types" : 
        undefined;
    const translatedOptionName = getTranslation(option.name, translationKey, translationCategory);
    const normalizedOptionName = translatedOptionName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedInputValue = inputValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return normalizedOptionName.includes(normalizedInputValue);
}

function FilterGenericTag({text, handleDelete}: {text: String, handleDelete: () => void}) {
    return (
        <Paper elevation={0} variant='outlined' sx={{ borderRadius: 100 }}> 
            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ paddingLeft: "10px", paddingRight: "5px" }}>
                <Typography variant="body1" justifyContent="center" alignItems="center">
                    {text}
                </Typography>
                <Box flexGrow={1} />
                <IconButton size="small" onClick={handleDelete}>
                    <CloseIcon/>
                </IconButton>
            </Stack>
        </Paper>
    );
}

function FilterTypeTag({text, handleDelete}: {text: String, handleDelete: () => void}) {
    return (
        // TODO: Add type colors
        <Paper elevation={0} variant='outlined' sx={{ borderRadius: 100 }}> 
            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ paddingLeft: "10px", paddingRight: "5px" }}>
                <Typography variant="body1" justifyContent="center" alignItems="center">
                    {text}
                </Typography>
                <Box flexGrow={1} />
                <IconButton size="small" onClick={handleDelete}>
                    <CloseIcon/>
                </IconButton>
            </Stack>
        </Paper>
    );
}

function FilterTagDispatcher({filter, handleDelete, translationKey}: {filter: SearchOption, handleDelete: () => void, translationKey: any}) {
    switch(filter.type) {
        case "Type":
            return <FilterTypeTag text={getTranslation(filter.name, translationKey, "types")} handleDelete={handleDelete}/>
        case "Moves":
        case "Ability":
        case "Custom":
            return <FilterGenericTag text={getTranslation(filter.name, translationKey, "types")} handleDelete={handleDelete}/>
        default:
            return undefined;
    }
}

function FilterTags({filters, translationKey, handleDeleteFilter}: {filters: SearchOption[], translationKey: any, handleDeleteFilter: (i: number) => (() => void)}) {
    return (
        <Stack direction="row" spacing={.5} useFlexGap flexWrap="wrap">
            {filters.map((opt,idx) => (
                <FilterTagDispatcher key={idx} filter={opt} translationKey={translationKey} handleDelete={handleDeleteFilter(idx)}/>
            ))}
        </Stack>
    );
}

const ButtonTable = styled(Table)(({ theme }) => ({
    size: "small",
    borderCollapse: 'separate',
    borderSpacing: '0px 10px',
    paddingRight: 20,
}));

const HeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    fontSize: 12,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
}));

const RoundedRow = styled(TableRow)(({ theme }) => ({
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 10,
    paddingBottom: 10,
    height: "50px",
    border: 10,
    backgroundColor: theme.palette.mode === 'light'
      ? lighten(theme.palette.background.paper, 0.6)
      : darken(theme.palette.background.paper, 0.2),
}));

const ButtonRow = styled(RoundedRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:click': {
        backgrtoundColor: theme.palette.action.selected,
    }
}));

const HeaderButton = styled(Button)(({ theme }) => ({
    minWidth: 0,
    color: theme.palette.text.primary,
}));

const CompactTableCell = styled(TableCell)(({ theme }) => ({
    padding: 0,
    paddingLeft: 1,
    paddingRight: 1,
}));

const CompactLeftCell = styled(CompactTableCell)(({ theme }) => ({
    borderRadius: "100px 0px 0px 100px",
    paddingLeft: 10,
}));

const CompactRightCell = styled(CompactTableCell)(({ theme }) => ({
    borderRadius: "0px 100px 100px 0px",
    paddingRight: 10,
}));

function SortingButton({label, method, sortMethod, sortDirection, handleButtonClick, translationKey}: {label: string, method: string, sortMethod: string, sortDirection: string, handleButtonClick: (label: string) => void, translationKey: any}) {
    const sortIcon =    method !== sortMethod ? <UnfoldMoreIcon sx={{ m: 0}} /> :
                        sortDirection === "desc" ? <KeyboardArrowDown sx={{ m: 0}}/> :
                        <KeyboardArrowUpIcon sx={{ m: 0}}/>;

    return (
        <HeaderButton size="small" variant="text" onClick={() => handleButtonClick(sortMethod)} sx={{ textTransform: 'none', minWidth: 0 }}>
            <Typography fontWeight={method === sortMethod ? 800 : 600}>
                {`${getTranslation(label, translationKey)}`}
            </Typography>
            { sortIcon }
        </HeaderButton>
    )

}

function SpeciesSearchResult({pokemon, allSpecies, handleSetPokemon, translationKey}: {pokemon: SpeciesName, allSpecies: Map<SpeciesName,PokemonData>, handleSetPokemon: (s: SetOption) => void, translationKey: any}) {
    const [open, setOpen] = useState(false);
    if (pokemon.includes("Flab")) { // Something odd might be happening with the unicode representaiton of é somewhere
        pokemon = "Flabebe" as SpeciesName;
    }
    const data = allSpecies.get(pokemon)!;
    const sets = raiderSetMap.get(pokemon) || 
    [{
        name: "Blank Set",
        pokemon: pokemon,
        level: 100,
        nature: "Hardy",
        ability: data.abilities[0].name,
    }];

    return (
        <>
        <RoundedRow>
            <CompactLeftCell>
                <IconButton size="small" onClick={() => setOpen(!open)}>
                    {open ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                </IconButton>
            </CompactLeftCell>
            <CompactTableCell>
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getPokemonSpriteURL(data.name)}) no-repeat center center / contain`,
                    }}
                />
            </CompactTableCell>
            <CompactTableCell>
                <Typography fontSize={10} m={.5}>
                    {getTranslation(data.name, translationKey, "pokemon")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell>
                <Stack direction="row" spacing={0.5} alignItems="center" >
                    { data.types.map((type) => (
                        <Box
                            sx={{
                                width: "20px",
                                height: "20px",
                                overflow: 'hidden',
                                background: `url(${getTypeIconURL(type)}) no-repeat center center / contain`,
                            }}
                        />
                    ))}
                </Stack>
            </CompactTableCell>
            <CompactTableCell>
                <Stack direction="column" alignItems="center" >
                    { data.abilities.map((ability) => (
                        <Typography fontSize={10} m={.05}>
                            {getTranslation(ability.name, translationKey, "abilities")}
                        </Typography>
                    ))}
                </Stack>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.hp}
                </Typography>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.atk}
                </Typography>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.def}
                </Typography>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.spa}
                </Typography>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.spd}
                </Typography>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.spe}
                </Typography>
            </CompactTableCell>
            <CompactRightCell align="center">
                <Typography fontSize={10} m={.5}>
                    {Object.entries(data.stats).reduce((acc, [key, value]) => acc + value, 0)}
                </Typography>
            </CompactRightCell>
        </RoundedRow>
        { open &&
            <TableRow>
                <TableCell colSpan={12} sx={{ paddingY: 0, paddingLeft: "50px", paddingRight: "0px"}}>
                    <TableContainer >
                        <ButtonTable sx={{ borderSpacing: '0px 5px', paddingRight: "0px" }}>
                            { sets.map((set,idx) => (
                                <RaiderSetRow key={idx} set={set} handleSetPokemon={handleSetPokemon} translationKey={translationKey} />
                            ))}
                        </ButtonTable>
                    </TableContainer>
                </TableCell>
            </TableRow>
        }
        </>
    )
}

function RaiderSetRow({set, handleSetPokemon, translationKey}: {set: SetOption, handleSetPokemon: (s: SetOption) => void, translationKey: any}) {
    return (
        <ButtonRow onClick={() => handleSetPokemon(set)} sx={{paddingY: 0, marginY: 0}}>
            <CompactLeftCell></CompactLeftCell>
            <CompactTableCell>
                <Typography fontSize={10} m={.5}>
                    {set.name}
                </Typography>
            </CompactTableCell>
            <CompactTableCell>
                <Typography fontSize={10} m={.5}>
                    {getTranslation(set.nature || "Hardy", translationKey, "natures")}
                </Typography>
            </CompactTableCell>
            <CompactRightCell>
                <Typography fontSize={10} m={.5}>
                    {getTranslation(set.ability || "(No Ability)", translationKey, "abilities")}
                </Typography>
            </CompactRightCell>
            {/* TO DO fill in IVs, EVs, ? */}
        </ButtonRow>
    )
}

function TypeSearchResult({type, handleAddFilter, translationKey}: {type: TypeName, handleAddFilter: (f: SearchOption) => void, translationKey: any}) {
    return (
        <ButtonRow onClick={() => handleAddFilter({name: type, type: "Type"})} >
            <CompactLeftCell></CompactLeftCell>
            <CompactTableCell>
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getTypeIconURL(type)}) no-repeat center center / contain`,
                    }}
                />
            </CompactTableCell>
            <CompactTableCell>
                <Typography fontSize={10} m={.5}>
                    {getTranslation(type, translationKey, "types")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell></CompactTableCell>
            <CompactTableCell></CompactTableCell>
            <CompactTableCell></CompactTableCell>
            <CompactRightCell colSpan={6} align="center">
                <Typography fontSize={10} m={.5} fontStyle="italic">
                    {`(${getTranslation("Filter", translationKey)})`}
                </Typography>
            </CompactRightCell>
        </ButtonRow>
    )
}

function AbilitySearchResult({ability, handleAddFilter, translationKey}: {ability: AbilityName, handleAddFilter: (f: SearchOption) => void, translationKey: any}) {
    return (
        <ButtonRow onClick={() => handleAddFilter({name: ability, type: "Ability"})}>
        
            <CompactLeftCell></CompactLeftCell>
            <CompactTableCell></CompactTableCell>
            <CompactTableCell>
                <Typography fontSize={10} m={.5}>
                    {getTranslation(ability, translationKey, "abilities")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell></CompactTableCell>
            <CompactTableCell></CompactTableCell>
            <CompactTableCell></CompactTableCell>
            <CompactRightCell colSpan={6} align="center">
                <Typography fontSize={10} m={.5} fontStyle="italic">
                    {`(${getTranslation("Filter", translationKey)})`}
                </Typography>
            </CompactRightCell>
        </ButtonRow>
    )
}

function MoveSearchResult({move, allMoves, handleAddFilter, translationKey}: {move: MoveName, allMoves: Map<MoveName,MoveData>, handleAddFilter: (f: SearchOption) => void,translationKey: any}) {
    const data = allMoves.get(move)!;
    if (!data) {
        console.log(move, allMoves)
    }
    return (
        <ButtonRow onClick={() => handleAddFilter({name: data.name, type: "Moves"})}>
            <CompactLeftCell></CompactLeftCell>
            <CompactTableCell></CompactTableCell>
            <CompactTableCell>
                <Typography fontSize={10} m={.5}>
                    {getTranslation(data.name, translationKey, "moves")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell>
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getTypeIconURL(data.type!)}) no-repeat center center / contain`,
                    }}
                />
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(data.moveCategory!, translationKey)}
                </Typography>
            </CompactTableCell>
            <CompactTableCell align="center">
                <Typography fontSize={10} m={.5}>
                    {data.power || ''}
                </Typography>
            </CompactTableCell>
            <CompactRightCell colSpan={6} align="center">
                <Typography fontSize={10} m={.5} fontStyle="italic">
                    {`(${getTranslation("Filter", translationKey)})`}
                </Typography>
            </CompactRightCell>
        </ButtonRow>
    )
}

function SearchResultsTable({inputValue, inputFilteredOptions, handleSetPokemon, handleAddFilter, allSpecies, allMoves, translationKey}: {inputValue: string, inputFilteredOptions: SearchOption[], handleSetPokemon: (s: SetOption) => void, handleAddFilter: (f: SearchOption) => void, allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, translationKey: any}) {
    const [sortMethod, setSortMethod] = useState<string>("species");
    const [sortDirection, setSortDirection] = useState<string>("desc");
    const [speciesOptions, setSpeciesOptions] = useState<SpeciesName[]>([]);
    const [typeOptions, setTypeOptions] = useState<TypeName[]>([]);
    const [abilityOptions, setAbilityOptions] = useState<AbilityName[]>([]);
    const [moveOptions, setMoveOptions] = useState<MoveName[]>([]);
    useEffect(() => {
        const newSpeciesOptions: SpeciesName[] = [];
        const newTypeOptions: TypeName[] = [];
        const newAbilityOptions: AbilityName[] = [];
        const newMoveOptions: MoveName[] = [];
        for (let option of inputFilteredOptions) {
            switch (option.type) {
                case "Pokémon":
                    newSpeciesOptions.push(option.name as SpeciesName);
                break;
                case "Type":
                    newTypeOptions.push(option.name as TypeName);
                break;
                case "Ability":
                    newAbilityOptions.push(option.name as AbilityName);
                break;
                case "Moves":
                    newMoveOptions.push(option.name as MoveName);
                break;
            }
        }
        setSpeciesOptions(newSpeciesOptions);
        setTypeOptions(newTypeOptions);
        setAbilityOptions(newAbilityOptions);
        setMoveOptions(newMoveOptions);
    }, [inputFilteredOptions]);

    const handleButtonClick = (label: string) => {
        if (label === sortMethod) {
            if (sortDirection === 'asc') {
                setSortMethod('species');
                setSortDirection('desc');
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortMethod(label);
            setSortDirection('desc');
        }
    };

    useEffect(() => {
        let sortedSpeciesOptions: SpeciesName[] = [];
        if (sortMethod === "species") {
            sortedSpeciesOptions = [...speciesOptions].sort((a, b) => {
                if (sortDirection === 'desc') {
                    return a.localeCompare(b);
                } else if (sortDirection === 'asc') {
                    return b.localeCompare(a);
                }
                return 0;
            });
        } else if (sortMethod === "bst") {
            sortedSpeciesOptions = [...speciesOptions].sort((a, b) => {
                const aData = allSpecies?.get(a) || allSpecies?.get('Flabebe' as SpeciesName); 
                const bData = allSpecies?.get(b) || allSpecies?.get('Flabebe' as SpeciesName); 
                const aTotal = ["hp","atk","def","spa","spd","spe"].map((stat) => (aData?.stats[stat as keyof StatsTable] || 0) + 1).reduce((total, current) => total + current, 0)
                const bTotal = ["hp","atk","def","spa","spd","spe"].map((stat) => (bData?.stats[stat as keyof StatsTable] || 0) + 1).reduce((total, current) => total + current, 0)
                if (sortDirection === 'asc') {
                    return aTotal - bTotal;
                } else if (sortDirection === 'desc') {
                    return bTotal - aTotal;
                }
                return 0;
            });
        } else {
            sortedSpeciesOptions = [...speciesOptions].sort((a, b) => {
                const aData = allSpecies?.get(a) || allSpecies?.get('Flabebe' as SpeciesName); 
                const bData = allSpecies?.get(b) || allSpecies?.get('Flabebe' as SpeciesName); 
                const key = sortMethod as keyof StatsTable;
                const aStat = (aData?.stats[key] || 0) + 1;
                const bStat = (bData?.stats[key] || 0) + 1;
                if (sortDirection === 'asc') {
                    return aStat - bStat;
                } else if (sortDirection === 'desc') {
                    return bStat - aStat;
                }
                return 0;
            });
        }
        setSpeciesOptions(sortedSpeciesOptions);
    }, [sortMethod, sortDirection]);

    return (
        <Box justifyContent="center" alignItems="center">
            { (!allSpecies || !allMoves) &&
                <Typography fontSize={10} m={.5}>
                    {"Loading..."}
                </Typography>
            }
            { ((allSpecies && allMoves) && inputValue.length === 0) &&
                <Typography fontSize={10} m={.5}>
                    {"Enter text to add a search filter or select a Pokémon"}
                </Typography>
            }
            {((allSpecies && allMoves) && inputValue.length > 0 && inputFilteredOptions.length === 0) &&
                <Typography fontSize={10} m={.5}>
                    {"No results found"}
                </Typography>
            }
            <TableContainer sx={{ width: '100%', maxHeight: '60vh', overflowY: 'scroll' }}>
                <ButtonTable stickyHeader>
            { (allSpecies && allMoves) &&
                <>
                    {speciesOptions.length > 0 && 
                    <>
                        <TableHead>
                            <ButtonRow>
                                <HeaderCell></HeaderCell>
                                <HeaderCell></HeaderCell>
                                <HeaderCell>
                                    <SortingButton label="Pokémon" method="species" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('species')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell>{getTranslation("Type", translationKey)}</HeaderCell>
                                <HeaderCell align="center">{getTranslation("Abilities", translationKey)}</HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="HP" method="hp" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('hp')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="Atk" method="atk" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('atk')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="Def" method="def" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('def')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="SpA" method="spa" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('spa')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="SpD" method="spd" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('spd')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="Spe" method="spe" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('spe')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell align="center">
                                    <SortingButton label="BST" method="bst" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('bst')} translationKey={translationKey}/>
                                </HeaderCell>
                            </ButtonRow>
                        </TableHead>
                        <TableBody>
                            {speciesOptions.map((pokemon) => (
                                <SpeciesSearchResult pokemon={pokemon} handleSetPokemon={handleSetPokemon} allSpecies={allSpecies} translationKey={translationKey}/>
                            ))}
                        </TableBody>
                    </>
                    }
                    {typeOptions.length > 0 && 
                    <>
                        <TableHead>
                            <ButtonRow>
                                <HeaderCell></HeaderCell>
                                <HeaderCell></HeaderCell>
                                <HeaderCell>{getTranslation("Type", translationKey)}</HeaderCell>
                                <HeaderCell colSpan={8}></HeaderCell>
                                <HeaderCell></HeaderCell>
                            </ButtonRow>
                        </TableHead>
                        
                        <TableBody>
                            {typeOptions.map((type) => (
                                <TypeSearchResult type={type} handleAddFilter={handleAddFilter} translationKey={translationKey}/>
                            ))}
                        </TableBody>
                    </>
                    }
                    {abilityOptions.length > 0 && 
                    <>
                        <TableHead>
                            <ButtonRow>
                                <HeaderCell></HeaderCell>
                                <HeaderCell></HeaderCell>
                                <HeaderCell>{getTranslation("Ability", translationKey)}</HeaderCell>
                                <HeaderCell colSpan={8}></HeaderCell>
                                <HeaderCell></HeaderCell>
                            </ButtonRow>
                        </TableHead>
                        <TableBody>
                            {abilityOptions.map((ability) => (
                                <AbilitySearchResult ability={ability} handleAddFilter={handleAddFilter} translationKey={translationKey}/>
                            ))}
                        </TableBody>
                    </>
                    }
                    {moveOptions.length > 0 && 
                    <>
                        <TableHead>
                            <ButtonRow>
                                <HeaderCell></HeaderCell>
                                <HeaderCell></HeaderCell>
                                <HeaderCell>{getTranslation("Move", translationKey)}</HeaderCell>
                                <HeaderCell>{getTranslation("Type", translationKey)}</HeaderCell>
                                <HeaderCell align="center">{getTranslation("Category", translationKey)}</HeaderCell>
                                <HeaderCell align="center">{getTranslation("BP", translationKey)}</HeaderCell>
                                <HeaderCell colSpan={5}></HeaderCell>
                                <HeaderCell></HeaderCell>
                            </ButtonRow>
                        </TableHead>
                        <TableBody>
                            {moveOptions.map((move) => (
                                <MoveSearchResult move={move} handleAddFilter={handleAddFilter} allMoves={allMoves} translationKey={translationKey}/>
                            ))}
                        </TableBody>
                    </>
                    }
                    { inputValue.length > 0 &&
                    <>
                        <TableHead>
                            <ButtonRow>
                                <HeaderCell></HeaderCell>
                                <HeaderCell></HeaderCell>
                                <HeaderCell colSpan={4}>{getTranslation("Custom Filter", translationKey)}</HeaderCell>
                                <HeaderCell colSpan={5}></HeaderCell>
                                <HeaderCell></HeaderCell>
                            </ButtonRow>
                        </TableHead>
                        <TableBody>
                            <ButtonRow onClick={() => handleAddFilter({name: inputValue, type: "Custom"})}>
                                <CompactLeftCell></CompactLeftCell>
                                <CompactTableCell></CompactTableCell>
                                <CompactTableCell colSpan={4}>
                                    <Typography fontSize={10} m={.5}>
                                        {`${getTranslation("Add", translationKey)} "${inputValue}"`}
                                    </Typography>
                                </CompactTableCell>
                                <CompactRightCell colSpan={6} align="center">
                                    <Typography fontSize={10} m={.5} fontStyle="italic">
                                        {`(${getTranslation("Filter", translationKey)})`}
                                    </Typography>
                                </CompactRightCell>
                            </ButtonRow>
                        </TableBody>
                    </>
                    }
                </>
            }
            </ButtonTable>
                </TableContainer>
        </Box>
    )
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: '600px',
    width: '80vw',
    minHeght: '500px', // doesn't work?
    height: '80vh',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    overflowY: 'hidden',
  };

function PokemonLookup({loadSet, allSpecies, allMoves, setAllSpecies, setAllMoves, translationKey}: 
    {loadSet: (n: SetOption) => void, allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, setAllSpecies: (s: Map<SpeciesName,PokemonData> | null) => void, setAllMoves: (m: Map<MoveName,MoveData> | null) => void, translationKey: any}) {

    // const [moveFilters, setMoveFilters] = useState<MoveName[]>([]);
    // const [abilityFilters, setAbilityFilters] = useState<AbilityName[]>([]);
    // const [typeFilters, setTypeFilters] = useState<TypeName[]>([]);
    // const [customFilters, setCustomFilters] = useState<string[]>([]);
    const [filters, setFilters] = useState<SearchOption[]>([]);

    const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
    const [inputFilteredOptions, setInputFilteredOptions] = useState<SearchOption[]>([]);

    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = useState("");

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleOpen = () => {setOpen(true); getOptionsData().catch((e) => console.log(e));}
    const handleClose = () => setOpen(false);

    const handleAddFilter = (filter: SearchOption) => {
        const newFilters = [...filters];
        newFilters.push(filter);
        setFilters(newFilters);
        setInputValue("");
    }
    const handleDeleteFilter = (i: number) => () => {
        const newFilters = [...filters];
        newFilters.splice(i, 1);
        setFilters(newFilters);
    }

    const handleSetPokemon = (set: SetOption) => {
        loadSet(set);
        setFilters([]);
        setInputValue("");
        setOpen(false);
    }

    const getOptionsData = async () => {
        if (!allMoves || !allSpecies) {
            async function fetchData() {
                let newAllMoves = allMoves;
                let newAllSpecies = allSpecies;
                if (!newAllMoves) {
                    let moves = await PokedexService.getAllMoves();
                    if (moves) {
                        newAllMoves = new Map<MoveName,MoveData>();
                        for (let [move, data] of Object.entries(moves)) {
                            newAllMoves.set(move as MoveName, data as MoveData);
                        }
                    }
                }
                if (!newAllSpecies) {
                    let species = await PokedexService.getAllSpecies();
                    if (species) {
                        newAllSpecies = new Map<SpeciesName,PokemonData>();
                        for (let [specie, data] of Object.entries(species)) {
                            if (specie.includes("Flab")) {
                                const flab_species = "Flabebe";
                                const flab_data = {...data as PokemonData, name: "Flabébé" as SpeciesName};
                                newAllSpecies.set(flab_species as SpeciesName, flab_data as PokemonData);
                            } else {
                                newAllSpecies.set(specie as SpeciesName, data as PokemonData);
                            }
                        }
                    }
                }
                if (newAllMoves && newAllSpecies) {
                    setAllMoves(newAllMoves);
                    setAllSpecies(newAllSpecies);
                }
            }
            fetchData().catch((e) => console.log(e));
        }
    };

    useEffect(() => {
        if (filters.length > 0) {
            const typeFilters = filters.filter((f) => f.type === "Type").map((f) => f.name as TypeName);
            const abilityFilters = filters.filter((f) => f.type === "Ability").map((f) => f.name as AbilityName);
            const moveFilters = filters.filter((f) => f.type === "Moves").map((f) => f.name as MoveName);
            const newFilteredOptions: SearchOption[] = [];
            for (let option of allOptions) {
                switch (option.type) {
                    case("Pokémon"):
                        if (allSpecies) {
                            const pokemonData = allSpecies?.get(option.name as SpeciesName);
                            if (pokemonData) {
                                const matchesFilters = checkSpeciesForFilters(pokemonData, filters, translationKey);
                                if (matchesFilters) {
                                    newFilteredOptions.push(option);
                                }
                            }
                        } else {
                            newFilteredOptions.push(option);
                        }
                    break;
                    case("Type"):
                        if (typeFilters.includes(option.name as TypeName)) {
                            break;
                        }
                        newFilteredOptions.push(option);
                    break;
                    case("Ability"):
                        if (abilityFilters.flat().includes(option.name as AbilityName)) {
                            break;
                        }
                        newFilteredOptions.push(option);
                    break;
                    case("Moves"):
                        if (moveFilters.flat().includes(option.name as MoveName)) {
                            break;
                        }
                        newFilteredOptions.push(option);
                    break;
                }
            }
            setFilteredOptions(newFilteredOptions);
        } else {
            setFilteredOptions(allOptions);
        }
    }, [filters]);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        const newInputFilteredOptions: SearchOption[] = [];
        if (inputValue.length === 0 && filteredOptions.length === allOptions.length) {
            setInputFilteredOptions([]);
            return;
        }
        for (let option of filteredOptions) {
            if (checkOptionAgainstInput(option, inputValue, translationKey) && (inputValue.length > 0 || option.type === "Pokémon")) {
                newInputFilteredOptions.push(option);
            }
        }
        timeoutRef.current = setTimeout(() => {
            setInputFilteredOptions(newInputFilteredOptions);
        }, 300);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [inputValue, filteredOptions, translationKey]);

    return (
        <div>
            <Button onClick={handleOpen} variant="outlined" endIcon={<SearchIcon/>}>{getTranslation("Search", translationKey)}</Button>
            <Modal
                open={open}
                onClose={handleClose}
            >
                <Box sx={modalStyle}>
                    <Stack spacing={1}>
                        <TextField
                            variant="standard"
                            placeholder={getTranslation("Search", translationKey)}
                            value={inputValue}
                            onChange={(event) => {
                                setInputValue(event.target.value);
                            }}
                            InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon />
                                  </InputAdornment>
                                ),
                              }}
                        />
                        <FilterTags filters={filters} handleDeleteFilter={handleDeleteFilter} translationKey={translationKey}/>
                        <SearchResultsTable inputValue={inputValue} inputFilteredOptions={inputFilteredOptions} handleSetPokemon={handleSetPokemon} handleAddFilter={handleAddFilter} allSpecies={allSpecies} allMoves={allMoves} translationKey={translationKey}/>
                    </Stack>
                </Box>
            </Modal>
        </div>
    )
}

export default React.memo(PokemonLookup);