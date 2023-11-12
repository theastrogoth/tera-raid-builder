import React, { useState, useRef } from "react";

import Box from '@mui/material/Box';

import { Move } from "../calc";
import { TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL, getMoveMethodIconURL, getEVDescription, getIVDescription, getPokemonSpriteURL, getMiscImageURL, getTeraTypeBannerURL, getTranslation } from "../utils";
import { RaidMoveInfo, TurnGroupInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { PokedexService, PokemonData } from "../services/getdata"

import html2canvas from 'html2canvas';
//@ts-ignore
import watermark from "watermarkjs";
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

const AbilityPatchIcon = styled("img")({
    height: "55px",
    margin: "0px 0px 0px 20px",
    filter: "drop-shadow(0px 0px 15px rgba(0, 0, 0, 0.65))"
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
});

const ExecutionMoveTeraIconWrapper = styled(Box)({
    position: "absolute",
    transform: "translate(1520px, -20px)",
    height: "140px",
    width: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

const ExecutionMoveTag = styled(Typography)({
    height: "100px",
    width: "300px",
    color: "white",
    fontSize: "1.7em",
    textAlign: "center",
    lineHeight: "100px",
    overflow: "hidden",
    whiteSpace: "nowrap",
});

const ExecutionMoveAction = styled(Typography)({
    height: "100px",
    width: "650px",
    color: "white",
    fontSize: "1.7em",
    textAlign: "center",
    lineHeight: "100px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    backgroundColor: "rgba(255, 255, 255, .35)",
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

// TODO: move this to a more appropriate place (also used in MoveDisplay)
function getMoveGroups(groups: TurnGroupInfo[], results: RaidBattleResults) {
    const moveGroups = groups.map((group, groupIndex) => 
        group.turns.map((t) => { 
            const turnResult = results.turnResults.find((r) => t.id === r.id)!;
            let move = turnResult.raiderMoveUsed;
            const info = move === "(No Move)" ? turnResult.bossMoveInfo : turnResult.moveInfo;
            const isSpread = !!((move === "(No Move)") && (
                turnResult.results[0].isSpread || turnResult.results[1].isSpread
            ))
            move = move === "(No Move)" ? turnResult.bossMoveUsed : move;
            return {
                move,
                info,
                isSpread,
                repeats: group.repeats,
                teraActivated: !!(turnResult!.moveInfo.options!.activateTera && 
                                turnResult.flags[turnResult.moveInfo.userID].includes("Tera activated"))
            } 
        })
    );
    return moveGroups;
}

function generateGraphic(theme: any, raidInputProps: RaidInputProps, isHiddenAbility: boolean[], learnMethods: string[][], moveTypes: TypeName[][], moveGroups: {move: string, info: RaidMoveInfo, isSpread: boolean, teraActivated: boolean}[][], repeats: number[], backgroundImageURL: string, title?: string, subtitle?: string, notes?: string, credits?: string, translationKey?: any) {
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
                        <Title>{title ? title : "Untitled"}</Title>
                        <Subtitle>{subtitle ? subtitle : `A Strategy For A ${raidInputProps.pokemon[0].species.name} Tera Raid Battle`}</Subtitle>
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
                                                <BuildTypes direction="row">
                                                    {raider.types.map((type, index) => (
                                                        <BuildTypeIcon key={index} src={getTypeIconURL(type)}/>
                                                    ))}
                                                </BuildTypes>
                                                <BuildRole>{raider.role}</BuildRole>
                                                <BuildHeaderSeparator />
                                            </BuildHeader>
                                            <BuildInfoContainer>
                                                <BuildInfo>{ getTranslation("Level", translationKey) + ": " + (raider.level === 13 ? getTranslation("Any",translationKey) : raider.level) }</BuildInfo>
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
                                                <BuildInfo>{ getTranslation("Nature", translationKey) + ": " + (raider.nature === "Hardy" ? getTranslation("Any", translationKey) : getTranslation(raider.nature, translationKey, "natures")) }</BuildInfo>
                                                {getEVDescription(raider.evs) ? 
                                                    <BuildInfo>{ getTranslation("EVs", translationKey) + ": " + getEVDescription(raider.evs)}</BuildInfo> : null}
                                                {getIVDescription(raider.ivs) ? 
                                                    <BuildInfo>{ getTranslation("IVs", translationKey) + ": " + getIVDescription(raider.ivs)}</BuildInfo> : null}
                                            </BuildInfoContainer>
                                            <BuildMovesSection>
                                                <MovesHeader>{ getTranslation("Moves", translationKey) + ":" }</MovesHeader>
                                                <MovesContainer>
                                                    {
                                                        [...Array(4)].map((val, index) => (
                                                            <MoveBox key={"move_box_" + index}>
                                                                {(raider.moves[index] && raider.moves[index] !== "(No Move)") ? <MoveTypeIcon src={getTypeIconURL(moveTypes[raider.id][index])} /> : null}
                                                                {(raider.moves[index] && raider.moves[index] !== "(No Move)") ? <MoveLabel>{ getTranslation(raider.moves[index], translationKey, "moves") }</MoveLabel> : null}
                                                                {(raider.moves[index] && raider.moves[index] !== "(No Move)") ? <MoveLearnMethodIcon src={getMoveMethodIcon(learnMethods[raider.id][index], moveTypes[raider.id][index])} /> : null}
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
                            <SeparatorLabel>{!translationKey ? "Execution" : getTranslation("Moves", translationKey)}</SeparatorLabel>
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
                                                        moveGroup.map((move, moveIndex) => { 
                                                            const showTarget = move.info.userID === 0 ?
                                                                ( move.isSpread || move.move === "Remove Negative Effects" ) :
                                                                !["user", "user-and-allies", "all-pokemon", "all-other-pokemon", "entire-field"].includes(move.info.moveData.target!);
                                                            return (
                                                            <ExecutionMove key={moveIndex}>
                                                                <ExecutionMovePokemonWrapper>
                                                                    <ExecutionMovePokemonName>{raidInputProps.pokemon[move.info.userID].role}</ExecutionMovePokemonName>
                                                                    <ExecutionMovePokemonIconWrapper>
                                                                        <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[move.info.userID].species.name)} />
                                                                    </ExecutionMovePokemonIconWrapper>
                                                                </ExecutionMovePokemonWrapper>
                                                                <ExecutionMoveTag>{getTranslation("uses", translationKey)}</ExecutionMoveTag>
                                                                <ExecutionMoveAction>{getTranslation(move.move, translationKey, "moves")}</ExecutionMoveAction>
                                                                {move.teraActivated &&
                                                                    <ExecutionMoveTeraIconWrapper>
                                                                        <ExecutionMoveTeraIcon src={getTeraTypeIconURL(raidInputProps.pokemon[move.info.userID].teraType!)} />
                                                                    </ExecutionMoveTeraIconWrapper>
                                                                }
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
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[move.move === "Remove Negative Effects" ? 0 : move.info.targetID].species.name)} />
                                                                            </ExecutionMovePokemonIconWrapper> : 
                                                                            <ExecutionMovePokemonIconWrapper direction="row" spacing="-50px">
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[1].species.name)} />
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[2].species.name)} />
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[3].species.name)} />
                                                                                <ExecutionMovePokemonIcon src={getPokemonSpriteURL(raidInputProps.pokemon[4].species.name)} />
                                                                            </ExecutionMovePokemonIconWrapper>

                                                                        }
                                                                    </ExecutionMovePokemonWrapper>
                                                                    :
                                                                    <ExecutionMovePokemonWrapperEmpty />
                                                                }
                                                            </ExecutionMove>
                                                        )})
                                                    }
                                                </ExecutionMoveContainer>
                                                <ExecutionRepeatNumber>{repeats[index] > 1 ? "×" + (repeats[index]) : ""}</ExecutionRepeatNumber>
                                                </ExecutionGroup>
                                        </ExecutionRow>
                                    ))
                                }
                            </ExecutionTable>
                        </ExecutionContainer>
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
                            <Credit>{getTranslation("Graphic", translationKey) + ": theastrogoth.github.io/tera-raid-builder/" }</Credit>
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
                    saveAs(img.src, title + '.png')
                    setLoading(false);
                });
        } else {
            saveAs(graphicUrl, title + '.png')
            setLoading(false);
        }
    });
    graphicTop.remove(); // remove the element from the DOM
}

function GraphicsButton({title, notes, credits, raidInputProps, results, setLoading, translationKey}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, results: RaidBattleResults, setLoading: (l: boolean) => void, translationKey: any}) {

    const theme = useTheme();
    const loadedImageURLRef = useRef<string>(getMiscImageURL("default"));
    const [subtitle, setSubtitle] = useState<string>("");
    const [watermarkText, setWatermarkText] = useState<string>("");

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
            // get learn method + types for moves (maybe we should be storing these somewhere instead of fetching them in several places)
            const pokemonData = (await Promise.all(
                raidInputProps.pokemon.map((poke) => PokedexService.getPokemonByName(poke.name))
            )).filter((data) => data !== undefined) as PokemonData[];
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
            // sort moves into groups
            const moveGroups = getMoveGroups(raidInputProps.groups, results);
            const repeats = raidInputProps.groups.map((group) => group.repeats || 1);
            // generate graphic
            const graphicTop = generateGraphic(theme, raidInputProps, isHiddenAbility, learnMethods, moveTypes, moveGroups, repeats, loadedImageURLRef.current, title, subtitle, notes, credits, translationKey);
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
                            { getTranslation("Choose background", translationKey) }
                        </Button>
                    </label>
                </MenuItem>
                <MenuItem>
                    <TextField 
                        variant="outlined"
                        placeholder={getTranslation("Subtitle", translationKey)}
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                    />
                </MenuItem>
                <MenuItem>
                    <TextField 
                        variant="outlined"
                        placeholder={getTranslation("Watermark text", translationKey)}
                        value={watermarkText}
                        inputProps={{ maxLength: 50 }}
                        onChange={(e) => setWatermarkText(e.target.value)}
                    />
                </MenuItem>
                <MenuItem>
                  <Button
                    variant="outlined"
                    onClick={() => { handleDownload(); handleClose(); }}
                    endIcon={<DownloadIcon />}
                  >
                    { getTranslation("Download", translationKey) }
                  </Button>
                </MenuItem>
            </Menu>
        </Box>

    );
};

export default GraphicsButton;