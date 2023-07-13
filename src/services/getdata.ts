import { TypeName, AbilityName, MoveName, SpeciesName, StatsTable, StatID } from '../calc/data/interface';

const assetsProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/data/"

export function prepareFileName(name: string) {
    return name.replace(' ','-').replace('.','').replace("’", '').replace("'", '').replace(':','').replace('é','e').toLowerCase();
}

export type PokemonData = {
    name:   SpeciesName,
    types:  TypeName[],
    abilities: AbilityName[],
    stats:  StatsTable,
    moves:  {name: MoveName, learnMethod: string}[],
}

export type MoveCategory =   "net-good-stats" |
                             "whole-field-effect" |
                             "damage+ailment" |
                             "damage" |
                             "unique" |
                             "damage+lower" |
                             "ailment" |
                             "damage+raise" |
                             "heal" |
                             "ohko" |
                             "field-effect" |
                             "damage+heal" |
                             "swagger" |
                             "force-switch";

export type MoveTarget = "all-opponents" |
                         "entire-field" |
                         "selected-pokemon" |
                         "user" |
                         "random-opponent" |
                         "all-other-pokemon" |
                         "all-pokemon" |
                         "selected-pokemon-me-first" |
                         "all-allies" |
                         "users-field" |
                         "specific-move" |
                         "opponents-field" |
                         "user-and-allies" |
                         "ally" |
                         "user-or-ally" |
                         "fainting-pokemon";

export type AilmentName =   "confusion" |
                            "torment" |
                            "poison" |
                            "freeze" |
                            "burn" |
                            "paralysis" |
                            "sleep" |
                            "unknown" |
                            "heal-block" |
                            "trap" |
                            "nightmare" |
                            "disable" |
                            "silence" |
                            "yawn" |
                            "leech-seed" |
                            "no-type-immunity" |
                            "perish-song" |
                            "ingrain" |
                            "tar-shot" |
                            "embargo" |
                            "infatuation" |
                            "toxic";

export type MoveData = {
    name:           MoveName
    category:       MoveCategory,
    target:         MoveTarget,
    type?:          TypeName,
    power?:         number,
    accuracy:       number,
    priority:       number,
    drain:          number,
    healing:        number,
    selfDamage:     number,
    ailment:        AilmentName,
    statChanges:    {stat: StatID, change: number}[],
    flinchChance:   number,
    statChance:     number,
    ailmentChance:  number,
    minHits:        number,
    maxHits:        number,
}

export namespace PokedexService {

    export async function getMoveByName(name: string) {
        try {
            const preppedName = prepareFileName(name);
            let response = await fetch(assetsProlog + "pokemon/" + preppedName + ".json");
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