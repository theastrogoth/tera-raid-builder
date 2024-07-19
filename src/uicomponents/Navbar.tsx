import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";

import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import MenuIcon from '@mui/icons-material/Menu';

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

function PrettyEditModeButton({prettyMode, setPrettyMode, translationKey}: {prettyMode: boolean, setPrettyMode: React.Dispatch<React.SetStateAction<boolean>>, translationKey: any}) {
    return (
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
    )
}

function LanguageMenuButton({language, setLanguage, anchorEl, handleClick, handleClose}: {language: LanguageOption, setLanguage: (l: LanguageOption) => void, anchorEl: HTMLElement | null, handleClick: (event: React.MouseEvent<HTMLButtonElement>) => void, handleClose: () => void}) {
    return (
    <>
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
                Object.keys(LANGUAGE_NAMES).map((key, idx) => {
                    return (
                        <MenuItem key={idx} onClick={() => {setLanguage(key as LanguageOption); handleClose()}}>{LANGUAGE_NAMES[key as LanguageOption]}</MenuItem>
                    )
                })
            }
        </Menu>
    </>
    )
}

function Navbar({lightMode, setLightMode, prettyMode, setPrettyMode, language, setLanguage, translationKey}: {lightMode: 'light' | 'dark', setLightMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>, prettyMode: boolean, setPrettyMode: React.Dispatch<React.SetStateAction<boolean>>, language: LanguageOption, setLanguage: (l: LanguageOption) => void, translationKey: any}) {  
    const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
    const handleLangClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setLangAnchorEl(event.currentTarget);
    };
    const handleLangClose = () => {
      setLangAnchorEl(null);
    };
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
      setMenuAnchorEl(null);
    };
    const [showHelp, setShowHelp] = useState(false);
    return (
        <Box>
            <AppBar position="static" color="secondary" sx={{ minWidth: "628px"}}>
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
                    <Box component="div">
                        <PrettyEditModeButton prettyMode={prettyMode} setPrettyMode={setPrettyMode} translationKey={translationKey} />
                    </Box>
                    <Box component="div" sx={{ display: {xs: "none", sm: "flex"} }}>
                        <LanguageMenuButton language={language} setLanguage={setLanguage} anchorEl={langAnchorEl} handleClick={handleLangClick} handleClose={handleLangClose} />
                    </Box>
                    <Box component="div" sx={{ display: {xs: "none", md: "flex"} }}>
                        <Button 
                            color="inherit"
                            onClick={() => setShowHelp(!showHelp)}
                            startIcon={<HelpOutline />}
                        >
                            { getTranslation("Help", translationKey) }
                        </Button>
                    </Box>
                    <Box component="div" sx={{ display: {xs: "none", md: "flex"} }}>
                        <DarkLightModeSwitch lightMode={lightMode} setLightMode={setLightMode} />
                    </Box>
                    <Box component="div" sx={{ display: { xs: 'flex', md: 'none' } }}>
                        <IconButton onClick={handleMenuClick} size="large" color="inherit">
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={menuAnchorEl}
                            open={Boolean(menuAnchorEl)}
                            onClose={handleMenuClose}
                            // anchorOrigin={{
                            //     vertical: 'bottom',
                            //     horizontal: 'left',
                            // }}
                            // transformOrigin={{
                            //     vertical: 'top',
                            //     horizontal: 'center',
                            // }}
                        >
                            <Stack direction="column" spacing={1} justifyContent="center" alignItems="center">
                                <Box component="div" sx={{ display: {xs: 'flex', sm: 'none'} }}>
                                    <LanguageMenuButton language={language} setLanguage={setLanguage} anchorEl={langAnchorEl} handleClick={handleLangClick} handleClose={handleLangClose} />
                                </Box>
                                <Button 
                                    color="inherit"
                                    onClick={() => setShowHelp(!showHelp)}
                                    startIcon={<HelpOutline />}
                                >
                                    { getTranslation("Help", translationKey) }
                                </Button>
                                <DarkLightModeSwitch lightMode={lightMode} setLightMode={setLightMode} />
                            </Stack>
                        </Menu>
                    </Box>
                    <Box component="div" sx={{ width: "20px", display: {xs: "none", lg: "flex"} }} />
                    <Box component="div" sx={{ display: {xs: "none", lg: "flex"} }}>
                        <Link href="https://www.reddit.com/r/PokePortal/" target="_blank" sx={{ transform: "translate(0px, 2px)"}}>
                            <img src={process.env.PUBLIC_URL + "/pp_icon.png"} alt="PokePortal" width="50px" height="50px" />
                        </Link>
                    </Box>
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