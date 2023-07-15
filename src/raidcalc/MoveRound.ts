import { State } from "../calc/state";
import { calculate, Field, Move, Pokemon } from "../calc";
import { MoveData, RaidState, RaidRoundResult, RaidMoveResult } from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";
import { MoveEffect } from "./MoveEffect";

export class MoveRound {
    raidState:      RaidState;
    raiderID:       number;
    targetID:       number;
    raiderMoveData!: MoveData;
    bossMoveData!:   MoveData;
    raiderOptions:  Partial<State.Move>;
    bossOptions:    Partial<State.Move>;
    secondaryEffects?: boolean;
    roll?: "max" | "min" | "avg";

    //options should include crit, boosts/drops, status effect, min/max damage roll

    _raiderMovesFirst!: boolean;
    _raider!:         Pokemon;
    _raiderMove!:     Move;
    _bossMove!:       Move;

    _result1!:        RaidMoveResult;
    _result2!:        RaidMoveResult;
    _raidState!:      RaidState;


    constructor(raidState: RaidState, raiderID: number, targetID: number, 
                raiderMoveData: MoveData, bossMoveData: MoveData,
                raiderOptions?: Partial<State.Move>, bossOptions?: Partial<State.Move>,
                secondaryEffects?: boolean, roll?: "max" | "min" | "avg") {
        this.raidState = raidState;
        this.raiderID = raiderID;
        this.targetID = targetID;
        this.raiderMoveData = raiderMoveData;
        this.bossMoveData = bossMoveData;

        this.raiderOptions = raiderOptions || {};
        this.bossOptions = bossOptions || {};
        this.secondaryEffects = secondaryEffects;
        this.roll = roll;
    }

    public result(): RaidRoundResult {
        this._raiderMove = new Move(9, this.raiderMoveData.name, this.raiderOptions);
        this._bossMove = new Move(9, this.bossMoveData.name, this.bossOptions);
        this.setTurnOrder();
        this._raidState = structuredClone(this.raidState);
        if (this._raiderMovesFirst) {
            this._result1 = new MoveEffect(
                this.raiderMoveData, 
                this._raiderMove, 
                this._raidState, 
                this.raiderID, 
                this.targetID,
                this.raiderID,
                this._raiderMovesFirst,
                this.secondaryEffects,
                this.roll).result();
            this._raidState = this._result1.state;
            this._result2 = new MoveEffect(
                this.bossMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                this._raiderMovesFirst,
                this.secondaryEffects,
                this.roll).result();
            this._raidState = this._result2.state;
        } else {
            this._result1 = new MoveEffect(
                this.bossMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                this._raiderMovesFirst,
                this.secondaryEffects,
                this.roll).result();
            this._raidState = this._result1.state;
            this._result2 = new MoveEffect(
                this.raiderMoveData, 
                this._raiderMove, 
                this._raidState, 
                this.raiderID, 
                this.targetID,
                this.raiderID,
                this._raiderMovesFirst,
                this.secondaryEffects,
                this.roll).result();
            this._raidState = this._result2.state;
        }
        return {
            state: this._raidState,
            results: [this._result1, this._result2],
            raiderMovesFirst: this._raiderMovesFirst
        }

    }

    private setTurnOrder() {
        // first compare priority
        const raiderPriority = this._raiderMove.priority;
        const bossPriority = this._bossMove.priority;
        if (raiderPriority > bossPriority) {
            this._raiderMovesFirst = true;
        } else if (bossPriority < raiderPriority) {
            this._raiderMovesFirst = false;
        } else {
            // if priority is the same, compare speed
            //@ts-ignore
            let raiderSpeed = getModifiedStat(this.raider.stats.spe, this.raider.boosts.spe, 9);
            //@ts-ignore
            let bossSpeed = getModifiedStat(this.boss.stats.spe, this.boss.boosts.spe, 9);
            const bossField = this.raidState.fields[0];
            const raiderField = this.raidState.fields[this.raiderID];
            if (raiderField.attackerSide.isTailwind) { raiderSpeed *= 2 };
            if (bossField.attackerSide.isTailwind) { bossSpeed *= 2 };
            this._raiderMovesFirst = bossField.isTrickRoom ? (raiderSpeed > bossSpeed) : (raiderSpeed < bossSpeed);
        }
    }
    
}