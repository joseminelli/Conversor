// js/image-converter.js
const imageConverterCard = document.getElementById("imageConverterCard");
if (imageConverterCard) {
    const imageInput = document.getElementById("imageInput");
    const fileNameSpan = document.getElementById("fileName");
    const formatSelect = document.getElementById("formatSelect");
    const convertBtn = document.getElementById("action-btn");

    if (convertBtn) {
        imageInput.addEventListener("change", (e) => {
            fileNameSpan.textContent = e.target.files[0] ? e.target.files[0].name : "Nenhum arquivo selecionado";
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
                    downloadLink.download = selectedFile.name.split(".").slice(0, -1).join(".") + `.${format}`;
                    downloadLink.click();
                };
            };
        });
    }
}