import bars from '../images/bars_test_image.png'
import React, { useState, useRef } from "react";

class Pixel {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    disabled: boolean;
    constructor(red: number, green: number, blue: number, alpha: number, disabled: boolean = false) {
        this.red = red
        this.green = green
        this.blue = blue
        this.alpha = alpha
        this.disabled = false
    }
}


function getPixelImageFromImageData(imageData: ImageData): PixelImage {
    const tempPixels: Pixel[][] = []

    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
        const pixel = new Pixel(data[i], data[i + 1], data[i + 2], data[i + 3]);
        const row = Math.floor(i / 4 / imageData.width);
        if (!tempPixels[row]) {
            tempPixels[row] = [];
        }
        tempPixels[row].push(pixel);
    }

    return new PixelImage(tempPixels, tempPixels[0].length, tempPixels.length)
}

class PixelImage {
    pixels: Pixel[][]
    width: number
    height: number


    constructor(pixels: Pixel[][], width: number, height: number) {
        this.pixels = pixels
        this.width = width
        this.height = height
    }


    createImageData(): ImageData {
        const data = new Uint8ClampedArray(this.width * this.height * 4);

        let index = 0;
        for (const pixel of this.pixels.flat()) {
            data[index++] = pixel.red;
            data[index++] = pixel.green;
            data[index++] = pixel.blue;
            data[index++] = pixel.alpha;
        }

        const imageData = new ImageData(data, this.width, this.height);
        return imageData
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

function rotate(pixelImage: PixelImage, degrees: number = 3) {
    const pixels = pixelImage.pixels
    alert("not implemented yet, degrees: " + degrees)
}

const ModifyImage: React.FC = () => {
    const [image, setImage] = useState(bars);
    const imageRef = useRef<HTMLImageElement>(null);
    const [rotateAmount, setRotateAmount] = useState(45);

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

                const pixelImage = getPixelImageFromImageData(imageData)

                modifyFunction(pixelImage)


                ctx.putImageData(pixelImage.createImageData(), 0, 0);
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
            <input type='number' defaultValue={45} onChange={e => setRotateAmount(parseInt(e.target.value, 10) || 0)} />
            <button onClick={() => modifyImage((pixels: PixelImage) => rotate(pixels, rotateAmount))}>rotate</button>
        </div>
    );
};

export default ModifyImage;
