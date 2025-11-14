import { app as l, ipcMain as i, BrowserWindow as m } from "electron";
import r from "path";
import o from "fs/promises";
import { fileURLToPath as v } from "url";
const M = v(import.meta.url), w = r.dirname(M), u = process.env.VITE_DEV_SERVER_URL, g = l.getPath("userData"), d = r.join(g, "config.json"), a = r.join(g, "messages.json");
console.log("User data path:", g);
console.log("Config file will be saved to:", d);
console.log("Messages file will be saved to:", a);
i.handle("config:get", async () => {
  try {
    return await o.access(d), await o.readFile(d, "utf-8");
  } catch {
    return null;
  }
});
i.handle("config:set", async (e, n) => {
  try {
    return await o.writeFile(d, n, "utf-8"), { success: !0 };
  } catch (s) {
    return console.error("Failed to write config file:", s), { success: !1, error: s.message };
  }
});
i.handle("messages:get", async (e, n, s) => {
  try {
    await o.access(a);
    const t = await o.readFile(a, "utf-8"), c = JSON.parse(t);
    if (!Array.isArray(c))
      return [];
    c.sort((p, y) => p.timestamp - y.timestamp);
    const f = c.length, x = Math.max(0, f - (n + 1) * s), z = f - n * s;
    return c.slice(x, z);
  } catch {
    return [];
  }
});
i.handle("messages:save", async (e, n) => {
  try {
    return await o.writeFile(a, JSON.stringify(n), "utf-8"), { success: !0 };
  } catch (s) {
    return console.error("Failed to write messages file:", s), { success: !1, error: s.message };
  }
});
i.handle("messages:count", async () => {
  try {
    await o.access(a);
    const e = await o.readFile(a, "utf-8"), n = JSON.parse(e);
    return Array.isArray(n) ? n.length : 0;
  } catch {
    return 0;
  }
});
i.handle("messages:clear", async () => {
  try {
    return await o.unlink(a), { success: !0 };
  } catch (e) {
    return e.code === "ENOENT" ? { success: !0 } : (console.error("Failed to delete messages file:", e), { success: !1, error: e.message });
  }
});
i.on("window:minimize", (e) => {
  console.log("Minimize window requested");
  const n = m.fromWebContents(e.sender);
  n && n.minimize();
});
i.on("window:close", (e) => {
  console.log("Close window requested");
  const n = m.fromWebContents(e.sender);
  n && n.close();
});
function h() {
  const e = new m({
    width: 1200,
    height: 720,
    frame: !1,
    // 移除默认窗口边框
    icon: r.join(w, "..", "src", "assets", "images", "favicon.ico"),
    // 设置应用图标
    webPreferences: {
      // 使用我们刚刚创建的、ESM安全的 __dirname
      preload: r.join(w, "preload.mjs")
    }
  });
  let n = !1;
  e.on("maximize", () => {
    console.log("Window maximized event triggered, sending to renderer"), n = !0, e.webContents.send("window:maximized", !0);
  }), e.on("unmaximize", () => {
    console.log("Window unmaximized event triggered, sending to renderer"), n = !1, e.webContents.send("window:maximized", !1);
  }), e.webContents.once("did-finish-load", () => {
    console.log("Page loaded, sending initial window state");
    const t = e.isMaximized();
    console.log("Initial window state:", t), n = t, e.webContents.send("window:maximized", t);
  });
  const s = i.listeners("window:maximize")[0];
  s && i.removeListener("window:maximize", s), i.on("window:maximize", (t) => {
    console.log("Maximize window requested"), t.sender === e.webContents && (console.log("Window is currently maximized (tracked):", n), n ? (console.log("Unmaximizing window"), e.unmaximize()) : (console.log("Maximizing window"), e.maximize()));
  }), u ? (e.loadURL(u), e.webContents.openDevTools()) : e.loadFile(r.join(w, "..", "dist", "index.html"));
}
l.whenReady().then(h);
l.on("window-all-closed", () => {
  process.platform !== "darwin" && (l.quit(), process.exit(0));
});
l.on("activate", () => {
  m.getAllWindows().length === 0 && h();
});
