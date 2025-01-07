import { useState, useEffect, useRef } from "preact/hooks";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { Head } from "../components/head";
import { Obfuscated } from "../util/obfuscate";
import { Button } from "../interface/button";

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'reaction';
  reactions?: { [emoji: string]: string[] };
}

interface User {
  id: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}

function Chat() {
  const [theme] = useGlobalState<string>(
    "theme",
    localStorage.getItem("metallic/theme") || "default"
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('metallic/chat-messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('metallic/chat-users');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannel = useRef<BroadcastChannel>(new BroadcastChannel('metallic/chat'));
  const typingTimeoutRef = useRef<number>();

  useEffect(() => {
    localStorage.setItem('metallic/chat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('metallic/chat-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    chatChannel.current.onmessage = (event) => {
      const { type, data } = event.data;
      switch (type) {
        case 'NEW_MESSAGE':
          setMessages(prev => [...prev, data]);
          break;
        case 'USER_JOIN':
          setUsers(prev => [...prev, data]);
          addSystemMessage(`${data.username} has joined the chat`);
          break;
        case 'USER_LEAVE':
          setUsers(prev => prev.filter(u => u.id !== data.id));
          addSystemMessage(`${data.username} has left the chat`);
          break;
        case 'TYPING_START':
          setTypingUsers(prev => [...new Set([...prev, data])]);
          break;
        case 'TYPING_END':
          setTypingUsers(prev => prev.filter(id => id !== data));
          break;
        case 'REACTION':
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? {
                  ...msg,
                  reactions: {
                    ...msg.reactions,
                    [data.emoji]: [...(msg.reactions?.[data.emoji] || []), data.userId]
                  }
                }
              : msg
          ));
          break;
      }
    };

    return () => chatChannel.current.close();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Math.random().toString(36).substring(2),
      user: 'System',
      content,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleJoin = (e: Event) => {
    e.preventDefault();
    if (username.length < 3) return;

    const user: User = {
      id: Math.random().toString(36).substring(2),
      username,
      status: 'online',
      lastSeen: new Date()
    };

    setCurrentUser(user);
    chatChannel.current.postMessage({ type: 'USER_JOIN', data: user });
  };

  const handleLeave = () => {
    if (!currentUser) return;
    chatChannel.current.postMessage({ type: 'USER_LEAVE', data: currentUser });
    setCurrentUser(null);
    setUsername("");
  };

  const handleTyping = () => {
    if (!currentUser) return;
    chatChannel.current.postMessage({ type: 'TYPING_START', data: currentUser.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatChannel.current.postMessage({ type: 'TYPING_END', data: currentUser.id });
    }, 3000) as unknown as number;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(2),
      user: currentUser.username,
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    chatChannel.current.postMessage({ type: 'NEW_MESSAGE', data: newMessage });
    setInputMessage("");
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    chatChannel.current.postMessage({
      type: 'REACTION',
      data: { messageId, userId: currentUser.id, emoji }
    });
  };

  const renderMessage = (msg: Message) => {
    const isCurrentUser = currentUser?.username === msg.user;
    const messageClass = msg.type === 'system' 
      ? 'bg-gray-700 mx-auto'
      : isCurrentUser 
        ? 'bg-primary ml-auto' 
        : 'bg-secondary';

    return (
      <div key={msg.id} class={`mb-4 max-w-[80%] ${isCurrentUser ? 'ml-auto' : ''}`}>
        <div class={`rounded-lg p-3 ${messageClass}`}>
          {msg.type !== 'system' && (
            <div class="font-bold text-sm text-textInverse">
              <Obfuscated>{msg.user}</Obfuscated>
            </div>
          )}
          <div class="text-textInverse">
            <Obfuscated>{msg.content}</Obfuscated>
          </div>
          <div class="text-xs text-gray-300 mt-1">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
          <div class="flex gap-1 mt-2">
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
              <button
                onClick={() => handleReaction(msg.id, emoji)}
                class="hover:opacity-80 text-sm"
              >
                {emoji} {msg.reactions?.[emoji]?.length || ''}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head />
      <div class={`flex flex-col h-[80vh] max-w-4xl mx-auto ${theme === 'dark' ? 'dark' : ''}`}>
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold text-textInverse">
            <Obfuscated>Chat Room</Obfuscated>
          </h1>
          {currentUser && (
            <Button onClick={handleLeave} class="text-red-500">
              Leave Chat
            </Button>
          )}
        </div>

        {!currentUser ? (
          <form onSubmit={handleJoin} class="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Enter your username (min 3 characters)"
              class="bg-secondary text-textInverse p-2 rounded-lg w-64"
              value={username}
              onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
              minLength={3}
            />
            <Button type="submit" class="bg-primary text-textInverse px-4 py-2 rounded-lg">
              Join Chat
            </Button>
          </form>
        ) : (
          <div class="flex gap-4 flex-1">
            <div class="flex-1 flex flex-col">
              <div class="flex-1 overflow-y-auto bg-secondary rounded-lg p-4 mb-2">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>

              {typingUsers.length > 0 && (
                <div class="text-sm text-gray-400 mb-2">
                  <Obfuscated>
                    {typingUsers
                      .map(id => users.find(u => u.id === id)?.username)
                      .filter(Boolean)
                      .join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing...
                  </Obfuscated>
                </div>
              )}

              <form onSubmit={handleSubmit} class="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                  onKeyPress={handleTyping}
                  placeholder="Type a message..."
                  class="flex-1 bg-secondary text-textInverse p-2 rounded-lg"
                />
                <Button
                  type="submit"
                  class="bg-primary text-textInverse px-4 py-2 rounded-lg"
                >
                  Send
                </Button>
              </form>
            </div>

            <div class="w-48 bg-secondary rounded-lg p-4 hidden md:block">
              <h3 class="font-bold mb-4 text-textInverse">
                <Obfuscated>Online Users ({users.length})</Obfuscated>
              </h3>
              <div class="space-y-2">
                {users.map(user => (
                  <div key={user.id} class="flex items-center gap-2">
                    <span class={`w-2 h-2 rounded-full ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span class="text-textInverse">
                      <Obfuscated>{user.username}</Obfuscated>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export { Chat };
