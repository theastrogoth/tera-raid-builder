import { StatsTable } from "./calc";

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
const pokemonSpriteProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/box_sprites/";
const itemSpriteProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/items/";
const typeIconProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/type_icons/";
const teraTypeIconProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/tera_type_icons/";
const methodIconProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/images/move_methods/";

// use the Serebii item dex for item sprites
export function prepareImageAssetName(name: string) {
    if (name == "Flabébé") { return "flabebe"; } // ugh
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

export function getMoveMethodIconURL(name: string) {
    return methodIconProlog + prepareImageAssetName(name) + ".png";
}

export function getPokemonArtURL(name: string) {
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

const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

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

export function getStatReadableName(stat: string) {
    return (
        stat === "hp" ? "HP" :
        stat === "atk" ? "Atk" :
        stat === "def" ? "Def" :
        stat === "spa" ? "SpAtk" :
        stat === "spd" ? "SpDef" :
        stat === "spe" ? "Speed" :
        "???"
    )
}

export function getEVDescription(evs: StatsTable) {
    const filteredPairs = Object.entries(evs).filter(([key, value]) => value !== 0);
    return filteredPairs.length === 0 ? undefined : filteredPairs.map(([key, value]) => `${value} ${getStatReadableName(key)}`).join(', ');
}

export function getIVDescription(ivs: StatsTable) {
    const filteredPairs = Object.entries(ivs).filter(([key, value]) => value !== 31);
    return filteredPairs.length === 0 ? "All Hypertrained" : filteredPairs.map(([key, value]) => `${value} ${getStatReadableName(key)}`).join(', ');
}

export function arraysEqual(a: any[], b: any[]) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
  
    for (var i = 0; i < a.length; ++i) {
        //@ts-ignore
        if (b === "Branch Poke") {
            console.log(a[i], b[i], a[i] === b[i])
        }
      if (a[i] !== b[i]) return false;
    }
    return true;
  }