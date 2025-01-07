import { useState, useEffect, useRef } from "preact/hooks";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { AppState, UserAccount, ChatMessage, ChatRoom } from '../types';
import { Head } from "../components/head";
import { Obfuscated } from "../util/obfuscate";
import { loginUser, logout } from "../services/auth";
import { useTranslation } from "react-i18next";

export function Chat() {
  const { t } = useTranslation();
  const [theme] = useGlobalState<string>(
    "theme",
    localStorage.getItem("metallic/theme") || "default"
  );
  
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
        rooms: [
          {
            id: 'general',
            name: 'General Chat',
            type: 'public',
            createdBy: 'system',
            createdAt: new Date(),
            members: [],
            admins: [],
            moderators: [],
            unreadCount: 0,
            pinnedMessages: [],
            settings: {
              notifications: true,
              readonly: false,
              allowReactions: true,
              allowPins: true,
              allowEdits: true
            }
          }
        ],
        currentRoom: null,
        messages: [],
        typingUsers: []
      }
    };
  });

  const [inputMessage, setInputMessage] = useState("");
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannel = useRef<BroadcastChannel>(new BroadcastChannel('metallic/chat'));

  useEffect(() => {
    localStorage.setItem('metallic/chat-state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chat.messages]);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await loginUser(loginForm.username, loginForm.password);
      setState(prev => ({
        ...prev,
        auth: {
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        auth: {
          ...prev.auth,
          error: 'Login failed. Please check your credentials.',
          isLoading: false
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setState(prev => ({
      ...prev,
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    }));
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !state.auth.user || !state.chat.currentRoom) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: state.auth.user.id,
      roomId: state.chat.currentRoom.id,
      content,
      timestamp: new Date(),
      type: 'text',
      readBy: [state.auth.user.id]
    };

    chatChannel.current.postMessage({ type: 'NEW_MESSAGE', data: newMessage });
    setState(prev => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: [...prev.chat.messages, newMessage]
      }
    }));
  };

  if (!state.auth.isAuthenticated) {
    return (
      <>
        <Head pageTitle={t("chat.title")} />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <form onSubmit={handleLogin} className="w-96 p-8 bg-secondary rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6 text-textInverse">
              <Obfuscated>{t("chat.login.title")}</Obfuscated>
            </h2>
            <input
              type="text"
              placeholder={t("chat.login.username")}
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({
                ...prev,
                username: (e.target as HTMLInputElement).value
              }))}
              className="w-full p-3 mb-4 bg-background border border-primary rounded text-text"
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder={t("chat.login.password")}
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({
                ...prev,
                password: (e.target as HTMLInputElement).value
              }))}
              className="w-full p-3 mb-6 bg-background border border-primary rounded text-text"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="w-full p-3 bg-primary text-textInverse rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isLoading}
            >
              <Obfuscated>
                {isLoading ? t("chat.login.loading") : t("chat.login.submit")}
              </Obfuscated>
            </button>
            {state.auth.error && (
              <div className="mt-4 text-red-500 text-center">
                <Obfuscated>{state.auth.error}</Obfuscated>
              </div>
            )}
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head pageTitle={t("chat.title")} />
      <div className="flex h-[calc(100vh-theme(spacing.14))] bg-background text-text rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-secondary border-r border-primary/20">
          {/* User profile */}
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  {state.auth.user.username[0].toUpperCase()}
                </div>
                <span className="ml-3 font-medium text-textInverse">
                  <Obfuscated>{state.auth.user.username}</Obfuscated>
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-primary hover:underline"
              >
                <Obfuscated>{t("chat.logout")}</Obfuscated>
              </button>
            </div>
          </div>

          {/* Room list */}
          <div className="overflow-y-auto">
            {state.chat.rooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 cursor-pointer hover:bg-primary/10 ${
                  state.chat.currentRoom?.id === room.id ? 'bg-primary/20' : ''
                }`}
                onClick={() => setState(prev => ({
                  ...prev,
                  chat: { ...prev.chat, currentRoom: room }
                }))}
              >
                <Obfuscated>{room.name}</Obfuscated>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {state.chat.currentRoom ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-primary/20 bg-secondary">
                <h2 className="text-lg font-medium text-textInverse">
                  <Obfuscated>{state.chat.currentRoom.name}</Obfuscated>
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {state.chat.messages
                  .filter(msg => msg.roomId === state.chat.currentRoom?.id)
                  .map((message) => (
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
                        <div className="text-sm mb-1">
                          <Obfuscated>{message.userId}</Obfuscated>
                        </div>
                        <div className="break-words">
                          <Obfuscated>{message.content}</Obfuscated>
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
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
                        setInputMessage('');
                      }
                    }}
                    placeholder={t("chat.messagePlaceholder")}
                    className="flex-1 p-2 rounded bg-background border border-primary/20 text-text focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      sendMessage(inputMessage);
                      setInputMessage('');
                    }}
                    className="px-4 py-2 bg-primary text-textInverse rounded hover:opacity-90 transition-opacity"
                  >
                    <Obfuscated>{t("chat.send")}</Obfuscated>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text/50">
              <Obfuscated>{t("chat.selectRoom")}</Obfuscated>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
