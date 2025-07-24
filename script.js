document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Carregar o Header Reutilizável ---
  // Determina o caminho para a pasta de templates
  const templatePath = window.location.pathname.includes("/pages/")
    ? "../templates/header.html"
    : "./templates/header.html";

  fetch(templatePath)
    .then((response) => response.text())
    .then((data) => {
      const headerPlaceholder = document.getElementById("header-placeholder");
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = data;
        // Após carregar o header, executa as funções de navegação
        setupNavigation();
        setupDropdown();
      }
    });

  // --- 2. Marcar o Link Ativo na Navegação ---
  function setupNavigation() {
    // Pega o caminho completo da URL atual (ex: "/pages/image-converter.html")
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".main-nav .nav-link");

    navLinks.forEach((link) => {
      // Compara o caminho da URL com o href do link
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");

        // Se o link ativo estiver em um dropdown, marca o gatilho também
        const dropdownTrigger = link
          .closest(".dropdown")
          ?.querySelector(".nav-trigger");
        if (dropdownTrigger) {
          dropdownTrigger.classList.add("active"); // Você pode criar uma classe 'active' para o span se quiser
        }
      }
    });
  }

  // --- 3. Controlar o Menu Dropdown ---
  function setupDropdown() {
    const dropdown = document.querySelector(".dropdown");
    if (dropdown) {
      const trigger = dropdown.querySelector(".nav-trigger");
      const menu = dropdown.querySelector(".dropdown-menu");
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
      });
      document.addEventListener("click", () => menu.classList.remove("show"));
      menu.addEventListener("click", (e) => e.stopPropagation());
    }
  }

  // --- 4. Lógica Específica da Página de Conversão de Imagens ---
  const imageConverterCard = document.getElementById("imageConverterCard");
  if (imageConverterCard) {
    // ... (código do conversor de imagem que você já tem) ...
    // ... (exatamente a mesma lógica da versão anterior) ...
    const imageInput = document.getElementById("imageInput");
    const fileNameSpan = document.getElementById("fileName");
    const formatSelect = document.getElementById("formatSelect");
    const convertBtn = document.getElementById("action-btn");

    imageInput.addEventListener("change", (e) => {
      fileNameSpan.textContent = e.target.files[0]
        ? e.target.files[0].name
        : "";
    });

    convertBtn.addEventListener("click", () => {
      const selectedFile = imageInput.files[0];
      if (!selectedFile) {
        alert("Por favor, selecione uma imagem primeiro!");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const format = formatSelect.value;
          const dataUrl = canvas.toDataURL(`image/${format}`);
          const downloadLink = document.createElement("a");
          downloadLink.href = dataUrl;
          downloadLink.download =
            selectedFile.name.split(".").slice(0, -1).join(".") + `.${format}`;
          downloadLink.click();
        };
      };
    });
  }

  const youtubeDownloaderCard = document.getElementById(
    "youtubeDownloaderCard"
  );
  if (youtubeDownloaderCard) {
    // ####################################################################
    // ## COLE A URL DA SUA API DO RENDER AQUI                           ##
    // ####################################################################
    const API_BASE_URL = "https://youtube-download-api-lzcm.onrender.com"; // <-- MUDE AQUI!

    const actionBtn = document.getElementById("action-btn");
    const resultsArea = document.getElementById("resultsArea");
    const downloadBtn = document.getElementById("downloadBtn");
    let originalYoutubeUrl = ""; // Vamos guardar a URL original aqui

    // Evento para o botão "Analisar Link"
    actionBtn.addEventListener("click", async () => {
      const youtubeUrlInput = document.getElementById("youtubeUrl").value;
      if (
        !youtubeUrlInput.includes("youtube.com") &&
        !youtubeUrlInput.includes("youtu.be")
      ) {
        alert("Por favor, insira um link válido do YouTube.");
        return;
      }

      // Guarda a URL para usar no download depois
      originalYoutubeUrl = youtubeUrlInput;

      actionBtn.disabled = true;
      actionBtn.textContent = "Analisando...";
      resultsArea.style.display = "none";

      try {
        // Chama o endpoint /info da SUA API para pegar os detalhes do vídeo
        const infoUrl = `${API_BASE_URL}/info?url=${encodeURIComponent(
          originalYoutubeUrl
        )}`;
        const response = await fetch(infoUrl);

        if (!response.ok) {
          throw new Error(
            "Não foi possível obter as informações do vídeo. Verifique o link ou a API."
          );
        }

        const data = await response.json();

        // Popula a área de resultados com as informações recebidas
        document.getElementById("videoThumbnail").src =
          data.videoDetails.thumbnails[3]?.url ||
          data.videoDetails.thumbnails[0].url;
        document.getElementById("videoTitle").textContent =
          data.videoDetails.title;
        resultsArea.style.display = "block";
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        actionBtn.disabled = false;
        actionBtn.textContent = "Analisar Link";
      }
    });

    // Evento para o botão "Baixar Agora"
    downloadBtn.addEventListener("click", () => {
      if (!originalYoutubeUrl) {
        alert("Um erro ocorreu. Por favor, analise o link novamente.");
        return;
      }

      const downloadType = document.querySelector(
        'input[name="downloadType"]:checked'
      ).value;
      let downloadUrl = "";

      if (downloadType === "video") {
        // Constrói a URL de download para VÍDEO
        downloadUrl = `${API_BASE_URL}/download?url=${encodeURIComponent(
          originalYoutubeUrl
        )}`;
      } else {
        // Constrói a URL de download para ÁUDIO
        downloadUrl = `${API_BASE_URL}/mp3?url=${encodeURIComponent(
          originalYoutubeUrl
        )}`;
      }

      // A maneira mais simples de iniciar um download a partir de uma API
      // é simplesmente redirecionar a janela para a URL de download.
      // O navegador irá interceptar e iniciar o download do arquivo.
      console.log(`Iniciando download de: ${downloadUrl}`);
      window.location.href = downloadUrl;
    });
  }

  // --- 6. Lógica da Página de Cortador de Áudio ---
  const audioCutterCard = document.getElementById("audioCutterCard");
  if (audioCutterCard) {
    const audioInput = document.getElementById("audioInput");
    const fileNameSpan = document.getElementById("fileName");
    const loadingIndicator = document.getElementById("loading-indicator");
    const controls = document.getElementById("controls");
    const playBtn = document.getElementById("playBtn");
    const previewBtn = document.getElementById("previewBtn");
    const cutBtn = document.getElementById("action-btn");
    const startTimeInput = document.getElementById("startTime");
    const endTimeInput = document.getElementById("endTime");

    // Helper para formatar o tempo
    const formatTime = (seconds) =>
      new Date(seconds * 1000).toISOString().slice(14, 23);

    // Inicializa o WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      waveColor: "rgba(200, 200, 200, 0.5)",
      progressColor: "rgba(138, 180, 248, 0.8)",
      cursorColor: "#fff",
      barWidth: 3,
      barRadius: 3,
      height: 128,
      plugins: [RegionsPlugin.create()],
    });

    let activeRegion = null;

    // Lógica quando um arquivo é carregado
    audioInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        fileNameSpan.textContent = file.name;
        controls.style.display = "none";
        loadingIndicator.style.display = "block";
        wavesurfer.load(URL.createObjectURL(file));
      }
    });

    // Quando o áudio estiver pronto e desenhado
    wavesurfer.on("ready", (duration) => {
      loadingIndicator.style.display = "none";
      controls.style.display = "block";

      // Remove regiões antigas e cria uma nova
      wavesurfer.regions.clear();
      activeRegion = wavesurfer.regions.add({
        start: duration * 0.1, // Começa em 10%
        end: duration * 0.7, // Termina em 70%
        color: "rgba(138, 180, 248, 0.2)",
        drag: true,
        resize: true,
      });

      startTimeInput.value = formatTime(activeRegion.start);
      endTimeInput.value = formatTime(activeRegion.end);
    });

    // Atualiza os inputs de tempo quando a região muda
    wavesurfer.on("region-updated", (region) => {
      activeRegion = region;
      startTimeInput.value = formatTime(region.start);
      endTimeInput.value = formatTime(region.end);
    });

    // Lógica dos botões
    playBtn.onclick = () => wavesurfer.playPause();
    previewBtn.onclick = () => {
      if (activeRegion) {
        activeRegion.play();
      }
    };

    // A MÁGICA DO CORTE
    cutBtn.onclick = async () => {
      if (!activeRegion) return;

      cutBtn.textContent = "Processando...";
      cutBtn.disabled = true;

      const originalBuffer = wavesurfer.getDecodedData();
      const sampleRate = wavesurfer.options.sampleRate;
      const start = activeRegion.start;
      const end = activeRegion.end;

      const startIndex = Math.floor(start * sampleRate);
      const endIndex = Math.floor(end * sampleRate);
      const newLength = endIndex - startIndex;

      // Cria um novo AudioBuffer para o trecho cortado
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const newBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        newLength,
        sampleRate
      );

      // Copia os dados do trecho para o novo buffer
      for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
        newBuffer.copyToChannel(
          originalBuffer.getChannelData(i).slice(startIndex, endIndex),
          i
        );
      }

      // Converte o buffer para um arquivo WAV e inicia o download
      const wavBlob = bufferToWave(newBuffer);
      const downloadUrl = URL.createObjectURL(wavBlob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `cortado_${fileNameSpan.textContent.replace(
        /\.[^/.]+$/,
        ""
      )}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      cutBtn.textContent = "✂️ Cortar e Baixar";
      cutBtn.disabled = false;
    };

    // Função para converter um AudioBuffer para o formato WAV (Blob)
    function bufferToWave(abuffer) {
      let numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i,
        sample,
        offset = 0,
        pos = 0;

      // Escreve o cabeçalho WAV
      setUint32(0x46464952); // "RIFF"
      setUint32(length - 8); // file length - 8
      setUint32(0x45564157); // "WAVE"
      setUint32(0x20746d66); // "fmt " chunk
      setUint32(16); // length = 16
      setUint16(1); // PCM (uncompressed)
      setUint16(numOfChan);
      setUint32(abuffer.sampleRate);
      setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
      setUint16(numOfChan * 2); // block-align
      setUint16(16); // 16-bit
      setUint32(0x61746164); // "data" - chunk
      setUint32(length - pos - 4); // data length

      // Escreve os dados de áudio intercalados
      for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

      while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
          sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
          sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
          view.setInt16(pos, sample, true); // write 16-bit sample
          pos += 2;
        }
        offset++;
      }

      return new Blob([view], { type: "audio/wav" });

      function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
      }

      function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
      }
    }
  }
});
