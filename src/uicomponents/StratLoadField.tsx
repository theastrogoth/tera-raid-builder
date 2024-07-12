import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from "@mui/material/Typography";
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { SxProps, Theme } from '@mui/material/styles';

import { StyledTextField, SetLoadGroupHeader } from "./BuildControls";
import { lightToFullBuildInfo, serializeInfo } from "./LinkButton";

import { SpeciesName } from "../calc/data/interface";
import { LightBuildInfo } from "../raidcalc/hashData";
import { RaidInputProps, BuildInfo } from "../raidcalc/inputs";
import { SubstituteBuildInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";

import { getPokemonSpriteURL, getTranslation } from "../utils";
import STRAT_LIST from "../data/strats/stratlist.json";

type StratOption = {
    name: string,
    boss: string,
    path: string,
    raiders: [string, string, string, string],
    substitutes: string[],
    abilities: string[],
    moves: string[],
    items: string[],
    credits?: string,
}

function stratDexEntryToOption(options: StratOption[], index: number, boss: string, stratname: string, stratpath: string) {
    import(`../data/strats/${stratpath}.json`)
    .then((module) => {
        const info = module as LightBuildInfo;
        const raiders = info.pokemon.slice(1).map(p => p.name);
        const substitutes = info.substitutes ? info.substitutes.map(sl => sl.map(s => s.raider.name)).flat() : [];
        const moves = [
            ...info.turns.map(t => t.moveInfo.name),
            ...(info.substitutes ? info.substitutes.map(sl => sl.map(s => s.substituteMoves).flat()).flat() : [])
        ].filter(m => m !== undefined && m !== "(No Move)") as string[];
        const abilities = [
            ...info.pokemon.slice(1).map(p => p.ability),
            ...(info.substitutes ? info.substitutes.map(sl => sl.map(s => s.raider.ability).flat()).flat() : [])
        ].filter(a => a !== undefined && a !== "(No Ability)") as string[];
        const option = {
            name: stratname,
            boss: boss,
            path: stratpath,
            raiders: info.pokemon.slice(1).map(p => p.name) as [string, string, string, string],
            substitutes: info.substitutes ? info.substitutes.map(sl => sl.map(s => s.raider.name)).flat() : [],
            moves: [
                    ...info.turns.map(t => t.moveInfo.name),
                    ...(info.substitutes ? info.substitutes.map(sl => sl.map(s => s.substituteMoves).flat()).flat() : [])
                ].filter(m => m !== undefined && m !== "(No Move)") as string[],
            abilities: [
                    ...info.pokemon.slice(1).map(p => p.ability),
                    ...(info.substitutes ? info.substitutes.map(sl => sl.map(s => s.raider.ability).flat()).flat() : [])
                ].filter(a => a !== undefined && a !== "(No Ability)") as string[],
            items: [
                    ...info.pokemon.slice(1).map(p => p.item),
                    ...(info.substitutes ? info.substitutes.map(sl => sl.map(s => s.raider.item).flat()).flat() : [])
                ].filter(i => i !== undefined && i !== "(No Item)") as string[],
            credits: info.credits,
        }
        options[index] = option;
    })
}

function stratdexToOptions(dex: Object): StratOption[] {
    const options: StratOption[] = [];
    let index = 0;
    for (let boss of (Object.keys(dex) as SpeciesName[])) {
        // @ts-ignore
        for (let stratname of (Object.keys(dex[boss]))) {
            // @ts-ignore
            const stratpath = dex[boss][stratname];
            stratDexEntryToOption(options, index, boss, stratname, stratpath);   
            index++;    
        }
    }
    return options;
}

const stratOptions = stratdexToOptions(STRAT_LIST);

function StratLoadField(
    {raidInputProps, setTitle, setCredits, setNotes, setSubstitutes, setLoading, shortHashRef, longHashRef, placeholder="Load Strategy", sx={ width: 260 }, translationKey}: 
    {raidInputProps: RaidInputProps, setTitle: (t: string) => void, setCredits: (c: string) => void, 
     setNotes: (n: string) => void, setSubstitutes: ((s: SubstituteBuildInfo[]) => void)[], setLoading: (l: boolean) => void, shortHashRef: React.MutableRefObject<string>, longHashRef: React.MutableRefObject<string>,
     placeholder?: string, sx?: SxProps<Theme>, translationKey: any
    }) 
{
    const filterStratOptions = createFilterOptions({
        stringify: (option: StratOption) => getTranslation(option.boss, translationKey, "pokemon") + " " + option.name + " " + 
                                            option.raiders.map(r => getTranslation(r,translationKey,"pokemon")).join(" ") +
                                            option.substitutes.map(s => getTranslation(s,translationKey,"pokemon")).join(" ") +
                                            option.abilities.map(s => getTranslation(s,translationKey,"ability")).join(" ") +
                                            option.moves.map(s => getTranslation(s,translationKey,"move")).join(" ") +
                                            option.items.map(s => getTranslation(s,translationKey,"item")).join(" ") + 
                                            (option.credits || "")

    });
    const [stratPath, setStratPath] = useState<null | string>(null);
    const [buildInfo, setBuildInfo] = useState<null | LightBuildInfo>(null);

    useEffect(() => {
        try {
            if (stratPath !== null) {
                setLoading(true);
                import(`../data/strats/${stratPath}.json`)
                .then((module) => {
                    setBuildInfo(module.default);
                })
                .catch((error) => {
                    console.error('Error importing JSON file:', error);
                });
            }
        } catch (e) {
            setLoading(false);
            console.log(e);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stratPath]);

    useEffect(() => {
        async function loadInfo() {
            try {
                let res: BuildInfo | null = null;
                if (buildInfo) {
                    res = await lightToFullBuildInfo(buildInfo);
                } else {
                    return;
                }
                if (res) {
                    const {name, notes, credits, pokemon, groups, substitutes} = res;
                    setTitle(name);
                    setNotes(notes);
                    setCredits(credits);
                    raidInputProps.setPokemon[0](pokemon[0]);
                    raidInputProps.setPokemon[1](pokemon[1]);
                    raidInputProps.setPokemon[2](pokemon[2]);
                    raidInputProps.setPokemon[3](pokemon[3]);
                    raidInputProps.setPokemon[4](pokemon[4]);
                    raidInputProps.setGroups(groups);
                    setSubstitutes[0](substitutes[0]);
                    setSubstitutes[1](substitutes[1]);
                    setSubstitutes[2](substitutes[2]);
                    setSubstitutes[3](substitutes[3]);
                    setLoading(false);
                    longHashRef.current = serializeInfo(
                        {
                            name: name,
                            notes: notes,
                            credits: credits,
                            startingState: new RaidState(pokemon),
                            groups: groups,
                        },
                        substitutes,
                    );  
                }
            } catch (e) {
                setLoading(false);
                console.log(e);
            }
        }
        loadInfo().catch((e) => console.log(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildInfo]);
    
    return (
        <Autocomplete 
            disablePortal
            disableClearable
            autoHighlight={true}  
            fullWidth={true}  
            size="medium"
            value={{name:"", boss: "Pikachu" as SpeciesName, path: "", raiders: ["Pikachu", "Pikachu", "Pikachu", "Pikachu"], substitutes: [], abilities: [], moves: [], items: []}}
            sx={sx}
            options={stratOptions}
            filterOptions={filterStratOptions}
            groupBy={(option: StratOption) => option.boss}
            renderOption={(props, option) => (
                <li {...props}>
                    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ width: "100%"}}>
                        <Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{option.name}</Typography>
                        <Box flexGrow={1} sx={{ minWidth: "20px"}} />
                        <Stack direction="row" spacing={-0.25}>
                            {
                                option.raiders.map((r, i) => 
                                    <Box
                                        key={i}
                                        sx={{
                                            width: "25px",
                                            height: "25px",
                                            zIndex: 10000 - i,
                                            overflow: 'hidden',
                                            background: `url(${getPokemonSpriteURL(r)}) no-repeat center center / contain`,
                                        }}
                                    />
                                )
                            }
                        </Stack>
                    </Stack>
                </li>
            )}
            
            renderGroup={(params) => {
                let group = params.group;
                if (group.includes("Rerun")) {
                    group = group.slice(0,-6);
                }
                return  (
                    <li>
                        <SetLoadGroupHeader pokemon={group as SpeciesName} translationKey={translationKey}/>
                        {params.children}
                    </li>
                );
            }}
            getOptionLabel={(option: StratOption) => option.name}
            renderInput={(params) => 
                <StyledTextField 
                    {...params} variant="outlined" placeholder={placeholder} size="medium"
                    sx={{
                        "& .MuiInputBase-input": {
                            overflow: "hidden",
                            textOverflow: "clip",
                        },
                    }}
                />}
            onChange={(event: any, newValue: StratOption) => {
                if (!newValue) return;
                try {
                    setStratPath(newValue.path);
                    let prettyHash = newValue.path;
                    if (prettyHash.slice(-5) === "/main") {
                        prettyHash = prettyHash.slice(0,-5);
                    }
                    shortHashRef.current = prettyHash;
                } catch (e) {
                    console.log(e)
                }
            }}
            componentsProps={{ popper: { style: { width: 'fit-content', minWidth: 225 } } }}
            style={{ whiteSpace: "pre-wrap" }}
        />
    )
}

export default React.memo(StratLoadField);