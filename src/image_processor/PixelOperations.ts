export class Pixel {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    disabled: boolean;
    constructor(red: number, green: number, blue: number, alpha: number = 255, disabled: boolean = false) {
        if (red > 255 || green > 255 || blue > 255 || red < 0 || green < 0 || blue < 0 || alpha > 255 || alpha < 0) {
            alert("out of range: (" + red + ", " + green + ", " + blue + ", " + alpha + ")")
        }
        this.red = red
        this.green = green
        this.blue = blue
        this.alpha = alpha
        this.disabled = false
    }

    copyFrom(): Pixel {
        return new Pixel(this.red, this.green, this.blue, this.alpha, this.disabled)
    }

    createAveragedPixel(other: Pixel, bias: number = 0.5): Pixel {
        if (bias < 0 || bias > 1) {
            alert("fatal bias error, bias = " + bias + "!")
            throw new Error("fatal bias error")
        }
        if (this.disabled && !other.disabled) {
            return other.copyFrom()
        } else if (!this.disabled && other.disabled) {
            return this.copyFrom()
        } else {
            return new Pixel(
                Math.floor((this.red * bias + other.red * (1 - bias))),
                Math.floor((this.green * bias + other.green * (1 - bias))),
                Math.floor((this.blue * bias + other.blue * (1 - bias))),
                Math.floor((this.alpha * bias + other.alpha * (1 - bias)))
            )
        }
    }
    overwrite(red: number, green: number, blue: number, alpha: number = this.alpha, disabled: boolean = false) {
        if (red > 255 || green > 255 || blue > 255 || red < 0 || green < 0 || blue < 0 || alpha > 255 || alpha < 0) {
            alert("out of range: (" + red + ", " + green + ", " + blue + ", " + alpha + ")")
        }
        this.red = red
        this.green = green
        this.blue = blue
        this.alpha = alpha
        this.disabled = false
    }
}

function wrapOverflow(input: number, max: number) {
    return (input % (max + 1) + (max + 1)) % (max + 1)
}


export class PixelImage {
    pixels: Pixel[][]
    private width: number
    private height: number
    angle: number = 0


    constructor(pixels: Pixel[][], width: number, height: number) {
        this.pixels = pixels
        this.width = width
        this.height = height
    }

    overwrite(pixels: Pixel[][], width: number, height: number) {
        this.pixels = pixels
        this.width = width
        this.height = height
    }

    getWidth(): number {
        return this.pixels[0].length
    }
    getHeight(): number {
        return this.pixels.length
    }
}

export function invertPixels(pixelImage: PixelImage): PixelImage {
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

export function flipHorizontally(pixelImage: PixelImage) {
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

export function flipVertically(pixelImage: PixelImage) {
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

function createInverseRotationTranslationMatrix(radians: number, xTranslation: number, yTransaltion: number): number[][] {
    return [
        [Math.cos(radians), Math.sin(radians), xTranslation],
        [-Math.sin(radians), Math.cos(radians), yTransaltion],
        [0, 0, 1]
    ];
}


function multiplyMatrices(a: number[][], b: number[][]): number[][] {
    const numRowsA = a.length;
    const numColsA = a[0].length;
    const numRowsB = b.length;
    const numColsB = b[0].length;

    if (numColsA !== numRowsB) {
        throw new Error(`Cannot multiply A cols (${numColsA}) not equal to B rows (${numRowsB})`);
    }

    const result: number[][] = [];
    for (var i = 0; i < numRowsA; i++) {
        const row: number[] = []
        for (var j = 0; j < numColsB; j++) {
            var sum = 0
            for (var k = 0; k < numColsA; k++) {
                sum += a[i][k] * b[k][j]
            }
            row.push(sum)
        }
        result.push(row)
    }

    return result
}

/**
 * Does inverse matrix operation on pixelImage such as calculating roation
 * 
 * @param pixelImage 
 * @param matrix This is the inverse matrix, please add xTranslation and yTranslation as oldHeight/2-0.5 and oldWidth/2-0.5 respectively
 * @param interpolation This is the interpolation function to use
 * @param newHeight 
 * @param newWidth 
 * @param defaultPixel This is when the pixel is out of bounds
 */
function doInverseMatrixOperation(pixelImage: PixelImage, inverseMatrix: number[][], interpolation: (image: PixelImage, i: number, j: number) => Pixel, newHeight: number, newWidth: number, defaultPixel: Pixel) {
    const newPixels: Pixel[][] = []

    const iIteration = newHeight / 2.0 - 0.5;
    const jIteration = newWidth / 2.0 - 0.5;

    // Re-create image treating 0,0 as new center
    for (var i = -iIteration; i <= iIteration; i++) {
        const newRow: Pixel[] = []
        for (var j = -jIteration; j <= jIteration; j++) {
            const [[oldI], [oldJ]] = multiplyMatrices(inverseMatrix, [[i], [j], [1]])

            // Make sure pixel is in bounds
            if (oldI < 0 || oldJ < 0 || oldI >= pixelImage.getHeight() || oldJ >= pixelImage.getWidth()) {
                newRow.push(defaultPixel)
            } else {
                const newPixel = interpolation(pixelImage, oldI, oldJ)
                newRow.push(newPixel)
            }
        }
        newPixels.push(newRow)
    }
    pixelImage.overwrite(newPixels, newPixels[0].length, newPixels.length)
}

function getInterpolationFunction(scalingType: number): (image: PixelImage, i: number, j: number) => Pixel {
    switch (scalingType) {
        case ScaleOptions.BILINEAR:
            return doBilinearInterpolation
        case ScaleOptions.NEAREST:
            return doNearestNeighbourInterpolation
        default:
            throw new Error(`Invalid scaling type: ${scalingType}`)
    }
}

export function rotate(pixelImage: PixelImage, degrees: number = 3, scalingType: number, r: number, g: number, b: number, a: number = 255) {
    const radians = (degrees) * (Math.PI / 180)
    const sin = Math.sin(radians)
    const cos = Math.cos(radians)
    const oldHeight = pixelImage.getHeight()
    const oldWidth = pixelImage.getWidth()
    const newHeight = Math.round(Math.abs(oldHeight * cos) + Math.abs(oldWidth * sin))
    const newWidth = Math.round(Math.abs(oldHeight * sin) + Math.abs(oldWidth * cos))

    // Shift up and left so that center is at 0,0
    // The -0.5 is there because each pixel is positioned at the center of the pixel (draw grid if still confused)
    const inverseRoationMatrix = createInverseRotationTranslationMatrix(radians, oldHeight / 2.0 - 0.5, oldWidth / 2.0 - 0.5)

    doInverseMatrixOperation(pixelImage, inverseRoationMatrix, getInterpolationFunction(scalingType), newHeight, newWidth, new Pixel(r, g, b, a))
}



export function shear(pixelImage: PixelImage, alpha: number, beta: number, scalingType: number, r: number, g: number, b: number, a: number = 255) {
    const oldHeight = pixelImage.getHeight()
    const oldWidth = pixelImage.getWidth()

    const newHeight = Math.round(oldHeight + Math.abs(oldWidth * beta))
    const newWidth = Math.round(oldWidth + Math.abs(newHeight * alpha))

    // Shift up and left so that center is at 0,0
    // The -0.5 is there because each pixel is positioned at the center of the pixel (draw grid if still confused)
    const inverseShearMatrix = createInverseShearMatrix(alpha, beta, oldHeight / 2.0 - 0.5, oldWidth / 2.0 - 0.5)

    doInverseMatrixOperation(pixelImage, inverseShearMatrix, getInterpolationFunction(scalingType), newHeight, newWidth, new Pixel(r, g, b, a))
}


function createInverseShearMatrix(alpha: number, beta: number, xTranslation: number, yTransaltion: number): number[][] {
    return [
        [1 + beta * alpha, beta, xTranslation],
        [alpha, 1, yTransaltion],
        [0, 0, 1]
    ];
}


function highlight(pixelImage: PixelImage) {
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            const pixel = pixelImage.pixels[i][j]
            pixel.blue = 0
            pixel.green = 255
            pixel.red = 0
        }
    }
    return
}

export function crop(pixelImage: PixelImage, pixelsFromTop: number, pixelsFromBottom: number, pixelsFromLeft: number, pixelsFromRight: number) {
    pixelsFromTop = Math.max(0, pixelsFromTop)
    pixelsFromBottom = Math.max(0, pixelsFromBottom)
    pixelsFromLeft = Math.max(0, pixelsFromLeft)
    pixelsFromRight = Math.max(0, pixelsFromRight)

    pixelImage.pixels.splice(0, pixelsFromTop)
    pixelImage.pixels.splice(pixelImage.pixels.length - pixelsFromBottom, pixelsFromBottom)
    for (let i = 0; i < pixelImage.pixels.length; i++) {
        pixelImage.pixels[i].splice(0, pixelsFromLeft);
        pixelImage.pixels[i].splice(pixelImage.pixels[i].length - pixelsFromRight, pixelsFromRight)
    }
}

function createBlankImage(width: number, height: number): PixelImage {
    const newPixels: Pixel[][] = []
    for (var i = 0; i < height; i++) {
        const newRow: Pixel[] = []
        for (var j = 0; j < width; j++) {
            newRow.push(new Pixel(0, 0, 0, 0))
        }
        newPixels.push(newRow)
    }
    return new PixelImage(newPixels, newPixels[0].length, newPixels.length)
}


function boundNumber(input: number, min: number, max: number): number {
    return Math.max(Math.min(input, max), min)
}

export const ScaleOptions = {
    BILINEAR: 0,
    NEAREST: 1,
}

export const IndexingOptions = {
    REFLECTIVE: 0,
    CIRCULAR: 1,
    ZERO: 2,
}

export const BoundingOptions = {
    CUT_OFF: 0,
    NORMALIZE: 1,
}

export const NeighbourhoodOptions = {
    CITY_BLOCK: 0,
    CHESS_BOARD: 1,
}

export const FilteringOptions = {
    MIN: 0,
    MEDIAN: 1,
    MAX: 2,
}

function doBilinearInterpolation(pixelImage: PixelImage, i: number, j: number): Pixel {
    // get float coordinates
    const originalI = boundNumber(i, 0, pixelImage.getHeight() - 1)
    const originalJ = boundNumber(j, 0, pixelImage.getWidth() - 1)

    // round down
    const floorI = Math.floor(originalI)
    const floorJ = Math.floor(originalJ)

    // round up
    const ceilI = Math.ceil(originalI)
    const ceilJ = Math.ceil(originalJ)

    // figure out bias
    const biasI = ceilI - originalI
    const biasJ = ceilJ - originalJ

    // get 4 nearest pixe;s
    const topLeft = pixelImage.pixels[floorI][floorJ]
    const topRight = pixelImage.pixels[ceilI][floorJ]
    const bottomLeft = pixelImage.pixels[floorI][ceilJ]
    const bottomRight = pixelImage.pixels[ceilI][ceilJ]

    // average out 4 nearest pixels with bias below
    // (w+x+y+z)/4=((w+x)/2+(y+z)/2)/2

    // average out top and bottom horizontal pairs
    const top = topLeft.createAveragedPixel(topRight, biasI)
    const bottom = bottomLeft.createAveragedPixel(bottomRight, biasI)

    // average out resulting pair
    const averaged = top.createAveragedPixel(bottom, biasJ)

    return averaged
}

function doNearestNeighbourInterpolation(pixelImage: PixelImage, i: number, j: number): Pixel {
    return pixelImage.pixels[boundNumber(Math.round(i), 0, pixelImage.pixels.length - 1)][boundNumber(Math.round(j), 0, pixelImage.pixels[0].length - 1)].copyFrom()
}

export function doIndexing(pixelImage: PixelImage, scale: number, type: number) {
    if (scale < 1) {
        return
    }
    let doIndexing: (pixels: Pixel[][], i: number, j: number) => Pixel;
    switch (type) {
        case IndexingOptions.REFLECTIVE:
            doIndexing = doReflectiveIndexing;
            break;
        case IndexingOptions.ZERO:
            doIndexing = doZeroIndexing;
            break;
        case IndexingOptions.CIRCULAR:
            doIndexing = doCircularIndexing
            break;
        default:
            alert("Unsupported indexing type")
            throw new Error("Unknown indexing type");
    }

    const height = pixelImage.getHeight()
    const width = pixelImage.getWidth()
    const newHeight = height * scale
    const newWidth = width * scale
    const hDiff = Math.abs(Math.round((newHeight - height) / 2.0))
    const wDiff = Math.abs(Math.round((newWidth - width) / 2.0))


    const newPixels: Pixel[][] = []
    for (let i = -hDiff; i < height + hDiff; i++) {
        const newRow: Pixel[] = []
        for (let j = -wDiff; j < width + wDiff; j++) {
            newRow.push(doIndexing(pixelImage.pixels, i, j))
        }
        newPixels.push(newRow)
    }

    pixelImage.overwrite(newPixels, newPixels[0].length, newPixels.length)
}

export function scaleImage(pixelImage: PixelImage, scale: number, type: number) {
    const pixels = pixelImage.pixels

    const newWidth = pixelImage.getWidth() * scale
    const newHeight = pixelImage.getHeight() * scale

    let interpolation: (image: PixelImage, i: number, j: number) => Pixel = getInterpolationFunction(type);

    const newPixels: Pixel[][] = []
    for (var i = 0; i < newHeight; i++) {
        const newRow: Pixel[] = []
        for (var j = 0; j < newWidth; j++) {
            newRow.push(interpolation(pixelImage, i / scale, j / scale))
        }
        newPixels.push(newRow)
    }

    pixelImage.overwrite(newPixels, newPixels[0].length, newPixels.length)
}

export function gaussianBlur(pixelImage: PixelImage) {
    const kernel = [
        [1 / 16, 1 / 8, 1 / 16],
        [1 / 8, 1 / 4, 1 / 8],
        [1 / 16, 1 / 8, 1 / 16],
    ];

    performConvolution(pixelImage, kernel, IndexingOptions.REFLECTIVE)
}

function doZeroIndexing(pixels: Pixel[][], i: number, j: number): Pixel {
    return (i >= 0 && j >= 0 && i < pixels.length && j < pixels[0].length) ? pixels[i][j] : new Pixel(0, 0, 0)
}

function doReflectiveIndexing(pixels: Pixel[][], i: number, j: number): Pixel {
    const length = pixels.length
    const width = pixels[0].length
    const reflectedI = ((i % (length * 2)) + (length * 2)) % (length * 2)
    const reflectedJ = ((j % (width * 2)) + (width * 2)) % (width * 2)

    return pixels[reflectedI >= length ? (length * 2 - 1) - reflectedI : reflectedI][reflectedJ >= width ? (width * 2 - 1) - reflectedJ : reflectedJ];
}

function doCircularIndexing(pixels: Pixel[][], i: number, j: number): Pixel {
    const height = pixels.length
    const width = pixels[0].length
    const circularI = i < 0 ? height - 1 - ((-i - 1) % height) : i % height
    const circularJ = j < 0 ? width - 1 - ((-j - 1) % width) : j % width

    return pixels[circularI][circularJ]
}

export function makeRed(pixelImage: PixelImage) {
    const newWidth = 3;
    const newHeight = 3;
    const newPixels: Pixel[][] = []
    for (var i = 0; i < newHeight; i++) {
        const newRow: Pixel[] = []
        for (var j = 0; j < newWidth; j++) {
            newRow.push(new Pixel(255, 0, 0))
        }
        newPixels.push(newRow)
    }

    pixelImage.overwrite(newPixels, newPixels[0].length, newPixels.length)
}

export function performConvolution(pixelImage: PixelImage, kernel: number[][], indexingType: number, boundingType: number = BoundingOptions.CUT_OFF) {
    const pixels = pixelImage.pixels;
    const flippedKernel = getFlippedKernel(kernel)
    const height = pixels.length
    const width = pixels[0].length
    const kHeight = flippedKernel.length
    const kWidth = flippedKernel[0].length
    const kIAdjustment = Math.floor(kHeight / 2)
    const kJAdjustment = Math.floor(kWidth / 2)
    const pixelCount = width * height

    let doIndexing: (pixels: Pixel[][], i: number, j: number) => Pixel;
    switch (indexingType) {
        case IndexingOptions.REFLECTIVE:
            doIndexing = doReflectiveIndexing;
            break;
        case IndexingOptions.ZERO:
            doIndexing = doZeroIndexing;
            break;
        case IndexingOptions.CIRCULAR:
            doIndexing = doCircularIndexing
            break;
        default:
            alert("Unsupported indexing type")
            throw new Error("Unknown indexing type");
    }

    const rVals: number[] = new Array(pixelCount)
    const gVals: number[] = new Array(pixelCount)
    const bVals: number[] = new Array(pixelCount)
    let rMin = Infinity
    let rMax = -Infinity
    let gMin = Infinity
    let gMax = -Infinity
    let bMin = Infinity
    let bMax = -Infinity
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let r = 0, g = 0, b = 0
            for (let kI = 0; kI < kHeight; kI++) {
                for (let kJ = 0; kJ < kWidth; kJ++) {
                    // transformed indicies
                    const tI = i + kI - kIAdjustment
                    const tJ = j + kJ - kJAdjustment
                    const pixel = doIndexing(pixels, tI, tJ)
                    const kernelValue = flippedKernel[kI][kJ]
                    r += pixel.red * kernelValue
                    g += pixel.green * kernelValue
                    b += pixel.blue * kernelValue
                }
            }
            rMin = Math.min(rMin, r)
            rMax = Math.max(rMax, r)
            gMin = Math.min(gMin, g)
            gMax = Math.max(gMax, g)
            bMin = Math.min(bMin, b)
            bMax = Math.max(bMax, b)
            rVals.push(r)
            gVals.push(g)
            bVals.push(b)
        }
    }


    for (let i = height - 1; i >= 0; i--) {
        for (let j = width - 1; j >= 0; j--) {
            const r: number = rVals.pop()!
            const g: number = gVals.pop()!
            const b: number = bVals.pop()!
            if (boundingType == BoundingOptions.CUT_OFF) {
                pixels[i][j].overwrite(boundNumber(r, 0, 255), boundNumber(g, 0, 255), boundNumber(b, 0, 255))
            } else {
                pixels[i][j].overwrite(normalizeToPixel(r, rMin, rMax), normalizeToPixel(g, gMin, gMax), normalizeToPixel(b, bMin, bMax))
            }
        }
    }
}

function normalizeToPixel(result: number, min_result: number, max_result: number): number {
    const range = max_result - min_result

    return range == 0 ? Math.round(255 / 2) : Math.round(((result - min_result) / (range)) * 255);
}


function getFlippedKernel(kernel: number[][]): number[][] {
    const height = kernel.length
    const width = kernel[0].length
    const newKernel: number[][] = []
    for (var i = 0; i < height; i++) {
        const row: number[] = []
        for (var j = 0; j < width; j++) {
            row.push(kernel[height - 1 - i][width - 1 - j])
        }
        newKernel.push(row)
    }
    return newKernel
}

export interface Histogram {
    redHistogram: number[]
    greenHistogram: number[]
    blueHistogram: number[]
}

export function createFrequencyHistogram(image: PixelImage): Histogram {
    const height = image.pixels.length
    const width = image.pixels[0].length
    const pixelValues = 256

    // create regular histogram
    const redHistogram: number[] = new Array(pixelValues).fill(0)
    const greenHistogram: number[] = new Array(pixelValues).fill(0)
    const blueHistogram: number[] = new Array(pixelValues).fill(0)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            redHistogram[image.pixels[i][j].red]++
            greenHistogram[image.pixels[i][j].green]++
            blueHistogram[image.pixels[i][j].blue]++
        }
    }

    return {
        redHistogram, blueHistogram, greenHistogram
    }

}

export function createNormalizedCumulativeHistogram(image: PixelImage): Histogram {
    const height = image.pixels.length
    const width = image.pixels[0].length
    const numPixels = height * width
    const histogram = createFrequencyHistogram(image)
    const pixelValues = 256

    // create normalized cumulative histogram 
    const redNCH: number[] = new Array(pixelValues).fill(0)
    const greenNCH: number[] = new Array(pixelValues).fill(0)
    const blueNCH: number[] = new Array(pixelValues).fill(0)

    for (let i = 0; i < pixelValues; i++) {
        // add normalized values
        redNCH[i] += histogram.redHistogram[i] / numPixels
        greenNCH[i] += histogram.greenHistogram[i] / numPixels
        blueNCH[i] += histogram.blueHistogram[i] / numPixels

        // keep cumulative values
        if (i + 1 < pixelValues) {
            redNCH[i + 1] = redNCH[i]
            greenNCH[i + 1] = greenNCH[i]
            blueNCH[i + 1] = blueNCH[i]
        }
    }

    return {
        redHistogram: redNCH, greenHistogram: greenNCH, blueHistogram: blueNCH
    }
}

export function histogramEqualization(image: PixelImage) {
    const height = image.pixels.length
    const width = image.pixels[0].length
    const pixelValueRange = 256

    // create normalized cumulative histogram 
    const cnh = createNormalizedCumulativeHistogram(image)

    // create transition functions
    const redTransition: number[] = new Array(pixelValueRange).fill(0)
    const greenTransition: number[] = new Array(pixelValueRange).fill(0)
    const blueTransition: number[] = new Array(pixelValueRange).fill(0)
    for (let i = 0; i < pixelValueRange; i++) {
        redTransition[i] = Math.round(cnh.redHistogram[i] * (pixelValueRange - 1))
        greenTransition[i] = Math.round(cnh.greenHistogram[i] * (pixelValueRange - 1))
        blueTransition[i] = Math.round(cnh.blueHistogram[i] * (pixelValueRange - 1))
    }


    // apply transition function to every pixel
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const pixel = image.pixels[i][j]
            pixel.overwrite(
                redTransition[pixel.red],
                greenTransition[pixel.green],
                blueTransition[pixel.blue]
            )
        }
    }


}

export function doLinearMapping(image: PixelImage, alpha: number, beta: number) {
    const maxPixelValue = 255
    doSinglePixelOperation(image, (pixelValue: number) => {
        return boundNumber(Math.round(alpha * pixelValue + beta), 0, maxPixelValue)
    })
}

export function doPowerLawMapping(image: PixelImage, gamma: number) {
    const maxPixelValue = 255
    doSinglePixelOperation(image, (pixelValue: number) => {
        return boundNumber(Math.round(maxPixelValue * ((pixelValue * 1.00 / maxPixelValue) ** gamma)), 0, maxPixelValue)
    })
}

function doSinglePixelOperation(image: PixelImage, operation: (pixelValue: number) => number) {
    const height = image.pixels.length
    const width = image.pixels[0].length
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const pixel = image.pixels[i][j]
            pixel.overwrite(
                operation(pixel.red),
                operation(pixel.green),
                operation(pixel.blue),
            )
        }
    }
}

function getCityBlockDistance(image: PixelImage, x: number, y: number, size: number): Pixel[] {
    const neighbourhood: Pixel[] = []

    for (let i = x - size; i <= x + size; i++) {
        if (i >= 0 && i < image.pixels.length) {
            neighbourhood.push(image.pixels[i][y])
        }
    }

    for (let j = y - size; j <= y + size; j++) {
        if (j >= 0 && j < image.pixels[0].length) {
            neighbourhood.push(image.pixels[x][j])
        }
    }

    return neighbourhood
}

function getChessBoardDistance(image: PixelImage, x: number, y: number, size: number): Pixel[] {
    const neighbourhood: Pixel[] = []

    for (let i = x - size; i <= x + size; i++) {
        for (let j = y - size; j <= y + size; j++) {
            if (i >= 0 && j >= 0 && i < image.pixels.length && j < image.pixels[0].length) {
                neighbourhood.push(image.pixels[i][j])
            }
        }
    }
    return neighbourhood
}

function getMinOfNeighbourhood(neighbourhood: Pixel[]): Pixel {
    let minRed = 255
    let minGreen = 255
    let minBlue = 255

    for (let i = 0; i < neighbourhood.length; i++) {
        const pixel = neighbourhood[i]
        minRed = Math.min(minRed, pixel.red)
        minGreen = Math.min(minGreen, pixel.green)
        minBlue = Math.min(minBlue, pixel.blue)
    }

    return new Pixel(minRed, minGreen, minBlue)
}

function getMaxOfNeighbourhood(neighbourhood: Pixel[]): Pixel {
    let maxRed = 0
    let maxGreen = 0
    let maxBlue = 0

    for (let i = 0; i < neighbourhood.length; i++) {
        const pixel = neighbourhood[i]
        maxRed = Math.max(maxRed, pixel.red)
        maxGreen = Math.max(maxGreen, pixel.green)
        maxBlue = Math.max(maxBlue, pixel.blue)
    }

    return new Pixel(maxRed, maxGreen, maxBlue)
}

function getMedian(values: number[]): number {
    values.sort((a, b) => a - b)
    if (values.length % 2 === 0) {
        return (values[values.length / 2] + values[values.length / 2 - 1]) / 2
    } else {
        return values[Math.floor(values.length / 2)]
    }
}

function getMedianOfNeighbourhood(neighbourhood: Pixel[]): Pixel {
    const redValues: number[] = []
    const greenValues: number[] = []
    const blueValues: number[] = []

    for (let i = 0; i < neighbourhood.length; i++) {
        const pixel = neighbourhood[i]
        redValues.push(pixel.red)
        greenValues.push(pixel.green)
        blueValues.push(pixel.blue)
    }

    const redMedian = getMedian(redValues)
    const greenMedian = getMedian(greenValues)
    const blueMedian = getMedian(blueValues)

    return new Pixel(redMedian, greenMedian, blueMedian)
}

export function doFiltering(image: PixelImage, filteringType: number, neigbourhoodType: number, neighbourHoodSize: number) {
    console.log(filteringType, neigbourhoodType, neighbourHoodSize)

    let doFiltering: (neighbourhood: Pixel[]) => Pixel

    let getNeighbourhood: (image: PixelImage, x: number, y: number, size: number) => Pixel[]

    switch (filteringType) {
        case FilteringOptions.MIN:
            doFiltering = getMinOfNeighbourhood
            break;
        case FilteringOptions.MEDIAN:
            doFiltering = getMedianOfNeighbourhood
            break;
        case FilteringOptions.MAX:
            doFiltering = getMaxOfNeighbourhood
            break;
        default:
            throw new Error("Invalid filtering type")
    }

    switch (neigbourhoodType) {
        case NeighbourhoodOptions.CITY_BLOCK:
            getNeighbourhood = getCityBlockDistance
            break;
        case NeighbourhoodOptions.CHESS_BOARD:
            getNeighbourhood = getChessBoardDistance
            break;
        default:
            throw new Error("Invalid neighbourhood type")
    }

    const height = image.pixels.length
    const width = image.pixels[0].length

    const pixels: Pixel[][] = []

    for (let i = 0; i < height; i++) {
        pixels[i] = []
        for (let j = 0; j < width; j++) {
            const neighbourhood = getNeighbourhood(image, i, j, neighbourHoodSize)
            const filteredPixel = doFiltering(neighbourhood)
            pixels[i][j] = filteredPixel
        }
    }
    image.overwrite(pixels, width, height)
}
function addNoise(image: PixelImage, noisePercentage: number, useSalt: boolean, usePepper: boolean) {
    const height = image.pixels.length
    const width = image.pixels[0].length

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const random = Math.random()

            if (random < noisePercentage) {
                // if first digit after decimal is even, use salt, otherwise use pepper
                if (useSalt && usePepper) {
                    if (Math.round(random * 10) % 2 === 0) {
                        image.pixels[i][j].overwrite(255, 255, 255)
                    } else {
                        image.pixels[i][j].overwrite(0, 0, 0)
                    }
                } else if (useSalt) {
                    image.pixels[i][j].overwrite(255, 255, 255)
                } else if (usePepper) {
                    image.pixels[i][j].overwrite(0, 0, 0)
                }

            }
        }
    }

}

export function addSaltAndPepperNoise(image: PixelImage) {
    addNoise(image, 0.01, true, true)
}

export function addSaltNoise(image: PixelImage) {
    addNoise(image, 0.01, true, false)
}

export function addPepperNoise(image: PixelImage) {
    addNoise(image, 0.01, false, true)
}

export function turnIntoGrayscale(image: PixelImage) {
    const height = image.pixels.length
    const width = image.pixels[0].length

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const pixel = image.pixels[i][j]
            const average = Math.round((pixel.red + pixel.green + pixel.blue) / 3)
            pixel.overwrite(average, average, average)
        }
    }
}