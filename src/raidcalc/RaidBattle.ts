import { Move, Generations, Pokemon } from "../calc";
import { MoveName, ItemName, SpeciesName } from "../calc/data/interface";
import { RaidTurnInfo } from "./interface";
import { RaidState } from "./RaidState";
import { RaidMove } from "./RaidMove";
import { getBoostCoefficient, safeStatStage } from "./util";
import { RaidTurn, RaidTurnResult } from "./RaidTurn";
import { Raider } from "./Raider";

const gen = Generations.get(9);

export type RaidBattleInfo = {
    name?: string;
    notes?: string;
    credits?: string;
    startingState: RaidState;
    turns: RaidTurnInfo[][]; // turns are stored in arrays by group
    repeats?: number[]; // each group can be repeated multiple times if specified
}

export type RaidBattleResults = {
    endState: RaidState;
    turnResults: RaidTurnResult[]; 
    turnZeroFlags: string[][];
    turnZeroOrder: number[];
}

export class RaidBattle {
    startingState: RaidState;
    turns: RaidTurnInfo[][];
    repeats?: number[];

    _state!: RaidState;
    _turnResults!: RaidTurnResult[];

    _turnZeroFlags!: string[][];
    _turnZeroOrder!: number[];

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
        for (let i = 0; i < this.turns.length; i++) {
            const turnGroup = this.turns[i];
            for (let j = 0; j < turnGroup.length; j++) {
                const turn = turnGroup[j];
                const repeats = this.repeats ? this.repeats[i] : 1;
                for (let k = 0; k < repeats; k++) {
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
            const pokemon = this._state.raiders[id];
            const ability = pokemon.ability;
            //// Abilites That Take Effect at the start of the battle
            /// Weather Abilities
            if (ability === "Drought") {
                this._state.applyWeather("Sun");
                this._turnZeroFlags[id].push("Drought summons the Sun");
            } else if (ability === "Drizzle") {
                this._state.applyWeather("Rain");
                this._turnZeroFlags[id].push("Drizzle summons the Rain");
            } else if (ability === "Sand Stream") {
                this._state.applyWeather("Sand");
                this._turnZeroFlags[id].push("Sand Stream summons a Sandstorm");
            } else if (ability === "Snow Warning") {
                this._state.applyWeather("Snow");
                this._turnZeroFlags[id].push("Snow Warning summons a Snowstorm");
            } else if (ability === "Orichalcum Pulse") {
                this._state.applyWeather("Sun");
                this._turnZeroFlags[id].push("Orichalcum Pulse summons the Sun");
            } else if (ability === "Cloud Nine" || ability === "Air Lock") {
                for (let field of this._state.fields) {
                    field.isCloudNine = true;
                }
                this._turnZeroFlags[id].push("Cloud Nine negates the weather");
            /// Terrain Abilities
            } else if (ability === "Grassy Surge") {
                this._state.applyTerrain("Grassy");
                this._turnZeroFlags[id].push("Grassy Surge summons Grassy Terrain");
            } else if (ability === "Electric Surge") {
                this._state.applyTerrain("Electric");
                this._turnZeroFlags[id].push("Electric Surge summons Electric Terrain");
            } else if (ability === "Misty Surge") {
                this._state.applyTerrain("Misty");
                this._turnZeroFlags[id].push("Misty Surge summons Misty Terrain");
            } else if (ability === "Psychic Surge") {
                this._state.applyTerrain("Psychic");
                this._turnZeroFlags[id].push("Psychic Surge summons Psychic Terrain");
            } else if (ability === "Hadron Engine") {
                this._state.applyTerrain("Electric");
                this._turnZeroFlags[id].push("Hadron Engine summons Electric Terrain");
            /// Ruin Abilities
            } else if (ability === "Sword of Ruin") {
                for (let field of this._state.fields) {
                    field.isSwordOfRuin = true;
                }
                this._turnZeroFlags[id].push("Sword of Ruin lowers Defenses");
            } else if (ability === "Beads of Ruin") {
                for (let field of this._state.fields) {
                    field.isBeadsOfRuin = true;
                }
                this._turnZeroFlags[id].push("Beads of Ruin lowers Special Defenses");
            } else if (ability === "Vessel of Ruin") {
                for (let field of this._state.fields) {
                    field.isVesselOfRuin = true;
                }
                this._turnZeroFlags[id].push("Vessel of Ruin lowers Special Attacks");
            } else if (ability === "Tablets of Ruin") {
                for (let field of this._state.fields) {
                    field.isTabletsOfRuin = true;
                }
                this._turnZeroFlags[id].push("Tablets of Ruin lowers Attacks");
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
                this._turnZeroFlags[id].push("Steely Spirit boosts Allies' Steel-type attacks");
            // Aroma Veil
            } else if (ability === "Aroma Veil") {
                if (id === 0) {
                    this._state.fields[0].attackerSide.isAromaVeil = true;
                } else {
                    for (let field of this._state.fields.slice(1)) {
                        field.attackerSide.isAromaVeil = true;
                    }
                }
                this._turnZeroFlags[id].push("Aroma Veil protects allies");
            // Power Spot
            } else if (ability === "Power Spot") {
                if (id === 0) {
                    this._state.fields[0].attackerSide.powerSpots += 1;
                } else {
                    for (let field of this._state.fields.slice(1)) {
                        field.attackerSide.powerSpots += 1;
                    }
                }
                this._turnZeroFlags[id].push("Power Spot boosts attack power");
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
                this._turnZeroFlags[id].push("Friend Guard reduces allies' damage taken");
            // Protosynthesis and Quark Drive
            } else if (ability === "Protosynthesis" || ability === "Quark Drive") {
                if (pokemon.item === "Booster Energy" && !pokemon.abilityOn) {
                    this._state.recieveItem(id, "Booster Energy" as ItemName); // consume Booster Energy
                }
            // Intimidate
            } else if (ability === "Intimidate") {
                if (id === 0) {
                    for (let intdPokemon of this._state.raiders.slice(1)) {
                        if (!["Oblivious", "Own Tempo", "Inner Focus", "Scrappy"].includes(pokemon.ability || "")) {
                            const boostCoefficient = getBoostCoefficient(pokemon);
                            const origAtk = intdPokemon.boosts.atk;
                            intdPokemon.boosts.atk = safeStatStage(intdPokemon.boosts.atk - boostCoefficient);
                            this._turnZeroFlags[id].push("Atk: " + origAtk + "->" + intdPokemon.boosts.atk + " (Intimidate)");
                        }
                    }
                } else {
                    const intdPokemon = this._state.raiders[0];
                    if (!["Oblivious", "Own Tempo", "Inner Focus", "Scrappy"].includes(intdPokemon.ability || "")) {
                        const boostCoefficient = getBoostCoefficient(intdPokemon);
                        const origAtk = intdPokemon.boosts.atk;
                        intdPokemon.boosts.atk = safeStatStage(intdPokemon.boosts.atk - boostCoefficient);
                        this._turnZeroFlags[0].push("Atk: " + origAtk + "->" + intdPokemon.boosts.atk + " (Intimidate)");

                    }                
                }
            // Intrepid Sword
            } else if (ability === "Intrepid Sword") {
                const origAtk = pokemon.boosts.atk;
                pokemon.boosts.atk += 1;
                this._turnZeroFlags[0].push("Atk: " + origAtk + "->" + pokemon.boosts.atk + " (Intrepid Sword)");
            // Dauntless Shield
            } else if (ability === "Dauntless Shield") {
                const origDef = pokemon.boosts.def;
                pokemon.boosts.def += 1;
                this._turnZeroFlags[0].push("Def: " + origDef + "->" + pokemon.boosts.def + " (Dauntless Shield)");
            } else {
                // 
            }
            /// special interactions
            // Mew stat boosts for Mewtwo event.
            if (id !== 0 && pokemon.name === "Mew" && this._state.raiders[0].name === "Mewtwo") {
                this._state.raiders[id] = new Raider(
                    id,
                    pokemon.role,
                    pokemon.shiny,
                    pokemon.field.clone(),
                    new Pokemon(
                        gen,
                        pokemon.name as SpeciesName,
                        {
                            ...pokemon,
                            statMultipliers: {
                                hp: 1.5,
                                atk: 1.2,
                                def: 1.2,
                                spa: 1.2,
                                spd: 1.2,
                                spe: 1.2,
                            }
                        }
                    ),
                    [...pokemon.moveData],
                    [...(pokemon.extraMoves || [])],
                    [...(pokemon.extraMoveData || [])],

                );
                this._state.raiders[id].originalCurHP = this._state.raiders[id].maxHP();
                this._turnZeroFlags[id].push(pokemon.role + " is going to go all out against this formidable opponent!")
            }
        }
        // check for item/ability activation by executing dummy moves
        for (let id of speedOrder) {
            const moveResult = new RaidMove(
                {name: "(No move)" as MoveName, target: "user"}, 
                new Move(gen, "(No move)"), 
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