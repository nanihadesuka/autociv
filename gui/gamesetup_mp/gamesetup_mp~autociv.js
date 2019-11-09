var g_autociv_hotkeyActions = {
    "confirm": function (ev)
    {
        confirmSetup()
    }
};

function handleInputBeforeGui(ev)
{
    if (ev.hotkey && g_autociv_hotkeyActions[ev.hotkey])
        g_autociv_hotkeyActions[ev.hotkey](ev);
    return false;
}

autociv_patchApplyN("init", function (target, that, args)
{
    Engine.GetGUIObjectByName("hostServerName").focus()
    return target.apply(that, args);
})
