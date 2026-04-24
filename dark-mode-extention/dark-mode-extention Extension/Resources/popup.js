const DEFAULTS = {
    brightness: 100,
    contrast: 90,
    sepia: 10,
    darkSchemeBackgroundColor: "#181a1b",
    darkSchemeTextColor: "#e8e6e3"
};

const $ = (id) => document.getElementById(id);

async function getActiveTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

function hostFromUrl(url) {
    try { return new URL(url).hostname; } catch { return ""; }
}

async function notifyActiveTab() {
    const tab = await getActiveTab();
    if (!tab) return;
    try { await browser.tabs.sendMessage(tab.id, { type: "refresh" }); } catch {}
}

async function init() {
    const tab = await getActiveTab();
    const host = tab ? hostFromUrl(tab.url) : "";
    $("host").textContent = host || "this site";

    const state = await browser.storage.local.get([
        "enabled", "whitelist", "theme"
    ]);
    const enabled = state.enabled !== false;
    const whitelist = state.whitelist || [];
    const theme = { ...DEFAULTS, ...(state.theme || {}) };

    $("enabled").checked = enabled;
    $("excluded").checked = host ? whitelist.includes(host) : false;
    $("excluded").disabled = !host;

    $("bg").value = theme.darkSchemeBackgroundColor;
    $("fg").value = theme.darkSchemeTextColor;
    $("brightness").value = theme.brightness;
    $("contrast").value = theme.contrast;
    $("sepia").value = theme.sepia;
    $("brightnessVal").textContent = theme.brightness;
    $("contrastVal").textContent = theme.contrast;
    $("sepiaVal").textContent = theme.sepia;

    $("enabled").addEventListener("change", async () => {
        await browser.storage.local.set({ enabled: $("enabled").checked });
        notifyActiveTab();
    });

    $("excluded").addEventListener("change", async () => {
        if (!host) return;
        const current = (await browser.storage.local.get("whitelist")).whitelist || [];
        const next = $("excluded").checked
            ? Array.from(new Set([...current, host]))
            : current.filter((h) => h !== host);
        await browser.storage.local.set({ whitelist: next });
        notifyActiveTab();
    });

    async function writeTheme(patch) {
        const cur = (await browser.storage.local.get("theme")).theme || {};
        await browser.storage.local.set({ theme: { ...DEFAULTS, ...cur, ...patch } });
        notifyActiveTab();
    }

    $("bg").addEventListener("input", (e) => writeTheme({ darkSchemeBackgroundColor: e.target.value }));
    $("fg").addEventListener("input", (e) => writeTheme({ darkSchemeTextColor: e.target.value }));

    for (const key of ["brightness", "contrast", "sepia"]) {
        $(key).addEventListener("input", (e) => {
            const v = Number(e.target.value);
            $(`${key}Val`).textContent = v;
            writeTheme({ [key]: v });
        });
    }

    $("reset").addEventListener("click", async () => {
        await browser.storage.local.set({ theme: { ...DEFAULTS } });
        $("bg").value = DEFAULTS.darkSchemeBackgroundColor;
        $("fg").value = DEFAULTS.darkSchemeTextColor;
        $("brightness").value = DEFAULTS.brightness;
        $("contrast").value = DEFAULTS.contrast;
        $("sepia").value = DEFAULTS.sepia;
        $("brightnessVal").textContent = DEFAULTS.brightness;
        $("contrastVal").textContent = DEFAULTS.contrast;
        $("sepiaVal").textContent = DEFAULTS.sepia;
        notifyActiveTab();
    });
}

init();
