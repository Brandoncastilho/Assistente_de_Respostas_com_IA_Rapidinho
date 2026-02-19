# ⚡ Rápidinho - Assistente de Respostas com IA

**Rápidinho** é uma extensão para Google Chrome que utiliza a inteligência artificial do Google Gemini para analisar perguntas em sua tela e destacar a resposta correta instantaneamente.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange)

## 🚀 Funcionalidades

- **📸 Captura Inteligente**: Tira um print da aba atual e lê o texto da página para entender o contexto completo.
- **🧠 Múltiplos Modelos de IA**: Suporte para várias versões do Gemini:
  - Gemini 1.5 Flash (Rápido e eficiente)
  - Gemini 1.5 Pro (Maior raciocínio)
  - Gemini 1.5 Flash-8B (Super velocidade)
  - Modelos Customizados
- **✨ Destaque Visual**:
  - **Verde**: Resposta encontrada com exatidão no texto.
  - **Amarelo**: Resposta encontrada por aproximação (fuzzy match).
- **🔒 Privacidade**: Sua API Key é salva localmente no seu navegador. A comunicação é feita diretamente com a API do Google, sem servidores intermediários.

## 📦 Instalação

Como esta é uma extensão em desenvolvimento (unpacked), a instalação é manual:

1. **Baixe o código**:
   - Clone este repositório ou baixe o arquivo ZIP e extraia em uma pasta.
   ```bash
   git clone https://github.com/SEU_USUARIO/rapidinho.git
   ```

2. **Carregue no Chrome**:
   - Abra o navegador e digite `chrome://extensions` na barra de endereço.
   - No canto superior direito, ative o **Modo do desenvolvedor** (Developer mode).
   - Clique no botão **Carregar sem compactação** (Load unpacked).
   - Selecione a pasta onde você baixou/extraiu os arquivos do projeto.

3. **Pronto!** O ícone do ⚡ Rápidinho deve aparecer na sua barra de extensões.

## ⚙️ Configuração

Antes de usar, você precisa de uma API Key do Google Gemini:

1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Crie uma nova chave de API (Create API Key).
3. Abra a extensão **Rápidinho**.
4. Cole a chave no campo **Gemini API Key** e clique em **Salvar Key**.

## 🎮 Como Usar

1. Navegue até a página que contém a pergunta ou teste que deseja resolver.
2. Abra a extensão.
3. Escolha o **Modelo AI** (recomendado: *Gemini 1.5 Flash*).
4. Clique no botão **🔍 Ver e Resolver**.
5. Aguarde alguns segundos.
   - A resposta sugerida aparecerá no popup.
   - A resposta correspondente na página será destacada em **Verde**.

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend (AI)**: Google Gemini API (Multimodal: Visão + Texto)
- **Plataforma**: Chrome Extension Library (Manifest V3)

## 📝 Licença

Este projeto está sob a licença MIT. Sinta-se livre para contribuir ou modificar para uso pessoal.

---
*Desenvolvido com ⚡ para agilizar seus estudos.*
