using JSON3
using OrderedCollections

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

const TARGET_TRANSLATIONS = Dict(
    "normal" => "selected-pokemon",
    "allAdjacentFoes" => "all-opponents",
    "self" => "user",
    "any" => "selected-pokemon",
    "adjacentAllyOrSelf" => "user-or-ally",
    "allyTeam" => "user-and-allies",
    "adjacentAlly" => "ally",
    "allySide" => "users-field",
    "allAdjacent" => "all-other-pokemon",
    "scripted" => "specific-move",
    "adjacentFoe" => "selected-pokemon",
    "all" => "entire-field",
    "allies" => "all-allies",
    "randomNormal" => "selected-pokemon",
    "foeSide" => "opponents-field",
)

struct MoveData
    name::String
    category::String
    target::String
    type::String
    power::Union{Int,Nothing}
    accuracy::Union{Int,Nothing}
    priority::Union{Int,Nothing}
    drain::Union{Int,Nothing}
    healing::Union{Int,Nothing}
    selfDamage::Union{Int,Nothing}
    ailment::Union{String,Nothing}
    statChanges::Union{Dict{String, Any},Nothing}
    ailment::Union{String,Nothing}
    flinchChance::Union{Int,Nothing}
    statChance::Union{Int,Nothing}
    ailmentChance::Union{Int,Nothing}
    minHits::Union{Int,Nothing}
    maxHits::Union{Int,Nothing}
    pp::Union{Int,Nothing}
    ignoreDefensive::Bool
    breaksProtect::Bool
    bypassSub::Bool
    makesContact::Bool
    willCrit::Bool
    highCritChance::Bool
    isPunch::Bool
    isBite::Bool
    isBullet::Bool
    isSound::Bool
    isPulse::Bool
    isSlicing::Bool
    isWind::Bool
end

function showdown_data_to_movedata(s_data, old_data) 
    category = get_category(s_data, old_data)
    target = TARGET_TRANSLATIONS[s_data["target"]]
    type = s_data["type"]
    power = s_data["basePower"] > 0 ? s_data["basePower"] : nothing
    accuracy = s_data["accuracy"] == true ? nothing : s_data["accuracy"]
    priority = s_data["priority"]
    drain = get_drain(s_data)
    healing = get_healing(s_data)
    selfDamage = haskey(old_data, :selfDamage) ? old_data[:selfDamage] : nothing # not directly stored in showdown data
    ailment, ailmentChance = get_ailment(s_data)
    statChanges, statChance = get_stat_changes(s_data)
    flinchChance = haskey(s_data, "secondary") ? haskey(s_data["secondary"], "volatileStatus") ? s_data["secondary"]["volatileStatus"] == "flinch" ? s_data["secondary"]["chance"] : nothing : nothing : nothing
    minHits, maxHits = get_multihit(s_data)
    pp = s_data["pp"]
    ignoreDefensive = haskey(s_data, "ignoreDefensive") ? true : false
    breaksProtect = haskey(s_data, "breaksProtect") ? true : false
    bypassSub = haskey(s_data, "flags") ? haskey(s_data["flags"], "bypasssub") ? true : false : false
    makesContact = haskey(s_data, "flags") ? haskey(s_data["flags"], "contact") ? true : false : false
    willCrit = haskey(s_data, "willCrit") ? true : false
    highCritChance = haskey(s_data, "critRatio") ? s_data["critRatio"] > 1 ? true : false : false
    isPunch = haskey(s_data, "flags") ? haskey(s_data["flags"], "punch") ? true : false : false
    isBite = haskey(s_data, "flags") ? haskey(s_data["flags"], "bite") ? true : false : false
    isBullet = haskey(s_data, "flags") ? haskey(s_data["flags"], "bullet") ? true : false : false
    isSound = haskey(s_data, "flags") ? haskey(s_data["flags"], "sound") ? true : false : false
    isPulse = haskey(s_data, "flags") ? haskey(s_data["flags"], "pulse") ? true : false : false
    isSlicing = haskey(s_data, "flags") ? haskey(s_data["flags"], "slicing") ? true : false : false
    isWind = haskey(s_data, "flags") ? haskey(s_data["flags"], "wind") ? true : false : false
    return MoveData(
        s_data["name"],
        category,
        target,
        type,
        power,
        accuracy,
        priority,
        drain,
        healing,
        selfDamage,
        ailment,
        statChanges,
        ailment,
        flinchChance,
        statChance,
        ailmentChance,
        minHits,
        maxHits,
        pp,
        ignoreDefensive,
        breaksProtect,
        bypassSub,
        makesContact,
        willCrit,
        highCritChance,
        isPunch,
        isBite,
        isBullet,
        isSound,
        isPulse,
        isSlicing,
        isWind
    )
end

function get_category(s_data, old_data)
    if !isnothing(old_data)
        if old_data[:category] == "unique"
            return old_data[:category]
        end
    elseif s_data["category"] == "Status"
        if s_data["name"] ∈ ["Swagger","Flatter","Tar Shot","Toxic Thread"]
            return "swagger"
        elseif haskey(s_data, "heal")
            return "heal"
        elseif haskey(s_data, "boosts")
            return "net-good-stats"
        elseif (haskey(s_data, "status") || haskey(s_data, "volatileStatus"))
            return "ailment"
        elseif (s_data["target"] == "allySide") || (s_data["target"] == "foeSide")
            return "field-effect"
        elseif (s_data["target"] == "all")
            return "whole-field-effect"
        end
    else
        if (haskey(s_data, "drain"))
            return "damage+heal"
        elseif haskey(s_data, "self")
            if haskey(s_data["self"], "boosts")
                return "damage+raise"
            end
        elseif haskey(s_data, "secondary")
            if haskey(s_data["secondary"], "boosts")
                return "damage+lower"
            elseif (haskey(s_data["secondary"], "status") || haskey(s_data["secondary"], "volatileStatus"))
                return "damage+ailment"
            end
        end
        return "damage"
    end
    if !isnothing(old_data)
        return old_data[:category]
    end
    throw(ErrorException("No category found for $(s_data["name"])"))
end

function get_drain(s_data)
    if haskey(s_data, "drain")
        return get_percent(s_data, "drain")
    elseif haskey(s_data, "recoil")
        return get_percent(s_data, "recoil")
    end
    return nothing
end

function get_healing(s_data)
    return get_percent(s_data, "heal")
end

function get_percent(s_data, key)
    if haskey(s_data, key)
        return Int(floor(s_data[key][1] / s_data[key][2] * 100))
    end
    return nothing
end

function get_ailment(s_data)
    if haskey(s_data, "status")
        return (s_data["status"], 100)
    elseif haskey(s_data, "volatileStatus")
        return (s_data["volatileStatus"], 100)
    elseif haskey(s_data, "secondary")
        if haskey(s_data["secondary"], "status")
            chance = haskey(s_data["secondary"], "chance") ? s_data["secondary"]["chance"] : nothing
            return (s_data["secondary"]["status"], chance)
        elseif haskey(s_data["secondary"], "volatileStatus")
            chance = haskey(s_data["secondary"], "chance") ? s_data["secondary"]["chance"] : nothing
            return (s_data["secondary"]["volatileStatus"], chance)
        end
    end
    return nothing
end

function get_stat_changes(s_data)
    if haskey(s_data, "boosts")
        return (translate_boosts(s_data["boosts"]), 100)
    elseif haskey(s_data, "self")
        if haskey(s_data["self"], "boosts")
            chance = haskey(s_data["self"], "chance") ? s_data["self"]["chance"] : nothing
            return (translate_boosts(s_data["self"]["boosts"]), chance)
        end
    elseif haskey(s_data, "secondary")
        if haskey(s_data["secondary"], "boosts")
            chance = haskey(s_data["secondary"], "chance") ? s_data["secondary"]["chance"] : nothing
            return (translate_boosts(s_data["secondary"]["boosts"]), chance)
        end
    end
    return nothing
end

function translate_boosts(boosts)
    new_boosts = Vector{OrderedDict{String, Any}}()
    for (key, value) in boosts
        push!(new_boosts, OrderedDict("stat" => key, "change" => value))
    end
    return new_boosts
end

function get_multihit(s_data)
    if haskey(s_data, "multihit")
        return (s_data["multihit"][1], s_data["multihit"][2])
    end
    return (nothing, nothing)
end

showdown_path = "data/showdown_moves.json"
read_path = "data/moves"
write_path = "data/newmoves"

files = readdir(read_path)
old_moves_data = Dict{String, Dict}()
for file in files
    if occursin(".json", file)
        data = JSON3.read("$read_path/$file")
        push!(old_moves_data, data.name => data)
    end
end

showdown_data = JSON3.read(showdown_path)

## identify missing moves
# missing_moves = Vector{String}()
# for (showdownkey,move) in showdown_data
#     key = move.name
#     if !haskey(old_moves_data, key)
#         push!(missing_moves, key)
#     end
# end
# filter!((x) -> (!occursin("G-Max",x) && !occursin("Hidden Power ",x)), missing_moves)

## generate TARGET_TRANSLATIONS
# temp_target_translations = Vector{Tuple{String, String}}()
# for (showdownkey,move) in showdown_data
#     key = move.name
#     if !haskey(old_moves_data, key)
#         continue
#     end
#     old_data = old_moves_data[key]
#     push!(temp_target_translations, (move["target"], old_data[:target]))
# end
# temp_target_translations = unique(temp_target_translations)

## update moves with showdown data
new_moves_data = Dict{String, MoveData}()