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
import { styled } from "@mui/material/styles"

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider } from "@emotion/react";
import { useTheme } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { opacity } from "html2canvas/dist/types/css/property-descriptors/opacity";
import { backgroundPosition } from "html2canvas/dist/types/css/property-descriptors/background-position";
  
const graphicsTheme = createTheme({
    typography: {
        fontFamily: 'renogare, sans-serif',
    },
    // @ts-ignore
    overrides: {
        '@font-face': {
            fontFamily: 'renogare',
            src: `
                local('renogare'),
                url('/fonts/Renogare-Regular.otf') format('opentype')`,
        },
    },
});

const GraphicsContainer = styled(Box)({
    width: "3600px",
    backgroundImage: `linear-gradient(rgba(0, 0, 0, .7), rgba(0, 0, 0, .7)), url(${getPokemonArtURL("wo-chien")})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontWeight: "lighter",
    fontKerning: "auto",
    textShadow: "0px 0px 15px rgba(0, 0, 0, .35)"
});

const Header = styled(Box)({
    padding: "100px 100px 25px 100px",
    height: "auto",
    position: "relative"
});

const BossWrapper = styled(Box)({
    height: "450px",
    width: "450px",
    position: "absolute",
    right: "100px",
    top: "50px",
    display: "flex",
    justifyContent: "center"
});

const Boss = styled("img")({
    height: "100%",
    position: "absolute",
    right: "0px"
});

const BossTera = styled("img")({
    width: "60%",
    position: "absolute",
    bottom: "0px",
    alignSelf: "center"
});

const Title = styled(Typography)({
    color: "white",
    fontWeight: "inherit",
    fontSize: "15em",
    margin: "0px",
});

const Subtitle = styled(Typography)({
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: "8em",
    margin: "0px",
});

function generateGraphic(theme: any, raidInputProps: RaidInputProps, title?: string, notes?: string, credits?: string) {
    const graphicTop = document.createElement('graphic_top');
    const root = createRoot(graphicTop);
    flushSync(() => {
        root.render(
            <ThemeProvider theme={graphicsTheme}>
                <GraphicsContainer>
                    <Header>
                        <BossWrapper>
                            <BossTera src={getTeraTypeIconURL(raidInputProps.pokemon[0].teraType || "inactive")}></BossTera>
                            {/* <Boss src={getPokemonArtURL(raidInputProps.pokemon[0].species.id)}></Boss> */}
                            {/* Need to figure out how to show the tera type nicely */}
                        </BossWrapper>
                        <Title>{title}</Title>
                        <Subtitle>Created by: {credits}</Subtitle>
                    </Header>
                </GraphicsContainer> 
            </ThemeProvider>     
        );
    });
    
    document.body.appendChild(graphicTop); // this makes the element findable for html2canvas
    return graphicTop;
}

function saveGraphic(graphicTop: HTMLElement, title: string) {
    html2canvas(graphicTop, {allowTaint: true, useCORS: true, windowWidth: 3600}).then((canvas) => {
      canvas.toBlob((blob) => {
          if (blob) {
            //   saveAs(blob, title + '.png'); // commented for now, I dont want to keep downloading images every time I make a change
          } else {
              saveAs(getPokemonArtURL("wo-chien"), "live_reaction.png");
          }
      });
    });
    // graphicTop.remove(); // remove the element from the DOM // commented for now, I dont want the element to be remove in development
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
            const graphicTop = generateGraphic(theme, raidInputProps, title, notes, credits);
            saveGraphic(graphicTop, title);
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