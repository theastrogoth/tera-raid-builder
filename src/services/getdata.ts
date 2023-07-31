import { TypeName, AbilityName, MoveName, SpeciesName, StatsTable } from '../calc/data/interface';
import { MoveData } from '../raidcalc/interface';

const assetsProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/data/"

export function prepareFileName(name: string) {
    return name.replaceAll(' ','-').replaceAll('.','').replaceAll("’", '').replaceAll("'", '').replaceAll(':','').replaceAll('é','e').toLowerCase();
}

export type PokemonData = {
    name:   SpeciesName,
    types:  TypeName[],
    abilities: {name: AbilityName, hidden: boolean}[],
    stats:  StatsTable,
    moves:  {name: MoveName, learnMethod: string}[],
}

export namespace PokedexService {

    export async function getMoveByName(name: string): Promise<MoveData | undefined> {
        if (["(No Move)", "Attack Cheer", "Defense Cheer", "Heal Cheer"].includes(name)) {
            return {name: name as MoveName}
        }
        try {
            const preppedName = prepareFileName(name);
            let response = await fetch(assetsProlog + "moves/" + preppedName + ".json");
            let responseJson = await response.json();
            return responseJson as MoveData;
        } catch(error) {
            console.error(error);
        }
    }

    export async function getPokemonByName(name: string) {
        try {
            const preppedName = prepareFileName(name);
            let response = await fetch(assetsProlog + "pokemon/" + preppedName + ".json");
            let responseJson = await response.json();
            return responseJson as PokemonData;
        } catch(error) {
            console.error(error);
        }
    }
}

export default PokedexService