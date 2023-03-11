import bars from '../images/bars_test_image.png'
import React, { useState, useRef, useEffect, ReactElement } from "react";
import { createFrequencyHistogram as createFrequencyHistogram, createNormalizedCumulativeHistogram, crop, doLinearMapping, doPowerLawMapping, flipHorizontally, flipVertically, gaussianBlur, Histogram, histogramEqualization, invertPixels, Pixel, PixelImage, rotate, scaleImage, ScaleOptions } from './PixelOperations'
import Plot from 'react-plotly.js';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';

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
    const defaultAltImage = <div />
    const [loadedImage, setLoadedImage] = useState(defaultImage)
    const [image, setImage] = useState(loadedImage);
    const imageRef = useRef<HTMLImageElement>(null);
    const [altImage, setAltImage] = useState<ReactElement>(defaultAltImage);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [rotateAmount, setRotateAmount] = useState(45);
    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(0);
    const [scale, setScale] = useState(1);
    const [scaleOption, setScaleOption] = useState(ScaleOptions.BILINEAR);
    const [alpha, setAlpha] = useState(1);
    const [beta, setBeta] = useState(0);
    const [gamma, setGamma] = useState(1);
    const defaultKernel = [
        [1 / 16, 1 / 8, 1 / 16],
        [1 / 8, 1 / 4, 1 / 8],
        [1 / 16, 1 / 8, 1 / 16],
    ]
    const [kernl, setKernel] = useState<number[][]>(defaultKernel);


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

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const newImage = URL.createObjectURL(event.target.files[0]);
            setLoadedImage(newImage);
            setImage(newImage);

        }
    };


    function plotCumulativeNormalizedHistogram(image: PixelImage) {
        plotHistogram(createNormalizedCumulativeHistogram(image))
    }
    function plotFrequencyHistogram(image: PixelImage) {
        plotHistogram(createFrequencyHistogram(image), true)
    }

    function plotHistogram(histogram: Histogram, useLog = false) {
        const plot = <Plot
            data={[
                {
                    x: Array.from({ length: histogram.redHistogram.length }, (_, i) => i),
                    y: histogram.redHistogram,
                    type: 'bar',
                    name: 'Red Pixels Count',
                    marker: { color: 'red' },
                },
                {
                    x: Array.from({ length: histogram.greenHistogram.length }, (_, i) => i),
                    y: histogram.greenHistogram,
                    type: 'bar',
                    name: 'Green Pixels Count',
                    marker: { color: 'green' },
                },
                {
                    x: Array.from({ length: histogram.blueHistogram.length }, (_, i) => i),
                    y: histogram.blueHistogram,
                    type: 'bar',
                    name: 'Blue Pixels Count',
                    marker: { color: 'blue' },
                },
            ]}
            layout={{
                title: 'Histogram',
                xaxis: {
                    range: [0, 255],
                },
                yaxis: {
                    type: useLog ? 'log' : 'linear'
                }
            }}
            style={{ width: '70vw', height: '50vh', margin: "auto" }}
        />

        setAltImage(plot)
    }

    function createMatrixFromString(input: string): number[][] {
        const rows = input.trim().split("\n");

        // Check that all rows have the same number of elements
        const rowLength = rows[0].trim().split(" ").length;
        const isValidLength = rows.every(row => row.trim().split(" ").length === rowLength);
        if (!isValidLength) {
            return [];
        }

        const matrix = rows.map(row => {
            const elements = row.trim().split(" ");
            const rowValues = elements.map(Number);

            // Check that all elements in a row are valid numbers
            const isValidRow = rowValues.every(value => !isNaN(value));
            if (!isValidRow) {
                return [];
            }

            return rowValues;
        });

        // Check that all rows have the same number of elements
        const isValidMatrix = matrix.every(row => row.length === rowLength);
        if (!isValidMatrix) {
            return [];
        }

        return matrix;
    }

    function setMatrixFromString(input: string) {
        const matrix = createMatrixFromString(input);
        if (matrix.length > 0 && matrix[0].length > 0) {
            setKernel(matrix);
            console.log("setd")
        }
    }

    function matrixToString(matrix: number[][]): string {
        return matrix.map(row => row.join(" ")).join("\n");
    }

    return (
        <Container>
            <Row>
                <Col>
                    <img ref={imageRef} src={image} alt="Image" />
                </Col>
            </Row>
            <Row>
                <Col>
                    <p>
                        Height: {height},
                        Width: {width}
                    </p>
                </Col>
                <Col>
                    <Form.Group controlId="formFile" >
                        <Form.Control type="file" accept="image/*" onChange={handleImageUpload} />
                    </Form.Group>
                </Col>
                <Col>
                    <Row>
                        <Col>
                            <Button variant="danger" onClick={() => {
                                setImage(loadedImage)
                                setAltImage(defaultAltImage)
                            }}>Reset</Button>
                        </Col>
                        <Col>
                            <Button variant="warning" onClick={() => setAltImage(defaultAltImage)}>Hide secondary display</Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row>
                {altImage}
            </Row>
            <Row className="align-items-center">
                <Col>
                    <Form.Group>
                        <Row className="align-items-center">
                            <Col className="mx-1">
                                <Row>
                                    <Form.Label htmlFor="topInput">Top:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        id="topInput"
                                        name="top crop"
                                        min={0}
                                        defaultValue={0}
                                        onChange={(e) => setTop(Number(e.target.value))}
                                    />
                                </Row>
                                <Row>
                                    <Form.Label htmlFor="bottomInput">Bottom:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        id="bottomInput"
                                        name="bottom crop"
                                        min={0}
                                        defaultValue={0}
                                        onChange={(e) => setBottom(Number(e.target.value))}
                                    />
                                </Row>
                            </Col>
                            <Col className="">
                                <Row>
                                    <Form.Label htmlFor="leftInput">Left:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        id="leftInput"
                                        name="left crop"
                                        min={0}
                                        defaultValue={0}
                                        onChange={(e) => setLeft(Number(e.target.value))}
                                    />
                                </Row>
                                <Row>
                                    <Form.Label htmlFor="rightInput">Right:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        id="rightInput"
                                        name="right crop"
                                        min={0}
                                        defaultValue={0}
                                        onChange={(e) => setRight(Number(e.target.value))}
                                    />
                                </Row>
                            </Col>
                            <Col>
                                <Button variant="secondary" onClick={() => modifyImage((pixels: PixelImage) => crop(pixels, top, bottom, left, right))}>
                                    crop
                                </Button>
                            </Col>
                        </Row>
                    </Form.Group>

                </Col>
                <Col>
                    <Row className="align-items-center">
                        <Form.Group>
                            <Row className="align-items-center">
                                <Col>
                                    <Form.Label>Rotate amount:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        defaultValue={45}
                                        onChange={e => setRotateAmount(parseInt(e.target.value, 10) || 0)}
                                    />
                                </Col>
                                <Col>
                                    <Button variant="secondary" onClick={() => modifyImage((pixels: PixelImage) => rotate(pixels, rotateAmount))}>rotate</Button>
                                </Col>
                            </Row>
                        </Form.Group>
                    </Row>
                    <Row className="align-items-center">
                        <Form.Group>
                            <Row className="align-items-center">
                                <Col>
                                    <Form.Label>Scale:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        defaultValue={1} min={0.10} max={10} step={0.01} onChange={e => setScale(Number(e.target.value))}
                                    />
                                </Col>
                                <Col>
                                    <Button variant="secondary" onClick={() => modifyImage((pixels: PixelImage) => scaleImage(pixels, scale, scaleOption))}>scale</Button>

                                </Col>
                            </Row>
                        </Form.Group>
                    </Row>
                </Col>
                <Col className="aligh-items-center">
                    <Form.Group>
                        <Form.Check
                            type="radio"
                            name="scaleOption"
                            id="bicubic"
                            label="Bicubic interpolation"
                            checked={scaleOption === ScaleOptions.BICUBIC}
                            onChange={() => setScaleOption(ScaleOptions.BICUBIC)}
                        />
                        <Form.Check
                            type="radio"
                            name="scaleOption"
                            id="bilinear"
                            label="Bilinear interpolation"
                            checked={scaleOption === ScaleOptions.BILINEAR}
                            onChange={() => setScaleOption(ScaleOptions.BILINEAR)}
                        />
                        <Form.Check
                            type="radio"
                            name="scaleOption"
                            id="nearest"
                            label="Nearest neighbour interpolation"
                            checked={scaleOption === ScaleOptions.NEAREST}
                            onChange={() => setScaleOption(ScaleOptions.NEAREST)}
                        />
                    </Form.Group>
                </Col>
            </Row >
            <Row>
                <Col>
                    <Button variant="secondary" onClick={() => modifyImage(invertPixels)}>Invert Pixels</Button>
                </Col>
                <Col>
                    <Button variant="secondary" onClick={() => modifyImage(flipHorizontally)}>Flip horizontally</Button>
                </Col>

                <Col>
                    <Button variant="secondary" onClick={() => modifyImage(flipVertically)}>Flip vertically</Button>

                </Col>
            </Row>

            <Row>
                <Form.Group>
                    <Row className="align-items-center">
                        <Col>
                            <Form.Label>Alpha (α):</Form.Label>
                            <Form.Control
                                type="number"
                                defaultValue={alpha}
                                step={0.1}
                                onChange={(e) => setAlpha(Number(e.target.value))}
                            />
                        </Col>
                        <Col>
                            <Form.Label>Beta (β):</Form.Label>
                            <Form.Control
                                type="number"
                                defaultValue={beta}
                                onChange={(e) => setBeta(Number(e.target.value))}
                            />
                        </Col>
                        <Col>
                            <Form.Label>Gamma (γ):</Form.Label>
                            <Form.Control
                                type="number"
                                defaultValue={gamma}
                                step={0.1}
                                onChange={(e) => setGamma(Number(e.target.value))}
                            />
                        </Col>
                        <Col>
                            <Row className="mb-1">
                                <Button variant="secondary" onClick={() => modifyImage((image: PixelImage) => doLinearMapping(image, alpha, beta))}>
                                    Linear mapping <br />m(u)=αu+β
                                </Button>
                            </Row>
                            <Row className="">
                                <Button variant="secondary" onClick={() => modifyImage((image: PixelImage) => doPowerLawMapping(image, gamma))}>
                                    Power law mapping <br /> m(u)=(L-)[u/(L-1)]^γ
                                </Button>
                            </Row>

                        </Col>
                    </Row>
                </Form.Group>

            </Row >
            <Row>
                <Col>
                    <Form>
                        <Form.Group>
                            <Form.Label>Convolution Kernel</Form.Label>
                            <Form.Control as="textarea" rows={3} defaultValue={matrixToString(defaultKernel)} onChange={(e) => { setMatrixFromString(e.target.value) }} />
                        </Form.Group>
                    </Form>
                </Col>
                <Col>
                    <Button variant="secondary" onClick={() => modifyImage(gaussianBlur)}>Perform gaussian blur</Button>
                </Col>
                <Col>
                    <Button variant="secondary" onClick={() => modifyImage(histogramEqualization)}>Perform histogram equalization</Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Button variant="info" onClick={() => modifyImage(plotFrequencyHistogram)}>Compute frequency histogram</Button>
                </Col>
                <Col>
                    <Button variant="info" onClick={() => modifyImage(plotCumulativeNormalizedHistogram)}>Compute cumulative normalized histogram</Button>
                </Col>
            </Row>
        </Container >
    );
};

export default ModifyImage;
