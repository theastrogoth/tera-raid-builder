import { Move, Field, Pokemon, StatsTable, StatID, Generations, calculate} from "../calc";
import { getEndOfTurn } from "../calc/desc";
import { RaidState, Raider, AilmentName, MoveData, RaidMoveResult } from "./interface";
import { StatusName, Terrain, Weather } from "../calc/data/interface";

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

// we'll always use generation 9
const gen = Generations.get(9);
const dummyMove = new Move(gen, "Splash");

export class MoveEffect {
    move: Move;
    moveData: MoveData;
    raidState: RaidState;
    userID: number;     // the id of the user of this move
    targetID: number;   // the id of the target of this move
    raiderID: number;   // the id of the raider who initiated this round
    movesFirst: boolean;
    secondaryEffects: boolean;
    roll: "max" | "min" | "avg";

    _raidState!: RaidState;
    _raiders!: Raider[];
    _user!: Raider;
    _affectedIDs!: number[];
    _fields!: Field[];

    _damage!: number[][];
    _healing!: number[][];
    _drain!: number[][];
    _eot!: ({damage: number, texts: string[]} | undefined)[];

    _desc!: string[];

    constructor(moveData: MoveData, move: Move, raidState: RaidState, userID: number, targetID: number, raiderID: number, movesFirst: boolean,  secondaryEffects?: boolean, roll?: "max" | "min" | "avg") {
        this.move = move;
        this.moveData = moveData;
        this.raidState = raidState;
        this.userID = userID;
        this.targetID = targetID;
        this.raiderID = raiderID;
        this.movesFirst = movesFirst;
        this.secondaryEffects = secondaryEffects || false;
        this.roll = roll || "avg";
    }

    public result(): RaidMoveResult {
        this.setOutputRaidState();
        this.setAffectedPokemon();
        this.setDamage();
        this.setDrain();
        this.setHealing();
        this.applyStatChanges();
        this.applyAilment();
        this.applySelfDamage();
        this.applyOtherEffects();
        this.applyFieldChanges();
        this.setEndOfTurnDamage();
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
        this._raidState = structuredClone(this.raidState);
        this._raiders = this._raidState.raiders;
        this._fields = this._raidState.fields;
    }

    private setAffectedPokemon() {
        const targetType = this.moveData.target;
        if (targetType == "user") { this._affectedIDs = [this.userID]; }
        if (targetType == "selected-pokemon" || targetType == "all-opponents") { this._affectedIDs = [this.targetID]; }
        if (targetType == "all-allies") { this._affectedIDs = [0,1,2,3].splice(this.userID, 1); }
        if (targetType == "user-and-allies") { this._affectedIDs = [0,1,2,3]; }
    }

    private getMoveField(atkID:number, defID: number) {
        const moveField = structuredClone(this.raidState.fields[atkID]);
        moveField.defenderSide = structuredClone(this.raidState.fields[defID].defenderSide);
        return moveField;
    }

    private getPokemon(id: number) {
        return this._raiders[id];
    }

    private setDamage() {
        this._damage = [[0],[0],[0],[0],[0]];
        this._desc = ['','','','',''];
        for (let id of this._affectedIDs) {
            const target = this.getPokemon(id);
            const moveField = this.getMoveField(this.userID, id);
            const result = calculate(9, this._user, target, this.move, moveField);
            this._damage[id] = typeof(result.damage) == "number" ? [result.damage] : result.damage as number[]; // TODO: find out when result.damage is a number[][]
            this._desc[id] = result.desc();
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
                const healAmount = Math.floor(target.maxHP() * healingPercent/100);
                this._healing[id] = [healAmount];
            }
        }
    }

    private applyStatChanges() {
        const category = this.moveData.category;
        const affectedIDs = category == "damage+raise" ? [this.userID] : this._affectedIDs;
        const statChanges = this.moveData.statChanges;

        for (let id of affectedIDs) {
            const pokemon = this.getPokemon(id);
            const field = this._fields[id];
            for (let statChange of statChanges) {
                const stat = statChange.stat;
                const change = statChange.change;
                if (change < 0 && (field.attackerSide.isProtected || (field.attackerSide.isMist && id !== this.userID))) {
                    continue;
                }
                pokemon.boosts[stat] = (pokemon.boosts[statChange.stat] || 0) + change;
                if (Math.abs(pokemon.boosts[stat]) > 6) {
                    pokemon.boosts[stat] = 6 * Math.sign(pokemon.boosts[stat]);
                }
            }
        }
    }

    private applyAilment() {
        const ailment = this.moveData.ailment;
        const ailmentChance = this.moveData.ailmentChance;
        if (ailment && (ailmentChance == 100 || this.secondaryEffects)) {
            for (let id of this._affectedIDs) {
                const pokemon = this.getPokemon(id);
                const field = this._fields[id];
                if (!(field.attackerSide.isProtected || field.attackerSide.isSafeguard)
                    && (pokemon.status == "" || pokemon.status === undefined)) 
                { 
                     pokemon.status = ailmentToStatus(ailment);
                }
            }
        }
    }

    private applySelfDamage() {
        const selfDamage = Math.floor(this._user.maxHP() * this.moveData.selfDamage);
        this._damage[this.userID] = this._damage[this.userID].map(d => d + selfDamage);
    }

    private applyOtherEffects() {
        ///// TO DO /////
        /// Ability-affecting moves
        // Skill Swap
        // Gastro Acid
        // Worry Seed
        // Role Play
        // Simple Beam

        /// Item-affecting moves
        // Knock Off
        // Magic Room

        /// Item consumption
        // Unburden
        // Symbiosis
        // Berries
        // Weakness Policy

        /// Ability-related effects
        // Anger Point
        // Contrary
        // Simple
        // Justified
    
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
        // apply effects
        for (let field of this._fields) {
            field.weather = weather || field.weather;
            field.terrain = terrain || field.terrain;
            field.isGravity = gravity || field.isGravity;
            field.isTrickRoom = (trickroom ? !field.isTrickRoom : field.isTrickRoom);
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
    }

    private setEndOfTurnDamage() {
        this._eot = [undefined, undefined, undefined, undefined];
        // getEndOfTurn() calculates damage for a defending pokemon. 
        // Here, we'll evaluate end-of-turn damage for both the user and boss only when the move does not go first
        // positive eot indicates healinging
        if (!this.movesFirst) {
            const atkID = this.userID;
            const defID = this.userID == 0 ? this.raiderID : 0;
            const attacker = this._user;
            const defender = this.getPokemon(defID)
            const atk_eot = getEndOfTurn(gen, attacker, defender, dummyMove, this.getMoveField(attacker.id, defender.id));
            const def_eot = getEndOfTurn(gen, defender, attacker, dummyMove, this.getMoveField(defender.id, attacker.id));
            this._eot[atkID] = atk_eot;
            this._eot[defID] = def_eot;
        }
    }

    // private handleFlags() {
    //     //
    // }
}
