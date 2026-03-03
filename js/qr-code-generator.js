document.addEventListener('DOMContentLoaded', () => {
    const qrInput = document.getElementById('qr-input');
    const urlQrInput = document.getElementById('url-qr-input');
    const contactNameInput = document.getElementById('contact-name');
    const contactPhoneInput = document.getElementById('contact-phone');
    const contactEmailInput = document.getElementById('contact-email');
    const generateBtn = document.getElementById('generate-btn');
    const previewSection = document.getElementById('preview-section');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const downloadJpgBtn = document.getElementById('download-jpg-btn');
    const copyBtn = document.getElementById('copy-btn');
    const typeButtons = document.querySelectorAll('.type-btn');
    const sizeRadios = document.querySelectorAll('input[name="size"]');
    const darkColorInput = document.getElementById('qr-dark');
    const lightColorInput = document.getElementById('qr-light');

    let currentQRCode = null;
    let currentType = 'text';

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

    typeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            typeButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            currentType = btn.dataset.type;

            document.querySelectorAll('.input-type-content').forEach((el) => {
                el.style.display = 'none';
            });

            if (currentType === 'text') {
                document.getElementById('text-input').style.display = 'block';
            } else if (currentType === 'url') {
                document.getElementById('url-input').style.display = 'block';
            } else if (currentType === 'contact') {
                document.getElementById('contact-input').style.display = 'block';
            }
        });
    });

    generateBtn.addEventListener('click', generateQRCode);

    function getQRContent() {
        if (currentType === 'text') {
            return qrInput.value.trim();
        } else if (currentType === 'url') {
            return urlQrInput.value.trim();
        } else if (currentType === 'contact') {
            const name = contactNameInput.value.trim();
            const phone = contactPhoneInput.value.trim();
            const email = contactEmailInput.value.trim();

            let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
            if (name) vcard += `FN:${name}\n`;
            if (phone) vcard += `TEL:${phone}\n`;
            if (email) vcard += `EMAIL:${email}\n`;
            vcard += 'END:VCARD';

            return vcard;
        }
        return '';
    }

    function generateQRCode() {
        const content = getQRContent();
        if (!content) {
            showNotification('Por favor, preencha o conteúdo do QR Code', 'error');
            return;
        }

        generateBtn.innerHTML = '<i class="fa-solid fa-spinner"></i> Gerando...';
        generateBtn.disabled = true;

        const size = document.querySelector('input[name="size"]:checked').value;
        const darkColor = darkColorInput.value;
        const lightColor = lightColorInput.value;

        qrCodeContainer.innerHTML = '';

        const canvas = document.createElement('canvas');
        qrCodeContainer.appendChild(canvas);

        setTimeout(() => {
            try {
                const qr = new QRious({
                    element: canvas,
                    value: content,
                    size: parseInt(size),
                    foreground: darkColor,
                    background: lightColor,
                    level: 'M' 
                });

                canvas.style.maxWidth = '100%';
                canvas.style.height = 'auto';

                previewSection.style.opacity = '0';
                previewSection.style.display = 'block';
                previewSection.style.transition = 'opacity 0.4s ease';
                setTimeout(() => { previewSection.style.opacity = '1'; }, 10);

                generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar QR Code';
                generateBtn.disabled = false;
                showNotification('QR Code gerado com sucesso!');

            } catch (e) {
                console.error(e);
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar QR Code';
                showNotification('Erro ao gerar QR Code. Tente reduzir o texto.', 'error');
            }
        }, 300);
    }

    function processPreview() {
        previewSection.style.opacity = '0';
        previewSection.style.display = 'block';
        previewSection.style.transition = 'opacity 0.4s ease';
        setTimeout(() => { previewSection.style.opacity = '1'; }, 10);

        generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar QR Code';
        generateBtn.disabled = false;
        showNotification('QR Code gerado com sucesso!');

        setTimeout(() => {
            const canvas = qrCodeContainer.querySelector('canvas');
            if (canvas) {
                canvas.style.maxWidth = '100%';
                canvas.style.height = 'auto';
            }
        }, 100);
    }

    downloadPngBtn.addEventListener('click', () => {
        downloadQRCode('png');
    });

    downloadJpgBtn.addEventListener('click', () => {
        downloadQRCode('jpg');
    });

    function downloadQRCode(format) {
        const canvas = qrCodeContainer.querySelector('canvas');
        if (!canvas) return;

        const btn = format === 'png' ? downloadPngBtn : downloadJpgBtn;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner"></i> Baixando...';
        btn.disabled = true;

        const link = document.createElement('a');
        link.download = `qr-code.${format}`;

        if (format === 'png') {
            link.href = canvas.toDataURL('image/png');
        } else if (format === 'jpg') {
            const jpgCanvas = document.createElement('canvas');
            jpgCanvas.width = canvas.width;
            jpgCanvas.height = canvas.height;
            const ctx = jpgCanvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
            ctx.drawImage(canvas, 0, 0);

            link.href = jpgCanvas.toDataURL('image/jpeg', 0.95);
        }

        link.click();

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            showNotification(`QR Code baixado como ${format.toUpperCase()}!`);
        }, 800);
    }

    copyBtn.addEventListener('click', async () => {
        const canvas = qrCodeContainer.querySelector('canvas');
        if (!canvas) {
            showNotification('Gere um QR Code primeiro', 'error');
            return;
        }

        copyBtn.innerHTML = '<i class="fa-solid fa-spinner"></i> Copiando...';
        copyBtn.disabled = true;

        try {
            canvas.toBlob((blob) => {
                navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar para Clipboard';
                    copyBtn.disabled = false;
                    showNotification('QR Code copiado para a área de transferência!');
                }).catch(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar para Clipboard';
                    copyBtn.disabled = false;
                    showNotification('Erro ao copiar', 'error');
                });
            });
        } catch (err) {
            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar para Clipboard';
            copyBtn.disabled = false;
            showNotification('Erro ao copiar: ' + err, 'error');
        }
    });

    darkColorInput.addEventListener('change', generateQRCode);
    lightColorInput.addEventListener('change', generateQRCode);
    sizeRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (currentQRCode) generateQRCode();
        });
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
