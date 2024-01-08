# tera-raid-builder
A work-in-progress app to help prepare and share builds for Tera Raid Battles in Pokémon Scarlet & Violet.

Feedback, suggestions, or contributions welcome!

### Current Features
#### UI
- Build Raid Pokémon by setting their species, nature, abilitiy, IVs/EVs, and more!
- Load from preset Raider and Boss builds
- Reorder and group raid moves by dragging and dropping, (via [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd))
- Import/Export builds in a format compatible with [PokePastes](pokepast.es) or the [Showdown Damage Calculator](https://calc.pokemonshowdown.com/)
- View damage, status effects, and stat level changes across turns
- Display stats and EVs in radar plots (via [react-plotly.js](https://github.com/plotly/react-plotly.js), saveable as .svg files)
- Filter moves and abilities by those that are available to a particular Pokémon species
- Display when moves are learned via TM or are egg moves
- Translate Pokémon, moves, items, abilities, natures, and stats into any of 9 officially supported languages
- Search for Pokémon by types, abilities, moves, stats, or a combination of filters
#### Raid Simulation
- Damage calculations via [@smogon/calc](https://github.com/smogon/damage-calc/tree/master/calc), with some modifications for Tera raids
- Incorporation of stat boosts, ailments, and field effects from moves and items
- Scripted raid boss actions (shield, stat clears, T0 spread moves)
- Correct interactions for (most) items, abilities, moves, statuses, immunities, and field conditions
#### Sharing
- Save notes and credits with strategies
- Save and share strategies via the URL hash, with strategy information stored in a [https://firebase.google.com/docs/firestore](Cloud Firestore) database
- Generate infographics for showcasing a strategy
- Load strategies in "Pretty Mode" to see view information in an easily-readable format

### Planned Features
- More-complete support for Spanish, Italian, French, Korean, Japanese, and Chinese translations.