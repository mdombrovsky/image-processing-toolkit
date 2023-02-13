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

export const ScaleOptions = {
    BICUBIC: 0,
    BILINEAR: 1,
    NEAREST: 2,
}

export function scaleImage(pixelImage: PixelImage, scale: number, type: number) {
    const pixels = pixelImage.pixels

    const newWidth = pixelImage.getWidth() * scale
    const newHeight = pixelImage.getHeight() * scale

    const newPixels: Pixel[][] = []
    switch (type) {
        case ScaleOptions.NEAREST:
            for (var i = 0; i < newHeight; i++) {
                const newRow: Pixel[] = []
                for (var j = 0; j < newWidth; j++) {
                    const nearestI = Math.max(Math.min(Math.round(i / scale), pixels.length - 1), 0)
                    const nearestJ = Math.max(Math.min(Math.round(j / scale), pixels[0].length - 1), 0)
                    const nearestPixel = pixels[nearestI][nearestJ]
                    newRow.push(nearestPixel.copyFrom())
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