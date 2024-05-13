import React, { useState, useEffect } from "react";
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

import { getTranslation } from "../utils";
import STRAT_LIST from "../data/strats/stratlist.json";

type StratOption = {
    name: string,
    boss: string,
    path: string,
}

function stratdexToOptions(dex: Object): StratOption[] {
    const options: StratOption[] = [];
    for (let boss of (Object.keys(dex) as SpeciesName[])) {
        // @ts-ignore
        for (let stratname of (Object.keys(dex[boss]))) {
            // @ts-ignore
            const stratpath = dex[boss][stratname];
            const option = {
                name: stratname,
                boss: boss,
                path: stratpath,
            }
            options.push(option);
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
        stringify: (option: StratOption) => getTranslation(option.boss, translationKey, "pokemon") + " " + option.name
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
            value={{name:"", boss: "Pikachu" as SpeciesName, path: ""}}
            sx={sx}
            options={stratOptions}
            filterOptions={filterStratOptions}
            groupBy={(option: StratOption) => option.boss}
            renderOption={(props, option) => <li {...props}><Typography variant="body2" style={{ whiteSpace: "pre-wrap"}}>{option.name}</Typography></li>}
            renderGroup={(params) => {
                return  (
                    <li>
                        <SetLoadGroupHeader pokemon={params.group as SpeciesName} translationKey={translationKey}/>
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