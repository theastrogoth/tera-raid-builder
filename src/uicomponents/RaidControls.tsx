import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import Popover from '@mui/material/Popover';
import styled from '@mui/material/styles/styled';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import MoveDisplay from './MoveDisplay';

import { RaidInputProps } from "../raidcalc/inputs";
import { RaidBattleResults } from "../raidcalc/RaidBattle";
import { Pokemon, Side, StatsTable } from '../calc';
import { Slider, Typography } from '@mui/material';
import { getPokemonSpriteURL, getTeraTypeIconURL, getStatOrder, getStatusReadableName, getStatReadableName, convertCamelCaseToWords, getItemSpriteURL, getTranslationWithoutCategory } from "../utils";
import { RaidTurnResult } from '../raidcalc/RaidTurn';
import { Raider } from '../raidcalc/Raider';
import { getTranslation } from '../utils';


const raidcalcWorker = new Worker(new URL("../workers/raidcalc.worker.ts", import.meta.url));

type Modifiers = {
    attackCheer?: boolean,
    defenseCheer?: boolean,
    helpingHand?: boolean,
    tera ?: string,
    // teraCharge ?: number,
    shield ?: boolean,
    battery?: number,
    friendGuard?: number,
    powerSpot?: number,
    steelySpirit?: number,
    boostedStat?: string, // from Paradox Abilities
    auroraVeil?: boolean,
    lightScreen?: boolean,
    reflect?: boolean,
    tailwind?: boolean,
    safeguard?: boolean,
    mist?: boolean,
    charged?: boolean,
    status?: string,
    abilityNullified?: boolean,
    charging?: boolean,
    choiceLocked?: boolean,
    endure?: boolean,
    ingrain?: boolean,
    micleBerry?: boolean,
    pumped?: boolean,
    saltCure?: boolean,
    taunt?: boolean,
    yawn?: boolean
}

const Icon = styled(Avatar)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? "#bebebe" : "#7e7e7e",
}));

const HpBar = styled(LinearProgress)(({ theme }) => ({
    height: 8,
    borderRadius: 4,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: "#ffffff00"
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 4,
      backgroundColor: "#30B72D",
    },
}));

function StatChanges({statChanges, translationKey}: {statChanges: StatsTable, translationKey: any}) {
    const filteredStatTable = Object.fromEntries(Object.entries(statChanges).filter(([stat, boosts]) => boosts !== 0));
    const statEntries = Object.entries(filteredStatTable);
    const sortedStatEntries = statEntries.sort((a, b) => {
        return getStatOrder(b[0]) - getStatOrder(a[0]);
    });

    return (
        <Stack direction="row" spacing={.5} useFlexGap flexWrap="wrap">
            {sortedStatEntries && sortedStatEntries.map(([stat, boosts]) => (
                <Paper key={stat} elevation={0} variant='outlined'>
                    <Typography fontSize={10} m={.5}>
                        {`${getTranslation(getStatReadableName(stat), translationKey, "stats")} : ${boosts > 0 ? '+' : ''}${boosts}`}
                    </Typography>
                </Paper>
            ))}
            {(sortedStatEntries.length === 0) &&
                <Paper elevation={0} variant='outlined'>
                    <Typography fontSize={10} m={.5}>No Stat Changes</Typography>
                </Paper>
                
            }
        </Stack>
    );
}

function ModifierGenericTag({text}: {text: String}) {
    return (
        <Paper elevation={0} variant='outlined'>
            <Typography fontSize={10} m={.5}>
                {text}
            </Typography>
        </Paper>
    );
}


function ModifierStatusTag({modifier, value, translationKey}: {modifier: string, value: string, translationKey: any}) {
    return (
        <ModifierGenericTag text={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)} : ${getTranslation(getStatusReadableName(value),translationKey,"status")}`} />
    );
}

function ModifierTypeTag({modifier, value, translationKey}: {modifier: string, value: string, translationKey: any}) {
    return (
        <ModifierGenericTag text={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)} : ${getTranslation(convertCamelCaseToWords(value),translationKey,"types")}`} />
    );
}

function ModifierStatTag({modifier, value, translationKey}: {modifier: string, value: string, translationKey: any}) {
    return (
        <ModifierGenericTag text={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)} : ${getTranslation(getStatReadableName(value),translationKey,"stats")}`} />
    );
}

function ModifierBooleanTag({modifier, translationKey}: {modifier: string, translationKey: any}) {
    return (
        <ModifierGenericTag text={getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)} />
    );
}

function ModifierNumberTag({modifier, value, translationKey}: {modifier: string, value: number, translationKey: any}) {
    return (
        <ModifierGenericTag text ={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)}${value > 1 ? ' ×' + value : ''}`} />
    );
}

function NoModifersTag({modifiers}: {modifiers: Modifiers}) {
    return (
        <ModifierGenericTag text="No Modifiers" />
    );
}

function ModifierTagDispatcher({modifier, value, translationKey}: {modifier: string, value: any, translationKey: any}) {
    switch(typeof value) {
        case "string":
            if (modifier === "status") {
                return value !== "" && <ModifierStatusTag modifier={modifier} value={value} translationKey={translationKey}/>
            }
            else if (modifier === "tera") {
                return value !== "" && <ModifierTypeTag modifier={modifier} value={value} translationKey={translationKey}/>
            }
            else if (modifier === "boostedStat") {
                return value !== "" && <ModifierStatTag modifier={modifier} value={value} translationKey={translationKey}/>
            }
            break;
        case "boolean":
            return value && <ModifierBooleanTag modifier={modifier} translationKey={translationKey}/>;
        case "number":
            return value > 0 && <ModifierNumberTag modifier={modifier} value={value} translationKey={translationKey}/>;
        default:
            return undefined;
    }
}



function ModifierTags({modifiers, translationKey}: {modifiers: Modifiers, translationKey: any}) {
    const noModifiers = Object.entries(modifiers).every(([key, value]) => {
        return !value || value === 0 || value === '';
    });
    return (
        <Stack direction="row" spacing={.5} useFlexGap flexWrap="wrap">
            {Object.entries(modifiers).map(([modifier, value]) => (
                <ModifierTagDispatcher key={modifier} modifier={modifier} value={value} translationKey={translationKey}/>
            ))}
            {noModifiers && <NoModifersTag modifiers={modifiers}/>}
        </Stack>
    );
}

function HpDisplayLine({role, name, item, ability, curhp, prevhp, maxhp, kos, statChanges, modifiers, translationKey}: {role: string, name: string, item?: string, ability?: string, curhp: number, prevhp: number, maxhp: number, kos: number, statChanges: StatsTable, modifiers: object, translationKey: any}) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handlePopoverClose = () => {
      setAnchorEl(null);
    };
  
    const open = Boolean(anchorEl);

    const hpPercent = curhp / maxhp * 100;
    const prevhpPercent = prevhp / maxhp * 100;
    const color = (hpPercent > 50 ? "#30B72D" : hpPercent >= 20 ? "#F1C44F" : "#EC5132");

    return (
        <Box>
            <Stack 
                direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: "100%" }} 
                aria-owns={open ? 'mouse-over-popover' : undefined} aria-haspopup="true"
                onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose}
            >
                <Box sx={{ width: 200 }}>
                    <Stack direction="row">
                        <Box flexGrow={1}/>
                        <Typography>
                            {role}
                        </Typography>
                        <Avatar sx={{width: "20px", height: "20px", marginLeft: "8px"}} variant="rounded">
                            <Box
                                sx={{
                                    width: "16px",
                                    height: "16px",
                                    overflow: 'hidden',
                                    background: `url(${getPokemonSpriteURL(name)}) no-repeat center center / contain`,
                                }}
                            />
                        </Avatar>
                    </Stack>
                </Box>
                <Box sx={{ width: "100%" , position: "relative"}}>
                    {/* Full Bar */}
                    <HpBar 
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
                            },
                            opacity: "100%",
                            position: "absolute",
                            width: "100%"
                        }}
                        variant="determinate" 
                        value={100} 
                    />
                    {/* prevHP > curHP */}
                    <HpBar 
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: (prevhpPercent === hpPercent) ? color : theme.palette.mode === 'light' ? "#909090" : "#ffffff",
                            },
                            opacity: hpPercent < prevhpPercent ? "25%" : "0%",
                            position: "absolute",
                            width: "100%"
                        }}
                        variant="determinate" 
                        value={ hpPercent < prevhpPercent ? prevhpPercent : hpPercent}
                    />
                    {/* curHP */}
                    <HpBar 
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: color,
                            },
                            opacity: "100%",
                            position: "absolute",
                            width: "100%"
                        }}
                        
                        variant="determinate" 
                        value={hpPercent} 
                    />
                    {/* curHP > prevHP */}
                    <HpBar 
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: (prevhpPercent === hpPercent) ? color : theme.palette.mode === 'light' ? "#909090" : "#ffffff",
                            },
                            opacity: hpPercent > prevhpPercent ? "25%" : "0%",
                            width: "100%"
                        }}
                        variant="determinate" 
                        value={ hpPercent > prevhpPercent ? prevhpPercent : hpPercent}
                    />
                </Box>
                <Box sx={{ width: 150 }}>
                    <Typography>
                        { curhp + " / " + maxhp }
                    </Typography>
                </Box>
                <Box sx={{ width: 75 }}>
                    <Typography>
                        {kos > 0 ? ( kos  + (kos > 1 ? " KOs" : " KO")) : ""}
                    </Typography>
                </Box>
            </Stack>
            <Popover
                id={"mouse-over-popover"+role}
                sx={{
                pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
                transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Paper sx={{ p: 2, backgroundColor: "modal.main", width: "200px" }}>
                    <Stack direction="column" spacing={.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Icon variant="rounded">
                                <Box
                                    sx={{
                                        width: "32px",
                                        height: "32px",
                                        overflow: 'hidden',
                                        background: `url(${getPokemonSpriteURL(name)}) no-repeat center center / contain`,
                                    }}
                                />
                                {item && <Box
                                    sx={{
                                        width: "20px",
                                        height: "20px",
                                        position: "absolute",
                                        bottom: "0px",
                                        right: "0px",
                                        overflow: 'hidden',
                                        background: `url(${getItemSpriteURL(item)}) no-repeat center center / contain`,
                                    }}
                                />}
                            </Icon>
                            <Stack direction="column" spacing={0}>
                                <Typography fontSize={18} mb={-.5}>{role}</Typography>
                                <Typography fontSize={10}>{getTranslation("Ability", translationKey) + ": " + (ability === "(No Ability)" ? getTranslation("none", translationKey) : getTranslation(ability || "", translationKey, "abilities"))}</Typography>
                            </Stack>
                        </Stack>
                        <Divider textAlign="left" orientation="horizontal" flexItem>{getTranslation("Stat Changes", translationKey)}</Divider>
                        <StatChanges statChanges={statChanges} translationKey={translationKey} />
                        <Divider textAlign="left" orientation="horizontal" flexItem>{getTranslation("Modifiers", translationKey)}</Divider>
                        <ModifierTags modifiers={modifiers} translationKey={translationKey} />
                    </Stack>
                </Paper>
            </Popover>
        </Box>
    );
}

function HpDisplay({results, translationKey}: {results: RaidBattleResults, translationKey: any}) {
    const [displayedTurn, setDisplayedTurn] = useState<number>(0);
    const [snapToEnd, setSnapToEnd] = useState<boolean>(true);
    const maxhps = results.endState.raiders.map((raider) => ( raider.maxHP === undefined ? new Pokemon(9, raider.name, {...raider}).maxHP() : raider.maxHP()) );
    
    const turnState = (
        (displayedTurn === 0) ? results.turnZeroState :
        (displayedTurn > results.turnResults.length) ? results.endState : 
        results.turnResults[Math.min(results.turnResults.length, displayedTurn) - 1].state
    );
    const prevTurnState = (
        (displayedTurn <= 1) ? results.turnZeroState : 
        (displayedTurn > results.turnResults.length) ? results.endState :
        results.turnResults[Math.min(results.turnResults.length, displayedTurn) - 2].state
    );
    const currenthps = displayedTurn === 0 ? maxhps : turnState.raiders.map((raider) => raider.originalCurHP); 
    const prevhps = displayedTurn <= 1 ? maxhps : prevTurnState.raiders.map((raider) => raider.originalCurHP);

    const koCounts = [0,1,2,3,4].map((i) => results.turnResults.slice(0,displayedTurn).reduce((kos, turn, idx) => 
            kos + ((turn.state.raiders[i].originalCurHP === 0 && (i === 0 || turn.moveInfo.userID === i)) ? 1 : 0),
        0));
    koCounts[0] = Math.min(koCounts[0], 1);
    const roles = results.endState.raiders.map((raider) => raider.role);
    const names = results.endState.raiders.map((raider) => raider.name);
    const items = turnState.raiders.map((raider) => raider.item);
    const abilities = turnState.raiders.map((raider) => raider.ability);

    const statChanges = turnState.raiders.map((raider) => raider.boosts);
    const getModifiers = (raider: Raider): Modifiers => {
        return {
            "attackCheer": raider.field.attackerSide.isAtkCheered > 0,
            "defenseCheer": raider.field.attackerSide.isDefCheered > 0,
            "helpingHand": raider.field.attackerSide.isHelpingHand,
            "tera": raider.isTera ? raider.teraType : "",
            // "teraCharge": raider.teraCharge,
            "shield": raider.shieldActive,
            "battery": raider.field.attackerSide.batteries,
            "friendGuard": raider.field.attackerSide.friendGuards,
            "powerSpot": raider.field.attackerSide.powerSpots,
            "steelySpirit": raider.field.attackerSide.steelySpirits,
            "boostedStat": raider.abilityOn && raider.boostedStat ? raider.boostedStat : "",
            "auroraVeil": raider.field.attackerSide.isAuroraVeil > 0,
            "lightScreen": raider.field.attackerSide.isLightScreen > 0,
            "reflect": raider.field.attackerSide.isReflect > 0,
            "tailwind": raider.field.attackerSide.isTailwind > 0,
            "safeguard": raider.field.attackerSide.isSafeguard > 0,
            "mist": raider.field.attackerSide.isMist > 0,
            "charged": raider.field.attackerSide.isCharged,
            "status": raider.status,
            "abilityNullified": raider.abilityNullified !== undefined && raider.abilityNullified !== 0,
            "charging": raider.isCharging,
            "choiceLocked": raider.isChoiceLocked,
            "endure": raider.isEndure,
            "ingrain": raider.isIngrain,
            "micleBerry": raider.isMicle,
            "pumped": raider.isPumped,
            "saltCure": raider.isSaltCure,
            "taunt": raider.isTaunt !== undefined && raider.isTaunt !== 0,
            "yawn": raider.isYawn !== undefined && raider.isYawn !== 0,
        }
    }
    const modifiers = turnState.raiders.map((raider) => getModifiers(raider));

    const currentBossRole = turnState.raiders[0].role;
    const currentRaiderRole = getCurrentRaiderRole(results, displayedTurn, roles);
    const currentMoves = getCurrentMoves(results, displayedTurn, translationKey);
    const currentBossMove = currentMoves[0];
    const currentRaiderMove = currentMoves[1];
    const currentTurnText = getCurrentTurnText(currentBossRole, currentRaiderRole, currentBossMove, currentRaiderMove, translationKey);

    useEffect(() => { 
        if (snapToEnd || displayedTurn > results.turnResults.length) {
            setDisplayedTurn(results.turnResults.length);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results.turnResults.length]);

    useEffect(() => {
        if (displayedTurn === results.turnResults.length) {
            setSnapToEnd(true);
        } else {
            setSnapToEnd(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayedTurn]);

    return (
        <Stack spacing={1} sx={{marginBottom: 2}}>
            {[0,1,2,3,4].map((i) => (
                <HpDisplayLine key={i} role={roles[i]} name={names[i]} item={items[i]} ability={abilities[i]} curhp={currenthps[i]} prevhp={prevhps[i]} maxhp={maxhps[i]} kos={koCounts[i]} statChanges={statChanges[i]} modifiers={modifiers[i]} translationKey={translationKey} />
            ))};
            <Stack direction="column" justifyContent="center" alignItems="center">
                <Typography fontSize={10} noWrap={true}>
                    {currentTurnText}
                </Typography>
                <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ width: "100%" }}>
                    <Box sx={{ width: 115 }}>
                        <Stack direction="row">
                            <Box flexGrow={1}/>
                            <Typography>
                                {displayedTurn === 0 ? getTranslation("Battle Start",translationKey) :
                                    getTranslation("Move", translationKey) + " " + displayedTurn
                                }
                            </Typography>
                        </Stack>
                    </Box>
                    <Slider 
                        value={displayedTurn}
                        onChange={(event, newValue) => setDisplayedTurn(newValue as number)}
                        step={1}
                        marks
                        min={0}
                        max={results.turnResults.length}
                    />
                    <Box sx={{ width: 50 }} />
                </Stack>
            </Stack>
        </Stack>
    )
}

function getCurrentRaiderRole(results: RaidBattleResults, displayedTurn: number, roles: String[]) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return roles[0];
    }
    else {
        try {
            return roles[results.turnResults[Math.min(results.turnResults.length, displayedTurn) - 1].moveInfo.userID]
        }
        catch(e) {
            return roles[0];
        }
    }
}

function getCurrentRaiderMove(results: RaidBattleResults, displayedTurn: number, translationKey: any) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return undefined;
    }
    else {
        try {
            const currentRaiderMove = results.turnResults[displayedTurn - 1].raiderMoveUsed
            if (currentRaiderMove === "(No Move)") {
                return undefined
            }
            else {
                return getTranslation(currentRaiderMove, translationKey, "moves");
            }
        }
        catch(e) {
            return undefined;
        }
    }
}

function getCurrentMoves(results: RaidBattleResults, displayedTurn: number, translationKey: any) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return [undefined, undefined];
    }
    else {
        try {
            let currentMoves: any[] = []
            const currentBossMove = results.turnResults[displayedTurn - 1].bossMoveUsed
            currentMoves = [...currentMoves, currentBossMove === "(No Move)" ? undefined : getTranslation(currentBossMove, translationKey, "moves")]
            const currentRaiderMove = results.turnResults[displayedTurn - 1].raiderMoveUsed
            currentMoves = [...currentMoves, currentRaiderMove === "(No Move)" ? undefined : getTranslation(currentRaiderMove, translationKey, "moves")]
            return currentMoves
        }
        catch(e) {
            return [undefined, undefined];
        }
    }
}

function getCurrentTurnText(bossRole: String, raiderRole: String, bossMove: String | undefined, raiderMove: String | undefined, translationKey: any) {
    if (!bossMove && !raiderMove) {
        return getTranslation("No Moves Used", translationKey);
    }
    const usedTranslation = getTranslation("used", translationKey);
    if (bossMove && !raiderMove) {
        return `${bossRole} ${usedTranslation} ${bossMove}`;
    }
    else if (!bossMove && raiderMove) {
        return `${raiderRole} ${usedTranslation} ${raiderMove}`;
    }
    else {
        return `${bossRole} ${usedTranslation} ${bossMove} : ${raiderRole} ${usedTranslation} ${raiderMove}`;
    }
}

function RaidControls({raidInputProps, results, setResults, prettyMode, translationKey}: {raidInputProps: RaidInputProps, results: RaidBattleResults, setResults: (r: RaidBattleResults) => void, prettyMode: boolean, translationKey: any}) {
    const [value, setValue] = useState<number>(1);
    const groups = raidInputProps.groups;
    const boss = raidInputProps.pokemon[0];
    const pokemon1 = raidInputProps.pokemon[1];
    const pokemon2 = raidInputProps.pokemon[2];
    const pokemon3 = raidInputProps.pokemon[3];
    const pokemon4 = raidInputProps.pokemon[4];
    
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };  

    useEffect(() => {
        raidcalcWorker.onmessage = (event: MessageEvent<RaidBattleResults>) => {
            if (event && event.data) {
                setResults(event.data);
            }
        }
    }, [setResults]);

    useEffect(() => {
        const info = {
            raiders: raidInputProps.pokemon,
            groups: raidInputProps.groups,
        }
        raidcalcWorker
            .postMessage(info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups, 
        boss, 
        pokemon1, 
        pokemon2, 
        pokemon3, 
        pokemon4
      ]
    );

    return (
        <Box width={610} sx={{ mx: 1}}>
            <Stack>
                <Box paddingBottom={1}>
                    <Tabs value={value} onChange={handleChange} centered>
                        <Tab 
                            label={getTranslation("Move Order", translationKey)} 
                            value={1} 
                        />
                        <Tab 
                            label={getTranslation("Calc Results", translationKey)}
                            value={2} 
                        />
                    </Tabs>
                </Box>
                <Box hidden={value !== 1}>
                    <HpDisplay results={results} translationKey={translationKey}/>
                </Box>
                <Box hidden={value !== 1}>
                    <Box sx={{ height: 560, overflowY: "auto" }}>
                        {!prettyMode &&
                            <MoveSelection raidInputProps={raidInputProps} translationKey={translationKey}/>
                        }
                        {prettyMode &&
                            <MoveDisplay groups={raidInputProps.groups} raiders={raidInputProps.pokemon} results={results} translationKey={translationKey}/>
                        }
                    </Box>
                </Box>
                <Box hidden={value !== 2} sx={{ height: 560, overflowY: "auto" }}>
                    <RaidResults results={results} />
                </Box>
            </Stack>
        </Box>
    )
}

export default React.memo(RaidControls);