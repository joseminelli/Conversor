# Conversor Universal - Backend API

Backend em Python com FastAPI para download de conteúdo de YouTube, Instagram e TikTok.

## Instalação Local

### Pré-requisitos
- Python 3.11+
- FFmpeg (para processamento de áudio/vídeo)

### Setup

1. **Criar ambiente virtual:**
```bash
cd api
python -m venv venv

# No Windows:
venv\Scripts\activate

# No macOS/Linux:
source venv/bin/activate
```

2. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

3. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

4. **Rodar servidor local:**
```bash
uvicorn index:app --reload
```

Acesso em: `http://localhost:8000`
Documentação interativa: `http://localhost:8000/docs`

---

## Endpoints

### Health Check
- `GET /api/health` - Verificar status da API

### YouTube
- `POST /api/youtube/info` - Obter informações do vídeo
- `POST /api/youtube/download` - Gerar link de download
- `GET /api/youtube/formats` - Listar formatos disponíveis

### Instagram
- `POST /api/instagram/info` - Obter informações do post
- `POST /api/instagram/download` - Baixar conteúdo
- `GET /api/instagram/stories/{username}` - Obter stories

### TikTok
- `POST /api/tiktok/info` - Obter informações do vídeo
- `POST /api/tiktok/download` - Baixar vídeo/áudio
- `GET /api/tiktok/video/{video_id}` - Obter vídeo por ID

---

## Deploy no Vercel

1. **Conectar repositório no Vercel**
2. **Configurar variáveis de ambiente** na dashboard
3. **Deploy automático** a cada push

---

## Bibliotecas Utilizadas

- **FastAPI** - Framework web moderno
- **yt-dlp** - Download de YouTube (melhor que youtube-dl)
- **instagrapi** - API para Instagram
- **pydantic** - Validação de dados
- **python-dotenv** - Gerenciar variáveis de ambiente

---

## Status das Implementações

| Serviço | Status | Notas |
|---------|--------|-------|
| YouTube | ✅ Implementado | Usando yt-dlp |
| Instagram | 🔄 Em desenvolvimento | Requer autenticação |
| TikTok | 🔄 Em desenvolvimento | API limitada |

---

## Tratamento de Erros

Todos os endpoints retornam erros padronizados:

```json
{
  "detail": "Mensagem de erro descritiva"
}
```

Códigos de status:
- `200` - Sucesso
- `400` - Erro de requisição (URL inválida, etc)
- `500` - Erro do servidor

---

## Segurança

- CORS habilitado para o domínio do frontend
- Rate limiting (implementar em produção)
- Validação de entrada com Pydantic
- Timeouts configurados

---

## Desenvolvimento

Estrutura do projeto:
```
api/
├── index.py              # App principal FastAPI
├── routes/
│   ├── youtube.py       # Endpoints do YouTube
│   ├── instagram.py     # Endpoints do Instagram
│   └── tiktok.py        # Endpoints do TikTok
├── requirements.txt     # Dependências Python
├── .env.example         # Exemplo de variáveis
└── README.md           # Este arquivo
```

---

## Próximas Melhorias

- [ ] Autenticação do Instagram
- [ ] Suporte a TikTok API
- [ ] Cache de resultados
- [ ] Rate limiting
- [ ] Logs estruturados
- [ ] Testes unitários
- [ ] CI/CD pipeline

---

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
