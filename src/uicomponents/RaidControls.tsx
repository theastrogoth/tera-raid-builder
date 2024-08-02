import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Switch from "@mui/material/Switch";
import WarningIcon from '@mui/icons-material/Warning';
import styled from '@mui/material/styles/styled';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import MoveDisplay from './MoveDisplay';

import { RaidInputProps } from "../raidcalc/inputs";
import { RaidBattleResults } from "../raidcalc/RaidBattle";
import { Pokemon, StatsTable } from '../calc';
import { getPokemonSpriteURL, getStatOrder, getStatusReadableName, getStatReadableName, convertCamelCaseToWords, getItemSpriteURL, getTranslationWithoutCategory } from "../utils";
import { Raider } from '../raidcalc/Raider';
import { getTranslation } from '../utils';
import { MoveData, RaidTurnInfo, TurnGroupInfo } from '../raidcalc/interface';
import { MoveName } from '../calc/data/interface';
import { getModifiedSpeed } from '../raidcalc/util';


const raidcalcWorker = new Worker(new URL("../workers/raidcalc.worker.ts", import.meta.url));

type Modifiers = {
    attackCheer?: number,
    defenseCheer?: number,
    helpingHand?: boolean,
    tera ?: string,
    formChanged ?: string,
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
    aromaVeil?: boolean,
    mist?: boolean,
    charged?: boolean,
    status?: string,
    abilityNullified?: boolean,
    charging?: boolean,
    choiceLocked?: string,
    encore?: string,
    torment?: boolean,
    disable?: string,
    endure?: boolean,
    ingrain?: boolean,
    smackDown?: boolean,
    micleBerry?: boolean,
    pumped?: number,
    saltCure?: boolean,
    stockpile?: number,
    taunt?: boolean,
    yawn?: boolean,
    throatChop?: boolean,
    substituteHP?: number,
    wideGuard?: boolean,
    quickGuard?: boolean,
    hitsTaken?: number,
    timesFainted?: number,
    minimized?: boolean,
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

function StatChanges({statChanges, randomStatBoosts, effectiveSpeed, translationKey}: {statChanges: StatsTable, randomStatBoosts: number, effectiveSpeed: number | undefined, translationKey: any}) {
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
            {(randomStatBoosts !== 0) &&
                <Paper elevation={0} variant='outlined'>
                    <Typography fontSize={10} m={.5}>
                        {`${getTranslation("Random Stat Boosts", translationKey)} : ${randomStatBoosts > 0 ? '+' : ''}${randomStatBoosts}`}
                    </Typography>
                </Paper>
            }
            {(sortedStatEntries.length === 0 && !randomStatBoosts) &&
                <Paper elevation={0} variant='outlined'>
                    <Typography fontSize={10} m={.5}>{getTranslation("No Stat Changes", translationKey)}</Typography>
                </Paper>
                
            }
            {(effectiveSpeed) &&
                <Paper elevation={0} variant='outlined'>
                    <Typography fontSize={10} m={.5}>{`${getTranslation("Effective Speed", translationKey)} : ${effectiveSpeed}`}</Typography>
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

function ModifierChoiceLockTag({modifier, value, translationKey}: {modifier: string, value: string, translationKey: any}) {
    return (
        <ModifierGenericTag text={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)} : ${getTranslation(value,translationKey,"moves")}`} />
    );
}

function ModifierBooleanTag({modifier, translationKey}: {modifier: string, translationKey: any}) {
    return (
        <ModifierGenericTag text={getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)} />
    );
}

function ModifierNumberTag({modifier, value, translationKey}: {modifier: string, value: number, translationKey: any}) {
    return (
        <ModifierGenericTag text={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)}${value > 1 ? ' ×' + value : ''}`} />
    );
}
function ModifierValueTag({modifier, value, translationKey}: {modifier: string, value: number, translationKey: any}) {
    return (
        <ModifierGenericTag text={`${getTranslationWithoutCategory(convertCamelCaseToWords(modifier),translationKey)}${value > 1 ? ': ' + value : ''}`} />
    )
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
            else if (modifier === "formChanged") {
                return value !== "" && <ModifierGenericTag text={value}/>
            }
            else if (modifier === "boostedStat") {
                return value !== "" && <ModifierStatTag modifier={modifier} value={value} translationKey={translationKey}/>
            } 
            else if (modifier === "choiceLocked" || modifier === "encore" || modifier === "disable") {
                return value !== "" && <ModifierChoiceLockTag modifier={modifier} value={value} translationKey={translationKey}/>
            }
            break;
        case "boolean":
            return value && <ModifierBooleanTag modifier={modifier} translationKey={translationKey}/>;
        case "number":
            if (modifier === "substituteHP" || modifier === "timesFainted" || modifier === "hitsTaken") {
                return value > 0 && <ModifierValueTag modifier={modifier} value={value} translationKey={translationKey}/>;
            } else {
                return value > 0 && <ModifierNumberTag modifier={modifier} value={value} translationKey={translationKey}/>;
            }
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

function HpDisplayLine({index, role, name, item, ability, curhp, prevhp, maxhp, hasSubstitute, kos, koChance, warnings, statChanges, randomStatBoosts, effectiveSpeed, modifiers, translationKey}: {index: number, role: string, name: string, item?: string, ability?: string, curhp: number, prevhp: number, maxhp: number, hasSubstitute: boolean, kos: number, koChance: number, warnings: string[] | undefined, statChanges: StatsTable, randomStatBoosts: number, effectiveSpeed: number | undefined, modifiers: object, translationKey: any}) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [WarningAnchorEl, setWarningAnchorEl] = React.useState<HTMLElement | null>(null)

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handlePopoverClose = () => {
      setAnchorEl(null);
    };

    const hasWarning = (index && warnings && warnings.length > 0);
    const hasKoChance = (index === 0 ? 
        (curhp === 0 && koChance < 100) : 
        (koChance > 0));
    const showWarning = hasWarning || hasKoChance;

    const handleWarningOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (showWarning) {
            setWarningAnchorEl(event.currentTarget);
        }
    };

    const handleWarningClose = () => {
        setWarningAnchorEl(null);
    };
  
    const open = Boolean(anchorEl);
    const WarningOpen = Boolean(WarningAnchorEl);

    const hpPercent = curhp / maxhp * 100;
    const prevhpPercent = prevhp / maxhp * 100;
    const color = (hpPercent > 50 ? "#30B72D" : hpPercent >= 20 ? "#F1C44F" : "#EC5132");

    return (
        <Box>
            <Stack direction="row" spacing={-1}>
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
                                        background: `url(${getPokemonSpriteURL(hasSubstitute ? "Substitute" : name)}) no-repeat center center / contain`,
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
                </Stack>
                <Stack direction="row" spacing={1} justifyContent="start" alignItems="center" sx={{ width: "85px"}}
                    aria-owns={open ? 'warning-popover' : undefined} aria-haspopup="true"
                    onMouseEnter={handleWarningOpen} onMouseLeave={handleWarningClose}
                >
                    <Box sx={{ width: "40px" }}>
                        <Typography>
                            {kos > 0 ? ( kos  + (kos > 1 ? " KOs" : " KO")) : ""}
                        </Typography>
                    </Box>
                    <Box sx={{ width: "10px", position: "absolute", transform: "translate(30px, 2px)"}}>
                        { showWarning &&
                            <WarningIcon color={"warning"} />
                        }
                    </Box>
                </Stack>
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
                                        background: `url(${getPokemonSpriteURL(hasSubstitute ? "Substitute" : name)}) no-repeat center center / contain`,
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
                        <StatChanges statChanges={statChanges} randomStatBoosts={randomStatBoosts} effectiveSpeed={effectiveSpeed} translationKey={translationKey} />
                        <Divider textAlign="left" orientation="horizontal" flexItem>{getTranslation("Modifiers", translationKey)}</Divider>
                        <ModifierTags modifiers={modifiers} translationKey={translationKey} />
                    </Stack>
                </Paper>
            </Popover>
            <Popover
                id={"warning-popover"+role}
                sx={{
                pointerEvents: 'none',
                }}
                open={WarningOpen}
                anchorEl={WarningAnchorEl}
                anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
                }}
                transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
                }}
                onClose={handleWarningClose}
                disableRestoreFocus
            >
                <Paper sx={{ p: 1, backgroundColor: "modal.main" }}>
                    <Stack spacing={1}>
                        { hasWarning &&
                            warnings.map((warning, i) => (
                                <Typography key={i} fontSize={10}>
                                    {warning}
                                </Typography>
                            ))
                        }
                        { hasKoChance &&
                            <Typography fontSize={10}>
                                {koChance + "% " + getTranslation("chance to be KOd", translationKey)}
                            </Typography>
                        }
                    </Stack>
                </Paper>
            </Popover>
        </Box>
    );
}

function HpDisplay({results, translationKey}: {results: RaidBattleResults, translationKey: any}) {
    const [displayedTurn, setDisplayedTurn] = useState<number>(0);
    const [snapToEnd, setSnapToEnd] = useState<boolean>(true);

    const turnIdx = Math.min(results.turnResults.length, displayedTurn) - 1;

    const turnState = (
        (displayedTurn === 0) ? results.turnZeroState :
        (displayedTurn > results.turnResults.length) ? results.endState : 
        results.turnResults[turnIdx].state
    );
    const prevTurnState = (
        (displayedTurn <= 1) ? results.turnZeroState : 
        (displayedTurn > results.turnResults.length) ? results.endState :
        results.turnResults[turnIdx - 1].state
    );
    const maxhps = turnState.raiders.map((raider) => ( raider.maxHP === undefined ? new Pokemon(9, (raider.isTransformed && raider.originalSpecies) ? raider.originalSpecies  : raider.name, {...raider}).maxHP() : raider.maxHP()) );
    const currenthps = displayedTurn === 0 ? maxhps : turnState.raiders.map((raider) => raider.originalCurHP); 
    const prevhps = displayedTurn <= 1 ? maxhps : prevTurnState.raiders.map((raider) => raider.originalCurHP);

    const koCounts = turnState.raiders.map((raider) => raider.timesFainted);
    const koChances = turnState.raiders.map((raider) => raider.koChance);
    const roles = turnState.raiders.map((raider) => raider.role);
    const names = turnState.raiders.map((raider) => raider.name);
    const items = turnState.raiders.map((raider) => raider.item);
    const abilities = turnState.raiders.map((raider) => raider.ability);
    const haveSubstitutes = turnState.raiders.map((raider) => !!raider.substitute)

    const statChanges = turnState.raiders.map((raider) => raider.boosts);
    const randomStatBoosts = turnState.raiders.map((raider) => raider.randomBoosts || 0);
    const effectiveSpeeds = turnState.raiders.map((raider) => {
        const effectiveSpeed = getModifiedSpeed(raider);
        return (effectiveSpeed === results.turnZeroState.raiders[raider.id].stats.spe) ? undefined : effectiveSpeed;
    });
    const getModifiers = (raider: Raider): Modifiers => {
        return {
            "attackCheer": (raider.field.attackerSide.isAtkCheered ? 1 : 0) + raider.permanentAtkCheers,
            "defenseCheer":(raider.field.attackerSide.isDefCheered ? 1 : 0) + raider.permanentDefCheers,
            "helpingHand": raider.field.attackerSide.isHelpingHand,
            "tera": raider.isTera ? raider.teraType : "",
            "formChanged": raider.isChangedForm ? raider.name : "",
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
            "aromaVeil": raider.field.attackerSide.isAromaVeil,
            "mist": raider.field.attackerSide.isMist > 0,
            "charged": raider.field.attackerSide.isCharged,
            "status": raider.status,
            "abilityNullified": raider.abilityNullified !== undefined && raider.abilityNullified !== 0,
            "charging": raider.isCharging,
            "choiceLocked": raider.isChoiceLocked && raider.lastMove ? raider.lastMove.name : "",
            "encore": raider.isEncore && raider.lastMove ? raider.lastMove.name : "",
            "disable": raider.isDisable && raider.disabledMove ? raider.disabledMove : "",
            "endure": raider.isEndure,
            "ingrain": raider.isIngrain,
            "smackDown": raider.isSmackDown,
            "micleBerry": raider.isMicle,
            "pumped": raider.isPumped,
            "saltCure": raider.isSaltCure,
            "stockpile": raider.stockpile,
            "taunt": raider.isTaunt !== undefined && raider.isTaunt !== 0,
            "yawn": raider.isYawn !== undefined && raider.isYawn !== 0,
            "throatChop": raider.isThroatChop !== undefined && raider.isThroatChop !== 0,
            "substituteHP": raider.substitute,
            "wideGuard": raider.field.attackerSide.isWideGuard,
            "quickGuard": raider.field.attackerSide.isQuickGuard,
            "hitsTaken": raider.moves.includes("Rage Fist" as MoveName) ? raider.hitsTaken : undefined,
            "timesFainted": (raider.moves.includes("Last Respects" as MoveName) || raider.ability === "Supreme Overlord") ? raider.timesFainted : undefined,
            "minimized": raider.isMinimize,
        }
    }
    const modifiers = turnState.raiders.map((raider) => getModifiers(raider));

    const currentBossRole = turnState.raiders[0].role;
    const currentRaiderIndex = getCurrentRaiderIndex(results, displayedTurn);
    const currentRaiderRole = roles[currentRaiderIndex];
    const currentMoves = getCurrentMoves(results, displayedTurn, translationKey);
    const currentBossMove = currentMoves[0];
    const currentRaiderMove = currentMoves[1];
    const raiderMovesFirst = getCurrentMoveOrder(results, displayedTurn);
    const currentTurnText = getCurrentTurnText(currentBossRole, currentRaiderRole, currentBossMove, currentRaiderMove, raiderMovesFirst, translationKey);

    const warnings = getCurrentWarning(results, displayedTurn);

    const currentTurnDescs = turnIdx < 0 ? [] : [
        results.turnResults[turnIdx].results[0].desc.filter((d) => d !== ""),
        results.turnResults[turnIdx].results[1].desc.filter((d) => d !== "")
    ].filter((d) => d.length > 0);

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
      };
    
      const handlePopoverClose = () => {
        setAnchorEl(null);
      };

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
        <>
        <Stack spacing={1} sx={{marginBottom: 2}}>
            {[0,1,2,3,4].map((i) => (
                <HpDisplayLine 
                    key={i} 
                    index={i} 
                    role={roles[i]}
                    name={names[i]} 
                    item={items[i]} 
                    ability={abilities[i]} 
                    curhp={currenthps[i]} 
                    prevhp={prevhps[i]} 
                    maxhp={maxhps[i]} 
                    hasSubstitute={haveSubstitutes[i]} 
                    kos={koCounts[i]} 
                    koChance={koChances[i]} 
                    warnings={i === currentRaiderIndex ? warnings : undefined}
                    statChanges={statChanges[i]} 
                    randomStatBoosts={randomStatBoosts[i]} 
                    effectiveSpeed={effectiveSpeeds[i]} 
                    modifiers={modifiers[i]} 
                    translationKey={translationKey} 
                />
            ))}
            <Stack direction="column" justifyContent="center" alignItems="center">
                <Typography fontSize={10} noWrap={true} onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose}>
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
        <Popover
                id={"mouse-over-calcs-popover"}
                sx={{
                pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
                }}
                transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Paper sx={{ p: 1.25, backgroundColor: "modal.main", width: "400px" }}>
                    <Stack direction="column" spacing={2}>
                        { currentTurnDescs.map((ds, i) => 
                            <Stack key={i} direction="column" spacing={1}>
                                {ds.map((d, j) => (
                                    <Typography key={`${i}${j}`} fontSize={10}>{d}</Typography>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </Popover>
        </>
    )
}

function getCurrentRaiderIndex(results: RaidBattleResults, displayedTurn: number) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return 0;
    }
    else {
        try {
            return results.turnResults[displayedTurn - 1].moveInfo.userID
        }
        catch(e) {
            return 0;
        }
    }
}

function getCurrentWarning(results: RaidBattleResults, displayedTurn: number) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return undefined;
    }
    else {
        try {
            const raiderMovesFirst = results.turnResults[displayedTurn - 1].raiderMovesFirst;
            return results.turnResults[displayedTurn - 1].results[raiderMovesFirst ? 0 : 1].warnings;
        }
        catch(e) {
            return undefined;
        }
    }
}

// function getCurrentRaiderMove(results: RaidBattleResults, displayedTurn: number, translationKey: any) {
//     if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
//         return undefined;
//     }
//     else {
//         try {
//             const currentRaiderMove = results.turnResults[displayedTurn - 1].raiderMoveUsed
//             if (currentRaiderMove === "(No Move)") {
//                 return undefined
//             }
//             else {
//                 return getTranslation(currentRaiderMove, translationKey, "moves");
//             }
//         }
//         catch(e) {
//             return undefined;
//         }
//     }
// }

function getCurrentMoves(results: RaidBattleResults, displayedTurn: number, translationKey: any) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return [undefined, undefined];
    }
    else {
        try {
            const raiderMovesFirst = results.turnResults[displayedTurn - 1].raiderMovesFirst;
            let currentMoves: any[] = []
            const bossMoveNotExecuted = results.turnResults[displayedTurn - 1].results[raiderMovesFirst ? 1 : 0].desc.join("") === "";
            const currentBossMove = bossMoveNotExecuted ? "(No Move)" : results.turnResults[displayedTurn - 1].bossMoveUsed
            currentMoves = [...currentMoves, currentBossMove === "(No Move)" ? undefined : getTranslation(currentBossMove, translationKey, "moves")]
            const raiderMoveNotExecuted = results.turnResults[displayedTurn - 1].results[raiderMovesFirst ? 0 : 1].desc.join("") === "";
            const currentRaiderMove = raiderMoveNotExecuted ? "(No Move)" : results.turnResults[displayedTurn - 1].raiderMoveUsed
            currentMoves = [...currentMoves, currentRaiderMove === "(No Move)" ? undefined : getTranslation(currentRaiderMove, translationKey, "moves")]
            return currentMoves
        }
        catch(e) {
            return [undefined, undefined];
        }
    }
}

function getCurrentMoveOrder(results: RaidBattleResults, displayedTurn: number) {
    if (displayedTurn === 0 || displayedTurn > results.turnResults.length) {
        return false;
    }
    else {
        try {
           return results.turnResults[displayedTurn - 1].raiderMovesFirst;
        }
        catch(e) {
            return false;
        }
    }
}

function getCurrentTurnText(bossRole: String, raiderRole: String, bossMove: String | undefined, raiderMove: String | undefined, raiderMovesFirst: boolean, translationKey: any) {
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
    else if (raiderMovesFirst) {
        return `${raiderRole} ${usedTranslation} ${raiderMove} : ${bossRole} ${usedTranslation} ${bossMove}`;
    }
    else {
        return `${bossRole} ${usedTranslation} ${bossMove} : ${raiderRole} ${usedTranslation} ${raiderMove}`;
    }
}

function RollCaseButtons({raidInputProps, setRollCase, translationKey}: {raidInputProps: RaidInputProps, setRollCase: (c: "min" | "avg" | "max") => void, translationKey: any}) {
    return (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ marginTop: 1, marginBottom: 2, paddingTop: "5px", paddingBottom: "5px"}}>
            <RollCaseButton 
                rollCase="min"
                raidInputProps={raidInputProps}
                setRollCase={setRollCase}
                translationKey={translationKey}
            />
            <RollCaseButton 
                rollCase="avg"
                raidInputProps={raidInputProps}
                setRollCase={setRollCase}
                translationKey={translationKey}
            />
            <RollCaseButton 
                rollCase="max"
                raidInputProps={raidInputProps}
                setRollCase={setRollCase}
                translationKey={translationKey}
            />
        </Stack>
    )
}

function RollCaseButton({raidInputProps, rollCase, setRollCase, translationKey}: {raidInputProps: RaidInputProps, rollCase: "max" | "min" | "avg", setRollCase: (c: "min" | "avg" | "max") => void, translationKey: any}) {
    const caseIsMatched = rollCaseCheck(rollCase, raidInputProps.groups);
    const handleClick = () => {
        const newGroups: TurnGroupInfo[] = raidInputProps.groups.map(g => {
            const newTurns: RaidTurnInfo[] = g.turns.map(t => {
                const [raiderOptions, bossOptions] = getMoveOptionsForRollCase(rollCase, t.moveInfo.targetID, t.moveInfo.moveData, t.bossMoveInfo.moveData);
                const newRaiderMoveInfo = {...t.moveInfo};
                newRaiderMoveInfo.options = {...newRaiderMoveInfo.options, ...raiderOptions}
                const newBossMoveInfo = {...t.bossMoveInfo};
                newBossMoveInfo.options = {...newBossMoveInfo.options, ...bossOptions}
                const newTurn: RaidTurnInfo = {
                    id: t.id,
                    group: t.group,
                    moveInfo: newRaiderMoveInfo,
                    bossMoveInfo: newBossMoveInfo
                }
                return newTurn
            })
            return {
                id: g.id,
                repeats: g.repeats,
                turns: newTurns
            }
        })
        raidInputProps.setGroups(newGroups);
        setRollCase(rollCase);
    }
    return (
        <Button
            variant="contained" 
            size="small" 
            //@ts-ignore
            color={caseIsMatched ? "tertiary" : "secondary"}
            sx={{ minWidth: "100px", height: caseIsMatched ? "30px" : "25px", fontWeight: caseIsMatched ? "bold" : "normal",}} 
            onClick={handleClick}
        >
            {getTranslation((rollCase === "max" ? "Best Case" : (rollCase === "min" ? "Worst Case" : "Average Case")), translationKey)}
        </Button>
    )
}

function getMoveOptionsForRollCase(rollCase: "max" | "min" | "avg", targetID: number, moveData: MoveData, bossMoveData: MoveData) {
    const bossRollCase = rollCase === "max" ? "min" : (rollCase === "min" ? "max" : "avg")
    const raiderRollCase = (targetID !== 0 && moveData.category?.includes("damage")) ? bossRollCase : rollCase;
    return [rollCaseToOptions(raiderRollCase, moveData), rollCaseToOptions(bossRollCase, bossMoveData)]
}

function rollCaseToOptions(rollCase: "max" | "min" | "avg", moveData: MoveData) {
    return {
        crit: rollCase === "max",
        secondaryEffects: rollCase === "max",
        hits: rollCase === "max" ? 10 : (
            rollCase === "min" ? 1 : (
                Math.floor(((moveData.minHits || 1) + (moveData.maxHits || 1)) / 2)
            )
        ),
        roll: rollCase
    }
}

function rollCaseCheck(rollCase: "max" | "min" | "avg", groups: TurnGroupInfo[]) {
    let matchesCase = true;
    for (let group of groups) {
        for (let turn of group.turns) {
            const [raiderShouldMatch, bossShouldMatch] = getMoveOptionsForRollCase(rollCase, turn.moveInfo.targetID, turn.moveInfo.moveData, turn.bossMoveInfo.moveData);
            const raiderMatches = !!turn.moveInfo.options &&
                turn.moveInfo.options.crit === raiderShouldMatch.crit &&
                turn.moveInfo.options.secondaryEffects === raiderShouldMatch.secondaryEffects &&
                ((turn.moveInfo.moveData.maxHits || 1) > 1 ? turn.moveInfo.options.hits === raiderShouldMatch.hits : true) &&
                turn.moveInfo.options.roll === raiderShouldMatch.roll;
            const bossMatches = !!turn.bossMoveInfo.options &&
                turn.bossMoveInfo.options.crit === bossShouldMatch.crit &&
                turn.bossMoveInfo.options.secondaryEffects === bossShouldMatch.secondaryEffects &&
                ((turn.bossMoveInfo.moveData.maxHits || 1) > 1 ? turn.bossMoveInfo.options.hits === bossShouldMatch.hits : true) &&
                turn.bossMoveInfo.options.roll === bossShouldMatch.roll;
            matchesCase = matchesCase && raiderMatches && bossMatches;
            if (!matchesCase) {
                return false;
            }
        }
    }
    return matchesCase;
}

function OptimizeBossMovesButton({raidInputProps, translationKey}: {raidInputProps: RaidInputProps, translationKey: any}) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const alreadyOptimized = (gs: TurnGroupInfo[]) => {
        return !gs.some((g) => g.turns.some((t) => t.bossMoveInfo.moveData.name === "(Most Damaging)"));
    }

    const switchIsOn = alreadyOptimized(raidInputProps.groups);

    const handleConfirm = () => {
        const groups: TurnGroupInfo[] = [];
        for (let g of raidInputProps.groups) {
            const newTurns = g.turns.map(t => { return {
                ...t,
                bossMoveInfo: {
                    ...t.bossMoveInfo,
                    moveData: {
                        ...t.bossMoveInfo.moveData,
                        name: t.bossMoveInfo.moveData.name === "(Most Damaging)" ? "(Optimal Move)" as MoveName : t.bossMoveInfo.moveData.name,
                    }
                }
            }});
            groups.push({
                ...g,
                turns: newTurns
            });
        }
        raidInputProps.setGroups(groups);
        setOpen(false);
    }

    const handleTurnOff = () => {
        const groups: TurnGroupInfo[] = [];
        for (let g of raidInputProps.groups) {
            const newTurns = g.turns.map(t => { return {
                ...t,
                bossMoveInfo: {
                    ...t.bossMoveInfo,
                    moveData: {
                        ...t.bossMoveInfo.moveData,
                        name: t.bossMoveInfo.moveData.name === "(Optimal Move)" ? "(Most Damaging)" as MoveName : t.bossMoveInfo.moveData.name,
                    }
                }
            }});
            groups.push({
                ...g,
                turns: newTurns
            });
        }
        raidInputProps.setGroups(groups);
        setOpen(false);
    }
    
    return (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ marginTop: 1, marginBottom: 2, paddingTop: "5px", paddingBottom: "5px"}}>
            <Stack direction="column" spacing={0} alignItems="center" justifyContent="center">
                <Typography variant="body2" fontWeight="bold" sx={{ paddingX: 1}} >
                    { getTranslation("Optimize Boss Moves", translationKey) }
                </Typography>
                <Switch
                    size='small'
                    checked={switchIsOn}
                    onChange={(e) => switchIsOn ? handleTurnOff() : handleOpen()}
            
                />
            </Stack>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{getTranslation("Optimize Boss Moves", translationKey)}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {getTranslation("This can take a long time!", translationKey)}<br/>
                        {getTranslation("Do you wish to continue?", translationKey)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        {getTranslation("Cancel", translationKey)}
                    </Button>
                    <Button onClick={handleConfirm} color="primary" autoFocus>
                        {getTranslation("Confirm", translationKey)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    )
}

function HelpMenu({translationKey}: {translationKey: any}) {
    const [value, setValue] = useState<number>(1);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };  

    return (
        <Paper sx={{ p: 2, backgroundColor: "modal.main", height: "500px"}}>
            <Stack direction={"row"} paddingBottom={1} justifyContent={"center"}>
                <Tabs value={value} orientation="vertical" onChange={handleChange} centered variant="scrollable" scrollButtons allowScrollButtonsMobile>
                    <Tab 
                        label={getTranslation("Move Groups", translationKey)} 
                        value={1} 
                    />
                    <Tab 
                        label={getTranslation("Test Cases", translationKey)}
                        value={2} 
                    />
                    <Tab 
                        label={getTranslation("Move Options", translationKey)}
                        value={3} 
                    />
                    <Tab 
                        label={getTranslation("Extra Options", translationKey)}
                        value={4} 
                    />
                </Tabs>
                <Box width={"600px"} sx={{ overflowY: "auto", maxHeight: "475px", padding: "10px"}}>
                    {/* Move Groups Section */}
                    <Box hidden={value !== 1}>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Move", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <img 
                                    src={process.env.PUBLIC_URL + "/help-assets/move.png"} 
                                    alt=""
                                />
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>
                                        A <Box component="span" fontWeight='fontWeightBold'>move</Box> is defined by:<br/>
                                        - One action done by the raider<br/>
                                        - One action done by the raid boss onto the raider<br/><br/>
                                        For scripted boss actions, the "(No Move)" option should be selected for the raider.<br/>
                                        In these cases, scripted boss moves will hit all raiders and apply spread damage when appropriate.
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Group", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <img 
                                    src={process.env.PUBLIC_URL + "/help-assets/group.png"} 
                                    alt=""
                                />
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>
                                        A <Box component="span" fontWeight='fontWeightBold'>group</Box> is defined by a container of one or more moves in which order does not matter.<br/>
                                    </Typography>
                                    <Typography>Multiple groups are used to indicate sequencing in a Strategy.</Typography>
                                    <Typography>Groups can be sequentially repeated by increasing "# Executions".</Typography>
                                    <Typography>Groups are not necessarily equivalent to turns!</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Turn", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <img 
                                    src={process.env.PUBLIC_URL + "/help-assets/turn.png"} 
                                    alt=""
                                />
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>
                                        A <Box component="span" fontWeight='fontWeightBold'>turn</Box> is defined by 1-4 moves roughly matching a raid's actionable turn cadence.
                                        That is, each raider can move once within a single turn.
                                    </Typography>
                                    <Typography>Turn count estimates the length of your strategy.</Typography>
                                    <Typography>Multiple groups can be ordered in a single turn.</Typography>
                                    <Typography>Turns are automatically compiled by the tool for display in graphics and in "Pretty Mode".</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Box>
                    {/* Test Cases Section */}
                    <Box hidden={value !== 2}>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Worst Case", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>
                                        All actions defined by these rules:<br/>
                                        - Raid boss deals high-roll critical hits<br/>
                                        - Raid boss applies secondary effects if applicable<br/>
                                        - Raiders deal low-roll non-critical hits<br/>
                                        - Raiders do not apply secondary effects<br/>
                                        - Heal Cheers heal for 20%
                                    </Typography>
                                    <Typography>Use this setting when designing main strategies that are intended to be heavily used by a community.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Average Case", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>
                                        All actions defined by these rules:<br/>
                                        - Raid boss deals average-roll non-critical hits<br/>
                                        - Raid boss does not apply secondary effects<br/>
                                        - Raiders deal average-roll non-critical hits<br/>
                                        - Raiders do not apply secondary effects<br/>
                                        - Heal Cheers heal for 60%
                                    </Typography>
                                    <Typography>This option is most appropriate for longer strategies or when 100% reliability is not a requirement.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Best Case", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>
                                        All actions defined by these rules:<br/>
                                        - Raid boss deals low-roll non-critical hits<br/>
                                        - Raid boss does not apply secondary effects<br/>
                                        - Raiders deal high-roll critical hits<br/>
                                        - Raiders apply secondary effects if applicable<br/>
                                        - Heal Cheers heal for 100%
                                    </Typography>
                                    <Typography>This setting can be used to check if items and/or abilities activate in edge cases for a given strategy.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Optimize Boss Moves", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>The true worst case scenario!</Typography>
                                    <Typography>This implements an AI for the raid boss to find the optimal move selection to keep itself alive.</Typography>
                                    <Typography>Use this with Worst Case to stress test your strategy.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Box>
                    {/* Move Options Section */}
                    <Box hidden={value !== 3}>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Attacks", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>Moves from the moveset and, for bosses, extra moveset for scripted moves</Typography>
                                    <Typography>Moves can target self, allies, and/or the raid boss. Some moves are limited to certain types of targets.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Cheers", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography><Box component="span" fontWeight='fontWeightBold'>Attack Cheer</Box> increases raiders' Atk and SpAtk by 1.5x.</Typography>
                                    <Typography><Box component="span" fontWeight='fontWeightBold'>Defense Cheer</Box> increases raiders' Def and SpDef by 1.5x.</Typography>
                                    <Typography><Box component="span" fontWeight='fontWeightBold'>Heal Cheer</Box> heals between 20%-100% depending on test case.</Typography>
                                    <Typography>Cheers are implemented as lasting 12 moves and cannot stack except by making use of an exploit that involves fainting while a cheer is active.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Most Damaging", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>Automatically selects the move that deals the most damage</Typography>
                                </Stack>
                                <br/>
                                <Chip label={<Typography variant="h6">{getTranslation("Most Optimal", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>Automatically selects the raid boss move that is most optimal for its survival.</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Chip label={<Typography variant="h6">{getTranslation("Remove Negative Effects", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>The raid boss clears any stat drops and removes volatile and non-volatile status effects on itself.</Typography>
                                </Stack>
                                <br/>
                                <Chip label={<Typography variant="h6">{getTranslation("Clear Boosts / Abilities", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>For all raiders, the boss clears all stat boosts and cheers, and raider abilities are nullified for one turn when applicable.</Typography>
                                </Stack>
                                <br/>
                                <Chip label={<Typography variant="h6">{getTranslation("Steal Tera Charge", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>The raid boss removes one tera charge stack from all raiders when applicable.</Typography>
                                </Stack>
                                <br/>
                                <Chip label={<Typography variant="h6">{getTranslation("Activate Shield", translationKey)}</Typography>} color={"secondary"}/>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>The raid boss activates their shield.</Typography>
                                    <Typography>This is used to simulate the timer based trigger.</Typography>
                                </Stack>
                                <br/>
                            </Stack>
                        </Paper>
                    </Box>
                    {/* Extra Options */}
                    <Box hidden={value !== 4}>
                        <Paper sx={{padding: "20px", margin: "10px"}}>
                            <Stack direction={"column"}>
                                <Typography>Extra options are found under the  <MenuIcon sx={{transform: "translateY(5px)"}}/>  icon.</Typography>
                                <br/>
                                <Stack direction={"column"} spacing={1}>
                                    <Typography>{"- "}<Box component="span" fontWeight='fontWeightBold'>Tera</Box> switch is available if 3 tera charges are built up</Typography>
                                    <Typography>{"- "}<Box component="span" fontWeight='fontWeightBold'>Crit</Box> enables/disables critical hits</Typography>
                                    <Typography>{"- "}<Box component="span" fontWeight='fontWeightBold'>Effect</Box> enables/disables the application of secondary effects</Typography>
                                    <Typography>{"- "}<Box component="span" fontWeight='fontWeightBold'>Roll</Box> provides options for damage rolls</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Box>
                </Box>
            </Stack>
        </Paper>
    )
}

function RaidControls({raidInputProps, results, setResults, setLoading, prettyMode, translationKey}: {raidInputProps: RaidInputProps, results: RaidBattleResults, setResults: (r: RaidBattleResults) => void, setLoading: (b: boolean) => void, prettyMode: boolean, translationKey: any}) {
    const [value, setValue] = useState<number>(1);
    const [rollCase, setRollCase] = useState<"min" | "avg" | "max">("avg");
    const groups = raidInputProps.groups;
    const boss = raidInputProps.pokemon[0];
    const pokemon1 = raidInputProps.pokemon[1];
    const pokemon2 = raidInputProps.pokemon[2];
    const pokemon3 = raidInputProps.pokemon[3];
    const pokemon4 = raidInputProps.pokemon[4];

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const popoverOpen = Boolean(anchorEl);
    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };  

    useEffect(() => {
        raidcalcWorker.onmessage = (event: MessageEvent<RaidBattleResults>) => {
            if (event && event.data) {
                setResults(event.data);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                setLoading(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setResults]);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setLoading(true);
        }, 1000);
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
                <Stack direction={"row"} paddingBottom={1} justifyContent={"center"}>
                    <Tabs value={value} onChange={handleChange} centered>
                        <Tab 
                            label={
                                <Stack direction={"row"}>
                                    <Box alignContent={"center"}>
                                        {getTranslation("Move Order", translationKey)}
                                    </Box>
                                    <Box>
                                        <IconButton aria-describedby={popoverOpen ? "simple-popover" : undefined} onClick={handlePopoverOpen} sx={{"paddingTop": 0, "paddingBottom": 0}}>
                                            <InfoOutlinedIcon color="info" sx={{ transform: "translateY(-1px)"}}/>
                                        </IconButton>
                                        <Popover
                                            id={popoverOpen ? "simple-popover" : undefined}
                                            open={popoverOpen}
                                            anchorEl={anchorEl}
                                            onClose={handlePopoverClose}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'left',
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'center',
                                            }}
                                            sx={{
                                                width: "600px",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            <HelpMenu translationKey={translationKey}/>
                                        </Popover>
                                    </Box>
                                </Stack>
                            } 
                            value={1} 
                        />
                        <Tab 
                            label={getTranslation("Calc Results", translationKey)}
                            value={2} 
                        />
                    </Tabs>
                </Stack>
                <Stack direction="row" spacing={4} alignItems="center" justifyContent="center" marginBottom={"5px"}>
                    <RollCaseButtons raidInputProps={raidInputProps} setRollCase={setRollCase} translationKey={translationKey}/>
                    
                    {!prettyMode &&
                        <OptimizeBossMovesButton raidInputProps={raidInputProps} translationKey={translationKey}/>
                    }
                </Stack>
                <Box hidden={value !== 1}>
                    <HpDisplay results={results} translationKey={translationKey}/>
                </Box>
                <Box hidden={value !== 1}>
                    <Box sx={{ height: 560, overflowY: "auto" }}>
                        {!prettyMode &&
                            <MoveSelection raidInputProps={raidInputProps} results={results} rollCase={rollCase} translationKey={translationKey}/>
                        }
                        {prettyMode &&
                            <MoveDisplay groups={raidInputProps.groups} raiders={raidInputProps.pokemon} results={results} translationKey={translationKey}/>
                        }
                    </Box>
                </Box>
                <Box hidden={value !== 2} sx={{ height: 560, overflowY: "auto" }}>
                    <RaidResults results={results} translationKey={translationKey} />
                </Box>
            </Stack>
        </Box>
    )
}

export default React.memo(RaidControls);