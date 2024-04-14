import { RaidBattle, RaidBattleInfo, RaidBattleResults } from "../raidcalc/RaidBattle";
import { MoveData, RaidTurnInfo, TurnGroupInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";
import { Raider } from "../raidcalc/Raider";
import { MoveName } from "../calc/data/interface";
import { RaidTurn, RaidTurnResult } from "../raidcalc/RaidTurn";

// expand groups with repeats into multiple groups
function expandRepeats(groups: TurnGroupInfo[]) {
    const newGroups: TurnGroupInfo[] = [];
    for (let g of groups) {
        for (let i=0; i<(g.repeats || 1); i++) {
            newGroups.push(
                {
                    ...g,
                    repeats: 1,
                }
            );
        }
    }
    return newGroups;
}

// break groups into "chunks" at points where "(Optimal Move)" is selected for the boss
function splitGroups(groups: TurnGroupInfo[]): TurnGroupInfo[][] {
    const groupsChunks: TurnGroupInfo[][] = [];
    let currentChunk: TurnGroupInfo[] = [];
    for (let i = 0; i < groups.length; i++) {
        let g = groups[i];
        if (
            i !== groups.length-1 &&
            g.turns.some((t) => t.bossMoveInfo.moveData.name === "(Optimal Move)")
        ) {
            let partialGroup: TurnGroupInfo = {
                id: g.id,
                turns: [],
                repeats: g.repeats,
            }
            for (let j = 0; j < g.turns.length; j++) {
                const t = g.turns[j]
                partialGroup.turns.push(t);
                if (
                    (t.bossMoveInfo.moveData.name === "(Optimal Move)")
                ) {
                    currentChunk.push(partialGroup);
                    groupsChunks.push(currentChunk);
                    partialGroup = {
                        id: g.id,
                        turns: [],
                        repeats: g.repeats,
                    }
                    currentChunk = [];
                } else if (j === g.turns.length-1) {
                    currentChunk.push(partialGroup);
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

// checks for changes in stats and other modifiers between two states for a single raider
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

// checks if a move results in secondary effects or turn order changes
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

// returns the results from boss moves that have secondary effects or cause the most damage.
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
    if (interestingMoveResults.length === 0) { // This probably only happens when the boss faints unavoidably before moving
        interestingMoveResults.push(turnResults[0]);
    }
    return interestingMoveResults;
}

// from a result up to a certain point, split the battle into multiple branches based on different choices for the boss's move
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

// recursively calculate the results of all "interesting" branches of the battle
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

export function optimizeBossMoves(raiders: Raider[], groups: TurnGroupInfo[]) {
    const startingState = new RaidState(raiders);
    const startingInfo: RaidBattleInfo = {
        startingState: startingState,
        groups: [],
    }
    const startingResult = new RaidBattle(startingInfo).result();

    const branchChunks = splitGroups(expandRepeats(groups).filter((g) => g.turns.length > 0));
    const branchResults = calculateBranches(branchChunks, [startingResult], raiders[0].moveData);
    const branchScores = branchResults.map((r) => resultObjective(r));
    console.log("Number of branches for boss move optimization: " + branchResults.length);
    const bestResult = branchResults[branchScores.indexOf(Math.max(...branchScores))];
    return bestResult;
}