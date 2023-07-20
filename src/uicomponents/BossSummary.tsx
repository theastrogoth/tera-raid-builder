import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

import { Generations, Pokemon } from '../calc';
import { AbilityName, Generation } from "../calc/data/interface";
import { toID } from '../calc/util';

import BuildControls, { BossBuildControls } from "./BuildControls";
import { RoleField } from "./PokemonSummary";

import PokedexService, { PokemonData } from '../services/getdata';
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";
import StatRadarPlot from "./StatRadarPlot";
import { MoveSetItem, Raider } from "../raidcalc/interface";

const gen = Generations.get(9); // we only use gen 9

function BossSummary({pokemon, setPokemon, prettyMode}: {pokemon: Raider, setPokemon: (r: Raider) => void, prettyMode: boolean}) {
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

    // const spriteURL = imgProlog + pokemon.name.toLocaleLowerCase() + imgExt;
    const nature = gen.natures.get(toID(pokemon.nature));

    return (
        <Box>
            <Paper elevation={3} sx={{ mx: 1, my: 1, width: 575, display: "flex", flexDirection: "column", padding: "0px"}}>                
                <Stack direction="column" spacing={0} alignItems="center" justifyContent="top" minHeight={prettyMode ? undefined : "600px"} sx={{ marginTop: 1 }} >
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
                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null; // prevents looping
                                    currentTarget.src=getItemSpriteURL("pokeball");
                                }}
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
                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null; // prevents looping
                                    currentTarget.src=getItemSpriteURL("pokeball");
                                }}
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
                    <Stack direction="row" spacing={-1} >
                        <BuildControls pokemon={pokemon} abilities={abilities} moveSet={moveSet} setPokemon={setPokemon} prettyMode={prettyMode} />
                        <Stack direction="column" spacing={0} justifyContent="center" alignItems="center" sx={{ width: "300px", minHeight:( prettyMode ? undefined : "375px") }}>
                            <BossBuildControls moveSet={moveSet} pokemon={pokemon} setPokemon={setPokemon} prettyMode={prettyMode} />
                            <Box flexGrow={1} />
                            <StatRadarPlot nature={nature} evs={pokemon.evs} stats={pokemon.stats} bossMultiplier={pokemon.bossMultiplier}/>
                        </Stack>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}

export default React.memo(BossSummary);