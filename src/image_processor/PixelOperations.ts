export class Pixel {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    disabled: boolean;
    constructor(red: number, green: number, blue: number, alpha: number = 255, disabled: boolean = false) {
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
    overwrite(red: number, green: number, blue: number, alpha: number = 255, disabled: boolean = false) {
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

function createRotationMatrix(degrees: number): number[][] {
    const radians = degrees * (Math.PI / 180)
    return [
        [Math.cos(radians), -Math.sin(radians)],
        [Math.sin(radians), Math.cos(radians)],
    ];
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


export function rotate(pixelImage: PixelImage, degrees: number = 3) {
    const pixels = pixelImage.pixels
    const radians = (degrees) * (Math.PI / 180)
    const sin = Math.sin(radians)
    const cos = Math.cos(radians)
    const oldHeight = pixelImage.getHeight()
    const oldWidth = pixelImage.getWidth()
    const newHeight = Math.round(Math.abs(oldHeight * cos) + Math.abs(oldWidth * sin))
    const newWidth = Math.round(Math.abs(oldHeight * sin) + Math.abs(oldWidth * cos))

    const hDiff = Math.abs(newHeight - oldHeight)
    const wDiff = Math.abs(newWidth - oldWidth)

    console.log(wDiff, hDiff)/*0, 0*/

    const newPixels: Pixel[][] = []
    const inverseRoationMatrix = createInverseRotationTranslationMatrix(radians, wDiff / 2, hDiff / 2)

    for (var i = 0; i < newHeight; i++) {
        const newRow: Pixel[] = []
        for (var j = 0; j < newWidth; j++) {
            const res = multiplyMatrices(inverseRoationMatrix, [[i], [j], [1]])
            const [[oldI], [oldJ], [_]] = res
            if (oldI < 0 || oldJ < 0 || oldI >= pixelImage.getHeight() || oldJ >= pixelImage.getWidth()) {
                newRow.push(new Pixel(155, 0, 0))

            } else {
                const newPixel = doNearestNeighbourInterpolation(pixelImage, oldI, oldJ)
                newRow.push(newPixel)
            }
        }
        newPixels.push(newRow)
    }
    pixelImage.overwrite(newPixels, newPixels[0].length, newPixels.length)
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
    BICUBIC: 0,
    BILINEAR: 1,
    NEAREST: 2,
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

export function scaleImage(pixelImage: PixelImage, scale: number, type: number) {
    const pixels = pixelImage.pixels

    const newWidth = pixelImage.getWidth() * scale
    const newHeight = pixelImage.getHeight() * scale

    console.log(type)
    const newPixels: Pixel[][] = []
    switch (type) {
        case ScaleOptions.NEAREST:
            for (var i = 0; i < newHeight; i++) {
                const newRow: Pixel[] = []
                for (var j = 0; j < newWidth; j++) {
                    newRow.push(doNearestNeighbourInterpolation(pixelImage, i / scale, j / scale))
                }
                newPixels.push(newRow)
            }
            break;
        case ScaleOptions.BILINEAR:
            for (var i = 0; i < newHeight; i++) {
                const newRow: Pixel[] = []
                for (var j = 0; j < newWidth; j++) {
                    newRow.push(doBilinearInterpolation(pixelImage, i / scale, j / scale))
                }
                newPixels.push(newRow)
            }
            break;
        default:
            alert("not implemented yet")
            return

    }
    pixelImage.overwrite(newPixels, newPixels[0].length, newPixels.length)
}

export function gaussianBlur(pixelImage: PixelImage) {
    const kernel = [
        [1 / 16, 1 / 8, 1 / 16],
        [1 / 8, 1 / 4, 1 / 8],
        [1 / 16, 1 / 8, 1 / 16],
    ];

    performConvolution(pixelImage.pixels, kernel)
}

function performConvolution(pixels: Pixel[][], kernel: number[][]) {
    const flippedKernel = getFlippedKernel(kernel)
    const height = pixels.length
    const width = pixels[0].length
    const kHeight = flippedKernel.length
    const kWidth = flippedKernel[0].length
    const kIAdjustment = Math.floor(kHeight / 2)
    const kJAdjustment = Math.floor(kWidth / 2)

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let r = 0, g = 0, b = 0
            for (let kI = 0; kI < kHeight; kI++) {
                for (let kJ = 0; kJ < kWidth; kJ++) {
                    // transformed indecies
                    const tI = i + kI - kIAdjustment
                    const tJ = j + kJ - kJAdjustment
                    const pixel = (tI >= 0 && tJ >= 0 && tI < height && tJ < width) ? pixels[tI][tJ] : pixels[i][j]
                    const kernelValue = flippedKernel[kI][kJ]
                    r += pixel.red * kernelValue
                    g += pixel.green * kernelValue
                    b += pixel.blue * kernelValue
                }
            }
            pixels[i][j].overwrite(r, g, b)
            // not sure if i should wrap these values
            // pixels[i][j].overwrite(wrapOverflow(r, 255), wrapOverflow(g, 255), wrapOverflow(b, 255))
        }
    }

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

export function createHistogram(image: PixelImage): Histogram {
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
export function histogramEqualization(image: PixelImage) {
    const height = image.pixels.length
    const width = image.pixels[0].length
    const pixelValues = 256

    const histogram = createHistogram(image)

    // create normalized cumulative histogram transition function
    const numPixels = height * width
    const redTransition: number[] = new Array(pixelValues).fill(0)
    const greenTransition: number[] = new Array(pixelValues).fill(0)
    const blueTransition: number[] = new Array(pixelValues).fill(0)

    for (let i = 0; i < pixelValues; i++) {
        // add normalized values
        redTransition[i] += histogram.redHistogram[i] / numPixels
        greenTransition[i] += histogram.greenHistogram[i] / numPixels
        blueTransition[i] += histogram.blueHistogram[i] / numPixels

        // keep cumulative values
        if (i + 1 < pixelValues) {
            redTransition[i + 1] = redTransition[i]
            greenTransition[i + 1] = greenTransition[i]
            blueTransition[i + 1] = blueTransition[i]
        }

        // now that values are normalized cumulative we can convert them to pixels
        redTransition[i] = Math.round(redTransition[i] * pixelValues)
        greenTransition[i] = Math.round(greenTransition[i] * pixelValues)
        blueTransition[i] = Math.round(blueTransition[i] * pixelValues)
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