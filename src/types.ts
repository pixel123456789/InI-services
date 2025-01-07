// Auth Types
export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string; // Hashed
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

// Chat Types
export interface ChatMessage {
  id: string;
  userId: string;
  roomId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'reaction' | 'deleted';
  edited?: boolean;
  editedAt?: Date;
  mentions?: string[];
  reactions?: { [emoji: string]: string[] };
  pinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  replyTo?: string;
  readBy: string[];
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'public';
  createdBy: string;
  createdAt: Date;
  members: string[];
  admins: string[];
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
