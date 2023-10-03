import React, { useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button"

import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';

import Collapse from "@mui/material/Collapse";

import HelpOutline from "@mui/icons-material/HelpOutline";
import DarkLightModeSwitch from "./DarkLightModeSwitch";
import HelpSection from "./HelpSection";

function Navbar({lightMode, setLightMode, prettyMode, setPrettyMode}: {lightMode: 'light' | 'dark', setLightMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>, prettyMode: boolean, setPrettyMode: React.Dispatch<React.SetStateAction<boolean>>}) {  
    const [showHelp, setShowHelp] = useState(false);
    return (
        <Box>
            <AppBar position="static" color="secondary" sx={{ minWidth: "700px"}}>
                <Toolbar>
                    <Box paddingRight={2} sx={{ transform: "translate(0px, 2px)"}}>
                        <img src={process.env.PUBLIC_URL + "/logo192.png"} height={60} alt="" />
                    </Box>
                    <Typography 
                        variant="h4"
                        sx={{
                            mr: 1,
                            display: "flex",
                            fontWeight: 800,
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Tera Raid Builder
                    </Typography>
                    <Box sx = {{ transform: "translate(-3px, 8px)"}}>
                        <Typography 
                            variant="body2"
                            sx={{
                                mr: 1,
                                fontWeight: 800,
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            Beta
                        </Typography>
                    </Box>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                    <Box component="div" >
                        <Button
                            color="inherit"
                            onClick={() => setPrettyMode(!prettyMode)}
                            startIcon={prettyMode ? <EditIcon /> :  <ImageIcon />}
                        >
                            {prettyMode ? "Edit Mode" : "Pretty Mode"}
                        </Button>
                    </Box>
                    <Box component="div" >
                        <Button 
                            color="inherit"
                            onClick={() => setShowHelp(!showHelp)}
                            startIcon={<HelpOutline />}
                        >
                            Help
                        </Button>
                    </Box>
                    <DarkLightModeSwitch lightMode={lightMode} setLightMode={setLightMode} />
                </Toolbar>
            </AppBar>
            <Box>
                <Collapse in={showHelp}>
                    <HelpSection setOpen={setShowHelp} />
                </Collapse>
            </Box>
        </Box>
    );
}
export default React.memo(Navbar);