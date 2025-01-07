import { useState, useEffect } from "preact/hooks";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { AppState, ChatMessage, ChatRoom } from '../types';
import { Head } from "../components/head";
import { useTranslation } from "react-i18next";

const DEMO_ROOM: ChatRoom = {
  id: 'general',
  name: 'General Chat',
  type: 'public',
  members: [],
  messages: []
};

export function Chat() {
  const { t } = useTranslation();
  const [theme] = useGlobalState<string>("theme", 
    localStorage.getItem("metallic/theme") || "default"
  );
  
  const [state, setState] = useState<AppState>({
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    },
    chat: {
      rooms: [DEMO_ROOM],
      currentRoom: DEMO_ROOM,
      messages: []
    }
  });

  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  const login = (e: Event) => {
    e.preventDefault();
    if (!username.trim()) return;

    setState(prev => ({
      ...prev,
      auth: {
        user: {
          id: Math.random().toString(36).slice(2),
          username: username,
          role: 'user',
          createdAt: new Date(),
          lastSeen: new Date(),
          status: 'online',
          friends: [],
          blockedUsers: [],
          settings: {
            theme: theme,
            notifications: true,
            soundEffects: true,
            messagePreview: true,
            language: 'en'
          }
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    }));
  };

  const sendMessage = () => {
    if (!message.trim() || !state.auth.user) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      userId: state.auth.user.id,
      username: state.auth.user.username,
      content: message,
      timestamp: new Date(),
      type: 'text'
    };

    setState(prev => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: [...prev.chat.messages, newMessage]
      }
    }));

    setMessage("");
  };

  if (!state.auth.isAuthenticated) {
    return (
      <>
        <Head pageTitle={t("title.chat")} />
        <div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <form onSubmit={login} class="w-full max-w-md p-8 bg-secondary rounded-xl">
            <h2 class="text-2xl font-bold text-center mb-6">{t("chat.login")}</h2>
            <input
              type="text"
              placeholder={t("chat.enterUsername")}
              value={username}
              onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
              class="w-full p-3 mb-4 rounded-lg bg-background border border-primary text-text"
            />
            <button 
              type="submit"
              class="w-full p-3 rounded-lg bg-primary text-textInverse font-bold"
            >
              {t("chat.join")}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head pageTitle={t("title.chat")} />
      <div class="flex h-[calc(100vh-200px)] bg-background rounded-lg overflow-hidden">
        <div class="w-64 bg-secondary border-r border-primary p-4">
          <div class="mb-4 p-4 bg-background rounded-lg">
            <div class="font-bold">{state.auth.user.username}</div>
            <div class="text-sm opacity-75">{t("chat.online")}</div>
          </div>
          <div class="font-bold mb-2">{t("chat.rooms")}</div>
          {state.chat.rooms.map(room => (
            <div 
              key={room.id}
              class="p-2 rounded cursor-pointer hover:bg-primary hover:bg-opacity-20"
            >
              {room.name}
            </div>
          ))}
        </div>
        
        <div class="flex-1 flex flex-col">
          <div class="flex-1 p-4 overflow-y-auto">
            {state.chat.messages.map(msg => (
              <div 
                key={msg.id}
                class={`mb-4 ${msg.userId === state.auth.user?.id ? 'text-right' : ''}`}
              >
                <div class={`inline-block max-w-[70%] p-3 rounded-lg ${
                  msg.userId === state.auth.user?.id 
                    ? 'bg-primary text-textInverse' 
                    : 'bg-secondary'
                }`}>
                  {msg.userId !== state.auth.user?.id && (
                    <div class="font-bold text-sm mb-1">{msg.username}</div>
                  )}
                  <div>{msg.content}</div>
                  <div class="text-xs opacity-75 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div class="p-4 bg-secondary border-t border-primary">
            <div class="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage((e.target as HTMLInputElement).value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t("chat.typeMessage")}
                class="flex-1 p-3 rounded-lg bg-background border border-primary text-text"
              />
              <button
                onClick={sendMessage}
                class="px-6 rounded-lg bg-primary text-textInverse font-bold"
              >
                {t("chat.send")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
