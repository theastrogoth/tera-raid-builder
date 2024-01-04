import React, { useEffect, useState } from "react";
import TextField from '@mui/material/TextField';
import Typography from "@mui/material/Typography";
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import { AbilityName, MoveName, SpeciesName, TypeName } from "../calc/data/interface";
import PokedexService, { PokemonData } from "../services/getdata";
import { MoveData, MoveSetItem } from "../raidcalc/interface";
import { ABILITIES, Generations, Move } from "../calc";
import { GenericWithIcon, GroupHeader, MoveWithIcon, PokemonPopper, findOptionFromPokemonName, findOptionFromTeraTypeName } from "./BuildControls";
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

function checkSpeciesForFilters(species: PokemonData, moveFilters: MoveName[], abilityFilters: AbilityName[], typeFilters: TypeName[], customFilters: string[], translationKey: any) {
    for (let moveFilter of moveFilters) {
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
    }
    for (let abilityFilter of abilityFilters) {
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
    }
    for (let typeFilter of typeFilters) {
        let typeFilterResult = false;
        for (let type of species.types) {
            const uppercaseType = type[0].toUpperCase() + type.slice(1) as TypeName;
            if (typeFilter === uppercaseType) {
                typeFilterResult = true;
                break;
            }
        }
        if (!typeFilterResult) {
            return false;
        }
    }
    for (let customFilter of customFilters) {
        const filterComponents = customFilter.toLowerCase().split(/(?<=\sand\s|\sor\s|&&|\|\||&|\||,)|(?=\sand\s|\sor\s|&&|\|\||&|\||,)/i).map((s) => s.trim());
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
    }
    return true;
}

function PokemonLookup({pokemon, setPokemon, allSpecies, allMoves, setAllSpecies, setAllMoves, translationKey}: 
    {pokemon: string, setPokemon: (n: string) => void, allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, setAllSpecies: (s: Map<SpeciesName,PokemonData> | null) => void, setAllMoves: (m: Map<MoveName,MoveData> | null) => void, translationKey: any}) {
    
    // ABANDONED IDEA FOR FILTERS
    // // For each nested array of filters,
    // // Higher-level arrays represent AND conditions, and lower-level arrays represent OR conditions.
    // // Example: [["Acid Spray", "Fake Tears"], ["Helping Hand"]] represents (Acid Spray OR Fake Tears) AND (Helping Hand)
    // const [moveFilters, setMoveFilters] = useState<MoveName[][]>([])
    // const [abilityFilters, setAbilityFilters] = useState<AbilityName[][]>([])
    // const [typeFilters, setTypeFilters] = useState<TypeName[][]>([])

    const [moveFilters, setMoveFilters] = useState<MoveName[]>([]);
    const [abilityFilters, setAbilityFilters] = useState<AbilityName[]>([]);
    const [typeFilters, setTypeFilters] = useState<TypeName[]>([]);
    const [customFilters, setCustomFilters] = useState<string[]>([]);

    const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

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
        const newFilteredOptions: SearchOption[] = [];
        for (let option of allOptions) {
            switch (option.type) {
                case("Pokémon"):
                    if (allSpecies) {
                        const pokemonData = allSpecies?.get(option.name as SpeciesName);
                        if (pokemonData) {
                            const matchesFilters = checkSpeciesForFilters(pokemonData, moveFilters, abilityFilters, typeFilters, customFilters, translationKey);
                            if (matchesFilters) {
                                newFilteredOptions.push(option);
                            }
                        }
                    } else {
                        newFilteredOptions.push(option);
                    }
                    break;
                case("Type"):
                    if (typeFilters.flat().includes(option.name as TypeName)) {
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
    }, [typeFilters, abilityFilters, moveFilters]);

    const val: SearchOption[] = [
        typeFilters.slice().map((t) => {return {name: getTranslation(t, translationKey, "types"), type: "Type"}}), 
        abilityFilters.slice().map((a) => {return {name: getTranslation(a, translationKey, "abilities"), type: "Ability"}}), 
        moveFilters.slice().map((m) => {return {name: getTranslation(m, translationKey, "moves"), type: "Moves"}}),
        customFilters.slice().map((c) => {return {name: c, type: "Custom"}}),
    ].flat() as SearchOption[];

    return (
        <Autocomplete
            multiple
            freeSolo
            disableClearable
            disableCloseOnSelect
            clearOnBlur={false}
            autoHighlight   
            noOptionsText={(filteredOptions.length === 0 && ((typeFilters.length + abilityFilters.length + moveFilters.length) === 0))? "Loading..." : "No Options"}
            size="small"
            open={open}
            value={val}
            inputValue={inputValue}
            options={filteredOptions}
            getOptionLabel={(option: SearchOption | string) => (
                option.hasOwnProperty("name") ? (option as SearchOption).name : (option as string)
            )}
            filterOptions={(options, params) => {
                const filtered = createFilterOptions<SearchOption>({stringify: (option: SearchOption) => {
                    switch (option.type) {
                        case "Pokémon":
                            return getTranslation(option.name, translationKey, "pokemon");
                        case "Type":
                            return getTranslation(option.name, translationKey, "types");
                        case "Ability":
                            return getTranslation(option.name, translationKey, "abilities");
                        case "Moves":
                            return getTranslation(option.name, translationKey, "moves");
                        case "Custom":
                            return (option.name)
                    }
                    return (option.name)
                }})(options, params);
                const isExisting = options.some((option) => inputValue === option.name);
                if (inputValue !== '' && !isExisting) {
                    filtered.push({
                        name: inputValue,
                        type: "Custom",
                    });
                }
                return filtered;
            }}
            renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder={(typeFilters.length + abilityFilters.length + moveFilters.length + customFilters.length) === 0 ? pokemon : ""}
                />
            )}
            renderOption={(props, option, state) => {
                const optiontype = option.type;
                switch (optiontype) {
                    case "Type":
                        if (state.inputValue.length === 0) {
                            return null;
                        }
                        return (
                            <li {...props}><GenericWithIcon name={findOptionFromTeraTypeName(option.name, translationKey)} engName={findOptionFromTeraTypeName(option.name, null)} spriteFetcher={getTypeIconURL} prettyMode={false} ModalComponent={null} modalProps={{}} /></li>
                        )
                    case "Ability":
                        if (state.inputValue.length === 0) {
                            return null;
                        }
                        const ability = option.name as AbilityName;
                        const translatedAbility = getTranslation(ability, translationKey, "abilities");
                        return (
                            <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{translatedAbility}</Typography></li>
                        )
                    case "Moves":
                        if (state.inputValue.length === 0) {
                            return null;
                        }
                        const move = option.name as MoveName;
                        const translatedMove = getTranslation(move, translationKey, "moves");
                        const movesetopt: MoveSetItem = {
                            name: translatedMove,
                            engName: move,
                            type: allMoves ? allMoves.get(move)?.type || "Normal" : (new Move(gen, move).type || "Normal"),
                        }
                        return (
                            <li {...props}><MoveWithIcon move={movesetopt} allMoves={allMoves} prettyMode={false} translationKey={translationKey} /></li>
                        )
                    case "Pokémon":
                        return (
                            <li {...props}><GenericWithIcon name={findOptionFromPokemonName(option.name, translationKey)} engName={findOptionFromPokemonName(option.name, null)} spriteFetcher={getPokemonSpriteURL} prettyMode={false} ModalComponent={PokemonPopper} modalProps={{name: option.name, allSpecies: allSpecies, translationKey: translationKey}} /></li>
                        )
                    case "Custom":
                        return (
                            <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{getTranslation("Add", translationKey) + " \"" + option.name + "\""}</Typography></li>
                        )
                }
            }}
            groupBy={(option: SearchOption) => inputValue.length === 0 ? "" : getTranslation(option.type, translationKey)}
            renderGroup={(params) => {
                return  (
                    inputValue.length > 0 ? 
                    <li>
                        <GroupHeader>
                            <Typography variant={"body1"} sx={{ fontWeight: "Bold", paddingLeft: 0.5, paddingRight: 0.5 }}>
                                {params.group}
                            </Typography>
                        </GroupHeader>
                        {params.children}
                    </li> :
                    <li>
                        {params.children}
                    </li>
                );
            }}
            onChange={(event: any, newValues) => {
                for (let val of newValues) {
                    if (val.hasOwnProperty("type") && (val as SearchOption).type === "Pokémon") {
                        setPokemon((val as SearchOption).name);
                        setAbilityFilters([]);
                        setMoveFilters([]);
                        setTypeFilters([]);
                        setCustomFilters([]);
                        setOpen(false);
                        return;
                    }
                }
                const newMoveFilters: MoveName[] = [];
                const newAbilityFilters: AbilityName[] = [];
                const newTypeFilters: TypeName[] = [];
                const newCustomFilters: string[] = [];
                for (let val of newValues) {
                    if (!val.hasOwnProperty("type")) {
                        //@ts-ignore
                        newCustomFilters.push(val as string)
                    } else {
                        val = val as SearchOption;
                        switch (val.type) {
                            case "Type":
                                newTypeFilters.push(val.name as TypeName);
                                break;
                            case "Ability":
                                newAbilityFilters.push(val.name as AbilityName);
                                break;
                            case "Moves":
                                newMoveFilters.push(val.name as MoveName);
                                break;
                            case "Custom": 
                                newCustomFilters.push(val.name as string);
                                break;
                        }
                    }

                }
                setMoveFilters(newMoveFilters);
                setAbilityFilters(newAbilityFilters);
                setTypeFilters(newTypeFilters);
                setCustomFilters(newCustomFilters);
                setOpen(true);
            }}
            onInputChange={
                (event, newInputValue) => {
                    setInputValue(newInputValue);
                    if (newInputValue.length > 0) {
                      setOpen(true);
                    }
                }
            }
            onFocus={() => {
                setOpen(true);
                getOptionsData().catch((e) => console.log(e));
            }}
            onBlur={() => {
                setOpen(false);
            }}
            componentsProps={{ popper: { style: { minWidth: "200px", width: 'fit-content' } } }}
            sx = {{width: '85%'}}
        />
    )
}

export default React.memo(PokemonLookup);