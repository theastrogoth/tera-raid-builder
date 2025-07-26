import { RaidBattle, RaidBattleInfo } from "../raidcalc/RaidBattle";
import { TurnGroupInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";
import { Raider } from "../raidcalc/Raider";
import { Field, Pokemon, Generations } from "../calc";
import { optimizeBossMoves } from "../raidcalc/optmoves";
import { MoveName } from "../calc/data/interface";

declare var self: DedicatedWorkerGlobalScope;
export {};

const gen = Generations.get(9);

self.onmessage = (event: MessageEvent<{raiders: Raider[], groups: TurnGroupInfo[]}>) => {
    const raidersMessage = event.data.raiders;
    const raiders = raidersMessage.map((r) => new Raider(r.id, r.role, r.shiny, r.isAnyLevel, new Field(), new Pokemon(gen, r.name, {
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

    // handle alt UI format for scripted boss moves...
    // ... as well as (Wait) moves from the UI
    for (const g of event.data.groups) {
        for (const t of g.turns) {
            if (t.moveInfo.userID === 0) {
                const tempMoveInfo = t.moveInfo;
                t.moveInfo = t.bossMoveInfo;
                t.bossMoveInfo = tempMoveInfo;
                t.moveInfo.userID = t.bossMoveInfo.targetID;
                t.moveInfo.targetID = t.moveInfo.userID;
            } else if (t.moveInfo.moveData.name === "(Wait)") {
                t.moveInfo.moveData.name = "(No Move)" as MoveName;
            }
        }
    }

    const numBranches = (event.data.groups.map((g) => g.turns.map((t) => t.bossMoveInfo.moveData.name === "(Optimal Move)" ? 1 : 0)).flat() as number[]).reduce((acc, v) => acc + v, 0);
    if (numBranches > 0 && raiders[0].moveData.filter(m => m.name !== "(No Move)").length > 1) {
        self.postMessage(JSON.parse(JSON.stringify(optimizeBossMoves(raiders, event.data.groups))));
    } else {
        const state = new RaidState(raiders);
            const info: RaidBattleInfo = {
                startingState: state,
                groups: event.data.groups,
            }
        
            const battle = new RaidBattle(info);
            const result = battle.result();
            self.postMessage(JSON.parse(JSON.stringify(result)));
    }
}