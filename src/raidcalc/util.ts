import { Move, Field, Pokemon, Generations } from "../calc";
import { AilmentName, RaidTurnInfo } from "./interface";
import { Raider } from "./Raider";
import { StatusName, AbilityName, ItemName, StatIDExceptHP } from "../calc/data/interface";
import { getMoveEffectiveness, isGrounded } from "../calc/mechanics/util";
import { RaidTurnResult } from "./RaidTurn";

const gen = Generations.get(9);

// next time I prepare the move data, I should eliminate the need for translation
export function ailmentToStatus(ailment: AilmentName): StatusName | "" {
    if (ailment == "paralysis") { return "par"; }
    if (ailment == "poison") { return "psn"; }
    if (ailment == "burn") { return "brn"; }
    if (ailment == "freeze") { return "frz"; }
    if (ailment == "sleep") { return "slp"; }
    if (ailment == "toxic") { return "tox"; }
    return ""
}

export function hasNoStatus(pokemon: Pokemon) {
    return pokemon.status === "" || pokemon.status === undefined;
}

// See ../calc/mechanics/util.ts for the original
export function isSuperEffective(move: Move, field: Field, attacker: Pokemon, defender: Pokemon) {
    if (!move.type) {return false; }
    const isGhostRevealed =
    attacker.hasAbility('Scrappy') || field.defenderSide.isForesight;
    const isRingTarget =
      defender.hasItem('Ring Target') && !defender.hasAbility('Klutz');
    const type1Effectiveness = getMoveEffectiveness(
      gen,
      move,
      defender.types[0],
      isGhostRevealed,
      field.isGravity,
      isRingTarget
    );
    const type2Effectiveness = defender.types[1]
      ? getMoveEffectiveness(
        gen,
        move,
        defender.types[1],
        isGhostRevealed,
        field.isGravity,
        isRingTarget
      )
      : 1;
    let typeEffectiveness = type1Effectiveness * type2Effectiveness;
  
    if (defender.teraType) {
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
        ability === "Chlorophyll" && field.weather?.includes("Sun") ||
        ability === "Sand Rush" && field.weather?.includes("Sand") ||
        ability === "Slush Rush" && field.weather?.includes("Snow") ||
        ability === "Swift Swim" && field.weather?.includes("Rain") ||
        ability === "Surge Surfer" && field.terrain?.includes("Electric")
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