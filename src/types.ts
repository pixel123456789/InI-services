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
    theme: string;
    notifications: boolean;
    soundEffects: boolean;
    messagePreview: boolean;
    language: string;
  };
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'deleted';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private';
  members: string[];
  messages: ChatMessage[];
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
  };
}
