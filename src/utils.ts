import { StatID, StatsTable } from "./calc";
import { TurnGroupInfo } from "./raidcalc/interface";

const SPECIAL_NAMES = {
    // Hyphenated Pokemon Names
    "ho-oh":        "Ho-Oh",
    "jangmo-o":     "Jangmo-o",
    "hakamo-o":     "Hakamo-o",
    "kommo-o":      "Kommo-o",
    "porygon-z":    "Porygon-Z",
    "chi-yu":       "Chi-Yu",
    "chien-pao":    "Chien-Pao",
    "ting-lu":      "Ting-Lu",
    "wo-chien":     "Wo-Chien",
    // Pokemon with Period in Name
    "mr-mime":      "Mr. Mime",
    "mime-jr":      "Mime Jr.",
    "mr-rime":      "Mr. Rime",
    // Pokemon with Apostrophe in Name
    "farfetchd":        "Farfetch’d",
    "farfetchd-galar":  "Farfetch’d-Galar",
    "sirfetchd":        "Sirfetch’d",
    // Pokemon with Colon in Name
    "type_null":    "Type: Null",
    // Ugh
    "flabebe":      "Flabébé",
    // Hyphenated Move Names
    "double-edge":              "Double-Edge",
    "self-destruct":            "Self-Destruct",
    "mud-slap":                 "Mud-Slap",
    "lock-on":                  "Lock-On",
    "will-o-wisp":              "Will-O-Wisp",
    "wake-up-slap":             "Wake-Up Slap",
    "u-turn":                   "U-Turn",
    "x-scissor":                "X-Scissor",
    "v-create":                 "V-Create",
    "trick-or-treat":           "Trick-or-Treat",
    "freeze-dry":               "Freeze-Dry",
    "topsy-turvy":              "Topsy-Turvy",
    "bady-doll eyes":           "Baby-Doll Eyes",
    "power-up-punch":           "Power-Up Punch",
    "all-out-pummeling":        "All-Out Pummeling",
    "savage-spin-out":          "Savage Spin-Out",
    "never-ending-nightmare":   "Never-Ending Nightmare",
    "soul-stealing-7-star-strike": "Soul-Stealing 7-Star Strike",
    "multi-attack":             "Multi-Attack",
    // Hyphenated Ability Names
    "soul-heart":               "Soul-Heart",
    "well-baked-body":          "Well-Baked Body"
}

const miscImagesProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/misc/"
const pokemonArtProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/arts/";
const shinyArtProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/shiny_arts/";
const pokemonSpriteProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/box_sprites/";
const itemSpriteProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/items/";
const typeIconProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/type_icons/";
const teraTypeIconProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/tera_type_icons/";
const teraTypeBannerProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/tera_banners/";
const methodIconProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/move_methods/";

// use the Serebii item dex for item sprites
export function prepareImageAssetName(name: string) {
    if (name === "Flabébé") { return "flabebe"; } // ugh
    if (name.includes("Arceus")) { return "arceus"; }
    return name.replaceAll(' ','_').replaceAll('.','').replaceAll("’", '').replaceAll("'", '').replaceAll(':','').replaceAll('é','e').toLowerCase();
}

export function getMiscImageURL(name: string) {
    return miscImagesProlog + prepareImageAssetName(name) + ".png";
}

export function getItemSpriteURL(name: string) {
    return itemSpriteProlog + prepareImageAssetName(name) + ".png";
}

export function getTypeIconURL(name: string) {
    return typeIconProlog + prepareImageAssetName(name) + ".png";
}

export function getTeraTypeIconURL(name: string) {
    return teraTypeIconProlog + prepareImageAssetName(name) + ".png";
}

export function getTeraTypeBannerURL(name: string) {
    return teraTypeBannerProlog + prepareImageAssetName(name) + "_banner_sticker.png";
}

export function getMoveMethodIconURL(name: string) {
    return methodIconProlog + prepareImageAssetName(name) + ".png";
}

export function getPokemonArtURL(name: string, shiny: boolean = false) {
    if (shiny) {
        return shinyArtProlog + prepareImageAssetName(name) + ".png";
    }
    return pokemonArtProlog + prepareImageAssetName(name) + ".png";
}

export function getPokemonSpriteURL(name: string) {
    return pokemonSpriteProlog + prepareImageAssetName(name) + ".png";
}

export function preparePokedexName(name: string) {
    return name.replace(' ','-').replace('.','').replace("’", '').replace("'", '').replace(':','').replace('é','e').toLowerCase();
}


export function prepareSummaryName(name: string) {
    if (Object.hasOwn(SPECIAL_NAMES, name)) {
        //@ts-ignore
        return SPECIAL_NAMES[name];
    }
    const words = name.split("-")
    return words.map(word => word[0].toUpperCase() + word.substr(1)).join(" ");
}

// const capitalizeFirstLetter = (str: string) => {
//     return str.charAt(0).toUpperCase() + str.slice(1);
// };

export function getAilmentReadableName(ailment?: string) {
    return ailment ? ailment.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : null;
}

export function getLearnMethodReadableName(learnMethod: string) {
    return (
        learnMethod === "level-up" ? "Level Up" : 
        learnMethod === "machine" ? "TM" :
        learnMethod === "egg" ? "Egg" :
        "Special"
    )
}

export function getStatusReadableName(status: string) {
    return (
        status === "slp" ? "Asleep" :
        status === "psn" ? "Poisoned" :
        status === "brn" ? "Burned" :
        status === "frz" ? "Frozen" : 
        status === "par" ? "Paralyzed" : 
        status === "tox" ? "Toxic" :
        "???"
    )
}

export function getStatReadableName(stat: string) {
    return (
        stat === "hp" ? "HP" :
        stat === "atk" ? "Atk" :
        stat === "def" ? "Def" :
        stat === "spa" ? "SpAtk" :
        stat === "spd" ? "SpDef" :
        stat === "spe" ? "Speed" :
        stat === "acc" ? "Acc" :
        stat === "eva" ? "Eva" :
        "???"
    )
}

export function getStatOrder(stat: string) {
    const order = ["hp", "atk", "def", "spa", "spd", "spe", "acc", "eva"];
    return order.indexOf(stat);
}

export function getEVDescription(evs: StatsTable, translationKey: any) {
    const filteredPairs = Object.entries(evs).filter(([key, value]) => value !== 0);
    return filteredPairs.length === 0 ? undefined : filteredPairs.map(([key, value]) => `${value} ${getTranslation(getStatReadableName(key), translationKey, "stats")}`).join(', ');
}

export function getIVDescription(ivs: StatsTable, translationKey: any) {
    const ivsWithZero = Object.entries(ivs).filter(([key, value]) => value === 0).map(([key, value]) => key);
    const ivsWithMax = Object.entries(ivs).filter(([key, value]) => value === 31).map(([key, value]) => key);
    const ivsWithSignificance = Object.entries(ivs).filter(([key, value]) => value !== 0 && value !== 31).map(([key, value]) => [key, value]);
    // const filteredPairs = Object.entries(ivs).filter(([key, value]) => value !== 31);

    if (ivsWithZero.length === 6) { return "Untrained"; }
    if (ivsWithMax.length === 6) { return "All Hypertrained"; }

    if (ivsWithSignificance.length === 0) {
        let displayedStats: string[] = [];
        for (let stat in ivs) {
            const statid = stat as StatID;
            if (ivs[statid] !== 0) {
                displayedStats.push(getTranslation(getStatReadableName(stat), translationKey, "stats"));
            }
        }
        return displayedStats.slice(0,-1).join(', ') + (displayedStats.length > 2 ? ", and " : " and ") + displayedStats.slice(-1) + " Hypertrained";
    }
    else {
        let displayedIVs: string[] = [];
        for (let stat in ivs) {
            const statid = stat as StatID;
            displayedIVs.push(`${ivs[statid]}`);
        } 
        return displayedIVs.join(' / ');
    }
}

export function getTurnNumbersFromGroups(groups: TurnGroupInfo[]) {
    const turns: number[] = [];
    const moveCounters = [0,0,0,0];

    for (let g of groups) {
        let bossAction = true;
        for (let t of g.turns) {
            const raiderID = t.moveInfo.userID;
            const moveName = t.moveInfo.moveData.name;
            if (moveName !== "(No Move)") {
                moveCounters[raiderID-1] += 1;
                bossAction = false;
            }
        }
        const currentTurn = Math.max(...moveCounters);
        if (bossAction) {
            turns.push(0);
            for (let i=0; i<4; i++) {
                moveCounters[i] = currentTurn; // advance to a new turn when a scripted boss action happens
            }
        } else {
            turns.push(currentTurn);
        }
        if ((g.repeats || 1) > 1) {
            for (let i=0; i<4; i++) {
                if (g.turns[i].moveInfo.moveData.name !== "(No Move)") {
                    moveCounters[i] += (g.repeats || 1) - 1;
                }
            }
        }
        for (let i=0; i<4; i++) {
            // Attempt to handle weird situations where a raider falls behind in move count,
            // then moves several times in a row. 
            if (moveCounters[i] < currentTurn - 1) {
                moveCounters[i] = currentTurn - 1;
            }
        }
    }
    return turns;
}

export function sortGroupsIntoTurns(turnNumbers: number[], groups: TurnGroupInfo[]): TurnGroupInfo[][] {
    const turns: TurnGroupInfo[][] = [];
    let currentGroupIndex = 0;
    let previousTurnNumber = -1;
    for (let i=0; i<turnNumbers.length; i++) {
        const tn = turnNumbers[i];
        if (tn === 0 || tn !== previousTurnNumber) {
            turns.push([]);
            previousTurnNumber = tn;
        }
        while ((currentGroupIndex < groups.length) && (turnNumbers[currentGroupIndex] === tn)) {
            turns[turns.length-1].push(groups[currentGroupIndex]);
            currentGroupIndex += 1;
        } 
    }
    return turns;
}

export function getTranslation(word: string, translationKey: any, translationCategory: string = "ui") {
    if (!translationKey) { return word; }
    if (!translationKey[translationCategory]) { return word; }
    return translationKey[translationCategory][word] || word;
}

export function getTranslationWithoutCategory(word: string, translationKey: any) {
    if (!translationKey) { return word; }
    for (const category in translationKey) {
        if (translationKey[category][word]) {
            return translationKey[category][word];
        }
    }
    return word;
}

export function convertCamelCaseToWords(input: string): string {
    const words = input.replace(/([a-z])([A-Z])/g, '$1 $2');  
    const capitalizedWords = words.replace(/\b\w/g, (match) => match.toUpperCase());
    return capitalizedWords;
}

export function arraysEqual(a: any[], b: any[]) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;
  
    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
  
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
}

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const base = alphabet.length;
export function encode(id: number) {
    let i = id;
    if (i === 0) {
        return alphabet[0]
    }
    let s = ""
  while (i > 0) {
    s += alphabet[i % base]
    i = parseInt(`${i / base}`, 10)
  }
  return s.split("").reverse().join("");
}

export function decode(str: string) {
    if (str === "" || str === "#") {
        return null;
    }
    let i = 0;
    for (const c of str) {
        i = i * base + alphabet.indexOf(c);
    }
    return i;
}