import React, { useState, useEffect, useRef } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';

import { Generations } from '../calc';
import { toID } from '../calc/util';

import StatRadarPlot from "./StatRadarPlot";
import BuildControls from "./BuildControls";

import PokedexService, { PokemonData } from '../services/getdata';
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";
import { MoveSetItem } from "../raidcalc/interface";
import { Raider } from "../raidcalc/Raider";
import { AbilityName } from "../calc/data/interface";

const gen = Generations.get(9); // we will only use gen 9

export function RoleField({pokemon, setPokemon}: {pokemon: Raider, setPokemon: (r: Raider) => void}) {
    const [str, setStr] = useState(pokemon.role);
    const roleRef = useRef(pokemon.role);
    const nameRef = useRef(pokemon.name);

    useEffect(() => {
        if (roleRef.current !== pokemon.role) {
            roleRef.current = pokemon.role;
            if (pokemon.role !== str) {
                setStr(pokemon.role);
            }
        } else if (nameRef.current !== pokemon.name) {
            nameRef.current = pokemon.name;
            const name = pokemon.name.split("-")[0]; // some regional forms have long names
            setRole(name);
            setStr(name);
        }
    }, [pokemon.role, pokemon.name])

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

function PokemonSummary({pokemon, setPokemon, prettyMode}: {pokemon: Raider, setPokemon: (r: Raider) => void, prettyMode: boolean}) {
    const [moveSet, setMoveSet] = useState<(MoveSetItem)[]>([])
    const [abilities, setAbilities] = useState<{name: AbilityName, hidden: boolean}[]>([])
  
    useEffect(() => {
      async function fetchData() {
        let pokemonData = await PokedexService.getPokemonByName(pokemon.name) as PokemonData;     
        setAbilities(pokemonData.abilities);

        const moves = pokemonData.moves;
        const set = moves.map(md => {
            const move = gen.moves.get(toID(md.name));
            return {
                name: md.name,
                method: md.learnMethod,
                type: move ? (move.type || "Normal") : "Normal",
            }
        })
        setMoveSet(set);
      }
      fetchData().catch((e) => console.log(e));
    }, [pokemon.name])

    const nature = gen.natures.get(toID(pokemon.nature));

    return (
        <Box>
            <Paper elevation={3} sx={{ mx: 1, my: 1, width: 280, display: "flex", flexDirection: "column", padding: "0px"}}>                
                <Stack direction="column" spacing={0} alignItems="center" justifyContent="top" minHeight= {prettyMode ? "640px" : "800px"} sx={{ marginTop: 1 }} >
                    <Box paddingBottom={0} width="90%">
                        <RoleField pokemon={pokemon} setPokemon={setPokemon} />
                    </Box>
                    <Box width="100%" marginTop="10px" display="flex" justifyContent="center">
                        <Box position="relative" display="flex" flexDirection="column" alignItems="center" marginRight="5px">
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
                    <BuildControls pokemon={pokemon} abilities={abilities} moveSet={moveSet} setPokemon={setPokemon} prettyMode={prettyMode}/>
                    <Box flexGrow={1} />
                    <StatRadarPlot nature={nature} evs={pokemon.evs} stats={pokemon.stats} />
                    {/* <Box flexGrow={1} /> */}
                </Stack>
            </Paper>
        </Box>
    );
}

export default React.memo(PokemonSummary, 
    (prevProps, nextProps) => (
        JSON.stringify(prevProps.pokemon) === JSON.stringify(nextProps.pokemon) && 
        prevProps.prettyMode === nextProps.prettyMode)
    );