import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { RaidBattleInfo } from "../raidcalc/interface";


function StratHeader({info, setInfo, prettyMode}: {info: RaidBattleInfo, setInfo: (r: RaidBattleInfo) => void, prettyMode: boolean}) {
    const [title, setTitle] = useState(info.name);
    const [description, setDescription] = useState(info.description);

    useEffect(() => {
        if (info.name !== title) {
            setTitle(info.name);
        }
    }, [info.name])

    useEffect(() => {
      if (info.description !== description) {
          setTitle(info.description);
      }
  }, [info.description])

  return (
    <Box justifyContent="center">
      {prettyMode &&
        <Stack>
          <Typography variant="h4" sx={{ textAlign: "center", my: 1 }}>
            {info.name}
          </Typography>
          <Typography variant="body1" sx={{ textAlign: "left" }}>
            {info.description}
          </Typography>
        </Stack>

      }
      {!prettyMode &&
        <Stack>
          <TextField 
            variant="standard"
            placeholder="Give your strategy a name!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => setInfo({...info, name: e.target.value})}
            inputProps={{
              style: {fontSize: 24, fontWeight: "bold", textAlign: "center"},
            }}
            sx={{ width: "100%" }}
          />
          <TextField
            multiline={true}
            minRows={1}
            maxRows={4}
            placeholder="Enter a description of your strategy here."
            inputProps={{ 
              spellCheck: 'false',
            }}
            sx={{
                alignSelf: "center",
                width:  "100%",		
                my: 1
              }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={(e) => setInfo({...info, description: e.target.value})}
          />
        </Stack>
      }
    </Box>
  )
}

export default StratHeader;