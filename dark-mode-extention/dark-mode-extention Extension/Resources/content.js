const DEFAULTS = {
    brightness: 100,
    contrast: 90,
    sepia: 10,
    darkSchemeBackgroundColor: "#181a1b",
    darkSchemeTextColor: "#e8e6e3"
};

function shouldApply(state) {
    if (!state.enabled) return false;
    const host = location.hostname;
    const list = state.whitelist || [];
    return host && !list.includes(host);
}

function sync(state) {
    if (typeof DarkReader === "undefined") return;
    if (shouldApply(state)) {
        DarkReader.enable({ ...DEFAULTS, ...(state.theme || {}) });
    } else {
        DarkReader.disable();
    }
}

async function readState() {
    const s = await browser.storage.local.get(["enabled", "whitelist", "theme"]);
    return {
        enabled: s.enabled !== false,
        whitelist: s.whitelist || [],
        theme: s.theme || {}
    };
}

readState().then(sync);

browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    readState().then(sync);
});

browser.runtime.onMessage.addListener((request) => {
    if (request && request.type === "refresh") {
        readState().then(sync);
    }
});
