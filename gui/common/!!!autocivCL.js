var g_autociv_is24 = Engine.GetEngineInfo().engine_version == "0.0.24";
var g_autociv_isFGod = Engine.GetEngineInfo().mods.some(([name, version]) => /^FGod.*/i.test(name));

// Autociv compatibility layer (very thin :D)
var autocivCL = {
    "Engine": {
        "PushGuiPage": (xmlFile, data, callbackfunction) =>
        {
            Engine.PushGuiPage(xmlFile, data, callbackfunction);
        },
        "PopGuiPage": (data, hasCallback = false) =>
        {
            Engine.PopGuiPage(data);
        }
    }
};
