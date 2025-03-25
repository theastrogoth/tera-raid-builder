using JSON3
using OrderedCollections
using FileIO

const englishpath = joinpath(@__DIR__, "data", "sv_common", "English.txt")

const translationdir = joinpath(@__DIR__, "data", "translations")

const translationpaths = map(x -> joinpath(@__DIR__, "data", "sv_common", x), [
    "Japanese (Kanji).txt",
    "French.txt",
    "Spanish (Spain).txt",
    "German.txt",
    "Italian.txt",
    "Korean.txt",
    "Chinese (Traditional).txt",
    "Chinese (Simplified).txt",
])

const translationlabels = ["ja", "fr", "es", "de", "it", "ko", "zh-Hant", "zh-Hans"]
const all_langs = ["en", translationlabels...]

const file2category = Dict{String, String}(
    "itemname.dat" => "item",
    "iteminfo.dat" => "iteminfo",
    "tokusei.dat" => "ability",
    "tokuseiinfo.dat" => "abilityinfo",
    "wazaname.dat" => "move",
    "wazainfo.dat" => "moveinfo"
)

add_line!(results::OrderedDict{Int,String}, number, text) = push!(results, number => text)
add_line!(results::OrderedDict{String,Int}, number, text) = push!(results, text => number)

function read_section!(results, io)
    readline(io) # throw out first line
    while !eof(io)
        line = readline(io)
        if (line == "" || line == "~~~~~~~~~~~~~~~")
            break
        end
        number, address, code, text = split(line, "\t")
        text = replace(text, '’' => ''')
        id = split(code, "_")[2] 
        add_line!(results, parse(Int, id), text)
    end
end


function read_file!(results, path, categories = file2category)
    open(path) do io
        while !eof(io)
            line = readline(io)
            if startswith(line, "Text File : ")
                category = split(line, " : ")[2]
                if (category ∈ keys(categories))
                    catdict = occursin("info", category) ? OrderedDict{Int,String}() : OrderedDict{String,Int}()
                    read_section!(catdict, io)
                    push!(results, categories[category] => catdict)
                end
            end
        end
    end
end

function read_file(path, categories = file2category)
    results = Dict{String, Union{OrderedDict{Int,String}, OrderedDict{String,Int}}}()
    read_file!(results, path, categories)
    return results
end

englishdata = read_file(englishpath)
translationdata = [read_file(path) for path in translationpaths]

### MOVES ###

const movesdir = joinpath(@__DIR__, "data", "moves")
const allmovespath = joinpath(movesdir, "_allmoves.json")

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

function copy_movedata(movedata)
    newmovedata = OrderedDict()
    for (key, val) in movedata
        if key == :statChanges && !isnothing(val)
            newStatChanges = []
            for (stat, change) in val
                push!(newStatChanges, OrderedDict(stat, change))
            end
            push!(newmovedata, :statChanges => newStatChanges)
        else
            push!(newmovedata, key => val)
        end
    end
    return newmovedata
end

function add_move_flavortext!(name, langs, texts, movesdir, allmovesdata)
    fname = joinpath(movesdir, name_to_filename(name) * ".json")
    if isfile(fname)
        movedata = JSON3.read(fname)
        newmovedata = copy_movedata(movedata)
        flavordict = OrderedDict()
        for (lang, text) in zip(langs, texts)
            push!(flavordict, lang => text)
        end
        push!(newmovedata, :flavorText => flavordict)
        open(fname, "w") do io
            JSON3.pretty(io, newmovedata)
        end
    else
        println("No file found for $name")
    end
    if haskey(allmovesdata, Symbol(name))
        movedata = allmovesdata[Symbol(name)]
        flavordict = OrderedDict()
        for (lang, text) in zip(langs, texts)
            push!(flavordict, lang => text)
        end
        push!(movedata, :flavorText => flavordict)
    else
        println("No entry found for $name")
    end
    return allmovesdata
end

function add_move_flavortexts(movesdir, allmovespath)
    allmovesdata = JSON3.read(allmovespath)
    newallmovesdata = OrderedDict()
    for (name, movedata) in allmovesdata
        push!(newallmovesdata, name => copy_movedata(movedata))
    end
    for (move, number) in englishdata["move"]
        texts = [englishdata["moveinfo"][number], [tdata["moveinfo"][number] for tdata in translationdata]...]
        add_move_flavortext!(move, all_langs, texts, movesdir, newallmovesdata)
    end
    open(allmovespath, "w") do io
        JSON3.pretty(io, newallmovesdata)
    end
end

add_move_flavortexts(movesdir, allmovespath)

### ITEMS ###

const itemsdir = joinpath(@__DIR__, "data", "items")

function write_simple_file(dir, name, langs, texts)
    fname = joinpath(dir, name_to_filename(name) * ".json")
    itemdata = OrderedDict()
    push!(itemdata, "name" => name)
    flavordict = OrderedDict()
    for (lang, text) in zip(langs, texts)
        push!(flavordict, lang => text)
    end
    push!(itemdata, "flavorText" => flavordict)
    open(fname, "w") do io
        JSON3.pretty(io, itemdata)
    end
end

write_item(item, langs, texts) = write_simple_file(itemsdir, item, langs, texts)

for (item, number) in englishdata["item"]
    if (length(item) > 0 && !any(x -> contains(item, x), ['★',"???", "None"]))
        texts = [englishdata["iteminfo"][number], [tdata["iteminfo"][number] for tdata in translationdata]...]
        if first(texts) != "N/A" && first(texts) != "- - -"
            write_item(item, all_langs, texts)
        end
    end
end

### ABILITIES ###
const abilitiesdir = joinpath(@__DIR__, "data", "abilities")

write_ability(ability, langs, texts) = write_simple_file(abilitiesdir, ability, langs, texts)

for (ability, number) in englishdata["ability"]
    if ability != "—"
        texts = [englishdata["abilityinfo"][number], [tdata["abilityinfo"][number] for tdata in translationdata]...]
        write_ability(ability, all_langs, texts)
    end
end

### TRANSLATIONS ###


# function add_flavor_texts(englishdata, languagedata, translationpath)
#     translationdata = JSON3.read(translationpath)
#     newtranslationdata = OrderedDict()
#     for (name, dict) in translationdata
#         push!(newtranslationdata, name => OrderedDict(dict))
#     end
#     # abilities
#     abilityflavordict = OrderedDict()
#     for (ability, number) in englishdata["ability"]
#         if ability != "—"
#             text = languagedata["abilityinfo"][number]
#             push!(abilityflavordict, ability => text)
#         end
#     end
#     push!(newtranslationdata, "ability_flavor" => abilityflavordict)
#     # items
#     itemflavordict = OrderedDict()
#     for (item, number) in englishdata["item"]
#         if (length(item) > 0 && !any(x -> contains(item, x), ['★',"???"]))
#             text = languagedata["iteminfo"][number]
#             if text != "N/A" && text != "- - -"
#                 push!(itemflavordict, item => text)
#             end
#         end
#     end
#     push!(newtranslationdata, "item_flavor" => itemflavordict)
#     # moves
#     moveflavordict = OrderedDict()
#     for (move, number) in englishdata["move"]
#         text = languagedata["moveinfo"][number]
#         push!(moveflavordict, move => text)
#     end
#     push!(newtranslationdata, "move_flavor" => moveflavordict)
#     open(translationpath, "w") do io
#         JSON3.pretty(io, newtranslationdata)
#     end
# end

# for (translationdata, label) in zip(translationdata, translationlabels)
#     add_flavor_texts(englishdata, translationdata, joinpath(translationdir, label * ".json"))
# end