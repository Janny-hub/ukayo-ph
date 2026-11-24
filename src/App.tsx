/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  MessageCircle,
  Award,
  Percent,
  Ticket,
  Store,
  Smartphone,
  ChevronRight,
  Image as ImageIcon,
  Tag,
  Radio,
  X,
  ChevronsUp,
  Video,
  RefreshCw,
  Plus,
  Settings,
  Heart,
  ArrowLeft,
  PlusCircle,
  Wallet,
  Package,
  Truck,
  Star,
  LayoutDashboard,
  ExternalLink,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Home,
  LayoutGrid,
  UploadCloud,
  Camera,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Minus,
  Headset,
  Headphones,
  Edit3,
  Volume2,
  VolumeX,
  Flag,
  ShieldAlert,
  FileText,
  Ban,
  Power,
  Clock,
  Share2,
} from 'lucide-react';
import {
  startUkayoCloudSync,
  normalizeAndMergeUkayoState,
  loadDeviceSession,
  saveDeviceSession,
  clearDeviceSession,
  subscribeToUserFirestoreStatus,
  fetchUserFirestoreStatusFromServer,
  sendRealFirebasePasswordResetOrVerification,
  FirestoreUserLiveStatus,
  publishLiveCameraFrame,
  subscribeToLiveCameraStream,
  LiveCameraBroadcastState,
} from './firebase';
import {
  startAgoraHostBroadcast,
  stopAgoraHostBroadcast,
  joinAgoraAudienceChannel,
  getAgoraChannelName,
} from './agoraLive';

export const STORAGE_KEY = 'ukayo_marketplace_state_v11';

export interface UkayCategory {
  id: string;
  label: string;
  image: string;
}

export const DEFAULT_UKAY_CATEGORIES: UkayCategory[] = [
  {
    id: 'Tops',
    label: 'Tops & Tees',
    image:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'Jackets',
    label: 'Jackets & Hoodies',
    image:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'Denim',
    label: 'Denim & Pants',
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'Bags',
    label: 'Bags & Wallets',
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'Shoes',
    label: 'Ukay Kicks',
    image:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'Bundle Bales',
    label: 'Bundle Bales',
    image:
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=300&q=80',
  },
];

export interface Product {
  id: string;
  code?: string;
  title: string;
  price: number;
  category: string;
  size: string;
  condition: string;
  status: string;
  pinned?: boolean;
  rating: number;
  image: string;
  images?: string[];
  description: string;
  reviews: { user: string; text: string }[];
}

export interface SellerReview {
  id: string;
  buyerId?: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  comment: string;
  tags?: string[];
  createdAt: string;
}

export interface Seller {
  id: string;
  name: string;
  handle: string;
  city: string;
  bio: string;
  avatar?: string;
  followers: number;
  followed: boolean;
  followedBy?: string[];
  pinnedItemId?: string;
  rating: number;
  reviews?: SellerReview[];
  isLive: boolean;
  liveUpdatedAt?: number;
  liveCategory: string;
  liveTitle: string;
  liveStreamPreview: string;
  gcash: string;
  products: Product[];
}

export interface LiveItem {
  id: string;
  sellerId: string;
  code: string;
  title: string;
  price: number;
  size: string;
  condition: string;
  image: string;
  pinned?: boolean;
  winner: string | null;
  steals: string[];
}

export interface LiveChatMessage {
  id?: string;
  sellerId?: string;
  sender: string;
  badge: string;
  text: string;
  isHost: boolean;
  time?: string;
}

export interface FeedPost {
  id: string;
  sellerId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  timeAgo: string;
  category: string;
  caption: string;
  tags: string[];
  itemTitle: string;
  price: number;
  condition: string;
  image: string;
  likes: number;
  liked: boolean;
  minedBy: string | null;
  comments: { user: string; text: string }[];
}

export interface TrackingEvent {
  time: string;
  title: string;
  desc: string;
  done: boolean;
  current?: boolean;
}

export interface MinedOrder {
  id: string;
  itemCode: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
  sellerName: string;
  buyerId?: string;
  buyerName: string;
  buyerAddress?: string;
  buyerPhone?: string;
  courier: string;
  paymentMethod: string;
  stage: 'TO_PAY' | 'TO_SHIP' | 'TO_RECEIVE' | 'TO_RATE';
  status: string;
  timestamp: string;
  trackingNumber?: string;
  waybillDate?: string;
  waybillGeneratedAt?: string;
  trackingEvents: TrackingEvent[];
}

export interface DirectMessage {
  id?: string;
  from: 'buyer' | 'seller' | 'admin';
  senderName?: string;
  text: string;
  time: string;
}

export interface SupportThread {
  id: string;
  userId: string;
  userName: string;
  userRole: 'BUYER' | 'SELLER';
  userAvatar?: string;
  subject: string;
  unreadAdmin: number;
  unreadUser: number;
  messages: DirectMessage[];
}

export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  address: string;
  avatar: string;
  verified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  idType: string;
  idNumber: string;
  idImageData: string;
  selfieImageData: string;
  isSeller: boolean;
  sellerStatus?: 'none' | 'pending' | 'approved';
  shopName: string;
  gcash: string;
  ownSellerId: string;
  taxTier?: string;
  tin?: string;
  birImages?: string[];
  unpaidMines?: number;
  accountStatus?: 'active' | 'suspended';
}

export interface KycApplication {
  id: string;
  userId: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  idType: string;
  idNumber: string;
  taxTier: string;
  tin: string;
  idPhoto: string;
  selfiePhoto: string;
  birPhotos: string[];
  payoutChannel: string;
  payoutAccount: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface AppState {
  isAuthenticated: boolean;
  role: 'buyer' | 'seller';
  activeTab: 'home' | 'feed' | 'mine' | 'store' | 'bag' | 'chat' | 'account';
  activeFeedCategory: string;
  activeStoreId: string;
  activeLiveSellerId: string;
  activePinnedItemId: string;
  activeChatSellerId: string;
  activePurchaseFilter: 'ALL' | 'TO_PAY' | 'TO_SHIP' | 'TO_RECEIVE' | 'TO_RATE';
  searchQuery: string;
  ukayPaborito: UkayCategory[];
  user: {
    id: string;
    name: string;
    email: string;
    password?: string;
    phone: string;
    address: string;
    avatar: string;
    verified: boolean;
    verificationStatus: 'unverified' | 'pending' | 'verified';
    idType: string;
    idNumber: string;
    idImageData: string;
    selfieImageData: string;
    isSeller: boolean;
    sellerStatus?: 'none' | 'pending' | 'approved';
    shopName: string;
    city: string;
    gcash: string;
    ownSellerId: string;
    taxTier?: string;
    tin?: string;
    birImages?: string[];
  };
  registeredUsers: RegisteredAccount[];
  kycApplications: KycApplication[];
  sellers: Seller[];
  liveItems: LiveItem[];
  liveChat: LiveChatMessage[];
  feedPosts: FeedPost[];
  minedOrders: MinedOrder[];
  directChats: Record<string, DirectMessage[]>;
  supportThreads: SupportThread[];
  platformVouchers?: { code: string; desc: string; claims: number; active: boolean }[];
  sellerVouchers?: { code: string; type: string; amount: number; minSpend: number; limit: number; used: number }[];
  payoutRequests?: {
    id: string;
    shopName: string;
    channel: string;
    account: string;
    grossAmount: number;
    withholdingTax: number;
    taxNote: string;
    status: 'pending' | 'released';
    date?: string;
  }[];
  deletedUserIds?: string[];
  blockedUserIds?: string[];
  hiddenPostIds?: string[];
}

export function compressImageFile(file: File, maxWidth = 320, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result;
      if (typeof src !== 'string') {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function getDefaultState(): AppState {
  return {
    isAuthenticated: false,
    role: 'buyer',
    activeTab: 'home',
    activeFeedCategory: 'ALL',
    activeStoreId: '',
    activeLiveSellerId: '',
    activePinnedItemId: '',
    activeChatSellerId: 'admin_support',
    activePurchaseFilter: 'ALL',
    searchQuery: '',
    ukayPaborito: DEFAULT_UKAY_CATEGORIES,
    user: {
      id: '',
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      avatar: '',
      verified: false,
      verificationStatus: 'unverified',
      idType: '',
      idNumber: '',
      idImageData: '',
      selfieImageData: '',
      isSeller: false,
      sellerStatus: 'none',
      shopName: '',
      city: '',
      gcash: '',
      ownSellerId: '',
      taxTier: 'Starter Micro-Seller (≤ ₱500k Annual • Sworn Declaration)',
      tin: '',
      birImages: [],
    },
    registeredUsers: [],
    kycApplications: [],
    sellers: [],
    liveItems: [],
    liveChat: [],
    feedPosts: [],
    minedOrders: [],
    directChats: {},
    supportThreads: [],
    platformVouchers: [],
    sellerVouchers: [],
    payoutRequests: [],
    deletedUserIds: [],
    blockedUserIds: [],
    hiddenPostIds: [],
  };
}

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface FloatingHeart {
  id: number;
  right: number;
  driftX: number;
  riseY: number;
  scale: number;
  rotation: number;
  duration: number;
  delay: number;
  color: string;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const def = getDefaultState();
    const deviceSession = loadDeviceSession();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const sessionUser =
          deviceSession?.user && (deviceSession.user.email || deviceSession.user.id)
            ? deviceSession.user
            : parsed.user || {};
        const isAuth = Boolean(
          deviceSession
            ? deviceSession.isAuthenticated
            : parsed.isAuthenticated || sessionUser.email || sessionUser.id
        );
        return normalizeAndMergeUkayoState(
          {
            ...def,
            isAuthenticated: isAuth,
            role: deviceSession?.role || parsed.role || 'buyer',
            user: { ...def.user, ...sessionUser },
          },
          {
            ...parsed,
            ukayPaborito:
              Array.isArray(parsed.ukayPaborito) && parsed.ukayPaborito.length > 0
                ? parsed.ukayPaborito
                : DEFAULT_UKAY_CATEGORIES,
          }
        );
      }
    } catch {
      // fallback
    }
    if (deviceSession?.isAuthenticated && deviceSession.user) {
      return {
        ...def,
        isAuthenticated: true,
        role: deviceSession.role,
        user: { ...def.user, ...deviceSession.user },
      };
    }
    return def;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const [firestoreLiveStatus, setFirestoreLiveStatus] =
    useState<FirestoreUserLiveStatus>({
      loading: true,
      connected: false,
      fromServer: false,
      foundInFirestore: false,
      verificationStatus: 'unverified',
      sellerStatus: 'none',
      verified: false,
      isSeller: false,
      shopName: '',
      kycIdType: '',
      lastSyncedAt: 'Connecting to Firestore...',
    });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  // Auth & Profile Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetEmailNotice, setResetEmailNotice] = useState<{
    message: string;
    consoleUrl?: string;
    newPassMode?: boolean;
  } | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  // Buyer Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAvatar, setRegAvatar] = useState('');

  // Edit Buyer Profile Modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Other Modals
  const [feedComposerOpen, setFeedComposerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [liveSetupOpen, setLiveSetupOpen] = useState(false);
  const [idVerifyOpen, setIdVerifyOpen] = useState(false);
  const [liveDropModalOpen, setLiveDropModalOpen] = useState(false);

  // Apple App Store Compliance Modals (Account Deletion 5.1.1(v), UGC Report/Block 1.2, Privacy/Terms/EULA 5.1.1(i))
  const [regAgreedTerms, setRegAgreedTerms] = useState(true);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [privacyTermsModalOpen, setPrivacyTermsModalOpen] = useState(false);
  const [privacyTermsTab, setPrivacyTermsTab] = useState<'privacy' | 'terms' | 'ugc'>('privacy');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    kind: 'post' | 'live';
    id: string;
    authorId: string;
    authorName: string;
    title: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState('Counterfeit / Misleading Ukay Item');
  const [reportNotes, setReportNotes] = useState('');

  // Feed Composer states
  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('250');
  const [postCategory, setPostCategory] = useState('Tops');
  const [postCondition, setPostCondition] = useState('10/10 Like New');
  const [postCaption, setPostCaption] = useState('');
  const [postImage, setPostImage] = useState('');

  // Live Flash Drop Modal states
  const [dropCode, setDropCode] = useState('A01');
  const [dropTitle, setDropTitle] = useState('');
  const [dropPrice, setDropPrice] = useState('250');
  const [dropSize, setDropSize] = useState('Large (23"x27")');
  const [dropCondition, setDropCondition] = useState('10/10 Like New');
  const [dropImage, setDropImage] = useState('');

  // Checkout states
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCourier, setCheckoutCourier] = useState('J&T Express');
  const [checkoutPayMethod, setCheckoutPayMethod] = useState<'COD' | 'BAYAD_AGAD'>('COD');
  const [selectedEWallet, setSelectedEWallet] = useState('GCash');
  const [ewalletSenderRef, setEwalletSenderRef] = useState('');

  // Live Setup states
  const [liveSetupTitle, setLiveSetupTitle] = useState('');
  const [liveSetupCategory, setLiveSetupCategory] = useState('Jackets & Hoodies');
  const [liveSetupCamera, setLiveSetupCamera] = useState<'environment' | 'user'>('user');
  const [liveSetupPinnedId, setLiveSetupPinnedId] = useState('');
  const [liveSetupTimer, setLiveSetupTimer] = useState('First Tap Locks (Instant)');
  const [liveSetupRule, setLiveSetupRule] = useState(
    'No joy reservers! Checkout within 12 hrs via Bayad Agad or COD.'
  );
  const [pendingLiveCoverData, setPendingLiveCoverData] = useState('');

  // ID Verification states
  const [verifyIdType, setVerifyIdType] = useState(
    'Philippine National ID (PhilSys / ePhilID)'
  );
  const [verifyFullName, setVerifyFullName] = useState('');
  const [verifyIdNumber, setVerifyIdNumber] = useState('');
  const [verifyIdFileLabel, setVerifyIdFileLabel] = useState(
    'Tap to upload Primary ID photo (JPG / PNG)'
  );
  const [verifySelfieFileLabel, setVerifySelfieFileLabel] = useState(
    'Tap to upload Selfie with ID'
  );
  const [verifyIdPreview, setVerifyIdPreview] = useState('');
  const [verifySelfiePreview, setVerifySelfiePreview] = useState('');

  // Inputs for Live Chat, Feed Comments, Direct Chat, and Seller Storefront Reviews
  const [liveChatInput, setLiveChatInput] = useState('');
  const [feedCommentInputs, setFeedCommentInputs] = useState<Record<string, string>>({});
  const [directChatInput, setDirectChatInput] = useState('');
  const [sellerReviewRating, setSellerReviewRating] = useState<number>(5);
  const [sellerReviewComment, setSellerReviewComment] = useState('');
  const [sellerReviewTags, setSellerReviewTags] = useState<string[]>([]);
  const [sellerReviewFilterStar, setSellerReviewFilterStar] = useState<number | 'ALL'>('ALL');

  // Camera stream refs & real-time remote camera broadcast viewer state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const agoraRemoteVideoRef = useRef<HTMLDivElement | null>(null);
  const agoraAudienceCtrlRef = useRef<{
    leave: () => Promise<void>;
    setAudioMuted: (muted: boolean) => void;
  } | null>(null);
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [liveStreamStartedAt, setLiveStreamStartedAt] = useState<number | null>(null);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [isAgoraRemoteVideoPlaying, setIsAgoraRemoteVideoPlaying] = useState(false);
  const [isAgoraRemoteAudioPlaying, setIsAgoraRemoteAudioPlaying] = useState(false);
  const [isLiveAudioMuted, setIsLiveAudioMuted] = useState(false);
  const [liveFacingMode, setLiveFacingMode] = useState<'environment' | 'user'>('user');
  const [remoteLiveStream, setRemoteLiveStream] = useState<LiveCameraBroadcastState | null>(null);

  // Touch & wheel refs for Mine Na! swipe
  const touchStartYRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const liveChatBoxRef = useRef<HTMLDivElement | null>(null);
  const directChatBoxRef = useRef<HTMLDivElement | null>(null);

  // Save state to localStorage & centralized Firestore real-time sync
  useEffect(() => {
    try {
      if (state.isAuthenticated && (state.user.email || state.user.id)) {
        saveDeviceSession({
          isAuthenticated: true,
          role: state.role,
          user: state.user,
        });
      }
      let toSave = state;
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        try {
          const existingParsed = JSON.parse(existingRaw);
          toSave = normalizeAndMergeUkayoState(existingParsed, state);
        } catch {
          // ignore
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      const win = window as unknown as {
        ukayoCloudSyncPush?: (s: AppState) => void;
      };
      if (win.ukayoCloudSyncPush) {
        win.ukayoCloudSyncPush(toSave);
      }
    } catch {
      // ignore storage errors
    }
  }, [state]);

  // Connect to centralized Firebase Firestore (ukayo_sync/live_state)
  useEffect(() => {
    const unsubscribe = startUkayoCloudSync<AppState>(
      STORAGE_KEY,
      () => stateRef.current,
      (merged) => {
        const def = getDefaultState();
        setState((prev) => ({
          ...def,
          ...merged,
          // Keep this device's active login session intact across multi-device sync
          isAuthenticated: Boolean(
            prev.isAuthenticated || prev.user.email || prev.user.id
          ),
          role: prev.role,
          activeTab: prev.activeTab,
          user: { ...def.user, ...(merged.user || {}) },
          ukayPaborito:
            Array.isArray(merged.ukayPaborito) && merged.ukayPaborito.length > 0
              ? merged.ukayPaborito
              : DEFAULT_UKAY_CATEGORIES,
        }));
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Firestore status indicator for verificationStatus & sellerStatus
  useEffect(() => {
    if (!state.isAuthenticated || (!state.user.id && !state.user.email)) {
      setFirestoreLiveStatus((prev) => ({
        ...prev,
        loading: false,
        foundInFirestore: false,
        verificationStatus: 'unverified',
        sellerStatus: 'none',
      }));
      return;
    }
    setFirestoreLiveStatus((prev) => ({ ...prev, loading: true }));
    const unsub = subscribeToUserFirestoreStatus(
      state.user.id,
      state.user.email,
      (liveStatus) => {
        setFirestoreLiveStatus(liveStatus);
      }
    );
    return () => unsub();
  }, [state.isAuthenticated, state.user.id, state.user.email]);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    if (path === '/seller' || path === '/seller-center') {
      window.location.replace('/ukayo_seller_center.html');
    } else if (path === '/admin' || path === '/admin-ops') {
      window.location.replace('/ukayo_admin_ops.html');
    }
  }, []);

  useEffect(() => {
    const syncFromLocalStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const def = getDefaultState();
        setState((prev) =>
          normalizeAndMergeUkayoState(prev, {
            ...def,
            ...parsed,
            user: { ...def.user, ...(parsed.user || {}) },
            ukayPaborito:
              Array.isArray(parsed.ukayPaborito) && parsed.ukayPaborito.length > 0
                ? parsed.ukayPaborito
                : DEFAULT_UKAY_CATEGORIES,
          })
        );
      } catch {
        // ignore
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        syncFromLocalStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncFromLocalStorage);
    window.addEventListener('pageshow', syncFromLocalStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncFromLocalStorage);
      window.removeEventListener('pageshow', syncFromLocalStorage);
    };
  }, []);

  useEffect(() => {
    if (liveChatBoxRef.current) {
      liveChatBoxRef.current.scrollTop = liveChatBoxRef.current.scrollHeight;
    }
  }, [state.liveChat, state.activeTab]);

  useEffect(() => {
    if (directChatBoxRef.current) {
      directChatBoxRef.current.scrollTop = directChatBoxRef.current.scrollHeight;
    }
  }, [state.directChats, state.supportThreads, state.activeChatSellerId, state.activeTab]);

  const showToast = (_message: string, _type: 'success' | 'error' = 'success') => {
    // On-screen action prompts disabled per user preference
  };

  const switchTab = (tab: AppState['activeTab']) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthTab(mode);
    setAuthModalOpen(true);
  };

  // =======================================================================
  // BUYER LOGIN / REGISTRATION / LOGOUT / PROFILE PICTURE UPLOAD
  // =======================================================================
  const handleBuyerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const password = regPassword.trim();
    const phone = regPhone.trim();
    const city = regCity.trim() || 'Metro Manila';
    const address = regAddress.trim() || city;

    if (!name || !email || !password) {
      showToast('Please complete your name, email, and password.', 'error');
      return;
    }

    if (!regAgreedTerms) {
      showToast('Please agree to the UKAYO Terms of Service, Privacy Policy & UGC EULA.', 'error');
      return;
    }

    const exists = state.registeredUsers.find(
      (u) => u.email.toLowerCase() === email
    );
    if (exists) {
      showToast('Email is already registered. Please log in instead.', 'error');
      setAuthTab('login');
      setLoginEmail(email);
      return;
    }

    const userId = 'usr_' + Date.now();
    const newAccount: RegisteredAccount = {
      id: userId,
      name,
      email,
      password,
      phone,
      city,
      address,
      avatar: regAvatar,
      verified: false,
      verificationStatus: 'unverified',
      idType: '',
      idNumber: '',
      idImageData: '',
      selfieImageData: '',
      isSeller: false,
      sellerStatus: 'none',
      shopName: '',
      gcash: phone,
      ownSellerId: '',
      taxTier: 'Starter Micro-Seller (≤ ₱500k Annual • Sworn Declaration)',
      tin: '',
      birImages: [],
      unpaidMines: 0,
      accountStatus: 'active',
    };

    const nextUserObj = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      password: newAccount.password,
      phone: newAccount.phone,
      address: newAccount.address,
      avatar: newAccount.avatar,
      verified: false,
      verificationStatus: 'unverified' as const,
      idType: '',
      idNumber: '',
      idImageData: '',
      selfieImageData: '',
      isSeller: false,
      sellerStatus: 'none' as const,
      shopName: '',
      city: newAccount.city,
      gcash: newAccount.gcash,
      ownSellerId: '',
      taxTier: newAccount.taxTier,
      tin: '',
      birImages: [],
    };

    saveDeviceSession({
      isAuthenticated: true,
      role: 'buyer',
      user: nextUserObj,
    });

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      role: 'buyer',
      user: nextUserObj,
      registeredUsers: [...prev.registeredUsers, newAccount],
    }));

    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setRegCity('');
    setRegAddress('');
    setRegAvatar('');
    setAuthModalOpen(false);
    showToast(`Welcome to UKAYO, ${name}! You are signed in across all tabs including Ukay Feed.`);
  };

  const handleBuyerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = loginEmail.trim().toLowerCase();
    const passInput = loginPassword.trim();

    const found = state.registeredUsers.find(
      (u) =>
        (u.email.toLowerCase() === emailInput ||
          u.name.toLowerCase() === emailInput) &&
        u.password === passInput
    );

    if (!found) {
      showToast('Invalid email/username or password. Please register first if new.', 'error');
      return;
    }

    if (found.accountStatus === 'suspended') {
      showToast('This account is currently suspended by Admin Ops.', 'error');
      return;
    }

    const loggedInUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      password: found.password,
      phone: found.phone,
      address: found.address,
      avatar: found.avatar,
      verified: found.verified,
      verificationStatus: found.verificationStatus,
      idType: found.idType,
      idNumber: found.idNumber,
      idImageData: found.idImageData,
      selfieImageData: found.selfieImageData,
      isSeller: found.isSeller,
      sellerStatus: found.sellerStatus || (found.isSeller ? 'approved' : 'none'),
      shopName: found.shopName,
      city: found.city,
      gcash: found.gcash,
      ownSellerId: found.ownSellerId,
      taxTier: found.taxTier,
      tin: found.tin,
      birImages: found.birImages || [],
    };

    saveDeviceSession({
      isAuthenticated: true,
      role: found.isSeller ? state.role : 'buyer',
      user: loggedInUser,
    });

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      role: found.isSeller ? prev.role : 'buyer',
      user: loggedInUser,
    }));

    setLoginPassword('');
    setResetEmailNotice(null);
    setAuthModalOpen(false);
    showToast(`Welcome back, ${found.name}!`);
  };

  const handleSendPasswordResetEmail = async () => {
    const emailTarget = (loginEmail || state.user.email || '').trim().toLowerCase();
    if (!emailTarget || !emailTarget.includes('@')) {
      showToast('Enter your registered email address first to receive a password reset.', 'error');
      return;
    }
    const res = await sendRealFirebasePasswordResetOrVerification(emailTarget);
    setResetEmailNotice({
      message: res.message,
      consoleUrl: res.consoleUrl,
      newPassMode: true,
    });
    showToast(
      res.sent
        ? `Sent Firebase password reset email to ${emailTarget}!`
        : 'Ready for direct password reset below.'
    );
  };

  const handleConfirmDirectPasswordReset = () => {
    const emailTarget = (loginEmail || state.user.email || '').trim().toLowerCase();
    const nextPass = newResetPassword.trim();
    if (!emailTarget || !nextPass) {
      showToast('Enter your email and your new password.', 'error');
      return;
    }
    const found = state.registeredUsers.find(
      (u) => u.email.toLowerCase() === emailTarget
    );
    if (!found) {
      showToast('No registered account found with that email.', 'error');
      return;
    }
    setState((prev) => ({
      ...prev,
      user:
        prev.user.email.toLowerCase() === emailTarget
          ? { ...prev.user, password: nextPass }
          : prev.user,
      registeredUsers: prev.registeredUsers.map((u) =>
        u.email.toLowerCase() === emailTarget ? { ...u, password: nextPass } : u
      ),
    }));
    setLoginPassword(nextPass);
    setNewResetPassword('');
    setResetEmailNotice(null);
    showToast('Password updated and synced to Firestore! You can now log in.');
  };

  const refreshFirestoreStatusNow = async () => {
    if (!state.isAuthenticated) return;
    setFirestoreLiveStatus((prev) => ({ ...prev, loading: true }));
    try {
      const latest = await fetchUserFirestoreStatusFromServer(
        state.user.id,
        state.user.email
      );
      setFirestoreLiveStatus(latest);
      showToast('Fetched latest verificationStatus & sellerStatus from Firestore!');
    } catch {
      setFirestoreLiveStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleAccountLogout = () => {
    if (!state.isAuthenticated) {
      openAuthModal('login');
      return;
    }
    clearDeviceSession();
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      role: 'buyer',
      user: getDefaultState().user,
    }));
    showToast('You have been logged out on this device.');
  };

  // Apple App Store Guideline 5.1.1(v): Permanent In-App Account & Data Deletion
  const handlePermanentDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.isAuthenticated) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm permanent account deletion.', 'error');
      return;
    }
    const targetUserId = (state.user.id || '').trim();
    const targetEmail = (state.user.email || '').trim().toLowerCase();
    const targetSellerId = (state.user.ownSellerId || '').trim();
    const tombstones = [targetUserId, targetEmail, targetSellerId].filter(Boolean);

    clearDeviceSession();
    setState((prev) => {
      const nextDeleted = Array.from(
        new Set([...(prev.deletedUserIds || []), ...tombstones])
      );
      return {
        ...prev,
        isAuthenticated: false,
        role: 'buyer',
        user: getDefaultState().user,
        deletedUserIds: nextDeleted,
        registeredUsers: prev.registeredUsers.filter(
          (u) =>
            u.id !== targetUserId &&
            u.email.toLowerCase() !== targetEmail &&
            (!targetSellerId || u.ownSellerId !== targetSellerId)
        ),
        sellers: prev.sellers.filter(
          (s) =>
            s.id !== targetSellerId &&
            s.name.toLowerCase() !== (prev.user.shopName || '').toLowerCase()
        ),
        kycApplications: prev.kycApplications.filter(
          (k) =>
            k.userId !== targetUserId &&
            k.email.toLowerCase() !== targetEmail
        ),
      };
    });
    setDeleteConfirmText('');
    setDeleteAccountModalOpen(false);
    showToast('Your account and personal data have been permanently deleted from UKAYO.');
  };

  // Apple App Store Guideline 1.2: UGC Report & Block User / Content
  const openReportContentModal = (target: {
    kind: 'post' | 'live';
    id: string;
    authorId: string;
    authorName: string;
    title: string;
  }) => {
    setReportTarget(target);
    setReportReason('Counterfeit / Misleading Ukay Item');
    setReportNotes('');
    setReportModalOpen(true);
  };

  const submitUgcReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const reporterKey = state.user.id || state.user.email || 'guest_reporter';
    const reporterName = state.user.name || 'Marketplace User';
    const threadId = 'sup_' + reporterKey;
    const reportMsgText = `[UGC REPORT • ${reportTarget.kind.toUpperCase()}] Target: ${reportTarget.authorName} (${reportTarget.title}) • Reason: ${reportReason}${
      reportNotes.trim() ? ' • Details: ' + reportNotes.trim() : ''
    }`;

    setState((prev) => {
      const nextHidden =
        reportTarget.kind === 'post'
          ? Array.from(new Set([...(prev.hiddenPostIds || []), reportTarget.id]))
          : prev.hiddenPostIds || [];

      const existingIdx = prev.supportThreads.findIndex((t) => t.id === threadId);
      const newMsg: DirectMessage = {
        id: 'msg_' + Date.now(),
        from: prev.user.isSeller ? 'seller' : 'buyer',
        senderName: reporterName,
        text: reportMsgText,
        time: nowTime,
      };
      const nextThreads = [...prev.supportThreads];
      if (existingIdx >= 0) {
        nextThreads[existingIdx] = {
          ...nextThreads[existingIdx],
          unreadAdmin: (nextThreads[existingIdx].unreadAdmin || 0) + 1,
          messages: [...nextThreads[existingIdx].messages, newMsg],
        };
      } else {
        nextThreads.unshift({
          id: threadId,
          userId: reporterKey,
          userName: reporterName,
          userRole: prev.user.isSeller ? 'SELLER' : 'BUYER',
          subject: 'UGC Safety Report',
          unreadAdmin: 1,
          unreadUser: 0,
          messages: [newMsg],
        });
      }

      return {
        ...prev,
        hiddenPostIds: nextHidden,
        supportThreads: nextThreads,
      };
    });

    setReportModalOpen(false);
    showToast(
      `Report submitted to UKAYO Trust & Safety Admin Ops. Content hidden from your feed.`
    );
  };

  const handleBlockUserFromModal = () => {
    if (!reportTarget) return;
    const blockKeys = [
      reportTarget.authorId,
      reportTarget.authorName.toLowerCase(),
    ].filter(Boolean);

    setState((prev) => ({
      ...prev,
      blockedUserIds: Array.from(
        new Set([...(prev.blockedUserIds || []), ...blockKeys])
      ),
      hiddenPostIds:
        reportTarget.kind === 'post'
          ? Array.from(new Set([...(prev.hiddenPostIds || []), reportTarget.id]))
          : prev.hiddenPostIds || [],
    }));

    setReportModalOpen(false);
    if (reportTarget.kind === 'live') {
      switchTab('feed');
    }
    showToast(
      `Blocked ${reportTarget.authorName}. You will no longer see their posts or live streams.`
    );
  };

  const handleUnblockAllUsers = () => {
    setState((prev) => ({
      ...prev,
      blockedUserIds: [],
      hiddenPostIds: [],
    }));
    showToast('Cleared blocked users and restored hidden feed posts.');
  };

  const handleProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'reg' | 'edit' | 'direct') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 400, 0.8);
    if (!dataUrl) return;

    if (target === 'reg') {
      setRegAvatar(dataUrl);
    } else if (target === 'edit') {
      setEditAvatar(dataUrl);
    } else {
      if (!state.isAuthenticated) {
        openAuthModal('register');
        return;
      }
      setState((prev) => ({
        ...prev,
        user: { ...prev.user, avatar: dataUrl },
        registeredUsers: prev.registeredUsers.map((u) =>
          u.id === prev.user.id ? { ...u, avatar: dataUrl } : u
        ),
      }));
      showToast('Profile picture updated!');
    }
  };

  const openEditProfileModal = () => {
    if (!state.isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setEditName(state.user.name);
    setEditEmail(state.user.email);
    setEditPhone(state.user.phone || state.user.gcash);
    setEditCity(state.user.city);
    setEditAddress(state.user.address || state.user.city);
    setEditAvatar(state.user.avatar || '');
    setEditProfileOpen(true);
  };

  const saveBuyerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = editName.trim() || state.user.name;
    const nextEmail = editEmail.trim() || state.user.email;
    const nextPhone = editPhone.trim() || state.user.phone;
    const nextCity = editCity.trim() || state.user.city;
    const nextAddress = editAddress.trim() || nextCity;

    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        city: nextCity,
        address: nextAddress,
        gcash: nextPhone || prev.user.gcash,
        avatar: editAvatar,
      },
      registeredUsers: prev.registeredUsers.map((u) =>
        u.id === prev.user.id
          ? {
              ...u,
              name: nextName,
              email: nextEmail,
              phone: nextPhone,
              city: nextCity,
              address: nextAddress,
              gcash: nextPhone || u.gcash,
              avatar: editAvatar,
            }
          : u
      ),
    }));
    setEditProfileOpen(false);
    showToast('Buyer profile & picture saved!');
  };

  // =======================================================================
  // SEARCH, SELLER REGISTRATION REDIRECT & PORTAL ACCESS RULES
  // =======================================================================
  const persistMergedBeforeRedirect = () => {
    try {
      let merged = state;
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        merged = normalizeAndMergeUkayoState(state, JSON.parse(existingRaw));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      const win = window as unknown as {
        ukayoCloudSyncPush?: (s: AppState) => void;
      };
      if (win.ukayoCloudSyncPush) {
        win.ukayoCloudSyncPush(merged);
      }
    } catch {
      // ignore
    }
  };

  const handleGlobalSearch = (val: string) => {
    const q = val.trim().toLowerCase();
    if (q === '@admin' || q === '/admin' || q === 'jazran25') {
      persistMergedBeforeRedirect();
      window.location.href = '/ukayo_admin_ops.html';
      return;
    }
    setState((prev) => ({
      ...prev,
      searchQuery: q,
      activeTab: prev.activeTab === 'home' && q.length > 0 ? 'store' : prev.activeTab,
    }));
  };

  const browseUkayCategory = (catId: string) => {
    setState((prev) => ({
      ...prev,
      activeFeedCategory: catId || 'ALL',
      activeStoreId: '',
      activeTab: 'store',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLiveRoomForSeller = (sellerId: string) => {
    setState((prev) => {
      const sellerItem =
        prev.liveItems.find((i) => i.sellerId === sellerId && !i.winner) ||
        prev.liveItems.find((i) => i.sellerId === sellerId);
      return {
        ...prev,
        activeLiveSellerId: sellerId,
        activePinnedItemId: sellerItem ? sellerItem.id : prev.activePinnedItemId,
        activeTab: 'mine',
      };
    });
  };

  const openSellerStore = (sellerId?: string) => {
    const targetId = sellerId || '';
    setState((prev) => ({
      ...prev,
      activeStoreId: targetId,
      activeFeedCategory: 'ALL',
      activeTab: 'store',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Only registered sellers can access Seller Center portal
  const openSellerCenterPortal = () => {
    if (!state.isAuthenticated) {
      showToast('Please log in or register as a buyer first.', 'error');
      openAuthModal('login');
      return;
    }
    if (!state.user.isSeller) {
      showToast('Only registered sellers can access Seller Center. Redirecting to Seller Registration...', 'error');
      goToSellerRegistrationPage();
      return;
    }
    persistMergedBeforeRedirect();
    window.location.href = '/ukayo_seller_center.html';
  };

  // Directs buyer to the Seller Registration Page when "Apply Now" is clicked
  const goToSellerRegistrationPage = () => {
    if (!state.isAuthenticated) {
      showToast('Please register or log in to your Buyer account first before applying as a Seller.', 'error');
      openAuthModal('register');
      return;
    }
    persistMergedBeforeRedirect();
    window.location.href = '/ukayo_seller_center.html?mode=register';
  };

  const handleBecomeSellerAction = () => {
    if (!state.isAuthenticated) {
      showToast('Please register or log in as a Buyer first.', 'error');
      openAuthModal('register');
      return;
    }
    if (state.user.isSeller) {
      openSellerCenterPortal();
      return;
    }
    goToSellerRegistrationPage();
  };

  const setMarketplaceMode = (mode: 'buyer' | 'seller') => {
    if (mode === 'seller' && !state.user.isSeller) {
      goToSellerRegistrationPage();
      return;
    }
    setState((prev) => ({ ...prev, role: mode }));
  };

  // =======================================================================
  // CUSTOMER SERVICE (CONNECT BUYER & SELLER WITH ADMIN FOR HELP)
  // =======================================================================
  const openCustomerServiceChat = () => {
    setState((prev) => ({
      ...prev,
      activeChatSellerId: 'admin_support',
      activeTab: 'chat',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =======================================================================
  // LIVE SELLING & UKAY FEED FUNCTIONS (LIVE HOSTING FOR REGISTERED SELLERS ONLY)
  // =======================================================================
  const checkIsRegisteredSeller = () =>
    Boolean(
      (state.isAuthenticated || state.user.email || state.user.id) &&
        (state.user.isSeller ||
          firestoreLiveStatus.isSeller ||
          firestoreLiveStatus.sellerStatus === 'approved' ||
          firestoreLiveStatus.sellerStatus === 'pending' ||
          state.user.sellerStatus === 'approved' ||
          state.user.sellerStatus === 'pending')
    );

  const isOwnSellerProduct = (
    targetSellerId?: string,
    targetSellerName?: string
  ) => {
    if (!checkIsRegisteredSeller()) return false;
    if (isCameraStreaming) return true;
    const myIds = new Set(
      [
        state.user.ownSellerId,
        state.user.id ? 'seller_' + state.user.id : '',
        state.user.id,
      ].filter(Boolean)
    );
    if (targetSellerId && myIds.has(targetSellerId)) return true;
    const myShop = (state.user.shopName || '').trim().toLowerCase();
    if (
      myShop &&
      targetSellerName &&
      targetSellerName.trim().toLowerCase() === myShop
    ) {
      return true;
    }
    return false;
  };

  const openLiveSetupModal = () => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register first!', 'error');
      openAuthModal('login');
      return;
    }
    if (!checkIsRegisteredSeller()) {
      showToast(
        'Only registered UKAYO Sellers can start a Live Stream. Register as a Seller in My Account first!',
        'error'
      );
      handleBecomeSellerAction();
      return;
    }
    const myHostId = state.user.ownSellerId || 'seller_' + (state.user.id || 'host');
    const seller =
      state.sellers.find((s) => s.id === myHostId) ||
      state.sellers.find((s) => s.id === state.activeLiveSellerId);
    setLiveSetupTitle(
      seller?.liveTitle || `${state.user.shopName || state.user.name} Live Ukay Drop!`
    );
    if (seller?.liveCategory) setLiveSetupCategory(seller.liveCategory);
    setLiveSetupPinnedId(state.activePinnedItemId);
    setLiveSetupOpen(true);
  };

  const launchSellerLiveInApp = () => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register first!', 'error');
      openAuthModal('login');
      return;
    }
    if (!checkIsRegisteredSeller()) {
      showToast(
        'Only registered UKAYO Sellers can start a Live Stream. Register as a Seller first!',
        'error'
      );
      handleBecomeSellerAction();
      return;
    }
    const targetSellerId =
      state.user.ownSellerId ||
      'seller_' + (state.user.id || 'host');
    const seller = state.sellers.find((s) => s.id === targetSellerId);
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      activeLiveSellerId: targetSellerId,
      activeTab: 'mine',
    }));
    setLiveSetupTitle(
      seller?.liveTitle || `${state.user.shopName || state.user.name} Live Ukay Drop!`
    );
    if (seller?.liveCategory) setLiveSetupCategory(seller.liveCategory);
    setLiveSetupPinnedId(state.activePinnedItemId);
    setLiveSetupOpen(true);
  };

  const launchSellerPostInApp = () => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      openAuthModal('login');
      return;
    }
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      role: prev.user.isSeller ? 'seller' : 'buyer',
      activeTab: 'feed',
    }));
    setFeedComposerOpen(true);
  };

  const handleFeedPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 650, 0.8);
    if (dataUrl) setPostImage(dataUrl);
  };

  const submitNewFeedPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      setFeedComposerOpen(false);
      openAuthModal('login');
      return;
    }
    const title = postTitle.trim();
    const price = Number(postPrice) || 200;
    const category = postCategory;
    const caption = postCaption.trim();

    const defaultImg =
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80';

    const newPost: FeedPost = {
      id: 'post_' + Date.now(),
      sellerId: state.user.ownSellerId || state.user.id,
      authorName:
        state.user.isSeller && state.user.shopName
          ? state.user.shopName
          : state.user.name,
      authorAvatar: state.user.avatar || '',
      authorRole: `${
        state.user.isSeller ? 'Verified Seller' : 'Community Miner'
      } • ${state.user.city || 'Philippines'}`,
      timeAgo: 'Just now',
      category,
      caption,
      tags: ['#UkayDrop', `#${category.replace(/\s+/g, '')}`, '#Thrifted'],
      itemTitle: title,
      price,
      condition: postCondition || '9.5/10 Preloved',
      image: postImage || defaultImg,
      likes: 0,
      liked: false,
      minedBy: null,
      comments: [],
    };

    setState((prev) => ({
      ...prev,
      feedPosts: [newPost, ...prev.feedPosts],
    }));

    setPostTitle('');
    setPostPrice('250');
    setPostCaption('');
    setPostImage('');
    setFeedComposerOpen(false);
    showToast('Posted to Ukay Feed!');
  };

  const toggleLikePost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      feedPosts: prev.feedPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              likes: p.likes + (!p.liked ? 1 : -1),
            }
          : p
      ),
    }));
  };

  const addFeedComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      openAuthModal('login');
      return;
    }
    const text = (feedCommentInputs[postId] || '').trim();
    if (!text) return;

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      feedPosts: prev.feedPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...p.comments, { user: prev.user.name || 'Ukayo Miner', text }],
            }
          : p
      ),
    }));
    setFeedCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const claimFeedPost = (postId: string) => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register as a Buyer to Mine items!', 'error');
      openAuthModal('login');
      return;
    }
    const post = state.feedPosts.find((p) => p.id === postId);
    if (!post || post.minedBy) return;
    if (isOwnSellerProduct(post.sellerId, post.authorName)) {
      showToast(
        'As the Seller, you cannot Mine or Lock your own product. Only Buyers can tap MINE NA!',
        'error'
      );
      return;
    }

    const newOrder: MinedOrder = {
      id: 'ord_' + Date.now(),
      itemCode: 'FEED',
      title: post.itemTitle,
      price: post.price,
      quantity: 1,
      image: post.image,
      sellerId: post.sellerId,
      sellerName: post.authorName,
      buyerId: state.user.id,
      buyerName: state.user.name,
      buyerAddress: state.user.address || state.user.city,
      buyerPhone: state.user.phone || state.user.gcash,
      courier: 'J&T Express',
      paymentMethod: 'COD',
      stage: 'TO_PAY',
      status: 'In My Bayong — Ready for Checkout',
      timestamp: 'Just now',
      trackingEvents: [
        {
          time: 'Just now',
          title: 'Added to My Bayong',
          desc: 'Claimed from Ukay Feed',
          done: true,
          current: true,
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      feedPosts: prev.feedPosts.map((p) =>
        p.id === postId ? { ...p, minedBy: prev.user.name } : p
      ),
      minedOrders: [newOrder, ...prev.minedOrders],
    }));

    showToast(`Mined "${post.itemTitle}"! Added to My Bayong.`);
  };

  const claimLiveItem = (itemId: string) => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register as a Buyer to Mine live items!', 'error');
      openAuthModal('login');
      return;
    }
    const item =
      state.liveItems.find((i) => i.id === itemId) ||
      (activePinnedItem && activePinnedItem.id === itemId
        ? activePinnedItem
        : undefined);
    if (!item) return;
    const seller =
      state.sellers.find((s) => s.id === item.sellerId) ||
      activeLiveSeller ||
      state.sellers[0];

    if (
      isOwnSellerProduct(
        item.sellerId || seller?.id,
        seller?.name || remoteLiveStream?.sellerName
      )
    ) {
      showToast(
        'As the Seller, you cannot Mine or Lock your own pinned product. Only Buyers can Mine & Lock!',
        'error'
      );
      return;
    }

    if (!item.winner) {
      const newOrder: MinedOrder = {
        id: 'ord_' + Date.now(),
        itemCode: item.code,
        title: item.title,
        price: item.price,
        quantity: 1,
        image: item.image,
        sellerId: seller ? seller.id : item.sellerId,
        sellerName:
          seller?.name ||
          remoteLiveStream?.sellerName ||
          'Ukay Seller',
        buyerId: state.user.id,
        buyerName: state.user.name,
        buyerAddress: state.user.address || state.user.city,
        buyerPhone: state.user.phone || state.user.gcash,
        courier: 'J&T Express',
        paymentMethod: 'COD',
        stage: 'TO_PAY',
        status: 'Locked Live — In My Bayong',
        timestamp: 'Just now',
        trackingEvents: [
          {
            time: 'Just now',
            title: `Locked Live (${item.code})`,
            desc: 'Added to My Bayong for checkout',
            done: true,
            current: true,
          },
        ],
      };

      setState((prev) => {
        const existsInList = prev.liveItems.some((i) => i.id === itemId);
        const nextLiveItems = existsInList
          ? prev.liveItems.map((i) =>
              i.id === itemId ? { ...i, winner: prev.user.name } : i
            )
          : [{ ...item, winner: prev.user.name }, ...prev.liveItems];
        return {
          ...prev,
          liveItems: nextLiveItems,
          liveChat: [
            ...prev.liveChat,
            {
              id: 'lc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              sellerId: seller ? seller.id : item.sellerId,
              sender: prev.user.name,
              badge: 'LOCKED',
              text: `MINED ${item.code} (${item.title}) — ₱${item.price}!`,
              isHost: false,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
          minedOrders: [newOrder, ...prev.minedOrders],
        };
      });
      showToast(`First to Mine! ${item.code} added to My Bayong.`);
    } else if (item.winner !== state.user.name) {
      const nextSteals = item.steals.includes(state.user.name)
        ? item.steals
        : [...item.steals, state.user.name];

      setState((prev) => ({
        ...prev,
        liveItems: prev.liveItems.map((i) =>
          i.id === itemId ? { ...i, steals: nextSteals } : i
        ),
        liveChat: [
          ...prev.liveChat,
          {
            id: 'lc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            sellerId: seller ? seller.id : item.sellerId,
            sender: prev.user.name,
            badge: 'MINER',
            text: `Steal / Next in line for ${item.code}!`,
            isHost: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
      showToast(`Queued as Steal #${nextSteals.length} for ${item.code}!`);
    } else {
      showToast(`You already locked ${item.code}! Check My Bayong.`);
    }
  };

  const sendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      openAuthModal('login');
      return;
    }
    const text = liveChatInput.trim();
    if (!text) return;

    const currentSeller =
      state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
      state.sellers[0];
    const myHostId = state.user.ownSellerId || 'seller_' + state.user.id;
    const isHostOfRoom =
      Boolean(currentSeller && currentSeller.id === myHostId) ||
      state.role === 'seller';

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      liveChat: [
        ...prev.liveChat,
        {
          id: 'lc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          sellerId: currentSeller?.id || '',
          sender:
            isHostOfRoom && prev.user.shopName
              ? prev.user.shopName
              : prev.user.name || 'Ukayo Miner',
          badge: isHostOfRoom ? 'HOST' : 'MINER',
          text,
          isHost: isHostOfRoom,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
    setLiveChatInput('');
  };

  const toggleFollowCurrentLiveSeller = () => {
    const activeLives = state.sellers.filter((s) => s.isLive);
    const seller =
      activeLives.find((s) => s.id === state.activeLiveSellerId) ||
      activeLives[0];
    if (!seller) return;

    const followerKey = state.user.id || state.user.email || 'guest_device';
    const existingFollowedBy = Array.isArray(seller.followedBy)
      ? seller.followedBy
      : [];
    const currentlyFollowing =
      existingFollowedBy.includes(followerKey) || Boolean(seller.followed);
    const nextFollowed = !currentlyFollowing;
    const nextFollowedBy = nextFollowed
      ? Array.from(new Set([...existingFollowedBy, followerKey]))
      : existingFollowedBy.filter((k) => k !== followerKey);

    setState((prev) => ({
      ...prev,
      activeLiveSellerId: prev.activeLiveSellerId || seller.id,
      sellers: prev.sellers.map((s) =>
        s.id === seller.id
          ? {
              ...s,
              followed: nextFollowed,
              followedBy: nextFollowedBy,
              followers: Math.max(
                nextFollowedBy.length,
                Math.max(0, (s.followers || 0) + (nextFollowed ? 1 : -1))
              ),
            }
          : s
      ),
    }));
    showToast(
      nextFollowed ? `Following ${seller.name}!` : `Unfollowed ${seller.name}`
    );
  };

  const switchToNextRelatedLive = () => {
    const activeLives = state.sellers.filter((s) => s.isLive);
    if (activeLives.length <= 1) return;
    const current =
      activeLives.find((s) => s.id === state.activeLiveSellerId) ||
      activeLives[0];
    if (!current) return;
    const others = activeLives.filter((s) => s.id !== current.id);
    if (!others.length) return;
    const related =
      others.find((s) => s.liveCategory === current.liveCategory) || others[0];
    openLiveRoomForSeller(related.id);
  };

  const handleLiveTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleLiveTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    if (deltaY > 65) {
      switchToNextRelatedLive();
    }
  };

  const handleLiveWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 900) return;
    if (e.deltaY > 45) {
      lastWheelTimeRef.current = now;
      switchToNextRelatedLive();
    }
  };

  const triggerLiveReaction = () => {
    const palette = ['#FF2D55', '#FB7185', '#2DD4BF', '#F43F5E', '#FF6B8B', '#F59E0B'];
    const baseTime = Date.now();
    const burstCount = 6;
    const newParticles: FloatingHeart[] = Array.from({ length: burstCount }, (_, idx) => ({
      id: baseTime + idx + Math.random(),
      right: 8 + Math.random() * 24,
      driftX: -52 + Math.random() * 74,
      riseY: -(195 + Math.random() * 125),
      scale: 0.85 + Math.random() * 0.55,
      rotation: -24 + Math.random() * 48,
      duration: 1.45 + Math.random() * 0.75,
      delay: idx * 38,
      color: palette[(idx + Math.floor(Math.random() * palette.length)) % palette.length],
    }));
    const ids = new Set(newParticles.map((p) => p.id));
    setHearts((prev) => [...prev.slice(-30), ...newParticles]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !ids.has(h.id)));
    }, 2500);
  };

  const handleLiveCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 700, 0.8);
    if (dataUrl) setPendingLiveCoverData(dataUrl);
  };

  // Live stream duration counter effect (calculates time elapsed from the moment the stream starts)
  useEffect(() => {
    if (!isCameraStreaming) {
      return;
    }
    const startTs = liveStreamStartedAt || Date.now();
    if (!liveStreamStartedAt) {
      setLiveStreamStartedAt(startTs);
    }
    const updateElapsed = () => {
      setLiveElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTs) / 1000)));
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [isCameraStreaming, liveStreamStartedAt]);

  const formatLiveDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  const startCameraStreamDirect = async (
    facing: 'environment' | 'user',
    explicitSellerId?: string
  ) => {
    if (agoraAudienceCtrlRef.current) {
      await agoraAudienceCtrlRef.current.leave();
      agoraAudienceCtrlRef.current = null;
    }
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }

    const hostSellerId =
      explicitSellerId ||
      state.activeLiveSellerId ||
      state.user.ownSellerId ||
      'seller_' + (state.user.id || 'host');

    const nowTs = Date.now();
    setLiveStreamStartedAt((prev) => prev || nowTs);
    setLiveElapsedSeconds(0);

    const agoraRes = await startAgoraHostBroadcast(
      hostSellerId,
      facing,
      videoRef.current
    );
    if (agoraRes.success && agoraRes.mediaStream) {
      liveStreamRef.current = agoraRes.mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = agoraRes.mediaStream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraStreaming(true);
      setState((prev) => ({
        ...prev,
        activeTab: 'mine',
        activeLiveSellerId: hostSellerId,
        sellers: prev.sellers.map((s) =>
          s.id === hostSellerId
            ? { ...s, isLive: true, liveUpdatedAt: Date.now() }
            : s
        ),
      }));
      showToast(
        `LIVE on Agora Channel (${getAgoraChannelName(hostSellerId)}) — HD Video + Voice Active!`
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      liveStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraStreaming(true);
      setState((prev) => ({
        ...prev,
        activeTab: 'mine',
        activeLiveSellerId: hostSellerId,
        sellers: prev.sellers.map((s) =>
          s.id === hostSellerId
            ? { ...s, isLive: true, liveUpdatedAt: Date.now() }
            : s
        ),
      }));
      showToast('You are now LIVE on Mine Na!');
    } catch {
      setIsCameraStreaming(true);
      showToast('Live stream active! (Timer running with cover preview).');
    }
  };

  const endSellerLiveStream = async () => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }
    await stopAgoraHostBroadcast();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    const finalDuration = formatLiveDuration(liveElapsedSeconds);
    setIsCameraStreaming(false);
    setLiveStreamStartedAt(null);
    setLiveElapsedSeconds(0);
    setRemoteLiveStream(null);

    const hostSellerId =
      state.user.ownSellerId ||
      state.activeLiveSellerId ||
      'seller_' + state.user.id;
    const hostDisplayName =
      state.user.shopName || state.user.name || 'Ukay Host';

    if (hostSellerId) {
      try {
        localStorage.removeItem(`ukayo_live_frame_${hostSellerId}`);
        localStorage.removeItem('ukayo_live_frame_latest');
      } catch {
        // ignore
      }
      publishLiveCameraFrame({
        sellerId: hostSellerId,
        sellerName: hostDisplayName,
        isCameraLive: false,
        frameDataUrl: '',
        pinnedItemId: state.activePinnedItemId || '',
        liveTitle: liveSetupTitle || '',
        updatedAt: Date.now(),
      });
    }

    const endedAtTs = Date.now();
    setState((prev) => {
      const updatedSellers = prev.sellers.map((s) =>
        s.id === hostSellerId
          ? { ...s, isLive: false, liveUpdatedAt: endedAtTs }
          : s
      );
      const nextLiveSeller = updatedSellers.find((s) => s.isLive);
      return {
        ...prev,
        activeLiveSellerId: nextLiveSeller ? nextLiveSeller.id : '',
        sellers: updatedSellers,
        liveChat: [
          ...prev.liveChat,
          {
            id: 'lc_' + endedAtTs,
            sellerId: hostSellerId,
            sender: hostDisplayName,
            badge: 'HOST',
            text: `Live stream ended (Duration: ${finalDuration}). Thank you for mining!`,
            isHost: true,
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ],
      };
    });

    showToast(`Live stream ended • Total duration: ${finalDuration}`);
  };

  const confirmStartLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIsRegisteredSeller()) {
      setLiveSetupOpen(false);
      showToast(
        'Only registered UKAYO Sellers can host a Live Stream. Apply as a Seller first!',
        'error'
      );
      handleBecomeSellerAction();
      return;
    }
    const sellerId = state.user.ownSellerId || 'seller_' + (state.user.id || Date.now());
    const existingSeller = state.sellers.find((s) => s.id === sellerId);
    const hostDisplayName =
      state.user.shopName || state.user.name || 'Ukay Live Host';
    const title = liveSetupTitle.trim() || `${hostDisplayName} Live Drop!`;
    const category = liveSetupCategory;
    const cameraFacing = liveSetupCamera;
    const pinnedId = liveSetupPinnedId;
    const ruleText = liveSetupRule.trim();
    const defaultCover =
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80';
    const startedTs = Date.now();

    setLiveFacingMode(cameraFacing);
    setLiveStreamStartedAt(startedTs);
    setLiveElapsedSeconds(0);

    setState((prev) => {
      const updatedSellers = existingSeller
        ? prev.sellers.map((s) =>
            s.id === sellerId
              ? {
                  ...s,
                  isLive: true,
                  liveUpdatedAt: startedTs,
                  liveTitle: title,
                  liveCategory: category,
                  pinnedItemId: pinnedId || s.pinnedItemId || prev.activePinnedItemId,
                  liveStreamPreview: pendingLiveCoverData || s.liveStreamPreview || defaultCover,
                }
              : s
          )
        : [
            {
              id: sellerId,
              name: hostDisplayName,
              handle:
                '@' +
                hostDisplayName.toLowerCase().replace(/[^a-z0-9]/g, ''),
              city: prev.user.city || 'Metro Manila',
              bio: prev.user.isSeller
                ? 'Verified UKAYO Live Seller'
                : 'UKAYO Community Live Host',
              avatar: prev.user.avatar,
              followers: 1,
              followed: false,
              followedBy: [],
              pinnedItemId: pinnedId || prev.activePinnedItemId,
              rating: 5.0,
              isLive: true,
              liveUpdatedAt: startedTs,
              liveCategory: category,
              liveTitle: title,
              liveStreamPreview: pendingLiveCoverData || defaultCover,
              gcash: prev.user.gcash || prev.user.phone,
              products: [],
            },
            ...prev.sellers,
          ];

      return {
        ...prev,
        activeTab: 'mine',
        user: {
          ...prev.user,
          ownSellerId: prev.user.ownSellerId || sellerId,
        },
        activeLiveSellerId: sellerId,
        activePinnedItemId: pinnedId || prev.activePinnedItemId,
        sellers: updatedSellers,
        liveChat: [
          ...prev.liveChat,
          {
            id: 'lc_' + startedTs,
            sellerId,
            sender: hostDisplayName,
            badge: 'HOST',
            text: `LIVE STARTED: "${title}" (${category}) — ${ruleText}`,
            isHost: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
    });

    setLiveSetupOpen(false);
    await startCameraStreamDirect(cameraFacing, sellerId);
  };

  const toggleCameraLive = async () => {
    if (isCameraStreaming || liveStreamRef.current) {
      await endSellerLiveStream();
      return;
    }
    openLiveSetupModal();
  };

  const flipLiveCamera = async () => {
    const nextFacing = liveFacingMode === 'environment' ? 'user' : 'environment';
    setLiveFacingMode(nextFacing);
    if (liveStreamRef.current) {
      await startCameraStreamDirect(nextFacing);
    } else {
      showToast(`Camera ready (${nextFacing === 'user' ? 'Front' : 'Rear'})`);
    }
  };

  const openSellerDropModal = () => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register first to pin a Live item!', 'error');
      openAuthModal('login');
      return;
    }
    if (!checkIsRegisteredSeller()) {
      showToast(
        'Only registered UKAYO Sellers can pin Live items. Register as a Seller first!',
        'error'
      );
      handleBecomeSellerAction();
      return;
    }
    const nextCode = 'A0' + (state.liveItems.length + 1);
    setDropCode(nextCode);
    setDropTitle('');
    setDropPrice('250');
    setDropSize('Large (23"x27")');
    setDropCondition('10/10 Like New');
    setDropImage('');
    setLiveDropModalOpen(true);
  };

  const handleDropImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 600, 0.8);
    if (dataUrl) setDropImage(dataUrl);
  };

  const submitLiveDropItem = (e: React.FormEvent) => {
    e.preventDefault();
    const myHostId = state.user.ownSellerId || 'seller_' + (state.user.id || Date.now());
    const sellerId =
      state.activeLiveSellerId ||
      myHostId ||
      state.sellers[0]?.id;
    const defaultImg =
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80';
    const prodId = 'prod_' + Date.now();
    const newItem: LiveItem = {
      id: 'live_' + prodId,
      sellerId,
      code: dropCode.trim() || 'A01',
      title: dropTitle.trim() || 'Ukay Live Flash Drop',
      price: Number(dropPrice) || 250,
      size: dropSize.trim() || 'Free Size',
      condition: dropCondition.trim() || '10/10 Like New',
      image: dropImage || defaultImg,
      pinned: true,
      winner: null,
      steals: [],
    };

    const newProduct: Product = {
      id: prodId,
      code: newItem.code,
      title: newItem.title,
      price: newItem.price,
      category: 'Jackets',
      size: newItem.size,
      condition: newItem.condition,
      status: 'Available',
      pinned: true,
      rating: 5.0,
      image: newItem.image,
      description: `${newItem.condition} • ${newItem.size}`,
      reviews: [],
    };

    setState((prev) => {
      const hasSeller = prev.sellers.some((s) => s.id === sellerId);
      const hostName = prev.user.shopName || prev.user.name || 'Ukay Live Host';
      const updatedSellers = hasSeller
        ? prev.sellers.map((s) =>
            s.id === sellerId
              ? {
                  ...s,
                  isLive: Boolean(s.isLive || isCameraStreaming),
                  liveUpdatedAt: isCameraStreaming
                    ? Date.now()
                    : s.liveUpdatedAt || 0,
                  pinnedItemId: newItem.id,
                  liveStreamPreview: newItem.image || s.liveStreamPreview,
                  products: [
                    newProduct,
                    ...s.products.map((p) => ({ ...p, pinned: false })),
                  ],
                }
              : s
          )
        : [
            {
              id: sellerId,
              name: hostName,
              handle: '@' + hostName.toLowerCase().replace(/[^a-z0-9]/g, ''),
              city: prev.user.city || 'Metro Manila',
              bio: 'UKAYO Live Host',
              avatar: prev.user.avatar,
              followers: 1,
              followed: false,
              followedBy: [],
              pinnedItemId: newItem.id,
              rating: 5.0,
              isLive: Boolean(isCameraStreaming),
              liveUpdatedAt: isCameraStreaming ? Date.now() : 0,
              liveCategory: 'Jackets & Hoodies',
              liveTitle: `${hostName} Live Drop!`,
              liveStreamPreview: newItem.image,
              gcash: prev.user.gcash || prev.user.phone,
              products: [newProduct],
            },
            ...prev.sellers,
          ];

      return {
        ...prev,
        activeLiveSellerId: sellerId,
        liveItems: [
          newItem,
          ...prev.liveItems.map((i) =>
            i.sellerId === sellerId ? { ...i, pinned: false } : i
          ),
        ],
        activePinnedItemId: newItem.id,
        sellers: updatedSellers,
        liveChat: [
          ...prev.liveChat,
          {
            id: 'lc_' + Date.now(),
            sellerId,
            sender: hostName,
            badge: 'HOST',
            text: `📌 PINNED [${newItem.code}] ${newItem.title} — ₱${newItem.price}! Tap MINE NA!`,
            isHost: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
    });
    publishLiveCameraFrame({
      sellerId,
      sellerName: state.user.shopName || state.user.name || 'Ukay Live Host',
      isCameraLive: isCameraStreaming,
      frameDataUrl: remoteLiveStream?.frameDataUrl || newItem.image || '',
      pinnedItemId: newItem.id,
      pinnedItem: newItem,
      liveTitle: liveSetupTitle || '',
      updatedAt: Date.now(),
    });
    setLiveDropModalOpen(false);
    showToast(`Pinned [${newItem.code}] ${newItem.title} (₱${newItem.price}) to Live!`);
  };

  const toggleFollowStore = (sellerId: string) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    if (!seller) return;
    const followerKey = state.user.id || state.user.email || 'guest_device';
    const existingFollowedBy = Array.isArray(seller.followedBy)
      ? seller.followedBy
      : [];
    const currentlyFollowing =
      existingFollowedBy.includes(followerKey) || Boolean(seller.followed);
    const nextFollowed = !currentlyFollowing;
    const nextFollowedBy = nextFollowed
      ? Array.from(new Set([...existingFollowedBy, followerKey]))
      : existingFollowedBy.filter((k) => k !== followerKey);

    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              followed: nextFollowed,
              followedBy: nextFollowedBy,
              followers: Math.max(
                nextFollowedBy.length,
                Math.max(0, (s.followers || 0) + (nextFollowed ? 1 : -1))
              ),
            }
          : s
      ),
    }));
    showToast(nextFollowed ? `Following ${seller.name}` : `Unfollowed ${seller.name}`);
  };

  const toggleSellerReviewTag = (tag: string) => {
    setSellerReviewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submitSellerReview = (e: React.FormEvent, sellerId: string) => {
    e.preventDefault();
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      openAuthModal('login');
      return;
    }
    const targetSeller = state.sellers.find((s) => s.id === sellerId);
    if (!targetSeller) return;

    const cleanComment = sellerReviewComment.trim();
    if (!cleanComment && sellerReviewTags.length === 0) return;

    const starValue = Math.min(5, Math.max(1, Number(sellerReviewRating) || 5));
    const nowLabel = new Date().toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newReview: SellerReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      buyerId: state.user.id || state.user.email || 'buyer',
      buyerName: state.user.name || 'Verified Miner',
      buyerAvatar: state.user.avatar || '',
      rating: starValue,
      comment:
        cleanComment ||
        `Rated ${starValue} stars (${sellerReviewTags.join(', ')})`,
      tags: sellerReviewTags.length > 0 ? [...sellerReviewTags] : undefined,
      createdAt: nowLabel,
    };

    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) => {
        if (s.id !== sellerId) return s;
        const existingReviews = Array.isArray(s.reviews) ? s.reviews : [];
        const nextReviews = [newReview, ...existingReviews];
        const avgRating = Number(
          (
            nextReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) /
            nextReviews.length
          ).toFixed(1)
        );
        return {
          ...s,
          reviews: nextReviews,
          rating: avgRating,
        };
      }),
    }));

    setSellerReviewComment('');
    setSellerReviewTags([]);
    setSellerReviewRating(5);
  };

  const claimStoreProduct = (sellerId: string, prodId: string) => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register as a Buyer to Mine items!', 'error');
      openAuthModal('login');
      return;
    }
    const seller = state.sellers.find((s) => s.id === sellerId);
    const prod = seller?.products.find((p) => p.id === prodId);
    if (!seller || !prod) return;
    if (isOwnSellerProduct(seller.id, seller.name)) {
      showToast(
        'As the Seller, you cannot Mine or Lock your own store product. Only Buyers can tap MINE NA!',
        'error'
      );
      return;
    }

    const newOrder: MinedOrder = {
      id: 'ord_' + Date.now(),
      itemCode: prod.code || 'SHOP',
      title: prod.title,
      price: prod.price,
      quantity: 1,
      image: prod.image,
      sellerId: seller.id,
      sellerName: seller.name,
      buyerId: state.user.id,
      buyerName: state.user.name,
      buyerAddress: state.user.address || state.user.city,
      buyerPhone: state.user.phone || state.user.gcash,
      courier: 'J&T Express',
      paymentMethod: 'COD',
      stage: 'TO_PAY',
      status: 'In My Bayong — Ready for Checkout',
      timestamp: 'Just now',
      trackingEvents: [
        {
          time: 'Just now',
          title: 'Added to My Bayong',
          desc: `Claimed from ${seller.name}`,
          done: true,
          current: true,
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              products: s.products.map((p) =>
                p.id === prodId ? { ...p, status: 'Mined' } : p
              ),
            }
          : s
      ),
      minedOrders: [newOrder, ...prev.minedOrders],
    }));

    showToast(`Added "${prod.title}" to My Bayong!`);
  };

  const updateBayongQuantity = (orderId: string, delta: number) => {
    const target = state.minedOrders.find((o) => o.id === orderId);
    if (!target) return;
    const nextQty = (target.quantity || 1) + delta;
    if (nextQty <= 0) {
      removeBayongItem(orderId);
      return;
    }
    setState((prev) => ({
      ...prev,
      minedOrders: prev.minedOrders.map((o) =>
        o.id === orderId ? { ...o, quantity: nextQty } : o
      ),
    }));
  };

  const removeBayongItem = (orderId: string) => {
    setState((prev) => ({
      ...prev,
      minedOrders: prev.minedOrders.filter((o) => o.id !== orderId),
    }));
    showToast('Item removed from My Bayong.');
  };

  const openCheckoutModal = () => {
    const bayongItems = state.minedOrders.filter((o) => o.stage === 'TO_PAY');
    if (!bayongItems.length) {
      showToast('Your Bayong is empty!', 'error');
      return;
    }
    setCheckoutAddress(state.user.address || state.user.city || '');
    setEwalletSenderRef(state.user.phone || state.user.gcash || '');
    setCheckoutOpen(true);
  };

  const submitBayongCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const address = checkoutAddress.trim() || state.user.city;
    const courier = checkoutCourier;
    const payMethod = checkoutPayMethod;
    const senderRef = ewalletSenderRef.trim();
    const label =
      payMethod === 'BAYAD_AGAD'
        ? `Bayad Agad (${selectedEWallet}${senderRef ? ' • ' + senderRef : ''})`
        : 'COD (Cash on Delivery)';

    setState((prev) => ({
      ...prev,
      activeTab: 'account',
      activePurchaseFilter: 'TO_SHIP',
      minedOrders: prev.minedOrders.map((o) =>
        o.stage === 'TO_PAY'
          ? {
              ...o,
              stage: 'TO_SHIP',
              courier,
              buyerAddress: address,
              buyerPhone: senderRef || prev.user.phone,
              paymentMethod: label,
              status:
                payMethod === 'BAYAD_AGAD'
                  ? `Paid (${selectedEWallet}) — To Ship`
                  : 'To Ship — COD',
              trackingEvents: [
                {
                  time: 'Just now',
                  title:
                    payMethod === 'BAYAD_AGAD'
                      ? `Paid via ${selectedEWallet}`
                      : 'Checked Out (COD)',
                  desc: `Scheduled for ${courier} pickup`,
                  done: true,
                  current: true,
                },
                ...(o.trackingEvents || []),
              ],
            }
          : o
      ),
    }));

    setCheckoutOpen(false);
    showToast(
      payMethod === 'BAYAD_AGAD'
        ? `Paid via ${selectedEWallet}! Order moved to To Ship.`
        : 'COD Order placed! Moved to To Ship.'
    );
  };

  // =======================================================================
  // VERTICAL LEFT-SIDEBAR CHAT (SELLERS + ADMIN CUSTOMER SERVICE)
  // =======================================================================
  const openDirectChatWithSeller = (sellerId: string) => {
    setState((prev) => ({
      ...prev,
      activeChatSellerId: sellerId,
      activeTab: 'chat',
    }));
  };

  const sendDirectChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.isAuthenticated) {
      showToast('Please log in or register to send messages.', 'error');
      openAuthModal('login');
      return;
    }
    const text = directChatInput.trim();
    if (!text) return;
    const sid = state.activeChatSellerId || 'admin_support';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sid === 'admin_support') {
      const userKey = state.user.id || state.user.email || 'guest';
      const threadId = 'sup_' + userKey;
      const roleLabel: 'BUYER' | 'SELLER' =
        state.user.isSeller && state.role === 'seller' ? 'SELLER' : 'BUYER';
      const senderDisplay =
        roleLabel === 'SELLER' && state.user.shopName
          ? `${state.user.shopName} (${state.user.name})`
          : state.user.name;

      const msgObj: DirectMessage = {
        id: 'dm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        from: roleLabel === 'SELLER' ? 'seller' : 'buyer',
        senderName: senderDisplay,
        text,
        time: nowTime,
      };

      setState((prev) => {
        const existingThread = prev.supportThreads.find(
          (t) =>
            t.id === threadId ||
            t.id === 'support_' + userKey ||
            (prev.user.id && t.userId === prev.user.id)
        );
        const updatedThreads = existingThread
          ? prev.supportThreads.map((t) =>
              t.id === existingThread.id
                ? {
                    ...t,
                    userName: senderDisplay,
                    userRole: roleLabel,
                    userAvatar: prev.user.avatar,
                    unreadAdmin: (t.unreadAdmin || 0) + 1,
                    messages: [...t.messages, msgObj],
                  }
                : t
            )
          : [
              {
                id: threadId,
                userId: prev.user.id || userKey,
                userName: senderDisplay,
                userRole: roleLabel,
                userAvatar: prev.user.avatar,
                subject: `${roleLabel} Support Help`,
                unreadAdmin: 1,
                unreadUser: 0,
                messages: [msgObj],
              },
              ...prev.supportThreads,
            ];

        return {
          ...prev,
          supportThreads: updatedThreads,
        };
      });

      setDirectChatInput('');
      return;
    }

    setState((prev) => ({
      ...prev,
      directChats: {
        ...prev.directChats,
        [sid]: [
          ...(prev.directChats[sid] || []),
          {
            id: 'dm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            from: 'buyer',
            senderName: prev.user.name,
            text,
            time: nowTime,
          },
        ],
      },
    }));
    setDirectChatInput('');
  };

  // =======================================================================
  // PRIMARY ID VERIFICATION
  // =======================================================================
  const openIdVerifyModal = () => {
    if (!state.isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (state.user.idType) setVerifyIdType(state.user.idType);
    setVerifyFullName(state.user.name);
    if (state.user.idNumber) setVerifyIdNumber(state.user.idNumber);
    setVerifyIdPreview(state.user.idImageData || '');
    setVerifySelfiePreview(state.user.selfieImageData || '');
    setIdVerifyOpen(true);
  };

  const handleVerifyFilePreview = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'id' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 600, 0.8);
    if (!dataUrl) return;
    if (kind === 'id') {
      setVerifyIdPreview(dataUrl);
      setVerifyIdFileLabel(`Selected: ${file.name}`);
    } else {
      setVerifySelfiePreview(dataUrl);
      setVerifySelfieFileLabel(`Selected: ${file.name}`);
    }
  };

  const submitIdVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = verifyFullName.trim() || state.user.name;
    const nextIdNum = verifyIdNumber.trim();

    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        idType: verifyIdType,
        name: nextName,
        idNumber: nextIdNum,
        idImageData: verifyIdPreview || prev.user.idImageData,
        selfieImageData: verifySelfiePreview || prev.user.selfieImageData,
        verificationStatus: 'pending',
      },
      registeredUsers: prev.registeredUsers.map((u) =>
        u.id === prev.user.id
          ? {
              ...u,
              name: nextName,
              idType: verifyIdType,
              idNumber: nextIdNum,
              idImageData: verifyIdPreview || u.idImageData,
              selfieImageData: verifySelfiePreview || u.selfieImageData,
              verificationStatus: 'pending',
            }
          : u
      ),
    }));
    setIdVerifyOpen(false);
    showToast('Philippine Primary ID submitted to Admin Ops for verification!');
  };

  const openPerksModal = (_kind: 'referral' | 'discounts' | 'vouchers') => {
    // Silent action without floating on-screen prompt
  };

  const openAppReleaseModal = () => {
    // Silent action without floating on-screen prompt
  };

  const toggleLiveAudienceAudio = () => {
    const nextMuted = !isLiveAudioMuted;
    setIsLiveAudioMuted(nextMuted);
    if (agoraAudienceCtrlRef.current) {
      agoraAudienceCtrlRef.current.setAudioMuted(nextMuted);
    }
    showToast(nextMuted ? 'Live stream audio muted.' : 'Live stream audio unmuted!');
  };

  // Derived values
  const bayongItems = state.minedOrders.filter((o) => o.stage === 'TO_PAY');
  const bayongGrandTotal = bayongItems.reduce(
    (sum, o) => sum + o.price * (o.quantity || 1),
    0
  );
  const bayongTotalQty = bayongItems.reduce((sum, o) => sum + (o.quantity || 1), 0);

  const isUserSignedIn = Boolean(
    state.isAuthenticated || state.user.email || state.user.id
  );
  const actualVerificationStatus = state.isAuthenticated && firestoreLiveStatus.foundInFirestore
    ? firestoreLiveStatus.verificationStatus
    : state.user.verificationStatus;
  const actualSellerStatus = state.isAuthenticated && firestoreLiveStatus.foundInFirestore
    ? firestoreLiveStatus.sellerStatus
    : state.user.sellerStatus || (state.user.isSeller ? 'pending' : 'none');

  const isSellerAccount = Boolean(
    isUserSignedIn &&
      (state.user.isSeller ||
        firestoreLiveStatus.isSeller ||
        actualSellerStatus === 'approved' ||
        actualSellerStatus === 'pending')
  );
  const isSellerMode = isSellerAccount && state.role === 'seller';

  const liveSellers = state.sellers.filter((s) => s.isLive);
  const activeLiveSeller: Seller | undefined =
    liveSellers.find((s) => s.id === state.activeLiveSellerId) ||
    liveSellers[0];

  // Re-attach active seller MediaStream to videoRef whenever the Live tab mounts
  useEffect(() => {
    if (isCameraStreaming && liveStreamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== liveStreamRef.current) {
        videoRef.current.srcObject = liveStreamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraStreaming, state.activeTab]);

  // Subscribe to Agora Interactive Live Streaming channel as Audience when watching a seller's live room
  useEffect(() => {
    const hasActiveRemoteRoom = Boolean(
      activeLiveSeller?.isLive || remoteLiveStream?.isCameraLive
    );
    if (state.activeTab !== 'mine' || isCameraStreaming || !hasActiveRemoteRoom) {
      if (agoraAudienceCtrlRef.current) {
        agoraAudienceCtrlRef.current.leave();
        agoraAudienceCtrlRef.current = null;
      }
      setIsAgoraRemoteVideoPlaying(false);
      setIsAgoraRemoteAudioPlaying(false);
      return;
    }

    const targetSellerId =
      activeLiveSeller?.id || remoteLiveStream?.sellerId || 'ukayo_live_room';
    const ctrl = joinAgoraAudienceChannel(
      targetSellerId,
      agoraRemoteVideoRef.current,
      {
        onRemoteVideoStateChange: (playing) => {
          setIsAgoraRemoteVideoPlaying(playing);
        },
        onRemoteAudioStateChange: (playing) => {
          setIsAgoraRemoteAudioPlaying(playing);
        },
      }
    );
    ctrl.setAudioMuted(isLiveAudioMuted);
    agoraAudienceCtrlRef.current = ctrl;

    return () => {
      ctrl.leave();
      if (agoraAudienceCtrlRef.current === ctrl) {
        agoraAudienceCtrlRef.current = null;
      }
    };
  }, [
    state.activeTab,
    isCameraStreaming,
    activeLiveSeller?.id,
    activeLiveSeller?.isLive,
    remoteLiveStream?.isCameraLive,
  ]);

  // Subscribe to real-time remote camera frames for the active live seller
  useEffect(() => {
    const sellerId = activeLiveSeller?.id || 'any';
    const unsub = subscribeToLiveCameraStream(sellerId, (streamData) => {
      if (!streamData || !streamData.isCameraLive) {
        setRemoteLiveStream(null);
      } else {
        setRemoteLiveStream(streamData);
      }
    });
    return () => unsub();
  }, [activeLiveSeller?.id]);

  const sellerPinnedProduct = activeLiveSeller?.products?.find((p) => p.pinned);
  const remoteStreamPinnedItem =
    remoteLiveStream?.pinnedItem &&
    typeof remoteLiveStream.pinnedItem === 'object' &&
    remoteLiveStream.pinnedItem.title
      ? (remoteLiveStream.pinnedItem as LiveItem)
      : undefined;

  const activePinnedItem: LiveItem | undefined =
    (remoteLiveStream?.pinnedItemId
      ? state.liveItems.find((i) => i.id === remoteLiveStream.pinnedItemId)
      : undefined) ||
    remoteStreamPinnedItem ||
    (activeLiveSeller?.pinnedItemId
      ? state.liveItems.find((i) => i.id === activeLiveSeller.pinnedItemId)
      : undefined) ||
    (activeLiveSeller
      ? state.liveItems.find(
          (i) => i.sellerId === activeLiveSeller.id && i.pinned
        )
      : undefined) ||
    (activeLiveSeller
      ? state.liveItems.find((i) => i.id === state.activePinnedItemId)
      : undefined) ||
    (sellerPinnedProduct && activeLiveSeller
      ? {
          id: 'live_' + sellerPinnedProduct.id,
          sellerId: activeLiveSeller.id,
          code: sellerPinnedProduct.code || 'LIVE',
          title: sellerPinnedProduct.title,
          price: sellerPinnedProduct.price,
          size: sellerPinnedProduct.size || 'Free Size',
          condition: sellerPinnedProduct.condition || '9.5/10 Preloved',
          image: sellerPinnedProduct.image,
          pinned: true,
          winner:
            sellerPinnedProduct.status &&
            sellerPinnedProduct.status.startsWith('Mined by ')
              ? sellerPinnedProduct.status.replace('Mined by ', '')
              : null,
          steals: [],
        }
      : undefined) ||
    (activeLiveSeller
      ? state.liveItems.find((i) => i.sellerId === activeLiveSeller.id)
      : undefined);

  // Broadcast live camera frames every 600ms while hosting camera live in Marketplace
  useEffect(() => {
    if (!isCameraStreaming) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    const offscreenVideo = document.createElement('video');
    offscreenVideo.muted = true;
    offscreenVideo.playsInline = true;
    offscreenVideo.autoplay = true;
    if (liveStreamRef.current) {
      offscreenVideo.srcObject = liveStreamRef.current;
      offscreenVideo.play().catch(() => {});
    }

    let capturedPreviewOnce = false;

    const captureAndPublishFrame = () => {
      if (
        liveStreamRef.current &&
        offscreenVideo.srcObject !== liveStreamRef.current
      ) {
        offscreenVideo.srcObject = liveStreamRef.current;
        offscreenVideo.play().catch(() => {});
      }
      const activeVid =
        videoRef.current && videoRef.current.readyState >= 2
          ? videoRef.current
          : offscreenVideo.readyState >= 2
          ? offscreenVideo
          : null;
      if (!activeVid || !ctx) return;

      const hostSellerId =
        stateRef.current.user.ownSellerId ||
        stateRef.current.activeLiveSellerId ||
        'seller_' + (stateRef.current.user.id || 'host');
      ctx.drawImage(activeVid, 0, 0, canvas.width, canvas.height);
      const frameDataUrl = canvas.toDataURL('image/jpeg', 0.56);
      if (!frameDataUrl || frameDataUrl.length < 100) return;

      const currentPinned =
        stateRef.current.liveItems.find(
          (i) => i.id === stateRef.current.activePinnedItemId
        ) ||
        stateRef.current.liveItems.find(
          (i) => i.sellerId === hostSellerId && i.pinned
        ) ||
        stateRef.current.liveItems[0] ||
        null;

      publishLiveCameraFrame({
        sellerId: hostSellerId,
        sellerName:
          stateRef.current.user.shopName ||
          stateRef.current.user.name ||
          'Ukay Live Host',
        isCameraLive: true,
        frameDataUrl,
        pinnedItemId:
          currentPinned?.id || stateRef.current.activePinnedItemId || '',
        pinnedItem: currentPinned,
        liveTitle: liveSetupTitle || '',
        updatedAt: Date.now(),
      });

      if (!capturedPreviewOnce) {
        capturedPreviewOnce = true;
        setState((prev) => ({
          ...prev,
          sellers: prev.sellers.map((s) =>
            s.id === hostSellerId
              ? {
                  ...s,
                  isLive: true,
                  liveUpdatedAt: Date.now(),
                  liveStreamPreview: frameDataUrl,
                }
              : s
          ),
        }));
      }
    };

    offscreenVideo.onloadeddata = () => {
      captureAndPublishFrame();
    };
    const interval = window.setInterval(captureAndPublishFrame, 600);

    return () => {
      window.clearInterval(interval);
      offscreenVideo.srcObject = null;
    };
  }, [isCameraStreaming, liveSetupTitle]);

  const currentFollowerKey =
    state.user.id || state.user.email || 'guest_device';
  const isFollowingActiveLiveSeller = Boolean(
    activeLiveSeller &&
      ((Array.isArray(activeLiveSeller.followedBy) &&
        activeLiveSeller.followedBy.includes(currentFollowerKey)) ||
        activeLiveSeller.followed)
  );

  const activeStoreSeller: Seller | undefined = state.activeStoreId
    ? state.sellers.find((s) => s.id === state.activeStoreId)
    : undefined;

  const blockedSet = new Set(
    (state.blockedUserIds || []).map((x) => String(x).toLowerCase())
  );
  const hiddenPostSet = new Set(state.hiddenPostIds || []);

  const filteredFeedPosts = state.feedPosts.filter((p) => {
    if (hiddenPostSet.has(p.id)) return false;
    if (
      (p.sellerId && blockedSet.has(p.sellerId.toLowerCase())) ||
      (p.authorName && blockedSet.has(p.authorName.toLowerCase()))
    ) {
      return false;
    }
    const catOk =
      state.activeFeedCategory === 'ALL' || p.category === state.activeFeedCategory;
    const searchOk =
      !state.searchQuery ||
      p.caption.toLowerCase().includes(state.searchQuery) ||
      p.itemTitle.toLowerCase().includes(state.searchQuery) ||
      p.authorName.toLowerCase().includes(state.searchQuery);
    return catOk && searchOk;
  });

  const visibleAccountOrders =
    state.activePurchaseFilter === 'ALL'
      ? state.minedOrders
      : state.minedOrders.filter((o) => o.stage === state.activePurchaseFilter);

  const userNameParts = (state.user.name || 'Guest Miner').trim().split(' ');
  const userInitials = !state.isAuthenticated
    ? 'GU'
    : ((userNameParts[0]?.[0] || 'U') + (userNameParts[1]?.[0] || 'K')).toUpperCase();

  // Build vertical chat thread list (Customer Service + All Sellers)
  const myUserKey = state.user.id || state.user.email || 'guest';
  const mySupportThread = state.supportThreads.find(
    (t) =>
      t.id === 'sup_' + myUserKey ||
      t.id === 'support_' + myUserKey ||
      (state.user.id && t.userId === state.user.id) ||
      (state.user.ownSellerId && t.id === 'support_' + state.user.ownSellerId)
  );
  const supportMessages: DirectMessage[] = mySupportThread
    ? mySupportThread.messages
    : [];

  const chatContacts = [
    {
      id: 'admin_support',
      name: 'UKAYO Customer Service',
      badge: 'ADMIN HELP',
      city: '24/7 Buyer & Seller Help Desk',
      isSupport: true,
      messages: supportMessages,
    },
    ...state.sellers.map((s) => ({
      id: s.id,
      name: s.name,
      badge: s.isLive ? 'LIVE SELLER' : 'SELLER',
      city: s.city,
      isSupport: false,
      messages: state.directChats[s.id] || [],
    })),
  ];

  const activeChatContact =
    chatContacts.find((c) => c.id === state.activeChatSellerId) || chatContacts[0];

  return (
    <div className="bg-[#F4FAF8] text-[#1E293B] antialiased selection:bg-[#2DD4BF]/20 min-h-[100dvh]">
      {toasts.length > 0 && null}

      {/* Mobile App Shell */}
      <div
        id="ukayo-app-shell"
        className="max-w-md mx-auto min-h-[100dvh] bg-[#F4FAF8] flex flex-col relative shadow-sm"
      >
        {/* TOP HEADER BAR — CLEAN & ORGANIZED TWO-COLOR PALETTE (#0F766E & #2DD4BF) */}
        {state.activeTab !== 'mine' && (
          <header
            id="main-app-header"
            className="sticky top-0 z-30 bg-[#0D9488] text-white px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              {/* Crisp High-Contrast UKAYO Hanger Wordmark */}
              <button
                onClick={() => switchTab('home')}
                className="flex items-center shrink-0 cursor-pointer"
                title="UKAYO Home"
              >
                <svg
                  className="w-[66px] h-8 text-white"
                  viewBox="0 0 800 450"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="UKAYO"
                >
                  <g strokeWidth="20">
                    <path d="M 378 82 C 378 52, 422 52, 422 82 C 422 102, 400 110, 400 128 L 400 142" />
                    <path d="M 400 142 L 155 178 C 132 182, 118 196, 112 218 L 78 345 C 72 368, 86 385, 110 385 L 690 385 C 714 385, 728 368, 722 345 L 688 218 C 682 196, 668 182, 645 178 Z" />
                  </g>
                  <g strokeWidth="24" strokeLinecap="butt" strokeLinejoin="miter">
                    <path d="M 155 202 L 155 282 C 155 322, 225 322, 225 282 L 225 202" />
                    <path d="M 262 202 L 262 315" />
                    <path d="M 332 202 L 264 268" />
                    <path d="M 294 240 L 336 315" />
                    <path d="M 358 315 L 402 204 L 446 315" />
                    <path d="M 374 282 L 430 282" />
                    <path d="M 465 202 L 504 262" />
                    <path d="M 542 202 L 504 262 L 504 334 C 504 358, 468 358, 468 334 C 468 312, 492 302, 520 294 C 546 286, 560 272, 568 256" />
                    <circle cx="614" cy="258" r="54" />
                  </g>
                </svg>
              </button>

              {/* Clean Light Search Bar with Left Search & Right Camera Icon (Matching Reference Image 6) */}
              <div className="flex-1 flex items-center bg-white rounded-xl px-3 py-2 text-[#132A2E] min-w-0 shadow-2xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  id="global-search-input"
                  value={state.searchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  placeholder="Search ukay items, live bales..."
                  className="w-full text-xs font-medium text-[#132A2E] placeholder-slate-400 bg-transparent focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() => switchTab('feed')}
                  className="text-slate-400 hover:text-[#0D9488] shrink-0 ml-1.5 cursor-pointer"
                  title="Browse Visual Ukay Feed"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Right Icon Pair: Cart / Bayong + Chat with Pill Counters (Matching Reference Images) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => switchTab('bag')}
                  className="relative p-1.5 text-white hover:text-[#2DD4BF] shrink-0 cursor-pointer transition"
                  title="My Bayong"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span
                    id="header-bag-badge"
                    className="absolute -top-0.5 -right-1 min-w-[17px] h-4 px-1 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[9px] font-extrabold flex items-center justify-center border border-[#0D9488]"
                  >
                    {bayongTotalQty}
                  </span>
                </button>

                <button
                  onClick={() => switchTab('chat')}
                  className="relative p-1.5 text-white hover:text-[#2DD4BF] shrink-0 cursor-pointer transition"
                  title="Messages & Customer Service"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-1 min-w-[17px] h-4 px-1 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[9px] font-extrabold flex items-center justify-center border border-[#0D9488]">
                    {chatContacts.length}
                  </span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 pb-20">
          {/* TAB 1: "HOME" (LIGHT, AIRY, ORGANIZED LAYOUT MATCHING REFERENCE IMAGE 6) */}
          {state.activeTab === 'home' && (
            <section id="tab-home" className="space-y-2.5 pb-4">
              {/* Top Navy Accent Extension + Light Wallet / Check-In Strip */}
              <div className="bg-[#0D9488] px-3.5 pt-0.5 pb-3 rounded-b-2xl space-y-2.5">
                {!state.isAuthenticated && (
                  <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        Welcome to UKAYO Marketplace
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        Sign in to Mine live items or register your shop
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openAuthModal('register')}
                        className="px-2.5 py-1 rounded-lg bg-[#2DD4BF] text-[#132A2E] text-[10px] font-extrabold cursor-pointer"
                      >
                        Register
                      </button>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="px-2.5 py-1 rounded-lg bg-white text-[#132A2E] text-[10px] font-bold cursor-pointer"
                      >
                        Log In
                      </button>
                    </div>
                  </div>
                )}

                {/* 3-Column Wallet / Points / Vouchers Bar — Organized & Untruncated */}
                <div className="bg-white rounded-2xl p-2 shadow-2xs grid grid-cols-3 divide-x divide-[#E2F2EE] text-left">
                  <button
                    onClick={() => switchTab('bag')}
                    className="px-2 py-1 flex items-center gap-2 cursor-pointer min-w-0"
                  >
                    <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-display font-extrabold text-[#132A2E] tabular-price leading-tight truncate">
                        ₱{bayongGrandTotal.toLocaleString()}
                      </div>
                      <div className="text-[9.5px] font-medium text-slate-500 leading-tight mt-0.5">
                        Bayong Escrow
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => openPerksModal('referral')}
                    className="px-2 py-1 flex items-center gap-2 cursor-pointer min-w-0"
                  >
                    <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-display font-extrabold text-[#132A2E] leading-tight">
                        Check In
                      </div>
                      <div className="text-[9.5px] font-medium text-slate-500 leading-tight mt-0.5">
                        Daily Points
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => openPerksModal('vouchers')}
                    className="px-2 py-1 flex items-center gap-2 cursor-pointer min-w-0"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-display font-extrabold text-[#132A2E] leading-tight">
                        Ukay Perks
                      </div>
                      <div className="text-[9.5px] font-medium text-slate-500 leading-tight mt-0.5">
                        Vouchers
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="px-3 space-y-2.5">
                {/* 5 Uniform Quick-Shortcut Icons on Crisp White Card (Shopee-Style Colorful Icon Badges) */}
                <div className="bg-white rounded-2xl border border-[#E2F2EE] px-3 py-3.5 shadow-2xs">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <button
                      onClick={() => openPerksModal('referral')}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center group-active:scale-95 transition">
                        <Award className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-medium text-[#132A2E] leading-tight">
                        Referral
                        <br />
                        Points
                      </span>
                    </button>

                    <button
                      onClick={() => openPerksModal('discounts')}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center group-active:scale-95 transition">
                        <Percent className="w-5 h-5 text-rose-500" />
                      </div>
                      <span className="text-[10px] font-medium text-[#132A2E] leading-tight">
                        Ukay
                        <br />
                        Discounts
                      </span>
                    </button>

                    <button
                      onClick={() => openPerksModal('vouchers')}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-active:scale-95 transition">
                        <Ticket className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-medium text-[#132A2E] leading-tight">
                        Free
                        <br />
                        Vouchers
                      </span>
                    </button>

                    <button
                      onClick={handleBecomeSellerAction}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#0D9488] border border-[#0F766E] text-white flex items-center justify-center group-active:scale-95 transition shadow-2xs">
                        <Store className="w-5 h-5 text-white stroke-[2.25]" />
                      </div>
                      <span
                        id="home-become-seller-label"
                        className="text-[10px] font-bold text-[#132A2E] leading-tight"
                      >
                        {isSellerAccount ? (
                          <>
                            Seller
                            <br />
                            Center
                          </>
                        ) : (
                          <>
                            Become
                            <br />
                            Seller
                          </>
                        )}
                      </span>
                    </button>

                    <button
                      onClick={openCustomerServiceChat}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#2DD4BF] border border-[#0D9488] text-[#132A2E] flex items-center justify-center group-active:scale-95 transition shadow-2xs">
                        <Headphones className="w-5 h-5 text-[#132A2E] stroke-[2.25]" />
                      </div>
                      <span className="text-[10px] font-medium text-[#132A2E] leading-tight">
                        Customer
                        <br />
                        Service
                      </span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side UKAYO LIVE & UKAY FEED Split Cards (Matching Reference Image 6 Middle Split) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Left Card: UKAYO LIVE */}
                  <div className="bg-white rounded-2xl border border-[#E2F2EE] p-3 shadow-2xs space-y-2.5">
                    <button
                      onClick={() => switchTab('mine')}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="text-xs font-display font-extrabold text-[#132A2E] tracking-tight flex items-center gap-1">
                        <span>UKAYO LIVE</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {liveSellers.length === 0 ? (
                      <div
                        onClick={() => switchTab('mine')}
                        className="rounded-xl bg-[#0D9488] text-white p-3 aspect-[8/5] flex flex-col items-center justify-center text-center cursor-pointer"
                      >
                        <Radio className="w-5 h-5 text-[#2DD4BF] mb-1" />
                        <div className="text-[10px] font-extrabold">No Live Streams Right Now</div>
                        <div className="text-[9px] text-slate-200">
                          {isSellerAccount
                            ? 'Tap to Start Your Live Stream'
                            : 'Tap to check Live Room'}
                        </div>
                      </div>
                    ) : (
                      <div id="home-live-previews" className="grid grid-cols-2 gap-1.5">
                        {liveSellers.slice(0, 2).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openLiveRoomForSeller(s.id)}
                            className="relative rounded-xl overflow-hidden aspect-[3/4] bg-[#0D9488] text-left group cursor-pointer"
                          >
                            <img
                              src={
                                remoteLiveStream?.isCameraLive &&
                                remoteLiveStream.sellerId === s.id &&
                                remoteLiveStream.frameDataUrl
                                  ? remoteLiveStream.frameDataUrl
                                  : s.liveStreamPreview
                              }
                              alt={s.name}
                              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#2DD4BF] text-[#132A2E] text-[8px] font-extrabold uppercase inline-flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-[#0D9488]" />
                              <span>LIVE</span>
                            </span>
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <div className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                                {s.liveTitle || s.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Card: UKAY FEED */}
                  <div className="bg-white rounded-2xl border border-[#E2F2EE] p-3 shadow-2xs space-y-2.5">
                    <button
                      onClick={() => switchTab('feed')}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="text-xs font-display font-extrabold text-[#132A2E] tracking-tight">
                        UKAY FEED
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {state.feedPosts.length === 0 ? (
                      <div
                        onClick={() => switchTab('feed')}
                        className="rounded-xl bg-[#F4FAF8] border border-dashed border-[#CBE7E0] p-3 aspect-[8/5] flex flex-col items-center justify-center text-center cursor-pointer"
                      >
                        <ImageIcon className="w-5 h-5 text-[#0D9488] mb-1" />
                        <div className="text-[10px] font-extrabold text-[#132A2E]">
                          No Feed Drops Yet
                        </div>
                        <div className="text-[9px] text-slate-500">Tap to post first item</div>
                      </div>
                    ) : (
                      <div id="home-feed-previews" className="grid grid-cols-2 gap-1.5">
                        {state.feedPosts.slice(0, 2).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => switchTab('feed')}
                            className="relative rounded-xl overflow-hidden aspect-[3/4] bg-slate-100 text-left group cursor-pointer"
                          >
                            <img
                              src={p.image}
                              alt={p.itemTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#0D9488]/90 text-white text-[8px] font-extrabold tabular-price">
                              ₱{p.price}
                            </span>
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <div className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                                {p.itemTitle}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ukay Paborito Clean Light Grid */}
                <div className="bg-white rounded-2xl border border-[#E2F2EE] p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-display font-extrabold uppercase tracking-wider text-[#132A2E]">
                      Ukay Paborito Categories
                    </h2>
                    <button
                      onClick={() => browseUkayCategory('ALL')}
                      className="text-[11px] font-bold text-[#0D9488] inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Visit Tindahan Mall</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div id="home-categories-grid" className="grid grid-cols-3 gap-2.5">
                    {state.ukayPaborito.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => browseUkayCategory(c.id)}
                        className="rounded-xl border border-[#E2F2EE] bg-[#F4FAF8] hover:border-[#2DD4BF] overflow-hidden text-center group cursor-pointer transition"
                      >
                        <div className="aspect-square w-full overflow-hidden bg-white">
                          <img
                            src={c.image}
                            alt={c.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="py-2 px-1.5 text-[11px] font-semibold text-[#132A2E] truncate bg-white">
                          {c.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: "UKAY FEED" */}
          {state.activeTab === 'feed' && (
            <section id="tab-feed" className="px-3 pt-3 space-y-2.5 pb-4">
              {/* Compact Live Stories Strip (Only Currently Active Live Streams) */}
              {liveSellers.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2F2EE] p-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-[#132A2E]">
                      Live Bales &amp; Active Tindahan
                    </span>
                    <button
                      onClick={() => switchTab('mine')}
                      className="text-[11px] font-bold text-[#0D9488] cursor-pointer"
                    >
                      Watch Live →
                    </button>
                  </div>
                  <div
                    id="feed-stories-strip"
                    className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-0.5"
                  >
                    {liveSellers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => openLiveRoomForSeller(s.id)}
                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <div className="relative p-0.5 rounded-full bg-[#2DD4BF]">
                          <div className="w-11 h-11 rounded-full bg-[#0D9488] text-white font-display font-extrabold text-xs flex items-center justify-center border-2 border-white overflow-hidden">
                            {s.avatar ? (
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              s.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-[#0D9488] text-white text-[7px] font-extrabold uppercase border border-[#2DD4BF]">
                            LIVE
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-[#132A2E] max-w-[64px] truncate">
                          {s.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Feed Composer */}
              <div className="bg-white rounded-2xl border border-[#E2F2EE] p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0D9488] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                    {state.user.avatar ? (
                      <img
                        src={state.user.avatar}
                        alt={state.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (!isUserSignedIn) {
                        openAuthModal('login');
                        return;
                      }
                      setFeedComposerOpen(true);
                    }}
                    className="flex-1 text-left px-3.5 py-2 rounded-full bg-[#F4FAF8] hover:bg-slate-100 text-xs text-slate-500 font-medium cursor-pointer transition"
                  >
                    Share an ukay drop or looking-for post...
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2F2EE] text-[11px] font-semibold text-[#132A2E]">
                  <button
                    onClick={() => {
                      if (!isUserSignedIn) {
                        openAuthModal('login');
                        return;
                      }
                      setFeedComposerOpen(true);
                    }}
                    className="py-1.5 rounded-xl hover:bg-[#F4FAF8] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#0D9488]" />
                    <span>Photo / Bale</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isUserSignedIn) {
                        openAuthModal('login');
                        return;
                      }
                      setFeedComposerOpen(true);
                    }}
                    className="py-1.5 rounded-xl hover:bg-[#F4FAF8] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Tag className="w-4 h-4 text-[#132A2E]" />
                    <span>Post Item</span>
                  </button>
                  <button
                    onClick={() => switchTab('mine')}
                    className="py-1.5 rounded-xl hover:bg-[#F4FAF8] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-[#0D9488]" />
                    <span>Watch Live</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div
                id="feed-category-bar"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
              >
                {['ALL', ...state.ukayPaborito.map((u) => u.id)].map((c) => {
                  const active = state.activeFeedCategory === c;
                  const catObj = state.ukayPaborito.find((u) => u.id === c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        setState((prev) => ({ ...prev, activeFeedCategory: c }))
                      }
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold shrink-0 cursor-pointer transition ${
                        active
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-white text-[#132A2E] border border-[#CBE7E0]'
                      }`}
                    >
                      {c === 'ALL' ? 'All Drops' : catObj?.label || c}
                    </button>
                  );
                })}
              </div>

              {/* Community Posts Feed */}
              <div id="feed-posts-list" className="space-y-2.5">
                {filteredFeedPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E2F2EE] p-8 text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4FAF8] text-[#132A2E] flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6 text-[#0D9488]" />
                    </div>
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      No Ukay Feed Posts Yet
                    </h3>
                    <p className="text-xs text-slate-500">
                      Be the first to share an ukay piece or bale drop in the community feed!
                    </p>
                    <button
                      onClick={() => {
                        if (!isUserSignedIn) openAuthModal('login');
                        else setFeedComposerOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
                    >
                      + Create First Feed Post
                    </button>
                  </div>
                ) : (
                  filteredFeedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-2xl border border-[#E2F2EE] overflow-hidden shadow-2xs"
                    >
                      <div className="p-3.5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openSellerStore(post.sellerId)}
                          className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#0D9488] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {post.authorAvatar ? (
                              <img
                                src={post.authorAvatar}
                                alt={post.authorName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              post.authorName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#132A2E] group-hover:underline truncate">
                              {post.authorName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {post.authorRole} · {post.timeAgo}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-[#0D9488]">
                            {post.condition}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openReportContentModal({
                                kind: 'post',
                                id: post.id,
                                authorId: post.sellerId || post.authorName,
                                authorName: post.authorName,
                                title: post.itemTitle,
                              })
                            }
                            className="p-1.5 rounded-full text-slate-400 hover:text-[#132A2E] hover:bg-slate-100 transition cursor-pointer"
                            title="Report or Block User / Post"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="px-3.5 pb-2.5 space-y-1">
                        <p className="text-xs text-[#132A2E] leading-relaxed">
                          {post.caption}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(post.tags || []).map((t, i) => (
                            <span key={i} className="text-[10px] font-semibold text-[#0D9488]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="relative bg-[#F4FAF8]">
                        <img
                          src={post.image}
                          alt={post.itemTitle}
                          className="w-full max-h-72 object-cover"
                        />
                        <div className="p-3 bg-white border-t border-[#E2F2EE] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#132A2E] truncate">
                              {post.itemTitle}
                            </div>
                            <div className="text-sm font-display font-extrabold text-[#0D9488] tabular-price">
                              ₱{post.price.toLocaleString()}
                            </div>
                          </div>
                          {post.minedBy ? (
                            <span className="px-3 py-1.5 rounded-xl bg-[#F4FAF8] text-[#132A2E] border border-[#CBE7E0] text-[11px] font-extrabold shrink-0">
                              Mined by {post.minedBy}
                            </span>
                          ) : isOwnSellerProduct(post.sellerId, post.authorName) ? (
                            <span className="px-3 py-1.5 rounded-xl bg-[#F4FAF8] text-[#132A2E] text-[10px] font-extrabold shrink-0">
                              Your Seller Listing
                            </span>
                          ) : (
                            <button
                              onClick={() => claimFeedPost(post.id)}
                              className="px-4 py-2 rounded-xl bg-[#2DD4BF] hover:bg-[#0D9488] text-[#132A2E] text-xs font-extrabold shrink-0 cursor-pointer"
                            >
                              MINE NA!
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-3.5 py-2 border-t border-[#E2F2EE] flex items-center justify-between text-[11px] text-slate-500">
                        <button
                          onClick={() => toggleLikePost(post.id)}
                          className={`inline-flex items-center gap-1.5 font-bold ${
                            post.liked ? 'text-[#0D9488]' : 'text-slate-600'
                          } cursor-pointer`}
                        >
                          <Heart
                            className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`}
                          />
                          <span>{post.likes} Likes</span>
                        </button>
                        <span>{post.comments.length} Comments</span>
                      </div>

                      <div className="px-3.5 pb-3.5 space-y-1.5 border-t border-[#E2F2EE] pt-2.5">
                        {post.comments.map((c, idx) => (
                          <div
                            key={idx}
                            className="bg-[#F4FAF8] rounded-xl px-3 py-1.5 text-[11px]"
                          >
                            <span className="font-extrabold text-[#132A2E]">{c.user}:</span>{' '}
                            <span className="text-slate-700">{c.text}</span>
                          </div>
                        ))}
                        <form
                          onSubmit={(e) => addFeedComment(e, post.id)}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={feedCommentInputs[post.id] || ''}
                            onChange={(e) =>
                              setFeedCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Ask measurements or comment..."
                            className="flex-1 px-3.5 py-1.5 rounded-full bg-[#F4FAF8] border border-[#CBE7E0] text-[11px] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold cursor-pointer"
                          >
                            Post
                          </button>
                        </form>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {/* TAB 3: "MINE NA!" LIVE SELLING ROOM (MATCHING REFERENCE IMAGE 7 SPACING + DURATION COUNTER + END LIVE ICON) */}
          {state.activeTab === 'mine' && (
            <section
              id="tab-mine"
              onTouchStart={handleLiveTouchStart}
              onTouchEnd={handleLiveTouchEnd}
              onWheel={handleLiveWheel}
              className="fixed top-0 left-0 right-0 bottom-[62px] z-20 max-w-md mx-auto bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none overscroll-none touch-none"
            >
              {/* Video / Visual Backdrop (Local Camera -> Agora Remote WebRTC Video -> Server/Cloud Frame Stream -> Pinned Product / Cover) */}
              {(activeLiveSeller ||
                (remoteLiveStream?.isCameraLive && remoteLiveStream.frameDataUrl)) && (
                <img
                  id="live-fallback-bg"
                  src={
                    remoteLiveStream?.isCameraLive && remoteLiveStream.frameDataUrl
                      ? remoteLiveStream.frameDataUrl
                      : activePinnedItem?.image &&
                        activeLiveSeller?.liveStreamPreview === activeLiveSeller?.avatar
                      ? activePinnedItem.image
                      : activeLiveSeller?.liveStreamPreview ||
                        activePinnedItem?.image ||
                        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
                  }
                  alt="Live Ukay Stream"
                  className={`absolute inset-0 w-full h-full object-cover z-[1] ${
                    remoteLiveStream?.isCameraLive && remoteLiveStream.frameDataUrl
                      ? 'opacity-100'
                      : 'opacity-85'
                  } ${isCameraStreaming ? 'hidden' : ''}`}
                />
              )}
              <div
                ref={agoraRemoteVideoRef}
                id="agora-remote-video-stage"
                className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity ${
                  isAgoraRemoteVideoPlaying && !isCameraStreaming
                    ? 'opacity-100 z-[2]'
                    : 'opacity-0 pointer-events-none z-0'
                }`}
              />
              <video
                ref={videoRef}
                id="live-camera-video"
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover z-[3] ${
                  isCameraStreaming ? '' : 'hidden'
                }`}
              />
              <div className="absolute inset-0 z-[4] bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

              {/* TOP LIVE OVERLAY — EXACT LAYOUT & SPACING FROM REFERENCE IMAGE 7 */}
              <div className="relative z-10 px-3.5 pt-3 space-y-2.5">
                {/* Row 1: Top Navigation Bar (Profile & Search on Left | Video • Live • Tindahan • For You in Center | End Live / Live Studio Icon on Right) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => switchTab('account')}
                      className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white hover:text-[#0D9488] cursor-pointer"
                      title="My Account"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab('feed')}
                      className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white hover:text-[#0D9488] cursor-pointer"
                      title="Search Ukay Drops"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Center Horizontal Live Tabs (Live / Tindahan) */}
                  <div className="flex items-center gap-5 text-xs">
                    <button
                      type="button"
                      className="font-extrabold text-white relative pb-1 cursor-pointer"
                    >
                      <span>Live</span>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#2DD4BF]" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        activeLiveSeller
                          ? openSellerStore(activeLiveSeller.id)
                          : switchTab('store')
                      }
                      className="font-semibold text-white/75 hover:text-white cursor-pointer"
                    >
                      Tindahan
                    </button>
                  </div>

                  {/* Right Slot: Seller End Live Icon or Start Live / Exit Icon */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCameraStreaming ? (
                      <button
                        type="button"
                        onClick={endSellerLiveStream}
                        id="top-end-live-btn"
                        className="h-8 px-2.5 rounded-full bg-[#EF4444] hover:bg-red-600 text-white text-[10px] font-extrabold inline-flex items-center gap-1 shadow-md cursor-pointer"
                        title="End Live Stream"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>End Live</span>
                      </button>
                    ) : isSellerAccount ? (
                      <button
                        type="button"
                        onClick={openLiveSetupModal}
                        className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#0D9488] cursor-pointer"
                        title="Start Seller Live Stream"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchTab('home')}
                        className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white cursor-pointer"
                        title="Exit Live"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Host Pill + Follow Button on Left | Seller Duration Counter + End Live Icon / Explore Pill on Right */}
                <div className="flex items-center justify-between gap-2">
                  {activeLiveSeller || remoteLiveStream?.sellerName ? (
                    <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md rounded-full pl-1 pr-2 py-1 border border-white/15 min-w-0">
                      <button
                        onClick={() =>
                          activeLiveSeller && openSellerStore(activeLiveSeller.id)
                        }
                        className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0D9488] border border-[#2DD4BF] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {activeLiveSeller?.avatar ? (
                            <img
                              src={activeLiveSeller.avatar}
                              alt={activeLiveSeller.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (
                              activeLiveSeller?.name ||
                              remoteLiveStream?.sellerName ||
                              'UK'
                            )
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 pr-0.5">
                          <div
                            id="live-host-name"
                            className="text-[11px] font-extrabold text-white truncate leading-tight"
                          >
                            {activeLiveSeller?.name ||
                              remoteLiveStream?.sellerName ||
                              'Ukay Live Seller'}
                          </div>
                          <div
                            id="live-host-category"
                            className="text-[9px] text-white/85 font-semibold truncate leading-tight"
                          >
                            {(activeLiveSeller?.followers || 1).toLocaleString()} Followers ·{' '}
                            {((activeLiveSeller?.followers || 15) + 2).toLocaleString()} Viewers
                          </div>
                        </div>
                      </button>
                      {activeLiveSeller &&
                        !isOwnSellerProduct(
                          activeLiveSeller.id,
                          activeLiveSeller.name
                        ) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollowCurrentLiveSeller();
                            }}
                            id="live-follow-btn"
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold shrink-0 cursor-pointer transition ${
                              isFollowingActiveLiveSeller
                                ? 'bg-white/20 text-white'
                                : 'bg-[#2DD4BF] text-[#132A2E] hover:bg-emerald-400'
                            }`}
                          >
                            {isFollowingActiveLiveSeller ? '✓ Following' : '+ Follow'}
                          </button>
                        )}
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-xs font-extrabold">
                      UKAYO Live Studio
                    </div>
                  )}

                  {/* Right Side of Row 2: Active Seller Duration Counter + End Live Icon OR Buyer Explore / Report */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(isCameraStreaming ||
                      isOwnSellerProduct(
                        activeLiveSeller?.id,
                        activeLiveSeller?.name
                      )) && (
                      <div
                        id="seller-live-duration-counter"
                        className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#2DD4BF]/60 text-white text-[10px] font-mono font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                        title="Active Live Stream Elapsed Time"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
                        <Clock className="w-3 h-3 text-[#0D9488]" />
                        <span className="tabular-nums">
                          {formatLiveDuration(liveElapsedSeconds)}
                        </span>
                      </div>
                    )}

                    {!isCameraStreaming &&
                      (isAgoraRemoteVideoPlaying ||
                        remoteLiveStream?.isCameraLive) && (
                        <div className="px-2.5 py-1 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[9px] font-extrabold inline-flex items-center gap-1 shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                          <span>LIVE</span>
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={switchToNextRelatedLive}
                      className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white inline-flex items-center gap-1 cursor-pointer"
                      title="Explore Next Live Room"
                    >
                      <Radio className="w-3 h-3 text-[#0D9488]" />
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3 text-white/70" />
                    </button>

                    {activeLiveSeller && !isCameraStreaming && (
                      <button
                        type="button"
                        onClick={() =>
                          openReportContentModal({
                            kind: 'live',
                            id: activeLiveSeller.id,
                            authorId: activeLiveSeller.id,
                            authorName: activeLiveSeller.name,
                            title:
                              activeLiveSeller.liveTitle ||
                              activeLiveSeller.name + ' Live Stream',
                          })
                        }
                        className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                        title="Report or Block Live Stream / Host"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Empty State if No Seller is Live Yet */}
              {!activeLiveSeller &&
                !isCameraStreaming &&
                !isAgoraRemoteVideoPlaying &&
                !remoteLiveStream?.isCameraLive && (
                  <div className="relative z-10 px-6 text-center space-y-3 my-auto">
                    <div className="w-14 h-14 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[#0D9488]">
                      <Radio className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-display font-extrabold">
                      No Active Live Streams Right Now
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isSellerAccount
                        ? 'Start your Seller Live Stream right here in the Marketplace and pin ukay drops for buyers to Mine & Lock!'
                        : 'Waiting for a Verified UKAYO Seller to go live. Want to host your own live selling room? Register as a Seller in My Account!'}
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      {isSellerAccount ? (
                        <button
                          onClick={openLiveSetupModal}
                          className="w-full py-3 rounded-2xl bg-[#2DD4BF] hover:bg-[#0D9488] text-[#132A2E] text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          Start My Seller Live Stream Now
                        </button>
                      ) : (
                        <button
                          onClick={handleBecomeSellerAction}
                          className="w-full py-3 rounded-2xl bg-[#2DD4BF] text-[#132A2E] text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          Register as a UKAYO Seller to Go Live
                        </button>
                      )}
                      <button
                        onClick={() => switchTab('feed')}
                        className="w-full py-2.5 rounded-2xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                      >
                        Browse Ukay Feed Instead
                      </button>
                    </div>
                  </div>
                )}

              {/* BOTTOM LIVE HUD — POSITIONED CLEANLY ABOVE BOTTOM NAVIGATION BAR */}
              <div className="relative z-10 px-3 pb-2.5 pt-1 space-y-1.5 shrink-0">
                <div
                  id="floating-hearts-container"
                  className="pointer-events-none absolute right-3 bottom-12 w-24 h-72 overflow-visible z-30"
                >
                  {hearts.map((h) => (
                    <div
                      key={h.id}
                      style={
                        {
                          right: `${h.right}px`,
                          color: h.color,
                          '--heart-drift-x': `${h.driftX}px`,
                          '--heart-rise-y': `${h.riseY}px`,
                          '--heart-scale': h.scale,
                          '--heart-rot': `${h.rotation}deg`,
                          '--heart-dur': `${h.duration}s`,
                          '--heart-delay': `${h.delay}ms`,
                        } as React.CSSProperties
                      }
                      className="floating-heart"
                    >
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                  ))}
                </div>

                {/* Safe Transaction Notice & Live Chat Stream */}
                <div className="space-y-1 max-w-[90%]">
                  <div className="bg-black/40 backdrop-blur-xs rounded-xl px-2.5 py-1 text-[10px] text-white/95 leading-snug flex items-start gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#2DD4BF] text-[#132A2E] text-[8px] font-extrabold shrink-0 mt-0.5">
                      SAFE
                    </span>
                    <span>
                      Welcome to UKAYO Live! Stay safe — only transact inside UKAYO to avoid scams.
                    </span>
                  </div>

                  <div
                    ref={liveChatBoxRef}
                    id="live-chat-messages"
                    className="max-h-24 overflow-y-auto no-scrollbar touch-pan-y flex flex-col gap-1 pr-1"
                  >
                    {state.liveChat.slice(-16).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="inline-flex items-start gap-1.5 bg-black/35 backdrop-blur-xs rounded-xl px-2.5 py-1 text-[11px] max-w-full"
                      >
                        {m.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase shrink-0 mt-0.5 ${
                              m.badge === 'HOST'
                                ? 'bg-[#2DD4BF] text-[#132A2E]'
                                : m.badge === 'LOCKED'
                                ? 'bg-white text-[#132A2E]'
                                : 'bg-white/20 text-white'
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                        <p className="text-white leading-snug break-words">
                          <span className="font-bold text-white/85">{m.sender}:</span>{' '}
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Comment Greeting Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                    {[
                      'Hello, UkayoFam! ❤️❤️❤️',
                      'Mine Na! 🔥',
                      'Size & condition po?',
                    ].map((quickText) => (
                      <button
                        key={quickText}
                        type="button"
                        onClick={() => setLiveChatInput(quickText)}
                        className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white whitespace-nowrap shrink-0 cursor-pointer hover:bg-black/60"
                      >
                        {quickText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pinned Item Card (Buyers see MINE NA!; Seller sees PINNED BY YOU) */}
                {(activeLiveSeller ||
                  isCameraStreaming ||
                  remoteLiveStream?.isCameraLive) &&
                activePinnedItem ? (
                  <div id="live-pinned-item-card">
                    <div className="bg-white rounded-2xl p-2 shadow-lg flex items-center gap-2">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#F4FAF8] shrink-0">
                        <img
                          src={activePinnedItem.image}
                          alt={activePinnedItem.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-[#0D9488] text-white text-[8px] font-extrabold">
                          {activePinnedItem.code}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-[#132A2E] truncate">
                          {activePinnedItem.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {activePinnedItem.size} · {activePinnedItem.condition}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-display font-extrabold text-[#0D9488] tabular-price">
                            ₱{activePinnedItem.price.toLocaleString()}
                          </span>
                          {activePinnedItem.winner ? (
                            <span className="text-[10px] font-bold text-[#132A2E] truncate">
                              Mined: {activePinnedItem.winner}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#0D9488]">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                      {isOwnSellerProduct(
                        activePinnedItem.sellerId || activeLiveSeller?.id,
                        activeLiveSeller?.name || remoteLiveStream?.sellerName
                      ) ? (
                        <span className="px-2.5 py-1.5 rounded-xl bg-[#0D9488] text-white text-[10px] font-extrabold shrink-0 text-center">
                          {activePinnedItem.winner
                            ? `Locked: ${activePinnedItem.winner}`
                            : 'PINNED BY YOU'}
                        </span>
                      ) : (
                        <button
                          onClick={() => claimLiveItem(activePinnedItem.id)}
                          className={`px-3 py-1.5 rounded-xl ${
                            activePinnedItem.winner
                              ? 'bg-[#0D9488] text-white'
                              : 'bg-[#2DD4BF] hover:bg-[#0D9488] text-[#132A2E]'
                          } text-xs font-extrabold shrink-0 cursor-pointer shadow-2xs`}
                        >
                          {activePinnedItem.winner
                            ? activePinnedItem.winner === state.user.name
                              ? 'LOCKED!'
                              : 'STEAL'
                            : 'MINE NA!'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  isSellerAccount &&
                  isCameraStreaming && (
                    <button
                      onClick={openSellerDropModal}
                      className="w-full py-1.5 rounded-xl bg-[#2DD4BF] text-[#132A2E] text-xs font-extrabold cursor-pointer shadow-sm"
                    >
                      + Pin First Item to Live Rack
                    </button>
                  )
                )}

                {/* Bottom Action Row — All Icons Visible Above Bottom Navigation */}
                <form
                  onSubmit={sendLiveChat}
                  className="flex items-center gap-1.5 pt-0.5"
                >
                  {/* Shopping Bag Badge Button on Left */}
                  <button
                    type="button"
                    onClick={() => switchTab('bag')}
                    className="relative w-9 h-9 rounded-xl bg-[#2DD4BF] text-[#132A2E] flex flex-col items-center justify-center shrink-0 cursor-pointer shadow-md"
                    title="My Bayong & Live Rack"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="text-[8px] font-extrabold leading-none mt-0.5 tabular-nums">
                      {bayongTotalQty || state.liveItems.length}
                    </span>
                  </button>

                  {/* Translucent Comment Input Pill */}
                  <input
                    type="text"
                    id="live-chat-input"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder="Comment"
                    className="flex-1 min-w-[72px] px-3 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-xs text-white placeholder-white/70 focus:outline-none"
                  />

                  {/* Seller Host Controls (Only for Registered Sellers: Camera, Flip, Pin, End Live Icon) */}
                  {isSellerAccount && (
                    <>
                      <button
                        type="button"
                        onClick={toggleCameraLive}
                        id="tiktok-cam-btn"
                        className={`w-8 h-8 rounded-full ${
                          isCameraStreaming
                            ? 'bg-[#2DD4BF] text-[#132A2E]'
                            : 'bg-black/45 text-white'
                        } backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 cursor-pointer`}
                        title={
                          isCameraStreaming
                            ? 'Camera Active'
                            : 'Start Seller Live Camera'
                        }
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={flipLiveCamera}
                        className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shrink-0 cursor-pointer"
                        title="Flip Camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={openSellerDropModal}
                        id="tiktok-seller-drop-btn"
                        className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-[#2DD4BF] text-[#2DD4BF] flex items-center justify-center shrink-0 cursor-pointer"
                        title="Pin New Live Item"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {isCameraStreaming && (
                        <button
                          type="button"
                          onClick={endSellerLiveStream}
                          id="seller-end-live-btn"
                          className="w-8 h-8 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                          title="End Live Stream"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Mute/Unmute Audio Circle Button */}
                  <button
                    type="button"
                    onClick={toggleLiveAudienceAudio}
                    className={`w-8 h-8 rounded-full ${
                      !isLiveAudioMuted && isAgoraRemoteAudioPlaying
                        ? 'bg-[#2DD4BF] text-[#132A2E]'
                        : 'bg-black/45 text-white'
                    } backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 cursor-pointer`}
                    title={isLiveAudioMuted ? 'Unmute Live Audio' : 'Mute Live Audio'}
                  >
                    {isLiveAudioMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Share / Next Live Room Circle Button */}
                  <button
                    type="button"
                    onClick={switchToNextRelatedLive}
                    className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shrink-0 cursor-pointer"
                    title="Next Live Room"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Heart Reaction Circle Button on Far Right */}
                  <button
                    type="button"
                    id="live-heart-reaction-btn"
                    onClick={triggerLiveReaction}
                    className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 border border-white/25 text-white flex items-center justify-center shrink-0 active:scale-75 transition cursor-pointer shadow-md"
                    title="Send Heart Reaction"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* TAB 4: "TINDAHAN" (MAIN UKAYO MALL & MARKETPLACE — CATEGORIES + SHOPS + ALL PRODUCTS) */}
          {state.activeTab === 'store' && (
            <section id="tab-store" className="px-3 pt-3 space-y-2.5 pb-4">
              {/* Top Mall Header Bar */}
              <div className="bg-white rounded-2xl border border-[#E2F2EE] px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  {activeStoreSeller ? (
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({ ...prev, activeStoreId: '' }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#132A2E] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>All Tindahan</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#0D9488]" />
                      <span className="text-xs font-display font-extrabold text-[#132A2E]">
                        Tindahan Mall &amp; Marketplace
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {state.activeFeedCategory !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          activeFeedCategory: 'ALL',
                        }))
                      }
                      className="px-2 py-1 rounded-lg bg-[#F4FAF8] border border-[#CBE7E0] text-[10px] font-bold text-[#132A2E] cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                  {isSellerAccount && (
                    <button
                      onClick={openSellerDropModal}
                      id="store-add-product-btn"
                      className="px-2.5 py-1 rounded-lg bg-[#2DD4BF] text-[#132A2E] text-[10px] font-extrabold cursor-pointer"
                    >
                      + Add Product
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal Category Selector Pills (From Home Categories) */}
              <div className="bg-white rounded-2xl border border-[#E2F2EE] p-2.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold text-[#132A2E]">
                    Shop by Category
                  </span>
                  <span className="text-[10px] font-semibold text-[#0D9488]">
                    {state.activeFeedCategory === 'ALL'
                      ? 'Showing All Categories'
                      : state.activeFeedCategory}
                  </span>
                </div>
                <div
                  id="tindahan-category-pills"
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
                >
                  {['ALL', ...state.ukayPaborito.map((u) => u.id)].map((catId) => {
                    const active = state.activeFeedCategory === catId;
                    const catObj = state.ukayPaborito.find((u) => u.id === catId);
                    return (
                      <button
                        key={catId}
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            activeFeedCategory: catId,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 cursor-pointer transition flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#0D9488] text-white shadow-2xs'
                            : 'bg-[#F4FAF8] text-[#132A2E] border border-[#CBE7E0]'
                        }`}
                      >
                        {catObj?.image && (
                          <img
                            src={catObj.image}
                            alt={catObj.label}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <span>
                          {catId === 'ALL' ? 'All Items' : catObj?.label || catId}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Tindahan Shops Strip */}
              {state.sellers.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2F2EE] p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#132A2E]">
                      Verified Tindahan Shops
                    </span>
                    {activeStoreSeller && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({ ...prev, activeStoreId: '' }))
                        }
                        className="text-[10px] font-bold text-[#0D9488] cursor-pointer"
                      >
                        View All Shops
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({ ...prev, activeStoreId: '' }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer border transition ${
                        !activeStoreSeller
                          ? 'bg-[#2DD4BF] text-[#132A2E] border-[#2DD4BF]'
                          : 'bg-[#F4FAF8] text-[#132A2E] border-[#CBE7E0]'
                      }`}
                    >
                      All Mall Shops ({state.sellers.length})
                    </button>
                    {state.sellers.map((s) => {
                      const isSelected = activeStoreSeller?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              activeStoreId: isSelected ? '' : s.id,
                            }))
                          }
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer border transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#0D9488] text-white border-[#0D9488]'
                              : 'bg-[#F4FAF8] text-[#132A2E] border-[#CBE7E0]'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[8px] font-extrabold flex items-center justify-center overflow-hidden">
                            {s.avatar ? (
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              s.name.slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <span className="max-w-[96px] truncate">{s.name}</span>
                          <span className="text-[9px] opacity-80 font-semibold">
                            ({(s.followers || 0).toLocaleString()})
                          </span>
                          {s.isLive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Seller Profile Card with Prominent Follower Count when Seller Profile is Clicked */}
              {activeStoreSeller && (
                <div id="storefront-hero">
                  <div className="bg-white border border-[#E2F2EE] text-[#132A2E] rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#0D9488] text-white font-display font-extrabold text-base flex items-center justify-center shrink-0 overflow-hidden">
                          {activeStoreSeller.avatar ? (
                            <img
                              src={activeStoreSeller.avatar}
                              alt={activeStoreSeller.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            activeStoreSeller.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-sm font-display font-extrabold truncate">
                              {activeStoreSeller.name}
                            </h2>
                            {activeStoreSeller.isLive && (
                              <span className="px-1.5 py-0.2 rounded bg-[#2DD4BF] text-[#132A2E] text-[8px] font-extrabold uppercase shrink-0">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                            <span>{activeStoreSeller.city}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{Number(activeStoreSeller.rating || 5).toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">
                                ({(activeStoreSeller.reviews || []).length}{' '}
                                {(activeStoreSeller.reviews || []).length === 1
                                  ? 'Review'
                                  : 'Reviews'})
                              </span>
                            </span>
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4FAF8] border border-[#CBE7E0] text-[11px] font-extrabold text-[#132A2E]">
                            <User className="w-3 h-3 text-[#0D9488]" />
                            <span id="seller-profile-follower-count">
                              {(activeStoreSeller.followers || 0).toLocaleString()} Followers
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFollowStore(activeStoreSeller.id)}
                        className={`px-3.5 py-1.5 rounded-xl ${
                          activeStoreSeller.followed
                            ? 'bg-[#F4FAF8] text-[#132A2E] border border-[#CBE7E0]'
                            : 'bg-[#0D9488] text-white'
                        } text-xs font-extrabold shrink-0 cursor-pointer`}
                      >
                        {activeStoreSeller.followed ? '✓ Following' : '+ Follow'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activeStoreSeller.bio}
                    </p>
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-center">
                      <div>
                        <div className="text-xs font-display font-extrabold text-[#132A2E]">
                          {(activeStoreSeller.followers || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">Followers</div>
                      </div>
                      <div className="border-x border-[#E2F2EE]">
                        <div className="text-xs font-display font-extrabold text-[#132A2E]">
                          {(activeStoreSeller.products || []).length}
                        </div>
                        <div className="text-[10px] text-slate-500">Products</div>
                      </div>
                      <div>
                        <div className="text-xs font-display font-extrabold text-[#132A2E] inline-flex items-center justify-center gap-0.5">
                          <span>{Number(activeStoreSeller.rating || 5).toFixed(1)}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Shop Rating ({(activeStoreSeller.reviews || []).length})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => openLiveRoomForSeller(activeStoreSeller.id)}
                        className="flex-1 py-2 rounded-xl bg-[#2DD4BF] text-[#132A2E] text-xs font-extrabold cursor-pointer"
                      >
                        Watch Live Room
                      </button>
                      <button
                        onClick={() => openDirectChatWithSeller(activeStoreSeller.id)}
                        className="flex-1 py-2 rounded-xl bg-[#F4FAF8] hover:bg-slate-200/70 text-[#132A2E] text-xs font-extrabold cursor-pointer"
                      >
                        Chat Seller
                      </button>
                    </div>
                  </div>

                  {/* SELLER STAR-RATING & BUYER REVIEWS SECTION ON PROFILE PAGE */}
                  <div
                    id="seller-reviews-section"
                    className="mt-2.5 bg-white border border-[#E2F2EE] text-[#132A2E] rounded-2xl p-4 space-y-3.5 shadow-2xs"
                  >
                    {/* Header + Aggregate Star Summary */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#E2F2EE] pb-3">
                      <div>
                        <h3 className="text-xs font-display font-extrabold uppercase tracking-wider text-[#132A2E]">
                          Shop Ratings &amp; Buyer Reviews
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Verified buyer feedback for {activeStoreSeller.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-base font-display font-extrabold text-[#132A2E] tabular-nums">
                            {Number(activeStoreSeller.rating || 5).toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">/ 5.0</span>
                        </div>
                        <div className="flex items-center justify-end gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              className={`w-3 h-3 ${
                                st <= Math.round(activeStoreSeller.rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Buyer Review Form */}
                    {!isOwnSellerProduct(activeStoreSeller.id, activeStoreSeller.name) ? (
                      <form
                        onSubmit={(e) => submitSellerReview(e, activeStoreSeller.id)}
                        className="bg-[#F4FAF8] border border-[#E2F2EE] rounded-xl p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-[#132A2E]">
                            Rate your shopping experience
                          </span>
                          <span className="text-[10px] font-bold text-[#0D9488]">
                            {sellerReviewRating === 5
                              ? '5.0 ★ Excellent'
                              : sellerReviewRating === 4
                              ? '4.0 ★ Good'
                              : sellerReviewRating === 3
                              ? '3.0 ★ Average'
                              : sellerReviewRating === 2
                              ? '2.0 ★ Fair'
                              : '1.0 ★ Poor'}
                          </span>
                        </div>

                        {/* 5-Star Interactive Selector */}
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = star <= sellerReviewRating;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setSellerReviewRating(star)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                                  active
                                    ? 'bg-amber-50 border-amber-300 text-amber-500'
                                    : 'bg-white border-[#E2F2EE] text-slate-300 hover:text-amber-300'
                                }`}
                                title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    active ? 'fill-amber-400 text-amber-400' : ''
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick Experience Feedback Pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Fast Ship-Out',
                            'Clean Bale Quality',
                            'True to Size',
                            'Friendly Live Host',
                            'Well-Packaged',
                          ].map((tag) => {
                            const selected = sellerReviewTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleSellerReviewTag(tag)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                  selected
                                    ? 'bg-[#0D9488] text-white border-[#0D9488]'
                                    : 'bg-white text-slate-600 border-[#CBE7E0] hover:border-[#0D9488]'
                                }`}
                              >
                                {selected ? `✓ ${tag}` : `+ ${tag}`}
                              </button>
                            );
                          })}
                        </div>

                        {/* Comment Input + Submit Button */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            id="seller-review-input"
                            value={sellerReviewComment}
                            onChange={(e) => setSellerReviewComment(e.target.value)}
                            placeholder={`Write a review for ${activeStoreSeller.name}...`}
                            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-[#CBE7E0] text-xs text-[#132A2E] placeholder-slate-400 focus:outline-none focus:border-[#0D9488]"
                          />
                          <button
                            type="submit"
                            id="seller-review-submit-btn"
                            className="px-3.5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-extrabold shrink-0 cursor-pointer transition"
                          >
                            Post Review
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-[11px] text-slate-500">
                        You are viewing your own storefront. Buyer reviews and ratings appear below.
                      </div>
                    )}

                    {/* Star Filter Pills */}
                    {(activeStoreSeller.reviews || []).length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {(['ALL', 5, 4, 3, 2, 1] as const).map((filterVal) => {
                          const active = sellerReviewFilterStar === filterVal;
                          const count =
                            filterVal === 'ALL'
                              ? (activeStoreSeller.reviews || []).length
                              : (activeStoreSeller.reviews || []).filter(
                                  (r) => Math.round(r.rating) === filterVal
                                ).length;
                          return (
                            <button
                              key={String(filterVal)}
                              type="button"
                              onClick={() => setSellerReviewFilterStar(filterVal)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border cursor-pointer transition ${
                                active
                                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                                  : 'bg-[#F4FAF8] text-[#132A2E] border-[#CBE7E0]'
                              }`}
                            >
                              {filterVal === 'ALL'
                                ? `All (${count})`
                                : `${filterVal} ★ (${count})`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Displayed Buyer Reviews List */}
                    <div id="seller-reviews-list" className="space-y-2.5">
                      {(() => {
                        const allReviews = activeStoreSeller.reviews || [];
                        const filteredReviews =
                          sellerReviewFilterStar === 'ALL'
                            ? allReviews
                            : allReviews.filter(
                                (r) => Math.round(r.rating) === sellerReviewFilterStar
                              );
                        if (filteredReviews.length === 0) {
                          return (
                            <div className="py-4 text-center text-xs text-slate-400">
                              {allReviews.length === 0
                                ? 'No buyer reviews yet. Be the first to rate this seller!'
                                : `No ${sellerReviewFilterStar}-star reviews yet.`}
                            </div>
                          );
                        }
                        return filteredReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-[#0D9488] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 overflow-hidden">
                                  {rev.buyerAvatar ? (
                                    <img
                                      src={rev.buyerAvatar}
                                      alt={rev.buyerName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (rev.buyerName || 'M').slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-[#132A2E] truncate">
                                      {rev.buyerName}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-[#2DD4BF]/25 text-[#0D9488] text-[8px] font-extrabold uppercase shrink-0">
                                      Verified Miner
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {rev.createdAt || 'Just now'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((st) => (
                                  <Star
                                    key={st}
                                    className={`w-3 h-3 ${
                                      st <= Math.round(rev.rating || 5)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {rev.tags && rev.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {rev.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 rounded-full bg-white border border-[#CBE7E0] text-[9px] font-semibold text-[#0D9488]"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-[#132A2E] leading-relaxed">
                              {rev.comment}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Tindahan Marketplace Products Grid (Filtered by Category, Shop, and Search) */}
              {(() => {
                const matchCategory = (itemCategory: string, itemTitle: string) => {
                  if (state.activeFeedCategory === 'ALL') return true;
                  const target = state.activeFeedCategory.toLowerCase();
                  const cat = (itemCategory || '').toLowerCase();
                  const title = (itemTitle || '').toLowerCase();
                  if (cat === target) return true;
                  const keywords = target
                    .split(/[\s&/,-]+/)
                    .filter((w) => w.length > 2);
                  return keywords.some(
                    (kw) => cat.includes(kw) || title.includes(kw)
                  );
                };

                const matchSearch = (title: string, shopName: string, cat: string) => {
                  if (!state.searchQuery) return true;
                  const q = state.searchQuery.toLowerCase();
                  return (
                    title.toLowerCase().includes(q) ||
                    shopName.toLowerCase().includes(q) ||
                    (cat || '').toLowerCase().includes(q)
                  );
                };

                const storeProductCards: {
                  key: string;
                  kind: 'store' | 'feed';
                  sellerId: string;
                  sellerName: string;
                  productId: string;
                  title: string;
                  price: number;
                  category: string;
                  size: string;
                  status: string;
                  image: string;
                }[] = [];

                const sellersToScan = activeStoreSeller
                  ? [activeStoreSeller]
                  : state.sellers;

                sellersToScan.forEach((seller) => {
                  (seller.products || []).forEach((prod) => {
                    const cat = prod.category || seller.liveCategory || 'Ukay Selection';
                    if (
                      matchCategory(cat, prod.title) &&
                      matchSearch(prod.title, seller.name, cat)
                    ) {
                      storeProductCards.push({
                        key: `store_${seller.id}_${prod.id}`,
                        kind: 'store',
                        sellerId: seller.id,
                        sellerName: seller.name,
                        productId: prod.id,
                        title: prod.title,
                        price: prod.price,
                        category: cat,
                        size: prod.size || 'Free Size',
                        status: prod.status || 'Available',
                        image: prod.image,
                      });
                    }
                  });
                });

                // Include feed marketplace listings that match the selected category when browsing all shops
                state.feedPosts.forEach((post) => {
                  if (hiddenPostSet.has(post.id)) return;
                  if (
                    activeStoreSeller &&
                    post.sellerId !== activeStoreSeller.id &&
                    post.authorName !== activeStoreSeller.name
                  ) {
                    return;
                  }
                  const cat = post.category || 'Ukay Selection';
                  if (
                    matchCategory(cat, post.itemTitle) &&
                    matchSearch(post.itemTitle, post.authorName, cat)
                  ) {
                    storeProductCards.push({
                      key: `feed_${post.id}`,
                      kind: 'feed',
                      sellerId: post.sellerId,
                      sellerName: post.authorName,
                      productId: post.id,
                      title: post.itemTitle,
                      price: post.price,
                      category: cat,
                      size: post.condition || 'Preloved',
                      status: post.minedBy ? `Mined by ${post.minedBy}` : 'Available',
                      image: post.image,
                    });
                  }
                });

                if (storeProductCards.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border border-[#E2F2EE] p-8 text-center space-y-2.5">
                      <Store className="w-8 h-8 text-[#0D9488] mx-auto" />
                      <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                        No items found in{' '}
                        {state.activeFeedCategory === 'ALL'
                          ? 'this Tindahan view'
                          : state.activeFeedCategory}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Try switching to &ldquo;All Items&rdquo; or another category above to explore more ukay products.
                      </p>
                      {state.activeFeedCategory !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              activeFeedCategory: 'ALL',
                            }))
                          }
                          className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
                        >
                          Show All Tindahan Items
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    id="storefront-products-grid"
                    className="grid grid-cols-2 gap-2.5"
                  >
                    {storeProductCards.map((card) => {
                      const isAvailable = card.status === 'Available';
                      const ownItem = isOwnSellerProduct(
                        card.sellerId,
                        card.sellerName
                      );
                      const handleMineClick = () => {
                        if (card.kind === 'store') {
                          claimStoreProduct(card.sellerId, card.productId);
                        } else {
                          claimFeedPost(card.productId);
                        }
                      };
                      return (
                        <div
                          key={card.key}
                          className="bg-white rounded-2xl border border-[#E2F2EE] overflow-hidden shadow-2xs flex flex-col"
                        >
                          <button
                            type="button"
                            onClick={handleMineClick}
                            className="relative aspect-square bg-[#F4FAF8] overflow-hidden cursor-pointer text-left"
                          >
                            <img
                              src={card.image}
                              alt={card.title}
                              className="w-full h-full object-cover"
                            />
                            <span
                              className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                                isAvailable
                                  ? 'bg-[#2DD4BF] text-[#132A2E]'
                                  : 'bg-[#0D9488] text-white'
                              }`}
                            >
                              {card.status}
                            </span>
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-xs text-white text-[9px] font-semibold truncate max-w-[85%]">
                              {card.category}
                            </span>
                          </button>

                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="text-xs font-bold text-[#132A2E] line-clamp-2">
                                {card.title}
                              </div>
                              <div className="flex items-center justify-between gap-1 mt-1">
                                <span className="text-[10px] text-slate-500 truncate">
                                  {card.sellerName}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {card.size}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#E2F2EE]">
                              <span className="text-sm font-display font-extrabold text-[#0D9488] tabular-price">
                                ₱{card.price.toLocaleString()}
                              </span>
                              {ownItem ? (
                                <span className="px-2 py-1 rounded-lg bg-[#F4FAF8] text-[#132A2E] text-[9px] font-extrabold">
                                  Your Item
                                </span>
                              ) : !isAvailable ? (
                                <span className="px-2 py-1 rounded-lg bg-[#F4FAF8] text-slate-400 text-[9px] font-bold">
                                  Locked
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleMineClick}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#2DD4BF] hover:text-[#132A2E] text-white text-[10px] font-extrabold cursor-pointer transition"
                                >
                                  MINE NA!
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          )}

          {/* TAB 5: "MY BAYONG" (SHOPPING CART — MATCHING REFERENCE IMAGE 2 LIGHT CARD LAYOUT) */}
          {state.activeTab === 'bag' && (
            <section id="tab-bag" className="space-y-2.5 pb-28">
              {/* Top White Cart Bar (Matching Reference Image 2: Back Arrow | Shopping Cart (count) | Edit & Chat Icon) */}
              <div className="bg-white border-b border-[#E2F2EE] px-4 py-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => switchTab('home')}
                  className="text-[#132A2E] cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-sm font-display font-extrabold text-[#132A2E]">
                  My Bayong{' '}
                  <span id="bayong-item-count" className="font-normal text-slate-500">
                    ({bayongTotalQty})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => switchTab('chat')}
                  className="text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Chat
                </button>
              </div>

              <div id="bayong-items-list" className="px-3 space-y-2.5">
                {bayongItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E2F2EE] p-8 text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4FAF8] text-[#132A2E] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6 text-[#0D9488]" />
                    </div>
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      Your Bayong is empty
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tap <strong>MINE NA!</strong> in live streams or Ukay Feed to add items here.
                    </p>
                    <button
                      onClick={() => switchTab('feed')}
                      className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
                    >
                      Browse Ukay Feed
                    </button>
                  </div>
                ) : (
                  bayongItems.map((item) => {
                    const qty = item.quantity || 1;
                    const lineTotal = item.price * qty;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-[#E2F2EE] overflow-hidden shadow-2xs"
                      >
                        {/* Store Header Row Inside Cart Card (Matching Reference Image 2) */}
                        <div className="px-3.5 py-2.5 border-b border-[#E2F2EE] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => openSellerStore(item.sellerId)}
                            className="flex items-center gap-2 text-xs font-bold text-[#132A2E] cursor-pointer"
                          >
                            <Store className="w-3.5 h-3.5 text-[#0D9488]" />
                            <span className="truncate">{item.sellerName}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBayongItem(item.id)}
                            className="text-[11px] font-medium text-slate-400 hover:text-[#132A2E] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Item Body Row */}
                        <div className="p-3.5 flex items-center gap-3">
                          <div className="w-4 h-4 rounded border border-[#2DD4BF] bg-[#2DD4BF] text-[#132A2E] flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-20 h-20 rounded-xl object-cover bg-[#F4FAF8] shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="text-xs font-semibold text-[#132A2E] line-clamp-2">
                              {item.title}
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4FAF8] text-[10px] font-medium text-slate-600">
                              <span>Code: {item.itemCode}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-sm font-display font-extrabold text-[#0D9488] tabular-price">
                                ₱{lineTotal.toLocaleString()}
                              </span>
                              <div className="inline-flex items-center border border-[#CBE7E0] rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateBayongQuantity(item.id, -1)}
                                  className="w-7 h-6 bg-white hover:bg-[#F4FAF8] text-[#132A2E] flex items-center justify-center cursor-pointer"
                                  title="Decrease Quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2.5 text-xs font-bold text-[#132A2E] tabular-nums border-x border-[#CBE7E0]">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateBayongQuantity(item.id, 1)}
                                  className="w-7 h-6 bg-white hover:bg-[#F4FAF8] text-[#132A2E] flex items-center justify-center cursor-pointer"
                                  title="Increase Quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shop Voucher Sub-Row (Matching Reference Image 2) */}
                        <button
                          type="button"
                          onClick={() => openPerksModal('vouchers')}
                          className="w-full px-3.5 py-2 border-t border-[#E2F2EE] flex items-center justify-between text-[11px] text-slate-500 hover:bg-[#F4FAF8] cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Ticket className="w-3.5 h-3.5 text-[#0D9488]" />
                            <span>Ukayo Vouchers &amp; Bale Discount applied at checkout</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sticky Bottom Cart Checkout Bar (Matching Reference Image 2) */}
              {bayongItems.length > 0 && (
                <div
                  id="bayong-checkout-bar"
                  className="bg-white border-t border-[#CBE7E0] mx-3 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#2DD4BF] text-[#132A2E] flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-semibold text-slate-600">All</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Total</div>
                      <div
                        id="bayong-grand-total"
                        className="text-sm font-display font-extrabold text-[#0D9488] tabular-price"
                      >
                        ₱{bayongGrandTotal.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={openCheckoutModal}
                      className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#2DD4BF] hover:text-[#132A2E] text-white text-xs font-extrabold cursor-pointer transition"
                    >
                      Check Out ({bayongTotalQty})
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 6: "CHAT" */}
          {state.activeTab === 'chat' && (
            <section id="tab-chat" className="px-3 pt-3 space-y-2.5 pb-4">
              <div className="bg-white rounded-xl border border-[#E2F2EE] px-3.5 py-2.5 flex items-center justify-between gap-2">
                <h2 className="text-sm font-display font-extrabold text-[#132A2E]">
                  Messages &amp; Customer Service
                </h2>
                <button
                  onClick={openCustomerServiceChat}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2DD4BF] text-[#132A2E] text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Headset className="w-3.5 h-3.5" />
                  <span>Admin Help</span>
                </button>
              </div>

              {/* TWO-COLUMN SPLIT INBOX */}
              <div className="bg-white rounded-2xl border border-[#E2F2EE] overflow-hidden shadow-2xs grid grid-cols-12 h-[65dvh]">
                {/* Left Column: Conversations */}
                <div className="col-span-5 border-r border-[#E2F2EE] bg-[#F4FAF8] flex flex-col overflow-hidden">
                  <div className="px-3 py-2 bg-white border-b border-[#E2F2EE] text-[#132A2E] text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between">
                    <span>Chats</span>
                    <span className="text-slate-400">{chatContacts.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#E2F2EE]">
                    {chatContacts.map((c) => {
                      const isSelected = c.id === activeChatContact.id;
                      const lastMsg = c.messages[c.messages.length - 1];
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => openDirectChatWithSeller(c.id)}
                          className={`w-full p-2.5 text-left transition cursor-pointer block ${
                            isSelected ? 'bg-white' : 'hover:bg-white/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold text-[#132A2E] truncate">
                              {c.name}
                            </span>
                          </div>
                          <div className="text-[9px] font-bold text-[#0D9488] mt-0.5">
                            {c.badge}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {lastMsg
                              ? lastMsg.text
                              : c.isSupport
                              ? 'Tap to ask Admin for help...'
                              : 'No messages yet'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Active Conversation Messages */}
                <div className="col-span-7 flex flex-col overflow-hidden">
                  <div className="px-3 py-2 bg-white border-b border-[#E2F2EE] text-[#132A2E] flex items-center justify-between">
                    <div className="min-w-0">
                      <div
                        id="chat-active-seller-name"
                        className="text-xs font-extrabold truncate"
                      >
                        {activeChatContact.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {activeChatContact.city}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#0D9488] font-bold shrink-0">
                      Online
                    </span>
                  </div>

                  <div
                    ref={directChatBoxRef}
                    id="chat-messages-box"
                    className="flex-1 p-2.5 overflow-y-auto space-y-2 bg-[#F4FAF8]"
                  >
                    {activeChatContact.messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 space-y-1">
                        {activeChatContact.isSupport ? (
                          <>
                            <Headset className="w-6 h-6 text-[#0D9488]" />
                            <div className="text-xs font-bold text-[#132A2E]">
                              UKAYO Admin Customer Service
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Send a message below if you need help as a Buyer or Seller.
                            </p>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-6 h-6 text-slate-400" />
                            <div className="text-xs font-bold text-[#132A2E]">
                              Start chatting with {activeChatContact.name}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      activeChatContact.messages.map((m, idx) => {
                        const isCustomerServiceReply =
                          m.from === 'admin' ||
                          Boolean(
                            m.senderName &&
                              (m.senderName.toLowerCase().includes('customer service') ||
                                m.senderName.toLowerCase().includes('admin'))
                          ) ||
                          Boolean(
                            activeChatContact.isSupport &&
                              m.from === 'seller' &&
                              !isSellerMode
                          );

                        const isSellerReply =
                          !isCustomerServiceReply &&
                          m.from === 'seller' &&
                          !activeChatContact.isSupport;

                        const isMine =
                          !isCustomerServiceReply &&
                          !isSellerReply &&
                          (m.from === 'buyer' ||
                            (activeChatContact.isSupport &&
                              m.from === 'seller' &&
                              isSellerMode));

                        const roleBadgeText = isCustomerServiceReply
                          ? 'UKAYO CUSTOMER SERVICE (ADMIN)'
                          : isSellerReply
                          ? `SELLER · ${m.senderName || activeChatContact.name}`
                          : isSellerMode && activeChatContact.isSupport
                          ? `YOU (SELLER · ${state.user.shopName || state.user.name})`
                          : `YOU (BUYER · ${state.user.name || 'Miner'})`;

                        return (
                          <div
                            key={m.id || idx}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-2xs ${
                                isMine
                                  ? 'bg-[#0D9488] text-white rounded-br-xs'
                                  : isCustomerServiceReply
                                  ? 'bg-white border border-[#2DD4BF] text-[#132A2E] rounded-bl-xs'
                                  : 'bg-white border border-[#CBE7E0] text-[#132A2E] rounded-bl-xs'
                              }`}
                            >
                              <div
                                className={`text-[9px] font-extrabold uppercase tracking-wider mb-0.5 ${
                                  isMine
                                    ? 'text-[#0D9488]'
                                    : isCustomerServiceReply
                                    ? 'text-[#0D9488]'
                                    : 'text-slate-500'
                                }`}
                              >
                                {roleBadgeText}
                              </div>
                              <p className="leading-snug break-words">{m.text}</p>
                              <div className="text-[9px] opacity-60 mt-1 text-right">
                                {m.time}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={sendDirectChatMessage}
                    className="p-2 bg-white border-t border-[#E2F2EE] flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      id="direct-chat-input"
                      value={directChatInput}
                      onChange={(e) => setDirectChatInput(e.target.value)}
                      placeholder={
                        activeChatContact.isSupport
                          ? 'Ask Admin Customer Service...'
                          : 'Message seller...'
                      }
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-full bg-[#F4FAF8] border border-[#CBE7E0] text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-full bg-[#0D9488] text-white text-xs font-extrabold shrink-0 cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* TAB 7: "MY ACCOUNT" (LIGHT, ORGANIZED PROFILE, MY PURCHASES & ACCOUNT SETTINGS — MATCHING IMAGES 3, 4 & 5) */}
          {state.activeTab === 'account' && (
            <section id="tab-account" className="space-y-2.5 pb-6">
              {/* Top Profile Header Banner in UKAYO Two-Color Palette (Matching Reference Image 3 Top Section) */}
              <div className="bg-[#0D9488] text-white px-4 pt-3 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <label
                      className="relative block w-14 h-14 rounded-full bg-white/10 border-2 border-[#2DD4BF] cursor-pointer group shrink-0"
                      title="Tap to upload profile photo"
                    >
                      <div
                        id="account-avatar-initials"
                        className="w-full h-full rounded-full bg-[#0D9488] text-white font-display font-extrabold text-base flex items-center justify-center overflow-hidden relative"
                      >
                        {state.user.avatar ? (
                          <img
                            src={state.user.avatar}
                            alt={state.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userInitials
                        )}
                        <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Camera className="w-4 h-4 text-white" />
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleProfileAvatarUpload(e, 'direct')}
                        className="hidden"
                      />
                    </label>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="relative inline-flex items-center">
                          <h3
                            id="account-display-name"
                            className="text-base font-display font-extrabold text-white truncate pr-4"
                          >
                            {!state.isAuthenticated ? 'Guest Miner' : state.user.name}
                          </h3>
                          <button
                            type="button"
                            onClick={openIdVerifyModal}
                            id="account-verified-top-right-icon"
                            title={
                              actualVerificationStatus === 'verified'
                                ? 'Verified Account'
                                : actualVerificationStatus === 'pending'
                                ? 'Verification Pending'
                                : 'Tap to Verify ID'
                            }
                            className={`-mt-2 -ml-3.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-2xs ${
                              actualVerificationStatus === 'verified'
                                ? 'bg-emerald-500 text-white'
                                : actualVerificationStatus === 'pending'
                                ? 'bg-amber-400 text-[#132A2E]'
                                : 'bg-white/25 text-white/80 hover:bg-white/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        </div>
                        <span
                          id="account-role-pill"
                          className="px-2 py-0.5 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[9px] font-extrabold uppercase shrink-0"
                        >
                          {isSellerAccount ? 'Seller >' : 'Miner >'}
                        </span>
                      </div>
                      <div
                        id="account-email-line"
                        className="text-[11px] text-white/80 flex items-center gap-3 mt-0.5 truncate"
                      >
                        <span>
                          <strong>{state.sellers.filter((s) => s.followed).length}</strong>{' '}
                          Following
                        </span>
                        <span>
                          <strong>
                            {state.sellers.find((s) => s.id === state.user.ownSellerId)
                              ?.followers || 0}
                          </strong>{' '}
                          Followers
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Customer Service Headphone & Settings Gear Icons */}
                  {state.isAuthenticated ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={openCustomerServiceChat}
                        className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer shrink-0"
                        title="Customer Service & Help"
                      >
                        <Headphones className="w-4 h-4 text-white stroke-[2.25]" />
                      </button>
                      <button
                        type="button"
                        onClick={openEditProfileModal}
                        className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer shrink-0"
                        title="Edit Profile Settings"
                      >
                        <Settings className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openAuthModal('register')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#2DD4BF] text-[#132A2E] text-[10px] font-extrabold cursor-pointer"
                      >
                        Register
                      </button>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="px-2.5 py-1.5 rounded-lg bg-white text-[#132A2E] text-[10px] font-bold cursor-pointer"
                      >
                        Log In
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-3 space-y-2.5">

                {/* MY PURCHASES CARD (Matching Reference Images 3 & 5) */}
                <div className="bg-white rounded-2xl border border-[#E2F2EE] p-4 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      My Purchases
                    </h3>
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          activePurchaseFilter: 'ALL',
                        }))
                      }
                      className="text-xs text-slate-500 hover:text-[#132A2E] inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Purchase History</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 4 Clean Spaced Outline Icons with Top-Right Badges (Matching Reference Image 3) */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-0.5">
                    {(
                      [
                        {
                          key: 'TO_PAY',
                          label: 'To Pay',
                          icon: Wallet,
                        },
                        {
                          key: 'TO_SHIP',
                          label: 'To Ship',
                          icon: Package,
                        },
                        {
                          key: 'TO_RECEIVE',
                          label: 'To Receive',
                          icon: Truck,
                        },
                        {
                          key: 'TO_RATE',
                          label: 'To Rate',
                          icon: Star,
                        },
                      ] as const
                    ).map((st) => {
                      const count = state.minedOrders.filter(
                        (o) => o.stage === st.key
                      ).length;
                      const active = state.activePurchaseFilter === st.key;
                      const IconComp = st.icon;
                      return (
                        <button
                          key={st.key}
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              activePurchaseFilter: st.key,
                            }))
                          }
                          className={`relative py-2 px-1 rounded-xl flex flex-col items-center gap-1.5 cursor-pointer transition ${
                            active
                              ? 'bg-[#F4FAF8] text-[#0D9488]'
                              : 'text-[#132A2E] hover:bg-[#F4FAF8]'
                          }`}
                        >
                          <div className="relative">
                            <IconComp className="w-6 h-6 stroke-[1.75]" />
                            {count > 0 && (
                              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[9px] font-extrabold flex items-center justify-center">
                                {count}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean Order Cards Matching Reference Image 5 ("My Purchases") */}
                  <div id="account-orders-list" className="space-y-2.5 pt-1 border-t border-[#E2F2EE]">
                    {visibleAccountOrders.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No orders in this tab yet.
                      </div>
                    ) : (
                      visibleAccountOrders.map((o) => (
                        <div
                          key={o.id}
                          className="bg-[#F4FAF8] rounded-xl p-3 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#132A2E] inline-flex items-center gap-1.5 truncate">
                              <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{o.sellerName}</span>
                            </span>
                            <span className="text-[11px] font-bold text-[#0D9488] shrink-0">
                              {o.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <img
                              src={o.image}
                              alt={o.title}
                              className="w-14 h-14 rounded-lg object-cover bg-white shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#132A2E] truncate">
                                {o.title}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                                <span>{o.courier} · {o.paymentMethod}</span>
                                <span>x{o.quantity || 1}</span>
                              </div>
                              <div className="text-right text-xs font-bold text-[#132A2E] tabular-price mt-1">
                                Total: <span className="text-[#0D9488]">₱{(o.price * (o.quantity || 1)).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Expected Delivery / Tracking Banner + Rate Seller Shop Action */}
                          <div className="px-3 py-2 rounded-lg bg-[#2DD4BF]/10 flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-[#132A2E] font-medium truncate">
                              {o.trackingEvents?.[0]?.title || 'Protected by UKAYO Escrow'} ·{' '}
                              {o.trackingEvents?.[0]?.desc || o.courier}
                            </span>
                            {o.sellerId && (
                              <button
                                type="button"
                                onClick={() => openSellerStore(o.sellerId)}
                                className="px-2 py-0.5 rounded-md bg-white border border-[#CBE7E0] text-[10px] font-bold text-[#0D9488] shrink-0 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>Rate Shop</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* MY WALLET & SELLER TOOLS CARD (Matching Reference Image 3 "My Wallet" 4-Icon Section) */}
                <div className="bg-white rounded-2xl border border-[#E2F2EE] p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      My Wallet &amp; Seller Hub
                    </h3>
                    <span
                      id="account-seller-banner-title"
                      className="text-[11px] font-bold text-[#0D9488]"
                    >
                      {isSellerAccount
                        ? state.user.shopName || 'Registered Seller'
                        : 'Buyer & Miner'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => switchTab('bag')}
                      className="flex flex-col items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#CBE7E0] flex items-center justify-center text-[#132A2E]">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-[#132A2E]">
                        Bayong
                      </span>
                      <span className="text-[10px] font-bold text-[#0D9488] tabular-price">
                        ₱{bayongGrandTotal.toLocaleString()}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openPerksModal('referral')}
                      className="flex flex-col items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#CBE7E0] flex items-center justify-center text-[#132A2E]">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-[#132A2E]">
                        Points
                      </span>
                      <span className="text-[10px] text-[#0D9488] font-semibold">
                        Check in
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openPerksModal('vouchers')}
                      className="flex flex-col items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#CBE7E0] flex items-center justify-center text-[#132A2E]">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-[#132A2E]">
                        Vouchers
                      </span>
                      <span className="text-[10px] text-[#0D9488] font-semibold">
                        Free Ship
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBecomeSellerAction}
                      id="account-seller-banner-btn"
                      className="flex flex-col items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#CBE7E0] flex items-center justify-center text-[#132A2E]">
                        <Store className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-[#132A2E]">
                        {isSellerAccount ? 'Seller Hub' : 'Sell Now'}
                      </span>
                      <span className="text-[10px] text-[#0D9488] font-semibold">
                        {isSellerAccount ? 'Go Live' : 'Apply'}
                      </span>
                    </button>
                  </div>

                  {/* Seller Mode Switcher & Live/Feed Actions (Only for Registered Sellers) */}
                  {isSellerAccount && (
                    <div
                      id="account-seller-active-controls"
                      className="pt-2.5 border-t border-[#E2F2EE] space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F4FAF8]">
                        <button
                          type="button"
                          onClick={() => setMarketplaceMode('buyer')}
                          id="mode-btn-buyer"
                          className={
                            !isSellerMode
                              ? 'py-1.5 px-2 rounded-lg text-[11px] font-extrabold bg-[#0D9488] text-white cursor-pointer transition'
                              : 'py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer transition'
                          }
                        >
                          Miner Mode (Shop)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarketplaceMode('seller')}
                          id="mode-btn-seller"
                          className={
                            isSellerMode
                              ? 'py-1.5 px-2 rounded-lg text-[11px] font-extrabold bg-[#2DD4BF] text-[#132A2E] cursor-pointer transition'
                              : 'py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer transition'
                          }
                        >
                          Seller Mode (Live)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={launchSellerLiveInApp}
                          className="py-2 px-3 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5 text-white" />
                          <span>Go LIVE Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={openSellerCenterPortal}
                          className="py-2 px-3 rounded-xl bg-[#2DD4BF] text-[#132A2E] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Seller Center</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCOUNT SETTINGS LIST — CLEAN LIGHT GROUPED ROWS MATCHING REFERENCE IMAGE 4 */}
                <div className="space-y-2">
                  <div className="px-1 text-[11px] font-semibold text-slate-400">
                    My Account
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E2F2EE] divide-y divide-[#E2F2EE] overflow-hidden shadow-2xs">
                    {isSellerAccount && (
                      <>
                        <button
                          onClick={() => openSellerStore(state.user.ownSellerId)}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4 text-white" />
                            </span>
                            <span>My Nasa Tindahan Shop</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          type="button"
                          onClick={openSellerCenterPortal}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#2DD4BF] text-[#132A2E] flex items-center justify-center shrink-0">
                              <LayoutDashboard className="w-4 h-4 text-[#132A2E]" />
                            </span>
                            <span>UKAYO Seller Center Portal</span>
                          </span>
                          <ExternalLink className="w-4 h-4 text-[#0D9488]" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={openEditProfileModal}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#F4FAF8] border border-[#CBE7E0] text-[#0D9488] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#0D9488]" />
                        </span>
                        <span>Account &amp; Profile Information</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={openIdVerifyModal}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#F4FAF8] border border-[#CBE7E0] text-[#0D9488] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                        </span>
                        <span>Identity Verification (PH Primary ID)</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          id="settings-verify-subtext"
                          className="text-[11px] text-slate-400"
                        >
                          {state.user.idType || 'Verify'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                    {!isSellerAccount && (
                      <button
                        onClick={goToSellerRegistrationPage}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shrink-0">
                            <Store className="w-4 h-4 text-white stroke-[2.25]" />
                          </span>
                          <span>Become a Seller (Register UKAYO Shop)</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  <div className="px-1 pt-1 text-[11px] font-semibold text-slate-400">
                    Support &amp; Policies
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E2F2EE] divide-y divide-[#E2F2EE] overflow-hidden shadow-2xs">
                    <button
                      onClick={openCustomerServiceChat}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#2DD4BF] text-[#132A2E] flex items-center justify-center shrink-0">
                          <Headphones className="w-4 h-4 text-[#132A2E] stroke-[2.25]" />
                        </span>
                        <span>Help Centre &amp; Customer Service</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrivacyTermsTab('privacy');
                        setPrivacyTermsModalOpen(true);
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                    >
                      <span>UKAYO Policies, Privacy &amp; Community Rules</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    {((state.blockedUserIds && state.blockedUserIds.length > 0) ||
                      (state.hiddenPostIds && state.hiddenPostIds.length > 0)) && (
                      <button
                        type="button"
                        onClick={handleUnblockAllUsers}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                      >
                        <span>Blocked Users ({(state.blockedUserIds || []).length})</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                    <button
                      onClick={handleAccountLogout}
                      id="account-logout-btn"
                      className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-[#132A2E] hover:bg-[#F4FAF8] cursor-pointer text-left"
                    >
                      <span id="account-logout-label">
                        {state.isAuthenticated ? 'Log Out' : 'Log In / Register Account'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    {state.isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmText('');
                          setDeleteAccountModalOpen(true);
                        }}
                        id="account-delete-btn"
                        className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-slate-500 hover:bg-[#F4FAF8] cursor-pointer text-left"
                      >
                        <span>Request Account Deletion</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* DOCKED BOTTOM NAVIGATION BAR — UNIFORM ACROSS ALL TABS INCLUDING LIVE */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto border-t px-1.5 pt-1.5 pb-safe bg-white border-[#CBE7E0] text-[#132A2E] transition-colors">
          <div className="grid grid-cols-6 items-center text-center">
            <button
              onClick={() => switchTab('home')}
              data-nav="home"
              className={`nav-tab-btn flex flex-col items-center gap-1 py-1 cursor-pointer ${
                state.activeTab === 'home'
                  ? 'text-[#0D9488] font-extrabold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  activeStoreId: '',
                  activeTab: 'store',
                }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              data-nav="store"
              className={`nav-tab-btn flex flex-col items-center gap-1 py-1 cursor-pointer ${
                state.activeTab === 'store'
                  ? 'text-[#0D9488] font-extrabold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              <Store className="w-5 h-5" />
              <span className="text-[10px]">Tindahan</span>
            </button>

            {/* Center Live Tab */}
            <button
              onClick={() => switchTab('mine')}
              data-nav="mine"
              className={`nav-tab-btn flex flex-col items-center gap-1 py-1 cursor-pointer ${
                state.activeTab === 'mine'
                  ? 'text-[#0D9488] font-extrabold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="text-[10px]">Live</span>
            </button>

            <button
              onClick={() => switchTab('feed')}
              data-nav="feed"
              className={`nav-tab-btn flex flex-col items-center gap-1 py-1 cursor-pointer ${
                state.activeTab === 'feed'
                  ? 'text-[#0D9488] font-extrabold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px]">Ukay Feed</span>
            </button>

            <button
              onClick={() => switchTab('bag')}
              data-nav="bag"
              className={`nav-tab-btn relative flex flex-col items-center gap-1 py-1 cursor-pointer ${
                state.activeTab === 'bag'
                  ? 'text-[#0D9488] font-extrabold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              {bayongTotalQty > 0 && (
                <span
                  id="nav-bag-badge"
                  className="absolute top-0 right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2DD4BF] text-[#132A2E] text-[9px] font-extrabold flex items-center justify-center"
                >
                  {bayongTotalQty}
                </span>
              )}
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px]">Bayong</span>
            </button>

            <button
              onClick={() => switchTab('account')}
              data-nav="account"
              className={`nav-tab-btn flex flex-col items-center gap-1 py-1 cursor-pointer ${
                state.activeTab === 'account'
                  ? 'text-[#0D9488] font-extrabold'
                  : 'text-slate-500 font-medium'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">Me</span>
            </button>
          </div>
        </nav>

        {/* =================================================================== */}
        {/* MODALS                                                              */}
        {/* =================================================================== */}

        {/* 1. BUYER LOGIN & REGISTRATION MODAL (WITH PROFILE PICTURE UPLOAD) */}
        {authModalOpen && (
          <div className="fixed inset-0 z-50 max-w-md mx-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="bg-white w-full rounded-3xl p-4 space-y-3.5 shadow-2xl max-h-[92dvh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                    UKAYO Account Access
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Sign in or register your Buyer account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE]">
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`py-2 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                    authTab === 'login'
                      ? 'bg-[#0D9488] text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className={`py-2 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                    authTab === 'register'
                      ? 'bg-[#2DD4BF] text-[#132A2E]'
                      : 'text-slate-600'
                  }`}
                >
                  Register Buyer
                </button>
              </div>

              {authTab === 'login' ? (
                <form onSubmit={handleBuyerLogin} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Email or Full Name
                    </label>
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
                  >
                    Log In to UKAYO
                  </button>

                  <div className="pt-1 border-t border-[#E2F2EE] space-y-2">
                    <button
                      type="button"
                      onClick={handleSendPasswordResetEmail}
                      className="w-full py-1.5 text-[11px] font-extrabold text-[#0D9488] hover:underline cursor-pointer"
                    >
                      Forgot Password? Send Gmail Reset / Set New Password
                    </button>

                    {resetEmailNotice && (
                      <div className="p-2.5 rounded-2xl bg-[#F4FAF8] border border-[#CBD5E1] space-y-2 text-[11px]">
                        <p className="text-[#132A2E] font-semibold leading-snug">
                          {resetEmailNotice.message}
                        </p>
                        {resetEmailNotice.consoleUrl && (
                          <a
                            href={resetEmailNotice.consoleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-[10px] font-extrabold text-[#0D9488] underline"
                          >
                            Open Firebase Console → Authentication → Sign-in method →
                          </a>
                        )}
                        {resetEmailNotice.newPassMode && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="password"
                              value={newResetPassword}
                              onChange={(e) => setNewResetPassword(e.target.value)}
                              placeholder="Enter new password now"
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-xs font-semibold"
                            />
                            <button
                              type="button"
                              onClick={handleConfirmDirectPasswordReset}
                              className="px-3 py-1.5 rounded-lg bg-[#0D9488] text-white text-[10px] font-extrabold cursor-pointer shrink-0"
                            >
                              Update Password
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBuyerRegister} className="space-y-2.5">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F4FAF8] border border-[#E2F2EE]">
                    <div className="w-12 h-12 rounded-full bg-[#0D9488] text-white flex items-center justify-center overflow-hidden shrink-0">
                      {regAvatar ? (
                        <img
                          src={regAvatar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-[#0D9488]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold text-[#132A2E]">
                        Buyer Profile Picture
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Upload a photo from your device
                      </div>
                    </div>
                    <label className="px-2.5 py-1.5 rounded-xl bg-[#0D9488] text-white text-[10px] font-extrabold cursor-pointer shrink-0">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleProfileAvatarUpload(e, 'reg')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Juan Dela Cruz"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Mobile / GCash
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0917-XXX-XXXX"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create password"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        City / Province
                      </label>
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="e.g. Cebu City"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Street / Barangay"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* EULA, Privacy Policy & Zero-Tolerance UGC Community Guidelines Checkbox */}
                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-[10px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regAgreedTerms}
                      onChange={(e) => setRegAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#0D9488]"
                    />
                    <span className="leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setPrivacyTermsTab('ugc');
                          setPrivacyTermsModalOpen(true);
                        }}
                        className="font-extrabold text-[#132A2E] underline cursor-pointer"
                      >
                        UKAYO Terms, Privacy Policy &amp; Zero-Tolerance UGC EULA
                      </button>{' '}
                      (no counterfeit items, abusive live streams, or joy-reserving).
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#2DD4BF] hover:bg-[#0D9488] text-[#132A2E] text-xs font-extrabold cursor-pointer"
                  >
                    Create Buyer Account
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* 2. EDIT BUYER PROFILE & PICTURE MODAL */}
        {editProfileOpen && (
          <div className="fixed inset-0 z-50 max-w-md mx-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <form
              onSubmit={saveBuyerProfile}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                  Edit Buyer Profile &amp; Picture
                </h3>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F4FAF8] border border-[#E2F2EE]">
                <div className="w-14 h-14 rounded-full bg-[#0D9488] text-white flex items-center justify-center overflow-hidden shrink-0">
                  {editAvatar ? (
                    <img
                      src={editAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-sm">{userInitials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-[#132A2E]">
                    Profile Photo
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Upload a new picture for your buyer account
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-[#0D9488] text-white text-[10px] font-extrabold cursor-pointer shrink-0">
                  Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProfileAvatarUpload(e, 'edit')}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Mobile / GCash
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#2DD4BF] text-white text-xs font-extrabold cursor-pointer"
              >
                Save Buyer Profile
              </button>
            </form>
          </div>
        )}

        {/* 3. COMMUNITY FEED COMPOSER MODAL (WITH PHOTO UPLOAD) */}
        {feedComposerOpen && (
          <div
            id="feed-composer-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={submitNewFeedPost}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                  Post to Ukay Feed
                </h3>
                <button
                  type="button"
                  onClick={() => setFeedComposerOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Upload Item Photo
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-[#94A3B8] bg-[#F4FAF8] cursor-pointer">
                  <span className="text-xs font-bold text-[#132A2E]">
                    {postImage ? '✓ Photo Attached' : 'Tap to upload ukay photo'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D9488] text-white text-[10px] font-extrabold">
                    Choose Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeedPhotoUpload}
                    className="hidden"
                  />
                </label>
                {postImage && (
                  <img
                    src={postImage}
                    alt="Feed Preview"
                    className="w-full h-32 object-cover rounded-xl mt-2 border border-[#E2F2EE]"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Item / Bale Name
                  </label>
                  <input
                    type="text"
                    id="post-item-title"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Vintage 90s Tee"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Price (PHP)
                  </label>
                  <input
                    type="number"
                    id="post-item-price"
                    value={postPrice}
                    onChange={(e) => setPostPrice(e.target.value)}
                    min="1"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    id="post-item-category"
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  >
                    {state.ukayPaborito.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={postCondition}
                    onChange={(e) => setPostCondition(e.target.value)}
                    placeholder="10/10 Like New"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Caption &amp; Measurements
                </label>
                <textarea
                  id="post-item-caption"
                  rows={2}
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Chest/Length dimensions, condition, and shipping note..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
              >
                Publish Post to Ukay Feed
              </button>
            </form>
          </div>
        )}

        {/* 4. SELLER FLASH DROP / PIN LIVE ITEM MODAL */}
        {liveDropModalOpen && (
          <div className="fixed inset-0 z-50 max-w-md mx-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <form
              onSubmit={submitLiveDropItem}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                  Pin New Item to Live Stream
                </h3>
                <button
                  type="button"
                  onClick={() => setLiveDropModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Item Photo
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-[#94A3B8] bg-[#F4FAF8] cursor-pointer">
                  <span className="text-xs font-bold text-[#132A2E]">
                    {dropImage ? '✓ Photo Attached' : 'Upload item photo'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D9488] text-white text-[10px] font-extrabold">
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDropImageUpload}
                    className="hidden"
                  />
                </label>
                {dropImage && (
                  <img
                    src={dropImage}
                    alt="Drop Preview"
                    className="w-full h-28 object-cover rounded-xl mt-2 border border-[#E2F2EE]"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={dropCode}
                    onChange={(e) => setDropCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-extrabold uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Item Title
                  </label>
                  <input
                    type="text"
                    value={dropTitle}
                    onChange={(e) => setDropTitle(e.target.value)}
                    placeholder="e.g. Korean Fleece Hoodie"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={dropPrice}
                    onChange={(e) => setDropPrice(e.target.value)}
                    min="1"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={dropSize}
                    onChange={(e) => setDropSize(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={dropCondition}
                    onChange={(e) => setDropCondition(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#2DD4BF] text-white text-xs font-extrabold cursor-pointer"
              >
                Pin Item to Live Stream
              </button>
            </form>
          </div>
        )}

        {/* 5. MY BAYONG CHECKOUT MODAL */}
        {checkoutOpen && (
          <div
            id="checkout-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={submitBayongCheckout}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[92dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                    Bayong Checkout
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Choose courier &amp; payment option
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  id="checkout-address"
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Courier Option
                </label>
                <select
                  id="checkout-courier"
                  value={checkoutCourier}
                  onChange={(e) => setCheckoutCourier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold"
                >
                  <option value="J&T Express">J&amp;T Express (Nationwide)</option>
                  <option value="LBC Express">LBC Express</option>
                  <option value="Lalamove">Lalamove Same-Day</option>
                  <option value="Maxim">Maxim Rider</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2.5 rounded-xl border border-[#E2F2EE] bg-[#F4FAF8] flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="checkout-pay-method"
                      value="COD"
                      checked={checkoutPayMethod === 'COD'}
                      onChange={() => setCheckoutPayMethod('COD')}
                      className="accent-[#0F766E]"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-[#132A2E]">COD</div>
                      <div className="text-[9px] text-slate-500">Cash on Delivery</div>
                    </div>
                  </label>
                  <label className="p-2.5 rounded-xl border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="checkout-pay-method"
                      value="BAYAD_AGAD"
                      checked={checkoutPayMethod === 'BAYAD_AGAD'}
                      onChange={() => setCheckoutPayMethod('BAYAD_AGAD')}
                      className="accent-[#2DD4BF]"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-[#132A2E]">
                        Bayad Agad
                      </div>
                      <div className="text-[9px] text-[#0D9488] font-bold">
                        E-Wallet Express
                      </div>
                    </div>
                  </label>
                </div>

                {checkoutPayMethod === 'BAYAD_AGAD' && (
                  <div
                    id="bayad-agad-ewallet-box"
                    className="p-3 rounded-2xl bg-[#F4FAF8] border border-[#2DD4BF]/40 space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-1.5" id="ewallet-options-grid">
                      {[
                        { name: 'GCash', label: 'GCash', badge: 'G', badgeCls: 'bg-[#0D9488] text-white' },
                        { name: 'Maya', label: 'Maya', badge: 'M', badgeCls: 'bg-[#2DD4BF] text-white' },
                        { name: 'GoTyme Bank', label: 'GoTyme', badge: 'GT', badgeCls: 'bg-[#F59E0B] text-[#132A2E]' },
                        { name: 'ShopeePay', label: 'ShopeePay', badge: 'SP', badgeCls: 'bg-[#EF4444] text-white' },
                      ].map((w) => {
                        const isSelected = selectedEWallet === w.name;
                        return (
                          <button
                            key={w.name}
                            type="button"
                            onClick={() => setSelectedEWallet(w.name)}
                            className={`p-2 rounded-xl ${
                              isSelected ? 'border-2 border-[#0D9488]' : 'border border-[#E2F2EE]'
                            } bg-white text-left flex items-center gap-2 cursor-pointer`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg ${w.badgeCls} font-display font-extrabold text-[10px] flex items-center justify-center shrink-0`}
                            >
                              {w.badge}
                            </span>
                            <div className="text-xs font-extrabold text-[#132A2E]">
                              {w.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Your E-Wallet Mobile / Ref No.
                      </label>
                      <input
                        type="text"
                        id="ewallet-sender-ref"
                        value={ewalletSenderRef}
                        onChange={(e) => setEwalletSenderRef(e.target.value)}
                        placeholder="09XX-XXX-XXXX or Ref #"
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E2F2EE] text-xs font-semibold text-[#132A2E]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-[#0D9488] text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">
                    Total Amount ({bayongTotalQty} items)
                  </div>
                  <div className="text-base font-display font-extrabold text-[#0D9488] tabular-price">
                    ₱{bayongGrandTotal.toLocaleString()}
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#2DD4BF] hover:bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
                >
                  {checkoutPayMethod === 'BAYAD_AGAD'
                    ? `Pay with ${selectedEWallet}`
                    : 'Place COD Order'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 6. TIKTOK-STYLE PRE-LIVE SETUP MODAL */}
        {liveSetupOpen && (
          <div
            id="live-setup-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={confirmStartLiveSession}
              className="bg-[#0D9488] text-white w-full rounded-3xl p-4 space-y-3.5 border border-slate-800 shadow-2xl max-h-[92dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping" />
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-white">
                      Go LIVE Setup
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Configure your stream title, cover &amp; pinned rack
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveSetupOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-3">
                <label className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/15 shrink-0 cursor-pointer group">
                  <img
                    id="live-setup-cover-preview"
                    src={
                      pendingLiveCoverData ||
                      activeLiveSeller?.liveStreamPreview ||
                      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80'
                    }
                    alt="Live Cover"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-extrabold text-center py-0.5 text-white">
                    Change Cover
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLiveCoverUpload}
                    className="hidden"
                  />
                </label>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#2DD4BF]">
                    Live Stream Title
                  </label>
                  <input
                    type="text"
                    id="live-setup-title"
                    value={liveSetupTitle}
                    onChange={(e) => setLiveSetupTitle(e.target.value)}
                    placeholder="Add an engaging title..."
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-[#2DD4BF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Ukay Category
                  </label>
                  <select
                    id="live-setup-category"
                    value={liveSetupCategory}
                    onChange={(e) => setLiveSetupCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white"
                  >
                    {state.ukayPaborito.map((c) => (
                      <option key={c.id} value={c.label} className="text-[#132A2E]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Camera Lens
                  </label>
                  <select
                    id="live-setup-camera"
                    value={liveSetupCamera}
                    onChange={(e) =>
                      setLiveSetupCamera(e.target.value as 'environment' | 'user')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white"
                  >
                    <option value="environment" className="text-[#132A2E]">
                      Rear Camera (Rack View)
                    </option>
                    <option value="user" className="text-[#132A2E]">
                      Front Camera (Selfie Host)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Starting Pinned Item
                  </label>
                  <select
                    id="live-setup-pinned-item"
                    value={liveSetupPinnedId}
                    onChange={(e) => setLiveSetupPinnedId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white"
                  >
                    {state.liveItems.length === 0 ? (
                      <option value="" className="text-[#132A2E]">
                        Add items in Live Room (+)
                      </option>
                    ) : (
                      state.liveItems.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          className="text-[#132A2E]"
                        >
                          {item.code} • {item.title} (₱{item.price})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Steal / Lock Timer
                  </label>
                  <select
                    id="live-setup-timer"
                    value={liveSetupTimer}
                    onChange={(e) => setLiveSetupTimer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white"
                  >
                    <option value="First Tap Locks (Instant)" className="text-[#132A2E]">
                      First Tap Locks (Instant)
                    </option>
                    <option value="15s Steal Window" className="text-[#132A2E]">
                      15s Steal Window
                    </option>
                    <option value="30s Steal Window" className="text-[#132A2E]">
                      30s Steal Window
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Pinned Host Rule / Promo Note
                </label>
                <input
                  type="text"
                  id="live-setup-rule"
                  value={liveSetupRule}
                  onChange={(e) => setLiveSetupRule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Go LIVE Now</span>
              </button>
            </form>
          </div>
        )}

        {/* 7. PHILIPPINE PRIMARY ID IDENTITY VERIFICATION MODAL */}
        {idVerifyOpen && (
          <div
            id="id-verify-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={submitIdVerification}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      Identity Verification
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Submit a Philippine Primary Government ID
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIdVerifyOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Accepted Primary ID (Philippines)
                </label>
                <select
                  id="verify-id-type"
                  value={verifyIdType}
                  onChange={(e) => setVerifyIdType(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold text-[#1E293B]"
                >
                  <option value="Philippine National ID (PhilSys / ePhilID)">
                    Philippine National ID (PhilSys / ePhilID)
                  </option>
                  <option value="Philippine Passport (DFA)">
                    Philippine Passport (DFA)
                  </option>
                  <option value="LTO Driver's License">
                    LTO Driver&apos;s License
                  </option>
                  <option value="Unified Multi-Purpose ID (UMID)">
                    Unified Multi-Purpose ID (UMID)
                  </option>
                  <option value="PRC Professional ID">PRC Professional ID</option>
                  <option value="Postal ID (Digitized)">Postal ID (Digitized)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Full Name on ID
                  </label>
                  <input
                    type="text"
                    id="verify-id-fullname"
                    value={verifyFullName}
                    onChange={(e) => setVerifyFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold text-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    ID Reference Number
                  </label>
                  <input
                    type="text"
                    id="verify-id-number"
                    value={verifyIdNumber}
                    onChange={(e) => setVerifyIdNumber(e.target.value)}
                    placeholder="e.g. 1234-5678-9012"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold text-[#1E293B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Upload Front of Primary ID
                </label>
                <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-[#E2F2EE] hover:border-[#0D9488] bg-[#F4FAF8] cursor-pointer transition text-center">
                  <UploadCloud className="w-5 h-5 text-[#132A2E] mb-1" />
                  <span className="text-[11px] font-bold text-[#132A2E]">
                    {verifyIdFileLabel}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleVerifyFilePreview(e, 'id')}
                    className="hidden"
                  />
                </label>
                {verifyIdPreview && (
                  <img
                    src={verifyIdPreview}
                    alt="Primary ID Preview"
                    className="w-full h-28 object-cover rounded-xl border border-[#E2F2EE]"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Upload Selfie Holding Your ID
                </label>
                <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-[#E2F2EE] hover:border-[#0D9488] bg-[#F4FAF8] cursor-pointer transition text-center">
                  <Camera className="w-5 h-5 text-[#0D9488] mb-1" />
                  <span className="text-[11px] font-bold text-[#132A2E]">
                    {verifySelfieFileLabel}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleVerifyFilePreview(e, 'selfie')}
                    className="hidden"
                  />
                </label>
                {verifySelfiePreview && (
                  <img
                    src={verifySelfiePreview}
                    alt="Selfie Preview"
                    className="w-full h-28 object-cover rounded-xl border border-[#E2F2EE]"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#2DD4BF] hover:bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
              >
                Submit Primary ID for Verification
              </button>
            </form>
          </div>
        )}

        {/* 8. UGC REPORT & BLOCK USER / CONTENT MODAL (Apple Guideline 1.2) */}
        {reportModalOpen && reportTarget && (
          <div
            id="ugc-report-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={submitUgcReport}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      Report or Block Content / User
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      UKAYO 24/7 Trust &amp; Safety Moderation
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs space-y-0.5">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Reporting {reportTarget.kind === 'live' ? 'Live Stream Host' : 'Ukay Feed Post'}
                </div>
                <div className="font-extrabold text-[#132A2E]">
                  {reportTarget.authorName} — {reportTarget.title}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-semibold text-[#1E293B]"
                >
                  <option value="Counterfeit / Misleading Ukay Item">
                    Counterfeit / Misleading Ukay Item
                  </option>
                  <option value="Inappropriate / Offensive Live Stream or Photo">
                    Inappropriate / Offensive Live Stream or Photo
                  </option>
                  <option value="Harassment, Bullying or Abusive Behavior">
                    Harassment, Bullying or Abusive Behavior
                  </option>
                  <option value="Scam / Off-Platform Payment Request">
                    Scam / Off-Platform Payment Request
                  </option>
                  <option value="Spam or Prohibited Merchandise">
                    Spam or Prohibited Merchandise
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Describe the issue for UKAYO Admin Ops (reviewed within 24 hours)..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs text-[#1E293B]"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
                >
                  Submit Report &amp; Hide Content
                </button>
                <button
                  type="button"
                  onClick={handleBlockUserFromModal}
                  className="w-full py-2.5 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-xs font-extrabold cursor-pointer"
                >
                  Block {reportTarget.authorName} Immediately
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 9. PERMANENT IN-APP ACCOUNT DELETION MODAL (Apple Guideline 5.1.1(v)) */}
        {deleteAccountModalOpen && (
          <div
            id="delete-account-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={handlePermanentDeleteAccount}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-[#EF4444]">
                      Delete Account &amp; Data
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Permanent In-App Account Deletion
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
                <div className="font-extrabold">
                  Warning: This action is permanent and cannot be undone.
                </div>
                <p className="text-[11px] leading-relaxed">
                  Deleting your account (<strong>{state.user.name}</strong> •{' '}
                  {state.user.email}) will permanently erase your buyer profile,
                  KYC verification records, seller storefront (if registered),
                  and active sessions from UKAYO and Firebase Firestore.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Type <span className="text-[#EF4444] font-extrabold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE in capital letters"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-xs font-extrabold text-[#132A2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(false)}
                  className="py-2.5 rounded-xl bg-[#F4FAF8] text-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 10. PRIVACY POLICY, TERMS OF SERVICE & UGC EULA MODAL (Apple Guideline 5.1.1(i) & 1.2) */}
        {privacyTermsModalOpen && (
          <div
            id="privacy-terms-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <div className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E2F2EE] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-[#132A2E]">
                      UKAYO Legal &amp; Privacy Center
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      PH Data Privacy Act (RA 10173) &amp; App Store EULA
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacyTermsModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4FAF8] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F4FAF8] border border-[#E2F2EE] text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setPrivacyTermsTab('privacy')}
                  className={`py-1.5 rounded-lg cursor-pointer ${
                    privacyTermsTab === 'privacy'
                      ? 'bg-[#0D9488] text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacyTermsTab('terms')}
                  className={`py-1.5 rounded-lg cursor-pointer ${
                    privacyTermsTab === 'terms'
                      ? 'bg-[#0D9488] text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Terms &amp; Escrow
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacyTermsTab('ugc')}
                  className={`py-1.5 rounded-lg cursor-pointer ${
                    privacyTermsTab === 'ugc'
                      ? 'bg-[#0D9488] text-white'
                      : 'text-slate-600'
                  }`}
                >
                  UGC &amp; Live EULA
                </button>
              </div>

              {privacyTermsTab === 'privacy' && (
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-[#F4FAF8] p-3 rounded-2xl border border-[#E2F2EE]">
                  <div className="font-extrabold text-[#132A2E]">
                    1. Philippine Data Privacy Act of 2012 (RA 10173) Compliance
                  </div>
                  <p>
                    UKAYO collects only the minimum personal information required to
                    process your preloved/ukay orders, delivery waybills, and optional
                    Philippine Primary ID / BIR RR 16-2023 seller verification.
                  </p>
                  <div className="font-extrabold text-[#132A2E] pt-1">
                    2. Camera, Microphone &amp; Photo Library Permissions
                  </div>
                  <p>
                    Camera and Microphone access are used exclusively when you initiate a
                    Live Ukay Selling broadcast via Agora WebRTC or upload item/profile
                    photos. UKAYO never records or accesses your camera in the background.
                  </p>
                  <div className="font-extrabold text-[#132A2E] pt-1">
                    3. Right to Erasure &amp; In-App Account Deletion
                  </div>
                  <p>
                    You may permanently delete your account and all associated personal
                    data at any time via <strong>My Account → Delete My Account &amp; Personal Data</strong>.
                  </p>
                </div>
              )}

              {privacyTermsTab === 'terms' && (
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-[#F4FAF8] p-3 rounded-2xl border border-[#E2F2EE]">
                  <div className="font-extrabold text-[#132A2E]">
                    1. &ldquo;MINE NA!&rdquo; Live &amp; Feed Order Locking
                  </div>
                  <p>
                    Tapping <strong>MINE NA!</strong> locks the preloved piece in your
                    Bayong. Buyers must complete checkout via COD or Bayad Agad (GCash /
                    Maya Escrow) within the seller&apos;s stated window to avoid
                    joy-reserver penalties.
                  </p>
                  <div className="font-extrabold text-[#132A2E] pt-1">
                    2. Buyer Protection &amp; BIR RR 16-2023 Seller Compliance
                  </div>
                  <p>
                    Payments made via Bayad Agad are held in escrow until parcel
                    delivery is confirmed. Verified sellers comply with BIR RR 16-2023
                    e-marketplace regulations (Starter Micro-Seller exemption ≤ ₱500,000
                    annual gross remittances or 1% creditable withholding tax on half of
                    gross remittances).
                  </p>
                </div>
              )}

              {privacyTermsTab === 'ugc' && (
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-[#F4FAF8] p-3 rounded-2xl border border-[#E2F2EE]">
                  <div className="font-extrabold text-[#132A2E]">
                    1. Zero-Tolerance Policy for Objectionable Content
                  </div>
                  <p>
                    UKAYO enforces a strict zero-tolerance policy against counterfeit
                    goods, explicit or abusive live streams, hate speech, harassment, and
                    fraudulent off-platform payment solicitation.
                  </p>
                  <div className="font-extrabold text-[#132A2E] pt-1">
                    2. Reporting &amp; Blocking Mechanism (24-Hour SLA)
                  </div>
                  <p>
                    Users can tap the <strong>Flag (Report / Block)</strong> icon on any
                    Ukay Feed post or Live Selling room to immediately hide offending
                    content, block the user, and alert UKAYO Trust &amp; Safety Admin Ops,
                    who review and remove violating content or terminate offending accounts
                    within 24 hours.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setPrivacyTermsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-extrabold cursor-pointer"
              >
                Close Legal &amp; Privacy Center
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
