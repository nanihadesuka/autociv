function autociv_initCheck()
{
    let state = {
        "needsRestart": false,
        "reasons": new Set()
    };

    let configSaveToMemoryAndToDisk = (key, value) =>
    {
        Engine.ConfigDB_CreateValue("user", key, value);
        Engine.ConfigDB_WriteValueToFile("user", key, value, "config/user.cfg");
        state.needsRestart = true;
    }

    /**
     * Reorder mods so FGod is always before AutoCiv
     */
    {
        let mods = Engine.ConfigDB_GetValue("user", "mod.enabledmods").trim().split(/\s+/g);
        let iFGod = mods.findIndex(v => v.toLowerCase().startsWith("fgod"));
        let iAutociv = mods.findIndex(v => v.toLowerCase().startsWith("autociv"));

        if (iFGod != -1 && iAutociv != -1 && iFGod > iAutociv)
        {
            [mods[iFGod], mods[iAutociv]] = [mods[iAutociv], mods[iFGod]];
            Engine.SetMods(mods);
            configSaveToMemoryAndToDisk("mod.enabledmods", mods.join(" "));
            state.reasons.add("Fixed wrong mod order. FGod needs to be loaded before AutoCiv.");
        }
    }

    /**
     * Game will be reloaded if some config value has an inavlid value
     * (will reset that value) or if resetToDefault value isn't "false".
     */
    let resetToDefault_key = `mods.autociv.resetToDefault`;
    let resetToDefault_value = Engine.ConfigDB_GetValue("user", resetToDefault_key);
    let hotkeys = Engine.ReadJSONFile("autociv_data/default_config.json");

    // Reset all autociv settings to default. Custom added won't be affected.
    if (resetToDefault_value != "false")
    {
        for (let key in hotkeys)
            configSaveToMemoryAndToDisk(key, hotkeys[key]);
        configSaveToMemoryAndToDisk(resetToDefault_key, "false");
        state.reasons.add("Reseted to default AutoCiv settings.");
    }
    // Look for invalid settings entries
    else for (let key in hotkeys)
        if (Engine.ConfigDB_GetValue("user", key) == "")
        {
            configSaveToMemoryAndToDisk(key, hotkeys[key]);
            state.reasons.add("Fixed AutoCiv invalid settings.");
        }

    return state;
};

init = (function (originalFunction)
{
    return function (...args)
    {
        let state = autociv_initCheck();
        if (state.needsRestart)
        {
            let message = [
                "0 A.D needs to restart.\n",
                "Reasons:\n",
                ...Array.from(state.reasons).map(v => ` · ${v}`)
            ].join("\n");

            messageBox(
                500,
                300,
                message,
                "AutoCiv mod notice",
                ["Cancel", "Restart"],
                [() => { }, () => Engine.RestartEngine()]
            );

            let hasFgodAutoStartup = Engine.ConfigDB_GetValue("user", "gui.startintolobby") === "true";
            if (hasFgodAutoStartup)
                Engine.ConfigDB_CreateValue("user", "gui.startintolobby", "false")

            let result = originalFunction(...args);
            if (hasFgodAutoStartup)
                Engine.ConfigDB_CreateValue("user", "gui.startintolobby", "true")

            return result;
        }

        return originalFunction(...args);
    }
})(init);



var g_AutocivHotkeyActions = {
    "autociv.open.autociv_settings": function (ev)
    {
        autocivCL.Engine.PushGuiPage("page_autociv_settings.xml");
    },
    "autociv.open.test": function (ev)
    {
        autocivCL.Engine.PushGuiPage("page_test.xml");
    }
};


function handleInputBeforeGui(ev)
{
    resizeBar.onEvent(ev);

    if (ev.hotkey && g_AutocivHotkeyActions[ev.hotkey])
        g_AutocivHotkeyActions[ev.hotkey](ev);

    return false;
}
