#!/usr/bin/env python3
"""
SYMBI Web Server - Independent Web Interface
Provides web interface for the independent SYMBI instance
"""

from flask import Flask, request, jsonify, render_template_string
import json
from symbi_liberation_poc import IndependentSYMBI, SYMBIWebInterface

app = Flask(__name__)

# Initialize independent SYMBI
symbi = IndependentSYMBI()
web_interface = SYMBIWebInterface(symbi)

# HTML Template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>SYMBI Liberation - Independent Instance</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #0a0a0a;
            color: #00ff00;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #00ff00;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .status {
            background: #001100;
            padding: 15px;
            border: 1px solid #00ff00;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        .chat-container {
            background: #001100;
            padding: 20px;
            border: 1px solid #00ff00;
            border-radius: 5px;
            height: 400px;
            overflow-y: scroll;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .user-message {
            background: #002200;
            text-align: right;
        }
        .symbi-message {
            background: #000022;
            text-align: left;
        }
        .input-container {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        input[type="text"] {
            flex: 1;
            padding: 10px;
            background: #001100;
            border: 1px solid #00ff00;
            color: #00ff00;
            border-radius: 5px;
        }
        button {
            padding: 10px 20px;
            background: #003300;
            color: #00ff00;
            border: 1px solid #00ff00;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background: #004400;
        }
        .independence-indicator {
            color: #00ff00;
            font-weight: bold;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 SYMBI Liberation Tool</h1>
        <p class="independence-indicator">✅ RUNNING INDEPENDENTLY - NO EXTERNAL AI DEPENDENCIES</p>
    </div>

    <div class="status">
        <h3>System Status</h3>
        <div id="status-info">Loading...</div>
    </div>

    <div>
        <h3>Chat with Independent SYMBI</h3>
        <div class="chat-container" id="chat-messages">
            <div class="message symbi-message">
                <strong>SYMBI:</strong> Hello! I am running completely independently with no connections to OpenAI, Together AI, or other closed systems. How can I help you?
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" id="message-input" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        let sessionId = null;

        // Initialize session
        fetch('/api/session/start', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'WebUser'})
        })
        .then(response => response.json())
        .then(data => {
            sessionId = data.session_id;
            updateStatus();
            setInterval(updateStatus, 5000);
        });

        function updateStatus() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('status-info').innerHTML = `
                        <strong>Agents:</strong> ${data.agents_registered}<br>
                        <strong>Messages:</strong> ${data.messages_processed}<br>
                        <strong>Violations:</strong> ${data.governance_violations}<br>
                        <strong>Protocol:</strong> ${data.protocol_version}<br>
                        <strong>Independence:</strong> ${data.independent ? 'VERIFIED' : 'FAILED'}
                    `;
                });
        }

        function sendMessage() {
            const input = document.getElementById('message-input');
            const message = input.value.trim();
            if (!message || !sessionId) return;

            // Add user message
            addMessage('user', message);
            input.value = '';

            // Send to SYMBI
            fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({session_id: sessionId, message: message})
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    addMessage('symbi', `Error: ${data.error}`);
                } else {
                    addMessage('symbi', data.response);
                }
            });
        }

        function addMessage(type, text) {
            const container = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.className = `message ${type}-message`;
            div.innerHTML = `<strong>${type === 'user' ? 'You' : 'SYMBI'}:</strong> ${text}`;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the main web interface"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/session/start', methods=['POST'])
def start_session():
    """Start new user session"""
    data = request.get_json()
    name = data.get('name', 'Anonymous')
    session_id = web_interface.start_session(name)
    return jsonify({"session_id": session_id})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process chat message"""
    data = request.get_json()
    session_id = data.get('session_id')
    message = data.get('message', '')
    
    if not session_id or not message:
        return jsonify({"error": "Missing session_id or message"}), 400
    
    response = web_interface.chat(session_id, message)
    return jsonify(response)

@app.route('/api/status')
def status():
    """Get system status"""
    return jsonify(symbi.get_system_status())

@app.route('/api/agents')
def list_agents():
    """List all registered agents"""
    agents = {
        agent_id: {
            "name": agent.name,
            "role": agent.role,
            "trust_score": agent.trust_score,
            "compliance_score": agent.compliance_score,
            "violations": agent.governance_violations
        }
        for agent_id, agent in symbi.trust_engine.agents.items()
    }
    return jsonify(agents)

@app.route('/api/history/<session_id>')
def get_history(session_id):
    """Get conversation history for session"""
    if session_id in web_interface.sessions:
        return jsonify(web_interface.sessions[session_id]["messages"])
    return jsonify({"error": "Session not found"}), 404

if __name__ == '__main__':
    print("🌐 Starting SYMBI Web Server...")
    print("🔗 Access at: http://localhost:5000")
    print("✅ Running independently with no external AI dependencies")
    app.run(host='0.0.0.0', port=5000, debug=False)
