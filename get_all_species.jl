using JSON3
using OrderedCollections

const IGNORED_ALT_FORMS = [
    "Mimikyu-Busted",
    "Eiscue-Noice",
    "Mineor-Meteor",
    "Meloetta-Pirouette",
    "Morpeko-Hangry",
    "Terapagos-Stellar",
]

const TYPES = [ # for Arceus, ignore normal
    # "Normal", 
    "Fire",
    "Water",
    "Grass",
    "Electric",
    "Ice",
    "Fighting",
    "Poison",
    "Ground",
    "Flying",
    "Psychic",
    "Bug",
    "Rock",
    "Ghost",
    "Dragon",
    "Dark",
    "Steel",
    "Fairy",
]

function name_to_filename(name)
    words = split(string(name), [' ','-'])
    filename = join(words, "-")
    filename = lowercase(filename)
    filename = replace(filename, "'" => "")
    filename = replace(filename, "’" => "")
    filename = replace(filename, ":" => "")
    filename = replace(filename, "." => "")
    filename = replace(filename, "," => "")
    filename = replace(filename, "é" => "e")
    return filename
end

struct PokemonData
    name::String
    abilities::Vector{OrderedDict{String,Union{String,Bool}}}
    types::Vector{String}
    stats::OrderedDict{String,Int}
    weightkg::Union{Float64,Nothing}
    nfe::Bool
    gender::Union{String,Nothing}
    moves::Vector{OrderedDict{String,String}}
end

species_path = "data/species.json"
read_path = "data/pokemon"
write_path = "data/pokemon"

files = readdir(read_path)
species_from_file = String[]

for file in files
    if file == "_allspecies.json"
        continue
    end
    path = joinpath(read_path, file)
    data = JSON3.read(path)
    name = data[:name]
    push!(species_from_file, name)
end

all_species_data = JSON3.read(species_path)
species = String[]
mismatched_species = String[]
for (key, data) in all_species_data
    push!(species, string(key))
    if string(key) ∉ species_from_file
        push!(mismatched_species, string(key))
    end
end

if length(mismatched_species) > 0
    @warn "There are $(length(mismatched_species)) species in species.json that are not in the pokemon data files."
    @show mismatched_species
end

all_species_dict = OrderedDict{String,Any}()
for file in files
    if file == "_allspecies.json"
        continue
    end
    path = joinpath(read_path, file)
    data = JSON3.read(path)
    name = data[:name]
    name = occursin("Flab", name) ? "Flabébé" : name
    
    if name in IGNORED_ALT_FORMS
        continue
    end
    if name ∉ species
        continue
    end

    species_data = all_species_data[name]

    abilities = [ OrderedDict{String,Union{String,Bool}}([string(key) => val for (key,val) in entry]...) for entry in data[:abilities] ]
    types = [uppercasefirst(string(type)) for type in data[:types]]
    stats = OrderedDict{String,Int}()
    for (key,val) in data[:stats]
        stats[string(key)] = val
    end
    moves = [ OrderedDict{String,String}([string(key) => val for (key,val) in entry]...) for entry in data[:moves] ]
    weightkg = haskey(species_data, :weightkg) ? species_data[:weightkg] : nothing
    nfe = haskey(species_data, :nfe) ? species_data[:nfe] : false
    gender = haskey(species_data, :gender) ? species_data[:gender] : nothing

    poke_data = PokemonData(name, abilities, types, stats, weightkg, nfe, gender, moves)
    all_species_dict[name] = poke_data

    if name === "Arceus"
        for type in TYPES
            new_name = "Arceus-$(type)"
            new_filename = name_to_filename(new_name)*".json";
            new_path = joinpath(write_path, new_filename);
            new_types = [type]
            new_poke_data = PokemonData(new_name, abilities, new_types, stats, weightkg, nfe, gender, moves)
            all_species_dict[new_name] = new_poke_data
        end
    end
end
sort!(all_species_dict)

# write master list of species
open("$write_path/_allspecies.json", "w") do io
    JSON3.pretty(io, all_species_dict)
end

## update individual species files
for (name, data) in all_species_dict
    filename = name_to_filename(name)
    path = joinpath(write_path, "$filename.json")
    open(path, "w") do io
        JSON3.pretty(io, data)
    end
end

