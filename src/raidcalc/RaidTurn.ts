import { State } from "../calc/state";
import { calculate, Field, Generations, Move, Pokemon } from "../calc";
import { MoveData, RaidMoveOptions, RaidState, RaidTurnResult, RaidMoveResult, RaidTurnInfo } from "./interface";
import { getModifiedStat, getQPBoostedStat } from "../calc/mechanics/util";
import { Raider } from "./interface";
import { RaidMove } from "./RaidMove";
import { AbilityName, ItemName, StatIDExceptHP } from "../calc/data/interface";
import pranksterMoves from "../data/prankster_moves.json"

const gen = Generations.get(9);

export class RaidTurn {
    raidState:      RaidState; // We shouldn't mutate this state; it is the result from the previous turn
    raiderID:       number;
    targetID:       number;
    raiderMoveData!: MoveData;
    bossMoveData!:   MoveData;
    raiderOptions:  RaidMoveOptions;
    bossOptions:    RaidMoveOptions;

    _raiderMovesFirst!: boolean;
    _raider!:         Raider;
    _boss!:           Raider;  
    _raiderMove!:     Move;
    _bossMove!:       Move;

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

        // set Protosynthesis / Quark Drive boosts before getting turn order & processing raid turns
        this.setQPBoosts();

        // determine which move goes first
        this.setTurnOrder();

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
            this._raidMove1 = new RaidMove(
                rMoveData,
                this._raiderMove, 
                this._raidState, 
                rID, 
                tID,
                rID,
                this._raiderMovesFirst,
                this.raiderOptions);
            this._result1 = this._raidMove1.result();
            this._raidState = this._result1.state;
            this._raidMove2 = new RaidMove(
                bMoveData,
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                !this._raiderMovesFirst,
                this.bossOptions);
        } else {
            this._raidMove1 = new RaidMove(
                bMoveData, 
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
                rMoveData, 
                this._raiderMove, 
                this._raidState, 
                rID, 
                tID,
                rID,
                this._raiderMovesFirst,
                this.raiderOptions);
        }
        this._raidMove2.result();
        this._raidMove2.applyItemEffects(); // A final check for items triggered by end-of-turn damage
        this._result2 = this._raidMove2.output
        this._raidState = this._result2.state;
        // item effects
        this.applyEndOfTurnItemEffects();
        // Clear Endure (since side-attacks are not endured)
        this._raidState.raiders[this.raiderID].isEndure = false;
        this._raidState.raiders[0].isEndure = false; // I am unaware of any raid bosses that have endure
        // Add QP related flags to the first turn
        for (let i=0; i<5; i++) {
            this._result1.flags[i] = this._result1.flags[i].concat(this._flags[i]);
        }

        return {
            state: this._raidState,
            results: [this._result1, this._result2],
            raiderMovesFirst: this._raiderMovesFirst
        }

    }

    private setQPBoosts() {
        this._raidState.raiders.map((raider, index) => {
            if (raider.ability === "Protosynthesis" || raider.ability === "Quark Drive") {
                if (raider.usedBoosterEnergy) { 
                    return; } // do not change Boost after Booster Energy consumption
                if ( !raider.abilityOn && ( // we only need to set QP if it is currently inactive
                        (this._raidState.fields[index].weather?.includes("Sun") && raider.ability === "Protosynthesis") ||
                        (this._raidState.fields[index].terrain?.includes("Electric") && raider.ability === "Quark Drive")
                    )
                ) { // Sun / Electric Terrain has priority over Booster Energy, Booster Energy is not consumed if QP is already active
                    raider.abilityOn = true;
                    raider.boostedStat = undefined;
                    const qpStat = getQPBoostedStat(raider) as StatIDExceptHP;
                    raider.boostedStat = qpStat;
                    this._flags[index].push(raider.ability + " activated");
                } else if ( raider.abilityOn && ( // we only meed to remove QP if it is currently active
                        (!this._raidState.fields[index].weather?.includes("Sun") && raider.ability === "Protosynthesis") ||
                        (!this._raidState.fields[index].terrain?.includes("Electric") && raider.ability === "Quark Drive")
                    )
                ) { // If a booster energy has not been consumed and the Sun / Electric Terrain is removed, QP will be deactivated 
                    raider.abilityOn = false;
                    raider.boostedStat = undefined;
                    this._flags[index].push(raider.ability + " deactivated");
                }
                // If Booster Energy is held and QP is currently inactive, consume it
                if (!raider.abilityOn && raider.item === "Booster Energy") { // if the raider acquires Booster Energy outside of Turn 0
                    raider.abilityOn = true;
                    raider.boostedStat = undefined;
                    const qpStat = getQPBoostedStat(raider) as StatIDExceptHP;
                    raider.boostedStat = qpStat;
                    raider.item = undefined;
                    raider.usedBoosterEnergy = true;
                    this._flags[index].push("Booster Energy consumed");
                }
            }
        })
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
        } else if (bossPriority < raiderPriority) {
            this._raiderMovesFirst = false;
        } else {
            // if priority is the same, compare speed
            let raiderSpeed = getModifiedStat(this._raider.stats.spe, this._raider.boosts.spe, gen);
            let bossSpeed = getModifiedStat(this._boss.stats.spe, this._boss.boosts.spe, gen);

            const raiderField = this._raidState.fields[this.raiderID];
            const bossField = this._raidState.fields[0];
            raiderSpeed = this.applySpeedModifiers(raiderSpeed, this._raider, raiderField);
            bossSpeed = this.applySpeedModifiers(bossSpeed, this._boss, bossField);

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

    private applySpeedModifiers(speed: number, raider: Raider, field: Field) {
        speed = this.modifyPokemonSpeedByStatus(speed, raider.status, raider.ability);
        speed = this.modifyPokemonSpeedByItem(speed, raider.item);
        speed = this.modifyPokemonSpeedByAbility(speed, raider.ability, raider.abilityOn, raider.status);
        speed = this.modifyPokemonSpeedByQP(speed, field, raider.ability, raider.item, raider.boostedStat as StatIDExceptHP);
        speed = this.modifyPokemonSpeedByField(speed, field);
        return speed;
    }

    private modifyPokemonSpeedByStatus(speed: number, status?: string, ability?: AbilityName) {
        return status === "par" && ability !== "Quick Feet" ? speed * .5 : speed;
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
            case "Unburden":
                return abilityOn ? speed * 2 : speed;
            case "Slow Start":
                return abilityOn ? speed * .5 : speed;
            case "Quick Feet":
                return status ? speed * 1.5 : speed;
            default:
                return speed;
        }
    }

    private modifyPokemonSpeedByQP(speed: number, field: Field, ability?: AbilityName, item?: ItemName, qpBoostedStat?: StatIDExceptHP) {
        return qpBoostedStat === "spe" ? speed * 1.5 : speed;
    }

    private modifyPokemonSpeedByField(speed: number, field: Field, ability?: AbilityName) {
        if (
            ability === "Chlorophyll" && field.weather?.includes("Sun") ||
            ability === "Sand Rush" && field.weather?.includes("Sand") ||
            ability === "Slush Rush" && field.weather?.includes("Snow") ||
            ability === "Swift Swim" && field.weather?.includes("Rain") ||
            ability === "Surge Surfer" && field.terrain?.includes("Electric")
        ) {
            speed *= 2;
        }
        if (field.attackerSide.isTailwind) {
            speed *= 2;
        }
        return speed;
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
}