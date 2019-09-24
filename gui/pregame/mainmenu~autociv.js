function autociv_initCheck()
{
    let changes = false;
    let configSaveToMemoryAndToDisk = (key, value) =>
    {
        Engine.ConfigDB_CreateValue("user", key, value);
        Engine.ConfigDB_WriteValueToFile("user", key, value, "config/user.cfg");
        changes = true;
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
        }
    }

    /**
     * Game will be reloaded if some config value has an inavlid value
     * (will reset that value) or if resetToDefault value isn't "false".
     */
    let resetToDefault_key = `mods.autociv.resetToDefault`;
    let resetToDefault_value = Engine.ConfigDB_GetValue("user", resetToDefault_key);
    let hotkeys = Engine.ReadJSONFile("autociv_data/default_config.json");
    for (let key in hotkeys)
        if (resetToDefault_value != "false" || Engine.ConfigDB_GetValue("user", key) == "")
            configSaveToMemoryAndToDisk(key, hotkeys[key]);

    if (resetToDefault_value != "false")
        configSaveToMemoryAndToDisk(resetToDefault_key, "false");

    return changes;
};

init = (function (originalFunction)
{
    return function (...args)
    {
        // Returns true if needs restart
        if (autociv_initCheck())
        {
            messageBox(
                500,
                300,
                `Autociv has detected mod settings changes !!\n0 A.D needs to be restarted for changes to take effect.`,
                "Autociv mod notice",
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
