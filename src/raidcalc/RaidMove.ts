import { Move, Field, Pokemon, StatsTable, StatID, Generations, calculate} from "../calc";
import { getEndOfTurn } from "../calc/desc";
import { RaidState, Raider, AilmentName, MoveData, RaidMoveResult, RaidMoveOptions } from "./interface";
import { AbilityName, StatIDExceptHP, StatusName, Terrain, Weather } from "../calc/data/interface";
import { getMoveEffectiveness, getQPBoostedStat } from "../calc/mechanics/util";

// next time I prepare the move data, I should eliminate the need for translation
function ailmentToStatus(ailment: AilmentName): StatusName | "" {
    if (ailment == "paralysis") { return "par"; }
    if (ailment == "poison") { return "psn"; }
    if (ailment == "burn") { return "brn"; }
    if (ailment == "freeze") { return "frz"; }
    if (ailment == "sleep") { return "slp"; }
    if (ailment == "toxic") { return "tox"; }
    return ""
}

function hasNoStatus(pokemon: Pokemon) {
    return pokemon.status === "" || pokemon.status === undefined;
}

// See ../calc/mechanics/util.ts for the original
function isSuperEffective(move: Move, field: Field, attacker: Pokemon, defender: Pokemon) {
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

// we'll always use generation 9
const gen = Generations.get(9);
const dummyMove = new Move(gen, "Splash");

export class RaidMove {
    move: Move;
    moveData: MoveData;
    raidState: RaidState;
    userID: number;     // the id of the user of this move
    targetID: number;   // the id of the target of this move
    raiderID: number;   // the id of the raider who initiated this round
    movesFirst: boolean;
    options: RaidMoveOptions;

    _raidState!: RaidState;
    _raiders!: Raider[];
    _user!: Raider;
    _affectedIDs!: number[];
    _fields!: Field[];

    _boosts!: Partial<StatsTable>[];

    _damage!: number[][];
    _healing!: number[][];
    _drain!: number[][];
    _eot!: ({damage: number, texts: string[]} | undefined)[];

    _desc!: string[];

    constructor(moveData: MoveData, move: Move, raidState: RaidState, userID: number, targetID: number, raiderID: number, movesFirst: boolean,  raidMoveOptions?: RaidMoveOptions) {
        this.move = move;
        this.moveData = moveData;
        this.raidState = raidState;
        this.userID = userID;
        this.targetID = targetID;
        this.raiderID = raiderID;
        this.movesFirst = movesFirst;
        this.options = raidMoveOptions || {};
    }

    public result(): RaidMoveResult {
        this.setOutputRaidState();
        this.setAffectedPokemon();
        this.setDamage();
        this.setDrain();
        this.setHealing();
        this.setSelfDamage();
        this.applyStatChanges();
        this.applyAilment();
        this.applyFieldChanges();
        this.applyDamage();
        this.applyItemEffects();        
        this.applyUniqueMoveEffects();
        this.applyAbilityEffects();
        this.setEndOfTurnDamage();
        this.applyEndOfTurnDamage();
        this.applyItemEffects();
        return {
            state: this._raidState,
            damage: this._damage,
            drain: this._drain,
            healing: this._healing,
            eot: this._eot,
            desc: this._desc,
        }
    }

    private setOutputRaidState() {
        this._raidState = this.raidState.clone();
        this._raiders = this._raidState.raiders;
        this._fields = this._raidState.fields;
        this._user = this._raiders[this.userID];
    }

    private setAffectedPokemon() {
        const targetType = this.moveData.target;
        if (targetType == "user") { this._affectedIDs = [this.userID]; }
        else if (targetType == "selected-pokemon" || targetType == "all-opponents") { this._affectedIDs = [this.targetID]; }
        else if (targetType == "all-allies") { this._affectedIDs = [0,1,2,3].splice(this.userID, 1); }
        else if (targetType == "user-and-allies") { this._affectedIDs = [0,1,2,3]; }
        else { this._affectedIDs = [this.targetID]; }
    }

    private getMoveField(atkID:number, defID: number) {
        const moveField = this.raidState.fields[atkID].clone();
        moveField.defenderSide = this.raidState.fields[defID].attackerSide.clone();
        return moveField;
    }

    private getPokemon(id: number) {
        return this._raiders[id];
    }

    private setDamage() {
        this._damage = [[0],[0],[0],[0],[0]];
        this._desc = ['','','','',''];
        const moveUser = this.getPokemon(this.userID);
        if ((this._fields[this.userID].terrain === "Electric" && moveUser.ability === "Quark Drive")  ||
            (this._fields[this.userID].weather === "Sun" && moveUser.ability === "Protosynthesis")
        ) {
            moveUser.abilityOn = true;
            const qpStat = getQPBoostedStat(moveUser) as StatIDExceptHP;
            moveUser.boostedStat = qpStat;
        }
        for (let id of this._affectedIDs) {
            const target = this.getPokemon(id);
            const moveField = this.getMoveField(this.userID, id);
            const hits = (this.moveData.maxHits || 1) > 1 ? this.options.hits : 1;
            const crit = this.options.crit || false;
            const calcMove = this.move.clone();
            calcMove.hits = hits || 1;
            calcMove.isCrit = crit;
            const result = calculate(9, moveUser, target, calcMove, moveField);
            this._damage[id] = typeof(result.damage) == "number" ? [result.damage] : result.damage as number[]; // TODO: find out when result.damage is a number[][]
            this._desc[id] = result.desc();
        }
        if (this.moveData.category?.includes("damage")) {
            this._fields[this.userID].attackerSide.isHelpingHand = false;
        }
    }

    private setDrain() { // this also accounts for recoil
        this._drain = [[0],[0],[0],[0],[0]]
        const drainPercent = this.moveData.drain;
        if (drainPercent) {
            // draining moves should only ever hit a single target in raids
            for (let i=0; i<this._damage.length; i++) {
                if (this._damage[i].length) {
                    this._drain[this.userID] = this._damage[i].map(d => Math.floor(d * drainPercent/100));
                    break;
                }
            }
        }
    }

    private setHealing() {
        this._healing = [[0],[0],[0],[0],[0]];
        const healingPercent = this.moveData.healing;
        for (let id of this._affectedIDs) {
            const target = this.getPokemon(id);
            const maxHP = target.maxHP();
            if (this.move.name == "Heal Cheer") {
                this._healing[id] = [Math.floor(maxHP * 0.2), maxHP];
            } else {
                const healAmount = Math.floor(target.maxHP() * (healingPercent || 0)/100);
                this._healing[id] = [healAmount];
            }
        }
    }

    private applyStatChanges() {
        this._boosts = [{},{},{},{},{}];
        const category = this.moveData.category;
        const affectedIDs = category == "damage+raise" ? [this.userID] : this._affectedIDs;
        const statChanges = this.moveData.statChanges;
        const chance = this.moveData.statChance || 100;
        if (this.options.secondaryEffects || chance === 100 ) {
            for (let id of affectedIDs) {
                const pokemon = this.getPokemon(id);
                const field = this._fields[id];
                if (id !== this.userID && this.moveData.category?.includes("damage") && pokemon.item === "Covert Cloak") { continue; }
                // handle Contrary and Simple
                const boostCoefficient = pokemon.ability == "Contrary" ? -1 : pokemon.ability == "Simple" ? 2 : 1;
                for (let statChange of (statChanges || [])) {
                    const stat = statChange.stat;
                    let change = statChange.change * boostCoefficient;
                    if (Number.isNaN(change)) {
                        // apparently, I manually put some stat changes are stored under the "value" key rather than "change"
                        // TODO: update the data files to fix this
                        // @ts-ignore
                        change = statChange.value * boostCoefficient;
                    }
                    if (Number.isNaN(change)) { console.log("Stat change info for " + this.moveData.name + " is missing."); continue; }
                    if (change < 0 && (field.attackerSide.isProtected || (field.attackerSide.isMist && id !== this.userID))) {
                        continue;
                    }
                    pokemon.boosts[stat] = (pokemon.boosts[statChange.stat] || 0) + change;
                    if (Math.abs(pokemon.boosts[stat]) > 6) {
                        pokemon.boosts[stat] = 6 * Math.sign(pokemon.boosts[stat]);
                    }
                    for (let stat in pokemon.boosts) {
                        // @ts-ignore
                        const diff = pokemon.boosts[stat] - this.raidState.raiders[id].boosts[stat]
                        if (diff !== 0) {
                            // @ts-ignore
                            this._boosts[id][stat] = diff;
                        }
                    }
                }
            }
        }
    }

    private applyAilment() {
        const ailment = this.moveData.ailment;
        const chance = this.moveData.ailmentChance || 100;
        if (ailment && (chance == 100 || this.options.secondaryEffects)) {
            for (let id of this._affectedIDs) {
                const pokemon = this.getPokemon(id);
                const field = this._fields[id];
                if (id !== this.userID && this.moveData.category?.includes("damage") && pokemon.item === "Covert Cloak") { continue; }
                // Type-based immunities (?)
                if (ailment == "burn" && pokemon.types.includes("Fire")) { continue; }
                if (ailment == "freeze" && pokemon.types.includes("Ice")) { continue; }
                if ((ailment == "poison" || ailment == "toxic") && (pokemon.types.includes("Poison") || pokemon.types.includes("Steel"))) { continue; }
                if (!(field.attackerSide.isProtected || field.attackerSide.isSafeguard)
                    && (hasNoStatus(pokemon))) 
                { 
                     pokemon.status = ailmentToStatus(ailment);
                }
            }
        }
    }

    private setSelfDamage() {
        const selfDamage = Math.floor(this._user.maxHP() * (this.moveData.selfDamage || 0));
        this._damage[this.userID] = this._damage[this.userID].map(d => d + selfDamage);
    }

    private applyFieldChanges() {
        /// Whole-Field Effects
        // Weather
        let weather: (Weather | undefined) = undefined;
        if (this.move.name == "Rain Dance") { weather = "Rain"; }
        if (this.move.name == "Sunny Day") { weather = "Sun"; }
        if (this.move.name == "Sandstorm") { weather = "Sand"; }
        if (this.move.name == "Snowscape") { weather = "Snow"; }
        // Terrain
        let terrain: (Terrain | undefined) = undefined;
        if (this.move.name == "Electric Terrain") { terrain = "Electric"; }
        if (this.move.name == "Grassy Terrain") { terrain = "Grassy"; }
        if (this.move.name == "Misty Terrain") { terrain = "Misty"; }
        if (this.move.name == "Psychic Terrain") { terrain = "Psychic"; }
        // Gravity
        const gravity = this.move.name == "Gravity";
        // Trick Room
        const trickroom = this.move.name == "Trick Room";
        // Magic Room
        const magicroom = this.move.name == "Magic Room";
        // Wonder Room
        const wonderroom = this.move.name == "Wonder Room";
        // apply effects
        for (let field of this._fields) {
            field.weather = weather || field.weather;
            field.terrain = terrain || field.terrain;
            field.isGravity = gravity || field.isGravity;
            field.isTrickRoom = (trickroom ? !field.isTrickRoom : field.isTrickRoom);
            field.isMagicRoom = (magicroom ? !field.isMagicRoom : field.isMagicRoom);
            field.isWonderRoom = (wonderroom ? !field.isWonderRoom : field.isWonderRoom);
        }
        /// Side Effects
        // Reflect
        let reflect = this.move.name == "Reflect";
        // Light Screen
        let lightscreen = this.move.name == "Light Screen";
        // Aurora Veil
        let auroraveil = this.move.name == "Aurora Veil";
        // Mist
        let mist = this.move.name == "Mist";
        // Safeguard
        let safeguard = this.move.name == "Safeguard";
        // Tailwind
        let tailwind = this.move.name == "Tailwind";
        // Attack Cheer
        let attackcheer = this.move.name == "Attack Cheer";
        // Defense Cheer
        let defensecheer = this.move.name == "Defense Cheer";
        // apply effects
        const sideFieldIDs = this.userID == 0 ? [0] : [1,2,3,4];
        for (let id of sideFieldIDs) {
            const field = this._fields[id];
            field.attackerSide.isReflect = reflect || field.attackerSide.isReflect;
            field.attackerSide.isLightScreen = lightscreen || field.attackerSide.isLightScreen;
            field.attackerSide.isAuroraVeil = auroraveil || field.attackerSide.isAuroraVeil;
            field.attackerSide.isMist = mist || field.attackerSide.isMist;
            field.attackerSide.isSafeguard = safeguard || field.attackerSide.isSafeguard;
            field.attackerSide.isTailwind = tailwind || field.attackerSide.isTailwind;
            field.attackerSide.isAtkCheered = attackcheer || field.attackerSide.isAtkCheered;
            field.attackerSide.isDefCheered = defensecheer || field.attackerSide.isDefCheered;
        }

        // Helping Hand
        const helpinghand = this.move.name == "Helping Hand";
        if (helpinghand) {
            this._fields[this.targetID].attackerSide.isHelpingHand = true;
        }
    }

    private applyUniqueMoveEffects() {
        /// Ability-affecting moves
        switch (this.move.name) {
            case "Skill Swap": 
                const ss_target = this.getPokemon(this.targetID);
                const tempUserAbility = this._user.ability;
                this._user.ability = ss_target.ability;
                ss_target.ability = tempUserAbility;
                break;
            case "Gastro Acid":
                const ga_target = this.getPokemon(this.targetID);
                ga_target.ability = undefined;
                break;
            case "Worry Seed":
                const ws_target = this.getPokemon(this.targetID);
                ws_target.ability = "Insomnia" as AbilityName;
                break;
            case "Role Play":
                const rp_target = this.getPokemon(this.targetID);
                this._user.ability = rp_target.ability;
                break;
            case "Simple Beam":
                const sb_target = this.getPokemon(this.targetID);
                sb_target.ability = "Simple" as AbilityName;
                break;
        /// Item-affecting moves
            case "Knock Off":
                const ko_target = this.getPokemon(this.targetID);
                ko_target.item = undefined;
                break;
            case "Trick":
                const trick_target = this.getPokemon(this.targetID);
                const tempUserItem = this._user.item;
                this._user.item = trick_target.item;
                trick_target.item = tempUserItem;
                break;
            case "Fling":
                const fl_target = this.getPokemon(this.targetID);
                const hasSimple = fl_target.ability === "Simple";
                const hasContrary = fl_target.ability === "Contrary";
                const boostCoefficient = hasSimple ? 2 : hasContrary ? -1 : 1;
                const flingItem = this._user.item;
                this._user.item = undefined;
                switch (flingItem) {
                    case "Light Ball":
                        if (hasNoStatus(fl_target)) { fl_target.status = "par"; }
                        break;
                    case "Flame Orb":
                        if (!fl_target.types.includes("Fire") && hasNoStatus(fl_target)) { fl_target.status = "brn"; }
                        break;
                    case "Toxic Orb":
                        if (!fl_target.types.includes("Poison") && hasNoStatus(fl_target)) { fl_target.status = "tox"; }
                        break
                    case "Poison Barb":
                        if (!fl_target.types.includes("Poison") && hasNoStatus(fl_target)) { fl_target.status = "psn"; }
                        break;
                    case "White Herb":
                        for (let stat in fl_target.boosts) {
                            // @ts-ignore
                            if (fl_target.boosts[stat] < 0) { fl_target.boosts[stat] = 0; }
                        }
                        break;
                    // Status-Curing Berries
                    case "Cheri Berry":
                        if (fl_target.status === "par") { fl_target.status = ""; }
                        break;
                    case "Chesto Berry":
                        if (fl_target.status === "slp") { fl_target.status = ""; }
                        break;
                    case "Pecha Berry":
                        if (fl_target.status === "psn") { fl_target.status = ""; }
                        break;
                    case "Rawst Berry":
                        if (fl_target.status === "brn") { fl_target.status = ""; }
                        break;
                    case "Aspear Berry":
                        if (fl_target.status === "frz") { fl_target.status = ""; }
                        break;
                    case "Lum Berry":
                        if (fl_target.status !== "") { fl_target.status = ""; }
                        break;
                    // Stat-Boosting Berries
                    case "Liechi Berry":
                        fl_target.boosts.atk = Math.max(-6, Math.min(6, fl_target.boosts.atk + boostCoefficient));
                        break;
                    case "Ganlon Berry":
                        fl_target.boosts.def = Math.max(-6, Math.min(6, fl_target.boosts.atk + boostCoefficient));
                        break;
                    case "Petaya Berry":
                        fl_target.boosts.spa = Math.max(-6, Math.min(6, fl_target.boosts.atk + boostCoefficient));
                        break;
                    case "Apicot Berry":
                        fl_target.boosts.spd = Math.max(-6, Math.min(6, fl_target.boosts.atk + boostCoefficient));
                        break;
                    case "Salac Berry":
                        fl_target.boosts.spe = Math.max(-6, Math.min(6, fl_target.boosts.atk + boostCoefficient));
                        break;
                    // Healing Berries
                    case "Sitrus Berry":
                        for (let heal in this._healing[this.targetID]) {
                            heal += Math.floor(fl_target.maxHP() / 4);
                        }
                        break;
                    default: break;
                    }
                break;
            // other
            case "Endure":
                this._user.isEndure = true;
                break;
            case "Psych Up":
                const pu_target = this.getPokemon(this.targetID);
                for (let stat in pu_target.boosts) {
                    // @ts-ignore
                    this._user.boosts[stat] = pu_target.boosts[stat];
                }
                break;
            case "Power Swap":
                const ps_target = this.getPokemon(this.targetID);
                const tempUserAtkBoosts = this._user.boosts;
                this._user.boosts.atk = ps_target.boosts.atk;
                this._user.boosts.spa = ps_target.boosts.spa;
                ps_target.boosts.atk = tempUserAtkBoosts.atk;
                ps_target.boosts.spa = tempUserAtkBoosts.spa;
                break;
            case "Guard Swap":
                const gs_target = this.getPokemon(this.targetID);
                const tempUserDefBoosts = this._user.boosts;
                this._user.boosts.def = gs_target.boosts.def;
                this._user.boosts.spd = gs_target.boosts.spd;
                gs_target.boosts.def = tempUserDefBoosts.def;
                gs_target.boosts.spd = tempUserDefBoosts.spd;
                break;
            case "Power Trick":
                const tempAtk = this._user.stats.atk;
                this._user.stats.atk = this._user.stats.def;
                this._user.stats.def = tempAtk;
                break;
            default: break;
            }
    }

    private applyAbilityEffects() {
        /// Ability-related effects
        // Anger Point
        if (this.move.isCrit) {
            for (let id of this._affectedIDs) {
                const pokemon = this.getPokemon(id);
                if (pokemon.ability === "Anger Point") { pokemon.boosts.atk = 6 };
            }
        }
        // Justified
        if (this.move.type === "Dark") {
            for (let id of this._affectedIDs) {
                const pokemon = this.getPokemon(id);
                if (pokemon.ability === "Justified" && this._damage[id][0]>0) { 
                    pokemon.boosts.atk = Math.min(6, pokemon.boosts.atk + this.move.hits); 
                }
            }
        }    
        // Unburden
        if (this._user.ability === "Unburden" && 
            this._user.item === undefined && 
            this.raidState.raiders[this.userID].item !== undefined) 
        {
            this._user.abilityOn = true;
        }
        // Weak Armor
        for (let id of this._affectedIDs) {
            const pokemon = this.getPokemon(id);
            if (this._damage[id][0] > 0 && pokemon.ability === "Weak Armor") {
                pokemon.boosts.def = Math.max(-6, pokemon.boosts.def - 1);
                pokemon.boosts.spe = Math.min(6, pokemon.boosts.spe + 2);
            }
        }
    }

    private applyItemEffects() {
        /// Item-related effects
        // Focus Sash
        for (let id of this._affectedIDs) {
            const pokemon = this.getPokemon(id);
            if (pokemon.item === "Focus Sash") {
                if (this._damage[id][0] >= pokemon.maxHP() && this.raidState.raiders[id].originalCurHP === pokemon.maxHP()) { 
                    pokemon.item = undefined; 
                    pokemon.originalCurHP = 1;
                }
            }
        }
        // Mirror Herb
        for (let pokemon of this._raiders.slice(1)) { // let's not worry about a Raid boss with an item
            const bossBoosts = this._boosts[0];
            if (pokemon.item === "Mirror Herb" && bossBoosts !== undefined) {
                let changed = false;
                for (let stat in bossBoosts) {
                    // @ts-ignore
                    if (bossBoosts[stat] !== 0) { 
                        changed = true;
                        // @ts-ignore
                        pokemon.boosts[stat] = Math.max(-6, Math.min(6, pokemon.boosts[stat] + bossBoosts[stat])); }
                }
                if (changed) { pokemon.item = undefined; } // the herb is consumed if a boost is copied.
            }
        }
        // Weakness Policy and Super-Effective reducing Berries
        //  TO DO - abilities that let users use berries more than once
        for (let id of this._affectedIDs) {
            const pokemon = this.getPokemon(id);
            if (this._damage[id][0] > 0 && isSuperEffective(this.move, this._fields[id], this._user, pokemon)) {
                switch (pokemon.item) {
                    case "Weakness Policy":
                        pokemon.boosts.atk = Math.min(6, pokemon.boosts.atk + 2);
                        pokemon.boosts.spa = Math.min(6, pokemon.boosts.spa + 2);
                        pokemon.item = undefined;
                        break;
                    case "Occa Berry":  // the calc alread takes the berry into account, so we can just remove it here
                        if (this.move.type === "Fire") { pokemon.item = undefined; }
                        break;
                    case "Passho Berry":
                        if (this.move.type === "Water") { pokemon.item = undefined; }
                        break;
                    case "Wacan Berry":
                        if (this.move.type === "Electric") { pokemon.item = undefined; }
                        break;
                    case "Rindo Berry":
                        if (this.move.type === "Grass") { pokemon.item = undefined; }
                        break;
                    case "Yache Berry":
                        if (this.move.type === "Ice") { pokemon.item = undefined; }
                        break;
                    case "Chople Berry":
                        if (this.move.type === "Fighting") { pokemon.item = undefined; }
                        break;
                    case "Kebia Berry":
                        if (this.move.type === "Poison") { pokemon.item = undefined; }
                        break;
                    case "Shuca Berry":
                        if (this.move.type === "Ground") { pokemon.item = undefined; }
                        break;
                    case "Coba Berry":
                        if (this.move.type === "Flying") { pokemon.item = undefined; }
                        break;
                    case "Payapa Berry":
                        if (this.move.type === "Psychic") { pokemon.item = undefined; }
                        break;
                    case "Tanga Berry":
                        if (this.move.type === "Bug") { pokemon.item = undefined; }
                        break;
                    case "Charti Berry":
                        if (this.move.type === "Rock") { pokemon.item = undefined; }
                        break;
                    case "Kasib Berry":
                        if (this.move.type === "Ghost") { pokemon.item = undefined; }
                        break;
                    case "Haban Berry":
                        if (this.move.type === "Dragon") { pokemon.item = undefined; }
                        break;
                    case "Colbur Berry":
                        if (this.move.type === "Dark") { pokemon.item = undefined; }
                        break;
                    case "Babiri Berry":
                        if (this.move.type === "Steel") { pokemon.item = undefined; }
                        break;
                    case "Roseli Berry":
                        if (this.move.type === "Fairy") { pokemon.item = undefined; }
                        break;
                    default: break;
                }
            }
        }
        // Ailment-inducing Items
        if (hasNoStatus(this._user)) {
            switch (this._user.item) {
                case "Light Ball":
                    this._user.status = "par";
                    break;
                case "Flame Orb":
                    if (!this._user.types.includes("Fire")) { 
                        this._user.status = "brn"; 
                        this._user.item = undefined; 
                    }
                    break;
                case "Toxic Orb":
                    if (!this._user.types.includes("Poison")) { 
                        this._user.status = "tox"; 
                        this._user.item = undefined;
                    }
                    break;
                case "Poison Barb":
                    if (!this._user.types.includes("Poison")) { 
                        this._user.status = "psn"; 
                        this._user.item = undefined;
                    }
                    break;
                case "White Herb":
                    for (let stat in this._user.boosts) {
                        let changed = false;
                        // @ts-ignore
                        if (this._user.boosts[stat] < 0) { this._user.boosts[stat] = 0; changed = true; }
                        if (changed) { this._user.item = undefined; }
                    }
                    break;
                default: break
            }
        }
        // Other Berry Consumption
        for (let i=0; i<5; i++) {
            if (this._damage[i][0] > 0) {
                if (this._raiders[i].item === "Sitrus Berry" && this._raiders[i].originalCurHP <= Math.floor(this._raiders[i].maxHP() / 2)) {
                    this._raiders[i].item = undefined;
                    this._raiders[i].originalCurHP += Math.floor(this._raiders[i].maxHP() / 4);
                }
            }
        }
        // Booster Energy
        if (this._user.item === "Booster Energy" && (this._user.ability === "Protosynthesis" || this._user.ability === "Quark Drive")) {
            this._user.abilityOn = true;
            const qpStat = getQPBoostedStat(this._user) as StatIDExceptHP;
            this._user.boostedStat = qpStat;
            this._user.item = undefined;
        }
        // ???
    }

    private setEndOfTurnDamage() {
        this._eot = [undefined, undefined, undefined, undefined];
        // getEndOfTurn() calculates damage for a defending pokemon. 
        // Here, we'll evaluate end-of-turn damage for both the user and boss only when the move does not go first
        // positive eot indicates healing
        if (!this.movesFirst) {
            const atkID = this.userID;
            const defID = this.userID == 0 ? this.raiderID : 0;
            const attacker = this._user;
            const defender = this.getPokemon(defID)
            const atk_eot = getEndOfTurn(gen, attacker, defender, dummyMove, this.getMoveField(attacker.id, defender.id));
            const def_eot = getEndOfTurn(gen, defender, attacker, dummyMove, this.getMoveField(defender.id, attacker.id));
            this._eot[defID] = atk_eot;
            this._eot[atkID] = def_eot;
        }
    }

    private applyDamage() {
        const roll = this.options.roll || "avg";
        for (let id=0; id<5; id++) {
            const pokemon = this.getPokemon(id);
            let damage = 0;
            let drain = 0;
            let healing = 0;
            if (roll === "min") {
                damage = this._damage[id][0];
                drain = this._drain[id][0];
                healing = this._healing[id][0];
            } else if (roll === "max") {
                damage = this._damage[id][this._damage[id].length - 1];
                drain = this._drain[id][this._drain[id].length - 1];
                healing = this._healing[id][this._healing[id].length - 1];
            } else {
                damage = Math.floor(this._damage[id].reduce((a,b) => a+b, 0) / this._damage[id].length);
                drain = Math.floor(this._drain[id].reduce((a,b) => a+b, 0) / this._drain[id].length);
                healing = Math.floor(this._healing[id].reduce((a,b) => a+b, 0) / this._healing[id].length);
            }
            pokemon.originalCurHP = Math.max(0, pokemon.originalCurHP - damage);
            if (pokemon.isEndure && pokemon.originalCurHP <= 0) {
                pokemon.originalCurHP = 1;
            }
            if (pokemon.originalCurHP !== 0) {
                pokemon.originalCurHP = Math.min(pokemon.maxHP(), Math.max(0, pokemon.originalCurHP + drain));
            }
            if (pokemon.isEndure && pokemon.originalCurHP <= 0) {
                pokemon.originalCurHP = 1;
            }
            if (pokemon.originalCurHP !== 0) {
                pokemon.originalCurHP = Math.min(pokemon.maxHP(), pokemon.originalCurHP + healing);
            }
        }
    }

    private applyEndOfTurnDamage() {
        for (let i=0; i<5; i++) {
            const pokemon = this.getPokemon(i);
            const damage = this._eot[i] ? -this._eot[i]!.damage : 0;
            if (damage > 0 && pokemon.originalCurHP > 0) {
                pokemon.originalCurHP = Math.max(0, pokemon.originalCurHP - damage);
            } 
            if (pokemon.isEndure && pokemon.originalCurHP <= 0) {
                pokemon.originalCurHP = 1;
            }
            if (damage < 0 && pokemon.originalCurHP > 0 && pokemon.originalCurHP < pokemon.maxHP()) {
                pokemon.originalCurHP = Math.min(pokemon.maxHP(), pokemon.originalCurHP - damage);
            }
        }
    }

    // private handleFlags() {
    //     //
    // }
}
