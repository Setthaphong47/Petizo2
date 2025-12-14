// Chat Popup Functionality
let isChatOpen = false;

function toggleChat() {
    const popup = document.getElementById('chat-popup');
    const widget = document.getElementById('chat-widget');
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        popup.style.display = 'flex';
        widget.classList.add('open');
        document.getElementById('chat-input-field').focus();
    } else {
        popup.style.display = 'none';
        widget.classList.remove('open');
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-field');
    const message = input.value.trim();
    
    if (message === '') return;
    
    const messages = document.getElementById('chat-messages');
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = message;
    messages.appendChild(userMessage);
    
    // Clear input
    input.value = '';
    
    // Auto scroll to bottom
    messages.scrollTop = messages.scrollHeight;
    
    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message ai-message loading';
    loadingMessage.textContent = 'กำลังพิมพ์...';
    messages.appendChild(loadingMessage);
    
    // Send message to backend API
    const token = localStorage.getItem('token');
    
    // Prepare headers - include token only if available
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message })
    })
    .then(async r => {
        if (!r.ok) {
            const data = await r.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(data.error || data.details || `HTTP ${r.status}`);
        }
        return r.json();
    })
    .then(data => {
        if (loadingMessage.parentNode) messages.removeChild(loadingMessage);

        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        
        // จัดรูปแบบข้อความให้สวยงาม
        let formattedText = data.response || 'ขออภัย ระบบไม่มีคำตอบจาก AI';
        
        // ลบ ** ออกและแปลงเป็น HTML
        formattedText = formattedText
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // แปลง **text** เป็น bold
            .replace(/\*(.+?)\*/g, '$1') // ลบ * เดี่ยวออก
            .replace(/\n\n/g, '</p><p>') // แปลงบรรทัดว่างเป็น paragraph
            .replace(/\n/g, '<br>') // แปลงขึ้นบรรทัดใหม่
            .replace(/^(.+)$/gm, function(match) { // จัดการลิสต์
                if (match.trim().match(/^\d+\./)) {
                    return match;
                }
                return match;
            });
        
        // ถ้าไม่มี paragraph tag ให้ครอบด้วย p
        if (!formattedText.includes('<p>')) {
            formattedText = '<p>' + formattedText + '</p>';
        } else {
            formattedText = '<p>' + formattedText + '</p>';
        }
        
        aiMessage.innerHTML = formattedText;
        messages.appendChild(aiMessage);
        messages.scrollTop = messages.scrollHeight;
    })
    .catch(err => {
        console.error('Chat fetch error:', err);
        if (loadingMessage.parentNode) messages.removeChild(loadingMessage);
        const errDiv = document.createElement('div');
        errDiv.className = 'message ai-message';
        errDiv.textContent = `ขอภัย เกิดข้อผิดพลาด: ${err.message}`;
        messages.appendChild(errDiv);
        messages.scrollTop = messages.scrollHeight;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    
    // Create chat popup HTML
    const chatPopup = document.createElement('div');
    chatPopup.innerHTML = `
        <div class="chat-widget" id="chat-widget">
            <div class="chat-button" onclick="toggleChat()">
                <img src="/icon/bot-assistant.png" alt="AI Chat Bot">
            </div>
            <div class="chat-popup" id="chat-popup">
                <div class="chat-header">
                    <span> AI CAT Chatbot</span>
                    <button class="close-chat" onclick="toggleChat()">×</button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message ai-message">
                        สวัสดีค่ะ! AI CAT ยินดีให้คำแนะนำการดูแลน้องแมวค่ะ 
                    </div>
                </div>
                <div class="chat-input">
                    <input type="text" id="chat-input-field" placeholder="พิมพ์คำถามเกี่ยวกับการดูแลแมว...">
                    <button onclick="sendChatMessage()" class="send-button">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    `;
    
    body.appendChild(chatPopup);

    // Add event listener for Enter key
    document.getElementById('chat-input-field').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
});