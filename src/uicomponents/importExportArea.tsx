import React, { useState } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import TextField from '@mui/material/TextField';

import { Pokemon, Stats, SPECIES, ABILITIES, TYPE_CHART, StatsTable, ITEMS } from "../calc";
import { AbilityName, ItemName, MoveName, NatureName, SpeciesName, TypeName, Generation } from "../calc/data/interface";

function serialize(array: string[], separator: String) {
	var text = "";
	for (var i = 0; i < array.length; i++) {
		if (i < array.length - 1) {
			text += array[i] + separator;
		} else {
			text += array[i];
		}
	}
	return text;
}

export function exportPokemon(pokemon: Pokemon) {
    const gen = 9;
	var EV_counter = 0;
	var finalText = "";
	finalText = pokemon.name + (pokemon.item ? " @ " + pokemon.item : "") + "\n";
	finalText += "Level: " + pokemon.level + "\n";
	finalText += pokemon.nature && gen > 2 ? pokemon.nature + " Nature" + "\n" : "";
	finalText += pokemon.teraType && gen > 8 ? "Tera Type: " + pokemon.teraType + "\n": "";
	finalText += pokemon.ability ? "Ability: " + pokemon.ability + "\n" : "";
	if (gen > 2) {
		var EVs_Array = [];
		for (var stat in pokemon.evs) {
            //@ts-ignore
			var ev = pokemon.evs[stat] ? pokemon.evs[stat] : 0;
			if (ev > 0) {
                //@ts-ignore
				EVs_Array.push(ev + " " + Stats.displayStat(stat));
			}
			EV_counter += ev;
			if (EV_counter > 510) break;
		}
		if (EVs_Array.length > 0) {
			finalText += "EVs: ";
			finalText += serialize(EVs_Array, " / ");
			finalText += "\n";
		}
	}

	var IVs_Array = [];
	for (var stat in pokemon.ivs) {
        //@ts-ignore
		var iv = pokemon.ivs[stat] ? pokemon.ivs[stat] : 0;
		if (iv < 31) {
            //@ts-ignore
			IVs_Array.push(iv + " " + Stats.displayStat(stat));
		}
	}
	if (IVs_Array.length > 0) {
		finalText += "IVs: ";
		finalText += serialize(IVs_Array, " / ");
		finalText += "\n";
	}

	for (var i = 0; i < 4; i++) {
		var moveName = pokemon.moves[i];
		if (moveName !== undefined && moveName !== "(No Move)") {
			finalText += "- " + moveName + "\n";
		}
	}
	finalText = finalText.trim();
    return finalText
}

function getAbility(row: string[]) {
	var ability = row[1] ? row[1].trim() : '';
	if (ABILITIES[9].indexOf(ability) !== -1) return ability;
}

function getTeraType(row: string[]) {
	var teraType = row[1] ? row[1].trim() : '';
	if (Object.keys(TYPE_CHART[9]).slice(1).indexOf(teraType) !== -1) return teraType;
}

function getStats(currentPoke: Partial<Pokemon>, rows: string[], offset: number) {
	currentPoke.nature = "Serious";
	var currentEV: string[];
	var currentIV;
	var currentAbility;
	var currentTeraType;
	var currentNature;
	currentPoke.level = 100;
	for (var x = offset; x < offset + 9; x++) {
		var currentRow = rows[x] ? rows[x].split(/[/:]/) : '';
		var evs: Partial<StatsTable> = {};
		var ivs: Partial<StatsTable> = {};
		var j;

		switch (currentRow[0]) {
		case 'Level':
			currentPoke.level = parseInt(currentRow[1].trim());
			break;
		case 'EVs':
			for (j = 1; j < currentRow.length; j++) {
				currentEV = currentRow[j].trim().split(" ");
				currentEV[1] = currentEV[1].toLowerCase() as string;
				//@ts-ignore
				evs[currentEV[1]] = parseInt(currentEV[0]);
			}
			//@ts-ignore
			currentPoke.evs = evs;
			break;
		case 'IVs':
			for (j = 1; j < currentRow.length; j++) {
				currentIV = currentRow[j].trim().split(" ");
				currentIV[1] = currentIV[1].toLowerCase() as string;
				//@ts-ignore
				ivs[currentIV[1]] = parseInt(currentIV[0]);
			}
			//@ts-ignore
			currentPoke.ivs = ivs;
			break;

		}
		currentAbility = rows[x] ? rows[x].trim().split(":") : '';
		if (currentAbility[0] == "Ability") {
			currentPoke.ability = currentAbility[1].trim() as AbilityName;
			console.log(currentPoke.ability)
		}

		currentTeraType = rows[x] ? rows[x].trim().split(":") : '';
		if (currentTeraType[0] == "Tera Type") {
			currentPoke.teraType = currentTeraType[1].trim() as TypeName;
			console.log(currentPoke.teraType)
		}

		currentNature = rows[x] ? rows[x].trim().split(" ") : '';
		if (currentNature[1] == "Nature") {
			currentPoke.nature = currentNature[0] as NatureName;
			console.log(currentPoke.nature)
		}
	}
	return currentPoke;
}

function getItem(currentRow: string[], j: number) {
	for (;j < currentRow.length; j++) {
		var item = currentRow[j].trim();
		if (ITEMS[9].indexOf(item) != -1) {
			console.log(item)
			return item;
		}
	}
}

function getMoves(currentPoke: Partial<Pokemon>, rows: string[], offset: number) {
	var movesFound = false;
	var moves = [];
	for (var x = offset; x < offset + 12; x++) {
		if (rows[x]) {
			if (rows[x][0] == "-") {
				movesFound = true;
				var move = rows[x].substr(2, rows[x].length - 2).replace("[", "").replace("]", "").replace("  ", "");
				moves.push(move);
			} else {
				if (movesFound == true) {
					break;
				}
			}
		}
	}
	currentPoke.moves = moves as MoveName[];
	return currentPoke;
}

export function addSet(pokes: string) {
	var rows = pokes.split("\n");
	var currentRow;
	var currentPoke: Partial<Pokemon>;
	var addedpokes = 0;
	const sets: Pokemon[] = [];
	for (var i = 0; i < rows.length; i++) {
		currentRow = rows[i].split(/[()@]/);
		for (var j = 0; j < currentRow.length; j++) {
			currentRow[j] = checkExeptions(currentRow[j].trim());
			if (SPECIES[9][currentRow[j].trim()] !== undefined) {
				currentPoke = SPECIES[9][currentRow[j].trim()];
				currentPoke.name = currentRow[j].trim() as SpeciesName;
				currentPoke.item = getItem(currentRow, j + 1) as ItemName;
				currentPoke.ability = getAbility(rows[i + 1].split(":")) as AbilityName;
				currentPoke.teraType = getTeraType(rows[i + 1].split(":")) as TypeName;
				currentPoke = getStats(currentPoke, rows, i + 1);
				currentPoke = getMoves(currentPoke, rows, i);
				addedpokes++;
				try {
					console.log(currentPoke)
					//@ts-ignore
					sets.push(new Pokemon(9, currentPoke.name, currentPoke));
				} catch (e) {}
			}
		}
	}
	if (addedpokes > 0) {
		// no need to alert, I think
	} else {
		alert("The set was not imported. Please check your syntax and try again.");
	}
	return sets[0];
}

function checkExeptions(poke: string) {
	switch (poke) {
	case 'Aegislash':
		poke = "Aegislash-Blade";
		break;
	case 'Basculin-Blue-Striped':
		poke = "Basculin";
		break;
	case 'Gastrodon-East':
		poke = "Gastrodon";
		break;
	case 'Mimikyu-Busted-Totem':
		poke = "Mimikyu-Totem";
		break;
	case 'Mimikyu-Busted':
		poke = "Mimikyu";
		break;
	case 'Pikachu-Belle':
	case 'Pikachu-Cosplay':
	case 'Pikachu-Libre':
	case 'Pikachu-Original':
	case 'Pikachu-Partner':
	case 'Pikachu-PhD':
	case 'Pikachu-Pop-Star':
	case 'Pikachu-Rock-Star':
		poke = "Pikachu";
		break;
	case 'Vivillon-Fancy':
	case 'Vivillon-Pokeball':
		poke = "Vivillon";
		break;
	case 'Florges-White':
	case 'Florges-Blue':
	case 'Florges-Orange':
	case 'Florges-Yellow':
		poke = "Florges";
		break;
	case 'Shellos-East':
		poke = "Shellos";
		break;
	case 'Deerling-Summer':
	case 'Deerling-Autumn':
	case 'Deerling-Winter':
		poke = "Deerling";
		break;
	}
	return poke;
}
function ImportExportArea({pokemon, setPokemon}: { pokemon: Pokemon, setPokemon: React.Dispatch<React.SetStateAction<Pokemon>> }) {
	const [textValue, setTextValue] = useState('');
	return (
		<Box>
			<Stack direction="column" spacing={1} alignItems="center">

				<TextField
					multiline={true}
					minRows={14}
					maxRows={14}
					placeholder="Paste a set here and press Import, or press Export"
					inputProps={{ 
						spellCheck: 'false',
					}}
					sx={{
						width:  "80%",		
					  }}
					value={textValue}
					onChange={(event) => {setTextValue(event.target.value)}}
				/>
				<Stack direction="row"  spacing={1} alignItems="center">
					<Button 
						variant="outlined" 
						startIcon={<InputIcon/>}
						onClick={() => {
							const newPoke = addSet(textValue)
							if (newPoke) {
								setPokemon(newPoke)
							}
						}}
					>
						Import
					</Button>
					<Button 
						variant="outlined" 
						endIcon={<OutputIcon/>}
						onClick={() => {
							setTextValue(exportPokemon(pokemon))
						}}
					>
						Export
					</Button>
				</Stack>
			</Stack>
		</Box>
	)
}

export default ImportExportArea;