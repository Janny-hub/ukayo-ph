import { initializeApp } from 'firebase/app';
import {
  getAuth,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocFromServer,
  onSnapshot,
  disableNetwork,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Silence internal @firebase/firestore console noise so quota-exhausted warnings never spam the browser console
try {
  setLogLevel('silent');
} catch {
  // ignore
}

export const DEVICE_SESSION_KEY = 'ukayo_device_session_v1';
const SHARED_STORAGE_KEY_FALLBACK = 'ukayo_marketplace_state_v11';
const QUOTA_LOCK_KEY = 'ukayo_firestore_quota_date_v1';

function getTodayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

let firestoreQuotaExceeded = (() => {
  try {
    return localStorage.getItem(QUOTA_LOCK_KEY) === getTodayUtcDate();
  } catch {
    return false;
  }
})();

if (firestoreQuotaExceeded) {
  try {
    disableNetwork(db).catch(() => {});
  } catch {
    // ignore
  }
}

const statusSubscribers = new Set<() => void>();

function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const code = (err as { code?: string })?.code || '';
  const msg = err instanceof Error ? err.message : String(err);
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.toLowerCase().includes('quota')
  );
}

function tripQuotaCircuitBreaker() {
  firestoreQuotaExceeded = true;
  try {
    localStorage.setItem(QUOTA_LOCK_KEY, getTodayUtcDate());
  } catch {
    // ignore
  }
  try {
    setLogLevel('silent');
  } catch {
    // ignore
  }
  try {
    disableNetwork(db).catch(() => {});
  } catch {
    // ignore
  }
  statusSubscribers.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

export function isFirestoreQuotaExhausted(): boolean {
  return firestoreQuotaExceeded;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: boolean | string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  if (isQuotaError(error)) {
    tripQuotaCircuitBreaker();
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface DeviceSessionData {
  isAuthenticated: boolean;
  role: 'buyer' | 'seller';
  user: Record<string, any>;
}

export function loadDeviceSession(): DeviceSessionData | null {
  try {
    const raw = localStorage.getItem(DEVICE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        isAuthenticated: Boolean(
          parsed.isAuthenticated || (parsed.user && parsed.user.email)
        ),
        role: parsed.role === 'seller' ? 'seller' : 'buyer',
        user: parsed.user || {},
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveDeviceSession(session: DeviceSessionData) {
  try {
    localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearDeviceSession() {
  try {
    localStorage.removeItem(DEVICE_SESSION_KEY);
  } catch {
    // ignore
  }
}

function mergeMessagesList(baseMsgs: any[] = [], incomingMsgs: any[] = []): any[] {
  const result: any[] = [];
  const seen = new Set<string>();
  const all = [...(Array.isArray(baseMsgs) ? baseMsgs : []), ...(Array.isArray(incomingMsgs) ? incomingMsgs : [])];
  for (const m of all) {
    if (!m || typeof m !== 'object' || !m.text) continue;
    const key = m.id
      ? String(m.id)
      : `${m.from || m.sender || ''}|${m.senderName || ''}|${m.text}|${m.time || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(m);
    }
  }
  return result;
}

function mergeByKey<T extends Record<string, any>>(
  baseList: T[] = [],
  incomingList: T[] = [],
  keyFn: (item: T) => string
): T[] {
  const map = new Map<string, T>();
  for (const item of baseList) {
    if (!item) continue;
    const k = keyFn(item);
    if (k) map.set(k, item);
  }
  for (const item of incomingList) {
    if (!item) continue;
    const k = keyFn(item);
    if (!k) continue;
    const prev = map.get(k);
    if (!prev) {
      map.set(k, item);
    } else {
      const mergedFollowedBy = Array.from(
        new Set([
          ...(Array.isArray(prev.followedBy) ? prev.followedBy : []),
          ...(Array.isArray(item.followedBy) ? item.followedBy : []),
        ])
      );
      const mergedSteals = Array.from(
        new Set([
          ...(Array.isArray(prev.steals) ? prev.steals : []),
          ...(Array.isArray(item.steals) ? item.steals : []),
        ])
      );
      map.set(k, {
        ...prev,
        ...item,
        isSeller: Boolean(prev.isSeller || item.isSeller),
        verified: Boolean(prev.verified || item.verified),
        followed:
          typeof item.followed === 'boolean'
            ? item.followed
            : Boolean(prev.followed),
        followedBy: mergedFollowedBy,
        followers:
          mergedFollowedBy.length > 0
            ? Math.max(prev.followers || 1, item.followers || 1, mergedFollowedBy.length)
            : typeof item.followers === 'number'
            ? item.followers
            : prev.followers || 1,
        pinned:
          typeof item.pinned === 'boolean' ? item.pinned : Boolean(prev.pinned),
        pinnedItemId: item.pinnedItemId || prev.pinnedItemId || '',
        winner: item.winner || item.minedBy || prev.winner || prev.minedBy || null,
        steals: mergedSteals,
        verificationStatus:
          item.verificationStatus === 'verified' ||
          prev.verificationStatus === 'verified'
            ? 'verified'
            : item.verificationStatus || prev.verificationStatus || 'unverified',
        sellerStatus:
          item.sellerStatus === 'approved' || prev.sellerStatus === 'approved'
            ? 'approved'
            : item.sellerStatus && item.sellerStatus !== 'none'
            ? item.sellerStatus
            : prev.sellerStatus || 'none',
        shopName: item.shopName || prev.shopName || '',
        ownSellerId: item.ownSellerId || prev.ownSellerId || '',
        products:
          Array.isArray(item.products) && item.products.length > 0
            ? item.products
            : prev.products || [],
        messages:
          Array.isArray(item.messages) || Array.isArray(prev.messages)
            ? mergeMessagesList(prev.messages || [], item.messages || [])
            : [],
      });
    }
  }
  return Array.from(map.values());
}

export function normalizeAndMergeUkayoState<T extends Record<string, any>>(
  localState: T,
  remoteState?: Partial<T> | null
): T {
  const merged: Record<string, any> = {
    ...localState,
    ...(remoteState || {}),
  };

  // CRITICAL FOR MULTI-USER SIGN-IN ACROSS DEVICES:
  // Never let remoteState overwrite this device's active login session, role, or UI tab.
  const deviceSession = loadDeviceSession();
  const localUser =
    localState.user && (localState.user.email || localState.user.id)
      ? localState.user
      : deviceSession?.user || localState.user || {};

  const isLocalAuth = Boolean(
    localState.isAuthenticated ||
      (localUser && (localUser.email || localUser.id))
  );

  merged.isAuthenticated = isLocalAuth;
  merged.role = localState.role || deviceSession?.role || 'buyer';
  merged.activeTab = localState.activeTab || 'home';
  merged.activeFeedCategory = localState.activeFeedCategory || 'ALL';
  merged.activeStoreId = localState.activeStoreId || '';
  merged.activeLiveSellerId =
    localState.activeLiveSellerId ||
    (remoteState as any)?.activeLiveSellerId ||
    '';
  // Allow remoteState.activePinnedItemId to update the buyer's live screen when a seller pins a product!
  merged.activePinnedItemId =
    (remoteState as any)?.activePinnedItemId ||
    localState.activePinnedItemId ||
    '';
  merged.activeChatSellerId = localState.activeChatSellerId || 'admin_support';
  merged.activePurchaseFilter = localState.activePurchaseFilter || 'ALL';
  merged.searchQuery = localState.searchQuery || '';

  const remoteUser = (remoteState && (remoteState as any).user) || {};

  // Merge deletedUserIds tombstones, blockedUserIds, and hiddenPostIds (Apple Guideline 5.1.1(v) & 1.2)
  merged.deletedUserIds = Array.from(
    new Set([
      ...(Array.isArray(localState.deletedUserIds) ? localState.deletedUserIds : []),
      ...(Array.isArray((remoteState as any)?.deletedUserIds)
        ? (remoteState as any).deletedUserIds
        : []),
    ])
  ).filter(Boolean);

  merged.blockedUserIds = Array.from(
    new Set([
      ...(Array.isArray(localState.blockedUserIds) ? localState.blockedUserIds : []),
      ...(Array.isArray((remoteState as any)?.blockedUserIds)
        ? (remoteState as any).blockedUserIds
        : []),
    ])
  ).filter(Boolean);

  merged.hiddenPostIds = Array.from(
    new Set([
      ...(Array.isArray(localState.hiddenPostIds) ? localState.hiddenPostIds : []),
      ...(Array.isArray((remoteState as any)?.hiddenPostIds)
        ? (remoteState as any).hiddenPostIds
        : []),
    ])
  ).filter(Boolean);

  const deletedSet = new Set(
    (merged.deletedUserIds as string[]).map((x) => String(x).toLowerCase())
  );

  // Merge registeredUsers by email / id across all devices
  const regUsers = mergeByKey(
    localState.registeredUsers || [],
    (remoteState as any)?.registeredUsers || [],
    (u) => (u.email ? String(u.email).toLowerCase() : String(u.id || ''))
  ).filter((u: any) => {
    const idKey = String(u?.id || '').toLowerCase();
    const emailKey = String(u?.email || '').toLowerCase();
    const sellerKey = String(u?.ownSellerId || '').toLowerCase();
    return (
      !deletedSet.has(idKey) &&
      !deletedSet.has(emailKey) &&
      (!sellerKey || !deletedSet.has(sellerKey))
    );
  });

  // Ensure any valid user object (local or remote) is preserved in registeredUsers (unless deleted)
  [localUser, remoteUser].forEach((u) => {
    if (u && (u.email || u.shopName) && (u.name || u.shopName)) {
      const emailKey = (
        u.email ||
        `${(u.shopName || 'seller').toLowerCase().replace(/[^a-z0-9]/g, '')}@ukayo.ph`
      ).toLowerCase();
      const idKey = String(u.id || '').toLowerCase();
      const sellerKey = String(u.ownSellerId || '').toLowerCase();
      if (
        deletedSet.has(emailKey) ||
        (idKey && deletedSet.has(idKey)) ||
        (sellerKey && deletedSet.has(sellerKey))
      ) {
        return;
      }
      const idx = regUsers.findIndex(
        (existing) =>
          (existing.email || '').toLowerCase() === emailKey ||
          (u.id && existing.id === u.id)
      );
      const normalizedAcc = {
        id: u.id || 'usr_' + emailKey.replace(/[^a-z0-9]/g, ''),
        name: u.name || u.shopName || 'Ukayo User',
        email: emailKey,
        password: u.password || 'ukayo123',
        phone: u.phone || u.gcash || '',
        city: u.city || u.address || 'Philippines',
        address: u.address || u.city || 'Philippines',
        avatar: u.avatar || '',
        verified: Boolean(u.verified),
        verificationStatus: u.verificationStatus || 'unverified',
        idType: u.idType || '',
        idNumber: u.idNumber || '',
        idImageData: u.idImageData || '',
        selfieImageData: u.selfieImageData || '',
        isSeller: Boolean(u.isSeller || u.shopName),
        sellerStatus: u.sellerStatus || (u.isSeller ? 'pending' : 'none'),
        shopName: u.shopName || '',
        gcash: u.gcash || u.phone || '',
        ownSellerId:
          u.ownSellerId || (u.isSeller ? 'seller_' + (u.id || 'shop') : ''),
        taxTier:
          u.taxTier ||
          'Starter Micro-Seller (≤ ₱500k Annual • Sworn Declaration)',
        tin: u.tin || '',
        birImages: Array.isArray(u.birImages) ? u.birImages : [],
        unpaidMines: 0,
        accountStatus: 'active',
      };
      if (idx >= 0) {
        regUsers[idx] = {
          ...regUsers[idx],
          ...normalizedAcc,
          isSeller: Boolean(regUsers[idx].isSeller || normalizedAcc.isSeller),
          verified: Boolean(regUsers[idx].verified || normalizedAcc.verified),
          verificationStatus:
            regUsers[idx].verificationStatus === 'verified' ||
            normalizedAcc.verificationStatus === 'verified'
              ? 'verified'
              : normalizedAcc.verificationStatus ||
                regUsers[idx].verificationStatus ||
                'unverified',
          sellerStatus:
            regUsers[idx].sellerStatus === 'approved' ||
            normalizedAcc.sellerStatus === 'approved'
              ? 'approved'
              : normalizedAcc.sellerStatus &&
                normalizedAcc.sellerStatus !== 'none'
              ? normalizedAcc.sellerStatus
              : regUsers[idx].sellerStatus || 'none',
          shopName: normalizedAcc.shopName || regUsers[idx].shopName,
          ownSellerId: normalizedAcc.ownSellerId || regUsers[idx].ownSellerId,
        };
      } else {
        regUsers.push(normalizedAcc);
      }
    }
  });

  merged.registeredUsers = regUsers;

  // Keep this device's logged-in user, enriched with authoritative verificationStatus & sellerStatus from registeredUsers
  if (isLocalAuth && localUser && (localUser.email || localUser.id)) {
    const matchedReg = regUsers.find(
      (r) =>
        (localUser.email &&
          (r.email || '').toLowerCase() ===
            String(localUser.email).toLowerCase()) ||
        (localUser.id && r.id === localUser.id)
    );
    merged.user = matchedReg
      ? {
          ...localUser,
          ...matchedReg,
          isSeller: Boolean(localUser.isSeller || matchedReg.isSeller),
          shopName: matchedReg.shopName || localUser.shopName || '',
          ownSellerId: matchedReg.ownSellerId || localUser.ownSellerId || '',
        }
      : localUser;
  } else {
    merged.user = localUser;
  }

  // Merge sellers (excluding deleted accounts)
  const sellers = mergeByKey(
    localState.sellers || [],
    (remoteState as any)?.sellers || [],
    (s) => String(s.id || s.name || '')
  ).filter((s: any) => {
    const sId = String(s?.id || '').toLowerCase();
    const sName = String(s?.name || '').toLowerCase();
    return !deletedSet.has(sId) && (!sName || !deletedSet.has(sName));
  });

  // Merge kycApplications (excluding deleted accounts)
  const kycApps = mergeByKey(
    localState.kycApplications || [],
    (remoteState as any)?.kycApplications || [],
    (k) => String(k.id || k.shopName || k.userId || '')
  ).filter((k: any) => {
    const kUser = String(k?.userId || '').toLowerCase();
    const kEmail = String(k?.email || '').toLowerCase();
    const kId = String(k?.id || '').toLowerCase();
    return (
      !deletedSet.has(kId) &&
      (!kUser || !deletedSet.has(kUser)) &&
      (!kEmail || !deletedSet.has(kEmail))
    );
  });

  // Backfill sellers & kycApplications from any registeredUsers with isSeller === true
  regUsers.forEach((u) => {
    if (u.isSeller && u.shopName) {
      const sellerId = u.ownSellerId || `seller_${u.id}`;
      if (deletedSet.has(String(sellerId).toLowerCase())) return;
      if (!sellers.some((s) => s.id === sellerId || s.name === u.shopName)) {
        sellers.unshift({
          id: sellerId,
          name: u.shopName,
          handle: '@' + u.shopName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          city: u.city || 'Philippines',
          bio: 'Verified UKAYO Live Seller',
          avatar: u.avatar || '',
          followers: 1,
          followed: false,
          followedBy: [],
          rating: 5.0,
          isLive: true,
          liveCategory: 'Jackets',
          liveTitle: `${u.shopName} Live Ukay Drop!`,
          liveStreamPreview:
            u.avatar ||
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
          gcash: u.gcash || u.phone || '',
          products: [],
        });
      }
      const kycId = `kyc_${sellerId}`;
      if (!kycApps.some((k) => k.id === kycId || k.shopName === u.shopName)) {
        kycApps.unshift({
          id: kycId,
          userId: u.id,
          shopName: u.shopName,
          ownerName: u.name,
          email: u.email,
          phone: u.phone || u.gcash || '',
          city: u.city || 'Philippines',
          idType:
            u.idType || 'Philippine National ID (PhilSys / ePhilID)',
          idNumber: u.idNumber || 'Submitted',
          taxTier:
            u.taxTier ||
            'Starter Micro-Seller (≤ ₱500k Annual • Sworn Declaration)',
          tin: u.tin || 'Starter Tier',
          idPhoto: u.idImageData || u.avatar || '',
          selfiePhoto: u.selfieImageData || u.avatar || '',
          birPhotos: Array.isArray(u.birImages) ? u.birImages : [],
          payoutChannel: 'GCash',
          payoutAccount: u.gcash || u.phone || '',
          status: u.sellerStatus === 'approved' ? 'approved' : 'pending',
          submittedAt: 'Synced',
        });
      }
    }
  });

  // Compute device-specific `followed` boolean for each seller based on `followedBy` list or local `followed`
  const currentUseKey = String(
    merged.user?.id || merged.user?.email || 'local_device'
  ).toLowerCase();
  merged.sellers = sellers.map((s) => {
    const fList: string[] = Array.isArray(s.followedBy) ? s.followedBy : [];
    const isFollowedByMe =
      fList.includes(currentUseKey) ||
      Boolean(
        (localState.sellers || []).find((ls: any) => ls.id === s.id)?.followed
      );
    return {
      ...s,
      followed: isFollowedByMe,
    };
  });
  merged.kycApplications = kycApps;

  const mergedLiveItems = mergeByKey(
    localState.liveItems || [],
    (remoteState as any)?.liveItems || [],
    (i) => String(i.id || '')
  );

  // Also ensure any seller products that aren't in liveItems yet are represented so pinned products always appear
  merged.sellers.forEach((s: any) => {
    if (Array.isArray(s.products)) {
      s.products.forEach((p: any) => {
        if (!p || !p.id) return;
        const liveId = String(p.id).startsWith('live_') ? String(p.id) : `live_${p.id}`;
        const existingIdx = mergedLiveItems.findIndex(
          (li) => li.id === liveId || li.id === p.id
        );
        const mappedLive = {
          id: liveId,
          sellerId: s.id,
          code: p.code || 'A01',
          title: p.title || 'Ukay Live Piece',
          price: Number(p.price) || 250,
          size: p.size || 'Free Size',
          condition: p.condition || '9.5/10 EUC',
          image: p.image || s.liveStreamPreview || s.avatar || '',
          pinned: Boolean(p.pinned),
          winner: p.minedBy || p.winner || null,
          steals: Array.isArray(p.steals) ? p.steals : [],
        };
        if (existingIdx >= 0) {
          mergedLiveItems[existingIdx] = {
            ...mergedLiveItems[existingIdx],
            ...mappedLive,
            pinned: Boolean(p.pinned),
            winner:
              mergedLiveItems[existingIdx].winner ||
              mappedLive.winner ||
              null,
          };
        } else {
          mergedLiveItems.push(mappedLive);
        }
      });
    }
  });

  merged.liveItems = mergedLiveItems;

  // If a seller pinned a product, make sure activePinnedItemId points to it
  const pinnedFromItems = mergedLiveItems.find((li) => li.pinned);
  if (pinnedFromItems && !((remoteState as any)?.activePinnedItemId)) {
    merged.activePinnedItemId = pinnedFromItems.id;
  }

  // Merge liveChat across all devices so live comments always appear in real time
  merged.liveChat = mergeMessagesList(
    localState.liveChat || [],
    (remoteState as any)?.liveChat || []
  );

  merged.feedPosts = mergeByKey(
    localState.feedPosts || [],
    (remoteState as any)?.feedPosts || [],
    (p) => String(p.id || '')
  );

  merged.minedOrders = mergeByKey(
    localState.minedOrders || [],
    (remoteState as any)?.minedOrders || [],
    (o) => String(o.id || '')
  );

  // Merge directChats per conversation key
  const localDirect =
    localState.directChats && typeof localState.directChats === 'object'
      ? localState.directChats
      : {};
  const remoteDirect =
    (remoteState as any)?.directChats &&
    typeof (remoteState as any).directChats === 'object'
      ? (remoteState as any).directChats
      : {};
  const allDirectKeys = new Set([
    ...Object.keys(localDirect),
    ...Object.keys(remoteDirect),
  ]);
  const mergedDirectChats: Record<string, any[]> = {};
  allDirectKeys.forEach((k) => {
    mergedDirectChats[k] = mergeMessagesList(
      localDirect[k] || [],
      remoteDirect[k] || []
    );
  });
  merged.directChats = mergedDirectChats;

  // Merge supportThreads and normalize Admin replies to from: 'admin'
  const rawSupportThreads = mergeByKey(
    localState.supportThreads || [],
    (remoteState as any)?.supportThreads || [],
    (t) => String(t.id || '')
  );
  merged.supportThreads = rawSupportThreads.map((t: any) => ({
    ...t,
    messages: (Array.isArray(t.messages) ? t.messages : []).map((m: any) => {
      // Fix legacy admin messages that were tagged from: 'seller' without a seller senderName
      if (
        m.from === 'admin' ||
        (m.senderName && String(m.senderName).toLowerCase().includes('admin'))
      ) {
        return {
          ...m,
          from: 'admin',
          senderName: m.senderName || 'UKAYO Customer Service',
        };
      }
      if (m.from === 'me') {
        return {
          ...m,
          from: t.userRole === 'SELLER' ? 'seller' : 'buyer',
          senderName: m.senderName || t.userName,
        };
      }
      return m;
    }),
  }));

  merged.payoutRequests = mergeByKey(
    localState.payoutRequests || [],
    (remoteState as any)?.payoutRequests || [],
    (p) => String(p.id || '')
  );

  merged.platformVouchers = mergeByKey(
    localState.platformVouchers || [],
    (remoteState as any)?.platformVouchers || [],
    (v) => String(v.code || '')
  );

  if (
    Array.isArray((remoteState as any)?.ukayPaborito) &&
    (remoteState as any).ukayPaborito.length > 0
  ) {
    merged.ukayPaborito = (remoteState as any).ukayPaborito;
  }

  return merged as T;
}

const SYNC_DOC_PATH = 'ukayo_sync/live_state';
let latestSyncedPayloadJson = '';
let latestSyncedUpdatedAt = '';
const liveFrameSubscribers = new Set<(stream: LiveCameraBroadcastState) => void>();

export function startUkayoCloudSync<T extends Record<string, any>>(
  storageKey: string,
  getCurrentState: () => T,
  onRemoteStateMerged: (merged: T) => void
) {
  const syncDocRef = doc(db, 'ukayo_sync', 'live_state');
  let isApplyingRemote = false;
  let lastPushedJson = '';
  let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let serverPushTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeSnapshot: (() => void) | null = null;
  let eventSource: EventSource | null = null;
  let serverPollInterval: ReturnType<typeof setInterval> | null = null;

  const notifyStatusListeners = () => {
    statusSubscribers.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  };

  const applyIncomingPayloadJson = (incomingPayloadJson: string, updatedAt?: string) => {
    if (!incomingPayloadJson || typeof incomingPayloadJson !== 'string') return;
    latestSyncedPayloadJson = incomingPayloadJson;
    latestSyncedUpdatedAt = updatedAt || new Date().toISOString();
    notifyStatusListeners();

    if (incomingPayloadJson === lastPushedJson) return;

    try {
      const remoteParsed = JSON.parse(incomingPayloadJson);
      isApplyingRemote = true;
      const current = getCurrentState();
      const merged = normalizeAndMergeUkayoState(current, remoteParsed);
      const mergedJson = JSON.stringify(merged);
      lastPushedJson = incomingPayloadJson;
      localStorage.setItem(storageKey, mergedJson);
      onRemoteStateMerged(merged);
    } catch {
      // ignore malformed payload
    } finally {
      setTimeout(() => {
        isApplyingRemote = false;
      }, 80);
    }
  };

  const buildSharedPayloadJson = (nextState: T): string => {
    const normalized = normalizeAndMergeUkayoState(nextState, null);
    const sharedCloudPayload: Record<string, any> = {
      ...normalized,
    };
    delete sharedCloudPayload.isAuthenticated;
    delete sharedCloudPayload.role;
    delete sharedCloudPayload.user;
    delete sharedCloudPayload.activeTab;
    return JSON.stringify(sharedCloudPayload);
  };

  // Immediate real-time push to backend Express server (/api/sync-state) — works across all devices with zero quota limits
  const executePushToBackendServer = async (nextState: T) => {
    if (isApplyingRemote) return;
    try {
      const payloadJson = buildSharedPayloadJson(nextState);
      if (!payloadJson || payloadJson.length < 2) return;
      await fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payloadJson }),
      });
    } catch {
      // ignore offline error
    }
  };

  const executePushToCloud = async (nextState: T) => {
    if (isApplyingRemote) return;
    try {
      const payloadJson = buildSharedPayloadJson(nextState);
      if (
        payloadJson === lastPushedJson ||
        payloadJson.length < 2 ||
        payloadJson.length > 940000
      ) {
        return;
      }
      lastPushedJson = payloadJson;
      latestSyncedPayloadJson = payloadJson;
      latestSyncedUpdatedAt = new Date().toISOString();
      notifyStatusListeners();

      if (firestoreQuotaExceeded) {
        return;
      }

      await setDoc(syncDocRef, {
        payloadJson,
        updatedAt: latestSyncedUpdatedAt,
        updatedBy: 'marketplace',
      });
    } catch (error) {
      if (isQuotaError(error)) {
        tripQuotaCircuitBreaker();
        if (unsubscribeSnapshot) {
          try {
            unsubscribeSnapshot();
          } catch {
            // ignore
          }
          unsubscribeSnapshot = null;
        }
        return;
      }
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('permission')
      ) {
        handleFirestoreError(error, OperationType.WRITE, SYNC_DOC_PATH);
      }
    }
  };

  const pushStateToCloud = (nextState: T) => {
    if (isApplyingRemote) return;
    try {
      latestSyncedPayloadJson = JSON.stringify(nextState);
      latestSyncedUpdatedAt = new Date().toISOString();
      notifyStatusListeners();
    } catch {
      // ignore
    }

    // Fast 150ms push to Express server for real-time cross-device sync
    if (serverPushTimer) clearTimeout(serverPushTimer);
    serverPushTimer = setTimeout(() => {
      executePushToBackendServer(nextState);
    }, 150);

    if (firestoreQuotaExceeded) return;
    if (pushDebounceTimer) {
      clearTimeout(pushDebounceTimer);
    }
    pushDebounceTimer = setTimeout(() => {
      executePushToCloud(nextState);
    }, 2500);
  };

  (
    window as unknown as { ukayoCloudSyncPush?: (s: T) => void }
  ).ukayoCloudSyncPush = pushStateToCloud;

  // 1. Connect to Express real-time Server-Sent Events (/api/sync-events) & initial state fetch
  fetch('/api/sync-state')
    .then((r) => r.json())
    .then((data) => {
      if (data && typeof data.payloadJson === 'string' && data.payloadJson.length > 2) {
        applyIncomingPayloadJson(data.payloadJson, data.updatedAt);
      } else {
        executePushToBackendServer(getCurrentState());
      }
      if (data && data.latestLiveStream) {
        liveFrameSubscribers.forEach((fn) => fn(data.latestLiveStream));
      }
    })
    .catch(() => {});

  if (typeof EventSource !== 'undefined') {
    try {
      eventSource = new EventSource('/api/sync-events');
      eventSource.addEventListener('sync', (ev: MessageEvent) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed && typeof parsed.payloadJson === 'string') {
            applyIncomingPayloadJson(parsed.payloadJson, parsed.updatedAt);
          }
        } catch {
          // ignore
        }
      });
      eventSource.addEventListener('live_frame', (ev: MessageEvent) => {
        try {
          const stream = JSON.parse(ev.data) as LiveCameraBroadcastState;
          if (stream && stream.sellerId) {
            liveFrameSubscribers.forEach((fn) => fn(stream));
          }
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }

  serverPollInterval = setInterval(() => {
    fetch('/api/sync-state')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.payloadJson === 'string' && data.payloadJson.length > 2) {
          applyIncomingPayloadJson(data.payloadJson, data.updatedAt);
        }
        if (data && data.latestLiveStream) {
          liveFrameSubscribers.forEach((fn) => fn(data.latestLiveStream));
        }
      })
      .catch(() => {});
  }, 2500);

  // 2. Connect to Firestore onSnapshot (when daily quota is available)
  if (!firestoreQuotaExceeded) {
    unsubscribeSnapshot = onSnapshot(
      syncDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          const current = getCurrentState();
          pushStateToCloud(current);
          return;
        }
        const data = snapshot.data();
        if (!data || typeof data.payloadJson !== 'string') return;
        applyIncomingPayloadJson(data.payloadJson, data.updatedAt);
      },
      (error) => {
        if (isQuotaError(error)) {
          tripQuotaCircuitBreaker();
          if (unsubscribeSnapshot) {
            try {
              unsubscribeSnapshot();
            } catch {
              // ignore
            }
            unsubscribeSnapshot = null;
          }
          return;
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('permission')
        ) {
          handleFirestoreError(error, OperationType.GET, SYNC_DOC_PATH);
        }
      }
    );
  }

  return () => {
    if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
    if (serverPushTimer) clearTimeout(serverPushTimer);
    if (serverPollInterval) clearInterval(serverPollInterval);
    if (eventSource) {
      try {
        eventSource.close();
      } catch {
        // ignore
      }
    }
    if (unsubscribeSnapshot) {
      try {
        unsubscribeSnapshot();
      } catch {
        // ignore
      }
    }
  };
}

// ===========================================================================
// REAL-TIME LIVE CAMERA FRAME & PINNED ITEM BROADCASTER & VIEWER SUBSCRIPTION
// Primary live video & audio uses Agora WebRTC (`agoraLive.ts`).
// Frame + Pinned Item broadcast uses /api/live-frame + BroadcastChannel + localStorage
// so watching buyers on ANY device always see the seller's live camera & pinned item.
// ===========================================================================
export interface LiveCameraBroadcastState {
  sellerId: string;
  sellerName?: string;
  isCameraLive: boolean;
  frameDataUrl: string;
  pinnedItemId?: string;
  pinnedItem?: Record<string, any> | null;
  liveTitle?: string;
  updatedAt: number;
}

const LIVE_FRAME_STORAGE_PREFIX = 'ukayo_live_frame_';
const liveFrameChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('ukayo_live_camera_channel')
    : null;

export async function publishLiveCameraFrame(
  sellerIdOrPayload: string | LiveCameraBroadcastState,
  frameDataUrl = '',
  isCameraLive = false,
  pinnedItemId = '',
  liveTitle = ''
) {
  const payload: LiveCameraBroadcastState =
    typeof sellerIdOrPayload === 'object'
      ? { ...sellerIdOrPayload, updatedAt: Date.now() }
      : {
          sellerId: sellerIdOrPayload,
          frameDataUrl,
          isCameraLive,
          pinnedItemId,
          liveTitle,
          updatedAt: Date.now(),
        };

  if (!payload.sellerId) return;
  try {
    const cleanPayload: LiveCameraBroadcastState = {
      sellerId: payload.sellerId,
      sellerName: payload.sellerName || '',
      isCameraLive: payload.isCameraLive,
      frameDataUrl: payload.isCameraLive ? payload.frameDataUrl : '',
      pinnedItemId: payload.pinnedItemId || '',
      pinnedItem: payload.pinnedItem || null,
      liveTitle: payload.liveTitle || '',
      updatedAt: Date.now(),
    };
    localStorage.setItem(
      `${LIVE_FRAME_STORAGE_PREFIX}${payload.sellerId}`,
      JSON.stringify(cleanPayload)
    );
    localStorage.setItem(
      `${LIVE_FRAME_STORAGE_PREFIX}latest`,
      JSON.stringify(cleanPayload)
    );
    if (liveFrameChannel) {
      liveFrameChannel.postMessage(cleanPayload);
    }
    fetch('/api/live-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    }).catch(() => {});
  } catch {
    // non-fatal frame drop
  }
}

export function subscribeToLiveCameraStream(
  sellerId: string,
  onStreamUpdate: (streamState: LiveCameraBroadcastState | null) => void
) {
  const parseAndEmit = (raw: LiveCameraBroadcastState | null) => {
    if (!raw) return;
    if (sellerId && raw.sellerId && raw.sellerId !== sellerId && sellerId !== 'any') {
      // Still allow if buyer doesn't have an active stream yet or matches latest live seller
    }
    const isFresh =
      Boolean(raw.isCameraLive) &&
      Boolean(raw.frameDataUrl) &&
      Date.now() - Number(raw.updatedAt || 0) < 30000;
    onStreamUpdate({
      sellerId: String(raw.sellerId || sellerId || ''),
      sellerName: String(raw.sellerName || ''),
      isCameraLive: isFresh,
      frameDataUrl: isFresh ? String(raw.frameDataUrl || '') : '',
      pinnedItemId: String(raw.pinnedItemId || ''),
      pinnedItem: raw.pinnedItem || null,
      liveTitle: String(raw.liveTitle || ''),
      updatedAt: Number(raw.updatedAt || 0),
    });
  };

  try {
    const existingRaw =
      (sellerId && localStorage.getItem(`${LIVE_FRAME_STORAGE_PREFIX}${sellerId}`)) ||
      localStorage.getItem(`${LIVE_FRAME_STORAGE_PREFIX}latest`);
    if (existingRaw) {
      parseAndEmit(JSON.parse(existingRaw));
    }
  } catch {
    // ignore
  }

  fetch(`/api/live-frame?sellerId=${encodeURIComponent(sellerId || '')}`)
    .then((r) => r.json())
    .then((data) => {
      if (data && data.stream) {
        parseAndEmit(data.stream);
      }
    })
    .catch(() => {});

  const onStorage = (ev: StorageEvent) => {
    if (
      (ev.key === `${LIVE_FRAME_STORAGE_PREFIX}${sellerId}` ||
        ev.key === `${LIVE_FRAME_STORAGE_PREFIX}latest`) &&
      ev.newValue
    ) {
      try {
        parseAndEmit(JSON.parse(ev.newValue));
      } catch {
        // ignore
      }
    }
  };

  const onChannelMsg = (ev: MessageEvent) => {
    if (ev.data && ev.data.sellerId) {
      parseAndEmit(ev.data);
    }
  };

  const onServerFrame = (stream: LiveCameraBroadcastState) => {
    parseAndEmit(stream);
  };

  window.addEventListener('storage', onStorage);
  if (liveFrameChannel) {
    liveFrameChannel.addEventListener('message', onChannelMsg);
  }
  liveFrameSubscribers.add(onServerFrame);

  return () => {
    window.removeEventListener('storage', onStorage);
    if (liveFrameChannel) {
      liveFrameChannel.removeEventListener('message', onChannelMsg);
    }
    liveFrameSubscribers.delete(onServerFrame);
  };
}

// ===========================================================================
// REAL-TIME FIRESTORE STATUS INDICATOR FOR USER PROFILE
// Reuses the active sync payload / local cache so we don't open duplicate
// Firestore snapshot listeners or exhaust daily read quota.
// ===========================================================================
export interface FirestoreUserLiveStatus {
  loading: boolean;
  connected: boolean;
  fromServer: boolean;
  foundInFirestore: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  sellerStatus: 'none' | 'pending' | 'approved' | 'rejected';
  verified: boolean;
  isSeller: boolean;
  shopName: string;
  kycIdType: string;
  lastSyncedAt: string;
}

function extractUserStatusFromFirestorePayload(
  payloadJson: string,
  updatedAt: string | undefined,
  userId: string,
  userEmail: string,
  fromServer: boolean
): FirestoreUserLiveStatus {
  try {
    const data = JSON.parse(payloadJson);
    const regUsers: any[] = Array.isArray(data.registeredUsers)
      ? data.registeredUsers
      : [];
    const kycApps: any[] = Array.isArray(data.kycApplications)
      ? data.kycApplications
      : [];
    const emailLower = (userEmail || '').trim().toLowerCase();

    const matchedUser = regUsers.find(
      (u) =>
        (userId && u.id === userId) ||
        (emailLower && String(u.email || '').toLowerCase() === emailLower)
    );

    const matchedKyc = kycApps.find(
      (k) =>
        (userId && k.userId === userId) ||
        (emailLower && String(k.email || '').toLowerCase() === emailLower) ||
        (matchedUser?.shopName && k.shopName === matchedUser.shopName)
    );

    if (!matchedUser && !matchedKyc) {
      return {
        loading: false,
        connected: true,
        fromServer,
        foundInFirestore: false,
        verificationStatus: 'unverified',
        sellerStatus: 'none',
        verified: false,
        isSeller: false,
        shopName: '',
        kycIdType: '',
        lastSyncedAt: updatedAt
          ? new Date(updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'Synced',
      };
    }

    const rawVerStatus =
      matchedKyc?.status === 'approved' ||
      matchedUser?.verificationStatus === 'verified' ||
      matchedUser?.verified
        ? 'verified'
        : matchedKyc?.status === 'pending' ||
          matchedUser?.verificationStatus === 'pending'
        ? 'pending'
        : 'unverified';

    const isSeller = Boolean(
      matchedUser?.isSeller || matchedUser?.shopName || matchedKyc
    );
    const rawSellerStatus =
      matchedKyc?.status === 'approved' ||
      matchedUser?.sellerStatus === 'approved'
        ? 'approved'
        : matchedKyc?.status === 'rejected'
        ? 'rejected'
        : isSeller ||
          matchedKyc?.status === 'pending' ||
          matchedUser?.sellerStatus === 'pending'
        ? 'pending'
        : 'none';

    return {
      loading: false,
      connected: true,
      fromServer,
      foundInFirestore: true,
      verificationStatus: rawVerStatus,
      sellerStatus: rawSellerStatus,
      verified: rawVerStatus === 'verified',
      isSeller,
      shopName: matchedKyc?.shopName || matchedUser?.shopName || '',
      kycIdType: matchedKyc?.idType || matchedUser?.idType || '',
      lastSyncedAt: updatedAt
        ? new Date(updatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
    };
  } catch {
    return {
      loading: false,
      connected: false,
      fromServer: false,
      foundInFirestore: false,
      verificationStatus: 'unverified',
      sellerStatus: 'none',
      verified: false,
      isSeller: false,
      shopName: '',
      kycIdType: '',
      lastSyncedAt: 'Local Cache Active',
    };
  }
}

export function subscribeToUserFirestoreStatus(
  userId: string,
  userEmail: string,
  onStatusUpdate: (status: FirestoreUserLiveStatus) => void
) {
  const computeCurrentStatus = () => {
    const rawJson =
      latestSyncedPayloadJson ||
      localStorage.getItem(SHARED_STORAGE_KEY_FALLBACK) ||
      '{}';
    const status = extractUserStatusFromFirestorePayload(
      rawJson,
      latestSyncedUpdatedAt || new Date().toISOString(),
      userId,
      userEmail,
      !firestoreQuotaExceeded
    );
    onStatusUpdate(status);
  };

  computeCurrentStatus();
  statusSubscribers.add(computeCurrentStatus);

  const onStorage = (ev: StorageEvent) => {
    if (ev.key === SHARED_STORAGE_KEY_FALLBACK) {
      computeCurrentStatus();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    statusSubscribers.delete(computeCurrentStatus);
    window.removeEventListener('storage', onStorage);
  };
}

export async function fetchUserFirestoreStatusFromServer(
  userId: string,
  userEmail: string
): Promise<FirestoreUserLiveStatus> {
  const fallbackFromCache = () => {
    const rawJson =
      latestSyncedPayloadJson ||
      localStorage.getItem(SHARED_STORAGE_KEY_FALLBACK) ||
      '{}';
    return extractUserStatusFromFirestorePayload(
      rawJson,
      latestSyncedUpdatedAt || new Date().toISOString(),
      userId,
      userEmail,
      false
    );
  };

  try {
    const res = await fetch('/api/sync-state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.payloadJson && data.payloadJson.length > 2) {
        latestSyncedPayloadJson = data.payloadJson;
        latestSyncedUpdatedAt = data.updatedAt || new Date().toISOString();
        return extractUserStatusFromFirestorePayload(
          data.payloadJson,
          data.updatedAt,
          userId,
          userEmail,
          true
        );
      }
    }
  } catch {
    // fall through
  }

  if (firestoreQuotaExceeded) {
    return fallbackFromCache();
  }

  try {
    const syncDocRef = doc(db, 'ukayo_sync', 'live_state');
    const snapshot = await getDocFromServer(syncDocRef);
    if (!snapshot.exists()) {
      return fallbackFromCache();
    }
    const data = snapshot.data();
    if (data?.payloadJson) {
      latestSyncedPayloadJson = data.payloadJson;
      latestSyncedUpdatedAt = data.updatedAt || new Date().toISOString();
    }
    return extractUserStatusFromFirestorePayload(
      data?.payloadJson || '{}',
      data?.updatedAt,
      userId,
      userEmail,
      true
    );
  } catch (error) {
    if (isQuotaError(error)) {
      tripQuotaCircuitBreaker();
    }
    return fallbackFromCache();
  }
}

// ===========================================================================
// REAL FIREBASE AUTH GMAIL PASSWORD RESET & EMAIL VERIFICATION
// ===========================================================================
export async function sendRealFirebasePasswordResetOrVerification(
  email: string,
  tempPasswordForEnrollment = 'UkayoTemp#2026'
): Promise<{ sent: boolean; message: string; consoleUrl?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const consoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      sent: true,
      message: `Password reset email dispatched via Firebase Auth to ${cleanEmail}! Check your Gmail inbox (and Spam/Promotions folder).`,
    };
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code === 'auth/user-not-found') {
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          tempPasswordForEnrollment
        );
        if (cred.user) {
          await sendEmailVerification(cred.user);
        }
        await sendPasswordResetEmail(auth, cleanEmail);
        return {
          sent: true,
          message: `Enrolled ${cleanEmail} in Firebase Auth and sent verification & password reset emails to your Gmail inbox!`,
        };
      } catch (innerErr: any) {
        const innerCode = String(innerErr?.code || '');
        if (
          innerCode.includes('operation-not-allowed') ||
          innerCode.includes('configuration-not-found')
        ) {
          return {
            sent: false,
            consoleUrl,
            message:
              'To send real Gmail emails via Firebase Auth, enable the "Email/Password" provider in your Firebase Console (Authentication → Sign-in method → Email/Password → Enable).',
          };
        }
        return {
          sent: false,
          consoleUrl,
          message: innerErr?.message || 'Unable to send Firebase Auth email.',
        };
      }
    }
    if (
      code.includes('operation-not-allowed') ||
      code.includes('configuration-not-found')
    ) {
      return {
        sent: false,
        consoleUrl,
        message:
          'To send real Gmail emails via Firebase Auth, enable the "Email/Password" provider in your Firebase Console (Authentication → Sign-in method → Email/Password → Enable).',
      };
    }
    return {
      sent: false,
      consoleUrl,
      message: err?.message || 'Unable to dispatch Firebase Auth email.',
    };
  }
}

