
let autocivCL = {
    "engine_version": Engine.GetEngineInfo().engine_version,
    "Engine": {
        "PushGuiPage": (xmlFile, data, callbackfunction) =>
        {
            switch (autocivCL.engine_version)
            {
                case "0.0.23":
                    let temp = callbackfunction ?
                        Object.assign({}, data, { "callback": callbackfunction.name }) :
                        data;
                    Engine.PushGuiPage(xmlFile, temp);
                    break;
                default:
                    Engine.PushGuiPage(xmlFile, data, callbackfunction);
                    break;
            }
        },
        "PopGUIPage": (data, hasCallback = false) =>
        {
            switch (autocivCL.engine_version)
            {
                case "0.0.23":
                    if (hasCallback)
                        Engine.PopGuiPageCB(data);
                    else
                        Engine.PopGuiPage(data);
                    break;
                default:
                    Engine.PopGuiPage(data);
                    break;
            }
        }
    }
};
