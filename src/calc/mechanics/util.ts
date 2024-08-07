import {
  Generation,
  ID,
  ItemName,
  MoveCategory,
  NatureName,
  StatID,
  StatsTable,
  Terrain,
  TypeName,
  Weather,
} from '../data/interface';
import {toID} from '../util';
import {Field, Side} from '../field';
import {Move} from '../move';
import {Pokemon} from '../pokemon';
import {Stats} from '../stats';
import {RawDesc} from '../desc';

const EV_ITEMS = [
  'Macho Brace',
  'Power Anklet',
  'Power Band',
  'Power Belt',
  'Power Bracer',
  'Power Lens',
  'Power Weight',
];

export function isGrounded(pokemon: Pokemon, field: Field) {
  return (field.isGravity || pokemon.hasItem('Iron Ball') || pokemon.isIngrain || pokemon.isSmackDown ||
    (!pokemon.hasType('Flying') &&
      !pokemon.hasAbility('Levitate') &&
      !pokemon.hasItem('Air Balloon')));
}

export function getModifiedStat(stat: number, mod: number, gen?: Generation) {
  if (gen && gen.num < 3) {
    if (mod >= 0) {
      const pastGenBoostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
      stat = Math.floor(stat * pastGenBoostTable[mod]);
    } else {
      const numerators = [100, 66, 50, 40, 33, 28, 25];
      stat = Math.floor((stat * numerators[-mod]) / 100);
    }
    return Math.min(999, Math.max(1, stat));
  }

  const numerator = 0;
  const denominator = 1;
  const modernGenBoostTable = [
    [2, 8],
    [2, 7],
    [2, 6],
    [2, 5],
    [2, 4],
    [2, 3],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [7, 2],
    [8, 2],
  ];
  stat = OF16(stat * modernGenBoostTable[6 + mod][numerator]);
  stat = Math.floor(stat / modernGenBoostTable[6 + mod][denominator]);

  return stat;
}

export function computeFinalStats(
  gen: Generation,
  attacker: Pokemon,
  defender: Pokemon,
  field: Field,
  ...stats: StatID[]
) {
  const sides: Array<[Pokemon, Side]> =
    [[attacker, field.attackerSide], [defender, field.defenderSide]];
  for (const [pokemon, side] of sides) {
    for (const stat of stats) {
      if (stat === 'spe') {
        pokemon.stats.spe = getFinalSpeed(gen, pokemon, field, side);
      } else {
        pokemon.stats[stat] = getModifiedStat(pokemon.rawStats[stat]!, pokemon.boosts[stat]!, gen);
      }
    }
  }
}

export function getFinalSpeed(gen: Generation, pokemon: Pokemon, field: Field, side: Side) {
  const weather = field.isCloudNine ? '' : field.weather || '';
  const terrain = field.isTeraformZero ? '' : field.terrain;
  let speed = getModifiedStat(pokemon.rawStats.spe, pokemon.boosts.spe, gen);
  const speedMods = [];

  if (side.isTailwind) speedMods.push(8192);
  // Pledge swamp would get applied here when implemented
  // speedMods.push(1024);

  if ((pokemon.hasAbility('Unburden') && pokemon.abilityOn) ||
      (pokemon.hasAbility('Chlorophyll') && weather.includes('Sun')) ||
      (pokemon.hasAbility('Sand Rush') && weather === 'Sand') ||
      (pokemon.hasAbility('Swift Swim') && weather.includes('Rain')) ||
      (pokemon.hasAbility('Slush Rush') && ['Hail', 'Snow'].includes(weather)) ||
      (pokemon.hasAbility('Surge Surfer') && terrain === 'Electric')
  ) {
    speedMods.push(8192);
  } else if (pokemon.hasAbility('Quick Feet') && pokemon.status) {
    speedMods.push(6144);
  } else if (pokemon.hasAbility('Slow Start') && pokemon.abilityOn) {
    speedMods.push(2048);
  } else if (isQPActive(pokemon, field) && getQPBoostedStat(pokemon, !!field.isWonderRoom, gen) === 'spe') {
    speedMods.push(6144);
  }

  if (pokemon.hasItem('Choice Scarf')) {
    speedMods.push(6144);
  } else if (pokemon.hasItem('Iron Ball', ...EV_ITEMS)) {
    speedMods.push(2048);
  } else if (pokemon.hasItem('Quick Powder') && pokemon.named('Ditto')) {
    speedMods.push(8192);
  }

  speed = OF32(pokeRound((speed * chainMods(speedMods, 410, 131172)) / 4096));
  if (pokemon.hasStatus('par') && !pokemon.hasAbility('Quick Feet')) {
    speed = Math.floor(OF32(speed * (gen.num < 7 ? 25 : 50)) / 100);
  }

  speed = Math.min(gen.num <= 2 ? 999 : 10000, speed);
  return Math.max(0, speed);
}

export function getMoveEffectiveness(
  gen: Generation,
  move: Move,
  type: TypeName,
  isGhostRevealed?: boolean,
  isGravity?: boolean | number,
  isRingTarget?: boolean,
) {
  if ((isRingTarget || isGhostRevealed) && type === 'Ghost' && move.hasType('Normal', 'Fighting')) {
    return 1;
  } else if ((isRingTarget || isGravity) && type === 'Flying' && move.hasType('Ground')) {
    return 1;
  } else if (move.named('Freeze-Dry') && type === 'Water') {
    return 2;
  } else if (move.named('Flying Press')) {
    return (
      gen.types.get('fighting' as ID)!.effectiveness[type]! *
      gen.types.get('flying' as ID)!.effectiveness[type]!
    );
  } else {
    return gen.types.get(toID(move.type))!.effectiveness[type]!;
  }
}

export function checkAirLock(pokemon: Pokemon, field: Field) {
  if (pokemon.hasAbility('Air Lock', 'Cloud Nine')) {
    field.weather = undefined;
  }
}

export function checkTeraformZero(pokemon: Pokemon, field: Field) {
  if (pokemon.hasAbility('Teraform Zero') && pokemon.abilityOn) {
    field.weather = undefined;
    field.terrain = undefined;
  }
}

export function checkForecast(pokemon: Pokemon, weather?: Weather) {
  if (pokemon.hasAbility('Forecast') && pokemon.named('Castform')) {
    switch (weather) {
    case 'Sun':
    case 'Harsh Sunshine':
      pokemon.types = ['Fire'];
      break;
    case 'Rain':
    case 'Heavy Rain':
      pokemon.types = ['Water'];
      break;
    case 'Hail':
    case 'Snow':
      pokemon.types = ['Ice'];
      break;
    default:
      pokemon.types = ['Normal'];
    }
  }
}

export function checkItem(pokemon: Pokemon, magicRoomActive?: boolean) {
  if (
    pokemon.hasAbility('Klutz') && !EV_ITEMS.includes(pokemon.item!) ||
      magicRoomActive
  ) {
    pokemon.item = '' as ItemName;
  }
}

export function checkWonderRoom(attacker: Pokemon, defender: Pokemon, field: Field) {
  if (field.isWonderRoom) {
    if (!defender.hasAbility("Unaware")) {
      [attacker.rawStats.def, attacker.rawStats.spd] = [attacker.rawStats.spd, attacker.rawStats.def];
    }
    if (!attacker.hasAbility("Unaware")) {
      [defender.rawStats.def, defender.rawStats.spd] = [defender.rawStats.spd, defender.rawStats.def];
    }
  }
}

export function checkIntimidate(gen: Generation, source: Pokemon, target: Pokemon) {
  const blocked =
    target.hasAbility('Clear Body', 'White Smoke', 'Hyper Cutter', 'Full Metal Body') ||
    // More abilities now block Intimidate in Gen 8+ (DaWoblefet, Cloudy Mistral)
    (gen.num >= 8 && target.hasAbility('Inner Focus', 'Own Tempo', 'Oblivious', 'Scrappy')) ||
    target.hasItem('Clear Amulet');
  if (source.hasAbility('Intimidate') && source.abilityOn && !blocked) {
    if (target.hasAbility('Contrary', 'Defiant', 'Guard Dog')) {
      target.boosts.atk = Math.min(6, target.boosts.atk + 1);
    } else if (target.hasAbility('Simple')) {
      target.boosts.atk = Math.max(-6, target.boosts.atk - 2);
    } else {
      target.boosts.atk = Math.max(-6, target.boosts.atk - 1);
    }
    if (target.hasAbility('Competitive')) {
      target.boosts.spa = Math.min(6, target.boosts.spa + 2);
    }
  }
}

export function checkDownload(source: Pokemon, target: Pokemon, wonderRoomActive?: boolean) {
  if (source.hasAbility('Download')) {
    let def = target.stats.def;
    let spd = target.stats.spd;
    // We swap the defense stats again here since Download ignores Wonder Room
    if (wonderRoomActive) [def, spd] = [spd, def];
    if (spd <= def) {
      source.boosts.spa = Math.min(6, source.boosts.spa + 1);
    } else {
      source.boosts.atk = Math.min(6, source.boosts.atk + 1);
    }
  }
}

export function checkIntrepidSword(source: Pokemon, gen: Generation) {
  if (source.hasAbility('Intrepid Sword') && gen.num < 9) {
    source.boosts.atk = Math.min(6, source.boosts.atk + 1);
  }
}

export function checkDauntlessShield(source: Pokemon, gen: Generation) {
  if (source.hasAbility('Dauntless Shield') && gen.num < 9) {
    source.boosts.def = Math.min(6, source.boosts.def + 1);
  }
}

export function checkEmbody(source: Pokemon, gen: Generation) {
  if (gen.num < 9) return;
  switch (source.ability) {
  case 'Embody Aspect (Cornerstone)':
    source.boosts.def = Math.min(6, source.boosts.def + 1);
    break;
  case 'Embody Aspect (Hearthflame)':
    source.boosts.atk = Math.min(6, source.boosts.atk + 1);
    break;
  case 'Embody Aspect (Teal)':
    source.boosts.spe = Math.min(6, source.boosts.spe + 1);
    break;
  case 'Embody Aspect (Wellspring)':
    source.boosts.spd = Math.min(6, source.boosts.spd + 1);
    break;
  }
}

export function checkInfiltrator(pokemon: Pokemon, affectedSide: Side) {
  if (pokemon.hasAbility('Infiltrator')) {
    affectedSide.isReflect = 0;
    affectedSide.isLightScreen = 0;
    affectedSide.isAuroraVeil = 0;
  }
}

export function checkSeedBoost(pokemon: Pokemon, field: Field) {
  if (!pokemon.item) return;
  if (field.terrain && pokemon.item.includes('Seed')) {
    const terrainSeed = pokemon.item.substring(0, pokemon.item.indexOf(' ')) as Terrain;
    if (field.hasTerrain(terrainSeed)) {
      if (terrainSeed === 'Grassy' || terrainSeed === 'Electric') {
        pokemon.boosts.def = pokemon.hasAbility('Contrary')
          ? Math.max(-6, pokemon.boosts.def - 1)
          : Math.min(6, pokemon.boosts.def + 1);
      } else {
        pokemon.boosts.spd = pokemon.hasAbility('Contrary')
          ? Math.max(-6, pokemon.boosts.spd - 1)
          : Math.min(6, pokemon.boosts.spd + 1);
      }
    }
  }
}

// NOTE: We only need to handle guaranteed, damage-relevant boosts here for multi-hit accuracy
export function checkMultihitBoost(
  gen: Generation,
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  field: Field,
  desc: RawDesc,
  usedWhiteHerb = false
) {
  // NOTE: attacker.ability must be Parental Bond for these moves to be multi-hit
  if (move.named('Gyro Ball', 'Electro Ball') && defender.hasAbility('Gooey', 'Tangling Hair')) {
    // Gyro Ball (etc) makes contact into Gooey (etc) whenever its inflicting multiple hits because
    // this can only happen if the attacker ability is Parental Bond (and thus can't be Long Reach)
    if (attacker.hasItem('White Herb') && !usedWhiteHerb) {
      desc.attackerItem = attacker.item;
      usedWhiteHerb = true;
    } else {
      attacker.boosts.spe = Math.max(attacker.boosts.spe - 1, -6);
      attacker.stats.spe = getFinalSpeed(gen, attacker, field, field.attackerSide);
      desc.defenderAbility = defender.ability;
    }
    // BUG: Technically Sitrus/Figy Berry + Unburden can also affect the defender's speed, but
    // this goes far beyond what we care to implement (especially once Gluttony is considered) now
  } else if (move.named('Power-Up Punch')) {
    attacker.boosts.atk = Math.min(attacker.boosts.atk + 1, 6);
    attacker.stats.atk = getModifiedStat(attacker.rawStats.atk, attacker.boosts.atk, gen);
  }

  if (defender.hasAbility('Stamina')) {
    if (attacker.hasAbility('Unaware')) {
      desc.attackerAbility = attacker.ability;
    } else {
      defender.boosts.def = Math.min(defender.boosts.def + 1, 6);
      defender.stats.def = getModifiedStat(defender.rawStats.def, defender.boosts.def, gen);
      desc.defenderAbility = defender.ability;
    }
  } else if (defender.hasAbility('Weak Armor')) {
    if (attacker.hasAbility('Unaware')) {
      desc.attackerAbility = attacker.ability;
    } else {
      if (defender.hasItem('White Herb') && !usedWhiteHerb) {
        desc.defenderItem = defender.item;
        usedWhiteHerb = true;
      } else {
        defender.boosts.def = Math.max(defender.boosts.def - 1, -6);
        defender.stats.def = getModifiedStat(defender.rawStats.def, defender.boosts.def, gen);
      }
    }
    defender.boosts.spe = Math.min(defender.boosts.spe + 2, 6);
    defender.stats.spe = getFinalSpeed(gen, defender, field, field.defenderSide);
    desc.defenderAbility = defender.ability;
  }

  const simple = attacker.hasAbility('Simple') ? 2 : 1;
  if (move.dropsStats) {
    if (attacker.hasAbility('Unaware')) {
      desc.attackerAbility = attacker.ability;
    } else {
      // No move with dropsStats has fancy logic regarding category here
      const stat = move.category === 'Special' ? 'spa' : 'atk';

      let boosts = attacker.boosts[stat];
      if (attacker.hasAbility('Contrary')) {
        boosts = Math.min(6, boosts + move.dropsStats);
        desc.attackerAbility = attacker.ability;
      } else {
        boosts = Math.max(-6, boosts - move.dropsStats * simple);
        if (simple > 1) desc.attackerAbility = attacker.ability;
      }

      if (attacker.hasItem('White Herb') && attacker.boosts[stat] < 0 && !usedWhiteHerb) {
        boosts += move.dropsStats * simple;
        desc.attackerItem = attacker.item;
        usedWhiteHerb = true;
      }

      attacker.boosts[stat] = boosts;
      attacker.stats[stat] = getModifiedStat(attacker.rawStats[stat], defender.boosts[stat], gen);
    }
  }

  return usedWhiteHerb;
}

export function chainMods(mods: number[], lowerBound: number, upperBound: number) {
  let M = 4096;
  for (const mod of mods) {
    if (mod !== 4096) {
      M = (M * mod + 2048) >> 12;
    }
  }
  return Math.max(Math.min(M, upperBound), lowerBound);
}

export function getBaseDamage(level: number, basePower: number, attack: number, defense: number) {
  return Math.floor(
    OF32(
      Math.floor(
        OF32(OF32(Math.floor((2 * level) / 5 + 2) * basePower) * attack) / defense
      ) / 50 + 2
    )
  );
}

/**
 * Get which stat will be boosted by Quark Drive or Protosynthesis
 * In the case that `pokemon.boostedStat` is set, it will always return that stat
 * In the case that two stats have equal value, stat choices will be prioritized
 * in the following order:
 * Attack, Defense, Special Attack, Special Defense, and Speed
 *
 * @param modifiedStats
 * @returns
 */
export function getQPBoostedStat(
  pokemon: Pokemon,
  isWonderRoom?: boolean,
  gen?: Generation
): StatID {
  if (pokemon.boostedStat && pokemon.boostedStat !== 'auto') {
    if (isWonderRoom) {
      if (pokemon.boostedStat === 'def') { return 'spd'; }
      if (pokemon.boostedStat === 'spd') { return 'def'; }
    }
    return pokemon.boostedStat; // override.
  }
  let bestStat: StatID = 'atk';
  for (const stat of ['def', 'spa', 'spd', 'spe'] as StatID[]) {
    if (
      // proto/quark ignore boosts when considering their boost
      getModifiedStat(pokemon.rawStats[stat]!, pokemon.boosts[stat]!, gen) >
      getModifiedStat(pokemon.rawStats[bestStat]!, pokemon.boosts[bestStat]!, gen)
    ) {
      bestStat = stat;
    }
  }
  if (isWonderRoom) {
    if (bestStat === 'def') {
      bestStat = 'spd';
    }
    if (bestStat === 'spd') {
      bestStat = 'def';
    }
  }
  return bestStat;
}

export function isQPActive(
  pokemon: Pokemon,
  field: Field
): boolean {
  if (!(pokemon.boostedStat && pokemon.abilityOn)) {
    return false;
  }
  return true;

  // const weather = field.weather || '';
  // const terrain = field.terrain;
  // if (
  //   (pokemon.hasAbility('Protosynthesis') &&
  //     (weather.includes('Sun') || pokemon.abilityOn)) ||
  //   (pokemon.hasAbility('Quark Drive') &&
  //     (terrain === 'Electric' || pokemon.abilityOn)) ||
  //   (pokemon.boostedStat !== 'auto')
  // ) {
  //   return true;
  // }
  // return false;
}

export function getFinalDamage(
  baseAmount: number,
  i: number,
  effectiveness: number,
  isBurned: boolean,
  stabMod: number,
  finalMod: number,
  protect?: boolean
) {
  let damageAmount = Math.floor(OF32(baseAmount * (85 + i)) / 100);
  // If the stabMod would not accomplish anything we avoid applying it because it could cause
  // us to calculate damage overflow incorrectly (DaWoblefet)
  if (stabMod !== 4096) damageAmount = OF32(damageAmount * stabMod) / 4096;
  damageAmount = Math.floor(OF32(pokeRound(damageAmount) * effectiveness));

  if (isBurned) damageAmount = Math.floor(damageAmount / 2);
  if (protect) damageAmount = pokeRound(OF32(damageAmount * 1024) / 4096);
  return OF16(pokeRound(Math.max(1, OF32(damageAmount * finalMod) / 4096)));
}

/**
 * Determines which move category Shell Side Arm should behave as.
 *
 * A simplified formula can be used here compared to what the research
 * suggests as we do not want to implement the random tiebreak element of
 * move - instead we simply default to 'Special' and allow the user to override
 * this by manually adjusting the move's category.
 *
 * See also:
 * {@link https://github.com/smogon/pokemon-showdown/commit/65d2bb5d}
 *
 * @param source Attacking pokemon (after stat modifications)
 * @param target Target pokemon (after stat modifications)
 * @returns 'Physical' | 'Special'
 */
export function getShellSideArmCategory(source: Pokemon, target: Pokemon): MoveCategory {
  const physicalDamage = source.stats.atk / target.stats.def;
  const specialDamage = source.stats.spa / target.stats.spd;
  return physicalDamage > specialDamage ? 'Physical' : 'Special';
}

export function getWeightFactor(pokemon: Pokemon) {
  return pokemon.hasAbility('Heavy Metal') ? 2
    : (pokemon.hasAbility('Light Metal') || pokemon.hasItem('Float Stone')) ? 0.5 : 1;
}

export function countBoosts(gen: Generation, boosts: StatsTable, randomBoosts: number = 0) {
  let sum = 0;

  const STATS: StatID[] = gen.num === 1
    ? ['atk', 'def', 'spa', 'spe']
    : gen.num === 9 ? ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']
    : ['atk', 'def', 'spa', 'spd', 'spe'];

  for (const stat of STATS) {
    // Only positive boosts are counted
    const boost = boosts[stat];
    if (boost && boost > 0) sum += boost;
  }
  return sum + Math.max(0, randomBoosts);
}

export function getEVDescriptionText(
  gen: Generation,
  pokemon: Pokemon,
  stat: 'atk' | 'def' | 'spd' | 'spa',
  natureName: NatureName
): string {
  const nature = gen.natures.get(toID(natureName))!;
  return (pokemon.evs[stat] +
    (nature.plus === nature.minus ? ''
    : nature.plus === stat ? '+'
    : nature.minus === stat ? '-'
    : '') + ' ' +
     Stats.displayStat(stat));
}

export function handleFixedDamageMoves(attacker: Pokemon, move: Move) {
  if (move.named('Seismic Toss', 'Night Shade')) {
    return attacker.level;
  } else if (move.named('Dragon Rage')) {
    return 40;
  } else if (move.named('Sonic Boom')) {
    return 20;
  }
  return 0;
}

// Game Freak rounds DOWN on .5
export function pokeRound(num: number) {
  return num % 1 > 0.5 ? Math.ceil(num) : Math.floor(num);
}

// 16-bit Overflow
export function OF16(n: number) {
  return n > 65535 ? n % 65536 : n;
}

// 32-bit Overflow
export function OF32(n: number) {
  return n > 4294967295 ? n % 4294967296 : n;
}
