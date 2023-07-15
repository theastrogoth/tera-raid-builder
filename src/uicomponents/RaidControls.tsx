import React, { useEffect, useState } from 'react';

import MoveSelection from "./MoveSelection";
import { Raider, RaidBattleInfo } from "../raidcalc/interface";
import { Field } from "../calc";
import { MoveName } from '../calc/data/interface';

function RaidControls({raiders}: {raiders: Raider[]}) {
    const [info, setInfo] = useState<RaidBattleInfo>({
        startingState: {
            raiders: raiders,
            fields: raiders.map((raider) => new Field()),
        },
        turns: [0,1,2,3].map((id) => ({
            id: id, 
            moveInfo: {userID: id+1, targetID: 0, moveData: {name: "(No Move)" as MoveName}}, 
            bossMoveInfo: {userID: 0, targetID: id+1, moveData: {name: "(No Move)" as MoveName}},
        })),
    })

    useEffect(() => {
        setInfo({...info, startingState: {...info.startingState, raiders: raiders}})
    }, [raiders])

    console.log(info)

    return (
        <>
            <MoveSelection info={info} setInfo={setInfo} />
        </>
    )
}

export default RaidControls;