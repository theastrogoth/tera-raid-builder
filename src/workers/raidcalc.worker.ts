import { RaidBattle, RaidBattleInfo, RaidBattleResults } from "../raidcalc/RaidBattle";
import { MoveData, RaidTurnInfo, TurnGroupInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";
import { Raider } from "../raidcalc/Raider";
import { Field, Pokemon, Generations } from "../calc";
import { MoveName } from "../calc/data/interface";
import { RaidTurn, RaidTurnResult } from "../raidcalc/RaidTurn";
import { arraysEqual } from "../utils";

declare var self: DedicatedWorkerGlobalScope;
export {};

const gen = Generations.get(9);

// function expandCombinations(combos: number[][], moves: number[]): number[][] {
//     if (combos.length == 0) {
//         return moves.map((m) => [m]);
//     } else {
//         return combos.map((c) => moves.map((m) => [...c].concat(m))).flat();
//     }
// }

// function getCombinations(moves: number[], numBranches: number): number[][] {
//     let combos: number[][] = [];
//     for (let i = 0; i < numBranches; i++) {
//         combos = expandCombinations(combos, moves);
//     }
//     return combos;
// }

function expandRepeats(groups: TurnGroupInfo[]) {
    const newGroups: TurnGroupInfo[] = [];
    for (let g of groups) {
        for (let i=0; i<(g.repeats || 1); i++) {
            newGroups.push(g);
        }
    }
    return newGroups;
}

function splitGroups(groups: TurnGroupInfo[]): TurnGroupInfo[][] {
    const groupsChunks: TurnGroupInfo[][] = [];
    let currentChunk: TurnGroupInfo[] = [];
    for (let i = 0; i < groups.length; i++) {
        let g = groups[i];
        if (g.turns.some((t) => t.bossMoveInfo.moveData.name === "(Optimal Move)")) {
            let partialGroup: TurnGroupInfo = {
                id: g.id,
                turns: [],
                repeats: g.repeats,
            }
            for (let j = 0; j < g.turns.length; j++) {
                const t = g.turns[j]
                partialGroup.turns.push(t);
                if (
                    (t.bossMoveInfo.moveData.name === "(Optimal Move)") ||
                    (i === groups.length-1 && j === g.turns.length-1)
                ) {
                    currentChunk.push(partialGroup);
                    groupsChunks.push(currentChunk);
                    partialGroup = {
                        id: g.id,
                        turns: [],
                        repeats: g.repeats,
                    }
                    currentChunk = [];
                } else if (i === groups.length-1 && j === g.turns.length-1) {

                }
            }
        } else {
            currentChunk.push(g);
            if (i === groups.length-1) {
                groupsChunks.push(currentChunk);
            }
        }
    }
    return groupsChunks;
}

function nonHPChanges(caseA: Raider, caseB: Raider): boolean {
    const boostsAreEqual = (
        caseA.boosts.atk === caseB.boosts.atk &&
        caseA.boosts.def === caseB.boosts.def &&
        caseA.boosts.spa === caseB.boosts.spa &&
        caseA.boosts.spd === caseB.boosts.spd &&
        caseA.boosts.spe === caseB.boosts.spe &&
        caseA.boosts.acc === caseB.boosts.acc &&
        caseA.boosts.eva === caseB.boosts.eva
    );
    return (
        !boostsAreEqual ||
        caseA.item !== caseB.item ||
        caseA.status !== caseB.status ||
        caseA.ability !== caseB.ability ||
        caseA.abilityOn !== caseB.abilityOn ||
        caseA.isTera !== caseB.isTera ||
        caseA.isQP !== caseB.isQP ||
        caseA.isPumped !== caseB.isPumped ||
        caseA.isMicle !== caseB.isMicle ||
        caseA.randomBoosts !== caseB.randomBoosts ||
        caseA.timesFainted !== caseB.timesFainted ||
        caseA.isTaunt !== caseB.isTaunt ||
        caseA.isEndure !== caseB.isEndure ||
        caseA.isYawn !== caseB.isYawn ||
        caseA.isFrozen !== caseB.isFrozen ||
        caseA.isChoiceLocked !== caseB.isChoiceLocked ||
        caseA.isEncore !== caseB.isEncore ||
        caseA.isTorment !== caseB.isTorment ||
        caseA.isDisable !== caseB.isDisable ||
        caseA.isIngrain !== caseB.isIngrain ||
        caseA.abilityNullified !== caseB.abilityNullified ||
        caseA.field.terrain !== caseB.field.terrain ||
        caseA.field.weather !== caseB.field.weather ||
        caseA.field.attackerSide.isAuroraVeil !== caseB.field.attackerSide.isAuroraVeil ||
        caseA.field.attackerSide.isReflect !== caseB.field.attackerSide.isReflect ||
        caseA.field.attackerSide.isLightScreen !== caseB.field.attackerSide.isLightScreen ||
        caseA.field.attackerSide.isSafeguard !== caseB.field.attackerSide.isSafeguard ||
        caseA.field.attackerSide.isMist !== caseB.field.attackerSide.isMist ||
        caseA.field.attackerSide.isTailwind !== caseB.field.attackerSide.isTailwind ||
        caseA.field.attackerSide.isSeeded !== caseB.field.attackerSide.isSeeded
    );
}

function moveIsInteresting(noMoveResult: RaidTurnResult, moveResult: RaidTurnResult): boolean {
    const targetID = moveResult.bossMoveInfo.targetID;
    const noMoveTarget = noMoveResult.state.raiders[targetID];
    const moveTarget = moveResult.state.raiders[targetID];
    const noMoveBoss = noMoveResult.state.raiders[0];
    const moveBoss = moveResult.state.raiders[0];

    const orderChange = noMoveResult.raiderMovesFirst !== moveResult.raiderMovesFirst;
    
    return (
        orderChange || 
        nonHPChanges(noMoveTarget, moveTarget) ||
        nonHPChanges(noMoveBoss, moveBoss)
    );
}

function pickInterestingMoves(state: RaidState, turn: RaidTurnInfo, turnNumber: number, moveData: MoveData[]): RaidTurnResult[] {
    const noMoveResult = new RaidTurn(
        state,
        {
            ...turn,
            bossMoveInfo: {
                ...turn.bossMoveInfo,
                moveData: {name: "(No Move)" as MoveName}
            }
        },
        turnNumber
    ).result();

    const turnResults: RaidTurnResult[] = [];
    let mostDamage = 0;
    let mostDamagingMoveIdx: number = -1;
    for (let i=0; i<moveData.length; i++) {
        const m = moveData[i];
        const turnInfo: RaidTurnInfo = {
            ...turn,
            bossMoveInfo: {
                ...turn.bossMoveInfo,
                moveData: m,
            }
        }
        const result = new RaidTurn(state, turnInfo, turnNumber).result();
        const targetID = turn.moveInfo.userID;
        const damage = state.raiders[targetID].originalCurHP - result.state.raiders[targetID].originalCurHP;
        if (damage > mostDamage) {
            mostDamage = damage;
            mostDamagingMoveIdx = i;
        }
        turnResults.push(result);
    }
    const interestingMoveResults = turnResults.filter(t => moveIsInteresting(noMoveResult, t));
    if (mostDamagingMoveIdx >= 0 && !interestingMoveResults.some((r) => r.bossMoveInfo.moveData.name === moveData[mostDamagingMoveIdx].name)) {
        interestingMoveResults.push(turnResults[mostDamagingMoveIdx]);
    }
    return interestingMoveResults;
}

function splitBranch(info: RaidBattleInfo, prevResults: RaidBattleResults, moveData: MoveData[]): RaidBattleResults[] {
    let penultimateResult = prevResults;
    if (info.groups.reduce((acc, g) => acc + g.turns.length, 0) > 1) {
        const pGroups = info.groups.slice(0,-1);
        const lastGroup = {...pGroups[pGroups.length-1]};
        lastGroup.turns = lastGroup.turns.slice(0,-1);
        penultimateResult = new RaidBattle({...info, groups: info.groups.slice(0,-1)}, prevResults).result();
    }

    const lastGroup = info.groups[info.groups.length-1];
    const lastMove = lastGroup.turns[lastGroup.turns.length-1];
    const branchTurnResults = pickInterestingMoves(
        penultimateResult.endState, 
        lastMove, 
        info.groups.reduce((acc, g) => acc + g.turns.length, 0), 
        moveData
    );

    const branchResults = branchTurnResults.map((t) => {
        const res: RaidBattleResults = {
            endState: t.state,
            turnResults: [...prevResults.turnResults, t],
            turnZeroFlags: prevResults.turnZeroFlags,
            turnZeroOrder: prevResults.turnZeroOrder,
            turnZeroState: prevResults.turnZeroState,
        }
        return res;
    });
    return branchResults;
}

function calculateBranches(branchChunks: TurnGroupInfo[][], prevResults: RaidBattleResults[], moveData: MoveData[]): RaidBattleResults[] {
    if (branchChunks.length === 0 ||
        (branchChunks.reduce((acc, c) => acc + c.reduce((acc2, g) => acc2 + g.turns.length, 0), 0) === 0)
    ) {
        return prevResults;
    }
    if (branchChunks.length === 1) {
        const lastGroup = branchChunks[0][branchChunks[0].length-1];
        const lastTurn = lastGroup.turns[lastGroup.turns.length-1];
        if (lastTurn.bossMoveInfo.moveData.name !== "(Optimal Move)") {
            return prevResults.map((pr) => {
                const info: RaidBattleInfo = {
                    startingState: pr.endState,
                    groups: branchChunks[0]
                };
                return new RaidBattle(info, pr).result();
            });
        }
    }
    const branchResults = prevResults.map((pr, i) => {
        const branchInfo: RaidBattleInfo = {
            startingState: pr.endState,
            groups: branchChunks[0]
        }
        const nextResults = splitBranch(branchInfo, pr, moveData);
        return calculateBranches(branchChunks.slice(1), nextResults, moveData);
    }).flat();
    return branchResults;
}

function resultObjective(result: RaidBattleResults): number {
    const bossKO = result.endState.raiders[0].originalCurHP <= 0;
    const raiderKOs = result.endState.raiders.slice(1).reduce((acc, r) => acc + r.timesFainted, 0);
    const raiderHP = result.endState.raiders.slice(1).reduce((acc, r) => acc + r.originalCurHP, 0);
    return ( bossKO ? 0 : 1000000 ) + raiderKOs * 10000 - raiderHP;
}

self.onmessage = (event: MessageEvent<{raiders: Raider[], groups: TurnGroupInfo[]}>) => {
    const raidersMessage = event.data.raiders;
    const raiders = raidersMessage.map((r) => new Raider(r.id, r.role, r.shiny, false, new Field(), new Pokemon(gen, r.name, {
        level: r.level,
        gender: r.gender,
        bossMultiplier: r.bossMultiplier,
        ability: r.ability,
        nature: r.nature,
        evs: r.evs,
        ivs: r.ivs,
        item: r.item,
        teraType: r.teraType,
        moves: r.moves,
        shieldData: r.shieldData,
    }), r.moveData, r.extraMoves, r.extraMoveData))

    raiders[0].isTera = true; // ensure the boss is Tera'd on T0
    for (let i = 0; i < raiders.length; i++) {
        raiders[i].field.gameType = 'Doubles'; // affects Reflect/Light Screen/Aurora Veil 
    }

    const numBranches = (event.data.groups.map((g) => g.turns.map((t) => t.bossMoveInfo.moveData.name === "(Optimal Move)" ? 1 : 0)).flat() as number[]).reduce((acc, v) => acc + v, 0);

    if (numBranches > 0) {
        const startingState = new RaidState(raiders);
        const startingInfo: RaidBattleInfo = {
            startingState: startingState,
            groups: [],
        }
        const startingResult = new RaidBattle(startingInfo).result();

        const groups = expandRepeats(event.data.groups).filter((g) => g.turns.length > 0);
        const branchChunks = splitGroups(groups);

        const branchResults = calculateBranches(branchChunks, [startingResult], raiders[0].moveData);
        const branchScores = branchResults.map((r) => resultObjective(r));
        const bestResult = branchResults[branchScores.indexOf(Math.max(...branchScores))];
        self.postMessage(bestResult);

    } else {
        const state = new RaidState(raiders);
            const info: RaidBattleInfo = {
                startingState: state,
                groups: event.data.groups,
            }
        
            const battle = new RaidBattle(info);
            const result = battle.result();
            self.postMessage(result);
    }

    
    // if (numBranches > 0) {
    //     const selectableMoves = raiders[0].moveData.filter((m) => 
    //         m.name !== "(No Move)" && (m.moveCategory === "Status" || (
    //             m.priority ||
    //             (m.flinchChance || 0) > 0 || 
    //             ((Math.abs(m.drain || 0)) > 0) || 
    //             ((m.healing || 0) > 0) ||
    //             m.statChanges ||
    //             m.ailment ||
    //             ((m.maxHits || 0) > 1)
    //         ))
    //     );
    //     if (selectableMoves.length < 4) {
    //         selectableMoves.push({name: "(Most Damaging)" as MoveName})
    //     }
    //     const combos = getCombinations(Array.from(Array(selectableMoves.length).keys()), numBranches);

    //     let bestResult: RaidBattleResults | null = null;
    //     let bestScore: number = -Infinity;
    //     const currentPath: number[] = [];
    //     const resultPath: RaidBattleResults[] = [];
    //     for (let combo of combos) {
    //         const groups: TurnGroupInfo[] = [];
    //         let branchIndex = 0;
    //         for (let i = 0; i < event.data.groups.length; i++) {
    //             const ts = event.data.groups[i].turns;
    //             const turns: RaidTurnInfo[] = [];
    //             for (let j = 0; j < ts.length; j++) {
    //                 const t = ts[j];
    //                 if (t.bossMoveInfo.moveData.name === "(Optimal Move)") {
    //                     turns.push({
    //                         id: t.id,
    //                         group: t.group,
    //                         moveInfo: t.moveInfo,
    //                         bossMoveInfo: {
    //                             moveData: selectableMoves[combo[branchIndex]],
    //                             targetID: t.bossMoveInfo.targetID,
    //                             userID: t.bossMoveInfo.userID,
    //                             options: t.bossMoveInfo.options,
    //                         },
    //                     })
    //                     branchIndex++;
    //                 } else {
    //                     turns.push(t);
    //                 }
    //             }
    //             groups.push({
    //                 id: event.data.groups[i].id,
    //                 turns: turns,
    //             })
    //         }
    //         const state = new RaidState(raiders);
    //         const info: RaidBattleInfo = {
    //             startingState: state,
    //             groups: groups,
    //         }
        
    //         const battle = new RaidBattle(info);
    //         const result = battle.result();
    //         const score = resultObjective(result);
    //         if (score > bestScore) {
    //             bestResult = result;
    //             bestScore = score;
    //         }
    //     }
    //     self.postMessage(bestResult);    
    // } else {
    //     const state = new RaidState(raiders);
    //         const info: RaidBattleInfo = {
    //             startingState: state,
    //             groups: event.data.groups,
    //         }
        
    //         const battle = new RaidBattle(info);
    //         const result = battle.result();
    //         self.postMessage(result);
    // }
}