var g_autociv_hotkeys = {
    "confirm": function (ev)
    {
        confirmSetup();
    }
};

function handleInputBeforeGui(ev)
{
    if ("hotkey" in ev && ev.hotkey in g_autociv_hotkeys)
        return !!g_autociv_hotkeys[ev.hotkey](ev);

    return false;
}

autociv_patchApplyN("init", function (target, that, args)
{
    let input = Engine.GetGUIObjectByName("hostServerName");
    input.blur()
    input.focus()
    input.buffer_position = input.caption.length;
    return target.apply(that, args);
})
