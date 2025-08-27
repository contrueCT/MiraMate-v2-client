import { app as a, ipcMain as n, BrowserWindow as d } from "electron";
import s from "path";
import m from "fs/promises";
import { fileURLToPath as g } from "url";
const u = g(import.meta.url), l = s.dirname(u), w = process.env.VITE_DEV_SERVER_URL, c = a.getPath("userData"), r = s.join(c, "config.json");
console.log("User data path:", c);
console.log("Config file will be saved to:", r);
n.handle("config:get", async () => {
  try {
    return await m.access(r), await m.readFile(r, "utf-8");
  } catch {
    return null;
  }
});
n.handle("config:set", async (e, i) => {
  try {
    return await m.writeFile(r, i, "utf-8"), { success: !0 };
  } catch (o) {
    return console.error("Failed to write config file:", o), { success: !1, error: o.message };
  }
});
n.on("window:minimize", (e) => {
  console.log("Minimize window requested");
  const i = d.fromWebContents(e.sender);
  i && i.minimize();
});
n.on("window:close", (e) => {
  console.log("Close window requested");
  const i = d.fromWebContents(e.sender);
  i && i.close();
});
function f() {
  const e = new d({
    width: 1200,
    height: 720,
    frame: !1,
    // 移除默认窗口边框
    icon: s.join(l, "..", "src", "assets", "images", "favicon.ico"),
    // 设置应用图标
    webPreferences: {
      // 使用我们刚刚创建的、ESM安全的 __dirname
      preload: s.join(l, "preload.mjs")
    }
  });
  let i = !1;
  e.on("maximize", () => {
    console.log("Window maximized event triggered, sending to renderer"), i = !0, e.webContents.send("window:maximized", !0);
  }), e.on("unmaximize", () => {
    console.log("Window unmaximized event triggered, sending to renderer"), i = !1, e.webContents.send("window:maximized", !1);
  }), e.webContents.once("did-finish-load", () => {
    console.log("Page loaded, sending initial window state");
    const t = e.isMaximized();
    console.log("Initial window state:", t), i = t, e.webContents.send("window:maximized", t);
  });
  const o = n.listeners("window:maximize")[0];
  o && n.removeListener("window:maximize", o), n.on("window:maximize", (t) => {
    console.log("Maximize window requested"), t.sender === e.webContents && (console.log("Window is currently maximized (tracked):", i), i ? (console.log("Unmaximizing window"), e.unmaximize()) : (console.log("Maximizing window"), e.maximize()));
  }), w ? (e.loadURL(w), e.webContents.openDevTools()) : e.loadFile(s.join(l, "..", "dist", "index.html"));
}
a.whenReady().then(f);
a.on("window-all-closed", () => {
  process.platform !== "darwin" && (a.quit(), process.exit(0));
});
a.on("activate", () => {
  d.getAllWindows().length === 0 && f();
});
