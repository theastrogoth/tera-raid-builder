import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
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
    <Stack spacing={0} sx={{ p: 2, minWidth: "575px" }}>
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
                <Typography variant="h6" gutterBottom>
                    Helpful Resources:
                </Typography>
                <Link href="https://www.reddit.com/r/PokemonScarletViolet/comments/12k4rd7/guide_how_to_train_your_pok%C3%A9mon_to_be_ready_for/">
                    <Typography variant="body1">
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
                    <Typography variant="body1" gutterBottom>
                        IVs are a Pokémon's hidden stat values that can only be changed by Hyper Training.
                        A Pokémon has an IV ranging from 0 to 31 for each stat. Higher IVs correspond to higher stat totals.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Hyper Training allows you to change a Pokémon's IVs to 31. 
                        In Pokémon Scarlet & Violet, you can Hyper Train a Pokémon once it reaches level 50 by exchanging Bottle Caps with an NPC in Montenevera.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        While you cannot directly view a Pokémon's IVs in-game, you can get a rough estimate of a Pokémon's IVs by using the Judge feature while viewing a Pokémon in your Boxes.
                        Each IV description corresponds to a range of possible values:
                    </Typography>
                    <Grid container justifyContent="center" alignItems="center" sx={{ p: 2}}>   
                        <Grid item>                   
                        <TableContainer sx={{ paddingBottom: 2, mx: 1}}>
                            <Table size="small" sx={{ width: "275px"}}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><Typography variant="body1" fontWeight="bold">Description</Typography></TableCell>
                                        <TableCell><Typography variant="body1" fontWeight="bold">IV Range</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body1">"Best" or "Hyper trained!"</Typography></TableCell>
                                        <TableCell><Typography variant="body1">31</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body1">"Fantastic"</Typography></TableCell>
                                        <TableCell><Typography variant="body1">30</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body1">"Very Good"</Typography></TableCell>
                                        <TableCell><Typography variant="body1">26-29</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body1">"Pretty Good"</Typography></TableCell>
                                        <TableCell><Typography variant="body1">16-25</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body1">"Decent"</Typography></TableCell>
                                        <TableCell><Typography variant="body1">1-15</Typography></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography variant="body1">"No Good"</Typography></TableCell>
                                        <TableCell><Typography variant="body1">0</Typography></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </Grid>  
                        <Grid item>    
                        <Stack direction="column" spacing={1} alignItems="center" justifyContent="center" sx={{ marginLeft: 4, p: 1 }}>
                            <img 
                                src={process.env.PUBLIC_URL + "/help-assets/hyper_training.png"} 
                                height="250"
                            />
                            <Typography variant="body2">
                                Hyper Training NPC in Montenevera
                            </Typography>
                        </Stack>
                        </Grid>  
                    </Grid>
                    <Typography variant="body1" gutterBottom>
                        Most Tera Raid builds benefit from having all IVs maximized ("Best" or "Hyper trained!"). 
                    </Typography>
                    <br/>
                </Collapse>
            </Box>
            <Box sx={{ paddingLeft: 2, my: 1  }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Effort Values (EVs)
                    </Typography>
                    <CollapseButton open={evHelpOpen} setOpen={setEvHelpOpen} />
                </Stack>
                <Collapse in={evHelpOpen} >
                    <Typography variant="body1" gutterBottom>
                        EVs are points that directly contribute to a Pokémon's stat totals. 
                        They are earned by defeating opponents in battle or consuming vitamins and feathers.
                        EVs can be reduced by consuming certain berries.
                        Each 4 EVs in a stat increase the corresponding stat stat total by 1 point at level 100.
                        A Pokémon can have a maximum of 510 EVs total, and a maximum of 252 EVs in a single stat.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        You can view an in-game chart showing your Pokémon's EVs by navigating to the Pokémon's summary screen and pressing the L button.
                        On this chart, a stat with the maximum number of EVs (252) will show an animated sparkle effect.
                        The chart's color will change from yellow to blue when a Pokémon has 510 EVs total.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Many Tera Raid builds benefit from having two stats with maximum EVs. 
                    </Typography>
                    <Grid container justifyContent="center" alignItems="center">
                        <Grid item>
                            <Stack direction="column" spacing={1} alignItems="center" justifyContent="center" sx={{ p: 1 }}>
                                <img 
                                    src={process.env.PUBLIC_URL + "/help-assets/ev_plot.png"} 
                                    height="250"
                                />
                                <Typography variant="body2">
                                    EV Chart accessible from the Pokémon Summary Screen
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                    <br/>
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
                    <Typography variant="body1" gutterBottom>
                        A Pokémon's nature increases one stat by 10% and decreases another stat by 10%.
                        It is important to make sure your Pokémon's nature complements the kind of role it will fill in a raid.
                        For example, a Pokémon that will be a physical attacker might have the Adamant nature, which increases its Attack stat and decreases its Special Attack stat.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        You can change a Pokémon's nature by giving it a Nature Mint, which can be purchased at any Chansey Supply shop.
                    </Typography>
                    <br/>
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
                    <Typography variant="body1" gutterBottom>
                        Egg moves are moves that a Pokémon can only learn in two ways.
                        The first way is to breed a female Pokémon with a Pokémon of a compatible species that knows the egg move. 
                        Any Pokémon hatched from their eggs will know the egg move.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        The second, easier way is to first make sure that the Pokémon has an empty move slot by making it forget a move,
                        then giving it a Mirror Herb to hold, and finally starting a picnic with the Pokémon as well as another Pokémon of any species that knows the egg move.
                        After a few seconds, you can exit the picnic, and your Pokémon will have learned the egg move.
                    </Typography>
                    <br/>
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
                    <Typography variant="body1" gutterBottom>
                        A Pokémon's ability is a passive effect that can have a variety of effects in battle.
                        Some abilities are more useful than others, so it is often important to make sure your Pokémon has the best ability for its role in a raid.
                        For example, some strategies rely on a Pokémon's ability to activate a weather effect with the Drizzle or Drought abilities.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        In some cases, you can change a Pokémon's ability by giving it an Ability Capsule, which can be purchased at any Chansey Supply shop.
                        However, not all Pokémon have multiple abilities, and some Pokémon have hidden abilities that cannot accessed with an Ability Capsule.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        To obtain a Pokémon with a hidden ability, you can use an Ability Patch on a Pokémon.
                        If you don't have an Ability Patch, there is a small chance to obtain them as loot from 6 start Tera Raids.
                        Also, many Pokémon caught in a 6 star Tera Raid have a chance to have a hidden ability.
                    </Typography>
                    <br/>
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
        <Typography variant="body1" gutterBottom>
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
                <Typography variant="body1" gutterBottom>
                    Raider builds are shown near the top of the page.
                    Each Pokémon's species, ability, nature, level, EVs, IVs, and item are shown.
                    If a Pokémon is missing an item or ability, it is not important to the strategy, and any item or ability can be used.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    If you see an Ability Patch icon next to the Pokémon's ability, it means that the Pokémon's hidden ability is required for the strategy.
                </Typography>   
                <br/>
                <Typography variant="body1" gutterBottom>
                    The required moves for each Pokémon are also listed here. 
                    The icons next to moves indicate the learn method for the move, where discs indicate moves learned via TM and eggs indicate moves learned via breeding or Mirror Herbs.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Additional information for a move, including Base Power and Accuracy, can be viewed by hovering over the move.
                </Typography>
                <br/>
                <Typography variant="body1" gutterBottom>
                    At the bottom of each Pokémon's build, a radar chart shows the Pokémon's stats totals and EVs.
                    You can compare this plot to the in-game chart to make sure your build is correct.
                </Typography>
                <br/>
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
                <Typography variant="body1" gutterBottom>
                    Raid boss details are displayed below the raid team, and they contain similar information to the raiders. 
                </Typography>
                <Typography variant="body1" gutterBottom>
                    In addition to normal build information, Raid Bosses also have an HP multiplier, which increases their total HP by the specified percentage.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Raid Bosses also can have access to extra moves beyond the four in their normal moveset.
                    These are often used as part of special "boss actions" that can occur throughout a raid. 
                </Typography>
                <br/>
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
                <Typography variant="body1" gutterBottom>
                    The moves to be used as part of a strategy are shown in order near the bottom of the page.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    The moves are sorted into groups. In general, moves within a group can be carried out in any order.
                    All moves in a group should be carried out before moving on to the next group.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    For each move, the Pokémon that will use the move, the name of the move itself, and the target of the move are shown.
                    Moves that do not have an applicable target such as Cheers or moves that targets the user will not have a target listed.
                </Typography>
                <br/>
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
                <Typography variant="body1" gutterBottom>
                    The "Calc Results" tab near the bottom of the page shows the results of damage calculations obtained by simulating the strategy.
                    In addition to damage ranges for each move, the results also show stat changes, ability activation, HP remaining after each move.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    These results can be useful for understanding the effect of each move in the strategy.
                </Typography>
                <br/>
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
        <Typography variant="body1" gutterBottom>
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
                <Typography variant="body1" gutterBottom>
                    This calculator is most useful for planning short strategies that only take a few turns to complete.
                    A common goal for a strategy is to defeat a raid boss in one or two turns. 
                    This is often accomplished by using a combination of stat boosts, weather effects, and powerful moves to knock out the Raid Boss in a single hit.
                    This approach has the advantage of preventing the Raid Boss from activating its shield and prolonging the raid.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    When creating a strategy it is important ensure that each Pokémon involved does not faint, since this typically results in activation of the boss' shield.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    It is also a good idea to be mindful of other things that might derail your strategy, such as moves with low accuracy or moves that can cause status effects.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Since you might be preparing strategies for use with other players, it might also be important to make sure that your strategy accessible to other players.
                    Avoiding the use of version-exclusive or transfer-only Pokémon, as well as Pokémon with hidden abilities, can help make your strategy easier to prepare for.
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
                <Typography variant="body1" gutterBottom>
                    A Pokémon's, species, ability, nature, level, item, and moves are selectable via the input fields in each raider's slot.
                    Pokémon types and move types and learn methods are shown as icons in their respective dropdowns.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    To edit a Pokémon's EVs or IVs, click the "Edit EVs/IVs" button near the top of the Pokémon's build controls.
                    EVs and IVs can be changed via text input boxes, and EVs can also be adjusted using sliders. 
                    Your changes will be reflected in the radar chart at the bottom of the Pokémon's build.
                    EVs will automatically be capped at a total of 510. 
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Raider builds can be exported and imported in a format compatible with <Link href="https://pokepast.es">PokePaste</Link> and the <Link href="https://calc.pokemonshowdown.com/">Showdown Damage Calculator</Link> via the "Import/Export" button near the top of a Pokémon's build controls.
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
                <Typography variant="body1" gutterBottom>
                    Most of the Raid Boss information can be set in the same way as the raiders' information.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Preset Raid Boss builds can be loaded by first selecting the desired species of the Raid Boss, and then using the "Load Boss Set" dropdown menu to choose the desired set.
                    Raid Boss sets that can be encountered in-game, either in normal raid dens or through event raids, are available to be loaded.
                    At this time, the extra moves that Raid Bosses can use are not included in the preset builds.
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
                <Typography variant="body1" gutterBottom>
                    In the "Move Order" tab, moves are listed in order of execution from top to bottom.
                    Moves can be added or removed with the "Add Move" or "X" buttons.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Move can be rearranged by clicking and dragging the moves to their desired positions.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    In addition, moves can be organized into groups by dragging one move directly on top of another.
                    Groups are denoted by shared colors and are intended to indicate blocks of moves for which execution order does not matter.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    For each move, the Pokémon that will use the move, the name of the move itself, and the target of the move can be selected via dropdown fields.
                    In addition, the Raid Boss' move for the turn can also be selected. 
                    The Raid Boss' move always targets the user of the above move, when applicable.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    An additional menu is available to the right of each move, which contains controls for setting additional options for the move.
                    These options include setting a move to a Critical Hit, ensuring that a move's secondary effects activate, and using the maximum/minimum roll for a move's damage.
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
                <Typography variant="body1" gutterBottom>
                    Any changes made to move selection and order will be reflected in the "Calc Results" tab.
                    It is a good idea to pay close attention to remaining HP after each move.
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Damage calculations are copied to your clipboard when clicked.
                </Typography>     
                <Typography variant="body1" gutterBottom>
                    Ideally, your strategy should bring the Raid Boss' HP to zero once it has been completed.
                </Typography>
            </Collapse>
        </Box>
    </Box>
)
}

export default HelpSection;