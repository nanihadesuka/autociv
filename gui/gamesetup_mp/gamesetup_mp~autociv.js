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

init = (function (originalFunction)
{
    return function (...attribs)
    {
        Engine.GetGUIObjectByName("hostServerName").focus()
        return originalFunction(...attribs)
    }
})(init)
