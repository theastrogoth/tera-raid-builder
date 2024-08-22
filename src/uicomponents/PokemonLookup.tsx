import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from "@mui/material/Typography";
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Popover from '@mui/material/Popover';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { styled, lighten, darken } from '@mui/material/styles';

import { GroupedVirtuoso } from 'react-virtuoso';

import { AbilityName, ItemName, MoveName, SpeciesName, StatsTable, TypeName } from "../calc/data/interface";
import PokedexService, { PokemonData } from "../services/getdata";
import { MoveData, SetOption } from "../raidcalc/interface";
import { ABILITIES, Generations, toID } from "../calc";
import { getEVDescription, setdexToOptions } from "../utils";

// import { GenericWithIcon, GroupHeader, MoveWithIcon, PokemonPopper, findOptionFromPokemonName, findOptionFromTeraTypeName } from "./BuildControls";
import { getPokemonSpriteURL, getTranslation, getTypeIconURL, getItemSpriteURL } from "../utils";

import RAIDER_SETDEX_SV from "../data/sets/raiders.json";
import { Chip, Divider } from "@mui/material";
import { findOptionFromPokemonName } from "./BuildControls";

const TYPE_COLORS = {
    "Bug": "#A2A400",
    "Dark": "#484848",
    "Dragon": "#5463E8",
    "Electric": "#CCAD00",
    "Fairy": "#CC89CC",
    "Fighting": "#FF9E00",
    "Fire": "#FF5715",
    "Flying": "#6CA2CC",
    "Ghost": "#733E77",
    "Grass": "#00C300",
    "Ground": "#B37531",
    "Ice": "#00ADCC",
    "Normal": "#999999",
    "Poison": "#A44BD6",
    "Psychic": "#FF4D78",
    "Rock": "#97996B",
    "Steel": "#4DB3D8",
    "Water": "#0095FF",
};

const gen = Generations.get(9);
const genTypes = [...gen.types].map(type => type.name).filter((t) => t !== "Stellar" && t !== "???").sort();
const genAbilities = ABILITIES[gen.num].filter((a) => a !== "(No Ability)").sort();
const genMoves = [...gen.moves].map(move => move.name).filter((m) => m !== "(No Move)").sort();

const IGNORED_FORMS = [
    "Mimikyu-Busted", 
    "Minior-Meteor", 
    "Eiscue-Noice", 
    "Morpeko-Hangry", 
    "Terapagos-Stellar", 
    "Meloetta-Pirouette",
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

const FORCED_ITEMS = new Map<SpeciesName, ItemName>([
    ["Zacian-Crowned", "Rusted Sword"],
    ["Zamazenta-Crowned", "Rusted Shield"],
    ["Dialga-Origin", "Adamant Crystal"],
    ["Palkia-Origin", "Lustrous Globe"],
    ["Giratina-Origin", "Griseous Orb"],
    ["Ogerpon-Hearthflame", "Hearthflame Mask"],
    ["Ogerpon-Wellspring", "Wellspring Mask"],
    ["Ogerpon-Cornerstone", "Cornerstone Mask"],
] as [SpeciesName, ItemName][]);

const genSpecies = [...gen.species].map(specie => specie.name)
    .filter((n) => !IGNORED_FORMS.includes(n))
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
        item: FORCED_ITEMS.get(specie),
    }])
}



type SearchOption = {
    name: string,
    type: "Pokémon" | "Moves" | "Ability" | "Type" | "Custom",
}

const allOptions: SearchOption[] = [];
for (let specie of genSpecies) {
    allOptions.push({name: specie.includes("Flab") ? "Flabebe" : specie, type: "Pokémon"});
}
for (let type of genTypes) {
    allOptions.push({name: type, type: "Type"});
}
for (let ability of genAbilities) {
    allOptions.push({name: ability, type: "Ability"});
}
for (let move of genMoves) {
    if (["Attack Cheer", "Defense Cheer", "Heal Cheer"].includes(move)) { continue; }
    allOptions.push({name: move, type: "Moves"});
}

function inputToStatID(input: string, reverseStatsTranslations: any) {
    const normalizedInput = normalizeText(input);
    let statID = reverseStatsTranslations ? reverseStatsTranslations[normalizedInput] || normalizedInput : normalizedInput;
    if (statID === "attack") {
        statID = "atk";
    } else if (statID === "defense") {
        statID = "def";
    } else if (statID === "spatk" || statID === "special-attack") {
        statID = "spa";
    } else if (statID === "spdef" || statID === "special-defense") {
        statID = "spd";
    } else if (statID === "speed") {
        statID = "spe";
    }
    return statID;
}

function checkSpeciesForFilters(species: PokemonData, filters: SearchOption[], translationKey: any, reverseStatsTranslations: any) {
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
                if (species.name === "Arceus") { break; }
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
                if(normalizeText(getTranslation(species.name, translationKey, "pokemon")).includes(normalizeText(filter.name))) {
                    break;
                }
                const operatorPrecedence = {
                    "&&": 1,
                    "||": 0
                };
                const andTranslation = normalizeText(getTranslation("and", translationKey));
                const orTranslation = normalizeText(getTranslation("or", translationKey));
                const andOperators = ["and", "&&", "&", ",", andTranslation];
                const orOperators = ["or", "||", "|", orTranslation];

                const operatorRegExp = new RegExp(`(\\s${andTranslation}\\s|\\s${orTranslation}\\s|\\sand\\s|\\s\\s|\\sor\\s|&&|\\|\\||&|\\||,|\\(|\\))`, "i");

                const validOperators = andOperators.concat(orOperators);

                const validComparators = ["<", ">", "<=", ">=", "=", "==", "===", "!=", "!=="];
                const validStats = ["hp", "atk", "def", "spa", "spd", "spe", "bst"];

                const filterComponents = 
                    normalizeText(filter.name).replace(/["]+/g, '').split(operatorRegExp).map((token) => token.trim()).filter(Boolean)
                    .map((item) => 
                        andOperators.includes(item) ? "&&" : item
                    )
                    .map((item) => 
                        orOperators.includes(item) ? "||" : item
                    );
                const termStack: string[] = [];
                const operatorStack: string[] = [];
                
                for (let component of filterComponents) {
                    let lastOperator = operatorStack.slice(-1)[0];
                    if (validOperators.includes(component)) {
                        while (operatorStack.length > 0 && validOperators.includes(lastOperator) && (operatorPrecedence[component as keyof typeof operatorPrecedence] <= operatorPrecedence[lastOperator as keyof typeof operatorPrecedence] || lastOperator === "(")) {
                            // @ts-ignore
                            termStack.push(operatorStack.pop());
                            lastOperator = operatorStack.slice(-1)[0];
                        }
                        operatorStack.push(component);
                    } else if (component === "(") {
                        operatorStack.push(component);
                    } else if (component === ")") {
                        while (operatorStack.length > 0 && lastOperator !== '(') {
                            // @ts-ignore
                            termStack.push(operatorStack.pop())
                            lastOperator = operatorStack.slice(-1)[0];
                        }
                        operatorStack.pop();
                    } else {
                        termStack.push(component);
                    }
                }
                while(operatorStack.length > 0) {
                    // @ts-ignore
                    termStack.push(operatorStack.pop());
                }
                
                const evaluatorStack: (string | boolean)[] = [];
                termStack.forEach((token) => {
                    if (validOperators.includes(token)) {
                        const operand2 = evaluatorStack.pop();
                        const operand1 = evaluatorStack.pop();

                        if (token === "&&") {
                            evaluatorStack.push(!!operand2 && !!operand1);
                        } else if (token === "||") {
                            evaluatorStack.push(!!operand2 || !!operand1);
                        }
                    }
                    else {
                        let termMatched = false;
                        if (normalizeText(token) === normalizeText(getTranslation("nfe", translationKey)) && species.nfe) { termMatched = true;}
                        const tokenComponents = token.split(/(<|>|<=|>=|=|==|===|!=|!==)/i).map((item) => item.trim()).filter(Boolean);
                        if (tokenComponents.length === 1) {
                            for (let move of species.moves) {
                                if (normalizeText(token) === normalizeText(getTranslation(move.name, translationKey, "moves"))) {
                                    termMatched = true;
                                    break;
                                }
                            }
                            for (let ability of species.abilities) {
                                if (normalizeText(token) === normalizeText(getTranslation(ability.name, translationKey, "abilities"))) {
                                    termMatched = true;
                                    break;
                                }
                            }
                            for (let type of species.types) {
                                const uppercaseType = type[0].toUpperCase() + type.slice(1) as TypeName; // data in the assets branch needs to be fixed
                                if (normalizeText(token) === normalizeText(getTranslation(uppercaseType, translationKey, "types"))) {
                                    termMatched = true;
                                    break;
                                }
                            }
                        } else if (tokenComponents.length === 3) {
                            const tokenStatID = normalizeText(tokenComponents[0]);
                            let value1 = parseInt(tokenComponents[0]);
                            const statID1 = inputToStatID(tokenStatID, reverseStatsTranslations);
                            if (isNaN(value1) && !validStats.includes(statID1)) {
                                return false;
                            }
                            if (isNaN(value1)) {
                                if (statID1 === "bst") {
                                    ["hp","atk","def","spa","spd","spe"].map((stat) => (species.stats[stat as keyof StatsTable] || 0) + 1).reduce((total, current) => total + current, 0);
                                } else {
                                    value1 = species.stats[statID1 as keyof StatsTable]!;
                                }   
                            }

                            const comparator = tokenComponents[1];
                            if (!validComparators.includes(comparator)) {
                                return false;
                            }


                            let value2 = parseInt(tokenComponents[2]);
                            const statID2 = inputToStatID(tokenComponents[2], reverseStatsTranslations);
                            if (isNaN(value2) && !validStats.includes(statID2)) {
                                return false;
                            }
                            if (isNaN(value2)) {
                                if (statID2 === "bst") {
                                    ["hp","atk","def","spa","spd","spe"].map((stat) => (species.stats[stat as keyof StatsTable] || 0) + 1).reduce((total, current) => total + current, 0);
                                } else {
                                    value2 = species.stats[statID2 as keyof StatsTable]!;
                                }   
                            }

                            switch (comparator) {
                                case "<":
                                    termMatched = value1 < value2;
                                break;
                                case ">":
                                    termMatched = value1 > value2;
                                break;
                                case "<=":
                                    termMatched = value1 <= value2;
                                break;
                                case ">=":
                                    termMatched = value1 >= value2;
                                break;
                                case "=":
                                case "==":
                                case "===":
                                    termMatched = value1 === value2;
                                break;
                                case "!=":
                                case "!==":
                                    termMatched = value1 !== value2;
                                break; 
                            }

                        }
                        evaluatorStack.push(termMatched);
                    }
                });
                if (evaluatorStack.length !== 1) {
                    return false;
                }
                if (evaluatorStack[0] === false) {
                    return false;
                } 
        }
    }
    return true;
}

function normalizeText(input: string) {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function checkOptionAgainstInput(option: SearchOption, inputValue: string, translationKey: any) {
    const translationCategory = 
        option.type === "Pokémon" ? "pokemon" : 
        option.type === "Moves" ? "moves" : 
        option.type === "Ability" ? "abilities" : 
        option.type === "Type" ? "types" : 
        undefined;
    const translatedOptionName = translationCategory === "pokemon" ? findOptionFromPokemonName(option.name, translationKey) : getTranslation(option.name, translationKey, translationCategory);
    const normalizedOptionName = normalizeText(translatedOptionName);
    const normalizedInputValue = normalizeText(inputValue);
    return normalizedOptionName.includes(normalizedInputValue);
}

function FilterGenericTag({text, handleDelete}: {text: String, handleDelete?: () => void}) {
    return (
        <ShadedPaper elevation={0} variant='outlined' sx={{ borderRadius: 100 }}> 
            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ minWidth: "50px", paddingX: "10px", paddingRight: handleDelete ? "5px" : "10px" }}>
                <Typography variant="body1" justifyContent="center" alignItems="center" sx={{ paddingY: "5px"}}>
                    {text}
                </Typography>
                { handleDelete &&
                <>
                    <Box flexGrow={1} />
                    <IconButton size="small" onClick={handleDelete}>
                        <CloseIcon/>
                    </IconButton>
                </>
                }
            </Stack>
        </ShadedPaper>
    );
}

function FilterTypeTag({text, color, handleDelete}: {text: String, color: String, handleDelete?: () => void}) {
    return (
        // @ts-ignore
        <Paper elevation={0} variant='outlined' sx={{ borderRadius: 100, backgroundColor: color }}> 
            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ minWidth: "50px", paddingX: "10px", paddingRight: handleDelete ? "5px" : "10px" }}>
                <Typography variant="body1" justifyContent="center" alignItems="center" color={"white"} sx={{ paddingY: "5px"}}>
                    {text}
                </Typography>
                { handleDelete &&
                <>
                    <Box flexGrow={1} />
                    <IconButton size="small" onClick={handleDelete}>
                        <CloseIcon/>
                    </IconButton>
                </>
                }
            </Stack>
        </Paper>
    );
}

function FilterTagDispatcher({filter, handleDelete, translationKey}: {filter: SearchOption, handleDelete: () => void, translationKey: any}) {
    switch(filter.type) {
        case "Type":
            // @ts-ignore
            return <FilterTypeTag text={getTranslation(filter.name, translationKey, "types")} color={TYPE_COLORS[filter.name]} handleDelete={handleDelete}/>
        case "Moves":
            const move = gen.moves.get(toID(filter.name))!;
            // @ts-ignore
            return <FilterTypeTag text={getTranslation(filter.name, translationKey, "moves")} color={TYPE_COLORS[move.type]} handleDelete={handleDelete}/>
        case "Ability":
            return <FilterGenericTag text={getTranslation(filter.name, translationKey, "abilities")} handleDelete={handleDelete}/>
        case "Custom":
            return <FilterGenericTag text={getTranslation(filter.name, translationKey, "ui")} handleDelete={handleDelete}/>
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

const ShadedPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? darken(theme.palette.background.paper, 0.1) : lighten(theme.palette.background.paper, 0.1),
}));    

const ShadedChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? darken(theme.palette.background.paper, 0.1) : lighten(theme.palette.background.paper, 0.1),
}));

const ButtonTable = styled(Table)(({ theme }) => ({
    size: "small",
    borderCollapse: 'separate',
    borderSpacing: '0px 10px',
}));

const HeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    fontSize: 10,
    paddingTop: 10,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: 'solid #aaaaaa 2px',
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

const HeaderRow = styled(RoundedRow)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
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
        <HeaderButton 
            size="small" 
            variant="text" 
            onClick={() => handleButtonClick(sortMethod)} 
            style={{ backgroundColor: 'transparent' }}
            sx={{ textTransform: 'none', minWidth: 0 }}
        >
            <Typography fontSize={10} fontWeight={method === sortMethod ? 800 : 600}>
                {`${getTranslation(label, translationKey,"stats")}`}
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
        item: FORCED_ITEMS.get(pokemon),
    }];

    return (
        <React.Fragment>
        <ButtonRow onClick={() => setOpen(!open)}>
            <CompactLeftCell width="40px">
                <IconButton size="small" disabled={true}>
                    {open ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                </IconButton>
            </CompactLeftCell>
            <CompactTableCell width="30px">
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getPokemonSpriteURL(data.name)}) no-repeat center center / contain`,
                    }}
                />
            </CompactTableCell>
            <CompactTableCell width="100px">
                <Typography fontSize={10} m={.5}>
                    {findOptionFromPokemonName(data.name, translationKey)}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="60px">
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
            <CompactTableCell width="100px">
                <Stack direction="column" alignItems="center" >
                    { data.abilities.map((ability) => (
                        <Typography fontSize={10}>
                            {getTranslation(ability.name, translationKey, "abilities")}
                        </Typography>
                    ))}
                </Stack>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.hp}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.atk}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.def}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.spa}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.spd}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.stats.spe}
                </Typography>
            </CompactTableCell>
            <CompactRightCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {Object.entries(data.stats).reduce((acc, [key, value]) => acc + value, 0)}
                </Typography>
            </CompactRightCell>
        </ButtonRow>
        { open &&
            <TableRow>
                <TableCell colSpan={12} sx={{ paddingY: 0, paddingLeft: "20px", paddingRight: "0px"}}>
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
        </React.Fragment>
    )
}

function RaiderSetRow({set, handleSetPokemon, translationKey}: {set: SetOption, handleSetPokemon: (s: SetOption) => void, translationKey: any}) {
    const setEVs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...set.evs};
    const setMoves = [...(set.moves || ["", "", "", ""])];
    while (setMoves.length < 4) {
        setMoves.push("");
    }

    return (
        <ButtonRow onClick={() => handleSetPokemon(set)} sx={{paddingY: 0, marginY: 0, height: 40}}>
            <CompactLeftCell width="40px"></CompactLeftCell>
            <CompactTableCell width="80px" align="center">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(set.name, translationKey)}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="100px" align="center">
                <Stack direction="row" justifyContent="center">
                    {set.item && <Box
                        sx={{
                            width: "20px",
                            height: "20px",
                            overflow: 'hidden',
                            background: `url(${getItemSpriteURL(set.item as string)}) no-repeat center center / contain`,
                        }}
                    />}
                    <Typography fontSize={10} m={.5}>
                        {set.item ? set.item : "No Item"}
                    </Typography> 
                </Stack>
            </CompactTableCell>
            <CompactTableCell width="90px" align="center">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(set.ability || "(No Ability)", translationKey, "abilities")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(set.nature || "Hardy", translationKey, "natures")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="100px" align="center">
                <Typography fontSize={10} m={.5}>
                    {getEVDescription(setEVs, translationKey)}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="90px" align="center">
                <Stack>
                    <Typography fontSize={10}>
                        {getTranslation(setMoves[0], translationKey, "moves")}
                    </Typography>
                    <Typography fontSize={10}>
                        {getTranslation(setMoves[1], translationKey, "moves")}
                    </Typography>
                </Stack>
            </CompactTableCell>
            <CompactRightCell width="90px" align="center">
                <Stack>
                    <Typography fontSize={10}>
                        {getTranslation(setMoves[2], translationKey, "moves")}
                    </Typography>
                    <Typography fontSize={10}>
                        {getTranslation(setMoves[3], translationKey, "moves")}
                    </Typography>
                </Stack>
            </CompactRightCell>
        </ButtonRow>
    )
}

function TypeSearchResult({type, handleAddFilter, translationKey}: {type: TypeName, handleAddFilter: (f: SearchOption) => void, translationKey: any}) {
    return (
        <ButtonRow onClick={() => handleAddFilter({name: type, type: "Type"})} >
            <CompactLeftCell width="40px"></CompactLeftCell>
            <CompactTableCell width="30px">
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getTypeIconURL(type)}) no-repeat center center / contain`,
                    }}
                />
            </CompactTableCell>
            <CompactTableCell width="100px">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(type, translationKey, "types")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="60px"></CompactTableCell>
            <CompactTableCell width="100px"></CompactTableCell>
            <CompactTableCell width="50px"></CompactTableCell>
            <CompactRightCell width="300px" colSpan={6} align="center">
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
        
            <CompactLeftCell width="40px"></CompactLeftCell>
            <CompactTableCell width="30px"></CompactTableCell>
            <CompactTableCell width="100px">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(ability, translationKey, "abilities")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="60px"></CompactTableCell>
            <CompactTableCell width="100px"></CompactTableCell>
            <CompactTableCell width="50px"></CompactTableCell>
            <CompactRightCell width="300px" colSpan={6} align="center">
                <Typography fontSize={10} m={.5} fontStyle="italic">
                    {`(${getTranslation("Filter", translationKey)})`}
                </Typography>
            </CompactRightCell>
        </ButtonRow>
    )
}

function MoveSearchResult({move, allMoves, handleAddFilter, translationKey}: {move: MoveName, allMoves: Map<MoveName,MoveData>, handleAddFilter: (f: SearchOption) => void,translationKey: any}) {
    const data = allMoves.get(move)!;
    console.log(move, data);
    return (
        <ButtonRow onClick={() => handleAddFilter({name: data.name, type: "Moves"})}>
            <CompactLeftCell width="40px"></CompactLeftCell>
            <CompactTableCell width="30px"></CompactTableCell>
            <CompactTableCell width="100px">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(data.name, translationKey, "moves")}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="60px">
                <Box
                    sx={{
                        width: "25px",
                        height: "25px",
                        overflow: 'hidden',
                        background: `url(${getTypeIconURL(data.type!)}) no-repeat center center / contain`,
                    }}
                />
            </CompactTableCell>
            <CompactTableCell width="100px" align="center">
                <Typography fontSize={10} m={.5}>
                    {getTranslation(data.moveCategory!, translationKey)}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.power || '-'}
                </Typography>
            </CompactTableCell>
            <CompactTableCell width="50px" align="center">
                <Typography fontSize={10} m={.5}>
                    {data.accuracy || '-'}
                </Typography>
            </CompactTableCell>
            <CompactRightCell width="300px" colSpan={6} align="center">
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
    const [speciesOptions, setSpeciesOptions] = useState<SearchOption[]>(inputFilteredOptions);
    const [typeOptions, setTypeOptions] = useState<SearchOption[]>([]);
    const [abilityOptions, setAbilityOptions] = useState<SearchOption[]>([]);
    const [moveOptions, setMoveOptions] = useState<SearchOption[]>([]);
    useEffect(() => {
        const newSpeciesOptions: SearchOption[] = [];
        const newTypeOptions: SearchOption[] = [];
        const newAbilityOptions: SearchOption[] = [];
        const newMoveOptions: SearchOption[] = [];
        for (let option of inputFilteredOptions) {
            switch (option.type) {
                case "Pokémon":
                    newSpeciesOptions.push(option);
                break;
                case "Type":
                    newTypeOptions.push(option);
                break;
                case "Ability":
                    newAbilityOptions.push(option);
                break;
                case "Moves":
                    newMoveOptions.push(option);
                break;
            }
        }
        newSpeciesOptions.sort((a, b) => { // Necessary for maintaining alphabetical sorting for non-English languages. Too lazy to keep things DRY
            const aName = findOptionFromPokemonName(a.name, translationKey);
            const bName = findOptionFromPokemonName(b.name, translationKey);
            if (sortDirection === 'desc') {
                return (aName).localeCompare(bName);
            } else if (sortDirection === 'asc') {
                return (bName).localeCompare(aName);
            }
            return 0;
        });
        setSpeciesOptions(newSpeciesOptions);
        setTypeOptions(newTypeOptions);
        setAbilityOptions(newAbilityOptions);
        setMoveOptions(newMoveOptions);
        sortSpecies(newSpeciesOptions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const sortSpecies = (sortSpeciesOptions: SearchOption[]) => {
        let sortedSpeciesOptions: SearchOption[] = [];
        if (sortMethod === "species") {
            sortedSpeciesOptions = [...sortSpeciesOptions].sort((a, b) => {
                const aName = findOptionFromPokemonName(a.name, translationKey);
                const bName = findOptionFromPokemonName(b.name, translationKey);
                if (sortDirection === 'desc') {
                    return (aName).localeCompare(bName);
                } else if (sortDirection === 'asc') {
                    return (bName).localeCompare(aName);
                }
                return 0;
            });
        } else if (sortMethod === "bst") {
            sortedSpeciesOptions = [...sortSpeciesOptions].sort((a, b) => {
                const aData = allSpecies?.get(a.name as SpeciesName) || allSpecies?.get('Flabebe' as SpeciesName); 
                const bData = allSpecies?.get(b.name as SpeciesName) || allSpecies?.get('Flabebe' as SpeciesName); 
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
            sortedSpeciesOptions = [...sortSpeciesOptions].sort((a, b) => {
                const aData = allSpecies?.get(a.name as SpeciesName) || allSpecies?.get('Flabebe' as SpeciesName); 
                const bData = allSpecies?.get(b.name as SpeciesName) || allSpecies?.get('Flabebe' as SpeciesName); 
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
    }

    useEffect(() => {
        sortSpecies(speciesOptions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortMethod, sortDirection]);

    let groupCounts = [speciesOptions, typeOptions, abilityOptions, moveOptions, (inputValue.length > 0 ? [1] : [])].map((o) => o.length);
    const groupIndexes = [0, 1, 2, 3, 4].filter((i, idx) => groupCounts[idx] > 0);
    groupCounts = groupCounts.filter((c) => c > 0);
    const cumulativeCounts: number[] = [0]
    let acc = 0;
    for (let c of groupCounts.slice(0, -1)) {
        acc += c;
        cumulativeCounts.push(acc);
    }

    return (
        <Box justifyContent="center" alignItems="center">
            { (!allSpecies || !allMoves) &&
                <Typography fontSize={10} m={.5}>
                    {"Loading..."}
                </Typography>
            }
            {/* { ((allSpecies && allMoves) && inputValue.length === 0) &&
                <Typography fontSize={10} m={.5}>
                    {"Enter text to add a search filter or select a Pokémon"}
                </Typography>
            } */}
            {((allSpecies && allMoves) && inputValue.length > 0 && inputFilteredOptions.length === 0) &&
                <Typography fontSize={10} m={.5}>
                    {"No results found"}
                </Typography>
            }
            { (allSpecies && allMoves) &&
                <GroupedVirtuoso 
                    style={{ height: "70vh", width: "720px" }}
                    groupCounts={groupCounts}
                    groupContent={ (g) => (
                        <>
                        { groupIndexes[g] === 0 && speciesOptions.length > 0 ?
                            <HeaderRow>
                                <HeaderCell width="40px"></HeaderCell>
                                <HeaderCell width="30px"></HeaderCell>
                                <HeaderCell width="100px">
                                    <SortingButton label="Pokémon" method="species" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('species')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="60px">{getTranslation("Type", translationKey)}</HeaderCell>
                                <HeaderCell width="100px" align="center">{getTranslation("Ability", translationKey)}</HeaderCell>
                                <HeaderCell width="50px" align="center">
                                    <SortingButton label="HP" method="hp" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('hp')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="50px" align="center">
                                    <SortingButton label="Atk" method="atk" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('atk')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="50px" align="center">
                                    <SortingButton label="Def" method="def" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('def')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="50px" align="center">
                                    <SortingButton label="SpA" method="spa" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('spa')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="50px" align="center">
                                    <SortingButton label="SpD" method="spd" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('spd')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="50px" align="center">
                                    <SortingButton label="Spe" method="spe" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('spe')} translationKey={translationKey}/>
                                </HeaderCell>
                                <HeaderCell width="50px" align="center" sx={{ paddingRight: "10px" }}>
                                    <SortingButton label="BST" method="bst" sortMethod={sortMethod} sortDirection={sortDirection} handleButtonClick={() => handleButtonClick('bst')} translationKey={translationKey}/>
                                </HeaderCell>
                            </HeaderRow> : null
                        }
                        { groupIndexes[g] === 1 && typeOptions.length > 0 ?
                        <HeaderRow>
                            <HeaderCell width="40px"></HeaderCell>
                            <HeaderCell width="30px"></HeaderCell>
                            <HeaderCell width="100px">
                                <Typography>{getTranslation("Type", translationKey)}</Typography>
                            </HeaderCell>
                            <HeaderCell width="60px"></HeaderCell>
                            <HeaderCell width="100px" align="center"></HeaderCell>
                            <HeaderCell width="350px" align="center"></HeaderCell>
                        </HeaderRow> : null
                        }
                        { groupIndexes[g] === 2 && abilityOptions.length > 0 ?
                        <HeaderRow>
                            <HeaderCell width="40px"></HeaderCell>
                            <HeaderCell width="30px"></HeaderCell>
                            <HeaderCell width="100px">
                                <Typography>{getTranslation("Ability", translationKey)}</Typography>
                            </HeaderCell>
                            <HeaderCell width="60px"></HeaderCell>
                            <HeaderCell width="100px" align="center"></HeaderCell>
                            <HeaderCell width="350px" align="center"></HeaderCell>    
                        </HeaderRow> : null
                        }
                        { groupIndexes[g] === 3 && moveOptions.length > 0 ?
                        <HeaderRow>
                            <HeaderCell width="40px"></HeaderCell>
                            <HeaderCell width="30px"></HeaderCell>
                            <HeaderCell width="100px">
                                <Typography>{getTranslation("Move", translationKey)}</Typography>
                            </HeaderCell>
                            <HeaderCell width="60px">{getTranslation("Type", translationKey)}</HeaderCell>
                            <HeaderCell width="100px" align="center">{getTranslation("Category", translationKey)}</HeaderCell>
                            <HeaderCell width="50px" align="center">{getTranslation("Power", translationKey)}</HeaderCell>
                            <HeaderCell width="50px" align="center">{getTranslation("Accuracy", translationKey)}</HeaderCell>
                            <HeaderCell width="250px" align="center"></HeaderCell>
                        </HeaderRow> : null
                        }
                        { groupIndexes[g] === 4 && inputValue.length > 0 ?
                        <HeaderRow>
                            <HeaderCell width="40px"></HeaderCell>
                            <HeaderCell width="30px"></HeaderCell>
                            <HeaderCell width="100px">
                                <Typography>{getTranslation("Custom", translationKey)}</Typography>
                            </HeaderCell>
                            <HeaderCell width="60px"></HeaderCell>
                            <HeaderCell width="100px" align="center"></HeaderCell>
                            <HeaderCell width="350px" align="center"></HeaderCell>
                        </HeaderRow> : null
                        }
                        </>)
                    }
                    itemContent={(i, g) => (
                        <>
                        { groupIndexes[g] === 0 && speciesOptions.length > 0 &&
                            <SpeciesSearchResult 
                                key={`${i}${g}`}
                                pokemon={speciesOptions[i].name as SpeciesName} 
                                handleSetPokemon={handleSetPokemon} 
                                allSpecies={allSpecies}
                                translationKey={translationKey}
                            />
                        }
                        { groupIndexes[g] === 1 && typeOptions.length > 0 &&
                            <TypeSearchResult
                                key={`${i}${g}`}
                                type={typeOptions[i - cumulativeCounts[g]].name as TypeName} 
                                handleAddFilter={handleAddFilter} 
                                translationKey={translationKey}
                            />
                        }
                        { groupIndexes[g] === 2 && abilityOptions.length > 0 &&
                            <AbilitySearchResult
                                key={`${i}${g}`}
                                ability={abilityOptions[i - cumulativeCounts[g]].name as AbilityName} 
                                handleAddFilter={handleAddFilter} 
                                translationKey={translationKey}
                            />
                        }
                        { groupIndexes[g] === 3 && moveOptions.length > 0 &&
                            <MoveSearchResult
                                key={`${i}${g}`}
                                move={moveOptions[i - cumulativeCounts[g]].name as MoveName} 
                                handleAddFilter={handleAddFilter} 
                                allMoves={allMoves}
                                translationKey={translationKey}
                            />
                        }
                        { groupIndexes[g] === 4 && inputValue.length > 0 &&
                            <ButtonRow onClick={() => handleAddFilter({name: inputValue, type: "Custom"})}>
                                <CompactLeftCell width="40px"></CompactLeftCell>
                                <CompactTableCell width="30px"></CompactTableCell>
                                <CompactTableCell width="100px">
                                    <Typography fontSize={10} m={.5}>
                                        {`${getTranslation("Add", translationKey)} "${inputValue}"`}
                                    </Typography>
                                </CompactTableCell>
                                <CompactTableCell width="60px"></CompactTableCell>
                                <CompactTableCell width="100px" align="center"></CompactTableCell>
                                <CompactTableCell width="50px"></CompactTableCell>
                                <CompactRightCell width="300px" colSpan={6} align="center">
                                    <Typography fontSize={10} m={.5} fontStyle="italic">
                                        {`(${getTranslation("Filter", translationKey)})`}
                                    </Typography>
                                </CompactRightCell>
                            </ButtonRow>
                        }
                        </>
                    )}
                />
            }
        </Box>
    )
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    // width: '90vw',
    // maxWidth: '780px',
    width: '780px',
    height: '90vh',
    bgcolor: 'background.paper',
    borderRadius: '8px',
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
    const handleClose = () => {setInputValue(""); setOpen(false)};

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const popoverOpen = Boolean(anchorEl);

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

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleAddFilter({"name": inputValue, "type": "Custom"}); // currently treating everything as custom
        }
    };

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
            const statsTranslations = translationKey ? Object.fromEntries(Object.entries(translationKey["stats"]).map(([key, value]) => [normalizeText(key), normalizeText(value as string || key)])) : null;
            const reverseStatsTranslations = statsTranslations ? Object.fromEntries(Object.entries(statsTranslations).map(([key, value]) => [value, key])) : null;
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
                                const matchesFilters = checkSpeciesForFilters(pokemonData, filters, translationKey, reverseStatsTranslations);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        const newInputFilteredOptions: SearchOption[] = [];
        // if (inputValue.length === 0 && filteredOptions.length === allOptions.length) {
        //     setInputFilteredOptions([]);
        //     return;
        // }
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
        <Box width="100%">
            <Button onClick={handleOpen} variant="outlined" endIcon={<SearchIcon/>} sx={{"width": "100%"}}>{getTranslation("Search", translationKey)}</Button>
            <Modal
                open={open}
                onClose={handleClose}
            >
                <Box sx={modalStyle}>
                    <Stack spacing={1}>
                        <Stack direction="row" sx={{ width: "100%"}}>
                            <TextField
                                variant="standard"
                                placeholder={
                                    `${getTranslation("Search", translationKey)}`
                                }
                                value={inputValue}
                                onChange={(event) => {
                                    setInputValue(event.target.value);
                                }}
                                onKeyDown={handleKeyPress}
                                InputProps={{
                                    startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                    ),
                                }}
                                sx={{ width: "100%", paddingRight: "10px"}}
                            />
                            <Box>
                                <IconButton aria-describedby={popoverOpen ? "simple-popover" : undefined} onClick={handlePopoverOpen}>
                                    <InfoOutlinedIcon color="info" sx={{ transform: "scale(1.3)"}}/>
                                </IconButton>
                                <Popover
                                    id={popoverOpen ? "simple-popover" : undefined}
                                    open={popoverOpen}
                                    anchorEl={anchorEl}
                                    onClose={handlePopoverClose}
                                    anchorOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'left',
                                    }}
                                >
                                    <Paper sx={{ p: 2, backgroundColor: "modal.main" }}>
                                        <Stack direction="column">
                                            <Box>
                                                <Typography variant="h6">
                                                    {`${getTranslation("Search Info",translationKey)}`}
                                                </Typography>
                                            </Box>
                                            <Divider/>
                                            <Box padding="10px 0px">
                                                <Typography fontWeight="bold">
                                                    {`${getTranslation("Simple Filters",translationKey)}:`}
                                                </Typography>
                                                <Stack direction="column">
                                                    <Stack direction="row" paddingLeft="20px" alignItems="center" margin="5px 0px">
                                                        <Typography>{`${getTranslation("By Type",translationKey)}:`}</Typography>
                                                        <Box flexGrow={1} sx={{minWidth: "5px"}} />
                                                        <FilterTypeTag text={getTranslation("Fairy",translationKey,"types")} color={TYPE_COLORS.Fairy} />
                                                    </Stack>
                                                    <Stack direction="row" paddingLeft="20px" alignItems="center" margin="5px 0px">
                                                        <Typography>{`${getTranslation("By Ability",translationKey)}:`}</Typography>
                                                        <Box flexGrow={1} sx={{minWidth: "5px"}} />
                                                        <FilterGenericTag text={getTranslation("Friend Guard",translationKey,"abilities")} />
                                                    </Stack>
                                                    <Stack direction="row" paddingLeft="20px" alignItems="center" margin="5px 0px">
                                                        <Typography>{`${getTranslation("By Move",translationKey)}:`}</Typography>
                                                        <Box flexGrow={1} sx={{minWidth: "5px"}} />
                                                        <FilterTypeTag text={getTranslation("Helping Hand",translationKey,"moves")} color={TYPE_COLORS.Normal} />
                                                    </Stack>
                                                    <Stack direction="row" paddingLeft="20px" alignItems="center" margin="5px 0px">
                                                        <Typography>{`${getTranslation("By Stat",translationKey)}:`}</Typography>
                                                        <Box flexGrow={1} sx={{minWidth: "5px"}} />
                                                        <FilterGenericTag text={`${getTranslation("Speed",translationKey,"stats")} > 95`} />
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                            <Box padding="10px 0px">
                                                <Typography fontWeight="bold">
                                                    {`${getTranslation("Custom Filters",translationKey)}:`}
                                                </Typography>
                                                <Stack direction="column">
                                                    <Stack direction="column" paddingLeft="20px" margin="5px 0px">
                                                        <Typography>{`${getTranslation("And Operator",translationKey)}:`}</Typography>
                                                        <FilterGenericTag text={`${getTranslation("Intimidate",translationKey,"abilities")} ${getTranslation("and",translationKey)} ${getTranslation("Fire",translationKey,"types")}`} />
                                                    </Stack>
                                                </Stack>
                                                <Stack direction="column" paddingLeft="20px" margin="5px 0px">
                                                    <Typography>{`${getTranslation("Or Operator",translationKey)}:`}</Typography>
                                                    <FilterGenericTag text={`${getTranslation("Fake Tears",translationKey,"moves")} ${getTranslation("or",translationKey)} ${getTranslation("Acid Spray",translationKey,"moves")}`} />
                                                </Stack>
                                            </Box>
                                            <Box padding="10px 0px">
                                                <Typography fontWeight="bold">
                                                    {`${getTranslation("Complex Filters",translationKey)}:`}
                                                </Typography>
                                                <Stack direction="column">
                                                    <Stack direction="column" paddingLeft="20px" margin="5px 0px">
                                                        <Typography>Queries:</Typography>
                                                        <ShadedChip 
                                                            label={
                                                                <Typography style={{"whiteSpace":"normal", "fontSize":"0.6384rem", "textAlign":"center"}}>
                                                                    {/* Flying and Screech and <br/>(Speed {'<'} 80 or Compound Eyes) */}
                                                                    {`${getTranslation("Flying",translationKey,"types")} ${getTranslation("and",translationKey)} ${getTranslation("Screech",translationKey,"moves")} ${getTranslation("and",translationKey)}`}
                                                                    <br/>
                                                                    {`(${getTranslation("Speed",translationKey,"stats")} < 80 ${getTranslation("or",translationKey)} ${getTranslation("Compound Eyes",translationKey,"abilities")})`}
                                                                </Typography>
                                                            }
                                                            variant="outlined" size="small" 
                                                            sx={{
                                                                "borderRadius": "100px",
                                                                "width": "170px",
                                                                "height": "48px"
                                                            }}/>
                                                        {/* <FilterGenericTag text={`${getTranslation("Flying",translationKey,"types")} ${getTranslation("and",translationKey)} ${getTranslation("Screech",translationKey,"moves")} ${getTranslation("and",translationKey)} (${getTranslation("Speed",translationKey,"stats")} < 80 ${getTranslation("or",translationKey)} ${getTranslation("Compound Eyes",translationKey,"abilities")})`} /> */}
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Popover>
                            </Box>
                            <Box sx={{ transform: "translate(20px, -20px)"}}>
                                <IconButton size="large" onClick={handleClose}>
                                    <CloseIcon/>
                                </IconButton>
                            </Box>
                        </Stack>
                        <FilterTags filters={filters} handleDeleteFilter={handleDeleteFilter} translationKey={translationKey}/>
                        <SearchResultsTable inputValue={inputValue} inputFilteredOptions={inputFilteredOptions} handleSetPokemon={handleSetPokemon} handleAddFilter={handleAddFilter} allSpecies={allSpecies} allMoves={allMoves} translationKey={translationKey}/>
                    </Stack>
                </Box>
            </Modal>
        </Box>
    )
}

export default React.memo(PokemonLookup);