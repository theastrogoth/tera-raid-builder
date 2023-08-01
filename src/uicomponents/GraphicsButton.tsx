import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Box from '@mui/material/Box';

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";
import { RaidBattleInfo, Raider, RaidState, BuildInfo, RaidTurnInfo, RaidInputProps } from "../raidcalc/interface";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { Hidden } from "@mui/material";


function GraphicsButton({title, notes, credits, raidInputProps, setTitle, setNotes, setCredits, setPrettyMode}: 
    { title: string, notes: string, credits: string, raidInputProps: RaidInputProps, 
      setTitle: (t: string) => void, setNotes: (t: string) => void, setCredits: (t: string) => void, 
      setPrettyMode: (p: boolean) => void}) {
    const [buildInfo, setBuildInfo] = useState(null);
    const [hasLoadedInfo, setHasLoadedInfo] = useState(false);
    const location = useLocation();
    const hash = location.hash

    const handleDownload = () => {
        try {
            html2canvas(document.body, {allowTaint: true, useCORS: true}).then((canvas) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        saveAs(blob, title + '.png');
                    } else {
                        saveAs(getPokemonArtURL("wo-chien"), "live_reaction.png");
                    }
                });
            });
        } catch (e) {
            console.log(e)
        }
    };
    
    return (
        <Button
            variant="outlined"
            onClick={() => {
                handleDownload();
            }}
        >
            Download Graphic
        </Button>
    );
};


export default GraphicsButton;