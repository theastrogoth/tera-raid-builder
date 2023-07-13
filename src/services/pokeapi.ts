// //@ts-ignore
// import * as Pokedex from 'pokeapi-js-wrapper';
// import { preparePokedexName } from '../utils';

// export class PokedexService {
//   pokedex: Pokedex;

//   constructor() {
//     this.pokedex = new Pokedex.Pokedex({cache: true});
//   }

//   async getPokemonByName(name: string) {
//     const pokemon = await this.pokedex.getPokemonByName(preparePokedexName(name));
//     return pokemon
//   }

//   async getMoveByName(name: string) {
//     const move = await this.pokedex.getMoveByName(preparePokedexName(name));
//     return move
//   }

//   async getAllEvoChainMoves(name: string) {
//     const preppedName = preparePokedexName(name);
//     const pokemon = await this.pokedex.getPokemonByName(preppedName);
//     let moves = pokemon.moves;
//     try {
//       const species = await this.pokedex.getPokemonSpeciesByName(pokemon.species.name);
//       if (species.evolves_from_species !== null) {
//           const prevMoves = await this.getAllEvoChainMoves(species.evolves_from_species.name as string)
//           moves = [...moves, ...prevMoves];
//       }
//     } catch {
//       // skip checking prior evos if there is a 404
//     }
//     //@ts-ignore
//     const uniqueMoves = [...[...new Map(moves.map((m) => [m.move.name, m])).values()].sort((a,b) => (a.move.name < b.move.name) ? -1 : 1)];
//     return uniqueMoves.sort();
//   }

// }