var autociv_is24 = Engine.GetEngineInfo().engine_version !== "0.0.23";
var autociv_isFGod = Engine.GetEngineInfo().mods.some(([name, version]) => /^FGod.*/i.test(name));

/**
 * @param {String} oldFnName
 * @param {Function} patchFn
 */
function patchApplyN(oldFnName, patchFn)
{
    if (!(oldFnName in global))
    {
        warn(`patchApplyN: Function ${oldFnName} not defined`)
        return;
    }

    global[oldFnName] = new Proxy(global[oldFnName], {
        apply: patchFn
    });
}

let autocivCL = {
    "Engine": {
        "PushGuiPage": (xmlFile, data, callbackfunction) =>
        {
            if (!autociv_is24)
                return Engine.PushGuiPage(xmlFile, data, callbackfunction);

            let temp = callbackfunction ?
                Object.assign({}, data, { "callback": callbackfunction.name }) :
                data;
            Engine.PushGuiPage(xmlFile, temp);
        },
        "PopGUIPage": (data, hasCallback = false) =>
        {
            if (autociv_is24)
                return Engine.PopGuiPage(data);

            if (hasCallback)
                Engine.PopGuiPageCB(data);
            else
                Engine.PopGuiPage(data);
        }
    }
};
