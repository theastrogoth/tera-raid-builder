import React, {useState} from 'react';
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
import RaidControls from './uicomponents/RaidControls.tsx';
import LinkButton from './uicomponents/LinkButton.tsx';

import { Generations, Pokemon, Field} from './calc/index.ts';
import { MoveName } from './calc/data/interface.ts';
import { Raider, RaidBattleInfo, RaidState } from './raidcalc/interface.ts';


import {BOSS_SETDEX_SV} from './data/sets/raid_bosses.ts'

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [lightMode, setLightMode] = useState<('dark' | 'light')>(prefersDarkMode ? 'dark' : 'light');
  const [prettyMode, setPrettyMode] = useState<boolean>(false);
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

  const defaultRaiders = [
    new Raider(0, "Raid Boss", new Pokemon(gen, "Rillaboom", {
      teraType: "Normal",
      bossMultiplier: 3500,
      nature: "Naughty",
      ability: "Grassy Surge",
      moves: ["Take Down", "Wood Hammer", "Acrobatics", "Drum Beating"]
    }), ["Noble Roar", "Taunt", "Boomburst", "Body Slam"] as MoveName[]),
    new Raider(1, "Raider #1", new Pokemon(gen, "Lucario", {
      nature: "Modest",
      moves: ["Nasty Plot", "Focus Blast"],
      item: "Weakness Policy",
      evs: {hp: 252, spa: 252},
    })),
    new Raider(2, "Raider #2", new Pokemon(gen, "Dachsbun", {
      nature: "Bold",
      ability: "Aroma Veil",
      moves: ["Helping Hand"],
      evs: {hp: 252, def: 252},
    })),
    new Raider(3, "Raider #3", new Pokemon(gen, "Corviknight", {
      nature: "Relaxed",
      moves: ["Defog", "Fake Tears"],
      evs: {hp: 252, spd: 252},
    })),
    new Raider(4, "Raider #3", new Pokemon(gen, "Corviknight", {
      nature: "Relaxed",
      moves: ["Defog", "Fake Tears"],
      evs: {hp: 252, spd: 252},
    })),
  ];

  const [info, setInfo] = useState<RaidBattleInfo>({
    startingState: new RaidState(defaultRaiders, defaultRaiders.map((r) => new Field())),
    turns: [
      {
        id: 0, 
        moveInfo: {userID: 1, targetID: 0, options: {crit: false, secondaryEffects: false, roll: "min" }, moveData: {name: "(No Move)" as MoveName}}, 
        bossMoveInfo: {userID: 0, targetID: 1, options: {crit: false, secondaryEffects: false, roll: "max" }, moveData: {name: "(No Move)" as MoveName}},
      }
    ],
  })

  const raiders = info.startingState.raiders;

  const setRaiders = (raiders: Raider[]) => {
    setInfo({
      ...info,
      startingState: new RaidState(raiders, info.startingState.fields.map((f) => f.clone())),
    })
  }

  const setPokemon = (index: number) => (r: Raider) => {
    const newRaiders = [...raiders];
    newRaiders[index] = r;
    setRaiders(newRaiders);
  }

  return (
    <ThemeProvider theme={theme}> 
    <Box>  
      <CssBaseline />
      <Navbar lightMode={lightMode} setLightMode={setLightMode} prettyMode={prettyMode} setPrettyMode={setPrettyMode} />
      <Grid container component='main' justifyContent="left" sx={{ my: 1 }}>
        <Grid item>
          <Stack direction="row">
            <PokemonSummary pokemon={raiders[1]} setPokemon={setPokemon(1)} prettyMode={prettyMode} />
            <PokemonSummary pokemon={raiders[2]} setPokemon={setPokemon(2)} prettyMode={prettyMode}/>
          </Stack>
        </Grid>
        <Grid item>
          <Stack direction="row">
            <PokemonSummary pokemon={raiders[3]} setPokemon={setPokemon(3)} prettyMode={prettyMode} />
            <PokemonSummary pokemon={raiders[4]} setPokemon={setPokemon(4)} prettyMode={prettyMode} />
          </Stack>
        </Grid>
        <Grid item>
          <BossSummary pokemon={raiders[0]} setPokemon={setPokemon(0)} prettyMode={prettyMode} />
        </Grid>
        <Grid item>
          <RaidControls info={info} setInfo={setInfo} />
        </Grid>
      </Grid>
      <Box sx={{ p: 2 }}>
        <LinkButton info={info} setInfo={setInfo} />
      </Box>
      <Stack sx={{ mx: 3, my: 3}}>
        <Typography variant="h6" sx={{color: "text.secondary"}}>
          Acknowledgements
        </Typography>
        <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
          Thank you to the <Link href="https://reddit.com/r/pokeportal">r/PokePortal</Link> Event Raid Support team for their help with design and testing!
        </Typography>
        <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
          Damage calculations are based on the <Link href="https://github.com/smogon/damage-calc/tree/master/calc">@smogon/calc</Link> package, with additional changes from <Link href="https://github.com/davbou/damage-calc">davbou's fork</Link>.
        </Typography>
        <Typography variant="h6" sx={{color: "text.secondary"}}>
            Contact
        </Typography>
        <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
          Please submit issues or feature requests at <Link href="https://github.com/theastrogoth/tera-raid-builder/">this project's Github repository</Link>.
        </Typography>
      </Stack>
    </Box>   
    </ThemeProvider>
  );
}

export default App;
