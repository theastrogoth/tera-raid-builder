import { Raider } from "./Raider";
import { RaidTurnInfo } from "./interface";

// used for passing data to React components
export type RaidInputProps = {
  pokemon: Raider[],
  setPokemon: ((r: Raider) => void)[],
  turns: RaidTurnInfo[][],
  repeats: number[],
  setTurns: (t: RaidTurnInfo[][]) => void,
  setRepeats: (r: number[]) => void,
}

export type BuildInfo = {
  name: string;
  notes: string;
  credits: string;
  pokemon: Raider[],
  turns: RaidTurnInfo[],
  groups: number[][],
}