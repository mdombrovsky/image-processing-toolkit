import bars from '../images/bars_test_image.png'
import React, { useState, useRef } from "react";
import { crop, flipHorizontally, flipVertically, invertPixels, Pixel, PixelImage, rotate } from './PixelOperations'


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

function getImageCanvasFromPixelImage(pixelImage: PixelImage): HTMLCanvasElement {
    const modifiedCanvas = document.createElement('canvas');
    modifiedCanvas.width = pixelImage.pixels[0].length;
    modifiedCanvas.height = pixelImage.pixels.length;
    const modifiedContext = modifiedCanvas.getContext('2d')!;
    const modifiedImageData = modifiedContext.createImageData(modifiedCanvas.width, modifiedCanvas.height);
    let index = 0;
    for (const pixel of pixelImage.pixels.flat()) {
        modifiedImageData.data[index++] = pixel.red;
        modifiedImageData.data[index++] = pixel.green;
        modifiedImageData.data[index++] = pixel.blue;
        modifiedImageData.data[index++] = pixel.alpha;
    }
    modifiedContext.putImageData(modifiedImageData, 0, 0);
    return modifiedCanvas
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

                setImage(getImageCanvasFromPixelImage(pixelImage).toDataURL());
            }
        }
    };

    return (
        <div>
            <img ref={imageRef} src={image} alt="Image" />
            <button onClick={() => setImage(bars)}>Reset</button>
            <button onClick={() => modifyImage(invertPixels)}>Invert Pixels</button>
            <button onClick={() => modifyImage(flipHorizontally)}>Flip horizontally</button>
            <button onClick={() => modifyImage(flipVertically)}>Flip vertically</button>
            <input type='number' defaultValue={45} onChange={e => setRotateAmount(parseInt(e.target.value, 10) || 0)} />
            <button onClick={() => modifyImage((pixels: PixelImage) => rotate(pixels, rotateAmount))}>rotate</button>
            <button onClick={() => modifyImage((pixels: PixelImage) => crop(pixels, 10))}>crop</button>

        </div >
    );
};

export default ModifyImage;
