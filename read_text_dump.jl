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
    "wazainfo.dat" => "moveinfo",
    "monsname.dat" => "pokemon",
    "zkn_type.dat" => "category"
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
        id_splits = split(code, "_")
        # ignore variant forms for now 
        if tryparse(Int, id_splits[end-1]) === nothing 
            add_line!(results, parse(Int, id_splits[end]), text)
        end
    end
end


function read_file!(results, path, categories = file2category)
    open(path) do io
        while !eof(io)
            line = readline(io)
            if startswith(line, "Text File : ")
                category = split(line, " : ")[2]
                if (category ∈ keys(categories))
                    catdict = occursin("info", category) || occursin("type", category) ? OrderedDict{Int,String}() : OrderedDict{String,Int}()
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

function copy_jsondata(data)
    newdata = OrderedDict()
    for (key, val) in data
        if typeof(val) <: JSON3.Array
            if !isempty(val) && typeof(val[1]) <: JSON3.Object
                newval = [OrderedDict(v) for v in val]
                push!(newdata, key => newval)
            else
                push!(newdata, key => [v for v in val])
            end
        elseif typeof(val) <: JSON3.Object
            push!(newdata, key => OrderedDict(val))
        else
            push!(newdata, key => val)
        end
    end
    return newdata
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
    filename = replace(filename, "é" => "e")
    filename = replace(filename, "♀" => "-f")
    filename = replace(filename, "♂" => "-m")
    return filename
end

englishdata = read_file(englishpath)
translationdata = [read_file(path) for path in translationpaths]