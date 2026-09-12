package com.photocopy.scanmaster;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;

public class ImageFilterEngine {

    public enum FilterType {
        PHOTOCOPY_BW,
        MAGIC_ENHANCE,
        GRAYSCALE,
        ORIGINAL
    }

    /**
     * Process bitmap using native Android Canvas, ColorMatrix, and pixel transformation
     */
    public static Bitmap processImage(Bitmap source, FilterType type, int threshold) {
        if (source == null) return null;

        int width = source.getWidth();
        int height = source.getHeight();

        // Downscale large camera photos if needed to prevent memory OOM during native pixel manipulation
        int maxDim = 1800;
        Bitmap workingBitmap = source;
        if (width > maxDim || height > maxDim) {
            float ratio = Math.min((float) maxDim / width, (float) maxDim / height);
            int newW = Math.round(width * ratio);
            int newH = Math.round(height * ratio);
            workingBitmap = Bitmap.createScaledBitmap(source, newW, newH, true);
            width = newW;
            height = newH;
        }

        switch (type) {
            case PHOTOCOPY_BW:
                return applyHighContrastPhotocopy(workingBitmap, threshold);
            case MAGIC_ENHANCE:
                return applyMagicEnhance(workingBitmap);
            case GRAYSCALE:
                return applyGrayscale(workingBitmap);
            case ORIGINAL:
            default:
                return workingBitmap;
        }
    }

    /**
     * High Contrast B&W Photocopy filter tailored for ID cards, national cards, and documents
     */
    private static Bitmap applyHighContrastPhotocopy(Bitmap src, int threshold) {
        int width = src.getWidth();
        int height = src.getHeight();
        int[] pixels = new int[width * height];
        src.getPixels(pixels, 0, width, 0, 0, width, height);

        for (int i = 0; i < pixels.length; i++) {
            int pixel = pixels[i];
            int r = (pixel >> 16) & 0xFF;
            int g = (pixel >> 8) & 0xFF;
            int b = pixel & 0xFF;

            // Accurate luminance calculation (ITU-R BT.601)
            int lum = (int) (0.299 * r + 0.587 * g + 0.114 * b);

            // Dynamic binarization threshold
            int binary = (lum > threshold) ? 0xFFFFFFFF : 0xFF000000;
            pixels[i] = binary;
        }

        Bitmap output = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        output.setPixels(pixels, 0, width, 0, 0, width, height);
        return output;
    }

    /**
     * Grayscale document filter
     */
    private static Bitmap applyGrayscale(Bitmap src) {
        Bitmap output = Bitmap.createBitmap(src.getWidth(), src.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(output);
        Paint paint = new Paint();
        ColorMatrix colorMatrix = new ColorMatrix();
        colorMatrix.setSaturation(0);
        paint.setColorFilter(new ColorMatrixColorFilter(colorMatrix));
        canvas.drawBitmap(src, 0, 0, paint);
        return output;
    }

    /**
     * Magic Document Enhancer: boost contrast & remove dark shadows while preserving colors
     */
    private static Bitmap applyMagicEnhance(Bitmap src) {
        Bitmap output = Bitmap.createBitmap(src.getWidth(), src.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(output);
        Paint paint = new Paint();

        // Increase contrast by 1.35 and brightness by 20
        float contrast = 1.35f;
        float brightness = 20f;
        ColorMatrix cm = new ColorMatrix(new float[] {
                contrast, 0, 0, 0, brightness,
                0, contrast, 0, 0, brightness,
                0, 0, contrast, 0, brightness,
                0, 0, 0, 1, 0
        });

        paint.setColorFilter(new ColorMatrixColorFilter(cm));
        canvas.drawBitmap(src, 0, 0, paint);
        return output;
    }
}
