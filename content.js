// Content script to highlight answers
console.log("Rápidinho content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "HIGHLIGHT_ANSWER") {
        const answerText = request.answer;
        if (answerText) {
            console.log("Received answer to highlight:", answerText);
            highlightTextInDOM(answerText);
            sendResponse({ status: "success" });
        }
    } else if (request.action === "GET_PAGE_TEXT") {
        // Return the visible text of the page for context
        sendResponse({ text: document.body.innerText });
    }
    return true; // Keep channel open for async response
});

function highlightTextInDOM(text) {
    if (!text) return;

    console.log("Attempting to highlight:", text);
    removeHighlights();

    // Strategy 1: exact window.find (User-like search)
    // We reset selection first
    window.getSelection().removeAllRanges();

    // Clean up the text slightly for search (trim)
    const searchStr = text.trim();

    // window.find(aString, bCaseSensitive, cBackwards, dWrapAround, eWholeWord, fSearchInFrames, gShowDialog);
    const found = window.find(searchStr, false, false, true, false, false, false);

    if (found) {
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement("span");
                span.style.backgroundColor = "#2ecc71";
                span.style.color = "#000";
                span.style.fontWeight = "bold";
                span.style.border = "2px solid #27ae60"; // Make it pop
                span.style.borderRadius = "4px";
                span.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.8)";
                span.className = "rapidinho-highlight";

                range.surroundContents(span);
                span.scrollIntoView({ behavior: "smooth", block: "center" });

                // Clear selection so it looks just like a highlight
                selection.removeAllRanges();
                return true; // Success
            }
        } catch (e) {
            console.error("Highlight error:", e);
        }
    }

    // Strategy 2: If exact match failed, try to find the text nodes manually (Fuzzy fallback)
    // This helps if the answer has slightly different whitespace or formatting
    console.log("Exact match not found, trying fuzzy match...");
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    const normalizedTarget = searchStr.toLowerCase().replace(/\s+/g, ' ');
    let fuzzyFound = false;

    while ((node = walker.nextNode())) {
        const nodeText = node.nodeValue.replace(/\s+/g, ' ').toLowerCase();
        if (nodeText.includes(normalizedTarget) && normalizedTarget.length > 3) {
            const span = document.createElement("span");
            span.style.backgroundColor = "#f1c40f"; // Yellow for fuzzy/partial
            span.style.color = "#000";
            span.className = "rapidinho-highlight";

            try {
                const parent = node.parentNode;
                if (parent && !parent.classList.contains("rapidinho-highlight")) {
                    // Simple text replace for the highlight
                    // Note: This replaces the WHOLE node content with the highlight if strictly matched
                    // which is risky. Safer to just background the parent.
                    parent.style.backgroundColor = "rgba(241, 196, 15, 0.3)";
                    parent.style.border = "2px dashed #f1c40f";
                    parent.classList.add("rapidinho-highlight-container");
                    parent.scrollIntoView({ behavior: "smooth", block: "center" });
                    fuzzyFound = true;
                }
            } catch (e) { console.error(e); }
        }
    }

    if (!found && !fuzzyFound) {
        alert("⚠️ RÁPIDINHO: A IA encontrou a resposta, mas não consegui achar o texto na página.\n\nResposta: " + text);
    }
}

function removeHighlights() {
    const highlights = document.querySelectorAll(".rapidinho-highlight");
    highlights.forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(el.firstChild, el);
        parent.normalize();
    });

    const containerHighlights = document.querySelectorAll(".rapidinho-highlight-container");
    containerHighlights.forEach(el => {
        el.style.border = "";
        el.style.backgroundColor = "";
        el.classList.remove("rapidinho-highlight-container");
    });
}
