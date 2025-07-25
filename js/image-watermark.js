// /js/image-watermark.js
window.addEventListener('load', () => {
    // CORREÇÃO: Procurando pelo ID correto 'imageWatermarkCard'
    const watermarkCard = document.getElementById('imageWatermarkCard');
    if (!watermarkCard) return;

    // --- Elementos da UI ---
    const uploadArea = document.getElementById('upload-area-watermark');
    const editorElements = {
        canvasWrapper: document.getElementById('canvas-wrapper'),
        controlsPanel: document.getElementById('controls-panel'),
        canvas: document.getElementById('image-canvas'),
        ctx: document.getElementById('image-canvas').getContext('2d'),
    };

    // Inputs
    const mainImageInput = document.getElementById('main-image-input');
    const watermarkImageInput = document.getElementById('watermark-image-input');
    const textInput = document.getElementById('watermark-text');
    const colorInput = document.getElementById('watermark-color');
    const sizeSlider = document.getElementById('size-slider');
    const opacitySlider = document.getElementById('opacity-slider');
    const formatSelect = document.getElementById('format-select');

    // Displays
    const sizeValueDisplay = document.getElementById('size-value');
    const opacityValueDisplay = document.getElementById('opacity-value');
    const logoNameDisplay = document.getElementById('logo-name');
    
    // Botões
    const tabButtons = document.querySelectorAll('.tab-btn');
    const positionButtons = document.querySelectorAll('.position-grid button');
    const downloadBtn = document.getElementById('download-btn');

    // --- Variáveis de Estado ---
    let mainImage = null;
    let watermarkImage = null;
    let options = {
        type: 'text', // 'text' ou 'image'
        text: 'Sua Marca',
        color: '#FFFFFF',
        size: 30, // pode ser font size ou % da largura da imagem
        opacity: 0.5,
        position: 'center', // ex: 'top-left'
    };

    // --- Funções Principais ---
    function redrawCanvas() {
        if (!mainImage) return;

        editorElements.canvas.width = mainImage.width;
        editorElements.canvas.height = mainImage.height;

        editorElements.ctx.clearRect(0, 0, editorElements.canvas.width, editorElements.canvas.height);
        editorElements.ctx.drawImage(mainImage, 0, 0);

        editorElements.ctx.globalAlpha = options.opacity;
        
        let watermarkWidth = 0;
        let watermarkHeight = 0;

        if (options.type === 'text') {
            editorElements.ctx.fillStyle = options.color;
            editorElements.ctx.font = `bold ${options.size}px "Google Sans", sans-serif`;
            const textMetrics = editorElements.ctx.measureText(options.text);
            watermarkWidth = textMetrics.width;
            watermarkHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        } else if (watermarkImage) {
            const scale = (options.size / 100) * (editorElements.canvas.width / watermarkImage.width);
            watermarkWidth = watermarkImage.width * scale;
            watermarkHeight = watermarkImage.height * scale;
        }

        const { x, y } = calculatePosition(watermarkWidth, watermarkHeight);

        if (options.type === 'text') {
            editorElements.ctx.fillText(options.text, x, y + watermarkHeight);
        } else if (watermarkImage) {
            editorElements.ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
        }
        
        editorElements.ctx.globalAlpha = 1.0;
    }

    function calculatePosition(w, h) {
        const margin = 0.02 * editorElements.canvas.width; // 2% de margem
        const canvasWidth = editorElements.canvas.width;
        const canvasHeight = editorElements.canvas.height;
        let x, y;

        switch (options.position) {
            case 'top-left': x = margin; y = 0; break;
            case 'top-center': x = (canvasWidth - w) / 2; y = 0; break;
            case 'top-right': x = canvasWidth - w - margin; y = 0; break;
            case 'center-left': x = margin; y = (canvasHeight - h) / 2; break;
            case 'center': x = (canvasWidth - w) / 2; y = (canvasHeight - h) / 2; break;
            case 'center-right': x = canvasWidth - w - margin; y = (canvasHeight - h) / 2; break;
            case 'bottom-left': x = margin; y = canvasHeight - h; break;
            case 'bottom-center': x = (canvasWidth - w) / 2; y = canvasHeight - h; break;
            case 'bottom-right': x = canvasWidth - w - margin; y = canvasHeight - h; break;
            default: x = 0; y = 0;
        }
        // Ajuste para a linha de base do texto
        if(options.type === 'text') y += options.size * 0.8;
        return { x, y };
    }

    // --- Listeners de Evento ---
    mainImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            mainImage = new Image();
            mainImage.onload = () => {
                uploadArea.style.display = 'none';
                editorElements.canvasWrapper.classList.remove('hidden');
                editorElements.controlsPanel.classList.remove('hidden');
                redrawCanvas();
            };
            mainImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    watermarkImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            watermarkImage = new Image();
            watermarkImage.onload = () => {
                logoNameDisplay.textContent = file.name;
                redrawCanvas();
            };
            watermarkImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    textInput.addEventListener('input', (e) => {
        options.text = e.target.value || "Sua Marca";
        redrawCanvas();
    });

    colorInput.addEventListener('input', (e) => {
        options.color = e.target.value;
        redrawCanvas();
    });

    sizeSlider.addEventListener('input', (e) => {
        options.size = e.target.value;
        sizeValueDisplay.textContent = options.type === 'text' ? `${options.size}px` : `${options.size}%`;
        redrawCanvas();
    });

    opacitySlider.addEventListener('input', (e) => {
        options.opacity = e.target.value / 100;
        opacityValueDisplay.textContent = `${e.target.value}%`;
        redrawCanvas();
    });
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            options.type = btn.dataset.type;
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${options.type}-controls`).classList.add('active');

            if (options.type === 'text') {
                sizeSlider.min = 10; sizeSlider.max = 200; sizeSlider.value = 30;
                options.size = 30;
                sizeValueDisplay.textContent = '30px';
            } else {
                sizeSlider.min = 1; sizeSlider.max = 100; sizeSlider.value = 15;
                options.size = 15;
                sizeValueDisplay.textContent = '15%';
            }
            redrawCanvas();
        });
    });

    positionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            positionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            options.position = btn.dataset.position;
            redrawCanvas();
        });
    });
    
    downloadBtn.addEventListener('click', () => {
        if (!mainImage) return;
        const format = formatSelect.value;
        const mimeType = `image/${format}`;
        const link = document.createElement('a');
        link.href = editorElements.canvas.toDataURL(mimeType, 1.0);
        link.download = `marcadagua_${mainImageInput.files[0]?.name || 'imagem'}.${format}`;
        link.click();
    });
});