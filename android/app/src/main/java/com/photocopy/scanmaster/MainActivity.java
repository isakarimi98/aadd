package com.photocopy.scanmaster;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {

    private ImageView ivDocumentPreview;
    private LinearLayout layoutEmptyState;
    private ProgressBar progressBar;
    private SeekBar seekThreshold;
    private TextView tvThresholdValue;

    private Button btnFilterPhotocopy;
    private Button btnFilterMagic;
    private Button btnFilterGrayscale;
    private Button btnFilterOriginal;

    private Bitmap originalBitmap = null;
    private Bitmap processedBitmap = null;
    private ImageFilterEngine.FilterType currentFilter = ImageFilterEngine.FilterType.PHOTOCOPY_BW;
    private int currentThreshold = 130;

    private Uri cameraImageUri;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    // Native Activity Result Launchers
    private ActivityResultLauncher<Uri> takePictureLauncher;
    private ActivityResultLauncher<String> pickImageLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        setupLaunchers();
        setupListeners();
    }

    private void initViews() {
        ivDocumentPreview = findViewById(R.id.ivDocumentPreview);
        layoutEmptyState = findViewById(R.id.layoutEmptyState);
        progressBar = findViewById(R.id.progressBar);
        seekThreshold = findViewById(R.id.seekThreshold);
        tvThresholdValue = findViewById(R.id.tvThresholdValue);

        btnFilterPhotocopy = findViewById(R.id.btnFilterPhotocopy);
        btnFilterMagic = findViewById(R.id.btnFilterMagic);
        btnFilterGrayscale = findViewById(R.id.btnFilterGrayscale);
        btnFilterOriginal = findViewById(R.id.btnFilterOriginal);
    }

    private void setupLaunchers() {
        // Native Camera Capture
        takePictureLauncher = registerForActivityResult(
                new ActivityResultContracts.TakePicture(),
                success -> {
                    if (success && cameraImageUri != null) {
                        loadBitmapFromUri(cameraImageUri);
                    }
                }
        );

        // Native Gallery Pick
        pickImageLauncher = registerForActivityResult(
                new ActivityResultContracts.GetContent(),
                uri -> {
                    if (uri != null) {
                        loadBitmapFromUri(uri);
                    }
                }
        );
    }

    private void setupListeners() {
        // Camera button
        findViewById(R.id.btnCamera).setOnClickListener(v -> launchCamera());

        // Gallery button
        findViewById(R.id.btnGallery).setOnClickListener(v -> pickImageLauncher.launch("image/*"));

        // PDF Export button
        findViewById(R.id.btnExportPdf).setOnClickListener(v -> exportToPdf());

        // Share button
        findViewById(R.id.btnShare).setOnClickListener(v -> shareDocument());

        // Filter buttons
        btnFilterPhotocopy.setOnClickListener(v -> setFilter(ImageFilterEngine.FilterType.PHOTOCOPY_BW));
        btnFilterMagic.setOnClickListener(v -> setFilter(ImageFilterEngine.FilterType.MAGIC_ENHANCE));
        btnFilterGrayscale.setOnClickListener(v -> setFilter(ImageFilterEngine.FilterType.GRAYSCALE));
        btnFilterOriginal.setOnClickListener(v -> setFilter(ImageFilterEngine.FilterType.ORIGINAL));

        // Threshold Slider
        seekThreshold.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                tvThresholdValue.setText(String.valueOf(progress));
                currentThreshold = progress;
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                if (originalBitmap != null && currentFilter == ImageFilterEngine.FilterType.PHOTOCOPY_BW) {
                    processImageAsync();
                }
            }
        });
    }

    private void launchCamera() {
        try {
            File photoFile = createImageFile();
            cameraImageUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".fileprovider",
                    photoFile
            );
            takePictureLauncher.launch(cameraImageUri);
        } catch (Exception e) {
            Toast.makeText(this, "خطا در باز کردن دوربین: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private File createImageFile() throws Exception {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        File storageDir = new File(getCacheDir(), "camera_photos");
        if (!storageDir.exists()) {
            storageDir.mkdirs();
        }
        return File.createTempFile("SCAN_" + timeStamp + "_", ".jpg", storageDir);
    }

    private void loadBitmapFromUri(Uri uri) {
        progressBar.setVisibility(View.VISIBLE);
        executorService.execute(() -> {
            try {
                InputStream inputStream = getContentResolver().openInputStream(uri);
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                if (inputStream != null) inputStream.close();

                runOnUiThread(() -> {
                    if (bitmap != null) {
                        originalBitmap = bitmap;
                        layoutEmptyState.setVisibility(View.GONE);
                        ivDocumentPreview.setVisibility(View.VISIBLE);
                        processImageAsync();
                    } else {
                        progressBar.setVisibility(View.GONE);
                        Toast.makeText(this, "خطا در خواندن فایل تصویر", Toast.LENGTH_SHORT).show();
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "خطا: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void setFilter(ImageFilterEngine.FilterType filter) {
        currentFilter = filter;
        updateFilterButtons();
        if (originalBitmap != null) {
            processImageAsync();
        }
    }

    private void updateFilterButtons() {
        int activeBg = 0xFF0F766E;
        int normalBg = 0xFFE2E8F0;
        int activeText = 0xFFFFFFFF;
        int normalText = 0xFF1E293B;

        btnFilterPhotocopy.setBackgroundColor(currentFilter == ImageFilterEngine.FilterType.PHOTOCOPY_BW ? activeBg : normalBg);
        btnFilterPhotocopy.setTextColor(currentFilter == ImageFilterEngine.FilterType.PHOTOCOPY_BW ? activeText : normalText);

        btnFilterMagic.setBackgroundColor(currentFilter == ImageFilterEngine.FilterType.MAGIC_ENHANCE ? activeBg : normalBg);
        btnFilterMagic.setTextColor(currentFilter == ImageFilterEngine.FilterType.MAGIC_ENHANCE ? activeText : normalText);

        btnFilterGrayscale.setBackgroundColor(currentFilter == ImageFilterEngine.FilterType.GRAYSCALE ? activeBg : normalBg);
        btnFilterGrayscale.setTextColor(currentFilter == ImageFilterEngine.FilterType.GRAYSCALE ? activeText : normalText);

        btnFilterOriginal.setBackgroundColor(currentFilter == ImageFilterEngine.FilterType.ORIGINAL ? activeBg : normalBg);
        btnFilterOriginal.setTextColor(currentFilter == ImageFilterEngine.FilterType.ORIGINAL ? activeText : normalText);
    }

    private void processImageAsync() {
        if (originalBitmap == null) return;
        progressBar.setVisibility(View.VISIBLE);

        executorService.execute(() -> {
            Bitmap result = ImageFilterEngine.processImage(originalBitmap, currentFilter, currentThreshold);
            runOnUiThread(() -> {
                processedBitmap = result;
                ivDocumentPreview.setImageBitmap(processedBitmap);
                progressBar.setVisibility(View.GONE);
            });
        });
    }

    private void exportToPdf() {
        if (processedBitmap == null) {
            Toast.makeText(this, "ابتدا یک مدرک را انتخاب یا اسکن کنید", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        executorService.execute(() -> {
            try {
                // A4 dimensions at 72 DPI: 595 x 842 points
                int pageWidth = 595;
                int pageHeight = 842;

                PdfDocument document = new PdfDocument();
                PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create();
                PdfDocument.Page page = document.startPage(pageInfo);

                android.graphics.Canvas canvas = page.getCanvas();
                canvas.drawColor(Color.WHITE);

                // Fit document proportionally inside A4 with margins
                int margin = 36; // 0.5 inch margin
                int targetW = pageWidth - (margin * 2);
                int targetH = pageHeight - (margin * 2);

                float scale = Math.min((float) targetW / processedBitmap.getWidth(), (float) targetH / processedBitmap.getHeight());
                int drawW = Math.round(processedBitmap.getWidth() * scale);
                int drawH = Math.round(processedBitmap.getHeight() * scale);

                int left = margin + (targetW - drawW) / 2;
                int top = margin + (targetH - drawH) / 2;

                android.graphics.Rect destRect = new android.graphics.Rect(left, top, left + drawW, top + drawH);
                canvas.drawBitmap(processedBitmap, null, destRect, null);

                document.finishPage(page);

                String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
                File pdfDir = new File(getExternalFilesDir(null), "Photocopy_PDFs");
                if (!pdfDir.exists()) pdfDir.mkdirs();

                File pdfFile = new File(pdfDir, "Photocopy_" + timeStamp + ".pdf");
                FileOutputStream fos = new FileOutputStream(pdfFile);
                document.writeTo(fos);
                document.close();
                fos.close();

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "فایل PDF با موفقیت ذخیره شد:\n" + pdfFile.getName(), Toast.LENGTH_LONG).show();
                    openOrShareFile(pdfFile, "application/pdf");
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "خطا در تولید PDF: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void shareDocument() {
        if (processedBitmap == null) {
            Toast.makeText(this, "مدرکی برای اشتراک‌گذاری وجود ندارد", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            File cachePath = new File(getCacheDir(), "shared_images");
            if (!cachePath.exists()) cachePath.mkdirs();
            File imageFile = new File(cachePath, "photocopy_shared.jpg");
            FileOutputStream stream = new FileOutputStream(imageFile);
            processedBitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream);
            stream.close();

            openOrShareFile(imageFile, "image/jpeg");
        } catch (Exception e) {
            Toast.makeText(this, "خطا در آماده‌سازی تصویر: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void openOrShareFile(File file, String mimeType) {
        Uri contentUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_STREAM, contentUri);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivity(Intent.createChooser(intent, "اشتراک‌گذاری مدرک با:"));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
