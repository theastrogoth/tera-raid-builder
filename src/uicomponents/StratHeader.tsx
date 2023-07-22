import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { RaidBattleInfo } from "../raidcalc/interface";


function StratHeader({info, setInfo, prettyMode}: {info: RaidBattleInfo, setInfo: (r: RaidBattleInfo) => void, prettyMode: boolean}) {
    const [title, setTitle] = useState(info.name);

    useEffect(() => {
        if (info.name !== title) {
            setTitle(info.name);
        }
    }, [info.name])

  return (
    <Box justifyContent="center">
      {prettyMode &&
        <Typography variant="h4" sx={{ textAlign: "center", my: 1 }}>
          {info.name}
        </Typography>
      }
      {!prettyMode &&
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
      }
    </Box>
  )
}

export default StratHeader;