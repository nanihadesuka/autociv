/**
 * @param {Object} [prefix]
 * @param {String} method
 * @param {Function} patch
 */
function autociv_patchApplyN_helpers()
{
    if (arguments.length < 2)
    {
        let error = new Error("Insufficient arguments to patch: " + arguments[0]);
        warn(error.message)
        warn(error.stack)
        return;
    }

    let prefix, method, patch;
    if (arguments.length == 2)
    {
        prefix = global;
        method = arguments[0];
        patch = arguments[1];
    }
    else
    {
        prefix = arguments[0];
        method = arguments[1];
        patch = arguments[2];
    }

    if (!(method in prefix))
    {
        let error = new Error("Function not defined: " + method);
        warn(error.message)
        warn(error.stack)
        return;
    }

    prefix[method] = new Proxy(prefix[method], { apply: patch });
}

autociv_patchApplyN_helpers(g_Commands, "dialog-answer", function (target, that, args)
{
    let [player, cmd, data] = args;
    if (cmd.autociv_minimap_flare)
    {
        let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
        cmpGUIInterface.PushNotification({
            "type": "autociv_minimap_flare",
            "mapPos": cmd.mapPos,
            "players": [player]
        });

        return;
    }

    return target.apply(that, args);
})
