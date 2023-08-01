import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Box from '@mui/material/Box';

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";
import { Raider, RaidState, RaidTurnInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";

import PokemonSummary from "./PokemonSummary";
import BossSummary from "./BossSummary";

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { Hidden } from "@mui/material";

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider } from "@emotion/react";
import { useTheme } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";


function saveGraphic(theme: any, raidInputProps: RaidInputProps, title?: string, notes?: string, credits?: string) {
    const tempEl = document.createElement('tempEl');
    const root = createRoot(tempEl);
    flushSync(() => {
        root.render(
            // We might not want to actually reuse UI components here
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Stack direction={"column"} spacing={1} alignItems="center" justifyContent="center">
                <Typography variant="h4" >
                  {title}
                </Typography>
                <Stack direction={"row"} spacing={1}>
                  <PokemonSummary pokemon={raidInputProps.pokemon[1]} setPokemon={(p: Raider) => {return; }} prettyMode={true} />
                  <PokemonSummary pokemon={raidInputProps.pokemon[2]} setPokemon={(p: Raider) => {return; }} prettyMode={true} />
                  <PokemonSummary pokemon={raidInputProps.pokemon[3]} setPokemon={(p: Raider) => {return; }} prettyMode={true} />
                  <PokemonSummary pokemon={raidInputProps.pokemon[4]} setPokemon={(p: Raider) => {return; }} prettyMode={true} />
                </Stack>
              </Stack>
            </ThemeProvider>       
        );
      });
    
    document.body.appendChild(tempEl); // this makes the element findable for html2canvas

    html2canvas(tempEl, {allowTaint: true, useCORS: true}).then((canvas) => {
      canvas.toBlob((blob) => {
          if (blob) {
              saveAs(blob, title + '.png');
          } else {
              saveAs(getPokemonArtURL("wo-chien"), "live_reaction.png");
          }
      });
    });
    tempEl.remove(); // remove the element from the DOM
}


function GraphicsButton({title, notes, credits, raidInputProps, setTitle, setNotes, setCredits, setPrettyMode}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, 
      setTitle: (t: string) => void, setNotes: (t: string) => void, setCredits: (t: string) => void, 
      setPrettyMode: (p: boolean) => void}) {
    const [buildInfo, setBuildInfo] = useState(null);
    const [hasLoadedInfo, setHasLoadedInfo] = useState(false);
    const location = useLocation();
    const hash = location.hash
    const theme = useTheme();

    const handleDownload = () => {
        try {
            saveGraphic(theme, raidInputProps, title, notes, credits);
        } catch (e) {
            console.log(e)
        }
    };
    
    return (
        <Button
            variant="outlined"
            onClick={() => {
                handleDownload();
            }}
        >
            Download Graphic
        </Button>
    );
};


export default GraphicsButton;