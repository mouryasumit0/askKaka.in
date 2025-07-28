import { createClientAdmin } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
// import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  const supabaseAdmin = await createClientAdmin();
  try {
    const chatbotId = params.chatbotId.replace('.js', '')

    // Verify chatbot exists and is active
    const { data: chatbot, error } = await supabaseAdmin
      .from('chatbots')
      .select('status, name')
      .eq('id', chatbotId)
      .single()

    if (error || !chatbot || chatbot.status !== 'active') {
      return new NextResponse('// Chatbot not found or not active', {
        headers: { 'Content-Type': 'application/javascript' }
      })
    }

    const widgetScript = `
(function() {
  'use strict';
  
  const CHATBOT_ID = '${chatbotId}';
  const API_BASE = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}';
  const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);
  
  let isOpen = false;
  let messages = [];
  
  // Widget HTML template
  const widgetHTML = \`
    <div id="askkaka-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div id="askkaka-chat-bubble" style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="m12 3c5.514 0 10 3.476 10 7.747 0 4.272-4.486 7.748-10 7.748a13.05 13.05 0 0 1 -3.937-.617 9.028 9.028 0 0 1 -4.126 1.62c-.375.06-.753-.24-.753-.635 0-.219.116-.42.304-.533a6.743 6.743 0 0 0 1.365-1.04c-1.704-1.391-2.853-3.246-2.853-5.286 0-4.272 4.486-7.748 10-7.748z"/>
        </svg>
      </div>
      
      <div id="askkaka-chat-window" style="display: none; position: absolute; bottom: 80px; right: 0; width: 380px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; font-size: 16px;">${chatbot.name || 'Customer Support'}</div>
            <div style="font-size: 12px; opacity: 0.9;">We typically reply instantly</div>
          </div>
          <button id="askkaka-close-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>
        
        <div id="askkaka-messages" style="height: 350px; overflow-y: auto; padding: 16px; background: #f8fafc;">
          <div style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 16px;">
            👋 Hello! How can I help you today?
          </div>
        </div>
        
        <div style="padding: 16px; border-top: 1px solid #e2e8f0; background: white;">
          <div style="display: flex; gap: 8px;">
            <input id="askkaka-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 14px;" />
            <button id="askkaka-send-btn" style="padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Send</button>
          </div>
        </div>
      </div>
    </div>
  \`;
  
  // Initialize widget
  function initWidget() {
    // Prevent multiple instances
    if (document.getElementById('askkaka-widget')) {
      return;
    }
    
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // Event listeners
    document.getElementById('askkaka-chat-bubble').addEventListener('click', toggleChat);
    document.getElementById('askkaka-close-btn').addEventListener('click', closeChat);
    document.getElementById('askkaka-send-btn').addEventListener('click', sendMessage);
    document.getElementById('askkaka-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  function toggleChat() {
    const chatWindow = document.getElementById('askkaka-chat-window');
    const bubble = document.getElementById('askkaka-chat-bubble');
    
    if (isOpen) {
      closeChat();
    } else {
      chatWindow.style.display = 'block';
      bubble.style.transform = 'scale(0.9)';
      isOpen = true;
    }
  }
  
  function closeChat() {
    const chatWindow = document.getElementById('askkaka-chat-window');
    const bubble = document.getElementById('askkaka-chat-bubble');
    
    chatWindow.style.display = 'none';
    bubble.style.transform = 'scale(1)';
    isOpen = false;
  }
  
  function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('askkaka-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.style.cssText = \`
      margin-bottom: 12px;
      display: flex;
      \${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    \`;
    
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = \`
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
      \${isUser 
        ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-bottom-right-radius: 6px;' 
        : 'background: white; color: #1f2937; border: 1px solid #e2e8f0; border-bottom-left-radius: 6px;'
      }
    \`;
    
    messageBubble.textContent = content;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  async function sendMessage() {
    const input = document.getElementById('askkaka-input');
    const sendBtn = document.getElementById('askkaka-send-btn');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    input.value = '';
    
    // Show loading state
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
    
    try {
      const response = await fetch(\`\${API_BASE}/api/chat\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbot_id: CHATBOT_ID,
          message: message,
          session_id: SESSION_ID
        })
      });
      
      const data = await response.json();
      
      if (data.response) {
        addMessage(data.response);
      } else {
        addMessage('Sorry, I could not process your message. Please try again.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('Sorry, there was an error. Please try again later.');
    } finally {
      sendBtn.textContent = 'Send';
      sendBtn.disabled = false;
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();
`

    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Widget error:', error)
    return new NextResponse('// Error loading widget', {
      headers: { 'Content-Type': 'application/javascript' }
    })
  }
}