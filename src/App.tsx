import React, { useState, useEffect } from 'react';
import {
  KakaoTab,
  KakaoUser,
  KakaoChat,
  KakaoGiftItem,
  KakaoMessage,
  CallSession,
} from './types/kakaotalk';
import { kakaoStorage } from './services/kakaoStorage';
import { kakaoAudio } from './utils/kakaoAudio';

// Layout
import { KakaoAppShell } from './components/layout/KakaoAppShell';

// Tabs
import { FriendsTab } from './components/friends/FriendsTab';
import { ChatsTab } from './components/chats/ChatsTab';
import { OpenChatTab } from './components/openchat/OpenChatTab';
import { ShoppingTab } from './components/shopping/ShoppingTab';
import { AmigoCallTab } from './components/amigocall/AmigoCallTab';
import { MoreTab } from './components/more/MoreTab';

// In-Chat Room View
import { ChatRoomView } from './components/chats/ChatRoomView';

// Modals
import { ProfileModal } from './components/modals/ProfileModal';
import { CallModal } from './components/modals/CallModal';
import { IncomingCallModal } from './components/modals/IncomingCallModal';
import { SendMoneyModal } from './components/modals/SendMoneyModal';
import { AddFriendModal } from './components/modals/AddFriendModal';
import { GiftModal } from './components/modals/GiftModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { QRCodeModal } from './components/modals/QRCodeModal';
import { PayQRModal } from './components/modals/PayQRModal';
import { EmoticonsModal } from './components/modals/EmoticonsModal';
import { AmigosTModal } from './components/modals/AmigosTModal';
import { AmigosMapsModal } from './components/modals/AmigosMapsModal';
import { AmigosCalendarModal } from './components/modals/AmigosCalendarModal';
import { TalkDriveModal } from './components/modals/TalkDriveModal';
import { AmigosPageModal } from './components/modals/AmigosPageModal';
import { AmigosGamesModal } from './components/modals/AmigosGamesModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { multiplayerSocket } from './services/multiplayerSocket';

export default function App() {
  const [currentUser, setCurrentUser] = useState<KakaoUser>(kakaoStorage.getMe());
  const [activeTab, setActiveTab] = useState<KakaoTab>('friends');

  // Real-time multiplayer & online states
  const [incomingGameInvite, setIncomingGameInvite] = useState(multiplayerSocket.incomingInvite);
  const [incomingFriendRequest, setIncomingFriendRequest] = useState<any>(null);
  const [friendRequestAcceptedToast, setFriendRequestAcceptedToast] = useState<string | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(!kakaoStorage.isLoggedIn());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [incomingChatMessageToast, setIncomingChatMessageToast] = useState<{
    message: KakaoMessage;
    openChatId?: string;
  } | null>(null);

  // Navigation & Sub-views
  const [selectedChat, setSelectedChat] = useState<KakaoChat | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<KakaoUser | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);

  // Modals
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGiftShopOpen, setIsGiftShopOpen] = useState(false);
  const [sendMoneyRecipient, setSendMoneyRecipient] = useState<KakaoUser | null>(null);
  const [giftItemForModal, setGiftItemForModal] = useState<{
    item: KakaoGiftItem;
    recipient?: KakaoUser;
  } | null>(null);

  // New Amigos Services & QR Modals
  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    user?: KakaoUser;
    mode?: 'view' | 'scan';
  }>({ isOpen: false });
  const [isPayQROpen, setIsPayQROpen] = useState(false);
  const [isEmoticonsOpen, setIsEmoticonsOpen] = useState(false);
  const [isAmigosTOpen, setIsAmigosTOpen] = useState(false);
  const [isAmigosMapsOpen, setIsAmigosMapsOpen] = useState(false);
  const [isAmigosCalendarOpen, setIsAmigosCalendarOpen] = useState(false);
  const [isTalkDriveOpen, setIsTalkDriveOpen] = useState(false);
  const [isAmigosPageOpen, setIsAmigosPageOpen] = useState(false);
  const [gamesModalState, setGamesModalState] = useState<{
    isOpen: boolean;
    opponent?: KakaoUser;
    gameId?: string;
  }>({ isOpen: false });

  // Dynamic counts
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshAppData = () => {
    setCurrentUser(kakaoStorage.getMe());
    const allChats = kakaoStorage.getChats();
    const count = allChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    setUnreadChatCount(count);
  };

  useEffect(() => {
    refreshAppData();

    const handleStorageUpdate = () => {
      refreshAppData();
    };

    window.addEventListener('kakao_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    const interval = setInterval(refreshAppData, 1500);

    // Sync any messages from server on launch/refresh
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => {
        if (d.messages && d.messages.length > 0) {
          d.messages.forEach((m: KakaoMessage) => {
            kakaoStorage.saveMessage(m);
          });
          refreshAppData();
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('kakao_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(interval);
    };
  }, [activeTab, selectedChat]);

  // Connect to live multiplayer WebSocket server & setup listeners
  useEffect(() => {
    multiplayerSocket.init(currentUser);

    const unsubscribe = multiplayerSocket.subscribe(() => {
      setIncomingGameInvite(multiplayerSocket.incomingInvite);

      // Auto-open game modal when match is found from queue
      if (multiplayerSocket.currentRoom) {
        setGamesModalState({
          isOpen: true,
          opponent: {
            id: multiplayerSocket.currentRoom.opponent.id,
            name: multiplayerSocket.currentRoom.opponent.name,
            avatar: multiplayerSocket.currentRoom.opponent.avatar,
          } as KakaoUser,
          gameId: multiplayerSocket.currentRoom.gameId,
        });
      }
    });

    const unsubFriendReq = multiplayerSocket.onFriendRequest((req) => {
      kakaoAudio.playKaTalkChime();
      setIncomingFriendRequest(req);
    });

    const unsubFriendResp = multiplayerSocket.onFriendResponse((fromUser, accepted) => {
      if (accepted && fromUser) {
        kakaoAudio.playPayChime();
        kakaoStorage.addFriend({
          id: fromUser.id,
          name: fromUser.name,
          avatar: fromUser.avatar,
          statusMessage: 'Connected via QR Code / Online Request',
        });
        setFriendRequestAcceptedToast(`${fromUser.name} accepted your friend request! 🎉`);
        setTimeout(() => setFriendRequestAcceptedToast(null), 3500);
        refreshAppData();
      }
    });

    const unsubChatMessage = multiplayerSocket.onChatMessage((msg, openChatId) => {
      if (msg.senderId === currentUser.id) return;

      const isDirect = !openChatId && !msg.chatId.startsWith('chat_oc_');
      let targetChatId = msg.chatId;

      if (isDirect) {
        // Ensure recipient has direct chat with sender
        const directChat = kakaoStorage.getOrCreateDirectChat({
          id: msg.senderId,
          name: msg.senderName,
          avatar: msg.senderAvatar,
          statusMessage: 'Online Friend',
        });
        targetChatId = directChat.id;
      }

      const normalizedMsg = { ...msg, chatId: targetChatId };
      kakaoStorage.saveMessage(normalizedMsg);

      const inThisChat = selectedChat && selectedChat.id === targetChatId;
      if (!inThisChat) {
        // Increment unread count for that chat
        const chats = kakaoStorage.getChats();
        const chatItem = chats.find((c) => c.id === targetChatId);
        if (chatItem) {
          chatItem.unreadCount = (chatItem.unreadCount || 0) + 1;
          kakaoStorage.saveChats(chats);
        }
        kakaoAudio.playKaTalkChime();
        setIncomingChatMessageToast({ message: normalizedMsg, openChatId });
        setTimeout(() => setIncomingChatMessageToast(null), 4500);
      }
      refreshAppData();
    });

    return () => {
      unsubscribe();
      unsubFriendReq();
      unsubFriendResp();
      unsubChatMessage();
    };
  }, [currentUser, selectedChat]);

  const handleAuthSuccess = (loggedUser: KakaoUser) => {
    setCurrentUser(loggedUser);
    setShowAuthScreen(false);
    setIsAuthModalOpen(false);
    refreshAppData();
    multiplayerSocket.init(loggedUser);
  };

  const handleLogout = () => {
    kakaoAudio.playTap();
    kakaoStorage.logout();
    setShowAuthScreen(true);
  };

  // Open 1:1 chat with a user
  const handleOpenChatWithUser = (user: KakaoUser) => {
    kakaoAudio.playTap();
    const chat = kakaoStorage.getOrCreateDirectChat(user);
    kakaoStorage.markChatAsRead(chat.id);
    setSelectedChat({ ...chat, unreadCount: 0 });
    setSelectedUserForProfile(null);
    refreshAppData();
  };

  // Open an existing chat thread & mark messages as read
  const handleSelectChat = (chat: KakaoChat) => {
    kakaoAudio.playTap();
    kakaoStorage.markChatAsRead(chat.id);
    setSelectedChat({ ...chat, unreadCount: 0 });
    refreshAppData();
  };

  // Start VoiceTalk or FaceTalk
  const handleStartCall = (user: KakaoUser, type: 'voice' | 'video' = 'voice') => {
    setActiveCallSession({
      active: true,
      type,
      user,
      status: 'calling',
      duration: 0,
      isMuted: false,
      isSpeaker: true,
    });
    setSelectedUserForProfile(null);
  };

  // Open gift modal for a specific user
  const handleOpenGiftForUser = (user: KakaoUser) => {
    kakaoAudio.playTap();
    const gifts = kakaoStorage.getGifts();
    const defaultGift = gifts[0];
    setGiftItemForModal({
      item: defaultGift,
      recipient: user,
    });
    setSelectedUserForProfile(null);
  };

  // Open gift modal from shopping tab
  const handleSelectGiftItem = (item: KakaoGiftItem) => {
    kakaoAudio.playTap();
    setGiftItemForModal({
      item,
    });
  };

  // Complete Send Money flow
  const handleSendMoneySuccess = (recipient: KakaoUser, amount: number, note: string) => {
    kakaoAudio.playPayChime();
    const chat = kakaoStorage.getOrCreateDirectChat(recipient);

    const payMessage: KakaoMessage = {
      id: `msg_pay_${Date.now()}`,
      chatId: chat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: note || 'Amigos Pay Transfer',
      payTransfer: {
        amount,
        note,
        isReceived: false,
        transferId: `tr_${Date.now()}`,
      },
      createdAt: Date.now(),
      unreadCount: 1,
    };

    kakaoStorage.saveMessage(payMessage);
    setSendMoneyRecipient(null);
    setSelectedChat(chat);
    refreshAppData();
  };

  // Complete Gift sending flow
  const handleGiftSuccess = (recipient: KakaoUser, message: KakaoMessage) => {
    kakaoAudio.playPayChime();
    const chat = kakaoStorage.getOrCreateDirectChat(recipient);
    setGiftItemForModal(null);
    setSelectedChat(chat);
    refreshAppData();
  };

  return (
    <KakaoAppShell
      activeTab={activeTab}
      unreadChatCount={unreadChatCount}
      onSelectTab={(tab) => {
        setSelectedChat(null);
        setActiveTab(tab);
      }}
      hideBottomNav={Boolean(selectedChat || activeCallSession || showAuthScreen)}
    >
      {/* If Login/Sign Up Page is Active */}
      {showAuthScreen ? (
        <AuthScreen
          onSuccess={handleAuthSuccess}
          onContinueAsGuest={() => {
            const guestUser: KakaoUser = {
              id: `guest_${Date.now()}`,
              name: 'Guest Explorer',
              kakaoId: `guest_${Math.floor(1000 + Math.random() * 9000)}`,
              avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
              statusMessage: 'Guest User (Real Live Mode) ☕️✨',
            };
            handleAuthSuccess(guestUser);
          }}
        />
      ) : selectedChat ? (
        /* If Chat Room is Active */
        <ChatRoomView
          chat={selectedChat}
          currentUser={currentUser}
          onBack={() => {
            setSelectedChat(null);
            refreshAppData();
          }}
          onChatRead={refreshAppData}
          onStartCall={(user, type) => handleStartCall(user, type)}
          onOpenSendMoney={(user) => setSendMoneyRecipient(user)}
          onOpenGift={(user) => handleOpenGiftForUser(user)}
          onOpenGames={(user) => setGamesModalState({ isOpen: true, opponent: user })}
        />
      ) : (
        /* Otherwise, render active tab */
        <>
          {activeTab === 'friends' && (
            <FriendsTab
              currentUser={currentUser}
              onSelectUser={(user) => setSelectedUserForProfile(user)}
              onOpenMyProfile={() => setSelectedUserForProfile(currentUser)}
              onOpenAddFriend={() => setIsAddFriendOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onSendGift={(user) => handleOpenGiftForUser(user)}
              onOpenQR={() => setQrModalState({ isOpen: true, user: currentUser, mode: 'scan' })}
              onOpenAuth={() => setShowAuthScreen(true)}
              onFriendUpdated={refreshAppData}
              onOpenCalendar={() => setIsAmigosCalendarOpen(true)}
            />
          )}

          {activeTab === 'chats' && (
            <ChatsTab
              onSelectChat={handleSelectChat}
              onOpenGiftShop={() => setIsGiftShopOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onChatsUpdated={refreshAppData}
            />
          )}

          {activeTab === 'openchat' && (
            <OpenChatTab
              onSelectChat={handleSelectChat}
            />
          )}

          {activeTab === 'amigocall' && (
            <AmigoCallTab
              currentUser={currentUser}
              onOpenGiftForUser={(user) => handleOpenGiftForUser(user)}
              onSelectUserForProfile={(user) => setSelectedUserForProfile(user)}
            />
          )}

          {activeTab === 'shopping' && (
            <ShoppingTab
              onSendGiftItem={handleSelectGiftItem}
            />
          )}

          {activeTab === 'more' && (
            <MoreTab
              currentUser={currentUser}
              onOpenMyProfile={() => setSelectedUserForProfile(currentUser)}
              onOpenSendMoney={() => setSendMoneyRecipient(currentUser)}
              onOpenGiftShop={() => setIsGiftShopOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPayQR={() => setIsPayQROpen(true)}
              onOpenQRCode={() => setQrModalState({ isOpen: true, user: currentUser, mode: 'view' })}
              onOpenEmoticons={() => setIsEmoticonsOpen(true)}
              onOpenAmigosT={() => setIsAmigosTOpen(true)}
              onOpenAmigosMaps={() => setIsAmigosMapsOpen(true)}
              onOpenAmigosCalendar={() => setIsAmigosCalendarOpen(true)}
              onOpenTalkDrive={() => setIsTalkDriveOpen(true)}
              onOpenAmigosPage={() => setIsAmigosPageOpen(true)}
              onOpenAmigosGames={() => setGamesModalState({ isOpen: true })}
              onOpenAuth={() => setShowAuthScreen(true)}
              onLogout={handleLogout}
            />
          )}
        </>
      )}

      {/* Profile Modal */}
      {selectedUserForProfile && (
        <ProfileModal
          user={selectedUserForProfile}
          isMe={selectedUserForProfile.id === currentUser.id}
          onOpenChat={(user) => handleOpenChatWithUser(user)}
          onStartCall={(user, type) => handleStartCall(user, type)}
          onSendGift={(user) => handleOpenGiftForUser(user)}
          onOpenQR={(user) => setQrModalState({ isOpen: true, user, mode: 'view' })}
          onUserUpdated={(updated) => {
            if (updated.id === currentUser.id) {
              setCurrentUser(updated);
            }
            refreshAppData();
          }}
          onOpenAuth={() => {
            setSelectedUserForProfile(null);
            setShowAuthScreen(true);
          }}
          onLogout={() => {
            setSelectedUserForProfile(null);
            handleLogout();
          }}
          onClose={() => setSelectedUserForProfile(null)}
        />
      )}

      {/* VoiceTalk / FaceTalk Modal */}
      {activeCallSession && (
        <CallModal
          session={activeCallSession}
          onEndCall={() => setActiveCallSession(null)}
        />
      )}

      {/* Send Money Modal */}
      {sendMoneyRecipient && (
        <SendMoneyModal
          recipient={sendMoneyRecipient.id === currentUser.id ? undefined : sendMoneyRecipient}
          onSuccess={handleSendMoneySuccess}
          onClose={() => setSendMoneyRecipient(null)}
        />
      )}

      {/* Gift Modal */}
      {giftItemForModal && (
        <GiftModal
          giftItem={giftItemForModal.item}
          initialRecipient={giftItemForModal.recipient}
          currentUser={currentUser}
          onSuccess={handleGiftSuccess}
          onClose={() => setGiftItemForModal(null)}
        />
      )}

      {/* Add Friend Modal */}
      {isAddFriendOpen && (
        <AddFriendModal
          currentUser={currentUser}
          onFriendAdded={() => {
            refreshAppData();
          }}
          onOpenScanner={() => {
            setIsAddFriendOpen(false);
            setQrModalState({ isOpen: true, user: currentUser, mode: 'scan' });
          }}
          onClose={() => setIsAddFriendOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          currentUser={currentUser}
          onClose={() => setIsSettingsOpen(false)}
          onRefreshData={refreshAppData}
          onOpenAuth={() => {
            setIsSettingsOpen(false);
            setShowAuthScreen(true);
          }}
          onLogout={() => {
            setIsSettingsOpen(false);
            handleLogout();
          }}
        />
      )}

      {/* Profile QR & Scanner Modal */}
      {qrModalState.isOpen && (
        <QRCodeModal
          initialUser={qrModalState.user || currentUser}
          initialMode={qrModalState.mode || 'view'}
          onClose={() => setQrModalState({ isOpen: false })}
          onOpenChat={(user) => handleOpenChatWithUser(user)}
          onFriendAdded={() => refreshAppData()}
        />
      )}

      {/* Amigos Pay In-store QR Payment Modal */}
      {isPayQROpen && (
        <PayQRModal
          onClose={() => setIsPayQROpen(false)}
          onPaymentComplete={() => refreshAppData()}
        />
      )}

      {/* Emoticons Shop Modal */}
      {isEmoticonsOpen && (
        <EmoticonsModal
          onClose={() => setIsEmoticonsOpen(false)}
        />
      )}

      {/* Amigos T Mobility Modal */}
      {isAmigosTOpen && (
        <AmigosTModal
          onClose={() => setIsAmigosTOpen(false)}
        />
      )}

      {/* Amigos Maps Modal */}
      {isAmigosMapsOpen && (
        <AmigosMapsModal
          onClose={() => setIsAmigosMapsOpen(false)}
          onShareToChat={(placeName) => {
            const defaultFriend = kakaoStorage.getFriends()[0];
            const chat = kakaoStorage.getOrCreateDirectChat(defaultFriend);
            const msg: KakaoMessage = {
              id: `msg_place_${Date.now()}`,
              chatId: chat.id,
              senderId: currentUser.id,
              senderName: currentUser.name,
              senderAvatar: currentUser.avatar,
              text: `📍 Let's meet here! Recommended spot: ${placeName}`,
              createdAt: Date.now(),
              unreadCount: 1,
            };
            kakaoStorage.saveMessage(msg);
            setIsAmigosMapsOpen(false);
            setSelectedChat(chat);
          }}
        />
      )}

      {/* Amigos Calendar Modal */}
      {isAmigosCalendarOpen && (
        <AmigosCalendarModal
          onClose={() => setIsAmigosCalendarOpen(false)}
        />
      )}

      {/* Talk Drive Modal */}
      {isTalkDriveOpen && (
        <TalkDriveModal
          onClose={() => setIsTalkDriveOpen(false)}
        />
      )}

      {/* Amigos Page Webtoons Modal */}
      {isAmigosPageOpen && (
        <AmigosPageModal
          onClose={() => setIsAmigosPageOpen(false)}
        />
      )}

      {/* Amigos 2-Player Games: The Challenge Modal */}
      {gamesModalState.isOpen && (
        <AmigosGamesModal
          initialOpponent={gamesModalState.opponent}
          initialGameId={gamesModalState.gameId}
          onClose={() => setGamesModalState({ isOpen: false })}
          onShareGameToChat={(gameName) => {
            const opp = gamesModalState.opponent || kakaoStorage.getFriends()[0];
            if (opp) {
              const chat = kakaoStorage.getOrCreateDirectChat(opp);
              const msg: KakaoMessage = {
                id: `msg_game_${Date.now()}`,
                chatId: chat.id,
                senderId: currentUser.id,
                senderName: currentUser.name,
                senderAvatar: currentUser.avatar,
                text: `🎮 I challenge you to a 2-Player Duel in ${gameName}! Can you beat me?`,
                createdAt: Date.now(),
                unreadCount: 1,
              };
              kakaoStorage.saveMessage(msg);
              setGamesModalState({ isOpen: false });
              setSelectedChat(chat);
            }
          }}
        />
      )}

      {/* Real-time Live Game Challenge Toast */}
      {incomingGameInvite && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs bg-slate-900 text-white p-3 rounded-2xl border-3 border-[#FEE500] shadow-2xl animate-in slide-in-from-top-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src={
                incomingGameInvite.fromUser.avatar ||
                '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'
              }
              alt={incomingGameInvite.fromUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#FEE500]"
            />
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-[#FEE500] tracking-wider">
                🎮 LIVE GAME CHALLENGE
              </span>
              <div className="text-xs font-black leading-tight text-white">
                {incomingGameInvite.fromUser.name} challenges you in{' '}
                <span className="text-amber-300">{incomingGameInvite.gameName}</span>!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                kakaoAudio.playTap();
                multiplayerSocket.respondInvite(
                  incomingGameInvite.inviteId,
                  incomingGameInvite.fromUser.id,
                  false,
                  incomingGameInvite.gameId
                );
              }}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold text-slate-300"
            >
              Decline
            </button>
            <button
              onClick={() => {
                kakaoAudio.playGameWin();
                multiplayerSocket.respondInvite(
                  incomingGameInvite.inviteId,
                  incomingGameInvite.fromUser.id,
                  true,
                  incomingGameInvite.gameId
                );
                setGamesModalState({
                  isOpen: true,
                  opponent: {
                    id: incomingGameInvite.fromUser.id,
                    name: incomingGameInvite.fromUser.name,
                    avatar: incomingGameInvite.fromUser.avatar,
                  } as KakaoUser,
                  gameId: incomingGameInvite.gameId,
                });
              }}
              className="flex-1 py-1.5 bg-[#FEE500] hover:bg-yellow-400 text-black rounded-xl text-xs font-black shadow-md active:scale-95 transition"
            >
              Accept & Play! ⚔️
            </button>
          </div>
        </div>
      )}

      {/* Real-time QR Friend Request Popup */}
      {incomingFriendRequest && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs bg-slate-900 text-white p-3.5 rounded-2xl border-3 border-[#FEE500] shadow-2xl animate-in slide-in-from-top-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src={
                incomingFriendRequest.fromUser.avatar ||
                'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80'
              }
              alt={incomingFriendRequest.fromUser.name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-[#FEE500]"
            />
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-[#FEE500] tracking-wider">
                📲 QR FRIEND REQUEST
              </span>
              <div className="text-xs font-black text-white leading-tight">
                {incomingFriendRequest.fromUser.name}
              </div>
              <span className="text-[10px] text-slate-300">
                @{incomingFriendRequest.fromUser.amigosId || 'amigo'} wants to connect via QR!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => {
                kakaoAudio.playTap();
                multiplayerSocket.respondFriendRequest(incomingFriendRequest.fromUser.id, false);
                setIncomingFriendRequest(null);
              }}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold text-slate-300 transition"
            >
              Decline
            </button>
            <button
              onClick={() => {
                kakaoAudio.playPayChime();
                const newFriend: KakaoUser = {
                  id: incomingFriendRequest.fromUser.id,
                  name: incomingFriendRequest.fromUser.name,
                  avatar: incomingFriendRequest.fromUser.avatar,
                  kakaoId: incomingFriendRequest.fromUser.amigosId,
                  statusMessage: 'Connected via QR Code Friend Request',
                };
                kakaoStorage.addFriend(newFriend);
                multiplayerSocket.respondFriendRequest(incomingFriendRequest.fromUser.id, true);
                setIncomingFriendRequest(null);
                setFriendRequestAcceptedToast(`Added ${incomingFriendRequest.fromUser.name} to friends! ✨`);
                setTimeout(() => setFriendRequestAcceptedToast(null), 3000);
                refreshAppData();
              }}
              className="flex-1 py-1.5 bg-[#FEE500] hover:bg-yellow-400 text-black rounded-xl text-xs font-black shadow-md active:scale-95 transition"
            >
              Accept & Chat! 🤝
            </button>
          </div>
        </div>
      )}

      {/* Toast: Friend Request Accepted */}
      {friendRequestAcceptedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-2xl animate-in slide-in-from-top-3 flex items-center gap-2">
          <span>{friendRequestAcceptedToast}</span>
        </div>
      )}

      {/* Toast: Incoming Live Chat Message Alert */}
      {incomingChatMessageToast && (
        <div
          onClick={() => {
            kakaoAudio.playTap();
            const relevantChat = kakaoStorage.getChats().find(
              (c) =>
                c.id === incomingChatMessageToast.message.chatId ||
                c.openChatRoomId === incomingChatMessageToast.openChatId
            );
            if (relevantChat) {
              setSelectedChat(relevantChat);
              setIncomingChatMessageToast(null);
            }
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs bg-slate-900 text-white p-3 rounded-2xl border-2 border-amber-300 shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2.5 cursor-pointer active:scale-98 transition"
        >
          <img
            src={
              incomingChatMessageToast.message.senderAvatar ||
              'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=80'
            }
            alt={incomingChatMessageToast.message.senderName}
            className="w-9 h-9 rounded-full object-cover border border-[#FEE500]"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 truncate">
                {incomingChatMessageToast.message.senderName}
              </span>
              <span className="text-[10px] text-slate-400">now</span>
            </div>
            <p className="text-[11px] text-white truncate">
              {incomingChatMessageToast.message.text || 'Sent an emoticon or media'}
            </p>
          </div>
        </div>
      )}

      {/* Gift Shop Modal (Opened from Chats or More) */}
      {isGiftShopOpen && (
        <div className="fixed inset-0 z-50 bg-[#F5F6F8] flex flex-col animate-in fade-in duration-150">
          <ShoppingTab
            onSendGiftItem={(item) => {
              handleSelectGiftItem(item);
            }}
            onClose={() => setIsGiftShopOpen(false)}
          />
        </div>
      )}

      {/* Auth Modal if opened from specific flows */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </KakaoAppShell>
  );
}
