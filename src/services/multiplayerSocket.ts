import { KakaoUser, KakaoMessage, OpenChatRoom } from '../types/kakaotalk';

export interface OnlinePlayerInfo {
  id: string;
  name: string;
  amigosId?: string;
  avatar: string;
  status: 'idle' | 'in_queue' | 'in_game';
  currentGameId?: string;
}

export interface ActiveRoomInfo {
  roomId: string;
  gameId: string;
  role: 'p1' | 'p2';
  opponent: { id: string; name: string; avatar: string };
}

export interface IncomingInviteInfo {
  inviteId: string;
  fromUser: { id: string; name: string; avatar: string };
  gameId: string;
  gameName: string;
}

export interface IncomingFriendRequestInfo {
  fromUser: { id: string; name: string; avatar: string; amigosId?: string };
}

export interface AmigoCallPeer {
  id: string;
  name: string;
  avatar: string;
  amigosId?: string;
}

export interface IncomingDirectCallInfo {
  callId: string;
  callType: 'voice' | 'video';
  fromUser: {
    id: string;
    name: string;
    avatar: string;
    amigosId?: string;
  };
}

export interface DirectCallResponseInfo {
  callId: string;
  accepted: boolean;
  responderId: string;
  responder?: {
    id: string;
    name: string;
    avatar: string;
    amigosId?: string;
  };
}

type Listener = () => void;
type ActionCallback = (action: string, payload: any) => void;
type ChatMessageCallback = (msg: KakaoMessage, openChatId?: string, recipientId?: string) => void;
type FriendRequestCallback = (req: IncomingFriendRequestInfo) => void;
type FriendResponseCallback = (fromUser: any, accepted: boolean) => void;
type OpenChatCreatedCallback = (room: OpenChatRoom) => void;
type AmigoCallMatchedCallback = (data: { roomId: string; peer: AmigoCallPeer }) => void;
type AmigoCallNoUsersCallback = (data: { message: string; onlineCount: number }) => void;
type AmigoCallWaitingCallback = (data: { message: string; onlineCount: number }) => void;
type AmigoCallPeerLeftCallback = (data: { roomId: string }) => void;
type AmigoCallMessageCallback = (data: { roomId: string; sender: { id: string; name: string }; text: string; time: string }) => void;
type AmigoCallSignalCallback = (data: { roomId: string; signal: any }) => void;
type IncomingDirectCallCallback = (call: IncomingDirectCallInfo) => void;
type DirectCallResponseCallback = (data: DirectCallResponseInfo) => void;
type DirectCallUnavailableCallback = (data: { callId: string; reason: string; message: string }) => void;
type DirectCallRingingCallback = (data: { callId: string }) => void;
type DirectCallEndedCallback = (data: { callId: string }) => void;
type DirectCallSignalCallback = (data: { callId: string; signal: any }) => void;

class MultiplayerSocketService {
  private ws: WebSocket | null = null;
  private currentUser: KakaoUser | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  public isConnected = false;
  public onlinePlayers: OnlinePlayerInfo[] = [];
  public currentRoom: ActiveRoomInfo | null = null;
  public isSearchingMatch = false;
  public incomingInvite: IncomingInviteInfo | null = null;
  public incomingFriendRequest: IncomingFriendRequestInfo | null = null;

  private listeners: Set<Listener> = new Set();
  private gameActionCallbacks: Set<ActionCallback> = new Set();
  private opponentDisconnectCallbacks: Set<() => void> = new Set();
  private rematchCallbacks: Set<() => void> = new Set();
  private chatMessageCallbacks: Set<ChatMessageCallback> = new Set();
  private friendRequestCallbacks: Set<FriendRequestCallback> = new Set();
  private friendResponseCallbacks: Set<FriendResponseCallback> = new Set();
  private openChatCreatedCallbacks: Set<OpenChatCreatedCallback> = new Set();
  private amigoCallMatchedCallbacks: Set<AmigoCallMatchedCallback> = new Set();
  private amigoCallNoUsersCallbacks: Set<AmigoCallNoUsersCallback> = new Set();
  private amigoCallWaitingCallbacks: Set<AmigoCallWaitingCallback> = new Set();
  private amigoCallPeerLeftCallbacks: Set<AmigoCallPeerLeftCallback> = new Set();
  private amigoCallMessageCallbacks: Set<AmigoCallMessageCallback> = new Set();
  private amigoCallSignalCallbacks: Set<AmigoCallSignalCallback> = new Set();
  private incomingDirectCallCallbacks: Set<IncomingDirectCallCallback> = new Set();
  private directCallResponseCallbacks: Set<DirectCallResponseCallback> = new Set();
  private directCallUnavailableCallbacks: Set<DirectCallUnavailableCallback> = new Set();
  private directCallRingingCallbacks: Set<DirectCallRingingCallback> = new Set();
  private directCallEndedCallbacks: Set<DirectCallEndedCallback> = new Set();
  private directCallSignalCallbacks: Set<DirectCallSignalCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('amigos_multiplayer_tab_bus');
      this.broadcastChannel.onmessage = (e) => {
        this.handleBroadcastMessage(e.data);
      };

      window.addEventListener('beforeunload', () => {
        if (this.currentUser && this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'tab_presence_leave',
            playerId: this.currentUser.id,
          });
        }
      });
    }
  }

  public init(user: KakaoUser) {
    this.currentUser = user;
    this.connect();
    this.announceTabPresence();
  }

  public updateProfile(user: KakaoUser) {
    this.currentUser = user;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'auth',
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          amigosId: user.kakaoId,
        },
      });
    }
    this.announceTabPresence();
  }

  private announceTabPresence() {
    if (!this.currentUser || !this.broadcastChannel) return;
    this.broadcastChannel.postMessage({
      type: 'tab_presence_announce',
      player: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        avatar: this.currentUser.avatar,
        amigosId: this.currentUser.amigosId || this.currentUser.kakaoId,
        status: 'idle',
      },
    });
  }

  public isUserOnline(userId?: string, name?: string, amigosId?: string): boolean {
    if (!userId && !name && !amigosId) return false;
    return this.onlinePlayers.some((p) => {
      if (userId && p.id === userId) return true;
      if (amigosId && p.amigosId && p.amigosId.toLowerCase() === amigosId.toLowerCase()) return true;
      if (name && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase()) return true;
      return false;
    });
  }

  public getOnlineFriends(friends: KakaoUser[]): KakaoUser[] {
    return friends.filter((f) => !f.isChannel && this.isUserOnline(f.id, f.name, f.amigosId || f.kakaoId));
  }

  private connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.currentUser) {
          this.send({
            type: 'auth',
            user: {
              id: this.currentUser.id,
              name: this.currentUser.name,
              avatar: this.currentUser.avatar,
              amigosId: this.currentUser.amigosId || this.currentUser.kakaoId,
            },
          });
        }
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('Multiplayer WebSocket error, will retry:', err);
      };
    } catch (e) {
      console.error('Multiplayer WebSocket init error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleServerMessage(data: any) {
    switch (data.type) {
      case 'lobby_players': {
        const rawPlayers: OnlinePlayerInfo[] = data.players || [];
        this.onlinePlayers = rawPlayers.filter((p) => p.id !== this.currentUser?.id);
        this.notify();
        break;
      }

      case 'queue_waiting': {
        this.isSearchingMatch = true;
        this.notify();
        break;
      }

      case 'queue_left': {
        this.isSearchingMatch = false;
        this.notify();
        break;
      }

      case 'match_found': {
        this.isSearchingMatch = false;
        this.currentRoom = {
          roomId: data.roomId,
          gameId: data.gameId,
          role: data.role,
          opponent: data.opponent,
        };
        this.notify();
        break;
      }

      case 'incoming_invite': {
        this.incomingInvite = {
          inviteId: data.inviteId,
          fromUser: data.fromUser,
          gameId: data.gameId,
          gameName: data.gameName,
        };
        this.notify();
        break;
      }

      case 'incoming_chat_message': {
        for (const cb of this.chatMessageCallbacks) {
          cb(data.message, data.openChatId, data.recipientId);
        }
        break;
      }

      case 'incoming_friend_request': {
        this.incomingFriendRequest = { fromUser: data.fromUser };
        for (const cb of this.friendRequestCallbacks) {
          cb({ fromUser: data.fromUser });
        }
        this.notify();
        break;
      }

      case 'friend_request_response': {
        for (const cb of this.friendResponseCallbacks) {
          cb(data.fromUser, data.accepted);
        }
        break;
      }

      case 'openchat_room_created': {
        for (const cb of this.openChatCreatedCallbacks) {
          cb(data.room);
        }
        break;
      }

      case 'opponent_game_action': {
        if (this.currentRoom && data.roomId === this.currentRoom.roomId) {
          for (const cb of this.gameActionCallbacks) {
            cb(data.action, data.payload);
          }
        }
        break;
      }

      case 'opponent_disconnected':
      case 'opponent_left_room': {
        if (this.currentRoom && data.roomId === this.currentRoom.roomId) {
          for (const cb of this.opponentDisconnectCallbacks) {
            cb();
          }
        }
        break;
      }

      case 'rematch_requested': {
        for (const cb of this.rematchCallbacks) {
          cb();
        }
        break;
      }

      case 'amigocall_matched': {
        for (const cb of this.amigoCallMatchedCallbacks) {
          cb({ roomId: data.roomId, peer: data.peer });
        }
        break;
      }

      case 'amigocall_no_users': {
        for (const cb of this.amigoCallNoUsersCallbacks) {
          cb({ message: data.message || 'No user is online', onlineCount: data.onlineCount || 0 });
        }
        break;
      }

      case 'amigocall_waiting': {
        for (const cb of this.amigoCallWaitingCallbacks) {
          cb({ message: data.message || 'Finding online user...', onlineCount: data.onlineCount || 0 });
        }
        break;
      }

      case 'amigocall_peer_left': {
        for (const cb of this.amigoCallPeerLeftCallbacks) {
          cb({ roomId: data.roomId });
        }
        break;
      }

      case 'amigocall_incoming_message': {
        for (const cb of this.amigoCallMessageCallbacks) {
          cb({ roomId: data.roomId, sender: data.sender, text: data.text, time: data.time || 'Just now' });
        }
        break;
      }

      case 'amigocall_incoming_signal': {
        for (const cb of this.amigoCallSignalCallbacks) {
          cb({ roomId: data.roomId, signal: data.signal });
        }
        break;
      }

      case 'incoming_direct_call': {
        for (const cb of this.incomingDirectCallCallbacks) {
          cb({ callId: data.callId, callType: data.callType, fromUser: data.fromUser });
        }
        break;
      }

      case 'direct_call_response': {
        for (const cb of this.directCallResponseCallbacks) {
          cb({ callId: data.callId, accepted: data.accepted, responderId: data.responderId, responder: data.responder });
        }
        break;
      }

      case 'direct_call_unavailable': {
        for (const cb of this.directCallUnavailableCallbacks) {
          cb({ callId: data.callId, reason: data.reason, message: data.message });
        }
        break;
      }

      case 'direct_call_ringing': {
        for (const cb of this.directCallRingingCallbacks) {
          cb({ callId: data.callId });
        }
        break;
      }

      case 'direct_call_ended': {
        for (const cb of this.directCallEndedCallbacks) {
          cb({ callId: data.callId });
        }
        break;
      }

      case 'incoming_direct_call_signal': {
        for (const cb of this.directCallSignalCallbacks) {
          cb({ callId: data.callId, signal: data.signal });
        }
        break;
      }
    }
  }

  private handleBroadcastMessage(data: any) {
    if (data.type === 'tab_direct_call_initiate' && data.toUserId === this.currentUser?.id) {
      for (const cb of this.incomingDirectCallCallbacks) {
        cb({ callId: data.callId, callType: data.callType, fromUser: data.fromUser });
      }
    }
    if (data.type === 'tab_direct_call_respond' && data.callerId === this.currentUser?.id) {
      for (const cb of this.directCallResponseCallbacks) {
        cb({ callId: data.callId, accepted: data.accepted, responderId: data.responderId, responder: data.responder });
      }
    }
    if (data.type === 'tab_direct_call_signal' && data.targetUserId === this.currentUser?.id) {
      for (const cb of this.directCallSignalCallbacks) {
        cb({ callId: data.callId, signal: data.signal });
      }
    }
    if (data.type === 'tab_direct_call_end' && data.targetUserId === this.currentUser?.id) {
      for (const cb of this.directCallEndedCallbacks) {
        cb({ callId: data.callId });
      }
    }
    if (data.type === 'tab_game_action' && this.currentRoom?.roomId === data.roomId) {
      if (data.senderId !== this.currentUser?.id) {
        for (const cb of this.gameActionCallbacks) {
          cb(data.action, data.payload);
        }
      }
    }
    if (data.type === 'tab_chat_message' && data.senderId !== this.currentUser?.id) {
      for (const cb of this.chatMessageCallbacks) {
        cb(data.message, data.openChatId, data.recipientId);
      }
    }
    if (data.type === 'tab_presence_announce' && data.player && data.player.id !== this.currentUser?.id) {
      const existingIdx = this.onlinePlayers.findIndex((p) => p.id === data.player.id);
      if (existingIdx !== -1) {
        this.onlinePlayers[existingIdx] = data.player;
      } else {
        this.onlinePlayers.push(data.player);
      }
      this.notify();
    }
    if (data.type === 'tab_presence_leave' && data.playerId) {
      this.onlinePlayers = this.onlinePlayers.filter((p) => p.id !== data.playerId);
      this.notify();
    }
    if (data.type === 'tab_friend_request' && data.toUserId === this.currentUser?.id) {
      this.incomingFriendRequest = { fromUser: data.fromUser };
      for (const cb of this.friendRequestCallbacks) {
        cb({ fromUser: data.fromUser });
      }
      this.notify();
    }
    if (data.type === 'tab_amigocall_message' && data.senderId !== this.currentUser?.id) {
      for (const cb of this.amigoCallMessageCallbacks) {
        cb({
          roomId: data.roomId,
          sender: { id: data.senderId, name: data.senderName || 'Partner' },
          text: data.text,
          time: 'Just now',
        });
      }
    }
    if (data.type === 'tab_amigocall_signal' && data.senderId !== this.currentUser?.id) {
      for (const cb of this.amigoCallSignalCallbacks) {
        cb({ roomId: data.roomId, signal: data.signal });
      }
    }
    if (data.type === 'tab_amigocall_peer_left' && data.senderId !== this.currentUser?.id) {
      for (const cb of this.amigoCallPeerLeftCallbacks) {
        cb({ roomId: data.roomId });
      }
    }
  }

  // Live Chat Messaging
  public sendChatMessage(message: KakaoMessage, recipientId?: string, openChatId?: string) {
    this.send({
      type: 'send_chat_message',
      message,
      recipientId,
      openChatId,
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_chat_message',
        senderId: this.currentUser?.id,
        message,
        recipientId,
        openChatId,
      });
    }
  }

  // QR / ID Friend Requests
  public sendFriendRequest(toUserId: string, fromUser?: any) {
    const sender = fromUser || (this.currentUser ? {
      id: this.currentUser.id,
      name: this.currentUser.name,
      avatar: this.currentUser.avatar,
      amigosId: this.currentUser.amigosId || this.currentUser.kakaoId,
    } : null);

    this.send({
      type: 'send_friend_request',
      toUserId,
      fromUser: sender,
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_friend_request',
        toUserId,
        fromUser: sender,
      });
    }
  }

  public respondFriendRequest(toUserId: string, accepted: boolean) {
    this.incomingFriendRequest = null;
    this.send({
      type: 'respond_friend_request',
      toUserId,
      fromUser: this.currentUser
        ? {
            id: this.currentUser.id,
            name: this.currentUser.name,
            avatar: this.currentUser.avatar,
          }
        : null,
      accepted,
    });
    this.notify();
  }

  public broadcastOpenChatCreated(room: OpenChatRoom) {
    this.send({
      type: 'create_openchat',
      room,
    });
  }

  // Multiplayer Game Actions
  public joinQueue(gameId?: string) {
    this.isSearchingMatch = true;
    this.send({ type: 'join_queue', gameId });
    this.notify();
  }

  public leaveQueue() {
    this.isSearchingMatch = false;
    this.send({ type: 'leave_queue' });
    this.notify();
  }

  public sendInvite(toUserId: string, gameId: string, gameName: string) {
    this.send({ type: 'send_invite', toUserId, gameId, gameName });
  }

  public respondInvite(inviteId: string, fromUserId: string, accepted: boolean, gameId: string) {
    this.incomingInvite = null;
    this.send({
      type: 'respond_invite',
      inviteId,
      fromUserId,
      accepted,
      gameId,
    });
    this.notify();
  }

  public sendGameAction(action: string, payload: any = {}) {
    if (!this.currentRoom) return;

    this.send({
      type: 'game_action',
      roomId: this.currentRoom.roomId,
      action,
      payload,
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_game_action',
        roomId: this.currentRoom.roomId,
        senderId: this.currentUser?.id,
        action,
        payload,
      });
    }
  }

  public sendGameOver(winner: 'p1' | 'p2') {
    if (!this.currentRoom) return;
    this.send({
      type: 'game_over',
      roomId: this.currentRoom.roomId,
      winner,
    });
  }

  public requestRematch() {
    if (!this.currentRoom) return;
    this.send({
      type: 'rematch_request',
      roomId: this.currentRoom.roomId,
    });
  }

  public leaveRoom() {
    if (this.currentRoom) {
      this.send({
        type: 'leave_room',
        roomId: this.currentRoom.roomId,
      });
      this.currentRoom = null;
      this.notify();
    }
  }

  // Event Subscriptions
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onChatMessage(cb: ChatMessageCallback): () => void {
    this.chatMessageCallbacks.add(cb);
    return () => this.chatMessageCallbacks.delete(cb);
  }

  public onFriendRequest(cb: FriendRequestCallback): () => void {
    this.friendRequestCallbacks.add(cb);
    return () => this.friendRequestCallbacks.delete(cb);
  }

  public onFriendResponse(cb: FriendResponseCallback): () => void {
    this.friendResponseCallbacks.add(cb);
    return () => this.friendResponseCallbacks.delete(cb);
  }

  public onOpenChatCreated(cb: OpenChatCreatedCallback): () => void {
    this.openChatCreatedCallbacks.add(cb);
    return () => this.openChatCreatedCallbacks.delete(cb);
  }

  public onGameAction(cb: ActionCallback): () => void {
    this.gameActionCallbacks.add(cb);
    return () => this.gameActionCallbacks.delete(cb);
  }

  public onOpponentDisconnect(cb: () => void): () => void {
    this.opponentDisconnectCallbacks.add(cb);
    return () => this.opponentDisconnectCallbacks.delete(cb);
  }

  public onRematch(cb: () => void): () => void {
    this.rematchCallbacks.add(cb);
    return () => this.rematchCallbacks.delete(cb);
  }

  // Real User AmigoCall Methods
  public joinAmigoCall() {
    this.send({ type: 'join_amigocall' });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_amigocall_join',
        senderId: this.currentUser?.id,
        user: this.currentUser,
      });
    }
  }

  public leaveAmigoCall() {
    this.send({ type: 'leave_amigocall' });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_amigocall_leave',
        senderId: this.currentUser?.id,
      });
    }
  }

  public sendAmigoCallMessage(roomId: string, text: string) {
    this.send({ type: 'amigocall_message', roomId, text });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_amigocall_message',
        senderId: this.currentUser?.id,
        senderName: this.currentUser?.name,
        roomId,
        text,
      });
    }
  }

  public sendAmigoCallSignal(roomId: string, signal: any) {
    this.send({ type: 'amigocall_signal', roomId, signal });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_amigocall_signal',
        senderId: this.currentUser?.id,
        roomId,
        signal,
      });
    }
  }

  public onAmigoCallMatched(cb: AmigoCallMatchedCallback): () => void {
    this.amigoCallMatchedCallbacks.add(cb);
    return () => this.amigoCallMatchedCallbacks.delete(cb);
  }

  public onAmigoCallNoUsers(cb: AmigoCallNoUsersCallback): () => void {
    this.amigoCallNoUsersCallbacks.add(cb);
    return () => this.amigoCallNoUsersCallbacks.delete(cb);
  }

  public onAmigoCallWaiting(cb: AmigoCallWaitingCallback): () => void {
    this.amigoCallWaitingCallbacks.add(cb);
    return () => this.amigoCallWaitingCallbacks.delete(cb);
  }

  public onAmigoCallPeerLeft(cb: AmigoCallPeerLeftCallback): () => void {
    this.amigoCallPeerLeftCallbacks.add(cb);
    return () => this.amigoCallPeerLeftCallbacks.delete(cb);
  }

  public onAmigoCallMessage(cb: AmigoCallMessageCallback): () => void {
    this.amigoCallMessageCallbacks.add(cb);
    return () => this.amigoCallMessageCallbacks.delete(cb);
  }

  public onAmigoCallSignal(cb: AmigoCallSignalCallback): () => void {
    this.amigoCallSignalCallbacks.add(cb);
    return () => this.amigoCallSignalCallbacks.delete(cb);
  }

  // Direct 1-on-1 Real Calling Methods
  public initiateDirectCall(toUserId: string, callType: 'voice' | 'video', callId: string) {
    this.send({
      type: 'direct_call_initiate',
      toUserId,
      callType,
      callId,
    });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_direct_call_initiate',
        toUserId,
        callType,
        callId,
        fromUser: {
          id: this.currentUser?.id,
          name: this.currentUser?.name,
          avatar: this.currentUser?.avatar,
          amigosId: this.currentUser?.amigosId || this.currentUser?.kakaoId,
        },
      });
    }
  }

  public respondDirectCall(callerId: string, callId: string, accepted: boolean) {
    this.send({
      type: 'direct_call_respond',
      callerId,
      callId,
      accepted,
    });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_direct_call_respond',
        callerId,
        callId,
        accepted,
        responderId: this.currentUser?.id,
        responder: {
          id: this.currentUser?.id,
          name: this.currentUser?.name,
          avatar: this.currentUser?.avatar,
          amigosId: this.currentUser?.amigosId || this.currentUser?.kakaoId,
        },
      });
    }
  }

  public sendDirectCallSignal(targetUserId: string, callId: string, signal: any) {
    this.send({
      type: 'direct_call_signal',
      targetUserId,
      callId,
      signal,
    });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_direct_call_signal',
        targetUserId,
        callId,
        signal,
      });
    }
  }

  public endDirectCall(targetUserId: string, callId: string) {
    this.send({
      type: 'direct_call_end',
      targetUserId,
      callId,
    });
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'tab_direct_call_end',
        targetUserId,
        callId,
      });
    }
  }

  public onIncomingDirectCall(cb: IncomingDirectCallCallback): () => void {
    this.incomingDirectCallCallbacks.add(cb);
    return () => this.incomingDirectCallCallbacks.delete(cb);
  }

  public onDirectCallResponse(cb: DirectCallResponseCallback): () => void {
    this.directCallResponseCallbacks.add(cb);
    return () => this.directCallResponseCallbacks.delete(cb);
  }

  public onDirectCallUnavailable(cb: DirectCallUnavailableCallback): () => void {
    this.directCallUnavailableCallbacks.add(cb);
    return () => this.directCallUnavailableCallbacks.delete(cb);
  }

  public onDirectCallRinging(cb: DirectCallRingingCallback): () => void {
    this.directCallRingingCallbacks.add(cb);
    return () => this.directCallRingingCallbacks.delete(cb);
  }

  public onDirectCallEnded(cb: DirectCallEndedCallback): () => void {
    this.directCallEndedCallbacks.add(cb);
    return () => this.directCallEndedCallbacks.delete(cb);
  }

  public onDirectCallSignal(cb: DirectCallSignalCallback): () => void {
    this.directCallSignalCallbacks.add(cb);
    return () => this.directCallSignalCallbacks.delete(cb);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const multiplayerSocket = new MultiplayerSocketService();
