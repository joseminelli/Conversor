window.addEventListener('load', () => {
    const audioCutterCard = document.getElementById("audioCutterCard");
    if (!audioCutterCard) return;

    // --- Elementos da UI ---
    const uploadArea = document.getElementById("upload-area");
    const editorArea = document.getElementById("editor-area");
    const fileInput = document.getElementById("audio-file-input");
    const playBtn = document.getElementById("play-btn");
    const playBtnIcon = playBtn.querySelector('i');
    const markStartBtn = document.getElementById("mark-start-btn");
    const markEndBtn = document.getElementById("mark-end-btn");
    const previewBtn = document.getElementById('preview-btn');
    const cutBtn = document.getElementById("cut-btn");
    const currentTimeDisplay = document.getElementById("current-time");
    const totalTimeDisplay = document.getElementById("total-time");
    const canvas = document.getElementById("waveform-canvas");
    const ctx = canvas.getContext('2d');
    const playhead = document.getElementById('playhead');
    const waveformWrapper = document.getElementById('waveform-wrapper');

    // --- Variáveis de Estado do Áudio ---
    let audioContext;
    let audioBuffer = null;
    let sourceNode = null;
    let startTime = 0;
    let endTime = 0;
    let isPlaying = false;
    let playbackStartTime = 0;
    let startOffset = 0;
    let animationFrameId = null;

    const formatTime = (seconds) => new Date(seconds * 1000).toISOString().slice(14, 19);

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isPlaying) stopAudio();
        if (audioContext) audioContext.close();

        uploadArea.style.display = 'none';
        editorArea.classList.remove('hidden');
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        drawWaveform(audioBuffer, canvas, ctx);
        
        totalTimeDisplay.textContent = formatTime(audioBuffer.duration);
        resetControls();
        endTime = audioBuffer.duration;
    });

    function drawWaveform(buffer, canvas, context, startSec = 0, endSec = buffer.duration) {
        const data = buffer.getChannelData(0);
        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);

        const startPixel = (startSec / buffer.duration) * width;
        const endPixel = (endSec / buffer.duration) * width;
        
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            context.strokeStyle = (i >= startPixel && i <= endPixel) 
                ? '#a8c0ff' 
                : 'rgba(255, 255, 255, 0.3)';
            
            context.beginPath();
            context.moveTo(i, amp + amp * min);
            context.lineTo(i, amp + amp * max);
            context.stroke();
        }
    }

    // --- FUNÇÕES DE PLAYBACK CORRIGIDAS ---
    function playAudio(start, duration) {
        // Garante que qualquer áudio anterior seja parado
        if (isPlaying) {
            stopAudio();
        }
        
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioContext.destination);
        
        playbackStartTime = audioContext.currentTime;
        startOffset = start;

        sourceNode.start(0, start, duration);
        
        isPlaying = true;
        playBtnIcon.className = 'fa-solid fa-pause';
        playhead.style.opacity = '1';
        updatePlayhead();
        
        sourceNode.onended = () => {
            // Só executa a lógica de 'onended' se este for o nó de áudio ativo
            if (sourceNode === event.target) {
                isPlaying = false;
                playBtnIcon.className = 'fa-solid fa-play';
                cancelAnimationFrame(animationFrameId);
                const currentPlaybackTime = startOffset + (audioContext.currentTime - playbackStartTime);
                if (currentPlaybackTime >= (start + (duration || audioBuffer.duration)) - 0.01) {
                    playhead.style.opacity = '0';
                    startOffset = 0; // Reseta para o início quando termina
                }
            }
        };
    }
    
    function stopAudio() {
        if (sourceNode) {
            sourceNode.onended = null; // Remove o listener para evitar comportamento inesperado
            sourceNode.stop();
            sourceNode.disconnect();
            sourceNode = null;
        }
        startOffset = startOffset + (audioContext.currentTime - playbackStartTime); // Salva a posição
        isPlaying = false;
        playBtnIcon.className = 'fa-solid fa-play';
        cancelAnimationFrame(animationFrameId);
    }
    
    function updatePlayhead() {
        if (!isPlaying) return;
        const elapsedTime = audioContext.currentTime - playbackStartTime;
        const currentPlaybackTime = startOffset + elapsedTime;
        const percent = currentPlaybackTime / audioBuffer.duration;
        
        playhead.style.left = `${percent * 100}%`;
        currentTimeDisplay.textContent = formatTime(currentPlaybackTime);
        
        animationFrameId = requestAnimationFrame(updatePlayhead);
    }

    waveformWrapper.addEventListener('click', (e) => {
        if (!audioBuffer) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = clickX / rect.width;
        const newTime = percent * audioBuffer.duration;
        
        startOffset = newTime;
        playhead.style.left = `${percent * 100}%`;
        currentTimeDisplay.textContent = formatTime(newTime);
        
        if (isPlaying) {
            playAudio(newTime, audioBuffer.duration - newTime);
        }
    });

    playBtn.onclick = () => {
        if (!audioBuffer) return;
        if (isPlaying) {
            stopAudio();
        } else {
            playAudio(startOffset, audioBuffer.duration - startOffset);
        }
    };
    
    markStartBtn.onclick = () => {
        startTime = isPlaying ? startOffset + (audioContext.currentTime - playbackStartTime) : startOffset;
        markStartBtn.textContent = `Início: ${formatTime(startTime)}`;
        markStartBtn.classList.add('active');
        drawWaveform(audioBuffer, canvas, ctx, startTime, endTime);
        checkButtonsState();
    };

    markEndBtn.onclick = () => {
        const currentTime = isPlaying ? startOffset + (audioContext.currentTime - playbackStartTime) : startOffset;
        if (currentTime <= startTime) {
            alert("O tempo final deve ser maior que o tempo inicial.");
            return;
        }
        endTime = currentTime;
        markEndBtn.textContent = `Fim: ${formatTime(endTime)}`;
        markEndBtn.classList.add('active');
        drawWaveform(audioBuffer, canvas, ctx, startTime, endTime);
        checkButtonsState();
    };
    
    previewBtn.onclick = () => {
        playAudio(startTime, endTime - startTime);
    };

    function checkButtonsState() {
        if (endTime > startTime) {
            previewBtn.disabled = false;
            cutBtn.disabled = false;
        }
    }
    
    function resetControls() {
        startOffset = 0;
        startTime = 0;
        endTime = audioBuffer ? audioBuffer.duration : 0;
        isPlaying = false;
        playBtnIcon.className = 'fa-solid fa-play';
        markStartBtn.classList.remove('active');
        markEndBtn.classList.remove('active');
        markStartBtn.textContent = `[ Marcar Início`;
        markEndBtn.textContent = `Marcar Fim ]`;
        previewBtn.disabled = true;
        cutBtn.disabled = true;
        playhead.style.left = '0%';
        playhead.style.opacity = '0';
        currentTimeDisplay.textContent = formatTime(0);
    }

    cutBtn.onclick = () => {
        if (!audioBuffer || endTime <= startTime) {
            alert("Intervalo de corte inválido.");
            return;
        }

        cutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
        cutBtn.disabled = true;

        const sampleRate = audioBuffer.sampleRate;
        const startIndex = Math.floor(startTime * sampleRate);
        const endIndex = Math.floor(endTime * sampleRate);
        const newLength = endIndex - startIndex;

        const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const newBuffer = newAudioContext.createBuffer(audioBuffer.numberOfChannels, newLength, sampleRate);
        
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            newBuffer.copyToChannel(audioBuffer.getChannelData(i).slice(startIndex, endIndex), i);
        }
        
        const wavBlob = bufferToWave(newBuffer);
        const a = document.createElement('a');
        const originalFileName = fileInput.files[0]?.name || 'audio.wav';
        a.download = `cortado_${originalFileName.replace(/\.[^/.]+$/, "")}.wav`;
        a.href = URL.createObjectURL(wavBlob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        
        cutBtn.innerHTML = '<i class="fa-solid fa-scissors"></i> Cortar e Baixar';
        cutBtn.disabled = false;
    };

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