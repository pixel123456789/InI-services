export interface UserAccount {
  id: string;
  username: string;
  role: 'admin' | 'moderator' | 'user';
  avatar?: string;
  createdAt: Date;
  lastSeen: Date;
  status: 'online' | 'away' | 'offline';
  friends: string[];
  blockedUsers: string[];
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    soundEffects: boolean;
    messagePreview: boolean;
    language: string;
  };
}

export interface ChatMessage {
  id: string;
  userId: string;
  roomId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'reaction' | 'deleted' | 'moderation';
  edited?: boolean;
  editedAt?: Date;
  mentions?: string[];
  reactions?: { [emoji: string]: string[] };
  pinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  replyTo?: string;
  readBy: string[];
  isModerated?: boolean;
  moderatedBy?: string;
  moderationReason?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'public' | 'announcement';
  createdBy: string;
  createdAt: Date;
  members: string[];
  admins: string[];
  moderators: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  pinnedMessages: string[];
  settings: {
    notifications: boolean;
    readonly: boolean;
    maxUsers?: number;
    allowReactions: boolean;
    allowPins: boolean;
    allowEdits: boolean;
    slowMode?: number; // Seconds between messages
    requireModeration?: boolean;
  };
}

export interface AppState {
  auth: {
    user: UserAccount | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  };
  chat: {
    rooms: ChatRoom[];
    currentRoom: ChatRoom | null;
    messages: ChatMessage[];
    typingUsers: string[];
  };
}

export const defaultStyles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2d2d2d',
    borderRight: '1px solid #404040',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  userProfile: {
    padding: '20px',
    borderBottom: '1px solid #404040',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginBottom: '10px',
  },
  roomList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '10px',
  },
  room: {
    padding: '10px',
    margin: '5px 0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  activeRoom: {
    backgroundColor: '#404040',
  },
  chatMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  chatHeader: {
    padding: '20px',
    borderBottom: '1px solid #404040',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  message: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '12px',
    marginBottom: '5px',
  },
  messageSent: {
    backgroundColor: '#2b5278',
    marginLeft: 'auto',
  },
  messageReceived: {
    backgroundColor: '#383838',
    marginRight: 'auto',
  },
  messageContent: {
    wordBreak: 'break-word' as const,
  },
  messageMeta: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px',
  },
  reactions: {
    display: 'flex',
    gap: '5px',
    marginTop: '5px',
  },
  reactionButton: {
    padding: '2px 5px',
    borderRadius: '4px',
    backgroundColor: '#2d2d2d',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
  },
  inputContainer: {
    padding: '20px',
    borderTop: '1px solid #404040',
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px 15px',
    borderRadius: '8px',
    backgroundColor: '#2d2d2d',
    border: '1px solid #404040',
    color: '#fff',
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#2b5278',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: '#3a6ea5',
  },
  authContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  authForm: {
    width: '300px',
    padding: '30px',
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  adminBadge: {
    backgroundColor: '#ff4444',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '5px',
  },
  moderatorBadge: {
    backgroundColor: '#ffaa00',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '5px',
  },
};
