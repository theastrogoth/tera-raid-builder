import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Button from "@mui/material/Button";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { RaidInputProps, BuildInfo } from "../raidcalc/inputs";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";
import { Raider } from "../raidcalc/Raider";
import { RaidState } from "../raidcalc/RaidState";
import { RaidBattleInfo } from "../raidcalc/RaidBattle";

import PokedexService from "../services/getdata";
import { MoveData, RaidTurnInfo, SubstituteBuildInfo, TurnGroupInfo } from "../raidcalc/interface";
import { encode, decode, getTranslation } from "../utils";

import { db } from "../config/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import STRAT_LIST from "../data/strats/stratlist.json";

const gen = Generations.get(9);
const JSON_HASHES = Object.entries(STRAT_LIST).map(([boss, strats]) => Object.entries(strats as Object).map(([name, h]) => h as string)).flat();

async function getFullHashFromShortHash(hash: string): Promise<string> {
    let cleanHash = hash;
    if (hash[0] === "#") {
        cleanHash = hash.slice(1);
    }
    const hashID = decode(cleanHash);
    const docRef = doc(db, "links", `${hashID}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log("Invalid link");
    }
    const data = docSnap.data();
    return data ? data.hash : null;
}

async function generateShortHash(): Promise<string> {
    // randomly generate a short hash in the searchspace
    let linkID = Math.floor(Math.random() * (62**8));
    let shortHash = encode(linkID);
    let docRef = doc(db, "links", `${shortHash}`);
    let docSnap = await getDoc(docRef);
    // handle collisions. This should be fast as long as the searchspace is mostly empty
    while (docSnap.exists()) {
        linkID = Math.floor(Math.random() * 62**8);
        shortHash = encode(linkID);
        docRef = doc(db, "links", `${shortHash}`);
        docSnap = await getDoc(docRef);
    }
    return shortHash;
}

async function setLinkDocument(title: string, raidInputProps: RaidInputProps, fullHash: string, setButtonDisabled: (b: boolean) => void, setSnackSeverity: (s: "success" | "warning" | "error") => void) {
    const shortHash = await generateShortHash();
    const id = decode(shortHash);
    return setDoc(doc(db, "links", `${id}`), {
        hash: fullHash,
        path: shortHash,
        date: Date.now(),
        boss: raidInputProps.pokemon[0].name,
        raiders: raidInputProps.pokemon.slice(1).map((p) => p.name),
        title: title,
    })
    .then(() => {
        setSnackSeverity("success");
        return shortHash;
    })
    .catch((error) => {
        console.log(error)
        setButtonDisabled(false);
        setSnackSeverity("warning");
        return null
    });
}

export async function deserializeInfo(hash: string): Promise<BuildInfo | null> {
    try {
        const obj = deserialize(hash);
        return await lightToFullBuildInfo(obj);
    } catch (e) {
        return null;
    }
}

export async function lightToFullBuildInfo(obj: LightBuildInfo, allMoves?: Map<MoveName,MoveData> | null): Promise<BuildInfo | null> {
    try {
        const pokemon = await Promise.all((obj.pokemon as LightPokemon[]).map(async (r, i) => new Raider(i, r.role, r.shiny, new Field(), 
            new Pokemon(gen, r.name, {
                ability: r.ability || undefined,
                item: r.item || undefined,
                nature: r.nature || undefined,
                evs: r.evs || undefined,
                ivs: r.ivs || undefined,
                level: r.level || undefined,
                teraType: (r.teraType || undefined) as (TypeName | undefined),
                isTera: i === 0,
                bossMultiplier: r.bossMultiplier || undefined,
                moves: r.moves || undefined,
                shieldData: r.shieldData || {hpTrigger: 0, timeTrigger: 0, shieldCancelDamage: 0, shieldDamageRate: 0, shieldDamageRateTera: 0, shieldDamageRateTeraChange: 0},
            }), 
            (r.moves ? (
                allMoves ? 
                (r.moves.map((m) => allMoves.get(m as MoveName) || {name: m as MoveName, target: "user"})) :
                (await Promise.all(r.moves.map((m) => PokedexService.getMoveByName(m) || {name: m, target: "user"})))
            ) as MoveData[] : []),
            (r.extraMoves || undefined) as (MoveName[] | undefined),
            (r.extraMoves ? (
                allMoves ? 
                (r.extraMoves.map((m) => allMoves.get(m as MoveName) || {name: m as MoveName, target: "user"})) :
                (await Promise.all(r.extraMoves.map((m) => PokedexService.getMoveByName(m) || {name: m, target: "user"})))
            ) as MoveData[] : []),
        )));
        const groups: TurnGroupInfo[] = [];
        const groupIds: number[] = [];
        let usedGroupIds: number[] = obj.turns.map((t) => t.group === undefined ? -1 : t.group);
        usedGroupIds = usedGroupIds.filter((g, index) => usedGroupIds.indexOf(g) === index && g !== -1);
        for (let t of obj.turns as LightTurnInfo[]) {
            const name = t.moveInfo.name as MoveName;
            let mdata: MoveData = {name: name};
            if (name === "(No Move)") {
            } else if (name === "(Most Damaging)") {
                mdata = {name: name, target: "selected-pokemon"};
            } else if (name === "Attack Cheer" || name === "Defense Cheer") {
                mdata = {name: name, priority: 10, category: "field-effect", target: "user-and-allies"};
            } else if (name === "Heal Cheer") {
                mdata = {name: name, priority: 10, category: "heal", target: "user-and-allies"};
            } else {
                mdata = pokemon[t.moveInfo.userID].moveData.find((m) => m && m.name === t.moveInfo.name) || {name: name};
            }
            
            const bname = t.bossMoveInfo.name as MoveName;
            let bmdata: MoveData = {name: bname};
            if (bname === "(No Move)") {
            } else if (bname === "(Most Damaging)") {
                bmdata = {name: bname as MoveName, target: "selected-pokemon"};
            } else {
                bmdata = [...pokemon[0].moveData, ...pokemon[0].extraMoveData!].find((m) => m && m.name === t.bossMoveInfo.name) || {name: bname};
            }

            const turn = {
                id: t.id,
                group: t.group,
                moveInfo: {
                    userID: t.moveInfo.userID, 
                    targetID: t.moveInfo.targetID, 
                    options: t.moveInfo.options, 
                    moveData: mdata || {name: t.moveInfo.name as MoveName}
                },
                bossMoveInfo: {
                    userID: t.bossMoveInfo.userID,
                    targetID: t.bossMoveInfo.targetID,
                    options: t.bossMoveInfo.options,
                    moveData: bmdata || {name: t.bossMoveInfo.name as MoveName}
                },
            };
            if (turn.group === undefined) { // create a new group with a unique id
                let uniqueGroupId = 0;
                while (usedGroupIds.includes(uniqueGroupId)) {
                    uniqueGroupId++;
                }
                usedGroupIds.push(uniqueGroupId);
                groupIds.push(uniqueGroupId);
                turn.group = uniqueGroupId;
                groups.push({
                    id: uniqueGroupId,
                    repeats: 1,
                    turns: [turn as RaidTurnInfo],
                })
            } else if (groupIds.includes(turn.group)) { // add turn to existing group
                groups.find((g) => g.id === t.group)!.turns.push(turn as RaidTurnInfo);
            } else { // create a new group with the same id
                let repeats = 1;
                if (obj.groups && obj.repeats) {
                    for (let i = 0; i < obj.groups.length; i++) {
                        if (obj.groups[i].includes(t.id)) {
                            repeats = obj.repeats[i];
                            break;
                        }
                    }
                }
                groupIds.push(turn.group);
                groups.push({
                    id: turn.group,
                    repeats: repeats,
                    turns: [turn as RaidTurnInfo],
                });
            }
        };
        const name = obj.name || "";
        const notes = obj.notes || "";
        const credits = obj.credits || "";

        const substitutes: SubstituteBuildInfo[][] = await Promise.all((obj.substitutes || [[],[],[],[]]).map(async (subsList) => 
            await Promise.all(subsList.map(async (s,i) => 
                    {
                        const r = s.raider;
                        const subPoke = new Raider(i+1, r.role, r.shiny, new Field(), 
                            new Pokemon(gen, r.name, {
                                ability: r.ability || undefined,
                                item: r.item || undefined,
                                nature: r.nature || undefined,
                                evs: r.evs || undefined,
                                ivs: r.ivs || undefined,
                                level: r.level || undefined,
                                teraType: (r.teraType || undefined) as (TypeName | undefined),
                                isTera: i === 0,
                                bossMultiplier: r.bossMultiplier || undefined,
                                moves: r.moves || undefined,
                                shieldData: r.shieldData || {hpTrigger: 0, timeTrigger: 0, shieldCancelDamage: 0, shieldDamageRate: 0, shieldDamageRateTera: 0, shieldDamageRateTeraChange: 0},
                            }), 
                            (r.moves ? (
                                allMoves ? 
                                (r.moves.map((m) => allMoves.get(m as MoveName) || {name: m as MoveName, target: "user"})) :
                                (await Promise.all(r.moves.map((m) => PokedexService.getMoveByName(m) || {name: m, target: "user"})))
                            ) as MoveData[] : []),
                        );
                        return {
                            raider: subPoke,
                            substituteMoves: s.substituteMoves as MoveName[],
                            substituteTargets: s.substituteTargets,
                        };
                    }
                )),
            ));

        return {name, notes, credits, pokemon, groups, substitutes}
    } catch (e) {
        return null;
    }
}

function serializeInfo(info: RaidBattleInfo, substitutes: SubstituteBuildInfo[][]): string {
    const obj: LightBuildInfo = {
        name: info.name || "",
        notes: info.notes || "",
        credits: info.credits || "",
        pokemon: info.startingState.raiders.map(
            (r) => { return {
                id: r.id,
                role: r.role,
                name: r.name,
                shiny: r.shiny,
                ability: r.ability,
                item: r.item,
                nature: r.nature,
                evs: r.evs,
                ivs: r.ivs,
                level: r.level,
                teraType: r.teraType,
                moves: r.moves,
                bossMultiplier: r.bossMultiplier,
                extraMoves: r.extraMoves,
                shieldData: r.shieldData,
            }}
        ),
        turns: info.groups.map((g) => g.turns.map((t) => {
            return {
                id: t.id,
                group: t.group,
                moveInfo: {
                    name: t.moveInfo.moveData.name,
                    userID: t.moveInfo.userID,
                    targetID: t.moveInfo.targetID,
                    options: t.moveInfo.options,
                },
                bossMoveInfo: {
                    name: t.bossMoveInfo.moveData.name,
                    userID: t.bossMoveInfo.userID,
                    targetID: t.bossMoveInfo.targetID,
                    options: t.bossMoveInfo.options,
                }
            }
        })).flat(),
        groups: info.groups.map((g) => g.turns.map((t) => t.id)),
        repeats: info.groups.map((g) => g.repeats || 1),
        substitutes: substitutes.map((subsList) => subsList.map((s) => {
            const r = s.raider;
            return {
                raider: {
                    id: r.id,
                    role: r.role,
                    name: r.name,
                    shiny: r.shiny,
                    ability: r.ability,
                    item: r.item,
                    nature: r.nature,
                    evs: r.evs,
                    ivs: r.ivs,
                    level: r.level,
                    teraType: r.teraType,
                    moves: r.moves,
                },
                substituteMoves: s.substituteMoves,
                substituteTargets: s.substituteTargets,
            }
        })),
    }
    console.log(obj); // for developer use
    return serialize(obj);
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
  
function LinkButton({title, notes, credits, raidInputProps, substitutes, setTitle, setNotes, setCredits, setPrettyMode, setSubstitutes, setLoading, translationKey}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, substitutes: SubstituteBuildInfo[][],
      setTitle: (t: string) => void, setNotes: (t: string) => void, setCredits: (t: string) => void, 
      setPrettyMode: (p: boolean) => void, setSubstitutes: ((s: SubstituteBuildInfo[]) => void)[], setLoading: (l: boolean) => void, translationKey: any}) {
    const [buildInfo, setBuildInfo] = useState<LightBuildInfo | null>(null);
    const [hasLoadedInfo, setHasLoadedInfo] = useState(false);
    const location = useLocation();
    const hash = location.hash;
    const [hashChanges, setHashChanges] = useState(0);
    const hashChangesRef = useRef(0);

    const [buttonDisabled, setButtonDisabled] = useState(false);
    const buttonTimer = useRef<NodeJS.Timeout | null>(null);

    const [copiedLink, setCopiedLink] = useState<string>("theastrogoth.github.io/tera-raid-builder")
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackSeverity, setSnackSeverity] = useState<"success" | "warning" | "error">("success");

    const handleClick = () => {
      setSnackOpen(true);
    };
  
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setSnackOpen(false);
    };

    useEffect(() => {
        try {
            if (hash !== "") {
                if (!buildInfo) {
                    setLoading(true);
                }
                let lcHash = hash.includes('/') ? hash.slice(1).toLowerCase() : hash.slice(1).toLowerCase() + "/main";
                if (JSON_HASHES.includes(lcHash)) {
                    setLoading(true);
                    setPrettyMode(true);
                    import(`../data/strats/${lcHash}.json`)
                    .then((module) => {
                        setBuildInfo(module.default);
                    })
                    .catch((error) => {
                        console.error('Error importing JSON file:', error);
                        setLoading(false);
                    });
                } else if (buildInfo) {
                    setLoading(true);
                    setHashChanges(hashChanges + 1);
                }
            }
        } catch (e) {
            console.log(e);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hash]);

    useEffect(() => {
        async function loadInfo() {
            try {
                let res: BuildInfo | null = null;
                if (buildInfo && hashChangesRef.current === hashChanges) {
                    res = await lightToFullBuildInfo(buildInfo);
                } else {
                    if (!JSON_HASHES.includes(hash.slice(1)) && !JSON_HASHES.includes(hash.slice(1) + "/main")) {
                        if (hash === "" || hash === "#") {
                            const module = await import(`../data/strats/default.json`)
                            setBuildInfo(module.default as LightBuildInfo);
                        } else if (hash.length < 50) { // This check should probably be more systematic
                            const fullHash = await getFullHashFromShortHash(hash);
                            if (fullHash) {
                                const bInfo = await deserialize(fullHash);
                                setBuildInfo(bInfo);
                                setPrettyMode(true);
                            } else {
                                const module = await import(`../data/strats/default.json`)
                                setBuildInfo(module.default as LightBuildInfo);
                            }
                        } else {
                            const bInfo = await deserialize(hash);
                            setBuildInfo(bInfo);
                            setPrettyMode(true);
                        }
                    } else {
                        setPrettyMode(true);
                    }
                }
                if (res) {
                    const {name, notes, credits, pokemon, groups} = res;
                    setTitle(name);
                    setNotes(notes);
                    setCredits(credits);
                    raidInputProps.setPokemon[0](pokemon[0]);
                    raidInputProps.setPokemon[1](pokemon[1]);
                    raidInputProps.setPokemon[2](pokemon[2]);
                    raidInputProps.setPokemon[3](pokemon[3]);
                    raidInputProps.setPokemon[4](pokemon[4]);
                    raidInputProps.setGroups(groups);
                    setSubstitutes[0](res.substitutes[0]);
                    setSubstitutes[1](res.substitutes[1]);
                    setSubstitutes[2](res.substitutes[2]);
                    setSubstitutes[3](res.substitutes[3]);
                    setHasLoadedInfo(true);
                }
            } catch (e) {
                setLoading(false);
                console.log(e);
            }
        }
        loadInfo().catch((e) => console.log(e));
        hashChangesRef.current = hashChanges;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildInfo, hashChanges]);

    useEffect(() => {
        if (hasLoadedInfo) {
            setHasLoadedInfo(false);
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasLoadedInfo]);

    return (
        <>
        <Button
            variant="outlined"
            // disabled={buttonDisabled} // Don't display when the button is disabled to avoid confusion
            onClick={() => {
                if (buttonDisabled) { return; }
                setButtonDisabled(true);
                if(buttonTimer.current === null) {
                    buttonTimer.current = setTimeout(() => {
                        setButtonDisabled(false);
                        buttonTimer.current = null;
                    }, 5000) // enforce 5 second delay between clicks actually doing anything
                } else {
                    return; // This should never happen
                }

                const newHash = serializeInfo(
                    {
                        name: title,
                        notes: notes,
                        credits: credits,
                        startingState: new RaidState(raidInputProps.pokemon),
                        groups: raidInputProps.groups,
                    },
                    substitutes,
                );

                if (typeof ClipboardItem && navigator.clipboard.write) {
                    // iOS compatibility case. clipboard.write() is only supported when used synchronously
                    // within a gesture event handler, so we need to pass a ClipboardItem
                    // This condition is also used for Chrome, or any other browser for which ClipboardItem is defined
                    const text = new ClipboardItem({
                        "text/plain": setLinkDocument(title, raidInputProps, newHash, setButtonDisabled, setSnackSeverity)
                        .then(shortHash => {
                            handleClick();
                            return new Blob([
                                window.location.href.split("#")[0] + "#" + (shortHash || newHash)
                            ], { type: "text/plain" })
                        })
                    })
                    navigator.clipboard.write([text]);
                } else {
                    // Firefox compatibility case (ClipboardItem is not defined)
                    setLinkDocument(title, raidInputProps, newHash, setButtonDisabled, setSnackSeverity)
                    .then(shortHash => {
                        handleClick();
                        navigator.clipboard.writeText(
                            window.location.href.split("#")[0] + "#" + (shortHash || newHash)
                        )}
                    );
                }
            }}
        >
            {getTranslation("Create link for this strategy!", translationKey)}
        </Button>
        <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={handleClose} severity={snackSeverity} sx={{ width: '100%' }}>
                {
                    (snackSeverity === "success") ? ("Link copied to clipboard!") : 
                    (snackSeverity === "warning") ? ("Link failed to save to database. A long link has been copied to your clipboard instead.") : 
                    "Failed to copy link to clipboard. You can copy the link manually from here:\n\n " + copiedLink
                }
            </Alert>
        </Snackbar>
        </>
    )
}

export default LinkButton;