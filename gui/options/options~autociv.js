
if (!global.g_autociv_optionsFiles)
    var g_autociv_optionsFiles = ["gui/options/options.json"]

g_autociv_optionsFiles.push("autociv_data/options.json")

init = function (data, hotloadData)
{
    g_ChangedKeys = hotloadData ? hotloadData.changedKeys : new Set();
    g_TabCategorySelected = hotloadData ? hotloadData.tabCategorySelected : 0;

    // CHANGES START /////////////////////////
    g_Options = []
    for (let options of g_autociv_optionsFiles)
        Array.prototype.push.apply(g_Options, Engine.ReadJSONFile(options))
    // CHANGES END /////////////////////////

    translateObjectKeys(g_Options, ["label", "tooltip"]);
    deepfreeze(g_Options);

    placeTabButtons(
        g_Options,
        false,
        g_TabButtonHeight,
        g_TabButtonDist,
        selectPanel,
        displayOptions);
}

g_OptionType["autociv_slider_int"] = {
    "configToValue": value => parseInt(value, 10),
    "valueToGui": (value, control) =>
    {
        control.value = parseInt(value, 10);
    },
    "guiToValue": control => parseInt(control.value, 10),
    "guiSetter": "onValueChange",
    "initGUI": (option, control) =>
    {
        control.max_value = option.max;
        control.min_value = option.min;
    },
    "tooltip": (value, option) =>
        sprintf(translateWithContext("slider number", "Value: %(val)s (min: %(min)s, max: %(max)s)"), {
            "val": parseInt(value, 10),
            "min": parseInt(option.min, 10),
            "max": parseInt(option.max, 10)
        })
}
