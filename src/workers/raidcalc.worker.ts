import { RaidBattle } from "../raidcalc/RaidBattle";
import { RaidBattleInfo, RaidTurnInfo, Raider } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/interface";
import { Field, Pokemon, Generations } from "../calc";

declare var self: DedicatedWorkerGlobalScope;
export {};

const gen = Generations.get(9);

self.onmessage = (event: MessageEvent<{raiders: Raider[], turns: RaidTurnInfo[]}>) => {
    console.log(event.data)
    const raidersMessage = event.data.raiders;
    const raiders = raidersMessage.map((r) => new Raider(r.id, r.role, new Pokemon(gen, r.name, {
        level: r.level,
        bossMultiplier: r.bossMultiplier,
        ability: r.ability,
        nature: r.nature,
        evs: r.evs,
        ivs: r.ivs,
        item: r.item,
        teraType: r.teraType,
        moves: r.moves,
    }), r.extraMoves))

    const fields = raiders.map((r) => new Field());

    const state = new RaidState(raiders, fields);
    const info: RaidBattleInfo = {
        startingState: state,
        turns: event.data.turns,
        groups: []
    }

    const battle = new RaidBattle(info);
    const result = battle.result();
    self.postMessage(result);    
}