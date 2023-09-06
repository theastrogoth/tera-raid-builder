import { Move, Field, StatsTable, Generations, calculate} from "../calc";
import { getEndOfTurn } from "../calc/desc";
import { MoveData, RaidMoveOptions } from "./interface";
import { RaidState } from "./RaidState";
import { Raider } from "./Raider";
import { AbilityName, StatIDExceptHP } from "../calc/data/interface";
import { getQPBoostedStat } from "../calc/mechanics/util";
import { isSuperEffective, safeStatStage, pokemonIsGrounded, ailmentToStatus, hasNoStatus } from "./util";
import persistentAbilities from "../data/persistent_abilities.json"
import bypassProtectMoves from "../data/bypass_protect_moves.json"

export type RaidMoveResult= {
    state: RaidState;
    userID: number;
    targetID: number;
    damage: number[];
    drain: number[];
    healing: number[];
    eot: ({damage: number, texts: string[]} | undefined)[];
    desc: string[];
    flags: string[][];
    causesFlinch: boolean[];
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
    hits: number;
    flinch?: boolean;

    _raidState!: RaidState;
    _raiders!: Raider[];
    _user!: Raider;
    _affectedIDs!: number[];
    _fields!: Field[];

    _doesNotEffect!: boolean[];
    _causesFlinch!: boolean[];
    _blockedBy!: string[];

    _flingItem?: string;

    _damage!: number[];
    _healing!: number[];
    _drain!: number[];
    _eot!: ({damage: number, texts: string[]} | undefined)[];

    _desc!: string[];
    _flags!: string[][];

    constructor(moveData: MoveData, move: Move, raidState: RaidState, userID: number, targetID: number, raiderID: number, movesFirst: boolean,  raidMoveOptions?: RaidMoveOptions, flinch?: boolean) {
        this.move = move;
        this.moveData = moveData;
        this.raidState = raidState;
        this.userID = userID;
        this.targetID = targetID;
        this.raiderID = raiderID;
        this.movesFirst = movesFirst;
        this.options = raidMoveOptions || {};
        this.flinch = flinch || false;
        this.hits = this.move.category === "Status" ? 0 : Math.max(this.moveData.minHits || 1, Math.min(this.moveData.maxHits || 1, this.options.hits || 1));
        this.hits = this.raidState.raiders[this.userID].ability === "Skill Link" ? (this.moveData.maxHits || 1) : this.hits;
    }

    public result(): RaidMoveResult {
        this.setOutputRaidState();
        this._raidState.raiders[0].checkShield(); // check for shield activation
        this.setAffectedPokemon();
        if (this.flinch) {
            this._desc[this.userID] = this._user.role + " flinched!";
        } else {
            this.setDoesNotEffect();
            this.checkProtection();
            this.applyProtection();
            this.applyDamage();
            this.applyDrain();
            this.applyHealing();
            this.applySelfDamage();
            this.applyFlinch();
            this.applyStatChanges();
            this.applyAilment();
            this.applyFieldChanges();
            this.applyUniqueMoveEffects();
        }
        this.setEndOfTurnDamage();
        this.applyEndOfTurnDamage();
        this.applyEndOfMoveItemEffects();        
        this.setFlags();
        if (![
                "(No Move)", 
                "Attack Cheer",
                "Defense Cheer", 
                "Heal Cheer", 
                "Remove Negative Effects", 
                "Remove Stat Boosts & Abilities",
            ].includes(this.moveData.name)) { // don't store cheers or (No Move) for Instruct/Mimic/Copycat
            this._user.lastMove = this.moveData;
        }
        this._user.lastTarget = this.moveData.target == "user" ? this.userID : this.targetID;
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
            eot: this._eot,
            desc: this._desc,
            flags: this._flags,
            causesFlinch: this._causesFlinch,
        }
    }

    private setOutputRaidState() {
        this._raidState = this.raidState.clone();
        this._raiders = this._raidState.raiders;
        this._fields = this._raidState.fields;
        this._user = this._raiders[this.userID];

        // initialize arrays
        this._doesNotEffect = [false, false, false, false, false];
        this._causesFlinch = [false, false, false, false, false];
        this._damage = [0,0,0,0,0];
        this._drain = [0,0,0,0,0];
        this._healing = [0,0,0,0,0];
        this._eot = [undefined, undefined, undefined, undefined];
        this._desc = ['','','','',''];
        this._flags=[[],[],[],[],[]];
    }

    private setAffectedPokemon() {
        const targetType = this.moveData.target;
        if (this.moveData.name === "Heal Cheer") { this._affectedIDs = [1,2,3,4]; }
        else if (targetType == "user") { this._affectedIDs = [this.userID]; }
        else if (targetType == "selected-pokemon" || targetType == "all-opponents") { this._affectedIDs = [this.targetID]; }
        else if (targetType == "all-allies") { this._affectedIDs = [1,2,3,4].splice(this.userID, 1); }
        else if (targetType == "user-and-allies") { this._affectedIDs = [1,2,3,4]; }
        else { this._affectedIDs = [this.targetID]; }
    }

    private setDoesNotEffect() {
        this._blockedBy= ["", "", "", "", ""];
        const moveType = this.move.type;
        const category = this.move.category;
        const targetType = this.moveData.target
        const moveName = this.move.name;
        for (let id of this._affectedIDs) {
            const pokemon = this.getPokemon(id);
            const field = pokemon.field;
            // Terrain-based failure
            if (field.hasTerrain("Psychic") && pokemonIsGrounded(pokemon, field) && this.move.priority > 0) {
                this._doesNotEffect[id] = true;
                continue;
            }
            // Ability-based immunities
            if (this._user.ability !== "Mold Breaker") {
                if (pokemon.ability === "Good As Gold" && category === "Status" && targetType !== "user") { 
                    this._doesNotEffect[id] = true; 
                    continue; 
                }
                if (["Dry Skin", "Water Absorb"].includes(pokemon.ability || "") && moveType === "Water") { 
                    this._doesNotEffect[id] = true; 
                    this._healing[id] = Math.floor(pokemon.maxHP() * 0.25);
                    continue;
                }
                if (pokemon.ability === "Volt Absorb" && moveType === "Electric") { 
                    this._doesNotEffect[id] = true; 
                    this._healing[id] = Math.floor(pokemon.maxHP() * 0.25);
                    continue;
                }
                if (pokemon.ability === "Earth Eater" && moveType === "Ground") {
                    this._doesNotEffect[id] = true;
                    this._healing[id] = Math.floor(pokemon.maxHP() * 0.25);
                    continue;
                }
                if (pokemon.ability === "Flash Fire" && moveType === "Fire") { 
                    this._doesNotEffect[id] = true; 
                    const boost = {spa: 1};
                    this._raidState.applyStatChange(id, boost);
                    continue;
                }
                if (pokemon.ability === "Well-Baked Body") {
                    this._doesNotEffect[id] = true;
                    const boost = {def: 2};
                    this._raidState.applyStatChange(id, boost);
                    continue;
                }
                if (pokemon.ability === "Sap Sipper" && moveType === "Grass") {
                    this._doesNotEffect[id] = true; 
                    const boost = {atk: 1};
                    this._raidState.applyStatChange(id, boost);
                    continue;
                }
                if (pokemon.ability === "Motor Drive" && moveType === "Electric") {
                    this._doesNotEffect[id] = true;
                    const boost = {spe: 1};
                    this._raidState.applyStatChange(id, boost);
                    pokemon.boosts.spe = safeStatStage(pokemon.boosts.spe + 1);
                    continue;
                }
                if (pokemon.ability === "Storm Drain" && moveType === "Water") {
                    this._doesNotEffect[id] = true;
                    const boost = {spa: 1};
                    this._raidState.applyStatChange(id, boost);
                    continue;
                }
                if (pokemon.ability === "Lightning Rod" && moveType === "Electric") {
                    this._doesNotEffect[id] = true;
                    const boost = {spa: 1};
                    this._raidState.applyStatChange(id, boost);
                    continue;
                }
                if (pokemon.ability === "Bulletproof" && 
                    [   "Acid Spray",
                        "Aura Sphere",
                        "Barrage",
                        "Beak Blast",
                        "Bullet Seed",
                        "Egg Bomb",
                        "Electro Ball",
                        "Energy Ball",
                        "Focus Blast",
                        "Gyro Ball",
                        "Ice Ball",
                        "Magnet Bomb",
                        "Mist Ball",
                        "Mud Bomb",
                        "Octazooka",
                        "Pollen Puff",
                        "Pyro Ball",
                        "Rock Blast",
                        "Rock Wrecker",
                        "Searing Shot",
                        "Seed Bomb",
                        "Shadow Ball",
                        "Sludge Bomb",
                        "Weather Ball",
                        "Zap Cannon"
                    ].includes(moveName)) 
                {
                    this._doesNotEffect[id] = true;
                    continue;
                }
                if (pokemon.ability === "Levitate" && !pokemonIsGrounded(pokemon, field) && moveType === "Ground") { 
                    this._doesNotEffect[id] = true; 
                    continue;
                }
            }
            // Type-based immunities
            if (category !== "Status" && pokemon.item !== "Ring Target") {
                if (moveType === "Ground" && !pokemonIsGrounded(pokemon, field)) { 
                    this._doesNotEffect[id] = true; 
                    continue;
                }
                if (moveType === "Electric" && pokemon.types.includes("Ground")) { 
                    this._doesNotEffect[id] = true; 
                    continue;
                }
                if (["Normal", "Fighting"].includes(moveType || "") && pokemon.types.includes("Ghost")) {
                    this._doesNotEffect[id] = true;
                    continue;
                }
                if (moveType === "Ghost" && pokemon.types.includes("Normal")) {
                    this._doesNotEffect[id] = true;
                    continue;
                }
                if (moveType === "Dragon" && pokemon.types.includes("Fairy")) {
                    this._doesNotEffect[id] = true;
                    continue;
                }
                if (moveType === "Psychic" && pokemon.types.includes("Dark")) {
                    this._doesNotEffect[id] = true;
                    continue;
                }
            }
            if (moveName === "Thunder Wave" && pokemon.types.includes("Ground") && pokemon.item !== "Ring Target") {
                this._doesNotEffect[id] = true;
                continue;
            }
            if ((moveName.includes("Powder") || moveName.includes("Spore") && moveName !== "Powder Snow") && (pokemon.types.includes("Grass") || pokemon.item === "Safety Goggles")) {
                this._doesNotEffect[id] = true;
                continue;
            }
            if (id !== this.userID && this._user.ability === "Prankster" && category === "Status" && pokemon.types.includes("Dark")) {
                this._doesNotEffect[id] = true;
                continue;
            }
        }
    }

    private checkProtection() {
        if (!bypassProtectMoves.includes(this.moveData.name)){
            for (let id of this._affectedIDs) {
                if (!this._doesNotEffect[id]) {
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
        if (["Protect", "Detect", "Spiky Shield", "Baneful Bunker"].includes(moveName)) {
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
        if ((this._fields[this.userID].terrain === "Electric" && moveUser.ability === "Quark Drive")  ||
            (this._fields[this.userID].weather === "Sun" && moveUser.ability === "Protosynthesis")
        ) {
            moveUser.abilityOn = true;
            const qpStat = getQPBoostedStat(moveUser) as StatIDExceptHP;
            moveUser.boostedStat = qpStat;
        }
        let hasCausedDamage = false;
        for (let id of this._affectedIDs) {
            if (this._doesNotEffect[id]) {
                this._desc[id] = this.move.name + " does not affect " + this.getPokemon(id).role + "."; // a more specific reason might be helpful
            } else if (this._blockedBy[id] !== "")  {
                this._desc[id] = this.move.name + " was blocked by " + this._blockedBy[id] + ".";
            } else {
                try {
                    const target = this.getPokemon(id);
                    const crit = this.options.crit || false;
                    const roll = this.options.roll || "avg";
                    const superEffective = isSuperEffective(this.move, target.field, this._user, target);
                    let results = [];
                    let damageResult: number | number[] | undefined = undefined;
                    let totalDamage = 0;
                    // calculate each hit from a multi-hit move
                    for (let i=0; i<this.hits; i++) { 
                        const calcMove = this.move.clone();
                        calcMove.hits = 1;
                        calcMove.isCrit = crit;
                        const moveField = this.getMoveField(this.userID, id);
                        const result = calculate(9, moveUser, target, calcMove, moveField);
                        results.push(result);
                        if (damageResult === undefined) {
                            // @ts-ignore
                            damageResult = result.damage;
                        } else if (typeof(damageResult) === "number") {
                            damageResult = (damageResult as number) + (result.damage as number);
                        } else {
                            damageResult = (damageResult as number[]).map((val, i) => val + (result.damage as number[])[i]);
                        }
                        let hitDamage = 0;
                        if (typeof(result.damage) === "number") {
                            hitDamage = result.damage as number;
                        } else {
                            //@ts-ignore
                            hitDamage = roll === "max" ? result.damage[result.damage.length-1] : roll === "min" ? result.damage[0] : result.damage[Math.floor(result.damage.length/2)];
                        }
                        this._raidState.applyDamage(id, hitDamage, 1, this.move.isCrit, superEffective, this.move.type);
                        totalDamage += hitDamage;
                    }
                    // prepare desc from results
                    const result = results[0];
                    result.damage = damageResult as number | number[];
                    result.rawDesc.hits = this.hits > 1 ? this.hits : undefined;
                    this._damage[id] = totalDamage;
                    this._desc[id] = result.desc();
                    // for Fling / Symbiosis interactions, the Flinger should lose their item before the target recieves damage
                    if (this.moveData.name === "Fling" && this._user.item) {
                        this._flingItem = moveUser.item;
                        this._raidState.loseItem(this.userID);
                    }
                    if (totalDamage > 0) {
                        hasCausedDamage = true;
                    }
                } catch {
                    this._desc[id] = this._user.name + " " + this.move.name + " vs. " + this.getPokemon(id).name ; // temporary fix
                }
            }
        }
        if (this.moveData.category?.includes("damage")) {
            this._fields[this.userID].attackerSide.isHelpingHand = false;
            if (this.move.type === "Electric") { this._fields[this.userID].attackerSide.isCharged = false; }
            if (hasCausedDamage) { this._user.teraCharge++; }
        }
    }

    private applyDrain() { // this also accounts for recoil
        const drainPercent = this.moveData.drain;
        if (drainPercent) {
            // draining moves should only ever hit a single target in raids
            if (this._damage) {
                this._drain[this.userID] = Math.floor(this._damage[this.targetID] * drainPercent/100);
            }
            if (this._drain[this.userID] && this._user.originalCurHP > 0) {
                this._raidState.applyDamage(this.userID, -this._drain[this.userID])
            }
        }
    }

    private applyHealing() {
        const healingPercent = this.moveData.healing;
        for (let id of this._affectedIDs) {
            if (this._doesNotEffect[id] || this._blockedBy[id] !== "") { continue; }
            const target = this.getPokemon(id);
            const maxHP = target.maxHP();
            if (this.move.name == "Heal Cheer") {
                const roll = this.options.roll || "avg";
                this._healing[id] += roll === "min" ? Math.floor(maxHP * 0.2) : roll === "max" ? maxHP : Math.floor(maxHP * 0.6);
                const pokemon = this.getPokemon(id);
                pokemon.status = "";
            } else {
                const healAmount = Math.floor(target.maxHP() * (healingPercent || 0)/100 / ((target.bossMultiplier || 100) / 100));
                this._healing[id] += healAmount;
            }
        }
        for (let id=1; id<5; id++) {
            if (this._healing[id] && this.getPokemon(id).originalCurHP > 0) {
                this._raidState.applyDamage(id, -this._healing[id])
            }
        }
    }

    private applyFlinch() {
        const flinchChance = this.moveData.flinchChance || 0;
        if (flinchChance && (this.options.secondaryEffects || flinchChance === 100)) {
            for (let id of this._affectedIDs) {
                if (id === 0) { continue; }
                if (this._doesNotEffect[id] || this._blockedBy[id] !== "") { continue; }
                const target = this.getPokemon(id);
                if (target.item === "Covert Cloak" || target.ability === "Shield Dust") { continue; }
                if (target.ability === "Inner Focus" && this._user.ability !== "Mold Breaker") { continue; }
                this._causesFlinch[id] = true;
            }
        }
    }

    private applyStatChanges() {
        const category = this.moveData.category;
        const affectedIDs = category == "damage+raise" ? [this.userID] : this._affectedIDs;
        let statChanges = this.moveData.statChanges;
        // handle Growth
        if (this.move.name === "Growth" && this._fields[this.userID].weather?.includes("Sun")) { statChanges = [{stat: "atk", change: 2}, {stat: "spa", change: 2}]; }
        const chance = this.moveData.statChance || 100;
        if (chance && (this.options.secondaryEffects || chance === 100 )) {
            for (let id of affectedIDs) {
                if (this._doesNotEffect[id] || this._blockedBy[id] !== "") { continue; }
                const pokemon = this.getPokemon(id);
                const field = pokemon.field;
                if (id !== this.userID && this.moveData.category?.includes("damage") && (pokemon.item === "Covert Cloak" || pokemon.ability === "Shield Dust")) { continue; }
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
                this._raidState.applyStatChange(id, boost, true, id === this.userID)
            }
        }
    }

    private applyAilment() {
        const ailment = this.moveData.ailment;
        const chance = this.moveData.ailmentChance || 100;
        if (ailment && (chance == 100 || this.options.secondaryEffects)) {
            for (let id of this._affectedIDs) {
                if (this._doesNotEffect[id] || this._blockedBy[id] !== "") { continue; }
                const pokemon = this.getPokemon(id);
                const field = pokemon.field;
                const status = ailmentToStatus(ailment);
                // Covert Cloak
                if (id !== this.userID && this.moveData.category?.includes("damage") && (pokemon.item === "Covert Cloak" || pokemon.ability === "Shield Dust")) { continue; }
                // volatile status
                if (status === "") {
                    // Safeguard and Misty Terrain block confusion
                    if (ailment === "confusion" && ((field.attackerSide.isSafeguard && this._user.ability !== "Infiltrator") || (field.hasTerrain("Misty") && pokemonIsGrounded(pokemon, field)))) { continue; }
                    // Aroma Veil
                    if (field.attackerSide.isAromaVeil && ["confusion", "taunt", "encore", "disable", "infatuation"].includes(ailment)) {
                        continue;
                    // Own Tempo
                    } else if (pokemon.ability === "Own Tempo" && ailment === "confusion") {
                        continue;
                    // Oblivious
                    } else if (pokemon.ability === "Oblivious" && (ailment === "taunt" || ailment === "infatuation")) {
                        continue;
                    } else if (!pokemon.volatileStatus.includes(ailment)) {
                        pokemon.volatileStatus.push!(ailment)
                        this._flags[id].push(ailment + " inflicted")
                    }
                // non-volatile status
                } else {
                    // existing status cannot be overwritten
                    if (!hasNoStatus(pokemon)) { continue; }
                    // field-based immunities
                    if (id !== this.userID && ((field.attackerSide.isSafeguard && this._user.ability !== "Infiltrator") || (field.hasTerrain("Misty") && pokemonIsGrounded(pokemon, field)) || field.attackerSide.isProtected)) { continue; }
                    if (status === "slp" && (field.hasTerrain("Electric") && pokemonIsGrounded(pokemon, field))) { continue; }
                    if (status === "brn" && pokemon.types.includes("Fire")) { continue; }
                    if (status === "frz" && (pokemon.types.includes("Ice") || pokemon.ability === "Magma Armor")) { continue; }
                    if ((status === "psn" || status === "tox") && (pokemon.ability === "Immunity" || (this._user.ability !== "Corrosion" && (pokemon.types.includes("Poison") || pokemon.types.includes("Steel"))))) { continue; }
                    if ((status === "par" && (pokemon.types.includes("Electric") || pokemon.ability === "Limber"))) { continue; }
                    if (status === "slp" && ["Insomnia", "Vital Spirit"].includes(pokemon.ability as string)) { continue; }
                    
                    this._raidState.applyStatus(id, status);
                }
            }
        }
    }

    private applySelfDamage() {
        const selfDamage = Math.floor(this._user.maxHP() * (this.moveData.selfDamage || 0) / 100) / ((this._user.bossMultiplier || 100) / 100); 
        if (selfDamage !== 0) {
            const selfDamagePercent = this.moveData.selfDamage;
            this._flags[this.userID].push!(selfDamagePercent + "% self damage from " + this.moveData.name + ".")
            this._raidState.applyDamage(this.userID, selfDamage);
        }
    }

    private applyFieldChanges() {
        /// Whole-Field Effects
        // Weather
        if (this.move.name == "Rain Dance") { this._raidState.applyWeather("Rain"); }
        if (this.move.name == "Sunny Day") { this._raidState.applyWeather("Sun"); }
        if (this.move.name == "Sandstorm") { this._raidState.applyWeather("Sand"); }
        if (this.move.name == "Snowscape") { this._raidState.applyWeather("Snow"); }
        // Terrain
        if (this.move.name == "Electric Terrain") { this._raidState.applyTerrain("Electric"); }
        if (this.move.name == "Grassy Terrain") { this._raidState.applyTerrain("Grassy"); }
        if (this.move.name == "Misty Terrain") { this._raidState.applyTerrain("Misty"); }
        if (this.move.name == "Psychic Terrain") { this._raidState.applyTerrain("Psychic"); }
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
            if (this._doesNotEffect[this.targetID]) {
                this._desc[this.targetID] = this.move.name + " does not affect " + this.getPokemon(this.targetID).role + "."; // a more specific reason might be helpful
            } else {
                this._fields[this.targetID].attackerSide.isHelpingHand = true;
            }
        }
    }

    private applyUniqueMoveEffects() {
        /// Ability-affecting moves
        const target = this.getPokemon(this.targetID);

        const user_ability = this._user.ability as AbilityName;
        const target_ability = target.ability as AbilityName;

        switch (this.move.name) {
            case "Remove Stat Boosts & Abilities":
                if (this.userID !== 0) {
                    throw new Error("Only the Raid boss can remove stat boosts and abilities!")
                }
                this._desc[this.targetID] = "The Raid Boss nullified all stat boosts and abilities!"
                for (let i=1; i<5; i++) {
                    const pokemon = this.getPokemon(i);
                    pokemon.ability = undefined;
                    pokemon.abilityNullified = 2;
                    for (let stat in pokemon.boosts) {
                        pokemon.boosts[stat as StatIDExceptHP] = Math.min(0, pokemon.boosts[stat as StatIDExceptHP] || 0);
                    }
                }
                break;
            case "Remove Negative Effects":
                if (this.userID !== 0) {
                    throw new Error("Only the Raid boss can remove negative effects!")
                }
                this._desc[this.targetID] = "The Raid Boss removed all negative effects from itself!"
                const boss = this.getPokemon(0);
                boss.status = "";
                boss.volatileStatus = [];
                for (let stat in boss.boosts) {
                    boss.boosts[stat as StatIDExceptHP] = Math.max(0, boss.boosts[stat as StatIDExceptHP] || 0);
                }
                break;
            case "Skill Swap": 
                if (
                    !persistentAbilities["uncopyable"].includes(user_ability) &&
                    !persistentAbilities["uncopyable"].includes(target_ability) &&
                    !persistentAbilities["unreplaceable"].includes(user_ability) &&
                    !persistentAbilities["unreplaceable"].includes(target_ability)
                ) {
                    const tempUserAbility = user_ability;
                    this._user.ability = target.ability;
                    target.ability = tempUserAbility;
                }
                break;
            case "Core Enforcer":
            case "Gastro Acid":
                if (
                    !persistentAbilities["unsuppressable"].includes(target_ability)
                ) {
                    target.ability = undefined;
                }
                break;
            case "Entrainment":
                if (
                    !persistentAbilities["uncopyable"].includes(user_ability) &&
                    !persistentAbilities["unreplaceable"].includes(target_ability)
                ) {
                    target.ability = user_ability;
                }
                break;
            case "Worry Seed":
                if (
                    !persistentAbilities["unreplaceable"].includes(target_ability)
                ) {
                    target.ability = "Insomnia" as AbilityName;
                }
                break;
            case "Role Play":
                if (
                    !persistentAbilities["uncopyable"].includes(target_ability) &&
                    !persistentAbilities["unreplaceable"].includes(user_ability)
                ) {
                    this._user.ability = target_ability;
                }
                break;
            case "Simple Beam":
                if (
                    !persistentAbilities["unreplaceable"].includes(target_ability)
                ) {
                    target.ability = "Simple" as AbilityName;
                }
                break;
        /// Type-affecting moves
            case "Soak":
                if (!(target.teraType !== undefined || target.teraType !== "???") && !target.types.includes("Water")) {
                    target.types = ["Water"];
                    target.changedTypes = ["Water"];
                    this._desc[target.id] = this._user.name + " Soak vs. " + target.name + " — " + "Soak changed " + target.name + "'s type to Water!";
                } else {
                    this._desc[target.id] = this._user.name + " Soak vs. " + target.name + " — " + "Soak failed!";
                }
                break;
            case "Conversion":
                this._user.types = [this.move.type];
                this._user.changedTypes = [this.move.type];
                this._desc[this.userID] = this._user.name + " Conversion vs. " + target.name + " — " + this._user.name + " transformed into the " + this.move.type.toUpperCase() + " type!";
                break;
            case "Reflect Type":
                if (target.teraType !== undefined || target.teraType !== "???") {
                    this._user.types = target.types;
                    this._user.changedTypes = target.types;
                    this._desc[this.userID] = this._user.name + " Reflect Type vs. " + target.name + " — " + this._user.name + "'s types changed to match " + target.name + "'s!";
                } else {
                    this._user.types = [target.teraType];
                    this._user.changedTypes = [target.teraType];
                }
                this._desc[this.userID] = this._user.name + " Reflect Type vs. " + target.name + " — " + this._user.name + "'s type changed to match " + target.name + "'s!";
                break;
        /// Item-affecting moves
            case "Knock Off":
                this._raidState.loseItem(this.targetID);
                break;
            case "Switcheroo":
            case "Trick":
                // These moves don't work in Tera raids
                // const tempUserItem = this._user.item;
                // const tempTargetItem = target.item;
                // this._raidState.recieveItem(this.targetID, tempUserItem);
                // this._raidState.recieveItem(this.userID, tempTargetItem);
                break;
            case "Fling":
                if (this._flingItem) {
                    switch (this._flingItem) {
                        case "Light Ball":
                            if (hasNoStatus(target)) { target.status = "par"; }
                            break;
                        case "Flame Orb":
                            if (!target.types.includes("Fire") && hasNoStatus(target)) { target.status = "brn"; }
                            break;
                        case "Toxic Orb":
                            if (!target.types.includes("Poison") && hasNoStatus(target)) { target.status = "tox"; }
                            break
                        case "Poison Barb":
                            if (!target.types.includes("Poison") && hasNoStatus(target)) { target.status = "psn"; }
                            break;
                        case "White Herb":
                            for (let stat in target.boosts) {
                                let whiteHerbUsed = false;
                                const statId = stat as StatIDExceptHP;
                                if (target.boosts[statId] || 0 < 0) { target.boosts[statId] = 0; whiteHerbUsed = true; }
                            }
                            break;
                        // Status-Curing Berries
                        case "Cheri Berry":
                            if (target.status === "par") { target.status = ""; }
                            break;
                        case "Chesto Berry":
                            if (target.status === "slp") { target.status = ""; }
                            break;
                        case "Pecha Berry":
                            if (target.status === "psn") { target.status = ""; }
                            break;
                        case "Rawst Berry":
                            if (target.status === "brn") { target.status = ""; }
                            break;
                        case "Aspear Berry":
                            if (target.status === "frz") { target.status = ""; }
                            break;
                        case "Lum Berry":
                            if (target.status !== "") { target.status = ""; }
                            if (target.volatileStatus.includes("confusion")) { target.volatileStatus = target.volatileStatus.filter(status => status !== "confusion"); }
                            break;
                        // Stat-Boosting Berries
                        case "Liechi Berry":
                            this._raidState.applyStatChange(this.targetID, {atk: 1});
                            break;
                        case "Ganlon Berry":
                            this._raidState.applyStatChange(this.targetID, {def: 1});
                            break;
                        case "Petaya Berry":
                            this._raidState.applyStatChange(this.targetID, {spa: 1});
                            break;
                        case "Apicot Berry":
                            this._raidState.applyStatChange(this.targetID, {spd: 1});
                            break;
                        case "Salac Berry":
                            this._raidState.applyStatChange(this.targetID, {spe: 1});
                            break;
                        // Healing Berries (TO DO, other healing berries that confuse depending on nature)
                        case "Sitrus Berry":
                            this._healing[this.targetID] += Math.floor(target.maxHP() / 4);
                            break;
                        default: break;
                    }
                }
                break;
            // other
            case "Defog":
                const targetFields = this.userID === 0 ? this._fields.slice(1) : [this._fields[0]];
                for (let field of this._fields) {
                    field.attackerSide.isReflect = false;
                    field.attackerSide.isLightScreen = false;
                    field.attackerSide.isSafeguard = false;
                    field.attackerSide.isMist = false;
                    field.terrain = undefined;
                }
                for (let field of targetFields) {
                    field.attackerSide.isAuroraVeil = false;
                }
                break;
            case "Clear Smog":
                for (let stat in target.boosts) {
                    const statId = stat as StatIDExceptHP;
                    target.boosts[statId] = 0;
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
            case "Charge":
                this._fields[this.userID].attackerSide.isCharged = true;
                break;
            case "Endure":
                this._user.isEndure = true;
                break;
            case "Psych Up":
                for (let stat in target.boosts) {
                    const statId = stat as StatIDExceptHP;
                    this._user.boosts[statId] = target.boosts[statId] || 0;
                }
                break;
            case "Power Swap":
                const tempUserAtkBoosts = this._user.boosts;
                this._user.boosts.atk = target.boosts.atk;
                this._user.boosts.spa = target.boosts.spa;
                target.boosts.atk = tempUserAtkBoosts.atk;
                target.boosts.spa = tempUserAtkBoosts.spa;
                break;
            case "Guard Swap":
                const tempUserDefBoosts = this._user.boosts;
                this._user.boosts.def = target.boosts.def;
                this._user.boosts.spd = target.boosts.spd;
                target.boosts.def = tempUserDefBoosts.def;
                target.boosts.spd = tempUserDefBoosts.spd;
                break;
            case "Power Trick":
                const tempAtk = this._user.stats.atk;
                this._user.stats.atk = this._user.stats.def;
                this._user.stats.def = tempAtk;
                break;
            case "Acupressure":
                target.randomBoosts += 2;
                break;
            default: break;
            }
    }

    public applyEndOfMoveItemEffects() {
        /// Item-related effects that occur at the end of a move
        // Choice-locking items
        if (this._user.item === "Choice Specs" || this._user.item === "Choice Band" || this._user.item === "Choice Scarf") {
            this._user.isChoiceLocked = true;
        }
    }

    private setEndOfTurnDamage() {
        // getEndOfTurn() calculates damage for a defending pokemon. 
        // Here, we'll evaluate end-of-turn damage for both the user and boss only when the move does not go first
        // positive eot indicates healing
        if (!this.movesFirst) {
            const raider = this._raiders[this.raiderID];
            const boss = this._raiders[0];
            const raider_eot = getEndOfTurn(gen, boss, raider, dummyMove, this.getMoveField(0, this.raiderID));
            const boss_eot = getEndOfTurn(gen, raider, boss, dummyMove, this.getMoveField(this.raiderID, 0));
            raider_eot.damage = Math.floor(raider_eot.damage / ((raider.bossMultiplier || 100) / 100));
            boss_eot.damage = Math.floor(boss_eot.damage / ((boss.bossMultiplier || 100) / 100));
            this._eot[this.raiderID] = raider_eot;
            this._eot[0] = boss_eot;
        }
    }

    private applyEndOfTurnDamage() {
        for (let i=0; i<5; i++) {
            const damage = this._eot[i] ? -this._eot[i]!.damage : 0;
            this._raidState.applyDamage(i, damage);
        }
    }

    private setFlags() {
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
        // check for item changes
        const initialItems = this.raidState.raiders.map(p => p.item);
        const finalItems = this._raiders.map(p => p.item);
        for (let i=0; i<5; i++) {
            if (initialItems[i] !== finalItems[i]) {
                if (finalItems[i] === undefined) {
                    this._flags[i].push(initialItems[i] + " lost")
                } else {
                    this._flags[i].push(initialItems[i] + " replaced with " + finalItems[i])
                }
            }
        }
        // check for ability changes
        const initialAbilities = this.raidState.raiders.map(p => p.ability);
        const finalAbilities = this._raiders.map(p => p.ability);
        for (let i=0; i<5; i++) {
            if (initialAbilities[i] !== finalAbilities[i])  {
                if (finalAbilities[i] === undefined) {
                    this._flags[i].push(initialAbilities[i] + " nullified")
                } else {
                    this._flags[i].push("ability changed to " + finalAbilities[i])
                }
            }
        }
        // check for ability triggers
        const initialAbilityOn = this.raidState.raiders.map(p => p.abilityOn);
        const finalAbilityOn = this._raiders.map(p => p.abilityOn);
        for (let i=0; i<5; i++) {
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
                    boostStr.push(stat + " " + (origStat > 0 ? "+" : "") + origStat + " -> " + (newStat > 0 ? "+" : "") + newStat);
                }
            }
            // acupressure check
            if (pokemon.randomBoosts !== origPokemon.randomBoosts) {
                const diff = pokemon.randomBoosts - origPokemon.randomBoosts;
                boostStr.push("random stat " + (origPokemon.randomBoosts > 0 ? "+" : "") + origPokemon.randomBoosts + " -> " + (pokemon.randomBoosts > 0 ? "+" : "") + pokemon.randomBoosts);
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
                const hpStr = "HP: " + initialPercent + "% -> " + finalPercent + "%";
                this._flags[i].push(hpStr);
            }
        }
    }
}
