(function ()
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

    /**
     * Restart game so changes get into effect.
     */
    if (changes)
        Engine.RestartEngine();
})();

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
