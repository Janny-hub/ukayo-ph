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
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const DEVICE_SESSION_KEY = 'ukayo_device_session_v1';

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
  merged.activeLiveSellerId = localState.activeLiveSellerId || '';
  merged.activePinnedItemId = localState.activePinnedItemId || '';
  merged.activeChatSellerId = localState.activeChatSellerId || 'admin_support';
  merged.activePurchaseFilter = localState.activePurchaseFilter || 'ALL';
  merged.searchQuery = localState.searchQuery || '';

  const remoteUser = (remoteState && (remoteState as any).user) || {};

  // Merge registeredUsers by email / id across all devices
  const regUsers = mergeByKey(
    localState.registeredUsers || [],
    (remoteState as any)?.registeredUsers || [],
    (u) => (u.email ? String(u.email).toLowerCase() : String(u.id || ''))
  );

  // Ensure any valid user object (local or remote) is preserved in registeredUsers
  [localUser, remoteUser].forEach((u) => {
    if (u && (u.email || u.shopName) && (u.name || u.shopName)) {
      const emailKey = (
        u.email ||
        `${(u.shopName || 'seller').toLowerCase().replace(/[^a-z0-9]/g, '')}@ukayo.ph`
      ).toLowerCase();
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

  // Merge sellers
  const sellers = mergeByKey(
    localState.sellers || [],
    (remoteState as any)?.sellers || [],
    (s) => String(s.id || s.name || '')
  );

  // Merge kycApplications
  const kycApps = mergeByKey(
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
      // Strip device-local session fields before writing to shared Firestore so devices never sign each other out
      const sharedCloudPayload: Record<string, any> = {
        ...normalized,
      };
      delete sharedCloudPayload.isAuthenticated;
      delete sharedCloudPayload.role;
      delete sharedCloudPayload.user;
      delete sharedCloudPayload.activeTab;

      const payloadJson = JSON.stringify(sharedCloudPayload);
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

  (
    window as unknown as { ukayoCloudSyncPush?: (s: T) => void }
  ).ukayoCloudSyncPush = pushStateToCloud;

  const unsubscribe = onSnapshot(
    syncDocRef,
    (snapshot) => {
      if (!snapshot.exists()) {
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

// ===========================================================================
// REAL-TIME FIRESTORE STATUS INDICATOR FOR USER PROFILE
// Fetches and streams the actual verificationStatus and sellerStatus directly
// from the centralized Firestore database (ukayo_sync/live_state).
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
          : 'Just now',
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
      lastSyncedAt: 'Error parsing Firestore document',
    };
  }
}

export function subscribeToUserFirestoreStatus(
  userId: string,
  userEmail: string,
  onStatusUpdate: (status: FirestoreUserLiveStatus) => void
) {
  const syncDocRef = doc(db, 'ukayo_sync', 'live_state');
  return onSnapshot(
    syncDocRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists()) {
        onStatusUpdate({
          loading: false,
          connected: true,
          fromServer: !snapshot.metadata.fromCache,
          foundInFirestore: false,
          verificationStatus: 'unverified',
          sellerStatus: 'none',
          verified: false,
          isSeller: false,
          shopName: '',
          kycIdType: '',
          lastSyncedAt: 'No Firestore doc yet',
        });
        return;
      }
      const data = snapshot.data();
      if (!data || typeof data.payloadJson !== 'string') return;
      const status = extractUserStatusFromFirestorePayload(
        data.payloadJson,
        data.updatedAt,
        userId,
        userEmail,
        !snapshot.metadata.fromCache
      );
      onStatusUpdate(status);
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
}

export async function fetchUserFirestoreStatusFromServer(
  userId: string,
  userEmail: string
): Promise<FirestoreUserLiveStatus> {
  const syncDocRef = doc(db, 'ukayo_sync', 'live_state');
  const snapshot = await getDocFromServer(syncDocRef);
  if (!snapshot.exists()) {
    return {
      loading: false,
      connected: true,
      fromServer: true,
      foundInFirestore: false,
      verificationStatus: 'unverified',
      sellerStatus: 'none',
      verified: false,
      isSeller: false,
      shopName: '',
      kycIdType: '',
      lastSyncedAt: new Date().toLocaleTimeString(),
    };
  }
  const data = snapshot.data();
  return extractUserStatusFromFirestorePayload(
    data?.payloadJson || '{}',
    data?.updatedAt,
    userId,
    userEmail,
    true
  );
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

