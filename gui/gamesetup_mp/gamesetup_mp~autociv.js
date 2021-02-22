autociv_patchApplyN("init", function (target, that, args)
{
    Engine.SetGlobalHotkey("confirm", "Press", () => confirmSetup());

    let input = Engine.GetGUIObjectByName("hostServerName");
    input.blur()
    input.focus()
    input.buffer_position = input.caption.length;
    return target.apply(that, args);
})
