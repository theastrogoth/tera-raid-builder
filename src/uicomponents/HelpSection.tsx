import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Collapse from "@mui/material/Collapse";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

function CollapseButton({open, setOpen}: {open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>}) {
    return (
        <IconButton
            onClick={() => setOpen(!open)}
            size="small"
        >
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
    )
}

function HelpSection({}: {}) {
    const [uiHelpOpen, setUiHelpOpen] = useState(false)
    const [buildHelpOpen, setBuildHelpOpen] = useState(false);

    return (
    <Stack spacing={1} sx={{ p: 2 }}>
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" gutterBottom>
                    Using this Calculator
                </Typography>
                <CollapseButton open={uiHelpOpen} setOpen={setUiHelpOpen} />
            </Stack>
            <Collapse in={uiHelpOpen} >
                <UIHelpSection />
            </Collapse>
        </Box>
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" gutterBottom>
                    Building a Raid-Ready Pokémon
                </Typography>
                <CollapseButton open={buildHelpOpen} setOpen={setBuildHelpOpen} />
            </Stack>
            <Collapse in={buildHelpOpen} >
                <BuildHelpSection />
            </Collapse>
        </Box>
    </Stack>
    )
}

function UIHelpSection({}: {}) {
    return (
        <Box>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Pokémon Build Controls
                </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Raid Move Controls
                </Typography>
            </Box>
        </Box>

    )
}

function BuildHelpSection({}: {}) {
    const [evHelpOpen, setEvHelpOpen] = useState(false);
    const [ivHelpOpen, setIvHelpOpen] = useState(false);
    const [natureHelpOpen, setNatureHelpOpen] = useState(false);
    const [eggMoveHelpOpen, setEggMoveHelpOpen] = useState(false);
    const [abilitiesHelpOpen, setAbilitiesHelpOpen] = useState(false);

    return (
        <Box>
            <Box sx={{ p: 1 }}>
                <Typography variant="body1" gutterBottom>
                    Helpful Resources:
                </Typography>
                <Link href="https://www.reddit.com/r/PokemonScarletViolet/comments/12k4rd7/guide_how_to_train_your_pok%C3%A9mon_to_be_ready_for/">
                    <Typography variant="body2">
                        Pokémon Training Guide by u/ChocoHammy
                    </Typography>
                </Link>
            </Box>
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Individual Values (IVs)
                    </Typography>
                    <CollapseButton open={ivHelpOpen} setOpen={setIvHelpOpen} />
                </Stack>
                <Collapse in={ivHelpOpen} >
                    <Typography variant="body2" gutterBottom>
                        IVs are a Pokémon's hidden stat values that can only be changed by Hyper Training.
                        A Pokémon has an IV ranging from 0 to 31 for each stat. Higher IVs correspond to higher stat totals.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Hyper Training allows you to change a Pokémon's IVs to 31. 
                        In Pokémon Scarlet & Violet, you can Hyper Train a Pokémon once it reaches level 50 by exchanging Bottle Caps with an NPC in Montenevera.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        While you cannot directly view a Pokémon's IVs in-game, you can get a rough estimate of a Pokémon's IVs by using the Judge feature while viewing a Pokémon in your Boxes.
                        Each IV description corresponds to a range of possible values:
                    </Typography>
                    <Box justifyContent="center" alignItems="center" sx={{ p: 2}}>                            
                        <TableContainer sx={{ paddingBottom: 2}}>
                            <Table size="small" sx={{ width: "300px"}}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><Typography variant="body2" fontWeight="bold">Description</Typography></TableCell>
                                        <TableCell><Typography variant="body2" fontWeight="bold">IV Range</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body2">"Best" or "Hyper trained!"</Typography></TableCell>
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
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="body2" gutterBottom>
                            Most Tera Raid builds benefit from having all IVs maximized ("Best" or "Hyper trained!"). 
                        </Typography>
                    </Box>
                </Collapse>
            </Box>
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Effort Values (IVs)
                    </Typography>
                    <CollapseButton open={evHelpOpen} setOpen={setEvHelpOpen} />
                </Stack>
                <Collapse in={evHelpOpen} >
                    <Typography variant="body2" gutterBottom>
                        EVs are points that directly contribute to a Pokémon's stat totals. 
                        They are earned by defeating opponents in battle or consuming vitamins and feathers.
                        EVs can be reduced by consuming certain berries.
                        Each 4 EVs in a stat increase the corresponding stat stat total by 1 point at level 100.
                        A Pokémon can have a maximum of 510 EVs total, and a maximum of 252 EVs in a single stat.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        You can view an in-game chart showing your Pokémon's EVs by navigating to the Pokémon's summary screen and pressing the L button.
                        On this chart, a stat with the maximum number of EVs (252) will show an animated sparkle effect.
                        The chart's color will change from yellow to blue when a Pokémon has 510 EVs total.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Many Tera Raid builds benefit from having two stats with maximum EVs. 
                    </Typography>
                </Collapse>
            </Box>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Natures
                </Typography>
                <CollapseButton open={natureHelpOpen} setOpen={setNatureHelpOpen} />
                <Collapse in={natureHelpOpen} >
                    <Typography variant="body2" gutterBottom>
                        A Pokémon's nature increases one stat by 10% and decreases another stat by 10%.
                        It is important to make sure your Pokémon's nature complements the kind of role it will fill in a raid.
                        For example, a Pokémon that will be a physical attacker might have the Adamant nature, which increases its Attack stat and decreases its Special Attack stat.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        You can change a Pokémon's nature by giving it a Nature Mint, which can be purchased at any Chansey Supply shop.
                    </Typography>
                </Collapse>
            </Box>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Egg Moves
                </Typography>
                <CollapseButton open={eggMoveHelpOpen} setOpen={setEggMoveHelpOpen} />
                <Collapse in={eggMoveHelpOpen} >
                    <Typography variant="body2" gutterBottom>
                        Egg moves are moves that a Pokémon can only learn in two ways.
                        The first way is to breed a female Pokémon with a Pokémon of a compatible species that knows the egg move. Any eggs hatched
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        The second, easier way is to first make sure that the Pokémon has an empty move slot by making it forget a move,
                        then give it a Mirror Herb to hold, and finally starting a picnic with the Pokémon as well as another Pokémon of any species that knows the egg move.
                        After a few seconds, you can exit the picnic, and your Pokémon will have learned the egg move.
                    </Typography>
                </Collapse>
            </Box>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Abilities
                </Typography>
                <CollapseButton open={abilitiesHelpOpen} setOpen={setAbilitiesHelpOpen} />
                <Collapse in={abilitiesHelpOpen} >
                    <Typography variant="body2" gutterBottom>
                        A Pokémon's ability is a passive effect that can have a variety of effects in battle.
                        Some abilities are more useful than others, so it is often important to make sure your Pokémon has the best ability for its role in a raid.
                        For example, some strategies rely on a Pokémon's ability to activate a weather effect with the Drizzle or Drought abilities.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        In some cases, you can change a Pokémon's ability by giving it an Ability Capsule, which can be purchased at any Chansey Supply shop.
                        However, not all Pokémon have multiple abilities, and some Pokémon have hidden abilities that cannot accessed with an Ability Capsule.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        To obtain a Pokémon with a hidden ability, you can use an Ability Patch on a Pokémon.
                        If you don't have an Ability Patch, there is a small chance to obtain them as loot from 6 start Tera Raids.
                        Also, many Pokémon caught in a 6 star Tera Raid have a chance to have a hidden ability.
                    </Typography>
                </Collapse>
            </Box>
        </Box>
    )
}

export default HelpSection;