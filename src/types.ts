// Types for the entire application
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

export interface UserAccount {
  id: string;
  username: string;
  role: 'admin' | 'moderator' | 'user';
  avatar?: string;
  createdAt: Date;
  lastSeen: Date;
  status: 'online' | 'away' | 'offline';
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  roomId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'action';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private';
  users: string[];
  messages: ChatMessage[];
}

export interface ChatClient {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  onMessage: (callback: (message: ChatMessage) => void) => void;
}
