import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
    tenantId?: string | null;
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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'ukayo_sync', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

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
      map.set(k, {
        ...prev,
        ...item,
        isSeller: Boolean(prev.isSeller || item.isSeller),
        verified: Boolean(prev.verified || item.verified),
        shopName: item.shopName || prev.shopName || '',
        ownSellerId: item.ownSellerId || prev.ownSellerId || '',
        products:
          Array.isArray(item.products) && item.products.length > 0
            ? item.products
            : prev.products || [],
        messages:
          Array.isArray(item.messages) &&
          item.messages.length >= (prev.messages?.length || 0)
            ? item.messages
            : prev.messages || [],
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

  // Preserve local session UI tab/auth state while merging all shared collections
  merged.activeTab = localState.activeTab || 'home';

  const localUser = localState.user || {};
  const remoteUser = (remoteState && (remoteState as any).user) || {};
  merged.user = localState.isAuthenticated
    ? {
        ...remoteUser,
        ...localUser,
        isSeller: Boolean(localUser.isSeller || (localUser.email && remoteUser.email === localUser.email && remoteUser.isSeller)),
        shopName: localUser.shopName || (localUser.email === remoteUser.email ? remoteUser.shopName : '') || '',
        ownSellerId: localUser.ownSellerId || (localUser.email === remoteUser.email ? remoteUser.ownSellerId : '') || '',
      }
    : localUser;

  // Merge registeredUsers by email / id
  let regUsers = mergeByKey(
    localState.registeredUsers || [],
    (remoteState as any)?.registeredUsers || [],
    (u) => (u.email ? String(u.email).toLowerCase() : String(u.id || ''))
  );

  // Ensure current authenticated user or remote user with email is always in registeredUsers
  [localUser, remoteUser].forEach((u) => {
    if (u && (u.email || u.shopName) && (u.name || u.shopName)) {
      const emailKey = (u.email || `${(u.shopName || 'seller').toLowerCase().replace(/[^a-z0-9]/g, '')}@ukayo.ph`).toLowerCase();
      const idx = regUsers.findIndex(
        (existing) => (existing.email || '').toLowerCase() === emailKey || (u.id && existing.id === u.id)
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
        ownSellerId: u.ownSellerId || (u.isSeller ? 'seller_' + (u.id || 'shop') : ''),
        taxTier: u.taxTier || 'Starter Micro-Seller (≤ ₱500k Annual • Sworn Declaration)',
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
          shopName: normalizedAcc.shopName || regUsers[idx].shopName,
          ownSellerId: normalizedAcc.ownSellerId || regUsers[idx].ownSellerId,
        };
      } else {
        regUsers.push(normalizedAcc);
      }
    }
  });

  merged.registeredUsers = regUsers;

  // Sync current logged-in user with updated registeredUsers record (e.g. if Seller registration or Admin KYC approval happened)
  if (merged.user && merged.user.email) {
    const matchedReg = regUsers.find(
      (r) => (r.email || '').toLowerCase() === String(merged.user.email).toLowerCase()
    );
    if (matchedReg) {
      merged.user = {
        ...merged.user,
        ...matchedReg,
      };
    }
  }

  // Merge sellers
  let sellers = mergeByKey(
    localState.sellers || [],
    (remoteState as any)?.sellers || [],
    (s) => String(s.id || s.name || '')
  );

  // Merge kycApplications
  let kycApps = mergeByKey(
    localState.kycApplications || [],
    (remoteState as any)?.kycApplications || [],
    (k) => String(k.id || k.shopName || k.userId || '')
  );

  // Backfill sellers & kycApplications from any registeredUsers with isSeller === true
  regUsers.forEach((u) => {
    if (u.isSeller && u.shopName) {
      const sellerId = u.ownSellerId || `seller_${u.id}`;
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
          idType: u.idType || 'Philippine National ID (PhilSys / ePhilID)',
          idNumber: u.idNumber || 'Submitted',
          taxTier: u.taxTier || 'Starter Micro-Seller (≤ ₱500k Annual • Sworn Declaration)',
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

  merged.sellers = sellers;
  merged.kycApplications = kycApps;

  merged.liveItems = mergeByKey(
    localState.liveItems || [],
    (remoteState as any)?.liveItems || [],
    (i) => String(i.id || '')
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

  merged.supportThreads = mergeByKey(
    localState.supportThreads || [],
    (remoteState as any)?.supportThreads || [],
    (t) => String(t.id || '')
  );

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

export function startUkayoCloudSync<T extends Record<string, any>>(
  storageKey: string,
  getCurrentState: () => T,
  onRemoteStateMerged: (merged: T) => void
) {
  const syncDocRef = doc(db, 'ukayo_sync', 'live_state');
  let isApplyingRemote = false;
  let lastPushedJson = '';

  const pushStateToCloud = async (nextState: T) => {
    if (isApplyingRemote) return;
    try {
      const normalized = normalizeAndMergeUkayoState(nextState, null);
      const payloadJson = JSON.stringify(normalized);
      if (
        payloadJson === lastPushedJson ||
        payloadJson.length < 2 ||
        payloadJson.length > 940000
      ) {
        return;
      }
      lastPushedJson = payloadJson;
      await setDoc(syncDocRef, {
        payloadJson,
        updatedAt: new Date().toISOString(),
        updatedBy: 'marketplace',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('permission')
      ) {
        handleFirestoreError(error, OperationType.WRITE, SYNC_DOC_PATH);
      }
    }
  };

  (window as unknown as { ukayoCloudSyncPush?: (s: T) => void }).ukayoCloudSyncPush =
    pushStateToCloud;

  const unsubscribe = onSnapshot(
    syncDocRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        // Seed initial local state to Firestore if remote document doesn't exist yet
        const current = getCurrentState();
        pushStateToCloud(current);
        return;
      }
      const data = snapshot.data();
      if (!data || typeof data.payloadJson !== 'string') return;
      if (data.payloadJson === lastPushedJson) return;

      try {
        const remoteParsed = JSON.parse(data.payloadJson);
        isApplyingRemote = true;
        const current = getCurrentState();
        const merged = normalizeAndMergeUkayoState(current, remoteParsed);
        const mergedJson = JSON.stringify(merged);
        lastPushedJson = data.payloadJson;
        localStorage.setItem(storageKey, mergedJson);
        onRemoteStateMerged(merged);
      } catch {
        // ignore malformed payload
      } finally {
        setTimeout(() => {
          isApplyingRemote = false;
        }, 80);
      }
    },
    (error) => {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('permission')
      ) {
        handleFirestoreError(error, OperationType.GET, SYNC_DOC_PATH);
      }
    }
  );

  return unsubscribe;
}
