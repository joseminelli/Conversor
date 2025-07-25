// /js/audio-converter.js
window.addEventListener('load', () => {
    const audioConverterCard = document.getElementById("audioConverterCard");
    if (!audioConverterCard) return;

    // --- Elementos da UI ---
    const uploadArea = document.getElementById("upload-area");
    const editorArea = document.getElementById("editor-area");
    const fileInput = document.getElementById("audio-file-input");
    const canvas = document.getElementById("waveform-canvas");
    const ctx = canvas.getContext('2d');
    const volumeSlider = document.getElementById("volume-slider");
    const volumeValue = document.getElementById("volume-value");
    const formatSelect = document.getElementById("format-select");
    const bitrateSection = document.getElementById("bitrate-section");
    const bitrateSelect = document.getElementById("bitrate-select");
    const processBtn = document.getElementById("process-btn");

    // --- Variáveis de Estado ---
    let audioContext;
    let audioBuffer = null;
    let originalFileName = '';

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        originalFileName = file.name;
        uploadArea.style.display = 'none';
        editorArea.classList.remove('hidden');
        
        // Reseta o slider de volume para o padrão
        volumeSlider.value = 100;
        volumeValue.textContent = '100%';

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Desenha a waveform inicial com 100% de volume
        drawWaveform(audioBuffer, 1.0);
    });

    // --- LISTENER DO SLIDER ATUALIZADO ---
    // Agora, ele também chama a função de redesenho
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        volumeValue.textContent = `${volumeSlider.value}%`;

        // Se um áudio já foi carregado, redesenha a waveform com o novo volume
        if (audioBuffer) {
            drawWaveform(audioBuffer, volume);
        }
    });
    
    formatSelect.addEventListener('change', () => {
        bitrateSection.style.display = formatSelect.value === 'mp3' ? 'flex' : 'none';
    });

    processBtn.addEventListener('click', async () => {
        // ... (esta função permanece a mesma da versão anterior)
        if (!audioBuffer) return;

        processBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
        processBtn.disabled = true;

        try {
            const volume = volumeSlider.value / 100;
            const offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = offlineContext.createGain();
            gainNode.gain.value = volume;
            source.connect(gainNode);
            gainNode.connect(offlineContext.destination);
            source.start();
            
            const processedBuffer = await offlineContext.startRendering();
            const format = formatSelect.value;
            let finalBlob;

            if (format === 'mp3') {
                const bitrate = parseInt(bitrateSelect.value, 10);
                finalBlob = encodeToMp3(processedBuffer, bitrate);
            } else {
                finalBlob = bufferToWave(processedBuffer);
            }
            
            const outputFileName = `${originalFileName.replace(/\.[^/.]+$/, "")}_editado.${format}`;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(finalBlob);
            a.download = outputFileName;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch(error) {
            console.error("Erro ao processar o áudio:", error);
            alert("Ocorreu um erro durante o processamento.");
        } finally {
            processBtn.innerHTML = '<i class="fa-solid fa-cogs"></i> Processar e Baixar';
            processBtn.disabled = false;
        }
    });

    // --- FUNÇÃO drawWaveform ATUALIZADA ---
    function drawWaveform(buffer, volume = 1.0) {
        let data = buffer.getChannelData(0); // Pega os dados originais

        // Se o volume for diferente de 100%, cria uma cópia modificada dos dados
        // APENAS para o desenho. O audioBuffer original não é alterado.
        if (volume !== 1.0) {
            const modifiedData = new Float32Array(data.length);
            for (let i = 0; i < data.length; i++) {
                // Multiplica cada amostra pelo fator de volume
                modifiedData[i] = data[i] * volume;
            }
            data = modifiedData; // Usa os dados modificados para desenhar
        }

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            ctx.beginPath();
            ctx.moveTo(i, amp + amp * min);
            ctx.lineTo(i, amp + amp * max);
            ctx.stroke();
        }
    }
    
    // ... (as funções encodeToMp3 e bufferToWave permanecem as mesmas)
    function encodeToMp3(audioBuffer, bitrate = 192) {
        if (typeof lamejs === 'undefined') {
            alert("Erro: A biblioteca de codificação MP3 (lamejs) não foi carregada.");
            return null;
        }
        const channels = audioBuffer.numberOfChannels;
        const mp3encoder = new lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, bitrate);
        const mp3Data = [];
        const pcmLeft = audioBuffer.getChannelData(0);
        const pcmRight = channels > 1 ? audioBuffer.getChannelData(1) : pcmLeft;
        const convert = (p) => {
            const buffer = new Int16Array(p.length);
            for (let i = 0; i < p.length; i++) {
                buffer[i] = p[i] * 32767.5;
            }
            return buffer;
        };
        const samplesLeft = convert(pcmLeft);
        const samplesRight = convert(pcmRight);
        const sampleBlockSize = 1152;
        for (let i = 0; i < samplesLeft.length; i += sampleBlockSize) {
            const leftChunk = samplesLeft.subarray(i, i + sampleBlockSize);
            let rightChunk = null;
            if (channels > 1) {
                rightChunk = samplesRight.subarray(i, i + sampleBlockSize);
            }
            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        return new Blob(mp3Data, { type: 'audio/mp3' });
    }

    function bufferToWave(abuffer) {
        let numOfChan = abuffer.numberOfChannels, length = abuffer.length * numOfChan * 2 + 44, buffer = new ArrayBuffer(length),
            view = new DataView(buffer), channels = [], i, sample, offset = 0, pos = 0;
        const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
        const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };
        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66); setUint32(16);
        setUint16(1); setUint16(numOfChan); setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
        for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true); pos += 2;
            }
            offset++;
        }
        return new Blob([view], { type: 'audio/wav' });
    }
});