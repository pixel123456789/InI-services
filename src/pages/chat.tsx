import { useState, useEffect, useRef } from "preact/hooks";
import { AppState, UserAccount, ChatMessage, defaultStyles } from '../types';

const MOCK_USERS: UserAccount[] = [
  {
    id: '1',
    username: 'admin',
    role: 'admin',
    createdAt: new Date(),
    lastSeen: new Date(),
    status: 'online',
    friends: [],
    blockedUsers: [],
    settings: {
      theme: 'dark',
      notifications: true,
      soundEffects: true,
      messagePreview: true,
      language: 'en'
    }
  },
  // Add more mock users as needed
];

export function Chat() {
  // Core state
  const [state, setState] = useState<AppState>(() => {
    const savedState = localStorage.getItem('metallic/app-state');
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
            name: 'General',
            type: 'public',
            createdBy: '1',
            createdAt: new Date(),
            members: ['1'],
            admins: ['1'],
            moderators: [],
            lastMessage: null,
            unreadCount: 0,
            pinnedMessages: [],
            settings: {
              notifications: true,
              readonly: false,
              allowReactions: true,
              allowPins: true,
              allowEdits: true,
            }
          }
        ],
        currentRoom: null,
        messages: [],
        typingUsers: []
      }
    };
  });

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showModeration, setShowModeration] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannel = useRef<BroadcastChannel>(new BroadcastChannel('metallic/chat'));

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chat.messages]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('metallic/app-state', JSON.stringify(state));
  }, [state]);

  const login = async (e: Event) => {
    e.preventDefault();
    try {
      const user = MOCK_USERS.find(u => u.username === loginForm.username);
      if (!user) throw new Error('User not found');

      setState((prev: AppState) => ({
        ...prev,
        auth: {
          user,
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

  const handleMessageModeration = (messageId: string, action: 'delete' | 'warn' | 'ban') => {
    if (!state.auth.user || !['admin', 'moderator'].includes(state.auth.user.role)) return;

    setState((prev: AppState) => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: prev.chat.messages.map((msg: ChatMessage) =>
          msg.id === messageId
            ? {
                ...msg,
                isModerated: true,
                moderatedBy: state.auth.user!.id,
                moderationReason: action,
                type: action === 'delete' ? 'deleted' : 'moderation'
              }
            : msg
        )
      }
    }));
  };

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

  const renderMessage = (msg: ChatMessage) => {
    const isCurrentUser = msg.userId === state.auth.user?.id;
    const isAdmin = state.auth.user?.role === 'admin';
    const isModerator = state.auth.user?.role === 'moderator';
    const canModerate = isAdmin || isModerator;
    
    return (
      <div 
        key={msg.id} 
        style={{
          ...defaultStyles.message,
          ...(isCurrentUser ? defaultStyles.messageSent : defaultStyles.messageReceived),
          ...(msg.isModerated && { opacity: 0.7 })
        }}
      >
        <div style={defaultStyles.messageContent}>
          {msg.type === 'deleted' ? (
            <i style={{ color: '#666' }}>Message deleted</i>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{msg.userId}</strong>
                {canModerate && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                      onClick={() => handleMessageModeration(msg.id, 'delete')}
                      style={defaultStyles.button}
                    >
                      🗑️
                    </button>
                    <button 
                      onClick={() => handleMessageModeration(msg.id, 'warn')}
                      style={defaultStyles.button}
                    >
                      ⚠️
                    </button>
                  </div>
                )}
              </div>
              {msg.content}
            </>
          )}
          <div style={defaultStyles.messageMeta}>
            {new Date(msg.timestamp).toLocaleTimeString()}
            {msg.edited && ' (edited)'}
            {msg.isModerated && ` (moderated by ${msg.moderatedBy})`}
          </div>
        </div>
      </div>
    );
  };

  if (!state.auth.isAuthenticated) {
    return (
      <div style={defaultStyles.authContainer}>
        <form onSubmit={login} style={defaultStyles.authForm}>
          <h2 style={{ textAlign: 'center' }}>Login to Chat</h2>
          <input
            type="text"
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) => setLoginForm(prev => ({
              ...prev,
              username: (e.target as HTMLInputElement).value
            }))}
            style={defaultStyles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm(prev => ({
              ...prev,
              password: (e.target as HTMLInputElement).value
            }))}
            style={defaultStyles.input}
          />
          <button type="submit" style={defaultStyles.button}>
            Login
          </button>
          {state.auth.error && (
            <div style={{ color: '#ff4444', textAlign: 'center' }}>
              {state.auth.error}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div style={defaultStyles.container}>
      <div style={defaultStyles.sidebar}>
        <div style={defaultStyles.userProfile}>
          <img 
            src={state.auth.user?.avatar || '/default-avatar.png'} 
            alt="Profile"
            style={defaultStyles.avatar}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3>{state.auth.user?.username}</h3>
            {state.auth.user?.role === 'admin' && (
              <span style={defaultStyles.adminBadge}>Admin</span>
            )}
            {state.auth.user?.role === 'moderator' && (
              <span style={defaultStyles.moderatorBadge}>Mod</span>
            )}
          </div>
          <button onClick={logout} style={defaultStyles.button}>
            Logout
          </button>
        </div>

        <div style={defaultStyles.roomList}>
          {state.chat.rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setState((prev: AppState) => ({
                ...prev,
                chat: { ...prev.chat, currentRoom: room }
              }))}
              style={{
                ...defaultStyles.room,
                ...(state.chat.currentRoom?.id === room.id && defaultStyles.activeRoom)
              }}
            >
              <h4>{room.name}</h4>
              {room.unreadCount > 0 && (
                <div style={{ 
                  backgroundColor: '#ff4444',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '12px'
                }}>
                  {room.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={defaultStyles.chatMain}>
        {state.chat.currentRoom ? (
          <>
            <div style={defaultStyles.chatHeader}>
              <h2>{state.chat.currentRoom.name}</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(state.auth.user?.role === 'admin' || state.auth.user?.role === 'moderator') && (
                  <button 
                    onClick={() => setShowModeration(!showModeration)}
                    style={defaultStyles.button}
                  >
                    Moderation
                  </button>
                )}
                <button 
                  onClick={() => setShowUserList(!showUserList)}
                  style={defaultStyles.button}
                >
                  Users ({state.chat.currentRoom.members.length})
                </button>
              </div>
            </div>

            <div style={defaultStyles.messagesContainer}>
              {state.chat.messages
                .filter((msg: ChatMessage) => msg.roomId === state.chat.currentRoom?.id)
                .map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            <div style={defaultStyles.inputContainer}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                placeholder="Type a message..."
                style={defaultStyles.input}
              />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  sendMessage(inputMessage);
                  setInputMessage("");
                }}
                style={defaultStyles.button}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%' 
          }}>
            Select a room to start chatting
          </div>
        )}
      </div>

      {showUserList && state.chat.currentRoom && (
        <div style={{
          width: '200px',
          backgroundColor: '#2d2d2d',
          borderLeft: '1px solid #404040',
          padding: '20px'
        }}>
          <h3>Users</h3>
          {state.chat.currentRoom.members.map((userId: string) => (
            <div key={userId} style={{
              padding: '10px',
              borderBottom: '1px solid #404040'
            }}>
              {userId}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
