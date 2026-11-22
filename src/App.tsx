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
  Edit3,
  Volume2,
  VolumeX,
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
  isLive: boolean;
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
  const [liveSetupCamera, setLiveSetupCamera] = useState<'environment' | 'user'>('environment');
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

  // Inputs for Live Chat, Feed Comments, Direct Chat
  const [liveChatInput, setLiveChatInput] = useState('');
  const [feedCommentInputs, setFeedCommentInputs] = useState<Record<string, string>>({});
  const [directChatInput, setDirectChatInput] = useState('');

  // Camera stream refs & real-time remote camera broadcast viewer state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const agoraRemoteVideoRef = useRef<HTMLDivElement | null>(null);
  const agoraAudienceCtrlRef = useRef<{
    leave: () => Promise<void>;
    setAudioMuted: (muted: boolean) => void;
  } | null>(null);
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [isAgoraRemoteVideoPlaying, setIsAgoraRemoteVideoPlaying] = useState(false);
  const [isAgoraRemoteAudioPlaying, setIsAgoraRemoteAudioPlaying] = useState(false);
  const [isLiveAudioMuted, setIsLiveAudioMuted] = useState(false);
  const [liveFacingMode, setLiveFacingMode] = useState<'environment' | 'user'>('environment');
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
          toSave = normalizeAndMergeUkayoState(state, existingParsed);
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2700);
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
      activeTab: prev.activeTab === 'home' && q.length > 0 ? 'feed' : prev.activeTab,
    }));
  };

  const browseUkayCategory = (catId: string) => {
    setState((prev) => ({
      ...prev,
      activeFeedCategory: catId,
      activeTab: 'feed',
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
    const targetId = sellerId || state.user.ownSellerId || state.sellers[0]?.id || '';
    if (!targetId) {
      showToast('No seller storefront available yet.', 'error');
      return;
    }
    setState((prev) => ({
      ...prev,
      activeStoreId: targetId,
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
  // LIVE SELLING & UKAY FEED FUNCTIONS (OPEN TO BOTH BUYERS & SELLERS)
  // =======================================================================
  const openLiveSetupModal = () => {
    if (!state.isAuthenticated && !state.user.email && !state.user.id) {
      showToast('Please log in or register first to start your Live Stream!', 'error');
      openAuthModal('login');
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
      showToast('Please log in or register first to start your Live Stream!', 'error');
      openAuthModal('login');
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
    if (!state.isAuthenticated) {
      showToast('Please log in or register as a Buyer to Mine live items!', 'error');
      openAuthModal('login');
      return;
    }
    const item = state.liveItems.find((i) => i.id === itemId);
    if (!item) return;
    const seller =
      state.sellers.find((s) => s.id === item.sellerId) || state.sellers[0];

    if (!item.winner) {
      const newOrder: MinedOrder = {
        id: 'ord_' + Date.now(),
        itemCode: item.code,
        title: item.title,
        price: item.price,
        quantity: 1,
        image: item.image,
        sellerId: seller ? seller.id : item.sellerId,
        sellerName: seller ? seller.name : state.user.shopName || 'Ukay Seller',
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

      setState((prev) => ({
        ...prev,
        liveItems: prev.liveItems.map((i) =>
          i.id === itemId ? { ...i, winner: prev.user.name } : i
        ),
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
      }));
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
    const seller =
      state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
      state.sellers[0];
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
    if (state.sellers.length <= 1) return;
    const current =
      state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
      state.sellers[0];
    if (!current) return;
    const others = state.sellers.filter((s) => s.id !== current.id);
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
    const id = Date.now() + Math.random();
    const right = 10 + Math.random() * 24;
    setHearts((prev) => [...prev, { id, right }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1700);
  };

  const handleLiveCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 700, 0.8);
    if (dataUrl) setPendingLiveCoverData(dataUrl);
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

    const agoraRes = await startAgoraHostBroadcast(
      hostSellerId,
      facing,
      videoRef.current
    );
    if (agoraRes.success && agoraRes.mediaStream) {
      liveStreamRef.current = agoraRes.mediaStream;
      setIsCameraStreaming(true);
      showToast(
        `LIVE on Agora Channel (${getAgoraChannelName(hostSellerId)}) — HD Video + Voice Active!`
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
      liveStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraStreaming(true);
      showToast('You are now LIVE on Mine Na!');
    } catch {
      setIsCameraStreaming(false);
      showToast('Live stream active! (Camera preview using cover backdrop).');
    }
  };

  const confirmStartLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setLiveFacingMode(cameraFacing);

    setState((prev) => {
      const updatedSellers = existingSeller
        ? prev.sellers.map((s) =>
            s.id === sellerId
              ? {
                  ...s,
                  isLive: true,
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
            id: 'lc_' + Date.now(),
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
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
      await stopAgoraHostBroadcast();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraStreaming(false);
      const hostSellerId =
        state.user.ownSellerId ||
        state.activeLiveSellerId ||
        'seller_' + state.user.id;
      if (hostSellerId) {
        publishLiveCameraFrame({
          sellerId: hostSellerId,
          sellerName: state.user.shopName || state.user.name || 'Ukay Host',
          isCameraLive: false,
          frameDataUrl: '',
          pinnedItemId: state.activePinnedItemId || '',
          liveTitle: liveSetupTitle || '',
          updatedAt: Date.now(),
        });
      }
      showToast('Live camera stopped.');
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
                  isLive: true,
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
              isLive: true,
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

  const claimStoreProduct = (sellerId: string, prodId: string) => {
    if (!state.isAuthenticated) {
      showToast('Please log in or register as a Buyer to Mine items!', 'error');
      openAuthModal('login');
      return;
    }
    const seller = state.sellers.find((s) => s.id === sellerId);
    const prod = seller?.products.find((p) => p.id === prodId);
    if (!seller || !prod) return;

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

  const openPerksModal = (kind: 'referral' | 'discounts' | 'vouchers') => {
    showToast(
      kind === 'referral'
        ? 'Invite friends to UKAYO and earn 50 Referral Points per verified miner!'
        : kind === 'discounts'
        ? 'Ukay Bale Discounts apply automatically at Bayong Checkout!'
        : 'Check Platform Vouchers in My Bayong Checkout.'
    );
  };

  const openAppReleaseModal = () => {
    showToast('UKAYO Mobile Web App ready! Tap "Add to Home Screen" on iOS or Android.');
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

  const activeLiveSeller: Seller | undefined =
    state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
    state.sellers.find((s) => s.isLive) ||
    state.sellers[0];

  // Subscribe to Agora Interactive Live Streaming channel as Audience when watching a seller's live room
  useEffect(() => {
    const sellerId = activeLiveSeller?.id || '';
    if (state.activeTab !== 'mine' || isCameraStreaming || !sellerId) {
      if (agoraAudienceCtrlRef.current) {
        agoraAudienceCtrlRef.current.leave();
        agoraAudienceCtrlRef.current = null;
      }
      setIsAgoraRemoteVideoPlaying(false);
      setIsAgoraRemoteAudioPlaying(false);
      return;
    }

    const ctrl = joinAgoraAudienceChannel(
      sellerId,
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
  }, [state.activeTab, activeLiveSeller?.id, isCameraStreaming]);

  // Subscribe to real-time remote camera frames for the active live seller
  useEffect(() => {
    const sellerId = activeLiveSeller?.id || '';
    if (!sellerId) {
      setRemoteLiveStream(null);
      return;
    }
    const unsub = subscribeToLiveCameraStream(sellerId, (streamData) => {
      setRemoteLiveStream(streamData);
    });
    return () => unsub();
  }, [activeLiveSeller?.id]);

  // Broadcast live camera frames to Firestore every 750ms while hosting camera live in Marketplace
  useEffect(() => {
    if (!isCameraStreaming) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    const interval = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !ctx) return;
      const hostSellerId =
        stateRef.current.activeLiveSellerId ||
        stateRef.current.user.ownSellerId ||
        'seller_' + (stateRef.current.user.id || 'host');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameDataUrl = canvas.toDataURL('image/jpeg', 0.52);
      publishLiveCameraFrame({
        sellerId: hostSellerId,
        sellerName:
          stateRef.current.user.shopName ||
          stateRef.current.user.name ||
          'Ukay Live Host',
        isCameraLive: true,
        frameDataUrl,
        pinnedItemId: stateRef.current.activePinnedItemId || '',
        liveTitle: liveSetupTitle || '',
        updatedAt: Date.now(),
      });
    }, 750);

    return () => window.clearInterval(interval);
  }, [isCameraStreaming, liveSetupTitle]);

  const sellerPinnedProduct = activeLiveSeller?.products?.find((p) => p.pinned);
  const activePinnedItem: LiveItem | undefined =
    (remoteLiveStream?.pinnedItemId
      ? state.liveItems.find((i) => i.id === remoteLiveStream.pinnedItemId)
      : undefined) ||
    (activeLiveSeller?.pinnedItemId
      ? state.liveItems.find((i) => i.id === activeLiveSeller.pinnedItemId)
      : undefined) ||
    (activeLiveSeller
      ? state.liveItems.find(
          (i) => i.sellerId === activeLiveSeller.id && i.pinned
        )
      : undefined) ||
    state.liveItems.find((i) => i.id === state.activePinnedItemId) ||
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
      : undefined) ||
    state.liveItems[0];

  const currentFollowerKey =
    state.user.id || state.user.email || 'guest_device';
  const isFollowingActiveLiveSeller = Boolean(
    activeLiveSeller &&
      ((Array.isArray(activeLiveSeller.followedBy) &&
        activeLiveSeller.followedBy.includes(currentFollowerKey)) ||
        activeLiveSeller.followed)
  );

  const activeStoreSeller: Seller | undefined =
    state.sellers.find((s) => s.id === state.activeStoreId) || state.sellers[0];

  const filteredFeedPosts = state.feedPosts.filter((p) => {
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
    <div className="bg-[#F4F6F9] text-[#1E293B] antialiased selection:bg-[#10B981]/20 min-h-[100dvh]">
      {/* Toast Notification Container */}
      <div
        id="toast-box"
        className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm flex flex-col gap-1.5 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-3.5 py-2.5 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
              t.type === 'error'
                ? 'bg-[#EF4444] text-white'
                : 'bg-[#070D17] text-white border border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                t.type === 'error' ? 'bg-white' : 'bg-[#10B981]'
              } shrink-0`}
            />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Mobile App Shell */}
      <div
        id="ukayo-app-shell"
        className="max-w-md mx-auto min-h-[100dvh] bg-[#F4F6F9] flex flex-col relative shadow-sm"
      >
        {/* TOP HEADER BAR (#070D17) */}
        {state.activeTab !== 'mine' && (
          <header
            id="main-app-header"
            className="sticky top-0 z-30 bg-[#070D17] text-white px-3 py-2.5 border-b border-slate-800/80"
          >
            <div className="flex items-center gap-1.5">
              {/* Crisp High-Contrast UKAYO Hanger Wordmark */}
              <button
                onClick={() => switchTab('home')}
                className="flex items-center shrink-0 cursor-pointer"
                title="UKAYO Home"
              >
                <svg
                  className="w-[70px] h-9 text-white"
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

              {/* Search Pill */}
              <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1.5 text-[#1E293B] min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                <input
                  type="text"
                  id="global-search-input"
                  value={state.searchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  placeholder="Search ukay items, bales..."
                  className="w-full text-xs bg-transparent focus:outline-none truncate"
                />
              </div>

              {/* Customer Service Icon (Connect Buyer & Seller with Admin for Help) */}
              <button
                onClick={openCustomerServiceChat}
                className="relative p-1.5 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#070D17] shrink-0 cursor-pointer transition"
                title="Customer Service — Chat with Admin for Help"
              >
                <Headset className="w-4 h-4" />
              </button>

              {/* My Bayong Shortcut */}
              <button
                onClick={() => switchTab('bag')}
                className="relative p-1.5 text-white hover:text-[#10B981] shrink-0 cursor-pointer"
                title="My Bayong"
              >
                <ShoppingBag className="w-5 h-5" />
                <span
                  id="header-bag-badge"
                  className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-1 rounded-full bg-[#10B981] text-white text-[9px] font-bold flex items-center justify-center"
                >
                  {bayongTotalQty}
                </span>
              </button>

              {/* Direct Chat Shortcut */}
              <button
                onClick={() => switchTab('chat')}
                className="relative p-1.5 text-white hover:text-[#10B981] shrink-0 cursor-pointer"
                title="Messages"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#10B981]" />
              </button>

              {/* Header Login / User Status Pill */}
              {!state.isAuthenticated ? (
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-2.5 py-1 rounded-full bg-[#10B981] text-[#070D17] text-[10px] font-extrabold shrink-0 cursor-pointer"
                >
                  Log In
                </button>
              ) : (
                <button
                  onClick={() => switchTab('account')}
                  className="w-7 h-7 rounded-full overflow-hidden border border-[#10B981] bg-[#111827] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 cursor-pointer"
                  title={state.user.name}
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
                </button>
              )}
            </div>
          </header>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 pb-20">
          {/* TAB 1: "HOME" */}
          {state.activeTab === 'home' && (
            <section id="tab-home" className="space-y-3 pb-4">
              <div className="bg-[#070D17] px-3.5 pt-1 pb-5 rounded-b-3xl space-y-2.5">
                {/* Auth Welcome Banner if Not Logged In */}
                {!state.isAuthenticated && (
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white">
                        Welcome to UKAYO Marketplace!
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Register a Buyer account first, then apply as a Seller.
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openAuthModal('register')}
                        className="px-2.5 py-1.5 rounded-xl bg-[#10B981] text-[#070D17] text-[10px] font-extrabold cursor-pointer"
                      >
                        Register
                      </button>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Log In
                      </button>
                    </div>
                  </div>
                )}

                {/* 5 Uniform Brand-Palette Quick-Shortcut Icons */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 shadow-xs">
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    <button
                      onClick={() => openPerksModal('referral')}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#070D17] flex items-center justify-center group-active:scale-95 transition">
                        <Award className="w-5 h-5 text-[#F59E0B]" />
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">
                        Referral
                        <br />
                        Points
                      </span>
                    </button>

                    <button
                      onClick={() => openPerksModal('discounts')}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] flex items-center justify-center group-active:scale-95 transition">
                        <Percent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">
                        Ukay
                        <br />
                        Discounts
                      </span>
                    </button>

                    <button
                      onClick={() => openPerksModal('vouchers')}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center group-active:scale-95 transition">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">
                        Free
                        <br />
                        Vouchers
                      </span>
                    </button>

                    <button
                      onClick={handleBecomeSellerAction}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#070D17] text-[#F59E0B] flex items-center justify-center group-active:scale-95 transition shadow-2xs">
                        <Store className="w-5 h-5" />
                      </div>
                      <span
                        id="home-become-seller-label"
                        className="text-[10px] font-bold text-[#070D17] leading-tight"
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
                            Ukayo Seller
                          </>
                        )}
                      </span>
                    </button>

                    <button
                      onClick={openCustomerServiceChat}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-[#070D17] flex items-center justify-center group-active:scale-95 transition">
                        <Headset className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">
                        Customer
                        <br />
                        Service
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-3.5 space-y-3">
                {/* Side-by-Side UKAYO LIVE & UKAY FEED Preview Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2.5 shadow-2xs space-y-2">
                    <button
                      onClick={() => switchTab('mine')}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="text-xs font-display font-extrabold text-[#EF4444] tracking-tight">
                        UKAYO LIVE
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {state.sellers.length === 0 ? (
                      <div
                        onClick={() => switchTab('mine')}
                        className="rounded-xl bg-[#070D17] text-white p-3 aspect-[8/5] flex flex-col items-center justify-center text-center cursor-pointer"
                      >
                        <Radio className="w-5 h-5 text-[#EF4444] mb-1" />
                        <div className="text-[10px] font-extrabold">No Live Streams Yet</div>
                        <div className="text-[9px] text-slate-400">
                          Register as Seller to Go LIVE
                        </div>
                      </div>
                    ) : (
                      <div id="home-live-previews" className="grid grid-cols-2 gap-1.5">
                        {state.sellers.slice(0, 2).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openLiveRoomForSeller(s.id)}
                            className="relative rounded-xl overflow-hidden aspect-[4/5] bg-[#111827] text-left group cursor-pointer"
                          >
                            <img
                              src={s.liveStreamPreview}
                              alt={s.name}
                              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#EF4444] text-white text-[8px] font-extrabold uppercase">
                              LIVE
                            </span>
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <div className="text-[10px] font-bold text-white truncate">
                                {s.name}
                              </div>
                              <div className="text-[8px] text-[#10B981] font-semibold truncate">
                                {s.liveCategory}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2.5 shadow-2xs space-y-2">
                    <button
                      onClick={() => switchTab('feed')}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="text-xs font-display font-extrabold text-[#070D17] tracking-tight">
                        UKAY FEED
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {state.feedPosts.length === 0 ? (
                      <div
                        onClick={() => switchTab('feed')}
                        className="rounded-xl bg-[#F4F6F9] border border-dashed border-[#CBD5E1] p-3 aspect-[8/5] flex flex-col items-center justify-center text-center cursor-pointer"
                      >
                        <ImageIcon className="w-5 h-5 text-[#10B981] mb-1" />
                        <div className="text-[10px] font-extrabold text-[#070D17]">
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
                            className="relative rounded-xl overflow-hidden aspect-[4/5] bg-slate-100 text-left group cursor-pointer"
                          >
                            <img
                              src={p.image}
                              alt={p.itemTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#070D17]/85 text-[#10B981] text-[8px] font-extrabold tabular-price">
                              ₱{p.price}
                            </span>
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <div className="text-[10px] font-bold text-white truncate">
                                {p.itemTitle}
                              </div>
                              <div className="text-[8px] text-slate-300 truncate">
                                {p.authorName}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ukay Paborito Picture-Icon Grid (Synced & Editable in Admin Center) */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-display font-extrabold uppercase tracking-wider text-[#070D17]">
                      Ukay Paborito
                    </h2>
                    <button
                      onClick={() => switchTab('feed')}
                      className="text-[11px] font-bold text-[#10B981] cursor-pointer"
                    >
                      Browse All
                    </button>
                  </div>
                  <div id="home-categories-grid" className="grid grid-cols-3 gap-2">
                    {state.ukayPaborito.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => browseUkayCategory(c.id)}
                        className="rounded-xl border border-[#E2E8F0] bg-[#F4F6F9] hover:border-[#070D17] overflow-hidden text-center group cursor-pointer transition"
                      >
                        <div className="aspect-square w-full overflow-hidden bg-white">
                          <img
                            src={c.image}
                            alt={c.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="py-1.5 px-1 text-[10px] font-bold text-[#070D17] truncate">
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
            <section id="tab-feed" className="px-3.5 pt-3 space-y-3 pb-4">
              {/* Compact Live Stories Strip */}
              {state.sellers.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#070D17]">
                      Live Bales &amp; Active Tindahan
                    </span>
                    <button
                      onClick={() => switchTab('mine')}
                      className="text-[10px] font-bold text-[#EF4444] cursor-pointer"
                    >
                      Watch All Live →
                    </button>
                  </div>
                  <div
                    id="feed-stories-strip"
                    className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5"
                  >
                    {state.sellers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => openLiveRoomForSeller(s.id)}
                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#EF4444] to-[#F59E0B]">
                          <div className="w-10 h-10 rounded-full bg-[#070D17] text-white font-display font-extrabold text-xs flex items-center justify-center border-2 border-white overflow-hidden">
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
                          {s.isLive && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded bg-[#EF4444] text-white text-[7px] font-extrabold uppercase">
                              LIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-[#1E293B] max-w-[64px] truncate">
                          {s.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Feed Composer */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#070D17] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
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
                    className="flex-1 text-left px-3.5 py-2 rounded-full bg-[#F4F6F9] hover:bg-slate-200/70 text-xs text-slate-500 font-medium cursor-pointer transition"
                  >
                    What&apos;s your ukay drop or looking-for today?
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-[11px] font-bold text-[#1E293B]">
                  <button
                    onClick={() => {
                      if (!isUserSignedIn) {
                        openAuthModal('login');
                        return;
                      }
                      setFeedComposerOpen(true);
                    }}
                    className="py-1.5 rounded-xl hover:bg-[#F4F6F9] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#10B981]" />
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
                    className="py-1.5 rounded-xl hover:bg-[#F4F6F9] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Post Item</span>
                  </button>
                  <button
                    onClick={() => switchTab('mine')}
                    className="py-1.5 rounded-xl hover:bg-[#F4F6F9] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Live Drops</span>
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
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 cursor-pointer transition ${
                        active
                          ? 'bg-[#070D17] text-white'
                          : 'bg-white text-[#1E293B] border border-[#E2E8F0]'
                      }`}
                    >
                      {c === 'ALL' ? 'All Drops' : catObj?.label || c}
                    </button>
                  );
                })}
              </div>

              {/* Community Posts Feed */}
              <div id="feed-posts-list" className="space-y-3">
                {filteredFeedPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F6F9] text-[#070D17] flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <h3 className="text-sm font-display font-extrabold text-[#070D17]">
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
                      className="px-4 py-2 rounded-xl bg-[#070D17] text-white text-xs font-extrabold cursor-pointer"
                    >
                      + Create First Feed Post
                    </button>
                  </div>
                ) : (
                  filteredFeedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs"
                    >
                      <div className="p-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openSellerStore(post.sellerId)}
                          className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#070D17] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
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
                            <div className="text-xs font-extrabold text-[#070D17] group-hover:underline truncate">
                              {post.authorName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {post.authorRole} • {post.timeAgo}
                            </div>
                          </div>
                        </button>
                        <span className="px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[9px] font-extrabold shrink-0">
                          {post.condition}
                        </span>
                      </div>

                      <div className="px-3 pb-2.5 space-y-1.5">
                        <p className="text-xs text-[#1E293B] leading-relaxed">
                          {post.caption}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(post.tags || []).map((t, i) => (
                            <span key={i} className="text-[10px] font-bold text-[#10B981]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="relative bg-[#F4F6F9]">
                        <img
                          src={post.image}
                          alt={post.itemTitle}
                          className="w-full max-h-72 object-cover"
                        />
                        <div className="p-2.5 bg-[#070D17] text-white flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{post.itemTitle}</div>
                            <div className="text-sm font-display font-extrabold text-[#10B981] tabular-price">
                              ₱{post.price}
                            </div>
                          </div>
                          {post.minedBy ? (
                            <span className="px-3 py-1.5 rounded-xl bg-[#F59E0B] text-[#070D17] text-[11px] font-extrabold shrink-0">
                              Mined by {post.minedBy}
                            </span>
                          ) : (
                            <button
                              onClick={() => claimFeedPost(post.id)}
                              className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-extrabold shrink-0 cursor-pointer"
                            >
                              MINE NA!
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">
                        <button
                          onClick={() => toggleLikePost(post.id)}
                          className={`inline-flex items-center gap-1 font-bold ${
                            post.liked ? 'text-[#EF4444]' : 'text-slate-600'
                          } cursor-pointer`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${post.liked ? 'fill-current' : ''}`}
                          />
                          <span>{post.likes} Likes</span>
                        </button>
                        <span>{post.comments.length} Comments</span>
                      </div>

                      <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 pt-2">
                        {post.comments.map((c, idx) => (
                          <div
                            key={idx}
                            className="bg-[#F4F6F9] rounded-xl px-2.5 py-1.5 text-[11px]"
                          >
                            <span className="font-extrabold text-[#070D17]">{c.user}:</span>{' '}
                            <span className="text-[#1E293B]">{c.text}</span>
                          </div>
                        ))}
                        <form
                          onSubmit={(e) => addFeedComment(e, post.id)}
                          className="flex items-center gap-1.5 pt-1"
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
                            className="flex-1 px-3 py-1.5 rounded-full bg-[#F4F6F9] border border-[#E2E8F0] text-[11px] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-full bg-[#070D17] text-white text-[10px] font-bold cursor-pointer"
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

          {/* TAB 3: "MINE NA!" (TIKTOK LIVE SELLING ROOM) */}
          {state.activeTab === 'mine' && (
            <section
              id="tab-mine"
              onTouchStart={handleLiveTouchStart}
              onTouchEnd={handleLiveTouchEnd}
              onWheel={handleLiveWheel}
              className="fixed inset-0 z-20 max-w-md mx-auto bg-[#070D17] text-white flex flex-col justify-between overflow-hidden select-none overscroll-none touch-none"
            >
              {/* Video / Visual Backdrop (Local Camera -> Agora Remote WebRTC Video -> Firestore Frame Stream -> Pinned Product / Cover) */}
              {activeLiveSeller && (
                <img
                  id="live-fallback-bg"
                  src={
                    remoteLiveStream?.isCameraLive && remoteLiveStream.frameDataUrl
                      ? remoteLiveStream.frameDataUrl
                      : activePinnedItem?.image &&
                        activeLiveSeller.liveStreamPreview === activeLiveSeller.avatar
                      ? activePinnedItem.image
                      : activeLiveSeller.liveStreamPreview ||
                        activePinnedItem?.image ||
                        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
                  }
                  alt="Live Ukay Stream"
                  className={`absolute inset-0 w-full h-full object-cover ${
                    remoteLiveStream?.isCameraLive && remoteLiveStream.frameDataUrl
                      ? 'opacity-100'
                      : 'opacity-85'
                  } ${
                    isCameraStreaming || isAgoraRemoteVideoPlaying ? 'hidden' : ''
                  }`}
                />
              )}
              <div
                ref={agoraRemoteVideoRef}
                id="agora-remote-video-stage"
                className={`absolute inset-0 w-full h-full overflow-hidden ${
                  isAgoraRemoteVideoPlaying && !isCameraStreaming ? '' : 'hidden'
                }`}
              />
              <video
                ref={videoRef}
                id="live-camera-video"
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${
                  isCameraStreaming ? '' : 'hidden'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/90 pointer-events-none" />

              {/* Top TikTok Live Overlay */}
              <div className="relative z-10 p-3 pt-3.5 flex items-center justify-between gap-2">
                {activeLiveSeller ? (
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full pl-1.5 pr-2 py-1 border border-white/15 min-w-0">
                    <button
                      onClick={() => openSellerStore(activeLiveSeller.id)}
                      className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#070D17] font-display font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {activeLiveSeller.avatar ? (
                          <img
                            src={activeLiveSeller.avatar}
                            alt={activeLiveSeller.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          activeLiveSeller.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          id="live-host-name"
                          className="text-[11px] font-extrabold text-white truncate"
                        >
                          {activeLiveSeller.name}
                        </div>
                        <div
                          id="live-host-category"
                          className="text-[9px] text-[#10B981] font-bold truncate"
                        >
                          {activeLiveSeller.liveTitle ||
                            activeLiveSeller.liveCategory ||
                            'Ukay Live'}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowCurrentLiveSeller();
                      }}
                      id="live-follow-btn"
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 cursor-pointer transition ${
                        isFollowingActiveLiveSeller
                          ? 'bg-[#10B981] text-[#070D17]'
                          : 'bg-[#EF4444] text-white hover:bg-red-600'
                      }`}
                    >
                      {isFollowingActiveLiveSeller ? '✓ Following' : '+ Follow'}
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-xs font-extrabold">
                    UKAYO Live Studio
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  {(isCameraStreaming ||
                    isAgoraRemoteVideoPlaying ||
                    remoteLiveStream?.isCameraLive) && (
                    <div className="px-2.5 py-1 rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold inline-flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>
                        {isAgoraRemoteVideoPlaying || isCameraStreaming
                          ? 'AGORA LIVE'
                          : 'LIVE CAM'}
                      </span>
                    </div>
                  )}
                  {activeLiveSeller &&
                    !isCameraStreaming &&
                    !isAgoraRemoteVideoPlaying &&
                    !remoteLiveStream?.isCameraLive && (
                      <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[10px] font-extrabold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
                        <span>LIVE</span>
                      </div>
                    )}
                  <button
                    onClick={() => switchTab('home')}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer"
                    title="Exit Live"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Center Empty State if No Seller is Live Yet */}
              {!activeLiveSeller && !isCameraStreaming ? (
                <div className="relative z-10 px-6 text-center space-y-3 my-auto">
                  <div className="w-14 h-14 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[#EF4444]">
                    <Radio className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-display font-extrabold">
                    No Active Live Streams Right Now
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Start your own Live Stream right here in the Marketplace! Both Buyers and Sellers can turn on their camera and pin ukay drops.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={openLiveSetupModal}
                      className="w-full py-3 rounded-2xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      Start My Live Stream Now
                    </button>
                    {!isSellerAccount && (
                      <button
                        onClick={handleBecomeSellerAction}
                        className="w-full py-2.5 rounded-2xl bg-[#F59E0B] text-[#070D17] text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                      >
                        Register Official Seller Shop (Optional)
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
              ) : (
                state.sellers.length > 1 && (
                  <div className="relative z-10 flex justify-center">
                    <button
                      onClick={switchToNextRelatedLive}
                      className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronsUp className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Swipe up for next live room</span>
                    </button>
                  </div>
                )
              )}

              {/* Bottom TikTok Live HUD */}
              <div className="relative z-10 px-3 pb-20 space-y-2.5">
                <div id="floating-hearts-container" className="relative h-0">
                  {hearts.map((h) => (
                    <div
                      key={h.id}
                      style={{ right: `${h.right}px` }}
                      className="floating-heart text-[#EF4444] text-xl"
                    >
                      ❤️
                    </div>
                  ))}
                </div>

                <div className="flex items-end justify-between gap-2">
                  {/* Bottom-Left Live Comments */}
                  <div
                    ref={liveChatBoxRef}
                    id="live-chat-messages"
                    className="flex-1 max-h-36 overflow-y-auto no-scrollbar touch-pan-y flex flex-col gap-1.5 pr-1"
                  >
                    {state.liveChat.slice(-18).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="inline-flex items-start gap-1.5 bg-black/55 backdrop-blur-xs rounded-2xl px-2.5 py-1 text-[11px] max-w-full border border-white/10"
                      >
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase shrink-0 mt-0.5 ${
                            m.badge === 'HOST'
                              ? 'bg-[#EF4444] text-white'
                              : m.badge === 'LOCKED'
                              ? 'bg-[#10B981] text-white'
                              : 'bg-[#F59E0B] text-[#070D17]'
                          }`}
                        >
                          {m.badge}
                        </span>
                        <p className="text-white leading-snug break-words">
                          <span className="font-bold text-slate-200">{m.sender}:</span>{' '}
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Right Vertical Action Rail (Available to Both Buyers & Sellers to Go Live & Pin Items) */}
                  <div className="flex flex-col items-center gap-2.5 shrink-0">
                    <button
                      onClick={toggleCameraLive}
                      id="tiktok-cam-btn"
                      className={`w-9 h-9 rounded-full ${
                        isCameraStreaming ? 'bg-[#EF4444]' : 'bg-black/50'
                      } backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer`}
                      title="Go Live Camera (Buyer or Seller)"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    <button
                      onClick={flipLiveCamera}
                      className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={openSellerDropModal}
                      id="tiktok-seller-drop-btn"
                      className="flex w-9 h-9 rounded-full bg-[#F59E0B] text-[#070D17] items-center justify-center shadow-md cursor-pointer"
                      title="Pin New Live Item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleLiveAudienceAudio}
                      className={`w-9 h-9 rounded-full ${
                        !isLiveAudioMuted && isAgoraRemoteAudioPlaying
                          ? 'bg-[#10B981] text-[#070D17]'
                          : 'bg-black/50 text-white'
                      } backdrop-blur-md border border-white/15 flex items-center justify-center cursor-pointer`}
                      title={isLiveAudioMuted ? 'Unmute Live Audio' : 'Mute Live Audio'}
                    >
                      {isLiveAudioMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={triggerLiveReaction}
                      className="w-10 h-10 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg active:scale-90 transition cursor-pointer"
                      title="Send Love"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Pinned Item Card with Unique MINE NA! Button */}
                {activePinnedItem ? (
                  <div id="live-pinned-item-card">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-white flex items-center gap-2.5">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={activePinnedItem.image}
                          alt={activePinnedItem.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#070D17] text-white text-[9px] font-extrabold">
                          {activePinnedItem.code}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-extrabold text-[#070D17] truncate">
                          {activePinnedItem.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {activePinnedItem.size} • {activePinnedItem.condition}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-display font-extrabold text-[#10B981] tabular-price">
                            ₱{activePinnedItem.price}
                          </span>
                          {activePinnedItem.winner ? (
                            <span className="px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#070D17] text-[9px] font-extrabold truncate">
                              Mined: {activePinnedItem.winner}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-[#10B981]">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => claimLiveItem(activePinnedItem.id)}
                        className={`px-3 py-2.5 rounded-xl ${
                          activePinnedItem.winner
                            ? activePinnedItem.winner === state.user.name
                              ? 'bg-[#F59E0B] text-[#070D17]'
                              : 'bg-[#070D17] text-white'
                            : 'bg-[#10B981] hover:bg-emerald-600 text-white'
                        } text-[11px] font-extrabold shrink-0 cursor-pointer shadow-sm`}
                      >
                        {activePinnedItem.winner
                          ? activePinnedItem.winner === state.user.name
                            ? 'LOCKED!'
                            : 'STEAL'
                          : 'MINE NA!'}
                      </button>
                    </div>
                  </div>
                ) : (
                  isSellerAccount && (
                    <button
                      onClick={openSellerDropModal}
                      className="w-full py-2.5 rounded-2xl bg-[#F59E0B] text-[#070D17] text-xs font-extrabold cursor-pointer shadow-md"
                    >
                      + Pin First Item to Live Rack
                    </button>
                  )
                )}

                {/* Live Comment Input Bar */}
                <form onSubmit={sendLiveChat} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => switchTab('bag')}
                    className="w-9 h-9 rounded-full bg-[#F59E0B] text-[#070D17] flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                    title="My Bayong"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    id="live-chat-input"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder="Say something or ask measurements..."
                    className="flex-1 px-3.5 py-2 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-xs text-white placeholder-slate-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-full bg-[#10B981] text-white text-xs font-extrabold shrink-0 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* TAB 4: "NASA TINDAHAN" (SELLER STOREFRONT PORTAL) */}
          {state.activeTab === 'store' && (
            <section id="tab-store" className="px-3.5 pt-3 space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => switchTab('feed')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#070D17] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Feed</span>
                </button>
                <span className="text-xs font-display font-extrabold uppercase tracking-wider text-[#070D17]">
                  Nasa Tindahan
                </span>
                {isSellerAccount ? (
                  <button
                    onClick={openSellerDropModal}
                    id="store-add-product-btn"
                    className="px-2.5 py-1 rounded-lg bg-[#10B981] text-white text-[10px] font-extrabold cursor-pointer"
                  >
                    + Add Item
                  </button>
                ) : (
                  <span className="w-12" />
                )}
              </div>

              {!activeStoreSeller ? (
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center space-y-2.5">
                  <Store className="w-8 h-8 text-[#F59E0B] mx-auto" />
                  <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                    No Active Seller Storefront Yet
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register as a Seller to launch your own Nasa Tindahan storefront!
                  </p>
                </div>
              ) : (
                <>
                  <div id="storefront-hero">
                    <div className="bg-[#070D17] text-white rounded-3xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-slate-700 text-[#F59E0B] font-display font-extrabold text-base flex items-center justify-center shrink-0 overflow-hidden">
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
                                <span className="px-1.5 py-0.2 rounded bg-[#EF4444] text-white text-[8px] font-extrabold uppercase shrink-0">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {activeStoreSeller.city} • {activeStoreSeller.rating} ★ •{' '}
                              {activeStoreSeller.followers.toLocaleString()} Followers
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFollowStore(activeStoreSeller.id)}
                          className={`px-3.5 py-1.5 rounded-xl ${
                            activeStoreSeller.followed
                              ? 'bg-white/15 text-white'
                              : 'bg-[#10B981] text-white'
                          } text-xs font-extrabold shrink-0 cursor-pointer`}
                        >
                          {activeStoreSeller.followed ? 'Following' : 'Follow'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {activeStoreSeller.bio}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => openLiveRoomForSeller(activeStoreSeller.id)}
                          className="flex-1 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-extrabold cursor-pointer"
                        >
                          Watch Live Room
                        </button>
                        <button
                          onClick={() => openDirectChatWithSeller(activeStoreSeller.id)}
                          className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold cursor-pointer"
                        >
                          Chat Seller
                        </button>
                      </div>
                    </div>
                  </div>

                  {activeStoreSeller.products.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-xs text-slate-500">
                      No items listed in this Tindahan rack yet.
                    </div>
                  ) : (
                    <div id="storefront-products-grid" className="grid grid-cols-2 gap-2.5">
                      {activeStoreSeller.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs flex flex-col"
                        >
                          <button
                            onClick={() => claimStoreProduct(activeStoreSeller.id, prod.id)}
                            className="relative aspect-square bg-[#F4F6F9] overflow-hidden cursor-pointer text-left"
                          >
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-full h-full object-cover"
                            />
                            <span
                              className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                prod.status === 'Available'
                                  ? 'bg-[#10B981] text-white'
                                  : 'bg-[#F59E0B] text-[#070D17]'
                              }`}
                            >
                              {prod.status}
                            </span>
                          </button>
                          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="text-xs font-bold text-[#070D17] line-clamp-2">
                                {prod.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {prod.size}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <span className="text-sm font-display font-extrabold text-[#10B981] tabular-price">
                                ₱{prod.price}
                              </span>
                              <button
                                onClick={() => claimStoreProduct(activeStoreSeller.id, prod.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#070D17] hover:bg-[#10B981] text-white text-[10px] font-extrabold cursor-pointer transition"
                              >
                                MINE NA!
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* TAB 5: "MY BAYONG" */}
          {state.activeTab === 'bag' && (
            <section id="tab-bag" className="px-3.5 pt-3 space-y-3 pb-24">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-display font-extrabold text-[#070D17]">
                    My Bayong
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Review your mined pieces before checkout
                  </p>
                </div>
                <span
                  id="bayong-item-count"
                  className="px-2.5 py-1 rounded-full bg-[#070D17] text-white text-[10px] font-extrabold"
                >
                  {bayongTotalQty} {bayongTotalQty === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div id="bayong-items-list" className="space-y-2.5">
                {bayongItems.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F6F9] text-[#070D17] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                      Your Bayong is empty
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tap <strong>MINE NA!</strong> in live streams or Ukay Feed to add items here.
                    </p>
                    <button
                      onClick={() => switchTab('feed')}
                      className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-extrabold cursor-pointer"
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
                        className="bg-white rounded-2xl border border-[#E2E8F0] p-3 shadow-2xs flex items-center gap-3"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover bg-[#F4F6F9] shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-extrabold text-[#070D17] line-clamp-2">
                              {item.title}
                            </div>
                            <button
                              onClick={() => removeBayongItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition shrink-0 cursor-pointer"
                              title="Remove from Bayong"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Seller:{' '}
                            <span className="font-bold text-[#070D17]">
                              {item.sellerName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-sm font-display font-extrabold text-[#10B981] tabular-price">
                              ₱{lineTotal.toLocaleString()}
                            </span>
                            <div className="inline-flex items-center gap-2 bg-[#F4F6F9] border border-[#E2E8F0] rounded-xl px-1.5 py-0.5">
                              <button
                                onClick={() => updateBayongQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white text-[#070D17] font-extrabold text-xs flex items-center justify-center shadow-2xs cursor-pointer"
                                title="Decrease Quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-extrabold text-[#070D17] min-w-[16px] text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateBayongQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-lg bg-[#070D17] text-white font-extrabold text-xs flex items-center justify-center cursor-pointer"
                                title="Increase Quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {bayongItems.length > 0 && (
                <div
                  id="bayong-checkout-bar"
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 shadow-md flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Bayong Total
                    </div>
                    <div
                      id="bayong-grand-total"
                      className="text-lg font-display font-extrabold text-[#070D17] tabular-price"
                    >
                      ₱{bayongGrandTotal.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={openCheckoutModal}
                    className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </section>
          )}

          {/* TAB 6: "CHAT" */}
          {state.activeTab === 'chat' && (
            <section id="tab-chat" className="px-3.5 pt-3 space-y-3 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-display font-extrabold text-[#070D17]">
                    Messages &amp; Customer Service
                  </h2>
                </div>
                <button
                  onClick={openCustomerServiceChat}
                  className="px-2.5 py-1.5 rounded-xl bg-[#F59E0B] text-[#070D17] text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Headset className="w-3.5 h-3.5" />
                  <span>Admin Help</span>
                </button>
              </div>

              {/* TWO-COLUMN SPLIT INBOX: VERTICAL PREVIOUS CHATS ON LEFT, THREAD ON RIGHT */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs grid grid-cols-12 h-[65dvh]">
                {/* Left Column: Vertical List of Previous Conversations */}
                <div className="col-span-5 border-r border-[#E2E8F0] bg-[#F8FAFC] flex flex-col overflow-hidden">
                  <div className="px-2.5 py-2 bg-[#070D17] text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between">
                    <span>Previous Chats</span>
                    <span className="px-1.5 py-0.2 rounded bg-white/15 text-[9px]">
                      {chatContacts.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
                    {chatContacts.map((c) => {
                      const isSelected = c.id === activeChatContact.id;
                      const lastMsg = c.messages[c.messages.length - 1];
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => openDirectChatWithSeller(c.id)}
                          className={`w-full p-2.5 text-left transition cursor-pointer block ${
                            isSelected
                              ? 'bg-white border-l-4 border-[#10B981]'
                              : 'hover:bg-white/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold text-[#070D17] truncate">
                              {c.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                                c.isSupport
                                  ? 'bg-[#F59E0B] text-[#070D17]'
                                  : 'bg-[#10B981]/15 text-[#065F46]'
                              }`}
                            >
                              {c.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-1">
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
                  <div className="px-3 py-2 bg-[#070D17] text-white flex items-center justify-between border-l border-slate-800">
                    <div className="min-w-0">
                      <div
                        id="chat-active-seller-name"
                        className="text-xs font-extrabold truncate"
                      >
                        {activeChatContact.name}
                      </div>
                      <div className="text-[9px] text-slate-300 truncate">
                        {activeChatContact.city}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#10B981] font-bold shrink-0">
                      ● Online
                    </span>
                  </div>

                  <div
                    ref={directChatBoxRef}
                    id="chat-messages-box"
                    className="flex-1 p-2.5 overflow-y-auto space-y-2 bg-[#F4F6F9]"
                  >
                    {activeChatContact.messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 space-y-1">
                        {activeChatContact.isSupport ? (
                          <>
                            <Headset className="w-6 h-6 text-[#F59E0B]" />
                            <div className="text-xs font-bold text-[#070D17]">
                              UKAYO Admin Customer Service
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Send a message below if you need help as a Buyer or Seller. Admin Ops will reply here!
                            </p>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-6 h-6 text-slate-400" />
                            <div className="text-xs font-bold text-[#070D17]">
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
                          ? '🎧 UKAYO CUSTOMER SERVICE (ADMIN)'
                          : isSellerReply
                          ? `🏪 SELLER • ${m.senderName || activeChatContact.name}`
                          : isSellerMode && activeChatContact.isSupport
                          ? `YOU (SELLER • ${state.user.shopName || state.user.name})`
                          : `YOU (BUYER • ${state.user.name || 'Miner'})`;

                        return (
                          <div
                            key={m.id || idx}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-2xs ${
                                isMine
                                  ? 'bg-[#070D17] text-white rounded-br-xs'
                                  : isCustomerServiceReply
                                  ? 'bg-[#ECFDF5] border-2 border-[#10B981] text-[#070D17] rounded-bl-xs'
                                  : 'bg-[#FFFBEB] border-2 border-[#F59E0B] text-[#070D17] rounded-bl-xs'
                              }`}
                            >
                              <div
                                className={`text-[9px] font-extrabold uppercase tracking-wider mb-0.5 ${
                                  isMine
                                    ? 'text-[#10B981]'
                                    : isCustomerServiceReply
                                    ? 'text-[#065F46]'
                                    : 'text-[#B45309]'
                                }`}
                              >
                                {roleBadgeText}
                              </div>
                              <p className="leading-snug break-words">{m.text}</p>
                              <div className="text-[9px] opacity-65 mt-1 text-right">
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
                    className="p-2 bg-white border-t border-[#E2E8F0] flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      id="direct-chat-input"
                      value={directChatInput}
                      onChange={(e) => setDirectChatInput(e.target.value)}
                      placeholder={
                        activeChatContact.isSupport
                          ? 'Ask Admin Customer Service for help...'
                          : 'Message seller...'
                      }
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-full bg-[#F4F6F9] border border-[#E2E8F0] text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-full bg-[#070D17] text-white text-xs font-extrabold shrink-0 cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* TAB 7: "MY ACCOUNT" */}
          {state.activeTab === 'account' && (
            <section id="tab-account" className="px-3.5 pt-3 space-y-3.5 pb-6">
              {/* Profile Header Card with Picture Upload */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <label
                      className="block w-16 h-16 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#10B981] p-[2.5px] cursor-pointer group"
                      title="Tap to upload buyer profile picture"
                    >
                      <div
                        id="account-avatar-initials"
                        className="w-full h-full rounded-full bg-[#070D17] text-white font-display font-extrabold text-lg flex items-center justify-center overflow-hidden relative"
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
                    <span
                      id="account-role-pill"
                      className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full ${
                        isSellerMode
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#F59E0B] text-[#070D17]'
                      } text-[8px] font-extrabold uppercase tracking-wider shadow-2xs`}
                    >
                      {isSellerAccount ? 'SELLER' : 'MINER'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        id="account-display-name"
                        className="text-base font-display font-extrabold text-[#070D17] truncate"
                      >
                        {!state.isAuthenticated
                          ? 'Guest Miner'
                          : `Hello, ${state.user.name.split(' ')[0]}!`}
                      </h3>
                      {state.isAuthenticated && (
                        <button
                          onClick={openEditProfileModal}
                          className="p-1.5 rounded-xl bg-[#F4F6F9] hover:bg-slate-200 text-[#070D17] text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Edit Profile & Photo"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <p id="account-email-line" className="text-xs text-slate-500 truncate">
                      {!state.isAuthenticated
                        ? 'Not logged in • Register or sign in below'
                        : `${state.user.email} • ${state.user.city}`}
                    </p>

                    {!state.isAuthenticated ? (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => openAuthModal('register')}
                          className="px-3 py-1.5 rounded-xl bg-[#10B981] text-[#070D17] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Register Buyer</span>
                        </button>
                        <button
                          onClick={() => openAuthModal('login')}
                          className="px-3 py-1.5 rounded-xl bg-[#070D17] text-white text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Log In</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <label className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#070D17] text-white text-[10px] font-bold cursor-pointer">
                          <Camera className="w-3 h-3 text-[#F59E0B]" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleProfileAvatarUpload(e, 'direct')}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={openIdVerifyModal}
                          id="account-verified-badge"
                          className={
                            actualVerificationStatus === 'verified' ||
                            actualVerificationStatus === 'pending'
                              ? 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold cursor-pointer'
                              : 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25 text-[10px] font-bold cursor-pointer'
                          }
                        >
                          {actualVerificationStatus === 'verified' ||
                          actualVerificationStatus === 'pending' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {actualVerificationStatus === 'verified'
                                  ? 'Verified ID'
                                  : 'ID Pending'}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Verify ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* REAL-TIME FIRESTORE STATUS INDICATOR (verificationStatus & sellerStatus) */}
                {state.isAuthenticated && (
                  <div
                    id="firestore-realtime-status-indicator"
                    className="mt-3.5 pt-3 border-t border-[#E2E8F0] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            firestoreLiveStatus.loading
                              ? 'bg-[#F59E0B] animate-pulse'
                              : firestoreLiveStatus.connected
                              ? 'bg-[#10B981]'
                              : 'bg-[#EF4444]'
                          }`}
                        />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#070D17]">
                          Live Firestore Account Status
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#070D17] text-[#10B981] text-[8px] font-mono font-bold">
                          {firestoreLiveStatus.fromServer ? 'SERVER' : 'SYNCED'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={refreshFirestoreStatusNow}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-[#070D17] cursor-pointer"
                        title="Fetch latest status directly from Firestore server"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${
                            firestoreLiveStatus.loading ? 'animate-spin' : ''
                          }`}
                        />
                        <span>{firestoreLiveStatus.lastSyncedAt}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-2xl bg-[#F4F6F9] border border-[#E2E8F0]">
                        <div className="text-[9px] font-bold uppercase text-slate-500">
                          Firestore verificationStatus
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-display font-extrabold text-[#070D17] capitalize">
                            {actualVerificationStatus}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              actualVerificationStatus === 'verified'
                                ? 'bg-[#10B981] text-[#070D17]'
                                : actualVerificationStatus === 'pending'
                                ? 'bg-[#F59E0B] text-[#070D17]'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {actualVerificationStatus === 'verified'
                              ? '✓ Verified'
                              : actualVerificationStatus === 'pending'
                              ? 'Pending'
                              : 'Unverified'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-[#F4F6F9] border border-[#E2E8F0]">
                        <div className="text-[9px] font-bold uppercase text-slate-500">
                          Firestore sellerStatus
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-display font-extrabold text-[#070D17] capitalize">
                            {actualSellerStatus}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              actualSellerStatus === 'approved'
                                ? 'bg-[#10B981] text-[#070D17]'
                                : actualSellerStatus === 'pending'
                                ? 'bg-[#F59E0B] text-[#070D17]'
                                : actualSellerStatus === 'rejected'
                                ? 'bg-[#EF4444] text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {actualSellerStatus === 'approved'
                              ? '✓ Approved'
                              : actualSellerStatus === 'pending'
                              ? 'Pending KYC'
                              : actualSellerStatus === 'rejected'
                              ? 'Re-upload'
                              : 'Buyer Only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Become a Ukayo Seller Card (Directs to Seller Registration Page when Apply Now is clicked) */}
              <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3
                        id="account-seller-banner-title"
                        className="text-sm font-display font-extrabold text-[#070D17] truncate"
                      >
                        {isSellerAccount
                          ? state.user.shopName || 'Seller Mode Active'
                          : 'Become an Ukayo Seller'}
                      </h3>
                      {isSellerAccount && (
                        <span
                          id="account-seller-status-badge"
                          className="px-2 py-0.5 rounded-full bg-[#10B981] text-white text-[9px] font-extrabold uppercase tracking-wider shrink-0"
                        >
                          Registered Seller
                        </span>
                      )}
                    </div>
                    <p
                      id="account-seller-banner-desc"
                      className="text-[11px] text-[#1E293B] leading-snug"
                    >
                      {isSellerAccount
                        ? 'Switch between shopping as a Miner or Live-Selling & Posting as a Seller.'
                        : 'Register your shop on the UKAYO Seller Registration Page to unlock Seller Center & Go Live!'}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#070D17] shrink-0">
                    <Store className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                </div>

                {!isSellerAccount ? (
                  <div id="account-buyer-apply-actions" className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={launchSellerLiveInApp}
                        className="py-2 px-3 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Go LIVE Now (Buyer)</span>
                      </button>
                      <button
                        type="button"
                        onClick={launchSellerPostInApp}
                        className="py-2 px-3 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-[#070D17] text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Post on Ukay Feed</span>
                      </button>
                    </div>
                    <button
                      onClick={goToSellerRegistrationPage}
                      id="account-seller-banner-btn"
                      className="w-full py-2 px-4 rounded-xl bg-[#070D17] hover:bg-[#111827] text-white text-xs font-extrabold shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Apply Now (Official Seller Center Registration)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                    </button>
                  </div>
                ) : (
                  <div
                    id="account-seller-active-controls"
                    className="space-y-2.5 pt-2 border-t border-[#F59E0B]/30"
                  >
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white border border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => setMarketplaceMode('buyer')}
                        id="mode-btn-buyer"
                        className={
                          !isSellerMode
                            ? 'py-1.5 px-2 rounded-lg text-[11px] font-extrabold bg-[#070D17] text-white cursor-pointer transition'
                            : 'py-1.5 px-2 rounded-lg text-[11px] font-bold text-[#1E293B] hover:bg-[#F4F6F9] cursor-pointer transition'
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
                            ? 'py-1.5 px-2 rounded-lg text-[11px] font-extrabold bg-[#10B981] text-white cursor-pointer transition'
                            : 'py-1.5 px-2 rounded-lg text-[11px] font-bold text-[#1E293B] hover:bg-[#F4F6F9] cursor-pointer transition'
                        }
                      >
                        Seller Mode (Live/Post)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={launchSellerLiveInApp}
                        className="py-2 px-3 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Go LIVE Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={launchSellerPostInApp}
                        className="py-2 px-3 rounded-xl bg-[#070D17] hover:bg-[#111827] text-white text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Post on Feed</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* My Purchases Summary */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-display font-extrabold text-[#070D17]">
                    My Purchases
                  </h3>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        activePurchaseFilter: 'ALL',
                      }))
                    }
                    className="text-[10px] font-bold text-[#10B981] cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {(
                    [
                      {
                        key: 'TO_PAY',
                        label: 'To Pay',
                        icon: Wallet,
                        badgeClass: 'bg-[#EF4444] text-white',
                      },
                      {
                        key: 'TO_SHIP',
                        label: 'To Ship',
                        icon: Package,
                        badgeClass: 'bg-[#EF4444] text-white',
                      },
                      {
                        key: 'TO_RECEIVE',
                        label: 'To Receive',
                        icon: Truck,
                        badgeClass: 'bg-[#10B981] text-white',
                      },
                      {
                        key: 'TO_RATE',
                        label: 'To Rate',
                        icon: Star,
                        badgeClass: 'bg-[#F59E0B] text-[#070D17]',
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
                        className={`relative p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition ${
                          active
                            ? 'bg-[#070D17] text-white'
                            : 'bg-[#F4F6F9] text-[#1E293B]'
                        }`}
                      >
                        {count > 0 && (
                          <span
                            className={`absolute top-1 right-1 min-w-[15px] h-3.5 px-1 rounded-full ${st.badgeClass} text-[9px] font-bold flex items-center justify-center`}
                          >
                            {count}
                          </span>
                        )}
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] font-bold">{st.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div id="account-orders-list" className="space-y-2.5 pt-1">
                  {visibleAccountOrders.length === 0 ? (
                    <div className="bg-[#F4F6F9] rounded-2xl border border-[#E2E8F0] p-4 text-center text-xs text-slate-500">
                      No orders in this status yet.
                    </div>
                  ) : (
                    visibleAccountOrders.map((o) => (
                      <div
                        key={o.id}
                        className="bg-[#F4F6F9] rounded-2xl border border-[#E2E8F0] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-[#070D17]">
                            {o.sellerName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-extrabold ${
                              o.stage === 'TO_PAY'
                                ? 'bg-[#F59E0B]/20 text-[#070D17]'
                                : o.stage === 'TO_SHIP'
                                ? 'bg-[#070D17] text-white'
                                : o.stage === 'TO_RECEIVE'
                                ? 'bg-[#10B981]/15 text-[#10B981]'
                                : 'bg-white text-slate-700'
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={o.image}
                            alt={o.title}
                            className="w-14 h-14 rounded-xl object-cover bg-white shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#070D17] truncate">
                              {o.title}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Qty: {o.quantity || 1} • {o.courier} • {o.paymentMethod}
                            </div>
                            <div className="text-sm font-display font-extrabold text-[#10B981] tabular-price mt-0.5">
                              ₱{(o.price * (o.quantity || 1)).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Account Settings List (Seller Center Link STRICTLY Hidden Unless User is Registered as Seller) */}
              <div className="space-y-2">
                <h3 className="text-xs font-display font-extrabold text-[#070D17] px-0.5">
                  Account Settings
                </h3>

                {/* ONLY REGISTERED SELLERS CAN SEE & ACCESS SELLER STOREFRONT & SELLER CENTER PORTAL */}
                {isSellerAccount && (
                  <>
                    <button
                      onClick={() => openSellerStore(state.user.ownSellerId)}
                      className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#070D17] transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#070D17]">
                            My Nasa Tindahan Shop
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Manage your ukay listings &amp; live storefront
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={openSellerCenterPortal}
                      className="w-full bg-[#070D17] text-white rounded-2xl border border-[#070D17] p-3 flex items-center justify-between gap-3 shadow-2xs hover:bg-[#111827] transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-[#070D17] flex items-center justify-center shrink-0">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-white">
                            UKAYO Seller Center (Web Portal)
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            Manage BIR docs, bulk rack, orders &amp; A6 waybills
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    </button>
                  </>
                )}

                <button
                  onClick={openEditProfileModal}
                  className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#070D17] transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#070D17]/10 text-[#070D17] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#070D17]">
                        Personal Information &amp; Profile Photo
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Upload profile picture, edit city, address &amp; contact
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <button
                  onClick={openIdVerifyModal}
                  className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#070D17] transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#070D17]">
                        Identity Verification (Philippine Primary ID)
                      </div>
                      <div
                        id="settings-verify-subtext"
                        className="text-[10px] text-slate-500 truncate"
                      >
                        {state.user.idType
                          ? `${state.user.idType} (${state.user.idNumber})`
                          : 'Upload valid PH Government ID & selfie'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <button
                  onClick={openCustomerServiceChat}
                  className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#070D17] transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                      <Headset className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#070D17]">
                        Customer Service (Connect with Admin)
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Get live help from UKAYO Admin Ops for Buyer or Seller issues
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* Log Out / Log In Button */}
                <button
                  onClick={handleAccountLogout}
                  id="account-logout-btn"
                  className={`w-full bg-white rounded-2xl border ${
                    state.isAuthenticated
                      ? 'border-[#EF4444]/30 hover:bg-[#EF4444]/5'
                      : 'border-[#10B981]/40 hover:bg-[#10B981]/5'
                  } p-3 flex items-center justify-between gap-3 shadow-2xs transition cursor-pointer text-left`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        state.isAuthenticated
                          ? 'bg-[#EF4444]/10 text-[#EF4444]'
                          : 'bg-[#10B981]/15 text-[#10B981]'
                      }`}
                    >
                      {state.isAuthenticated ? (
                        <LogOut className="w-4 h-4" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div
                        id="account-logout-label"
                        className={`text-xs font-bold ${
                          state.isAuthenticated ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}
                      >
                        {state.isAuthenticated ? 'Log Out' : 'Log In / Register Account'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {state.isAuthenticated
                          ? 'Sign out of your UKAYO account on this device'
                          : 'Sign in with your Buyer or Seller account'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      state.isAuthenticated ? 'text-[#EF4444]' : 'text-[#10B981]'
                    }`}
                  />
                </button>
              </div>
            </section>
          )}
        </main>

        {/* DOCKED 5-TAB BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-2 pt-1.5 pb-safe">
          <div className="grid grid-cols-5 items-center text-center">
            <button
              onClick={() => switchTab('home')}
              data-nav="home"
              className={`nav-tab-btn flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
                state.activeTab === 'home'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => switchTab('feed')}
              data-nav="feed"
              className={`nav-tab-btn flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
                state.activeTab === 'feed'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px]">Ukay Feed</span>
            </button>

            {/* Center Elevated "Mine Na!" Live Tab */}
            <button
              onClick={() => switchTab('mine')}
              data-nav="mine"
              className={`nav-tab-btn flex flex-col items-center gap-0.5 py-0.5 cursor-pointer ${
                state.activeTab === 'mine'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              <div className="w-10 h-10 -mt-4 rounded-2xl bg-[#070D17] text-white flex items-center justify-center shadow-md border-2 border-white">
                <Radio className="w-5 h-5 text-[#10B981]" />
              </div>
              <span className="text-[10px]">Mine Na!</span>
            </button>

            <button
              onClick={() => switchTab('bag')}
              data-nav="bag"
              className={`nav-tab-btn relative flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
                state.activeTab === 'bag'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              {bayongTotalQty > 0 && (
                <span
                  id="nav-bag-badge"
                  className="absolute top-0.5 right-4 min-w-[15px] h-3.5 px-1 rounded-full bg-[#10B981] text-white text-[9px] font-bold flex items-center justify-center"
                >
                  {bayongTotalQty}
                </span>
              )}
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px]">My Bayong</span>
            </button>

            <button
              onClick={() => switchTab('account')}
              data-nav="account"
              className={`nav-tab-btn flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
                state.activeTab === 'account'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">My Account</span>
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                    UKAYO Account Access
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Sign in or register your Buyer account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`py-2 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                    authTab === 'login'
                      ? 'bg-[#070D17] text-white'
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
                      ? 'bg-[#10B981] text-[#070D17]'
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
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#070D17] text-white text-xs font-extrabold cursor-pointer"
                  >
                    Log In to UKAYO
                  </button>

                  <div className="pt-1 border-t border-[#E2E8F0] space-y-2">
                    <button
                      type="button"
                      onClick={handleSendPasswordResetEmail}
                      className="w-full py-1.5 text-[11px] font-extrabold text-[#10B981] hover:underline cursor-pointer"
                    >
                      Forgot Password? Send Gmail Reset / Set New Password
                    </button>

                    {resetEmailNotice && (
                      <div className="p-2.5 rounded-2xl bg-[#F4F6F9] border border-[#CBD5E1] space-y-2 text-[11px]">
                        <p className="text-[#070D17] font-semibold leading-snug">
                          {resetEmailNotice.message}
                        </p>
                        {resetEmailNotice.consoleUrl && (
                          <a
                            href={resetEmailNotice.consoleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-[10px] font-extrabold text-[#10B981] underline"
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
                              className="px-3 py-1.5 rounded-lg bg-[#070D17] text-white text-[10px] font-extrabold cursor-pointer shrink-0"
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
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F4F6F9] border border-[#E2E8F0]">
                    <div className="w-12 h-12 rounded-full bg-[#070D17] text-white flex items-center justify-center overflow-hidden shrink-0">
                      {regAvatar ? (
                        <img
                          src={regAvatar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-[#10B981]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold text-[#070D17]">
                        Buyer Profile Picture
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Upload a photo from your device
                      </div>
                    </div>
                    <label className="px-2.5 py-1.5 rounded-xl bg-[#070D17] text-white text-[10px] font-extrabold cursor-pointer shrink-0">
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
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-[#070D17] text-xs font-extrabold cursor-pointer"
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                  Edit Buyer Profile &amp; Picture
                </h3>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F4F6F9] border border-[#E2E8F0]">
                <div className="w-14 h-14 rounded-full bg-[#070D17] text-white flex items-center justify-center overflow-hidden shrink-0">
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
                  <div className="text-xs font-extrabold text-[#070D17]">
                    Profile Photo
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Upload a new picture for your buyer account
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-[#070D17] text-white text-[10px] font-extrabold cursor-pointer shrink-0">
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-extrabold cursor-pointer"
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                  Post to Ukay Feed
                </h3>
                <button
                  type="button"
                  onClick={() => setFeedComposerOpen(false)}
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Upload Item Photo
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-[#94A3B8] bg-[#F4F6F9] cursor-pointer">
                  <span className="text-xs font-bold text-[#070D17]">
                    {postImage ? '✓ Photo Attached' : 'Tap to upload ukay photo'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#070D17] text-white text-[10px] font-extrabold">
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
                    className="w-full h-32 object-cover rounded-xl mt-2 border border-[#E2E8F0]"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#070D17] text-white text-xs font-extrabold cursor-pointer"
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                  Pin New Item to Live Stream
                </h3>
                <button
                  type="button"
                  onClick={() => setLiveDropModalOpen(false)}
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Item Photo
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-[#94A3B8] bg-[#F4F6F9] cursor-pointer">
                  <span className="text-xs font-bold text-[#070D17]">
                    {dropImage ? '✓ Photo Attached' : 'Upload item photo'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#070D17] text-white text-[10px] font-extrabold">
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
                    className="w-full h-28 object-cover rounded-xl mt-2 border border-[#E2E8F0]"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-extrabold uppercase"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-extrabold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-extrabold cursor-pointer"
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                    Bayong Checkout
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Choose courier &amp; payment option
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
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
                  <label className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F4F6F9] flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="checkout-pay-method"
                      value="COD"
                      checked={checkoutPayMethod === 'COD'}
                      onChange={() => setCheckoutPayMethod('COD')}
                      className="accent-[#070D17]"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-[#070D17]">COD</div>
                      <div className="text-[9px] text-slate-500">Cash on Delivery</div>
                    </div>
                  </label>
                  <label className="p-2.5 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="checkout-pay-method"
                      value="BAYAD_AGAD"
                      checked={checkoutPayMethod === 'BAYAD_AGAD'}
                      onChange={() => setCheckoutPayMethod('BAYAD_AGAD')}
                      className="accent-[#10B981]"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-[#070D17]">
                        Bayad Agad
                      </div>
                      <div className="text-[9px] text-[#10B981] font-bold">
                        E-Wallet Express
                      </div>
                    </div>
                  </label>
                </div>

                {checkoutPayMethod === 'BAYAD_AGAD' && (
                  <div
                    id="bayad-agad-ewallet-box"
                    className="p-3 rounded-2xl bg-[#F4F6F9] border border-[#10B981]/40 space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-1.5" id="ewallet-options-grid">
                      {[
                        { name: 'GCash', label: 'GCash', badge: 'G', badgeCls: 'bg-[#070D17] text-white' },
                        { name: 'Maya', label: 'Maya', badge: 'M', badgeCls: 'bg-[#10B981] text-white' },
                        { name: 'GoTyme Bank', label: 'GoTyme', badge: 'GT', badgeCls: 'bg-[#F59E0B] text-[#070D17]' },
                        { name: 'ShopeePay', label: 'ShopeePay', badge: 'SP', badgeCls: 'bg-[#EF4444] text-white' },
                      ].map((w) => {
                        const isSelected = selectedEWallet === w.name;
                        return (
                          <button
                            key={w.name}
                            type="button"
                            onClick={() => setSelectedEWallet(w.name)}
                            className={`p-2 rounded-xl ${
                              isSelected ? 'border-2 border-[#070D17]' : 'border border-[#E2E8F0]'
                            } bg-white text-left flex items-center gap-2 cursor-pointer`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg ${w.badgeCls} font-display font-extrabold text-[10px] flex items-center justify-center shrink-0`}
                            >
                              {w.badge}
                            </span>
                            <div className="text-xs font-extrabold text-[#070D17]">
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
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#070D17]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-[#070D17] text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">
                    Total Amount ({bayongTotalQty} items)
                  </div>
                  <div className="text-base font-display font-extrabold text-[#10B981] tabular-price">
                    ₱{bayongGrandTotal.toLocaleString()}
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
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
              className="bg-[#070D17] text-white w-full rounded-3xl p-4 space-y-3.5 border border-slate-800 shadow-2xl max-h-[92dvh] overflow-y-auto"
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
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#10B981]">
                    Live Stream Title
                  </label>
                  <input
                    type="text"
                    id="live-setup-title"
                    value={liveSetupTitle}
                    onChange={(e) => setLiveSetupTitle(e.target.value)}
                    placeholder="Add an engaging title..."
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
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
                      <option key={c.id} value={c.label} className="text-[#070D17]">
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
                    <option value="environment" className="text-[#070D17]">
                      Rear Camera (Rack View)
                    </option>
                    <option value="user" className="text-[#070D17]">
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
                      <option value="" className="text-[#070D17]">
                        Add items in Live Room (+)
                      </option>
                    ) : (
                      state.liveItems.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          className="text-[#070D17]"
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
                    <option value="First Tap Locks (Instant)" className="text-[#070D17]">
                      First Tap Locks (Instant)
                    </option>
                    <option value="15s Steal Window" className="text-[#070D17]">
                      15s Steal Window
                    </option>
                    <option value="30s Steal Window" className="text-[#070D17]">
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#070D17] text-[#10B981] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-[#070D17]">
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
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Upload Front of Primary ID
                </label>
                <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-[#E2E8F0] hover:border-[#070D17] bg-[#F4F6F9] cursor-pointer transition text-center">
                  <UploadCloud className="w-5 h-5 text-[#070D17] mb-1" />
                  <span className="text-[11px] font-bold text-[#070D17]">
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
                    className="w-full h-28 object-cover rounded-xl border border-[#E2E8F0]"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Upload Selfie Holding Your ID
                </label>
                <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-[#E2E8F0] hover:border-[#070D17] bg-[#F4F6F9] cursor-pointer transition text-center">
                  <Camera className="w-5 h-5 text-[#10B981] mb-1" />
                  <span className="text-[11px] font-bold text-[#070D17]">
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
                    className="w-full h-28 object-cover rounded-xl border border-[#E2E8F0]"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
              >
                Submit Primary ID for Verification
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
