import {
  KakaoUser,
  KakaoChat,
  KakaoMessage,
  OpenChatRoom,
  KakaoGiftItem,
  KakaoPayWallet,
  KakaoEmoticon,
  KakaoCoupon,
} from '../types/kakaotalk';
import { sanitizeImageUrl } from '../utils/imageUtils';

const STORAGE_KEYS = {
  ME: 'kakao_me',
  FRIENDS: 'kakao_friends',
  CHATS: 'kakao_chats',
  MESSAGES: 'kakao_messages',
  OPEN_CHATS: 'kakao_open_chats',
  WALLET: 'kakao_wallet',
  GIFTS: 'kakao_gifts',
  MY_COUPONS: 'kakao_my_coupons',
  SETTINGS: 'kakao_settings',
  AUTH_STATE: 'kakao_auth_state',
  NOTIFICATIONS: 'kakao_notifications',
};

// Initial Real & Guest Friends (No Bot Accounts)
export const INITIAL_FRIENDS: KakaoUser[] = [
  {
    id: 'user_minji',
    name: 'Min-ji Kim',
    koreanName: 'Minji',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Anyone up for weekend cafe hopping? ☕️🌿',
    musicTrack: {
      title: 'Hype Boy',
      artist: 'NewJeans',
    },
    birthday: '05-18',
    isFavorite: true,
    isFollowing: true,
    kakaoId: 'minji_k',
    amigosId: 'minji_k',
    phone: '010-2415-9988',
  },
  {
    id: 'user_jihoon',
    name: 'Ji-hoon Park',
    koreanName: 'Jihoon',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Project: Escape overtime work 💻🚀',
    musicTrack: {
      title: 'Seven',
      artist: 'Jung Kook',
    },
    birthday: '11-04',
    isFavorite: true,
    isFollowing: false,
    kakaoId: 'jihoon_dev',
    amigosId: 'jihoon_dev',
    phone: '010-9182-3746',
  },
  {
    id: 'user_soyeon',
    name: 'So-yeon Lee',
    koreanName: 'Soyeon',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Pilates & healthy lifestyle 🥑🧘‍♀️',
    musicTrack: {
      title: 'Love wins all',
      artist: 'IU',
    },
    birthday: '09-12',
    isFollowing: true,
    kakaoId: 'soyeon_lee',
    amigosId: 'soyeon_lee',
    phone: '010-6754-1234',
  },
  {
    id: 'user_daniel',
    name: 'Daniel Kang',
    koreanName: 'Daniel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    statusMessage: 'Guitarist & Coffee Lover 🎸☕️',
    birthday: '12-10',
    kakaoId: 'daniel_music',
    amigosId: 'daniel_music',
    phone: '010-4491-0021',
  },
  {
    id: 'guest_1',
    name: 'Guest Explorer',
    koreanName: 'Guest',
    avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
    statusMessage: 'Guest User (Online & Ready) ☕️✨',
    kakaoId: 'guest_player1',
    amigosId: 'guest_player1',
    phone: '010-0000-1111',
  },
];

export const INITIAL_ME: KakaoUser = {
  id: 'me_alex',
  name: 'Alex',
  koreanName: 'Alex',
  avatar: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
  coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
  statusMessage: 'Cherishing good days with good people ☕️✨',
  musicTrack: {
    title: 'Love wins all',
    artist: 'IU',
  },
  dDay: {
    label: 'D-14 Jeju Island Trip',
    days: 14,
  },
  phone: '010-1234-5678',
  email: 'alex.minwoo@amigos.com',
  kakaoId: 'alex_amigo',
  amigosId: 'alex_amigo',
  qrCode: 'amigos://user/me_alex',
  isMe: true,
  multiProfiles: [
    {
      id: 'mp_work',
      name: 'Alex (Tech Lead)',
      avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
      statusMessage: 'Please send work inquiries via workplace chat.',
    },
    {
      id: 'mp_hobby',
      name: 'Alex Outdoors',
      avatar: '/src/assets/images/kawaii_pink_kitten_1791348848054.jpg',
      statusMessage: 'Weekend hiking & running crew',
    },
  ],
};

export const KAKAO_EMOTICONS: KakaoEmoticon[] = [
  {
    id: 'emo_ryan_dance',
    packName: 'Cute Ryan Life',
    character: 'ryan',
    title: 'Excited Dance',
    emoji: '🕺',
    badge: 'NEW',
  },
  {
    id: 'emo_ryan_thumbsup',
    packName: 'Cute Ryan Life',
    character: 'ryan',
    title: 'Thumbs Up!',
    emoji: '👍',
    badge: 'HOT',
  },
  {
    id: 'emo_choonsik_sweetpotato',
    packName: 'Sweet Choonsik',
    character: 'choonsik',
    title: 'Yummy Sweet Potato',
    emoji: '🍠',
    badge: 'BEST',
  },
  {
    id: 'emo_choonsik_heart',
    packName: 'Sweet Choonsik',
    character: 'choonsik',
    title: 'Heart Flutter',
    emoji: '💖',
    badge: 'HOT',
  },
  {
    id: 'emo_apeach_wink',
    packName: 'Lovely Apeach',
    character: 'apeach',
    title: 'Wink & Sparkle',
    emoji: '😉',
    badge: 'POPULAR',
  },
  {
    id: 'emo_apeach_cry',
    packName: 'Lovely Apeach',
    character: 'apeach',
    title: 'Tears of Joy',
    emoji: '🥹',
    badge: '',
  },
  {
    id: 'emo_ryan_coffee',
    packName: 'Daily Amigos Friends',
    character: 'ryan',
    title: 'Morning Coffee',
    emoji: '☕️',
    badge: '',
  },
  {
    id: 'emo_choonsik_dance',
    packName: 'Sweet Choonsik',
    character: 'choonsik',
    title: 'Groovy Dance',
    emoji: '🎶',
    badge: 'NEW',
  },
];

export const INITIAL_GIFTS: KakaoGiftItem[] = [
  {
    id: 'gift_starbucks_set',
    brand: 'Starbucks',
    title: 'Caffe Americano T (2 Cups) + Soft Fresh Cream Castella',
    price: 15300,
    originalPrice: 17000,
    imageUrl: '/src/assets/images/kakao_gift_starbucks_1791097637278.jpg',
    category: 'cafe',
    likesCount: 14280,
    isPopular: true,
    isBirthdayRecommend: true,
    barcode: '9382 7104 8821',
    description: 'A comforting gift set of sweet dessert and aromatic coffee to brighten your day.',
  },
  {
    id: 'gift_ryan_doll',
    brand: 'Amigos Friends',
    title: 'Forest Cozy Sleep Body Pillow (50cm)',
    price: 36000,
    originalPrice: 42000,
    imageUrl: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
    category: 'friends_goods',
    likesCount: 9820,
    isPopular: true,
    barcode: '4091 8823 1092',
    description: 'Ultra-soft and huggable cozy body pillow designed for peaceful, sweet dreams!',
  },
  {
    id: 'gift_choonsik_blanket',
    brand: 'Amigos Friends',
    title: 'Roasted Sweet Potato Microfiber Lap Blanket',
    price: 19800,
    imageUrl: '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg',
    category: 'friends_goods',
    likesCount: 8430,
    isBirthdayRecommend: true,
    barcode: '7721 9904 3112',
    description: 'Stay snug and warm even on the coldest winter days.',
  },
  {
    id: 'gift_baskin_cake',
    brand: 'Baskin Robbins',
    title: 'Pick & Choose What-You-Want Ice Cream Cake',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80',
    category: 'birthday',
    likesCount: 11200,
    isBirthdayRecommend: true,
    barcode: '5512 8092 4471',
    description: 'Korea signature birthday cake featuring 8 all-time favorite ice cream flavors!',
  },
  {
    id: 'gift_diptyque',
    brand: 'Diptyque',
    title: 'Eau de Parfum Fleur de Peau 75ml (Gift Wrapped)',
    price: 279000,
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80',
    category: 'luxury',
    likesCount: 15300,
    isPopular: true,
    barcode: '8810 2399 7120',
    description: 'A cozy cotton musk scent that lingers intimately on skin, signature Diptyque fragrance.',
  },
  {
    id: 'gift_bbq_chicken',
    brand: 'BBQ Chicken',
    title: 'Golden Olive Crispy Fried Chicken + 1.25L Cola',
    price: 24000,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80',
    category: 'delivery',
    likesCount: 18900,
    barcode: '3391 0021 7844',
    description: 'Crispy and juicy fried chicken voucher, the ultimate Korean night snack favorite.',
  },
];

export const INITIAL_OPEN_CHATS: OpenChatRoom[] = [
  {
    id: 'oc_kpop_lounge',
    title: 'K-POP Global Lounge 💜 [ILLIT/NewJeans/BTS]',
    description: 'Idol comebacks, concert ticketing tips, photocard trading & music chat!',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    tags: ['#KPOP', '#NewJeans', '#ILLIT', '#BTS', '#Concerts'],
    membersCount: 1420,
    maxMembers: 1500,
    category: 'K-Pop & Idol',
    hostName: 'PurpleHeart💜',
    hostAvatar: '/src/assets/images/kawaii_pink_kitten_1791348848054.jpg',
    isJoined: true,
    lastMessagePreview: 'Did you all watch the new comeback stage? It was unbelievable!',
    lastMessageTime: 'Just now',
  },
  {
    id: 'oc_frontend_dev',
    title: 'Frontend Developers Network 💻 (React, Next.js, TS)',
    description: 'Startup developers, job seekers, Q&A, and technical discussion room',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    tags: ['#React', '#TypeScript', '#Nextjs', '#Devs', '#Startup'],
    membersCount: 890,
    maxMembers: 1000,
    category: 'Tech & Dev',
    hostName: 'CleanCoder',
    hostAvatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
    isJoined: false,
    lastMessagePreview: 'Sharing some great Tailwind v4 tips here!',
    lastMessageTime: '3m ago',
  },
  {
    id: 'oc_seoul_food',
    title: 'Seoul Foodies & Aesthetic Cafe Explorers 🥐☕️',
    description: 'Discovering hidden gems in Seongsu, Yeonnam, and Euljiro',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    tags: ['#SeoulEats', '#SeongsuCafe', '#Bakery', '#WeekendMeetup'],
    membersCount: 654,
    maxMembers: 1000,
    category: 'Food & Cafe',
    hostName: 'BreadLover',
    hostAvatar: '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg',
    isJoined: false,
    lastMessagePreview: 'The new salt bread shop in Seongsu has only a 20 min wait right now!',
    lastMessageTime: '15m ago',
  },
  {
    id: 'oc_study_routine',
    title: 'Morning Routine Challenge ☀️ 6 AM Club & Study Goals',
    description: 'Daily 6 AM wakeup proof, book reading, and certification goal tracking',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80',
    tags: ['#MiracleMorning', '#StudyGram', '#Habits', '#Productivity'],
    membersCount: 420,
    maxMembers: 500,
    category: 'Study & Routine',
    hostName: 'GoalAchiever',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    isJoined: false,
    lastMessagePreview: '100% checked in today! Wishing everyone a great productive day!',
    lastMessageTime: '1h ago',
  },
];

class KakaoStorageService {
  constructor() {
    // Ensure persistence is preserved across reloads without clearing user data
  }

  public isLoggedIn(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    const meData = localStorage.getItem(STORAGE_KEYS.ME);
    return val === 'logged_in' && Boolean(meData);
  }

  public setLoggedIn(loggedIn: boolean) {
    if (loggedIn) {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'logged_in');
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'logged_out');
    }
  }

  public login(user: KakaoUser) {
    this.saveMe(user);
    this.setLoggedIn(true);
  }

  public logout() {
    this.setLoggedIn(false);
    localStorage.removeItem(STORAGE_KEYS.ME);
  }

  public getMe(): KakaoUser {
    const data = localStorage.getItem(STORAGE_KEYS.ME);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed) {
          parsed.avatar = sanitizeImageUrl(parsed.avatar);
          return parsed;
        }
      } catch {}
    }
    return INITIAL_ME;
  }

  public saveMe(user: KakaoUser) {
    localStorage.setItem(STORAGE_KEYS.ME, JSON.stringify(user));
  }

  public getFriends(): KakaoUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (data) {
      try {
        const parsed: KakaoUser[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((f) => ({
            ...f,
            avatar: sanitizeImageUrl(f.avatar),
          }));
        }
      } catch {}
    }
    this.saveFriends(INITIAL_FRIENDS);
    return INITIAL_FRIENDS;
  }

  public saveFriends(friends: KakaoUser[]) {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kakao_storage_update', { detail: { key: 'friends' } }));
    }
  }

  public addFriend(friend: KakaoUser) {
    const friends = this.getFriends();
    if (!friends.some((f) => f.id === friend.id)) {
      friends.push(friend);
      this.saveFriends(friends);
    }
  }

  public deleteFriend(friendId: string) {
    const friends = this.getFriends().filter((f) => f.id !== friendId);
    this.saveFriends(friends);
  }

  public toggleFavoriteFriend(id: string): boolean {
    const friends = this.getFriends();
    const idx = friends.findIndex((f) => f.id === id);
    if (idx !== -1) {
      friends[idx].isFavorite = !friends[idx].isFavorite;
      this.saveFriends(friends);
      return friends[idx].isFavorite || false;
    }
    return false;
  }

  public toggleFollowFriend(id: string): boolean {
    const friends = this.getFriends();
    const idx = friends.findIndex((f) => f.id === id);
    if (idx !== -1) {
      friends[idx].isFollowing = !friends[idx].isFollowing;
      this.saveFriends(friends);
      return friends[idx].isFollowing || false;
    }
    return false;
  }

  public getChats(): KakaoChat[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (data) {
      try {
        const parsed: KakaoChat[] = JSON.parse(data);
        const seen = new Set<string>();
        const deduped: KakaoChat[] = [];
        for (const c of parsed) {
          if (c && c.id && !seen.has(c.id)) {
            seen.add(c.id);
            // Clean out legacy fake messages
            if (
              c.lastMessage &&
              (c.lastMessage.id?.startsWith('msg_mj_last') ||
                c.lastMessage.id?.startsWith('msg_gst_last') ||
                c.lastMessage.id?.startsWith('msg_fg_last'))
            ) {
              c.lastMessage = undefined;
              c.unreadCount = 0;
            }
            if (c.participants && Array.isArray(c.participants)) {
              c.participants = c.participants.map((p) => ({
                ...p,
                avatar: sanitizeImageUrl(p.avatar),
              }));
            }
            if (c.lastMessage && c.lastMessage.senderAvatar) {
              c.lastMessage.senderAvatar = sanitizeImageUrl(c.lastMessage.senderAvatar);
            }
            deduped.push(c);
          }
        }
        return deduped;
      } catch {}
    }
    const initialChats = this.buildInitialChats();
    this.saveChats(initialChats);
    return initialChats;
  }

  public saveChats(chats: KakaoChat[]) {
    const seen = new Set<string>();
    const deduped: KakaoChat[] = [];
    for (const c of chats) {
      if (c && c.id && !seen.has(c.id)) {
        seen.add(c.id);
        deduped.push(c);
      }
    }
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(deduped));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kakao_storage_update', { detail: { key: 'chats' } }));
    }
  }

  public getMessages(chatId: string): KakaoMessage[] {
    const all = this.getAllMessages();
    const list = all[chatId] || [];
    const seen = new Set<string>();
    const deduped: KakaoMessage[] = [];
    for (const m of list) {
      if (m && m.id && !seen.has(m.id)) {
        seen.add(m.id);
        deduped.push(m);
      }
    }
    return deduped;
  }

  public saveMessage(message: KakaoMessage) {
    if (!message || !message.id || !message.chatId) return;
    const all = this.getAllMessages();
    if (!all[message.chatId]) {
      all[message.chatId] = [];
    }
    const existingIndex = all[message.chatId].findIndex((m) => m.id === message.id);
    if (existingIndex !== -1) {
      all[message.chatId][existingIndex] = message;
    } else {
      all[message.chatId].push(message);
    }
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));

    // Update Chat thread preview
    const chats = this.getChats();
    const chatIndex = chats.findIndex((c) => c.id === message.chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = message;
      chats[chatIndex].updatedAt = message.createdAt;
      this.saveChats(chats);
    } else {
      const newChat: KakaoChat = {
        id: message.chatId,
        type: 'direct',
        title: message.senderName || 'Amigo Friend',
        participants: [
          {
            id: message.senderId,
            name: message.senderName,
            avatar: message.senderAvatar,
          },
        ],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        updatedAt: message.createdAt,
        lastMessage: message,
      };
      chats.unshift(newChat);
      this.saveChats(chats);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kakao_storage_update', { detail: { key: 'messages', chatId: message.chatId } }));
    }
  }

  public markChatAsRead(chatId: string) {
    const chats = this.getChats();
    const chat = chats.find((c) => c.id === chatId);
    if (chat && chat.unreadCount > 0) {
      chat.unreadCount = 0;
      this.saveChats(chats);
    }
    // Also mark last messages as read
    const all = this.getAllMessages();
    if (all[chatId]) {
      all[chatId].forEach((m) => {
        m.unreadCount = 0;
      });
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    }
  }

  public deleteChat(chatId: string) {
    const chats = this.getChats().filter((c) => c.id !== chatId);
    this.saveChats(chats);
    const all = this.getAllMessages();
    delete all[chatId];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
  }

  public clearChatMessages(chatId: string) {
    const all = this.getAllMessages();
    all[chatId] = [];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));

    const chats = this.getChats();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      chat.lastMessage = undefined;
      chat.unreadCount = 0;
      this.saveChats(chats);
    }
  }

  public deleteMessage(chatId: string, messageId: string) {
    const all = this.getAllMessages();
    if (all[chatId]) {
      all[chatId] = all[chatId].filter((m) => m.id !== messageId);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));

      const chats = this.getChats();
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        const remaining = all[chatId];
        chat.lastMessage = remaining.length > 0 ? remaining[remaining.length - 1] : undefined;
        this.saveChats(chats);
      }
    }
  }

  public markAllChatsAsRead() {
    const chats = this.getChats();
    chats.forEach((c) => {
      c.unreadCount = 0;
    });
    this.saveChats(chats);

    const all = this.getAllMessages();
    Object.keys(all).forEach((chatId) => {
      all[chatId].forEach((m) => {
        m.unreadCount = 0;
      });
    });
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
  }

  public getNotifications(): any[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    const initNotifs = [
      {
        id: 'notif_1',
        type: 'friend',
        title: 'New Friend Connected',
        message: 'Min-ji Kim is active and ready to chat!',
        time: 'Just now',
        read: false,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        badge: 'NEW ⚡',
      },
      {
        id: 'notif_2',
        type: 'pay',
        title: 'Amigos Pay Transfer',
        message: 'You received ₳10,000 transfer in your Amigos Pay wallet.',
        time: '15m ago',
        read: false,
        badge: '₳ PAY',
      },
      {
        id: 'notif_3',
        type: 'game',
        title: '2-Player Challenge',
        message: 'Guest Explorer challenged you to a 1v1 match! Ready to duel?',
        time: '30m ago',
        read: false,
        avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
        badge: 'GAME 🎮',
      },
      {
        id: 'notif_4',
        type: 'system',
        title: 'Real-Time Network Active',
        message: 'Connected to Amigos live WebSocket server. Online sync enabled.',
        time: '1h ago',
        read: true,
        badge: 'SYSTEM',
      },
    ];
    this.saveNotifications(initNotifs);
    return initNotifs;
  }

  public saveNotifications(notifs: any[]) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  public deleteNotification(id: string) {
    const notifs = this.getNotifications().filter((n) => n.id !== id);
    this.saveNotifications(notifs);
  }

  public clearAllNotifications() {
    this.saveNotifications([]);
  }

  public markAllNotificationsAsRead() {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(notifs);
  }

  public getUnreadNotificationCount(): number {
    return this.getNotifications().filter((n) => !n.read).length;
  }

  public togglePinChat(chatId: string) {
    const chats = this.getChats();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      chat.isPinned = !chat.isPinned;
      this.saveChats(chats);
    }
  }

  public toggleMuteChat(chatId: string) {
    const chats = this.getChats();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      chat.isMuted = !chat.isMuted;
      this.saveChats(chats);
    }
  }

  public getOpenChatRooms(): OpenChatRoom[] {
    const data = localStorage.getItem(STORAGE_KEYS.OPEN_CHATS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    this.saveOpenChatRooms(INITIAL_OPEN_CHATS);
    return INITIAL_OPEN_CHATS;
  }

  public saveOpenChatRooms(rooms: OpenChatRoom[]) {
    localStorage.setItem(STORAGE_KEYS.OPEN_CHATS, JSON.stringify(rooms));
  }

  public joinOpenChat(roomId: string): KakaoChat {
    const rooms = this.getOpenChatRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      room.isJoined = true;
      room.membersCount += 1;
      this.saveOpenChatRooms(rooms);

      // Create or find matching chat
      const chats = this.getChats();
      let chat = chats.find((c) => c.id === `chat_${roomId}`);
      if (!chat) {
        chat = {
          id: `chat_${roomId}`,
          type: 'openchat',
          title: room.title,
          participants: [
            {
              id: 'host_' + room.id,
              name: room.hostName,
              avatar: room.hostAvatar,
            },
          ],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          updatedAt: Date.now(),
          openChatCategory: room.category,
          openChatTags: room.tags,
          openChatCover: room.coverImage,
          openChatMembersCount: room.membersCount,
        };
        chats.unshift(chat);
        this.saveChats(chats);

        // Add welcome message
        this.saveMessage({
          id: `msg_welcome_${Date.now()}`,
          chatId: chat.id,
          senderId: 'host_' + room.id,
          senderName: room.hostName,
          senderAvatar: room.hostAvatar,
          text: `Welcome! Glad you joined ${room.title} ✨ Please review our community guidelines!`,
          createdAt: Date.now(),
          unreadCount: 0,
        });
      }
      return chat;
    }
    throw new Error('Room not found');
  }

  public getWallet(): KakaoPayWallet {
    const data = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    const initWallet: KakaoPayWallet = {
      balance: 385000, // ₳385,000
      accountNumber: 'Amigos Pay Securities 128-94-281920',
      bankName: 'Amigos Pay Money',
      recentTransfers: [
        {
          id: 'tf_1',
          title: 'Ryan (Transfer)',
          amount: 10000,
          timestamp: Date.now() - 3600000 * 2,
          type: 'send',
        },
        {
          id: 'tf_2',
          title: 'Starbucks Payment',
          amount: 15300,
          timestamp: Date.now() - 3600000 * 24,
          type: 'payment',
        },
        {
          id: 'tf_3',
          title: 'Min-ji Kim (Split bill)',
          amount: 22000,
          timestamp: Date.now() - 3600000 * 48,
          type: 'receive',
        },
      ],
    };
    this.saveWallet(initWallet);
    return initWallet;
  }

  public saveWallet(wallet: KakaoPayWallet) {
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  }

  public transferMoney(recipientName: string, amount: number, note?: string): boolean {
    const wallet = this.getWallet();
    if (wallet.balance < amount) return false;

    wallet.balance -= amount;
    wallet.recentTransfers.unshift({
      id: `tf_${Date.now()}`,
      title: `${recipientName} (Transfer)`,
      amount,
      timestamp: Date.now(),
      type: 'send',
    });
    this.saveWallet(wallet);
    return true;
  }

  public receiveMoney(senderName: string, amount: number) {
    const wallet = this.getWallet();
    wallet.balance += amount;
    wallet.recentTransfers.unshift({
      id: `tf_${Date.now()}`,
      title: `${senderName} (Received)`,
      amount,
      timestamp: Date.now(),
      type: 'receive',
    });
    this.saveWallet(wallet);
  }

  public getGifts(): KakaoGiftItem[] {
    return INITIAL_GIFTS.map((g) => ({
      ...g,
      imageUrl: sanitizeImageUrl(g.imageUrl),
    }));
  }

  public getMyCoupons(): KakaoCoupon[] {
    const data = localStorage.getItem(STORAGE_KEYS.MY_COUPONS);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((c: KakaoCoupon) => ({
            ...c,
            item: {
              ...c.item,
              imageUrl: sanitizeImageUrl(c.item?.imageUrl),
            },
          }));
        }
      } catch {}
    }
    const initCoupons: KakaoCoupon[] = [
      {
        id: 'coupon_starbucks_1',
        item: INITIAL_GIFTS[0],
        fromName: 'Ryan',
        receivedAt: Date.now() - 86400000 * 2,
        expiresAt: '2026.12.31',
        isUsed: false,
      },
      {
        id: 'coupon_choonsik_2',
        item: INITIAL_GIFTS[2],
        fromName: 'Choonsik',
        receivedAt: Date.now() - 86400000 * 5,
        expiresAt: '2026.11.30',
        isUsed: true,
      },
    ];
    this.saveMyCoupons(initCoupons);
    return initCoupons;
  }

  public saveMyCoupons(coupons: KakaoCoupon[]) {
    localStorage.setItem(STORAGE_KEYS.MY_COUPONS, JSON.stringify(coupons));
  }

  public redeemCoupon(couponId: string) {
    const coupons = this.getMyCoupons();
    const c = coupons.find((item) => item.id === couponId);
    if (c) {
      c.isUsed = true;
      this.saveMyCoupons(coupons);
    }
  }

  public addSentCoupon(giftItem: KakaoGiftItem, recipientName: string) {
    const coupons = this.getMyCoupons();
    coupons.unshift({
      id: `coupon_${Date.now()}`,
      item: giftItem,
      fromName: `Me (to: ${recipientName})`,
      receivedAt: Date.now(),
      expiresAt: '2026.12.31',
      isUsed: false,
    });
    this.saveMyCoupons(coupons);
  }

  public getMyGiftCoupons(): KakaoGiftItem[] {
    return this.getMyCoupons().map((c) => c.item);
  }

  public sendGiftToFriend(gift: KakaoGiftItem, friend: KakaoUser, cardMessage?: string): KakaoChat {
    const chat = this.getOrCreateDirectChat(friend);

    // Send Gift message to chat
    this.saveMessage({
      id: `msg_gift_${Date.now()}`,
      chatId: chat.id,
      senderId: this.getMe().id,
      senderName: this.getMe().name,
      senderAvatar: this.getMe().avatar,
      text: cardMessage || `A thoughtful gift has arrived for ${friend.name}! 🎁`,
      giftItem: gift,
      createdAt: Date.now(),
      unreadCount: 1,
    });

    return chat;
  }

  public getOrCreateDirectChat(friend: KakaoUser): KakaoChat {
    const chats = this.getChats();
    let chat = chats.find(
      (c) => c.type === 'direct' && c.participants.some((p) => p.id === friend.id)
    );
    if (!chat) {
      chat = {
        id: `chat_direct_${friend.id}`,
        type: 'direct',
        title: friend.name,
        participants: [friend],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        updatedAt: Date.now(),
      };
      chats.unshift(chat);
      this.saveChats(chats);
    }
    return chat;
  }

  private getAllMessages(): Record<string, KakaoMessage[]> {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          let hasDupsOrFakes = false;
          for (const chatId of Object.keys(parsed)) {
            if (Array.isArray(parsed[chatId])) {
              const seen = new Set<string>();
              const deduped: KakaoMessage[] = [];
              for (const m of parsed[chatId]) {
                if (
                  m &&
                  m.id &&
                  !m.id.startsWith('m_mj') &&
                  !m.id.startsWith('m_g1') &&
                  !m.id.startsWith('m_fg')
                ) {
                  if (!seen.has(m.id)) {
                    seen.add(m.id);
                    deduped.push(m);
                  } else {
                    hasDupsOrFakes = true;
                  }
                } else {
                  hasDupsOrFakes = true;
                }
              }
              parsed[chatId] = deduped;
            }
          }
          if (hasDupsOrFakes) {
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch {}
    }
    const initial = this.buildInitialMessages();
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(initial));
    return initial;
  }

  private buildInitialChats(): KakaoChat[] {
    const now = Date.now();
    return [
      {
        id: 'chat_minji',
        type: 'direct',
        title: 'Min-ji Kim',
        participants: [INITIAL_FRIENDS[0]], // Min-ji Kim
        unreadCount: 0,
        isPinned: true,
        isMuted: false,
        updatedAt: now,
      },
      {
        id: 'chat_jihoon',
        type: 'direct',
        title: 'Ji-hoon Park',
        participants: [INITIAL_FRIENDS[1]], // Ji-hoon Park
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        updatedAt: now,
      },
      {
        id: 'chat_friends_group',
        type: 'group',
        title: 'Weekend Crew (4)',
        participants: [
          INITIAL_FRIENDS[0], // Min-ji Kim
          INITIAL_FRIENDS[1], // Ji-hoon Park
          INITIAL_FRIENDS[2], // So-yeon Lee
        ],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        updatedAt: now,
      },
    ];
  }

  private buildInitialMessages(): Record<string, KakaoMessage[]> {
    return {};
  }
}

export const kakaoStorage = new KakaoStorageService();
