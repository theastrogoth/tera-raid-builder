import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';
import { styled } from '@mui/material/styles';

import { Pokemon } from "../calc";
import { Generation } from "../calc/data/interface";

const IVInput = styled(MuiInput)`
  width: 34px;
`;
const EVInput = styled(MuiInput)`
  width: 42px;
`;

const LeftCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    textAlign: 'right',
    paddingTop: '12px',
    paddingBottom: '5px',
    paddingLeft: '0px',
    paddingRight: '0px',
    borderBottom: 0,
  }));
  
  const RightCell = styled(TableCell)(({ theme }) => ({
      fontWeight: theme.typography.fontWeightMedium,
      textAlign: 'center',
      paddingTop: '12px',
      paddingBottom: '5px',
      paddingLeft: '0px',
      paddingRight: '0px',
      borderBottom: 0,
  }));

function EVSlider({evTotal, ev, setEV}: {evTotal: number, ev: number, setEV: Function}) {
    const [val, setVal] = useState(ev);

    useEffect(() => {
        if (val !== ev) {
            setVal(ev);
        }
    }, [ev])
    
    const handleEVChange = (e: Event | React.SyntheticEvent, value: number) => {
        const diff = value - ev;
        const newTotal = evTotal + diff;
        if (newTotal > 510) {
            const newev = value - (newTotal - 510)
            setEV(newev, ev, evTotal);
            setVal(newev);
        } else {
            setEV(value, ev, evTotal);
            setVal(value);
        }
    }
    return (
        <Box minWidth="60px">
            <Slider
                value={val}
                step={4}
                min={0}
                max={252}
                valueLabelDisplay="auto"
                onChange={(e, value) => setVal(value as number)}
                onChangeCommitted={(e, value) => handleEVChange(e, value as number)}
            />
        </Box>
    )
}

function StatTableRow({name, evTotal, iv, setIV, ev, setEV}: {name: string, evTotal: number, iv: number, setIV: Function, ev: number, setEV: Function}) {
    return (
        <TableRow>
            <LeftCell>
                {name}
            </LeftCell>  
            <RightCell>
                <IVInput 
                    value={iv.toString()}
                    onChange={(e) => setIV(e.target.value === '' ? 0 : parseInt(e.target.value))} 
                    inputProps={{
                        step: 1,
                        min: 0,
                        max: 31,
                        type: 'number',
                      }}
                />    
            </RightCell>          
            <RightCell>
                <EVSlider evTotal={evTotal} ev={ev} setEV={setEV} />    
            </RightCell>
            <RightCell>
                <EVInput 
                    value={ev.toString()} 
                    onChange={(e) => setEV(e.target.value === '' ? 0 : parseInt(e.target.value), ev, evTotal)} 
                    inputProps={{
                        step: 4,
                        min: 0,
                        max: 252,
                        type: 'number',
                    }}/>    
            </RightCell>
        </TableRow>
    )
}



function StatsControls({gen, pokemon, setPokemon}: {gen: Generation, pokemon: Pokemon, setPokemon: React.Dispatch<React.SetStateAction<Pokemon>>}) {
    const setEV = (evName: string) => {
        return (value: number, prevValue: number, evTotal: number) => {
            let safeMax = 510 - evTotal + prevValue;
            safeMax = safeMax > 252 ? 252 : safeMax;
            let safeValue = value > safeMax ? safeMax : value;
            safeValue = safeValue < 0 ? 0 : safeValue;
            const newEVs = {...pokemon.evs};
            //@ts-ignore
            newEVs[evName] = safeValue;
            setPokemon(new Pokemon(gen, pokemon.name, {
                level: pokemon.level,
                ability: pokemon.ability,
                nature: pokemon.nature,
                item: pokemon.item,
                ivs: pokemon.ivs,
                moves: pokemon.moves,
                teraType: pokemon.teraType,
                bossMultiplier: pokemon.bossMultiplier,                
                evs: newEVs,
            }))
        }
    };

    const setIV = (ivName: string) => {
        return (value: number) => {
            let safeValue = value > 31 ? 31 : value;
            safeValue = safeValue < 0 ? 0 : safeValue;
            const newIVs = {...pokemon.ivs};
            //@ts-ignore
            newIVs[ivName] = safeValue;
            setPokemon(new Pokemon(gen, pokemon.name, {
                level: pokemon.level,
                ability: pokemon.ability,
                nature: pokemon.nature,
                item: pokemon.item,
                evs: pokemon.evs,
                moves: pokemon.moves,
                teraType: pokemon.teraType,
                bossMultiplier: pokemon.bossMultiplier,                
                ivs: newIVs,
            }))
        }
    };

    const evTotal = Object.values(pokemon.evs).reduce((a,b) => a + b, 0)
    
    return (
        <Stack direction={'row'} spacing={0} sx={{ my: 0, mx: 0 }}>
            <TableContainer sx={{ height: "305px"}}> {/* This is probably a bad solution for getting rid of weird overflowY behavior */}
                <Table size="small" style={{ padding: 0, tableLayout: "auto" }}>
                    <TableHead>
                        <TableRow >
                            <LeftCell />
                            <RightCell align="center" >
                                <Typography fontWeight="bold">IVs</Typography>
                            </RightCell>
                            <RightCell align="center" >
                                <Typography fontWeight="bold">EVs</Typography>
                            </RightCell>
                            <RightCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <StatTableRow name="HP"  evTotal={evTotal} iv={pokemon.ivs.hp}  setIV={setIV('hp')}  ev={pokemon.evs.hp}  setEV={setEV('hp')} />
                        <StatTableRow name="Atk" evTotal={evTotal} iv={pokemon.ivs.atk} setIV={setIV('atk')} ev={pokemon.evs.atk} setEV={setEV('atk')} />
                        <StatTableRow name="Def" evTotal={evTotal} iv={pokemon.ivs.def} setIV={setIV('def')} ev={pokemon.evs.def} setEV={setEV('def')} />
                        <StatTableRow name="SpA" evTotal={evTotal} iv={pokemon.ivs.spa} setIV={setIV('spa')} ev={pokemon.evs.spa} setEV={setEV('spa')} />
                        <StatTableRow name="SpD" evTotal={evTotal} iv={pokemon.ivs.spd} setIV={setIV('spd')} ev={pokemon.evs.spd} setEV={setEV('spd')} />
                        <StatTableRow name="Spe" evTotal={evTotal} iv={pokemon.ivs.spe} setIV={setIV('spe')} ev={pokemon.evs.spe} setEV={setEV('spe')} />
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}

export default StatsControls