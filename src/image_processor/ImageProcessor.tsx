import bars from '../images/bars_test_image.png'
import React, { useState, useRef, useEffect } from "react";
import { crop, flipHorizontally, flipVertically, gaussianBlur, invertPixels, Pixel, PixelImage, rotate, scaleImage, ScaleOptions } from './PixelOperations'


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
    const defaultImage = bars
    const [image, setImage] = useState(defaultImage);
    const imageRef = useRef<HTMLImageElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [rotateAmount, setRotateAmount] = useState(45);
    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(0);
    const [scale, setScale] = useState(1);

    const [scaleOption, setScaleOption] = useState(ScaleOptions.BICUBIC);


    useEffect(() => {
        const image_ = new Image();
        image_.src = image;
        image_.onload = () => {
            setWidth(image_.width);
            setHeight(image_.height);
        };
    }, [image]);

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
            <text>
                <br />
                Height: {height} <br />
                Width: {width} <br />
            </text>
            <button onClick={() => setImage(bars)}>Reset</button>
            <button onClick={() => modifyImage(invertPixels)}>Invert Pixels</button>
            <button onClick={() => modifyImage(flipHorizontally)}>Flip horizontally</button>
            <button onClick={() => modifyImage(flipVertically)}>Flip vertically</button>
            <input type='number' defaultValue={45} onChange={e => setRotateAmount(parseInt(e.target.value, 10) || 0)} />
            <button onClick={() => modifyImage((pixels: PixelImage) => rotate(pixels, rotateAmount))}>rotate</button>
            <div>
                <label htmlFor="topInput">Top:</label>
                <input type="number" id="topInput" name="top crop" min={0} defaultValue={0} onChange={e => setTop(Number(e.target.value))} />
            </div>
            <div>
                <label htmlFor="bottomInput">Bottom:</label>
                <input type="number" id="bottomInput" name="bottom crop" min={0} defaultValue={0} onChange={e => setBottom(Number(e.target.value))} />
            </div>
            <div>
                <label htmlFor="leftInput">Left:</label>
                <input type="number" id="leftInput" name="left crop" min={0} defaultValue={0} onChange={e => setLeft(Number(e.target.value))} />
            </div>
            <div>
                <label htmlFor="rightInput">Right:</label>
                <input type="number" id="rightInput" name="right crop" min={0} defaultValue={0} onChange={e => setRight(Number(e.target.value))} />
            </div>
            <button onClick={() => modifyImage((pixels: PixelImage) => crop(pixels, top, bottom, left, right))}>crop</button>
            <br />
            <div>
                <label htmlFor="scaleInput">Scale:</label>
                <input type="number" id="scaleInput" defaultValue={1} min={0.10} max={10} step={0.01} onChange={e => setScale(Number(e.target.value))} />
            </div>
            <div>
                <label>
                    <input
                        type="radio"
                        name="Bicubic"
                        checked={scaleOption === ScaleOptions.BICUBIC}
                        onChange={() => setScaleOption(ScaleOptions.BICUBIC)}
                    />
                    Bicubic interpolation
                </label>
                <label>
                    <input
                        type="radio"
                        name="Bilinear"
                        checked={scaleOption === ScaleOptions.BILINEAR}
                        onChange={() => setScaleOption(ScaleOptions.BILINEAR)}
                    />
                    Bilinear interpolation
                </label>
                <label>
                    <input
                        type="radio"
                        name="options"
                        checked={scaleOption === ScaleOptions.NEAREST}
                        onChange={() => setScaleOption(ScaleOptions.NEAREST)}
                    />
                    Nearest neighbour interpolation
                </label>
            </div>
            <button onClick={() => modifyImage((pixels: PixelImage) => scaleImage(pixels, scale, scaleOption))}>scale</button>
            <button onClick={() => modifyImage(gaussianBlur)}>Perform gaussian blur</button>

        </div >

    );
};

export default ModifyImage;
