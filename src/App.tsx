import React, {useState, useEffect, useRef} from 'react';
import './App.css';
import {calculate, Generations, Pokemon, Move, Field, State} from './calc/index.ts';
import {BOSS_SETDEX_SV} from './data/sets/raid_bosses.ts'

import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme } from '@mui/material/styles';
import { PaletteMode, Stack } from '@mui/material';
import { ThemeProvider } from '@emotion/react';

import CssBaseline from '@mui/material/CssBaseline';

import PokemonSummary from './uicomponents/pokemonSummary.tsx';

// import { exportPokemon, addSet } from './uicomponents/importExport.tsx';
// import { PokedexService } from './services/getdata.ts';

// const defaultBossName = "Delphox";
// const defaultBossSet = BOSS_SETDEX_SV.Delphox['7⭐event'] as Partial<State.Pokemon>;

const defaultRaiderName = "Corviknight";
const defaultRaiderSet: Partial<State.Pokemon> = { 
  level: 100,
  nature: "Serious",
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const lightMode = prefersDarkMode ? 'dark' : 'light' as PaletteMode;
  const theme = createTheme({
    palette: {
      mode: lightMode,
      background: {
        paper: lightMode === 'dark' ? '#4b4b4b' : '#e6e6e6',
      }
    },
    typography: {
      fontSize: 11,
    },
    components: {
      MuiSlider: {
        styleOverrides: {
          root: {
            padding: "0px",
            '@media (pointer: coarse)': {
              padding: "0px",
            }
          }
        }
      }
    }
  });  

  const gen = Generations.get(9); 

  // const [raidBoss, setRaidBoss] = useState(new Pokemon(gen, defaultBossName, defaultBossSet))
  const [pokemon1, setPokemon1] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))
  const [pokemon2, setPokemon2] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))
  const [pokemon3, setPokemon3] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))
  const [pokemon4, setPokemon4] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))

  const [role1, setRole1] = useState("Raider #1");
  const [role2, setRole2] = useState("Raider #2");
  const [role3, setRole3] = useState("Raider #3");
  const [role4, setRole4] = useState("Raider #4");

  // const exportedData = exportPokemon(pokemon1);
  // const importedData = addSet("baddata");
  // console.log(exportedData)
  // console.log(importedData)

  // const result1 = calculate(
  //   gen,
  //   raidBoss,
  //   pokemon1,
  //   new Move(gen, raidBoss.moves[0]),
  //   new Field({weather: "Rain"})
  // );
  // console.log(result1.desc())

  // const result2 = calculate(
  //   gen,
  //   raidBoss,
  //   pokemon2,
  //   new Move(gen, raidBoss.moves[0]),
  //   new Field({weather: "Rain"})
  // );
  // console.log(result2.desc())

  // const result3 = calculate(
  //   gen,
  //   raidBoss,
  //   pokemon3,
  //   new Move(gen, raidBoss.moves[0]),
  //   new Field({weather: "Rain"})
  // );
  // console.log(result3.desc())

  // const result4 = calculate(
  //   gen,
  //   raidBoss,
  //   pokemon4,
  //   new Move(gen, raidBoss.moves[0]),
  //   new Field({weather: "Rain"})
  // );
  // console.log(result4.desc())

  return (
    <ThemeProvider theme={theme}>      
      <CssBaseline />
      <Grid container component='main' justifyContent="left">
        <Grid item >
          {/* <PokemonSummary gen={gen} pokemon={raidBoss} setPokemon={setRaidBoss} role="Raid Boss" /> */}
        </Grid>
        <Grid item>
          <Stack direction="row">
            <PokemonSummary gen={gen} pokemon={pokemon1} setPokemon={setPokemon1} role={role1} setRole={setRole1} />
            <PokemonSummary gen={gen} pokemon={pokemon2} setPokemon={setPokemon2} role={role2} setRole={setRole2} />
          </Stack>
        </Grid>
        <Grid item>
          <Stack direction="row">
            <PokemonSummary gen={gen} pokemon={pokemon3} setPokemon={setPokemon3} role={role3} setRole={setRole3} />
            <PokemonSummary gen={gen} pokemon={pokemon4} setPokemon={setPokemon4} role={role4} setRole={setRole4} />
          </Stack>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;
