import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import agoraTokenPkg from 'agora-token';

const { RtcTokenBuilder, RtcRole } = agoraTokenPkg;

const PORT = 3000;
const STATE_FILE_PATH = '/tmp/ukayo_live_state_v11.json';
const AGORA_APP_ID =
  process.env.VITE_AGORA_APP_ID || 'df0c2affcab4490097fa942593e13a57';
const AGORA_PRIMARY_CERT =
  process.env.AGORA_PRIMARY_CERTIFICATE || '00cbfd8d6a124c9fb14a7f1862310bde';

interface LiveStreamPayload {
  sellerId: string;
  sellerName?: string;
  isCameraLive: boolean;
  frameDataUrl: string;
  pinnedItemId?: string;
  pinnedItem?: Record<string, unknown> | null;
  liveTitle?: string;
  updatedAt: number;
}

let serverPayloadJson = '';
let serverUpdatedAt = new Date().toISOString();
let latestLiveStream: LiveStreamPayload | null = null;
const liveStreamsBySeller = new Map<string, LiveStreamPayload>();

// Load persisted state if present
try {
  if (fs.existsSync(STATE_FILE_PATH)) {
    const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    if (raw && raw.trim().startsWith('{')) {
      serverPayloadJson = raw;
    }
  }
} catch {
  // ignore file read errors
}

function mergeByKeyServer(
  baseList: any[] = [],
  incomingList: any[] = [],
  keyFn: (item: any) => string
): any[] {
  const map = new Map<string, any>();
  (Array.isArray(baseList) ? baseList : []).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const k = keyFn(item);
    if (k) map.set(k, item);
  });
  (Array.isArray(incomingList) ? incomingList : []).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const k = keyFn(item);
    if (!k) return;
    const prev = map.get(k);
    if (!prev) {
      map.set(k, item);
      return;
    }
    const mergedFollowedBy = Array.from(
      new Set([
        ...(Array.isArray(prev.followedBy) ? prev.followedBy : []),
        ...(Array.isArray(item.followedBy) ? item.followedBy : []),
      ])
    );
    map.set(k, {
      ...prev,
      ...item,
      isSeller: Boolean(prev.isSeller || item.isSeller),
      verified: Boolean(prev.verified || item.verified),
      followedBy: mergedFollowedBy,
      followers: Math.max(
        mergedFollowedBy.length,
        Number(prev.followers) || 0,
        Number(item.followers) || 0
      ),
    });
  });
  return Array.from(map.values());
}

function mergeMessagesServer(localMsgs: any[] = [], remoteMsgs: any[] = []): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  [
    ...(Array.isArray(localMsgs) ? localMsgs : []),
    ...(Array.isArray(remoteMsgs) ? remoteMsgs : []),
  ].forEach((m) => {
    if (!m || typeof m !== 'object' || !m.text) return;
    const key = m.id
      ? String(m.id)
      : `${m.from || m.sender || ''}|${m.badge || ''}|${m.text}|${m.time || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(m);
  });
  return result;
}

function mergeIncomingStateOnServer(existingJson: string, incomingJson: string): string {
  if (!existingJson) return incomingJson;
  try {
    const base = JSON.parse(existingJson);
    const inc = JSON.parse(incomingJson);

    const deletedUserIds = Array.from(
      new Set([
        ...(Array.isArray(base.deletedUserIds) ? base.deletedUserIds : []),
        ...(Array.isArray(inc.deletedUserIds) ? inc.deletedUserIds : []),
      ])
    ).filter(Boolean);
    const deletedSet = new Set(deletedUserIds.map((x: any) => String(x).toLowerCase()));

    const mergedSellers = mergeByKeyServer(
      base.sellers,
      inc.sellers,
      (s) => String(s.id || s.name || '')
    )
      .filter((s) => {
        const sId = String(s?.id || '').toLowerCase();
        const sName = String(s?.name || '').toLowerCase();
        return !deletedSet.has(sId) && (!sName || !deletedSet.has(sName));
      })
      .map((s) => {
        const bS = (base.sellers || []).find((x: any) => x?.id === s.id);
        const iS = (inc.sellers || []).find((x: any) => x?.id === s.id);
        if (bS && iS) {
          s.products = mergeByKeyServer(
            bS.products,
            iS.products,
            (p) => String(p.id || p.code || '')
          );
        }
        return s;
      });

    const mergedDirectChats: Record<string, any[]> = {};
    const allChatKeys = new Set([
      ...Object.keys(base.directChats || {}),
      ...Object.keys(inc.directChats || {}),
    ]);
    allChatKeys.forEach((k) => {
      mergedDirectChats[k] = mergeMessagesServer(
        base.directChats?.[k] || [],
        inc.directChats?.[k] || []
      );
    });

    const mergedSupport = mergeByKeyServer(
      base.supportThreads,
      inc.supportThreads,
      (t) => String(t.id || '')
    ).map((t) => {
      const bT = (base.supportThreads || []).find((x: any) => x?.id === t.id);
      const iT = (inc.supportThreads || []).find((x: any) => x?.id === t.id);
      t.messages = mergeMessagesServer(bT?.messages || [], iT?.messages || []);
      return t;
    });

    const merged = {
      ...base,
      ...inc,
      deletedUserIds,
      registeredUsers: mergeByKeyServer(
        base.registeredUsers,
        inc.registeredUsers,
        (u) => String(u.email || u.id || '').toLowerCase()
      ).filter((u) => {
        const idKey = String(u?.id || '').toLowerCase();
        const emailKey = String(u?.email || '').toLowerCase();
        return !deletedSet.has(idKey) && !deletedSet.has(emailKey);
      }),
      sellers: mergedSellers,
      kycApplications: mergeByKeyServer(
        base.kycApplications,
        inc.kycApplications,
        (k) => String(k.id || k.shopName || k.userId || '')
      ),
      liveItems: mergeByKeyServer(
        base.liveItems,
        inc.liveItems,
        (i) => String(i.id || '')
      ),
      liveChat: mergeMessagesServer(base.liveChat, inc.liveChat).slice(-60),
      feedPosts: mergeByKeyServer(
        base.feedPosts,
        inc.feedPosts,
        (p) => String(p.id || '')
      ),
      minedOrders: mergeByKeyServer(
        base.minedOrders,
        inc.minedOrders,
        (o) => String(o.id || '')
      ),
      directChats: mergedDirectChats,
      supportThreads: mergedSupport,
      activeLiveSellerId: inc.activeLiveSellerId || base.activeLiveSellerId || '',
      activePinnedItemId: inc.activePinnedItemId || base.activePinnedItemId || '',
    };

    return JSON.stringify(merged);
  } catch {
    return incomingJson;
  }
}

const sseClients = new Set<Response>();

function broadcastSseEvent(eventType: 'sync' | 'live_frame', data: unknown) {
  const frame = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(frame);
    } catch {
      sseClients.delete(client);
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // 0. Official Agora Dynamic 007 RTC Token Endpoint (Prevents invalid token & dynamic use static key errors)
  app.get('/api/agora-token', (req: Request, res: Response) => {
    try {
      const channelName = String(req.query.channel || 'ukayo_live_room').trim();
      const uid = Number(req.query.uid) || Math.floor(10000 + Math.random() * 89999);
      const roleParam = String(req.query.role || 'audience').toLowerCase();
      const role =
        roleParam === 'host' || roleParam === 'publisher'
          ? RtcRole.PUBLISHER
          : RtcRole.SUBSCRIBER;
      const expireSeconds = 24 * 3600;
      const token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_PRIMARY_CERT,
        channelName,
        uid,
        role,
        expireSeconds,
        expireSeconds
      );
      res.json({
        token,
        appId: AGORA_APP_ID,
        channelName,
        uid,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate Agora token', details: String(err) });
    }
  });

  // 1. Real-Time Shared State Sync API (Zero-Quota Cross-Device Sync)
  app.get('/api/sync-state', (_req: Request, res: Response) => {
    res.json({
      payloadJson: serverPayloadJson,
      updatedAt: serverUpdatedAt,
      latestLiveStream,
    });
  });

  app.post('/api/sync-state', (req: Request, res: Response) => {
    const incomingJson =
      typeof req.body?.payloadJson === 'string'
        ? req.body.payloadJson
        : req.body && typeof req.body === 'object'
        ? JSON.stringify(req.body)
        : '';

    if (!incomingJson || incomingJson.length < 2) {
      res.status(400).json({ error: 'Invalid payloadJson' });
      return;
    }

    serverPayloadJson = mergeIncomingStateOnServer(serverPayloadJson, incomingJson);
    serverUpdatedAt = new Date().toISOString();

    try {
      fs.writeFileSync(STATE_FILE_PATH, serverPayloadJson, 'utf-8');
    } catch {
      // ignore disk write errors
    }

    broadcastSseEvent('sync', {
      payloadJson: serverPayloadJson,
      updatedAt: serverUpdatedAt,
    });

    res.json({
      ok: true,
      payloadJson: serverPayloadJson,
      updatedAt: serverUpdatedAt,
    });
  });

  // 2. Real-Time Live Camera Frame + Pinned Item Broadcast API
  app.get('/api/live-frame', (req: Request, res: Response) => {
    const sellerId = String(req.query.sellerId || '');
    const match =
      (sellerId && liveStreamsBySeller.get(sellerId)) || latestLiveStream;
    res.json({ stream: match || null });
  });

  app.post('/api/live-frame', (req: Request, res: Response) => {
    const body = req.body as LiveStreamPayload;
    if (!body || !body.sellerId) {
      res.status(400).json({ error: 'Missing sellerId' });
      return;
    }
    const clean: LiveStreamPayload = {
      sellerId: String(body.sellerId),
      sellerName: String(body.sellerName || ''),
      isCameraLive: Boolean(body.isCameraLive),
      frameDataUrl: body.isCameraLive ? String(body.frameDataUrl || '') : '',
      pinnedItemId: String(body.pinnedItemId || ''),
      pinnedItem: body.pinnedItem || null,
      liveTitle: String(body.liveTitle || ''),
      updatedAt: Date.now(),
    };
    liveStreamsBySeller.set(clean.sellerId, clean);
    latestLiveStream = clean;

    broadcastSseEvent('live_frame', clean);
    res.json({ ok: true });
  });

  // 3. Server-Sent Events (SSE) Stream for Instant Cross-Device Updates
  app.get('/api/sync-events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    if (serverPayloadJson) {
      res.write(
        `event: sync\ndata: ${JSON.stringify({
          payloadJson: serverPayloadJson,
          updatedAt: serverUpdatedAt,
        })}\n\n`
      );
    }
    if (latestLiveStream) {
      res.write(
        `event: live_frame\ndata: ${JSON.stringify(latestLiveStream)}\n\n`
      );
    }

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 4. Vite Dev Middleware or Production Static Files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UKAYO Real-Time Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
