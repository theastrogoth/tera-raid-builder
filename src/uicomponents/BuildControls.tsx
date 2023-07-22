import React, { useEffect, useState, useRef } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import ConstructionIcon from '@mui/icons-material/Construction';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import TuneIcon from '@mui/icons-material/Tune';

import { styled } from '@mui/material/styles';

import { Pokemon, StatsTable, Generations } from '../calc';
import { Nature, MoveName, AbilityName } from "../calc/data/interface";
import { toID } from '../calc/util';

import StatsControls from "./StatsControls";
import ImportExportArea from "./ImportExportArea";
import { Popper, Typography } from "@mui/material";
import { MoveSetItem, Raider } from "../raidcalc/interface";
import { getItemSpriteURL, getMoveMethodIconURL, getPokemonSpriteURL, getTeraTypeIconURL, getTypeIconURL } from "../utils";

import { BOSS_SETDEX_SV } from "../data/sets/raid_bosses";

// we will always use Gen 9
const gen = Generations.get(9);


function findOptionFromPokemonName(name: string): string {
    return name;
}

function findOptionFromTeraTypeName(name?: string): string {
    return name !== undefined && name !== "???" ? name : "Inactive";
}

function findOptionFromMoveName(name: string, moveSet: MoveSetItem[]): MoveSetItem {
    const option = moveSet.find((move) => move.name == name);
    return option || {name: "(No Move)" as MoveName, method: "level-up", type: "Normal"};
}

function findOptionFromAbilityName(name: string, abilities: {name: AbilityName, hidden: boolean}[]): {name: AbilityName, hidden: boolean} {
    const option = abilities.find((ability) => ability.name == name);
    return option || {name: "(No Ability)" as AbilityName, hidden: false};
}

function findOptionFromItemName(name?: string): string {
    return name !== undefined && name !== "(No Item)" ? name : "Any";
}

function createAbilityOptions(abilities: {name: AbilityName, hidden: boolean}[]) {
    return ["(No Ability)", ...abilities.map((ability) => ability.name)];
}

function createMoveOptions(moves: MoveSetItem[]) {
    return ["(No Move)", ...moves.map((move) => move.name)];
}

function natureToOption(nature: Nature) {
    if (nature.plus == nature.minus) { return nature.name }
    return nature.name + " (+" + prettyStatName(nature.plus as string) + ", -" + prettyStatName(nature.minus as string) + ")";
}

function optionToNature(option: string | undefined) {
    if (!option) { return "Hardy"; }
    return option.slice(0,-13);
}

function prettyStatName(stat: string) {
    switch (stat) {
        case 'hp':
            return 'HP';
        case 'atk':
            return 'Atk';
        case 'def':
            return 'Def';
        case 'spa':
            return 'SpA';
        case 'spd':
            return 'SpD';
        case 'spe':
            return 'Spe';
        default:
            return stat;
    }
}

function evsToString(pokemon: Pokemon) {
    let str = ''
    let empty = true
    for (let keyval of Object.entries(pokemon.evs)) {
        if (keyval[1] != 0) {
            if (!empty) {
                str = str + ', ';
            }
            empty = false;
            let statAbbr = prettyStatName(keyval[0]);
            const nature = gen.natures.get(toID(pokemon.nature));
            const natureEffect = nature ? (keyval[0] == nature.minus ? '-' : (keyval[0] == nature.plus ? '+' : '')) : '';
            str = str + statAbbr + ' ' + keyval[1] + natureEffect;
        }
    } 
    if (str.length == 0) { return "none"; }
    return str;
}

function ivsToString(ivs: StatsTable) {
    return  ivs.hp.toString()  + " / " +
            ivs.atk.toString() + " / " +
            ivs.def.toString() + " / " +
            ivs.spa.toString() + " / " +
            ivs.spd.toString() + " / " +
            ivs.spe.toString();
}

const LeftCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    textAlign: 'right',
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '8px',
    borderBottom: 0,
}));
  
const RightCell = styled(TableCell)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightMedium,
    textAlign: 'left',
    padding: '0px',
    borderBottom: 0,
})); 
  
function SummaryRow({name, value, setValue, options, prettyMode}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], prettyMode: boolean}) {
return (
    <>
    {((prettyMode && value !== "???" && value !== "(No Move)" && value !== "(No Item)" && value !== "(No Ability)") || !prettyMode) &&
        <TableRow>
            <LeftCell>
                {name}
            </LeftCell>
            <RightCell>
                {prettyMode &&
                    <Typography variant="body1">
                        {value}
                    </Typography>
                }
                {!prettyMode &&
                    <Autocomplete
                        disablePortal
                        disableClearable
                        autoHighlight={true}    
                        size="small"
                        value={value || undefined}
                        options={options}
                        renderInput={(params) => 
                            <TextField {...params} variant="standard" size="small" />}
                        onChange={(event: any, newValue: string) => {
                            setValue(newValue);
                        }}
                        sx = {{width: '85%'}}
                    />
                }
            </RightCell>
        </TableRow>
    }
    </>
    )
}

function MovePopper({move, prettyMode, showPopper, anchorEl}: {move: MoveSetItem, prettyMode: boolean, showPopper: boolean, anchorEl: HTMLElement | null}) {
    return (
        <Popper 
            open={showPopper} 
            anchorEl={anchorEl} 
            placement="bottom-start"
            disablePortal={false}
            sx={{ position: "relative", zIndex: 1000000 }}
        >
            <Paper sx={{ p: 1 }}>
                <TableContainer>
                    <Table size="small" width="100%">
                        <TableBody>
                            <TableRow>
                                <LeftCell>
                                    Type
                                </LeftCell>
                                <RightCell>
                                    e.g. Physical, Status, etc
                                </RightCell>
                            </TableRow>
                            <TableRow>
                                <LeftCell>
                                    BP
                                </LeftCell>
                                <RightCell>
                                    Put BP here
                                </RightCell>
                            </TableRow>
                            <TableRow>
                                <LeftCell>
                                    Accuracy
                                </LeftCell>
                                <RightCell>
                                    Put Acc here
                                </RightCell>
                            </TableRow>
                            <TableRow>
                                <LeftCell>
                                    Status Effects?
                                </LeftCell>
                                <RightCell>
                                    This might be a lot
                                </RightCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

        </Popper>
    )
}

function MoveWithIcon({move, prettyMode}: {move: MoveSetItem, prettyMode: boolean}) {
    const [showPopper, setShowPopper] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const timer = useRef<NodeJS.Timeout | null>(null);

    const handleMouseOver = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        if(timer.current === null) {
            timer.current = setTimeout(() => {
                setShowPopper(true);
                setAnchorEl(target);
                timer.current = null;
            }, 500)
        }
    }
    const handleMouseOut = () => {
        setShowPopper(false);
        setAnchorEl(null);
        clearTimeout(timer.current as NodeJS.Timeout);
        timer.current = null;
    }
    return (
        <Box onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <Stack direction="row" alignItems="center" spacing={0.25} >
                    {!prettyMode &&
                        <img src={getTypeIconURL(move.type)} height="25px" />
                    }
                <Typography variant={prettyMode ? "body1" : "body2"} sx={prettyMode ? {paddingRight: 0.5 } : {paddingLeft: 0.5, paddingRight: 0.5}}>
                    {move.name}
                </Typography>
                    {move.method === "egg" && prettyMode &&
                        <img src={getMoveMethodIconURL("egg")} height="20px" />
                    }
                    {move.method === "machine" && prettyMode &&
                        <img src={getMoveMethodIconURL(move.type)} height="20px"/>
                    }
            </Stack>
            <MovePopper move={move} prettyMode={prettyMode} showPopper={showPopper} anchorEl={anchorEl}/>
        </Box>
    )
}

function MoveSummaryRow({name, value, setValue, options, moveSet, prettyMode}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], moveSet: MoveSetItem[], prettyMode: boolean}) {
    return (
        <>
        {((prettyMode && value !== "(No Move)") || !prettyMode) &&
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    {prettyMode &&
                        <MoveWithIcon move={findOptionFromMoveName(value, moveSet)} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value || undefined}
                            options={options}
                            renderOption={(props, option) => 
                                <li {...props}><MoveWithIcon move={findOptionFromMoveName(option || "(No Move)", moveSet)} prettyMode={prettyMode} /></li>
                            }
                            renderInput={(params) => <TextField {...params} variant="standard" size="small" />}
                            onChange={(event: any, newValue: string) => {
                                setValue(newValue);
                            }}
                            sx = {{width: '85%'}}
                        />
                    }
                </RightCell>
            </TableRow>
        }
        </>
    )
}

function AbilityWithIcon({ability, prettyMode}: {ability: {name: AbilityName, hidden: boolean}, prettyMode: boolean}) {
    return (
        <Stack direction="row" alignItems="center" spacing={0.25}>
            <Typography variant={prettyMode ? "body1" : "body2"} sx={{ paddingRight: 0.5 }}>
                {ability.name}
            </Typography>
            {ability.hidden === true &&
                <img src={getMoveMethodIconURL("ability_patch")} height="20px" />
            }
        </Stack>
    )
}

function AbilitySummaryRow({name, value, setValue, options, abilities, prettyMode}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], abilities: {name: AbilityName, hidden: boolean}[], prettyMode: boolean}) {
    return (
        <>
        {((prettyMode && value !== "???" && value !== "(No Move)" && value !== "(No Item)" && value !== "(No Ability)") || !prettyMode) &&
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    {prettyMode &&
                        <AbilityWithIcon ability={findOptionFromAbilityName(value, abilities)} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value || undefined}
                            options={options}
                            renderOption={(props, option) => 
                                <li {...props}><AbilityWithIcon ability={findOptionFromAbilityName(option || "(No Ability)", abilities)} prettyMode={prettyMode} /></li>
                            }
                            renderInput={(params) => <TextField {...params} variant="standard" size="small" />}
                            onChange={(event: any, newValue: string) => {
                                setValue(newValue);
                            }}
                            sx = {{width: '85%'}}
                        />
                    }
                </RightCell>
            </TableRow>
        }
        </>
    )
}

function GenericWithIcon({name, spriteFetcher, prettyMode}: {name: string, spriteFetcher: Function, prettyMode: boolean}) {
    return (
        <Stack direction="row" alignItems="center" spacing={0.25}>
            {!prettyMode &&
                <Box
                sx={{
                    width: "25px",
                    height: "25px",
                    overflow: 'hidden',
                    background: `url(${spriteFetcher(name)}) no-repeat center center / contain`,
                }}
                />
            }
            <Typography variant={prettyMode ? "body1" : "body2"} sx={prettyMode ? {paddingRight: 0.5 } : {paddingLeft: 0.5, paddingRight: 0.5}}>
                {name}
            </Typography>
        </Stack>
    )
}

function GenericIconSummaryRow({name, value, setValue, options, optionFinder, spriteFetcher, prettyMode}: {name: string, value: string, setValue: React.Dispatch<React.SetStateAction<string | null>> | Function, options: (string | undefined)[], optionFinder: Function, spriteFetcher: Function, prettyMode: boolean}) {
    return (
        <>
        {((prettyMode && value !== "???" && value !== "(No Move)" && value !== "(No Item)" && value !== "(No Ability)") || !prettyMode) &&
            <TableRow>
                <LeftCell>
                    {name}
                </LeftCell>
                <RightCell>
                    {prettyMode &&
                        <GenericWithIcon name={value} spriteFetcher={spriteFetcher} prettyMode={prettyMode} />
                    }
                    {!prettyMode &&
                        <Autocomplete
                            disablePortal
                            disableClearable
                            autoHighlight={true}    
                            size="small"
                            value={value || undefined}
                            options={options}
                            renderOption={(props, option) => 
                                <li {...props}><GenericWithIcon name={optionFinder(option)} spriteFetcher={spriteFetcher} prettyMode={prettyMode} /></li>
                            }
                            renderInput={(params) => 
                                <TextField {...params} variant="standard" size="small" />}
                            onChange={(event: any, newValue: string) => {
                                setValue(newValue);
                            }}
                            sx = {{width: '85%'}}
                        />
                    }
                </RightCell>
            </TableRow>
        }
        </>
    )
}

function BuildControls({pokemon, abilities, moveSet, setPokemon, prettyMode}: 
        {pokemon: Raider, abilities: {name: AbilityName, hidden: boolean}[], moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, prettyMode: boolean}) 
    {
    const [genSpecies, ] = useState([...gen.species].map(specie => specie.name).sort());
    const [teratypes, ] = useState([...gen.types].map(type => type.name).sort());
    const [genNatures, ] = useState([...gen.natures].map(nature => natureToOption(nature)).sort());
    const [genItems, ] = useState([...gen.items].map(item => item.name).sort());
    
    const [editStatsOpen, setEditStatsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    const setPokemonProperty = (propName: string) => {
        return (val: any) => {
            const newPokemon = {...pokemon};
            // @ts-ignore
            newPokemon[propName] = val;
            setPokemon(new Raider(
                newPokemon.id, 
                newPokemon.role, 
                new Pokemon(gen, newPokemon.name, {
                    level: newPokemon.level,
                    ability: newPokemon.ability,
                    nature: newPokemon.nature,
                    item: newPokemon.item,
                    ivs: newPokemon.ivs,
                    evs: newPokemon.evs,
                    moves: newPokemon.moves,
                    teraType: newPokemon.teraType,
                    bossMultiplier: newPokemon.bossMultiplier,
                }),
                newPokemon.extraMoves,
            ))
        }
    }

    const handleChangeSpecies = (val: string) => {
        setPokemon(new Raider(pokemon.id, pokemon.role, new Pokemon(gen, val, {nature: "Hardy", ability: "(No Ability)"})))
    }

    return (
        <Box justifyContent="center" alignItems="top" width="300px">
            {!prettyMode &&
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ marginTop: 1, marginBottom: 2 }}>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ width: "120px", textTransform: "none" }} 
                        disabled={importExportOpen}
                        onClick={(e) => setEditStatsOpen(!editStatsOpen)}
                        startIcon={editStatsOpen ? <ConstructionIcon/> : <TuneIcon/>}
                    >
                        {editStatsOpen ? "Edit Build" : "Edit EVs/IVs"}
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ width: "120px", textTransform: "none" }} 
                        onClick={(e) => setImportExportOpen(!importExportOpen)}
                        endIcon={importExportOpen ? <ConstructionIcon/> : <ImportExportIcon/>}
                    >
                        {importExportOpen ? "Edit Pok\u00E9mon" : "Import/Export"}
                    </Button>
                </Stack>
            }
            {(!prettyMode && importExportOpen) &&
                <ImportExportArea pokemon={pokemon} setPokemon={setPokemon}/>
            }
            {(!prettyMode && editStatsOpen && !importExportOpen) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 0 }}>
                    <StatsControls pokemon={pokemon} setPokemon={setPokemon}/>    
                </Stack>
            }
            {(prettyMode || (!editStatsOpen && !importExportOpen)) &&
                <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                    <TableContainer>
                        <Table size="small" width="100%">
                            <TableBody>
                                {/* <SummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies} prettyMode={prettyMode} /> */}
                                <GenericIconSummaryRow name="Pokémon" value={pokemon.species.name} setValue={handleChangeSpecies} options={genSpecies} optionFinder={findOptionFromPokemonName} spriteFetcher={getPokemonSpriteURL} prettyMode={prettyMode}/>
                                <GenericIconSummaryRow name="Tera Type" value={pokemon.teraType || "???"} setValue={setPokemonProperty("teraType")} options={teratypes} optionFinder={findOptionFromTeraTypeName} spriteFetcher={getTeraTypeIconURL} prettyMode={prettyMode}/>
                                {/* <SummaryRow name="Ability" value={pokemon.ability || abilities[0]} setValue={setPokemonProperty("ability")} options={["(No Ability)", ...abilities]} prettyMode={prettyMode}/> */}
                                <AbilitySummaryRow 
                                            name="Ability"
                                            value={pokemon.ability || "(No Move)"} 
                                            setValue={setPokemonProperty("ability")}
                                            options={createAbilityOptions(abilities)}
                                            abilities={abilities}
                                            prettyMode={prettyMode}
                                        /> 
                                <SummaryRow name="Nature" value={pokemon.nature === undefined ? "Hardy" : natureToOption(gen.natures.get(toID(pokemon.nature)) as Nature)} setValue={(val: string) => setPokemonProperty("nature")(optionToNature(val))} options={genNatures} prettyMode={prettyMode}/>
                                <TableRow>
                                    <LeftCell>Level</LeftCell>
                                    <RightCell>
                                        {prettyMode &&
                                            <Typography variant="body1">
                                                {pokemon.level}
                                            </Typography>
                                        }
                                        {!prettyMode &&
                                            <TextField 
                                                size="small"
                                                variant="standard"
                                                type="number"
                                                InputProps={{
                                                    inputProps: { 
                                                        max: 100, min: 1 
                                                    }
                                                }}
                                                fullWidth={false}
                                                value={pokemon.level}
                                                onChange={(e) => {
                                                    if (e.target.value === "") return setPokemonProperty("level")(1);
                                                    let lvl = parseInt(e.target.value);
                                                    if (lvl < 1) lvl = 1;
                                                    if (lvl > 100) lvl = 100;
                                                    setPokemonProperty("level")(lvl)
                                                }}
                                                sx = {{ width: '30%'}}
                                            />
                                        }
                                    </RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>IVs</LeftCell>
                                    <RightCell>{ivsToString(pokemon.ivs)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell>EVs</LeftCell>
                                    <RightCell>{evsToString(pokemon)}</RightCell>
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '5px'}} />
                                </TableRow>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                    <GenericIconSummaryRow name="Item" value={pokemon.item || "(No Item)"} setValue={setPokemonProperty("item")} options={["(No Item)", ...genItems]} optionFinder={findOptionFromItemName} spriteFetcher={getItemSpriteURL} prettyMode={prettyMode}/>
                                <TableRow>
                                    <LeftCell sx={{ paddingTop: '10px'}} />
                                </TableRow>
                                {
                                    [0,1,2,3].map((index) => {
                                        return <MoveSummaryRow 
                                            key={index}
                                            name={index==0 ? "Moves" : ""}
                                            value={pokemon.moves[index] || "(No Move)"} 
                                            setValue={(moveOption: string) => {
                                                const newMoves = [...pokemon.moves as string[]];
                                                newMoves[index] = moveOption;
                                                setPokemonProperty("moves")(newMoves);
                                            }}
                                            options={createMoveOptions(moveSet)}
                                            moveSet={moveSet}
                                            prettyMode={prettyMode}
                                        /> 
                                    })
                                } 
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            }
        </Box>
    )
}

export function BossBuildControls({moveSet, pokemon, setPokemon, prettyMode}: 
    {pokemon: Raider, moveSet: MoveSetItem[], setPokemon: (r: Raider) => void, prettyMode: boolean}) 
{
    const setHPMultiplier = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (val < 1) val = 1;
        const newPokemon = {...pokemon};
        newPokemon.bossMultiplier = val;
        setPokemon(new Raider(pokemon.id, pokemon.role,
            new Pokemon(gen, newPokemon.name, {
                level: newPokemon.level,
                ability: newPokemon.ability,
                nature: newPokemon.nature,
                item: newPokemon.item,
                ivs: newPokemon.ivs,
                evs: newPokemon.evs,
                moves: newPokemon.moves,
                teraType: newPokemon.teraType,
                bossMultiplier: newPokemon.bossMultiplier,
            }),
            pokemon.extraMoves,
        ));
    }

    const loadSet = (name: string, set: Object) => { 
        //@ts-ignore
        const evs = set["evs"]
        let numberEVs: Partial<StatsTable> = {};
        if (evs) {
            numberEVs = {
                hp: parseInt(evs.hp),
                atk: parseInt(evs.at),
                def: parseInt(evs.df),
                spa: parseInt(evs.sa),
                spd: parseInt(evs.sd),
                spe: parseInt(evs.sp)
            };
        }
        // @ts-ignore
        setPokemon(new Raider(pokemon.id, name, new Pokemon(gen, pokemon.name, {
            // @ts-ignore
            level: parseInt(set["level"]),
            // @ts-ignore
            bossMultiplier: parseInt(set["bossMultiplier"]),
            // @ts-ignore
            ability: (set["ability"] ? set["ability"] : "(No Ability)"),
            // @ts-ignore
            nature: (set["nature"] ? set["nature"] : "Hardy"),
            // @ts-ignore
            moves: (set["moves"] ? set["moves"] : ["(No Move)", "(No Move)", "(No Move)", "(No Move)"]),
            evs: numberEVs,
        }), []));
    }

    const setBMove = (index: number) => (move: string) => {
        const newPoke = pokemon.clone();
        //@ts-ignore
        newPoke.extraMoves[index] = move;
        setPokemon(newPoke);
    }

    return (
        <Box justifyContent="center" alignItems="top" width="300px">
            <Stack alignItems={'right'} justifyContent="center" spacing={1} sx={{ margin: 1 }}>
                <TableContainer>
                    <Table size="small" width="100%">
                        <TableBody>
                            {!prettyMode &&
                            <TableRow>
                                <LeftCell sx={{ paddingBottom: 2 }}>
                                </LeftCell>
                                <RightCell sx={{ paddingBottom: 2 }}>
                                    <Autocomplete 
                                        disablePortal
                                        disableClearable
                                        autoHighlight={true}    
                                        size="small"
                                        value={""}
                                        sx={{ maxWidth: 140}}
                                        //@ts-ignore
                                        options={pokemon.name ? (BOSS_SETDEX_SV[pokemon.name] ? Object.keys(BOSS_SETDEX_SV[pokemon.name]) : []) : []}
                                        renderInput={(params) => 
                                            <TextField 
                                                {...params} variant="outlined" placeholder="Load Boss Set" size="small" 
                                                sx={{
                                                    "& .MuiInputBase-input": {
                                                      overflow: "hidden",
                                                      textOverflow: "clip"
                                                    }
                                                  }}
                                            />}
                                        onChange={(event: any, newValue: string) => {
                                            if (!newValue) return;
                                            try {
                                                //@ts-ignore
                                                const newSet = BOSS_SETDEX_SV[pokemon.name][newValue];
                                                loadSet(newValue, newSet);
                                            } catch (e) {
                                                console.log(e)
                                            }
                                        }}
                                    />
                                </RightCell>
                            </TableRow>
                            }
                            <TableRow>
                                <LeftCell>HP Multiplier (%)</LeftCell>
                                <RightCell>
                                    {prettyMode &&
                                        <Typography variant="body1">
                                            {pokemon.bossMultiplier}
                                        </Typography>
                                    }
                                    {!prettyMode &&
                                        <TextField 
                                            size="small"
                                            variant="standard"
                                            type="number"
                                            InputProps={{
                                                inputProps: { 
                                                    step: 100,
                                                }
                                            }}
                                            fullWidth={false}
                                            value={pokemon.bossMultiplier}
                                            onChange={setHPMultiplier}
                                            sx = {{ width: '30%'}}
                                        />
                                    }
                                </RightCell>
                            </TableRow>
                            {
                                [0,1,2,3].map((index) => {
                                    return <MoveSummaryRow 
                                        key={index}
                                        name={index==0 ? "Extra Moves" : ""}
                                        // @ts-ignore
                                        value={pokemon.extraMoves[index] || "(No Move)"}
                                        setValue={setBMove(index)}
                                        options={createMoveOptions(moveSet)}
                                        moveSet={moveSet}
                                        prettyMode={prettyMode}
                                    /> 
                                })
                            } 
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
        </Box>

    )
}

export default React.memo(BuildControls);