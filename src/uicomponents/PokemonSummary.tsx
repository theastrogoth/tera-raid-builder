import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';

import { Generations, Pokemon } from '../calc';
import { toID } from '../calc/util';

import StatRadarPlot from "./StatRadarPlot";
import BuildControls from "./BuildControls";

import PokedexService, { PokemonData } from '../services/getdata';
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";
import { MoveSetItem, Raider } from "../raidcalc/interface";

const gen = Generations.get(9); // we will only use gen 9

export function RoleField({pokemon, setPokemon}: {pokemon: Raider, setPokemon: (r: Raider) => void}) {
    const [str, setStr] = useState(pokemon.role);

    useEffect(() => {
        if (pokemon.role !== str) {
            setStr(pokemon.role);
        }
    }, [pokemon.role])

    const setRole = (r: string) => {
        const newPoke = pokemon.clone();
        newPoke.role = r;
        setPokemon(newPoke);
    }

    return (
        <TextField 
            variant="standard"
            fullWidth
            inputProps={{ maxLength: 20, style: {fontWeight: "bold",fontSize: 25, textAlign: "center"}}}
            margin="dense"
            value={str}
            onChange={(e) => setStr(e.target.value)}
            onBlur={() => setRole(str)}
        />
    )
}

function PokemonSummary({pokemon, setPokemon, prettyMode}: {pokemon: Raider, setPokemon: (r: Raider) => void, prettyMode: boolean}) {
    const [moveSet, setMoveSet] = useState<(MoveSetItem)[]>([])
    const [abilities, setAbilities] = useState<string[]>([])
  
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
                <Stack direction="column" spacing={0} alignItems="center" justifyContent="top" minHeight= {prettyMode ? "625px" : "800px"} sx={{ marginTop: 1 }} >
                    <Box paddingBottom={0} width="90%">
                        <RoleField pokemon={pokemon} setPokemon={setPokemon} />
                    </Box>
                    <Box>
                        <Box
                            position="relative"
                            sx={{
                                transform: "translate(15px, 0px)"
                            }}
                        >
                            <img
                                height="150px"
                                src={getPokemonArtURL(pokemon.name)}
                                alt=""
                            />
                        </Box>
                        <Box 
                            position="absolute"
                            sx={{
                                transform: "translate(105px, -70px)"
                            }}
                        >
                            <img
                                // width="95%"
                                height="70px"
                                src={pokemon.item ? (
                                        pokemon.item === "(No Item)" ? getItemSpriteURL("any") :
                                        getItemSpriteURL(pokemon.item)
                                    ) : undefined }
                                hidden={pokemon.item === undefined}
                                alt=""
                            />
                        </Box>
                        <Box 
                            position="absolute"
                            sx={{
                                transform: "translate(-30px, -150px)"
                            }}
                        >
                            <img
                                // width="95%"
                                height="50px"
                                src={pokemon.types.length > 0 ? (
                                        pokemon.types[0] === "???" ? undefined :
                                        getTypeIconURL(pokemon.types[0])
                                    ) : undefined }
                                alt=""
                                hidden={pokemon.types[0] === "???" || pokemon.types[0] === undefined}
                            />
                        </Box>
                        { pokemon.types.length > 1 && 
                            <Box 
                                position="absolute"
                                sx={{
                                    transform: "translate(-30px, -110px)"
                                }}
                            >
                                <img
                                    // width="95%"
                                    height="50px"
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
                            <Box 
                                position="absolute"
                                sx={{
                                    transform: "translate(-30px, -60px)"
                                }}
                            >
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
                    <BuildControls pokemon={pokemon} abilities={abilities} moveSet={moveSet} setPokemon={setPokemon} prettyMode={prettyMode}/>
                    <Box flexGrow={1} />
                    <StatRadarPlot nature={nature} evs={pokemon.evs} stats={pokemon.stats} />
                    {/* <Box flexGrow={1} /> */}
                </Stack>
            </Paper>
        </Box>
    );
}

export default React.memo(PokemonSummary);