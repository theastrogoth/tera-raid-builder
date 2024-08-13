import { Move, Field, StatsTable, calculate} from "../calc";
import { MoveData, RaidMoveOptions } from "./interface";
import { RaidState } from "./RaidState";
import { Raider } from "./Raider";
import { AbilityName, ItemName, MoveName, SpeciesName, StatIDExceptHP, StatusName, TypeName } from "../calc/data/interface";
import { isGrounded } from "../calc/mechanics/util";
import { absoluteFloor, isSuperEffective, pokemonIsGrounded, isStatus, getAccuracy, getBpModifier, isRegularMove, isRaidAction, getCritChance } from "./util";
import { getRollCounts, catRollCounts, combineRollCounts } from "./rolls"
import persistentAbilities from "../data/persistent_abilities.json"
import bypassProtectMoves from "../data/bypass_protect_moves.json"
import chargeMoves from "../data/charge_moves.json";
import rechargeMoves from "../data/recharge_moves.json";
import magicBounceMoves from "../data/magicbounce_moves.json";
import thawUserMoves from "../data/thaw_user_moves.json";

export type RaidMoveResult= {
    state: RaidState;
    userID: number;
    targetID: number;
    damage: number[];
    drain: number[];
    healing: number[];
    desc: string[];
    flags: string[][];
    causesFlinch: boolean[];
    isSpread?: boolean;
    warnings?: string[];
}

const nonMoveActions = ["(No Move)","Attack Cheer","Defense Cheer","Heal Cheer","Clear Boosts / Abilities","Remove Negative Effects","Steal Tera Charge","Activate Shield"];
const ignoredVolatileStatuses = [
    "banefulbunker",
    "burningbulwark",
    "charge",
    "defensecurl",
    "destinybond",
    "protect",
    "dragoncheer",
    "electrify",
    "embargo",
    "endure",
    "flinch",
    "focusenergy",
    "followme",
    "foresight",
    "gastroacid",
    "grudge",
    "helpinghand",
    "partiallytrapped",
    "imprison",
    "kingsshield",
    "laserfocus",
    "magiccoat",
    "maxguard",
    "minimize",
    "miracleeye",
    "nightmare",
    "noretreat",
    "obstruct",
    "octolock",
    "no-type-immunity",
    "powder",
    "powershift",
    "powertrick",
    "protect",
    "ragepowder",
    "substitute",
    "silktrap",
    "smackdown",
    "snatch",
    "sparklingaria",
    "spikyshield",
    "spotlight",
    "syrupbomb",
    "telekinesis",
]

const healCheerRoll = Array.from(Array(16).keys()).map((i) => (0.2 + 0.8 * i/15));

export class RaidMove {
    move: Move;
    moveData: MoveData;
    raidState: RaidState;
    userID: number;     // the id of the user of this move
    targetID: number;   // the id of the target of this move
    raiderID: number;   // the id of the raider who initiated this round
    movesFirst: boolean;
    options: RaidMoveOptions;
    hits: number;
    isBossAction?: boolean;
    flinch?: boolean;
    damaged?: boolean;
    delayed?: boolean;
    instructed?: boolean;

    _raidState!: RaidState;
    _raiders!: Raider[];
    _user!: Raider;
    _affectedIDs!: number[];
    _fields!: Field[];

    _targetID!: number; // the id of the target can be affected by Magic Bounce
    _doesNotAffect!: (string | undefined)[];
    _causesFlinch!: boolean[];
    _blockedBy!: (string | undefined)[];

    _isSheerForceBoosted?: boolean;

    _flingItem?: ItemName;
    _powerHerbUsed?: boolean;

    _moveType!: TypeName;
    _isSpread?: boolean;
    _damage!: number[];
    _damageRolls!: Map<number,number>[][];
    _healing!: number[];
    _drain!: number[];

    _desc!: string[];
    _flags!: string[][];
    _warnings!: string[];

    constructor(moveData: MoveData, move: Move, raidState: RaidState, userID: number, targetID: number, raiderID: number, movesFirst: boolean,  raidMoveOptions?: RaidMoveOptions, isBossAction?: boolean, flinch?: boolean, damaged?: boolean, instructed?: boolean, delayed?: boolean) {
        this.move = move;
        this.moveData = moveData;
        this.raidState = raidState;
        this.userID = userID;
        this.targetID = targetID;
        this.raiderID = raiderID;
        this.movesFirst = movesFirst;
        this.options = raidMoveOptions || {};
        this.isBossAction = isBossAction || false;
        this.flinch = flinch || false;
        this.damaged = damaged || false;
        this.instructed = instructed || false;
        this.delayed = delayed || false;
        this.hits = this.move.category === "Status" ? 0 : Math.max(this.moveData.minHits || 1, Math.min(this.moveData.maxHits || 1, this.options.hits || 1));
        this.hits = this.raidState.raiders[this.userID].hasAbility("Skill Link") ? (this.moveData.maxHits || 1) : this.hits;
    }

    public result(): RaidMoveResult {
        this.setOutputRaidState();
        if (!this.checkIfMoves()) {
            const output = this.output;
            return output;
        }
        this._raidState.raiders[0].checkShield(); // check for shield activation
        this.checkSheerForce();
        this.setAffectedPokemon();
        if ( // prevent the boss from moving if it's shield has just been broken
            this.userID === 0 && 
            this._user.shieldBreakStun &&
            this._user.shieldBreakStun![this._targetID-1]
        ) {
            this._desc[this.userID] = this._user.name + " is stunned after having its shield broken!";         
            this._user.shieldBreakStun![this._targetID-1] = false;           
        } else if ( // don't move yet for charge moves
            !this._user.isCharging &&
            chargeMoves.includes(this.move.name) &&
            !(this._user.field.hasWeather("Sun") && ["Solar Beam", "Solar Blade"].includes(this.move.name)) &&
            !(this._user.field.hasWeather("Rain") && this.move.name === "Electro Shot") &&
            !this._user.hasItem("Power Herb")
        ) {
            this._user.isCharging = true;
            this._desc[this.userID] = this._user.name + " is charging its attack!";
            // Electro Shot boost check
            if (this.moveData.name === "Electro Shot") {
                this._raidState.applyStatChange(this.userID, {spa: 1});
            }
            if (this.moveData.name === "Meteor Beam" && !this._isSheerForceBoosted) {
                this._raidState.applyStatChange(this.userID, {spa: 1});
            }
        } else if (this._user.isRecharging) {
            this._user.isRecharging = false;
            this._desc[this.userID] = this._user.name + " is recharging!";
        } else if (!this.delayed && (this.move.name === "Future Sight" || this.move.name === "Doom Desire")) { // Delayed move check
            const target = this.getPokemon(this._targetID);
            if (target.delayedMoveCounter) {
                this._desc[this.userID] = this._user.name + " " + this.move.name + " vs. " + this._raidState.getPokemon(this._targetID).name + " — " + this.move.name + " failed!";
            } else {
                target.delayedMoveCounter = 3;
                target.delayedMoveSource = this.userID;
                target.delayedMove = this.moveData;
                if (this.moveData.name === "Future Sight") {
                    this._desc[this.userID] = this._user.name + " forsaw an attack!";
                } else {
                    this._desc[this.userID] = this._user.name + " chose Doom Desire as its destiny!";
                }
            }
        } else {
            if (!this._user.isCharging && 
                chargeMoves.includes(this.move.name) && 
                !(this._user.field.hasWeather("Sun") && ["Solar Beam", "Solar Blade"].includes(this.move.name)) &&
                !(this._user.field.hasWeather("Rain") && this.move.name === "Electro Shot") &&
                this._user.hasItem("Power Herb")
            ) {
                this._powerHerbUsed = true;
                // this._raidState.loseItem(this.userID); // Power Herb is consumed after the move is used for the purposes of Symbiosis
            }
            this.setMoveType();
            this.setDoesNotAffect();
            this.checkProtection();
            this.applyProtection();
            this.applyPreDamageEffects();
            this.applyDamage();
            this.applyDrain();
            this.applyHealing();
            this.applySelfDamage();
            this.applyFlinch();
            this.applyStatChanges();
            this.applyAilment();
            this.applyFieldChanges();
            this.applyOtherMoveEffects();
            this.applyUniqueMoveEffects();
            this._user.isCharging = false;
            if (rechargeMoves.includes(this.move.name)) {
                this._user.isRecharging = true;
            }
            if (this._powerHerbUsed && this._user.hasItem("Power Herb")) {
                this._raidState.consumeItem(this.userID, this._user.item!);
            }
            this.applyPostMoveEffects();
        }
        this._raidState.raiders[0].checkShield(); // check for shield breaking 
        this.setFlags();
        // store move data and target
        if (isRegularMove(this.moveData.name)) { // don't store cheers or (No Move) for Instruct/Mimic/Copycat
            this._user.lastMove = this.moveData;
            this._user.lastTarget = this.moveData.target === "user" ? this.userID : this._targetID;
            this._raidState.lastMovedID = this.userID;
            // remove Micle boost
            this._user.isMicle = false;
            if (this.userID !== 0) {
                this._raidState.raiders[this.raiderID].isMicle = false; // in case of Instruct
            }
        }
        return this.output;
    }

    public get output(): RaidMoveResult {
        return {
            state: this._raidState,
            userID: this.userID,
            targetID: this.targetID,
            damage: this._damage,
            drain: this._drain,
            healing: this._healing,
            desc: this._desc,
            flags: this._flags,
            causesFlinch: this._causesFlinch,
            isSpread: this._isSpread,
            warnings: this._warnings,
        }
    }

    private setOutputRaidState() {
        this._raidState = this.raidState.clone();
        this._raiders = this._raidState.raiders;
        this._fields = this._raidState.fields;
        this._user = this._raiders[this.userID];
        this._targetID = this.targetID;

        // initialize arrays
        this._doesNotAffect = [undefined, undefined, undefined, undefined, undefined];
        this._blockedBy= [undefined, undefined, undefined, undefined, undefined];
        this._causesFlinch = [false, false, false, false, false];
        this._moveType = this.move.type;
        this._damage = [0,0,0,0,0];
        this._damageRolls = [[],[],[],[],[]];
        this._drain = [0,0,0,0,0];
        this._healing = [0,0,0,0,0];
        this._desc = ['','','','',''];
        this._flags=[[],[],[],[],[]];
        this._warnings = [];
    }

    private checkIfMoves(): boolean {
        // in the case of instruct, check the Instruct user first, and then the intstructed Pokemon
        const monsToCheck = (this.userID && (this.raiderID !== this.userID)) ? [this._raidState.getPokemon(this.raiderID), this._user] : [this._user];
        for (let mon of monsToCheck) {
            if (mon.originalCurHP === 0) {
                if (mon.id !== 0) {
                    this._warnings.push(mon.name + " fainted before moving.");
                }
                return false;
            } else if (this.isBossAction && mon.id !== 0) {
                return false;
            } else if (isRaidAction(this.moveData.name)) {
                return true;
            } else if (this.flinch) {
                this._desc[mon.id] = mon.name + " flinched!";
                if (mon.id !== 0) {
                    this._warnings.push(mon.name + " flinched and skips its move.");
                }
                return false;
            } else {
                if (mon.isSleep) {
                    this._desc[mon.id] = mon.name + " is fast asleep.";
                    mon.isSleep--; // decrement sleep counter
                    // mon.lastMoveFailed = true;
                    this._warnings.push(mon.name + " is asleep and skips its move.");
                    return false;
                } else if (mon.isFrozen && !thawUserMoves.includes(this.move.name)) {
                    this._desc[mon.id] = mon.name + " is frozen solid.";
                    mon.isFrozen--; // decrement frozen counter
                    // mon.lastMoveFailed = true;
                    this._warnings.push(mon.name + " is frozen and skips its move.");
                    return false;
                } else if (
                    mon.isTaunt && 
                    this.move.category === "Status" && 
                    !isRaidAction(this.moveData.name)
                ) {
                    this._desc[mon.id] = mon.name + " can't use status moves due to Taunt!";
                    mon.isTaunt--; // decrement taunt counter
                    // mon.lastMoveFailed = true;
                    this._warnings.push(mon.name + " is taunted and can't use " + this.moveData.name + ".");
                    return false;
                } else if (mon.isDisable && this.move.name === mon.disabledMove) {
                    this._desc[mon.id] = this.move.name + " is disabled!";
                    // mon.lastMoveFailed = true;
                    this._warnings.push(this.moveData.name + " is disabled and can't be used.");
                    return false;
                } else if (mon.isThroatChop && this.moveData.isSound) {
                    this._desc[mon.id] = mon.name + " can't use sound-based moves due to Throat Chop!";
                    // mon.lastMoveFailed = true;
                    this._warnings.push("Throat Chop prevents the use of " + this.moveData.name + ".");
                    return false;
                } else if (mon.status === "par" && this.options.allowMiss && 
                    ((mon.id !== 0 && this.targetID !== 0 && this.moveData.moveCategory !== "Status") ? this.options.roll === "max" : this.options.roll === "min")
                ) {
                    this._desc[mon.id] = mon.name + " is fully paralyzed and can't move!";
                    // mon.lastMoveFailed = true;
                    this._warnings.push(mon.name + " is fully paralyzed and can't move.");
                    return false;
                } else if (mon.volatileStatus.includes("confusion") && this.options.allowMiss && 
                    ((mon.id !== 0 && this.targetID !== 0 && this.moveData.moveCategory !== "Status") ? this.options.roll === "max" : this.options.roll === "min")
                ) {
                    // mon.lastMoveFailed = true;
                    this.applyConfusionDamage();                
                    return false;
                } else {
                    if (mon.status === "par") {
                        this._warnings.push("Paralysis may prevent " + mon.name + " from moving.");
                    } else if (mon.volatileStatus.includes("confusion")) {
                        this._warnings.push("Confusion may prevent " + mon.name + " from moving.");
                    }
                }
            }
        }
        return true;
    }

    private applyConfusionDamage() {
        const confusedPoke = this._user.clone();
        if (confusedPoke.hasAbility("Pure Power", "Huge Power", "Super Luck")) {
            confusedPoke.ability = "(No Ability)" as AbilityName;
        }
        if (confusedPoke.boostedStat === "atk") {
            confusedPoke.boostedStat = undefined;
        }
        if (confusedPoke.hasItem("Life Orb", "Choice Band", "Light Ball", "Thick Club")) {
            confusedPoke.item = undefined;
        }
        confusedPoke.isPumped = 0;
        const field = new Field();
        const move = new Move(9, "hurt itself in its confusion");
        console.log(move)
        const res = calculate(9, confusedPoke, confusedPoke, move, field);
        const damage = res.damage as number[];
        const damageVal = this.options.roll === "max" ? damage[damage.length-1] : this.options.roll === "min" ? damage[0] : damage[Math.floor(damage.length/2)];
        const roll = getRollCounts([damage], 0, confusedPoke.maxHP(), [1])
        this._damage[this.userID] = damageVal;
        this._desc[this.userID] = res.desc();
        this._warnings.push(this._user.name + " hurt itself in its confusion.");
        this._raidState.applyDamage(this.userID, damageVal, roll, 1, false, false, "???", "Physical", false, false, true, false);
    }

    private checkSheerForce() {
        this._isSheerForceBoosted = (
            this._user.hasAbility("Sheer Force") && (
                this.move.secondaries || 
                ((this.moveData.flinchChance || 0) > 0) ||
                (this.moveData.category === "damage+ailment") ||
                (this.moveData.category === "damage+lower" && Object.values(this.moveData.statChanges!).some((val) => val.change < 0)) ||
                (this.moveData.category === "damage+raise" && Object.values(this.moveData.statChanges!).some((val) => val.change > 0)) ||
                ["Anchor Shot","Ceaseless Edge","Eerie Spell","Genesis Supernova","Secret Power","Sparkling Aria","Spirit Shackle","Stone Axe","Electro Shot"].includes(this.moveData.name)
            )
        );
    }

    private setAffectedPokemon() {
        const targetType = this.moveData.target;
        if (this.moveData.name === "Heal Cheer") { this._affectedIDs = [1,2,3,4]; }
        else if (targetType === "user") { this._affectedIDs = [this.userID]; }
        else if (this.isBossAction && (targetType === "all-other-pokemon" || targetType === "all-opponents")) { this._affectedIDs = [1,2,3,4]; }
        else if (targetType === "selected-pokemon" || targetType === "all-opponents" || targetType === "all-other-pokemon") { this._affectedIDs = [this._targetID]; }
        else if (targetType === "all-allies") { this._affectedIDs = this.userID === 0 ? [] : [1,2,3,4].filter((i) => i !== this.userID); }
        else if (targetType === "user-and-allies") { this._affectedIDs = this.userID === 0 ? [0] : [1,2,3,4]; }
        else if (["users-field", "allies-field", "entire-field"].includes(targetType || "")) { this._affectedIDs = [this.userID]; } // make user the target for the purposes of generating the desc
        else { this._affectedIDs = [this._targetID]; }
    }

    private setMoveType() {
        switch (this.move.name) {
            case "Weather Ball":
                const wbField = this._raidState.fields[this.userID];
                this._moveType =
                    wbField.hasWeather('Sun', 'Harsh Sunshine') && !this._user.hasItem("Utility Umbrella") ? 'Fire'
                    : wbField.hasWeather('Rain', 'Heavy Rain') && !this._user.hasItem("Utility Umbrella") ? 'Water'
                    : wbField.hasWeather('Sand') ? 'Rock'
                    : wbField.hasWeather('Hail', 'Snow') ? 'Ice'
                    : 'Normal';
                return;
            case "Judgment":
                if (this._user.name.includes("Arceus")) {
                    this._moveType = this._user.types[0];
                }
                return;
            case "Revelation Dance": 
                this._moveType = this._user.types[0];
                return;
            case "Aura Wheel":
                this._moveType = this._user.named("Morpeko-Hangry") ? "Dark" : "Electric";
                return;
            case "Raging Bull":
                this._moveType =  this._user.named("Tauros-Paldea-Combat") ? "Fighting" :
                            this._user.named("Tauros-Paldea-Blaze") ? "Fire" :
                            this._user.named("Tauros-Paldea-Aqua") ? "Water" :
                            "Normal";
                return;
            case "Terrain Pulse":
                const tpField = this._raidState.fields[this.userID];
                this._moveType =  tpField.hasTerrain("Electric") ? "Electric" :
                            tpField.hasTerrain("Grassy") ? "Grass" :
                            tpField.hasTerrain("Psychic") ? "Psychic" :
                            tpField.hasTerrain("Misty") ? "Fairy" :
                            "Normal";
                return;
            case "Tera Blast":
                this._moveType = (this._user.isTera && this._user.teraType) ? this._user.teraType : "Normal";
                return;
            case "Ivy Cudgel":
                this._moveType =  this._user.named("Ogerpon-Wellspring") ? "Water" : 
                            this._user.named("Ogerpon-Hearthflame") ? "Fire" :
                            this._user.named("Ogerpon-Cornerstone") ? "Rock" :
                            "Grass";
                return;
            case "Tera Starstorm":
                this._moveType = this._user.named("Terapagos-Stellar") ? "Stellar" : "Normal";
                return;
        }
        const normal = this._moveType === "Normal"
        switch (this._user.ability) {
            case "Aerilate":
                this._moveType = normal ? "Flying" : this._moveType;
                break;
            case "Galvanize":
                this._moveType = normal ? "Electric" : this._moveType;
                break;
            case "Liquid Voice":
                this._moveType = this.move.flags && this.move.flags.sound ? "Water" : this._moveType;
                break;
            case "Pixilate":
                this._moveType = normal ? "Fairy" : this._moveType;
                break;
            case "Refrigerate":
                this._moveType = normal ? "Ice" : this._moveType;
                break;
            case "Normalize":
                this._moveType = "Normal";
                break;
        }
    }

    private setDoesNotAffect() {
        if (isRaidAction(this.moveData.name)) { return; }
        const category = this.move.category;
        const targetType = this.moveData.target
        const moveName = this.move.name;
        for (let i=0; i<this._affectedIDs.length; i++) {
            let id = this._affectedIDs[i];
            if (this.userID === id) { 
                if (moveName === "Stockpile" && this._user.stockpile === 3) {
                    this._doesNotAffect[id] = "does not affect " + this.getPokemon(id).name;
                }
                continue; 
            }
            let pokemon = this.getPokemon(id);
            const field = pokemon.field;
            // Magic Bounce
            if (magicBounceMoves.includes(moveName) && pokemon.hasAbility("Magic Bounce")) {
                this._doesNotAffect[id] = "bounced back by Magic Bounce";
                this._affectedIDs[i] = this.userID;
                this._targetID = this.userID;
                id = this.userID
                pokemon = this.getPokemon(id);
            }
            // Status Moves blocked by Boss Shield
            if (this.userID !== 0 && pokemon.shieldActive && category === "Status") {
                this._doesNotAffect[id] = "blocked by " + pokemon.name + "'s shield";
            }
            // Substitute blocks status
            if (pokemon.substitute && category === "Status" && !this.moveData.isSound && !this.moveData.bypassSub && !this._user.hasAbility("Infiltrator")) {
                this._doesNotAffect[id] = "blocked by " + pokemon.name + "'s substitute";
            }
            // Field-based failure
            if (field.hasTerrain("Psychic") && pokemonIsGrounded(pokemon, field) && (this.moveData.priority || 0) > 0) {
                if ((this.userID === 0) || (this._targetID === 0)) {
                    this._doesNotAffect[id] = "blocked by Psychic Terrain";
                    continue;
                }
            }
            // Ability-based immunities
            if (!pokemon.abilityNullified && !(this._user.hasAbility("Mold Breaker", "Teravolt", "Turboblaze") && !pokemon.hasItem("Ability Shield")) && !(this._user.hasAbility("Mycelium Might") && this.move.category === "Status")) {
                // NEEDS TESTING: Do Dazzling/Queenly Majesty/Armor Tail block priority moves before checking for immunity?
                if (field.attackerSide.isDazzling && (this.moveData.priority || 0) > 0) {
                    this._doesNotAffect[id] = "blocked due to its priority"
                }
                switch (pokemon.ability) {
                    case "Good as Gold":
                    case "Good As Gold":
                        if (category === "Status" && targetType !== "user") { 
                            this._doesNotAffect[id] = "does not affect " + pokemon.name + " due to " + pokemon.ability;
                            continue; 
                        }
                        break;
                    case "Dry Skin":
                    case "Water Absorb":
                        if (this._moveType === "Water") { 
                            this._doesNotAffect[id] = "heals " + pokemon.name + " due to " + pokemon.ability; 
                            this._healing[id] = Math.floor(pokemon.maxHP() * 0.25);
                            continue;
                        }
                        break;
                    case "Volt Absorb":
                        if (this._moveType === "Electric") { 
                            this._doesNotAffect[id] = "heals " + pokemon.name + " due to " + pokemon.ability; 
                            this._healing[id] = Math.floor(pokemon.maxHP() * 0.25);
                            continue;
                        }
                        break;
                    case "Earth Eater":
                        if (this._moveType === "Ground") {
                            this._doesNotAffect[id] = "heals " + pokemon.name + " due to " + pokemon.ability; 
                            this._healing[id] = Math.floor(pokemon.maxHP() * 0.25);
                            continue;
                        }
                        break;
                    case "Flash Fire":
                        if (this._moveType === "Fire") { 
                            this._doesNotAffect[id] = "boosts " + pokemon.name + " due to " + pokemon.ability; 
                            this._raidState.getPokemon(id).abilityOn = true;
                            continue;
                        }
                        break;
                    case "Well-Baked Body":
                        if (pokemon.ability === "Well-Baked Body" && this._moveType === "Fire") {
                            this._doesNotAffect[id] = "boosts " + pokemon.name + " due to " + pokemon.ability; 
                            const boost = {def: 2};
                            this._raidState.applyStatChange(id, boost);
                            continue;
                        }
                        break;
                    case "Sap Sipper":
                        if (this._moveType === "Grass") {
                            this._doesNotAffect[id] = "boosts " + pokemon.name + " due to " + pokemon.ability; 
                            const boost = {atk: 1};
                            this._raidState.applyStatChange(id, boost);
                            continue;
                        }
                        break;
                    case "Motor Drive":
                        if (this._moveType === "Electric") {
                            this._doesNotAffect[id] = "boosts " + pokemon.name + " due to " + pokemon.ability; 
                            const boost = {spe: 1};
                            this._raidState.applyStatChange(id, boost);
                            continue;
                        }
                        break;
                    case "Storm Drain":
                        if (this._moveType === "Water") {
                            this._doesNotAffect[id] = "boosts " + pokemon.name + " due to " + pokemon.ability; 
                            const boost = {spa: 1};
                            this._raidState.applyStatChange(id, boost);
                            continue;
                        }
                        break;
                    case "Lightning Rod":
                        if (this._moveType === "Electric") {
                            this._doesNotAffect[id] = "boosts " + pokemon.name + " due to " + pokemon.ability; 
                            const boost = {spa: 1};
                            this._raidState.applyStatChange(id, boost);
                            continue;
                        }
                        break;
                    case "Bulletproof":
                        if (this.moveData.isBullet) {
                            this._doesNotAffect[id] = "blocked by Bulletproof";
                            continue;
                        }
                        break;
                    case "Wind Rider":
                        if (this.moveData.isWind) {
                            this._doesNotAffect[id] = "blocked by Wind Rider";
                            const boost = {atk: 1};
                            this._raidState.applyStatChange(id, boost);
                            continue;
                        }
                        break;
                    case "Levitate":
                        if (!pokemonIsGrounded(pokemon, field) && this._moveType === "Ground") { 
                            this._doesNotAffect[id] = "does not affect " + pokemon.name + " due to " + pokemon.ability;
                            continue;
                        }
                        break;
                    case "Soundproof":
                        if (this.moveData.isSound) {
                            this._doesNotAffect[id] = "blocked by Soundproof";
                            continue;
                        }
                        break;
                    default: break;
                }
            }
            // Type-based immunities
            const targetTypes = (pokemon.isTera && pokemon.teraType) ? [pokemon.teraType] : pokemon.types;
            if (category !== "Status" && pokemon.item !== "Ring Target") {
                if (this._moveType === "Ground" && !pokemonIsGrounded(pokemon, field)) { 
                    this._doesNotAffect[id] = "does not affect " + pokemon.name;
                    continue;
                }
                if (this._moveType === "Electric" && targetTypes.includes("Ground")) { 
                    this._doesNotAffect[id] = "does not affect " + pokemon.name; 
                    continue;
                }
                if (["Normal", "Fighting"].includes(this._moveType || "") && targetTypes.includes("Ghost") && !(["Scrappy", "Mind's Eye"] as (AbilityName | undefined)[]).includes(this._user.ability)) {
                    this._doesNotAffect[id] = "does not affect " + pokemon.name;
                    continue;
                }
                if (this._moveType === "Ghost" && targetTypes.includes("Normal")) {
                    this._doesNotAffect[id] = "does not affect " + pokemon.name;
                    continue;
                }
                if (this._moveType === "Dragon" && targetTypes.includes("Fairy")) {
                    this._doesNotAffect[id] = "does not affect " + pokemon.name;
                    continue;
                }
                if (this._moveType === "Psychic" && targetTypes.includes("Dark")) {
                    this._doesNotAffect[id] = "does not affect " + pokemon.name;
                    continue;
                }
                if (this._moveType === "Poison" && targetTypes.includes("Steel") && !this._user.hasAbility("Corrosion")) {
                    this._doesNotAffect[id] = "does not affect " + pokemon.name;
                    continue;
                }
            }
            if (moveName === "Thunder Wave" && targetTypes.includes("Ground") && pokemon.item !== "Ring Target") {
                this._doesNotAffect[id] = "does not affect " + pokemon.name;
                continue;
            }
            if ((moveName.includes("Powder") || moveName.includes("Spore") && moveName !== "Powder Snow") && (targetTypes.includes("Grass") || pokemon.item === "Safety Goggles")) {
                this._doesNotAffect[id] = "does not affect " + pokemon.name;
                continue;
            }
            if (id !== this.userID && this._user.hasAbility("Prankster") && category === "Status" && targetTypes.includes("Dark")) {
                this._doesNotAffect[id] = "does not affect " + pokemon.name;
                continue;
            }
        }
        for (let dne of this._doesNotAffect)  {
            if (dne) {
                // this._user.lastMoveFailed = true;
                break;
            }
        }
    }

    private checkProtection() {
        if (!bypassProtectMoves.includes(this.moveData.name)){
            for (let id of this._affectedIDs) {
                if (!this._doesNotAffect[id]) {
                    const pokemon = this.getPokemon(id);
                    const field = pokemon.field;
                    if (field.attackerSide.isProtected) {
                        this._blockedBy[id] = pokemon.lastMove!.name;
                    } else if (field.attackerSide.isWideGuard && ["all-pokemon", "all-other-pokemon", "all-opponents"].includes(this.moveData.target || "")) {
                        this._blockedBy[id] = "Wide Guard";
                    } else if (field.attackerSide.isQuickGuard && (this.moveData.priority || 0) > 0) {
                        this._blockedBy[id] = "Quick Guard";
                    }
                }
            }
        }
    }

    private applyProtection() {
        const moveName = this.moveData.name;
        if (["Protect", "Detect", "Spiky Shield", "Baneful Bunker", "Burning Bulwark"].includes(moveName)) {
            this._fields[this.userID].attackerSide.isProtected = true;
        } else if (moveName === "Wide Guard")  {
            if (this.userID === 0) {
                this._fields[0].attackerSide.isWideGuard = true;
            } else{
                for (let i=1; i<5; i++)  {
                    this._fields[i].attackerSide.isWideGuard = true;
                }
            }
        } else if (moveName === "Quick Guard") {
            if (this.userID === 0) {
                this._fields[0].attackerSide.isQuickGuard = true;
            } else{
                for (let i=1; i<5; i++)  {
                    this._fields[i].attackerSide.isQuickGuard = true;
                }
            }
        }
    }

    private getMoveField(atkID:number, defID: number) {
        const moveField = this._raidState.fields[atkID].clone();
        moveField.defenderSide = this._raidState.fields[defID].attackerSide.clone();
        return moveField;
    }

    private getPokemon(id: number) {
        return this._raiders[id];
    }

    private applyDamage() {
        const moveUser = this.getPokemon(this.userID);
        // check for spread damage (boss actions only)
        this._isSpread = this.moveData.category?.includes("damage") && (this._affectedIDs.length > 1);
        // protean / libero check
        if (this.moveData.name !== "(No Move)" && this.moveData.type && moveUser.hasAbility("Protean", "Libero") && !moveUser.abilityOn && !moveUser.isTera) {
            moveUser.types = [this._moveType];
            moveUser.abilityOn = true;
            moveUser.hasExtraType = false;
            this._flags[this.userID].push("changed to the " + this._moveType + " type");
        }
        // Electro Shot boost check (with Power Herb or in Rain)
        if (this.moveData.name === "Electro Shot" && !moveUser.isCharging) {
            this._raidState.applyStatChange(this.userID, {spa: 1});
        }
        // Spit Up / Stockpile check
        if (this.moveData.name === "Spit Up" && !this._user.stockpile) {
            this._desc[this.userID] = this._user.name + " " + this.move.name + " vs. " + this._raidState.getPokemon(this._targetID).name + " — " + this.move.name + " failed!";
        }
        // calculate and apply damage
        let hasCausedDamage = false;
        for (let id of [0,1,2,3,4]) {
            const target = this.getPokemon(id);
            if (this._doesNotAffect[id]) {
                this._desc[id] = this.move.name + " " + this._doesNotAffect[id] + "!";
            } else if (this._blockedBy[id])  {
                this._desc[id] = this.move.name + " was blocked by " + this._blockedBy[id] + "!";
            } else if (this._affectedIDs.includes(id)) {
                const critChance = getCritChance(this.move, moveUser, target);
                const crit = this.options.crit || critChance >= 1;
                const roll = this.options.roll || "avg";
                const superEffective = isSuperEffective(this.move, this._moveType, target.field, this._user, target);
                let results = [];
                let damageResult: number | number[] | undefined = undefined;
                let totalDamage = 0;

                const attackerIgnoresAbility = (this._user.hasAbility("Mold Breaker", "Teravolt", "Turboblaze") && !target.hasItem("Ability Shield")) || (this._user.hasAbility("Mycelium Might") && this.move.category === "Status");
                let [accuracy, accEffectsList] = (this.instructed && this._user.lastAccuracy) ? [this._user.lastAccuracy, []] : getAccuracy(this.moveData, this.move.category, moveUser, target, !this.movesFirst, attackerIgnoresAbility);
                this._user.lastAccuracy = accuracy;
                const bpModifier = getBpModifier(this.moveData, target, this.damaged);
                const accFraction = Math.min(1,accuracy/100);
                const rollChance = accFraction * (crit ? critChance : (1 - critChance));
                if (this.options.allowMiss ? (accuracy >= 100 || roll !== "min") : (accuracy > 0)) {
                    try {
                        const preDamageItem = target.item;
                        // calculate each hit from a multi-hit move
                        for (let i=0; i<this.hits; i++) { 
                            const calcMove = this.move.clone();
                            calcMove.hits = 1;
                            calcMove.isCrit = crit;
                            calcMove.isSpread = !!this._isSpread;
                            calcMove.bp = calcMove.bp * bpModifier; // from interactions like Dig + Earthquake
                            calcMove.bp = ((calcMove.name === "Triple Axel" || calcMove.name === "Triple Kick") ? i+1 : 1) * calcMove.bp;
                            if (calcMove.name === "Pollen Puff" && this.userID !== 0 && this._targetID !== 0) {
                                break;
                            }
                            // handle moves that are affected by repeated use
                            if (this._user.lastMove && (this.moveData.name === this._user.lastMove.name)) {
                                this._user.moveRepeated = (this._user.moveRepeated || 0) + 1;
                                 // calcMove.timesUsed = this._user.moveRepeated; // THIS CARRIES OUT THE MOVE MULTIPLE TIMES
                                 // TO DO: Implement boosts for Fury Cutter and Rollout
                            } else {
                                this._user.moveRepeated = 0;
                            }
                            if (this._user.item === "Metronome") {
                                calcMove.timesUsedWithMetronome = this._user.moveRepeated || 0; // TO DO: account for Symbiosis, etc
                            }
                            // get calc result
                            const moveField = this.getMoveField(this.userID, id);
                            const result = calculate(9, moveUser, target, calcMove, moveField);
                            let otherResult = undefined;
                            if (critChance > 0 && critChance < 1) {
                                const otherCalcMove = calcMove.clone();
                                otherCalcMove.isCrit = !crit;
                                otherResult = calculate(9, moveUser, target, otherCalcMove, moveField);
                            }
                            
                            results.push(result);
                            // ignore the possibility that result.damage is [number[], number[]]. When would that come up?
                            if (damageResult === undefined) {
                                // @ts-ignore
                                damageResult = result.damage;
                            } else if (typeof(damageResult) === "number") {
                                damageResult = (damageResult as number) + (result.damage as number);
                            } else {
                                damageResult = (damageResult as number[]).map((val, i) => val + (result.damage as number[])[i]);
                            }
                            let hitDamage = 0;
                            let hitRoll = undefined;
                            if (typeof(result.damage) === "number") {
                                hitDamage = result.damage as number;
                                hitRoll = getRollCounts([[hitDamage]], 0, target.maxHP(), [rollChance]);
                            } else {
                                //@ts-ignore
                                hitDamage = roll === "max" ? result.damage[result.damage.length-1] : roll === "min" ? result.damage[0] : result.damage[Math.floor(result.damage.length/2)];
                                hitRoll = getRollCounts([result.damage as number[]], 0, target.maxHP(), [rollChance]);
                            }
                            if (calcMove.name === "False Swipe") {
                                hitDamage = Math.min(hitDamage, target.originalCurHP - 1);
                            }
                            if (otherResult) {
                                const otherRollChance = accFraction * (crit ? 1 - critChance : critChance);
                                if (typeof(otherResult.damage) === "number") {
                                    hitRoll = catRollCounts(hitRoll, getRollCounts([[otherResult.damage as number]], 0, target.maxHP(), [otherRollChance]));
                                } else {
                                    hitRoll = catRollCounts(hitRoll, getRollCounts([otherResult.damage as number[]], 0, target.maxHP(), [otherRollChance]));
                                }
                            }
                            if (accFraction > 0 && accFraction < 1) {
                                hitRoll = catRollCounts(hitRoll, getRollCounts([[0]], 0, target.maxHP(), [1 - accFraction]));
                            }
                            const bypassSubstitute = this.moveData.bypassSub || moveUser.hasAbility("Infiltrator");
                            this._raidState.applyDamage(id, hitDamage, hitRoll, 1, result.rawDesc.isCritical, superEffective, this._moveType, this.move.category, true, this.moveData.isWind, bypassSubstitute, this._isSheerForceBoosted);
                            totalDamage += hitDamage;
                            this._damageRolls[id].push(hitRoll);
        
                            // remove buffs to user after damage
                            if (totalDamage > 0) {
                                hasCausedDamage = true;
                                moveUser.field.attackerSide.isHelpingHand = false;
                                if (this._moveType === "Electric") { moveUser.field.attackerSide.isCharged = false; }
                            }
                            // contact checks
                            if (this.moveData.makesContact && !this._user.hasAbility("Long Reach") && !this._user.hasItem("Protective Pads")) {
                                const target = this._raidState.raiders[this._targetID]; // All contact moves are single-target (?)
                                // abilities
                                const attackerIgnoresAbility = (this._user.hasAbility("Mold Breaker", "Teravolt", "Turboblaze") || !target.hasItem("Ability Shield")) && (this._user.hasAbility("Mycelium Might") && this.move.category === "Status");
                                if (!target.abilityNullified && !attackerIgnoresAbility) {
                                    switch (this._raidState.raiders[this._targetID].ability) {
                                        case "Rough Skin":
                                        case "Iron Barbs":
                                            this._raidState.applyDamage(this.userID, Math.floor(this._user.maxHP() / 8 / ((this._user.bossMultiplier || 100) / 100)));
                                            break;
                                        case "Aftermath":
                                            if (target.originalCurHP === 0) {
                                                this._raidState.applyDamage(this.userID, Math.floor(this._user.maxHP() / 4 / ((this._user.bossMultiplier || 100) / 100)));
                                            }
                                            break;
                                        case "Gooey":
                                        case "Tangling Hair":
                                            this._raidState.applyStatChange(this.userID, {spe: -1});
                                            break;
                                        // Guessing NoReceiver
                                        case "Wandering Spirit":
                                            if (!persistentAbilities["NoReceiver"].includes(this._user.ability as AbilityName)) {
                                                target.ability = this._user.ability;
                                                this._user.ability = "Wandering Spirit" as AbilityName;
                                            }
                                            break;
                                        case "Magician":
                                        case "Pickpocket":
                                            if (!target.item && this._user.item) {
                                                const item = this._user.item;
                                                this._raidState.loseItem(this.userID);
                                                this._raidState.receiveItem(this._targetID, item);
                                            }
                                            break;
                                        // Guessing NoReceiver
                                        case "Mummy":
                                        case "Lingering Aroma":
                                            if (!this._user.hasItem("Ability Shield") && 
                                                !(!this._user.abilityNullified && (
                                                    this._user.hasAbility("Lingering Aroma","Mummy") || persistentAbilities["NoReceiver"].includes(this._user.ability || "")
                                                ))) {
                                                this._raidState.changeAbility(this._user.id, target.ability!)
                                            }
                                            break;
                                        // TO DO: status-inflicting contact abilities. 
                                        default: break;
                                    }
                                }
                                // items
                                switch (target.item) {
                                    case "Rocky Helmet":
                                        this._raidState.applyDamage(this.userID, Math.floor(this._user.maxHP() / 6 / ((this._user.bossMultiplier || 100) / 100)));
                                        break;
                                    case "Sticky Barb":
                                        if (!this._user.item) {
                                            this._raidState.loseItem(this._targetID);
                                            this._raidState.receiveItem(this.userID, "Sticky Barb" as ItemName);
                                        }
                                        break;
                                    default: break; 
                                }
                            }
                        }
                        const postDamageItem = target.item;
                        if ((preDamageItem !== postDamageItem) && (!postDamageItem)) {
                            this._raidState.loseItem(id); // This triggers Symbiosis, which only happens at the end of multi-strike moves
                        }
                        // prepare desc from results
                        const result = results[0];
                        result.damage = damageResult as number | number[];
                        result.rawDesc.hits = this.hits > 1 ? this.hits : undefined;
                        this._damage[id] = Math.min(totalDamage, this.raidState.raiders[id].originalCurHP);
                        this._desc[id] = result.desc();
                        // for Fling / Symbiosis interactions, the Flinger should lose their item *after* the target receives damage
                        if (this.moveData.name === "Fling" && this._user.item) {
                            this._flingItem = moveUser.item;
                            this._raidState.loseItem(this.userID);
                            this._user.lastConsumedItem = this._flingItem;
                            if (this._user.hasAbility("Cud Chew") && this._flingItem!.includes("Berry")) {
                                this._user.isCudChew = 2;
                            }
                        }
                    } 
                    catch {
                        this._desc[id] = this._user.name + " used " + this.move.name + " on " + this.getPokemon(id).name + "!";
                    }

                    // add accuracy to desc if there is a chance to miss
                    if (accuracy < 100) {
                        const accString = Math.round(accuracy * 10) / 10;
                        const missString = Math.round((100 - accString) * 10) / 10;
                        const accEffectsString = accEffectsList.length ? " (" + accEffectsList.join(", ") + ")" : "";
                        this._desc[id] += " [" + accString + "% chance to hit" + accEffectsString + "]";
                        this._warnings.push(this.move.name + " has a " + missString + "% chance to miss" + accEffectsString);
                    }

                    if (!nonMoveActions.includes(this.moveData.name)) {
                        // this._user.lastMoveFailed = false;
                    }
                } else {
                    const accString = Math.round(accuracy * 10) / 10;
                    const missString = Math.round((100 - accString) * 10) / 10;
                    const accEffectsString = accEffectsList.length ? " with " + accEffectsList.join(", ") : "";
                    this._desc[id] = this._user.name + " used " + this.move.name + ", but it missed! (" + accString + "% chance to hit " + accEffectsString + ")";
                    this._warnings.push(this.move.name + " missed (" + missString + "% chance to miss" + accEffectsString + ").");
                    this._doesNotAffect[id] = "missed";
                    // this._user.lastMoveFailed = true;
                }
            }
            // protection contact checks
            if (this._affectedIDs.includes(id)) {
                if (this.moveData.makesContact && this._blockedBy[id] && target.lastMove && !this._user.hasAbility("Long Reach") && !this._user.hasItem("Protective Pads")) {
                    switch (target.lastMove.name) {
                        case "Spiky Shield":
                            this._raidState.applyDamage(this.userID, Math.floor(this._user.maxHP() / 8 / ((this._user.bossMultiplier || 100) / 100)));
                            break;
                        case "Baneful Bunker":
                            this._raidState.applyStatus(this.userID, "psn", target.id, false, false, this.options.roll);
                            break;
                        case "Burning Bulwark":
                            this._raidState.applyStatus(this.userID, "brn", target.id, false, false, this.options.roll);
                            break;
                        case "Beak Blast":
                            if (target.isCharging) {
                                this._raidState.applyStatus(this.userID, "brn", target.id, false, false, this.options.roll);
                            }
                            break;
                        case "King's Shield": 
                            this._raidState.applyStatChange(this.userID, {atk: -1});
                            break;
                        case "Obstruct":
                            this._raidState.applyStatChange(this.userID, {def: -2});
                            break;
                        case "Silk Trap": {
                            this._raidState.applyStatChange(this.userID, {spe: -1});
                            break;
                        }
                        default: break;
                    }
                }   
            }
        }
        // simplify/remove descs
        if (this._affectedIDs.length > 1 && !this.moveData.category?.includes("damage")) {
            for (let id of this._affectedIDs) {
                this._desc[id] = "";
            }
            this._desc[this.userID] = this._user.name + " used " + this.move.name + "!";
        }
        // } else if (this._affectedIDs.length === 1 && this._damage[this._affectedIDs[0]] === 0) {
        //     if (this._affectedIDs[0] === this.userID) {
        //         this._desc[this._affectedIDs[0]] = this._user.name + " used " + this.move.name + "!";
        //     } else {
        //         this._desc[this._affectedIDs[0]] = this._user.name + " used " + this.move.name + " on " + this.getPokemon(this._affectedIDs[0]).name + "!";
        //     }
        // }
        // adjust tera charge
        if ((this.moveData.category?.includes("damage") || (this.moveData.category === "unique" && this.moveData.power)) && hasCausedDamage && this._user.teraCharge < 3) {
            this._user.teraCharge++;
        } 
    }

    private applyDrain() { // this also accounts for recoil
        let drainPercent = this.moveData.drain;
        if ((this.moveData.drain || 0) < 0 && this._user.hasAbility("Rock Head", "Magic Guard")) {
            drainPercent = 0;
        }
        drainPercent = (drainPercent || 0) + ((!this._isSheerForceBoosted && this._user.hasItem("Shell Bell")) ? 12.5 : 0);
        const damage = this._damage.reduce((a,b) => a + b, 0);
        if (drainPercent) {
            // scripted Matcha Gotcha could potentially drain from multiple raiders
            let drainRolls: Map<number,number> | undefined = undefined;
            if (damage > 0) {
                for (let id of this._affectedIDs) {
                    this._drain[this.userID] = this._drain[this.userID] + absoluteFloor(this._damage[id] * drainPercent/100);
                    for (let hitRolls of this._damageRolls[id]) {
                        const scaledRolls = new Map<number,number>();
                        for (let [key, val] of hitRolls) {
                            scaledRolls.set(absoluteFloor(key * -drainPercent/100), val);
                        }
                        if (drainRolls === undefined) {
                            drainRolls = scaledRolls;
                        } else {
                            drainRolls = combineRollCounts(drainRolls, scaledRolls, -this._raidState.raiders[id].maxHP(), this._raidState.raiders[id].maxHP()).c;
                        }
                    }
                }
            }
            if (this._drain[this.userID] && this._user.originalCurHP > 0) {
                this._raidState.applyDamage(this.userID, -this._drain[this.userID], drainRolls)
            }
        }
    }

    private applyHealing() {
        let healingPercent = this.moveData.healing;
        const healingRolls: (number[] | undefined)[] = [undefined, undefined, undefined, undefined, undefined];
        for (let id of this._affectedIDs) {
            if (this._doesNotAffect[id] || this._blockedBy[id]) { continue; }
            const target = this.getPokemon(id);
            const maxHP = target.maxHP();
            if (this.move.name === "Heal Cheer") {
                const roll = this.options.roll || "avg";
                healingRolls[id] = healCheerRoll.map(val => -Math.floor(val * maxHP));
                this._healing[id] += roll === "min" ? Math.floor(maxHP * 0.2) : roll === "max" ? maxHP : Math.floor(maxHP * 0.6);
                const pokemon = this.getPokemon(id);
                pokemon.status = "";
                pokemon.isFrozen = 0;
                pokemon.isSleep = 0;
                pokemon.isYawn = 0;
                pokemon.syrupBombDrops = 0;
            } else if (this.move.name === "Swallow") {
                // Swallow / Stockpile check
                if (!target.stockpile) {
                    this._desc[id] = target.name + " " + target.name + " — " + this.move.name + " failed!";
                }
                this._healing[id] += target.stockpile === 3 ? maxHP : Math.floor(maxHP * 0.25 * target.stockpile);
            } else {
                if (this._user.hasAbility("Mega Launcher") && this.moveData.isPulse) {
                    healingPercent = (healingPercent || 0) * 1.5;
                }
                if (this.moveData.name === "Floral Healing" && this._user.field.hasTerrain("Grassy")) {
                    healingPercent = 66.66; // Bulbapedia says 2/3, not sure what should be used here for perfect accuracy 
                }
                const healAmount = Math.floor(target.maxHP() * (healingPercent || 0)/100 / ((target.bossMultiplier || 100) / 100));
                this._healing[id] += healAmount;
            }
        }
        for (let id=1; id<5; id++) {
            if (this._healing[id] && this.getPokemon(id).originalCurHP > 0) {
                this._raidState.applyDamage(id, -this._healing[id], healingRolls[id] ? getRollCounts([healingRolls[id] as number[]], -this._raidState.raiders[id].maxHP(), this._raidState.raiders[id].maxHP()) : undefined);
            }
        }
    }

    private applyFlinch() {
        const flinchChance = (this.moveData.flinchChance || 0) * (this._user.hasAbility("Serene Grace") ? 2 : 1);
        const ignoreAbility = this._user.hasAbility("Mold Breaker", "Teravolt", "Turboblaze") || (this._user.hasAbility("Mycelium Might") && this.move.category === "Status");
        if (flinchChance && !this._isSheerForceBoosted && (this.options.secondaryEffects || flinchChance >= 100)) {
            for (let id of this._affectedIDs) {
                if (id === 0) { continue; }
                if (this._doesNotAffect[id] || this._blockedBy[id]) { continue; }
                const target = this.getPokemon(id);
                if (target.item === "Covert Cloak" || target.hasAbility("Shield Dust")) { continue; }
                if (target.hasAbility("Inner Focus") && !(ignoreAbility && !target.hasItem("Ability Shield"))) { continue; }
                this._causesFlinch[id] = true;
                if (this._user.hasAbility("Steadfast")) {
                    this._raidState.applyStatChange(id, {spe: 1}, true, this.userID, ignoreAbility);
                }
            }
        }
    }

    private applyStatChanges() {
        const category = this.moveData.category;
        if (this._isSheerForceBoosted) { return; } 
        const affectedIDs = category === "damage+raise" ? [this.userID] : this._affectedIDs;
        let statChanges = this.moveData.statChanges;
        // handle Growth
        if (this.move.name === "Growth" && this._fields[this.userID].weather?.includes("Sun") && !this._fields[this.userID].isCloudNine) { statChanges = [{stat: "atk", change: 2}, {stat: "spa", change: 2}]; }
        // handle Curse
        if (this.move.name === "Curse" && this._raiders[this.userID].hasType("Ghost")) { return; } // no stat changes
        const chance = (this.moveData.statChance || 100) * (this._raiders[this.userID].hasAbility("Serene Grace") ? 2 : 1);
        if (chance && (this.options.secondaryEffects || chance >= 100 )) {
            for (let id of affectedIDs) {
                if (this._doesNotAffect[id] || this._blockedBy[id]) { continue; }
                const pokemon = this.getPokemon(id);
                if (pokemon.originalCurHP === 0) { continue; }
                const field = pokemon.field;
                if (id !== this.userID && this.moveData.category?.includes("damage") && (pokemon.item === "Covert Cloak" || pokemon.hasAbility("Shield Dust"))) { continue; }
                const boost: Partial<StatsTable> = {};
                for (let statChange of (statChanges || [])) {
                    const stat = statChange.stat as StatIDExceptHP;
                    let change = statChange.change;
                    if (Number.isNaN(change)) {
                        // apparently, I manually put some stat changes are stored under the "value" key rather than "change"
                        // TODO: update the data files to fix this
                        // @ts-ignore
                        change = statChange.value;
                    }
                    if (Number.isNaN(change)) { console.log("Stat change info for " + this.moveData.name + " is missing."); continue; }
                    if (change < 0 && id !== this.userID && (field.attackerSide.isProtected || (field.attackerSide.isMist && this._user.ability !== "Infiltrator"))) {
                        continue;
                    }
                    boost[stat] = change;
                }
                this._raidState.applyStatChange(id, boost, true, this.userID, (this._user.hasAbility("Mold Breaker", "Teravolt", "Turboblaze") && !pokemon.hasItem("Ability Shield")) || (this._user.hasAbility("Mycelium Might") && this.move.category === "Status"))
            }
        }
    }

    private applyAilment() {
        const ailment = this.moveData.ailment;
        const chance = (this.moveData.ailmentChance || 100) * (this._user.hasAbility("Serene Grace") ? 2 : 1);
        if (ailment && !this._isSheerForceBoosted && (chance >= 100 || this.options.secondaryEffects)) {
            for (let id of this._affectedIDs) {
                if (this._doesNotAffect[id] || this._blockedBy[id]) { continue; }
                const pokemon = this.getPokemon(id);
                if (pokemon.originalCurHP === 0) { continue; }
                const ailmentIsStatus = isStatus(ailment);
                const isSecondaryEffect = this.moveData.category?.includes("damage");
                // non-volatile status
                if (ailmentIsStatus) {
                    this._raidState.applyStatus(id, ailment as StatusName, this.userID, isSecondaryEffect, false, this.options.roll);
                // volatile status
                } else {
                    this._raidState.applyVolatileStatus(id, ailment, isSecondaryEffect, this.userID, this.movesFirst);
                }
                // Toxic Chain
                if (this._user.hasAbility("Toxic Chain") && isSecondaryEffect && this.options.secondaryEffects) {
                    this._raidState.applyStatus(id, "tox", this.userID, true, false, this.options.roll);
                }
            }
        }
    }

    private applySelfDamage() {
        if (this._user.hasAbility("Magic Guard")) { return; }
        const selfDamage = Math.floor((this._user.maxHP() * (this.moveData.selfDamage || 0) / 100) / ((this._user.bossMultiplier || 100) / 100)); 
        const lifeOrbDamage = (this._user.item === "Life Orb" && !this._isSheerForceBoosted && this._damage.reduce((a,b) => a + b, 0) > 0) ? Math.floor(this._user.maxHP() * 0.1) : 0;
        if (selfDamage !== 0) {
            const selfDamagePercent = this.moveData.selfDamage;
            this._flags[this.userID].push!(selfDamagePercent + "% self damage from " + this.moveData.name)
            this._raidState.applyDamage(this.userID, selfDamage);
        }
        if (lifeOrbDamage !== 0) {
            this._flags[this.userID].push!("Life Orb damage")
            this._raidState.applyDamage(this.userID, lifeOrbDamage);
        }
    }

    private applyFieldChanges() {
        /// Whole-Field Effects
        // Weather
        if (this.move.name === "Rain Dance") { this._raidState.applyWeather("Rain", this._user.item === "Damp Rock" ? 8 : 5); }
        if (this.move.name === "Sunny Day") { this._raidState.applyWeather("Sun", this._user.item === "Heat Rock" ? 8 : 5); }
        if (this.move.name === "Sandstorm") { this._raidState.applyWeather("Sand", this._user.item === "Smooth Rock" ? 8 : 5); }
        if (this.move.name === "Snowscape" || this.move.name === "Chilly Reception") { this._raidState.applyWeather("Snow", this._user.item === "Icy Rock" ? 8 : 5); }
        // Terrain
        if (this.move.name === "Electric Terrain") { this._raidState.applyTerrain("Electric", this._user.item === "Terrain Extender" ? 8 : 5); }
        if (this.move.name === "Grassy Terrain") { this._raidState.applyTerrain("Grassy", this._user.item === "Terrain Extender" ? 8 : 5); }
        if (this.move.name === "Misty Terrain") { this._raidState.applyTerrain("Misty", this._user.item === "Terrain Extender" ? 8 : 5); }
        if (this.move.name === "Psychic Terrain") { this._raidState.applyTerrain("Psychic", this._user.item === "Terrain Extender" ? 8 : 5); }
        // Gravity
        const gravity = this.move.name === "Gravity";
        // Trick Room
        const trickroom = this.move.name === "Trick Room";
        // Magic Room
        const magicroom = this.move.name === "Magic Room";
        // Wonder Room
        const wonderroom = this.move.name === "Wonder Room";
        // apply effects
        for (let field of this._fields) {
            field.isGravity = (gravity && !field.isGravity) ? 5 : field.isGravity;
            field.isTrickRoom = trickroom ? (field.isTrickRoom ? 0 : 5) : field.isTrickRoom;
            field.isMagicRoom = magicroom ? (field.isMagicRoom ? 0 : 5) : field.isMagicRoom;
            field.isWonderRoom = wonderroom ? (field.isWonderRoom ? 0 : 5) : field.isWonderRoom;
        }
        /// Side Effects
        // Reflect
        let reflect = this.move.name === "Reflect";
        // Light Screen
        let lightscreen = this.move.name === "Light Screen";
        // Aurora Veil
        let auroraveil = this.move.name === "Aurora Veil" && this._user.field.hasWeather("Hail", "Snow");
        // Mist
        let mist = this.move.name === "Mist";
        // Safeguard
        let safeguard = this.move.name === "Safeguard";
        // Tailwind
        let tailwind = this.move.name === "Tailwind";
        // Attack Cheer
        let attackcheer = this.move.name === "Attack Cheer";
        // Defense Cheer
        let defensecheer = this.move.name === "Defense Cheer";
        // apply effects
        const sideFieldIDs = this.userID === 0 ? [0] : [1,2,3,4];
        for (let id of sideFieldIDs) {
            const field = this._fields[id];
            field.attackerSide.isReflect = (reflect && !field.attackerSide.isReflect) ? (this._user.item === "Light Clay" ? 8 : 5) : field.attackerSide.isReflect;
            field.attackerSide.isLightScreen = (lightscreen && !field.attackerSide.isLightScreen) ? (this._user.item === "Light Clay" ? 8 : 5) : field.attackerSide.isLightScreen;
            field.attackerSide.isAuroraVeil = (auroraveil && !field.attackerSide.isAromaVeil) ? (this._user.item === "Light Clay" ? 8 : 5) : field.attackerSide.isAuroraVeil;
            field.attackerSide.isMist = (mist && !field.attackerSide.isMist) ? 5 : field.attackerSide.isMist;
            field.attackerSide.isSafeguard = (safeguard && !field.attackerSide.isSafeguard) ? 5 : field.attackerSide.isSafeguard;
            field.attackerSide.isTailwind = (tailwind && !field.attackerSide.isTailwind) ? 5 : field.attackerSide.isTailwind;
            field.attackerSide.isAtkCheered = Math.min(6, (attackcheer ? 3 : 0) + field.attackerSide.isAtkCheered);
            field.attackerSide.isDefCheered = Math.min(6, (defensecheer ? 3 : 0) + field.attackerSide.isDefCheered);
        }

        // Helping Hand
        const helpinghand = this.move.name === "Helping Hand";
        if (helpinghand) {
            if (this._doesNotAffect[this._targetID]) {
                this._desc[this._targetID] = this.move.name + " " + this._doesNotAffect[this._targetID] + "!";
            } else {
                this._fields[this._targetID].attackerSide.isHelpingHand = true;
            }
        }
    }

    private applyPreDamageEffects()  {
        if ((this._user.isFrozen || this._user.hasStatus("frz")) && thawUserMoves.includes(this.move.name)) {
            this._user.status = "";
            this._user.isFrozen = 0;
        }

        if (this._doesNotAffect[this._targetID]) { return; }
        
        switch (this.move.name) {
            case "Brick Break":
            case "Psychic Fangs":
            case "Raging Bull":
                const targetFields = this.userID === 0 ? this._fields.slice(1) : [this._fields[0]];
                let hadScreens = false
                for (let field of targetFields) {
                    hadScreens = !!(field.attackerSide.isReflect || field.attackerSide.isLightScreen || field.attackerSide.isAuroraVeil) || hadScreens;
                    field.attackerSide.isReflect = 0;
                    field.attackerSide.isLightScreen = 0;
                    field.attackerSide.isAuroraVeil = 0;
                }
                if (hadScreens) {
                    this._flags[this.userID].push(this.move.name + " broke the opponent's screens!")
                }
                break;
            case "Clear Smog":
                const target = this.getPokemon(this._targetID);
                for (let stat in target.boosts) {
                    const statId = stat as StatIDExceptHP;
                    target.boosts[statId] = 0;
                }
                break;
            default: break;
        }
    }

    private applyOtherMoveEffects() {
        // Throat Spray
        if (this.moveData.isSound && this._user.hasItem("Throat Spray")) {
            this._raidState.consumeItem(this.userID, this._user.item!);
        }
    }

    private applyUniqueMoveEffects() {
        const target = this.getPokemon(this._targetID);

        const user_ability = this._user.ability as AbilityName;
        const target_ability = target.ability as AbilityName;

        if (this._doesNotAffect[this._targetID]) { return; }

        switch (this.move.name) {
            /// Ability-affecting moves
            case "Clear Boosts / Abilities":
                if (this.userID !== 0) {
                    throw new Error("Only the Raid boss can remove stat boosts and abilities!")
                }
                this._desc[this._targetID] = "The Raid Boss nullified all stat boosts and abilities!"
                for (let i=1; i<5; i++) {
                    const pokemon = this.getPokemon(i);
                    // Helping Hand is NOT cleared
                    // if (
                    //     !persistentAbilities.unsuppressable.includes(pokemon.ability as AbilityName) 
                    //     && !pokemon.hasItem("Ability Shield")
                    //     && pokemon.ability !== "(No Ability)"
                    // ) { // abilities that are not unsupressable are nullified
                    //     this._raidState.changeAbility(i, "(No Ability)");
                    // }
                    if (!pokemon.hasItem("Ability Shield") && !pokemon.hasAbility("Disguise", "Ice Face")) {
                        this._raidState.removeAbilityFieldEffect(i, pokemon.ability);
                        pokemon.abilityNullified = 1;
                        pokemon.abilityOn = false; // boosts from abilities (i.e. Flash Fire) are removed temporarily without Ability Shield
                    }
                    pokemon.field.attackerSide.isAtkCheered = 0; // clear active cheers
                    pokemon.field.attackerSide.isDefCheered = 0;
                    for (let stat in pokemon.boosts) {
                        pokemon.boosts[stat as StatIDExceptHP] = Math.min(0, (pokemon.boosts[stat as StatIDExceptHP] || 0));
                    }
                }
                break;
            case "Remove Negative Effects":
                if (this.userID !== 0) {
                    throw new Error("Only the Raid boss can remove negative effects!")
                }
                this._desc[this._targetID] = "The Raid Boss removed all negative effects from itself!"
                const boss = this.getPokemon(0);
                boss.status = "";
                boss.volatileStatus = [];
                // boss.isTaunt = 0; according to IVSore, taunt isn't cleared
                boss.isSleep = 0;
                boss.isYawn = 0;
                boss.syrupBombDrops = 0;
                for (let stat in boss.boosts) {
                    boss.boosts[stat as StatIDExceptHP] = Math.max(0, boss.boosts[stat as StatIDExceptHP] || 0);
                }
                break;
            case "Steal Tera Charge":
                if (this.userID !== 0) {
                    throw new Error("Only the Raid boss can steal tera charges!")
                }
                this._desc[0] = "The Raid Boss stole a Tera charge from its opponents!";
                for (let i=1; i<5; i++) {
                    const pokemon = this._raidState.getPokemon(i);
                    pokemon.teraCharge = Math.max(0, (pokemon.teraCharge || 0) - 1);
                }
                break;
            case "Activate Shield":
                if (this.userID !== 0) {
                    throw new Error("Only the Raid boss can activate its shield!")
                }
                if (!this._user.shieldBroken && !this._user.shieldActive && this._user.shieldData?.shieldCancelDamage) {
                    this._desc[this._targetID] = "The Raid Boss activated its shield!";
                    this._user.shieldActive = true;
                    this._user.shieldActivateHP = this._user.originalCurHP;
                } else {
                    this._desc[this._targetID] = "The Boss Shield is already active. You might need to change the shield's HP activation threshold.";
                }
                break;
            case "Skill Swap": 
                if (
                    !this._user.abilityNullified && !target.abilityNullified &&
                    !this._user.hasItem("Ability Shield") && 
                    !target.hasItem("Ability Shield") &&
                    !persistentAbilities["FailSkillSwap"].includes(user_ability) &&
                    !persistentAbilities["FailSkillSwap"].includes(target_ability)
                ) {
                    const tempUserAbility = user_ability;
                    this._raidState.changeAbility(this.userID, target_ability, true);
                    this._raidState.changeAbility(this._targetID, tempUserAbility, true);
                } else {
                    this._desc[this._targetID] = this._user.name + " " + this.move.name + " vs. " + target.name + " — " + this.move.name + " failed!";
                }
                break;
            case "Core Enforcer":
            case "Gastro Acid":
                if (
                    !persistentAbilities["CantSuppress"].includes(target_ability) &&
                    !target.hasItem("Ability Shield")
                ) {
                    this._raidState.removeAbilityFieldEffect(target.id, target.ability);
                    target.abilityNullified = -1;
                } else {
                    this._desc[this._targetID] = this._user.name + " " + this.move.name + " vs. " + target.name + " — " + this.move.name + " failed!";
                }
                break;
            case "Entrainment":
                if (
                    !persistentAbilities["NoEntrain"].includes(user_ability) &&
                    !target.hasItem("Ability Shield")
                ) {
                    this._raidState.changeAbility(this._targetID, user_ability);
                } else {
                    this._desc[this._targetID] = this._user.name + " " + this.move.name + " vs. " + target.name + " — " + this.move.name + " failed!";
                }
                break;
            // Worry Seed is weird, using FailSkillSwap as an approximation
            case "Worry Seed":
                if (
                    !persistentAbilities["FailSkillSwap"].includes(target_ability) &&
                    !target.hasItem("Ability Shield")
                ) {
                    this._raidState.changeAbility(this._targetID, "Insomnia" as AbilityName);
                } else {
                    this._desc[this._targetID] = this._user.name + " " + this.move.name + " vs. " + target.name + " — " + this.move.name + " failed!";
                }
                break;
            case "Role Play":
                if (
                    !target.abilityNullified &&
                    !persistentAbilities["FailRolePlay"].includes(target_ability) &&
                    !this._user.hasItem("Ability Shield")
                ) {
                    this._raidState.changeAbility(this.userID, target_ability);
                } else {
                    this._desc[this._targetID] = this._user.name + " " + this.move.name + " vs. " + target.name + " — " + this.move.name + " failed!";
                }
                break;
            // Using CantSuppress as a guess
            case "Simple Beam":
                if (
                    !persistentAbilities["CantSuppress"].includes(target_ability) &&
                    !target.hasItem("Ability Shield")
                ) {
                    this._raidState.changeAbility(this._targetID, "Simple" as AbilityName);
                } else {
                    this._desc[this._targetID] = this._user.name + " " + this.move.name + " vs. " + target.name + " — " + this.move.name + " failed!";
                }
                break;
            case "Minimize":
                this._user.isMinimize = true;
                break;
            // Using FailRolePlay/NoReceiver as a guess
            case "Doodle":
                if (
                    !persistentAbilities["NoReceiver"].includes(target_ability) &&
                    !this._user.hasItem("Ability Shield")
                ) {           
                    this._raidState.changeAbility(this.userID, target_ability);
                    if (this.userID !== 0) {
                        for (let i=1; i<5; i++) {
                            const pokemon = this.getPokemon(i);
                            if (i !== this.userID &&
                                !pokemon.hasItem("Ability Shield") &&
                                !persistentAbilities["NoReceiver"].includes(pokemon.ability || ""))
                            {
                                this._raidState.changeAbility(i, target_ability);
                            }
                        }
                    }
                }
                break;
        /// Type-affecting moves
            case "Soak":
                if (!target.isTera || !(target.teraType !== undefined || target.teraType !== "???") && !(target.types.every(type => type === "Water"))) {
                    target.types = ["Water"];
                    target.hasExtraType = false;
                    this._desc[target.id] = this._user.name + " Soak vs. " + target.name + " — Soak changed " + target.name + "'s type to Water!";
                } else {
                    this._desc[target.id] = this._user.name + " Soak vs. " + target.name + " — Soak failed!";
                }
                break;
            case "Magic Powder":
                if (!target.isTera || !(target.teraType !== undefined || target.teraType !== "???") && !(target.types.every(type => type === "Psychic"))) {
                    target.types = ["Psychic"];
                    target.hasExtraType = false;
                    this._desc[target.id] = this._user.name + " Magic Powder vs. " + target.name + " — Magic Powder changed " + target.name + "'s type to Psychic!";
                } else {
                    this._desc[target.id] = this._user.name + " Magic Powder vs. " + target.name + " — Magic Powder failed!";
                }
                break;
            case "Forest's Curse":
                if (!target.isTera || !(target.teraType !== undefined || target.teraType !== "???") && !target.types.includes("Grass")) {
                    if (target.types.length === 3) {
                        target.types[2] = "Grass";
                    } else {
                        target.types.push("Grass");
                    }
                    target.hasExtraType = true;
                    this._desc[target.id] = this._user.name + " Forest's Curse vs. " + target.name + " — the Grass type was added to " + target.name + "!";
                } else {
                    this._desc[target.id] = this._user.name + " Forest's Curse vs. " + target.name + " — Forest's Curse failed!";
                } 
                break;
            case "Trick-or-Treat":
                if (!target.isTera || !(target.teraType !== undefined || target.teraType !== "???") && !target.types.includes("Ghost")) {
                    if (target.types.length === 3) {
                        target.types[2] = "Ghost";
                    } else {
                        target.types.push("Ghost");
                    }
                    target.hasExtraType = true;
                    this._desc[target.id] = this._user.name + " Trick-or-Treat vs. " + target.name + " — the Ghost type was added to " + target.name + "!";
                } else {
                    this._desc[target.id] = this._user.name + " Trick-or-Treat vs. " + target.name + " — Trick-or-Treat failed!";
                } 
                break;
            case "Conversion":
                const firstMoveType = this._user.moveData[0].type;
                if (firstMoveType) {
                    this._user.types = [firstMoveType];
                    this._user.hasExtraType = false;
                    this._desc[this.userID] = this._user.name + " Conversion — " + this._user.name + " transformed into the " + firstMoveType.toUpperCase() + " type!";
                }
                break;
            case "Reflect Type":
                if (!target.isTera || (target.teraType !== undefined || target.teraType !== "???")) {
                    this._user.types = [...target.types];
                    this._user.hasExtraType = target.hasExtraType;
                    this._desc[this.userID] = this._user.name + " Reflect Type vs. " + target.name + " — " + this._user.name + "'s types changed to match " + target.name + "'s!";
                } else {
                    this._user.types = [target.teraType];
                    this._user.hasExtraType = false;
                }
                this._desc[this.userID] = this._user.name + " Reflect Type vs. " + target.name + " — " + this._user.name + "'s type changed to match " + target.name + "'s!";
                break;
        /// Item-affecting moves
            case "Knock Off":
                // Knock Off doesn't remove raiders' items when used by the boss
                if (this.userID !== 0 && target.item) {
                    this._raidState.loseItem(this._targetID);
                }
                break;
            case "Switcheroo":
            case "Trick":
                // These moves don't work in Tera raids
                // const tempUserItem = this._user.item;
                // const tempTargetItem = target.item;
                // this._raidState.receiveItem(this._targetID, tempUserItem);
                // this._raidState.receiveItem(this.userID, tempTargetItem);
                break;
            case "Fling":
                if (this._flingItem && !(target.hasAbility("Shield Dust") || target.hasItem("Covert Cloak"))) {
                    switch (this._flingItem) {
                        case "Light Ball":
                            this._raidState.applyStatus(target.id, "par", this.userID, true, false, this.options.roll);
                            break;
                        case "Flame Orb":
                            this._raidState.applyStatus(target.id, "brn", this.userID, true, false, this.options.roll);
                            break;
                        case "Toxic Orb":
                            this._raidState.applyStatus(target.id, "tox", this.userID, true, false, this.options.roll);
                            break
                        case "Poison Barb":
                            this._raidState.applyStatus(target.id, "psn", this.userID, true, false, this.options.roll);
                            break;
                        case "White Herb":
                        case "Cheri Berry":
                        case "Chesto Berry":
                        case "Pecha Berry":
                        case "Rawst Berry":
                        case "Aspear Berry":
                        case "Lum Berry":
                        case "Persim Berry": 
                        case "Liechi Berry":
                        case "Kee Berry":
                        case "Ganlon Berry":
                        case "Petaya Berry":
                        case "Maranga Berry":
                        case "Apicot Berry":
                        case "Salac Berry":
                        case "Starf Berry":
                        case "Lansat Berry":
                        case "Micle Berry":
                        case "Sitrus Berry":
                        case "Oran Berry":
                        case "Mental Herb":
                            this._raidState.consumeItem(this._targetID, this._flingItem, false);
                            break;
                        default: break;
                    }
                }
                break;
            // other
            case "Defog":
                const targetFields = this.userID === 0 ? this._fields.slice(1) : [this._fields[0]];
                for (let field of this._fields) {
                    field.attackerSide.isReflect = 0;
                    field.attackerSide.isLightScreen = 0;
                    field.attackerSide.isSafeguard = 0;
                    field.attackerSide.isMist = 0;
                    field.terrain = undefined;
                }
                for (let field of targetFields) {
                    field.attackerSide.isAuroraVeil = 0;
                }
                break;
            case "Court Change": 
                const tempUserSide = {...(this._fields[this.userID].attackerSide)};
                const sameSides = this.userID === 0 ? [this._fields[0]] : this._fields.slice(1);
                const targetSides = this.userID === 0 ? this._fields.slice(1) : [this._fields[0]];
                for (let side of sameSides) {
                    side.attackerSide.isLightScreen = targetSides[0].attackerSide.isLightScreen;
                    side.attackerSide.isReflect = targetSides[0].attackerSide.isReflect;
                    side.attackerSide.isSafeguard = targetSides[0].attackerSide.isSafeguard;
                    side.attackerSide.isMist = targetSides[0].attackerSide.isMist;
                    side.attackerSide.isAuroraVeil = targetSides[0].attackerSide.isAuroraVeil;
                    side.attackerSide.isTailwind = targetSides[0].attackerSide.isTailwind;
                }
                for (let side of targetSides) {
                    side.attackerSide.isLightScreen = tempUserSide.isLightScreen;
                    side.attackerSide.isReflect = tempUserSide.isReflect;
                    side.attackerSide.isSafeguard = tempUserSide.isSafeguard;
                    side.attackerSide.isMist = tempUserSide.isMist;
                    side.attackerSide.isAuroraVeil = tempUserSide.isAuroraVeil;
                    side.attackerSide.isTailwind = tempUserSide.isTailwind;
                }
                break;
            case "Haze":
                for (let id=0; id<5; id++) {
                    const pokemon = this.getPokemon(id);
                    for (let stat in pokemon.boosts) {
                        const statId = stat as StatIDExceptHP
                        pokemon.boosts[statId] = 0;
                    }
                }
                break;
            case "Heal Bell":
            case "Jungle Healing":
                for (let id of this._affectedIDs) {
                    if (!this._doesNotAffect[id]) {
                        const pokemon = this._raidState.getPokemon(id);
                        pokemon.status = "";
                    }
                }
                break;
            case "Charge":
                this._fields[this.userID].attackerSide.isCharged = true;
                break;
            case "Endure":
                this._user.isEndure = true;
                this._user.cumDamageRolls.addPersistentCondition("Endure");
                break;
            case "Substitute":
                const substituteHP = Math.floor(this._user.maxHP() / 4);
                if (this._user.originalCurHP > substituteHP && this._user.substitute === undefined) {
                    this._user.originalCurHP -= substituteHP;
                    this._user.substitute = substituteHP
                }
                break;
            case "Psych Up":
                for (let stat of ["atk", "def", "spa", "spd", "spe", "acc", "eva"]) {
                    const statId = stat as StatIDExceptHP;
                    this._user.boosts[statId] = target.boosts[statId] || 0;
                    this._user.isPumped = target.isPumped;
                }
                break;
            case "Power Swap":
                const tempUserAtkBoosts = {...this._user.boosts};
                this._user.boosts.atk = target.boosts.atk;
                this._user.boosts.spa = target.boosts.spa;
                target.boosts.atk = tempUserAtkBoosts.atk;
                target.boosts.spa = tempUserAtkBoosts.spa;
                break;
            case "Guard Swap":
                const tempUserDefBoosts = {...this._user.boosts};
                this._user.boosts.def = target.boosts.def;
                this._user.boosts.spd = target.boosts.spd;
                target.boosts.def = tempUserDefBoosts.def;
                target.boosts.spd = tempUserDefBoosts.spd;
                break;
            case "Heart Swap":
                const tempUserBoosts = {...this._user.boosts};
                this._user.boosts = {...target.boosts};
                target.boosts = {...tempUserBoosts};
                break;
            case "Power Trick":
                const tempAtk = this._user.stats.atk;
                this._user.stats.atk = this._user.stats.def;
                this._user.stats.def = tempAtk;
                break;
            case "Speed Swap":
                const tempSpe = this._user.stats.spe;
                this._user.stats.spe = target.stats.spe;
                target.stats.spe = tempSpe;
                break;
            case "Topsy-Turvy": 
                for (let stat in target.boosts) {
                    target.boosts[stat as StatIDExceptHP] = -(target.boosts[stat as StatIDExceptHP] || 0);
                }
                break;
            case "Acupressure":
                target.randomBoosts += target.boostCoefficient * 2;
                break;
            case "Rest":
                if ((this._user.status !== "slp")
                    && !(isGrounded(this._user, this._user.field) && this._user.field.hasTerrain("Misty") || this._user.field.hasTerrain("Electric")) 
                    && (this._user.abilityNullified || !["Insomnia", "Purifying Salt", "Vital Spirit"].includes(this._user.ability as string)) 
                    && !(this._user.field.hasWeather("Sun") && this._user.hasAbility("Leaf Guard"))
                ) {
                    this._user.originalCurHP = this._user.maxHP();
                    this._user.isSleep = this.options.roll === "max" ? 1 : this.options.roll === "min" ? 3 : 2;
                    this._raidState.applyStatus(this.userID, "slp", this.userID, false, false, this.options.roll);
                }
                break;
            case "Ingrain":
                this._user.isIngrain = true;
                break;
            case "Smack Down":
                target.isSmackDown = true;
                break;
            case "Focus Energy":
                if (!this._user.isPumped) {
                    this._user.isPumped = 2;
                } else {
                    this._desc[this._targetID] = this._user.name + " - " + this.move.name + " failed!"
                }
                break;
            case "Dragon Cheer": 
                const allyIDs = this.userID !== 0 ? [1,2,3,4].filter((id) => id !== this.userID) : [];
                for (let allyID of allyIDs) {
                    const ally = this._raidState.getPokemon(allyID);
                    if (!ally.isPumped) {
                        ally.isPumped = ally.hasType("Dragon") ? 2: 1;
                    } else {
                        this._desc[allyID] = ally.name + " - " + this.move.name + " failed!"
                    }
                }
                break;
            case "Syrup Bomb":
                if (!target.syrupBombDrops) {
                    target.syrupBombDrops = 3;
                    this._flags[this._targetID].push("Covered in Sticky Syrup!");
                }
                break;
            case "Tailwind":
                // Tailwind is applied in applyFieldChanges()
                const allies = this.userID !== 0 ? [1,2,3,4] : [0];
                for (let id of allies) {
                    const ally = this.getPokemon(id);
                    if (ally.hasAbility("Wind Power")) {
                        this._fields[id].attackerSide.isCharged = true;
                    } else if (ally.hasAbility("Wind Rider")) {
                        this._raidState.applyStatChange(id, {atk: 1});
                    }
                }
                break;
            case "Curse": 
                if (this._user.hasType("Ghost")) {
                    this._raidState.applyDamage(this.userID, this._user.maxHP() / 2);
                    // (Ghost) Curse probably doesn't work in raids
                }
                break;
            case "Stockpile":
                this._user.stockpile = Math.min(3, this._user.stockpile + 1);
                break;
            case "Spit Up":
                if (this._damage.reduce((a,b) => a + b, 0) > 0) {
                    this._raidState.applyStatChange(this.userID, {def: -this._user.stockpile, spd: -this._user.stockpile}, false, this.userID, false);
                    this._user.stockpile = 0;
                }
                break;
            case "Swallow":
                if (this._healing.reduce((a,b) => a + b, 0) > 0) {
                    this._raidState.applyStatChange(this.userID, {def: -this._user.stockpile, spd: -this._user.stockpile}, false, this.userID, false);
                    this._user.stockpile = 0;
                }
                break;
            case "Transform":
                this._raidState.transform(this.userID, target.id);
                this._desc[this.targetID] = this._user.name + " transformed into " + target.name + "!";
                break;
            case "Relic Song":
                if (this._user.name.includes("Meloetta") && !this._user.hasAbility("Sheer Force")) {
                    if (this._user.name === "Meloetta") {
                        this._user.changeForm("Meloetta-Pirouette" as SpeciesName);
                    } else {
                        this._user.changeForm("Meloetta" as SpeciesName);
                    }
                }
                break;
            case "Mimic":
                const lastMove = target.lastMove;
                if (lastMove) {
                    this._user.mimicMove(lastMove, target.id)
                    this._desc[this.targetID] = this._user.name + " copied " + lastMove.name + " from " + target.name + "!";
                }
                break;
            case "Sketch":
                const lastMove2 = target.lastMove;
                if (lastMove2) {
                    this._user.sketchMove(lastMove2, target.id)
                    this._desc[this.targetID] = this._user.name + " copied " + lastMove2.name + " from " + target.name + "!";
                }
                break;
            case "Throat Chop":
                target.isThroatChop = target.id === 0 ? 8 : 2;
                break;
            default: break;
            }
    }

    public applyPostMoveEffects() {
        /// Item-related effects that occur at the end of a successful move
        // Choice-locking items
        if (this._user.hasItem("Choice Specs", "Choice Band", "Choice Scarf") &&
            this.raidState.raiders[this.raiderID].hasItem("Choice Specs", "Choice Band", "Choice Scarf")) {
            this._user.isChoiceLocked = true;
        }
    }

    private setFlags() {
        // check for fainting
        const fainted = [false, false, false, false, false];
        for (let i=0; i<5; i++) {
            if (this._raiders[i].originalCurHP <= 0 && this.raidState.raiders[i].originalCurHP > 0) {
                fainted[i] = true;
            }
        }
        // crit stage check
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            const pokemon = this._raiders[i];
            const origPokemon = this.raidState.raiders[i];
            if (pokemon.isPumped !== origPokemon.isPumped) {
                this._flags[i].push(`is getting pumped (+${pokemon.isPumped})`);
            }
        }
        // check for charged status
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            const pokemon = this._raiders[i];
            const origPokemon = this.raidState.raiders[i];
            if (pokemon.field.attackerSide.isCharged !== origPokemon.field.attackerSide.isCharged) {
                if (pokemon.field.attackerSide.isCharged) {
                    this._flags[i].push("began charging power!");
                } else {
                    this._flags[i].push("is no longer charged");
                }
            }
        }
        // check for volatile status changes
        const initialVolatileStatus = this.raidState.raiders.map(p => p.volatileStatus);
        const finalVolatileStatus = this._raiders.map(p => p.volatileStatus);
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            // check for new statuses
            for (let vStat of finalVolatileStatus[i]) {
                if (!initialVolatileStatus[i].includes(vStat)) {
                    if (vStat === "ingrain") {
                        this._flags[i].push(" planted its roots!");
                    } else if (vStat === "taunt") {
                        this._flags[i].push(" fell for the taunt!");
                    } else if (vStat === "yawn") {
                        this._flags[i].push(" is getting drowsy...");
                    } else if (vStat === "aquaring") {
                        // TO DO
                    } else if (vStat === "leech-seed") {
                        // TO DO
                    } else if (vStat === "magnetrise") {
                        // TO DO
                    } else if (vStat === "tarshot") {
                        // TO DO
                    } else if (!ignoredVolatileStatuses.includes(vStat)) {
                        this._flags[i].push(vStat + " inflicted")
                    }
                }
            }
            // check for removed statuses
            for (let vStat of initialVolatileStatus[i]) {
                if (!finalVolatileStatus[i].includes(vStat)) {
                    if (vStat === "ingrain") {
                        this._flags[i].push(vStat + " lost");
                    } else {
                        this._flags[i].push(vStat + " cured")
                    }
                }
            }
        }
        // check for shield changes
        const initialShield = this.raidState.raiders[0].shieldActive;
        const finalShield = this._raiders[0].shieldActive;
        if (initialShield !== finalShield) {
            if (finalShield) {
                this._flags[0].push("Shield activated");
            } else {
                this._flags[0].push("Shield broken");
            }
        }
        // display fainting
        for (let i=0; i<5; i++) {
            if (fainted[i]) {
                this._flags[i].push(this._raiders[i].name + " fainted!");
            }
        }
        // check for item changes
        const initialItems = this.raidState.raiders.map(p => p.item);
        const finalItems = this._raiders.map(p => p.item);
        for (let i=0; i<5; i++) {
            if (initialItems[i] !== finalItems[i]) {
                if (finalItems[i] === undefined) {
                    this._flags[i].push(initialItems[i] + " lost")
                } else if (initialItems[i] === undefined) {
                    this._flags[i].push(finalItems[i] + " gained")
                } else {
                    this._flags[i].push(initialItems[i] + " replaced with " + finalItems[i])
                }
            }
        }
        // check for ability changes
        const initialAbilities = this.raidState.raiders.map(p => p.ability);
        const finalAbilities = this._raiders.map(p => p.ability);
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            if (initialAbilities[i] !== finalAbilities[i])  {
                if (finalAbilities[i] === "(No Ability)" || finalAbilities[i] === undefined) {
                    this._flags[i].push(initialAbilities[i] + " removed")
                } else {
                    this._flags[i].push("ability changed to " + finalAbilities[i])
                }
            }
        }
        // check for Ability Nullification
        const initialNullified = this.raidState.raiders.map(p => p.abilityNullified)
        const finalNullified = this._raidState.raiders.map(p => p.abilityNullified)
        for (let i=0; i<5; i++) {
            if (fainted[i] || (finalAbilities[i] === "(No Ability)")) { continue; }
            if (!initialNullified[i] && !!finalNullified[i])  {
                this._flags[i].push(finalAbilities[i] + " nullified")
            }
        }
        // check for ability triggers
        const initialAbilityOn = this.raidState.raiders.map(p => p.abilityOn);
        const finalAbilityOn = this._raiders.map(p => p.abilityOn);
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            if (initialAbilityOn[i] !== finalAbilityOn[i]) {
                if (finalAbilityOn[i]) {
                    this._flags[i].push(this._raiders[i].ability + " activated");
                } else {
                    this._flags[i].push(this._raiders[i].ability + " deactivated");
                }
            }
        }
        // check for status changes
        const initialStatus = this.raidState.raiders.map(p => p.status);
        const finalStatus = this._raiders.map(p => p.status);
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            if (initialStatus[i] !== finalStatus[i]) {
                if (finalStatus[i] === "" || finalStatus[i] === undefined) {
                    this._flags[i].push(initialStatus[i] + " cured")
                } else {
                    this._flags[i].push(finalStatus[i] + " inflicted")
                }
            }
        }
        // check for stat changes
        for (let i=0; i<5; i++) {
            if (fainted[i]) { continue; }
            const pokemon = this.getPokemon(i);
            const origPokemon = this.raidState.raiders[i];
            let boostStr: string[] = [];
            for (let stat in pokemon.boosts) {
                //@ts-ignore
                const origStat = origPokemon.boosts[stat] || 0;
                //@ts-ignore
                const newStat = pokemon.boosts[stat] === undefined ? origStat : pokemon.boosts[stat];
                const diff = newStat - origStat;
                if (diff !== 0) {
                    boostStr.push(stat + " " + (origStat > 0 ? "+" : "") + origStat + " → " + (newStat > 0 ? "+" : "") + newStat);
                }
            }
            // acupressure check
            if (pokemon.randomBoosts !== origPokemon.randomBoosts) {
                boostStr.push("random stat " + (origPokemon.randomBoosts > 0 ? "+" : "") + origPokemon.randomBoosts + " → " + (pokemon.randomBoosts > 0 ? "+" : "") + pokemon.randomBoosts);
            }
            if (boostStr.length > 0) {
                const displayStr = "Stat changes: (" + boostStr.join(", ") + ")";
                this._flags[i].push(displayStr);
            }
        }
        // check for HP changes
        for (let i=0; i<5; i++) {
            const initialHP = this.raidState.raiders[i].originalCurHP;
            const finalHP = this._raiders[i].originalCurHP;
            if (initialHP !== finalHP) {
                const initialPercent = Math.floor(initialHP / this.raidState.raiders[i].maxHP() * 1000)/10;;
                const finalPercent = Math.floor(finalHP / this._raiders[i].maxHP() * 1000)/10;
                const hpStr = "HP: " + initialPercent + "% → " + finalPercent + "%";
                this._flags[i].push(hpStr);
            }
        }
        // display overall fainting chance
        for (let i=0; i<5; i++) {
            if (i === this.userID || i === this.targetID || i === this.raiderID || this._affectedIDs.includes(i)) {
                const poke = this._raiders[i];
                const koChance = poke.koChance;
                if (koChance > 0) {
                    this._flags[i].push(koChance >= 100 ? "Guaranteed KO" : `${koChance}% overall chance of being KOd`);
                }
            }
        }
    }
}
