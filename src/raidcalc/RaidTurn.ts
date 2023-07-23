import { State } from "../calc/state";
import { calculate, Field, Generations, Move, Pokemon } from "../calc";
import { MoveData, RaidMoveOptions, RaidState, RaidTurnResult, RaidMoveResult, RaidTurnInfo } from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";
import { Raider } from "./interface";
import { RaidMove } from "./RaidMove";

const gen = Generations.get(9);

export class RaidTurn {
    raidState:      RaidState;
    raiderID:       number;
    targetID:       number;
    raiderMoveData!: MoveData;
    bossMoveData!:   MoveData;
    raiderOptions:  RaidMoveOptions;
    bossOptions:    RaidMoveOptions;

    //options should include crit, boosts/drops, status effect, min/max damage roll

    _raiderMovesFirst!: boolean;
    _raider!:         Raider;
    _boss!:           Raider;  
    _raiderMove!:     Move;
    _bossMove!:       Move;

    _result1!:        RaidMoveResult;
    _result2!:        RaidMoveResult;
    _raidState!:      RaidState;


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

        // determine which move goes first
        this.setTurnOrder();

        // copy the raid state
        this._raidState = this.raidState.clone();

        let rID = this.raiderID;
        let tID = this.targetID;
        let rMoveData = this.raiderMoveData;
        let bMoveData = this.bossMoveData;
        // Moves that cause different moves to be carried out (Instruct and Copycat, let's not worry about Metronome)
        if (this.raiderMoveData.name === "Instruct" && this.raidState.raiders[this.targetID].lastMove !== undefined) {
            rID = this.targetID;
            tID = this.raidState.raiders[rID].lastTarget!;
            if (tID === this.targetID) { tID = rID; }
            rMoveData = this.raidState.raiders[this.targetID].lastMove!
            this._raiderMove = new Move(9, rMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        } else if (this.raiderMoveData.name === "Copycat") {
            tID = this.raidState.raiders[rID].lastTarget!;
            if (tID === this.targetID) { tID = rID; }
            bMoveData = this.raidState.raiders[this.targetID].lastMove!
            this._raiderMove = new Move(9, bMoveData.name, this.raiderOptions);
            if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
            if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        } 
        if (this._raiderMovesFirst) {
            this._result1 = new RaidMove(
                rMoveData,
                this._raiderMove, 
                this._raidState, 
                rID, 
                tID,
                rID,
                this._raiderMovesFirst,
                this.raiderOptions).result();
            this._raidState = this._result1.state;
            this._result2 = new RaidMove(
                bMoveData,
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                !this._raiderMovesFirst,
                this.bossOptions).result();
            this._raidState = this._result2.state;
        } else {
            this._result1 = new RaidMove(
                bMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                !this._raiderMovesFirst,
                this.bossOptions).result();
            this._raidState = this._result1.state;
            this._result2 = new RaidMove(
                rMoveData, 
                this._raiderMove, 
                this._raidState, 
                rID, 
                tID,
                rID,
                this._raiderMovesFirst,
                this.raiderOptions).result();
            this._raidState = this._result2.state;
        }
        // item effects
        this.applyEndOfTurnItemEffects();
        // Clear Endure (since side-attacks are not endured)
        this._raidState.raiders[this.raiderID].isEndure = false;
        this._raidState.raiders[0].isEndure = false; // I am unaware of any raid bosses that have endure
        return {
            state: this._raidState,
            results: [this._result1, this._result2],
            raiderMovesFirst: this._raiderMovesFirst
        }

    }

    private setTurnOrder() {
        this._raider = this.raidState.raiders[this.raiderID];
        this._boss = this.raidState.raiders[0];
        // first compare priority
        const raiderPriority = this.raiderMoveData.priority || this._raiderMove.priority;
        const bossPriority = this.bossMoveData.priority || this._bossMove.priority;
        if (raiderPriority > bossPriority) {
            this._raiderMovesFirst = true;
        } else if (bossPriority < raiderPriority) {
            this._raiderMovesFirst = false;
        } else {
            // if priority is the same, compare speed
            let raiderSpeed = getModifiedStat(this._raider.stats.spe, this._raider.boosts.spe, gen);
            let bossSpeed = getModifiedStat(this._boss.stats.spe, this._boss.boosts.spe, gen);
            const bossField = this.raidState.fields[0];
            const raiderField = this.raidState.fields[this.raiderID];
            if (raiderField.attackerSide.isTailwind) { raiderSpeed *= 2 };
            if (bossField.attackerSide.isTailwind) { bossSpeed *= 2 };
            this._raiderMovesFirst = bossField.isTrickRoom ? (raiderSpeed < bossSpeed) : (raiderSpeed > bossSpeed);
        }
    }

    private applyEndOfTurnItemEffects() {
        for (let id of [0, this.raiderID]) {
            const pokemon = this._raidState.raiders[id];
            const result = this._raiderMovesFirst ? (
                id === 0 ? this._result2 : this._result1
            ) : (
                id === 0 ? this._result1 : this._result2
            );
            // Ailment-inducing Items
            if (pokemon.status === undefined || pokemon.status === "") {
                switch (pokemon.item) {
                    case "Light Ball":
                        if (!pokemon.types.includes("Electric")) {
                            pokemon.status = "par";
                            result.flags[id].push("par inflicted");
                        }
                        break;
                    case "Flame Orb":
                        if (!pokemon.types.includes("Fire")) { 
                            pokemon.status = "brn";  
                            result.flags[id].push("brn inflicted");
                        }
                        break;
                    case "Toxic Orb":
                        if (!pokemon.types.includes("Poison")) { 
                            pokemon.status = "tox"; 
                            result.flags[id].push("tox inflicted");
                        }
                        break;
                    case "Poison Barb":
                        if (!pokemon.types.includes("Poison")) { 
                            pokemon.status = "psn"; 
                            result.flags[id].push("psn inflicted");
                        }
                        break;
                    default: break
                }
            }
        }
    }
}