import bars from '../images/bars_test_image.png'
import React, { useState, useRef } from "react";

class Pixel {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    constructor(red: number, green: number, blue: number, alpha: number) {
        this.red = red
        this.green = green
        this.blue = blue
        this.alpha = alpha
    }
}

class PixelImage {
    pixels: Pixel[][]
    imageData: ImageData
    constructor(imageData: ImageData) {
        this.imageData = imageData
        this.pixels = this.getPixels()
    }
    private getPixels(): Pixel[][] {
        const tempPixels: Pixel[][] = []

        const data = this.imageData.data
        for (let i = 0; i < data.length; i += 4) {
            const pixel = new Pixel(data[i], data[i + 1], data[i + 2], data[i + 3]);
            const row = Math.floor(i / 4 / this.imageData.width);
            if (!tempPixels[row]) {
                tempPixels[row] = [];
            }
            tempPixels[row].push(pixel);
        }

        return tempPixels
    }

    recalculateImageData(): ImageData {
        const data = this.imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const row = Math.floor(i / 4 / this.imageData.width);
            const col = (i / 4) % this.imageData.width;
            data[i] = this.pixels[row][col].red;
            data[i + 1] = this.pixels[row][col].green;
            data[i + 2] = this.pixels[row][col].blue;
            data[i + 3] = this.pixels[row][col].alpha;
        }
        return this.imageData
    }
}


function invertPixels(pixelImage: PixelImage): PixelImage {
    const pixels = pixelImage.pixels
    for (var i = 0; i < pixels.length; i++) {
        for (var j = 0; j < pixels[0].length; j++) {
            pixels[i][j].red = 255 - pixels[i][j].red
            pixels[i][j].green = 255 - pixels[i][j].green
            pixels[i][j].blue = 255 - pixels[i][j].blue
        }
    }
    return pixelImage
}

function flipHorizontally(pixelImage: PixelImage) {
    const pixels = pixelImage.pixels
    for (var i = 0; i < pixels.length; i++) {
        for (var j = 0; j < Math.floor(pixels[0].length / 2); j++) {
            const corresponding_j = pixels[0].length - 1 - j
            const temp = pixels[i][j]
            pixels[i][j] = pixels[i][corresponding_j]
            pixels[i][corresponding_j] = temp

        }
    }
}

function flipVertically(pixelImage: PixelImage) {
    const pixels = pixelImage.pixels
    for (var i = 0; i < Math.floor(pixels.length / 2); i++) {
        for (var j = 0; j < pixels[0].length; j++) {
            const corresponding_i = pixels.length - 1 - i
            const temp = pixels[i][j]
            pixels[i][j] = pixels[corresponding_i][j]
            pixels[corresponding_i][j] = temp
        }
    }
}

const ModifyImage: React.FC = () => {
    const [image, setImage] = useState(bars);
    const imageRef = useRef<HTMLImageElement>(null);

    /**
     *  Javascript requires a lot of handling to get at the individual pixels
     *  this method is meant to do that, just pass in an appropriate function
     *  pointer to your desired transformation
     */
    const modifyImage = (modifyFunction: (image: PixelImage) => void) => {
        if (imageRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = imageRef.current.width;
            canvas.height = imageRef.current.height;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(imageRef.current, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                const pixelImage = new PixelImage(imageData)

                modifyFunction(pixelImage)
                pixelImage.recalculateImageData()

                ctx.putImageData(imageData, 0, 0);
                setImage(canvas.toDataURL());
            }
        }
    };

    return (
        <div>
            <img ref={imageRef} src={image} alt="Image" />
            <button onClick={() => modifyImage(invertPixels)}>Invert Pixels</button>
            <button onClick={() => modifyImage(flipHorizontally)}>Flip horizontally</button>
            <button onClick={() => modifyImage(flipVertically)}>Flip vertically</button>
        </div>
    );
};

export default ModifyImage;
