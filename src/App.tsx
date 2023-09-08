import React, {useEffect, useState} from 'react';
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
import StratHeader from './uicomponents/StratHeader.tsx';
import StratFooter from './uicomponents/StratFooter.tsx';

import { Generations, Pokemon, Field } from './calc/index.ts';
import { MoveName } from './calc/data/interface.ts';
import { TurnGroupInfo } from './raidcalc/interface.ts';
import { Raider } from './raidcalc/Raider.ts';
import { RaidInputProps } from './raidcalc/inputs.ts';
import { RaidBattleResults } from './raidcalc/RaidBattle.ts';
import GraphicsButton from './uicomponents/GraphicsButton.tsx';
import { RaidState } from './raidcalc/RaidState.ts';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [lightMode, setLightMode] = useState<('dark' | 'light')>(prefersDarkMode ? 'dark' : 'light');
  const [prettyMode, setPrettyMode] = useState<boolean>(false);
  
  const [theme, setTheme] = useState(createTheme({
    palette: {
      mode: lightMode,
      background: {
        paper: lightMode === 'dark' ? '#4b4b4b' : '#e6e6e6'
      },
      primary: {
        main: lightMode === 'dark' ? "#faa5a0" : "#ed382d"
      },
      secondary: {
        main: lightMode === 'dark' ? "#faa5a0" : "#940f07"
      },
      //@ts-ignore
      subdued: {
        main: lightMode === 'dark' ? "#7e7e7e" : "#bebebe"
      },
      //@ts-ignore
      modal: {
        main: lightMode === 'dark' ? "#666666" : "#dedede"
      },
      //@ts-ignore
      group0: {
        main: lightMode === "dark" ? "#571b20" : "#f7b5ba"
      },
      //@ts-ignore
      group1: {
        main: lightMode === "dark" ? "#144e52" : "#c5e6e8"
      },
      //@ts-ignore
      group2: {
        main: lightMode === "dark" ? "#205220" : "#b0f5b0"
      },
      //@ts-ignore
      group3: {
        main: lightMode === "dark" ? "#443769" : "#ccbff5"
      },
      //@ts-ignore
      group4: {
        main: lightMode === "dark" ? "#c79240" : "#ffe0b0"
      },
      //@ts-ignore
      group5: {
        main: lightMode === "dark" ? "#5fa116" : "#d7faaf"
      },
      //@ts-ignore
      group6: {
        main: lightMode === "dark" ? "#993f64" : "#fccce1"
      },
      //@ts-ignore
      group7: {
        main: lightMode === "dark" ? "#4f4215": "#d4caa7"
      },
      //@ts-ignore
      group8: {
        main: lightMode === "dark" ? "#520438": "#c4b1be"
      },
      //@ts-ignore
      group9: {
        main: lightMode === "dark" ? "#363336": "#b3b3b3"
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
  }));  

  useEffect(() => {
    setTheme(createTheme(
      {
        palette: {
          mode: lightMode,
          background: {
            paper: lightMode === 'dark' ? '#4b4b4b' : '#e6e6e6',
          },
          primary: {
            main: lightMode === 'dark' ? "#faa5a0" : "#db3227",
          },
          secondary: {
            main: lightMode === 'dark' ? "#faa5a0" : "#940f07"
          },
          //@ts-ignore
          subdued: {
            main: lightMode === 'dark' ? "#7e7e7e" : "#bebebe"
          },
          //@ts-ignore
          modal: {
            main: lightMode === 'dark' ? "#666666" : "#dedede"
          },
          //@ts-ignore
          group0: {
            main: lightMode === "dark" ? "#571b20" : "#f7b5ba",
          },
          //@ts-ignore
          group1: {
            main: lightMode === "dark" ? "#144e52" : "#c5e6e8"
          },
          //@ts-ignore
          group2: {
            main: lightMode === "dark" ? "#205220" : "#b0f5b0"
          },
          //@ts-ignore
          group3: {
            main: lightMode === "dark" ? "#443769" : "#ccbff5",
          },
          //@ts-ignore
          group4: {
            main: lightMode === "dark" ? "#c79240" : "#ffe0b0"
          },
          //@ts-ignore
          group5: {
            main: lightMode === "dark" ? "#5fa116" : "#d7faaf"
          },
          //@ts-ignore
          group6: {
            main: lightMode === "dark" ? "#993f64" : "#fccce1"
          },
          //@ts-ignore
          group7: {
            main: lightMode === "dark" ? "#4f4215": "#d4caa7"
          },
          //@ts-ignore
          group8: {
            main: lightMode === "dark" ? "#520438": "#c4b1be"
          },
          //@ts-ignore
          group9: {
            main: lightMode === "dark" ? "#363336": "#b3b3b3"
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
      }
    ))
  }, [lightMode])

  const gen = Generations.get(9); 

  const [raidBoss, setRaidBoss] = useState(
    new Raider(0, "Raid Boss", false, new Field(), new Pokemon(gen, "Mewtwo", {
      teraType: "Psychic",
      isTera: true,
      bossMultiplier: 5000,
      nature: "Modest",
      ability: "Unnerve",
      moves: ["Psystrike", "Ice Beam", "Aura Sphere", "Calm Mind"],
      item: "Chesto Berry",
      evs: {def: 252, spa: 6, spd: 252},
      shieldData: {hpTrigger: 100, timeTrigger: 100, shieldCancelDamage: 50, shieldDamageRate: 10, shieldDamageRateTera: 70, shieldDamageRateTeraChange: 30}
    }), 
    [
      {name: "Psystrike" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Ice Beam" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Aura Sphere" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Calm Mind" as MoveName, category: "net-good-stats", target: "user", statChanges: [{stat: "spa", change: 1},{stat: "spd", change: 1}], statChance: 100},
    ], 
    ["Calm Mind", "Rest"] as MoveName[], 
    [
      {name: "Calm Mind" as MoveName, category: "net-good-stats", target: "user", statChanges: [{stat: "spa", change: 1},{stat: "spd", change: 1}], statChance: 100},
      {name: "Rest" as MoveName, category: "unique", target: "user"},
    ])
  );
  const [raider1, setRaider1] = useState(
    new Raider(1, "Mew", false, new Field(), new Pokemon(gen, "Mew", {
      nature: "Adamant",
      teraType: "Bug",
      ability: "Synchronize",
      moves: ["Swords Dance","X-Scissor","Leech Life","Misty Terrain"],
      item: "Metronome",
      evs: {hp: 252, atk: 252},
    }), 
    [
      {name: "Swords Dance" as MoveName, category: "net-good-stats", target: "user", statChanges: [{stat: "atk", change: 2}], statChance: 100},
      {name: "X-Scissor" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Leech Life" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Misty Terrain" as MoveName, category: "field-effect", target: "entire-field"},
    ])
  );
  const [raider2, setRaider2] = useState(
    new Raider(2, "Mew", false, new Field(), new Pokemon(gen, "Mew", {
      nature: "Bold",
      ability: "Synchronize",
      moves: ["Struggle Bug","Mud-Slap","Life Dew","Helping Hand"],
      item: "Covert Cloak",
      evs: {hp: 252, spd: 252},
    }), 
    [
      {name: "Struggle Bug" as MoveName, category: "damage+lower", target: "selected-pokemon", statChanges: [{stat: "spa", change: -1}], statChance: 100},
      {name: "Mud-Slap" as MoveName, category: "damage+lower", target: "selected-pokemon", statChanges: [{stat: "acc", change: -1}], statChance: 100},
      {name: "Life Dew" as MoveName, category: "heal", target: "user-and-allies"},
      {name: "Helping Hand" as MoveName, category: "unique", target: "selected-pokemon"},
    ])
  );
  const [raider3, setRaider3] = useState(
    new Raider(3, "Mew", false, new Field(), new Pokemon(gen, "Mew", {
      nature: "Bold",
      ability: "Synchronize",
      moves: ["Struggle Bug","Mud-Slap","Life Dew","Helping Hand"],
      item: "Covert Cloak",
      evs: {hp: 252, spd: 252},
    }), 
    [
      {name: "Struggle Bug" as MoveName, category: "damage+lower", target: "selected-pokemon", statChanges: [{stat: "spa", change: -1}], statChance: 100},
      {name: "Mud-Slap" as MoveName, category: "damage+lower", target: "selected-pokemon", statChanges: [{stat: "acc", change: -1}], statChance: 100},
      {name: "Life Dew" as MoveName, category: "heal", target: "user-and-allies"},
      {name: "Helping Hand" as MoveName, category: "unique", target: "selected-pokemon"},
    ])
  );
  const [raider4, setRaider4] = useState(
    new Raider(4, "Mew", false, new Field(), new Pokemon(gen, "Mew", {
      nature: "Bold",
      ability: "Synchronize",
      moves: ["Struggle Bug","Mud-Slap","Life Dew","Helping Hand"],
      item: "Covert Cloak",
      evs: {hp: 252, spd: 252},
    }), 
    [
      {name: "Struggle Bug" as MoveName, category: "damage+lower", target: "selected-pokemon", statChanges: [{stat: "spa", change: -1}], statChance: 100},
      {name: "Mud-Slap" as MoveName, category: "damage+lower", target: "selected-pokemon", statChanges: [{stat: "acc", change: -1}], statChance: 100},
      {name: "Life Dew" as MoveName, category: "heal", target: "user-and-allies"},
      {name: "Helping Hand" as MoveName, category: "unique", target: "selected-pokemon"},
    ])
  );

  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [credits, setCredits] = useState<string>("");
  const [groups, setGroups] = useState<TurnGroupInfo[]>([
    {
      id: 0, 
      repeats: 1,
      turns: [
        {
          id: 0,
          group: 0,
          moveInfo: {userID: 1, targetID: 0, options: {crit: false, secondaryEffects: false, roll: "min", hits: 1}, moveData: {name: "(No Move)" as MoveName}}, 
          bossMoveInfo: {userID: 0, targetID: 1, options: {crit: true, secondaryEffects: true, roll: "max", hits: 10}, moveData: {name: "(Most Damaging)" as MoveName}},
        }
      ]
    }
  ]);

  const raidInputProps: RaidInputProps = {
    pokemon: [raidBoss, raider1, raider2, raider3, raider4],
    setPokemon: [setRaidBoss, setRaider1, setRaider2, setRaider3, setRaider4],
    groups: groups,
    setGroups: setGroups,
  }

  const [results, setResults] = useState<RaidBattleResults>(
    {
      endState: new RaidState(raidInputProps.pokemon),
      turnResults: [],
      turnZeroOrder: [],
      turnZeroFlags: [],
    }
  );

  return (
  <ThemeProvider theme={theme}> 
    <CssBaseline />
    <Box>  
      <Navbar lightMode={lightMode} setLightMode={setLightMode} prettyMode={prettyMode} setPrettyMode={setPrettyMode} />
    </Box>
    <Stack direction="row">
      <Stack direction="column" justifyContent="center">
        <Grid container justifyContent="center" sx={{ my: 1 }}>
          <Grid item xs={10} sm={10} md={10} lg={8} xl={6} justifyContent="center">
            <StratHeader title={title} setTitle={setTitle} prettyMode={prettyMode} />
          </Grid>
        </Grid>
        <Grid container component='main' justifyContent="center" sx={{ my: 1 }}>
          <Grid item>
            <Stack direction="row">
              <PokemonSummary pokemon={raider1} setPokemon={setRaider1} prettyMode={prettyMode} />
              <PokemonSummary pokemon={raider2} setPokemon={setRaider2} prettyMode={prettyMode}/>
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction="row">
              <PokemonSummary pokemon={raider3} setPokemon={setRaider3} prettyMode={prettyMode} />
              <PokemonSummary pokemon={raider4} setPokemon={setRaider4} prettyMode={prettyMode} />
            </Stack>
          </Grid>
          <Grid item>
            <BossSummary pokemon={raidBoss} setPokemon={setRaidBoss} prettyMode={prettyMode} />
          </Grid>
          <Grid item>
            <RaidControls raidInputProps={raidInputProps} results={results} setResults={setResults} prettyMode={prettyMode} />
          </Grid>
          <StratFooter notes={notes} setNotes={setNotes} credits={credits} setCredits={setCredits} prettyMode={prettyMode} />
        </Grid>
        <Grid container justifyContent="left" sx={{ my: 1 }}>
          <Grid item xs={12}>
            <Stack >
              <Stack direction="row" sx={{ p: 2 }}>
                <Box flexGrow={1} />
                  <LinkButton 
                    title={title} notes={notes} credits={credits}
                    raidInputProps={raidInputProps}
                    setTitle={setTitle} setNotes={setNotes} setCredits={setCredits}
                    setPrettyMode={setPrettyMode}
                  />
                  <Box width="15px"/>
                  <GraphicsButton
                    title={title} notes={notes} credits={credits}
                    raidInputProps={raidInputProps} results={results}
                  />
                <Box flexGrow={1} />
              </Stack>
              <Stack sx={{ mx: 3, my: 3}}>
                <Typography variant="h6" sx={{color: "text.secondary"}}>
                  Acknowledgements
                </Typography>
                <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
                  Thank you to the <Link href="https://reddit.com/r/pokeportal" target="_blank">r/PokePortal</Link> Event Raid Support team for their help with design and testing!
                </Typography>
                <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
                  Damage calculations are based on the <Link href="https://github.com/smogon/damage-calc/tree/master/calc" target="_blank">@smogon/calc</Link> package, with additional changes from <Link href="https://github.com/davbou/damage-calc" target="_blank">davbou's fork</Link>.
                </Typography>
                <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
                  Sugimori-style artwork for shiny Pokémon has been adapted from <Link href="https://tonofdirt726.imgbb.com/" target="_blank">the recolors</Link> created by Tonofdirt726 <Link href="https://www.reddit.com/r/ShinyPokemon/comments/tda106/art_shiny_recolors_of_the_sugimoristyle_artwork/" target="_blank">(u/ton_of_dirt726)</Link>
                </Typography>
                <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
                  Additional assets and vectors adapted from art created by <Link href="https://www.deviantart.com/jormxdos" target="_blank">JorMxDos</Link>
                </Typography>
                <Typography variant="h6" sx={{color: "text.secondary"}}>
                  Contact
                </Typography>
                <Typography variant="body2" gutterBottom sx={{color: "text.secondary"}}>
                  Please submit issues or feature requests at <Link href="https://github.com/theastrogoth/tera-raid-builder/" target="_blank">this project's Github repository</Link>.
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  </ThemeProvider>
  );
}

export default App;
