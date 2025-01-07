import WebSocket from 'ws';

// Move types directly into this file since we're having import issues
interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  roomId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'action';
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private';
  users: string[];
  messages: ChatMessage[];
}

const wss = new WebSocket.Server({ port: 8080 });

const rooms: ChatRoom[] = [
  {
    id: 'general',
    name: 'General Chat',
    type: 'public',
    users: [],
    messages: []
  }
];

const clients = new Map<WebSocket, { userId: string; username: string }>();

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'chat_message':
        handleChatMessage(ws, data.data);
        break;
      case 'join_room':
        handleJoinRoom(ws, data.data);
        break;
      case 'leave_room':
        handleLeaveRoom(ws, data.data);
        break;
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      // Remove user from rooms
      rooms.forEach(room => {
        room.users = room.users.filter((userId: string) => userId !== client.userId);
      });
      clients.delete(ws);
    }
  });
});

function handleChatMessage(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const message: ChatMessage = {
    id: Date.now().toString(),
    userId: client.userId,
    username: client.username,
    roomId: data.roomId,
    content: data.content,
    timestamp: new Date(),
    type: 'text'
  };

  const room = rooms.find(r => r.id === data.roomId);
  if (room) {
    room.messages.push(message);
    broadcastToRoom(room.id, {
      type: 'chat_message',
      message
    });
  }
}

function handleJoinRoom(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const room = rooms.find(r => r.id === data.roomId);
  if (room && !room.users.includes(client.userId)) {
    room.users.push(client.userId);
    ws.send(JSON.stringify({
      type: 'room_update',
      rooms
    }));
  }
}

function handleLeaveRoom(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const room = rooms.find(r => r.id === data.roomId);
  if (room) {
    room.users = room.users.filter((userId: string) => userId !== client.userId);
    ws.send(JSON.stringify({
      type: 'room_update',
      rooms
    }));
  }
}

function broadcastToRoom(roomId: string, message: any) {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

 wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      const userData = clients.get(client);
      if (userData && room.users.includes(userData.userId)) {
        client.send(JSON.stringify(message));
      }
    }
  });
}

console.log('Chat server running on ws://localhost:8080');
