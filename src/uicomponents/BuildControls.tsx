import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import ConstructionIcon from '@mui/icons-material/Construction';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import TuneIcon from '@mui/icons-material/Tune';

import { styled } from '@mui/material/styles';

import { Pokemon, StatsTable } from '../calc';
import { Generation, Nature } from "../calc/data/interface";
import { toID } from '../calc/util';

import StatsControls from "./StatsControls";
import ImportExportArea from "./ImportExportArea";

// const patchEmoji = '\u{1FA79}';
const machineEmoji = '\u{1F4BF}';
const eggEmoji = '\u{1F95A}';

function moveToOption(move: string, learnType: string) {
    if (learnType == "egg") {
        return move + " " + eggEmoji;
    } else if (learnType == "machine") {
        return move + " " + machineEmoji;
    } else {
        return move;
    }
}

function optionToMove(option: string | undefined) {
    if (!option) { return "(No Move)"; }
    return [eggEmoji, machineEmoji].includes(option.slice(-2)) ? option.slice(0,-3) : option;
}

function findOptionFromMove(name: string, moves: string[], learnTypes: string[]) {
    const index = moves.indexOf(name);
    return moveToOption(name, learnTypes[index]);
}

function createMoveOptions(moves: string[], learnTypes: string[]) {
    return ["(No Move)", ...moves.map((move, index) => moveToOption(move, learnTypes[index]))];
}

function natureToOption(nature: Nature) {
    if (nature.plus == nature.minus) { return nature.name }
    return nature.name + " (+" + prettyStatName(nature.plus as string) + ", -" + prettyStatName(nature.minus as string) + ")";
}

function optionToNature(option: string | undefined) {
    if (!option) { return "Hardy"; }
    return option.slice(0,-13);
}

function prettyStatName(stat: string) {
    switch (stat) {
        case 'hp':
            return 'HP';
        case 'atk':
            return 'Atk';
        case 'def':
            return 'Def';
        case 'spa':
            return 'SpA';
        case 'spd':
            return 'SpD';
        case 'spe':
            return 'Spe';
        default:
            return stat;
    }
}

function evsToString(gen: Generation, pokemon: Pokemon) {
    let str = ''
    let empty = true
    for (let keyval of Object.entries(pokemon.evs)) {
        if (keyval[1] != 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            let statAbbr = prettyStatName(keyval[0]);
            const nature = gen.natures.get(toID(pokemon.nature));
            const natureEffect = nature ? (keyval[0] == nature.minus ? '-' : (keyval[0] == nature.plus ? '+' : '')) : '';
            str = str + statAbbr + ' ' + keyval[1] + natureEffect;
        }
    } 
    if (str.length == 0) { return "none"; }
    return str;
}

function ivsToString(ivs: StatsTable) {
    return  ivs.hp.toString()  + " / " +
            ivs.atk.toString() + " / " +
            ivs.def.toString() + " / " +
            ivs.spa.toString() + " / " +
            ivs.spd.toString() + " / " +
            ivs.spe.toString();
}

const LeftCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    textAlign: 'right',
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '8px',
    borderBottom: 0,
  }));
  
  const RightCell = styled(TableCell)(({ theme }) => ({
      fontWeight: theme.typography.fontWeightMedium,
      textAlign: 'left',
      padding: '0px',
      borderBottom: 0,
  })); 
  
  function SummaryRow({name, value, setValue, options}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[]}) {
    return (
        <>
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    <Autocomplete
                        disablePortal
                        disableClearable
                        autoHighlight={true}    
                        size="small"
                        value={value || undefined}
                        options={options}
                        renderInput={(params) => <TextField {...params} variant="standard" size="small" />}
                        onChange={(event: any, newValue: string) => {
                            setValue(newValue);
                        }}
                        sx = {{width: '80%'}}
                    />
                </RightCell>
            </TableRow>
        </>
      )
  }

function BuildControls({gen, pokemon, abilities, moveSet, moveLearnTypes, setPokemon}: 
        {gen: Generation, pokemon: Pokemon, abilities: string[], moveSet: string[], moveLearnTypes: string[], setPokemon: React.Dispatch<React.SetStateAction<Pokemon>>}) 
    {
    const [genSpecies, ] = useState([...gen.species].map(specie => specie.name).sort());
    const [teratypes, ] = useState([...gen.types].map(type => type.name).sort());
    const [genNatures, ] = useState([...gen.natures].map(nature => natureToOption(nature)).sort());
    const [genItems, ] = useState([...gen.items].map(item => item.name).sort());
    
    const [editStatsOpen, setEditStatsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    const moveOptions = createMoveOptions(moveSet, moveLearnTypes);

    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newPokemon = {...pokemon};
            // @ts-ignore
            newPokemon[propName] = val;
            setPokemon(new Pokemon(gen, newPokemon.name, {
                level: newPokemon.level,
                ability: newPokemon.ability,
                nature: newPokemon.nature,
                item: newPokemon.item,
                ivs: newPokemon.ivs,
                evs: newPokemon.evs,
                moves: newPokemon.moves,
                teraType: newPokemon.teraType,
                bossMultiplier: newPokemon.bossMultiplier,
            }))
        }
    }

    const handleChangeSpecies = (val: string) => {
        setPokemon(new Pokemon(gen, val, {}))
    }
    
    return (
        <Box justifyContent="center" alignItems="top" width="300px">
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ marginTop: 1, marginBottom: 2 }}>
                <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ width: "120px", textTransform: "none" }} 
                    disabled={importExportOpen}
                    onClick={(e) => setEditStatsOpen(!editStatsOpen)}
                    startIcon={editStatsOpen ? <ConstructionIcon/> : <TuneIcon/>}
                >
                    {editStatsOpen ? "Edit Build" : "Edit EVs/IVs"}
                </Button>
                <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ width: "120px", textTransform: "none" }} 
                    onClick={(e) => setImportExportOpen(!importExportOpen)}
                    endIcon={importExportOpen ? <ConstructionIcon/> : <ImportExportIcon/>}
                >
                    {importExportOpen ? "Edit Pok\u00E9mon" : "Import/Export"}
                </Button>
            </Stack>
            {importExportOpen &&
                <ImportExportArea pokemon={pokemon} setPokemon={setPokemon}/>
            }
            {(editStatsOpen && !importExportOpen) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 0 }}>
                    <StatsControls gen={gen} pokemon={pokemon} setPokemon={setPokemon}/>    
                </Stack>
            }
            {(!editStatsOpen && !importExportOpen) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                    <TableContainer>
                        <Table size="small" width="100%">
                            <TableBody>
                                <SummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies}/>
                                <SummaryRow name="Tera Type" value={pokemon.teraType || "???"} setValue={setPokemonProperty("teraType")} options={teratypes}/>
                                <SummaryRow name="Ability" value={pokemon.ability || abilities[0]} setValue={setPokemonProperty("ability")} options={abilities}/>
                                <SummaryRow name="Nature" value={pokemon.nature === undefined ? "Hardy" : natureToOption(gen.natures.get(toID(pokemon.nature)) as Nature)} setValue={(val: string) => setPokemonProperty("nature")(optionToNature(val))} options={genNatures}/>
                                <TableRow>
                                    <LeftCell>Level</LeftCell>
                                    <RightCell>
                                        <TextField 
                                            size="small"
                                            variant="standard"
                                            type="number"
                                            InputProps={{
                                                inputProps: { 
                                                    max: 100, min: 1 
                                                }
                                            }}
                                            fullWidth={false}
                                            value={pokemon.level}
                                            onChange={(e) => {
                                                if (e.target.value === "") return setPokemonProperty("level")(1);
                                                let lvl = parseInt(e.target.value);
                                                if (lvl < 1) lvl = 1;
                                                if (lvl > 100) lvl = 100;
                                                setPokemonProperty("level")(lvl)
                                            }}
                                            sx = {{ width: '30%'}}
                                        />
                                    </RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>IVs</LeftCell>
                                    <RightCell>{ivsToString(pokemon.ivs)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>EVs</LeftCell>
                                    <RightCell>{evsToString(gen, pokemon)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '5px'}} />
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                <SummaryRow name="Item" value={pokemon.item || "(No Item)"} setValue={setPokemonProperty("item")} options={["(No Item)", ...genItems]}/>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                {
                                    [0,1,2,3].map((index) => {
                                        return <SummaryRow 
                                            key={index}
                                            name={index==0 ? "Moves" : ""}
                                            value={findOptionFromMove(pokemon.moves[index], moveSet, moveLearnTypes) || "(No Move)"} 
                                            setValue={(moveOption: string) => {
                                                const move = optionToMove(moveOption);
                                                const newMoves = [...pokemon.moves as string[]];
                                                newMoves[index] = move;
                                                setPokemonProperty("moves")(newMoves);
                                            }}
                                            options={moveOptions}
                                        /> 
                                    })
                                } 
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            }
        </Box>
    )
}

export default BuildControls;