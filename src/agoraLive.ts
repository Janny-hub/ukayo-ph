import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';

// Suppress verbose Agora console logs in production (prevent transient WS_ABORT logs on unmount)
AgoraRTC.setLogLevel(4);

export const UKAYO_AGORA_APP_ID =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_AGORA_APP_ID) ||
  'df0c2affcab4490097fa942593e13a57';

export const UKAYO_AGORA_PRIMARY_CERTIFICATE =
  '00cbfd8d6a124c9fb14a7f1862310bde';

export function getAgoraChannelName(_sellerId?: string): string {
  return 'ukayo_live_room';
}

export async function fetchOfficialAgoraToken(
  channelName: string,
  uid: number,
  role: 'host' | 'audience'
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/agora-token?channel=${encodeURIComponent(
        channelName
      )}&uid=${encodeURIComponent(String(uid))}&role=${encodeURIComponent(
        role
      )}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.token === 'string' && data.token.length > 10
      ? data.token
      : null;
  } catch {
    return null;
  }
}

async function joinChannelWithTokenOrFallback(
  client: IAgoraRTCClient,
  channelName: string,
  role: 'host' | 'audience',
  isCancelled?: () => boolean
) {
  const uid = Math.floor(10000 + Math.random() * 89999);
  const cleanAppId = (
    UKAYO_AGORA_APP_ID === 'MY_AGORA_APP_ID' || !UKAYO_AGORA_APP_ID
      ? 'df0c2affcab4490097fa942593e13a57'
      : UKAYO_AGORA_APP_ID
  ).trim();

  const token = await fetchOfficialAgoraToken(channelName, uid, role);
  if (isCancelled?.()) return;
  if (!token) {
    throw new Error('Agora dynamic token unavailable');
  }
  await client.join(cleanAppId, channelName, token, uid);
}

let hostClient: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;

export async function startAgoraHostBroadcast(
  sellerId: string,
  facingMode: 'environment' | 'user' = 'environment',
  videoElement?: HTMLVideoElement | null
): Promise<{ success: boolean; mediaStream: MediaStream | null }> {
  await stopAgoraHostBroadcast();

  try {
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    hostClient = client;
    await client.setClientRole('host');

    const channelName = getAgoraChannelName(sellerId);
    await joinChannelWithTokenOrFallback(client, channelName, 'host');

    const [audioTrack, videoTrack] =
      await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        {
          facingMode,
          encoderConfig: '480p_1',
        }
      );

    localAudioTrack = audioTrack;
    localVideoTrack = videoTrack;

    const combinedStream = new MediaStream([
      videoTrack.getMediaStreamTrack(),
      audioTrack.getMediaStreamTrack(),
    ]);

    if (videoElement) {
      videoElement.srcObject = combinedStream;
    }

    await client.publish([audioTrack, videoTrack]);
    return { success: true, mediaStream: combinedStream };
  } catch {
    await stopAgoraHostBroadcast();
    return { success: false, mediaStream: null };
  }
}

export async function stopAgoraHostBroadcast(): Promise<void> {
  try {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      localAudioTrack = null;
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      localVideoTrack = null;
    }
    if (hostClient) {
      const c = hostClient;
      hostClient = null;
      if (
        c.connectionState === 'CONNECTED' ||
        c.connectionState === 'CONNECTING' ||
        c.connectionState === 'RECONNECTING'
      ) {
        await c.leave();
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

export interface AudienceStreamCallbacks {
  onRemoteVideoStateChange: (isPlaying: boolean) => void;
  onRemoteAudioStateChange: (isPlaying: boolean) => void;
}

export function joinAgoraAudienceChannel(
  sellerId: string,
  remoteContainer: HTMLElement | null,
  callbacks: AudienceStreamCallbacks
): {
  leave: () => Promise<void>;
  setAudioMuted: (muted: boolean) => void;
} {
  let cancelled = false;
  let client: IAgoraRTCClient | null = null;
  let activeRemoteAudio: IRemoteAudioTrack | null = null;
  let audioMuted = false;
  let joinPromise: Promise<void> | null = null;

  const start = async () => {
    if (!sellerId || !remoteContainer || cancelled) return;
    try {
      const c = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      client = c;
      await c.setClientRole('audience');
      if (cancelled) return;

      const subscribeToRemoteUser = async (
        user: any,
        mediaType: 'video' | 'audio'
      ) => {
        if (cancelled || !client) return;
        try {
          await client.subscribe(user, mediaType);
          if (cancelled) return;

          if (mediaType === 'video' && user.videoTrack && remoteContainer) {
            remoteContainer.innerHTML = '';
            user.videoTrack.play(remoteContainer, { fit: 'cover' });
            setTimeout(() => {
              const vid = remoteContainer.querySelector('video');
              if (vid) {
                vid.style.width = '100%';
                vid.style.height = '100%';
                vid.style.objectFit = 'cover';
              }
            }, 50);
            callbacks.onRemoteVideoStateChange(true);
          }

          if (mediaType === 'audio' && user.audioTrack) {
            activeRemoteAudio = user.audioTrack;
            if (!audioMuted) {
              user.audioTrack.play();
              callbacks.onRemoteAudioStateChange(true);
            }
          }
        } catch {
          // ignore subscription error
        }
      };

      c.on('user-published', async (user, mediaType) => {
        if (mediaType === 'video' || mediaType === 'audio') {
          await subscribeToRemoteUser(user, mediaType);
        }
      });

      c.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          callbacks.onRemoteVideoStateChange(false);
        }
        if (mediaType === 'audio') {
          if (activeRemoteAudio === user.audioTrack) {
            activeRemoteAudio = null;
          }
          callbacks.onRemoteAudioStateChange(false);
        }
      });

      c.on('user-left', () => {
        callbacks.onRemoteVideoStateChange(false);
        callbacks.onRemoteAudioStateChange(false);
      });

      const channelName = getAgoraChannelName(sellerId);
      joinPromise = joinChannelWithTokenOrFallback(
        c,
        channelName,
        'audience',
        () => cancelled
      );
      await joinPromise;
      joinPromise = null;

      if (cancelled) {
        if (c.connectionState === 'CONNECTED') {
          await c.leave().catch(() => {});
        }
        return;
      }

      // Also subscribe if host was already publishing in channel
      if (!cancelled && client && Array.isArray(client.remoteUsers)) {
        for (const rUser of client.remoteUsers) {
          if (rUser.hasVideo) {
            await subscribeToRemoteUser(rUser, 'video');
          }
          if (rUser.hasAudio) {
            await subscribeToRemoteUser(rUser, 'audio');
          }
        }
      }
    } catch {
      joinPromise = null;
      callbacks.onRemoteVideoStateChange(false);
      callbacks.onRemoteAudioStateChange(false);
    }
  };

  // Small 120ms debounce before opening WebSocket so rapid React state/strict-mode re-renders don't abort an in-flight join
  const startTimer = setTimeout(() => {
    if (!cancelled) {
      start();
    }
  }, 120);

  return {
    leave: async () => {
      cancelled = true;
      clearTimeout(startTimer);
      callbacks.onRemoteVideoStateChange(false);
      callbacks.onRemoteAudioStateChange(false);
      if (activeRemoteAudio) {
        try {
          activeRemoteAudio.stop();
        } catch {
          // ignore
        }
        activeRemoteAudio = null;
      }
      if (client) {
        const c = client;
        client = null;
        try {
          if (joinPromise) {
            await joinPromise.catch(() => {});
          }
          if (c.connectionState === 'CONNECTED') {
            await c.leave();
          }
        } catch {
          // ignore
        }
      }
    },
    setAudioMuted: (muted: boolean) => {
      audioMuted = muted;
      if (activeRemoteAudio) {
        try {
          if (muted) {
            activeRemoteAudio.stop();
            callbacks.onRemoteAudioStateChange(false);
          } else {
            activeRemoteAudio.play();
            callbacks.onRemoteAudioStateChange(true);
          }
        } catch {
          // ignore
        }
      }
    },
  };
}
