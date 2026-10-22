import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}
const MESSAGES_FILE = path.join(DATA_DIR, 'messages_db.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts_db.json');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Registered Accounts Store
interface UserAccount {
  id: string;
  name: string;
  amigosId: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar: string;
  statusMessage?: string;
  createdAt: number;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'me_alex',
    name: 'Alex',
    amigosId: 'alex_amigo',
    email: 'alex.minwoo@amigos.com',
    phone: '010-1234-5678',
    password: 'password123',
    avatar: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
    statusMessage: 'Cherishing good days with good people ☕️✨',
    createdAt: Date.now() - 1000000,
  },
  {
    id: 'user_minji',
    name: 'Min-ji Kim',
    amigosId: 'minji_k',
    email: 'minji@amigos.com',
    phone: '010-2415-9988',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Anyone up for weekend cafe hopping? ☕️🌿',
    createdAt: Date.now() - 900000,
  },
  {
    id: 'user_jihoon',
    name: 'Ji-hoon Park',
    amigosId: 'jihoon_dev',
    email: 'jihoon@amigos.com',
    phone: '010-9182-3746',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Project: Escape overtime work 💻🚀',
    createdAt: Date.now() - 800000,
  },
  {
    id: 'user_soyeon',
    name: 'So-yeon Lee',
    amigosId: 'soyeon_lee',
    email: 'soyeon@amigos.com',
    phone: '010-6754-1234',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Pilates & healthy lifestyle 🥑🧘‍♀️',
    createdAt: Date.now() - 700000,
  },
  {
    id: 'user_daniel',
    name: 'Daniel Kang',
    amigosId: 'daniel_music',
    email: 'daniel@amigos.com',
    phone: '010-4491-0021',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Guitarist & Coffee Lover 🎸☕️',
    createdAt: Date.now() - 600000,
  },
  {
    id: 'guest_1',
    name: 'Guest Explorer',
    amigosId: 'guest_player1',
    password: 'password123',
    avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
    statusMessage: 'Guest User (Online & Ready) ☕️',
    createdAt: Date.now() - 500000,
  },
];

const loadAccounts = (): UserAccount[] => {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading accounts from disk:', e);
  }
  return [...DEFAULT_ACCOUNTS];
};

const saveAccountsToDisk = () => {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving accounts to disk:', e);
  }
};

const accounts: UserAccount[] = loadAccounts();

const loadMessages = (): any[] => {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading messages from disk:', e);
  }
  return [];
};

const saveMessagesToDisk = () => {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(serverMessages, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving messages to disk:', e);
  }
};

// Persistent Messages Store loaded from disk
const serverMessages: any[] = loadMessages();

// Auth Endpoints
app.post('/api/auth/register', (req, res) => {
  const { name, amigosId, email, phone, password, avatar, statusMessage } = req.body;

  if (!name || !amigosId || !password) {
    return res.status(400).json({ error: 'Name, Amigos ID, and Password are required.' });
  }

  const cleanId = amigosId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const existing = accounts.find(
    (a) =>
      a.amigosId.toLowerCase() === cleanId ||
      (email && a.email?.toLowerCase() === email.trim().toLowerCase()) ||
      (phone && a.phone === phone.trim())
  );

  if (existing) {
    return res.status(409).json({ error: 'An account with this Amigos ID, email or phone already exists.' });
  }

  const newAccount: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    amigosId: cleanId,
    email: email ? email.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    password,
    avatar:
      avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    statusMessage: statusMessage?.trim() || 'Happy chatting on Amigos! ✨',
    createdAt: Date.now(),
  };

  accounts.push(newAccount);
  saveAccountsToDisk();

  // Return public user without password
  const { password: _, ...userSafe } = newAccount;
  res.json({ success: true, user: userSafe });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your Amigos ID / email / phone and password.' });
  }

  const clean = identifier.trim().toLowerCase();
  const found = accounts.find(
    (a) =>
      a.amigosId.toLowerCase() === clean ||
      a.email?.toLowerCase() === clean ||
      a.phone?.toLowerCase() === clean ||
      a.name.toLowerCase() === clean
  );

  if (!found) {
    return res.status(404).json({ error: 'Account not found. Please check your details or Sign Up.' });
  }

  if (found.password && found.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const { password: _, ...userSafe } = found;
  res.json({ success: true, user: userSafe });
});

// Google Sign-in endpoint
app.post('/api/auth/google', (req, res) => {
  const { email, name, avatar, googleId } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let found = accounts.find((a) => a.email?.toLowerCase() === cleanEmail);

  if (!found) {
    const handle = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
    let amigosId = handle;
    let counter = 1;
    while (accounts.some((a) => a.amigosId.toLowerCase() === amigosId.toLowerCase())) {
      amigosId = `${handle}_${counter++}`;
    }

    found = {
      id: googleId ? `g_${googleId}` : `user_g_${Date.now()}`,
      name: name?.trim() || cleanEmail.split('@')[0],
      amigosId,
      email: cleanEmail,
      avatar:
        avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      statusMessage: 'Signed in with Google Account ✨',
      createdAt: Date.now(),
    };
    accounts.push(found);
    saveAccountsToDisk();
  }

  const { password: _, ...userSafe } = found;
  res.json({ success: true, user: userSafe });
});

app.get('/api/auth/users', (req, res) => {
  const safeUsers = accounts.map(({ password, ...u }) => u);
  res.json({ users: safeUsers });
});

// Guest login endpoint
app.post('/api/auth/guest', (req, res) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const guestUser: UserAccount = {
    id: `guest_${Date.now()}_${randomNum}`,
    name: req.body.name ? req.body.name.trim() : `Guest_${randomNum}`,
    amigosId: `guest_${randomNum}`,
    avatar: req.body.avatar || '/src/assets/images/happy_white_kitten_1791348895355.jpg',
    statusMessage: 'Guest User (Real Live Mode) ☕️✨',
    createdAt: Date.now(),
  };
  accounts.push(guestUser);
  saveAccountsToDisk();
  const { password: _, ...userSafe } = guestUser;
  res.json({ success: true, user: userSafe });
});

// Messages API Endpoints
app.get('/api/messages', (req, res) => {
  const { chatId, userId } = req.query;
  let result = serverMessages;
  if (chatId) {
    result = result.filter((m) => m.chatId === chatId);
  } else if (userId) {
    result = result.filter(
      (m) =>
        m.senderId === userId ||
        m.recipientId === userId ||
        (m.chatId && m.chatId.includes(userId as string))
    );
  }
  res.json({ messages: result });
});

app.post('/api/messages', (req, res) => {
  const message = req.body;
  if (!message || !message.id) {
    return res.status(400).json({ error: 'Valid message object required' });
  }
  const existingIdx = serverMessages.findIndex((m) => m.id === message.id);
  if (existingIdx !== -1) {
    serverMessages[existingIdx] = message;
  } else {
    serverMessages.push(message);
  }
  saveMessagesToDisk();
  res.json({ success: true, message });
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const idx = serverMessages.findIndex((m) => m.id === id);
  if (idx !== -1) {
    serverMessages.splice(idx, 1);
    saveMessagesToDisk();
  }
  res.json({ success: true, id });
});

app.delete('/api/chats/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = serverMessages.length;
  for (let i = serverMessages.length - 1; i >= 0; i--) {
    if (serverMessages[i].chatId === id) {
      serverMessages.splice(i, 1);
    }
  }
  saveMessagesToDisk();
  res.json({ success: true, removedCount: initialLen - serverMessages.length });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', onlineUsers: clients.size, time: Date.now() });
});

// Real-time Multiplayer & Chat Data Structures
interface OnlinePlayer {
  id: string;
  name: string;
  amigosId?: string;
  avatar: string;
  status: 'idle' | 'in_queue' | 'in_game';
  currentGameId?: string;
  ws: WebSocket;
}

interface GameRoom {
  id: string;
  gameId: string;
  p1: { id: string; name: string; avatar: string };
  p2: { id: string; name: string; avatar: string };
  status: 'playing' | 'ended';
  createdAt: number;
}

interface AmigoCallRoom {
  id: string;
  p1: { id: string; name: string; avatar: string; amigosId?: string; ws: WebSocket };
  p2: { id: string; name: string; avatar: string; amigosId?: string; ws: WebSocket };
}

const clients = new Map<WebSocket, OnlinePlayer>();
const matchmakingQueue: { player: OnlinePlayer; gameId?: string; joinedAt: number }[] = [];
const gameRooms = new Map<string, GameRoom>();
const amigoCallQueue: { player: OnlinePlayer; ws: WebSocket; joinedAt: number }[] = [];
const amigoCallRooms = new Map<string, AmigoCallRoom>();

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastLobby() {
  const playersList = Array.from(clients.values()).map((p) => ({
    id: p.id,
    name: p.name,
    amigosId: p.amigosId,
    avatar: p.avatar,
    status: p.status,
    currentGameId: p.currentGameId,
  }));

  const payload = JSON.stringify({
    type: 'lobby_players',
    players: playersList,
    onlineCount: playersList.length,
  });

  for (const client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }

  // Also update any clients waiting in AmigoCall
  for (const item of amigoCallQueue) {
    if (item.ws.readyState === WebSocket.OPEN) {
      const otherConnected = Array.from(clients.values()).filter(
        (p) => p.id !== item.player.id && p.ws.readyState === WebSocket.OPEN
      );
      if (otherConnected.length === 0) {
        sendTo(item.ws, {
          type: 'amigocall_no_users',
          message: 'No user is online',
          onlineCount: 0,
        });
      } else {
        sendTo(item.ws, {
          type: 'amigocall_waiting',
          message: 'Finding online user...',
          onlineCount: otherConnected.length,
        });
      }
    }
  }
}

function broadcastAll(data: any, exceptWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const client of clients.keys()) {
    if (client !== exceptWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function sendTo(ws: WebSocket, data: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendToUser(userId: string, data: any) {
  let sent = false;
  for (const [ws, player] of clients.entries()) {
    if (player.id === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      sent = true;
    }
  }
  return sent;
}

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (messageRaw: string) => {
    try {
      const msg = JSON.parse(messageRaw.toString());

      switch (msg.type) {
        case 'auth': {
          const user = msg.user;
          if (!user || !user.id) return;

          clients.set(ws, {
            id: user.id,
            name: user.name || 'Amigo Player',
            amigosId: user.amigosId || user.kakaoId,
            avatar: user.avatar || '',
            status: 'idle',
            ws,
          });

          sendTo(ws, {
            type: 'auth_success',
            userId: user.id,
            message: 'Connected to Amigos Live Server',
          });

          broadcastLobby();
          break;
        }

        case 'get_lobby': {
          broadcastLobby();
          break;
        }

        // Live Chat Messaging (1:1 & OpenChat)
        case 'send_chat_message': {
          const { message, recipientId, openChatId } = msg;
          const sender = clients.get(ws);
          if (!sender || !message) return;

          // Persist message on server
          const existingIdx = serverMessages.findIndex((m) => m.id === message.id);
          if (existingIdx !== -1) {
            serverMessages[existingIdx] = message;
          } else {
            serverMessages.push(message);
          }
          saveMessagesToDisk();

          if (openChatId) {
            // Broadcast to all connected clients in the OpenChat
            broadcastAll(
              {
                type: 'incoming_chat_message',
                message,
                openChatId,
              },
              ws
            );
          } else if (recipientId) {
            // Direct 1:1 message to recipient
            sendToUser(recipientId, {
              type: 'incoming_chat_message',
              message,
              recipientId,
            });
          }
          break;
        }

        // Live QR / ID Friend Requests
        case 'send_friend_request': {
          const sender = clients.get(ws);
          if (!sender) return;

          const { toUserId, fromUser } = msg;
          const delivered = sendToUser(toUserId, {
            type: 'incoming_friend_request',
            fromUser: fromUser || {
              id: sender.id,
              name: sender.name,
              avatar: sender.avatar,
              amigosId: sender.amigosId,
            },
          });

          sendTo(ws, {
            type: 'friend_request_sent',
            toUserId,
            delivered,
          });
          break;
        }

        case 'respond_friend_request': {
          const responder = clients.get(ws);
          if (!responder) return;

          const { toUserId, fromUser, accepted } = msg;
          sendToUser(toUserId, {
            type: 'friend_request_response',
            fromUser: fromUser || {
              id: responder.id,
              name: responder.name,
              avatar: responder.avatar,
            },
            accepted,
          });
          break;
        }

        // OpenChat Room creation & join
        case 'create_openchat': {
          const { room } = msg;
          if (room) {
            broadcastAll({
              type: 'openchat_room_created',
              room,
            });
          }
          break;
        }

        // Multiplayer Matchmaking
        case 'join_queue': {
          const player = clients.get(ws);
          if (!player) return;

          player.status = 'in_queue';
          player.currentGameId = msg.gameId;

          // Check if someone else is waiting in queue
          const queueIndex = matchmakingQueue.findIndex((q) => q.player.id !== player.id);
          if (queueIndex !== -1) {
            const opponentEntry = matchmakingQueue.splice(queueIndex, 1)[0];
            const opponent = opponentEntry.player;

            const chosenGame = msg.gameId || opponentEntry.gameId || 'tug_of_war';
            const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

            const room: GameRoom = {
              id: roomId,
              gameId: chosenGame,
              p1: { id: opponent.id, name: opponent.name, avatar: opponent.avatar },
              p2: { id: player.id, name: player.name, avatar: player.avatar },
              status: 'playing',
              createdAt: Date.now(),
            };

            gameRooms.set(roomId, room);
            player.status = 'in_game';
            opponent.status = 'in_game';

            // Notify P1 (Opponent)
            sendTo(opponent.ws, {
              type: 'match_found',
              roomId,
              gameId: chosenGame,
              role: 'p1',
              myRole: 'p1',
              opponent: { id: player.id, name: player.name, avatar: player.avatar },
            });

            // Notify P2 (Current Player)
            sendTo(player.ws, {
              type: 'match_found',
              roomId,
              gameId: chosenGame,
              role: 'p2',
              myRole: 'p2',
              opponent: { id: opponent.id, name: opponent.name, avatar: opponent.avatar },
            });

            broadcastLobby();
          } else {
            matchmakingQueue.push({ player, gameId: msg.gameId, joinedAt: Date.now() });
            sendTo(ws, { type: 'queue_waiting', gameId: msg.gameId });
            broadcastLobby();
          }
          break;
        }

        case 'leave_queue': {
          const player = clients.get(ws);
          if (!player) return;

          player.status = 'idle';
          const idx = matchmakingQueue.findIndex((q) => q.player.id === player.id);
          if (idx !== -1) matchmakingQueue.splice(idx, 1);

          sendTo(ws, { type: 'queue_left' });
          broadcastLobby();
          break;
        }

        case 'send_invite': {
          const sender = clients.get(ws);
          if (!sender) return;

          const toUserId = msg.toUserId;
          const gameId = msg.gameId;
          const gameName = msg.gameName;
          const inviteId = `inv_${Date.now()}`;

          const delivered = sendToUser(toUserId, {
            type: 'incoming_invite',
            inviteId,
            fromUser: { id: sender.id, name: sender.name, avatar: sender.avatar },
            gameId,
            gameName,
          });

          sendTo(ws, {
            type: 'invite_sent',
            toUserId,
            delivered,
          });
          break;
        }

        case 'respond_invite': {
          const receiver = clients.get(ws);
          if (!receiver) return;

          const { fromUserId, accepted, gameId } = msg;

          if (!accepted) {
            sendToUser(fromUserId, {
              type: 'invite_declined',
              fromUser: { id: receiver.id, name: receiver.name },
            });
            return;
          }

          const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const room: GameRoom = {
            id: roomId,
            gameId,
            p1: { id: fromUserId, name: 'Opponent', avatar: '' },
            p2: { id: receiver.id, name: receiver.name, avatar: receiver.avatar },
            status: 'playing',
            createdAt: Date.now(),
          };

          let senderPlayer: OnlinePlayer | null = null;
          for (const p of clients.values()) {
            if (p.id === fromUserId) {
              senderPlayer = p;
              room.p1 = { id: p.id, name: p.name, avatar: p.avatar };
              break;
            }
          }

          gameRooms.set(roomId, room);
          receiver.status = 'in_game';
          if (senderPlayer) senderPlayer.status = 'in_game';

          // Notify sender (P1)
          if (senderPlayer) {
            sendTo(senderPlayer.ws, {
              type: 'match_found',
              roomId,
              gameId,
              role: 'p1',
              myRole: 'p1',
              opponent: { id: receiver.id, name: receiver.name, avatar: receiver.avatar },
            });
          }

          // Notify receiver (P2)
          sendTo(ws, {
            type: 'match_found',
            roomId,
            gameId,
            role: 'p2',
            myRole: 'p2',
            opponent: senderPlayer
              ? { id: senderPlayer.id, name: senderPlayer.name, avatar: senderPlayer.avatar }
              : { id: fromUserId, name: 'Opponent', avatar: '' },
          });

          broadcastLobby();
          break;
        }

        case 'game_action': {
          const { roomId, action, payload } = msg;
          const room = gameRooms.get(roomId);
          if (!room) return;

          const sender = clients.get(ws);
          if (!sender) return;

          const targetUserId = sender.id === room.p1.id ? room.p2.id : room.p1.id;
          sendToUser(targetUserId, {
            type: 'opponent_game_action',
            roomId,
            action,
            payload,
            senderId: sender.id,
          });
          break;
        }

        case 'game_over': {
          const { roomId, winner } = msg;
          const room = gameRooms.get(roomId);
          if (!room) return;

          const sender = clients.get(ws);
          if (!sender) return;

          const targetUserId = sender.id === room.p1.id ? room.p2.id : room.p1.id;
          sendToUser(targetUserId, {
            type: 'opponent_game_over',
            roomId,
            winner,
          });
          break;
        }

        case 'rematch_request': {
          const { roomId } = msg;
          const room = gameRooms.get(roomId);
          if (!room) return;

          const sender = clients.get(ws);
          if (!sender) return;

          const targetUserId = sender.id === room.p1.id ? room.p2.id : room.p1.id;
          sendToUser(targetUserId, {
            type: 'rematch_requested',
            roomId,
          });
          break;
        }

        case 'leave_room': {
          const { roomId } = msg;
          const room = gameRooms.get(roomId);
          if (room) {
            const sender = clients.get(ws);
            if (sender) {
              const targetUserId = sender.id === room.p1.id ? room.p2.id : room.p1.id;
              sendToUser(targetUserId, {
                type: 'opponent_left_room',
                roomId,
              });
              sender.status = 'idle';
            }
            gameRooms.delete(roomId);
            broadcastLobby();
          }
          break;
        }

        // Real-User Only AmigoCall Matchmaking
        case 'join_amigocall': {
          const player = clients.get(ws);
          if (!player) return;

          // Remove any previous queue entry for this user
          const exIdx = amigoCallQueue.findIndex((q) => q.player.id === player.id);
          if (exIdx !== -1) amigoCallQueue.splice(exIdx, 1);

          // Check if another real user is waiting in the AmigoCall queue
          const opponentEntry = amigoCallQueue.find(
            (q) => q.player.id !== player.id && q.ws.readyState === WebSocket.OPEN
          );

          if (opponentEntry) {
            // Remove opponent from queue
            const oppIdx = amigoCallQueue.indexOf(opponentEntry);
            if (oppIdx !== -1) amigoCallQueue.splice(oppIdx, 1);

            const roomId = `amigocall_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const room: AmigoCallRoom = {
              id: roomId,
              p1: {
                id: opponentEntry.player.id,
                name: opponentEntry.player.name,
                avatar: opponentEntry.player.avatar,
                amigosId: opponentEntry.player.amigosId,
                ws: opponentEntry.ws,
              },
              p2: {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                amigosId: player.amigosId,
                ws,
              },
            };
            amigoCallRooms.set(roomId, room);

            // Connect real User A
            sendTo(opponentEntry.ws, {
              type: 'amigocall_matched',
              roomId,
              peer: {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                amigosId: player.amigosId,
              },
            });

            // Connect real User B
            sendTo(ws, {
              type: 'amigocall_matched',
              roomId,
              peer: {
                id: opponentEntry.player.id,
                name: opponentEntry.player.name,
                avatar: opponentEntry.player.avatar,
                amigosId: opponentEntry.player.amigosId,
              },
            });
          } else {
            // Put in waiting queue
            amigoCallQueue.push({ player, ws, joinedAt: Date.now() });

            // Count other real online clients connected on the server
            const otherConnected = Array.from(clients.values()).filter(
              (p) => p.id !== player.id && p.ws.readyState === WebSocket.OPEN
            );

            if (otherConnected.length === 0) {
              sendTo(ws, {
                type: 'amigocall_no_users',
                message: 'No user is online',
                onlineCount: 0,
              });
            } else {
              sendTo(ws, {
                type: 'amigocall_waiting',
                message: 'Finding online user...',
                onlineCount: otherConnected.length,
              });
            }
          }
          break;
        }

        case 'leave_amigocall': {
          const player = clients.get(ws);
          if (player) {
            const qIdx = amigoCallQueue.findIndex((q) => q.player.id === player.id);
            if (qIdx !== -1) amigoCallQueue.splice(qIdx, 1);

            for (const [roomId, room] of amigoCallRooms.entries()) {
              if (room.p1.id === player.id || room.p2.id === player.id) {
                const partner = room.p1.id === player.id ? room.p2 : room.p1;
                sendTo(partner.ws, {
                  type: 'amigocall_peer_left',
                  roomId,
                });
                amigoCallRooms.delete(roomId);
              }
            }
          }
          break;
        }

        case 'amigocall_message': {
          const { roomId, text } = msg;
          const room = amigoCallRooms.get(roomId);
          if (room) {
            const sender = clients.get(ws);
            if (sender) {
              const recipient = room.p1.id === sender.id ? room.p2 : room.p1;
              sendTo(recipient.ws, {
                type: 'amigocall_incoming_message',
                roomId,
                sender: {
                  id: sender.id,
                  name: sender.name,
                },
                text,
                time: 'Just now',
              });
            }
          }
          break;
        }

        case 'amigocall_signal': {
          const { roomId, signal } = msg;
          const room = amigoCallRooms.get(roomId);
          if (room) {
            const sender = clients.get(ws);
            if (sender) {
              const recipient = room.p1.id === sender.id ? room.p2 : room.p1;
              sendTo(recipient.ws, {
                type: 'amigocall_incoming_signal',
                roomId,
                signal,
              });
            }
          }
          break;
        }

        // Direct 1-on-1 Real Calling (VoiceTalk & FaceTalk)
        case 'direct_call_initiate': {
          const sender = clients.get(ws);
          if (!sender) return;

          const { toUserId, callType, callId } = msg;

          let recipientWs: WebSocket | null = null;
          let recipientPlayer: OnlinePlayer | null = null;
          for (const [cWs, player] of clients.entries()) {
            if (player.id === toUserId && cWs.readyState === WebSocket.OPEN) {
              recipientWs = cWs;
              recipientPlayer = player;
              break;
            }
          }

          if (!recipientWs || !recipientPlayer) {
            sendTo(ws, {
              type: 'direct_call_unavailable',
              callId,
              toUserId,
              reason: 'offline',
              message: 'User is currently offline',
            });
          } else {
            sendTo(recipientWs, {
              type: 'incoming_direct_call',
              callId,
              callType,
              fromUser: {
                id: sender.id,
                name: sender.name,
                avatar: sender.avatar,
                amigosId: sender.amigosId,
              },
            });
            sendTo(ws, {
              type: 'direct_call_ringing',
              callId,
              toUserId,
            });
          }
          break;
        }

        case 'direct_call_respond': {
          const sender = clients.get(ws);
          if (!sender) return;

          const { callerId, callId, accepted } = msg;
          sendToUser(callerId, {
            type: 'direct_call_response',
            callId,
            accepted,
            responderId: sender.id,
            responder: {
              id: sender.id,
              name: sender.name,
              avatar: sender.avatar,
              amigosId: sender.amigosId,
            },
          });
          break;
        }

        case 'direct_call_signal': {
          const { targetUserId, callId, signal } = msg;
          sendToUser(targetUserId, {
            type: 'incoming_direct_call_signal',
            callId,
            signal,
          });
          break;
        }

        case 'direct_call_end': {
          const { targetUserId, callId } = msg;
          if (targetUserId) {
            sendToUser(targetUserId, {
              type: 'direct_call_ended',
              callId,
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const player = clients.get(ws);
    if (player) {
      const qIdx = matchmakingQueue.findIndex((q) => q.player.id === player.id);
      if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

      const amiQIdx = amigoCallQueue.findIndex((q) => q.player.id === player.id);
      if (amiQIdx !== -1) amigoCallQueue.splice(amiQIdx, 1);

      for (const [roomId, room] of amigoCallRooms.entries()) {
        if (room.p1.id === player.id || room.p2.id === player.id) {
          const partner = room.p1.id === player.id ? room.p2 : room.p1;
          sendTo(partner.ws, {
            type: 'amigocall_peer_left',
            roomId,
          });
          amigoCallRooms.delete(roomId);
        }
      }

      for (const [roomId, room] of gameRooms.entries()) {
        if (room.p1.id === player.id || room.p2.id === player.id) {
          const targetUserId = room.p1.id === player.id ? room.p2.id : room.p1.id;
          sendToUser(targetUserId, {
            type: 'opponent_disconnected',
            roomId,
          });
          gameRooms.delete(roomId);
        }
      }

      clients.delete(ws);
      broadcastLobby();
    }
  });
});

async function startServer() {
  // Static assets serving with high priority to avoid SPA fallback returning HTML for images
  app.use('/src/assets', express.static(path.resolve(__dirname, 'public', 'src', 'assets')));
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src', 'assets')));
  app.use('/assets', express.static(path.resolve(__dirname, 'public', 'assets')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Amigos Server running on port ${PORT}`);
  });
}

startServer();
