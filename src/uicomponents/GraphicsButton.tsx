import React, { useState, useRef, useEffect } from "react";

import Box from '@mui/material/Box';

import { Generations, Move, toID } from "../calc";
import { SpeciesName, TypeName, Nature, StatID } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, getMoveMethodIconURL, getReadableGender, getEVDescription, getIVDescription, getPokemonSpriteURL, getMiscImageURL, getTeraTypeBannerURL, getTranslation, sortGroupsIntoTurns, getTurnNumbersFromGroups } from "../utils";
import { RaidMoveInfo, SubstituteBuildInfo, TurnGroupInfo, ExtraBuildInfo, GraphicBuildInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { Raider } from "../raidcalc/interface";
import { PokedexService, PokemonData } from "../services/getdata"

import html2canvas from 'html2canvas';
//@ts-ignore
import watermark from "watermarkjs";
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { Select, MenuItem, TextField, Switch } from "@mui/material";
import { styled } from "@mui/material/styles"

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider } from "@emotion/react";
import { useTheme } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import Menu from "@mui/material/Menu";
import DownloadIcon from '@mui/icons-material/Download';
import { RaidBattleResults } from "../raidcalc/RaidBattle";
import { getStatRadarPlotPNG } from "./StatRadarPlot";

import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";

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
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "0px 50px",
    margin: "80px 0px",
    gap: "125px 0px"
});

const BuildWrapper = styled(Box)({
    width: "775px",
    backgroundColor: "rgba(255, 255, 255, .35)",
    margin: "200px 50px 0px 50px",
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

const BuildSubstituteSubtitle = styled(Typography)({
    lineHeight: "55px",
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: "1.75em",
    marginTop: "25px",
});

const BuildHeaderSeparator = styled("hr")({
    border: "4px solid rgba(255, 255, 255, .35)",
    margin: "30px 0px"
});

const BuildInfoContainer = styled(Stack)({

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

const StatTableContainer = styled(Grid)({

})

const StatTableGrid = styled(Grid)({

})

const StatTableBox = styled(Box)({
    backgroundColor: "rgba(255, 255, 255, .25)",
    height: "125px",
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
});

const StatTableEntryLevel = styled(Box)({
    backgroundColor: "rgba(255, 255, 255, .15)",
    width: "100%",
});

const StatTableText = styled(Typography)({
    lineHeight: "50px",
});

const AnyStatsMessageContainer = styled(Box)({
    width: "100%%",
    height: "auto"
});

const AnyStatsMessage = styled(Typography)({
    fontSize: "1.8em",
    lineHeight: "55px",
    textAlign: "center"
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
                teraActivated: !wait && !!(turnResult!.moveInfo.options!.activateTera && (results.turnZeroState.raiders[t.moveInfo.userID].teraType || "???")!== "???" &&
                                turnResult.flags[turnResult.moveInfo.userID].includes("Tera activated"))
            } 
        })
    ));
    return [preparedTurnGroups, turnNumbers];
}

function generateGraphic(theme: any, buildsOnly: boolean, buildInfo: GraphicBuildInfo[], results: RaidBattleResults, buildsCount: number, turnGroups: {id: number, move: string, info: RaidMoveInfo, isSpread: boolean, repeats: number, teraActivated: boolean}[][][], turnNumbers: number[], backgroundImageURL: string, title?: string, subtitle?: string, notes?: string, credits?: string, statDisplay?: (JSX.Element)[], translationKey?: any) {
    const graphicTop = document.createElement('graphic_top');
    graphicTop.setAttribute("style", "width: 3600px");
    const root = createRoot(graphicTop);

    const ignoreStats = buildInfo.slice(1).map((info) => (info.raider.isAnyLevel) || (Object.entries(info.raider.ivs).reduce((acc, val) => val[1] + acc, 0) === 0 && Object.entries(info.raider.evs).reduce((acc, val) => val[1] + acc, 0) === 0));
    flushSync(() => {
        root.render(
            <ThemeProvider theme={graphicsTheme}>
                <GraphicsContainer 
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, .85), rgba(0, 0, 0, .85)), url(${backgroundImageURL})`,
                    }} 
                >
                    <Header>
                        { !buildsOnly &&
                            <Box>
                                <BossWrapper>
                                    <Boss src={getPokemonArtURL(buildInfo[0].raider.species.name, buildInfo[0].raider.shiny)} />
                                    <BossTera src={getTeraTypeBannerURL(buildInfo[0].raider.teraType || "blank")}></BossTera>
                                </BossWrapper>
                                <Title>{title ? (title.endsWith("!PPT") ? title.slice(0, -4) : title) : "Untitled"}</Title>
                                <Subtitle>{subtitle ? subtitle : `A Strategy For ${['a', 'e', 'i', 'o', 'u'].includes(buildInfo[0].raider.species.name.toLowerCase().charAt(0)) ? "An" : "A"} ${buildInfo[0].raider.species.name} Tera Raid Battle`}</Subtitle>
                            </Box>
                        }
                    </Header>
                    <BuildsSection>
                        <Separator>
                            <LeftBar />
                            <SeparatorLabel>{ !translationKey ? "The Crew" : getTranslation("Pokémon", translationKey) }</SeparatorLabel>
                            <RightBar />
                        </Separator> 
                        <BuildsContainer>    
                            {
                                buildInfo.slice(1, buildsCount + 1).map((info, index) => (
                                    <BuildWrapper key={index}>
                                        <Build>
                                            <BuildHeader>
                                                <BuildArt src={getPokemonArtURL(info.raider.species.name, info.raider.shiny)}/>
                                                {info.raider.item ? 
                                                    <BuildItemArt src={getItemSpriteURL(info.raider.item)} /> : null}
                                                {(info.raider.teraType || "???") !== "???" ?
                                                    <BuildTeraIcon src={getTeraTypeIconURL(info.raider.teraType!)} /> : null}
                                                <BuildTypes direction="row">
                                                    {info.raider.types.map((type, index) => (
                                                        <BuildTypeIcon key={index} src={getTypeIconURL(type === "???" ? "None" : type)}/>
                                                    ))}
                                                    {info.raider.types.length === 1 && <BuildTypeIcon key={1} src={getTypeIconURL("none")}/>}
                                                </BuildTypes>
                                                <BuildRole>{info.raider.role}</BuildRole>
                                                { info.extraBuildInfo.subFor &&
                                                    <BuildSubstituteSubtitle>Substitute for {info.extraBuildInfo.subFor}</BuildSubstituteSubtitle>
                                                }
                                                <BuildHeaderSeparator />
                                            </BuildHeader>
                                            <BuildInfoContainer>
                                                <BuildInfo>{ getTranslation("Level", translationKey) + ": " + (info.raider.isAnyLevel ? getTranslation("Any",translationKey) : info.raider.level) }</BuildInfo>
                                                {(info.raider.teraType || "???") !== "???" &&
                                                    <BuildInfo>{ getTranslation("Tera Type", translationKey) + ": " + getTranslation(info.raider.teraType!, translationKey, "types") }</BuildInfo>
                                                }
                                                {info.raider.item ?
                                                    <BuildInfo>{ getTranslation("Item", translationKey) + ": " + getTranslation(info.raider.item, translationKey, "items")}</BuildInfo> : null}
                                                {!!info.raider.ability && info.raider.ability !== "(No Ability)" ? 
                                                <Stack direction="row">
                                                    <BuildInfo>{ getTranslation("Ability", translationKey) + ": " + getTranslation(info.raider.ability, translationKey, "abilities") }</BuildInfo>
                                                    {info.extraBuildInfo.isHiddenAbility ? 
                                                        <AbilityPatchIcon src={getMoveMethodIconURL("ability_patch")} /> 
                                                        : null
                                                    }
                                                </Stack> : null}
                                                {info.raider.gender && info.raider.gender !== "N" &&
                                                    <BuildInfo>{ getTranslation("Gender", translationKey) + ": " + getTranslation(getReadableGender(info.raider.gender), translationKey) }</BuildInfo>
                                                }
                                                <BuildInfo>{ getTranslation("Nature", translationKey) + ": " + (info.raider.nature === "Hardy" ? getTranslation("Any", translationKey) : getTranslation(info.raider.nature, translationKey, "natures")) }</BuildInfo>
                                                {getEVDescription(info.raider.evs, translationKey) ? 
                                                    <BuildInfo>{ getTranslation("EVs", translationKey) + ": " + getEVDescription(info.raider.evs, translationKey)}</BuildInfo> : null}
                                                {getIVDescription(info.raider.ivs, translationKey) ? 
                                                    <BuildInfo>{ getTranslation("IVs", translationKey) + ": " + getIVDescription(info.raider.ivs, translationKey)}</BuildInfo> : null}
                                            </BuildInfoContainer>
                                            <Box flexGrow={1}/>
                                            { statDisplay && !ignoreStats[index] &&
                                                statDisplay[index]
                                            }
                                            { statDisplay && ignoreStats[index] &&
                                                <>
                                                    <AnyStatsMessageContainer>
                                                        <AnyStatsMessage>{ getTranslation("Any stats", translationKey) }</AnyStatsMessage>
                                                    </AnyStatsMessageContainer>
                                                    <Box flexGrow={1}/>
                                                </>
                                            }
                                            <BuildMovesSection>
                                                <MovesHeader>{ getTranslation("Moves", translationKey) + ":" }</MovesHeader>
                                                <MovesContainer>
                                                    {
                                                        [...Array(4)].map((moveSlot, moveSlotIndex) => {
                                                            const noMove = (info.raider.moves[moveSlotIndex] && info.raider.moves[moveSlotIndex] !== "(No Move)");
                                                            return (
                                                                <MoveBox key={"move_box_" + moveSlotIndex}>
                                                                    {noMove ? <MoveTypeIcon src={getTypeIconURL(info.extraBuildInfo.moveTypes[moveSlotIndex])} sx={{opacity: `${info.extraBuildInfo.optionalMove[moveSlotIndex] ? '50%' : '100%'}`}}/> : null}
                                                                    {noMove ? (
                                                                        info.extraBuildInfo.optionalMove[moveSlotIndex] ?
                                                                            <OptionalMoveLabel>{ getTranslation(info.raider.moves[moveSlotIndex], translationKey, "moves") + "*" }</OptionalMoveLabel> : 
                                                                            <MoveLabel>{ getTranslation(info.raider.moves[moveSlotIndex], translationKey, "moves") }</MoveLabel>
                                                                    ) : null}
                                                                    {noMove ? <MoveLearnMethodIcon src={getMoveMethodIcon(info.extraBuildInfo.learnMethods[moveSlotIndex], info.extraBuildInfo.moveTypes[moveSlotIndex])} sx={{opacity: `${info.extraBuildInfo.optionalMove[moveSlotIndex] ? '50%' : '100%'}`}}/> : null}
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
                        { buildInfo.some(entry => entry.extraBuildInfo.optionalMove.some(move => move)) &&
                            <FootnoteContainer>
                                <FootnoteText>
                                    * {getTranslation("Optional Moves", translationKey)}
                                </FootnoteText>
                            </FootnoteContainer>
                        }
                    </BuildsSection>
                    { !buildsOnly &&
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
                                                                                    <ExecutionMoveTeraIcon src={getTeraTypeIconURL(buildInfo[move.info.userID].raider.teraType!)} />
                                                                                </ExecutionMoveTeraIconWrapper>
                                                                                <ExecutionMoveTag>{getTranslation("Terastallize", translationKey)}</ExecutionMoveTag>
                                                                                <ExecutionMoveTeraIconWrapper>
                                                                                    <ExecutionMoveTeraIcon src={getTeraTypeIconURL(buildInfo[move.info.userID].raider.teraType!)} />
                                                                                </ExecutionMoveTeraIconWrapper>
                                                                            </ExecutionMoveActionWrapper>
                                                                            <ExecutionMoveTag>{""}</ExecutionMoveTag>
                                                                            <ExecutionMovePokemonWrapperEmpty />
                                                                        </ExecutionMove>
                                                                        : null,
                                                                        <ExecutionMove key={moveIndex}>
                                                                            {move.teraActivated ?
                                                                            <ExecutionMovePokemonWrapperShifted>
                                                                                <ExecutionMovePokemonName>{buildInfo[move.info.userID].raider.role}</ExecutionMovePokemonName>
                                                                                <ExecutionMovePokemonIconWrapper>
                                                                                    <ExecutionMovePokemonIcon src={getPokemonSpriteURL(turnRaiders[move.info.userID].species.name)} />
                                                                                </ExecutionMovePokemonIconWrapper>
                                                                            </ExecutionMovePokemonWrapperShifted> :
                                                                            <ExecutionMovePokemonWrapper>
                                                                                <ExecutionMovePokemonName>{buildInfo[move.info.userID].raider.role}</ExecutionMovePokemonName>
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
                                                                                            move.move === "Remove Negative Effects" ? buildInfo[0].raider.role :
                                                                                            buildInfo[move.info.targetID].raider.role
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
                    }
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
        // Scale post-html2canvas to prevent formatting issues
        // The image should ideally be under Discord's 10MB Limit
        const scaledCanvas = document.createElement("canvas");
        scaledCanvas.width = canvas.width * .5;
        scaledCanvas.height = canvas.height * .5;
        const ctx = scaledCanvas.getContext("2d")!;

        ctx.scale(.5, .5);
        ctx.drawImage(canvas, 0, 0);

        const graphicUrl = scaledCanvas.toDataURL("graphic/png");
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

function getNonNPCRaiders(raiders: Raider[], substitutes: SubstituteBuildInfo[][]) {
    return [...raiders.slice(1).filter(raider => raider.species.name !== "NPC"), ...substitutes.flat().map(sub => sub.raider).filter(raider => raider.species.name !== "NPC")];
}

function getRaiderUniqueness(raiders: Raider[]) {
    const uniqueRaiderIdxs: number[] = [];
    for (let i=0; i < raiders.length; i++) {
        const isDuplicate = uniqueRaiderIdxs.some(idx => {
            return raiders[i].isIdenticalBuild(raiders[idx]);
        })
        if (!isDuplicate) {
            uniqueRaiderIdxs.push(i);
        }
    }
    return [...Array(raiders.length).keys()].map(idx => uniqueRaiderIdxs.includes(idx));
}

function GraphicsButton({title, notes, credits, raidInputProps, substitutes, results, allSpecies, buildsCount, setLoading, translationKey}: 
    { title: string, notes: string, credits: string, substitutes: SubstituteBuildInfo[][], raidInputProps: RaidInputProps, results: RaidBattleResults, allSpecies: Map<SpeciesName, PokemonData> | null, buildsCount: number, setLoading: (l: boolean) => void, translationKey: any}) {

    const theme = useTheme();
    const loadedImageURLRef = useRef<string>(getMiscImageURL("default"));
    const [subtitle, setSubtitle] = useState<string>("");
    const [watermarkText, setWatermarkText] = useState<string>("");
    // const [plotsEnabled, setPlotsEnable] = useState<boolean[]>([false, false, false, false]);
    const [statDisplay, setStatDisplay] = useState<string>("None");
    // const [plotsEnabled, setPlotsEnable] = useState<boolean>(false);
    const [buildsOnly, setBuildsOnly] = useState<boolean>(false);
    const [buildsOrder, setBuildsOrder] = useState<number[]>([]);
    const [buildsEnabled, setBuildsEnabled] = useState<boolean[]>([]);

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
            // all raiders including the raid boss and substitutes            
            const allRaidPokemonMatrix = getAllRaidPokemonMatrix();
            
            const pokemonDataMatrix = await createPokemonDataMatrix();
            const isHiddenAbilityMatrix = createIsHiddenAbilityMatrix(pokemonDataMatrix);

            const movesMatrix = createMovesMatrix(pokemonDataMatrix);
            const learnMethodMatrix = createLearnMethodMatrix(pokemonDataMatrix, movesMatrix);
            const moveTypeMatrix = createMoveTypeMatrix(pokemonDataMatrix, movesMatrix);
            const optionalMoveMatrix = createOptionalMoveMatrix(pokemonDataMatrix, movesMatrix);

            // contains all the extra info needed for extra elements on the graphics, ability patch icon, learn method icons, move type icons, optional move boolean
            const extraBuildInfoMatrix = createExtraBuildInfoMatrix(isHiddenAbilityMatrix, learnMethodMatrix, moveTypeMatrix, optionalMoveMatrix);

            const buildInfo = zipBuildInfo(allRaidPokemonMatrix, extraBuildInfoMatrix);
            const displayOrder: number[] = [];
            for (const idx of buildsOrder) {
                if (buildsEnabled[idx]) {
                    displayOrder.push(idx);
                }
            }
            const includedRaidPokemonBuildInfo = buildsOnly ? processBuildsOnlyInfo(buildInfo, pokemonDataMatrix, displayOrder) : processFullGraphicInfo(buildInfo);

            // sort moves into groups
            const [turnGroups, turnNumbers] = getTurnGroups(raidInputProps.groups, results);

            let statDisplayElements: JSX.Element[] = []
            if (statDisplay === "Stat Plot") {
                const statPlots = await getStatPlots(includedRaidPokemonBuildInfo.map(buildInfo => buildInfo.raider));
                statDisplayElements = getStatPlotElements(statPlots);
            }
            if (statDisplay === "Stat Table") {
                statDisplayElements = getStatTableElements(includedRaidPokemonBuildInfo.map(buildInfo => buildInfo.raider));
            }

            // generate graphic
            const graphicTop = generateGraphic(theme, buildsOnly, includedRaidPokemonBuildInfo, results, buildsOnly ? includedRaidPokemonBuildInfo.length - 1 : buildsCount, turnGroups, turnNumbers, loadedImageURLRef.current, title, subtitle, notes, credits, statDisplayElements, translationKey);
            saveGraphic(graphicTop, title, watermarkText, setLoading);
        } catch (e) {
            setLoading(false);
            console.log(e)
        }
    };

    function getAllRaidPokemonMatrix(): Raider[][] {
        const allRaidPokemon: Raider[][] = [[], [], [], [], []];

        raidInputProps.pokemon.slice(0, 5).forEach((data, index) => {
            allRaidPokemon[index].push(data);
        });
        for (const [slotIndex, slot] of substitutes.entries()) {
            for (const sub of slot) {
                allRaidPokemon[slotIndex + 1].push(sub.raider)
            }
        }
        return allRaidPokemon;
    }

    async function createPokemonDataMatrix(): Promise<PokemonData[][]> {
        const pokemonDataMatrix: PokemonData[][] = [[], [], [], []];

        // First add the main 4 Pokemon as the first item in each column of the data Matrix
        const mainPokemonData = allSpecies ?
            raidInputProps.pokemon.map((poke) => allSpecies.get(poke.species.name)) as PokemonData[] : (
                await Promise.all(
                    raidInputProps.pokemon.map((poke) => PokedexService.getPokemonByName(poke.name))
                )
            ) as PokemonData[];

        mainPokemonData.slice(1, 5).forEach((data, index) => {
            pokemonDataMatrix[index].push(data);
        });

        // Add the substitutes into the correct columns
        for (const [slotIndex, slot] of substitutes.entries()) {
            for (const sub of slot) {
                const subData = allSpecies ?
                    allSpecies.get(sub.raider.species.name) as PokemonData :
                    await PokedexService.getPokemonByName(sub.raider.species.name) as PokemonData;
                pokemonDataMatrix[slotIndex].push(subData)
            }
        }

        return pokemonDataMatrix;
    }

    function createIsHiddenAbilityMatrix(pokemonDataMatrix: PokemonData[][]): boolean[][] {
        return pokemonDataMatrix.map((slot, slotIndex) =>
            slot.map((data, index) => {
                const isMain = index === 0;
                const ability = isMain ? raidInputProps.pokemon[slotIndex + 1].ability : substitutes[slotIndex][index - 1].raider.ability;
                if (!ability || ability === "(No Ability)") { return false; }
                const abilityData = data.abilities.find((abilityData) => abilityData.name === ability);
                return abilityData ? abilityData.hidden || false : false;
            })
        );
    }

    function createMovesMatrix(pokemonDataMatrix: PokemonData[][]): Move[][][] {
        return pokemonDataMatrix.map((slot, slotIndex) =>
            slot.map((data, index) => {
                const isMain = index === 0;
                const moves = isMain ? raidInputProps.pokemon[slotIndex + 1].moves : substitutes[slotIndex][index - 1].raider.moves;
                return moves.filter((move) => move !== undefined && move !== "(No Move)").map((move) => new Move(9, move));
            })
        );
    }

    function createLearnMethodMatrix(pokemonDataMatrix: PokemonData[][], movesMatrix: Move[][][]): any[][][] {
        return pokemonDataMatrix.map((slot, slotIndex) =>
            slot.map((data, index) => {
                const moves = movesMatrix[slotIndex][index];
                return moves.map((move) => {
                    const moveData = data.moves.find((moveData) => moveData.name === move.name);
                    return moveData ? moveData.learnMethod : "level-up";
                });
            })
        );
    }

    function createMoveTypeMatrix(pokemonDataMatrix: PokemonData[][], movesMatrix: Move[][][]): TypeName[][][] {
        return pokemonDataMatrix.map((slot, slotIndex) =>
            slot.map((data, index) => {
                const moves = movesMatrix[slotIndex][index];
                return moves.map((move) => {
                    const moveData = data.moves.find((moveData) => moveData.name === move.name);
                    return moveData ? move.type : "???";
                });
            })
        );
    }

    function createOptionalMoveMatrix(pokemonDataMatrix: PokemonData[][], movesMatrix: Move[][][]): boolean[][][] {
        return pokemonDataMatrix.map((slot, slotIndex) =>
            slot.map((data, index) => {
                const isMain = index === 0;
                if (isMain) {
                    const moves = movesMatrix[slotIndex][0];
                    return moves.map((move) => {
                        const moveName = move.name;
                        const moveUsed = results.turnResults.some((turnResult) =>
                            turnResult.moveInfo.userID === slotIndex + 1 && turnResult.moveInfo.moveData.name === moveName
                        );
                        return !moveUsed && moveName !== "(No Move)";
                    });
                }
                else {
                    const moves = substitutes[slotIndex][index - 1].raider.moves;
                    const usedMoves = substitutes[slotIndex][index - 1].substituteMoves;
                    return moves.map((move) => {
                        return move !== "(No Move)" && !usedMoves.includes(move);
                    })
                }
            })
        );
    }

    function createExtraBuildInfoMatrix(isHiddenAbilityMatrix: boolean[][], learnMethodMatrix: any[][][], moveTypeMatrix: TypeName[][][], optionalMoveMatrix: boolean[][][]): ExtraBuildInfo[][] {
        return isHiddenAbilityMatrix.map((slot, slotIndex) =>
            // all matrices should have the same shape
            slot.map((isHiddenAbility, index) => {
                return {
                    isHiddenAbility,
                    learnMethods: learnMethodMatrix[slotIndex][index],
                    moveTypes: moveTypeMatrix[slotIndex][index],
                    optionalMove: optionalMoveMatrix[slotIndex][index],
                    subFor: index === 0 ? undefined : raidInputProps.pokemon[slotIndex + 1].role,
                };
            })
        );   
    }

    function zipBuildInfo(allRaidPokemonMatrix: Raider[][], extraBuildInfoMatrix: ExtraBuildInfo[][]): GraphicBuildInfo[][] {
        const buildInfoMatrix: GraphicBuildInfo[][] = [];

        // matrices have different shape since raid boss does not have extra build info
        for (let i = 0; i < allRaidPokemonMatrix.length; i++) {
            if (i === 0) {
                buildInfoMatrix.push([{
                    raider: allRaidPokemonMatrix[i][0],
                    extraBuildInfo: {
                        isHiddenAbility: undefined,
                        learnMethods: [],
                        moveTypes: [],
                        optionalMove: [],
                    }
                }]);
                continue;
            }
            const buildInfoRow: GraphicBuildInfo[] = [];
            for (let j = 0; j < allRaidPokemonMatrix[i].length; j++) {
                buildInfoRow.push({
                    raider: allRaidPokemonMatrix[i][j],
                    extraBuildInfo: extraBuildInfoMatrix[i-1][j],
                });
            }
            buildInfoMatrix.push(buildInfoRow);
        }
        return buildInfoMatrix;
    }

    function processBuildsOnlyInfo(buildInfo: GraphicBuildInfo[][], pokemonDataMatrix: PokemonData[][], buildsOrder: number[]): GraphicBuildInfo[] {
        const buildsOnlyBuildInfo: GraphicBuildInfo[] = [];

        // This adds builds according to the order selected via the drag and drop
        // (doesn't really make use of the slots/matrix setup)
        let idx = 0;
        for (const [mainSlotIndex, mainSlot] of buildInfo.slice(1).entries()) {
            const speciesName = pokemonDataMatrix[mainSlotIndex][0].name;
            if (speciesName !== "NPC") {
                const addAt = buildsOrder.indexOf(idx);
                if (addAt !== -1) {
                    buildsOnlyBuildInfo[addAt] = mainSlot[0];
                }
                idx++;
            }
        }
        for (const [slotIndex, slot] of buildInfo.slice(1).entries()) {
            for (const [subIndex, sub] of slot.entries()) {
                if (subIndex === 0) continue; // Skip the main raider
                const speciesName = pokemonDataMatrix[slotIndex][subIndex].name;
                if (speciesName !== "NPC") {
                    const addAt = buildsOrder.indexOf(idx);
                    if (addAt !== -1) {
                        buildsOnlyBuildInfo[addAt] = sub;
                    }
                    idx++;
                }
            }
        }
        buildsOnlyBuildInfo.unshift(buildInfo[0][0]); // Add boss info directly
        return buildsOnlyBuildInfo;
        
        // // For now, the logic for the builds only graphic is to priorize the main raiders then list substitutes in order of slot
        // for (const slot of buildInfo) {
        //     checkDuplicate(slot[0], buildsOnlyBuildInfo);
        // }

        // for (const slot of buildInfo) {
        //     for (const sub of slot.slice(1)) {
        //         checkDuplicate(sub, buildsOnlyBuildInfo);
        //     }
        // }
        // return buildsOnlyBuildInfo;
    }

    // function checkDuplicate(buildInfo: GraphicBuildInfo, buildsOnlyBuildInfo: GraphicBuildInfo[]): boolean {
    //     if (buildInfo.raider.species.name !== "NPC") {
    //         const isDuplicate = buildsOnlyBuildInfo.some(checkedRaider => {
    //             if (buildInfo.raider.isIdenticalBuild(checkedRaider.raider)) {
    //                 // duplicate raiders need to have optional moves combined
    //                 checkedRaider.extraBuildInfo.optionalMove = checkedRaider.extraBuildInfo.optionalMove.map((move, index) => move && buildInfo.extraBuildInfo.optionalMove[index]);
    //                 return true;
    //             }
    //             return false;
    //         });
    //         if (!isDuplicate) {
    //             buildsOnlyBuildInfo.push(buildInfo);
    //         }
    //     }
    //     return false;
    // }

    function processFullGraphicInfo(buildInfo: GraphicBuildInfo[][]): GraphicBuildInfo[] {
        const fullGraphicBuildInfo: GraphicBuildInfo[] = [];
        let subsToIncludeCounter = buildsCount - 4;
        // For now, only support the 4 main raiders in the full graphic
        buildInfo.map(slot => fullGraphicBuildInfo.push(slot[0])); 

        for (const [, slot] of buildInfo.entries()) {
            for (const [, sub] of slot.slice(1).entries()) {
                if (subsToIncludeCounter > 0) {
                    fullGraphicBuildInfo.push(sub);
                    subsToIncludeCounter-=1;
                }
            }
        }

        return fullGraphicBuildInfo;
    }

    // function getAllRaidPokemon(): Raider[] {
    //     const allRaidPokemon: Raider[] = [];
    //     raidInputProps.pokemon.forEach((raider) => {
    //         allRaidPokemon.push(raider);
    //     });
    //     substitutes.forEach((slot) => {
    //         slot.forEach((sub) => {
    //             allRaidPokemon.push(sub.raider);
    //         });
    //     });
    //     return allRaidPokemon;
    // }

    async function getStatPlots(allRaidPokemon: Raider[]): Promise<string[] | undefined> {
        let statPlots: undefined | string[] = statDisplay !== "Stat Plot" ? undefined : await Promise.all(
            allRaidPokemon.slice(1).map((poke, index) => {
                const nature = gen.natures.get(toID(poke.nature));
                return getStatRadarPlotPNG(index + 1, nature, poke.evs, poke.stats, translationKey, 20);
            })
        );
        return statPlots;
    }

    const maxRaiders = substitutes.reduce((acc, slot) => acc + slot.length, 0) + 4;
    const initializedStatPlots = Array.from({ length: maxRaiders }, (_, index) => (
        <Box key={index} id={`statplot${index + 1}`} display="none" />
    ));

    function getStatPlotElements(statPlots?: string[]): JSX.Element[] {
        if (!statPlots) return [];
        return statPlots.map((statPlot, index) => (
            <StatPlotContainer>
                <StatPlot src={statPlot} />
            </StatPlotContainer>
        ));
    }

    function getStatTableElements(includedRaidPokemon: Raider[]): JSX.Element[] {
        const shortStatNames = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
        let statTableElements = [];

        for (const [index, raider] of includedRaidPokemon.slice(1).entries()) {
            const nature = gen.natures.get(toID(raider.nature));
            const statTableElement = (
                <StatTableContainer container spacing={2} key="stat-table-grid">
                    {[raider.stats.hp, raider.stats.atk, raider.stats.def, raider.stats.spa, raider.stats.spd, raider.stats.spe].map((stat, statIndex) => (
                        <StatTableGrid item xs={4} key={`stat-${index}-${statIndex}`}>
                            <StatTableBox>
                                <Box display={"flex"} alignItems={"flex-end"} width={"100%"} height={"100%"}>
                                    <StatTableEntryLevel height={(raider.evs?.[shortStatNames[statIndex].toLowerCase() as StatID] || 0) / 252}/>
                                </Box>
                                <Stack direction="column" position={"absolute"} margin={"25px"}>
                                    <StatTableText fontSize={"1.3em"} color={getStatColor(shortStatNames[statIndex].toLowerCase() as StatID, nature)}>{shortStatNames[statIndex]}</StatTableText>
                                    <StatTableText fontSize={"1.8em"} color={getStatColor(shortStatNames[statIndex].toLowerCase() as StatID, nature)}>{stat}</StatTableText>
                                </Stack>
                            </StatTableBox>
                        </StatTableGrid>
                    ))}
                </StatTableContainer>
            );
            statTableElements.push(statTableElement);
        }
        return statTableElements;
    }

    function getStatColor(stat: StatID, nature?: Nature): string {
        if (nature && nature.plus !== nature.minus && nature.plus === stat) {
            return "#ffc0c0"
        }
        if (nature && nature.minus !== nature.plus && nature.minus === stat) {
            return "#bad7ff"
        }
        return "#ffffff"
    }

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
                <Stack direction="row">
                    <Stack padding={"8px"}>
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
                            <Stack direction="row">
                                <Box flexGrow={1} />
                                <TextField 
                                    variant="outlined"
                                    placeholder={getTranslation("Subtitle", translationKey)}
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    sx={{justifyContent: "center", alignItems: "center"}}
                                />
                                <Box flexGrow={1} />
                            </Stack>
                        </Box>
                    </li>
                    <li>
                        <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px", py: "6px" }}>
                            <Stack direction="row">
                                <Box flexGrow={1} />
                                <TextField 
                                    variant="outlined"
                                    placeholder={getTranslation("Watermark text", translationKey)}
                                    value={watermarkText}
                                    inputProps={{ maxLength: 50 }}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                />
                                <Box flexGrow={1} />
                            </Stack>
                        </Box>
                    </li>
                    <li>
                        <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px" }}>
                            <Stack direction="row" alignItems="center" justifyContent="center">
                                <Typography variant="body1" fontWeight={600}>
                                    {getTranslation("Stat Display", translationKey) + ":"}
                                </Typography>
                                <Box flexGrow={2} />
                                <Select value={statDisplay} onChange={(e) => setStatDisplay(e.target.value) } inputProps={{ 'aria-label': 'Stat Display' }} sx={{ height: "30px", width: "105px", margin: "10px" }} >
                                    <MenuItem value="None">{getTranslation("None", translationKey)}</MenuItem>
                                    <MenuItem value="Stat Plot">{getTranslation("Stat Plot", translationKey)}</MenuItem>
                                    <MenuItem value="Stat Table">{getTranslation("Stat Table", translationKey)}</MenuItem>
                                </Select>
                            </Stack>
                        </Box>
                    </li>
                    <li>
                        <Box width="100%" alignItems="center" justifyContent="center" sx={{ px: "12px" }}>
                            <Stack direction="row" alignItems="center" justifyContent="center">
                                <Typography variant="body1" fontWeight={600}>
                                    {getTranslation("Graphic Type", translationKey) + ":"}
                                </Typography>
                                <Box flexGrow={2} />
                                <Select value={buildsOnly ? getTranslation("Builds Only", translationKey) : getTranslation("Full Graphic", translationKey)} onChange={(e) => setBuildsOnly(e.target.value === "Builds Only") } inputProps={{ 'aria-label': 'Builds Only' }} sx={{ height: "30px", width: "115px", margin: "10px" }} >
                                    <MenuItem value="Full Graphic">{getTranslation("Full Graphic", translationKey)}</MenuItem>
                                    <MenuItem value="Builds Only">{getTranslation("Builds Only", translationKey)}</MenuItem>
                                </Select>
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
                    </Stack >
                    {
                        buildsOnly &&
                        <Stack padding={"8px"} alignItems="center" sx={{ height: "350px", marginRight: 1, overflowY: "auto" }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", marginBottom: 1 }}>
                                <Box flexGrow={1}/>
                                <Typography variant="body1" fontWeight={600}>{getTranslation("Order", translationKey)}</Typography>
                                <Box flexGrow={0.4}/>
                                <IconButton 
                                    onClick={() => {
                                        const raiders = getNonNPCRaiders(raidInputProps.pokemon, substitutes);
                                        const newOrder = [...Array(raiders.length).keys()]
                                        const newEnabled = getRaiderUniqueness(raiders);
                                        setBuildsOrder(newOrder);
                                        setBuildsEnabled(newEnabled);
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Stack>
                            <BuildsOrderDnD buildsOrder={buildsOrder} setBuildsOrder={setBuildsOrder} buildsEnabled={buildsEnabled} setBuildsEnabled={setBuildsEnabled} raiders={raidInputProps.pokemon} substitutes={substitutes}/>
                        </Stack>
                    }
                </Stack>
            </Menu>
            { /* Render the stat plots for the graphic*/}
            {initializedStatPlots}
        </Box>
    );
};

function BuildsOrderDnD({buildsOrder, setBuildsOrder, buildsEnabled, setBuildsEnabled, raiders, substitutes}: { buildsOrder: number[], setBuildsOrder: (o: number[]) => void, buildsEnabled: boolean[], setBuildsEnabled: (o: boolean[]) => void, raiders: Raider[], substitutes: SubstituteBuildInfo[][]}) {
    const [allBuilds, setAllBuilds] = useState<Raider[]>(getNonNPCRaiders(raiders, substitutes));
    const [disableButtons, setDisableButtons] = useState<boolean>(false);

    useEffect(() => {
        const nonNPCRaiders = getNonNPCRaiders(raiders, substitutes);
        const newBuildsOrder = [...Array(nonNPCRaiders.length).keys()];
        const newBuildsEnabled = getRaiderUniqueness(nonNPCRaiders);
        setAllBuilds(nonNPCRaiders);
        setBuildsOrder(newBuildsOrder);
        setBuildsEnabled(newBuildsEnabled);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raiders, substitutes])

    const onDragStart = () => { setDisableButtons(true); }

    const onDragEnd = (result: DropResult) => {
        setDisableButtons(false);
        const {destination, source} = result;
        if (!destination || destination.index === source.index) { 
            return;
        }
        const newBuildsOrder = [...buildsOrder];
        const [removed] = newBuildsOrder.splice(source.index, 1);
        newBuildsOrder.splice(destination.index, 0, removed);
        setBuildsOrder(newBuildsOrder);

        const newbd = [...buildsEnabled];
        const [removedEnabled] = newbd.splice(source.index, 1);
        newbd.splice(destination.index, 0, removedEnabled);
        setBuildsEnabled(newbd);
    };

    return (
        <DragDropContext
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <Droppable droppableId="graphicBuilds" type="builds">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps} 
                    >
                        <Stack spacing={1}>
                            {
                                buildsOrder.map((buildIndex, dragIndex) => BuildDraggable({index: dragIndex, buildIndex,raider: allBuilds[buildIndex], buildsOrder, setBuildsOrder, buildsEnabled, setBuildsEnabled, disableButtons}))
                            }
                        </Stack>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
}

function BuildDraggable({ index, buildIndex, raider, buildsOrder, setBuildsOrder, buildsEnabled, setBuildsEnabled, disableButtons }: { index: number, buildIndex: number, raider: Raider, buildsOrder: number[], setBuildsOrder: (o: number[]) => void, buildsEnabled: boolean[], setBuildsEnabled: (d: boolean[]) => void, disableButtons: boolean }) {
    const handleToggleOff = () => {
        const newbd = [...buildsEnabled]; 
        newbd[index] = !buildsEnabled[index]; 
        setBuildsEnabled(newbd)
    }

    return (
        <Draggable 
            key={index}
            draggableId={index.toString()} 
            index={index}
        >
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Paper elevation={2} sx={{padding: 0.5, opacity: buildsEnabled[index] ? "100%" : "50%"}}>
                        <li>
                            <Stack direction="row" alignItems="center" sx={{width: "175px"}}>
                                {/* @ts-ignore */}
                                <DragIndicatorIcon color="subdued" sx={{paddingRight: "5px"}}/>
                                <Box
                                    sx={{
                                        width: "25px",
                                        height: "25px",
                                        overflow: 'hidden',
                                        opacity: buildsEnabled[index] ? "100%" : "50%",
                                        background: `url(${getPokemonSpriteURL(raider ? raider.species.name : "NPC")}) no-repeat center center / contain`,
                                    }}
                                />
                                <Box flexGrow={1}/>
                                <Typography variant="body1" sx={{opacity: buildsEnabled[index] ? "100%" : "80%"}}>{raider ? raider.name : "Blank"}</Typography>
                                <Box flexGrow={1}/>
                                <Switch
                                    checked={buildsEnabled[index]}
                                    onChange={handleToggleOff}
                                    disabled={disableButtons}
                                    style={{ transition: "none" }} // this is to prevent most of the flickering when reordering the list
                                />
                            </Stack>
                        </li>
                    </Paper>
                </div>
            )}
        </Draggable>
    )
}

export default GraphicsButton;