import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

import { Generations } from '../calc';
import { AbilityName } from "../calc/data/interface";
import { toID } from '../calc/util';

import BuildControls, { BossBuildControlsMemo } from "./BuildControls";
import { RoleField } from "./PokemonSummary";

import PokedexService, { PokemonData } from '../services/getdata';
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, arraysEqual } from "../utils";
import StatRadarPlot from "./StatRadarPlot";
import { MoveSetItem } from "../raidcalc/interface";
import { Raider } from "../raidcalc/Raider";

const gen = Generations.get(9); // we only use gen 9

function BossSummary({pokemon, setPokemon, prettyMode, translationKey}: {pokemon: Raider, setPokemon: (r: Raider) => void, prettyMode: boolean, translationKey: any}) {
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
                name: translationKey ? translationKey["moves"][md.name] || md.name : md.name,
                engName: md.name,
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
            <Paper elevation={3} sx={{ mx: 1, my: 1, width: 530, display: "flex", flexDirection: "column", padding: "0px"}}>                
                <Stack direction="column" spacing={0} alignItems="center" justifyContent="top" minHeight={prettyMode ? undefined : "600px"} sx={{ marginTop: 1 }} >
                    <Box paddingBottom={0} width="90%">
                        <RoleField pokemon={pokemon} setPokemon={setPokemon} />
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
                    <Stack direction="row" spacing={-5} >
                        <BuildControls pokemon={pokemon} abilities={abilities} moveSet={moveSet} setPokemon={setPokemon} prettyMode={prettyMode} isBoss translationKey={translationKey} />
                        <Stack direction="column" spacing={0} justifyContent="center" alignItems="center" sx={{ width: "300px", minHeight:( prettyMode ? undefined : "375px") }}>
                            <BossBuildControlsMemo moveSet={moveSet} pokemon={pokemon} setPokemon={setPokemon} prettyMode={prettyMode} translationKey={translationKey}/>
                            <Box flexGrow={1} />
                            <StatRadarPlot nature={nature} evs={pokemon.evs} stats={pokemon.stats} bossMultiplier={pokemon.bossMultiplier}/>
                        </Stack>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}

export default React.memo(BossSummary,
    (prevProps, nextProps) => (
        JSON.stringify(prevProps.pokemon) === JSON.stringify(nextProps.pokemon) && 
        arraysEqual(prevProps.pokemon.extraMoves || [], nextProps.pokemon.extraMoves || []) &&
        prevProps.prettyMode === nextProps.prettyMode &&
        prevProps.translationKey === nextProps.translationKey)
    );