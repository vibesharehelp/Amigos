export type KakaoTab = 'friends' | 'chats' | 'openchat' | 'amigocall' | 'shopping' | 'more';

export interface KakaoUser {
  id: string;
  name: string;
  koreanName?: string;
  avatar: string;
  coverImage?: string;
  statusMessage?: string;
  musicTrack?: {
    title: string;
    artist: string;
  };
  birthday?: string;
  isBirthdayToday?: boolean;
  dDay?: {
    label: string;
    days: number;
  };
  isFavorite?: boolean;
  isFollowing?: boolean;
  isChannel?: boolean;
  isMe?: boolean;
  phone?: string;
  email?: string;
  kakaoId?: string;
  amigosId?: string;
  qrCode?: string;
  multiProfiles?: Array<{
    id: string;
    name: string;
    avatar: string;
    statusMessage: string;
  }>;
}

export interface KakaoEmoticon {
  id: string;
  packName: string;
  character: 'ryan' | 'apeach' | 'choonsik' | 'muzi' | 'tube' | 'frodo' | 'neo' | 'jayg';
  title: string;
  emoji: string;
  badge: string;
  animationClass?: string;
}

export interface KakaoGiftItem {
  id: string;
  brand: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: 'cafe' | 'birthday' | 'luxury' | 'delivery' | 'friends_goods' | 'beauty';
  likesCount: number;
  isPopular?: boolean;
  isBirthdayRecommend?: boolean;
  barcode: string;
  description: string;
}

export interface KakaoCoupon {
  id: string;
  item: KakaoGiftItem;
  fromName: string;
  receivedAt: number;
  expiresAt: string;
  isUsed: boolean;
}

export interface KakaoPayTransfer {
  amount: number;
  note?: string;
  isReceived: boolean;
  receivedAt?: number;
  transferId: string;
}

export interface KakaoSchedule {
  id: string;
  title: string;
  dateTime: string;
  location?: string;
  attendeesCount: number;
  isAttending?: boolean;
}

export interface KakaoMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId?: string;
  text?: string;
  emoticon?: KakaoEmoticon;
  photoUrl?: string;
  payTransfer?: KakaoPayTransfer;
  schedule?: KakaoSchedule;
  giftItem?: KakaoGiftItem;
  voiceNote?: {
    duration: number; // in seconds
    audioUrl?: string;
  };
  createdAt: number;
  unreadCount: number; // 0 or 1 in Amigos
}

export interface KakaoChat {
  id: string;
  type: 'direct' | 'group' | 'openchat';
  title: string;
  participants: KakaoUser[];
  lastMessage?: KakaoMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: number;
  wallpaper?: string;
  isOpenChat?: boolean;
  openChatRoomId?: string;
  openChatCategory?: string;
  openChatTags?: string[];
  openChatCover?: string;
  openChatMembersCount?: number;
}

export interface OpenChatRoom {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  tags: string[];
  membersCount: number;
  maxMembers: number;
  category: string;
  hostName: string;
  hostAvatar: string;
  isJoined?: boolean;
  lastMessagePreview: string;
  lastMessageTime: string;
}

export interface KakaoPayWallet {
  balance: number;
  accountNumber: string;
  bankName: string;
  recentTransfers: Array<{
    id: string;
    title: string;
    amount: number;
    timestamp: number;
    type: 'send' | 'receive' | 'payment';
  }>;
}

export interface CallSession {
  active: boolean;
  type: 'voice' | 'video';
  user: KakaoUser;
  status: 'calling' | 'connected' | 'ended';
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
}
