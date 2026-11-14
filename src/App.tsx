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
  Home,
  LayoutGrid,
  UploadCloud,
  Camera,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Minus,
} from 'lucide-react';

const STORAGE_KEY = 'ukayo_marketplace_state_v10';

export interface UkayCategory {
  id: string;
  label: string;
  image: string;
}

const UKAY_CATEGORIES: UkayCategory[] = [
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
  title: string;
  price: number;
  category: string;
  size: string;
  condition: string;
  status: string;
  rating: number;
  image: string;
  description: string;
  reviews: { user: string; text: string }[];
}

export interface Seller {
  id: string;
  name: string;
  handle: string;
  city: string;
  bio: string;
  followers: number;
  followed: boolean;
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
  winner: string | null;
  steals: string[];
}

export interface LiveChatMessage {
  sender: string;
  badge: string;
  text: string;
  isHost: boolean;
}

export interface FeedPost {
  id: string;
  sellerId: string;
  authorName: string;
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
  buyerName: string;
  buyerAddress?: string;
  courier: string;
  paymentMethod: string;
  stage: 'TO_PAY' | 'TO_SHIP' | 'TO_RECEIVE' | 'TO_RATE';
  status: string;
  timestamp: string;
  trackingNumber?: string;
  trackingEvents: TrackingEvent[];
}

export interface DirectMessage {
  from: 'buyer' | 'seller';
  text: string;
  time: string;
}

export interface AppState {
  role: 'buyer' | 'seller';
  activeTab: 'home' | 'feed' | 'mine' | 'store' | 'bag' | 'chat' | 'account';
  activeFeedCategory: string;
  activeStoreId: string;
  activeLiveSellerId: string;
  activePinnedItemId: string;
  activeChatSellerId: string;
  activePurchaseFilter: 'ALL' | 'TO_PAY' | 'TO_SHIP' | 'TO_RECEIVE' | 'TO_RATE';
  searchQuery: string;
  user: {
    name: string;
    email: string;
    verified: boolean;
    verificationStatus: 'unverified' | 'pending' | 'verified';
    idType: string;
    idNumber: string;
    idImageData: string;
    selfieImageData: string;
    isSeller: boolean;
    shopName: string;
    city: string;
    gcash: string;
    ownSellerId: string;
  };
  sellers: Seller[];
  liveItems: LiveItem[];
  liveChat: LiveChatMessage[];
  feedPosts: FeedPost[];
  minedOrders: MinedOrder[];
  directChats: Record<string, DirectMessage[]>;
}

function getDefaultState(): AppState {
  return {
    role: 'buyer',
    activeTab: 'home',
    activeFeedCategory: 'ALL',
    activeStoreId: 'seller_joy',
    activeLiveSellerId: 'seller_joy',
    activePinnedItemId: 'live_1',
    activeChatSellerId: 'seller_joy',
    activePurchaseFilter: 'ALL',
    searchQuery: '',
    user: {
      name: 'Mika Santos',
      email: 'mika.santos@ukayo.ph',
      verified: false,
      verificationStatus: 'unverified',
      idType: '',
      idNumber: '',
      idImageData: '',
      selfieImageData: '',
      isSeller: false,
      shopName: "Mika's Ukay Closet",
      city: 'Cebu City',
      gcash: '0917-555-0192',
      ownSellerId: 'seller_joy',
    },
    sellers: [
      {
        id: 'seller_joy',
        name: "Ate Joy's Bale Closet",
        handle: '@atejoyukay',
        city: 'Cebu City',
        bio: 'Fresh Class A Korean & US bales opened every night! No joy reservers pls.',
        followers: 2480,
        followed: false,
        rating: 4.9,
        isLive: true,
        liveCategory: 'Jackets & Hoodies',
        liveTitle: 'Class A Korean Windbreakers & Hoodies Bale Drop!',
        liveStreamPreview:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
        gcash: '0917-882-3310',
        products: [
          {
            id: 'prod_1',
            title: 'Vintage 90s Colorblock Windbreaker Jacket',
            price: 280,
            category: 'Jackets',
            size: 'Large (23" x 27")',
            condition: '10/10 Like New',
            status: 'Available',
            rating: 5.0,
            image:
              'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
            description:
              'Authentic preloved 90s nylon windbreaker from Korean Class A bale. Crisp zipper, zero flaws.',
            reviews: [],
          },
          {
            id: 'prod_2',
            title: 'Oversized Korean Washed Graphic Hoodie',
            price: 220,
            category: 'Jackets',
            size: 'XL (24" x 28")',
            condition: '9.5/10 EUC',
            status: 'Available',
            rating: 4.9,
            image:
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
            description:
              'Thick fleece cotton pullover hoodie in washed charcoal. Heavyweight drip.',
            reviews: [],
          },
        ],
      },
      {
        id: 'seller_vince',
        name: 'Kuya Vince Vintage',
        handle: '@vincevintagebaguio',
        city: 'Baguio City',
        bio: 'Handpicked Baguio Hilltop vintage denim, Carhartt workwear & flannel drops.',
        followers: 4120,
        followed: true,
        rating: 5.0,
        isLive: true,
        liveCategory: 'Jackets & Hoodies',
        liveTitle: 'Baguio Hilltop Heavy Jackets & Workwear Steals!',
        liveStreamPreview:
          'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=800&q=80',
        gcash: '0918-401-7721',
        products: [
          {
            id: 'prod_3',
            title: 'Baguio Heavyweight Duck Canvas Work Jacket',
            price: 450,
            category: 'Jackets',
            size: 'Large (23.5" x 27.5")',
            condition: '9.5/10 Vintage Fade',
            status: 'Available',
            rating: 5.0,
            image:
              'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=600&q=80',
            description:
              'Rugged tan canvas workwear jacket sourced from Baguio hilltop bale.',
            reviews: [],
          },
          {
            id: 'prod_4',
            title: 'Vintage 501 Straight-Cut Selvedge Denim',
            price: 380,
            category: 'Denim',
            size: 'W32 L30',
            condition: '9/10 Good Vintage',
            status: 'Available',
            rating: 4.9,
            image:
              'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
            description:
              'Classic medium-wash straight-leg denim jeans with authentic vintage whiskering.',
            reviews: [],
          },
        ],
      },
      {
        id: 'seller_mhel',
        name: "Tita Mhel's Luxury Thrift",
        handle: '@titamhelbags',
        city: 'Makati City',
        bio: 'Curated Japan & Korea leather bags, loafers, and classy office tops.',
        followers: 1890,
        followed: false,
        rating: 4.8,
        isLive: true,
        liveCategory: 'Bags & Wallets',
        liveTitle: 'Japan Bale Leather Bags & Silk Tops Live!',
        liveStreamPreview:
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        gcash: '0919-330-9914',
        products: [
          {
            id: 'prod_5',
            title: 'Structured Faux-Croc Vintage Shoulder Bag',
            price: 350,
            category: 'Bags',
            size: 'Medium (11" x 7")',
            condition: '10/10 Like New',
            status: 'Available',
            rating: 4.9,
            image:
              'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
            description:
              'Glossy espresso shoulder bag from Japan box bale. Clean gold hardware.',
            reviews: [],
          },
        ],
      },
    ],
    liveItems: [
      {
        id: 'live_1',
        sellerId: 'seller_joy',
        code: 'A01',
        title: 'Vintage 90s Colorblock Windbreaker',
        price: 280,
        size: 'L (23"x27")',
        condition: '10/10 Like New',
        image:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
        winner: null,
        steals: [],
      },
      {
        id: 'live_2',
        sellerId: 'seller_joy',
        code: 'A02',
        title: 'Oversized Korean Graphic Hoodie',
        price: 220,
        size: 'XL (24"x28")',
        condition: '9.5/10 EUC',
        image:
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80',
        winner: null,
        steals: [],
      },
      {
        id: 'live_3',
        sellerId: 'seller_vince',
        code: 'B01',
        title: 'Baguio Duck Canvas Work Jacket',
        price: 450,
        size: 'L (23.5"x27.5")',
        condition: '9.5/10 Vintage',
        image:
          'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=400&q=80',
        winner: null,
        steals: [],
      },
      {
        id: 'live_4',
        sellerId: 'seller_mhel',
        code: 'C01',
        title: 'Japan Bale Faux-Croc Shoulder Bag',
        price: 350,
        size: 'Medium',
        condition: '10/10 Like New',
        image:
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
        winner: null,
        steals: [],
      },
    ],
    liveChat: [
      {
        sender: "Ate Joy's Bale Closet",
        badge: 'HOST',
        text: 'Welcome miners! Tap MINE NA! on A01 para walang agawan sa comments!',
        isHost: true,
      },
      {
        sender: 'Carla M.',
        badge: 'VIP',
        text: 'Ganda ng colorblock windbreaker Ate Joy!!',
        isHost: false,
      },
      {
        sender: 'Jomar R.',
        badge: 'MINER',
        text: 'Anong chest measurement ng A01 po?',
        isHost: false,
      },
    ],
    feedPosts: [
      {
        id: 'post_1',
        sellerId: 'seller_joy',
        authorName: "Ate Joy's Bale Closet",
        authorRole: 'Verified Seller • Cebu City',
        timeAgo: '14 mins ago',
        category: 'Jackets',
        caption:
          'Fresh Korean Class A Windbreaker drop! Zero flaws, freshly steamed. Tap Mine Na! below before tonight’s live.',
        tags: ['#BaleDrop', '#VintageUkay', '#AuthenticPreloved'],
        itemTitle: 'Vintage 90s Colorblock Windbreaker',
        price: 280,
        condition: '10/10 Like New',
        image:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80',
        likes: 34,
        liked: false,
        minedBy: null,
        comments: [
          {
            user: 'Bea L.',
            text: 'Available pa po ba ito for Cebu City delivery?',
          },
        ],
      },
      {
        id: 'post_2',
        sellerId: 'seller_vince',
        authorName: 'Kuya Vince Vintage',
        authorRole: 'Verified Seller • Baguio City',
        timeAgo: '1 hr ago',
        category: 'Denim',
        caption:
          'Freshly sorted vintage straight-cut denim from Baguio Hilltop! Thick cotton, nice natural fade.',
        tags: ['#BaguioUkay', '#VintageDenim', '#Thrifted'],
        itemTitle: 'Vintage 501 Straight-Cut Denim (W32)',
        price: 380,
        condition: '9/10 Vintage',
        image:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80',
        likes: 51,
        liked: true,
        minedBy: null,
        comments: [],
      },
    ],
    minedOrders: [
      {
        id: 'ord_seed_1',
        itemCode: 'A02',
        title: 'Oversized Korean Washed Graphic Hoodie',
        price: 220,
        quantity: 1,
        image:
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80',
        sellerId: 'seller_joy',
        sellerName: "Ate Joy's Bale Closet",
        buyerName: 'Mika Santos',
        courier: 'J&T Express',
        paymentMethod: 'GCash',
        stage: 'TO_PAY',
        status: 'To Pay — Pending GCash',
        timestamp: 'Today, 8:14 PM',
        trackingEvents: [
          {
            time: 'Today, 8:14 PM',
            title: 'Locked via Mine Na!',
            desc: 'Awaiting buyer checkout',
            done: true,
            current: true,
          },
        ],
      },
      {
        id: 'ord_seed_2',
        itemCode: 'B04',
        title: 'Baguio Heavyweight Duck Canvas Work Jacket',
        price: 450,
        quantity: 1,
        image:
          'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=400&q=80',
        sellerId: 'seller_vince',
        sellerName: 'Kuya Vince Vintage',
        buyerName: 'Mika Santos',
        courier: 'J&T Express',
        paymentMethod: 'GCash',
        stage: 'TO_SHIP',
        status: 'To Ship — Seller Packing',
        timestamp: 'Yesterday, 6:30 PM',
        trackingEvents: [
          {
            time: 'Yesterday, 6:30 PM',
            title: 'Payment Verified (₱450)',
            desc: 'Seller confirmed GCash receipt',
            done: true,
          },
        ],
      },
      {
        id: 'ord_seed_3',
        itemCode: 'C01',
        title: 'Structured Faux-Croc Vintage Shoulder Bag',
        price: 350,
        quantity: 1,
        image:
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
        sellerId: 'seller_mhel',
        sellerName: "Tita Mhel's Luxury Thrift",
        buyerName: 'Mika Santos',
        courier: 'J&T Express',
        paymentMethod: 'COD',
        stage: 'TO_RECEIVE',
        status: 'In Transit — Out for Delivery',
        timestamp: 'Nov 10, 4:15 PM',
        trackingNumber: 'JT884920194PH',
        trackingEvents: [
          {
            time: 'Nov 13, 7:45 AM',
            title: 'Out for Delivery • Cebu City Hub',
            desc: 'Rider Kuya Carlo (0918-442-1190) is on the way to your address',
            done: true,
            current: true,
          },
          {
            time: 'Nov 12, 11:20 PM',
            title: 'Arrived at Mandaue Sorting Center',
            desc: 'Parcel unloaded and scanned at Cebu distribution hub',
            done: true,
          },
          {
            time: 'Nov 10, 6:05 PM',
            title: 'Picked up by J&T Express',
            desc: 'Tita Mhel handed over parcel in Makati City',
            done: true,
          },
        ],
      },
      {
        id: 'ord_seed_4',
        itemCode: 'A09',
        title: 'Classic Striped Oxford Button-Down Polo',
        price: 180,
        quantity: 1,
        image:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
        sellerId: 'seller_joy',
        sellerName: "Ate Joy's Bale Closet",
        buyerName: 'Mika Santos',
        courier: 'Maxim',
        paymentMethod: 'GCash',
        stage: 'TO_RATE',
        status: 'Delivered — Rate Seller',
        timestamp: 'Nov 8, 2:10 PM',
        trackingEvents: [
          {
            time: 'Nov 8, 4:30 PM',
            title: 'Delivered',
            desc: 'Received by Mika Santos',
            done: true,
          },
        ],
      },
    ],
    directChats: {
      seller_joy: [
        {
          from: 'seller',
          text: 'Hi Mika! Salamat sa pag-mine sa live kanina. Ready for J&T or Maxim po!',
          time: '8:15 PM',
        },
      ],
      seller_vince: [
        {
          from: 'seller',
          text: 'Good evening! Packing your Baguio work jacket now, shipout bukas morning.',
          time: '6:40 PM',
        },
      ],
      seller_mhel: [
        {
          from: 'seller',
          text: 'Hi dear, out for delivery na yung Japan shoulder bag mo today via J&T!',
          time: '8:05 AM',
        },
      ],
    },
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...getDefaultState(), ...parsed };
      }
    } catch {
      // fallback
    }
    return getDefaultState();
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Modals state
  const [becomeSellerOpen, setBecomeSellerOpen] = useState(false);
  const [feedComposerOpen, setFeedComposerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [liveSetupOpen, setLiveSetupOpen] = useState(false);
  const [idVerifyOpen, setIdVerifyOpen] = useState(false);

  // Form states for Become Seller
  const [applyShopName, setApplyShopName] = useState(
    () => state.user.shopName || "Mika's Ukay Closet"
  );
  const [applyShopCity, setApplyShopCity] = useState(
    () => state.user.city || 'Cebu City'
  );
  const [applyShopGcash, setApplyShopGcash] = useState(
    () => state.user.gcash || '0917-555-0192'
  );

  // Form states for Feed Composer
  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('220');
  const [postCategory, setPostCategory] = useState('Tops');
  const [postCaption, setPostCaption] = useState('');

  // Form states for Checkout
  const [checkoutAddress, setCheckoutAddress] = useState(
    'Lahug, Cebu City, Central Visayas'
  );
  const [checkoutCourier, setCheckoutCourier] = useState('J&T Express');
  const [checkoutPayMethod, setCheckoutPayMethod] = useState<
    'COD' | 'BAYAD_AGAD'
  >('COD');
  const [selectedEWallet, setSelectedEWallet] = useState('GCash');
  const [ewalletSenderRef, setEwalletSenderRef] = useState('0917-555-0192');

  // Form states for Live Setup
  const [liveSetupTitle, setLiveSetupTitle] = useState(
    'Class A Korean Windbreakers & Hoodies Bale Drop!'
  );
  const [liveSetupCategory, setLiveSetupCategory] =
    useState('Jackets & Hoodies');
  const [liveSetupCamera, setLiveSetupCamera] = useState<'environment' | 'user'>(
    'environment'
  );
  const [liveSetupPinnedId, setLiveSetupPinnedId] = useState('live_1');
  const [liveSetupTimer, setLiveSetupTimer] = useState(
    'First Tap Locks (Instant)'
  );
  const [liveSetupRule, setLiveSetupRule] = useState(
    'No joy reservers! Checkout within 12 hrs via Bayad Agad or COD.'
  );
  const [pendingLiveCoverData, setPendingLiveCoverData] = useState('');

  // Form states for ID Verification
  const [verifyIdType, setVerifyIdType] = useState(
    'Philippine National ID (PhilSys / ePhilID)'
  );
  const [verifyFullName, setVerifyFullName] = useState(state.user.name);
  const [verifyIdNumber, setVerifyIdNumber] = useState(state.user.idNumber);
  const [verifyIdFileLabel, setVerifyIdFileLabel] = useState(
    'Tap to upload Primary ID photo (JPG / PNG)'
  );
  const [verifySelfieFileLabel, setVerifySelfieFileLabel] = useState(
    'Tap to upload Selfie with ID'
  );
  const [verifyIdPreview, setVerifyIdPreview] = useState(
    state.user.idImageData || ''
  );
  const [verifySelfiePreview, setVerifySelfiePreview] = useState(
    state.user.selfieImageData || ''
  );

  // Inputs for Live Chat, Feed Comments, Direct Chat
  const [liveChatInput, setLiveChatInput] = useState('');
  const [feedCommentInputs, setFeedCommentInputs] = useState<
    Record<string, string>
  >({});
  const [directChatInput, setDirectChatInput] = useState('');

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [liveFacingMode, setLiveFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );

  // Touch & wheel refs for Mine Na! swipe
  const touchStartYRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const liveChatBoxRef = useRef<HTMLDivElement | null>(null);
  const directChatBoxRef = useRef<HTMLDivElement | null>(null);

  // Save state to localStorage & cross-tab sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const win = window as unknown as {
        ukayoCloudSyncPush?: (s: AppState) => void;
      };
      if (win.ukayoCloudSyncPush) {
        win.ukayoCloudSyncPush(state);
      }
    } catch {
      // ignore storage errors
    }
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState({ ...getDefaultState(), ...parsed });
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (liveChatBoxRef.current) {
      liveChatBoxRef.current.scrollTop = liveChatBoxRef.current.scrollHeight;
    }
  }, [state.liveChat, state.activeTab]);

  useEffect(() => {
    if (directChatBoxRef.current) {
      directChatBoxRef.current.scrollTop =
        directChatBoxRef.current.scrollHeight;
    }
  }, [state.directChats, state.activeChatSellerId, state.activeTab]);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const switchTab = (tab: AppState['activeTab']) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearch = (val: string) => {
    const q = val.trim().toLowerCase();
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
    setState((prev) => ({
      ...prev,
      activeStoreId: sellerId || prev.user.ownSellerId,
      activeTab: 'store',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSellerCenterPortal = () => {
    setApplyShopName(state.user.shopName || "Mika's Ukay Closet");
    setApplyShopCity(state.user.city || 'Cebu City');
    setApplyShopGcash(state.user.gcash || '0917-555-0192');
    setBecomeSellerOpen(true);
  };

  const handleBecomeSellerAction = () => {
    const isSellerAccount =
      state.role === 'seller' || Boolean(state.user && state.user.isSeller);
    if (isSellerAccount) {
      openSellerStore(state.user.ownSellerId);
      return;
    }
    openSellerCenterPortal();
  };

  const submitSellerApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const shopName = applyShopName.trim() || state.user.shopName;
    const city = applyShopCity.trim() || state.user.city;
    const gcash = applyShopGcash.trim() || state.user.gcash;

    setState((prev) => ({
      ...prev,
      role: 'seller',
      user: {
        ...prev.user,
        isSeller: true,
        shopName,
        city,
        gcash,
      },
    }));
    setBecomeSellerOpen(false);
    showToast(`Welcome Seller! "${shopName}" is now active.`);
  };

  const setMarketplaceMode = (mode: 'buyer' | 'seller') => {
    setState((prev) => ({ ...prev, role: mode }));
  };

  const openLiveSetupModal = () => {
    const seller =
      state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
      state.sellers[0];
    setLiveSetupTitle(
      seller.liveTitle || `${state.user.shopName || seller.name} Live Ukay Drop!`
    );
    if (seller.liveCategory) setLiveSetupCategory(seller.liveCategory);
    setLiveSetupPinnedId(state.activePinnedItemId);
    setLiveSetupOpen(true);
  };

  const launchSellerLiveInApp = () => {
    const targetSellerId = state.user.ownSellerId || 'seller_joy';
    const seller =
      state.sellers.find((s) => s.id === targetSellerId) || state.sellers[0];
    setState((prev) => ({
      ...prev,
      role: 'seller',
      activeLiveSellerId: targetSellerId,
      activeTab: 'mine',
    }));
    setLiveSetupTitle(
      seller.liveTitle || `${state.user.shopName || seller.name} Live Ukay Drop!`
    );
    if (seller.liveCategory) setLiveSetupCategory(seller.liveCategory);
    setLiveSetupPinnedId(state.activePinnedItemId);
    setLiveSetupOpen(true);
  };

  const launchSellerPostInApp = () => {
    setState((prev) => ({
      ...prev,
      role: 'seller',
      activeTab: 'feed',
    }));
    setFeedComposerOpen(true);
  };

  const submitNewFeedPost = (e: React.FormEvent) => {
    e.preventDefault();
    const title = postTitle.trim();
    const price = Number(postPrice) || 200;
    const category = postCategory;
    const caption = postCaption.trim();

    const newPost: FeedPost = {
      id: 'post_' + Date.now(),
      sellerId: state.user.ownSellerId,
      authorName:
        state.role === 'seller' ? state.user.shopName : state.user.name,
      authorRole: `${
        state.role === 'seller' ? 'Verified Seller' : 'Community Member'
      } • ${state.user.city}`,
      timeAgo: 'Just now',
      category,
      caption,
      tags: ['#UkayDrop', `#${category.replace(/\s+/g, '')}`, '#Thrifted'],
      itemTitle: title,
      price,
      condition: '9.5/10 Preloved',
      image:
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80',
      likes: 1,
      liked: true,
      minedBy: null,
      comments: [],
    };

    setState((prev) => ({
      ...prev,
      feedPosts: [newPost, ...prev.feedPosts],
    }));

    setPostTitle('');
    setPostPrice('220');
    setPostCaption('');
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
    const text = (feedCommentInputs[postId] || '').trim();
    if (!text) return;

    setState((prev) => ({
      ...prev,
      feedPosts: prev.feedPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...p.comments, { user: prev.user.name, text }],
            }
          : p
      ),
    }));
    setFeedCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const claimFeedPost = (postId: string) => {
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
      buyerName: state.user.name,
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
        sellerId: seller.id,
        sellerName: seller.name,
        buyerName: state.user.name,
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
            sender: prev.user.name,
            badge: 'LOCKED',
            text: `MINED ${item.code} (${item.title}) — ₱${item.price}!`,
            isHost: false,
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
            sender: prev.user.name,
            badge: 'MINER',
            text: `Steal / Next in line for ${item.code}!`,
            isHost: false,
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
    const text = liveChatInput.trim();
    if (!text) return;

    setState((prev) => ({
      ...prev,
      liveChat: [
        ...prev.liveChat,
        {
          sender: prev.user.name,
          badge: prev.role === 'seller' ? 'HOST' : 'MINER',
          text,
          isHost: prev.role === 'seller',
        },
      ],
    }));
    setLiveChatInput('');
  };

  const toggleFollowCurrentLiveSeller = () => {
    const seller = state.sellers.find(
      (s) => s.id === state.activeLiveSellerId
    );
    if (!seller) return;
    const nextFollowed = !seller.followed;

    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) =>
        s.id === seller.id
          ? {
              ...s,
              followed: nextFollowed,
              followers: s.followers + (nextFollowed ? 1 : -1),
            }
          : s
      ),
    }));
    showToast(
      nextFollowed ? `Following ${seller.name}` : `Unfollowed ${seller.name}`
    );
  };

  const switchToNextRelatedLive = () => {
    const current =
      state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
      state.sellers[0];
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

  const handleLiveCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setPendingLiveCoverData(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCameraStreamDirect = async (facing: 'environment' | 'user') => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
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
      showToast(
        'Live room configured! Camera preview unavailable on this browser.',
        'error'
      );
    }
  };

  const confirmStartLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const seller =
      state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
      state.sellers[0];
    const title = liveSetupTitle.trim();
    const category = liveSetupCategory;
    const cameraFacing = liveSetupCamera;
    const pinnedId = liveSetupPinnedId;
    const ruleText = liveSetupRule.trim();

    setLiveFacingMode(cameraFacing);

    setState((prev) => ({
      ...prev,
      activePinnedItemId: pinnedId || prev.activePinnedItemId,
      sellers: prev.sellers.map((s) =>
        s.id === seller.id
          ? {
              ...s,
              isLive: true,
              liveTitle: title,
              liveCategory: category,
              liveStreamPreview: pendingLiveCoverData || s.liveStreamPreview,
            }
          : s
      ),
      liveChat: [
        ...prev.liveChat,
        {
          sender: seller.name,
          badge: 'HOST',
          text: `LIVE STARTED: "${title}" (${category}) — ${ruleText}`,
          isHost: true,
        },
      ],
    }));

    setLiveSetupOpen(false);
    await startCameraStreamDirect(cameraFacing);
  };

  const toggleCameraLive = async () => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraStreaming(false);
      showToast('Live stream ended.');
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
      showToast(
        `Camera ready (${nextFacing === 'user' ? 'Front' : 'Rear'})`
      );
    }
  };

  const openSellerDropModal = () => {
    const code = 'A0' + (state.liveItems.length + 1);
    const newItem: LiveItem = {
      id: 'live_' + Date.now(),
      sellerId: state.activeLiveSellerId,
      code,
      title: 'Flash Bale Drop Vintage Pullover',
      price: 250,
      size: 'Large (23"x27")',
      condition: '10/10 Like New',
      image:
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80',
      winner: null,
      steals: [],
    };
    setState((prev) => ({
      ...prev,
      liveItems: [newItem, ...prev.liveItems],
      activePinnedItemId: newItem.id,
    }));
    showToast(`Pinned new live drop ${code} (₱250)!`);
  };

  const toggleFollowStore = (sellerId: string) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    if (!seller) return;
    const nextFollowed = !seller.followed;

    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              followed: nextFollowed,
              followers: s.followers + (nextFollowed ? 1 : -1),
            }
          : s
      ),
    }));
    showToast(
      nextFollowed ? `Following ${seller.name}` : `Unfollowed ${seller.name}`
    );
  };

  const claimStoreProduct = (sellerId: string, prodId: string) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    const prod = seller?.products.find((p) => p.id === prodId);
    if (!seller || !prod) return;

    const newOrder: MinedOrder = {
      id: 'ord_' + Date.now(),
      itemCode: 'SHOP',
      title: prod.title,
      price: prod.price,
      quantity: 1,
      image: prod.image,
      sellerId: seller.id,
      sellerName: seller.name,
      buyerName: state.user.name,
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
    setCheckoutOpen(true);
  };

  const submitBayongCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const address = checkoutAddress.trim();
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

  const openDirectChatWithSeller = (sellerId: string) => {
    setState((prev) => ({
      ...prev,
      activeChatSellerId: sellerId,
      activeTab: 'chat',
    }));
  };

  const sendDirectChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = directChatInput.trim();
    if (!text) return;
    const sid = state.activeChatSellerId || state.sellers[0].id;

    setState((prev) => ({
      ...prev,
      directChats: {
        ...prev.directChats,
        [sid]: [
          ...(prev.directChats[sid] || []),
          { from: 'buyer', text, time: 'Just now' },
        ],
      },
    }));
    setDirectChatInput('');
  };

  const openIdVerifyModal = () => {
    if (state.user.idType) setVerifyIdType(state.user.idType);
    setVerifyFullName(state.user.name);
    if (state.user.idNumber) setVerifyIdNumber(state.user.idNumber);
    setIdVerifyOpen(true);
  };

  const handleVerifyFilePreview = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'id' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        if (kind === 'id') {
          setVerifyIdPreview(dataUrl);
          setVerifyIdFileLabel(`Selected: ${file.name}`);
          setState((prev) => ({
            ...prev,
            user: { ...prev.user, idImageData: dataUrl },
          }));
        } else {
          setVerifySelfiePreview(dataUrl);
          setVerifySelfieFileLabel(`Selected: ${file.name}`);
          setState((prev) => ({
            ...prev,
            user: { ...prev.user, selfieImageData: dataUrl },
          }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const submitIdVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        idType: verifyIdType,
        name: verifyFullName.trim() || prev.user.name,
        idNumber: verifyIdNumber.trim(),
        verificationStatus: 'pending',
      },
    }));
    setIdVerifyOpen(false);
    showToast('Philippine Primary ID submitted for verification!');
  };

  const openPerksModal = (kind: 'referral' | 'discounts' | 'vouchers') => {
    showToast(
      kind === 'referral'
        ? 'Your Referral Code: UKAYO-MIKA (Earn 50 pts per invited miner!)'
        : kind === 'discounts'
        ? '20% OFF Bale Drops applied automatically on orders ₱500+!'
        : 'Voucher UKAYOFREESHIP claimed! Ready in My Bayong.'
    );
  };

  const openAppReleaseModal = () => {
    showToast('UKAYO PWA ready! Tap "Add to Home Screen" on iOS or Android.');
  };

  const openAgoraModal = () => {
    showToast('Agora.io WebRTC Live Engine ready for your App ID.');
  };

  const handleAccountLogout = () => {
    const nextLoggedOut = !isLoggedOut;
    setIsLoggedOut(nextLoggedOut);
    if (nextLoggedOut) {
      setState((prev) => ({ ...prev, role: 'buyer' }));
    }
  };

  // Derived values
  const bayongItems = state.minedOrders.filter((o) => o.stage === 'TO_PAY');
  const bayongGrandTotal = bayongItems.reduce(
    (sum, o) => sum + o.price * (o.quantity || 1),
    0
  );
  const bayongTotalQty = bayongItems.reduce(
    (sum, o) => sum + (o.quantity || 1),
    0
  );

  const isSellerAccount =
    state.role === 'seller' || Boolean(state.user && state.user.isSeller);
  const isSellerMode = state.role === 'seller';

  const activeLiveSeller =
    state.sellers.find((s) => s.id === state.activeLiveSellerId) ||
    state.sellers[0];
  const activePinnedItem =
    state.liveItems.find((i) => i.id === state.activePinnedItemId) ||
    state.liveItems.find((i) => i.sellerId === activeLiveSeller.id) ||
    state.liveItems[0];

  const activeStoreSeller =
    state.sellers.find((s) => s.id === state.activeStoreId) || state.sellers[0];
  const activeChatSeller =
    state.sellers.find((s) => s.id === state.activeChatSellerId) ||
    state.sellers[0];

  const filteredFeedPosts = state.feedPosts.filter((p) => {
    const catOk =
      state.activeFeedCategory === 'ALL' ||
      p.category === state.activeFeedCategory;
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

  const userNameParts = state.user.name.trim().split(' ');
  const userInitials = isLoggedOut
    ? 'GU'
    : (
        (userNameParts[0]?.[0] || 'M') + (userNameParts[1]?.[0] || 'S')
      ).toUpperCase();

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
            <div className="flex items-center gap-2">
              {/* Crisp High-Contrast UKAYO Hanger Wordmark */}
              <button
                onClick={() => switchTab('home')}
                className="flex items-center shrink-0 cursor-pointer"
                title="UKAYO Home"
              >
                <svg
                  className="w-[78px] h-10 text-white"
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
                  placeholder="Search vintage hoodies, bales..."
                  className="w-full text-xs bg-transparent focus:outline-none truncate"
                />
              </div>

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

              {/* Direct Seller Chat Shortcut */}
              <button
                onClick={() => switchTab('chat')}
                className="relative p-1.5 text-white hover:text-[#10B981] shrink-0 cursor-pointer"
                title="Seller Chat"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#10B981]" />
              </button>
            </div>
          </header>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 pb-20">
          {/* TAB 1: "HOME" (SHOPEE-STYLE SUPER APP DASHBOARD) */}
          {state.activeTab === 'home' && (
            <section id="tab-home" className="space-y-3 pb-4">
              <div className="bg-[#070D17] px-3.5 pt-1 pb-5 rounded-b-3xl">
                {/* 5 Uniform Brand-Palette Quick-Shortcut Icons Flush Below Search Bar */}
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
                            My Seller
                            <br />
                            Tindahan
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
                      onClick={openAppReleaseModal}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-[#070D17] flex items-center justify-center group-active:scale-95 transition">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">
                        Get
                        <br />
                        Mobile App
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
                    <div
                      id="home-live-previews"
                      className="grid grid-cols-2 gap-1.5"
                    >
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
                    <div
                      id="home-feed-previews"
                      className="grid grid-cols-2 gap-1.5"
                    >
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
                  </div>
                </div>

                {/* Ukay Paborito Picture-Icon Grid */}
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
                  <div
                    id="home-categories-grid"
                    className="grid grid-cols-3 gap-2"
                  >
                    {UKAY_CATEGORIES.map((c) => (
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

          {/* TAB 2: "UKAY FEED" (FACEBOOK-GROUP-STYLE COMMUNITY POSTING WALL) */}
          {state.activeTab === 'feed' && (
            <section id="tab-feed" className="px-3.5 pt-3 space-y-3 pb-4">
              {/* Compact Live Stories Strip */}
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
                        <div className="w-10 h-10 rounded-full bg-[#070D17] text-white font-display font-extrabold text-xs flex items-center justify-center border-2 border-white">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded bg-[#EF4444] text-white text-[7px] font-extrabold uppercase">
                          LIVE
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E293B] max-w-[64px] truncate">
                        {s.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Facebook-Style Community Composer */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#070D17] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                    MS
                  </div>
                  <button
                    onClick={() => setFeedComposerOpen(true)}
                    className="flex-1 text-left px-3.5 py-2 rounded-full bg-[#F4F6F9] hover:bg-slate-200/70 text-xs text-slate-500 font-medium cursor-pointer transition"
                  >
                    What&apos;s your ukay drop or looking-for today?
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-[11px] font-bold text-[#1E293B]">
                  <button
                    onClick={() => setFeedComposerOpen(true)}
                    className="py-1.5 rounded-xl hover:bg-[#F4F6F9] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Photo / Bale</span>
                  </button>
                  <button
                    onClick={() => setFeedComposerOpen(true)}
                    className="py-1.5 rounded-xl hover:bg-[#F4F6F9] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Sell Item</span>
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
                {[
                  'ALL',
                  'Tops',
                  'Jackets',
                  'Denim',
                  'Bags',
                  'Shoes',
                  'Bundle Bales',
                ].map((c) => {
                  const active = state.activeFeedCategory === c;
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
                      {c === 'ALL' ? 'All Drops' : c}
                    </button>
                  );
                })}
              </div>

              {/* Community Posts Feed */}
              <div id="feed-posts-list" className="space-y-3">
                {filteredFeedPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs"
                  >
                    <div className="p-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openSellerStore(post.sellerId)}
                        className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#070D17] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                          {post.authorName.slice(0, 2).toUpperCase()}
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
                          <span
                            key={i}
                            className="text-[10px] font-bold text-[#10B981]"
                          >
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
                          <div className="text-xs font-bold truncate">
                            {post.itemTitle}
                          </div>
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
                          className={`w-3.5 h-3.5 ${
                            post.liked ? 'fill-current' : ''
                          }`}
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
                          <span className="font-extrabold text-[#070D17]">
                            {c.user}:
                          </span>{' '}
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
                ))}
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
              {/* Video / Visual Backdrop */}
              <img
                id="live-fallback-bg"
                src={activeLiveSeller.liveStreamPreview}
                alt="Live Ukay Stream"
                className={`absolute inset-0 w-full h-full object-cover opacity-80 ${
                  isCameraStreaming ? 'hidden' : ''
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
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full pl-1.5 pr-2 py-1 border border-white/15 min-w-0">
                  <button
                    onClick={() => openSellerStore(state.activeLiveSellerId)}
                    className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#070D17] font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                      {activeLiveSeller.name.slice(0, 2).toUpperCase()}
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
                    onClick={toggleFollowCurrentLiveSeller}
                    id="live-follow-btn"
                    className="px-2.5 py-1 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold shrink-0 cursor-pointer"
                  >
                    {activeLiveSeller.followed ? 'Following' : 'Follow'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[10px] font-extrabold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
                    <span>342</span>
                  </div>
                  <button
                    onClick={() => switchTab('home')}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer"
                    title="Exit Live"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Swipe-Up Related Live Indicator */}
              <div className="relative z-10 flex justify-center">
                <button
                  onClick={switchToNextRelatedLive}
                  className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronsUp className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Swipe up for next related live</span>
                </button>
              </div>

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
                    {state.liveChat.slice(-14).map((m, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-start gap-1.5 bg-black/45 backdrop-blur-xs rounded-2xl px-2.5 py-1 text-[11px] max-w-full"
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
                          <span className="font-bold text-slate-200">
                            {m.sender}:
                          </span>{' '}
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Right Vertical Action Rail */}
                  <div className="flex flex-col items-center gap-2.5 shrink-0">
                    <button
                      onClick={toggleCameraLive}
                      id="tiktok-cam-btn"
                      className={`w-9 h-9 rounded-full ${
                        isCameraStreaming ? 'bg-[#EF4444]' : 'bg-black/50'
                      } backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer`}
                      title="Go Live Camera"
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
                    {state.role === 'seller' && (
                      <button
                        onClick={openSellerDropModal}
                        id="tiktok-seller-drop-btn"
                        className="flex w-9 h-9 rounded-full bg-[#F59E0B] text-[#070D17] items-center justify-center shadow-md cursor-pointer"
                        title="Seller Flash Drop"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={openAgoraModal}
                      className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer"
                      title="Agora Live Settings"
                    >
                      <Settings className="w-4 h-4" />
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
                {activePinnedItem && (
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
                )}

                {/* Live Comment Input Bar */}
                <form
                  onSubmit={sendLiveChat}
                  className="flex items-center gap-2"
                >
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
                {state.role === 'seller' ? (
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

              <div id="storefront-hero">
                <div className="bg-[#070D17] text-white rounded-3xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-slate-700 text-[#F59E0B] font-display font-extrabold text-base flex items-center justify-center shrink-0">
                        {activeStoreSeller.name.slice(0, 2).toUpperCase()}
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
                          {activeStoreSeller.city} • {activeStoreSeller.rating}{' '}
                          ★ • {activeStoreSeller.followers.toLocaleString()}{' '}
                          Followers
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
                      onClick={() =>
                        openDirectChatWithSeller(activeStoreSeller.id)
                      }
                      className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold cursor-pointer"
                    >
                      Chat Seller
                    </button>
                  </div>
                </div>
              </div>

              <div
                id="storefront-products-grid"
                className="grid grid-cols-2 gap-2.5"
              >
                {activeStoreSeller.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs flex flex-col"
                  >
                    <button
                      onClick={() =>
                        claimStoreProduct(activeStoreSeller.id, prod.id)
                      }
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
                          onClick={() =>
                            claimStoreProduct(activeStoreSeller.id, prod.id)
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#070D17] hover:bg-[#10B981] text-white text-[10px] font-extrabold cursor-pointer transition"
                        >
                          MINE NA!
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 5: "MY BAYONG" (CART, +/- QUANTITY, DELETE & CHECKOUT) */}
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
                      Tap <strong>MINE NA!</strong> in live streams or Ukay Feed
                      to add items here.
                    </p>
                    <button
                      onClick={() => switchTab('mine')}
                      className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-extrabold cursor-pointer"
                    >
                      Go to Mine Na! Live
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

              {/* Sticky Proceed to Checkout Bar */}
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

          {/* TAB 6: "CHAT" (DIRECT MESSAGING WITH SELLERS) */}
          {state.activeTab === 'chat' && (
            <section id="tab-chat" className="px-3.5 pt-3 space-y-3 pb-4">
              <div>
                <h2 className="text-base font-display font-extrabold text-[#070D17]">
                  Seller Messages
                </h2>
                <p className="text-[11px] text-slate-500">
                  Coordinate shipping, measurements &amp; payment proofs
                </p>
              </div>

              <div
                id="chat-sellers-strip"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
              >
                {state.sellers.map((s) => {
                  const active = s.id === activeChatSeller.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => openDirectChatWithSeller(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#070D17] text-white'
                          : 'bg-white text-[#1E293B] border border-[#E2E8F0]'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs flex flex-col h-[58dvh]">
                <div className="px-3.5 py-2.5 bg-[#070D17] text-white flex items-center justify-between">
                  <span
                    id="chat-active-seller-name"
                    className="text-xs font-extrabold"
                  >
                    {activeChatSeller.name}
                  </span>
                  <span className="text-[10px] text-[#10B981] font-bold">
                    ● Online
                  </span>
                </div>
                <div
                  ref={directChatBoxRef}
                  id="chat-messages-box"
                  className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#F4F6F9]"
                >
                  {(state.directChats[activeChatSeller.id] || []).map(
                    (m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          m.from === 'buyer' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs ${
                            m.from === 'buyer'
                              ? 'bg-[#070D17] text-white rounded-br-xs'
                              : 'bg-white border border-[#E2E8F0] text-[#1E293B] rounded-bl-xs'
                          }`}
                        >
                          <p>{m.text}</p>
                          <div className="text-[9px] opacity-60 mt-1 text-right">
                            {m.time}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <form
                  onSubmit={sendDirectChatMessage}
                  className="p-2.5 bg-white border-t border-[#E2E8F0] flex items-center gap-2"
                >
                  <input
                    type="text"
                    id="direct-chat-input"
                    value={directChatInput}
                    onChange={(e) => setDirectChatInput(e.target.value)}
                    placeholder="Message seller..."
                    className="flex-1 px-3.5 py-2 rounded-full bg-[#F4F6F9] border border-[#E2E8F0] text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-[#070D17] text-white text-xs font-extrabold cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* TAB 7: "MY ACCOUNT" (PROFILE, SELLER MODE, PURCHASES & ID) */}
          {state.activeTab === 'account' && (
            <section
              id="tab-account"
              className="px-3.5 pt-3 space-y-3.5 pb-6"
            >
              {/* Profile Header Card */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#10B981] p-[2.5px]">
                      <div
                        id="account-avatar-initials"
                        className="w-full h-full rounded-full bg-[#070D17] text-white font-display font-extrabold text-lg flex items-center justify-center"
                      >
                        {userInitials}
                      </div>
                    </div>
                    <span
                      id="account-role-pill"
                      className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full ${
                        isSellerMode
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#F59E0B] text-[#070D17]'
                      } text-[8px] font-extrabold uppercase tracking-wider shadow-2xs`}
                    >
                      {isSellerMode ? 'SELLER' : 'MINER'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      id="account-display-name"
                      className="text-base font-display font-extrabold text-[#070D17] truncate"
                    >
                      {isLoggedOut
                        ? 'Guest Miner'
                        : `Hello, ${state.user.name.split(' ')[0]}!`}
                    </h3>
                    <p
                      id="account-email-line"
                      className="text-xs text-slate-500 truncate"
                    >
                      {isLoggedOut
                        ? 'Signed out • Tap below to log back in'
                        : state.user.email}
                    </p>
                    <button
                      onClick={openIdVerifyModal}
                      id="account-verified-badge"
                      className={
                        state.user.verificationStatus === 'verified' ||
                        state.user.verificationStatus === 'pending'
                          ? 'mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold cursor-pointer'
                          : 'mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25 text-[10px] font-bold cursor-pointer'
                      }
                    >
                      {state.user.verificationStatus === 'verified' ||
                      state.user.verificationStatus === 'pending' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            {state.user.verificationStatus === 'verified'
                              ? 'Verified Primary ID'
                              : 'Primary ID Submitted • Under Review'}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Not Verified • Submit Primary ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Become a Ukayo Seller / Active Seller Mode Switcher Card */}
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
                          : 'Become a Ukayo Seller'}
                      </h3>
                      {isSellerAccount && (
                        <span
                          id="account-seller-status-badge"
                          className="px-2 py-0.5 rounded-full bg-[#10B981] text-white text-[9px] font-extrabold uppercase tracking-wider shrink-0"
                        >
                          Active Shop
                        </span>
                      )}
                    </div>
                    <p
                      id="account-seller-banner-desc"
                      className="text-[11px] text-[#1E293B] leading-snug"
                    >
                      {isSellerAccount
                        ? 'Switch between shopping as a Miner or Live-Selling & Posting as a Seller.'
                        : 'Apply to open your own Nasa Tindahan & go live on Mine Na!'}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#070D17] shrink-0">
                    <Store className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                </div>

                {!isSellerAccount ? (
                  <div id="account-buyer-apply-actions">
                    <button
                      onClick={handleBecomeSellerAction}
                      id="account-seller-banner-btn"
                      className="px-3.5 py-2 rounded-xl bg-[#070D17] hover:bg-[#111827] text-white text-[11px] font-bold shadow-2xs cursor-pointer"
                    >
                      Apply Now
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

              {/* My Purchases Summary (To Pay, To Ship, To Receive, To Rate) */}
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
                        <span className="text-[10px] font-bold">
                          {st.label}
                        </span>
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
                              Qty: {o.quantity || 1} • {o.courier} •{' '}
                              {o.paymentMethod}
                            </div>
                            <div className="text-sm font-display font-extrabold text-[#10B981] tabular-price mt-0.5">
                              ₱{(o.price * (o.quantity || 1)).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {o.stage === 'TO_RECEIVE' && o.trackingEvents && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#070D17]">
                              Live Parcel Timeline{' '}
                              {o.trackingNumber ? `• ${o.trackingNumber}` : ''}
                            </div>
                            <div className="space-y-2 pl-2 border-l-2 border-[#10B981]">
                              {o.trackingEvents.map((ev, idx) => (
                                <div key={idx} className="relative pl-3">
                                  <span
                                    className={`absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full ${
                                      ev.current
                                        ? 'bg-[#10B981] ring-4 ring-[#10B981]/20'
                                        : 'bg-slate-300'
                                    }`}
                                  />
                                  <div className="text-[11px] font-bold text-[#070D17]">
                                    {ev.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {ev.desc}
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    {ev.time}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Account Settings List */}
              <div className="space-y-2">
                <h3 className="text-xs font-display font-extrabold text-[#070D17] px-0.5">
                  Account Settings
                </h3>

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

                <button
                  onClick={openIdVerifyModal}
                  className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#070D17] transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#070D17]/10 text-[#070D17] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#070D17]">
                        Personal Information
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Manage your profile, city &amp; GCash/Maya details
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    {state.user.verificationStatus !== 'verified' &&
                      state.user.verificationStatus !== 'pending' && (
                        <span
                          id="settings-verify-dot"
                          className="w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center"
                        >
                          !
                        </span>
                      )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>

                {/* Log Out Button */}
                <button
                  onClick={handleAccountLogout}
                  id="account-logout-btn"
                  className="w-full bg-white rounded-2xl border border-[#EF4444]/30 p-3 flex items-center justify-between gap-3 shadow-2xs hover:bg-[#EF4444]/5 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div
                        id="account-logout-title"
                        className="text-xs font-extrabold text-[#EF4444]"
                      >
                        {isLoggedOut
                          ? 'Log Back In as Mika Santos'
                          : 'Log Out'}
                      </div>
                      <div
                        id="account-logout-sub"
                        className="text-[10px] text-slate-500 truncate"
                      >
                        {isLoggedOut
                          ? 'Restore your saved bayong, orders & seller profile'
                          : 'Sign out of your UKAYO buyer & seller session'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#EF4444] shrink-0" />
                </button>
              </div>
            </section>
          )}
        </main>

        {/* DOCKED 5-TAB MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-2 pt-1.5 pb-safe">
          <div className="grid grid-cols-5 items-center text-center">
            <button
              onClick={() => switchTab('home')}
              className={`bottom-nav-btn flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
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
              className={`bottom-nav-btn flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
                state.activeTab === 'feed'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px]">Ukay Feed</span>
            </button>

            <button
              onClick={() => switchTab('mine')}
              className={`bottom-nav-btn flex flex-col items-center gap-0.5 py-0.5 cursor-pointer ${
                state.activeTab === 'mine'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              <div className="w-10 h-10 -mt-4 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center shadow-md border-2 border-white">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[10px]">Mine Na!</span>
            </button>

            <button
              onClick={() => switchTab('bag')}
              className={`bottom-nav-btn relative flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
                state.activeTab === 'bag'
                  ? 'text-[#070D17] font-extrabold'
                  : 'text-slate-400 font-semibold'
              }`}
            >
              {bayongTotalQty > 0 && (
                <span
                  id="nav-bag-badge"
                  className="absolute top-0.5 right-3 min-w-[15px] h-3.5 px-1 rounded-full bg-[#10B981] text-white text-[9px] font-bold flex items-center justify-center"
                >
                  {bayongTotalQty}
                </span>
              )}
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px]">My Bayong</span>
            </button>

            <button
              onClick={() => switchTab('account')}
              className={`bottom-nav-btn flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
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

        {/* Become Ukayo Seller Application Modal */}
        {becomeSellerOpen && (
          <div
            id="become-seller-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={submitSellerApplication}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-[#070D17]">
                    Become a Ukayo Seller
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Activate your Nasa Tindahan &amp; go live on Mine Na!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBecomeSellerOpen(false)}
                  className="p-1 rounded-full bg-[#F4F6F9] text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Tindahan / Shop Name
                </label>
                <input
                  type="text"
                  id="apply-shop-name"
                  value={applyShopName}
                  onChange={(e) => setApplyShopName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    id="apply-shop-city"
                    value={applyShopCity}
                    onChange={(e) => setApplyShopCity(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    GCash / Maya Number
                  </label>
                  <input
                    type="text"
                    id="apply-shop-gcash"
                    value={applyShopGcash}
                    onChange={(e) => setApplyShopGcash(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#E2E8F0] text-xs font-semibold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
              >
                Activate My Seller Tindahan
              </button>
            </form>
          </div>
        )}

        {/* Community Feed Composer Modal */}
        {feedComposerOpen && (
          <div
            id="feed-composer-modal"
            className="fixed inset-0 z-50 max-w-md mx-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          >
            <form
              onSubmit={submitNewFeedPost}
              className="bg-white w-full rounded-3xl p-4 space-y-3 shadow-2xl"
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
                  <option value="Tops">Tops &amp; Tees</option>
                  <option value="Jackets">Jackets &amp; Hoodies</option>
                  <option value="Denim">Denim &amp; Pants</option>
                  <option value="Bags">Bags &amp; Wallets</option>
                  <option value="Shoes">Ukay Kicks</option>
                  <option value="Bundle Bales">Bundle Bales</option>
                </select>
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
                Publish Post
              </button>
            </form>
          </div>
        )}

        {/* My Bayong Checkout Modal (COD vs Bayad Agad + E-Wallet Selector) */}
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
                      <div className="text-xs font-extrabold text-[#070D17]">
                        COD
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Cash on Delivery
                      </div>
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

                {/* Bayad Agad E-Wallet Options Panel */}
                {checkoutPayMethod === 'BAYAD_AGAD' && (
                  <div
                    id="bayad-agad-ewallet-box"
                    className="p-3 rounded-2xl bg-[#F4F6F9] border border-[#10B981]/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#070D17]">
                        Select E-Wallet
                      </span>
                      <span className="text-[10px] font-bold text-[#10B981]">
                        Instant Verification
                      </span>
                    </div>
                    <div
                      className="grid grid-cols-2 gap-1.5"
                      id="ewallet-options-grid"
                    >
                      {[
                        {
                          name: 'GCash',
                          label: 'GCash',
                          sub: '0917-882-3310',
                          badge: 'G',
                          badgeCls: 'bg-[#070D17] text-white',
                        },
                        {
                          name: 'Maya',
                          label: 'Maya',
                          sub: '0918-401-7721',
                          badge: 'M',
                          badgeCls: 'bg-[#10B981] text-white',
                        },
                        {
                          name: 'GoTyme Bank',
                          label: 'GoTyme',
                          sub: 'Instant QRPH',
                          badge: 'GT',
                          badgeCls: 'bg-[#F59E0B] text-[#070D17]',
                        },
                        {
                          name: 'ShopeePay',
                          label: 'ShopeePay',
                          sub: 'E-Wallet / QR',
                          badge: 'SP',
                          badgeCls: 'bg-[#EF4444] text-white',
                        },
                      ].map((w) => {
                        const isSelected = selectedEWallet === w.name;
                        return (
                          <button
                            key={w.name}
                            type="button"
                            onClick={() => setSelectedEWallet(w.name)}
                            className={`ewallet-choice-btn p-2 rounded-xl ${
                              isSelected
                                ? 'border-2 border-[#070D17]'
                                : 'border border-[#E2E8F0]'
                            } bg-white text-left flex items-center gap-2 cursor-pointer`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg ${w.badgeCls} font-display font-extrabold text-[10px] flex items-center justify-center shrink-0`}
                            >
                              {w.badge}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-[#070D17]">
                                {w.label}
                              </div>
                              <div className="text-[9px] text-slate-500 truncate">
                                {w.sub}
                              </div>
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

                <div
                  id="checkout-payment-hint"
                  className="p-2.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[11px] text-[#1E293B] font-medium"
                >
                  {checkoutPayMethod === 'BAYAD_AGAD'
                    ? `Pay instantly via ${selectedEWallet}. Your mined items will be marked Paid and queued for priority shipout.`
                    : 'Prepare exact cash for the rider upon parcel delivery.'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#070D17] text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">
                    Total Amount (
                    <span id="checkout-modal-count">{bayongTotalQty}</span>{' '}
                    items)
                  </div>
                  <div
                    id="checkout-modal-total"
                    className="text-base font-display font-extrabold text-[#10B981] tabular-price"
                  >
                    ₱{bayongGrandTotal.toLocaleString()}
                  </div>
                </div>
                <button
                  type="submit"
                  id="checkout-submit-btn"
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

        {/* TikTok-Style Pre-Live Setup Modal */}
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

              {/* Cover Thumbnail + Live Title Card */}
              <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-3">
                <label className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/15 shrink-0 cursor-pointer group">
                  <img
                    id="live-setup-cover-preview"
                    src={
                      pendingLiveCoverData || activeLiveSeller.liveStreamPreview
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
                    placeholder="Add an engaging title to attract miners..."
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
                    <option value="Jackets & Hoodies" className="text-[#070D17]">
                      Jackets &amp; Hoodies
                    </option>
                    <option value="Tops & Tees" className="text-[#070D17]">
                      Tops &amp; Tees
                    </option>
                    <option value="Denim & Pants" className="text-[#070D17]">
                      Denim &amp; Pants
                    </option>
                    <option value="Bags & Wallets" className="text-[#070D17]">
                      Bags &amp; Wallets
                    </option>
                    <option value="Ukay Kicks" className="text-[#070D17]">
                      Ukay Kicks
                    </option>
                    <option value="Bundle Bales" className="text-[#070D17]">
                      Bundle Bales
                    </option>
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
                      setLiveSetupCamera(
                        e.target.value as 'environment' | 'user'
                      )
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
                    {state.liveItems.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        className="text-[#070D17]"
                      >
                        {item.code} • {item.title} (₱{item.price})
                      </option>
                    ))}
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
                    <option
                      value="First Tap Locks (Instant)"
                      className="text-[#070D17]"
                    >
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

              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[11px]">
                <span className="font-bold text-[#10B981]">
                  ✓ Zero Brand-Strike Safe-Harbor Active
                </span>
                <span className="text-slate-300 font-semibold">
                  Notify Followers
                </span>
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

        {/* Philippine Primary ID Identity Verification Modal */}
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
                  <option value="PRC Professional ID">
                    PRC Professional ID
                  </option>
                  <option value="Postal ID (Digitized)">
                    Postal ID (Digitized)
                  </option>
                  <option value="SSS / GSIS e-Card">SSS / GSIS e-Card</option>
                  <option value="COMELEC Voter's ID">
                    COMELEC Voter&apos;s ID
                  </option>
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
                    placeholder="Mika Santos"
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
                  <span
                    id="verify-id-file-label"
                    className="text-[11px] font-bold text-[#070D17]"
                  >
                    {verifyIdFileLabel}
                  </span>
                  <input
                    type="file"
                    id="verify-id-file"
                    accept="image/*"
                    onChange={(e) => handleVerifyFilePreview(e, 'id')}
                    className="hidden"
                  />
                </label>
                {verifyIdPreview && (
                  <img
                    id="verify-id-preview"
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
                  <span
                    id="verify-selfie-file-label"
                    className="text-[11px] font-bold text-[#070D17]"
                  >
                    {verifySelfieFileLabel}
                  </span>
                  <input
                    type="file"
                    id="verify-selfie-file"
                    accept="image/*"
                    onChange={(e) => handleVerifyFilePreview(e, 'selfie')}
                    className="hidden"
                  />
                </label>
                {verifySelfiePreview && (
                  <img
                    id="verify-selfie-preview"
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
