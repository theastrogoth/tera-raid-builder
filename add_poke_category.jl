include(joinpath(@__DIR__, "read_text_dump.jl"))

const pokedir = joinpath(@__DIR__, "data", "pokemon")

const other_forms = [ # this isn't a complete list and isn't in a particular order
    "m",
    "f",
    "rainy",
    "snowy",
    "sunny",
    "attack",
    "defense",
    "speed",
    "zen",
    "meteor",
    "busted",
    "noice",
    "hangry",
    "alola",
    "galar",
    "galar-zen",
    "low-key",
    "hisui",
    "paldea",
    "paldea-combat",
    "paldea-aqua",
    "paldea-blaze",
    "stretchy",
    "droopy",
    "plant",
    "trash",
    "sandy",
    "therian",
    "crowned",
    "origin",
    "primal",
    "eternal",
    "fan",
    "frost",
    "heat",
    "mow",
    "wash",
    "roaming",
    "sky",
    "unbound",
    "resolute",
    "pirouette",
    "black",
    "white",
    "dusk",
    "midnight",
    "original",
    "dawn-wings",
    "dusk-mane",
    "ultra",
    "cornerstone",
    "hearthflame",
    "wellspring",
    "pau",
    "pom-pom",
    "sensu",
    "hero",
    "artisan",
    "antique",
    "masterpiece",
    "large",
    "small",
    "super",
    "bloodmoon",
    "dada",
    "rapid-strike"
]

function add_as_nth_entry(dict, key, value, n)
    # this is a stupid way to do this
    newdict = OrderedDict()
    if (n == 1)
        push!(newdict, key => value)
    end
    for (i,(k, v)) in enumerate(dict)
        push!(newdict, k => v)
        if i==n-1
            push!(newdict, key => value)
        end
    end
    return newdict
end

function add_poke_category!(name, langs, texts, pokedir, allpokesdict, warn = false)
    fname = joinpath(pokedir, name_to_filename(name) * ".json")
    if isfile(fname)
        pdata = JSON3.read(fname)
        if isnothing(pdata)
            warn && println("Failed to load data for $name ($(name_to_filename(name)).json)")
            return
        end
        pokedata = copy_jsondata(pdata)
        catdict = OrderedDict()
        for (lang, text) in zip(langs, texts)
            push!(catdict, lang => text)
        end
        finaldict = add_as_nth_entry(pokedata, :category, catdict, 2)
        if (haskey(allpokesdict, Symbol(name)))
            allpokesdict[Symbol(name)] = finaldict
        else
            warn && println("No entry found for $name")
        end
        open(fname, "w") do io
            JSON3.pretty(io, finaldict)
        end
    else
        warn && println("No file found for $name ($(name_to_filename(name)).json)")
    end        
end

function add_poke_categories(pokedir)
    allpokesdata = JSON3.read(joinpath(pokedir, "_allspecies.json"))
    allpokesdict = OrderedDict()
    for (name, pokedata) in allpokesdata
        push!(allpokesdict, name => copy_jsondata(pokedata))
    end
    for (poke, number) in englishdata["pokemon"]
        texts = [englishdata["category"][number], [tdata["category"][number] for tdata in translationdata]...]
        if (poke == "Meowstic")
            add_poke_category!("Meowstic-M", all_langs, texts, pokedir, allpokesdict, true)
            add_poke_category!("Meowstic-F", all_langs, texts, pokedir, allpokesdict, true)
        else
            add_poke_category!(poke, all_langs, texts, pokedir, allpokesdict, true)
            for form in other_forms
                add_poke_category!(poke * "-" * form, all_langs, texts, pokedir, allpokesdict, false)
            end
        end
    end
    open(joinpath(pokedir, "_allspecies.json"), "w") do io
        JSON3.pretty(io, allpokesdict)
    end
end

add_poke_categories(pokedir)