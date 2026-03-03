document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const controls = document.getElementById('controls');
    const previewSection = document.getElementById('preview-section');
    const actionButtons = document.getElementById('action-buttons');
    const qualitySlider = document.getElementById('quality');
    const maxWidthInput = document.getElementById('max-width');
    const originalPreview = document.getElementById('original-preview');
    const compressedPreview = document.getElementById('compressed-preview');
    const originalSize = document.getElementById('original-size');
    const compressedSize = document.getElementById('compressed-size');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const uploadBox = document.getElementById('upload');

    let originalImage = null;
    let compressedBlob = null;

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    function getCompressionPercentage(original, compressed) {
        if (original === 0) return 0;
        return Math.round(((original - compressed) / original) * 100);
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4ade80' : '#ef5350'};
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    imageInput.addEventListener('change', handleImageUpload);

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                originalPreview.style.opacity = '0';
                originalPreview.src = img.src;
                originalPreview.onload = () => {
                    originalPreview.style.transition = 'opacity 0.4s ease';
                    originalPreview.style.opacity = '1';
                };
                originalSize.textContent = `Original: ${formatFileSize(file.size)}`;
                uploadBox.style.transform = 'scale(0)';
                setTimeout(() => { uploadBox.style.display = 'none'; }, 10);
                controls.style.opacity = '0';
                controls.style.display = 'grid';
                controls.style.transition = 'opacity 0.4s ease';
                setTimeout(() => { controls.style.opacity = '1'; }, 10);

                previewSection.style.opacity = '0';
                previewSection.style.display = 'grid';
                previewSection.style.transition = 'opacity 0.4s ease';
                setTimeout(() => { previewSection.style.opacity = '1'; }, 10);

                actionButtons.style.opacity = '0';
                actionButtons.style.display = 'flex';
                actionButtons.style.transition = 'opacity 0.4s ease';
                setTimeout(() => { actionButtons.style.opacity = '1'; }, 10);

                showNotification('Imagem carregada com sucesso!');
                compressImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    qualitySlider.addEventListener('input', () => {
        document.getElementById('quality-value').textContent = qualitySlider.value;
        compressImage();
    });

    maxWidthInput.addEventListener('input', () => {
        const value = maxWidthInput.value || 'auto';
        document.getElementById('width-value').textContent = value;
        compressImage();
    });

    formatRadios.forEach((radio) => {
        radio.addEventListener('change', compressImage);
    });

    function compressImage() {
        if (!originalImage) return;

        compressedPreview.style.opacity = '0.5';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = originalImage.width;
        let height = originalImage.height;

        const maxWidth = parseInt(maxWidthInput.value);
        if (maxWidth && width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(originalImage, 0, 0, width, height);

        const quality = qualitySlider.value / 100;
        const format = document.querySelector('input[name="format"]:checked').value;
        const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;

        canvas.toBlob(
            (blob) => {
                compressedBlob = blob;
                compressedPreview.style.opacity = '1';
                compressedPreview.src = URL.createObjectURL(blob);
                const compression = getCompressionPercentage(
                    originalImage.width * originalImage.height * 4,
                    blob.size
                );
                compressedSize.textContent = `Comprimida: ${formatFileSize(blob.size)} (${compression}% menor)`;
            },
            mimeType,
            quality
        );
    }

    downloadBtn.addEventListener('click', () => {
        if (!compressedBlob) return;

        downloadBtn.innerHTML = '<i class="fa-solid fa-spinner"></i> Baixando...';
        downloadBtn.disabled = true;

        const format = document.querySelector('input[name="format"]:checked').value;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedBlob);
        link.download = `imagem-comprimida.${format}`;
        link.click();

        setTimeout(() => {
            downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Baixar Imagem';
            downloadBtn.disabled = false;
            showNotification('Imagem baixada com sucesso!');
        }, 1000);
    });

    resetBtn.addEventListener('click', () => {
        imageInput.value = '';
        originalImage = null;
        compressedBlob = null;
        controls.style.opacity = '0';

        setTimeout(() => { uploadBox.style.display = 'flex'; }, 10);
        uploadBox.style.transform = 'scale(1)';
        setTimeout(() => { controls.style.display = 'none'; }, 400);
        previewSection.style.opacity = '0';
        setTimeout(() => { previewSection.style.display = 'none'; }, 400);
        actionButtons.style.opacity = '0';
        setTimeout(() => { actionButtons.style.display = 'none'; }, 400);
        qualitySlider.value = 80;
        maxWidthInput.value = '';
        document.getElementById('quality-value').textContent = '80';
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const uploadBox = imageInput.parentElement;
        uploadBox.style.transform = 'scale(1.02)';
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        const uploadBox = imageInput.parentElement;
        uploadBox.style.transform = 'scale(1)';
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const uploadBox = imageInput.parentElement;
        uploadBox.style.transform = 'scale(1)';

        const files = e.dataTransfer.files;
        if (files && files[0] && files[0].type.startsWith('image/')) {
            imageInput.files = files;
            handleImageUpload({ target: { files: files } });
        } else {
            showNotification('Por favor, solte apenas imagens', 'error');
        }
    });

    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);
});
