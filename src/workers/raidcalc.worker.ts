import { RaidBattle, RaidBattleInfo } from "../raidcalc/RaidBattle";
import { RaidTurnInfo } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/RaidState";
import { Raider } from "../raidcalc/Raider";
import { Field, Pokemon, Generations } from "../calc";

declare var self: DedicatedWorkerGlobalScope;
export {};

const gen = Generations.get(9);

self.onmessage = (event: MessageEvent<{raiders: Raider[], turns: RaidTurnInfo[]}>) => {
    const raidersMessage = event.data.raiders;
    const raiders = raidersMessage.map((r) => new Raider(r.id, r.role, r.shiny, new Field(), new Pokemon(gen, r.name, {
        level: r.level,
        bossMultiplier: r.bossMultiplier,
        ability: r.ability,
        nature: r.nature,
        evs: r.evs,
        ivs: r.ivs,
        item: r.item,
        teraType: r.teraType,
        moves: r.moves,
    }), r.moveData, r.extraMoves, r.extraMoveData))

    const state = new RaidState(raiders);
    const info: RaidBattleInfo = {
        startingState: state,
        turns: event.data.turns,
        groups: []
    }

    const battle = new RaidBattle(info);
    const result = battle.result();
    self.postMessage(result);    
}