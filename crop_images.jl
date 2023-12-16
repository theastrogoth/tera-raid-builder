using FileIO

function get_crop_bounds(img::Array{RGBA{N0f8},2})
    (l,w) = size(img)
    xmin = typemax(Int64)
    xmax = typemin(Int64)
    ymin = typemax(Int64)
    ymax = typemin(Int64)
    for i=1:l
        for j=1:w
            if img[i,j].alpha > 0
                xmin = min(xmin, i)
                xmax = max(xmax, i)
                ymin = min(ymin, j)
                ymax = max(ymax, j)
            end
        end
    end
    return (xmin, xmax, ymin, ymax)
end

function crop_image(img::Array{RGBA{N0f8},2})
    (xmin, xmax, ymin, ymax) = get_crop_bounds(img)
    return img[xmin:xmax, ymin:ymax]
end

function write_cropped_image(img::Array{RGBA{N0f8},2}, filename::String)
    cropped = crop_image(img)
    save(filename, cropped)
end

function crop_images(dir::String)
    for filename in readdir(dir)
        if endswith(filename, ".png")
            img = load(joinpath(dir,filename))
            write_cropped_image(img,joinpath(dir,filename))
        end
    end
end

dir = "images/box_sprites/"
crop_images(dir)