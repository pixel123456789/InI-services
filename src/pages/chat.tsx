import { useState, useEffect, useRef } from "preact/hooks";
import { Head } from "../components/head";
import { Obfuscated } from "../util/obfuscate";
import { Button } from "../interface/button";
import { useGlobalState } from "@ekwoka/preact-global-state";

// Types
interface User {
  id: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  avatar: string;
  lastSeen: Date;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'system' | 'reaction';
  reactions?: {
    [key: string]: string[]; // emoji: userId[]
  };
}

interface ChatState {
  users: User[];
  messages: Message[];
  typingUsers: string[];
}

// Chat Channel for real-time communication
const chatChannel = new BroadcastChannel('metallic/chat');

function Chat() {
  const [theme] = useGlobalState<string>(
    "theme",
    localStorage.getItem("metallic/theme") || "default"
  );
  
  const [chatState, setChatState] = useState<ChatState>(() => {
    const saved = localStorage.getItem('metallic/chat-state');
    return saved ? JSON.parse(saved) : {
      users: [],
      messages: [],
      typingUsers: []
    };
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('metallic/chat-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();

  // Handle real-time updates
  useEffect(() => {
    chatChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      setChatState(prevState => {
        const newState = { ...prevState };
        
        switch (type) {
          case 'NEW_MESSAGE':
            newState.messages = [...newState.messages, payload];
            break;
          case 'USER_JOIN':
            if (!newState.users.find(u => u.id === payload.id)) {
              newState.users = [...newState.users, payload];
            }
            break;
          case 'USER_LEAVE':
            newState.users = newState.users.filter(u => u.id !== payload.id);
            break;
          case 'TYPING_START':
            if (!newState.typingUsers.includes(payload)) {
              newState.typingUsers = [...newState.typingUsers, payload];
            }
            break;
          case 'TYPING_END':
            newState.typingUsers = newState.typingUsers.filter(id => id !== payload);
            break;
          case 'ADD_REACTION':
            const message = newState.messages.find(m => m.id === payload.messageId);
            if (message) {
              if (!message.reactions) message.reactions = {};
              if (!message.reactions[payload.emoji]) message.reactions[payload.emoji] = [];
              message.reactions[payload.emoji].push(payload.userId);
            }
            break;
        }

        localStorage.setItem('metallic/chat-state', JSON.stringify(newState));
        return newState;
      });
    };

    return () => chatChannel.close();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatState.messages]);

  // Handle user presence
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        chatChannel.postMessage({
          type: 'USER_UPDATE',
          payload: { ...currentUser, lastSeen: new Date() }
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogin = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    
    if (username.length < 3) return;

    const user: User = {
      id: Math.random().toString(36).substring(2),
      username,
      status: 'online',
      avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${username}`,
      lastSeen: new Date()
    };

    localStorage.setItem('metallic/chat-user', JSON.stringify(user));
    setCurrentUser(user);
    chatChannel.postMessage({ type: 'USER_JOIN', payload: user });
    
    // Add system message
    const systemMessage: Message = {
      id: Math.random().toString(36).substring(2),
      userId: 'system',
      username: 'System',
      content: `${username} has joined the chat`,
      timestamp: new Date(),
      type: 'system'
    };
    chatChannel.postMessage({ type: 'NEW_MESSAGE', payload: systemMessage });
  };

  const handleLogout = () => {
    if (!currentUser) return;

    const systemMessage: Message = {
      id: Math.random().toString(36).substring(2),
      userId: 'system',
      username: 'System',
      content: `${currentUser.username} has left the chat`,
      timestamp: new Date(),
      type: 'system'
    };
    chatChannel.postMessage({ type: 'NEW_MESSAGE', payload: systemMessage });
    chatChannel.postMessage({ type: 'USER_LEAVE', payload: { id: currentUser.id } });
    
    localStorage.removeItem('metallic/chat-user');
    setCurrentUser(null);
  };

  const handleTyping = () => {
    if (!currentUser) return;

    chatChannel.postMessage({ type: 'TYPING_START', payload: currentUser.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatChannel.postMessage({ type: 'TYPING_END', payload: currentUser.id });
    }, 3000) as unknown as number;
  };

  const handleSendMessage = (e: Event) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUser) return;

    const message: Message = {
      id: Math.random().toString(36).substring(2),
      userId: currentUser.id,
      username: currentUser.username,
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    chatChannel.postMessage({ type: 'NEW_MESSAGE', payload: message });
    setInputMessage("");
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    chatChannel.postMessage({
      type: 'ADD_REACTION',
      payload: { messageId, userId: currentUser.id, emoji }
    });
  };

  // Login form
  if (!currentUser) {
    return (
      <>
        <Head />
        <div class="flex flex-col items-center justify-center min-h-[80vh]">
          <form onSubmit={handleLogin} class="bg-secondary p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold mb-6 text-center text-textInverse">
              <Obfuscated>Join Chat</Obfuscated>
            </h2>
            <input
              type="text"
              name="username"
              placeholder="Enter username (min 3 characters)"
              class="w-full bg-background text-textInverse p-2 rounded-lg mb-4"
              minLength={3}
              required
            />
            <Button
              type="submit"
              class="w-full bg-primary text-textInverse p-2 rounded-lg hover:opacity-90"
            >
              Join
            </Button>
          </form>
        </div>
      </>
    );
  }

  // Main chat interface
  return (
    <>
      <Head />
      <div class="flex flex-col h-[80vh] max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">
            <Obfuscated>Chat Room</Obfuscated>
          </h1>
          <div class="flex items-center gap-4">
            <span class="text-textInverse">
              <Obfuscated>{currentUser.username}</Obfuscated>
            </span>
            <Button onClick={handleLogout} class="text-red-500 hover:text-red-600">
              Logout
            </Button>
          </div>
        </div>

        <div class="flex gap-4 flex-1">
          {/* Online Users Sidebar */}
          <div class="w-48 bg-secondary rounded-lg p-4 hidden md:block">
            <h3 class="font-bold mb-4 text-textInverse">
              <Obfuscated>Online Users</Obfuscated>
            </h3>
            <div class="space-y-2">
              {chatState.users.map(user => (
                <div key={user.id} class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-green-500"></span>
                  <span class="text-textInverse">
                    <Obfuscated>{user.username}</Obfuscated>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div class="flex-1 flex flex-col">
            {/* Messages */}
            <div class="flex-1 overflow-y-auto bg-secondary rounded-lg p-4 mb-4">
              {chatState.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  class={`mb-4 ${msg.userId === currentUser.id ? 'ml-auto' : ''}`}
                >
                  <div 
                    class={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'system' ? 'bg-gray-700 mx-auto' :
                      msg.userId === currentUser.id ? 'bg-blue-600 ml-auto' : 'bg-gray-600'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <div class="font-bold text-sm text-textInverse mb-1">
                        <Obfuscated>{msg.username}</Obfuscated>
                      </div>
                    )}
                    <div class="text-textInverse">
                      <Obfuscated>{msg.content}</Obfuscated>
                    </div>
                    <div class="text-xs text-gray-300 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    {msg.reactions && Object.entries(msg.reactions).map(([emoji, users]) => (
                      <div key={emoji} class="inline-flex items-center gap-1 bg-gray-700 rounded px-2 py-1 mr-2 mt-2">
                        <span>{emoji}</span>
                        <span class="text-xs">{users.length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {chatState.typingUsers.length > 0 && (
              <div class="text-sm text-gray-400 mb-2">
                <Obfuscated>
                  {chatState.typingUsers
                    .map(id => chatState.users.find(u => u.id === id)?.username)
                    .filter(Boolean)
                    .join(", ")}{" "}
                  {chatState.typingUsers.length === 1 ? "is" : "are"} typing...
                </Obfuscated>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} class="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                onKeyPress={handleTyping}
                placeholder="Type a message..."
                class="flex-1 bg-secondary text-textInverse p-2 rounded-lg"
              />
              <Button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                class="bg-secondary text-textInverse px-4 py-2 rounded-lg"
              >
                😊
              </Button>
              <Button
                type="submit"
                class="bg-secondary text-textInverse px-4 py-2 rounded-lg hover:opacity-80"
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
