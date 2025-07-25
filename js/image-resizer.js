window.addEventListener('load', () => {
    const imageResizerCard = document.getElementById('imageResizerCard');
    if (!imageResizerCard) return;

    // --- Elementos da UI ---
    const uploadArea = document.getElementById('upload-area-resizer');
    const editorArea = document.getElementById('editor-area-resizer');
    const fileInput = document.getElementById('image-file-input');
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d');
    
    // Controles de Corte
    const enableCropCheckbox = document.getElementById('enable-crop');
    const cropControls = document.getElementById('crop-controls');
    const resetCropBtn = document.getElementById('reset-crop-btn');
    
    // Displays de Dimensão
    const originalDimensionsDisplay = document.getElementById('original-dimensions');
    const newDimensionsDisplay = document.getElementById('new-dimensions');
    
    // Controles de Redimensionamento e Saída
    const resizeSlider = document.getElementById('resize-slider');
    const sliderValueDisplay = document.getElementById('slider-value');
    const formatSelect = document.getElementById('format-select');
    const downloadBtn = document.getElementById('download-btn');

    // Novos Controles de Qualidade
    const qualityControls = document.getElementById('quality-controls');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');

    // --- Variáveis de Estado ---
    let originalImage = null;
    let originalFileName = '';
    let isCroppingEnabled = false;
    let isDragging = false;
    let cropRect = {};
    let startDrag = {};

    // --- Carregamento da Imagem ---
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        originalFileName = file.name;
        const reader = new FileReader();

        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                uploadArea.style.display = 'none';
                editorArea.classList.remove('hidden');
                resetState();
                redrawCanvas();
                updateDimensions();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- Lógica do Desenho e Interação com o Canvas ---
    function redrawCanvas() {
        if (!originalImage) return;
        const containerWidth = canvas.parentElement.clientWidth;
        const scale = Math.min(1, containerWidth / originalImage.width);
        canvas.width = originalImage.width * scale;
        canvas.height = originalImage.height * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        if (isCroppingEnabled && cropRect.width && cropRect.height) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
            ctx.clip();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (!isCroppingEnabled) return;
        isDragging = true;
        startDrag = { x: e.offsetX, y: e.offsetY };
        cropRect = { x: e.offsetX, y: e.offsetY, width: 0, height: 0 };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isCroppingEnabled || !isDragging) return;
        cropRect.width = e.offsetX - startDrag.x;
        cropRect.height = e.offsetY - startDrag.y;
        redrawCanvas();
        updateDimensions();
    });

    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });

    // --- Lógica dos Controles ---
    enableCropCheckbox.addEventListener('change', (e) => {
        isCroppingEnabled = e.target.checked;
        cropControls.classList.toggle('hidden', !isCroppingEnabled);
        canvas.classList.toggle('cropping', isCroppingEnabled);
        if (!isCroppingEnabled) {
            resetCropSelection();
        }
    });

    resetCropBtn.addEventListener('click', resetCropSelection);
    resizeSlider.addEventListener('input', updateDimensions);

    formatSelect.addEventListener('change', () => {
        const selectedFormat = formatSelect.value;
        qualityControls.style.display = selectedFormat === 'png' ? 'none' : 'flex';
    });

    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = `${qualitySlider.value}%`;
    });

    function resetCropSelection() {
        cropRect = {};
        redrawCanvas();
        updateDimensions();
    }
    
    function resetState() {
        enableCropCheckbox.checked = false;
        isCroppingEnabled = false;
        cropControls.classList.add('hidden');
        canvas.classList.remove('cropping');
        resetCropSelection();
        resizeSlider.value = 100;
        qualitySlider.value = 95;
        qualityValue.textContent = '95%';
        formatSelect.value = 'jpeg';
        qualityControls.style.display = 'flex';
    }

    function updateDimensions() {
        if (!originalImage) return;
        
        const scaleToCanvas = originalImage.width / canvas.width;
        let sourceWidth, sourceHeight;

        if (isCroppingEnabled && cropRect.width) {
            sourceWidth = Math.abs(Math.round(cropRect.width * scaleToCanvas));
            sourceHeight = Math.abs(Math.round(cropRect.height * scaleToCanvas));
        } else {
            sourceWidth = originalImage.width;
            sourceHeight = originalImage.height;
        }
        originalDimensionsDisplay.textContent = `${sourceWidth} x ${sourceHeight}`;

        const scale = resizeSlider.value / 100;
        const newWidth = Math.round(sourceWidth * scale);
        const newHeight = Math.round(sourceHeight * scale);
        
        sliderValueDisplay.textContent = `${resizeSlider.value}%`;
        newDimensionsDisplay.textContent = `${newWidth} x ${newHeight}`;
    }

    // --- Lógica de Download ---
    downloadBtn.addEventListener('click', () => {
        if (!originalImage) return;
        
        const scaleToCanvas = originalImage.width / canvas.width;
        let sx, sy, sWidth, sHeight;

        if (isCroppingEnabled && cropRect.width && cropRect.height) {
            sx = Math.min(startDrag.x, startDrag.x + cropRect.width) * scaleToCanvas;
            sy = Math.min(startDrag.y, startDrag.y + cropRect.height) * scaleToCanvas;
            sWidth = Math.abs(cropRect.width) * scaleToCanvas;
            sHeight = Math.abs(cropRect.height) * scaleToCanvas;
        } else {
            sx = 0; sy = 0;
            sWidth = originalImage.width;
            sHeight = originalImage.height;
        }

        const scale = resizeSlider.value / 100;
        const finalWidth = Math.round(sWidth * scale);
        const finalHeight = Math.round(sHeight * scale);

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = finalWidth;
        finalCanvas.height = finalHeight;
        const finalCtx = finalCanvas.getContext('2d');
        
        finalCtx.drawImage(originalImage, sx, sy, sWidth, sHeight, 0, 0, finalWidth, finalHeight);

        const format = formatSelect.value;
        const mimeType = `image/${format}`;
        const quality = parseInt(qualitySlider.value, 10) / 100;

        const link = document.createElement('a');
        link.href = finalCanvas.toDataURL(mimeType, quality);
        
        const nameWithoutExtension = originalFileName.split('.').slice(0, -1).join('.');
        link.download = `${nameWithoutExtension}_editada.${format}`;
        link.click();
    });
});