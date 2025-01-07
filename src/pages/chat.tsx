import { useState, useEffect, useRef } from "preact/hooks";
import { Button } from "../interface/button";
import { AppState, UserAccount, ChatMessage } from '../types';

export function Chat() {
  // Core state
  const [state, setState] = useState<AppState>(() => {
    const savedState = localStorage.getItem('metallic/app-state');
    return savedState ? JSON.parse(savedState) : {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: true,
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

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannel = useRef<BroadcastChannel>(new BroadcastChannel('metallic/chat'));

  // Persistence
  useEffect(() => {
    localStorage.setItem('metallic/app-state', JSON.stringify(state));
  }, [state]);

  // Auth methods
  const login = async (e: Event) => {
    e.preventDefault();
    try {
      setState((prev: AppState) => ({ 
        ...prev, 
        auth: { ...prev.auth, isLoading: true, error: null } 
      }));
      
      // Mock login - replace with real API call
      const mockUser: UserAccount = {
        id: Math.random().toString(36).slice(2),
        username: loginForm.email.split('@')[0],
        email: loginForm.email,
        password: loginForm.password,
        createdAt: new Date(),
        lastSeen: new Date(),
        status: 'online',
        friends: [],
        blockedUsers: [],
        settings: {
          theme: 'system',
          notifications: true,
          soundEffects: true,
          messagePreview: true,
          language: 'en'
        }
      };

      setState((prev: AppState) => ({
        ...prev,
        auth: {
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }
      }));
    } catch (error) {
      setState((prev: AppState) => ({
        ...prev,
        auth: {
          ...prev.auth,
          error: 'Login failed',
          isLoading: false
        }
      }));
    }
  };

  const logout = () => {
    setState((prev: AppState) => ({
      ...prev,
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    }));
  };

  // Chat methods
  const sendMessage = (content: string) => {
    if (!content.trim() || !state.auth.user || !state.chat.currentRoom) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      userId: state.auth.user.id,
      roomId: state.chat.currentRoom.id,
      content,
      timestamp: new Date(),
      type: 'text',
      readBy: [state.auth.user.id]
    };

    chatChannel.current.postMessage({ type: 'NEW_MESSAGE', data: newMessage });
    setState((prev: AppState) => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: [...prev.chat.messages, newMessage]
      }
    }));
  };

  const handleMessageEdit = (messageId: string, newContent: string) => {
    setState((prev: AppState) => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: prev.chat.messages.map((msg: ChatMessage) =>
          msg.id === messageId
            ? { ...msg, content: newContent, edited: true, editedAt: new Date() }
            : msg
        )
      }
    }));
    setEditingMessageId(null);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!state.auth.user) return;
    setState((prev: AppState) => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: prev.chat.messages.map((msg: ChatMessage) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: {
                  ...msg.reactions,
                  [emoji]: [...(msg.reactions?.[emoji] || []), state.auth.user!.id]
                }
              }
            : msg
        )
      }
    }));
  };

  // Render methods
  const renderMessage = (msg: ChatMessage) => {
    const isCurrentUser = msg.userId === state.auth.user?.id;
    
    return (
      <div key={msg.id} class={`message ${isCurrentUser ? 'sent' : 'received'}`}>
        <div class="message-content">
          {editingMessageId === msg.id ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).querySelector('input');
              if (input) handleMessageEdit(msg.id, input.value);
            }}>
              <input 
                type="text" 
                defaultValue={msg.content}
                class="edit-input"
              />
            </form>
          ) : (
            <>
              <div class="message-text">{msg.content}</div>
              <div class="message-meta">
                {msg.edited && <span>(edited)</span>}
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div class="reactions">
                {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                  <button onClick={() => handleReaction(msg.id, emoji)}>
                    {emoji} {msg.reactions?.[emoji]?.length || ''}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Main render
  if (!state.auth.isAuthenticated) {
    return (
      <div class="auth-container">
        <h1>Welcome to Chat</h1>
        <form onSubmit={login}>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm(prev => ({
              ...prev,
              email: (e.target as HTMLInputElement).value
            }))}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm(prev => ({
              ...prev,
              password: (e.target as HTMLInputElement).value
            }))}
          />
          <Button type="submit">Login</Button>
        </form>
      </div>
    );
  }

  return (
    <div class="chat-container">
      <div class="sidebar">
        <div class="user-profile">
          <img src={state.auth.user?.avatar || '/default-avatar.png'} alt="Profile" />
          <h3>{state.auth.user?.username}</h3>
          <Button onClick={logout}>Logout</Button>
        </div>

        <div class="room-list">
          {state.chat.rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setState((prev: AppState) => ({
                ...prev,
                chat: { ...prev.chat, currentRoom: room }
              }))}
              class={`room ${state.chat.currentRoom?.id === room.id ? 'active' : ''}`}
            >
              <h4>{room.name}</h4>
              <div class="last-message">{room.lastMessage?.content}</div>
              {room.unreadCount > 0 && (
                <div class="unread-badge">{room.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div class="chat-main">
        {state.chat.currentRoom ? (
          <>
            <div class="chat-header">
              <h2>{state.chat.currentRoom.name}</h2>
              <Button onClick={() => setShowUserList(!showUserList)}>
                Users ({state.chat.currentRoom.members.length})
              </Button>
            </div>

            <div class="messages-container">
              {state.chat.messages
                .filter((msg: ChatMessage) => msg.roomId === state.chat.currentRoom?.id)
                .map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputMessage);
              setInputMessage("");
            }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                placeholder="Type a message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </>
        ) : (
          <div class="no-room-selected">
            Select a room to start chatting
          </div>
        )}
      </div>

      {showUserList && state.chat.currentRoom && (
        <div class="users-sidebar">
          <h3>Users</h3>
          {state.chat.currentRoom.members.map((userId: string) => {
            const user = state.chat.rooms
              .flatMap((r) => r.members)
              .find((u: string) => u === userId);
            return (
              <div key={userId} class="user-item">
                {user}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
