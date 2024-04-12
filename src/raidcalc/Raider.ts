import { Field, Pokemon, Generations } from "../calc";
import { MoveName, StatsTable, StatIDExceptHP, AbilityName, ItemName, TypeName, SpeciesName } from "../calc/data/interface";
import { extend } from '../calc/util';
import { safeStatStage, modifyPokemonSpeedByAbility, modifyPokemonSpeedByField, modifyPokemonSpeedByItem, modifyPokemonSpeedByQP, modifyPokemonSpeedByStatus } from "./util";
import * as State from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";

const gen = Generations.get(9);

export class Raider extends Pokemon implements State.Raider {
    id: number;
    role: string;
    shiny: boolean;
    isAnyLevel: boolean;        // keeps track of whether or not the Raider should be displayed as having "Any" level for display/graphic purposes
    field: Field;               // each pokemon gets its own field to deal with things like Helping Hand and Protect
    moveData: State.MoveData[];   
    extraMoves?: MoveName[];    // for special boss actions
    extraMoveData?: State.MoveData[];

    isEndure?: boolean;         // store that a Pokemon can't faint until its next move
    isTaunt?: number;           // store number of turns that a Pokemon can't use status moves
    isSleep?: number;           // store number of turns that a Pokemon is asleep
    isYawn?: number;            // turn countdown until yawn takes effect
    yawnSource?: number;        // id of the pokemon that inflicted the user with Yawn
    isFrozen?: number;          // store number of turns that a Pokemon is frozen

    isCharging?: boolean;       // indicates that a Pokemon is charging a move (e.g. Solar Beam)
    isRecharging?: boolean;     // indicates that a Pokemon is recharging from a move (e.g. Hyper Beam)

    lastMove?: State.MoveData;  // stored for Instruct and Copycat
    lastTarget?: number;        // stored for Instruct and Copycat
    moveRepeated?: number;      // stored for boost from Metronome, Fury Cutter, etc
    teraCharge: number;         // stored for Tera activation

    isChoiceLocked?: boolean;   // indicates that a Pokemon is locked into a move
    isEncore?: number;          // store number of turns that a Pokemon is encored
    isTorment?: boolean;        
    isDisable?: number;         // store number of turns that a Pokemon is disabled
    disabledMove?: MoveName;    // store the move that is disabled

    shieldActivateHP?: number;
    shieldBroken?: boolean;
    shieldBreakStun?: boolean[];
    substitute?: number;

    abilityNullified?: number;  // indicates when the boss has nullified the ability of the Raider
    nullifyAbilityOn?: boolean; // indicates that the ability was active before nullification
    originalAbility: AbilityName | "(No Ability)";   // stores ability when nullified

    syrupBombDrops?: number;  // stores the number of speed drops left to be applied from Syrup Bomb
    syrupBombSource?: number; // id of the pokemon that inflicted the user with Syrup Bomb

    lastConsumedItem?: ItemName; // stores the last berry consumed by the raider (via normal consuption of Fling)

    isTransformed?: boolean; // indicates that the pokemon has been transformed by Transform or Imposter
    isChangedForm?: boolean; // indicates that the pokemon has been changed form (e.g. Eiscue, Terapagos, Minior)
    originalSpecies?: SpeciesName; // stores the state of the pokemon before transformation
    originalMoves?: State.MoveData[]; // stores the moves of the pokemon before transformation or Mimic
    originalFormAbility?: AbilityName | "(No Ability)"; // stores the ability of the pokemon before transformation

    slowStartCounter?: number; // stores the number of turns left for Slow Start

    delayedMoveCounter?: number;
    delayedMoveSource?: number;
    delayedMoveOptions?: State.RaidMoveOptions;
    delayedMove?: State.MoveData;

    constructor(
        id: number, 
        role: string, 
        shiny: boolean | undefined,
        isAnyLevel: boolean | undefined,
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
        isFrozen: number = 0,
        isCharging: boolean = false,
        isRecharging: boolean = false,
        lastMove: State.MoveData | undefined = undefined, 
        lastTarget: number | undefined = undefined, 
        moveRepeated: number | undefined = undefined,
        teraCharge: number | undefined = 0, 
        choiceLocked: boolean = false,
        isEncore: number | undefined = 0,
        isTorment: boolean | undefined = false,
        isDisable: number | undefined = 0,
        disabledMove: MoveName | undefined = undefined,
        shieldActivateHP: number | undefined = undefined, 
        shieldBroken: boolean | undefined = undefined, 
        shieldBreakStun: boolean[] | undefined = undefined,
        substitute: number | undefined = undefined,
        abilityNullified: number | undefined = 0, 
        nullifyAbilityOn: boolean | undefined = undefined,
        originalAbility: AbilityName | "(No Ability)" | undefined = undefined,
        syrupBombDrops: number | undefined = 0,
        syrupBombSource: number | undefined = undefined,
        lastConsumedItem: ItemName | undefined = undefined,
        isTransformed: boolean | undefined = undefined,
        isChangedForm: boolean | undefined = undefined,
        originalSpecies: SpeciesName | undefined = undefined,
        originalMoves: State.MoveData[] | undefined = undefined,
        originalFormAbility: AbilityName | "(No Ability)" | undefined = undefined,
        slowStartCounter: number | undefined = undefined,
        delayedMoveCounter: number | undefined = undefined,
        delayedMoveSource: number | undefined = undefined,
        delayedMoveOptions: State.RaidMoveOptions | undefined = undefined,
        delayedMove: State.MoveData | undefined = undefined,
    ) {
        super(pokemon.gen, pokemon.name, {...pokemon})
        this.id = id;
        this.role = role;
        this.shiny = !!shiny;
        this.isAnyLevel = !!isAnyLevel;
        this.field = field;
        this.moveData = moveData;
        this.extraMoves = extraMoves;
        this.extraMoveData = extraMoveData;
        this.isEndure = isEndure;
        this.isTaunt = isTaunt;
        this.isSleep = isSleep;
        this.isYawn = isYawn;
        this.yawnSource = yawnSource;
        this.isFrozen = isFrozen;
        this.isCharging = isCharging;
        this.isRecharging = isRecharging;
        this.lastMove = lastMove;
        this.lastTarget = lastTarget;
        this.moveRepeated = moveRepeated;
        this.teraCharge = teraCharge;
        this.isChoiceLocked = choiceLocked;
        this.isEncore = isEncore;
        this.isTorment = isTorment;
        this.isDisable = isDisable;
        this.disabledMove = disabledMove;
        this.shieldActivateHP = shieldActivateHP;
        this.shieldBroken = shieldBroken;
        this.shieldBreakStun = shieldBreakStun;
        this.substitute = substitute;
        this.abilityNullified = abilityNullified;
        this.nullifyAbilityOn = nullifyAbilityOn;
        this.originalAbility = originalAbility || pokemon.ability || "(No Ability)";
        this.syrupBombDrops = syrupBombDrops;
        this.syrupBombSource = syrupBombSource;
        this.lastConsumedItem = lastConsumedItem;
        this.isTransformed = isTransformed;
        this.isChangedForm = isChangedForm;
        this.originalSpecies  = originalSpecies;
        this.originalMoves = originalMoves;
        this.originalFormAbility = originalFormAbility || pokemon.ability || "(No Ability)";
        this.slowStartCounter = slowStartCounter;
        this.delayedMoveCounter = delayedMoveCounter;
        this.delayedMoveSource = delayedMoveSource;
        this.delayedMoveOptions = delayedMoveOptions;
        this.delayedMove = delayedMove;
    }

    clone(): Raider {
        return new Raider(
            this.id, 
            this.role, 
            this.shiny,
            this.isAnyLevel,
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
                isMicle: this.isMicle,
                randomBoosts: this.randomBoosts,
                stockpile: this.stockpile,
                originalCurHP: this.originalCurHP,
                status: this.status,
                volatileStatus: this.volatileStatus.slice(),
                teraType: this.teraType,
                isTera: this.isTera,
                shieldData: this.shieldData,
                shieldActive: this.shieldActive,
                toxicCounter: this.toxicCounter,
                hitsTaken: this.hitsTaken,
                timesFainted: this.timesFainted,
                changedTypes: this.changedTypes ? [...this.changedTypes] : undefined,
                moves: this.moves.slice(),
                permanentAtkCheers: this.permanentAtkCheers,
                permanentDefCheers: this.permanentDefCheers,
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
            this.isFrozen,
            this.isCharging,
            this.isRecharging,
            this.lastMove,
            this.lastTarget,
            this.moveRepeated,
            this.teraCharge,
            this.isChoiceLocked,
            this.isEncore,
            this.isTorment,
            this.isDisable,
            this.disabledMove,
            this.shieldActivateHP,
            this.shieldBroken,
            this.shieldBreakStun,
            this.substitute,
            this.abilityNullified,
            this.nullifyAbilityOn,
            this.originalAbility,
            this.syrupBombDrops,
            this.syrupBombSource,
            this.lastConsumedItem,
            this.isTransformed,
            this.isChangedForm,
            this.originalSpecies,
            this.originalMoves,
            this.originalFormAbility,
            this.slowStartCounter,
            this.delayedMoveCounter,
            this.delayedMoveSource,
            this.delayedMoveOptions,
            this.delayedMove,
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
        speed = modifyPokemonSpeedByField(speed, this.field, this.ability);
        return speed;
    }

    public applyDamage(damage: number): number { 
        if (this.substitute) {
            this.substitute = Math.max(0, this.substitute - damage) === 0 ? undefined : Math.max(0, this.substitute - damage)
        } else {
            this.originalCurHP = Math.min(this.maxHP(), Math.max(0, this.originalCurHP - damage));
            if (this.isEndure && this.originalCurHP === 0) {
                this.originalCurHP = 1;
            }
        }
        return this.originalCurHP;
    }

    public applyStatChange(boosts: Partial<StatsTable>, ignoreAbility: boolean = false): StatsTable {
        const diff: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0};
        for (let stat in boosts) {
            const statId = stat as StatIDExceptHP;
            const originalStat = this.boosts[statId] || 0;
            this.boosts[statId] = safeStatStage(originalStat + (boosts[statId] || 0) * (ignoreAbility ? 1 : this.boostCoefficient))
            diff[statId] = (this.boosts[statId] || 0) - originalStat;
        }
        return diff;
    }

    public loseItem(consumed: boolean = true) {
        // Unburden
        if (this.ability === "Unburden" && this.item !== undefined) {
            this.abilityOn = true;
        }
        if (consumed) {
            this.lastConsumedItem = this.item;
        }
        if (this.hasItem("Choice Band", "Choice Specs", "Choice Scarf")) {
            this.isChoiceLocked = false;
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
            } else if (this.name.includes("Terapagos")) {
                this.changeForm("Terapagos-Stellar" as SpeciesName);
                // this.ability = "Teraform Zero" as AbilityName; // Needs to be handled in the RaidState
                this.teraType = "Stellar";
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
                this.shieldBreakStun = [true, true, true, true];
            }
        }
    }

    public transformInto(pokemon: Raider) {
        // make the transformation revertable on fainting
        this.isTransformed = true;
        this.originalSpecies = this.name;
        this.originalMoves = this.moveData.slice();
        // copy species details
        this.name = pokemon.name;
        this.species = pokemon.species;
        this.weightkg = pokemon.weightkg;
        this.rawStats = {...pokemon.rawStats, hp: this.rawStats.hp}; // HP is retained
        this.types = pokemon.types.slice() as [TypeName] | [TypeName, TypeName];
        // copy stats and moves
        this.boosts = {...pokemon.boosts};
        this.moves = pokemon.moves.slice();
        this.moveData = pokemon.moveData.slice();
        this.stats = {...pokemon.stats, hp: this.stats.hp}; // HP is retained
        this.originalAbility = pokemon.ability as AbilityName;
        // this.ability = pokemon.ability; // handle ability change in the RaidState
    }

    public changeForm(formName: SpeciesName) {
        const newForm = new Pokemon(gen, formName, {...this.clone()});
        // make the form change revertable on fainting
        this.isChangedForm = true;
        this.originalSpecies = this.name;
        this.originalMoves = this.moveData.slice();
        // copy species details
        this.name = formName;
        this.species = newForm.species;
        this.weightkg = newForm.weightkg;
        this.rawStats = {...newForm.rawStats, hp: this.rawStats.hp}; // HP is retained
        this.types = newForm.types.slice() as [TypeName] | [TypeName, TypeName];
        // copy stats
        this.stats = {...newForm.stats, hp: this.stats.hp}; // HP is retained
    }

    public mimicMove(move: State.MoveData, targetID: number) {
        // if (targetID === 0) { return; } // ???
        if (!this.originalMoves) {
            this.originalMoves = this.moveData.slice();
        }
        const mimicIndex = this.moves.findIndex(m => m === "Mimic");
        if (mimicIndex === -1) { return; }
        this.moves[mimicIndex] = move.name;
        this.moveData[mimicIndex] = {...move};
        this.lastMove = move;
        this.lastTarget = targetID;
        this.moveRepeated = 0;
    }

    public sketchMove(move: State.MoveData, targetID: number) {
        // if (targetID === 0) { return; } // ???
        const sketchIndex = this.moves.findIndex(m => m === "Sketch");
        if (sketchIndex === -1) { return; }
        this.moves[sketchIndex] = move.name;
        this.moveData[sketchIndex] = {...move};
        this.lastMove = move;
        this.lastTarget = targetID;
        this.moveRepeated = 0;
    }
}