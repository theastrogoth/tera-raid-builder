import * as I from './data/interface';

export namespace State {
  export interface Pokemon {
    name: I.SpeciesName;
    level?: number;
    bossMultiplier?: number;
    ability?: I.AbilityName;
    abilityOn?: boolean;
    isDynamaxed?: boolean;
    dynamaxLevel?: number;
    isSaltCure?: boolean;
    alliesFainted?: number;
    boostedStat?: I.StatIDExceptHP | 'auto';
    usedBoosterEnergy?: boolean;
    item?: I.ItemName;
    gender?: I.GenderName;
    nature?: I.NatureName;
    ivs?: Partial<I.StatsTable>;
    evs?: Partial<I.StatsTable>;
    boosts?: Partial<I.StatsTable>;
    randomBoosts?: number;
    originalCurHP?: number;
    status?: I.StatusName | '';
    volatileStatus?: string[];
    isChoiceLocked?: boolean;
    teraType?: I.TypeName;
    toxicCounter?: number;
    moves?: I.MoveName[];
    overrides?: Partial<I.Specie>;
  }

  export interface Move {
    name: I.MoveName;
    useZ?: boolean;
    useMax?: boolean;
    isCrit?: boolean;
    hits?: number;
    timesUsed?: number;
    timesUsedWithMetronome?: number;
    overrides?: Partial<I.Move>;
  }

  export interface Field {
    gameType: I.GameType;
    weather?: I.Weather;
    terrain?: I.Terrain;
    isMagicRoom?: boolean;
    isWonderRoom?: boolean;
    isGravity?: boolean;
    isAuraBreak?: boolean;
    isFairyAura?: boolean;
    isDarkAura?: boolean;
    isBeadsOfRuin?: boolean;
    isSwordOfRuin?: boolean;
    isTabletsOfRuin?: boolean;
    isVesselOfRuin?: boolean;
    isTrickRoom?: boolean;
    isCloudNine?: boolean;
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
    isReflect?: boolean;
    isLightScreen?: boolean;
    isDefCheered?: boolean;
    isProtected?: boolean;
    isWideGuard?: boolean;
    isQuickGuard?: boolean;
    isSeeded?: boolean;
    isForesight?: boolean;
    isTailwind?: boolean;
    isHelpingHand?: boolean;
    isAtkCheered?: boolean;
    isFlowerGift?: boolean;
    isFriendGuard?: boolean;
    friendGuards?: number;
    isAuroraVeil?: boolean;
    isBattery?: boolean;
    isPowerSpot?: boolean;
    powerSpots?: number;
    steelySpirits?: number;
    isSwitching?: 'out' | 'in';
    isCharged?: boolean;
    isMist?: boolean;
    isSafeguard?: boolean;
    isAromaVeil?: boolean;
  }
}
