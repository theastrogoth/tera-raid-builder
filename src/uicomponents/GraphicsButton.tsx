import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Box from '@mui/material/Box';

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, getMoveMethodIconURL, getEVDescription, getIVDescription } from "../utils";
import { Raider, RaidState, RaidTurnInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";
import { PokedexService } from "../services/getdata"
import { MoveData, MoveSetItem } from "../raidcalc/interface";


import PokemonSummary from "./PokemonSummary";
import BossSummary from "./BossSummary";

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { Hidden, TextField } from "@mui/material";
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
  
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DownloadIcon from '@mui/icons-material/Download';


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
    height: "250px",
    lineHeight: "250px",
    color: "white",
    fontWeight: "inherit",
    fontSize: "16em",
    margin: "0px",
});

const Subtitle = styled(Typography)({
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: "8em",
    margin: "0px",
});

const BuildsSection = styled(Box)({

});

const Separator = styled(Box)({
    height: "150px",
    alignItems: "center",
    display: "flex",
    position: "relative"
});

const LeftBar = styled("hr")({
    border: "4px solid rgba(255, 255, 255, 0.65)",
    margin: "0px 100px",
    position: "absolute",
    width: "37%",
    left: "0"
});

const SeparatorLabel = styled(Typography)({
    color: "white",
    fontSize: "8em",
    margin: "0px",
    position: "absolute",
    textAlign: "center",
    width: "100%"
});

const RightBar = styled("hr")({
    border: "4px solid rgba(255, 255, 255, 0.65)",
    margin: "0px 100px",
    position: "absolute",
    width: "37%",
    right: "0"
});

const BuildsContainer = styled(Box)({
    width: "auto",
    display: "flex",
    justifyContent: "space-between",
    padding: "0px 100px",
    margin: "80px 0px"
});

const BuildWrapper = styled(Box)({
    width: "775px",
    backgroundColor: "rgba(255, 255, 255, .35)",
    boxShadow: "0 0 30px rgba(0, 0, 0, .35)",
    marginTop: "200px",
    position: "relative",
    fontSize: "2.2em",
    color: "white"
});

const Build = styled(Box)({
    width: "675px",
    margin: "50px"
});

const BuildHeader = styled(Box)({
    position: "relative"
});

const BuildArt = styled("img")({
    width: "375px",
    position: "absolute",
    top: "-290px",
    right: "0px",
    filter: "drop-shadow(0px 0px 15px rgba(0, 0, 0, 0.35))"
});

const BuildItemArt = styled("img")({
    width: "175px",
    position: "absolute",
    top: "-75px",
    right: "0px",
    filter: "drop-shadow(0px 0px 15px rgba(0, 0, 0, 0.35))"
});

const BuildTypes = styled(Stack)({
    
});

const BuildTypeIcon = styled("img")({
    height: "100px",
    margin: "0px 20px 10px 0px",
    filter: "drop-shadow(0px 0px 15px rgba(0, 0, 0, 0.65))"
});

const BuildRole = styled(Typography)({
    height: "85px",
    color: "white",
    fontSize: "2.8em",
    margin: "0px"
});

const BuildHeaderSeparator = styled("hr")({
    border: "4px solid rgba(255, 255, 255, .35)",
    margin: "30px 0px"
});

const BuildInfoContainer = styled(Stack)({
    height: "430px",
});

const BuildInfo = styled(Typography)({
    fontSize: "1.8em",
    height: "55px",
    lineHeight: "55px",
    margin: "8px 0px",
    paddingLeft: "1em",
    textIndent: "-1em"
});

const BuildMovesSection = styled(Box)({
    marginTop: "50px"
});

const MovesHeader = styled(Typography)({
    color: "white",
    fontSize: "2.25em",
    margin: "0px"
});

const MovesContainer = styled(Stack)({

});

const MoveBox = styled(Box)({
    height: "100px",
    lineHeight: "60px",
    backgroundColor: "rgba(255, 255, 255, .25)",
    marginTop: "15px",
    padding: "0px",
    display: "flex",
    alignItems: "center",
    fontSize: "1.4em",
    position: "relative"
});

const MoveTypeIcon = styled("img")({
    height: "80px",
    padding: "0px 20px"
});

const MoveLabel = styled(Typography)({
    height: "100px",
    lineHeight: "100px",
    fontSize: "1.3em"
});

const MoveLearnMethodIcon = styled("img")({
    height: "80px",
    position: "absolute",
    right: "20px"
});

const ExecutionSection = styled(Box)({

});

function generateGraphic(theme: any, raidInputProps: RaidInputProps, backgroundImageURL: string, title?: string, subtitle?: string, notes?: string, credits?: string) {
    console.log("loaded Image", backgroundImageURL)
    const graphicTop = document.createElement('graphic_top');
    graphicTop.setAttribute("style", "width: 3600px");
    const root = createRoot(graphicTop);

    flushSync(() => {
        root.render(
            <ThemeProvider theme={graphicsTheme}>
                <GraphicsContainer 
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, .7), rgba(0, 0, 0, .7)), url(${backgroundImageURL})`,
                    }} 
                >
                    <Header>
                        <BossWrapper>
                            {/* <BossTera src={getTeraTypeIconURL(raidInputProps.pokemon[0].teraType || "inactive")}></BossTera> */}
                            <Boss src={getPokemonArtURL(raidInputProps.pokemon[0].species.id)} />
                            {/* Need to figure out how to show the tera type nicely */}
                        </BossWrapper>
                        <Title>{title}</Title>
                        {/* <Subtitle>Created by: {credits}</Subtitle> */}
                        <Subtitle>{subtitle}</Subtitle>
                    </Header>
                    <BuildsSection>
                        <Separator>
                            <LeftBar />
                            <SeparatorLabel>The Crew</SeparatorLabel>
                            <RightBar />
                        </Separator> 
                    <BuildsContainer>    
                            {
                                raidInputProps.pokemon.slice(1, 5).map((raider, index) => (
                                    <BuildWrapper key={index}>
                                        <Build>
                                            <BuildHeader>
                                                <BuildArt src={getPokemonArtURL(raider.species.id)}/>
                                                {raider.item ? 
                                                    <BuildItemArt src={getItemSpriteURL(raider.item)} /> : null}
                                                <BuildTypes direction="row">
                                                    {raider.types.map((type, index) => (
                                                        <BuildTypeIcon key={index} src={getTypeIconURL(type)}/>
                                                    ))}
                                                </BuildTypes>
                                                <BuildRole>{raider.role}</BuildRole>
                                                <BuildHeaderSeparator />
                                            </BuildHeader>
                                            <BuildInfoContainer>
                                                <BuildInfo>Level: {raider.level}</BuildInfo>
                                                {raider.item ?
                                                    <BuildInfo>Item: {raider.item}</BuildInfo> : null}
                                                {raider.ability !== "(No Ability)" ?
                                                    <BuildInfo>Ability: {raider.ability}</BuildInfo> : null}
                                                <BuildInfo>Nature: {raider.nature}</BuildInfo>
                                                {getEVDescription(raider.evs) ? 
                                                    <BuildInfo>EVs: {getEVDescription(raider.evs)}</BuildInfo> : null}
                                                {getIVDescription(raider.ivs) ? 
                                                    <BuildInfo>IVs: {getIVDescription(raider.ivs)}</BuildInfo> : null}
                                            </BuildInfoContainer>
                                            <BuildMovesSection>
                                                <MovesHeader>Moves:</MovesHeader>
                                                <MovesContainer>
                                                    {
                                                        [...Array(4)].map((val, index) => (
                                                            <MoveBox key={"move_box_" + index}>
                                                                {raider.moves[index] ? <MoveTypeIcon src={getTypeIconURL("normal")} /> : null}
                                                                {raider.moves[index] ? <MoveLabel>{raider.moves[index]}</MoveLabel> : null}
                                                                {raider.moves[index] ? <MoveLearnMethodIcon src={getMoveMethodIconURL("egg")} /> : null}
                                                            </MoveBox>
                                                        ))
                                                    }
                                                </MovesContainer>
                                            </BuildMovesSection>
                                        </Build>
                                    </BuildWrapper>
                                ))
                            }
                        </BuildsContainer>
                    </BuildsSection>
                    <ExecutionSection>
                        <Separator>
                            <LeftBar />
                            <SeparatorLabel>Execution</SeparatorLabel>
                            <RightBar />
                        </Separator> 
                    </ExecutionSection>
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
    const loadedImageURLRef = useRef<string>(getPokemonArtURL("wo-chien"));
    const [subtitle, setSubtitle] = useState<string>("");

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const imageFile = (e.target.files || [null])[0];
        const imageFileURL = imageFile ? URL.createObjectURL(imageFile) : getPokemonArtURL("wo-chien");
        loadedImageURLRef.current = imageFileURL;
    };

    const handleDownload = () => {
        try {
            const graphicTop = generateGraphic(theme, raidInputProps, loadedImageURLRef.current, title, subtitle, notes, credits);
            saveGraphic(graphicTop, title);
        } catch (e) {
            console.log(e)
        }
    };
    
    return (
        <Box>
            <Button 
                variant="outlined"
                onClick={handleClick}
            >
                Download Graphic
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
            >
                <MenuItem>
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="graphic-button-file"
                        type="file"
                        onChange={handleFileInputChange}
                    />
                    <label htmlFor="graphic-button-file">
                        <Button
                            variant="outlined"
                            component="span"
                        >
                            Choose Background
                        </Button>
                    </label>
                </MenuItem>
                <MenuItem>
                    <TextField 
                        variant="outlined"
                        placeholder="Subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                    />
                </MenuItem>
                <MenuItem>
                  <Button
                    variant="outlined"
                    onClick={handleDownload}
                    endIcon={<DownloadIcon />}
                  >
                    Dowload
                  </Button>
                </MenuItem>
            </Menu>
        </Box>

    );
};

export default GraphicsButton;