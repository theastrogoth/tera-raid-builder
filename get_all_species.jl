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

all_species_data = JSON3.read(species_path)
species = [ string(key) for (key,data) in all_species_data ]

files = readdir(read_path)

all_species_dict = OrderedDict{String,Any}()
for file in files
    if file == "_allspecies.json"
        continue
    end
    path = joinpath(read_path, file)
    data = JSON3.read(path)
    name = data[:name]
    if name in IGNORED_ALT_FORMS
        continue
    end
    if name ∉ species
        continue
    end

    species_data = all_species_data[name]

    abilities = [ OrderedDict{String,Union{String,Bool}}([string(key) => val for (key,val) in entry]...) for entry in data[:abilities] ]
    types = [string(type) for type in data[:types]]
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
end
sort!(all_species_dict)

## write master list of species
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

