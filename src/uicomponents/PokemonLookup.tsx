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
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { AbilityName, MoveName, SpeciesName, TypeName } from "../calc/data/interface";
import PokedexService, { PokemonData } from "../services/getdata";
import { MoveData, MoveSetItem } from "../raidcalc/interface";
import { ABILITIES, Generations, Move } from "../calc";
// import { GenericWithIcon, GroupHeader, MoveWithIcon, PokemonPopper, findOptionFromPokemonName, findOptionFromTeraTypeName } from "./BuildControls";
import { getPokemonSpriteURL, getTranslation, getTypeIconURL } from "../utils";

const gen = Generations.get(9);
const genTypes = [...gen.types].map(type => type.name).filter((t) => t !== "Stellar" && t !== "???").sort();
const genAbilities = ABILITIES[gen.num].sort();
const genMoves = [...gen.moves].map(move => move.name).sort();
const genSpecies = [...gen.species].map(specie => specie.name)
    .filter((n) => !["Mimikyu-Busted", "Minior-Meteor", "Eiscue-Noice", "Morpeko-Hangry", "Terapagos-Stellar", "Meloetta-Pirouette"].includes(n))
    .sort();

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
    const translatedOptionName = getTranslation(option.name, translationKey, option.type);
    const normalizedOptionName = translatedOptionName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedInputValue = inputValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return normalizedOptionName.includes(normalizedInputValue);
}

function FilterGenericTag({text, handleDelete}: {text: String, handleDelete: () => void}) {
    return (
        <Paper elevation={0} variant='outlined'>
            <Stack direction="row">
                <Typography fontSize={10} m={.5}>
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
        <Paper elevation={0} variant='outlined'> 
            <Stack direction="row">
                <Typography fontSize={10} m={.5}>
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

function SpeciesSearchResult({pokemon, allSpecies, handleSetPokemon, translationKey}: {pokemon: SpeciesName, allSpecies: Map<SpeciesName,PokemonData>, handleSetPokemon: (n: SpeciesName) => void, translationKey: any}) {
    const [open, setOpen] = useState(false);
    const data = allSpecies.get(pokemon)!;
    return (
        <div>
            {data &&
            <Paper elevation={0} variant='outlined' sx={{  }}>
                <Button onClick={() => handleSetPokemon(data.name)} variant="text">
                <TableRow>
                    <TableCell>
                        <IconButton size="small" onClick={() => setOpen(!open)}>
                            {open ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                        </IconButton>
                    </TableCell>
                    <TableCell>
                        <Box
                            sx={{
                                width: "25px",
                                height: "25px",
                                overflow: 'hidden',
                                background: `url(${getPokemonSpriteURL(data.name)}) no-repeat center center / contain`,
                            }}
                        />
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {getTranslation(data.name, translationKey, "pokemon")}
                        </Typography>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                        <Stack direction="column" alignItems="center" >
                            { data.abilities.map((ability) => (
                                <Typography fontSize={10} m={.5}>
                                    {getTranslation(ability.name, translationKey, "abilities")}
                                </Typography>
                            ))}
                        </Stack>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.stats.hp}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.stats.atk}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.stats.def}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.stats.spa}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.stats.spd}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.stats.spe}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {Object.entries(data.stats).reduce((acc, [key, value]) => acc + value, 0)}
                        </Typography>
                    </TableCell>
                </TableRow>
                </Button>
            </Paper>
            }
        </div>
    )
}

function TypeSearchResult({type, handleAddFilter, translationKey}: {type: TypeName, handleAddFilter: (f: SearchOption) => void, translationKey: any}) {
    return (
        <Paper elevation={0} variant='outlined' sx={{  }}>
            <Button variant="text" onClick={() => handleAddFilter({name: type, type: "Type"})}>
            <TableRow>
                <TableCell></TableCell>
                <TableCell>
                    <Box
                        sx={{
                            width: "25px",
                            height: "25px",
                            overflow: 'hidden',
                            background: `url(${getTypeIconURL(type)}) no-repeat center center / contain`,
                        }}
                    />
                </TableCell>
                <TableCell>
                    <Typography fontSize={10} m={.5}>
                        {getTranslation(type, translationKey, "types")}
                    </Typography>
                </TableCell>
            </TableRow>
            </Button>
        </Paper>
    )
}

function AbilitySearchResult({ability, handleAddFilter, translationKey}: {ability: AbilityName, handleAddFilter: (f: SearchOption) => void, translationKey: any}) {
    return (
        <Paper elevation={0} variant='outlined' sx={{  }}>
            <Button variant="text" onClick={() => handleAddFilter({name: ability, type: "Ability"})}>
            <TableRow>
                <TableCell></TableCell>
                <TableCell>
                    <Typography fontSize={10} m={.5}>
                        {getTranslation(ability, translationKey, "abilities")}
                    </Typography>
                </TableCell>
            </TableRow>
            </Button>
        </Paper>
    )
}

function MoveSearchResult({move, allMoves, handleAddFilter, translationKey}: {move: MoveName, allMoves: Map<MoveName,MoveData>, handleAddFilter: (f: SearchOption) => void,translationKey: any}) {
    const data = allMoves.get(move);
    return (
        <div>
            {data &&
            <Paper elevation={0} variant='outlined' sx={{  }}>
                <Button variant="text" onClick={() => handleAddFilter({name: data.name, type: "Moves"})}>
                <TableRow>
                    <TableCell></TableCell>
                    <TableCell>
                        <Box
                            sx={{
                                width: "25px",
                                height: "25px",
                                overflow: 'hidden',
                                background: `url(${getTypeIconURL(data.type!)}) no-repeat center center / contain`,
                            }}
                        />
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {getTranslation(data.name, translationKey, "moves")}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {getTranslation(data.moveCategory!, translationKey)}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography fontSize={10} m={.5}>
                            {data.power || ''}
                        </Typography>
                    </TableCell>
                </TableRow>
                </Button>
            </Paper>
            }
        </div>
    )
}

function SearchResultsTable({inputFilteredOptions, handleSetPokemon, handleAddFilter, allSpecies, allMoves, translationKey}: {inputFilteredOptions: SearchOption[], handleSetPokemon: (n: SpeciesName) => void, handleAddFilter: (f: SearchOption) => void, allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, translationKey: any}) {
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

    return (
        <Box justifyContent="center" alignItems="center" sx={{ maxHeight: "200px", width: '100%' }}>
            { (!allSpecies || !allMoves) &&
                <Typography fontSize={10} m={.5}>
                    {"Loading..."}
                </Typography>
            }
            { (allSpecies && allMoves) &&
                <Stack>
                    {speciesOptions.length > 0 && 
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {speciesOptions.map((pokemon) => (
                                        <SpeciesSearchResult pokemon={pokemon} handleSetPokemon={handleSetPokemon} allSpecies={allSpecies} translationKey={translationKey}/>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }
                    {typeOptions.length > 0 && 
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {typeOptions.map((type) => (
                                        <TypeSearchResult type={type} handleAddFilter={handleAddFilter} translationKey={translationKey}/>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }
                    {abilityOptions.length > 0 && 
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {abilityOptions.map((ability) => (
                                        <AbilitySearchResult ability={ability} handleAddFilter={handleAddFilter} translationKey={translationKey}/>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }
                    {moveOptions.length > 0 && 
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {moveOptions.map((move) => (
                                        <MoveSearchResult move={move} handleAddFilter={handleAddFilter} allMoves={allMoves} translationKey={translationKey}/>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }
                </Stack>
            }
        </Box>
    )
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 300,
    width: '80%',
    maxWidth: 800,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

function PokemonLookup({setPokemon, allSpecies, allMoves, setAllSpecies, setAllMoves, translationKey}: 
    {setPokemon: (n: string) => void, allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, setAllSpecies: (s: Map<SpeciesName,PokemonData> | null) => void, setAllMoves: (m: Map<MoveName,MoveData> | null) => void, translationKey: any}) {

    // const [moveFilters, setMoveFilters] = useState<MoveName[]>([]);
    // const [abilityFilters, setAbilityFilters] = useState<AbilityName[]>([]);
    // const [typeFilters, setTypeFilters] = useState<TypeName[]>([]);
    // const [customFilters, setCustomFilters] = useState<string[]>([]);
    const [filters, setFilters] = useState<SearchOption[]>([]);

    const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
    const [inputFilteredOptions, setInputFilteredOptions] = useState<SearchOption[]>([]);

    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = useState("");

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

    const handleSetPokemon = (pokemon: SpeciesName) => {
        setPokemon(pokemon);
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
                            newAllSpecies.set(specie as SpeciesName, data as PokemonData);
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
        setInputFilteredOptions(newInputFilteredOptions);
    }, [inputValue, filteredOptions, translationKey]);

    return (
        <div>
            <Button onClick={handleOpen} variant="outlined" endIcon={<SearchIcon/>}>{getTranslation("Search", translationKey)}</Button>
            <Modal
                open={open}
                onClose={handleClose}
            >
                <Box sx={modalStyle}>
                    <Stack>
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
                        <SearchResultsTable inputFilteredOptions={inputFilteredOptions} handleSetPokemon={handleSetPokemon} handleAddFilter={handleAddFilter} allSpecies={allSpecies} allMoves={allMoves} translationKey={translationKey}/>
                    </Stack>
                </Box>
            </Modal>
        </div>
    )

//     return (
//         <Autocomplete
//             multiple
//             freeSolo
//             disableClearable
//             disableCloseOnSelect
//             clearOnBlur={false}
//             autoHighlight   
//             noOptionsText={(filteredOptions.length === 0 && ((typeFilters.length + abilityFilters.length + moveFilters.length) === 0))? "Loading..." : "No Options"}
//             size="small"
//             open={open}
//             value={val}
//             inputValue={inputValue}
//             options={filteredOptions}
//             getOptionLabel={(option: SearchOption | string) => (
//                 option.hasOwnProperty("name") ? (option as SearchOption).name : (option as string)
//             )}
//             filterOptions={(options, params) => {
//                 const filtered = createFilterOptions<SearchOption>({stringify: (option: SearchOption) => {
//                     switch (option.type) {
//                         case "Pokémon":
//                             return getTranslation(option.name, translationKey, "pokemon");
//                         case "Type":
//                             return getTranslation(option.name, translationKey, "types");
//                         case "Ability":
//                             return getTranslation(option.name, translationKey, "abilities");
//                         case "Moves":
//                             return getTranslation(option.name, translationKey, "moves");
//                         case "Custom":
//                             return (option.name)
//                     }
//                     return (option.name)
//                 }})(options, params);
//                 const isExisting = options.some((option) => inputValue === option.name);
//                 if (inputValue !== '' && !isExisting) {
//                     filtered.push({
//                         name: inputValue,
//                         type: "Custom",
//                     });
//                 }
//                 return filtered;
//             }}
//             renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   variant="standard"
//                   placeholder={(typeFilters.length + abilityFilters.length + moveFilters.length + customFilters.length) === 0 ? getTranslation(pokemon, translationKey, "pokemon") : ""}
//                 />
//             )}
//             renderOption={(props, option, state) => {
//                 const optiontype = option.type;
//                 switch (optiontype) {
//                     case "Type":
//                         if (state.inputValue.length === 0) {
//                             return null;
//                         }
//                         return (
//                             <li {...props}><GenericWithIcon name={findOptionFromTeraTypeName(option.name, translationKey)} engName={findOptionFromTeraTypeName(option.name, null)} spriteFetcher={getTypeIconURL} prettyMode={false} ModalComponent={null} modalProps={{}} /></li>
//                         )
//                     case "Ability":
//                         if (state.inputValue.length === 0) {
//                             return null;
//                         }
//                         const ability = option.name as AbilityName;
//                         const translatedAbility = getTranslation(ability, translationKey, "abilities");
//                         return (
//                             <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{translatedAbility}</Typography></li>
//                         )
//                     case "Moves":
//                         if (state.inputValue.length === 0) {
//                             return null;
//                         }
//                         const move = option.name as MoveName;
//                         const translatedMove = getTranslation(move, translationKey, "moves");
//                         const movesetopt: MoveSetItem = {
//                             name: translatedMove,
//                             engName: move,
//                             type: allMoves ? allMoves.get(move)?.type || "Normal" : (new Move(gen, move).type || "Normal"),
//                         }
//                         return (
//                             <li {...props}><MoveWithIcon move={movesetopt} allMoves={allMoves} prettyMode={false} translationKey={translationKey} /></li>
//                         )
//                     case "Pokémon":
//                         return (
//                             <li {...props}><GenericWithIcon name={findOptionFromPokemonName(option.name, translationKey)} engName={findOptionFromPokemonName(option.name, null)} spriteFetcher={getPokemonSpriteURL} prettyMode={false} ModalComponent={PokemonPopper} modalProps={{name: option.name, allSpecies: allSpecies, translationKey: translationKey}} /></li>
//                         )
//                     case "Custom":
//                         return (
//                             <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{getTranslation("Add", translationKey) + " \"" + option.name + "\""}</Typography></li>
//                         )
//                 }
//             }}
//             groupBy={(option: SearchOption) => inputValue.length === 0 ? "" : getTranslation(option.type, translationKey)}
//             renderGroup={(params) => {
//                 return  (
//                     inputValue.length > 0 ? 
//                     <li>
//                         <GroupHeader>
//                             <Typography variant={"body1"} sx={{ fontWeight: "Bold", paddingLeft: 0.5, paddingRight: 0.5 }}>
//                                 {params.group}
//                             </Typography>
//                         </GroupHeader>
//                         {params.children}
//                     </li> :
//                     <li>
//                         {params.children}
//                     </li>
//                 );
//             }}
//             onChange={(event: any, newValues) => {
//                 for (let val of newValues) {
//                     if (val.hasOwnProperty("type") && (val as SearchOption).type === "Pokémon") {
//                         setPokemon((val as SearchOption).name);
//                         setAbilityFilters([]);
//                         setMoveFilters([]);
//                         setTypeFilters([]);
//                         setCustomFilters([]);
//                         setOpen(false);
//                         return;
//                     }
//                 }
//                 const newMoveFilters: MoveName[] = [];
//                 const newAbilityFilters: AbilityName[] = [];
//                 const newTypeFilters: TypeName[] = [];
//                 const newCustomFilters: string[] = [];
//                 for (let val of newValues) {
//                     if (!val.hasOwnProperty("type")) {
//                         //@ts-ignore
//                         newCustomFilters.push(val as string)
//                     } else {
//                         val = val as SearchOption;
//                         switch (val.type) {
//                             case "Type":
//                                 newTypeFilters.push(val.name as TypeName);
//                                 break;
//                             case "Ability":
//                                 newAbilityFilters.push(val.name as AbilityName);
//                                 break;
//                             case "Moves":
//                                 newMoveFilters.push(val.name as MoveName);
//                                 break;
//                             case "Custom": 
//                                 newCustomFilters.push(val.name as string);
//                                 break;
//                         }
//                     }

//                 }
//                 setMoveFilters(newMoveFilters);
//                 setAbilityFilters(newAbilityFilters);
//                 setTypeFilters(newTypeFilters);
//                 setCustomFilters(newCustomFilters);
//                 setOpen(true);
//             }}
//             onInputChange={
//                 (event, newInputValue) => {
//                     setInputValue(newInputValue);
//                     if (newInputValue.length > 0) {
//                       setOpen(true);
//                     }
//                 }
//             }
//             onFocus={() => {
//                 setOpen(true);
//                 getOptionsData().catch((e) => console.log(e));
//             }}
//             onBlur={() => {
//                 setOpen(false);
//             }}
//             componentsProps={{ popper: { style: { minWidth: "200px", width: 'fit-content' } } }}
//             sx = {{width: '85%'}}
//         />
//     )

}

export default React.memo(PokemonLookup);