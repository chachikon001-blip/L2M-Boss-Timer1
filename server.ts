import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_FILE = path.join(__dirname, 'bosses_data.json');
const ACT_FILE = path.join(__dirname, 'activities_data.json');
const CONFIG_FILE = path.join(__dirname, 'server_config.json');

// In-memory bosses state
let currentBosses: any[] = [];
let currentActivities: any[] = [];
let serverConfig = {
  mainServerName: 'เซิร์ฟหลัก 01',
  invasionServerName: 'Invasion 01',
};

// Load initial bosses if file exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    currentBosses = JSON.parse(raw);
    console.log(`Loaded ${currentBosses.length} bosses from storage.`);
  } catch (e) {
    console.error('Error reading bosses_data.json:', e);
  }
}

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    serverConfig = { ...serverConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading server_config.json:', e);
  }
}

if (fs.existsSync(ACT_FILE)) {
  try {
    const raw = fs.readFileSync(ACT_FILE, 'utf-8');
    currentActivities = JSON.parse(raw);
  } catch (e) {
    console.error('Error reading activities_data.json:', e);
  }
}

// Helper to check if invasion boss has passed 00:00 midnight
function isOverMidnightInvasion(respawnAt: number | null, now: number): boolean {
  if (!respawnAt) return false;
  const respDate = new Date(respawnAt);
  const midnight = new Date(
    respDate.getFullYear(),
    respDate.getMonth(),
    respDate.getDate() + 1,
    0, 0, 0, 0
  ).getTime();
  return now >= midnight;
}

// Normalize and seed bosses: ensure both main and invasion servers have full boss lists
function normalizeAndSeedBosses() {
  let changed = false;
  const now = Date.now();

  currentBosses = currentBosses.map((boss) => {
    let b = { ...boss };
    if (!b.server) {
      changed = true;
      const isInv = b.id && String(b.id).startsWith('invasion-');
      b.server = isInv ? 'invasion' : 'main';
      b.serverTag = isInv ? 'เซิร์ฟ Invasion' : 'เซิร์ฟหลัก';
    }

    // Invasion bosses: เวลา --:-- ไว้รอให้มาใส่เวลาทีหลัง และเวลาเกิน 00.00 ให้กลับไปเป็น --:--
    if (b.server === 'invasion' && b.respawnAt !== null) {
      if (isOverMidnightInvasion(b.respawnAt, now)) {
        b.respawnAt = null;
        b.lastKilledAt = null;
        b.lastAlertCycleRespawnAt = null;
        b.notifiedStages = {};
        changed = true;
      }
    }
    return b;
  });

  const mainBosses = currentBosses.filter((b) => b.server === 'main');
  const invasionBosses = currentBosses.filter((b) => b.server === 'invasion');

  if (invasionBosses.length === 0 && mainBosses.length > 0) {
    console.log('Generating Invasion bosses from Main bosses with --:-- initial times...');
    const generatedInvasion = mainBosses.map((mb) => {
      return {
        ...mb,
        id: `invasion-${mb.num || String(mb.id).replace('boss-', '')}`,
        server: 'invasion',
        serverTag: 'เซิร์ฟ Invasion',
        lastKilledAt: null,
        respawnAt: null,
        lastAlertCycleRespawnAt: null,
        notifiedStages: {},
      };
    });

    currentBosses = [...mainBosses, ...generatedInvasion];
    changed = true;
  }

  if (changed) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(currentBosses, null, 2), 'utf-8');
      console.log(`Normalized and saved ${currentBosses.length} bosses to ${DATA_FILE}`);
    } catch (err) {
      console.error('Error saving normalized bosses:', err);
    }
  }
}

normalizeAndSeedBosses();

// SSE Connected Clients
const sseClients = new Set<Response>();

function broadcastBossesUpdate() {
  const payload = JSON.stringify({ type: 'SYNC_BOSSES', data: currentBosses, timestamp: Date.now() });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentBosses, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving bosses_data.json:', err);
  }
}

function broadcastServerConfigUpdate() {
  const payload = JSON.stringify({ type: 'SYNC_SERVER_CONFIG', data: serverConfig, timestamp: Date.now() });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(serverConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server_config.json:', err);
  }
}

function broadcastActivitiesUpdate() {
  const payload = JSON.stringify({ type: 'SYNC_ACTIVITIES', data: currentActivities, timestamp: Date.now() });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
  try {
    fs.writeFileSync(ACT_FILE, JSON.stringify(currentActivities, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving activities_data.json:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // SSE Endpoint for instant real-time synchronization between all users
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial snapshot immediately
    res.write(`data: ${JSON.stringify({ type: 'SYNC_BOSSES', data: currentBosses, timestamp: Date.now() })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'SYNC_SERVER_CONFIG', data: serverConfig, timestamp: Date.now() })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // GET server config
  app.get('/api/server-config', (_req: Request, res: Response) => {
    res.json(serverConfig);
  });

  // POST server config
  app.post('/api/server-config', (req: Request, res: Response) => {
    const { mainServerName, invasionServerName } = req.body;
    if (typeof mainServerName === 'string') serverConfig.mainServerName = mainServerName.trim() || 'เซิร์ฟหลัก';
    if (typeof invasionServerName === 'string') serverConfig.invasionServerName = invasionServerName.trim() || 'เซิร์ฟ Invasion';
    broadcastServerConfigUpdate();
    res.json({ success: true, serverConfig });
  });

  // GET bosses
  app.get('/api/bosses', (_req: Request, res: Response) => {
    res.json({ bosses: currentBosses, onlineCount: sseClients.size });
  });

  // POST update all bosses (e.g. initial sync or bulk import)
  app.post('/api/bosses', (req: Request, res: Response) => {
    const { bosses } = req.body;
    if (Array.isArray(bosses)) {
      currentBosses = bosses;
      broadcastBossesUpdate();
      res.json({ success: true, count: currentBosses.length });
    } else {
      res.status(400).json({ error: 'bosses must be an array' });
    }
  });

  // POST update single boss
  app.post('/api/bosses/update', (req: Request, res: Response) => {
    let { boss } = req.body;
    if (!boss || !boss.id) {
      return res.status(400).json({ error: 'invalid boss data' });
    }

    // Invasion: if time exceeds midnight, revert to --:--
    if (boss.server === 'invasion' && boss.respawnAt !== null) {
      if (isOverMidnightInvasion(boss.respawnAt, Date.now())) {
        boss = {
          ...boss,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {},
        };
      }
    }

    const index = currentBosses.findIndex((b) => b.id === boss.id);
    if (index >= 0) {
      currentBosses[index] = { ...currentBosses[index], ...boss };
    } else {
      currentBosses.push(boss);
    }

    broadcastBossesUpdate();
    res.json({ success: true, boss: currentBosses[index >= 0 ? index : currentBosses.length - 1] });
  });

  // POST quick update / next cycle boss
  app.post('/api/bosses/kill', (req: Request, res: Response) => {
    const { id, killTime } = req.body;
    const now = killTime || Date.now();

    const boss = currentBosses.find((b) => b.id === id);
    if (boss) {
      // เอาเวลาที่เกิด + คูลดาวน์ หาเวลาเกิดรอบใหม่
      const baseTime = boss.respawnAt ? boss.respawnAt : now;
      const respawn = baseTime + (boss.cooldownHours || 4) * 3600 * 1000;
      boss.lastKilledAt = baseTime;

      // ถ้าเป็นเซิร์ฟ Invasion และเวลาที่คำนวณได้เกิน 00:00 (ข้ามเที่ยงคืน) ให้กลับไปเป็น --:-- (null)
      if (boss.server === 'invasion') {
        const baseDate = new Date(baseTime);
        const midnight = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate() + 1,
          0, 0, 0, 0
        ).getTime();

        if (respawn >= midnight) {
          boss.respawnAt = null;
          boss.lastAlertCycleRespawnAt = null;
          boss.notifiedStages = {};
          broadcastBossesUpdate();
          return res.json({ success: true, boss, resetOverMidnight: true });
        }
      }

      boss.respawnAt = respawn;
      boss.lastAlertCycleRespawnAt = respawn;
      boss.notifiedStages = {};
      broadcastBossesUpdate();
      return res.json({ success: true, boss });
    }
    res.status(404).json({ error: 'Boss not found' });
  });

  // POST reset all invasion bosses back to --:--
  app.post('/api/bosses/reset-invasion', (_req: Request, res: Response) => {
    currentBosses = currentBosses.map((b) => {
      if (b.server === 'invasion') {
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {},
        };
      }
      return b;
    });
    broadcastBossesUpdate();
    res.json({ success: true, message: 'All invasion bosses reset to --:--' });
  });

  // POST reset invasion bosses that passed midnight (00:00)
  app.post('/api/bosses/reset-invasion-midnight', (_req: Request, res: Response) => {
    const now = Date.now();
    let changed = false;
    currentBosses = currentBosses.map((b) => {
      if (b.server === 'invasion' && b.respawnAt !== null && isOverMidnightInvasion(b.respawnAt, now)) {
        changed = true;
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {},
        };
      }
      return b;
    });
    if (changed) {
      broadcastBossesUpdate();
    }
    res.json({ success: true, changed });
  });

  // Background interval: clean up invasion bosses that passed midnight
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    currentBosses = currentBosses.map((b) => {
      if (b.server === 'invasion' && b.respawnAt !== null && isOverMidnightInvasion(b.respawnAt, now)) {
        changed = true;
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {},
        };
      }
      return b;
    });
    if (changed) {
      broadcastBossesUpdate();
    }
  }, 10000);

  // POST reboot server: calculate new respawn times using rebootTimestamp + rules
  app.post('/api/bosses/reboot', (req: Request, res: Response) => {
    const { targetServer, rebootTimestamp, rules, defaultBosses } = req.body;

    if (Array.isArray(defaultBosses) && defaultBosses.length > 0) {
      currentBosses = defaultBosses;
      broadcastBossesUpdate();
      return res.json({ success: true, message: 'Server reset to default bosses' });
    }

    if (rebootTimestamp && Array.isArray(rules)) {
      let matchedCount = 0;
      currentBosses = currentBosses.map((boss) => {
        // Check if boss belongs to target server
        if (targetServer && targetServer !== 'all' && boss.server !== targetServer) {
          return boss;
        }

        // Find matching rule
        const matchedRule = rules.find((r: any) => {
          const kw = (r.matchKeyword || r.bossDisplayName || '').toLowerCase().trim();
          return (
            boss.thaiName.toLowerCase().includes(kw) ||
            boss.engName.toLowerCase().includes(kw) ||
            boss.name.toLowerCase().includes(kw)
          );
        });

        if (matchedRule) {
          matchedCount++;
          const newRespawn = Number(rebootTimestamp) + Number(matchedRule.offsetHours) * 3600 * 1000;
          return {
            ...boss,
            lastKilledAt: Number(rebootTimestamp),
            respawnAt: newRespawn,
            lastAlertCycleRespawnAt: newRespawn,
            notifiedStages: {},
          };
        }

        return boss;
      });

      broadcastBossesUpdate();
      return res.json({ success: true, count: matchedCount, message: `Reboot applied to ${matchedCount} bosses` });
    }

    // Default clear respawn times
    currentBosses = currentBosses.map((b) => ({
      ...b,
      lastKilledAt: null,
      respawnAt: null,
      lastAlertCycleRespawnAt: null,
      notifiedStages: {},
    }));
    broadcastBossesUpdate();
    res.json({ success: true, message: 'Server rebooted and synced' });
  });

  // GET activities
  app.get('/api/activities', (_req: Request, res: Response) => {
    res.json({ activities: currentActivities });
  });

  // POST save activities
  app.post('/api/activities', (req: Request, res: Response) => {
    const { activities } = req.body;
    if (Array.isArray(activities)) {
      currentActivities = activities;
      broadcastActivitiesUpdate();
      res.json({ success: true, count: currentActivities.length });
    } else {
      res.status(400).json({ error: 'activities must be an array' });
    }
  });

  // Discord Webhook trigger proxy (client-safe)
  app.post('/api/discord/webhook', async (req: Request, res: Response) => {
    const { webhookUrl, message, username, avatar_url, embeds } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Missing webhookUrl' });
    }
    try {
      const payload: any = {
        username: username || 'L2M Boss Notifier',
        avatar_url: avatar_url || 'https://cdn-icons-png.flaticon.com/512/3655/3655581.png',
      };
      if (message) payload.content = message;
      if (embeds && Array.isArray(embeds)) payload.embeds = embeds;

      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!discordRes.ok) {
        return res.status(400).json({ error: `Discord error: ${discordRes.statusText}` });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Webhook failed' });
    }
  });

  // Vite integration
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Periodic check to reset Invasion bosses whose time has passed 00:00 (midnight)
  setInterval(() => {
    const now = Date.now();
    let hasChanged = false;
    currentBosses = currentBosses.map((boss) => {
      if (boss.server === 'invasion' && boss.respawnAt) {
        const respawnDate = new Date(boss.respawnAt);
        const midnight = new Date(
          respawnDate.getFullYear(),
          respawnDate.getMonth(),
          respawnDate.getDate() + 1,
          0, 0, 0, 0
        ).getTime();

        if (now >= midnight) {
          hasChanged = true;
          return {
            ...boss,
            respawnAt: null,
            lastAlertCycleRespawnAt: null,
            notifiedStages: {},
          };
        }
      }
      return boss;
    });

    if (hasChanged) {
      broadcastBossesUpdate();
    }
  }, 10000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
