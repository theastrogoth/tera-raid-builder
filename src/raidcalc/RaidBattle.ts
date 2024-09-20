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
    turnZeroState: RaidState;
}

export class RaidBattle {
    startingState: RaidState;
    groups: TurnGroupInfo[];

    _continuing!: boolean

    _turnZeroState!: RaidState;
    _state!: RaidState;
    _turnResults!: RaidTurnResult[];

    _turnZeroFlags!: string[][];
    _turnZeroOrder!: number[];

    _firstRaiderHasMoved!: boolean;
    _numNPCs!: number;

    constructor(info: RaidBattleInfo, result: RaidBattleResults | null = null) {
        if (result) {
            this.startingState = result.endState;
            this.groups = info.groups;
            this._turnZeroState = result.turnZeroState;
            this._turnResults = result.turnResults;
            this._turnZeroFlags = result.turnZeroFlags;
            this._turnZeroOrder = result.turnZeroOrder;
            this._continuing = true;
            this._firstRaiderHasMoved = this._turnResults.some(turn => turn.moveInfo.userID === 1 && turn.moveInfo.moveData.name !== "(No Move)");
        } else {
            this.startingState = info.startingState;
            this.groups = info.groups;
            this._turnResults = [];
            this._continuing = false;
            this._firstRaiderHasMoved = false;
        }
        this._numNPCs = this.startingState.raiders.reduce((acc, raider) => acc + (raider.name === "NPC" ? 1 : 0), 0);
    }

    public result(): RaidBattleResults {
        try {
            this._state = this.startingState.clone();
            if (!this._continuing) {
                this.calculateTurnZero();
            }
            const t0 = this._state.clone();
            this.calculateTurns();
            return {
                endState: this._state,
                turnResults: this._turnResults,
                turnZeroFlags: this._turnZeroFlags,
                turnZeroOrder: this._turnZeroOrder,
                turnZeroState: this._turnZeroState,
            }
        } catch (e) {
            console.error(e);
            return {
                endState: this.startingState.clone(),
                turnResults: [],
                turnZeroFlags: [[],[],[],[],[],[],[],[],[],[]],
                turnZeroOrder: [0,1,2,3,4],
                turnZeroState: this.startingState.clone()
            }
        }
    }

    private calculateTurns(){
        let turnCounter = 0;
        if (this._continuing && this._turnResults.length > 0) {
            const previousTurn = this._turnResults[this._turnResults.length - 1];
            turnCounter = previousTurn.turnNumber + (previousTurn.moveInfo.moveData.name !== "(No Move)" ? 1 : 0);
        }
        for (let i = 0; i < this.groups.length; i++) {
            const turns = this.groups[i].turns;
            const repeats = this.groups[i].repeats || 1;
            for (let j = 0; j < repeats; j++) {
                for (let k = 0; k < turns.length; k++) {
                    const turn = turns[k];
                    const result = new RaidTurn(this._state, turn, turnCounter, this._numNPCs).result();
                    this._turnResults.push(result);
                    this._state = result.state;
                    if(turn.moveInfo.moveData.name !== "(No Move)") {

                        if (turn.moveInfo.userID === 1 && this._numNPCs > 0) {
                            if (!this._firstRaiderHasMoved) {
                                const firstNPC = this._state.raiders.find(raider => raider.name === "NPC")!;
                                const defCheerResult = new RaidTurn(
                                    this._state,
                                    {
                                        id: -1,
                                        group: turn.group,
                                        moveInfo: {moveData: {name: "Defense Cheer" as MoveName}, userID: firstNPC.id, targetID: firstNPC.id},
                                        bossMoveInfo: {moveData: {name: "(Most Damaging)" as MoveName}, userID: 0, targetID: firstNPC.id, options: turn.bossMoveInfo.options},
                                    },
                                    turnCounter,
                                    0
                                ).result();
                                this._turnResults.push(defCheerResult);
                                this._firstRaiderHasMoved = true;
                                this._state = defCheerResult.state;
                            }
                            turnCounter = turnCounter + 1 + this._numNPCs;
                        } else {
                            turnCounter++;
                        }
                    }
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
        // activate switch-in effects
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
            this._turnZeroState = moveResult.state;
            for (let i=0; i<5; i++) {
                this._turnZeroFlags[i+5] = this._turnZeroFlags[i+5].concat(moveResult.flags[i]);
            }
        } 
    }
}