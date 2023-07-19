import { RaidBattle } from "../raidcalc/RaidBattle";
import { RaidBattleInfo, Raider } from "../raidcalc/interface";
import { RaidState } from "../raidcalc/interface";
import { Field, Pokemon, Generations } from "../calc";

declare var self: DedicatedWorkerGlobalScope;
export {};

const gen = Generations.get(9);

self.onmessage = (event: MessageEvent<{info: RaidBattleInfo}>) => {
    const raidersMessage = event.data.info.startingState.raiders;
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

    const fieldsMessage = event.data.info.startingState.fields;
    const fields = fieldsMessage.map((f) => new Field({...f}));

    const state = new RaidState(raiders, fields);
    const info: RaidBattleInfo = {
        startingState: state,
        turns: event.data.info.turns,
    }

    const battle = new RaidBattle(info);
    const result = battle.result();
    self.postMessage(result);    
}