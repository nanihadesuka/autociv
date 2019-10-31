var autociv_is24 = Engine.GetEngineInfo().engine_version !== "0.0.23";
var autociv_isFGod = Engine.GetEngineInfo().mods.some(([name, version]) => /^FGod.*/i.test(name));

let autocivCL = {
    "Engine": {
        "PushGuiPage": (xmlFile, data, callbackfunction) =>
        {
            if (autociv_is24)
                Engine.PushGuiPage(xmlFile, data, callbackfunction);
            else
            {
                Engine.PushGuiPage(xmlFile, callbackfunction ?
                    Object.assign({}, data, { "callback": callbackfunction.name }) :
                    data
                );
            }
        },
        "PopGUIPage": (data, hasCallback = false) =>
        {
            if (autociv_is24)
                Engine.PopGuiPage(data);
            else
            {
                if (hasCallback) Engine.PopGuiPageCB(data);
                else Engine.PopGuiPage(data);
            }
        }
    }
};
