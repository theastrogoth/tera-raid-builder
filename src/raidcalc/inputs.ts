import { Raider } from "./Raider";
import { TurnGroupInfo } from "./interface";

// used for passing data to React components
export type RaidInputProps = {
  pokemon: Raider[],
  setPokemon: ((r: Raider) => void)[],
  groups: TurnGroupInfo[],
  setGroups: (t: TurnGroupInfo[]) => void,
}

export type BuildInfo = {
  name: string;
  notes: string;
  credits: string;
  pokemon: Raider[],
  groups: TurnGroupInfo[],
}