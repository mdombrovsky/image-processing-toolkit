import React, { useState, useRef } from "react";

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
}

export class PixelImage {
    pixels: Pixel[][]
    width: number
    height: number
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


export function crop(pixelImage: PixelImage, pixelsFromTop: number) {
    const newPixels = pixelImage.pixels.slice(pixelsFromTop);

    pixelImage.overwrite(newPixels,
        newPixels[0].length,
        newPixels.length);
}