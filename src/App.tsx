import React, {useState, useEffect, useRef} from 'react';
import './App.css';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';

import PokemonSummary from './uicomponents/PokemonSummary.tsx';
import BossSummary from './uicomponents/BossSummary.tsx';
import Navbar from './uicomponents/Navbar.tsx';

import {calculate, Generations, Pokemon, Move, Field, State} from './calc/index.ts';
import {BOSS_SETDEX_SV} from './data/sets/raid_bosses.ts'

const defaultBossName = "Delphox";
const defaultBossSet = BOSS_SETDEX_SV.Delphox['7⭐event'] as Partial<State.Pokemon>;

const defaultRaiderName = "Corviknight";
const defaultRaiderSet: Partial<State.Pokemon> = { 
  level: 100,
  nature: "Serious",
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [lightMode, setLightMode] = useState<('dark' | 'light')>(prefersDarkMode ? 'dark' : 'light');
  const theme = createTheme({
    palette: {
      mode: lightMode,
      background: {
        paper: lightMode === 'dark' ? '#4b4b4b' : '#e6e6e6',
      },
      primary: {
        main: lightMode === 'dark' ? "#faa5a0" : "#ed382d",
      },
      secondary: {
        main: lightMode === 'dark' ? "#faa5a0" : "#940f07"
      },
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

  const [raidBoss, setRaidBoss] = useState(new Pokemon(gen, defaultBossName, defaultBossSet))
  const [pokemon1, setPokemon1] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))
  const [pokemon2, setPokemon2] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))
  const [pokemon3, setPokemon3] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))
  const [pokemon4, setPokemon4] = useState(new Pokemon(gen, defaultRaiderName, defaultRaiderSet))

  const [bossRole, setBossRole] = useState("Raid Boss");
  const [role1, setRole1] = useState("Raider #1");
  const [role2, setRole2] = useState("Raider #2");
  const [role3, setRole3] = useState("Raider #3");
  const [role4, setRole4] = useState("Raider #4");

  const [bossMoves, setBossMoves] = useState([] as string[]);

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
      <Navbar lightMode={lightMode} setLightMode={setLightMode} />
      <Grid container component='main' justifyContent="left" sx={{ my: 1 }}>
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
        <Grid item>
          <BossSummary gen={gen} pokemon={raidBoss} setPokemon={setRaidBoss} role={bossRole} setRole={setBossRole} bossMoves={bossMoves} setBossMoves={setBossMoves} />
        </Grid>
      </Grid>
      <Stack sx={{ mx: 3, my: 3}}>
        <Typography variant="h6" sx={{color: "text.secondary"}}>
          Acknowledgements
        </Typography>
        <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
          Thank you to the <Link href="https://reddit.com/r/pokeportal">r/PokePortal</Link> Event Raid Support team for their help with design and testing!
        </Typography>
        <Typography variant="h6" sx={{color: "text.secondary"}}>
            Contact
        </Typography>
        <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
          Please submit issues or feature requests at <Link href="https://github.com/theastrogoth/tera-raid-builder/">this project's Github repository</Link>.
        </Typography>
      </Stack>
    </ThemeProvider>
  );
}

export default App;
