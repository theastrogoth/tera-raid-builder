include(joinpath(@__DIR__, "read_text_dump.jl"))

### MOVES ###

const movesdir = joinpath(@__DIR__, "data", "moves")
const allmovespath = joinpath(movesdir, "_allmoves.json")

function add_move_flavortext!(name, langs, texts, movesdir, allmovesdata)
    fname = joinpath(movesdir, name_to_filename(name) * ".json")
    if isfile(fname)
        movedata = JSON3.read(fname)
        newmovedata = copy_jsondata(movedata)
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
        push!(newallmovesdata, name => copy_jsondata(movedata))
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