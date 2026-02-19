document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveKeyBtn = document.getElementById('saveKey');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const statusDiv = document.getElementById('status');
    const resultBox = document.getElementById('result');
    const answerText = document.getElementById('answerText');
    const modelSelect = document.getElementById('modelSelect');
    const customModelInput = document.getElementById('customModel');

    // Global error handler
    window.addEventListener('error', function (event) {
        if (statusDiv) {
            statusDiv.textContent = 'Erro de Script: ' + event.message;
            statusDiv.style.color = 'red';
            statusDiv.classList.remove('hidden');
        } else {
            document.body.innerHTML += `<div style="color:red">Erro Fatal: ${event.message}</div>`;
        }
    });

    // Check if running as a proper popup
    if (!chrome.runtime || !chrome.runtime.id) {
        document.body.innerHTML = '<div style="padding:20px; color:red; text-align:center;"><h3>⚠️ Modo Incorreto</h3><p>Você abriu o arquivo como uma página.</p><p>Por favor, clique no <b>ícone do raio (⚡)</b> na barra do Chrome para usar a extensão.</p></div>';
        return;
    }

    // Load saved settings
    chrome.storage.local.get(['geminiApiKey', 'geminiModel', 'customModel'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
        if (result.geminiModel) {
            modelSelect.value = result.geminiModel;
            if (result.geminiModel === 'custom') {
                customModelInput.classList.remove('hidden');
            }
        }
        if (result.customModel) {
            customModelInput.value = result.customModel;
        }
    });

    // Save API key
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            chrome.storage.local.set({ geminiApiKey: key }, () => {
                setStatus('API Key salva!', 'success');
                setTimeout(() => setStatus(''), 2000);
            });
        } else {
            setStatus('Por favor, insira uma chave válida.', 'error');
        }
    });

    // Toggle custom input and save selection
    modelSelect.addEventListener('change', () => {
        const value = modelSelect.value;
        if (value === 'custom') {
            customModelInput.classList.remove('hidden');
        } else {
            customModelInput.classList.add('hidden');
        }
        chrome.storage.local.set({ geminiModel: value });
    });

    const testKeyBtn = document.getElementById('testKey');
    const listModelsBtn = document.getElementById('listModelsBtn');

    // ... (rest of code)

    // List Models
    listModelsBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            setStatus('Insira a Key primeiro.', 'error');
            return;
        }

        setStatus('Buscando modelos disponíveis...', 'info');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ? data.error.message : response.statusText);
            }

            if (!data.models) {
                throw new Error("Nenhum modelo retornado pela API.");
            }

            // Filter models that support generation
            const availableModels = data.models.filter(m =>
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
            );

            if (availableModels.length === 0) {
                setStatus('Nenhum modelo compatível encontrado.', 'warning');
                return;
            }

            // Clear and repopulate dropdown
            modelSelect.innerHTML = '';
            availableModels.forEach(m => {
                const opt = document.createElement('option');
                // Remove 'models/' prefix for the value
                opt.value = m.name.replace('models/', '');
                opt.textContent = `${m.displayName} (${opt.value})`;
                modelSelect.appendChild(opt);
            });

            // Add custom option back
            const customOpt = document.createElement('option');
            customOpt.value = 'custom';
            customOpt.textContent = 'Outro (Digitar nome...)';
            modelSelect.appendChild(customOpt);

            chrome.storage.local.set({ geminiModel: modelSelect.value });
            setStatus(`Encontrados ${availableModels.length} modelos!`, 'success');

        } catch (e) {
            setStatus('Erro ao listar: ' + e.message, 'error');
        }
    });

    // Test API Key ...

    // Test API Key (Text only)
    testKeyBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        let model = modelSelect.value;

        if (model === 'custom') {
            model = customModelInput.value.trim();
        }

        if (!key) {
            setStatus('Insira uma Key para testar.', 'error');
            return;
        }

        if (!model) {
            setStatus('Selecione um modelo.', 'error');
            return;
        }

        setStatus(`Testando conexão com ${model}...`, 'info');
        try {
            // Using the selected model for the test
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Responda apenas 'OK' se estiver funcionando." }] }] })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error ? data.error.message : response.statusText;
                if (response.status === 404) {
                    throw new Error(`Modelo '${model}' não existe. Tente outro da lista.`);
                }
                throw new Error(`${response.status}: ${errorMsg}`);
            }

            setStatus('✅ Sucesso! O modelo funciona.', 'success');
        } catch (e) {
            setStatus('❌ Falha: ' + e.message, 'error');
        }
    });

    // Save custom model name ...

    // Analyze button click
    analyzeBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        let model = modelSelect.value;

        if (model === 'custom') {
            model = customModelInput.value.trim();
            if (!model) {
                setStatus('Digite o nome do modelo customizado.', 'error');
                return;
            }
        }

        if (!key) {
            setStatus('Configure sua API Key primeiro.', 'error');
            return;
        }

        // 1. Reset UI
        resultBox.classList.add('hidden');
        setStatus('Iniciando...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('file://')) {
                setStatus('Não é possível analisar esta página.', 'error');
                return;
            }

            // 2. Force inject content script (Robustness fix)
            setStatus('Preparando página...', 'info');
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (e) {
                console.warn("Injection warning:", e);
                // Continue anyway, might be already there or restricted
            }

            // 3. Get Page Text (Hybrid Mode)
            setStatus('Lendo página...', 'info');
            let pageText = "";
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_TEXT" });
                if (response && response.text) {
                    pageText = response.text.substring(0, 10000); // Limit to 10k chars to avoid token limits
                    console.log("Page text captured (" + pageText.length + " chars)");
                }
            } catch (e) {
                console.warn("Could not read page text:", e);
                // Continue with just image if text fails
            }

            // 4. Capture Screen
            setStatus('Capturando tela...', 'info');
            const screenshotUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 });

            // 5. Analyze
            setStatus(`Analisando (${model})...`, 'info');

            // Race with timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tempo limite excedido (15s)")), 15000)
            );

            const answer = await Promise.race([
                analyzeImage(screenshotUrl, pageText, key, model),
                timeoutPromise
            ]);

            if (answer) {
                // 6. Success UI
                setStatus('Respondido!', 'success');
                resultBox.classList.remove('hidden');
                answerText.textContent = answer;

                // 7. Highlight
                setStatus('Destacando resposta...', 'info');
                chrome.tabs.sendMessage(tab.id, { action: "HIGHLIGHT_ANSWER", answer: answer }, (response) => {
                    // Check for connection error
                    if (chrome.runtime.lastError) {
                        console.warn("Highlight msg failed:", chrome.runtime.lastError);
                        setStatus('Resposta encontrada! (Destaque falhou, veja abaixo)', 'warning');
                    } else if (response && response.status === "success") {
                        setStatus('Concluído! Veja o destaque verde.', 'success');
                    } else if (response && response.status === "not_found") {
                        setStatus('Texto não encontrado na página. Veja a resposta abaixo.', 'warning');
                    }
                });
            } else {
                setStatus('A IA não encontrou uma resposta clara.', 'error');
            }

        } catch (error) {
            console.error(error);
            setStatus('Erro: ' + error.message, 'error');
            if (error.message.includes("404")) {
                setStatus('Erro 404: Tente outro modelo (ex: Flash 001)', 'error');
            }
        }
    });

    function setStatus(msg, type = 'info') {
        statusDiv.textContent = msg;
        statusDiv.className = 'status-msg ' + type;
        if (type === 'error') statusDiv.style.color = '#e74c3c';
        else if (type === 'success') statusDiv.style.color = '#27ae60';
        else if (type === 'warning') statusDiv.style.color = '#f39c12';
        else statusDiv.style.color = '#666';
    }
});

async function analyzeImage(base64Image, pageText, apiKey, model) {
    // Remove data:image/jpeg;base64, prefix
    const base64Data = base64Image.split(',')[1];

    // Clean the key just in case
    const cleanKey = apiKey.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

    const promptText = `
        Imagem: Screenshot de uma prova.
        Texto da Página:
        """${pageText}"""

        Tarefa:
        1. Analise a imagem para entender a PERGUNTA e as ALTERNATIVAS.
        2. Identifique a alternativa CORRETA.
        3. Encontre o TEXTO EXATO dessa alternativa dentro do "Texto da Página" fornecido acima.
        4. Retorne APENAS esse texto exato.
        
        Regras:
        - NÃO explique.
        - NÃO coloque "A resposta é".
        - Se a alternativa for "b) Casa", e no texto da página estiver "Casa", retorne apenas "Casa".
        - Se não encontrar no texto, retorne o texto da imagem mesmo.
    `;

    const requestBody = {
        contents: [{
            parts: [
                { text: promptText },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Data
                    }
                }
            ]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
        const errorDetails = data.error ? `${data.error.code} - ${data.error.message}` : response.statusText;
        console.error("Gemini API Error:", data);

        if (response.status === 404) {
            throw new Error(`Modelo não encontrado (404). Detalhes: ${errorDetails}`);
        }
        throw new Error(`Erro API (${response.status}): ${errorDetails}`);
    }

    try {
        const text = data.candidates[0].content.parts[0].text;
        console.log("AI Answer:", text);
        return text ? text.trim() : null;
    } catch (e) {
        console.error("Error parsing response:", e);
        return null;
    }
}
