import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { RaidBattleResults } from "../raidcalc/interface"

function RaidResults({results}: {results: RaidBattleResults}) {
    return (
        <Stack direction="column" spacing={1} sx={{ p: 2 }}>
            {
                results.turnResults.map((turnResult, index) => (
                    <Stack direction="column" spacing={0} key={index}>
                        <Typography variant="h6">Move {index+1}</Typography>
                        {
                            turnResult.results[0].desc.map((desc, index) => (
                                <Typography variant="body2" key={index}>{desc}</Typography>
                            ))
                        }
                        {
                            turnResult.results[1].desc.map((desc, index) => (
                                <Typography variant="body2" key={index}>{desc}</Typography>
                            ))
                        }
                    </Stack>
                ))
            }
        </Stack>
    )
}

export default RaidResults;