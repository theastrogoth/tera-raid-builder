import React, { useState, useEffect, useRef } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

import { ABILITIES, Generations, Pokemon } from '../calc';
import { toID } from '../calc/util';

import StatRadarPlot from "./StatRadarPlot";
import BuildControls from "./BuildControls";

import PokedexService, { PokemonData } from '../services/getdata';
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, getTranslation } from "../utils";
import { MoveData, MoveSetItem, SubstituteBuildInfo, TurnGroupInfo } from "../raidcalc/interface";
import { MOVES } from "../calc/data/moves";
import { Raider } from "../raidcalc/Raider";
import { AbilityName, MoveName, SpeciesName } from "../calc/data/interface";
import unsketchable from "../data/unsketchable.json";

const gen = Generations.get(9); // we will only use gen 9
const allMoveNames = Object.keys(MOVES[9]).slice(1).sort().slice(1).filter(m => m.substring(0,3) !== "Max" && m.substring(0,5) !== "G-Max" && m !== "Dynamax Cannon") as MoveName[];
const allAbilities = ABILITIES[9].map(a => {return {name: a as AbilityName, hidden: false}});

export function RoleField({pokemon, setPokemon, translationKey}: {pokemon: Raider, setPokemon: (r: Raider) => void, translationKey: any}) {
    const [str, setStr] = useState(pokemon.role);
    const roleRef = useRef(pokemon.role);
    const nameRef = useRef(pokemon.species.name.includes("Meowstic") ? "Meowstic" : pokemon.species.baseSpecies || pokemon.name); // some regional forms have long names
    const [nameIsRaidBoss, setNameIsRaidBoss] = useState(pokemon.role === "Raid Boss");
    
    const speciesName = pokemon.species.name.includes("Meowstic") ? "Meowstic" : pokemon.species.baseSpecies || pokemon.name;
    const translatedName = getTranslation(speciesName, translationKey, "pokemon");

    useEffect(() => {
        if (roleRef.current !== pokemon.role) {
            roleRef.current = pokemon.role;
            setNameIsRaidBoss(false);
            if (pokemon.role !== str) {
                setStr(pokemon.role);
            }
            nameRef.current = translatedName;
        } else if (nameIsRaidBoss) {
            const rbTranslated = getTranslation("Raid Boss", translationKey);
            setRole(rbTranslated);
            setStr(rbTranslated);
        } else if ((nameRef.current !== translatedName) && ((str === "") || (str === nameRef.current as string))) {
            nameRef.current = translatedName;
            roleRef.current = translatedName;
            setRole(translatedName);
            setStr(translatedName);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pokemon.role, pokemon.name, translationKey])

    const setRole = (r: string) => {
        const newPoke = pokemon.clone();
        newPoke.role = r;
        setPokemon(newPoke);
    }

    return (
        <TextField 
            variant="standard"
            fullWidth
            inputProps={{ maxLength: 12, style: {fontWeight: "bold",fontSize: 25, textAlign: "center"}}}
            margin="dense"
            value={str}
            onChange={(e) => setStr(e.target.value)}
            onBlur={() => setRole(str)}
        />
    )
}

function PokemonSummary({pokemon, setPokemon, groups, setGroups, groupsCounter, substitutes, setSubstitutes, swapIDs, setSwapIDs, allSpecies, allMoves, setAllSpecies, setAllMoves, prettyMode, translationKey}: 
    {pokemon: Raider, setPokemon: (r: Raider) => void, groups: TurnGroupInfo[], setGroups: (g: TurnGroupInfo[]) => void, groupsCounter: number,
     substitutes: SubstituteBuildInfo[], setSubstitutes: (s: SubstituteBuildInfo[]) => void,  swapIDs: [number, number] | undefined, setSwapIDs: (i: [number, number] | undefined) => void,
     allSpecies: Map<SpeciesName,PokemonData> | null, allMoves: Map<MoveName,MoveData> | null, setAllSpecies: (m: Map<SpeciesName,PokemonData> | null) => void, setAllMoves: (m: Map<MoveName,MoveData> | null) => void, prettyMode: boolean, translationKey: any}
) {
    const [moveSet, setMoveSet] = useState<(MoveSetItem)[]>([])
    const [abilities, setAbilities] = useState<{name: AbilityName, hidden: boolean}[]>([])

    const handleDelete = () => {
        setPokemon(new Raider(
            pokemon.id, 
            getTranslation("NPC", translationKey, "pokemon"),
            false, 
            true,
            pokemon.field, 
            new Pokemon(gen, "NPC", {
                nature: "Hardy", 
                level: 1,
                // ability: "(No Ability)",
                ivs: {
                    hp: 0,
                    atk: 0,
                    def: 0,
                    spa: 0,
                    spd: 0,
                    spe: 0
                }
            }), 
            [],
        ));
    }
  
    useEffect(() => {
        if (!allSpecies) {
            async function fetchData() {
                let pokemonData = await PokedexService.getPokemonByName(pokemon.name) as PokemonData;     
                if (pokemonData.abilities[0].name === "(No Ability)") {
                    pokemonData.abilities = allAbilities;
                }
                setAbilities(pokemonData.abilities);

                let moves = pokemonData.moves;
                if (moves.length < 1) {
                    moves = allMoveNames.filter(m => !unsketchable.includes(m)).map(m => ({name: m, learnMethod: "level-up"})); // Smeargle and Carry Slot
                }
                const set = moves.map(md => {
                    const move = gen.moves.get(toID(md.name));
                    return {
                        name: getTranslation(md.name, translationKey, "moves"),
                        engName: md.name,
                        method: md.learnMethod,
                        type: move ? (move.type || "Normal") : "Normal",
                    }
                })
                setMoveSet(set);
            }
            fetchData().catch((e) => console.log(e));
        } else {
            const pokemonData = allSpecies.get(pokemon.name);
            if (pokemonData) {
                setAbilities(pokemonData.abilities);

                let moves = pokemonData.moves;
                if (moves.length < 1) {
                    moves = allMoveNames.filter(m => !unsketchable.includes(m)).map(m => ({name: m, learnMethod: "level-up"}))
                }
                const set = moves.map(md => {
                    const move = gen.moves.get(toID(md.name));
                    return {
                        name: getTranslation(md.name, translationKey, "moves"),
                        engName: md.name,
                        method: md.learnMethod,
                        type: move ? (move.type || "Normal") : "Normal",
                    }
                })
                setMoveSet(set);
            } else {
                console.log("No pokemon data for " + pokemon.name);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pokemon.name])

    const nature = gen.natures.get(toID(pokemon.nature));

    return (
        <Box>
            <Paper elevation={3} sx={{ mx: 1, my: 1, width: 280, display: "flex", flexDirection: "column", padding: "0px"}}>     
                {!prettyMode &&   
                    <Box sx={{position: "absolute", transform: "translate(248px, 2px)"}} >
                        <Paper elevation={3} sx={{borderRadius: 100, justifyContent: "center", alignItems: "center", boxShadow: "none"}}>
                            <IconButton size="small" onClick={handleDelete}>
                                <CloseIcon />
                            </IconButton>
                        </Paper>
                    </Box>         
                }
                {!prettyMode && 
                    <Box sx={{position: "absolute", transform: "translate(0px, 132px)"}} >
                        <Paper elevation={3} sx={{borderRadius: 100, justifyContent: "center", alignItems: "center", boxShadow: "none"}}>
                            <IconButton size="small" disabled={pokemon.id < 2} onClick={() => setSwapIDs([pokemon.id-1, pokemon.id])}>
                                <ChevronLeft fontSize="large"/>
                            </IconButton>
                        </Paper>
                    </Box>
                }
                {!prettyMode && 
                    <Box sx={{position: "absolute", transform: "translate(242px, 132px)"}} >
                        <Paper elevation={3} sx={{borderRadius: 100, justifyContent: "center", alignItems: "center", boxShadow: "none"}}>
                            <IconButton size="small" disabled={pokemon.id > 3} onClick={() => setSwapIDs([pokemon.id, pokemon.id+1])}>
                                <ChevronRight fontSize="large"/>
                            </IconButton>
                        </Paper>
                    </Box>
                }
                <Stack direction="column" spacing={0} alignItems="center" justifyContent="top" minHeight= {prettyMode ? "666px" : "800px"} sx={{ marginTop: 1 }} >
                    <Box paddingBottom={0} paddingLeft={1.5} width="88%" alignSelf="start">
                        <RoleField pokemon={pokemon} setPokemon={setPokemon} translationKey={translationKey} />
                    </Box>
                    <Box width="100%" marginTop="10px" display="flex" justifyContent="center">
                        <Box width="50px" position="relative" display="flex" flexDirection="column" alignItems="center" marginRight="5px">
                            <Box position="relative" display="flex">
                                <img
                                    // width="95%"
                                    height="45px"
                                    src={pokemon.types.length > 0 ? (
                                            pokemon.types[0] === "???" ? undefined :
                                            getTypeIconURL(pokemon.types[0])
                                        ) : undefined }
                                    alt=""
                                    hidden={pokemon.types[0] === "???" || pokemon.types[0] === undefined}
                                />
                            </Box>
                            { pokemon.types.length > 1 && 
                                <Box position="relative" display="flex">
                                    <img
                                        // width="95%"
                                        height="45px"
                                        src={pokemon.types.length > 1 ? (
                                            pokemon.types[0] === "???" ? undefined :
                                            getTypeIconURL(pokemon.types[1] as string)
                                        ) : undefined }
                                        alt=""
                                        hidden={pokemon.types[1] === "???" || pokemon.types[1] === undefined}
                                    />
                                </Box>
                            }
                            { pokemon.teraType !== "???" && 
                                <Box position="relative" display="flex" marginTop="5px">
                                    <img
                                        // width="95%"
                                        height="50px"
                                        src={(pokemon.teraType === undefined) ? undefined :
                                            getTeraTypeIconURL(pokemon.teraType as string)
                                        }
                                        alt=""
                                        hidden={pokemon.teraType === undefined}
                                    />
                                </Box>
                            }
                        </Box>
                        <Box position="relative">
                            <Box position="relative" sx={{filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, .5))"}}>
                                <img
                                    height="150px"
                                    src={getPokemonArtURL(pokemon.name, pokemon.shiny)}
                                    onError={({ currentTarget }) => {
                                        currentTarget.onerror = null; // prevents looping
                                        currentTarget.src=getPokemonArtURL("placeholder");
                                    }}
                                    alt=""
                                />
                            </Box>
                            <Box position="absolute" sx={{bottom: "0px", right: "0px", filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, .5))"}}>
                                <img
                                    // width="95%"
                                    height="65px"
                                    src={pokemon.item ? (
                                            pokemon.item === "(No Item)" ? getItemSpriteURL("any") :
                                            getItemSpriteURL(pokemon.item)
                                        ) : undefined }
                                    onError={({ currentTarget }) => {
                                        currentTarget.onerror = null; // prevents looping
                                        currentTarget.src=getItemSpriteURL("pokeball");
                                    }}
                                    hidden={pokemon.item === undefined}
                                    alt=""
                                />
                            </Box>
                        </Box>
                    </Box>
                    <BuildControls 
                        pokemon={pokemon} 
                        abilities={abilities} 
                        moveSet={moveSet} 
                        setPokemon={setPokemon} 
                        groups={groups} 
                        setGroups={setGroups} 
                        groupsCounter={groupsCounter}
                        substitutes={substitutes} 
                        setSubstitutes={setSubstitutes} 
                        allSpecies={allSpecies}
                        allMoves={allMoves}
                        setAllSpecies={setAllSpecies}
                        setAllMoves={setAllMoves}
                        prettyMode={prettyMode}
                        translationKey={translationKey}
                    />
                    <Box flexGrow={1} />
                    <StatRadarPlot nature={nature} evs={pokemon.evs} stats={pokemon.stats} translationKey={translationKey} />
                    {/* <Box flexGrow={1} /> */}
                </Stack>
            </Paper>
        </Box>
    );
}

export default React.memo(PokemonSummary, 
    (prevProps, nextProps) => (
        JSON.stringify(prevProps.pokemon) === JSON.stringify(nextProps.pokemon) && 
        JSON.stringify(prevProps.substitutes) === JSON.stringify(nextProps.substitutes) &&
        (!!prevProps.allMoves === !!nextProps.allMoves) &&
        (!!prevProps.allSpecies === !!nextProps.allSpecies) &&
        prevProps.groupsCounter === nextProps.groupsCounter &&
        (
            prevProps.swapIDs === nextProps.swapIDs || (
                prevProps.swapIDs !== undefined && nextProps.swapIDs !== undefined &&
                prevProps.swapIDs[0] === nextProps.swapIDs[0] &&
                prevProps.swapIDs[1] === nextProps.swapIDs[1]
            ) 
        ) &&
        prevProps.prettyMode === nextProps.prettyMode &&
        prevProps.translationKey === nextProps.translationKey
    )
    );