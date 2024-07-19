// When using this library in the browser, a bundler like Webpack should be
// used to encapsulate the various interdependencies between internal packages.
// However, if you are requiring contents of this package in HTML <script>
// tags, the following loading order is required:
//
//   - util.js
//   - stats.js
//
//   - data/species.js
//   - data/types.js
//   - data/natures.js
//   - data/abilities.js
//   - data/moves.js
//   - data/items.js
//   - data/index.js
//
//   - pokemon.js
//   - field.js
//   - move.js
//   - items.js
//
//   - mechanics/util.js
//   - mechanics/gen78.js
//   - mechanics/gen56.js
//   - mechanics/gen4.js
//   - mechanics/gen3.js
//   - mechanics/gen12.js
//
//   - calc.js
//   - desc.js
//   - result.ts
//
//   - adaptable.js
//   - index.js
//
// Furthermore, before anything is loaded, the following is required:
//
// <script type="text/javascript">
//		var calc = exports = {};
//		function require() { return exports; };
//	</script>

// If we're not being used as a module we're just going to rely on globals and
// that the correct loading order being followed.

import {Generations} from './data';
import {State} from './state';
import * as I from './data/interface';
import * as A from './adaptable';

export function calculate(
  gen: I.GenerationNum | I.Generation,
  attacker: A.Pokemon,
  defender: A.Pokemon,
  move: A.Move,
  field?: A.Field
): A.Result {
  return (A.calculate)(
    typeof gen === 'number' ? Generations.get(gen) : gen,
    attacker,
    defender,
    move,
    field
  );
}

export class Move extends A.Move {
  constructor(
    gen: I.GenerationNum | I.Generation,
    name: string,
    options: Partial<Omit<State.Move, 'ability' | 'item' | 'species'>> & {
      ability?: string;
      item?: string;
      species?: string;
    } = {}
  ) {
    super(typeof gen === 'number' ? Generations.get(gen) : gen, name, options as any);
  }
}

export class Pokemon extends A.Pokemon {
  constructor(
    gen: I.GenerationNum | I.Generation,
    name: string,
    options: Partial<Omit<State.Pokemon, 'ability' | 'item' | 'nature' | 'moves'>> & {
      ability?: string;
      item?: string;
      nature?: string;
      moves?: string[];
      curHP?: number;
      ivs?: Partial<I.StatsTable> & {spc?: number};
      evs?: Partial<I.StatsTable> & {spc?: number};
      rawStats?: I.StatsTable;
      stats?: I.StatsTable;
      boosts?: Partial<I.StatsTable> & {spc?: number};
    } = {}
  ) {
    super(typeof gen === 'number' ? Generations.get(gen) : gen, name, options as any);
  }

  static getForme(
    gen: I.GenerationNum | I.Generation,
    speciesName: string,
    item?: string,
    moveName?: string
  ) {
    return A.Pokemon.getForme(
      typeof gen === 'number' ? Generations.get(gen) : gen,
      speciesName,
      item as I.ItemName,
      moveName as I.MoveName
    );
  }
}

export function calcStat(
  gen: I.GenerationNum | I.Generation,
  stat: I.StatID | 'spc',
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature?: string
) {
  return A.Stats.calcStat(
    typeof gen === 'number' ? Generations.get(gen) : gen,
    stat === 'spc' ? 'spa' : stat,
    base,
    iv,
    ev,
    level,
    nature
  );
}

export {Field, Side} from './field';
export {Result} from './result';
export type {GenerationNum, StatsTable, StatID} from './data/interface';
export {Generations} from './data/index';
export {toID} from './util';
export {State} from './state';

export {ABILITIES} from './data/abilities';
export {ITEMS, MEGA_STONES} from './data/items';
export {MOVES} from './data/moves';
export {SPECIES} from './data/species';
export {NATURES} from './data/natures';
export {TYPE_CHART} from './data/types';
export {STATS, Stats} from './stats';
