import React, { useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button"

import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';

import Collapse from "@mui/material/Collapse";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import HelpOutline from "@mui/icons-material/HelpOutline";
import LanguageIcon from '@mui/icons-material/Language';
import DarkLightModeSwitch from "./DarkLightModeSwitch";
import HelpSection from "./HelpSection";
import { getTranslation } from "../utils";

type LanguageOption = 'en' | 'ja' | 'fr' | 'es' | 'de' | 'it' | 'ko' | 'zh-Hant' | 'zh-Hans';

const LANGUAGE_NAMES = {
    'en': 'English',
    'ja': '日本語',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ko': '한국어',
    'zh-Hant': '繁體中文',
    'zh-Hans': '简体中文'
}

function Navbar({lightMode, setLightMode, prettyMode, setPrettyMode, language, setLanguage, translationKey}: {lightMode: 'light' | 'dark', setLightMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>, prettyMode: boolean, setPrettyMode: React.Dispatch<React.SetStateAction<boolean>>, language: LanguageOption, setLanguage: (l: LanguageOption) => void, translationKey: any}) {  
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };
    const [showHelp, setShowHelp] = useState(false);
    return (
        <Box>
            <AppBar position="static" color="secondary" sx={{ minWidth: "800px"}}>
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
                            {prettyMode ? 
                                getTranslation("Edit Mode", translationKey) : 
                                getTranslation("Pretty Mode", translationKey)
                            }
                        </Button>
                    </Box>
                    <Box component="div" >
                        <Button 
                            color="inherit"
                            onClick={handleClick}
                            startIcon={<LanguageIcon />}
                        >
                            {LANGUAGE_NAMES[language]}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'center',
                            }}
                        >
                            {
                                Object.keys(LANGUAGE_NAMES).map((key) => {
                                    return (
                                        <MenuItem onClick={() => {setLanguage(key as LanguageOption); handleClose()}}>{LANGUAGE_NAMES[key as LanguageOption]}</MenuItem>
                                    )
                                })
                            }
                        </Menu>
                    </Box>
                    <Box component="div" >
                        <Button 
                            color="inherit"
                            onClick={() => setShowHelp(!showHelp)}
                            startIcon={<HelpOutline />}
                        >
                            { getTranslation("Help", translationKey) }
                        </Button>
                    </Box>
                    <DarkLightModeSwitch lightMode={lightMode} setLightMode={setLightMode} />
                </Toolbar>
            </AppBar>
            <Box>
                <Collapse in={showHelp}>
                    <HelpSection language={language} setOpen={setShowHelp} />
                </Collapse>
            </Box>
        </Box>
    );
}
export default React.memo(Navbar);