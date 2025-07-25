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
    
    // Ajusta o tamanho do canvas para caber na tela, mantendo a proporção
    const containerWidth = canvas.parentElement.clientWidth;
    const scale = Math.min(1, containerWidth / originalImage.width);
    canvas.width = originalImage.width * scale;
    canvas.height = originalImage.height * scale;

    // Limpa o canvas e desenha a imagem original como base
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Se o corte estiver ativo e uma seleção existir...
    if (isCroppingEnabled && cropRect.width && cropRect.height) {
        
        // Salva o estado atual do canvas
        ctx.save();

        // 1. Define a forma da área de corte
        ctx.beginPath();
        ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
        
        // 2. Cria um "clipe": tudo que for desenhado a partir de agora
        // só aparecerá FORA desta forma.
        ctx.clip();
        
        // 3. Pinta uma camada escura em TODO o canvas. Devido ao clipe,
        // a área de corte (interior da forma) não será afetada.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restaura o estado do canvas para remover o clipe
        ctx.restore();
        
        // 4. Desenha a borda da seleção por cima de tudo
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
    }

    function updateDimensions() {
        if (!originalImage) return;
        
        const scaleToCanvas = originalImage.width / canvas.width;
        let sourceWidth, sourceHeight;

        if (isCroppingEnabled && cropRect.width) {
            // Usa as dimensões da área cortada
            sourceWidth = Math.abs(Math.round(cropRect.width * scaleToCanvas));
            sourceHeight = Math.abs(Math.round(cropRect.height * scaleToCanvas));
        } else {
            // Usa as dimensões da imagem inteira
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
        
        // 1. Determina a área de origem (o que cortar da imagem original)
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

        // 2. Determina o tamanho final da imagem (redimensionamento)
        const scale = resizeSlider.value / 100;
        const finalWidth = Math.round(sWidth * scale);
        const finalHeight = Math.round(sHeight * scale);

        // 3. Cria um canvas temporário para o resultado
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = finalWidth;
        finalCanvas.height = finalHeight;
        const finalCtx = finalCanvas.getContext('2d');
        
        // 4. Desenha a parte cortada da imagem original no canvas final, redimensionando no processo
        finalCtx.drawImage(originalImage, sx, sy, sWidth, sHeight, 0, 0, finalWidth, finalHeight);

        // 5. Inicia o download
        const format = formatSelect.value;
        const mimeType = `image/${format}`;
        const link = document.createElement('a');
        link.href = finalCanvas.toDataURL(mimeType, 0.95);
        
        const nameWithoutExtension = originalFileName.split('.').slice(0, -1).join('.');
        link.download = `${nameWithoutExtension}_cortada.${format}`;
        link.click();
    });
});