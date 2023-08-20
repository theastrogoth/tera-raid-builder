from PIL import Image
import os

def get_content_box(image):
    image_data = image.convert("RGBA").getdata()

    min_x = float("inf")
    min_y = float("inf")
    max_x = 0
    max_y = 0

    width, height = image.size

    for y in range(height):
        for x in range(width):
            r, g, b, alpha = image_data[y * width + x]
            if alpha > 0:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    content_width = max_x - min_x + 1
    content_height = max_y - min_y + 1

    return content_width, content_height

def main():
    arts_path = "./images/arts"
    shinies_path = "./images/shiny_arts"
    output_file = "output.txt"
    threshold_dimension = 596

    arts_files = [file for file in os.listdir(arts_path) if file.lower().endswith(".png")]
    shinies_files = [file for file in os.listdir(shinies_path) if file.lower().endswith(".png")]
    valid_files = [file for file in arts_files if file in shinies_files]

    image_too_small_buffer = ""
    image_size_mismatch_buffer = ""

    with open(output_file, "w") as f:
        for png_file in valid_files:
            art_path = os.path.join(arts_path, png_file)
            shiny_path = os.path.join(shinies_path, png_file)

            art = Image.open(art_path)
            shiny = Image.open(shiny_path)

            art_width, art_height = get_content_box(art)
            shiny_width, shiny_height = get_content_box(shiny)
            
            if art_width < threshold_dimension and art_height < threshold_dimension:
                image_too_small_buffer += f"arts/{png_file} too small ({art_width} x {art_height})\n"
            if shiny_width < threshold_dimension and shiny_height < threshold_dimension:
                image_too_small_buffer += f"shiny_arts/{png_file} too small ({shiny_width} x {shiny_height})\n"
            if art_width < shiny_width - 2 or art_width > shiny_width + 2 or art_height < shiny_height - 2 or art_height > shiny_height + 2:
                image_size_mismatch_buffer += f"{png_file} image size mismatch (non-shiny: {art_width} x {art_height}, shiny: {shiny_width} x {shiny_height})\n"

        f.write(image_too_small_buffer + "\n")
        f.write(image_size_mismatch_buffer + "\n")

    print("Done! Check the output file for the list of PNG files.")

if __name__ == "__main__":
    main()
