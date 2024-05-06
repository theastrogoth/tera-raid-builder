import { Generations, Move, calculate } from "../calc";
import { MoveData, RaidMoveOptions, RaidTurnInfo, RaidMoveInfo } from "./interface";
import { RaidState } from "./RaidState";
import { Raider } from "./Raider";
import { RaidMove, RaidMoveResult } from "./RaidMove";
import pranksterMoves from "../data/prankster_moves.json";
import triageMoves from "../data/triage_moves.json";
import { MoveName, SpeciesName, StatusName } from "../calc/data/interface";
import { isRegularMove } from "./util";

const gen = Generations.get(9);

export type RaidTurnResult = {
    state: RaidState;
    results: RaidMoveResult[];
    raiderMovesFirst: boolean;
    raiderMoveUsed: string;
    bossMoveUsed: string;
    id: number;
    group?: number;
    moveInfo: RaidMoveInfo;
    bossMoveInfo: RaidMoveInfo;
    flags: string[][];
    endFlags: string[];
}

export class RaidTurn {
    raidState:      RaidState; // We shouldn't mutate this state; it is the result from the previous turn
    raiderID:       number;
    targetID:       number;
    raiderMoveData!: MoveData;
    bossMoveData!:   MoveData;
    raiderOptions:  RaidMoveOptions;
    bossOptions:    RaidMoveOptions;
    id:        number;
    group?:     number;
    turnNumber: number;

    _isBossAction!:     boolean;
    _isEmptyTurn!:      boolean;

    _raiderMovesFirst!: boolean;
    _raider!:           Raider;
    _boss!:             Raider;  
    _raiderMove!:       Move;
    _bossMove!:         Move;
    _raiderMoveData!:   MoveData;
    _bossMoveData!:     MoveData;
    _raiderMoveID!:     number;     // the id of the raider performing the move (affected by instruct)
    _raiderMoveTarget!: number;
    _raiderMoveUsed!:   string;
    _bossMoveUsed!:     string;

    _raidMove1!:      RaidMove;
    _raidMove2!:      RaidMove;

    _result1!:        RaidMoveResult;
    _result2!:        RaidMoveResult;
    _delayedResults!: RaidMoveResult[];
    _raidState!:      RaidState; // This tracks changes during this turn

    _flags!:          string[][]; 
    _endFlags!:       string[];


    constructor(raidState: RaidState, info: RaidTurnInfo, turnNumber: number) {
        this.raidState = raidState;
        this.raiderID = info.moveInfo.userID;
        this.targetID = info.moveInfo.targetID;
        this.raiderMoveData = info.moveInfo.moveData;
        if (Object.keys(info.moveInfo.moveData).length === 1) { // Transform or Mimic can cause issues with loading full movedata from hashes
            this.raiderMoveData = this.raidState.raiders[this.raiderID].moveData.find((move) => move.name === info.moveInfo.moveData.name) || {name: info.moveInfo.moveData.name} as MoveData;
        }
        this.bossMoveData = info.bossMoveInfo.moveData;
        if (Object.keys(info.bossMoveInfo.moveData).length === 1) {
            this.bossMoveData = this.raidState.raiders[0].moveData.find((move) => move.name === info.bossMoveInfo.moveData.name) || {name: info.bossMoveInfo.moveData.name} as MoveData;
        }
        this.id = info.id;
        this.group = info.group;
        this.turnNumber = turnNumber;

        this.raiderOptions = info.moveInfo.options || {};
        this.bossOptions = info.bossMoveInfo.options || {};
    }

    public result(): RaidTurnResult {
        // check if the turn should be considered a boss action
        this._isBossAction = this.raiderMoveData.name === "(No Move)" && this.bossMoveData.name !== "(No Move)";
        this._isEmptyTurn = this.raiderMoveData.name === "(No Move)" && this.bossMoveData.name === "(No Move)";
        // set up moves
        this._raiderMove = new Move(9, this.raiderMoveData.name, this.raiderOptions);
        if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
        if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        this._bossMove = new Move(9, this.bossMoveData.name, this.bossOptions);
        if (this.bossOptions.crit) this._bossMove.isCrit = true;
        if (this.bossOptions.hits !== undefined) this._bossMove.hits = this.bossOptions.hits;

        // copy the raid state
        this._raidState = this.raidState.clone();
        this._delayedResults = [];
        this._flags = [[], [], [], [], []];
        this._endFlags = [];

        // switch-in if previously fainted
        if (this._raidState.raiders[this.raiderID].originalCurHP === 0) {
            this._flags[this.raiderID].push("Switched in");
            this._raidState.switchIn(this.raiderID);
            // use dummy move to activate conditional items/abilities
            const moveResult = new RaidMove(
                {name: "(No Move)" as MoveName, target: "user"}, 
                new Move(gen, "(No Move)"), 
                this._raidState,
                this.raiderID,
                this.raiderID,
                this.raiderID,
                true,
                ).result();
            this._raidState = moveResult.state;
            for (let i=0; i<5; i++) {
                this._flags[i] = this._flags[i].concat(moveResult.flags[i]);
            }
        }

        // activate Terastallization if specified
        if (this.raiderOptions.activateTera) {
            const activatedTera = this._raidState.activateTera(this.raiderID);
            if (activatedTera) { this._flags[this.raiderID].push("Tera activated"); }
        }

        // determine which move goes first
        this.setTurnOrder();

        this._raiderMoveID = this.raiderID;
        this._raiderMoveTarget = this.targetID;
        this._raiderMoveData = this.raiderMoveData;
        this._bossMoveData = this.bossMoveData;
        this._raiderMoveUsed = this._raiderMoveData.name;
        this._bossMoveUsed = this._bossMoveData.name;

        this.applyChangedMove();
        
        // steal tera charge 
        // deprecated, kept for compaitiblity of old links
        if (this.bossOptions.stealTeraCharge) {
            this._flags[0].push("The Raid Boss stole a Tera charge!");
            for (let i=1; i<5; i++) {
                const pokemon = this._raidState.getPokemon(i);
                pokemon.teraCharge = Math.max(0, (pokemon.teraCharge || 0) - 1);
            }
        }
        
        if (!this._isBossAction) {
            // sleep wake-up check
            const moveUser = this._raidState.getPokemon(this._raiderMoveID);
            if (moveUser.isSleep === 0 && moveUser.hasStatus("slp")) {
                moveUser.status = "";
                this._flags[this._raiderMoveID].push("woke up");
            }
            if (this._boss.isSleep === 0 && this._boss.hasStatus("slp")) {
                this._boss.status = "";
                this._flags[0].push("woke up");
            }
            // taunt shake-off check
            if (moveUser.isTaunt === 0 && moveUser.volatileStatus.includes("taunt")) {
                moveUser.volatileStatus = moveUser.volatileStatus.filter((status) => status !== "taunt");
                this._flags[this._raiderMoveID].push("shook off the taunt");
            }
        }
        // execute moves
        if (this._raiderMovesFirst) {
            this._raidMove1 = new RaidMove(
                this._raiderMoveData,
                this._raiderMove, 
                this._raidState, 
                this._raiderMoveID, 
                this._raiderMoveTarget,
                this.raiderID,
                this._raiderMovesFirst,
                this.raiderOptions,
                this._isBossAction
            );
            this._result1 = this._raidMove1.result();
            this._raidState = this._result1.state;
            this._raidMove2 = new RaidMove(
                this._bossMoveData,
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                !this._raiderMovesFirst,
                this.bossOptions,
                this._isBossAction,
                this._result1.causesFlinch[0],
                this._result1.damage[0] > 0
            );
        } else {
            this._raidMove1 = new RaidMove(
                this._bossMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                !this._raiderMovesFirst,
                this.bossOptions,
                this._isBossAction
            );
            this._result1 = this._raidMove1.result();
            this._raidState = this._result1.state;
            this._raidMove2 = new RaidMove(
                this._raiderMoveData, 
                this._raiderMove, 
                this._raidState, 
                this._raiderMoveID, 
                this._raiderMoveTarget,
                this.raiderID,
                this._raiderMovesFirst,
                this.raiderOptions,
                this._isBossAction,
                this._result1.causesFlinch[this.raiderID],
                this._result1.damage[this.raiderID] > 0
            );
        }
        this._raidMove2.result();
        this._result2 = this._raidMove2.output
        this._raidState = this._result2.state.clone();

        if (!this._isEmptyTurn) {
            this.removeProtection();
            if (!this._isBossAction) {
                // delayed moves (Protect doesn't apply)
                this.countdownDelayedMoves();
                // item effects
                this.applyEndOfTurnItemEffects();
                // ability effects
                this.applyEndOfTurnAbilityEffects();
                // Clear Endure (since side-attacks are not endured)
                this._raidState.raiders[this.raiderID].isEndure = false;
                this._raidState.raiders[0].isEndure = false; // I am unaware of any raid bosses that have endure
                // remove protect / wide guard / quick guard effects
                this.countDownFieldEffects();
                this.countDownAbilityNullification();
                // Ability effects that trigger at the end of the turn
                if (this._raidState.raiders[this.raiderID].hasAbility("Hunger Switch") && this._raidState.raiders[this.raiderID].name.includes("Morpeko")) {
                    if (this._raidState.raiders[this.raiderID].species.name === "Morpeko") {
                        this._raidState.raiders[this.raiderID].changeForm("Morpeko-Hangry" as SpeciesName);
                    } else {
                        this._raidState.raiders[this.raiderID].changeForm("Morpeko" as SpeciesName);
                    }
                }
                // Syrup Bomb speed drops
                for (let i of [0, this.raiderID]) {
                    const pokemon = this._raidState.getPokemon(i);
                    if (pokemon.syrupBombDrops && (i !== 0 || this.raiderID === pokemon.syrupBombSource)) {
                        const origSpe = pokemon.boosts.spe || 0;
                        this._raidState.applyStatChange(i, {"spe": -1}, false, i, false);
                        this._endFlags.push(pokemon.role + " — Spe: " + origSpe + "->" + pokemon.boosts.spe! + " (Syrup Bomb)");
                        pokemon.syrupBombDrops--;
                    }
                }
                // yawn check
                for (let i of [0, this.raiderID])  {
                    const pokemon = this._raidState.getPokemon(i);
                    if (pokemon.isYawn && ((i !== 0) || (this.raiderID === pokemon.yawnSource))) {
                        pokemon.isYawn--;
                        if (pokemon.isYawn === 0) {
                            const sleepTurns = i === 0 ? (this.bossOptions.roll === "max" ? 1 : (this.bossOptions.roll === "min" ? 3 : 2)) : 
                                                        (this.raiderOptions.roll === "max" ? 1 : (this.raiderOptions.roll === "min" ? 3 : 2));
                            this._raidState.applyStatus(i, "slp", i, false);
                            if (pokemon.status === "slp") {
                                pokemon.isSleep = sleepTurns;
                                this._endFlags.push(pokemon.name + " fell asleep!");
                            }
                            pokemon.volatileStatus = pokemon.volatileStatus.filter((status) => status !== "yawn");
                        }
                    }
                }
                // Freeze thawing checks
                if (this._raider.isFrozen === 0 && this._raider.hasStatus("frz")) {
                    this._raider.status = "";
                    this._endFlags.push(this._raider.role + " thawed!");
                }
                if (this._boss.isFrozen === 0 && this._boss.hasStatus("frz")) {
                    this._boss.status = "";
                    this._endFlags.push(this._boss.role + " thawed!");
                }
                // Move-selection-related countdowns
                if (this._raider.isDisable) { this._raider.isDisable--; }
                if (!this._raider.isDisable && this._raider.disabledMove) { this._raider.disabledMove = undefined; }
                if (this._raider.isEncore) { this._raider.isEncore--; }
                if (this._boss.isDisable) { this._boss.isDisable--; }
                if (!this._boss.isDisable && this._boss.disabledMove) { this._boss.disabledMove = undefined; }
                if (this._boss.isEncore) { this._boss.isEncore--; }
            }
        }

        return {
            state: this._raidState,
            results: [this._result1, this._result2, ...this._delayedResults],
            raiderMovesFirst: this._raiderMovesFirst,
            raiderMoveUsed: this._raiderMoveUsed + (this._raidState.raiders[this.raiderID].isCharging ? " (Charging)" : ""),
            bossMoveUsed: this._bossMoveUsed + (this._raidState.raiders[0].isCharging ? " (Charging)" : ""),
            id: this.id,
            group: this.group,
            moveInfo: {
                userID: this.raiderID,
                targetID: this.targetID,
                moveData: this.raiderMoveData,
                options: this.raiderOptions,
            },
            bossMoveInfo: {
                userID: 0,
                targetID: this.raiderID,
                moveData: this.bossMoveData,
                options: this.bossOptions,
            },
            flags: this._flags,
            endFlags: this._endFlags,
        }

    }

    private applyChangedMove() {
        // Charge up moves
        if (this._raider.isCharging) {
            this._raiderMoveData = this.raidState.raiders[this.raiderID].lastMove!;
            this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
            this._raiderMoveUsed = this._raiderMoveData.name;
        }
        if (this._boss.isCharging) {
            this._bossMoveData = this.raidState.raiders[0].lastMove!;
            this._bossMove = new Move(9, this._bossMoveData.name, this.bossOptions);
            if (this.bossOptions.crit) this._bossMove.isCrit = true;
            if (this.bossOptions.hits !== undefined) this._bossMove.hits = this.bossOptions.hits;
            this._bossMoveUsed = this._bossMoveData.name;
        }
        // Recharging
        if (this._raider.isRecharging) {
            this._raiderMoveData = {name: "(No Move)" as MoveName};
            this._raiderMove = new Move(9, "(No Move)");
            this._raiderMoveUsed = "(Recharging)";
        }
        if (this._boss.isRecharging) {
            this._bossMoveData = {name: "(No Move)" as MoveName};
            this._bossMove = new Move(9, "(No Move)");
            this._bossMoveUsed = "(Recharging)";
        }
        // pollen puff
        if (this.raiderMoveData.name === "Pollen Puff") {
            if (this.targetID !== 0) { 
                this._raiderMoveData = {
                    ...this.raiderMoveData,
                    power: 0,
                    category: 'heal',
                    healing: 50,
                };
            }
        }
        // disallow status moves if taunted
        if (this._boss.isTaunt) {
            const testMove = new Move(9, this.bossMoveData.name, this.bossOptions);
            if (testMove.category === "Status" && !["Clear Boosts / Abilities", "Remove Negative Effects"].includes(testMove.name)) {
                if (this._isBossAction) {
                    if (isRegularMove(this._bossMoveData.name)) {
                        this._bossMoveData = {name: "(No Move)" as MoveName, target: "selected-pokemon", category: "damage"}
                        this._bossMove = new Move(9, "(No Move)", this.bossOptions);
                        this._bossMoveUsed = "(No Move)";
                    }
                } else {
                    this._bossMoveData = {name: "(Most Damaging)" as MoveName, target: "selected-pokemon", category: "damage"}
                }
            }
        }
        if (this._raider.isTaunt) {
            const testMove = new Move(9, this.raiderMoveData.name, this.raiderOptions);
            if (testMove.category === "Status" && !["Attack Cheer", "Defense Cheer", "Heal Cheer"].includes(testMove.name)) {
                this._raiderMoveData = {name: "(Most Damaging)" as MoveName, target: "selected-pokemon", category: "damage"}
            }
        }
        // For this option, pick the most damaging move based on the current field.
        if (!this.raidState.raiders[0].isCharging && this._bossMoveData.name === "(Most Damaging)") {
            const moveOptions = this._raidState.raiders[0].moves;
            let bestMove = "(No Move)";
            let bestDamage = 0;
            for (const move of moveOptions) {
                const testMove = new Move(9, move, this.bossOptions);
                testMove.isCrit = this.bossOptions.crit || false;
                const testField = this._raidState.raiders[0].field;
                testField.defenderSide = this._raidState.raiders[this.raiderID].field.attackerSide;
                const result = calculate(9, this._raidState.raiders[0], this._raidState.raiders[this.raiderID], testMove, testField);
                let damage: number = 0;
                if (typeof(result.damage) === "number") {
                    damage = result.damage;
                } else {
                    damage = (this.bossOptions.roll === "min" ? result.damage[0] :
                              this.bossOptions.roll === "max" ? result.damage[result.damage.length - 1] : 
                              result.damage[Math.floor(result.damage.length / 2)]) as number;
                }
                if (damage > bestDamage) {
                    bestMove = move;
                    bestDamage = damage;
                }
            }
            this._bossMoveData = this._raidState.raiders[0].moveData.find((move) => move.name === bestMove) || {name: bestMove} as MoveData;
            this._bossMove = new Move(9, bestMove, this.bossOptions);
            this._bossMoveUsed = bestMove;
        }
        if (!this.raidState.raiders[this.raiderID].isCharging && this._raiderMoveData.name === "(Most Damaging)") {
            const moveOptions = this._raidState.raiders[this.raiderID].moves;
            let bestMove = "(No Move)";
            let bestDamage = 0;
            for (const move of moveOptions) {
                const testMove = new Move(9, move, this.raiderOptions);
                testMove.isCrit = this.raiderOptions.crit || false;
                const testField = this._raidState.raiders[this.raiderID].field;
                testField.defenderSide = this._raidState.raiders[this.targetID].field.attackerSide;
                const result = calculate(9, this._raidState.raiders[this.raiderID], this._raidState.raiders[0], testMove, testField);
                let damage: number = 0;
                if (typeof(result.damage) === "number") {
                    damage = result.damage;
                } else {
                    damage = (this.raiderOptions.roll === "min" ? result.damage[0] :
                              this.raiderOptions.roll === "max" ? result.damage[result.damage.length - 1] : 
                              result.damage[Math.floor(result.damage.length / 2)]) as number;
                }
                if (damage > bestDamage && !(testMove.name === "Pollen Puff" && this.targetID !== 0)) {
                    bestMove = move;
                    bestDamage = damage;
                }
            }
            this._raiderMoveData = this._raidState.raiders[this.raiderID].moveData.find((move) => move.name === bestMove) || {name: bestMove} as MoveData;
            this._raiderMove = new Move(9, bestMove, this.raiderOptions);
            this._raiderMoveUsed = bestMove;
        }
        // Moves that cause different moves to be carried out (Instruct and Copycat, let's not worry about Metronome)
        // Instruct
        if (this.raiderMoveData.name === "Instruct" && this.raidState.raiders[this.targetID].lastMove !== undefined) {
            if (!this.raidState.raiders[this.targetID].isCharging && !this.raidState.raiders[this.targetID].isRecharging) {
                this._raiderMoveID = this.targetID;
                this._raiderMoveTarget = this.raidState.raiders[this._raiderMoveID].lastTarget!;
                if (this._raiderMoveTarget === this.targetID) { this._raiderMoveTarget = this._raiderMoveID; }
                this._raiderMoveData = this.raidState.raiders[this.targetID].lastMove!
                this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
                if (this.raiderOptions.crit) { this._raiderMove.isCrit = true; }
                if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
            }
        // Copycat
        } else if (this.raiderMoveData.name === "Copycat") {
            if (this._raidState.lastMovedID !== undefined) {
                const lastMoveUser = this.raidState.getPokemon(this._raidState.lastMovedID);
                this._raiderMoveTarget = 0; // always target the boss, when applicable?
                this._raiderMoveData = lastMoveUser.lastMove!;
                this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
                if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
                if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
            }
        // Force the move to be the last move used for Choice Lock / Encore
        } else if (isRegularMove(this._raiderMove.name) && (this._raider.isChoiceLocked || this._raider.isEncore) && this._raider.lastMove !== undefined && this._raider.lastMove.name !== "(No Move)") {
            this._raiderMoveData = this.raidState.raiders[this.raiderID].lastMove!;
            this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
            this._raiderMoveUsed = this._raiderMoveData.name;
        } 
    }

    private setTurnOrder() {
        this._raider = this._raidState.raiders[this.raiderID];
        this._boss = this._raidState.raiders[0];

        this.modifyMovePriorityByAbility(this.raiderMoveData, this._raider);
        this.modifyMovePriorityByAbility(this.bossMoveData, this._boss);

        // first compare priority
        const raiderPriority = this.raiderMoveData.priority || this._raiderMove.priority;
        const bossPriority = this.bossMoveData.priority || this._bossMove.priority;
        if (raiderPriority > bossPriority) {
            this._raiderMovesFirst = true;
        } else if (raiderPriority < bossPriority) {
            this._raiderMovesFirst = false;
        } else {
            // if priority is the same, compare speed
            const raiderSpeed = this._raider.effectiveSpeed;
            const bossSpeed = this._boss.effectiveSpeed;

            const bossField = this._raidState.fields[0];
            this._raiderMovesFirst = bossField.isTrickRoom ? (raiderSpeed < bossSpeed) : (raiderSpeed > bossSpeed);
        }
    }

    private modifyMovePriorityByAbility(moveData: MoveData, raider: Raider) {
        const ability = raider.ability;

        switch (ability) {
            case "Prankster": // do dark-type prankster failure elsewhere
                if (moveData.priority !== undefined && pranksterMoves.includes(moveData.name)) {
                    moveData.priority += 1;
                }
                break;
            case "Gale Wings":
                if (moveData.priority !== undefined && raider.curHP() === raider.maxHP() && moveData.type === "Flying") {
                    moveData.priority += 1;
                }
                break;
            case "Triage": // Comfey's signature ability
                if (moveData.priority !== undefined && triageMoves.includes(moveData.name)) {
                    moveData.priority += 3;
                }
                break;
            default:
                break;
        }
    }

    private applyEndOfTurnItemEffects() {
        for (let id of [0, this.raiderID]) {
            const pokemon = this._raidState.raiders[id];
            // Ailment-inducing Items
            if (pokemon.status === undefined || pokemon.status === "") {
                switch (pokemon.item) {
                    case "Flame Orb":
                        this._raidState.applyStatus(id, "brn", id, false);
                        if (pokemon.status as StatusName === "brn") {
                            this._result2.flags[id].push("brn inflicted");
                        }
                        break;
                    case "Toxic Orb":
                        this._raidState.applyStatus(id, "tox", id, false);
                        if (pokemon.status as StatusName === "tox") {
                            this._result2.flags[id].push("tox inflicted");
                        }
                        break;
                    default: break
                }
            }
        }
    }

    private countdownDelayedMoves() {
        for (let id of [0, this.raiderID]) { // Not worrying about speed order for now
            const pokemon = this._raidState.raiders[id];
            if (pokemon.delayedMoveCounter) {
                pokemon.delayedMoveCounter--;
                if (pokemon.delayedMoveCounter === 0) {
                    if (pokemon.originalCurHP > 0) {
                        const delayedMove = new RaidMove(
                            pokemon.delayedMove!,
                            new Move(gen, pokemon.delayedMove!.name),
                            this._raidState,
                            pokemon.delayedMoveSource!,
                            pokemon.id,
                            pokemon.delayedMoveSource!,
                            true,
                            pokemon.delayedMoveOptions!,
                            false,
                            false,
                            false,
                            true,
                        );
                        const delayedMoveResult = delayedMove.result();
                        this._raidState = delayedMoveResult.state;
                        this._delayedResults.push(delayedMoveResult);
                    }
                    pokemon.delayedMove = undefined;
                    pokemon.delayedMoveSource = undefined;
                    pokemon.delayedMoveCounter = undefined;
                }
            }
        }
    }

    private applyEndOfTurnAbilityEffects() {
        for (let id of [0, this.raiderID]) {
            const pokemon = this._raidState.raiders[id];
            switch (pokemon.ability) {
                case "Speed Boost":
                    if ((pokemon.originalCurHP > 0) && ((id !== 0) || ((this.turnNumber % 4) === 3))) {
                        const origSpe = pokemon.boosts.spe || 0;
                        this._raidState.applyStatChange(id, {"spe": 1}, true, id, false);
                        this._endFlags.push(pokemon.role + " — Spe: " + origSpe + "->" + pokemon.boosts.spe! + " (Speed Boost)");
                    }
                    break;
                case "Harvest": 
                    if (pokemon.field.hasWeather("Sun") && !pokemon.item && (pokemon.lastConsumedItem || "").includes("Berry")) {
                        this._raidState.recieveItem(id, pokemon.lastConsumedItem!);
                        this._endFlags.push(pokemon.role + ` — ${pokemon.lastConsumedItem} restored (Harvest)`);
                    }
                    break;
                case "Slow Start": 
                    if (pokemon.slowStartCounter) {
                        pokemon.slowStartCounter--;
                        if (pokemon.slowStartCounter === 0) {
                            pokemon.abilityOn = false;
                            this._endFlags.push(pokemon.role + " — Slow Start ended");
                        }
                    }
                break
                default: break;
            }
        }
    }

    private removeProtection() {
        const fields = this._raidState.fields;
        fields[this.raiderID].attackerSide.isProtected = false;
        fields[this.raiderID].attackerSide.isWideGuard = false;
        fields[this.raiderID].attackerSide.isQuickGuard = false;
        fields[0].attackerSide.isProtected = false;
        fields[0].attackerSide.isWideGuard = false;
        fields[0].attackerSide.isQuickGuard = false;
    }

    private countDownFieldEffects() {
        const fields = this._raidState.fields;
        for (let field of fields) {
            // global effects
            field.terrainTurnsRemaining = Math.max(0, (field.terrainTurnsRemaining || 0) - 1);
            field.terrain = field.terrainTurnsRemaining ? field.terrain : undefined;
            field.weatherTurnsRemaining = Math.max(0, (field.weatherTurnsRemaining || 0) - 1);
            field.weather = field.weatherTurnsRemaining ? field.weather : undefined;
            field.isGravity = Math.max(0, field.isGravity - 1);
            field.isTrickRoom = Math.max(0, field.isTrickRoom - 1);
            field.isMagicRoom = Math.max(0, field.isMagicRoom - 1);
            field.isWonderRoom = Math.max(0, field.isWonderRoom - 1);
            // single-side effects
            field.attackerSide.isReflect = Math.max(0, field.attackerSide.isReflect - 1);
            field.attackerSide.isLightScreen = Math.max(0, field.attackerSide.isLightScreen - 1);
            field.attackerSide.isAuroraVeil = Math.max(0, field.attackerSide.isAuroraVeil - 1);
            field.attackerSide.isMist = Math.max(0, field.attackerSide.isMist - 1);
            field.attackerSide.isSafeguard = Math.max(0, field.attackerSide.isSafeguard - 1);
            field.attackerSide.isTailwind = Math.max(0, field.attackerSide.isTailwind - 1);
            field.attackerSide.isAtkCheered = Math.max(0, field.attackerSide.isAtkCheered - 1);
            field.attackerSide.isDefCheered = Math.max(0, field.attackerSide.isDefCheered - 1);
        }
        /// add flags for effects that have ended
        // global
        if (this.raidState.fields[0].weather && !fields[0].weather) { this._endFlags.push(this.raidState.fields[0].weather! + " ended"); }
        if (this.raidState.fields[0].terrain && !fields[0].terrain) { this._endFlags.push(this.raidState.fields[0].terrain! + " terrain ended"); }
        if (this.raidState.fields[0].isGravity && !fields[0].isGravity) { this._endFlags.push("Gravity ended"); }
        if (this.raidState.fields[0].isTrickRoom && !fields[0].isTrickRoom) { this._endFlags.push("Trick Room ended"); }
        if (this.raidState.fields[0].isMagicRoom && !fields[0].isMagicRoom) { this._endFlags.push("Magic Room ended"); }
        if (this.raidState.fields[0].isWonderRoom && !fields[0].isWonderRoom) { this._endFlags.push("Wonder Room ended"); }
        // boss
        if (this.raidState.fields[0].attackerSide.isReflect && !fields[0].attackerSide.isReflect) { this._endFlags.push("Reflect ended"); }
        if (this.raidState.fields[0].attackerSide.isLightScreen && !fields[0].attackerSide.isLightScreen) { this._endFlags.push("Light Screen ended"); }
        if (this.raidState.fields[0].attackerSide.isAuroraVeil && !fields[0].attackerSide.isAuroraVeil) { this._endFlags.push("Aurora Veil ended"); }
        if (this.raidState.fields[0].attackerSide.isMist && !fields[0].attackerSide.isMist) { this._endFlags.push("Mist ended"); }
        if (this.raidState.fields[0].attackerSide.isSafeguard && !fields[0].attackerSide.isSafeguard) { this._endFlags.push("Safeguard ended"); }
        if (this.raidState.fields[0].attackerSide.isTailwind && !fields[0].attackerSide.isTailwind) { this._endFlags.push("Tailwind ended"); }
        // raiders
        if (this.raidState.fields[1].attackerSide.isReflect && !fields[1].attackerSide.isReflect) { this._endFlags.push("Reflect ended"); }
        if (this.raidState.fields[1].attackerSide.isLightScreen && !fields[1].attackerSide.isLightScreen) { this._endFlags.push("Light Screen ended"); }
        if (this.raidState.fields[1].attackerSide.isAuroraVeil && !fields[1].attackerSide.isAuroraVeil) { this._endFlags.push("Aurora Veil ended"); }
        if (this.raidState.fields[1].attackerSide.isMist && !fields[1].attackerSide.isMist) { this._endFlags.push("Mist ended"); }
        if (this.raidState.fields[1].attackerSide.isSafeguard && !fields[1].attackerSide.isSafeguard) { this._endFlags.push("Safeguard ended"); }
        if (this.raidState.fields[1].attackerSide.isTailwind && !fields[1].attackerSide.isTailwind) { this._endFlags.push("Tailwind ended"); }
        if (this.raidState.fields[1].attackerSide.isAtkCheered && !fields[1].attackerSide.isAtkCheered) { this._endFlags.push("Attack Cheer ended"); }
        if (this.raidState.fields[1].attackerSide.isDefCheered && !fields[1].attackerSide.isDefCheered) { this._endFlags.push("Defense Cheer ended"); }
    }

    private countDownAbilityNullification() {
        // count down nullified ability counter
        const pokemon = this._raidState.getPokemon(this.raiderID);
        if (pokemon.abilityNullified) {
            pokemon.abilityNullified!--;
            let abilityRestored = false;
            let abilityReactivated = false;
            if (pokemon.abilityNullified === 0) { // restore ability after a full turn
                if (pokemon.ability === "(No Ability)") { // if you overwrite the ability in the meantime, what happens?
                    this._raidState.changeAbility(this.raiderID, pokemon.originalAbility, true);
                    abilityRestored = pokemon.ability !== "(No Ability)";
                }
                if (pokemon.nullifyAbilityOn) {
                    abilityReactivated = pokemon.abilityOn !== true;
                    pokemon.nullifyAbilityOn = undefined;
                    pokemon.abilityOn = true;
                }
                // Not sure if we need to do anything special here to trigger ability reactivation
                if (abilityRestored && abilityReactivated) {
                    this._endFlags.push(pokemon.role + " — " + pokemon.originalAbility + " restored and reactivated");
                } else if (abilityRestored) {
                    this._endFlags.push(pokemon.role + " — " + pokemon.originalAbility + " restored");
                } else if (abilityReactivated) {
                    this._endFlags.push(pokemon.role + " — " + pokemon.originalAbility + " reactivated");
                }
            }
        }
    }
}