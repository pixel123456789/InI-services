import { useState, useEffect, useRef } from "preact/hooks";
import { AppState, ChatMessage, ChatRoom } from '../types';
import { Head } from "../components/head";
import { Obfuscated } from "../util/obfuscate";

export function Chat() {

  const [state, setState] = useState<AppState>(() => {
    const savedState = localStorage.getItem('metallic/chat-state');
    return savedState ? JSON.parse(savedState) : {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      },
      chat: {
        rooms: [],
        currentRoom: null,
        messages: [],
        typingUsers: []
      }
    };
  });

  const [inputMessage, setInputMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const connect = () => {
      const socket = new WebSocket('ws://localhost:8080');

      socket.onopen = () => {
        console.log('Connected to chat server');
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      socket.onclose = () => {
        console.log('Disconnected from chat server');
        setTimeout(connect, 5000);
      };

      ws.current = socket;
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'chat_message':
        setState(prev => ({
          ...prev,
          chat: {
            ...prev.chat,
            messages: [...prev.chat.messages, data.message]
          }
        }));
        break;
      case 'room_update':
        setState(prev => ({
          ...prev,
          chat: {
            ...prev.chat,
            rooms: data.rooms
          }
        }));
        break;
    }
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !state.auth.user || !state.chat.currentRoom || !ws.current) return;

    const message = {
      type: 'chat_message',
      data: {
        roomId: state.chat.currentRoom.id,
        content: content.trim(),
        userId: state.auth.user.id,
        username: state.auth.user.username
      }
    };

    ws.current.send(JSON.stringify(message));
    setInputMessage('');
  };

  useEffect(() => {
    localStorage.setItem('metallic/chat-state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chat.messages]);

  if (!state.auth.isAuthenticated) {
    return (
      <>
        <Head pageTitle="Chat" />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-96 p-8 bg-secondary rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6 text-textInverse">
              <Obfuscated>Please log in to use chat</Obfuscated>
            </h2>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head pageTitle="Chat" />
      <div className={`flex h-[calc(100vh-theme(spacing.14))] bg-background text-text rounded-lg overflow-hidden`}>
        <div className="w-64 bg-secondary border-r border-primary/20">
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium text-textInverse">
                <Obfuscated>Chat Rooms</Obfuscated>
              </span>
            </div>
          </div>
          <div className="overflow-y-auto">
            {state.chat.rooms.map((room: ChatRoom) => (
              <div
                key={room.id}
                className={`p-4 cursor-pointer hover:bg-primary/10 ${
                  state.chat.currentRoom?.id === room.id ? 'bg-primary/20' : ''
                }`}
                onClick={() => setState((prev: AppState) => ({
                  ...prev,
                  chat: { ...prev.chat, currentRoom: room }
                }))}
              >
                <Obfuscated>{room.name}</Obfuscated>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {state.chat.currentRoom ? (
            <>
              <div className="p-4 border-b border-primary/20 bg-secondary">
                <h2 className="text-lg font-medium text-textInverse">
                  <Obfuscated>{state.chat.currentRoom.name}</Obfuscated>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {state.chat.messages
                  .filter((msg: ChatMessage) => msg.roomId === state.chat.currentRoom?.id)
                  .map((message: ChatMessage) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.userId === state.auth.user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        message.userId === state.auth.user?.id 
                          ? 'bg-primary text-textInverse' 
                          : 'bg-secondary text-textInverse'
                      }`}>
                        <div className="break-words">
                          <Obfuscated>{message.content}</Obfuscated>
                        </div>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-primary/20 bg-secondary">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputMessage);
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 p-2 rounded bg-background border border-primary/20 text-text focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => sendMessage(inputMessage)}
                    className="px-4 py-2 bg-primary text-textInverse rounded hover:opacity-90 transition-opacity"
                  >
                    <Obfuscated>Send</Obfuscated>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text/50">
              <Obfuscated>Select a room to start chatting</Obfuscated>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
