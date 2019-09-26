function autociv_initCheck()
{
    let hotkeys = Engine.ReadJSONFile("autociv_data/default_config.json");
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

    // Reorder mods so FGod is always before AutoCiv
    {
        let mods = Engine.ConfigDB_GetValue("user", "mod.enabledmods").trim().split(/\s+/g);
        let iFGod = mods.findIndex(v => v.toLowerCase().startsWith("fgod"));
        let iAutociv = mods.findIndex(v => v.toLowerCase().startsWith("autociv"));

        if (iFGod != -1 && iAutociv != -1 && iFGod > iAutociv)
        {
            [mods[iFGod], mods[iAutociv]] = [mods[iAutociv], mods[iFGod]];
            Engine.SetMods(mods);
            configSaveToMemoryAndToDisk("mod.enabledmods", mods.join(" "));
            state.reasons.add("Dected wrong mod order. Fixed. FGod needs to be loaded before AutoCiv.");
        }
    }

    let resetToDefault_key = `mods.autociv.resetToDefault`;
    let resetToDefault_value = Engine.ConfigDB_GetValue("user", resetToDefault_key);
    // Reset all autociv settings to default. Custom autociv setting added won't be affected.
    if (resetToDefault_value === "true")
    {
        for (let key in hotkeys)
            configSaveToMemoryAndToDisk(key, hotkeys[key]);
        configSaveToMemoryAndToDisk(resetToDefault_key, "false");
        state.reasons.add("AutoCiv settings reseted by user.");
    }
    // When the mod is first executed will have this entry empty.
    else if (resetToDefault_value === "")
    {
        for (let key in hotkeys)
            configSaveToMemoryAndToDisk(key, hotkeys[key]);
        configSaveToMemoryAndToDisk(resetToDefault_key, "false");
        state.reasons.add("First time load. AutoCiv settings added.");
    }
    // Look for settings entries not defined
    else for (let key in hotkeys)
    {
        if (Engine.ConfigDB_GetValue("user", key) == "")
        {
            configSaveToMemoryAndToDisk(key, hotkeys[key]);
            state.reasons.add("New AutoCiv settings added.");
        }
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

            let result = originalFunction.apply(this, args);
            if (hasFgodAutoStartup)
                Engine.ConfigDB_CreateValue("user", "gui.startintolobby", "true")

            return result;
        }
        originalFunction.apply(this, args);
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
