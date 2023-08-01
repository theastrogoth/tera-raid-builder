import { Raider } from "./Raider";
import { RaidTurnInfo } from "./interface";

// used for passing data to React components
export type RaidInputProps = {
    pokemon: Raider[],
    setPokemon: ((r: Raider) => void)[],
    turns: RaidTurnInfo[],
    setTurns: (t: RaidTurnInfo[]) => void,
    groups: number[][],
    setGroups: (g: number[][]) => void,
  }

  export type BuildInfo = {
    name: string;
    notes: string;
    credits: string;
    pokemon: Raider[],
    turns: RaidTurnInfo[],
    groups: number[][],
}