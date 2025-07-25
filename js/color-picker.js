window.addEventListener('load', () => {
    const colorPickerCard = document.getElementById('colorPickerCard');
    if (!colorPickerCard) return;

    // --- Elementos da UI ---
    const uploadArea = document.getElementById('upload-area-picker');
    const detailsPanel = document.getElementById('details-panel');
    const fileInput = document.getElementById('image-file-input');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const colorSwatch = document.getElementById('color-swatch');
    const hexValueInput = document.getElementById('hex-value');
    const rgbValueInput = document.getElementById('rgb-value');
    const hslValueInput = document.getElementById('hsl-value');
    const copyButtons = document.querySelectorAll('[data-copy]');

    let originalImage = null;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                uploadArea.style.display = 'none';
                canvasWrapper.classList.remove('hidden');
                detailsPanel.classList.remove('hidden');

                // Define a resolução interna do canvas igual à da imagem original
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
                // O CSS fará com que ele seja exibido em um tamanho menor, se necessário
                ctx.drawImage(originalImage, 0, 0);
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- LÓGICA DE CAPTURA DE COR CORRIGIDA ---
    canvas.addEventListener('mousemove', (e) => {
        if (!originalImage) return;

        const rect = canvas.getBoundingClientRect();

        // Calcula a proporção entre o tamanho real do canvas e seu tamanho de exibição
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Ajusta as coordenadas do mouse usando essa proporção
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        // Pega os dados de cor do pixel na coordenada correta
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];

        updateColorDetails(r, g, b);
    });

    function updateColorDetails(r, g, b) {
        const rgbString = `rgb(${r}, ${g}, ${b})`;
        const hexString = rgbToHex(r, g, b);
        const hslString = rgbToHsl(r, g, b);

        colorSwatch.style.backgroundColor = rgbString;
        hexValueInput.value = hexString;
        rgbValueInput.value = rgbString;
        hslValueInput.value = hslString;
    }

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputId = button.dataset.copy;
            const inputToCopy = document.getElementById(inputId);
            
            // Usa a nova API de Clipboard para mais compatibilidade
            navigator.clipboard.writeText(inputToCopy.value).then(() => {
                // Feedback visual
                const originalIcon = button.innerHTML;
                button.innerHTML = 'Copiado!';
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                }, 1500);
            }).catch(err => {
                console.error('Falha ao copiar: ', err);
            });
        });
    });

    // --- Funções Auxiliares de Conversão de Cor ---
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        } else {
            h = s = 0;
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `hsl(${h}, ${s}%, ${l}%)`;
    }
});