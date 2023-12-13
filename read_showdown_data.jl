using JSON3
using OrderedCollections

const SHOWDOWN_LEARNSET_CODES = Dict{Char, String}(
    'M' => "machine",
    'L' => "level-up",
    'E' => "egg",
    'S' => "event",
    'R' => "level-up", # Form dependent?
)

const LEARNMETHOD_PREFRENCE = [
    "level-up",
    "machine",
    "egg",
    "prior-evo", # e.g. Spore on Breloom
    "event",
]

function filename_to_name(filename)
    if haskey(SPECIAL_NAMES, filename)
        return SPECIAL_NAMES[filename]
    end
    words = split(filename, '-')
    for (i,word) in enumerate(words)
        words[i] = uppercase(word[1]) * word[2:end]
    end
    name = join(words, "-")
    return name
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

function name_to_showdown_key(name)
    key = name_to_filename(name)
    key = replace(key, "-" => "")
    return key
end

function get_best_learnmethod(codes)
    methods = String[]
    for code in codes
        try
            if code[1] == '9'
                push!(methods, SHOWDOWN_LEARNSET_CODES[code[2]])
            end
        catch e
            @show code
            throw(e)
        end
    end
    methods = unique(methods)
    if isempty(methods)
        return nothing
    else
        for method_type in LEARNMETHOD_PREFRENCE
            if method_type in methods
                return method_type
            end
        end
        return methods[1]
    end
end

function get_all_learnmethods(showdown_moves)
    moves = OrderedDict{String,String}()
    for (key, codes) in showdown_moves
        method = get_best_learnmethod(codes)
        if !isnothing(method)
            push!(moves, showdown_moves_keys[string(key)] => method)
        end
    end
    return moves
end

function add_prevo_moves!(moves, pokemon_name, showdown_dex, showdown_sets)
    prevos = String[]
    dex_entry = showdown_dex[name_to_showdown_key(pokemon_name)]
    while haskey(dex_entry, :prevo)
        push!(prevos, dex_entry[:prevo])
        dex_entry = showdown_dex[name_to_showdown_key(prevos[end])]
    end
    for prevo in prevos
        prevo_moves = get_all_learnmethods(showdown_sets[name_to_showdown_key(prevo)][:learnset])
        for (move, method) in prevo_moves
            if !haskey(moves, move)
                if method == "egg"
                    moves[move] = method
                else
                    moves[move] = "prior-evo"
                end   
            else
                methods = [moves[move], method]
                for method_type in LEARNMETHOD_PREFRENCE
                    if method_type in methods
                        moves[move] = method_type
                        break
                    end
                end
            end
        end
    end
    return sort!(moves)
end

function get_learnset(pokemon_name, showdown_dex, showdown_sets)
    moves = get_all_learnmethods(showdown_sets[name_to_showdown_key(pokemon_name)][:learnset])
    moves = add_prevo_moves!(moves, pokemon_name, showdown_dex, showdown_sets)
    return moves
end

showdown_dex = JSON3.read("data/showdown_dex.json")
showdown_moves = JSON3.read("data/showdown_moves.json")
showdown_sets = JSON3.read("data/showdown_learnsets.json")

showdown_species_keys = OrderedDict{String,String}()
for (key, value) in showdown_dex
    showdown_species_keys[string(key)] = value["name"]
end

showdown_moves_keys = OrderedDict{String,String}()
for (key, value) in showdown_moves
    showdown_moves_keys[string(key)] = value["name"]
end

learnsets = OrderedDict{String,OrderedDict{String,String}}()
for (key, value) in showdown_dex
    try
        !haskey(showdown_sets, key) && continue
        name = value["name"]
        learnsets[name] = get_learnset(name, showdown_dex, showdown_sets)
    catch e
        @show key
    end
end
sort!(learnsets)

