import { Move, Field, Pokemon, StatsTable, StatID, calculate} from "../calc";
import { RaidField, Raider } from "./interface";
import { AilmentName, MoveData } from "../services/getdata";
import { StatusName } from "../calc/data/interface";

function ailmentToStatus(ailment: AilmentName): StatusName | "" {
    if (ailment == "paralysis") { return "par"; }
    if (ailment == "poison") { return "psn"; }
    if (ailment == "burn") { return "brn"; }
    if (ailment == "freeze") { return "frz"; }
    if (ailment == "sleep") { return "slp"; }
    if (ailment == "toxic") { return "tox"; }
    return ""
}

export class MoveEffectCalculator {
    move: Move;
    moveData: MoveData;
    raidField: RaidField;
    userID: number;
    targetID: number;

    max: boolean;

    _raidField!: RaidField;
    _raiders!: Raider[];
    _boss!: Raider;
    _user!: Raider;
    _target!: Raider;
    _affectedPokemon!: Raider[];
    _field!: Field;

    _damage!: number[];
    _desc!: string[];

    constructor(moveData: MoveData, move: Move, raidField: RaidField, userID: number, targetID: number, max?: boolean) {
        this.move = move;
        this.moveData = moveData;
        this.raidField = raidField;
        this.userID = userID;
        this.targetID = targetID;
        this.max = max || false;

        this.setOutputRaidField(raidField);
        this.setAffectedPokemon();
        this.setDamage();
    }

    private swapFieldSides() {
        const tempAttackerSize = this._field.attackerSide;
        this._field.attackerSide = this._field.defenderSide;
        this._field.defenderSide = tempAttackerSize;
    }

    private setOutputRaidField(raidField: RaidField) {
        this._raidField = structuredClone(raidField);
        this._raiders = this._raidField.raiders;
        this._boss = this._raidField.boss;
        this._field = this._raidField.field;
        if (this.userID == -1) { // swap attacker and defender sides of the field for the boss
            this.swapFieldSides()
        }
        this._target = this.targetID == -1 ? this._boss : this._raiders[this.targetID];
    }

    private setAffectedPokemon(): Raider[] {
        const targetType = this.moveData.target;
        if (targetType == "user") { return [this._user]; }
        if (targetType == "selected-pokemon" || targetType == "all-opponents") { return [this._target]; }
        if (targetType == "all-allies") { return this._raiders.slice().splice(this.userID, 1); }
        if (targetType == "user-and-allies") { return this._raiders; }
        return [];
    }

    private setDamage() {
        const result = calculate(9, this._user, this._target, this.move, this._field);
        // this._desc = result.desc();
        // this._damage = 
    }

    private applyDrain() {

    }

    applyBoost(boost: {stat: StatID, change: number}, pokemon: Pokemon) {
        const stat = boost.stat;
        const change = boost.change;
        pokemon.boosts[stat] = (pokemon.boosts[stat] || 0) + change;
        if (Math.abs(pokemon.boosts[stat]) > 6) {
            pokemon.boosts[stat] = 6 * Math.sign(pokemon.boosts[stat]);
        }
    }

    applyAilment(ailment: AilmentName, pokemon: Pokemon) {
        pokemon.status = ailmentToStatus(ailment);
    }

    applySelfDamage(damagePercent: number, pokemon: Pokemon) {
        pokemon.stats.hp -= Math.floor(pokemon.maxHP() * damagePercent/100);
    }

    // boostUser() {
    //     const boosts = this.moveData.statChanges;
    //     for (let i=0; i<boosts.length; i++) {
    //         const boost = boosts[i];
    //         this.applyBoost(boost, this._user);
    //     }
    // }

    // boostTarget() {
    //     const boosts = this.moveData.statChanges;
    //     for (let i=0; i<boosts.length; i++) {
    //         const boost = boosts[i];
    //         this.applyBoost(boost, this._target);
    //     }
    // }
}


function moveEffect(moveData: MoveData, move: Move, field: Field, user: Pokemon, target: Pokemon, allies: Pokemon[]) {
    ///// account for special moves here (Skill Swap, Simple Beam, Soak, Psych Up, Power Swap, Guard Swap, etc.) /////


    ///// deal with status and buff/debuff effects based on PokeAPI data /////
    
    // first identify the move category and target type
    const category = moveData.category; // damage, net-good-stats, damag+raise, damage+lower, damage+ailment, ailment, field-effect, whole-field-effect, 
    const targetType = moveData.target;

    // get the targeted pokemon
    const targetedPokemon = (targetType == "user") ? [user] : 
                            (category == "damage+raise") ? [user] : 
                            (targetType == "selected-pokemon" || targetType == "all-opponents" || targetType == "all-pokemon") ? [target] : 
                            (targetType == "all-allies") ? allies : 
                            (targetType == "user-and-allies") ? [user, ...allies] : [target];

    if (category == "damage" ){ // no additional effects
        return;
    } 
    if (category == "damage+raise" || category == "damage+lower" || category == "net-good-stats" || category == "swagger") { // apply stat changes to targets
        const stat_changes = moveData.statChanges
        const boosts: Partial<StatsTable> = {}; // need to translate between PokeAPI and StatsTable format
        for (let i=0; i<targetedPokemon.length; i++) {
            // TO DO: account for Simple, Contrary
            for (let stat in Object.keys(boosts)) {
                const statid = stat as StatID;
                targetedPokemon[i].boosts[statid] = (targetedPokemon[i].boosts[statid] || 0) + (boosts[statid] || 0);
                if (Math.abs(targetedPokemon[i].boosts[statid]) > 6) {
                    targetedPokemon[i].boosts[statid] = 6 * Math.sign(targetedPokemon[i].boosts[statid]);
                }
            }
        }
    } 
    if (category == "ailment" || category == "damage+ailment" || category == "swagger"){ // apply ailment to target
        const status = moveData.ailment;
        for (let i=0; i<targetedPokemon.length; i++) {
            targetedPokemon[i].status = ailmentToStatus(status);
        }
    }
    if (category == "field-effect") { // apply half-field effects
        if (moveData.name == 'tailwind') {
            field.attackerSide.isTailwind = true; // TO DO: make sure this is the correct side
        } else if(moveData.name == 'light-screen') {
            field.attackerSide.isLightScreen = true;
        } else if(moveData.name == 'reflect') {
            field.attackerSide.isLightScreen = true;
        }
    }
    if (category == "whole-field-effect") { // apply whole-field effects
        if (moveData.name == 'trick-room') {
            field.isTrickRoom = !field.isTrickRoom;
        } else if (moveData.name == 'gravity') {
            field.isGravity = !field.isGravity;
        } else if (moveData.name == 'rain-dance') {
            field.weather = 'Rain';
        } else if (moveData.name == 'sunny-day') {
            field.weather = 'Sun';
        } else if (moveData.name == 'snowscape') {
            field.weather = 'Snow';
        } else if (moveData.name == 'sandstorm') {
            field.weather = 'Sand';
        }
    }

    ///// deal with additional ability-related effects /////
    // TO DO: Anger Point, Weak Armor, what else?

    return {field, user, target, allies}
}

export default MoveEffectCalculator;