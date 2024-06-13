import { Move, Field, Pokemon, Generations, toID } from "../calc";
import { AilmentName, MoveData, Raider, RaidTurnInfo } from "./interface";
import { AbilityName, ItemName, StatIDExceptHP, TypeName } from "../calc/data/interface";
import { getMoveEffectiveness, isGrounded } from "../calc/mechanics/util";
import guaranteedHitMoves from "../data/guaranteed_hit_moves.json";

const gen = Generations.get(9);

export function absoluteFloor(num: number) {
    return num < 0 ? Math.ceil(num) : Math.floor(num);
}

// next time I prepare the move data, I should eliminate the need for translation
export function isStatus(ailment: AilmentName): Boolean {
    return (
        ailment === "par" ||
        ailment === "psn" ||
        ailment === "brn" ||
        ailment === "frz" ||
        ailment === "slp" ||
        ailment === "tox"
    ); 
}

export function hasNoStatus(pokemon: Pokemon) {
    return pokemon.status === "" || pokemon.status === undefined;
}

// See ../calc/mechanics/util.ts for the original
export function isSuperEffective(move: Move, moveType: TypeName, field: Field, attacker: Pokemon, defender: Pokemon) {
    const testmove = new Move(9, move.name);
    testmove.type = moveType;
    if (!testmove.type) {return false; }
    if (defender.hasAbility("Tera Shell") && defender.originalCurHP === defender.maxHP()) { return false; }
    const isGhostRevealed =
    attacker.hasAbility('Scrappy') || attacker.hasAbility("Mind's Eye") || field.defenderSide.isForesight;
    const isRingTarget =
      defender.hasItem('Ring Target') && !defender.hasAbility('Klutz');
    const type1Effectiveness = getMoveEffectiveness(
      gen,
      testmove,
      defender.types[0],
      isGhostRevealed,
      field.isGravity,
      isRingTarget
    );
    const type2Effectiveness = defender.types[1]
      ? getMoveEffectiveness(
        gen,
        testmove,
        defender.types[1],
        isGhostRevealed,
        field.isGravity,
        isRingTarget
      )
      : 1;
    const type3Effectiveness = defender.types[2]
      ? getMoveEffectiveness(
        gen,
        move,
        defender.types[2],
        isGhostRevealed,
        field.isGravity,
        isRingTarget
      ) : 1;
      
    let typeEffectiveness = type1Effectiveness * type2Effectiveness * type3Effectiveness;
  
    if (defender.isTera && defender.teraType) {
      typeEffectiveness = getMoveEffectiveness(
        gen,
        move,
        defender.teraType,
        isGhostRevealed,
        field.isGravity,
        isRingTarget
      );
    }
  
    if (typeEffectiveness === 0 && move.hasType('Ground') &&
      defender.hasItem('Iron Ball') && !defender.hasAbility('Klutz')) {
      typeEffectiveness = 1;
    }
  
    if (typeEffectiveness === 0 && move.named('Thousand Arrows')) {
      typeEffectiveness = 1;
    }
    return typeEffectiveness >= 2;
}

export function pokemonIsGrounded(pokemon: Raider, field: Field) {
    let grounded = isGrounded(pokemon, field);
    if (pokemon.lastMove) { grounded = grounded || pokemon.lastMove.name === "Roost"; }
    // TO DO: Ingrain, Smack Down
    return grounded;
}

export function getBoostCoefficient(pokemon: Pokemon) {
    const hasSimple = pokemon.ability === "Simple";
    const hasContrary = pokemon.ability === "Contrary";
    return hasSimple ? 2 : hasContrary ? -1 : 1;
}

export function safeStatStage(value: number) {
    return Math.max(-6, Math.min(6, value));
}

export function getAccuracy(movedata: MoveData, category: "Physical" | "Special" | "Status", attacker: Raider, defender: Raider, movesSecond: boolean = false, attackerIgnoresAbility: boolean = false): [number, string[]] {
    // returns [accuracy (0-100)]
    
    const movename = movedata.name;
    // Toxic NEVER misses if used by a poison type
    if (movename === "Toxic" && attacker.hasType("Poison")) {
        return [100,[]];
    }
    // semi-invulnerable moves
    if (defender.isCharging && defender.lastMove) {
        if (["Bounce","Fly","Sky Drop"].includes(defender.lastMove.name)) {
            if (["Gust", "Twister"].includes(movename)) {
                return [100,[]];
            } else if (["Hurricane", "Sky Uppercut", "Smack Down", "Thunder", "Thousand Arrows"].includes(movename)) {
                return [100,[]];
            } else {
                return [0,[]];
            }
        } else if (defender.lastMove.name === "Dig") {
            if (["Earthquake", "Magnitude"].includes(movename)) {
                return [100,[]];
            } else if (movename === "Fissure") {
                return [100,[]];
            } else {
                return [0,[]];
            }
        } else if (defender.lastMove.name === "Dive") {
            if (["Surf", "Whirlpool"].includes(movename)) {
                return [100,[]];
            } else {
                return [0,[]];
            }
        }
    }
    // guaranteed hit moves
    if (
        !movedata.accuracy || 
        (attacker.lastMove && attacker.lastMove.name === "Lock-On") ||
        (attacker.field.hasWeather("Rain") && ["Thunder","Hurricane","Sandsear Storm","Bleakwind Storm","Wildbolt Storm"].includes(movename)) ||
        (attacker.field.hasWeather("Snow","Hail") && movename === "Blizzard") ||
        (defender.isMinimize && ["Body Slam","Stomp","Dragon Rush","Heat Crash","Heavy Slam","Flying Press"].includes(movename)) ||
        guaranteedHitMoves.includes(movename)
    ) {
        return [100,[]];
    }

    let baseAccuracy = movedata.accuracy;

    let weatherMod = false;
    // weather modifiers
    if (attacker.field.hasWeather("Sun") && ["Hurricane","Thunder"].includes(movename)) {
        baseAccuracy = 50;
        weatherMod = true;
    }

    const accStage = attacker.boosts.acc || 0;
    const evaStage = attacker.hasAbility("Keen Eye", "Illuminate") ? 0 : (defender.boosts.eva || 0);
    const calcStage = Math.max(-6, Math.min(6, accStage - evaStage));

    const accMod = calcStage >= 0 ? ((calcStage + 3)/3) : (3/(3 - calcStage)); 

    let accuracy = baseAccuracy * accMod;
    let effects: string[] = []
    if (accStage) {
        effects.push('Acc ' + (accStage > 0 ? '+' : '') + accStage);
    }
    if (evaStage) {
        effects.push('Eva ' + (evaStage > 0 ? '+' : '') + evaStage);
    }

    // item modifiers
    if (attacker.hasItem("Wide Lens")) {
        accuracy *= 4505/4096;
        effects.push("Wide Lens");
    } else if (attacker.hasItem("Zoom Lens") && movesSecond && (attacker.id === 0 || defender.id === 0)) {
        accuracy *= 4915/4096;
        effects.push("Zoom Lens");
    }
    if (defender.hasItem("Bright Powder") || defender.hasItem("Lax Incense")) {
        accuracy *= 3686/409;
        effects.push(defender.item!);
    }

    // ability modifiers
    if (attacker.hasAbility("Compound Eyes")) {
        accuracy *= 5325/4096;
        effects.push("Compound Eyes");
    } else if (attacker.hasAbility("Hustle") && category === "Physical") {
        accuracy *= 3277/4096;
        effects.push("Hustle");
    }
    if (!attackerIgnoresAbility) {
        if (defender.hasAbility("Tangled Feet") && defender.volatileStatus.includes("confusion")) {
            accuracy *= 0.5;
            effects.push("Tangled Feet");
        }
    }
    // field modifiers
    if (attacker.field.isGravity) {
        accuracy *= 6840/4096;
        effects.push("Gravity");
    }
    if (!attackerIgnoresAbility && defender.field.hasWeather("Sand") && !defender.field.isCloudNine && defender.hasAbility("Sand Veil")) {
        accuracy *= 3277/4096;
        effects.push("Sand Veil");
    }
    if (!attackerIgnoresAbility && defender.field.hasWeather("Hail", "Snow") && !defender.field.isCloudNine && defender.hasAbility("Snow Cloak")) {
        accuracy *= 3277/4096;
        effects.push("Snow Cloak");
    }

    // Micle Berry
    if (attacker.isMicle) {
        accuracy *= 4915/4096;
        effects.push("Micle Berry");
    }

    if (weatherMod) {
        effects.push("reduced accuracy in Sun")
    }

    return [accuracy, effects];
}

export function getBpModifier(movedata: MoveData, defender: Raider, damaged: boolean = false): number {
    const movename = movedata.name;

    if (defender.isCharging && defender.lastMove) {
        if (["Bounce","Fly","Sky Drop"].includes(defender.lastMove.name) && ["Gust", "Twister"].includes(movename)) {
            return 2;
        } else if (defender.lastMove.name === "Dig" && ["Earthquake", "Magnitude"].includes(movename)) {
            return 2;
        } else if (defender.lastMove.name === "Dive" && ["Surf", "Whirlpool"].includes(movename)) {
            return 2;
        }
    }
    if (damaged) {
        if (["Avalanche", "Revenge"].includes(movename)) {
            return 2;
        }
    }
    return 1;
}

// Speed modifiers

export function modifyPokemonSpeedByStatus(speed: number, status?: string, ability?: AbilityName) {
    return status === "par" && ability !== "Quick Feet" ? speed * .5 : speed;
}

export function modifyPokemonSpeedByItem(speed : number, item?: ItemName) {
    switch(item) {
        case "Choice Scarf":
            return speed * 1.5;
        case "Iron Ball":
        case "Macho Brace":
        case "Power Anklet":
        case "Power Band":
        case "Power Belt":
        case "Power Bracer":
        case "Power Lens":
        case "Power Weight":
            return speed * .5;
        case "Lagging Tail":
        case "Full Incense":
            return 0;
        // TODO: Quick Powder doubles the speed of untransformed Ditto
        default:
            return speed;
    }
}

export function modifyPokemonSpeedByAbility(speed: number, ability?: AbilityName, abilityOn?: boolean, status?: string) {
    switch(ability) {
        case "Unburden":
            return abilityOn ? speed * 2 : speed;
        case "Slow Start":
            return abilityOn ? speed * .5 : speed;
        case "Quick Feet":
            return status ? speed * 1.5 : speed;
        default:
            return speed;
    }
}

export function modifyPokemonSpeedByQP(speed: number, field: Field, ability?: AbilityName, item?: ItemName, qpBoostedStat?: StatIDExceptHP) {
    return qpBoostedStat === "spe" ? speed * 1.5 : speed;
}

export function modifyPokemonSpeedByField(speed: number, field: Field, ability?: AbilityName) {
    if (
        ability === "Chlorophyll" && field.hasWeather("Sun") ||
        ability === "Sand Rush" && field.hasWeather("Sand") ||
        ability === "Slush Rush" && field.hasWeather("Snow") ||
        ability === "Swift Swim" && field.hasWeather("Rain") ||
        ability === "Surge Surfer" && field.hasTerrain("Electric")
    ) {
        speed *= 2;
    }
    if (field.attackerSide.isTailwind) {
        speed *= 2;
    }
    return speed;
}

// no idea if this should go here
export function getGroupedTurnIDs(turns: RaidTurnInfo[]) {
    const displayGroups: number[][] = [];
    let currentGroupIndex = -1;
    let currentGroupID: number | undefined = -1;
    turns.forEach((t, index) => {
        const g = t.group;
        if (g === undefined || g !== currentGroupID) {
            currentGroupIndex += 1;
            displayGroups.push([index]);
        } else {
            displayGroups[currentGroupIndex].push(index);
        }
        currentGroupID = g;
    });
    return displayGroups;
}

export function getGroupedTurns(turns: RaidTurnInfo[]) {
    const groupedTurnIDs = getGroupedTurnIDs(turns);
    const groupedTurns = groupedTurnIDs.map(indicesArray => indicesArray.map(index => turns[index]));
    return groupedTurns;
}

const RAID_ACTIONS = [
    "Attack Cheer",
    "Defense Cheer", 
    "Heal Cheer", 
    "Remove Negative Effects", 
    "Clear Boosts / Abilities",
    "Steal Tera Charge",
    "Activate Shield"
]

export function isRaidAction(movename: string) {
    return RAID_ACTIONS.includes(movename);
}

export function isRegularMove(movename: string) {
    return !isRaidAction(movename) && movename !== "(No Move)" && movename !== "(Most Damaging)" && movename !== "(Optimal Move)";
}

export function getSelectableMoves(pokemon: Raider, isBossAction: boolean = false) {
    let selectableMoves: MoveData[] = [...pokemon.moveData, ...(isBossAction ? pokemon.extraMoveData || [] : [])].filter(m => m.name !== "(No Move)");
    if (!isBossAction) {
        if ((pokemon.isChoiceLocked || pokemon.isEncore) && pokemon.lastMove) {
            selectableMoves = selectableMoves.filter(m => m.name === pokemon.lastMove!.name);
        }
        if (pokemon.lastMove && (pokemon.isTorment || (pokemon.lastMove.name === "Gigaton Hammer" || pokemon.lastMove.name === "Blood Moon"))) {
            selectableMoves = selectableMoves.filter(m => m.name !== pokemon.lastMove!.name);
        }
        if (pokemon.isDisable && pokemon.disabledMove) {
            selectableMoves = selectableMoves.filter(m => m.name !== pokemon.disabledMove);
        }
        if (pokemon.isTaunt) {
            selectableMoves = selectableMoves.filter(m => m.moveCategory !== "Status");
        }
        if (pokemon.isThroatChop) {
            selectableMoves = selectableMoves.filter(m => !(m.isSound))
        }
    }
    return selectableMoves.map(m => m.name);
}

export function getCritChance(move: Move, attacker: Raider, defender: Raider) {
    if (defender.hasAbility("Shell Armor")) { return 0; }
    const data = gen.moves.get(toID(move.name));
    if (data && data.willCrit) { return 1; }
    const critStages = (move.highCritChance ? 1 : 0) + (attacker.isPumped || 0) + (attacker.hasAbility("Super Luck") ? 1 : 0) + (attacker.hasItem("Scope Lens", "Razor Claw") ? 1 : 0);
    switch (critStages) {
        case 0:
            return 1 / 24;
        case 1:
            return 1 / 8;
        case 2:
            return 1 / 2;
        default:
            return 1;
    }
}

export function getRollCounts(rolls: number[][], min: number, max: number, chances: number[] | undefined = undefined) {
    const cumRolls = new Map<number, number>();
    for (let i=0; i<rolls.length; i++) {
        addRollsToCounts(cumRolls, rolls[i], min, max, chances ? chances[i] : undefined);
    }
    return cumRolls;
}

export function addRollsToCounts(cumRolls: Map<number, number>, newRolls: number[], min: number, max: number, chance: number | undefined = undefined) {
    const rollChance = (chance || 1) / newRolls.length;
    const prevCumRolls = new Map<number, number>(cumRolls);
    if (prevCumRolls.size === 0) {
        prevCumRolls.set(0, 1);
    }
    const prevRolls = Array.from(prevCumRolls.keys());
    cumRolls.clear();
    for (let i=0; i<newRolls.length; i++) {
        const roll = newRolls[i];
        for (let j=0; j<prevRolls.length; j++) {
            const prevRoll = prevRolls[j];
            const combinedRoll = Math.max(min, Math.min(max, roll + prevRoll));
            const prevChance = prevCumRolls.get(combinedRoll) || 1;
            const newChance = cumRolls.get(combinedRoll) || 0;
            cumRolls.set(combinedRoll, newChance + prevChance * rollChance);
        }
    }
    // mutates the first argument, but we'll also return it
    return cumRolls;
}

export function combineRollCounts(a: Map<number, number>, b: Map<number, number>, min: number, max: number) {
    const c = new Map<number, number>();
    const aRolls = Array.from(a.keys());
    const bRolls = Array.from(b.keys());
    if (aRolls.length === 0) {
        aRolls.push(0);
    }
    if (bRolls.length === 0) {
        bRolls.push(0);
    }
    for (let i=0; i<aRolls.length; i++) {
        for (let j=0; j<bRolls.length; j++) {
            const combinedRoll = Math.max(min, Math.min(max, aRolls[i] + bRolls[j]));
            const aChance = a.get(aRolls[i]) || 1;
            const bChance = b.get(bRolls[j]) || 1;
            const cChance = c.get(combinedRoll) || 0;
            c.set(combinedRoll, aChance * bChance + cChance);
        }
    }
    return c;
}

export function catRollCounts(a: Map<number, number>, b: Map<number, number>) {
    const c = new Map<number, number>();
    const aRolls = Array.from(a.keys());
    const bRolls = Array.from(b.keys());
    for (let i=0; i<aRolls.length; i++) {
        const aCount = a.get(aRolls[i]) || 0;
        const cCount = c.get(aRolls[i]) || 0;
        c.set(aRolls[i], aCount + cCount);
    }
    for (let i=0; i<bRolls.length; i++) {
        const bCount = b.get(bRolls[i]) || 0;
        const cCount = c.get(bRolls[i]) || 0;
        c.set(bRolls[i], bCount + cCount);
    }
    return c;
}

export function getCumulativeKOChance(rolls: Map<number, number>, hp: number) {
    const numRolls = Array.from(rolls.values()).reduce((a, b) => a + b, 0);
    const koRolls = rolls.get(hp) || 0;
    return parseFloat((koRolls / numRolls * 100).toPrecision(3));
}