# 🚀 Setup Rápido - Conversor Universal

## ⚡ 3 Passos para Começar

### 1️⃣ Instalar dependências
```bash
npm install
```

### 2️⃣ Rodar desenvolvimento
```bash
npm run dev
```
Abra **http://localhost:5173** no navegador.

### 3️⃣ Build para produção
```bash
npm run build
```
Arquivos prontos em `/dist`

---

## 🎯 Próximos Passos

### 📦 Publicar no GitHub Pages

1. **Faça o build:**
   ```bash
   npm run build
   ```

2. **Adicione os arquivos:**
   ```bash
   git add dist README.md
   git commit -m "Deploy: Production build"
   git push origin main
   ```

3. **Configure GitHub Pages:**
   - Vá para Settings → Pages
   - Branch: main
   - Pasta: /(root) ou /docs
   - Salve

4. **Acesse:**
   ```
   https://seu-usuario.github.io/Conversor
   ```

---

## 🛠️ Verificar a Instalação

```bash
# Verificar Node version (deve ser 18+)
node --version

# Verificar npm
npm --version

# Verificar dependências instaladas
npm list vue vue-router
```

---

## 📝 Editar e Testar

### Modificar uma ferramenta:
```bash
# Editar arquivo
nano src/views/tools/ImageCompressorView.vue

# Dev server detecta mudanças automaticamente ✅
```

### Adicionar nova ferramenta:
1. Crie `src/views/tools/MeuEditorView.vue`
2. Adicione em `src/data/toolsRegistry.ts`
3. Pronto! Aparece automaticamente no hub

### Testar build:
```bash
npm run build
npm run preview
```

---

## 🐛 Troubleshooting

**Erro: "Cannot find module @"**
→ Verifique `vite.config.ts` tem `resolve.alias`

**Port 5173 em uso**
```bash
npm run dev -- --port 3000
```

**Drag-drop não funciona**
→ Cheque se está usando `FileDropZone` component

**Áudio não funciona**
→ Verifique lamejs CDN no `index.html`

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `package.json` | Dependências e scripts |
| `vite.config.ts` | Build configuration |
| `tsconfig.json` | TypeScript config |
| `src/main.ts` | Entrada da app |
| `src/data/toolsRegistry.ts` | Lista de ferramentas |
| `src/router/index.ts` | Rotas |

---

## 🎨 Customizar Tema

Edite `src/assets/global.css`:

```css
:root {
  --gradient: linear-gradient(135deg, #8ab4f8, #c58af9, #f48aub);
  --bg-color: #121212;
  --accent-color: #8ab4f8;
  /* ... */
}
```

---

## ✅ Checklist antes de Deploy

- [ ] `npm run build` sem erros
- [ ] `npm run preview` funciona
- [ ] Testou todas as 8 ferramentas
- [ ] Nenhuma ferramenta quebrada
- [ ] README.md atualizado
- [ ] Commit feito com mensagem clara

---

## 💡 Dicas

- Use `npm run dev` para desenvolvimento
- Faça commits frequentes
- Teste no navegador antes de fazer push
- Use ESC para fechar modais
- Drag-drop funciona em todas as ferramentas

---

## 🚀 Tudo Pronto!

Seu site Conversor Universal está 100% funcional.

**Bom desenvolvimento! 🎉**
