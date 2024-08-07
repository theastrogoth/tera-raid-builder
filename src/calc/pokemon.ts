import * as I from './data/interface';
import {Stats} from './stats';
import {toID, extend, assignWithout} from './util';
import {State} from './state';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as I.StatID[];
const SPC = new Set(['spc']);


export class Pokemon implements State.Pokemon {
  gen: I.Generation;
  name: I.SpeciesName;
  species: I.Specie;

  types: [I.TypeName] | [I.TypeName, I.TypeName] | [I.TypeName, I.TypeName, I.TypeName];
  weightkg: number;

  level: number;
  bossMultiplier: number;
  statMultipliers: I.StatsTable;
  gender?: I.GenderName;
  ability?: I.AbilityName;
  abilityOn?: boolean;
  isDynamaxed?: boolean;
  dynamaxLevel?: number;
  isSaltCure?: boolean;
  alliesFainted?: number;
  boostedStat?: I.StatIDExceptHP | 'auto';
  item?: I.ItemName;
  teraType?: I.TypeName;
  isTera: boolean;
  shieldData?: State.ShieldData;
  shieldActive?: boolean;
  isQP? : boolean;
  usedBoosterEnergy?: boolean;
  isIngrain?: boolean;
  isSmackDown?: boolean;

  nature: I.NatureName;
  ivs: I.StatsTable;
  evs: I.StatsTable;
  boosts: I.StatsTable;
  isPumped: number;
  isMicle: boolean;
  isMinimize: boolean;
  randomBoosts: number;
  stockpile: number;
  rawStats: I.StatsTable;
  stats: I.StatsTable;

  originalCurHP: number;
  status: I.StatusName | '';
  volatileStatus: string[];
  toxicCounter: number;
  hitsTaken: number;
  timesFainted: number;
  hasExtraType?: boolean;
  // lastMoveFailed: boolean;

  moves: I.MoveName[];

  abilityNullified: number | undefined;
  permanentAtkCheers: number;
  permanentDefCheers: number;

  constructor(
    gen: I.Generation,
    name: string,
    options: Partial<State.Pokemon> & {
      types?: [I.TypeName] | [I.TypeName, I.TypeName] | [I.TypeName, I.TypeName, I.TypeName];
      curHP?: number;
      ivs?: Partial<I.StatsTable> & {spc?: number};
      evs?: Partial<I.StatsTable> & {spc?: number};
      boosts?: Partial<I.StatsTable> & {spc?: number};
      rawStats?: I.StatsTable;
      stats?: I.StatsTable;
      statMultipliers?: Partial<I.StatsTable> & {spc?: number};
    } = {}
  ) {
    this.species = extend(true, {}, gen.species.get(toID(name)), options.overrides);

    this.gen = gen;
    this.name = options.name || name as I.SpeciesName;
    this.types = options.types || this.species.types;
    this.weightkg = this.species.weightkg;

    this.level = options.level || 100;
    this.bossMultiplier = options.bossMultiplier || 100;
    this.statMultipliers = Pokemon.withDefault(gen, options.statMultipliers, 1);

    this.gender = options.gender || this.species.gender || 'N';
    this.ability = options.ability || this.species.abilities?.[0] || undefined;
    this.abilityOn = !!options.abilityOn;

    this.isDynamaxed = !!options.isDynamaxed;
    this.dynamaxLevel = this.isDynamaxed
      ? (options.dynamaxLevel === undefined ? 10 : options.dynamaxLevel) : undefined;
    this.isSaltCure = !!options.isSaltCure;
    this.alliesFainted = options.alliesFainted;
    this.boostedStat = options.boostedStat;
    this.usedBoosterEnergy = options.usedBoosterEnergy;
    this.isIngrain = options.isIngrain;
    this.isSmackDown = options.isSmackDown;
    this.teraType = options.teraType;
    this.isTera = !!options.isTera;
    this.shieldData = options.shieldData;
    this.shieldActive = options.shieldActive;
    this.item = options.item;
    this.nature = options.nature || ('Serious' as I.NatureName);
    this.ivs = Pokemon.withDefault(gen, options.ivs, 31);
    this.evs = Pokemon.withDefault(gen, options.evs, gen.num >= 3 ? 0 : 252);
    this.boosts = Pokemon.withDefault(gen, options.boosts, 0, false);
    this.isPumped = options.isPumped || 0;
    this.isMicle = !!options.isMicle;
    this.isMinimize = !!options.isMinimize;
    this.randomBoosts = options.randomBoosts || 0;
    this.stockpile = options.stockpile || 0;

    // Gigantamax 'forms' inherit weight from their base species when not dynamaxed
    // TODO: clean this up with proper Gigantamax support
    if (this.weightkg === 0 && !this.isDynamaxed && this.species.baseSpecies) {
      this.weightkg = gen.species.get(toID(this.species.baseSpecies))!.weightkg;
    }

    if (gen.num < 3) {
      this.ivs.hp = Stats.DVToIV(
        Stats.getHPDV({
          atk: this.ivs.atk,
          def: this.ivs.def,
          spe: this.ivs.spe,
          spc: this.ivs.spa,
        })
      );
    }

    const rawStatsProvided = !!options.rawStats;
    const statsProvided = !!options.stats;
    this.rawStats = {} as I.StatsTable;
    this.stats = {} as I.StatsTable;
    for (const stat of STATS) {
      const val = this.calcStat(gen, stat);
      this.rawStats[stat] = rawStatsProvided ? options.rawStats![stat]! : ( stat === "hp" ? ~~val*this.bossMultiplier/100 : val);
      this.stats[stat] =  statsProvided ? options.stats![stat]! : (stat === "hp" ? ~~val*this.bossMultiplier/100 : val);
    }

    const curHP = options.curHP || options.originalCurHP;
    this.originalCurHP = curHP && curHP <= this.rawStats.hp ? curHP : curHP === 0 ? 0 : this.rawStats.hp;
    this.status = options.status || '';
    this.volatileStatus = options.volatileStatus || [];
    this.toxicCounter = options.toxicCounter || 0;
    this.hitsTaken = options.hitsTaken || 0;
    this.timesFainted = options.timesFainted || 0;
    this.hasExtraType = !!options.hasExtraType;
    // this.lastMoveFailed = !!options.lastMoveFailed;
    this.moves = options.moves || [];
    this.abilityNullified = options.abilityNullified;
    this.permanentAtkCheers = options.permanentAtkCheers || 0;
    this.permanentDefCheers = options.permanentDefCheers || 0;
  }

  maxHP(original = false) {
    // Shedinja still has 1 max HP during the effect even if its Dynamax Level is maxed (DaWoblefet)
    if (!original && this.isDynamaxed && this.species.baseStats.hp !== 1) {
      return Math.floor((this.rawStats.hp * (150 + 5 * this.dynamaxLevel!)) / 100);
    }

    return this.rawStats.hp;
  }

  curHP(original = false) {
    // Shedinja still has 1 max HP during the effect even if its Dynamax Level is maxed (DaWoblefet)
    if (!original && this.isDynamaxed && this.species.baseStats.hp !== 1) {
      return Math.ceil((this.originalCurHP * (150 + 5 * this.dynamaxLevel!)) / 100);
    }

    return this.originalCurHP;
  }

  hasAbility(...abilities: string[]) {
    return (this.abilityNullified || 0) === 0 && !!(this.ability && abilities.includes(this.ability));
  }

  hasItem(...items: string[]) {
    return !!(this.item && items.includes(this.item));
  }

  hasStatus(...statuses: I.StatusName[]) {
    return !!(this.status && statuses.includes(this.status));
  }

  hasType(...types: I.TypeName[]) {
    for (const type of types) {
      if ((this.isTera && this.teraType) ? this.teraType === type : this.types.includes(type)) return true;    }
    return false;
  }

  /** Ignores Tera type */
  hasOriginalType(...types: I.TypeName[]) {
    for (const type of types) {
      if (!this.types.includes(type)) return false;
    }
    return true;
  }

  named(...names: string[]) {
    return names.includes(this.name);
  }

  clone() {
    return new Pokemon(this.gen, this.name, {
      level: this.level,
      bossMultiplier: this.bossMultiplier,
      statMultipliers: this.statMultipliers,
      ability: this.ability,
      abilityOn: this.abilityOn,
      isDynamaxed: this.isDynamaxed,
      dynamaxLevel: this.dynamaxLevel,
      isSaltCure: this.isSaltCure,
      alliesFainted: this.alliesFainted,
      boostedStat: this.boostedStat,
      usedBoosterEnergy: this.usedBoosterEnergy,
      isIngrain: this.isIngrain,
      item: this.item,
      gender: this.gender,
      nature: this.nature,
      stats: this.stats,
      ivs: extend(true, {}, this.ivs),
      evs: extend(true, {}, this.evs),
      boosts: extend(true, {}, this.boosts),
      isPumped: this.isPumped,
      isMicle: this.isMicle,
      isMinimize: this.isMinimize,
      randomBoosts: this.randomBoosts,
      stockpile: this.stockpile,
      originalCurHP: this.originalCurHP,
      status: this.status,
      volatileStatus: this.volatileStatus,
      teraType: this.teraType,
      isTera: this.isTera,
      shieldData: this.shieldData,
      shieldActive: this.shieldActive,
      toxicCounter: this.toxicCounter,
      hitsTaken: this.hitsTaken,
      timesFainted: this.timesFainted,
      types: this.types,
      hasExtraType: this.hasExtraType,
      // lastMoveFailed: this.lastMoveFailed,
      moves: this.moves.slice(),
      abilityNullified: this.abilityNullified,
      permanentAtkCheers: this.permanentAtkCheers,
      permanentDefCheers: this.permanentDefCheers,
      overrides: this.species,
    });
  }

  private calcStat(gen: I.Generation, stat: I.StatID) {
    return Math.floor(this.statMultipliers[stat]! * Stats.calcStat(
      gen,
      stat,
      this.species.baseStats[stat]!,
      this.ivs[stat]!,
      this.evs[stat]!,
      this.level,
      this.nature
    ));
  }

  static getForme(
    gen: I.Generation,
    speciesName: string,
    item?: I.ItemName,
    moveName?: I.MoveName
  ) {
    const species = gen.species.get(toID(speciesName));
    if (!species?.otherFormes) {
      return speciesName;
    }

    let i = 0;
    if (
      (item &&
        ((item.includes('ite') && !item.includes('ite Y')) ||
          (speciesName === 'Groudon' && item === 'Red Orb') ||
          (speciesName === 'Kyogre' && item === 'Blue Orb'))) ||
      (moveName && speciesName === 'Meloetta' && moveName === 'Relic Song') ||
      (speciesName === 'Rayquaza' && moveName === 'Dragon Ascent')
    ) {
      i = 1;
    } else if (item?.includes('ite Y')) {
      i = 2;
    }

    return i ? species.otherFormes[i - 1] : species.name;
  }

  private static withDefault(
    gen: I.Generation,
    current: Partial<I.StatsTable> & {spc?: number} | undefined,
    val: number,
    match = true,
  ) {
    const cur: Partial<I.StatsTable> = {};
    if (current) {
      assignWithout(cur, current, SPC);
      if (current.spc) {
        cur.spa = current.spc;
        cur.spd = current.spc;
      }
      if (match && gen.num <= 2 && current.spa !== current.spd) {
        throw new Error('Special Attack and Special Defense must match before Gen 3');
      }
    }
    return {hp: val, atk: val, def: val, spa: val, spd: val, spe: val, ...cur};
  }
}
