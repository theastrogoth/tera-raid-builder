import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';


function StratHeader({title, setTitle, prettyMode}: {title: string, setTitle: (t: string) => void, prettyMode: boolean}) {
    const [fieldTitle, setFieldTitle] = useState(title);

    useEffect(() => {
        if (title !== fieldTitle) {
            setFieldTitle(title);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title])

  return (
    <Box justifyContent="center">
      {prettyMode &&
        <Typography variant="h4" fontWeight="bold" sx={{ textAlign: "center", my: 1 }}>
          {title}
        </Typography>
      }
      {!prettyMode &&
        <TextField 
          variant="standard"
          placeholder="Give your strategy a name!"
          value={fieldTitle}
          onChange={(e) => setFieldTitle(e.target.value)}
          onBlur={(e) => setTitle(e.target.value)}
          inputProps={{
            style: {fontSize: 24, fontWeight: "bold", textAlign: "center"},
          }}
          sx={{ width: "100%" }}
        />
      }
    </Box>
  )
}

export default React.memo(StratHeader);