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
        "needsRestart": false,
        "reasons": new Set(),
        "showReadme": false
    };

    // Reorder mods so FGod is always before AutoCiv
    {
        let mods = config.get("mod.enabledmods").trim().split(/\s+/g);
        let iFGod = mods.findIndex(name => /^FGod.*/i.test(name));
        let iAutociv = mods.findIndex(name => /^AutoCiv.*/i.test(name));

        if (iFGod != -1 && iAutociv != -1 && iFGod > iAutociv)
        {
            [mods[iFGod], mods[iAutociv]] = [mods[iAutociv], mods[iFGod]];
            Engine.SetMods(mods);
            config.set("mod.enabledmods", mods.join(" "))
            state.needsRestart = true;
            state.reasons.add("Detected wrong mod order. Fixed. FGod needs to be loaded before AutoCiv.");
        }
    }

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
    if (state.needsRestart)
    {
        let message = ["0 A.D needs to restart.\n", "Reasons:\n"].
            concat(Array.from(state.reasons).map(v => ` · ${v}`)).
            join("\n");

        messageBox(500, 300, message,
            "AutoCiv mod notice",
            ["Cancel", "Restart"],
            [() => { }, () => Engine.RestartEngine()]
        );
    }
    else if (state.reasons.size != 0)
    {
        let message = ["AutoCiv made some changes.\n", "Reasons:\n"].
            concat(Array.from(state.reasons).map(v => ` · ${v}`)).
            join("\n");

        messageBox(500, 300, message,
            "AutoCiv mod notice",
            ["Ok"],
            [() => { }, () => Engine.RestartEngine()]
        );
    }

    if (state.showReadme)
        Engine.PushGuiPage("page_autociv_readme.xml");

    return target.apply(that, args);
})
