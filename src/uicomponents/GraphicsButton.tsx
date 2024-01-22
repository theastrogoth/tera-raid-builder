import React, { useState, useRef } from "react";

import Box from '@mui/material/Box';

import { Generations, Move, toID } from "../calc";
import { SpeciesName, TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, getMoveMethodIconURL, getReadableGender, getEVDescription, getIVDescription, getPokemonSpriteURL, getMiscImageURL, getTeraTypeBannerURL, getTranslation, sortGroupsIntoTurns, getTurnNumbersFromGroups } from "../utils";
import { RaidMoveInfo, TurnGroupInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { PokedexService, PokemonData } from "../services/getdata"

import html2canvas from 'html2canvas';
//@ts-ignore
import watermark from "watermarkjs";
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { Checkbox, TextField } from "@mui/material";
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
import { getStatRadarPlotPNG } from "./StatRadarPlot";

const gen = Generations.get(9); // we only use gen 9

const graphicsTheme = createTheme({
    typography: {
         fontFamily: ['Poppins', "sans-serif"].join(','),
    },
    palette: {
        //@ts-ignore
        group0: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #ff578990 0%, #ffa77a90 50%, #ffee8290 100%)"
        },
        //@ts-ignore
        group1: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #d1e33290 0%, #5ce68190 50%, #30bce390 100%);"
        },
        //@ts-ignore
        group2: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #75baff90 0%, #ae82ff90 50%, #ff9cd290 100%);"
        },
        //@ts-ignore
        group3: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #e9d18d90 0%, #f6c5db90 50%, #8e578890 100%);",
        },
        //@ts-ignore
        group4: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #5c5c5c90 0%, #94949490 50%, #e0e0e090 100%);",
        },
        //@ts-ignore
        group5: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #ff559990 0%, #cd8ba790 50%, #6bdcd390 100%);",
        },
        //@ts-ignore
        group6: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #c47efa90 0%, #96a8d290 50%, #c9998190 100%);",
        },
        //@ts-ignore
        group7: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #44ebd490 0%, #73b4ff90 50%, #a88af290 100%);",
        },
        //@ts-ignore
        group8: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #ebdb7390 0%, #e6bbed90 50%, #06a3f090 100%);",
        },
        //@ts-ignore
        group9: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #ff8b6b90 0%, #fff78c90 50%, #96ff9490 100%);",
        },
        //@ts-ignore
        group10: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #dca1ff90 0%, #ffa8ba90 50%, #ff9b8090 100%);",
        },
        //@ts-ignore
        group11: {
            main: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), linear-gradient(135deg, #1BB0BD90 0%, #42C6B990 50%, #b1dfc090 100%);",
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
    height: "550px",
    width: "550px",
    position: "absolute",
    right: "100px",
    top: "50px",
    display: "flex",
    justifyContent: "center"
});

const Boss = styled("img")({
    height: "100%",
    position: "absolute",
    right: "0px",
});

const BossTera = styled("img")({
    width: "100%",
    position: "absolute",
    bottom: "0px",
    alignSelf: "center",
    transform: "translate(0px, -50px)"
});

const Title = styled(Typography)({
    // height: "250px",
    // lineHeight: "250px",
    maxWidth: "2800px",
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

const Build = styled(Stack)({
    width: "675px",
    margin: "50px",
    paddingBottom: "100px",
    height: "100%"
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

const BuildTeraIcon = styled("img")({
    position: "absolute",
    transform: "translate(20px, -160px)",
    height: "180px",
    width: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: "430px",
});

const BuildInfo = styled(Typography)({
    fontSize: "1.8em",
    lineHeight: "55px",
    margin: "4px 0px",
    paddingLeft: "1em",
    textIndent: "-1em"
});

const AbilityPatchIcon = styled("img")({
    height: "55px",
    margin: "0px 0px 0px 20px",
    filter: "drop-shadow(0px 0px 15px rgba(0, 0, 0, 0.65))"
});

const StatPlotContainer = styled(Box)({
    width: "auto",
    height: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0px 0px"
});

const StatPlot = styled("img")({
    height: "625px",
    width: "750px",
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

const OptionalMoveLabel = styled(Typography)({
    color: "white",
    opacity: "50%",
    height: "100px",
    lineHeight: "100px",
    fontSize: "1.3em",
    fontStyle: "italic"
});

const MoveLearnMethodIcon = styled("img")({
    height: "80px",
    position: "absolute",
    right: "20px"
});

const FootnoteContainer = styled(Box)({
    width: "auto",
    display: "flex",
    justifyContent: "right",
    padding: "0px 100px",
    margin: "30px 0px"
});

const FootnoteText = styled(Typography)({
    color: "white",
    fontSize: "4em",
    whiteSpace: "nowrap",
    fontStyle: "italic"
});

const ExecutionSection = styled(Box)({

});

const ExecutionContainer = styled(Stack)({
    width: "auto",
    justifyContent: "space-between",
    marginLeft: "100px",
    marginRight: "100px",
    marginTop: "50px",
    marginBottom: "50px",
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

const ExecutionTurnLabelContainer = styled(Box)({
    width: "auto",
    justifyContent: "center",
    // marginLeft: "100px",
});

const ExecutionTurnLabel = styled(Typography)({
    color: "white",
    fontSize: "3em",
    margin: "0px",
    textAlign: "center",
    width: "100%"
});

const ExecutionMoveNumber = styled(Typography)({
    height: "125px",
    width: "125px",
    lineHeight: "125px",
    fontSize: "3em",
    textAlign: "center"
});

const ExecutionRepeatNumber = styled(Typography)({
    height: "125px",
    width: "125px",
    lineHeight: "125px",
    fontSize: "4.5em",
    textAlign: "left",
    transform: "translate(-25px, 0px)"
});

const ExecutionMoveContainer = styled(Box)({
    height: "100%",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly"
});

const ExecutionMove = styled(Box)({
    height: "90px",
    color: "black",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
});

const ExecutionMovePokemonWrapper = styled(Box)({
    height: "90px",
    width: "750px",
    backgroundColor: "rgba(255, 255, 255, .35)",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
});
const ExecutionMovePokemonWrapperShifted = styled(Box)({
    height: "90px",
    width: "750px",
    backgroundColor: "rgba(255, 255, 255, .35)",
    position: "absolute",
    transform: "translate(0px, -80px)",
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
    fontSize: "1.7em",
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

const ExecutionMovePokemonIconWrapper = styled(Stack)({
    height: "140px",
    width: "140px",
    marginRight: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

const ExecutionMoveTeraIcon = styled("img")({
    height: "auto",
    width: "auto",
    maxHeight: "140px",
    maxWidth: "140px",
    margin: "0px 20px"
});

const ExecutionMoveTeraIconWrapper = styled(Box)({
    height: "140px",
    width: "140px",
    margin: "0px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

const ExecutionMoveTag = styled(Typography)({
    height: "90px",
    width: "300px",
    color: "white",
    fontSize: "1.7em",
    textAlign: "center",
    lineHeight: "100px",
    overflow: "hidden",
    whiteSpace: "nowrap",
});

const ExecutionMoveTagShiftedContainer = styled(Box)({
    position: "absolute",
    transform: "translate(740px, -80px)",
    height: "100px",
    width: "300px",
});

const ExecutionMoveAction = styled(Typography)({
    height: "90px",
    width: "650px",
    color: "white",
    fontSize: "1.7em",
    textAlign: "center",
    lineHeight: "100px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    backgroundColor: "rgba(255, 255, 255, .35)",
});

const ExecutionMoveActionWrapper = styled(Box)({
    height: "90px",
    // width: "750px",
    width: "650px",
    backgroundColor: "rgba(255, 255, 255, .35)",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
});

const NotesSection = styled(Box)({

});

const NotesContainer = styled(Box)({
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
    whiteSpace: "pre-wrap",
});

const InfoSection = styled(Box)({
    width: "auto",
    justifyContent: "space-between",
    margin: "100px",
    padding: "50px",
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, .35)",
});

const CreditsContainer = styled(Box)({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
});

const Credit = styled(Typography)({
    fontSize: "4.5em",
    color: "white",
    whiteSpace: "pre-wrap",
});

const PPTLogo = styled("img")({
    height: "325px",
    position: "absolute",
    bottom: "-50px",
    left: "950px"
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

// TODO: move this to a more appropriate place (also used in MoveDisplay)
function getTurnGroups(groups: TurnGroupInfo[], results: RaidBattleResults): [{id: number, move: string, info: RaidMoveInfo, isSpread: boolean, repeats: number, teraActivated: boolean}[][][], number[]] {
    const [turnGroups, turnNumbers] = sortGroupsIntoTurns(getTurnNumbersFromGroups(groups), groups);
    const preparedTurnGroups = turnGroups.map(groups => groups.map((group, groupIndex) => 
        group.turns.map((t) => { 
            const turnResult = results.turnResults.find((r) => t.id === r.id)!;
            let move = turnResult.raiderMoveUsed;
            const wait = move === "(No Move)" && turnResult.bossMoveUsed === "(No Move)";
            const info = wait ? {...turnResult.moveInfo, moveData: {name: "Waits"}} as RaidMoveInfo : move === "(No Move)" ? turnResult.bossMoveInfo : turnResult.moveInfo;
            const isSpread = !!((move === "(No Move)") && (
                turnResult.results[0].isSpread || turnResult.results[1].isSpread
            ))
            move = wait ? "Waits" : move === "(No Move)" ? turnResult.bossMoveUsed : move;
            return {
                id: t.id,
                move,
                info,
                isSpread,
                repeats: group.repeats || 1,
                teraActivated: !wait && !!(turnResult!.moveInfo.options!.activateTera && 
                                turnResult.flags[turnResult.moveInfo.userID].includes("Tera activated"))
            } 
        })
    ));
    return [preparedTurnGroups, turnNumbers];
}

function generateGraphic(theme: any, raidInputProps: RaidInputProps, results: RaidBattleResults, isHiddenAbility: boolean[], learnMethods: string[][], moveTypes: TypeName[][], optionalMove: boolean[][], turnGroups: {id: number, move: string, info: RaidMoveInfo, isSpread: boolean, repeats: number, teraActivated: boolean}[][][], turnNumbers: number[], backgroundImageURL: string, title?: string, subtitle?: string, notes?: string, credits?: string, statplots?: (string | undefined)[], translationKey?: any) {
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
                            <Boss src={getPokemonArtURL(raidInputProps.pokemon[0].species.name, raidInputProps.pokemon[0].shiny)} />
                            <BossTera src={getTeraTypeBannerURL(raidInputProps.pokemon[0].teraType || "blank")}></BossTera>
                        </BossWrapper>
                        <Title>{title ? (title.endsWith("!PPT") ? title.slice(0, -4) : title) : "Untitled"}</Title>
                        <Subtitle>{subtitle ? subtitle : `A Strategy For ${['a', 'e', 'i', 'o', 'u'].includes(raidInputProps.pokemon[0].species.name.toLowerCase().charAt(0)) ? "An" : "A"} ${raidInputProps.pokemon[0].species.name} Tera Raid Battle`}</Subtitle>
                    </Header>
                    <BuildsSection>
                        <Separator>
                            <LeftBar />
                            <SeparatorLabel>{ !translationKey ? "The Crew" : getTranslation("Pokémon", translationKey) }</SeparatorLabel>
                            <RightBar />
                        </Separator> 
                        <BuildsContainer>    
                            {
                                raidInputProps.pokemon.slice(1, 5).map((raider, index) => (
                                    <BuildWrapper key={index}>
                                        <Build>
                                            <BuildHeader>
                                                <BuildArt src={getPokemonArtURL(raider.species.name, raider.shiny)}/>
                                                {raider.item ? 
                                                    <BuildItemArt src={getItemSpriteURL(raider.item)} /> : null}
                                                {(raider.teraType || "???") !== "???" ?
                                                    <BuildTeraIcon src={getTeraTypeIconURL(raider.teraType!)} /> : null}
                                                <BuildTypes direction="row">
                                                    {raider.types.map((type, index) => (
                                                        <BuildTypeIcon key={index} src={getTypeIconURL(type)}/>
                                                    ))}
                                                    {raider.types.length === 1 && <BuildTypeIcon key={1} src={getTypeIconURL("none")}/>}
                                                </BuildTypes>
                                                <BuildRole>{raider.role}</BuildRole>
                                                <BuildHeaderSeparator />
                                            </BuildHeader>
                                            <BuildInfoContainer>
                                                <BuildInfo>{ getTranslation("Level", translationKey) + ": " + (raider.level === 13 ? getTranslation("Any",translationKey) : raider.level) }</BuildInfo>
                                                {(raider.teraType || "???") !== "???" &&
                                                    <BuildInfo>{ getTranslation("Tera Type", translationKey) + ": " + getTranslation(raider.teraType!, translationKey, "types") }</BuildInfo>
                                                }
                                                {raider.item ?
                                                    <BuildInfo>{ getTranslation("Item", translationKey) + ": " + getTranslation(raider.item, translationKey, "items")}</BuildInfo> : null}
                                                {!!raider.ability && raider.ability !== "(No Ability)" ? 
                                                <Stack direction="row">
                                                    <BuildInfo>{ getTranslation("Ability", translationKey) + ": " + getTranslation(raider.ability, translationKey, "abilities") }</BuildInfo>
                                                    {isHiddenAbility[index] ? 
                                                        <AbilityPatchIcon src={getMoveMethodIconURL("ability_patch")} /> 
                                                        : null
                                                    }
                                                </Stack> : null}
                                                {raider.gender && raider.gender !== "N" &&
                                                    <BuildInfo>{ getTranslation("Gender", translationKey) + ": " + getTranslation(getReadableGender(raider.gender), translationKey) }</BuildInfo>
                                                }
                                                <BuildInfo>{ getTranslation("Nature", translationKey) + ": " + (raider.nature === "Hardy" ? getTranslation("Any", translationKey) : getTranslation(raider.nature, translationKey, "natures")) }</BuildInfo>
                                                {getEVDescription(raider.evs, translationKey) ? 
                                                    <BuildInfo>{ getTranslation("EVs", translationKey) + ": " + getEVDescription(raider.evs, translationKey)}</BuildInfo> : null}
                                                {getIVDescription(raider.ivs, translationKey) ? 
                                                    <BuildInfo>{ getTranslation("IVs", translationKey) + ": " + getIVDescription(raider.ivs, translationKey)}</BuildInfo> : null}
                                            </BuildInfoContainer>
                                            <Box flexGrow={1}/>
                                            { statplots && 
                                                <StatPlotContainer>
                                                    <StatPlot src={statplots[index]} />
                                                </StatPlotContainer>
                                            }
                                            <BuildMovesSection>
                                                <MovesHeader>{ getTranslation("Moves", translationKey) + ":" }</MovesHeader>
                                                <MovesContainer>
                                                    {
                                                        [...Array(4)].map((val, index) => {
                                                            const noMove = (raider.moves[index] && raider.moves[index] !== "(No Move)");
                                                            return (
                                                                <MoveBox key={"move_box_" + index}>
                                                                    {noMove ? <MoveTypeIcon src={getTypeIconURL(moveTypes[raider.id][index])} sx={{opacity: `${optionalMove[raider.id][index] ? '50%' : '100%'}`}}/> : null}
                                                                    {noMove ? (
                                                                        optionalMove[raider.id][index] ? 
                                                                            <OptionalMoveLabel>{ getTranslation(raider.moves[index] + "*", translationKey, "moves") }</OptionalMoveLabel> : 
                                                                            <MoveLabel>{ getTranslation(raider.moves[index], translationKey, "moves") }</MoveLabel>
                                                                    ) : null}
                                                                    {noMove ? <MoveLearnMethodIcon src={getMoveMethodIcon(learnMethods[raider.id][index], moveTypes[raider.id][index])} sx={{opacity: `${optionalMove[raider.id][index] ? '50%' : '100%'}`}}/> : null}
                                                                </MoveBox>
                                                            )
                                                        })
                                                    }
                                                </MovesContainer>
                                            </BuildMovesSection>
                                        </Build>
                                    </BuildWrapper>
                                ))
                            }
                        </BuildsContainer>
                        {(optionalMove.reduce((a,b) => a + b.reduce((c,d) => c + (d ? 1 : 0), 0), 0) > 0) &&
                            <FootnoteContainer>
                                <FootnoteText>
                                    * {getTranslation("Optional Moves", translationKey)}
                                </FootnoteText>
                            </FootnoteContainer>
                        }
                    </BuildsSection>
                    <ExecutionSection>
                        <Separator>
                            <LeftBar />
                            <SeparatorLabel>{!translationKey ? "Execution" : getTranslation("Moves", translationKey)}</SeparatorLabel>
                            <RightBar />
                        </Separator> 
                        { turnGroups.map((moveGroups, turnIndex) => (
                            <ExecutionContainer direction="row">
                                <ExecutionTable>
                                    {(turnNumbers[turnIndex] !== 0) && (
                                        <ExecutionTurnLabelContainer>
                                            <ExecutionTurnLabel>{getTranslation("Turn", translationKey) + " " + turnNumbers[turnIndex]}</ExecutionTurnLabel>
                                        </ExecutionTurnLabelContainer>
                                        )
                                    }
                                    {
                                        moveGroups.map((moveGroup, index) => (
                                            moveGroup.length > 0 ? (
                                                <ExecutionRow key={index}>
                                                    <ExecutionGroup sx={{
                                                        //@ts-ignore
                                                        background: graphicsTheme.palette["group"+(((index + turnGroups.slice(0, turnIndex).reduce((a,b) => a + b.length, 0)).toString()) % 12)].main,
                                                        height: (160*(moveGroup.length + moveGroup.reduce((a,b) => (b.teraActivated ? 1 : 0) + a, 0))).toString() + "px"
                                                    }}>
                                                        <ExecutionMoveNumber>{moveGroups.length > 1 ? (index + 1) : null}</ExecutionMoveNumber>
                                                        <ExecutionMoveContainer>
                                                            {
                                                                moveGroup.map((move, moveIndex) => { 
                                                                    let showTarget = move.info.userID === 0 ?
                                                                        ( move.isSpread || move.move === "Remove Negative Effects" ) :
                                                                        !["user", "user-and-allies", "all-allies", "users-field", "opponents-field", "entire-field"].includes(move.info.moveData.target!);
                                                                    showTarget = showTarget && (move.move !== "Waits");
                                                                    const turnIndex = results.turnResults.findIndex((t) => t.id === move.id);
                                                                    const turnRaiders = turnIndex > 0 ? results.turnResults[turnIndex-1].state.raiders : results.turnZeroState.raiders;
                                                                    return ([
                                                                    move.teraActivated ? 
                                                                    <ExecutionMove key={moveIndex - 0.5}>
                                                                        <ExecutionMovePokemonWrapperEmpty/>
                                                                        <ExecutionMoveTag>{""}</ExecutionMoveTag>
                                                                        <ExecutionMoveActionWrapper>
                                                                            <ExecutionMoveTeraIconWrapper>
                                                                                <ExecutionMoveTeraIcon src={getTeraTypeIconURL(raidInputProps.pokemon[move.info.userID].teraType!)} />
                                                                            </ExecutionMoveTeraIconWrapper>
                                                                            <ExecutionMoveTag>{getTranslation("Terastallize", translationKey)}</ExecutionMoveTag>
                                                                            <ExecutionMoveTeraIconWrapper>
                                                                                <ExecutionMoveTeraIcon src={getTeraTypeIconURL(raidInputProps.pokemon[move.info.userID].teraType!)} />
                                                                            </ExecutionMoveTeraIconWrapper>
                                                                        </ExecutionMoveActionWrapper>
                                                                        <ExecutionMoveTag>{""}</ExecutionMoveTag>
                                                                        <ExecutionMovePokemonWrapperEmpty />
                                                                    </ExecutionMove>
                                                                    : null,
                                                                    <ExecutionMove key={moveIndex}>
                                                                        {move.teraActivated ?
                                                                        <ExecutionMovePokemonWrapperShifted>
                                                                            <ExecutionMovePokemonName>{raidInputProps.pokemon[move.info.userID].role}</ExecutionMovePokemonName>
                                                                            <ExecutionMovePokemonIconWrapper>
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[move.info.userID].species.name)} />
                                                                            </ExecutionMovePokemonIconWrapper>
                                                                        </ExecutionMovePokemonWrapperShifted> :
                                                                        <ExecutionMovePokemonWrapper>
                                                                            <ExecutionMovePokemonName>{raidInputProps.pokemon[move.info.userID].role}</ExecutionMovePokemonName>
                                                                            <ExecutionMovePokemonIconWrapper>
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[move.info.userID].species.name)} />
                                                                            </ExecutionMovePokemonIconWrapper>
                                                                        </ExecutionMovePokemonWrapper>
                                                                        }
                                                                        {move.teraActivated && <ExecutionMovePokemonWrapperEmpty/>}
                                                                        {(move.teraActivated || move.move === "Waits") ?
                                                                            <ExecutionMoveTag>{""}</ExecutionMoveTag> :
                                                                            <ExecutionMoveTag>{getTranslation("uses", translationKey)}</ExecutionMoveTag>
                                                                        }
                                                                        {move.teraActivated ?
                                                                            <ExecutionMoveTagShiftedContainer>
                                                                                <ExecutionMoveTag>{getTranslation("uses", translationKey)}</ExecutionMoveTag>
                                                                            </ExecutionMoveTagShiftedContainer> :
                                                                            null
                                                                        }
                                                                        <ExecutionMoveAction>{getTranslation(move.move, translationKey, "moves")}</ExecutionMoveAction>
                                                                        <ExecutionMoveTag>{showTarget ? getTranslation("on", translationKey) : ""}</ExecutionMoveTag>
                                                                        {showTarget ?
                                                                            <ExecutionMovePokemonWrapper>
                                                                                <ExecutionMovePokemonName>
                                                                                    {
                                                                                        (move.move === "Clear Boosts / Abilities" || move.isSpread) ? getTranslation("Raiders", translationKey) : 
                                                                                        move.move === "Remove Negative Effects" ? raidInputProps.pokemon[0].role :
                                                                                        raidInputProps.pokemon[move.info.targetID].role
                                                                                    }
                                                                                </ExecutionMovePokemonName>
                                                                                { (move.move !== "Clear Boosts / Abilities" && !move.isSpread) ?
                                                                                    <ExecutionMovePokemonIconWrapper>
                                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[move.move === "Remove Negative Effects" ? 0 : move.info.targetID].species.name)} />
                                                                                    </ExecutionMovePokemonIconWrapper> : 
                                                                                    <ExecutionMovePokemonIconWrapper direction="row" spacing="-50px">
                                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[1].species.name)} />
                                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[2].species.name)} />
                                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[3].species.name)} />
                                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[4].species.name)} />
                                                                                    </ExecutionMovePokemonIconWrapper>

                                                                                }
                                                                            </ExecutionMovePokemonWrapper>
                                                                            :
                                                                            <ExecutionMovePokemonWrapperEmpty />
                                                                        }
                                                                    </ExecutionMove>
                                                                ])}).flat()
                                                            }
                                                        </ExecutionMoveContainer>
                                                        <ExecutionRepeatNumber>{moveGroup[0].repeats > 1 ? "×" + (moveGroup[0].repeats) : ""}</ExecutionRepeatNumber>
                                                        </ExecutionGroup>
                                                </ExecutionRow>
                                            ) : null
                                        ))
                                    }
                                </ExecutionTable>
                            </ExecutionContainer>
                        ))}
                    </ExecutionSection>
                        {notes && 
                            <NotesSection>
                                <Separator>
                                    <LeftBar />
                                        <SeparatorLabel>{ getTranslation("Notes", translationKey) }</SeparatorLabel>
                                        <RightBar />
                                    </Separator> 
                                <NotesContainer>
                                    <Notes>{notes}</Notes>
                                </NotesContainer>
                            </NotesSection>
                        }
                    <InfoSection>
                        <CreditsContainer>
                            <Credit>{ getTranslation("Credits", translationKey) + ": " + credits }</Credit>
                            {title && title.endsWith("!PPT") && <PPTLogo src={getMiscImageURL("PPT_logo")}/>}
                            <Credit>{ getTranslation("Graphic", translationKey) + ": theastrogoth.github.io/tera-raid-builder/" }</Credit>
                        </CreditsContainer>
                    </InfoSection>
                </GraphicsContainer> 
            </ThemeProvider>     
        );
    });
    
    document.body.appendChild(graphicTop); // this makes the element findable for html2canvas
    return graphicTop;
}

const rotate = (xgrid: number, ygrid: number, text: string, gridSize: number) => (target: HTMLCanvasElement) => {
    const context = target.getContext('2d') as CanvasRenderingContext2D;
    const textSize = 216;
    context.font = textSize + 'px Josefin Slab';
    const metrics = context.measureText(text);
    const textWidth = Math.min(metrics.width, 1500);

    const xgrid_rot = (xgrid - ygrid) * 0.70711;
    const ygrid_rot = (xgrid + ygrid) * 0.70711;

    const shift = textWidth / 2.8284;
    const x = target.width * (1/2 + (xgrid_rot / gridSize / 2));
    const y = target.height * (1/2 + (ygrid_rot / gridSize / 2));
    const x_s = x - shift;
    const y_s = y + shift;
  
    context.translate(x_s, y_s);
    context.globalAlpha = 0.25;
    context.fillStyle = '#fff';
    context.font = textSize + 'px Josefin Slab';
    context.rotate(-45 * Math.PI / 180);
    context.fillText(text, 0, 0, 1500);
    return target;
};

function saveGraphic(graphicTop: HTMLElement, title: string, watermarkText: string, setLoading: (l: boolean) => void) {
    html2canvas(graphicTop, {
        allowTaint: true, 
        useCORS: true,
        windowWidth: 3600,
        scale: 1,
        imageTimeout: 15000,
    }).then((canvas) => {
        const graphicUrl = canvas.toDataURL("graphic/png");
        const gridSize = 1.1;
        const gridSizeFloor = Math.floor(gridSize);
        if (watermarkText && watermarkText !== "") {
            let wmark = watermark([graphicUrl]);
            for (let i = -gridSizeFloor-1; i <= gridSizeFloor+1; i++) {
                for (let j = -gridSizeFloor; j <= gridSizeFloor+1; j++) {
                    wmark = wmark.image(rotate(i, j, watermarkText, gridSize)).render();
                }
            }
            wmark.image((target: HTMLCanvasElement) => target)
                .then((img: HTMLImageElement) => {
                    title.endsWith("!PPT") ? void(0) : saveAs(img.src, title + '.png')
                    setLoading(false);
                });
        } else {
            title.endsWith("!PPT") ? void(0) : saveAs(graphicUrl, title + '.png')
            setLoading(false);
        }
    });
    title.endsWith("!PPT") ? void(0) : graphicTop.remove(); // remove the element from the DOM
}

function GraphicsButton({title, notes, credits, raidInputProps, results, allSpecies, setLoading, translationKey}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, results: RaidBattleResults, allSpecies: Map<SpeciesName, PokemonData> | null, setLoading: (l: boolean) => void, translationKey: any}) {

    const theme = useTheme();
    const loadedImageURLRef = useRef<string>(getMiscImageURL("default"));
    const [subtitle, setSubtitle] = useState<string>("");
    const [watermarkText, setWatermarkText] = useState<string>("");
    const [plotsEnabled, setPlotsEnable] = useState<boolean[]>([false, false, false, false]);

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
        setLoading(true);
        try {
            // get learn method + types for moves
            const pokemonData = allSpecies ? 
                raidInputProps.pokemon.map((poke) => allSpecies.get(poke.species.name)) as PokemonData[] : 
                (await Promise.all(
                    raidInputProps.pokemon.map((poke) => PokedexService.getPokemonByName(poke.name)))
                ) as PokemonData[];
            const isHiddenAbility: boolean[] = pokemonData.slice(1).map((data, id) => {
                const ability = raidInputProps.pokemon[id+1].ability;
                if (!ability || ability === "(No Ability)") { return false; }
                const abilityData = data.abilities.find((abilityData) => abilityData.name === ability);
                return abilityData ? abilityData.hidden || false : false;
            })
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
            // identify moves that aren't used in the strat
            const optionalMove = moves.map((ms,id) => ms.map(m => {
                if (id === 0) { return false; }
                const move = results.turnResults.find((r) => r.moveInfo.moveData.name === m.name && r.moveInfo.userID === id);
                return !move && (m.name !== undefined) && (m.name !== "(No Move)");
            }))
            // sort moves into groups
            const [turnGroups, turnNumbers] = getTurnGroups(raidInputProps.groups, results);
            // generate radar plots
            let statPlots: undefined | (string | undefined)[] = await Promise.all(
                raidInputProps.pokemon.slice(1).map((poke, i) => {
                    if (!plotsEnabled[i]) { return undefined; }
                    const nature = gen.natures.get(toID(poke.nature));
                    return getStatRadarPlotPNG(poke.id, nature, poke.evs, poke.stats, translationKey, 20);
                })
            );
            if (statPlots.every((plot) => plot === undefined)) { statPlots = undefined; }
            // generate graphic
            const graphicTop = generateGraphic(theme, raidInputProps, results, isHiddenAbility, learnMethods, moveTypes, optionalMove, turnGroups, turnNumbers, loadedImageURLRef.current, title, subtitle, notes, credits, statPlots, translationKey);
            saveGraphic(graphicTop, title, watermarkText, setLoading);
        } catch (e) {
            setLoading(false);
            console.log(e)
        }
    };
    
    return (
        <Box>
            <Button 
                variant="outlined"
                onClick={handleClick}
            >
                { getTranslation("Download graphic", translationKey) }
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
                <li>
                    <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px", py: "6px" }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="graphic-button-file"
                            type="file"
                            onChange={handleFileInputChange}
                        />
                        <Stack direction="row">
                            <Box flexGrow={1} />
                            <label htmlFor="graphic-button-file">
                                <Button
                                    variant="outlined"
                                    component="span"
                                >
                                    { getTranslation("Choose background", translationKey) }
                                </Button>
                            </label>
                            <Box flexGrow={1} />
                        </Stack>
                    </Box>
                </li>
                <li>
                    <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px", py: "6px" }}>
                        <TextField 
                            variant="outlined"
                            placeholder={getTranslation("Subtitle", translationKey)}
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                        />
                    </Box>
                </li>
                <li>
                    <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px", py: "6px" }}>
                        <TextField 
                            variant="outlined"
                            placeholder={getTranslation("Watermark text", translationKey)}
                            value={watermarkText}
                            inputProps={{ maxLength: 50 }}
                            onChange={(e) => setWatermarkText(e.target.value)}
                        />
                    </Box>
                </li>
                <li>
                    <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px", py: "6px" }}>
                        <Stack>
                            <Typography variant="body1" fontWeight={600}>
                                {getTranslation("Enable Stat Plots", translationKey) + ":"}
                            </Typography>
                            {[0,1,2,3].map((i) => (
                        
                            <Stack key={i} direction="row" alignItems="center" justifyContent="center">
                                <Box flexGrow={1} />
                                <Typography>
                                    { `${getTranslation("Raider", translationKey)} ${i+1}` }
                                </Typography>
                                <Box flexGrow={2} />
                                <Checkbox
                                    checked={plotsEnabled[i]}
                                    onChange={(e) => {
                                        const newPlotsEnabled = plotsEnabled.slice();
                                        newPlotsEnabled[i] = !newPlotsEnabled[i];
                                        setPlotsEnable(newPlotsEnabled);
                                    }}
                                />
                                <Box flexGrow={1} />
                            </Stack>
                        ))
                            
                        }

                    </Stack>
                    </Box>
                </li>
                <li>
                    <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px", py: "6px" }}>
                        <Stack direction="row">
                            <Box flexGrow={1} />
                            <Button
                                variant="outlined"
                                component="span"
                                onClick={() => { handleDownload(); handleClose(); }}
                                endIcon={<DownloadIcon />}
                            >
                                { getTranslation("Download", translationKey) }
                            </Button>
                            <Box flexGrow={1} />
                        </Stack>
                    </Box>
                </li>
            </Menu>
        </Box>

    );
};

export default GraphicsButton;