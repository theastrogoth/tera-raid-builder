import { State } from "../calc/state";
import { calculate, Field, Generations, Move, Pokemon } from "../calc";
import { MoveData, RaidMoveOptions, RaidState, RaidTurnResult, RaidMoveResult, RaidTurnInfo } from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";
import { Raider } from "./interface";
import { RaidMove } from "./RaidMove";
import { AbilityName, ItemName } from "../calc/data/interface";

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

    _raidMove1!:      RaidMove;
    _raidMove2!:      RaidMove;

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
            
            raiderSpeed = this.modifyPokemonSpeedByStatus(raiderSpeed, this._raider.status, this._raider.ability)
            bossSpeed = this.modifyPokemonSpeedByStatus(bossSpeed, this._boss.status, this._boss.ability)

            raiderSpeed = this.modifyPokemonSpeedByItem(raiderSpeed, this._raider.item);
            bossSpeed = this.modifyPokemonSpeedByItem(bossSpeed, this._boss.item);

            raiderSpeed = this.modifyPokemonSpeedByAbility(raiderSpeed, this._raider.ability, this._raider.abilityOn, this._raider.status);
            bossSpeed = this.modifyPokemonSpeedByAbility(bossSpeed, this._boss.ability, this._boss.abilityOn, this._boss.status);

            const raiderField = this.raidState.fields[this.raiderID];
            const bossField = this.raidState.fields[0];
            raiderSpeed = this.modifyPokemonSpeedByField(raiderSpeed, raiderField, this._raider.ability)
            bossSpeed = this.modifyPokemonSpeedByField(bossSpeed, bossField, this._boss.ability)

            this._raiderMovesFirst = bossField.isTrickRoom ? (raiderSpeed < bossSpeed) : (raiderSpeed > bossSpeed);
        }
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