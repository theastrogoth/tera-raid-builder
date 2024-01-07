using JSON3
using OrderedCollections

const LEARNMETHOD_PREFRENCE = [
    "level-up",
    "machine",
    "egg",
    "prior-evo", # e.g. Spore on Breloom
    "event",
]

const FORM_NAMES = Dict(
    # Alolan forms
    "Raichu-1" => "Raichu-Alola",
    "Sandshrew-1" => "Sandshrew-Alola",
    "Sandslash-1" => "Sandslash-Alola",
    "Vulpix-1" => "Vulpix-Alola",
    "Ninetales-1" => "Ninetales-Alola",
    "Diglett-1" => "Diglett-Alola",
    "Dugtrio-1" => "Dugtrio-Alola",
    "Meowth-1" => "Meowth-Alola",
    "Persian-1" => "Persian-Alola",
    "Geodude-1" => "Geodude-Alola",
    "Graveler-1" => "Graveler-Alola",
    "Golem-1" => "Golem-Alola",
    "Grimer-1" => "Grimer-Alola",
    "Muk-1" => "Muk-Alola",
    "Exeggutor-1" => "Exeggutor-Alola",
    # Galarian forms
    "Mewoth-2" => "Meowth-Galar",
    "Slowpoke-1" => "Slowpoke-Galar",
    "Slowbro-2" => "Slowbro-Galar",
    "Slowking-1" => "Slowking-Galar",
    "Weezing-1" => "Weezing-Galar",
    "Articuno-1" => "Articuno-Galar",
    "Zapdos-1" => "Zapdos-Galar",
    "Moltres-1" => "Moltres-Galar",
    # Hisuian forms
    "Growlithe-1" => "Growlithe-Hisui",
    "Arcanine-1" => "Arcanine-Hisui",
    "Voltorb-1" => "Voltorb-Hisui",
    "Electrode-1" => "Electrode-Hisui",
    "Typhlosion-1" => "Typhlosion-Hisui",
    "Qwilfish-1" => "Qwilfish-Hisui",
    "Sneasel-1" => "Sneasel-Hisui",
    "Samurott-1" => "Samurott-Hisui",
    "Lilligant-1" => "Lilligant-Hisui",
    "Basculin-2" => "Basculin-White-Striped",
    "Zorua-1" => "Zorua-Hisui",
    "Zoroark-1" => "Zoroark-Hisui",
    "Braviary-1" => "Braviary-Hisui",
    "Sliggoo-1" => "Sliggoo-Hisui",
    "Goodra-1" => "Goodra-Hisui",
    "Avalugg-1" => "Avalugg-Hisui",
    "Decidueye-1" => "Decidueye-Hisui",
    # Paldean forms
    "Tauros-1" => "Tauros-Paldea-Combat",
    "Tauros-2" => "Tauros-Paldea-Blaze",
    "Tauros-3" => "Tauros-Paldea-Aqua",
    "Wooper-1" => "Wooper-Paldea",
    # Other
    "Deoxys-1" => "Deoxys-Attack",
    "Deoxys-2" => "Deoxys-Defense",
    "Deoxys-3" => "Deoxys-Speed",
    "Rotom-1" => "Rotom-Heat",
    "Rotom-2" => "Rotom-Wash",
    "Rotom-3" => "Rotom-Frost",
    "Rotom-4" => "Rotom-Fan",
    "Rotom-5" => "Rotom-Mow",
    "Dialga-1" => "Dialga-Origin",
    "Palkia-1" => "Palkia-Origin",
    "Giratina-1" => "Giratina-Origin",
    "Shaymin-1" => "Shaymin-Sky",
    "Basculin-1" => "Basculin-Blue-Striped",
    "Tornadus-1" => "Tornadus-Therian",
    "Thundurus-1" => "Thundurus-Therian",
    "Landorus-1" => "Landorus-Therian",
    "Kyurem-1" => "Kyurem-White",
    "Kyurem-2" => "Kyurem-Black",
    "Keldeo-1" => "Keldeo-Resolute",
    "Meloetta-1" => "Meloetta-Pirouette",
    "Hoopa-1" => "Hoopa-Unbound",
    "Oricorio-1" => "Oricorio-Pom-Pom",
    "Oricorio-2" => "Oricorio-Pau",
    "Oricorio-3" => "Oricorio-Sensu",
    "Lycanroc-1" => "Lycanroc-Midnight",
    "Lycanroc-2" => "Lycanroc-Dusk",
    "Necrozma-1" => "Necrozma-Dusk-Mane",
    "Necrozma-2" => "Necrozma-Dawn-Wings",
    "Toxtricity-1" => "Toxtricity-Low-Key",
    "Indeedee-1" => "Indeedee-F",
    "Zacian-1" => "Zacian-Crowned",
    "Zamazenta-1" => "Zamazenta-Crowned",
    "Urshifu-1" => "Urshifu-Rapid-Strike",
    "Zarude-1" => "Zarude-Dada",
    "Calyrex-1" => "Calyrex-Ice-Rider",
    "Calyrex-2" => "Calyrex-Shadow-Rider",
    "Ursaluna-1" => "Ursaluna-Bloodmoon",
    "Basculegion-1" => "Basculegion-F",
    "Enamorus-1" => "Enamorus-Therian",
    "Ogerpon-1" => "Ogerpon-Wellspring",
    "Ogerpon-2" => "Ogerpon-Hearthflame",
    "Ogerpon-3" => "Ogerpon-Cornerstone",
    "Terapagos-1" => "Terapagos-Terastal",
    "Terapagos-2" => "Terapagos-Stellar",
)

const REGIONAL_EVOLUTIONS = Dict(
    "Pikachu" => "Raichu-Alola",
    "Exeggcute" => "Exeggutor-Alola",
    "Koffing" => "Weezing-Galar",
    "Quilava" => "Typhlosion-Hisui",
    "Dewott" => "Samurott-Hisui",
    "Petilil" => "Lilligant-Hisui",
    "Rufflet" => "Braviary-Hisui",
    "Goomy" => "Sliggoo-Hisui",
    "Bergmite" => "Avalugg-Hisui",
    "Dartrix" => "Decidueye-Hisui",
)

struct AbilityInfo
    name::String
    hidden::Bool
end

struct StatsTable
    hp::Int64
    atk::Int64
    def::Int64
    spa::Int64
    spd::Int64
    spe::Int64
end

struct MoveInfo
    name::String
    learnMethod::String
end

struct PokemonData
    name::String
    abilities::Vector{AbilityInfo}
    types::Vector{String}
    stats::StatsTable
    moves::Vector{MoveInfo}
end


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

function create_sciresm_dict(lines)
    pokemon_dict = OrderedDict{String, OrderedDict{Symbol, Any}}()
    remaininglines = lines
    while !isempty(remaininglines)
        startidx = findfirst(x -> occursin("======", x), remaininglines)
        endidx = findfirst(x -> occursin("======", x), remaininglines[startidx+3:end])
        if isnothing(endidx)
            endidx = length(remaininglines)
        else
            endidx += 2
        end
        pokemon = parse_pokemon(remaininglines[startidx:endidx])
        if !isnothing(pokemon)
            push!(pokemon_dict, pokemon[:name] => pokemon)
        end
        remaininglines = remaininglines[endidx+1:end]
    end
    return pokemon_dict
end

function parse_pokemon(lines)
    @assert occursin("======", lines[1]) && occursin("======", lines[3])
    name = parse_name(lines[2])
    ignore_form_regex = r"(-[0-9])"
    if occursin(ignore_form_regex, name)
        return nothing
    end
    stats = parse_stats(lines[4])
    abilities = parse_abilities(lines[8])
    types = parse_types(lines[9])
    moves = parse_moves(lines[13:end])
    evoline_idx = findfirst(x -> occursin("Evolves into", x), lines)
    evolvesInto = String[]
    if !isnothing(evoline_idx)
        evolvesInto = parse_evolutions(lines[evoline_idx:end])
    end
    if haskey(REGIONAL_EVOLUTIONS, name)
        push!(evolvesInto, REGIONAL_EVOLUTIONS[name])
    end
    return OrderedDict(
        :name => name,
        :stats => stats,
        :abilities => abilities,
        :types => types,
        :moves => moves,
        :evolvesInto => unique(evolvesInto),
    )
end

function parse_name(line)
    words = split(line, " ")
    dex_num_idx = findfirst(w -> occursin("#",w) || occursin("(",w), words)
    name = join(words[3:dex_num_idx-1], " ")
    if haskey(FORM_NAMES, name)
        name = FORM_NAMES[name]
    end
    return name
end

function parse_stats(line)
    stat_str = split(line, " ")[3]
    stats = [parse(Int,s) for s in split(stat_str, ".")]
    return StatsTable(stats...)
end

function parse_abilities(line)
    ability_strs = split(line[12:end], "| ")
    abilities = [parse_ability(s) for s in ability_strs]
    return unique(x -> x.name, abilities)
end

function parse_ability(str)
    words = filter(x -> length(x) > 0, split(str, " "))
    name = join(words[1:end-1], " ")
    hidden = occursin("H", words[end])
    return AbilityInfo(name, hidden)
end

function parse_types(line)
    type_strs = split(line[7:end], " / ")
    types = [lowercase(t) for t in type_strs]
    return types
end

function parse_moves(lines)
    moves = Vector{MoveInfo}()
    current_method = "level-up"
    for line in lines
        if isempty(line)
            continue
        elseif line[1] == '-'
            move = parse_move(line)
            if isnothing(findfirst(x -> x.name == move, moves))
                # only add the move if it's not already in the list. Preferred learnmethods will be listed first
                push!(moves, MoveInfo(move, current_method))
            end
        else 
            if line == "Level Up Moves:" || line == "Reminder:"
                current_method = "level-up"
            elseif line == "TM Learn:"
                current_method = "machine"
            elseif line == "Egg Moves:"
                current_method = "egg"
            else
                current_method = "event" # These might not be part of this dataset
            end
        end
    end
    return moves
end

function parse_move(line)
    words = split(line, "] ")
    move = words[end]
    if move[1:2] == "- "
        move = move[3:end]
    end
    return move
end

function parse_evolutions(lines)
    evolutions = String[]
    for line in lines
        if isempty(line)
            continue
        elseif line[1:13] == "Evolves into "
            push!(evolutions, parse_evolution(line))
        else
            break
        end
    end
    return evolutions
end

function parse_evolution(line)
    @assert line[1:13] == "Evolves into "
    name = split(line[14:end], " @")[1]
    if name[end-1:end] == "-0"
        name = name[1:end-2]
    end
    if haskey(FORM_NAMES, name)
        name = FORM_NAMES[name]
    end
    return name
end

function add_prevos!(pokemon_dict)
    for (name, pokemon) in pokemon_dict
        evolves_into = pokemon[:evolvesInto]
        for evo in evolves_into
            if haskey(pokemon_dict, evo)
                pokemon_dict[evo][:prevo] = name
            else
                @show evo
            end
        end
    end
end

function add_all_prevo_moves!(pokemon_dict, pokemon_dict_temp)
    for (name, poke_dict) in pokemon_dict
        add_prevo_moves!(poke_dict, pokemon_dict_temp)
    end
end

function add_prevo_moves!(poke_dict, pokemon_dict_temp)
    prevos = String[]
    moves = poke_dict[:moves]
    temp_poke_dict = poke_dict
    while haskey(temp_poke_dict, :prevo)
        push!(prevos, temp_poke_dict[:prevo])
        temp_poke_dict = pokemon_dict_temp[prevos[end]]
    end
    for prevo in prevos
        prevo_moves = pokemon_dict_temp[prevo][:moves]
        for (moveinfo) in prevo_moves
            move = moveinfo.name
            method = moveinfo.learnMethod
            if isnothing(findfirst(x -> x.name == move, moves))
                push!(moves, MoveInfo(move, method == "egg" ? method : "prior-evo"))
            end
        end
    end
    return sort!(moves; by = x -> x.name)
end

function write_pokemon_data(pd)
    data = PokemonData(pd[:name], pd[:abilities], pd[:types], pd[:stats], pd[:moves])
    filename = name_to_filename(pd[:name])
    open("$write_path/$filename.json", "w") do io
        JSON3.pretty(io, data)
    end
end

lines = readlines("data/sciresm_learnsets.txt")
pokemon_dict_temp = create_sciresm_dict(lines)
add_prevos!(pokemon_dict_temp)

pokemon_dict_final = deepcopy(pokemon_dict_temp)
add_all_prevo_moves!(pokemon_dict_final, pokemon_dict_temp)


# write_path = "data/pokemon"
# for (name, pd) in pokemon_dict_final
#     write_pokemon_data(pd)
# end