import { StatIDExceptHP } from "../calc/data/interface";
import { getQPBoostedStat } from "../calc/mechanics/util";
import { RaidState, RaidBattleInfo, RaidTurnInfo, RaidTurnResult, RaidBattleResults } from "./interface";
import { RaidTurn } from "./RaidTurn";

export class RaidBattle {
    startingState: RaidState;
    turns: RaidTurnInfo[];

    _state!: RaidState;
    _turnResults!: RaidTurnResult[];

    constructor(info: RaidBattleInfo) {
        this.startingState = info.startingState;
        this.turns = info.turns;
    }

    public result(): RaidBattleResults {
        try {
            this._state = this.startingState.clone();
            this.calculateTurnZero();
            this.calculateTurns();
            return {
                endState: this._state,
                turnResults: this._turnResults
            }
        } catch (e) {
            console.error(e);
            return {
                endState: this.startingState.clone(),
                turnResults: []
            }
        }
    }

    private calculateTurns(){
        this._turnResults = [];
        for (let i = 0; i < this.turns.length; i++) {
            const turn = this.turns[i];
            const result = new RaidTurn(this._state, turn).result();
            this._turnResults.push(result);
            this._state = result.state;
        }
    }

    private calculateTurnZero(){
        // sort pokemon by speed to see what happens first
        const speeds = this._state.raiders.map(raider => raider.stats.spe);
        const speedOrder = speeds.map((speed, index) => [speed, index]).sort((a, b) => b[0] - a[0]).map(pair => pair[1]);
        for (let id of speedOrder) {
            const pokemon = this._state.raiders[id];
            const ability = pokemon.ability;
            //// Abilites That Take Effect at the start of the battle
            /// Weather Abilities
            if (ability === "Drought") {
                for (let field of this._state.fields) {
                    field.weather = "Sun";
                }
            } else if (ability === "Drizzle") {
                for (let field of this._state.fields) {
                    field.weather = "Rain";
                }
            } else if (ability === "Sand Stream") {
                for (let field of this._state.fields) {
                    field.weather = "Sand";
                }
            } else if (ability === "Snow Warning") {
                for (let field of this._state.fields) {
                    field.weather = "Snow";
                }
            } else if (ability === "Orichalcum Pulse") {
                for (let field of this._state.fields) {
                    field.weather = "Sun";
                }
            } else if (ability === "Cloud Nine" || ability === "Air Lock") {
                for (let field of this._state.fields) {
                    field.isCloudNine = true;
                }
            /// Terrain Abilities
            } else if (ability === "Grassy Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Grassy";
                }
            } else if (ability === "Electric Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Electric";
                }
            } else if (ability === "Misty Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Misty";
                }
            } else if (ability === "Psychic Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Psychic";
                }
            } else if (ability === "Hadron Engine") {
                for (let field of this._state.fields) {
                    field.terrain = "Electric";
                }
            /// Ruin Abilities
            } else if (ability === "Sword of Ruin") {
                for (let field of this._state.fields) {
                    field.isSwordOfRuin = true;
                }
            } else if (ability === "Beads of Ruin") {
                for (let field of this._state.fields) {
                    field.isBeadsOfRuin = true;
                }
            } else if (ability === "Vessel of Ruin") {
                for (let field of this._state.fields) {
                    field.isVesselOfRuin = true;
                }
            } else if (ability === "Tablets of Ruin") {
                for (let field of this._state.fields) {
                    field.isTabletsOfRuin = true;
                }
            /// Other Field-Related Abilities
            // Steely Spirit
            } else if (ability === "Steely Spirit") {
                if (id === 0) {
                    this._state.fields[0].attackerSide.steelySpirits += 1;
                }
                else {
                    for (let field of this._state.fields.slice(1)) {
                        field.attackerSide.steelySpirits += 1;
                    }
                }
            // Aroma Veil
            } else if (ability === "Aroma Veil") {
                if (id === 0) {
                    this._state.fields[0].attackerSide.isAromaVeil = true;
                } else {
                    for (let field of this._state.fields.slice(1)) {
                        field.attackerSide.isAromaVeil = true;
                    }
                }
            // Power Spot
            } else if (ability === "Power Spot") {
                if (id === 0) {
                    this._state.fields[0].attackerSide.powerSpots += 1;
                } else {
                    for (let field of this._state.fields.slice(1)) {
                        field.attackerSide.powerSpots += 1;
                    }
                }
            // Friend Guard
            } else if (ability === "Friend Guard") {
                if (id !== 0) {
                    for (let fid=1; fid<5; fid++) {
                        if (id !== fid) {
                            this._state.fields[fid].attackerSide.friendGuards += 1;
                        }
                    }
                    this._state.fields[0].defenderSide.friendGuards += 1; // this shouldn't ever be used
                }
            // Protosynthesis and Quark Drive
            } else if (ability === "Protosynthesis" || ability === "Quark Drive") {
                if (pokemon.item === "Booster Energy") {
                    pokemon.abilityOn = true;
                    const qpStat = getQPBoostedStat (pokemon) as StatIDExceptHP;
                    pokemon.boostedStat = qpStat;
                    pokemon.item = undefined;
                }
            // Intimidate
            } else if (ability === "Intimidate") {
                if (id === 0) {
                    for (let pokemon of this._state.raiders.slice(1)) {
                        if (["Oblivious", "Own Tempo", "Inner Focus", "Scrappy"].includes(pokemon.ability || "")) {
                            pokemon.boosts.atk = Math.max(-6, pokemon.boosts.atk - 1);
                        }
                    }
                } else {
                    if (["Oblivious", "Own Tempo", "Inner Focus", "Scrappy"].includes(pokemon.ability || "")) {
                        pokemon.boosts.atk = Math.max(-6, pokemon.boosts.atk - 1);
                    }                }
            // Intrepid Sword
            } else if (ability === "Intrepid Sword") {
                pokemon.boosts.atk += 1;
            // Dauntless Shield
            } else if (ability === "Dauntless Shield") {
                pokemon.boosts.def += 1;
            } else {
                // 
            }
        
        }
    }


}