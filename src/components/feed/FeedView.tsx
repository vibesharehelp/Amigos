import React, { useState, useEffect, useRef } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import { handleAvatarError } from '../../utils/imageUtils';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  Send,
  X,
  Share2,
  Bookmark,
  Check,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

export interface FeedPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  timeAgo: string;
  text?: string;
  imageUrl?: string;
  isBannerGraphic?: boolean;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: Array<{
    id: string;
    userName: string;
    userAvatar: string;
    text: string;
    timeAgo: string;
  }>;
}

interface FeedViewProps {
  currentUser: KakaoUser;
  friends: KakaoUser[];
  onSelectUser: (user: KakaoUser) => void;
  onStartChatWithUser?: (user: KakaoUser) => void;
  onOpenCalendar?: () => void;
}

const STORAGE_KEY_FEED_POSTS = 'amigos_feed_posts_v2';
const STORAGE_KEY_BOOKMARKS = 'amigos_bookmarked_posts_v1';

const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: 'post_jihoon',
    author: {
      id: 'user_jihoon',
      name: 'Lee Jihoon',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    },
    timeAgo: '8 hours ago',
    text: 'A clean desk, warm morning coffee, and full focus on the new project. ☕️🌿',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    likesCount: 46,
    isLiked: false,
    commentsCount: 5,
    comments: [
      {
        id: 'c1',
        userName: 'Min-ji Kim',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        text: 'So aesthetic! Where did you get the desk organizer? ✨',
        timeAgo: '6h ago',
      },
      {
        id: 'c2',
        userName: 'So-yeon Lee',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        text: 'Great vibes! Don’t forget to stretch your shoulders 🧘‍♀️',
        timeAgo: '4h ago',
      },
      {
        id: 'c3',
        userName: 'Daniel Kang',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        text: 'Clean setup! Ready to collaborate on the next build ☕️💻',
        timeAgo: '3h ago',
      },
      {
        id: 'c4',
        userName: 'Alex',
        userAvatar: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
        text: 'Love the natural lighting coming through the window! 🪴',
        timeAgo: '2h ago',
      },
      {
        id: 'c5',
        userName: 'Lee Jihoon',
        userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        text: 'Thanks everyone! Coffee really makes all the difference 💛',
        timeAgo: '1h ago',
      },
    ],
  },
  {
    id: 'post_jiwon',
    author: {
      id: 'user_jiwon',
      name: 'Jiwon Lee',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    timeAgo: '2 hours ago',
    text: 'Welcome everyone to the Amigos social community! Connect, chat, and share life moments together. 💛✨',
    isBannerGraphic: true,
    likesCount: 72,
    isLiked: false,
    commentsCount: 4,
    comments: [
      {
        id: 'c6',
        userName: 'Daniel Kang',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        text: 'Loving the real-time vibe and the cute emoticons! 🎉',
        timeAgo: '1h ago',
      },
      {
        id: 'c7',
        userName: 'Min-ji Kim',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        text: 'Welcome! Happy to be here with all my amigos 💛✨',
        timeAgo: '45m ago',
      },
      {
        id: 'c8',
        userName: 'So-yeon Lee',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        text: 'The games and live chats are so fun! 🎮',
        timeAgo: '30m ago',
      },
      {
        id: 'c9',
        userName: 'Alex',
        userAvatar: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
        text: 'Feel free to add me and send game invites! 🤝',
        timeAgo: '15m ago',
      },
    ],
  },
];

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  friends,
  onSelectUser,
  onStartChatWithUser,
  onOpenCalendar,
}) => {
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FEED_POSTS);
      if (stored) {
        const parsed: FeedPost[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            comments: Array.isArray(p.comments) ? p.comments : [],
            commentsCount: Array.isArray(p.comments) ? p.comments.length : (p.commentsCount || 0),
          }));
        }
      }
    } catch {}
    return INITIAL_FEED_POSTS;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Double-tap to like states & animation
  const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  // Active 3-dots post options dropdown & bookmarks
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Announcements Modal
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  // Photo upload & Camera Capture refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setNewPostImage(compressed);
          } else {
            setNewPostImage(result);
          }
          showToast('Photo added! 📷');
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera stream error, falling back to camera input:', err);
      setIsCameraActive(false);
      cameraInputRef.current?.click();
    }
  };

  const handleCapturePhoto = () => {
    kakaoAudio.playTap();
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setNewPostImage(dataUrl);
    }
    stopCamera();
    showToast('Photo clicked! 📸');
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FEED_POSTS, JSON.stringify(posts));
    } catch {}
  }, [posts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Real-time online friends synced via WebSocket & broadcast (No fake users)
  const [onlineFriends, setOnlineFriends] = useState<KakaoUser[]>(() =>
    multiplayerSocket.getOnlineFriends(friends)
  );

  useEffect(() => {
    const update = () => {
      setOnlineFriends(multiplayerSocket.getOnlineFriends(friends));
    };
    update();
    const unsub = multiplayerSocket.subscribe(update);
    return unsub;
  }, [friends]);

  const activeCommentPost = posts.find((p) => p.id === activeCommentPostId) || null;

  const handleToggleLike = (postId: string) => {
    kakaoAudio.playTap();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          const likesCount = isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
          return { ...p, isLiked, likesCount };
        }
        return p;
      })
    );
  };

  const handlePostDoubleTap = (postId: string) => {
    kakaoAudio.playTap();
    setHeartBurstPostId(postId);
    setTimeout(() => {
      setHeartBurstPostId((current) => (current === postId ? null : current));
    }, 850);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = true;
          const likesCount = p.isLiked ? p.likesCount : p.likesCount + 1;
          return { ...p, isLiked, likesCount };
        }
        return p;
      })
    );
    showToast('Liked post! ❤️');
  };

  const handlePostTap = (postId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    if (now - lastTap < 350) {
      handlePostDoubleTap(postId);
      lastTapRef.current[postId] = 0;
    } else {
      lastTapRef.current[postId] = now;
    }
  };

  const handleToggleBookmark = (postId: string) => {
    kakaoAudio.playTap();
    setBookmarkedPostIds((prev) => {
      const exists = prev.includes(postId);
      const updated = exists ? prev.filter((id) => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
      } catch {}
      showToast(exists ? 'Removed from bookmarks' : 'Post saved to bookmarks! 🔖');
      return updated;
    });
  };

  const handleSharePost = (post: FeedPost) => {
    kakaoAudio.playTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#feed-${post.id}`);
    }
    showToast('Post link copied to clipboard! 📋');
  };

  const handleDeletePost = (postId: string) => {
    kakaoAudio.playTap();
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('Post deleted');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImage.trim()) return;

    kakaoAudio.playKaTalkChime();
    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      timeAgo: 'Just now',
      text: newPostText.trim() || undefined,
      imageUrl: newPostImage.trim() || undefined,
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setNewPostImage('');
    stopCamera();
    setIsCreateModalOpen(false);
    showToast('Moment shared to Feed! ✨');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentPostId || !newCommentInput.trim()) return;

    kakaoAudio.playTap();
    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: newCommentInput.trim(),
      timeAgo: 'Just now',
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === activeCommentPostId) {
          const updatedComments = [...p.comments, newComment];
          return {
            ...p,
            comments: updatedComments,
            commentsCount: updatedComments.length,
          };
        }
        return p;
      })
    );

    setNewCommentInput('');
    showToast('Comment posted! 💬');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!activeCommentPostId) return;
    kakaoAudio.playTap();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === activeCommentPostId) {
          const updatedComments = p.comments.filter((c) => c.id !== commentId);
          return {
            ...p,
            comments: updatedComments,
            commentsCount: updatedComments.length,
          };
        }
        return p;
      })
    );
    showToast('Comment removed');
  };

  return (
    <div className="flex flex-col bg-[#F8F9FA] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#191919] text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* "What are you doing today?" Interactive Card */}
      <div className="px-4 pt-3">
        <div
          onClick={() => {
            kakaoAudio.playTap();
            setIsCreateModalOpen(true);
          }}
          className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-between cursor-pointer hover:border-amber-200 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Amigos Chat Logo Reveal badge */}
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs p-1.5 overflow-hidden">
              <img
                src="/Amigos Chat Logo Reveal.png"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
                alt="Amigos Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#191919] tracking-tight">
                Post your real side
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                Upload photo or click image live ✨
              </p>
            </div>
          </div>

          {/* Cute 3D Action icons on right: mascot, megaphone, calendar */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                kakaoAudio.playKaTalkChime();
                showToast('🐸 Frodo: "Have a wonderful day on Amigos! ✨"');
              }}
              className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-sm shadow-2xs hover:scale-110 active:scale-90 transition cursor-pointer"
              title="Amigos Mascot"
            >
              🐸
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                kakaoAudio.playTap();
                setShowAnnouncementsModal(true);
              }}
              className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-sm shadow-2xs hover:scale-110 active:scale-90 transition cursor-pointer"
              title="Community Announcements"
            >
              📢
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                kakaoAudio.playTap();
                if (onOpenCalendar) {
                  onOpenCalendar();
                } else {
                  showToast('📅 Amigos Calendar opened');
                }
              }}
              className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-[11px] font-black text-rose-600 shadow-2xs hover:scale-110 active:scale-90 transition cursor-pointer"
              title="Amigos Calendar"
            >
              31
            </button>
          </div>
        </div>
      </div>

      {/* "Online friends" Horizontal Stories Row - Only visible when friends are actually online (no fake users) */}
      {onlineFriends.length > 0 && (
        <div className="pt-4 pb-2 animate-in fade-in duration-200">
          <div className="px-4 mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1.5">
              <span>Online friends</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {onlineFriends.length}
              </span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Now
            </span>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar px-4 pb-1 scroll-smooth snap-x pr-8">
            {onlineFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => {
                  kakaoAudio.playTap();
                  onSelectUser(friend);
                }}
                className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition"
              >
                <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 via-amber-300 to-amber-100 shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      onError={(e) => handleAvatarError(e, friend.name)}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  {/* Green online indicator dot at top-left matching screenshot */}
                  <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center truncate max-w-[62px] mt-1.5">
                  {friend.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed Posts List */}
      <div className="px-4 pt-1 space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          >
            {/* Post Header: Author, Time, Options */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div
                onClick={() => {
                  kakaoAudio.playTap();
                  onSelectUser({
                    id: post.author.id,
                    name: post.author.name,
                    avatar: post.author.avatar,
                  });
                }}
                className="flex items-center gap-2.5 cursor-pointer active:scale-98 transition"
              >
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  onError={(e) => handleAvatarError(e, post.author.name)}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
                <div>
                  <h4 className="text-xs font-black text-[#191919] leading-snug">
                    {post.author.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {post.timeAgo}
                  </span>
                </div>
              </div>

              {/* Post Options Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    kakaoAudio.playTap();
                    setActiveMenuPostId((prev) => (prev === post.id ? null : post.id));
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {activeMenuPostId === post.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-30 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in zoom-in-95"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleSharePost(post);
                        setActiveMenuPostId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Copy Post Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleBookmark(post.id);
                        setActiveMenuPostId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                      <span>{bookmarkedPostIds.includes(post.id) ? 'Remove Bookmark' : 'Save Post'}</span>
                    </button>
                    {post.author.id === currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          handleDeletePost(post.id);
                          setActiveMenuPostId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Post</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Post Media / Graphic with Double Tap to Like */}
            <div
              className="relative select-none cursor-pointer group"
              onClick={() => handlePostTap(post.id)}
              onDoubleClick={() => handlePostDoubleTap(post.id)}
            >
              {post.isBannerGraphic ? (
                /* Custom Amigos 3D Branding Graphic */
                <div className="w-full bg-[#FAFAFA] border-y border-slate-100 py-10 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden select-none">
                  {/* 3D Mascot Character Art */}
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-3xl bg-white shadow-xl flex items-center justify-center p-2 border-2 border-slate-100 overflow-hidden">
                      <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Amigos Wordmark */}
                  <h3 className="text-2xl font-black text-[#191919] tracking-tight">
                    Amigos Chat
                  </h3>

                  {/* Subtitle */}
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">
                    CHAT • CONNECT • TOGETHER
                  </p>
                </div>
              ) : post.imageUrl ? (
                <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden relative">
                  <img
                    src={post.imageUrl}
                    alt="Post visual"
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition duration-300"
                  />
                </div>
              ) : null}

              {/* Animated Glowing Heart Burst Overlay on Double Tap */}
              {heartBurstPostId === post.id && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/15 backdrop-blur-[1px] animate-in fade-in duration-150">
                  <div className="animate-in zoom-in-50 duration-200">
                    <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.8)] scale-125" />
                  </div>
                </div>
              )}
            </div>

            {/* Optional text caption */}
            {post.text && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {post.text}
                </p>
              </div>
            )}

            {/* Interaction Bar: Heart, Comment, Bookmark, Share */}
            <div className="px-4 py-3 flex items-center gap-4">
              {/* Like / Heart */}
              <button
                type="button"
                onClick={() => handleToggleLike(post.id)}
                className="flex items-center gap-1.5 group transition active:scale-95"
                title="Like"
              >
                <Heart
                  className={`w-5 h-5 transition ${
                    post.isLiked
                      ? 'fill-rose-500 text-rose-500 scale-110'
                      : 'text-slate-800 group-hover:text-rose-500'
                  }`}
                />
                <span className="text-xs font-bold text-slate-800">
                  {post.likesCount}
                </span>
              </button>

              {/* Comments */}
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setActiveCommentPostId(post.id);
                }}
                className="flex items-center gap-1.5 text-slate-800 hover:text-amber-600 transition active:scale-95"
                title="View Comments"
              >
                <MessageCircle className="w-5 h-5 stroke-[2]" />
                <span className="text-xs font-bold text-slate-800">
                  {post.comments ? post.comments.length : (post.commentsCount || 0)}
                </span>
              </button>

              {/* Bookmark */}
              <button
                type="button"
                onClick={() => handleToggleBookmark(post.id)}
                className="flex items-center gap-1.5 text-slate-800 hover:text-amber-500 transition active:scale-95 ml-auto"
                title="Bookmark Post"
              >
                <Bookmark
                  className={`w-5 h-5 transition ${
                    bookmarkedPostIds.includes(post.id)
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-800'
                  }`}
                />
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={() => handleSharePost(post)}
                className="flex items-center gap-1.5 text-slate-800 hover:text-blue-500 transition active:scale-95"
                title="Share Post"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Moment / Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-amber-300"
                />
                <div>
                  <h3 className="text-xs font-black text-[#191919]">Post your real side</h3>
                  <span className="text-[10px] text-slate-400">Share with Amigos friends</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsCreateModalOpen(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-3 flex flex-col gap-3">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Post your real side... Share with friends"
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#191919] focus:outline-none focus:border-[#FEE500] min-h-[85px] resize-none"
                autoFocus
              />

              {/* Photo Upload & Click Image Section */}
              <div className="flex flex-col gap-2">
                {newPostImage ? (
                  /* Attached Photo Preview */
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
                    <img
                      src={newPostImage}
                      alt="Uploaded preview"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-between p-3 pointer-events-none">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" /> Photo Attached
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            kakaoAudio.playTap();
                            setNewPostImage('');
                          }}
                          className="pointer-events-auto w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition active:scale-95 shadow-md"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => {
                            kakaoAudio.playTap();
                            fileInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#191919] text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Change Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            kakaoAudio.playTap();
                            handleStartCamera();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#191919] text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isCameraActive ? (
                  /* Live Camera Viewfinder */
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-black shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition active:scale-95"
                        title="Close camera"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="px-5 py-2.5 rounded-full bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] font-black text-xs flex items-center gap-2 shadow-xl active:scale-95 transition"
                      >
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Photo Upload & Click Image Choice Buttons */
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        kakaoAudio.playTap();
                        fileInputRef.current?.click();
                      }}
                      className="py-3.5 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition flex flex-col items-center justify-center gap-1.5 active:scale-98 group cursor-pointer shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-[#191919]">Photo Upload</span>
                      <span className="text-[10px] text-slate-400 font-medium">From your device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        kakaoAudio.playTap();
                        handleStartCamera();
                      }}
                      className="py-3.5 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition flex flex-col items-center justify-center gap-1.5 active:scale-98 group cursor-pointer shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-[#191919]">Click Image</span>
                      <span className="text-[10px] text-slate-400 font-medium">Take photo live</span>
                    </button>
                  </div>
                )}

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = '';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!newPostText.trim() && !newPostImage.trim()}
                className={`w-full py-3 rounded-2xl font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 ${
                  newPostText.trim() || newPostImage.trim()
                    ? 'bg-[#191919] text-white hover:bg-slate-800 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Post Your Real Side ✨</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Comments Drawer / Modal - Shows all comments posted by everyone */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-3xl max-h-[78vh] flex flex-col shadow-2xl border-t border-slate-200">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-[#191919]">
                  Comments ({activeCommentPost.comments ? activeCommentPost.comments.length : 0})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentPostId(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List - displays every single comment posted */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {!activeCommentPost.comments || activeCommentPost.comments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Be the first to comment on this post! ✨
                </div>
              ) : (
                activeCommentPost.comments.map((comment) => (
                  <div key={comment.id} className="pt-2.5 first:pt-0 flex items-start gap-2.5 group">
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      onError={(e) => handleAvatarError(e, comment.userName)}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#191919]">
                          {comment.userName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400">
                            {comment.timeAgo}
                          </span>
                          {comment.userName === currentUser.name && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-slate-300 hover:text-rose-500 transition opacity-80 group-hover:opacity-100"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 leading-snug break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#191919] focus:outline-none focus:border-[#FEE500]"
              />
              <button
                type="submit"
                disabled={!newCommentInput.trim()}
                className="px-3.5 py-2 bg-[#191919] hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Community Announcements Modal */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#191919]">Community Notice</h3>
                  <span className="text-[10px] text-slate-400">Amigos Social Updates</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnnouncementsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-xs font-bold text-amber-900 block mb-1">✨ Double-Tap to Like</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Double-tap any photo in your feed to like it instantly with a burst heart animation!
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 block mb-1">💬 Transparent Comments</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Click on comments to see everyone’s discussions and join in instantly.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-xs font-bold text-blue-900 block mb-1">📸 Photo Upload & Camera</span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Upload photos from your gallery or take a live picture directly using the camera!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAnnouncementsModal(false)}
              className="w-full py-2.5 bg-[#191919] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
