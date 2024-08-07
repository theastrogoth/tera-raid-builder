import * as I from './data/interface';

export namespace State {

  export type ShieldData  = {
    hpTrigger: number;
    timeTrigger: number;
    shieldCancelDamage: number;
    shieldDamageRate: number;
    shieldDamageRateTera: number;
    shieldDamageRateTeraChange: number;
  }

  export interface Pokemon {
    name: I.SpeciesName;
    level?: number;
    bossMultiplier?: number;
    statMultipliers?: I.StatsTable;
    ability?: I.AbilityName;
    abilityOn?: boolean;
    isDynamaxed?: boolean;
    dynamaxLevel?: number;
    isSaltCure?: boolean;
    alliesFainted?: number;
    proteanLiberoType?: I.TypeName;
    boostedStat?: I.StatIDExceptHP | 'auto';
    usedBoosterEnergy?: boolean;
    isIngrain?: boolean;
    isSmackDown?: boolean;
    item?: I.ItemName;
    gender?: I.GenderName;
    nature?: I.NatureName;
    ivs?: Partial<I.StatsTable>;
    evs?: Partial<I.StatsTable>;
    boosts?: Partial<I.StatsTable>;
    isPumped?: number;
    isMicle?: boolean;
    isMinimize?: boolean;
    randomBoosts?: number;
    stockpile?: number;
    originalCurHP?: number;
    status?: I.StatusName | '';
    volatileStatus?: string[];
    teraType?: I.TypeName;
    isTera?: boolean;
    shieldData?: ShieldData;
    shieldActive?: boolean;
    toxicCounter?: number;
    hitsTaken?: number;
    timesFainted?: number;
    hasExtraType?: boolean;
    // lastMoveFailed?: boolean;
    moves?: I.MoveName[];
    abilityNullified?: number;
    permanentAtkCheers?: number;
    permanentDefCheers?: number,
    overrides?: Partial<I.Specie>;
  }

  export interface Move {
    name: I.MoveName;
    useZ?: boolean;
    useMax?: boolean;
    isCrit?: boolean;
    highCritChance?: boolean;
    isSpread?: boolean;
    hits?: number;
    bp?: number;
    timesUsed?: number;
    timesUsedWithMetronome?: number;
    overrides?: Partial<I.Move>;
  }

  export interface Field {
    gameType: I.GameType;
    weather?: I.Weather;
    weatherTurnsRemaining?: number;
    terrain?: I.Terrain;
    terrainTurnsRemaining?: number;
    isMagicRoom?: number;       // # turns remaining
    isWonderRoom?: number;      // # turns remaining
    isGravity?: number;         // # turns remaining
    isAuraBreak?: boolean;
    isFairyAura?: boolean;
    isDarkAura?: boolean;
    isBeadsOfRuin?: boolean;
    isSwordOfRuin?: boolean;
    isTabletsOfRuin?: boolean;
    isVesselOfRuin?: boolean;
    isTrickRoom?: number;       // # turns remaining
    isCloudNine?: boolean;
    isTeraformZero?: boolean;
    attackerSide: Side;
    defenderSide: Side;
  }

  export interface Side {
    spikes?: number;
    steelsurge?: boolean;
    vinelash?: boolean;
    wildfire?: boolean;
    cannonade?: boolean;
    volcalith?: boolean;
    isSR?: boolean;
    isReflect?: number;         // # turns remaining
    isLightScreen?: number;     // # turns remaining
    isDefCheered?: number;      // # turns remaining
    isProtected?: boolean;
    isWideGuard?: boolean;
    isQuickGuard?: boolean;
    isSeeded?: boolean;
    isForesight?: boolean;
    isTailwind?: number;        // # turns remaining
    isHelpingHand?: boolean;
    isAtkCheered?: number;      // # turns remaining
    isFlowerGift?: boolean;
    isDazzling?: boolean;
    isFriendGuard?: boolean;
    friendGuards?: number;
    isAuroraVeil?: number;      // # turns remaining
    isBattery?: boolean;
    batteries?: number;
    isPowerSpot?: boolean;
    powerSpots?: number;
    steelySpirits?: number;
    isSwitching?: 'out' | 'in';
    isCharged?: boolean;
    isMist?: number;            // # turns remaining
    isSafeguard?: number;       // # turns remaining
    isAromaVeil?: boolean;
    isFlowerVeil?: boolean;
  }
}
