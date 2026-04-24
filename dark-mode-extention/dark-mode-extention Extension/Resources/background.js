browser.runtime.onInstalled.addListener(async () => {
    const current = await browser.storage.local.get(["enabled", "whitelist"]);
    const defaults = {};
    if (current.enabled === undefined) defaults.enabled = true;
    if (current.whitelist === undefined) defaults.whitelist = [];
    if (Object.keys(defaults).length) {
        await browser.storage.local.set(defaults);
    }
});
