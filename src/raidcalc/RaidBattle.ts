import { Move, Generations } from "../calc";
import { MoveName } from "../calc/data/interface";
import { TurnGroupInfo } from "./interface";
import { RaidState } from "./RaidState";
import { RaidMove } from "./RaidMove";
import { RaidTurn, RaidTurnResult } from "./RaidTurn";

const gen = Generations.get(9);

export type RaidBattleInfo = {
    name?: string;
    notes?: string;
    credits?: string;
    startingState: RaidState;
    groups: TurnGroupInfo[];
}

export type RaidBattleResults = {
    endState: RaidState;
    turnResults: RaidTurnResult[]; 
    turnZeroFlags: string[][];
    turnZeroOrder: number[];
}

export class RaidBattle {
    startingState: RaidState;
    groups: TurnGroupInfo[];

    _state!: RaidState;
    _turnResults!: RaidTurnResult[];

    _turnZeroFlags!: string[][];
    _turnZeroOrder!: number[];

    constructor(info: RaidBattleInfo) {
        this.startingState = info.startingState;
        this.groups = info.groups;
    }

    public result(): RaidBattleResults {
        try {
            this._state = this.startingState.clone();
            this.calculateTurnZero();
            this.calculateTurns();
            return {
                endState: this._state,
                turnResults: this._turnResults,
                turnZeroFlags: this._turnZeroFlags,
                turnZeroOrder: this._turnZeroOrder
            }
        } catch (e) {
            console.error(e);
            return {
                endState: this.startingState.clone(),
                turnResults: [],
                turnZeroFlags: [[],[],[],[],[],[],[],[],[],[]],
                turnZeroOrder: [0,1,2,3,4]
            }
        }
    }

    private calculateTurns(){
        this._turnResults = [];
        for (let i = 0; i < this.groups.length; i++) {
            const turns = this.groups[i].turns;
            const repeats = this.groups[i].repeats || 1;
            for (let j = 0; j < repeats; j++) {
                for (let k = 0; k < turns.length; k++) {
                    const turn = turns[k];
                    const result = new RaidTurn(this._state, turn).result();
                    this._turnResults.push(result);
                    this._state = result.state;
                }
            }
        }
    }

    private calculateTurnZero(){
        this._turnZeroFlags = [[],[],[],[],[],[],[],[],[],[]];  // each pokemon gets two sets of flags, one for switch-in effects, one for item/ability effects as a result of the first round of effects
        // sort pokemon by speed to see what happens first
        const speeds = this._state.raiders.map(raider => raider.effectiveSpeed);
        const speedOrder = speeds.map((speed, index) => [speed, index]).sort((a, b) => b[0] - a[0]).map(pair => pair[1]);
        this._turnZeroOrder = speedOrder;
        for (let id of speedOrder) {
            const flags = this._state.switchIn(id);
            for (let i=0; i<5; i++) {
                this._turnZeroFlags[i] = this._turnZeroFlags[i].concat(flags[i]);
            }
        }
        // check for item/ability activation by executing dummy moves
        for (let id of speedOrder) {
            const moveResult = new RaidMove(
                {name: "(No Move)" as MoveName, target: "user"}, 
                new Move(gen, "(No Move)"), 
                this._state,
                id,
                id,
                id,
                true,
                ).result();
            this._state = moveResult.state;
            for (let i=0; i<5; i++) {
                this._turnZeroFlags[i+5] = this._turnZeroFlags[i+5].concat(moveResult.flags[i]);
            }
        } 
    }
}