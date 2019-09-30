let g_SDL_keycode_value_to_0ad_key = Engine.ReadJSONFile("autociv_data/SDL_keycode_value_to_0ad_key.json");
let g_currentCombo = [];
let g_noChanges = true;

function closeNoSave() { autocivCL.Engine.PopGUIPage(); }

function init(attr)
{
    Engine.GetGUIObjectByName("dialogBackground").onMouseLeftPress = closeNoSave;

    animateObject("dialog", {
        "start": {
            "size": {
                "left": -7.5,
                "top": attr.absoluteSize.top,
                "bottom": attr.absoluteSize.bottom,
                "right": attr.absoluteSize.right - attr.absoluteSize.left - 7.5
            }
        },
        "color": "40 40 40 255"
    });

    animateObject("setting_value_border", { "color": "60 60 60 255", });
    animateObject("setting_value_text", { "color": "20 20 20 255" });
    animateObject("options", { "size": { "bottom": 30 }, "color": "60 60 60 255" });

    let options_save = Engine.GetGUIObjectByName("options_save");
    Object.assign(options_save, {
        "onMouseLeftPress": () => animateObject(options_save, { "color": { "g": 150 / 255 } }),
        "onMouseLeftRelease": () =>
        {
            animateObject(options_save, { "color": { "g": 70 / 255 } });
            if (g_noChanges)
                closeNoSave();
            else
                autocivCL.Engine.PopGUIPage({
                    "saveNewCombo": true,
                    "value": g_currentCombo.join("+"),
                    "i": attr.data.i
                }, true);
        },
        "onMouseEnter": () => animateObject(options_save, { "color": { "g": 70 / 255 } }),
        "onMouseLeave": () => animateObject(options_save, { "color": { "g": 50 / 255 } })
    })
    animateObject(options_save, { "color": { "g": 50 / 255 } });

    let options_clear = Engine.GetGUIObjectByName("options_clear");
    Object.assign(options_clear, {
        "onMouseLeftPress": () => animateObject(options_clear, { "color": { "b": 150 / 255 } }),
        "onMouseLeftRelease": () =>
        {
            g_currentCombo = [];
            comboGeneratorTrans({ "value": g_currentCombo.join("+") });
            animateObject(options_clear, { "color": { "b": 70 / 255 } })
            g_noChanges = false;
        },
        "onMouseEnter": () => animateObject(options_clear, { "color": { "b": 70 / 255 } }),
        "onMouseLeave": () => animateObject(options_clear, { "color": { "b": 50 / 255 } })
    })
    animateObject(options_clear, { "color": { "b": 50 / 255 } });

    let options_cancel = Engine.GetGUIObjectByName("options_cancel");
    Object.assign(options_cancel, {
        "onMouseLeftPress": () => animateObject(options_cancel, { "color": { "r": 150 / 255 } }),
        "onMouseLeftRelease": () =>
        {
            animateObject(options_cancel, { "color": { "r": 70 / 255 } });
            closeNoSave();
        },
        "onMouseEnter": () => animateObject(options_cancel, { "color": { "r": 70 / 255 } }),
        "onMouseLeave": () => animateObject(options_cancel, { "color": { "r": 50 / 255 } })
    })
    animateObject(options_cancel, { "color": { "r": 50 / 255 } });

    comboGenerator(attr.data)
}

function calcKeyWidth(text)
{
    let len = Math.max(2.4, text.length) * 13;
    switch (text)
    {
        case "Shift": return len - 14;
        case "Ctrl": return len - 6;
        case "Alt": return len + 2;
        case "Space": return len - 5;
        default: return len;
    }
};

/**
 * In : [1,3,1,4,2]
 * Out: [0,1,4,5,9,11]
 */
function accumulateArray(list)
{ return list.reduce((acum, value, i) => [...acum, value + acum[i]], [0]); }

function getComboFromText(text)
{
    return text.
        split("+").
        filter(t => -1 == ["unused", ""].indexOf(t))
}

function comboGenerator(data)
{
    let children = Engine.GetGUIObjectByName(`setting_value_text`).children;
    let combo = getComboFromText(data.value);
    let comboLenAcum = accumulateArray(combo.map(calcKeyWidth));

    children.forEach((child, i) =>
    {
        let hidden = combo[i] == undefined;
        child.hidden = hidden;
        if (hidden)
            animateObject(child, {
                "start": {
                    "size": {
                        "left": 4 + comboLenAcum[comboLenAcum.length - 1],
                        "right": 4 + comboLenAcum[comboLenAcum.length - 1] - 4
                    }
                },
                "onComplete": object => object.caption = "",
                "color": "40 40 40 0",
                "textcolor": "150 150 150 0",
            });
        else
            animateObject(child, {
                "start": {
                    "size": {
                        "left": 4 + comboLenAcum[i],
                        "right": 4 + comboLenAcum[i + 1] - 4
                    },
                    "color": "40 40 40 255",
                    "textcolor": "150 150 150 255",
                },
                "onStart": object => object.caption = combo[i],
            });
    })
}

function comboGeneratorTrans(data)
{
    let children = Engine.GetGUIObjectByName(`setting_value_text`).children;
    let combo = getComboFromText(data.value);
    let comboLenAcum = accumulateArray(combo.map(calcKeyWidth));

    children.forEach((child, i) =>
    {
        let hidden = combo[i] == undefined;
        child.hidden = hidden;
        if (hidden)
            animateObject(child, {
                "onComplete": object => object.caption = "",
                "color": "40 40 40 0",
                "textcolor": "150 150 150 0",
            });
        else
            animateObject(child, {
                "onStart": object => object.caption = combo[i],
                "size": {
                    "left": 4 + comboLenAcum[i],
                    "right": 4 + comboLenAcum[i + 1] - 4
                },
                "color": "40 40 40 255",
                "textcolor": "150 150 150 255",
            });
    });
}

function onTick() { }

function keyPriority(key)
{
    switch (key)
    {
        case "Ctrl": return 0;
        case "Alt": return 1;
        case "Shift": return 2;
        case "Space": return 3;
        default: return 4;
    }
}

function comboBreaker(newEntry)
{
    if (g_currentCombo.length > 4 || g_currentCombo.includes(newEntry))
        return;

    g_noChanges = false;
    g_currentCombo.push(newEntry);
    g_currentCombo.sort(keyPriority);
    comboGeneratorTrans({ "value": g_currentCombo.join("+") });
};

function handleInputBeforeGui(ev)
{
    if (ev !== undefined &&
        ev.keysym !== undefined &&
        ev.keysym.sym in g_SDL_keycode_value_to_0ad_key)
        comboBreaker(g_SDL_keycode_value_to_0ad_key[ev.keysym.sym]);

    return !(ev.type && ev.type.startsWith("mouse"));
}
