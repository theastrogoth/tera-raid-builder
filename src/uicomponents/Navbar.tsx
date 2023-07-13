import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button"

import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";

import Collapse from "@mui/material/Collapse";

import HelpOutline from "@mui/icons-material/HelpOutline";
import DarkLightModeSwitch from "./DarkLightModeSwitch";

function Navbar({lightMode, setLightMode}: {lightMode: 'light' | 'dark', setLightMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>}) {  
    const [showHelp, setShowHelp] = useState(false);
    return (
        <Box>
            <AppBar position="static" color="secondary">
                <Toolbar>
                    <Typography 
                        variant="h5"
                        sx={{
                            mr: 2,
                            display: "flex",
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Tera Raid Builder
                    </Typography>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                    <Box component="div" sx={{ display: { xs: 'none', md: 'flex' } }}>
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
                    <Stack spacing={1}>
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Individual Values (IVs)
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                IVs are a Pokémon's hidden stats that can only be changed by Hyper Training.
                                A Pokémon has an IV ranging from 0 to 31 for each stat. Higher IVs correspond to higher stat totals.
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                Hyper Training allows you to change a Pokémon's IVs to 31. 
                                In Pokémon Scarlet & Violet, you can Hyper Train a Pokémon once it reaches level 50 by exchanging Bottle Caps with an NPC in Montenevara.
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                While you cannot directly view a Pokémon's IVs in-game, you can get a rough estimate of a Pokémon's IVs by using the Judge feature while viewing a Pokémon in your Boxes.
                                Each IV description corresponds to a range of possible values:
                            </Typography>
                            <Box justifyContent="center" alignItems="center" sx={{ p: 2}}>                            
                                <TableContainer sx={{ paddingBottom: 2}}>
                                    <Table size="small" sx={{ width: "300px"}}>
                                        <TableRow>
                                            <TableCell><Typography variant="body2" fontWeight="bold">Description</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontWeight="bold">IV Range</Typography></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Typography variant="body2">"Best" or "Hyper-Trained!"</Typography></TableCell>
                                            <TableCell><Typography variant="body2">31</Typography></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Typography variant="body2">"Fantastic"</Typography></TableCell>
                                            <TableCell><Typography variant="body2">30</Typography></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Typography variant="body2">"Very Good"</Typography></TableCell>
                                            <TableCell><Typography variant="body2">26-29</Typography></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Typography variant="body2">"Pretty Good"</Typography></TableCell>
                                            <TableCell><Typography variant="body2">16-25</Typography></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Typography variant="body2">"Decent"</Typography></TableCell>
                                            <TableCell><Typography variant="body2">1-15</Typography></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Typography variant="body2">"No Good"</Typography></TableCell>
                                            <TableCell><Typography variant="body2">0</Typography></TableCell>
                                        </TableRow>
                                    </Table>
                                </TableContainer>
                                <Typography variant="body2" gutterBottom>
                                    Most Tera-Raid builds benefit from having all IVs maximized ("Best" or "Hyper-Trained!"). 
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Effort Values (EVs)
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    EVs are points that indirectly contribute to a Pokémon's stat totals. 
                                    They are earned by defeating opponents in battle or consuming vitamins.
                                    EVs can be lost by consuming certain berries.
                                    Each 4 EVs in a stat increase the corresponding stat stat total by 1 point at level 100.
                                    A Pokémon can have a maximum of 510 EVs total, and a maximum of 252 EVs in a single stat.
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    You can view an in-game chart showing your Pokémon's EVs by navigating to the Pokémon's summary screen and pressing the left bumper.
                                    On this chart, a stat with the maximum number of EVs (252) will show an animated sparkle effect.
                                    The chart's color will change from blue to yellow when a Pokémon has 510 EVs total.
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    Many Tera-Raid builds benefit from having two stats with maximum EVs. 
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Collapse>
            </Box>
        </Box>
    );
}
export default React.memo(Navbar);