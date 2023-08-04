import { Generations, Move, calculate } from "../calc";
import { MoveData, RaidMoveOptions, RaidTurnInfo } from "./interface";
import { RaidState } from "./RaidState";
import { Raider } from "./Raider";
import { RaidMove, RaidMoveResult } from "./RaidMove";
import pranksterMoves from "../data/prankster_moves.json"

const gen = Generations.get(9);

export type RaidTurnResult = {
    state: RaidState;
    results: [RaidMoveResult, RaidMoveResult];
    raiderMovesFirst: boolean;
}

export class RaidTurn {
    raidState:      RaidState; // We shouldn't mutate this state; it is the result from the previous turn
    raiderID:       number;
    targetID:       number;
    raiderMoveData!: MoveData;
    bossMoveData!:   MoveData;
    raiderOptions:  RaidMoveOptions;
    bossOptions:    RaidMoveOptions;

    _raiderMovesFirst!: boolean;
    _raider!:           Raider;
    _boss!:             Raider;  
    _raiderMove!:       Move;
    _bossMove!:         Move;
    _raiderMoveData!:   MoveData;
    _bossMoveData!:     MoveData;
    _raiderMoveID!:     number;     // the id of the raider performing the move (affected by instruct)
    _raiderMoveTarget!: number;

    _raidMove1!:      RaidMove;
    _raidMove2!:      RaidMove;

    _result1!:        RaidMoveResult;
    _result2!:        RaidMoveResult;
    _raidState!:      RaidState; // This tracks changes during this turn

    _flags!:          string[][]; 


    constructor(raidState: RaidState, info: RaidTurnInfo) {
        this.raidState = raidState;
        this.raiderID = info.moveInfo.userID;
        this.targetID = info.moveInfo.targetID;
        this.raiderMoveData = info.moveInfo.moveData;
        this.bossMoveData = info.bossMoveInfo.moveData;

        this.raiderOptions = info.moveInfo.options || {};
        this.bossOptions = info.bossMoveInfo.options || {};
    }

    public result(): RaidTurnResult {
        // set up moves
        this._raiderMove = new Move(9, this.raiderMoveData.name, this.raiderOptions);
        if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
        if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        this._bossMove = new Move(9, this.bossMoveData.name, this.bossOptions);
        if (this.bossOptions.crit) this._bossMove.isCrit = true;
        if (this.bossOptions.hits !== undefined) this._bossMove.hits = this.bossOptions.hits;

        // copy the raid state
        this._raidState = this.raidState.clone();
        this._flags = [[], [], [], [], []];

        // determine which move goes first
        this.setTurnOrder();

        this._raiderMoveID = this.raiderID;
        this._raiderMoveTarget = this.targetID;
        this._raiderMoveData = this.raiderMoveData;
        this._bossMoveData = this.bossMoveData;
        
        this.applyChangedMove();

        if (this._raiderMovesFirst) {
            this._raidMove1 = new RaidMove(
                this._raiderMoveData,
                this._raiderMove, 
                this._raidState, 
                this._raiderMoveID, 
                this._raiderMoveTarget,
                this.raiderID,
                this._raiderMovesFirst,
                this.raiderOptions);
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
                this._result1.causesFlinch[0]);
        } else {
            this._raidMove1 = new RaidMove(
                this._bossMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                !this._raiderMovesFirst,
                this.bossOptions);
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
                this._result1.causesFlinch[this.raiderID]);
        }
        this._raidMove2.result();
        this._result2 = this._raidMove2.output
        this._raidState = this._result2.state;
        // item effects
        this.applyEndOfTurnItemEffects();
        // Clear Endure (since side-attacks are not endured)
        this._raidState.raiders[this.raiderID].isEndure = false;
        this._raidState.raiders[0].isEndure = false; // I am unaware of any raid bosses that have endure
        // remove protect / wide guard / quick guard effects
        this.removeProtection();

        return {
            state: this._raidState,
            results: [this._result1, this._result2],
            raiderMovesFirst: this._raiderMovesFirst
        }

    }

    private applyChangedMove() {
        // For this option, pick the most damaging move based on the current field.
        if (this.bossMoveData.name === "(Most Damaging)") {
            const moveOptions = this._raidState.raiders[0].moves;
            let bestMove = moveOptions[0];
            let bestDamage = 0;
            for (const move of moveOptions) {
                const testMove = new Move(9, move, this.bossOptions);
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
            this._bossMoveData = this._raidState.raiders[0].moveData.find((move) => move.name === bestMove) as MoveData;
            console.log(bestMove, this._raidState.raiders[0], this._bossMoveData, this._raidState.raiders[0].moveData, this._raidState.raiders[0].extraMoveData);
            this._bossMove = new Move(9, bestMove, this.bossOptions);
        }
        // Moves that cause different moves to be carried out (Instruct and Copycat, let's not worry about Metronome)
        // Instruct
        if (this.raiderMoveData.name === "Instruct" && this.raidState.raiders[this.targetID].lastMove !== undefined) {
            this._raiderMoveID = this.targetID;
            this._raiderMoveTarget = this.raidState.raiders[this._raiderMoveID].lastTarget!;
            if (this._raiderMoveTarget === this.targetID) { this._raiderMoveTarget = this._raiderMoveID; }
            this._raiderMoveData = this.raidState.raiders[this.targetID].lastMove!
            this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) { this._raiderMove.isCrit = true; }
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        // Copycat
        } else if (this.raiderMoveData.name === "Copycat") {
            this._raiderMoveTarget = this.raidState.raiders[this._raiderMoveID].lastTarget!;
            if (this._raiderMoveTarget === this.targetID) { this._raiderMoveTarget = this._raiderMoveID; }
            this._raiderMoveData = this.raidState.raiders[this.targetID].lastMove!
            this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        // Since we don't have access to choice lock in the UI, we'll just force the move to be the last move used
        } else if (this._raider.isChoiceLocked) {
            this._raiderMoveData = this.raidState.raiders[this.targetID].lastMove!
            this._raiderMove = new Move(9, this._raiderMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
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
                    case "Light Ball":
                        if (!pokemon.types.includes("Electric")) {
                            pokemon.status = "par";
                            this._result2.flags[id].push("par inflicted");
                        }
                        break;
                    case "Flame Orb":
                        if (!pokemon.types.includes("Fire")) { 
                            pokemon.status = "brn";  
                            this._result2.flags[id].push("brn inflicted");
                        }
                        break;
                    case "Toxic Orb":
                        if (!pokemon.types.includes("Poison")) { 
                            pokemon.status = "tox"; 
                            this._result2.flags[id].push("tox inflicted");
                        }
                        break;
                    case "Poison Barb":
                        if (!pokemon.types.includes("Poison")) { 
                            pokemon.status = "psn"; 
                            this._result2.flags[id].push("psn inflicted");
                        }
                        break;
                    default: break
                }
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
}