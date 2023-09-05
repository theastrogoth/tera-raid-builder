import React, {useEffect, useState} from 'react';
import './App.css';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, createTheme } from '@mui/material/styles';
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
import { RaidTurnInfo } from './raidcalc/interface.ts';
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
      bossMultiplier: 3500,
      nature: "Modest",
      ability: "Unnerve",
      moves: ["Psystrike", "Psychic", "Shadow Ball", "Aura Sphere"],
      shieldData: {hpTrigger: 80, timeTrigger: 80, shieldCancelDamage: 40, shieldDamageRate: 20, shieldDamageRateTera: 70, shieldDamageRateTeraChange: 30}
    }), 
    [
      {name: "Psystrike" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Psychic" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Shadow Ball" as MoveName, category: "damage", target: "selected-pokemon"},
      {name: "Aura Sphere" as MoveName, category: "damage", target: "selected-pokemon"},
    ], 
    ["Nasty Plot", "Agility", "Psychic Terrain"] as MoveName[], 
    [
      {name: "Nasty Plot" as MoveName, category: "net-good-stats", target: "user", statChanges: [{stat: "spa", change: 2}], statChance: 100},
      {name: "Agility" as MoveName, category: "net-good-stats", target: "user", statChanges: [{stat: "spe", change: 2}], statChance: 100},
      {name: "Psychic Terrain" as MoveName, category: "field-effect", target: "user"},
    ])
  );
  const [raider1, setRaider1] = useState(
    new Raider(1, "Krookodile", false, new Field(), new Pokemon(gen, "Krookodile", {
      nature: "Jolly",
      ability: "Anger Point",
      moves: ["Power Trip"],
      item: "Choice Band",
      evs: {atk: 252, spe: 252},
    }), 
    [
      {name: "Power Trip" as MoveName, category: "damage", target: "selected-pokemon"},
    ])
  );
  const [raider2, setRaider2] = useState(
    new Raider(2, "Meowscarada", false, new Field(), new Pokemon(gen, "Meowscarada", {
      level: 36,
      nature: "Hardy",
      ability: "(No Ability)",
      moves: ["Flower Trick"],
      item: "Focus Sash"
    }), 
    [
      {name: "Flower Trick" as MoveName, category: "damage", target: "selected-pokemon"},
    ])
  );
  const [raider3, setRaider3] = useState(
    new Raider(3, "Corviknight", false, new Field(), new Pokemon(gen, "Corviknight", {
      nature: "Relaxed",
      ability: "(No Ability)",
      moves: ["Screech"],
      item: "Zoom Lens",
      evs: {hp: 252, spd: 252},
    }), 
    [
      {name: "Screech" as MoveName, category: "net-good-stats", target: "selected-pokemon", statChanges: [{stat: "def", change: -2}], statChance: 100},
    ])
  );
  const [raider4, setRaider4] = useState(
    new Raider(4, "Umbreon", false, new Field(), new Pokemon(gen, "Umbreon", {
      nature: "Sassy",
      ability: "(No Ability)",
      moves: ["Screech"],
      item: "Zoom Lens",
      evs: {hp: 252, spd: 252},
    }), 
    [
      {name: "Screech" as MoveName, category: "net-good-stats", target: "selected-pokemon", statChanges: [{stat: "def", change: -2}], statChance: 100},
    ])
  );

  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [credits, setCredits] = useState<string>("");
  const [turns, setTurns] = useState<RaidTurnInfo[]>([{
      id: 0, 
      group: 0,
      moveInfo: {userID: 1, targetID: 0, options: {crit: false, secondaryEffects: false, roll: "min", hits: 1}, moveData: {name: "(No Move)" as MoveName}}, 
      bossMoveInfo: {userID: 0, targetID: 1, options: {crit: true, secondaryEffects: true, roll: "max", hits: 10}, moveData: {name: "(Most Damaging)" as MoveName}},
    }
  ]);
  const [groups, setGroups] = useState<number[][]>([[0]]);

  const raidInputProps: RaidInputProps = {
    pokemon: [raidBoss, raider1, raider2, raider3, raider4],
    setPokemon: [setRaidBoss, setRaider1, setRaider2, setRaider3, setRaider4],
    turns: turns,
    setTurns: setTurns,
    groups: groups,
    setGroups: setGroups
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
