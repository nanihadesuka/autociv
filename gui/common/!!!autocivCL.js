var g_autociv_is24 = Engine.GetEngineInfo().engine_version == "0.0.24";
var g_autociv_isFGod = Engine.GetEngineInfo().mods.some(([name, version]) => /^FGod.*/i.test(name));

// Autociv compatibility layer (very thin :D)
let autocivCL = {
    "Engine": {
        "PushGuiPage": (xmlFile, data, callbackfunction) =>
        {
            if (g_autociv_is24)
                Engine.PushGuiPage(xmlFile, data, callbackfunction);
            else
            {
                Engine.PushGuiPage(xmlFile, callbackfunction ?
                    Object.assign({}, data, { "callback": callbackfunction.name }) :
                    data
                );
            }
        },
        "PopGuiPage": (data, hasCallback = false) =>
        {
            if (g_autociv_is24)
                Engine.PopGuiPage(data);
            else
            {
                if (hasCallback) Engine.PopGuiPageCB(data);
                else Engine.PopGuiPage(data);
            }
        }
    }
};
