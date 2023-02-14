export class Pixel {
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

    copyFrom(): Pixel {
        return new Pixel(this.red, this.green, this.blue, this.alpha, this.disabled)
    }

    average(other: Pixel, bias: number = 0.5): Pixel {
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

export function rotate(pixelImage: PixelImage, degrees: number = 3) {
    const pixels = pixelImage.pixels
    alert("not implemented yet, degrees: " + degrees)
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
                    const nearestI = boundNumber(Math.round(i / scale), 0, pixels.length - 1)
                    const nearestJ = boundNumber(Math.round(j / scale), 0, pixels[0].length - 1)
                    const nearestPixel = pixels[nearestI][nearestJ]
                    newRow.push(nearestPixel.copyFrom())
                }
                newPixels.push(newRow)
            }
            break;
        case ScaleOptions.BILINEAR:
            for (var i = 0; i < newHeight; i++) {
                const newRow: Pixel[] = []
                for (var j = 0; j < newWidth; j++) {
                    // get float coordinates
                    const originalI = i / scale
                    const originalJ = j / scale

                    // round down
                    const intOriginalI = boundNumber(Math.floor(originalI), 0, pixelImage.getHeight() - 1)
                    const intOriginalJ = boundNumber(Math.floor(originalJ), 0, pixelImage.getWidth() - 1)

                    // round up
                    const intCompareI = boundNumber(Math.ceil(originalI), 0, pixelImage.getHeight() - 1)
                    const intCompareJ = boundNumber(Math.ceil(originalJ), 0, pixelImage.getWidth() - 1)

                    // figure out bias
                    const biasI = originalI - intOriginalI
                    const biasJ = originalJ - intOriginalJ

                    // get 4 nearest pixe;s
                    const topLeft = pixels[intOriginalI][intOriginalJ]
                    const topRight = pixels[intCompareI][intOriginalJ]
                    const bottomLeft = pixels[intOriginalI][intCompareJ]
                    const bottomRight = pixels[intCompareI][intCompareJ]

                    // average out 4 nearest pixels with bias below
                    // (w+x+y+z)/4=((w+x)/2+(y+z)/2)/2

                    // average out top and bottom horizontal pairs
                    const top = topLeft.average(topRight, biasI)
                    const bottom = bottomLeft.average(bottomRight, biasI)

                    // average out resulting pair
                    const averaged = top.average(bottom, biasJ)

                    newRow.push(averaged)
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