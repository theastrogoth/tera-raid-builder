import { RaidBattle, RaidBattleInfo, RaidBattleResults } from "../raidcalc/RaidBattle";
import { MoveData, TurnGroupInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";
import { Raider } from "../raidcalc/Raider";
import { Field, Pokemon, Generations } from "../calc";

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

// function resultObjective(result: RaidBattleResults): number {
//     const bossKO = result.endState.raiders[0].originalCurHP <= 0;
//     const result.endState.raiders.reduce((acc, r) => acc + r.);
//     return result.endState.raiders[0].originalCurHP + result.endState.raiders.reduce((acc, r) => acc + r.originalCurHP, 0);
// }

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

    const selectableMoves = raiders[0].moveData.filter((m) => m.name !== "(No Move)");
    const combos = getCombinations(Array.from(Array(selectableMoves.length).keys()), numBranches);

    const state = new RaidState(raiders);
    const info: RaidBattleInfo = {
        startingState: state,
        groups: event.data.groups,
    }

    const battle = new RaidBattle(info);
    const result = battle.result();
    self.postMessage(result);    
}