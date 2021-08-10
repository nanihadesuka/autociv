var config = {
    needsToSave: false,
    needsToReloadHotkeys: false,
    set: function (key, value)
    {
        Engine.ConfigDB_CreateValue("user", key, value);
        this.needsToSave = true
        this.needsToReloadHotkeys = this.needsToReloadHotkeys || key.startsWith("hotkey.")
    },
    get: function (key) { return Engine.ConfigDB_GetValue("user", key) },
    save: function ()
    {
        if (this.needsToSave) Engine.ConfigDB_WriteFile("user", "config/user.cfg")
        if (this.needsToReloadHotkeys) Engine.ReloadHotkeys()
    }
}


function autociv_initCheck()
{
    let state = {
        "reasons": new Set(),
        "showReadme": false,
        "showSuggestDefaultChanges": false
    };

    // Check settings
    {
        let settings = Engine.ReadJSONFile("autociv_data/default_config.json");
        // Reset all autociv settings to default. Custom autociv settings added won't be affected.
        if (config.get("autociv.settings.reset.all") === "true")
        {
            warn("RESET ALL")
            for (let key in settings)
                config.set(key, settings[key]);
            config.save()
            state.reasons.add("AutoCiv settings reseted by user.");
            return state;
        }

        const allHotkeys = new Set(Object.keys(Engine.GetHotkeyMap()))
        // Normal check. Check for entries missing
        for (let key in settings)
        {
            if (key.startsWith("hotkey."))
            {
                if (!allHotkeys.has(key.substring("hotkey.".length)))
                {
                    config.set(key, settings[key]);
                    state.reasons.add("New AutoCiv hotkey(s) added.");
                }
            }
            else if (config.get(key) == "")
            {
                config.set(key, settings[key]);
                state.reasons.add("New AutoCiv setting(s) added.");
            }
        }
    }

    // Check for showSuggestDefaultChanges
    {
        const key = "autociv.mainmenu.suggestDefaultChanges"
        if (config.get(key) == "true")
        {
            state.showSuggestDefaultChanges = true
            config.set(key, "false")
        }
    }

    // Check if show readme (first time user case)
    {
        const key = "autociv.settings.autociv_readme.seen"
        if (config.get(key) == "false")
        {
            state.showReadme = true
            config.set(key, "true")
        }
    }

    config.save()
    return state;
};

Engine.SetGlobalHotkey("autociv.open.autociv_readme", "Press", () =>
{
    Engine.PushGuiPage("page_autociv_readme.xml");
})

autociv_patchApplyN("init", function (target, that, args)
{
    let state = autociv_initCheck();
    if (state.reasons.size != 0)
    {
        let message = ["AutoCiv made some changes.\n"].
            concat(Array.from(state.reasons).map(v => ` · ${v}`)).
            join("\n");

        messageBox(500, 300, message,
            "AutoCiv mod notice",
            ["Ok"],
            [() => { }, () => { }]
        );
    }

    if (state.showSuggestDefaultChanges)
    {
        let message = `
Some default settings will improve with AutoCiv if changed.

Do you want to make these changes?

Disable hotkey:
"hotkey.camera.lastattackfocus" = "Space"

Add auto-queue hotkeys:
hotkey.session.queueunit.autoqueueoff = "Alt+W"
hotkey.session.queueunit.autoqueueon = "Alt+Q"
        `;

        messageBox(500, 300, message,
            "AutoCiv mod notice",
            ["Ok, change", "No"],
            [() =>
            {
                config.set("hotkey.camera.lastattackfocus", "")
                config.set("hotkey.session.queueunit.autoqueueoff", "Alt+W")
                config.set("hotkey.session.queueunit.autoqueueon", "Alt+Q")
                config.save()
            }, () => { }]
        );
    }

    if (state.showReadme)
        Engine.PushGuiPage("page_autociv_readme.xml");

    return target.apply(that, args);
})
