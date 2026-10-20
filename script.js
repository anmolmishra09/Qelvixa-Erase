/* State Management */
    const state = {
      originalImg: null,
      currentImgData: null,
      fileName: 'gemini-edited-image',
      fileType: 'image/png',
      fileSize: 0,
      zoom: 1,
      rotation: 0,
      flipH: 1,
      flipV: 1,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sharpness: 0
      },
      crop: {
        active: false,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        isDragging: false,
        isResizing: false,
        dragCorner: null,
        startX: 0,
        startY: 0
      },
      history: [],
      historyIndex: -1,
      isComparing: false
    };

    /* DOM Selectors */
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const editorLayout = document.getElementById('editorLayout');
    const previewCanvas = document.getElementById('previewCanvas');
    const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
    
    // Sliders
    const rangeBrightness = document.getElementById('rangeBrightness');
    const rangeContrast = document.getElementById('rangeContrast');
    const rangeSaturation = document.getElementById('rangeSaturation');
    const rangeSharpness = document.getElementById('rangeSharpness');
    const valBrightness = document.getElementById('valBrightness');
    const valContrast = document.getElementById('valContrast');
    const valSaturation = document.getElementById('valSaturation');
    const valSharpness = document.getElementById('valSharpness');

    // History buttons
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    const btnResetAll = document.getElementById('btnResetAll');

    // Controls
    const btnRotateLeft = document.getElementById('btnRotateLeft');
    const btnRotateRight = document.getElementById('btnRotateRight');
    const btnFlipH = document.getElementById('btnFlipH');
    const btnFlipV = document.getElementById('btnFlipV');
    const btnToggleCrop = document.getElementById('btnToggleCrop');
    const btnApplyCrop = document.getElementById('btnApplyCrop');
    const cropOverlay = document.getElementById('cropOverlay');
    const btnChooseAnother = document.getElementById('btnChooseAnother');

    // Zoom
    const zoomLevelText = document.getElementById('zoomLevelText');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnZoomFit = document.getElementById('btnZoomFit');

    // Comparison
    const btnToggleCompare = document.getElementById('btnToggleCompare');
    const comparisonWrapper = document.getElementById('comparisonWrapper');
    const compareCanvas = document.getElementById('compareCanvas');
    const compareCtx = compareCanvas.getContext('2d');
    const comparisonBefore = document.getElementById('comparisonBefore');
    const comparisonDivider = document.getElementById('comparisonDivider');

    // Metadata & Export
    const metaFormat = document.getElementById('metaFormat');
    const metaDims = document.getElementById('metaDims');
    const metaSize = document.getElementById('metaSize');
    const exportFormatSelect = document.getElementById('exportFormatSelect');
    const qualityControlWrapper = document.getElementById('qualityControlWrapper');
    const rangeQuality = document.getElementById('rangeQuality');
    const valQuality = document.getElementById('valQuality');
    const estExportSize = document.getElementById('estExportSize');
    const btnDownload = document.getElementById('btnDownload');

    // Theme & Navigation
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const toastContainer = document.getElementById('toastContainer');

    /* Toast Notification Utility */
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    /* Theme Management */
    function initTheme() {
      const saved = localStorage.getItem('gis_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
    }

    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gis_theme', next);
      showToast(`Switched to ${next} theme`, 'info');
    });

    /* Mobile Nav */
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    function closeMobileMenu() {
      mobileDrawer.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }

    function focusUploadZone() {
      uploadZone.scrollIntoView({ behavior: 'smooth' });
    }

    /* FAQ Accordion */
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const answer = item.querySelector('.faq-answer');
        const isOpen = item.classList.contains('open');

        // Close others
        document.querySelectorAll('.faq-item').forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-answer').style.maxHeight = null;
          }
        });

        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
        } else {
          item.classList.remove('open');
          answer.style.maxHeight = null;
        }
      });
    });

    /* Upload & Drag Drop Handling */
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
      });
    });

    uploadZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processUploadedFile(e.target.files[0]);
      }
    });

    btnChooseAnother.addEventListener('click', () => {
      fileInput.click();
    });

    function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function processUploadedFile(file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast('Invalid file format! Please upload PNG, JPEG, or WebP.', 'error');
        return;
      }

      state.fileName = file.name.replace(/\.[^/.]+$/, "");
      state.fileType = file.type;
      state.fileSize = file.size;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          state.originalImg = img;
          initializeEditor();
          showToast('Image loaded successfully!', 'success');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    /* Initialize Canvas Editor */
    function initializeEditor() {
      uploadZone.style.display = 'none';
      editorLayout.classList.add('active');

      // Reset transformations
      state.rotation = 0;
      state.flipH = 1;
      state.flipV = 1;
      state.zoom = 1;
      state.history = [];
      state.historyIndex = -1;
      resetFilterInputs();

      // Render original image into canvas
      renderCanvasBase();
      pushHistoryState('Initial Load');
      updateMetadataDisplay();
      updateEstimatedSize();
    }

    function resetFilterInputs() {
      state.filters = { brightness: 100, contrast: 100, saturation: 100, sharpness: 0 };
      rangeBrightness.value = 100;
      rangeContrast.value = 100;
      rangeSaturation.value = 100;
      rangeSharpness.value = 0;
      valBrightness.textContent = '100%';
      valContrast.textContent = '100%';
      valSaturation.textContent = '100%';
      valSharpness.textContent = '0%';
    }

    /* Base Canvas Rendering */
    function renderCanvasBase() {
      if (!state.originalImg) return;

      const isRotated90 = Math.abs(state.rotation % 180) === 90;
      const w = isRotated90 ? state.originalImg.height : state.originalImg.width;
      const h = isRotated90 ? state.originalImg.width : state.originalImg.height;

      previewCanvas.width = w;
      previewCanvas.height = h;

      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((state.rotation * Math.PI) / 180);
      ctx.scale(state.flipH, state.flipV);

      // Draw oriented image centered
      ctx.drawImage(
        state.originalImg,
        -state.originalImg.width / 2,
        -state.originalImg.height / 2
      );
      ctx.restore();

      // Apply Filter adjustments
      applyImageFilters();
    }

    /* Fast Canvas Pixel Manipulation & Filters */
    function applyImageFilters() {
      const w = previewCanvas.width;
      const h = previewCanvas.height;
      if (w === 0 || h === 0) return;

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const len = data.length;

      const b = (state.filters.brightness - 100) * 1.28; // -128 to 128
      const c = (state.filters.contrast / 100);
      const s = (state.filters.saturation / 100);

      // Contrast factor calculation
      const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));

      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let bl = data[i + 2];

        // Brightness
        r += b;
        g += b;
        bl += b;

        // Contrast
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        bl = factor * (bl - 128) + 128;

        // Saturation (Luma blend)
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * bl;
        r = gray + (r - gray) * s;
        g = gray + (g - gray) * s;
        bl = gray + (bl - gray) * s;

        // Clamp values
        data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        data[i + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
      }

      ctx.putImageData(imgData, 0, 0);

      // Apply 3x3 Convolution Sharpness if needed
      if (state.filters.sharpness > 0) {
        applySharpnessKernel(state.filters.sharpness / 100);
      }
    }

    /* 3x3 Convolution Kernel for Sharpness */
    function applySharpnessKernel(intensity) {
      const w = previewCanvas.width;
      const h = previewCanvas.height;
      const src = ctx.getImageData(0, 0, w, h);
      const dst = ctx.createImageData(w, h);
      const sData = src.data;
      const dData = dst.data;

      // 3x3 Laplacian sharpening mask interpolated with identity
      const kCenter = 1 + 4 * intensity;
      const kEdge = -intensity;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;

          for (let c = 0; c < 3; c++) {
            const top = ((y - 1) * w + x) * 4 + c;
            const bottom = ((y + 1) * w + x) * 4 + c;
            const left = (y * w + (x - 1)) * 4 + c;
            const right = (y * w + (x + 1)) * 4 + c;

            const val =
              sData[top] * kEdge +
              sData[bottom] * kEdge +
              sData[left] * kEdge +
              sData[right] * kEdge +
              sData[idx + c] * kCenter;

            dData[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
          }
          dData[idx + 3] = sData[idx + 3]; // Alpha preservation
        }
      }
      ctx.putImageData(dst, 0, 0);
    }

    /* Filter Sliders Event Binding */
    [
      { input: rangeBrightness, val: valBrightness, key: 'brightness', unit: '%' },
      { input: rangeContrast, val: valContrast, key: 'contrast', unit: '%' },
      { input: rangeSaturation, val: valSaturation, key: 'saturation', unit: '%' },
      { input: rangeSharpness, val: valSharpness, key: 'sharpness', unit: '%' }
    ].forEach(({ input, val, key, unit }) => {
      input.addEventListener('input', () => {
        val.textContent = input.value + unit;
        state.filters[key] = parseFloat(input.value);
        renderCanvasBase();
      });

      input.addEventListener('change', () => {
        pushHistoryState(`Adjust ${key}`);
        updateEstimatedSize();
      });
    });

    /* Rotate & Flip Transforms */
    btnRotateLeft.addEventListener('click', () => {
      state.rotation = (state.rotation - 90) % 360;
      renderCanvasBase();
      pushHistoryState('Rotate Left');
      updateMetadataDisplay();
      updateEstimatedSize();
    });

    btnRotateRight.addEventListener('click', () => {
      state.rotation = (state.rotation + 90) % 360;
      renderCanvasBase();
      pushHistoryState('Rotate Right');
      updateMetadataDisplay();
      updateEstimatedSize();
    });

    btnFlipH.addEventListener('click', () => {
      state.flipH *= -1;
      renderCanvasBase();
      pushHistoryState('Flip Horizontal');
    });

    btnFlipV.addEventListener('click', () => {
      state.flipV *= -1;
      renderCanvasBase();
      pushHistoryState('Flip Vertical');
    });

    /* Zoom Controls */
    function applyZoom(delta) {
      state.zoom = Math.min(Math.max(0.2, state.zoom + delta), 3.0);
      zoomLevelText.textContent = Math.round(state.zoom * 100) + '%';
      previewCanvas.style.transform = `scale(${state.zoom})`;
    }

    btnZoomIn.addEventListener('click', () => applyZoom(0.15));
    btnZoomOut.addEventListener('click', () => applyZoom(-0.15));
    btnZoomFit.addEventListener('click', () => {
      state.zoom = 1;
      zoomLevelText.textContent = '100%';
      previewCanvas.style.transform = `scale(1)`;
    });

    /* Undo & Redo History Management */
    function pushHistoryState(actionName) {
      // Crop future branch if we are in the middle of history
      if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
      }

      // Snapshot current image data
      const snapshot = previewCanvas.toDataURL();
      state.history.push({
        action: actionName,
        snapshot: snapshot,
        rotation: state.rotation,
        flipH: state.flipH,
        flipV: state.flipV,
        filters: { ...state.filters }
      });

      state.historyIndex = state.history.length - 1;
      updateHistoryButtons();
    }

    function updateHistoryButtons() {
      btnUndo.disabled = state.historyIndex <= 0;
      btnRedo.disabled = state.historyIndex >= state.history.length - 1;
    }

    btnUndo.addEventListener('click', () => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreHistoryState(state.history[state.historyIndex]);
      }
    });

    btnRedo.addEventListener('click', () => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreHistoryState(state.history[state.historyIndex]);
      }
    });

    function restoreHistoryState(hist) {
      const img = new Image();
      img.onload = () => {
        previewCanvas.width = img.width;
        previewCanvas.height = img.height;
        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        state.rotation = hist.rotation;
        state.flipH = hist.flipH;
        state.flipV = hist.flipV;
        state.filters = { ...hist.filters };

        // Synchronize UI sliders
        rangeBrightness.value = state.filters.brightness;
        valBrightness.textContent = state.filters.brightness + '%';
        rangeContrast.value = state.filters.contrast;
        valContrast.textContent = state.filters.contrast + '%';
        rangeSaturation.value = state.filters.saturation;
        valSaturation.textContent = state.filters.saturation + '%';
        rangeSharpness.value = state.filters.sharpness;
        valSharpness.textContent = state.filters.sharpness + '%';

        updateHistoryButtons();
        updateMetadataDisplay();
        updateEstimatedSize();
      };
      img.src = hist.snapshot;
    }

    btnResetAll.addEventListener('click', () => {
      if (confirm('Discard all edits and reset to the original uploaded image?')) {
        initializeEditor();
        showToast('All edits reset to original state', 'info');
      }
    });

    /* Interactive Crop Tool */
    btnToggleCrop.addEventListener('click', () => {
      state.crop.active = !state.crop.active;
      if (state.crop.active) {
        btnToggleCrop.classList.add('active');
        btnApplyCrop.style.display = 'inline-flex';
        initCropBox();
      } else {
        closeCropTool();
      }
    });

    function closeCropTool() {
      state.crop.active = false;
      btnToggleCrop.classList.remove('active');
      btnApplyCrop.style.display = 'none';
      cropOverlay.classList.remove('active');
    }

    function initCropBox() {
      cropOverlay.classList.add('active');
      const rect = previewCanvas.getBoundingClientRect();
      const parentRect = previewCanvas.parentElement.getBoundingClientRect();

      // Initialize crop box to 80% center
      const initialW = rect.width * 0.75;
      const initialH = rect.height * 0.75;
      const left = (parentRect.width - initialW) / 2;
      const top = (parentRect.height - initialH) / 2;

      cropOverlay.style.width = initialW + 'px';
      cropOverlay.style.height = initialH + 'px';
      cropOverlay.style.left = left + 'px';
      cropOverlay.style.top = top + 'px';
    }

    // Interactive Crop Drag and Resize
    cropOverlay.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('crop-handle')) {
        state.crop.isResizing = true;
        state.crop.dragCorner = e.target.dataset.corner;
      } else {
        state.crop.isDragging = true;
      }
      state.crop.startX = e.clientX;
      state.crop.startY = e.clientY;
      e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.crop.active) return;

      const dx = e.clientX - state.crop.startX;
      const dy = e.clientY - state.crop.startY;

      if (state.crop.isDragging) {
        cropOverlay.style.left = (cropOverlay.offsetLeft + dx) + 'px';
        cropOverlay.style.top = (cropOverlay.offsetTop + dy) + 'px';
        state.crop.startX = e.clientX;
        state.crop.startY = e.clientY;
      } else if (state.crop.isResizing) {
        const rect = cropOverlay.getBoundingClientRect();
        if (state.crop.dragCorner === 'br') {
          cropOverlay.style.width = Math.max(50, rect.width + dx) + 'px';
          cropOverlay.style.height = Math.max(50, rect.height + dy) + 'px';
        } else if (state.crop.dragCorner === 'tl') {
          cropOverlay.style.left = (cropOverlay.offsetLeft + dx) + 'px';
          cropOverlay.style.top = (cropOverlay.offsetTop + dy) + 'px';
          cropOverlay.style.width = Math.max(50, rect.width - dx) + 'px';
          cropOverlay.style.height = Math.max(50, rect.height - dy) + 'px';
        }
        state.crop.startX = e.clientX;
        state.crop.startY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      state.crop.isDragging = false;
      state.crop.isResizing = false;
    });

    btnApplyCrop.addEventListener('click', () => {
      // Calculate crop coordinates scaled to actual canvas dimensions
      const canvasRect = previewCanvas.getBoundingClientRect();
      const cropRect = cropOverlay.getBoundingClientRect();

      const scaleX = previewCanvas.width / canvasRect.width;
      const scaleY = previewCanvas.height / canvasRect.height;

      const sx = Math.max(0, (cropRect.left - canvasRect.left) * scaleX);
      const sy = Math.max(0, (cropRect.top - canvasRect.top) * scaleY);
      const sw = Math.min(previewCanvas.width - sx, cropRect.width * scaleX);
      const sh = Math.min(previewCanvas.height - sy, cropRect.height * scaleY);

      if (sw <= 10 || sh <= 10) {
        showToast('Selected crop zone is too small!', 'error');
        return;
      }

      // Extract cropped image data
      const croppedData = ctx.getImageData(sx, sy, sw, sh);
      previewCanvas.width = sw;
      previewCanvas.height = sh;
      ctx.putImageData(croppedData, 0, 0);

      // Create new base image from cropped content
      const newImg = new Image();
      newImg.onload = () => {
        state.originalImg = newImg;
        state.rotation = 0;
        state.flipH = 1;
        state.flipV = 1;
        closeCropTool();
        pushHistoryState('Crop Area');
        updateMetadataDisplay();
        updateEstimatedSize();
        showToast('Image cropped successfully!', 'success');
      };
      newImg.src = previewCanvas.toDataURL();
    });

    /* Before-and-After Slider Comparison */
    btnToggleCompare.addEventListener('mousedown', startComparison);
    btnToggleCompare.addEventListener('mouseup', endComparison);
    btnToggleCompare.addEventListener('touchstart', startComparison);
    btnToggleCompare.addEventListener('touchend', endComparison);

    function startComparison() {
      if (!state.originalImg) return;
      state.isComparing = true;
      comparisonWrapper.classList.add('active');

      // Draw original unmodified photo onto compareCanvas
      compareCanvas.width = previewCanvas.width;
      compareCanvas.height = previewCanvas.height;
      compareCanvas.style.width = previewCanvas.style.width;
      compareCanvas.style.height = previewCanvas.style.height;

      compareCtx.clearRect(0, 0, compareCanvas.width, compareCanvas.height);
      compareCtx.drawImage(state.originalImg, 0, 0, compareCanvas.width, compareCanvas.height);

      comparisonBefore.style.width = '50%';
      comparisonDivider.style.left = '50%';
    }

    function endComparison() {
      state.isComparing = false;
      comparisonWrapper.classList.remove('active');
    }

    // Comparison slider mouse drag
    let isDividing = false;
    comparisonDivider.addEventListener('mousedown', () => isDividing = true);
    window.addEventListener('mouseup', () => isDividing = false);
    window.addEventListener('mousemove', (e) => {
      if (!isDividing || !state.isComparing) return;
      const rect = comparisonWrapper.getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const pct = (pos / rect.width) * 100;
      comparisonBefore.style.width = pct + '%';
      comparisonDivider.style.left = pct + '%';
    });

    /* Metadata & File Size Calculations */
    function updateMetadataDisplay() {
      metaFormat.textContent = state.fileType.split('/')[1].toUpperCase();
      metaDims.textContent = `${previewCanvas.width} × ${previewCanvas.height} px`;
      metaSize.textContent = formatBytes(state.fileSize);
    }

    exportFormatSelect.addEventListener('change', () => {
      const isLossy = exportFormatSelect.value === 'image/jpeg' || exportFormatSelect.value === 'image/webp';
      qualityControlWrapper.style.display = isLossy ? 'flex' : 'none';
      updateEstimatedSize();
    });

    rangeQuality.addEventListener('input', () => {
      valQuality.textContent = rangeQuality.value + '%';
      updateEstimatedSize();
    });

    function updateEstimatedSize() {
      const format = exportFormatSelect.value;
      const quality = parseFloat(rangeQuality.value) / 100;

      previewCanvas.toBlob((blob) => {
        if (blob) {
          estExportSize.textContent = formatBytes(blob.size);
        }
      }, format, quality);
    }

    /* Production Export & Direct Browser Download */
    btnDownload.addEventListener('click', () => {
      const format = exportFormatSelect.value;
      const quality = parseFloat(rangeQuality.value) / 100;
      const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';

      showToast('Generating high-resolution export...', 'info');

      previewCanvas.toBlob((blob) => {
        if (!blob) {
          showToast('Failed to create export blob', 'error');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${state.fileName}-edited.${ext}`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('Export downloaded successfully!', 'success');
        }, 150);
      }, format, quality);
    });

    // Initialize application on load
    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
    });
