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
import Divider from "@mui/material/Divider";
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
    const [buildHelpOpen, setBuildHelpOpen] = useState(false);
    const [prettyHelpOpen, setPrettyHelpOpen] = useState(false);
    const [uiHelpOpen, setUiHelpOpen] = useState(false)


    return (
    <Stack spacing={0} sx={{ p: 2 }}>
        <Typography variant="body1" gutterBottom>
            Click on the button to the right of a section header to expand or collapse that section.
        </Typography>
        <Divider />
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
        <Divider />
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" gutterBottom>
                    Reading a Strategy
                </Typography>
                <CollapseButton open={prettyHelpOpen} setOpen={setPrettyHelpOpen} />
            </Stack>
            <Collapse in={prettyHelpOpen} >
                <PrettyHelpSection />
            </Collapse>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" gutterBottom>
                    Creating a Strategy
                </Typography>
                <CollapseButton open={uiHelpOpen} setOpen={setUiHelpOpen} />
            </Stack>
            <Collapse in={uiHelpOpen} >
                <UIHelpSection />
            </Collapse>
        </Box>
        <Divider />
    </Stack>
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
            <Box sx={{ paddingLeft: 1, marginBottom: 2 }}>
                <Typography variant="body1" gutterBottom>
                    Helpful Resources:
                </Typography>
                <Link href="https://www.reddit.com/r/PokemonScarletViolet/comments/12k4rd7/guide_how_to_train_your_pok%C3%A9mon_to_be_ready_for/">
                    <Typography variant="body2">
                        Pokémon Training Guide by u/ChocoHammy
                    </Typography>
                </Link>
            </Box>
            <Box sx={{ paddingLeft: 2, my: 1  }}>
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
                    </Box>
                    <Typography variant="body2" gutterBottom>
                            Most Tera Raid builds benefit from having all IVs maximized ("Best" or "Hyper trained!"). 
                    </Typography>
                </Collapse>
            </Box>
            <Box sx={{ paddingLeft: 2, my: 1  }}>
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
            <Box sx={{ paddingLeft: 2, my: 1  }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Natures
                    </Typography>
                    <CollapseButton open={natureHelpOpen} setOpen={setNatureHelpOpen} />
                </Stack>
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
            <Box sx={{ paddingLeft: 2, my: 1  }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Egg Moves
                    </Typography>
                    <CollapseButton open={eggMoveHelpOpen} setOpen={setEggMoveHelpOpen} />
                </Stack>
                <Collapse in={eggMoveHelpOpen} >
                    <Typography variant="body2" gutterBottom>
                        Egg moves are moves that a Pokémon can only learn in two ways.
                        The first way is to breed a female Pokémon with a Pokémon of a compatible species that knows the egg move. 
                        Any Pokémon hatched from their eggs will know the egg move.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        The second, easier way is to first make sure that the Pokémon has an empty move slot by making it forget a move,
                        then giving it a Mirror Herb to hold, and finally starting a picnic with the Pokémon as well as another Pokémon of any species that knows the egg move.
                        After a few seconds, you can exit the picnic, and your Pokémon will have learned the egg move.
                    </Typography>
                </Collapse>
            </Box>
            <Box sx={{ paddingLeft: 2, my: 1  }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Abilities
                    </Typography>
                    <CollapseButton open={abilitiesHelpOpen} setOpen={setAbilitiesHelpOpen} />
                </Stack>
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

function PrettyHelpSection({}: {}) {
    const [raiderHelpOpen, setRaiderHelpOpen] = useState(false);
    const [bossHelpOpen, setBossHelpOpen] = useState(false);
    const [moveHelpOpen, setMoveHelpOpen] = useState(false);
    const [calcHelpOpen, setCalcHelpOpen] = useState(false);

    return (
    <Box>
        <Typography variant="body2" gutterBottom>
            Strategies are easiest to read when "Pretty Mode" is enabled. Toggle between Pretty Mode and Edit Mode by clicking the button in the top right corner of the page.
        </Typography>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Raider Builds
                </Typography>
                <CollapseButton open={raiderHelpOpen} setOpen={setRaiderHelpOpen} />
            </Stack>
            <Collapse in={raiderHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Pokemon, Nature, Ability, and Item are all visible. If these are not listed, they are not important for the strategy.
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Description of Stat Plots
                </Typography>
                <Typography variant="body2" gutterBottom>
                   Description of Move learn method symbols. Hover over a move option to see BP and more
                </Typography>
                <Typography variant="body2" gutterBottom>
                    What else?
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Raid Boss Builds
                </Typography>
                <CollapseButton open={bossHelpOpen} setOpen={setBossHelpOpen} />
            </Stack>
            <Collapse in={bossHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Similar display to Raiders
                </Typography>
                <Typography variant="body2" gutterBottom>
                    HP multiplier
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Extra moves / special boss actions
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Move Order
                </Typography>
                <CollapseButton open={moveHelpOpen} setOpen={setMoveHelpOpen} />
            </Stack>
            <Collapse in={moveHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Format: pokemon / move / target
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Raid Boss move is hidden in pretty mode
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Grouping by number / colors
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Calc Results
                </Typography>
                <CollapseButton open={calcHelpOpen} setOpen={setCalcHelpOpen} />
            </Stack>
            <Collapse in={calcHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Damage calculator overview
                </Typography>
                <Typography variant="body2" gutterBottom>
                    See stat changes, damage ranges, ability activation etc
                </Typography>
            </Collapse>
        </Box>
    </Box>
)
}

function UIHelpSection({}: {}) {
    const [goalsHelpOpen, setGoalsHelpOpen] = useState(false);
    const [raiderHelpOpen, setRaiderHelpOpen] = useState(false);
    const [bossHelpOpen, setBossHelpOpen] = useState(false);
    const [moveHelpOpen, setMoveHelpOpen] = useState(false);
    const [calcHelpOpen, setCalcHelpOpen] = useState(false);

    return (
    <Box>
        <Typography variant="body2" gutterBottom>
            Strategies can be created or modified when "Edit Mode" is enabled. Toggle between Edit Mode and Pretty Mode by clicking the button in the top right corner of the page.
        </Typography>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Strategy Goals
                </Typography>
                <CollapseButton open={goalsHelpOpen} setOpen={setGoalsHelpOpen} />
            </Stack>
            <Collapse in={goalsHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Common goals are a OHKO in the first two turns
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Be mindful of raider KOs, proc'ing the shield
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Ease of coordination/accessibility
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Success chance, accuracy, status effects, etc
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Raider Builds
                </Typography>
                <CollapseButton open={raiderHelpOpen} setOpen={setRaiderHelpOpen} />
            </Stack>
            <Collapse in={raiderHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Pokemon, Nature, Ability, and Item are all Autocomplete/Dropdowns. Hover over a Pokemon option to see base stats
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Edit EVs/IVs with the button, which pulls up sliders/inputs
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Description of Move learn method symbols. Hover over a move option to see BP and more
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Import/Export
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Raid Boss Builds
                </Typography>
                <CollapseButton open={bossHelpOpen} setOpen={setBossHelpOpen} />
            </Stack>
            <Collapse in={bossHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Similar ui to Raiders
                </Typography>
                <Typography variant="body2" gutterBottom>
                    HP multiplier
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Extra moves / special boss actions
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Load Raid Boss sets from top right field
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Move Order
                </Typography>
                <CollapseButton open={moveHelpOpen} setOpen={setMoveHelpOpen} />
            </Stack>
            <Collapse in={moveHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    pokemon / move / target selection
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Raid boss move (always targets user)
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Reordering with Drag/Drop
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Grouping via Drag/Combine
                </Typography>
            </Collapse>
        </Box>
        <Box sx={{ paddingLeft: 2, my: 1  }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Calc Results
                </Typography>
                <CollapseButton open={calcHelpOpen} setOpen={setCalcHelpOpen} />
            </Stack>
            <Collapse in={calcHelpOpen} >
                <Typography variant="body2" gutterBottom>
                    Damage calculator overview
                </Typography>
                <Typography variant="body2" gutterBottom>
                    See stat changes, damage ranges, ability activation etc as you edit moves/builds/order
                </Typography>
            </Collapse>
        </Box>
    </Box>
)
}

export default HelpSection;