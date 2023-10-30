import { Field, Pokemon, Generations } from "../calc";
import { MoveName, StatsTable, StatIDExceptHP, AbilityName } from "../calc/data/interface";
import { extend } from '../calc/util';
import { safeStatStage, modifyPokemonSpeedByAbility, modifyPokemonSpeedByField, modifyPokemonSpeedByItem, modifyPokemonSpeedByQP, modifyPokemonSpeedByStatus } from "./util";
import * as State from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";

const gen = Generations.get(9);

export class Raider extends Pokemon implements State.Raider {
    id: number;
    role: string;
    shiny: boolean;
    field: Field;               // each pokemon gets its own field to deal with things like Helping Hand and Protect
    moveData: State.MoveData[];   
    extraMoves?: MoveName[];    // for special boss actions
    extraMoveData?: State.MoveData[];

    isEndure?: boolean;         // store that a Pokemon can't faint until its next move
    isTaunt?: number;           // store number of turns that a Pokemon can't use status moves
    isSleep?: number;           // store number of turns that a Pokemon is asleep
    isYawn?: number;            // turn countdown until yawn takes effect
    yawnSource?: number;        // id of the pokemon that inflicted the user with Yawn

    isCharging?: boolean;       // indicates that a Pokemon is charging a move (e.g. Solar Beam)
    isRecharging?: boolean;     // indicates that a Pokemon is recharging from a move (e.g. Hyper Beam)

    lastMove?: State.MoveData;  // stored for Instruct and Copycat
    lastTarget?: number;        // stored for Instruct and Copycat
    moveRepeated?: number;      // stored for boost from Metronome, Fury Cutter, etc
    teraCharge: number;         // stored for Tera activation

    shieldActivateHP?: number;
    shieldBroken?: boolean;

    abilityNullified?: number;  // indicates when the boss has nullified the ability of the Raider
    nullifyAbilityOn?: boolean; // indicates that the ability was active before nullification
    originalAbility: AbilityName | "(No Ability)";   // stores ability when nullified

    syrupBombDrops?: number;  // stores the number of speed drops left to be applied from Syrup Bomb
    syrupBombSource?: number; // id of the pokemon that inflicted the user with Syrup Bomb

    constructor(
        id: number, 
        role: string, 
        shiny: boolean | undefined, 
        field: Field, 
        pokemon: Pokemon, 
        moveData: State.MoveData[], 
        extraMoves: MoveName[] = [], 
        extraMoveData: State.MoveData[] = [], 
        isEndure: boolean = false, 
        isTaunt: number = 0,
        isSleep: number = 0,
        isYawn: number = 0,
        yawnSource: number | undefined = undefined,
        isCharging: boolean = false,
        isRecharging: boolean = false,
        lastMove: State.MoveData | undefined = undefined, 
        lastTarget: number | undefined = undefined, 
        moveRepeated: number | undefined = undefined,
        teraCharge: number | undefined = 0, 
        shieldActivateHP: number | undefined = undefined, 
        shieldBroken: boolean | undefined = undefined, 
        abilityNullified: number | undefined = 0, 
        nullifyAbilityOn: boolean | undefined = undefined,
        originalAbility: AbilityName | "(No Ability)" | undefined = undefined,
        syrupBombDrops: number | undefined = 0,
        syrupBombSource: number | undefined = undefined,
    ) {
        super(pokemon.gen, pokemon.name, {...pokemon})
        this.id = id;
        this.role = role;
        this.shiny = !!shiny;
        this.field = field;
        this.moveData = moveData;
        this.extraMoves = extraMoves;
        this.extraMoveData = extraMoveData;
        this.isEndure = isEndure;
        this.isTaunt = isTaunt;
        this.isSleep = isSleep;
        this.isYawn = isYawn;
        this.yawnSource = yawnSource;
        this.isCharging = isCharging;
        this.isRecharging = isRecharging;
        this.lastMove = lastMove;
        this.lastTarget = lastTarget;
        this.moveRepeated = moveRepeated;
        this.teraCharge = teraCharge;
        this.shieldActivateHP = shieldActivateHP;
        this.shieldBroken = shieldBroken;
        this.abilityNullified = abilityNullified;
        this.nullifyAbilityOn = nullifyAbilityOn;
        this.originalAbility = originalAbility || pokemon.ability || "(No Ability)";
        this.syrupBombDrops = syrupBombDrops;
        this.syrupBombSource = syrupBombSource;
    }

    clone(): Raider {
        return new Raider(
            this.id, 
            this.role, 
            this.shiny,
            this.field.clone(),
            new Pokemon(this.gen, this.name, {
                level: this.level,
                bossMultiplier: this.bossMultiplier,
                statMultipliers: this.statMultipliers,
                ability: this.ability,
                abilityOn: this.abilityOn,
                isDynamaxed: this.isDynamaxed,
                dynamaxLevel: this.dynamaxLevel,
                isSaltCure: this.isSaltCure,
                alliesFainted: this.alliesFainted,
                boostedStat: this.boostedStat,
                usedBoosterEnergy: this.usedBoosterEnergy,
                isIngrain: this.isIngrain,
                item: this.item,
                gender: this.gender,
                nature: this.nature,
                ivs: extend(true, {}, this.ivs),
                evs: extend(true, {}, this.evs),
                boosts: extend(true, {}, this.boosts),
                isPumped: this.isPumped,
                randomBoosts: this.randomBoosts,
                originalCurHP: this.originalCurHP,
                status: this.status,
                volatileStatus: this.volatileStatus.slice(),
                teraType: this.teraType,
                isTera: this.isTera,
                shieldData: this.shieldData,
                shieldActive: this.shieldActive,
                toxicCounter: this.toxicCounter,
                hitsTaken: this.hitsTaken,
                changedTypes: this.changedTypes ? [...this.changedTypes] : undefined,
                moves: this.moves.slice(),
                overrides: this.species,
            }),
            this.moveData,
            this.extraMoves,
            this.extraMoveData,
            this.isEndure,
            this.isTaunt,
            this.isSleep,
            this.isYawn,
            this.yawnSource,
            this.isCharging,
            this.isRecharging,
            this.lastMove,
            this.lastTarget,
            this.moveRepeated,
            this.teraCharge,
            this.shieldActivateHP,
            this.shieldBroken,
            this.abilityNullified,
            this.nullifyAbilityOn,
            this.originalAbility,
            this.syrupBombDrops,
            this.syrupBombSource,
        )
    }

    public get boostCoefficient(): number {
        const hasSimple = this.ability === "Simple";
        const hasContrary = this.ability === "Contrary";
        return hasSimple ? 2 : hasContrary ? -1 : 1;
    }

    public get effectiveSpeed(): number {
        let speed = getModifiedStat(this.stats.spe, this.boosts.spe, gen);
        speed = modifyPokemonSpeedByStatus(speed, this.status, this.ability);
        speed = modifyPokemonSpeedByItem(speed, this.item);
        speed = modifyPokemonSpeedByAbility(speed, this.ability, this.abilityOn, this.status);
        speed = modifyPokemonSpeedByQP(speed, this.field, this.ability, this.item, this.boostedStat as StatIDExceptHP);
        speed = modifyPokemonSpeedByField(speed, this.field);
        return speed;
    }

    public applyDamage(damage: number): number { 
        this.originalCurHP = Math.min(this.maxHP(), Math.max(0, this.originalCurHP - damage));
        if (this.isEndure && this.originalCurHP === 0) {
            this.originalCurHP = 1;
        }
        return this.originalCurHP;
    }

    public applyStatChange(boosts: Partial<StatsTable>): StatsTable {
        const diff: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0};
        for (let stat in boosts) {
            const statId = stat as StatIDExceptHP;
            const originalStat = this.boosts[statId] || 0;
            this.boosts[statId] = safeStatStage(originalStat + (boosts[statId] || 0) * this.boostCoefficient)
            diff[statId] = (this.boosts[statId] || 0) - originalStat;
        }
        return diff;
    }

    public loseItem() {
        // Unburden
        if (this.ability === "Unburden" && this.item !== undefined) {
            this.abilityOn = true;
        }
        this.item = undefined;
    }

    public activateTera(): boolean {
        if (!this.isTera && this.teraCharge >= 3) {
            this.isTera = true;
            if (this.name.includes("Ogerpon")) {
                if (this.name === "Ogerpon") {
                    this.teraType = "Grass";
                    this.ability = "Embody Aspect (Teal)" as AbilityName;
                } else if (this.name === "Ogerpon-Hearthflame") {
                    this.teraType = "Fire";
                    this.ability = "Embody Aspect (Hearthflame)" as AbilityName;
                } else if (this.name === "Ogerpon-Wellspring") {
                    this.teraType = "Water"
                    this.ability = "Embody Aspect (Wellspring)" as AbilityName;
                } else { // (pokemmon.name === "Ogerpon-Cornerstone")
                    this.teraType = "Rock"
                    this.ability = "Embody Aspect (Cornerstone)" as AbilityName;
                }
                this.abilityOn = true;
            }
            return true;
        }
        return false;
    }

    public checkShield() {
        if (this.id !== 0) { return; }
        if (!this.shieldData) { return; }
        if (this.shieldBroken) { return; }
        if (this.originalCurHP === 0) { return; }
        if (this.shieldActivateHP === undefined) { // check for shield activation by damage
            const activationHP = this.shieldData.hpTrigger / 100 * this.maxHP();
            if (this.originalCurHP <= activationHP) {
                this.shieldActive = true;
                this.shieldActivateHP = this.originalCurHP;
            }
        } else { // check for shield breaking by damage
            const breakHP = this.shieldActivateHP - (this.shieldData.shieldCancelDamage / 100 * this.maxHP());
            if (this.originalCurHP < breakHP) {
                this.shieldActive = false;
                this.shieldBroken = true;
                // TODO: adjust damage overflow from breaking shield?
            }
        }
    }

}