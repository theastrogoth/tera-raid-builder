import React, { useState, useRef } from "react";

import Box from '@mui/material/Box';

import { Move } from "../calc";
import { TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, getMoveMethodIconURL, getEVDescription, getIVDescription, getPokemonSpriteURL, getMiscImageURL } from "../utils";
import { RaidMoveInfo } from "../raidcalc/interface";
import { getGroupedTurnIDs } from "../raidcalc/util";
import { RaidInputProps } from "../raidcalc/inputs";
import { PokedexService, PokemonData } from "../services/getdata"


import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles"

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider } from "@emotion/react";
import { useTheme } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
  
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DownloadIcon from '@mui/icons-material/Download';
import { RaidBattleResults } from "../raidcalc/RaidBattle";

const graphicsTheme = createTheme({
    typography: {
         fontFamily: ['Poppins', "sans-serif"].join(','),
    },
    palette: {
        //@ts-ignore
        group0: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #ff5789aa 0%, #ffa77aaa 50%, #ffee82aa 100%)"
        },
        //@ts-ignore
        group1: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #d1e332aa 0%, #5ce681aa 50%, #30bce3aa 100%);"
        },
        //@ts-ignore
        group2: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #75baffaa 0%, #ae82ffaa 50%, #ff9cd2aa 100%);"
        },
        //@ts-ignore
        group3: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #e9d18daa 0%, #f6c5dbaa 50%, #8e5788aa 100%);",
        },
        //@ts-ignore
        group4: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #5c5c5caa 0%, #949494aa 50%, #e0e0e0aa 100%);",
        },
        //@ts-ignore
        group5: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #ff5599aa 0%, #cd8ba7aa 50%, #6bdcd3aa 100%);",
        },
        //@ts-ignore
        group6: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #c47efaaa 0%, #96a8d2aa 50%, #c99981aa 100%);",
        },
        //@ts-ignore
        group7: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #44ebd4aa 0%, #73b4ffaa 50%, #a88af2aa 100%);",
        },
        //@ts-ignore
        group8: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #ebdb73aa 0%, #e6bbedaa 50%, #06a3f0aa 100%);",
        },
        //@ts-ignore
        group9: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #ff8b6baa 0%, #fff78caa 50%, #96ff94aa 100%);",
        },
        //@ts-ignore
        group10: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #dca1ffaa 0%, #ffa8baaa 50%, #ff9b80aa 100%);",
        },
        //@ts-ignore
        group11: {
            main: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(135deg, #1BB0BDaa 0%, #42C6B9aa 50%, #b1dfc0aa 100%);",
        },
    }
});

const GraphicsContainer = styled(Box)({
    width: "3600px",
    backgroundImage: `linear-gradient(rgba(0, 0, 0, .7), rgba(0, 0, 0, .7)), url(${getMiscImageURL("default")})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontKerning: "auto",
    textShadow: "0px 0px 15px rgba(0, 0, 0, .35)",
    paddingBottom: "1px"
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
    lineHeight: "55px",
    margin: "4px 0px",
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

const ExecutionContainer = styled(Stack)({
    width: "auto",
    justifyContent: "space-between",
    margin: "100px",
    position: "relative",
    fontSize: "2.2em",
    color: "white"
});

const ExecutionTable = styled("table")({
    width: "100%",
    padding: "25px 0px",
    backgroundColor: "rgba(255, 255, 255, .35)",
});

const ExecutionRow = styled("tr")({

});

const ExecutionGroup = styled(Box)({
    margin: "25px 50px",
    padding: "0px 50px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
});

const ExecutionMoveNumber = styled(Typography)({
    height: "125px",
    width: "125px",
    lineHeight: "125px",
    fontSize: "4.5em",
    textAlign: "center"
});

const ExecutionMoveContainer = styled(Box)({
    height: "100%",
    width: "90%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly"
});

const ExecutionMove = styled(Box)({
    height: "100px",
    color: "black",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
});

const ExecutionMovePokemonWrapper = styled(Box)({
    height: "100px",
    width: "750px",
    backgroundColor: "rgba(255, 255, 255, .35)",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
});
const ExecutionMovePokemonWrapperEmpty = styled(Box)({
    height: "100px",
    width: "750px",
});

const ExecutionMovePokemonName = styled(Typography)({
    color: "white",
    fontSize: "1.8em",
    overflow: "hidden",
    whiteSpace: "nowrap",
    padding: "0px 50px"
});

const ExecutionMovePokemonIcon = styled("img")({
    height: "auto",
    width: "auto",
    maxHeight: "140px",
    maxWidth: "140px",
});

const ExecutionMovePokemonIconWrapper = styled(Box)({
    height: "140px",
    width: "140px",
    marginRight: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

const ExecutionMoveTag = styled(Typography)({
    height: "100px",
    width: "300px",
    color: "white",
    fontSize: "1.8em",
    textAlign: "center",
    lineHeight: "100px",
    overflow: "hidden",
    whiteSpace: "nowrap",
});

const ExecutionMoveAction = styled(Typography)({
    height: "100px",
    width: "650px",
    color: "white",
    fontSize: "1.8em",
    textAlign: "center",
    lineHeight: "100px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    backgroundColor: "rgba(255, 255, 255, .35)",
});

const InfoSection = styled(Box)({
    width: "auto",
    justifyContent: "space-between",
    margin: "100px",
    padding: "50px",
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, .35)",
});

const Notes = styled(Typography)({
    fontSize: "4.2em",
    color: "white",
    marginBottom: "50px"
});

const CreditsContainer = styled(Box)({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
});

const Credit = styled(Typography)({
    fontSize: "4.5em",
    color: "white"
});

function getMoveMethodIcon(moveMethod: string, moveType: TypeName) {
    switch (moveMethod) {
        case "egg":
            return getMoveMethodIconURL("egg");
        case "machine":
            return getMoveMethodIconURL(moveType);
        default:
            return undefined;
    }
}

function getMoveGroups(results: RaidBattleResults) {
    const turns = results.turnResults;
    const displayGroups = getGroupedTurnIDs(turns);

    const moveGroups = displayGroups.map(group => 
        group.map((id) => { return {move: turns[id]!.raiderMoveUsed, info: turns[id]!.moveInfo} })
    );
    return moveGroups;
}

function generateGraphic(theme: any, raidInputProps: RaidInputProps, learnMethods: string[][], moveTypes: TypeName[][], moveGroups: {move: string, info: RaidMoveInfo}[][], backgroundImageURL: string, title?: string, subtitle?: string, notes?: string, credits?: string) {
    const graphicTop = document.createElement('graphic_top');
    graphicTop.setAttribute("style", "width: 3600px");
    const root = createRoot(graphicTop);
    
    flushSync(() => {
        root.render(
            <ThemeProvider theme={graphicsTheme}>
                <GraphicsContainer 
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, .8), rgba(0, 0, 0, .8)), url(${backgroundImageURL})`,
                    }} 
                >
                    <Header>
                        <BossWrapper>
                            {/* <BossTera src={getTeraTypeIconURL(raidInputProps.pokemon[0].teraType || "inactive")}></BossTera> */}
                            <Boss src={getPokemonArtURL(raidInputProps.pokemon[0].species.name)} />
                            {/* Need to figure out how to show the tera type nicely */}
                        </BossWrapper>
                        <Title>{title ? title : "Untitled"}</Title>
                        <Subtitle>{subtitle ? subtitle : (credits ? `By: ${credits}` : `A Strategy For A ${raidInputProps.pokemon[0].species.name} Tera Raid Battle`)}</Subtitle>
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
                                                <BuildArt src={getPokemonArtURL(raider.species.name)}/>
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
                                                                {raider.moves[index] ? <MoveTypeIcon src={getTypeIconURL(moveTypes[raider.id][index])} /> : null}
                                                                {raider.moves[index] ? <MoveLabel>{raider.moves[index]}</MoveLabel> : null}
                                                                {raider.moves[index] ? <MoveLearnMethodIcon src={getMoveMethodIcon(learnMethods[raider.id][index], moveTypes[raider.id][index])} /> : null}
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
                        <ExecutionContainer direction="row">
                            <ExecutionTable>
                                {
                                    moveGroups.map((moveGroup, index) => (
                                        <ExecutionRow key={index}>
                                            <ExecutionGroup sx={{
                                                //@ts-ignore
                                                background: graphicsTheme.palette["group"+(index.toString() % 12)].main,
                                                height: (175*moveGroup.length).toString() + "px"
                                            }}>
                                                <ExecutionMoveNumber>{index + 1}</ExecutionMoveNumber>
                                                <ExecutionMoveContainer>
                                                    {
                                                        moveGroup.map((move, moveIndex) => (
                                                            <ExecutionMove key={moveIndex}>
                                                                <ExecutionMovePokemonWrapper>
                                                                    <ExecutionMovePokemonName>{raidInputProps.pokemon[move.info.userID].role}</ExecutionMovePokemonName>
                                                                    <ExecutionMovePokemonIconWrapper>
                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[move.info.userID].species.name)} />
                                                                    </ExecutionMovePokemonIconWrapper>
                                                                </ExecutionMovePokemonWrapper>
                                                                <ExecutionMoveTag>uses</ExecutionMoveTag>
                                                                <ExecutionMoveAction>{move.move}</ExecutionMoveAction>
                                                                <ExecutionMoveTag>{!["user", "user-and-allies", "all-pokemon", "all-other-pokemon", " entire-field"].includes(move.info.moveData.target!)? "on": ""}</ExecutionMoveTag>
                                                                {!["user", "user-and-allies", "all-pokemon", "all-other-pokemon", " entire-field"].includes(move.info.moveData.target!) ?
                                                                    <ExecutionMovePokemonWrapper>
                                                                        <ExecutionMovePokemonName>{raidInputProps.pokemon[move.info.targetID].role}</ExecutionMovePokemonName>
                                                                        <ExecutionMovePokemonIconWrapper>
                                                                            <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[move.info.targetID].species.name)} />
                                                                        </ExecutionMovePokemonIconWrapper>
                                                                    </ExecutionMovePokemonWrapper>
                                                                    :
                                                                    <ExecutionMovePokemonWrapperEmpty />
                                                                }
                                                            </ExecutionMove>
                                                        ))
                                                    }
                                                </ExecutionMoveContainer>
                                            </ExecutionGroup>
                                        </ExecutionRow>
                                    ))
                                }
                            </ExecutionTable>
                        </ExecutionContainer>
                    </ExecutionSection>
                    <InfoSection>
                        {notes && <Notes>{notes}</Notes>}
                        <CreditsContainer>
                            <Credit>Credits: {credits}</Credit>
                            <Credit>Graphic: theastrogoth.github.io/tera-raid-builder/</Credit>
                        </CreditsContainer>
                    </InfoSection>
                </GraphicsContainer> 
            </ThemeProvider>     
        );
    });
    
    document.body.appendChild(graphicTop); // this makes the element findable for html2canvas
    return graphicTop;
}

function saveGraphic(graphicTop: HTMLElement, title: string) {
    html2canvas(graphicTop, {
        allowTaint: true, 
        useCORS: true,
        windowWidth: 3600,
        scale: 1,
        imageTimeout: 15000,
    }).then((canvas) => {
    //   canvas.toBlob((blob) => {
    //       if (blob) {
    //           saveAs(blob, title + '.png');
    //       } else {
    //           saveAs(getMiscImageURL("failure"), "failed_generation.png");
    //       }
    //   });
        const graphicUrl = canvas.toDataURL("image/png");
        saveAs(graphicUrl, title + '.png');
    });
    graphicTop.remove(); // remove the element from the DOM
}

function GraphicsButton({title, notes, credits, raidInputProps, results}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, results: RaidBattleResults, }) {

    const theme = useTheme();
    const loadedImageURLRef = useRef<string>(getMiscImageURL("default"));
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
        const imageFileURL = imageFile ? URL.createObjectURL(imageFile) : getMiscImageURL("default");
        loadedImageURLRef.current = imageFileURL;
    };

    const handleDownload = async () => {
        try {
            // get learn method + types for moves (maybe we should be storing these somewhere instead of fetching them in several places)
            const pokemonData = (await Promise.all(
                raidInputProps.pokemon.map((poke) => PokedexService.getPokemonByName(poke.name))
            )).filter((data) => data !== undefined) as PokemonData[];
            console.log(pokemonData)
            const moves = raidInputProps.pokemon.map((poke) => poke.moves.filter((move) => move !== undefined).map((move) => new Move(9, move)));
            const learnMethods = moves.map((ms, index) => 
                ms.map((move) => 
                    {
                        const m = pokemonData[index].moves.find((moveData) => moveData.name === move.name);
                        return m ? m.learnMethod : "level-up";
                    }
                )
            );
            const moveTypes = moves.map((ms) => ms.map((move) => move.type));
            // sort moves into groups
            const moveGroups = getMoveGroups(results);
            // generate graphic
            const graphicTop = generateGraphic(theme, raidInputProps, learnMethods, moveTypes, moveGroups, loadedImageURLRef.current, title, subtitle, notes, credits);
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
                    onClick={() => { handleDownload(); handleClose(); }}
                    endIcon={<DownloadIcon />}
                  >
                    Download
                  </Button>
                </MenuItem>
            </Menu>
        </Box>

    );
};

export default GraphicsButton;