import {State} from './state';
import {GameType, Weather, Terrain} from './data/interface';

export class Field implements State.Field {
  gameType: GameType;
  weather?: Weather;
  weatherTurnsRemaining?: number;
  terrain?: Terrain;
  terrainTurnsRemaining?: number;
  isMagicRoom: number;
  isWonderRoom: number;
  isGravity: number;
  isAuraBreak?: boolean;
  isFairyAura?: boolean;
  isDarkAura?: boolean;
  isBeadsOfRuin?: boolean;
  isSwordOfRuin?: boolean;
  isTabletsOfRuin?: boolean;
  isVesselOfRuin?: boolean;
  isTrickRoom: number;
  isCloudNine?: boolean;
  attackerSide: Side;
  defenderSide: Side;

  constructor(field: Partial<State.Field> = {}) {
    this.gameType = field.gameType || 'Singles';
    this.terrain = field.terrain;
    this.terrainTurnsRemaining = field.terrainTurnsRemaining;
    this.weather = field.weather;
    this.weatherTurnsRemaining = field.weatherTurnsRemaining;
    this.isMagicRoom = field.isMagicRoom || 0;
    this.isWonderRoom = field.isWonderRoom || 0;
    this.isGravity = field.isGravity || 0;
    this.isAuraBreak = field.isAuraBreak || false;
    this.isFairyAura = field.isFairyAura || false;
    this.isDarkAura = field.isDarkAura || false;
    this.isBeadsOfRuin = field.isBeadsOfRuin || false;
    this.isSwordOfRuin = field.isSwordOfRuin || false;
    this.isTabletsOfRuin = field.isTabletsOfRuin || false;
    this.isVesselOfRuin = field.isVesselOfRuin || false;
    this.isTrickRoom = field.isTrickRoom || 0;
    this.isCloudNine = field.isCloudNine || false;

    this.attackerSide = new Side(field.attackerSide || {});
    this.defenderSide = new Side(field.defenderSide || {});
  }

  hasWeather(...weathers: Weather[]) {
    if (this.isCloudNine) { return false }; 
    return !!(this.weather && weathers.includes(this.weather));
  }

  hasTerrain(...terrains: Terrain[]) {
    return !!(this.terrain && terrains.includes(this.terrain));
  }

  swap() {
    [this.attackerSide, this.defenderSide] = [this.defenderSide, this.attackerSide];
    return this;
  }

  clone() {
    return new Field({
      gameType: this.gameType,
      weather: this.weather,
      weatherTurnsRemaining: this.weatherTurnsRemaining,
      terrain: this.terrain,
      terrainTurnsRemaining: this.terrainTurnsRemaining,
      isMagicRoom: this.isMagicRoom,
      isWonderRoom: this.isWonderRoom,
      isGravity: this.isGravity,
      attackerSide: this.attackerSide,
      defenderSide: this.defenderSide,
      isAuraBreak: this.isAuraBreak,
      isDarkAura: this.isDarkAura,
      isFairyAura: this.isFairyAura,
      isBeadsOfRuin: this.isBeadsOfRuin,
      isSwordOfRuin: this.isSwordOfRuin,
      isTabletsOfRuin: this.isTabletsOfRuin,
      isVesselOfRuin: this.isVesselOfRuin,
      isTrickRoom: this.isTrickRoom,
      isCloudNine: this.isCloudNine,
    });
  }
}

export class Side implements State.Side {
  spikes: number;
  steelsurge: boolean;
  vinelash: boolean;
  wildfire: boolean;
  cannonade: boolean;
  volcalith: boolean;
  isSR: boolean;
  isReflect: number;
  isLightScreen: number;
  isDefCheered: number
  isProtected: boolean;
  isWideGuard: boolean;
  isQuickGuard: boolean;
  isSeeded: boolean;
  isForesight: boolean;
  isTailwind: number;
  isHelpingHand: boolean;
  isAtkCheered: number;
  isFlowerGift: boolean;
  isFriendGuard: boolean;
  friendGuards: number;
  isAuroraVeil: number;
  isBattery: boolean;
  batteries: number;
  isPowerSpot: boolean;
  powerSpots: number;
  steelySpirits: number;
  isSwitching?: 'out' | 'in';
  isCharged: boolean;
  isMist: number;
  isSafeguard: number;
  isAromaVeil: boolean;
  isFlowerVeil: boolean;

  constructor(side: State.Side = {}) {
    this.spikes = side.spikes || 0;
    this.steelsurge = !!side.steelsurge;
    this.vinelash = !!side.vinelash;
    this.wildfire = !!side.wildfire;
    this.cannonade = !!side.cannonade;
    this.volcalith = !!side.volcalith;
    this.isSR = !!side.isSR;
    this.isReflect = side.isReflect || 0;
    this.isLightScreen = side.isLightScreen || 0;
    this.isDefCheered = side.isDefCheered || 0;
    this.isProtected = !!side.isProtected;
    this.isWideGuard = !!side.isWideGuard;
    this.isQuickGuard = !!side.isQuickGuard;
    this.isSeeded = !!side.isSeeded;
    this.isForesight = !!side.isForesight;
    this.isTailwind = side.isTailwind || 0;
    this.isHelpingHand = !!side.isHelpingHand;
    this.isAtkCheered = side.isAtkCheered || 0;
    this.isFlowerGift = !!side.isFlowerGift;
    this.isFriendGuard = !!side.isFriendGuard;
    this.friendGuards = side.friendGuards || 0;
    this.isAuroraVeil = side.isAuroraVeil || 0;
    this.isBattery = !!side.isBattery;
    this.batteries = side.batteries || 0;
    this.isPowerSpot = !!side.isPowerSpot;
    this.powerSpots = side.powerSpots || 0;
    this.steelySpirits = side.steelySpirits || 0;
    this.isSwitching = side.isSwitching;
    this.isCharged = !!side.isCharged;
    this.isMist = side.isMist || 0;
    this.isSafeguard = side.isSafeguard || 0;
    this.isAromaVeil = !!side.isAromaVeil;
    this.isFlowerVeil = !!side.isFlowerVeil;
  }

  clone() {
    return new Side(this);
  }
}
