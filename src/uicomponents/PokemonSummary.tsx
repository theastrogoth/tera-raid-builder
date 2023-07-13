import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';

import { Pokemon } from '../calc';
import { Generation } from "../calc/data/interface";
import { toID } from '../calc/util';

import StatRadarPlot from "./StatRadarPlot";
import BuildControls from "./BuildControls";

import PokedexService, { PokemonData } from '../services/getdata';
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";

function RoleField({role, setRole}: {role: string, setRole: React.Dispatch<React.SetStateAction<string>>}) {
    const [str, setStr] = useState(role);
    return (
        <TextField 
            variant="standard"
            fullWidth
            inputProps={{style: {fontWeight: "bold",fontSize: 25, textAlign: "center"}}}
            margin="dense"
            value={str}
            onChange={(e) => setStr(e.target.value)}
            onBlur={() => setRole(str)}
        />
    )
}

function PokemonSummary({gen, role, setRole, pokemon, setPokemon}: {gen: Generation, role: string, setRole: React.Dispatch<React.SetStateAction<string>>, pokemon: Pokemon, setPokemon: React.Dispatch<React.SetStateAction<Pokemon>>}) {
    const [moveSet, setMoveSet] = useState<(string)[]>([])
    const [moveLearnTypes, setMoveLearnTypes] = useState<string[]>([])
    const [abilities, setAbilities] = useState<string[]>([])
  
    useEffect(() => {
      async function fetchData() {
        let pokemonData = await PokedexService.getPokemonByName(pokemon.name) as PokemonData;     
        setAbilities(pokemonData.abilities);

        const moves = pokemonData.moves;
        setMoveSet(moves.map(md => md.name));
        setMoveLearnTypes(moves.map(md => md.learnMethod));
      }
      fetchData().catch((e) => console.log(e));
    }, [pokemon.name])

    // const spriteURL = imgProlog + pokemon.name.toLocaleLowerCase() + imgExt;
    const nature = gen.natures.get(toID(pokemon.nature));

    return (
        <Box>
            <Paper elevation={3} sx={{ mx: 1, my: 1, width: 280, display: "flex", flexDirection: "column", padding: "0px"}}>                
                <Stack direction="column" spacing={0} alignItems="center" justifyContent="top" height= "800px" sx={{ marginTop: 1 }} >
                    <Box paddingBottom={0} width="90%">
                        <RoleField role={role} setRole={setRole} />
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
                                        pokemon.item === "(No Item)" ? undefined :
                                        getItemSpriteURL(pokemon.item)
                                    ) : undefined }
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
                                />
                            </Box>
                        }
                    </Box>
                    <BuildControls gen={gen} pokemon={pokemon} abilities={abilities} moveSet={moveSet} moveLearnTypes={moveLearnTypes} setPokemon={setPokemon}/>
                    <Box flexGrow={1} />
                    <StatRadarPlot nature={nature} evs={pokemon.evs} stats={pokemon.stats} />
                    {/* <Box flexGrow={1} /> */}
                </Stack>
            </Paper>
        </Box>
    );
}

export default PokemonSummary;