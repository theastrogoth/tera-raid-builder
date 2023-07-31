import { Move, Field, Pokemon, Generations } from "../calc";
import { AilmentName } from "./interface";
import { Raider } from "./Raider";
import { StatusName } from "../calc/data/interface";
import { getMoveEffectiveness, isGrounded } from "../calc/mechanics/util";

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