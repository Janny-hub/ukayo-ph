import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';

// Suppress verbose Agora console logs in production
AgoraRTC.setLogLevel(3);

export const UKAYO_AGORA_APP_ID =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_AGORA_APP_ID) ||
  'df0c2affcab4490097fa942593e13a57';

export const UKAYO_AGORA_PRIMARY_CERTIFICATE =
  '00cbfd8d6a124c9fb14a7f1862310bde';

export function getAgoraChannelName(sellerId: string): string {
  const clean = (sellerId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ukayo_live_${clean}`;
}

// ===========================================================================
// PURE BROWSER WEBSOCKET/WEBCRYPTO AGORA 006 RTC TOKEN BUILDER
// Supports projects with Primary Certificate enabled (00cbfd8d6a124c9fb14a7f1862310bde)
// ===========================================================================
function crc32(str: string): number {
  const bytes = new TextEncoder().encode(str);
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    let c = (crc ^ bytes[i]) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}

class ByteBuf {
  private buf: number[] = [];

  putUint16(v: number) {
    this.buf.push(v & 0xff, (v >>> 8) & 0xff);
    return this;
  }

  putUint32(v: number) {
    this.buf.push(
      v & 0xff,
      (v >>> 8) & 0xff,
      (v >>> 16) & 0xff,
      (v >>> 24) & 0xff
    );
    return this;
  }

  putBytes(bytes: Uint8Array) {
    this.putUint16(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      this.buf.push(bytes[i]);
    }
    return this;
  }

  putString(str: string) {
    return this.putBytes(new TextEncoder().encode(str));
  }

  pack(): Uint8Array {
    return new Uint8Array(this.buf);
  }
}

export async function buildAgoraRtcToken006(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: 'host' | 'audience'
): Promise<string | null> {
  try {
    if (!appCertificate || typeof crypto === 'undefined' || !crypto.subtle) {
      return null;
    }
    const uidStr = uid === 0 ? '' : String(uid >>> 0);
    const nowSec = Math.floor(Date.now() / 1000);
    const expireTs = nowSec + 24 * 3600;
    const salt = Math.floor(Math.random() * 0xffffffff) >>> 0;
    const ts = nowSec + 24 * 3600;

    const msgBuf = new ByteBuf();
    msgBuf.putUint32(salt);
    msgBuf.putUint32(ts);

    if (role === 'host') {
      msgBuf.putUint16(4);
      msgBuf.putUint16(1).putUint32(expireTs); // kJoinChannel
      msgBuf.putUint16(2).putUint32(expireTs); // kPublishAudioStream
      msgBuf.putUint16(3).putUint32(expireTs); // kPublishVideoStream
      msgBuf.putUint16(4).putUint32(expireTs); // kPublishDataStream
    } else {
      msgBuf.putUint16(1);
      msgBuf.putUint16(1).putUint32(expireTs); // kJoinChannel
    }
    const rawMsg = msgBuf.pack();

    const crcChannel = crc32(channelName);
    const crcUid = crc32(uidStr);

    const signBuf = new ByteBuf();
    signBuf.putString(appId);
    signBuf.putUint32(crcChannel);
    signBuf.putUint32(crcUid);
    signBuf.putBytes(rawMsg);

    const keyData = new TextEncoder().encode(appCertificate);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      signBuf.pack().buffer as ArrayBuffer
    );
    const signature = new Uint8Array(sigBuffer);

    const contentBuf = new ByteBuf();
    contentBuf.putBytes(signature);
    contentBuf.putUint32(crcChannel);
    contentBuf.putUint32(crcUid);
    contentBuf.putBytes(rawMsg);

    const contentBytes = contentBuf.pack();
    let binary = '';
    for (let i = 0; i < contentBytes.length; i++) {
      binary += String.fromCharCode(contentBytes[i]);
    }
    return '006' + appId + btoa(binary);
  } catch {
    return null;
  }
}

async function joinChannelWithTokenOrFallback(
  client: IAgoraRTCClient,
  channelName: string,
  role: 'host' | 'audience'
) {
  const uid = Math.floor(10000 + Math.random() * 89999);
  const cleanAppId = (
    UKAYO_AGORA_APP_ID === 'MY_AGORA_APP_ID' || !UKAYO_AGORA_APP_ID
      ? 'df0c2affcab4490097fa942593e13a57'
      : UKAYO_AGORA_APP_ID
  ).trim();

  const token = await buildAgoraRtcToken006(
    cleanAppId,
    UKAYO_AGORA_PRIMARY_CERTIFICATE,
    channelName,
    uid,
    role
  );

  if (token) {
    try {
      await client.join(cleanAppId, channelName, token, uid);
      return;
    } catch {
      // Fall back to null token in case Primary Certificate is disabled
    }
  }
  await client.join(cleanAppId, channelName, null, uid);
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
      await c.leave();
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

  const start = async () => {
    if (!sellerId || !remoteContainer) return;
    try {
      client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      await client.setClientRole('audience');

      client.on('user-published', async (user, mediaType) => {
        if (cancelled || !client) return;
        try {
          await client.subscribe(user, mediaType);
          if (cancelled) return;

          if (mediaType === 'video' && user.videoTrack && remoteContainer) {
            remoteContainer.innerHTML = '';
            user.videoTrack.play(remoteContainer, { fit: 'cover' });
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
      });

      client.on('user-unpublished', (user, mediaType) => {
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

      client.on('user-left', () => {
        callbacks.onRemoteVideoStateChange(false);
        callbacks.onRemoteAudioStateChange(false);
      });

      const channelName = getAgoraChannelName(sellerId);
      await joinChannelWithTokenOrFallback(client, channelName, 'audience');
    } catch {
      callbacks.onRemoteVideoStateChange(false);
      callbacks.onRemoteAudioStateChange(false);
    }
  };

  start();

  return {
    leave: async () => {
      cancelled = true;
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
          await c.leave();
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
