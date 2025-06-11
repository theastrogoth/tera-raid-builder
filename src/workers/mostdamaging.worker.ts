import { RaidTurn, RaidTurnResult } from "../raidcalc/RaidTurn";
import { MoveData } from "../raidcalc/interface";
import { RaidTurnInfo } from "../raidcalc/interface";
import { raidStateFromData } from "../raidcalc/RaidState";
import { MoveName } from "../calc/data/interface";
import { RaidBattleResults } from "../raidcalc/RaidBattle";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<{results: RaidBattleResults, displayedTurn: number, allMoves: Map<MoveName,MoveData>}>) => {
    
    const prevTurnIdx = Math.min(event.data.results.turnResults.length, event.data.displayedTurn) - 2;
    const prevTurnState = raidStateFromData(
        (event.data.displayedTurn <= 1) ? event.data.results.turnZeroState : 
        (event.data.displayedTurn > event.data.results.turnResults.length) ? event.data.results.endState :
        event.data.results.turnResults[prevTurnIdx].state
    );
    const movesData = prevTurnState.raiders[0].moves.map(m => event.data.allMoves.get(m)!);
    const currentTurn = event.data.results.turnResults[Math.max(0, prevTurnIdx+1)];
    const mostDamagingResults: {target: string, move: string, damage: string, desc:string}[] = [];
    for (const target of [1,2,3,4]) {
        let maxdmg = -Infinity;
        let maxdmgmove = "";
        let maxdesc = "";
        const moveResults: RaidTurnResult[] = [];
        for (const move of movesData) {
            const info: RaidTurnInfo = {
                id: currentTurn.id,
                group: currentTurn.group || -1,
                moveInfo: {...currentTurn.moveInfo, userID: target, moveData: {name: "Splash" as MoveName}},
                bossMoveInfo: {...currentTurn.bossMoveInfo, moveData: move, targetID: target},
            }
            const res = new RaidTurn(prevTurnState, info, currentTurn.id).result();
            const resdmg = res.results[res.raiderMovesFirst ? 1 : 0].damage[target];
            moveResults.push(res);
            if (resdmg > maxdmg) {
                maxdmg = resdmg
                maxdmgmove = move.name;
                maxdesc = res.results[res.raiderMovesFirst ? 1 : 0].desc[target];
            }
        }
        const dmgrange = (maxdesc.match(/\((.{0,20})%\)/) || [""])[0];
        mostDamagingResults.push(
            {
                target: prevTurnState.raiders[target].name,
                move: maxdmgmove,
                damage: dmgrange,
                desc: maxdesc,
            }
        )
    }
    self.postMessage(JSON.parse(JSON.stringify(mostDamagingResults)));
}