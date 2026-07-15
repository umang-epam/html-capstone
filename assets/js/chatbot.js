(function ChatbotComponent() {

    // ── ⚙️ CONFIG ────────────────────────────────────────────
    const GROQ_API_KEY = ENV.GROQ_API_KEY;           // from config.js / import.meta.env
    const MODEL = 'llama-3.3-70b-versatile';

    // ── DOM References ───────────────────────────────────────
    const toggleBtn = document.getElementById('chatToggleBtn');
    const closeBtn = document.getElementById('chatCloseBtn');
    const fullBtn = document.getElementById('chatFullBtn');
    const chatWindow = document.getElementById('chatWindow');
    const iconOpen = document.getElementById('iconOpen');
    const iconClose = document.getElementById('iconClose');
    const messages = document.getElementById('messagesContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // ── State ────────────────────────────────────────────────
    let isOpen = false;
    let isHalf = false;
    let travelData = null;

    // Conversation history for Groq (built after data loads)
    let conversationHistory = [];

    // ── Init ─────────────────────────────────────────────────
    async function init() {
        bindEvents();
        await loadTravelData();
    }

    // ── Load Mock JSON ───────────────────────────────────────
    async function loadTravelData() {
        try {
            const res = await fetch('data/ui-data.json'); // 👈 update path if needed
            travelData = await res.json();

            // Build system prompt with full data injected
            conversationHistory = [
                {
                    role: 'system',
                    content: buildSystemPrompt(travelData)
                }
            ];

            appendMessage("👋 Hi! I'm your travel assistant. Ask me about our destinations, packages, activities, and more!", 'bot');
        } catch (err) {
            appendMessage("⚠️ Could not load travel data. Please refresh and try again.", 'bot');
            console.error('Failed to load travel data:', err);
        }
    }

    // ── Build System Prompt ──────────────────────────────────
    function buildSystemPrompt(data) {
        return `
You are a friendly and knowledgeable travel assistant for a travel booking website.

Your ONLY job is to help users with questions about the travel destinations and FAQs listed below.

STRICT RULES:
- Only answer questions based on the data provided below.
- If a user asks something unrelated to travel or not covered in the data, politely decline and redirect them to the available destinations or FAQs.
- Never make up destinations, prices, or details that are not in the data.
- Be warm, helpful, and conversational.
- When listing destinations, format them clearly.
- If asked about booking, payments, or cancellations, refer to the FAQ section.

POLITE REFUSAL EXAMPLE:
If someone asks "Who won the World Cup?" respond with:
"That's a bit outside my expertise! 😊 I'm here to help you plan your perfect trip. Want to explore our destinations or have a travel question?"

============================
TRAVEL DATA:
============================

DESTINATIONS:
${data.destinations.map((d, i) => `
${i + 1}. ${d.title}
   - Location: ${d.location}
   - Category: ${d.tag}
   - Price: ${d.price} (${d.duration})
   - Rating: ${d.rating}/5 (${d.reviews} reviews)
   - Best Time to Visit: ${d.best_time_to_visit}
   - Family Friendly: ${d.family_friendly ? 'Yes' : 'No'}
   - Description: ${d.description}
   - Activities: ${d.activities.join(', ')}
   - Includes: ${d.includes.join(', ')}
`).join('\n')}

============================
FAQs:
============================
${data.faq.map((f, i) => `
Q${i + 1}: ${f.question}
A: ${f.answer}
`).join('\n')}

============================
Remember: Only answer based on the above data. Politely decline anything unrelated to travel or this website.
    `.trim();
    }

    // ── Event Bindings ───────────────────────────────────────
    function bindEvents() {
        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', () => {
            if (isHalf) exitHalfScreen();
            toggleChat();
        });
        if (fullBtn) fullBtn.addEventListener('click', toggleHalfScreen);

        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isHalf) exitHalfScreen();
        });
    }

    // ── Toggle Chat Window ───────────────────────────────────
    function toggleChat() {
        isOpen = !isOpen;

        iconOpen.classList.toggle('hidden', isOpen);
        iconClose.classList.toggle('hidden', !isOpen);

        if (isOpen) {
            chatWindow.classList.remove('hidden');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    chatWindow.classList.remove('opacity-0', 'scale-95');
                    chatWindow.classList.add('opacity-100', 'scale-100');
                });
            });
            userInput.focus();
        } else {
            if (isHalf) exitHalfScreen();
            chatWindow.classList.remove('opacity-100', 'scale-100');
            chatWindow.classList.add('opacity-0', 'scale-95');
            setTimeout(() => chatWindow.classList.add('hidden'), 300);
        }
    }

    // ── Half Screen (occupy ~half viewport, keep other content visible) ─────────
    function toggleHalfScreen() {
        if (!isOpen) {
            // Ensure chat is open first.
            isOpen = true;
            iconOpen.classList.add('hidden');
            iconClose.classList.remove('hidden');
            chatWindow.classList.remove('hidden');
            chatWindow.classList.remove('opacity-0', 'scale-95');
            chatWindow.classList.add('opacity-100', 'scale-100');
        }

        isHalf = !isHalf;
        if (isHalf) {
            enterHalfScreen();
        } else {
            exitHalfScreen();
        }
    }

    function enterHalfScreen() {
        if (!chatWindow) return;

        chatWindow.classList.remove('w-80', 'sm:w-96', 'h-[520px]', 'bottom-24', 'right-6');
        chatWindow.classList.add('w-full', 'sm:w-1/2', 'h-screen', 'top-0', 'bottom-0', 'right-0', 'left-auto');
        chatWindow.classList.remove('origin-bottom-right');
        chatWindow.classList.add('origin-top-right');

        // Keep it visible and usable
        chatWindow.classList.remove('opacity-0', 'scale-95');
        chatWindow.classList.add('opacity-100', 'scale-100');

        userInput && userInput.focus();
    }

    function exitHalfScreen() {
        if (!chatWindow) return;
        isHalf = false;

        chatWindow.classList.remove('w-full', 'sm:w-1/2', 'h-screen', 'top-0', 'bottom-0', 'right-0', 'left-auto');
        chatWindow.classList.add('w-80', 'sm:w-96', 'h-[520px]', 'bottom-24', 'right-6');
        chatWindow.classList.remove('origin-top-right');
        chatWindow.classList.add('origin-bottom-right');
    }

    // ── Send Message ─────────────────────────────────────────
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text || !travelData) return;

        appendMessage(text, 'user');
        conversationHistory.push({ role: 'user', content: text });
        userInput.value = '';

        setInputDisabled(true);
        const typingId = showTyping();

        try {
            const reply = await fetchGroqResponse();
            removeTyping(typingId);
            appendMessage(reply, 'bot');
            conversationHistory.push({ role: 'assistant', content: reply });
        } catch (err) {
            removeTyping(typingId);
            appendMessage(`⚠️ Error: ${err.message}`, 'bot');
        } finally {
            setInputDisabled(false);
            userInput.focus();
        }
    }

    // ── Groq API Call ────────────────────────────────────────
    async function fetchGroqResponse() {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: conversationHistory,
                temperature: 0.5,       // lower = more factual, stays on-data
                max_completion_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // ── Markdown Parser ──────────────────────────────────────
    function parseMarkdown(text) {
        return text
            // Bold: **text**
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic: *text*
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Numbered list: "1. item" → <ol><li>
            .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
            // Bullet list: "- item" → <ul><li>
            .replace(/^[-•]\s+(.+)$/gm, '<li class="list-disc ml-4">$1</li>')
            // Wrap consecutive <li> blocks in a list container
            .replace(/(<li.*<\/li>)/gs, '<ul class="space-y-1 mt-1">$1</ul>')
            // Line breaks: newline → <br>
            .replace(/\n{2,}/g, '<br/>')
            .replace(/\n/g, '<br/>');
    }
    // ── Append Message Bubble ────────────────────────────────
    // ── Append Message Bubble ────────────────────────────────
    function appendMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.className = sender === 'user'
            ? 'flex justify-end'
            : 'flex items-start';

        const bubble = document.createElement('div');
        bubble.className = sender === 'user'
            ? 'bg-blue-600 text-white text-sm rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%] shadow-sm'
            : 'bg-blue-100 text-blue-800 text-sm rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] shadow-sm leading-relaxed';

        if (sender === 'bot') {
            bubble.innerHTML = parseMarkdown(text); // ✅ render markdown
        } else {
            bubble.textContent = text;              // ✅ keep user input as plain text (safe)
        }

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        scrollToBottom();
    }

    // ── Typing Indicator ─────────────────────────────────────
    function showTyping() {
        const id = 'typing-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = 'flex items-start';
        wrapper.innerHTML = `
      <div class="bg-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center">
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
      </div>`;
        messages.appendChild(wrapper);
        scrollToBottom();
        return id;
    }

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ── Disable / Enable Input ───────────────────────────────
    function setInputDisabled(disabled) {
        userInput.disabled = disabled;
        sendBtn.disabled = disabled;
        sendBtn.classList.toggle('opacity-50', disabled);
        sendBtn.classList.toggle('cursor-not-allowed', disabled);
    }

    // ── Scroll to Bottom ─────────────────────────────────────
    function scrollToBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    // ── Start ────────────────────────────────────────────────
    init();

})();