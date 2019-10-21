var g_AutocivHotkeyActions = {
    "confirm": function (ev)
    {
        confirmSetup()
    }
};

function handleInputBeforeGui(ev)
{
    if (ev.hotkey && g_AutocivHotkeyActions[ev.hotkey])
        g_AutocivHotkeyActions[ev.hotkey](ev);
    return false;
}

patchApplyN("init", function (target, that, args)
{
    Engine.GetGUIObjectByName("hostServerName").focus()
    return target.apply(that, args);
})
