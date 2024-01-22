import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from "@mui/material/styles";

import Plot from "react-plotly.js";
//@ts-ignore
import Plotly from "plotly.js/dist/plotly";

import { StatsTable } from '../calc';
import { Nature } from "../calc/data/interface";
import { getTranslation } from '../utils';

// These colors were hastily/lazily chosen to roughly match those used in Scarlet/Violet
const plusColor     = "#ff594a"; // for boosted stat from nature
const minusColor    = "#1490fc"; // for penalized stat from nature
const statsColor    = "#ad942b"; // for stat totals
const lowEVColor    = "#fcca00"; // for non-maxed EVs
const maxedEVColor  = "#00c8c8"; // for when total EVs are 510
const badEVColor    = "#d44a4a"; // for wehn total EVs exceeding 510 (shouldn't happen unless something goes wrong)

const tickorder = ["HP", "SpA", "SpD", "Spe", "Def", "Atk", "HP"];
const rightAligned = ["SpA", "SpD"];

const ticktext = (tickOrder: string[], index: number, stats: StatsTable, nature: Nature | undefined, evs: StatsTable, translationKey: any, pluscolor: string = plusColor, minuscolor: string = minusColor) => {
    const stat = tickOrder[index];
    const lcStat = stat.toLowerCase() as keyof StatsTable;
    const isPlus = nature ? nature.plus !== nature.minus && nature.plus === lcStat : false;
    const isMinus = nature ? nature.plus !== nature.minus && nature.minus === lcStat : false;
    const isMaxedEV = evs[lcStat] === 252;
    let text = '<b>' + getTranslation(stat, translationKey, "stats") + '</b>';
    console.log(nature?.name, nature?.plus, nature?.minus, lcStat, isPlus, isMinus)
    if (isPlus) {
        text = '<span style="color:' + pluscolor + '"><b>' + text + '</b></span>';    } else if (isMinus) {
    } 
    if (isMinus) {
        text = '<span style="color:' + minuscolor + '"><b>' + text + '</b></span>';
    }
    if (isMaxedEV) {
        if (rightAligned.includes(stat)) {
            text = "\u2728"+text;
        } else {
            text += "\u2728";
        }
    }
    text = text + "<br><b>" + stats[lcStat] +"</b>";
    return text;
}

const sigmoid = (stat: number) => {
    return 1.75 / (1 + Math.exp(stat / -125)) - .75;
};

function StatRadarPlot({nature, evs, stats, translationKey, bossMultiplier=100}: {nature: Nature | undefined, evs: StatsTable, stats: StatsTable, translationKey: any, bossMultiplier?: number}) {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark';

    // const [, setRotation] = useState(90);
    // const [revision, setRevision] = useState(1);
    
    // // Add a callback that we will use whenever the layout is updated.
    // // @ts-ignore
    // const onLayoutCallbacks = data => {
    //     if (data['polar.angularaxis.rotation']) {
    //         setRotation(90);
    //         setRevision(revision + 1);
    //     }
    // };


    const ticktexts = tickorder.map((s,i) => ticktext(tickorder, i, stats, nature, evs, translationKey));
    const evTotal = Object.values(evs).reduce((a,b) => a + b, 0)
    const evColor = evTotal > 510 ? badEVColor : (
                    evTotal < 510 ? lowEVColor : maxedEVColor);
    
    return (
        <Box>
            <Plot
                // onRelayout={onLayoutCallbacks}
                // //@ts-ignore
                // onRelayouting={onLayoutCallbacks}
                data={[
                    {
                        type: "scatterpolar", // Hack to get hexagonal axis
                        mode: "lines",
                        line: {
                            width: 1.5,
                            color: isDark ? "#cccccc" : "#888888",
                        },
                        name: "axis",
                        r: [.99, .99, .99, .99, .99, .99, .99],
                        theta: ticktexts,
                        fill: "toself",
                        fillcolor: "rgba(0, 0, 0, .1)",
                    },
                    {
                        type: "scatterpolar",
                        mode: "lines",
                        line: {
                            width: 1,
                            color: statsColor,
                        },
                        marker: {
                            width: 1,
                            color: statsColor,
                        },
                        name: "stats",
                        r: [stats.hp, stats.spa, stats.spd, stats.spe, stats.def, stats.atk, stats.hp].map((stat, index) => sigmoid(stat / ((index === 0 || index === 6) ? bossMultiplier / 100 : 1))),
                        theta: ticktexts,
                        fill: "toself",
                    },
                    {
                        type: "scatterpolar",
                        mode: "lines",
                        line: {
                            width: 0,
                            color: evColor,
                        },
                        marker: {
                            size: 0,
                            color: evColor,
                        },
                        name: "evs",
                        r: [evs.hp, evs.spa, evs.spd, evs.spe, evs.def, evs.atk, evs.hp].map(stat => (stat + 23)/275),
                        theta: ticktexts,
                        fill: "toself",
                    },
                ]}
                style={{ width: "325px", height: "200px" }}
                layout ={{
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    margin: {
                        r: 100,
                        l: 100,
                        t: 10,
                        b: 10,
                    },
                    showlegend: false,
                    font: {
                        family: "Roboto",
                    },
                    dragmode: false,
                    polar: {
                        bgcolor: 'rgba(0,0,0,0)',
                        angularaxis: {
                            tickfont: {
                            size: 11,
                            color: isDark ? "#cccccc" : '',
                            },
                            linewidth: 0, // 0 Makes circular axis invisible 
                            rotation: 90,
                            direction: "counterclockwise",
                            fixedrange: true,
                        },
                        radialaxis: {
                            visible: false,
                            range: [0, 1],
                            fixedrange: true,
                        }
                    }
                }}
                config={{ 
                    staticPlot: false,
                    modeBarButtonsToRemove: ['zoom2d'],  
                    toImageButtonOptions: {
                        format: "svg",
                        filename: "statplot",
                        // height: 800,
                        // width: 600,
                        // scale: 2,
                    }
                }}
            />
            <Box height="10px"/>
        </Box>
    )
}

export async function getStatRadarPlotPNG(id: number, nature: Nature | undefined, evs: StatsTable, stats: StatsTable, translationKey: any, scale: number = 10, bossMultiplier: number = 100) {
    
    const ticktexts = tickorder.map((s,i) => ticktext(tickorder, i, stats, nature, evs, translationKey, "#fdbab4", "#b3dbff"));
    const evTotal = Object.values(evs).reduce((a,b) => a + b, 0)
    const evColor = evTotal > 510 ? badEVColor : (
                    evTotal < 510 ? lowEVColor : maxedEVColor);

    const data = [
        {
            type: "scatterpolar", // Hack to get hexagonal axis
            mode: "lines",
            line: {
                width: 2.5 * scale,
                color: "#888888",
            },
            name: "axis",
            r: [0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0],
            theta: ticktexts.map((t) => [t,t]).flat(),
            fill: "toself",
            fillcolor: "rgba(0, 0, 0, .1)",
        },
        {
            type: "scatterpolar", // Hack to get hexagonal axis
            mode: "lines",
            line: {
                width: 4 * scale,
                color: "#cccccc",
            },
            name: "axis",
            r: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
            theta: ticktexts,
            fill: "toself",
            fillcolor: "rgba(0, 0, 0, .1)",
        },
        {
            type: "scatterpolar",
            mode: "lines",
            line: {
                width: 2.5 * scale,
                color: statsColor,
            },
            marker: {
                width: 2.5 * scale,
                color: statsColor,
            },
            name: "stats",
            r: [stats.hp, stats.spa, stats.spd, stats.spe, stats.def, stats.atk, stats.hp].map((stat, index) => sigmoid(stat / (index === 0 ? bossMultiplier / 100 : 1))),
            theta: ticktexts,
            fill: "toself",
        },
        {
            type: "scatterpolar",
            mode: "lines",
            line: {
                width: 0,
                color: evColor,
            },
            marker: {
                size: 0,
                color: evColor,
            },
            name: "evs",
            r: [evs.hp, evs.spa, evs.spd, evs.spe, evs.def, evs.atk, evs.hp].map(stat => (stat + 23)/275),
            theta: ticktexts,
            fill: "toself",
        },
    ];

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: {
            r: 10 * scale,
            l: 10 * scale,
            t: 25 * scale,
            b: 25 * scale,
        },
        showlegend: false,
        font: {
            family: "Poppins, sans-serif"
        },
        dragmode: false,
        polar: {
            bgcolor: 'rgba(0,0,0,0)',
            angularaxis: {
                tickfont: {
                    size: 17 * scale,
                    color: "#ffffff",
                },
                linewidth: 0, // 0 Makes circular axis invisible 
                rotation: 90,
                direction: "counterclockwise",
                fixedrange: true,
            },
            radialaxis: {
                visible: false,
                range: [0, 1.05],
                fixedrange: true,
            }
        }
    };

    const config = { staticPlot: false };

    //@ts-ignore
    const image = await Plotly.newPlot("statplot"+id, data, layout, config).then(async (gd) => {
        return await Plotly.toImage(gd, {format: "png", width: 325*scale, height: 200*scale})
    });
    
    return image as string;
}

export default React.memo(StatRadarPlot, (next, prev) => (next.evs === prev.evs && next.stats === prev.stats && next.nature === prev.nature && next.translationKey === prev.translationKey));