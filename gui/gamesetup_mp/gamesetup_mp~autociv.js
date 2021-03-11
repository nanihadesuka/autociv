autociv_patchApplyN("init", function (target, that, args)
{
    const res = target.apply(that, args);
    const [attribs] = args
    if (attribs.hasPassword)
    {
        let input = Engine.GetGUIObjectByName("clientPassword");
        input.blur()
        input.focus()
        input.buffer_position = input.caption.length;
        input.onPress = () => confirmPassword()
    }
    else if (attribs.multiplayerGameType == "host")
    {
        let input = Engine.GetGUIObjectByName("hostServerName");
        input.blur()
        input.focus()
        input.buffer_position = input.caption.length;
        input.onPress = () => confirmSetup()
    }
    return res
})
