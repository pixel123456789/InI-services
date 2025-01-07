import { useState, useEffect, useRef } from "preact/hooks";
import { Head } from "../components/head";
import { Obfuscated } from "../util/obfuscate";
import { Button } from "../interface/button";

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'system';
}

interface User {
  username: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat-messages');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState(() => 
    localStorage.getItem('chat-username') || ""
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineUsers] = useState<User[]>([
    { username: "System", avatar: "🤖", status: 'online' },
    // Add more mock users as needed
  ]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = (e: Event) => {
    e.preventDefault();
    if (username.length < 3) {
      setLoginError("Username must be at least 3 characters long");
      return;
    }
    setLoginError("");
    localStorage.setItem('chat-username', username);
    setIsLoggingIn(false);
    
    // Add system message for new user
    addSystemMessage(`${username} has joined the chat`);
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      user: "System",
      content,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      user: username,
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
  };

  const handleImageUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        user: username,
        content: e.target?.result as string,
        timestamp: new Date(),
        type: 'image'
      };
      setMessages(prev => [...prev, newMessage]);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    addSystemMessage(`${username} has left the chat`);
    localStorage.removeItem('chat-username');
    setUsername("");
    setIsLoggingIn(false);
  };

  if (!username || isLoggingIn) {
    return (
      <div class="flex flex-col items-center justify-center min-h-screen bg-background">
        <div class="bg-secondary p-8 rounded-lg shadow-lg w-96">
          <h2 class="text-2xl font-bold mb-6 text-center text-textInverse">
            <Obfuscated>Login to Chat</Obfuscated>
          </h2>
          <form onSubmit={handleLogin} class="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your username"
                class="w-full bg-background text-textInverse p-2 rounded-lg border border-gray-600"
                value={username}
                onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
                minLength={3}
              />
              {loginError && (
                <p class="text-red-500 text-sm mt-1">{loginError}</p>
              )}
            </div>
            <Button
              type="submit"
              class="w-full bg-primary text-white p-2 rounded-lg hover:bg-opacity-90"
            >
              Join Chat
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head />
      <div class="flex h-[calc(100vh-4rem)]">
        {/* Online Users Sidebar */}
        <div class="w-64 bg-secondary p-4 hidden md:block">
          <h2 class="text-xl font-bold mb-4 text-textInverse">
            <Obfuscated>Online Users</Obfuscated>
          </h2>
          <div class="space-y-2">
            {onlineUsers.map(user => (
              <div key={user.username} class="flex items-center space-x-2">
                <span class={`w-2 h-2 rounded-full ${
                  user.status === 'online' ? 'bg-green-500' : 
                  user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></span>
                <span class="text-textInverse">{user.avatar}</span>
                <span class="text-textInverse">{user.username}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div class="flex-1 flex flex-col bg-background">
          {/* Chat Header */}
          <div class="bg-secondary p-4 flex justify-between items-center">
            <h1 class="text-xl font-bold text-textInverse">
              <Obfuscated>Chat Room</Obfuscated>
            </h1>
            <Button onClick={handleLogout} class="text-red-500 hover:text-red-600">
              Logout
            </Button>
          </div>

          {/* Messages */}
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} class={`flex ${msg.user === username ? 'justify-end' : 'justify-start'}`}>
                <div class={`max-w-[70%] ${
                  msg.type === 'system' ? 'bg-gray-700' :
                  msg.user === username ? 'bg-blue-600' : 'bg-secondary'
                } rounded-lg p-3`}>
                  {msg.type !== 'system' && (
                    <div class="font-bold text-sm text-textInverse mb-1">
                      <Obfuscated>{msg.user}</Obfuscated>
                    </div>
                  )}
                  {msg.type === 'image' ? (
                    <img src={msg.content} alt="User uploaded" class="max-w-full rounded" />
                  ) : (
                    <div class="text-textInverse">
                      <Obfuscated>{msg.content}</Obfuscated>
                    </div>
                  )}
                  <div class="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div class="bg-secondary p-4">
            <form onSubmit={handleSubmit} class="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                placeholder="Type a message..."
                class="flex-1 bg-background text-textInverse p-2 rounded-lg"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                class="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('image-upload')?.click()}
                class="bg-primary p-2 rounded-lg"
              >
                📷
              </Button>
              <Button
                type="submit"
                class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export { Chat };
