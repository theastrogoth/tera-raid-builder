import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { serialize, deserialize } from "../utilities/shrinkstring";

import Box from '@mui/material/Box';

import { Pokemon, Generations, Field } from "../calc";
import { MoveName, TypeName } from "../calc/data/interface";
import { getItemSpriteURL, getPokemonArtURL, getTypeIconURL, getTeraTypeIconURL } from "../utils";
import { Raider, RaidState, RaidTurnInfo } from "../raidcalc/interface";
import { RaidInputProps } from "../raidcalc/inputs";
import { LightBuildInfo, LightPokemon, LightTurnInfo } from "../raidcalc/hashData";

import PokemonSummary from "./PokemonSummary";
import BossSummary from "./BossSummary";

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import Button from "@mui/material/Button"
import { Hidden } from "@mui/material";

import ReactDomServer from "react-dom/server";

function saveStaticHTML(raidInputProps: RaidInputProps, title?: string, notes?: string, credits?: string) {
    const htmlContent = [ ReactDomServer.renderToStaticMarkup(
        // This would need to be filled out with everything we want to show. I don't think we would reuse many of the UI components here.
        <>
            <PokemonSummary pokemon={raidInputProps.pokemon[1]} setPokemon={(p: Raider) => {return; }} prettyMode={true} />
        </>
    )];
    console.log(htmlContent)
    var bl = new Blob(htmlContent, {type: "text/html"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = (title || "strategy" ) + ".html";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML = "something random - nobody will see this, it doesn't matter what you put here";
    a.click();
    
}


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
            // html2canvas(document.body, {allowTaint: true, useCORS: true}).then((canvas) => {
            //     canvas.toBlob((blob) => {
            //         if (blob) {
            //             saveAs(blob, title + '.png');
            //         } else {
            //             saveAs(getPokemonArtURL("wo-chien"), "live_reaction.png");
            //         }
            //     });
            // });
            saveStaticHTML(raidInputProps, title, notes, credits);
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