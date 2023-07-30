import { Move, Generations } from "../calc";
import { StatIDExceptHP, MoveName, AbilityName, ItemName } from "../calc/data/interface";
import { getQPBoostedStat } from "../calc/mechanics/util";
import { RaidState, RaidBattleInfo, RaidTurnInfo, RaidTurnResult, RaidBattleResults } from "./interface";
import { getBoostCoefficient, RaidMove, safeStatStage } from "./RaidMove";
import { RaidTurn } from "./RaidTurn";

const gen = Generations.get(9);

export class RaidBattle {
    startingState: RaidState;
    turns: RaidTurnInfo[];

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
            const turn = this.turns[i];
            const result = new RaidTurn(this._state, turn).result();
            this._turnResults.push(result);
            this._state = result.state;
        }
    }

    private calculateTurnZero(){
        this._turnZeroFlags = [[],[],[],[],[],[],[],[],[],[]];  // each pokemon gets two sets of flags, one for switch-in effects, one for item/ability effects as a result of the first round of effects
        // sort pokemon by speed to see what happens first
        const speeds = this._state.raiders.map(raider => {
            let s = raider.stats.spe;
            s = this.modifyPokemonSpeedByAbility(s, raider.ability);
            s = this.modifyPokemonSpeedByItem(s, raider.item);
            return s;
        });
        const speedOrder = speeds.map((speed, index) => [speed, index]).sort((a, b) => b[0] - a[0]).map(pair => pair[1]);
        this._turnZeroOrder = speedOrder;
        for (let id of speedOrder) {
            const pokemon = this._state.raiders[id];
            const ability = pokemon.ability;
            //// Abilites That Take Effect at the start of the battle
            /// Weather Abilities
            if (ability === "Drought") {
                for (let field of this._state.fields) {
                    field.weather = "Sun";
                }
                this._turnZeroFlags[id].push("Drought summons the Sun");
            } else if (ability === "Drizzle") {
                for (let field of this._state.fields) {
                    field.weather = "Rain";
                }
                this._turnZeroFlags[id].push("Drizzle summons the Rain");
            } else if (ability === "Sand Stream") {
                for (let field of this._state.fields) {
                    field.weather = "Sand";
                }
                this._turnZeroFlags[id].push("Sand Stream summons a Sandstorm");
            } else if (ability === "Snow Warning") {
                for (let field of this._state.fields) {
                    field.weather = "Snow";
                }
                this._turnZeroFlags[id].push("Snow Warning summons a Snowstorm");
            } else if (ability === "Orichalcum Pulse") {
                for (let field of this._state.fields) {
                    field.weather = "Sun";
                }
                this._turnZeroFlags[id].push("Orichalcum Pulse summons the Sun");
            } else if (ability === "Cloud Nine" || ability === "Air Lock") {
                for (let field of this._state.fields) {
                    field.isCloudNine = true;
                }
                this._turnZeroFlags[id].push("Cloud Nine negates the weather");
            /// Terrain Abilities
            } else if (ability === "Grassy Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Grassy";
                }
                this._turnZeroFlags[id].push("Grassy Surge summons Grassy Terrain");
            } else if (ability === "Electric Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Electric";
                }
                this._turnZeroFlags[id].push("Electric Surge summons Electric Terrain");
            } else if (ability === "Misty Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Misty";
                }
                this._turnZeroFlags[id].push("Misty Surge summons Misty Terrain");
            } else if (ability === "Psychic Surge") {
                for (let field of this._state.fields) {
                    field.terrain = "Psychic";
                }
                this._turnZeroFlags[id].push("Psychic Surge summons Psychic Terrain");
            } else if (ability === "Hadron Engine") {
                for (let field of this._state.fields) {
                    field.terrain = "Electric";
                }
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
                if (pokemon.item === "Booster Energy") {
                    pokemon.abilityOn = true;
                    const qpStat = getQPBoostedStat (pokemon) as StatIDExceptHP;
                    pokemon.boostedStat = qpStat;
                    pokemon.item = undefined;
                    pokemon.usedBoosterEnergy = true;
                    this._turnZeroFlags[id].push("Booster Energy consumed");
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

    private modifyPokemonSpeedByItem(speed : number, item?: ItemName) {
        switch(item) {
            case "Choice Scarf":
                return speed * 1.5;
            case "Iron Ball":
            case "Macho Brace":
            case "Power Anklet":
            case "Power Band":
            case "Power Belt":
            case "Power Bracer":
            case "Power Lens":
            case "Power Weight":
                return speed * .5;
            case "Lagging Tail":
            case "Full Incense":
                return 0;
            // TODO: Quick Powder doubles the speed of untransformed Ditto
            default:
                return speed;
        }
    }
    private modifyPokemonSpeedByAbility(speed: number, ability?: AbilityName, abilityOn?: boolean, status?: string) {
        switch(ability) {
            case "Slow Start":
                return abilityOn ? speed * .5 : speed;
            default:
                return speed;
        }
    }
}