import { RaidBattle, RaidBattleInfo, RaidBattleResults } from "../raidcalc/RaidBattle";
import { MoveData, RaidTurnInfo, TurnGroupInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";
import { Raider } from "../raidcalc/Raider";
import { Field, Pokemon, Generations } from "../calc";
import { MoveName } from "../calc/data/interface";

declare var self: DedicatedWorkerGlobalScope;
export {};

const gen = Generations.get(9);

function expandCombinations(combos: number[][], moves: number[]): number[][] {
    if (combos.length == 0) {
        return moves.map((m) => [m]);
    } else {
        return combos.map((c) => moves.map((m) => [...c].concat(m))).flat();
    }
}

function getCombinations(moves: number[], numBranches: number): number[][] {
    let combos: number[][] = [];
    for (let i = 0; i < numBranches; i++) {
        combos = expandCombinations(combos, moves);
    }
    return combos;
}

function resultObjective(result: RaidBattleResults): number {
    const bossKO = result.endState.raiders[0].originalCurHP <= 0;
    const raiderKOs = result.endState.raiders.slice(1).reduce((acc, r) => acc + r.timesFainted, 0);
    const raiderHP = result.endState.raiders.slice(1).reduce((acc, r) => acc + r.originalCurHP, 0);
    return ( bossKO ? 0 : 1000000 ) + raiderKOs * 1000 - raiderHP;
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

    const optimalMoves = event.data.groups.map((g) => g.turns.map((t) => t.bossMoveInfo.moveData.name === "(Optimal Move)")).flat();
    const numBranches = optimalMoves.filter((m) => m).length;

    if (numBranches > 0) {
        const selectableMoves = raiders[0].moveData.filter((m) => 
            m.name !== "(No Move)" && (m.moveCategory === "Status" || (
                m.priority ||
                (m.flinchChance || 0) > 0 || 
                ((Math.abs(m.drain || 0)) > 0) || 
                ((m.healing || 0) > 0) ||
                m.statChanges ||
                m.ailment ||
                ((m.maxHits || 0) > 1)
            ))
        );
        if (selectableMoves.length < 4) {
            selectableMoves.push({name: "(Most Damaging)" as MoveName})
        }
        const combos = getCombinations(Array.from(Array(selectableMoves.length).keys()), numBranches);

        const results: RaidBattleResults[] = [];
        const resultScores: number[] = [];
        for (let combo of combos) {
            const groups: TurnGroupInfo[] = [];
            let branchIndex = 0;
            for (let i = 0; i < event.data.groups.length; i++) {
                const ts = event.data.groups[i].turns;
                const turns: RaidTurnInfo[] = [];
                for (let j = 0; j < ts.length; j++) {
                    const t = ts[j];
                    if (t.bossMoveInfo.moveData.name === "(Optimal Move)") {
                        turns.push({
                            id: t.id,
                            group: t.group,
                            moveInfo: t.moveInfo,
                            bossMoveInfo: {
                                moveData: selectableMoves[combo[branchIndex]],
                                targetID: t.bossMoveInfo.targetID,
                                userID: t.bossMoveInfo.userID,
                                options: t.bossMoveInfo.options,
                            },
                        })
                        branchIndex++;
                    } else {
                        turns.push(t);
                    }
                }
                groups.push({
                    id: event.data.groups[i].id,
                    turns: turns,
                })
            }
            const state = new RaidState(raiders);
            const info: RaidBattleInfo = {
                startingState: state,
                groups: groups,
            }
        
            const battle = new RaidBattle(info);
            const result = battle.result();
            const score = resultObjective(result);
            results.push(result);
            resultScores.push(score);
        }
        const bestIndex = resultScores.indexOf(Math.max(...resultScores));
        self.postMessage(results[bestIndex]);    
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
}