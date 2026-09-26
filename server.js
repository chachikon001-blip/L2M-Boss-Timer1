// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var DATA_FILE = path.join(__dirname, "bosses_data.json");
var ACT_FILE = path.join(__dirname, "activities_data.json");
var CONFIG_FILE = path.join(__dirname, "server_config.json");
var currentBosses = [];
var currentActivities = [];
var serverConfig = {
  mainServerName: "\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E2B\u0E25\u0E31\u0E01 01",
  invasionServerName: "Invasion 01"
};
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    currentBosses = JSON.parse(raw);
    console.log(`Loaded ${currentBosses.length} bosses from storage.`);
  } catch (e) {
    console.error("Error reading bosses_data.json:", e);
  }
}
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    serverConfig = { ...serverConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Error reading server_config.json:", e);
  }
}
if (fs.existsSync(ACT_FILE)) {
  try {
    const raw = fs.readFileSync(ACT_FILE, "utf-8");
    currentActivities = JSON.parse(raw);
  } catch (e) {
    console.error("Error reading activities_data.json:", e);
  }
}
function isOverMidnightInvasion(respawnAt, now) {
  if (!respawnAt) return false;
  const respDate = new Date(respawnAt);
  const midnight = new Date(
    respDate.getFullYear(),
    respDate.getMonth(),
    respDate.getDate() + 1,
    0,
    0,
    0,
    0
  ).getTime();
  return now >= midnight;
}
function normalizeAndSeedBosses() {
  let changed = false;
  const now = Date.now();
  currentBosses = currentBosses.map((boss) => {
    let b = { ...boss };
    if (!b.server) {
      changed = true;
      const isInv = b.id && String(b.id).startsWith("invasion-");
      b.server = isInv ? "invasion" : "main";
      b.serverTag = isInv ? "\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F Invasion" : "\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E2B\u0E25\u0E31\u0E01";
    }
    if (b.server === "invasion" && b.respawnAt !== null) {
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
  const mainBosses = currentBosses.filter((b) => b.server === "main");
  const invasionBosses = currentBosses.filter((b) => b.server === "invasion");
  if (invasionBosses.length === 0 && mainBosses.length > 0) {
    console.log("Generating Invasion bosses from Main bosses with --:-- initial times...");
    const generatedInvasion = mainBosses.map((mb) => {
      return {
        ...mb,
        id: `invasion-${mb.num || String(mb.id).replace("boss-", "")}`,
        server: "invasion",
        serverTag: "\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F Invasion",
        lastKilledAt: null,
        respawnAt: null,
        lastAlertCycleRespawnAt: null,
        notifiedStages: {}
      };
    });
    currentBosses = [...mainBosses, ...generatedInvasion];
    changed = true;
  }
  if (changed) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(currentBosses, null, 2), "utf-8");
      console.log(`Normalized and saved ${currentBosses.length} bosses to ${DATA_FILE}`);
    } catch (err) {
      console.error("Error saving normalized bosses:", err);
    }
  }
}
normalizeAndSeedBosses();
var sseClients = /* @__PURE__ */ new Set();
function broadcastBossesUpdate() {
  const payload = JSON.stringify({ type: "SYNC_BOSSES", data: currentBosses, timestamp: Date.now() });
  for (const client of sseClients) {
    client.write(`data: ${payload}

`);
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentBosses, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving bosses_data.json:", err);
  }
}
function broadcastServerConfigUpdate() {
  const payload = JSON.stringify({ type: "SYNC_SERVER_CONFIG", data: serverConfig, timestamp: Date.now() });
  for (const client of sseClients) {
    client.write(`data: ${payload}

`);
  }
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(serverConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving server_config.json:", err);
  }
}
function broadcastActivitiesUpdate() {
  const payload = JSON.stringify({ type: "SYNC_ACTIVITIES", data: currentActivities, timestamp: Date.now() });
  for (const client of sseClients) {
    client.write(`data: ${payload}

`);
  }
  try {
    fs.writeFileSync(ACT_FILE, JSON.stringify(currentActivities, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving activities_data.json:", err);
  }
}
async function startServer() {
  const app = express();
  app.use(express.json());
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: "SYNC_BOSSES", data: currentBosses, timestamp: Date.now() })}

`);
    res.write(`data: ${JSON.stringify({ type: "SYNC_SERVER_CONFIG", data: serverConfig, timestamp: Date.now() })}

`);
    sseClients.add(res);
    req.on("close", () => {
      sseClients.delete(res);
    });
  });
  app.get("/api/server-config", (_req, res) => {
    res.json(serverConfig);
  });
  app.post("/api/server-config", (req, res) => {
    const { mainServerName, invasionServerName } = req.body;
    if (typeof mainServerName === "string") serverConfig.mainServerName = mainServerName.trim() || "\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E2B\u0E25\u0E31\u0E01";
    if (typeof invasionServerName === "string") serverConfig.invasionServerName = invasionServerName.trim() || "\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F Invasion";
    broadcastServerConfigUpdate();
    res.json({ success: true, serverConfig });
  });
  app.get("/api/bosses", (_req, res) => {
    res.json({ bosses: currentBosses, onlineCount: sseClients.size });
  });
  app.post("/api/bosses", (req, res) => {
    const { bosses } = req.body;
    if (Array.isArray(bosses)) {
      currentBosses = bosses;
      broadcastBossesUpdate();
      res.json({ success: true, count: currentBosses.length });
    } else {
      res.status(400).json({ error: "bosses must be an array" });
    }
  });
  app.post("/api/bosses/update", (req, res) => {
    let { boss } = req.body;
    if (!boss || !boss.id) {
      return res.status(400).json({ error: "invalid boss data" });
    }
    if (boss.server === "invasion" && boss.respawnAt !== null) {
      if (isOverMidnightInvasion(boss.respawnAt, Date.now())) {
        boss = {
          ...boss,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {}
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
  app.post("/api/bosses/kill", (req, res) => {
    const { id, killTime } = req.body;
    const now = killTime || Date.now();
    const boss = currentBosses.find((b) => b.id === id);
    if (boss) {
      const baseTime = boss.respawnAt ? boss.respawnAt : now;
      const respawn = baseTime + (boss.cooldownHours || 4) * 3600 * 1e3;
      boss.lastKilledAt = baseTime;
      if (boss.server === "invasion") {
        const baseDate = new Date(baseTime);
        const midnight = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate() + 1,
          0,
          0,
          0,
          0
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
    res.status(404).json({ error: "Boss not found" });
  });
  app.post("/api/bosses/reset-invasion", (_req, res) => {
    currentBosses = currentBosses.map((b) => {
      if (b.server === "invasion") {
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {}
        };
      }
      return b;
    });
    broadcastBossesUpdate();
    res.json({ success: true, message: "All invasion bosses reset to --:--" });
  });
  app.post("/api/bosses/reset-invasion-midnight", (_req, res) => {
    const now = Date.now();
    let changed = false;
    currentBosses = currentBosses.map((b) => {
      if (b.server === "invasion" && b.respawnAt !== null && isOverMidnightInvasion(b.respawnAt, now)) {
        changed = true;
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {}
        };
      }
      return b;
    });
    if (changed) {
      broadcastBossesUpdate();
    }
    res.json({ success: true, changed });
  });
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    currentBosses = currentBosses.map((b) => {
      if (b.server === "invasion" && b.respawnAt !== null && isOverMidnightInvasion(b.respawnAt, now)) {
        changed = true;
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {}
        };
      }
      return b;
    });
    if (changed) {
      broadcastBossesUpdate();
    }
  }, 1e4);
  app.post("/api/bosses/reboot", (req, res) => {
    const { targetServer, rebootTimestamp, rules, defaultBosses } = req.body;
    if (Array.isArray(defaultBosses) && defaultBosses.length > 0) {
      currentBosses = defaultBosses;
      broadcastBossesUpdate();
      return res.json({ success: true, message: "Server reset to default bosses" });
    }
    if (rebootTimestamp && Array.isArray(rules)) {
      let matchedCount = 0;
      currentBosses = currentBosses.map((boss) => {
        if (targetServer && targetServer !== "all" && boss.server !== targetServer) {
          return boss;
        }
        const matchedRule = rules.find((r) => {
          const kw = (r.matchKeyword || r.bossDisplayName || "").toLowerCase().trim();
          return boss.thaiName.toLowerCase().includes(kw) || boss.engName.toLowerCase().includes(kw) || boss.name.toLowerCase().includes(kw);
        });
        if (matchedRule) {
          matchedCount++;
          const newRespawn = Number(rebootTimestamp) + Number(matchedRule.offsetHours) * 3600 * 1e3;
          return {
            ...boss,
            lastKilledAt: Number(rebootTimestamp),
            respawnAt: newRespawn,
            lastAlertCycleRespawnAt: newRespawn,
            notifiedStages: {}
          };
        }
        return boss;
      });
      broadcastBossesUpdate();
      return res.json({ success: true, count: matchedCount, message: `Reboot applied to ${matchedCount} bosses` });
    }
    currentBosses = currentBosses.map((b) => ({
      ...b,
      lastKilledAt: null,
      respawnAt: null,
      lastAlertCycleRespawnAt: null,
      notifiedStages: {}
    }));
    broadcastBossesUpdate();
    res.json({ success: true, message: "Server rebooted and synced" });
  });
  app.get("/api/activities", (_req, res) => {
    res.json({ activities: currentActivities });
  });
  app.post("/api/activities", (req, res) => {
    const { activities } = req.body;
    if (Array.isArray(activities)) {
      currentActivities = activities;
      broadcastActivitiesUpdate();
      res.json({ success: true, count: currentActivities.length });
    } else {
      res.status(400).json({ error: "activities must be an array" });
    }
  });
  app.post("/api/discord/webhook", async (req, res) => {
    const { webhookUrl, message, username, avatar_url, embeds } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ error: "Missing webhookUrl" });
    }
    try {
      const payload = {
        username: username || "L2M Boss Notifier",
        avatar_url: avatar_url || "https://cdn-icons-png.flaticon.com/512/3655/3655581.png"
      };
      if (message) payload.content = message;
      if (embeds && Array.isArray(embeds)) payload.embeds = embeds;
      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!discordRes.ok) {
        return res.status(400).json({ error: `Discord error: ${discordRes.statusText}` });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message || "Webhook failed" });
    }
  });
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  setInterval(() => {
    const now = Date.now();
    let hasChanged = false;
    currentBosses = currentBosses.map((boss) => {
      if (boss.server === "invasion" && boss.respawnAt) {
        const respawnDate = new Date(boss.respawnAt);
        const midnight = new Date(
          respawnDate.getFullYear(),
          respawnDate.getMonth(),
          respawnDate.getDate() + 1,
          0,
          0,
          0,
          0
        ).getTime();
        if (now >= midnight) {
          hasChanged = true;
          return {
            ...boss,
            respawnAt: null,
            lastAlertCycleRespawnAt: null,
            notifiedStages: {}
          };
        }
      }
      return boss;
    });
    if (hasChanged) {
      broadcastBossesUpdate();
    }
  }, 1e4);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
