function autociv_initCheck()
{
    let state = {
        "needsRestart": false,
        "reasons": new Set(),
        "showReadme": false
    };

    let configSaveToMemoryAndToDisk = (key, value) =>
    {
        Engine.ConfigDB_CreateValue("user", key, value);
        Engine.ConfigDB_WriteValueToFile("user", key, value, "config/user.cfg");
    }

    // Reorder mods so FGod is always before AutoCiv
    {
        let mods = Engine.ConfigDB_GetValue("user", "mod.enabledmods").trim().split(/\s+/g);
        let iFGod = mods.findIndex(name => /^FGod.*/i.test(name));
        let iAutociv = mods.findIndex(name => /^AutoCiv.*/i.test(name));

        if (iFGod != -1 && iAutociv != -1 && iFGod > iAutociv)
        {
            [mods[iFGod], mods[iAutociv]] = [mods[iAutociv], mods[iFGod]];
            Engine.SetMods(mods);
            configSaveToMemoryAndToDisk("mod.enabledmods", mods.join(" "));
            state.needsRestart = true;
            state.reasons.add("Detected wrong mod order. Fixed. FGod needs to be loaded before AutoCiv.");
        }
    }

    // Check settings
    {
        let settings = Engine.ReadJSONFile("autociv_data/default_config.json");
        // Reset all autociv settings to default. Custom autociv settings added won't be affected.
        if (Engine.ConfigDB_GetValue("user", "autociv.settings.reset.all") === "true")
        {
            state.needsRestart = true;
            for (let key in settings)
                configSaveToMemoryAndToDisk(key, settings[key]);
            state.reasons.add("AutoCiv settings reseted by user.");
            return state;
        }

        // Normal check. Check for settings entries missing
        for (let key in settings)
            if (!Engine.ConfigDB_GetValue("user", key))
            {
                state.needsRestart = true;
                configSaveToMemoryAndToDisk(key, settings[key]);
                state.reasons.add("New AutoCiv settings added.");
            }
    }

    // Check if show readme (first time user case)
    {
        const key = "autociv.settings.autociv_readme.seen"
        if (Engine.ConfigDB_GetValue("user", key) == "false")
        {
            state.showReadme = true
            configSaveToMemoryAndToDisk(key, "true")
        }
    }

    return state;
};

autociv_patchApplyN("init", function (target, that, args)
{
    // autocivCL.Engine.PushGuiPage("page_autociv_readme.xml");

    let state = autociv_initCheck();
    if (state.needsRestart || state.showReadme)
    {
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

        if (state.showReadme)
            autocivCL.Engine.PushGuiPage("page_autociv_readme.xml");

        let hasFgodAutoStartup = Engine.ConfigDB_GetValue("user", "gui.startintolobby") === "true";
        if (hasFgodAutoStartup)
            Engine.ConfigDB_CreateValue("user", "gui.startintolobby", "false")
        let result = target.apply(that, args);
        if (hasFgodAutoStartup)
            Engine.ConfigDB_CreateValue("user", "gui.startintolobby", "true")

        return result;
    }
    return target.apply(that, args);
})

var g_autociv_hotkeys = {
    "autociv.open.autociv_readme": function (ev)
    {
        autocivCL.Engine.PushGuiPage("page_autociv_readme.xml");
    }
};

function handleInputBeforeGui(ev)
{
    if ("hotkey" in ev && ev.hotkey in g_autociv_hotkeys && ev.type == "hotkeydown")
        return !!g_autociv_hotkeys[ev.hotkey](ev);

    return false;
}
