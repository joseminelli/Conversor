document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('editor-image-input');
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas.getContext('2d');
  const controlsSection = document.getElementById('controls-section');
  const previewPanel = document.getElementById('preview-panel');
  const canvasDimensions = document.getElementById('canvas-dimensions');

  const brightnessSlider = document.getElementById('brightness');
  const contrastSlider = document.getElementById('contrast');
  const saturationSlider = document.getElementById('saturation');
  const hueSlider = document.getElementById('hue');
  const blurSlider = document.getElementById('blur');

  const grayscaleBtn = document.getElementById('grayscale-btn');
  const invertBtn = document.getElementById('invert-btn');
  const sepiaBtn = document.getElementById('sepia-btn');
  const resetBtn = document.getElementById('reset-filters-btn');
  const downloadBtn = document.getElementById('download-editor-btn');

  let originalImage = null;
  let filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: false,
    invert: false,
    sepia: false,
  };

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
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        canvas.width = img.width;
        canvas.height = img.height;
        canvasDimensions.textContent = `${img.width} x ${img.height}`;

        controlsSection.style.opacity = '0';
        controlsSection.style.display = 'flex';
        controlsSection.style.transition = 'opacity 0.4s ease';
        setTimeout(() => { controlsSection.style.opacity = '1'; }, 10);

        previewPanel.style.opacity = '0';
        previewPanel.style.display = 'flex';
        previewPanel.style.transition = 'opacity 0.4s ease';
        setTimeout(() => { previewPanel.style.opacity = '1'; }, 10);

        resetFilters();
        drawImage();
        showNotification('Imagem carregada com sucesso!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  brightnessSlider.addEventListener('input', (e) => {
    filters.brightness = e.target.value;
    document.getElementById('brightness-value').textContent = e.target.value;
    drawImage();
  });

  contrastSlider.addEventListener('input', (e) => {
    filters.contrast = e.target.value;
    document.getElementById('contrast-value').textContent = e.target.value;
    drawImage();
  });

  saturationSlider.addEventListener('input', (e) => {
    filters.saturation = e.target.value;
    document.getElementById('saturation-value').textContent = e.target.value;
    drawImage();
  });

  hueSlider.addEventListener('input', (e) => {
    filters.hue = e.target.value;
    document.getElementById('hue-value').textContent = e.target.value;
    drawImage();
  });

  blurSlider.addEventListener('input', (e) => {
    filters.blur = e.target.value;
    document.getElementById('blur-value').textContent = e.target.value;
    drawImage();
  });

  grayscaleBtn.addEventListener('click', (e) => {
    filters.grayscale = !filters.grayscale;
    grayscaleBtn.classList.toggle('active');
    drawImage();
  });

  invertBtn.addEventListener('click', (e) => {
    filters.invert = !filters.invert;
    invertBtn.classList.toggle('active');
    drawImage();
  });

  sepiaBtn.addEventListener('click', (e) => {
    filters.sepia = !filters.sepia;
    sepiaBtn.classList.toggle('active');
    drawImage();
  });

  function drawImage() {
    if (!originalImage) return;

    canvas.style.opacity = '0.7';

    ctx.filter = applyFilters();
    ctx.drawImage(originalImage, 0, 0);

    if (filters.grayscale || filters.invert || filters.sepia) {
      applyPixelFilters();
    }

    canvas.style.opacity = '1';
  }

  function applyFilters() {
    const brightness = filters.brightness / 100;
    const contrast = filters.contrast / 100;
    const saturation = filters.saturation / 100;
    const hue = filters.hue;
    const blur = filters.blur;

    return `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
      hue-rotate(${hue}deg)
      blur(${blur}px)
    `;
  }

  function applyPixelFilters() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];

      if (filters.grayscale) {
        const gray = r * 0.299 + g * 0.587 + b * 0.114;
        r = g = b = gray;
      }

      if (filters.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      if (filters.sepia) {
        const newR = (r * 0.393 + g * 0.769 + b * 0.189) / 3;
        const newG = (r * 0.349 + g * 0.686 + b * 0.168) / 3;
        const newB = (r * 0.272 + g * 0.534 + b * 0.131) / 3;
        r = Math.min(255, newR + 40);
        g = Math.min(255, newG + 20);
        b = Math.min(255, newB);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  resetBtn.addEventListener('click', resetFilters);

  function resetFilters() {
    filters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      grayscale: false,
      invert: false,
      sepia: false,
    };

    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    saturationSlider.value = 100;
    hueSlider.value = 0;
    blurSlider.value = 0;

    document.getElementById('brightness-value').textContent = '100';
    document.getElementById('contrast-value').textContent = '100';
    document.getElementById('saturation-value').textContent = '100';
    document.getElementById('hue-value').textContent = '0';
    document.getElementById('blur-value').textContent = '0';

    grayscaleBtn.classList.remove('active');
    invertBtn.classList.remove('active');
    sepiaBtn.classList.remove('active');

    drawImage();
    showNotification('Filtros resetados');
  }

  downloadBtn.addEventListener('click', () => {
    downloadBtn.innerHTML = '<i class="fa-solid fa-spinner"></i> Baixando...';
    downloadBtn.disabled = true;

    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'imagem-editada.png';
      link.click();

      setTimeout(() => {
        downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Baixar';
        downloadBtn.disabled = false;
        showNotification('Imagem baixada com sucesso!');
      }, 800);
    });
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
