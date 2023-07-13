import { useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from "@mui/material/styles";

import Plot from "react-plotly.js";

import { StatsTable } from '../calc';
import { Nature } from "../calc/data/interface";

// These colors were hastily/lazily chosen to roughly match those used in Scarlet/Violet
const plusColor     = "#ff594a"; // for boosted stat from nature
const minusColor    = "#1490fc"; // for penalized stat from nature
const statsColor    = "#ad942b"; // for stat totals
const lowEVColor    = "#fcca00"; // for non-maxed EVs
const maxedEVColor  = "#00c8c8"; // for when total EVs are 508-510
const badEVColor    = "#d44a4a"; // for wehn total EVs exceeding 510 (shouldn't happen unless something goes wrong)

const tickorder = ["HP", "SpA", "SpD", "Spe", "Def", "Atk", "HP"];


function StatRadarPlot({nature, evs, stats}: {nature: Nature | undefined, evs: StatsTable, stats: StatsTable}) {
    const theme = useTheme()
    const isDark = theme.palette.mode == 'dark';

    const [rotation, setRotation] = useState(90);
    const [revision, setRevision] = useState(1);
    
    // Add a callback that we will use whenever the layout is updated.
    // @ts-ignore
    const onLayoutCallbacks = data => {
        if (data['polar.angularaxis.rotation']) {
            setRotation(90);
            setRevision(revision + 1);
        }
    };


    //@ts-ignore
    const ticktexts = tickorder.map(stat => stat + ": " + stats[stat.toLowerCase()] + (evs[stat.toLowerCase()] == 252 ? '\u2728' : ''))
    if (nature) {
        for (let i=0; i<tickorder.length; i++) {
            if (nature.plus == nature.minus) {
                // neutral natures
            }
            else if (nature.plus == tickorder[i].toLowerCase()) {
                ticktexts[i] = '<span style="color:' + plusColor + '">' + ticktexts[i] + '</span>';
            } else if (nature.minus == tickorder[i].toLowerCase()) {
                ticktexts[i] = '<span style="color:' + minusColor + '">' + ticktexts[i] + '</span>';
            }
        }
    }

    const evTotal = Object.values(evs).reduce((a,b) => a + b, 0)
    const evColor = evTotal > 510 ? badEVColor : (
                    evTotal < 508 ? lowEVColor : maxedEVColor);

    const hpPlotVal = (stats.hp+100)/500;
    return (
        <Box>
            <Plot
                onRelayout={onLayoutCallbacks}
                //@ts-ignore
                onRelayouting={onLayoutCallbacks}
                data={[
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
                        r: [hpPlotVal, ...[stats.spa, stats.spd, stats.spe, stats.def, stats.atk].map(stat => (stat+50)/350), hpPlotVal],
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
                    }
                ]}
                style={{ width: "350px", height: "200px" }}
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
                    dragmode: false,
                    polar: {
                        bgcolor: 'rgba(0,0,0,0)',
                        angularaxis: {
                            tickfont: {
                            size: 11,
                            color: isDark ? "#cccccc" : '',
                            },
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
                config={{ staticPlot: false }}
            />
            <Box height="10px"/>
        </Box>
    )
}

export default StatRadarPlot;