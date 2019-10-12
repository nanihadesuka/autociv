let g_SDL_keycode_value_to_0ad_key = Engine.ReadJSONFile("autociv_data/SDL_keycode_value_to_0ad_key.json");
let g_combo = [];
let g_changes = false;

function close(save = false)
{
    if (save && g_changes)
        autocivCL.Engine.PopGUIPage({
            "saveNewCombo": true,
            "value": g_combo.join("+"),
            "i": attr.data.i
        }, true);
    else
        autocivCL.Engine.PopGUIPage();
}

function clearCombo()
{
    if (!g_combo.length)
        return;
    g_combo = [];
    g_changes = true;
    comboGeneratorTrans({ "value": g_combo.join("+") });
    animate("options_clear").add({ "color": { "b": 70 / 255 } })
}

function init(attr)
{
    Engine.GetGUIObjectByName("dialogBackground").onMouseLeftPress = close;

    animate("dialog").add({
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

    animate("setting_value_border").add({ "color": "60 60 60 255", });
    animate("setting_value_text").add({ "color": "20 20 20 255" });
    animate("options").add({ "size": { "bottom": 30 }, "color": "60 60 60 255" });

    // Save button
    let options_save = Engine.GetGUIObjectByName("options_save");
    animate(options_save).add({ "color": { "g": 50 / 255 } });
    options_save.onMouseLeftPress = () => animate(options_save).add({ "color": { "g": 150 / 255 } });
    options_save.onMouseLeftRelease = () => close(true);
    options_save.onMouseEnter = () => animate(options_save).add({ "color": { "g": 70 / 255 } });
    options_save.onMouseLeave = () => animate(options_save).add({ "color": { "g": 50 / 255 } });

    // Clear button
    let options_clear = Engine.GetGUIObjectByName("options_clear");
    animate(options_clear).add({ "color": { "b": 50 / 255 } });
    options_clear.onMouseLeftPress = () => animate(options_clear).add({ "color": { "b": 150 / 255 } });
    options_clear.onMouseLeftRelease = () => clearCombo();
    options_clear.onMouseEnter = () => animate(options_clear).add({ "color": { "b": 70 / 255 } });
    options_clear.onMouseLeave = () => animate(options_clear).add({ "color": { "b": 50 / 255 } });

    // Cancel button
    let options_cancel = Engine.GetGUIObjectByName("options_cancel");
    animate(options_cancel).add({ "color": { "r": 50 / 255 } });
    options_cancel.onMouseLeftPress = () => animate(options_cancel).add({ "color": { "r": 150 / 255 } });
    options_cancel.onMouseLeftRelease = () => close(false);
    options_cancel.onMouseEnter = () => animate(options_cancel).add({ "color": { "r": 70 / 255 } });
    options_cancel.onMouseLeave = () => animate(options_cancel).add({ "color": { "r": 50 / 255 } });

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

// In : [1,3,1,4,2]   Out: [0,1,4,5,9,11]
let accumulateArray = list => list.reduce((acum, value, i) => [...acum, value + acum[i]], [0]);
let getComboFromText = text => text.split("+").filter(t => !["unused", ""].includes(t));

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
            animate(child).add({
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
            animate(child).add({
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
            animate(child).add({
                "onComplete": object => object.caption = "",
                "color": "40 40 40 0",
                "textcolor": "150 150 150 0",
            });
        else
            animate(child).add({
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

function keyPriority(key)
{
    switch (key)
    {
        case "Ctrl": return 0;
        case "Alt": return 1;
        case "Shift": return 2;
        case "Space": return 3;
        default: return 10;
    }
}

function comboBreaker(newEntry)
{
    if (g_combo.length >= 4 || g_combo.includes(newEntry) || !newEntry)
        return;

    g_changes = true;
    g_combo.push(newEntry);
    g_combo.sort((a, b) => keyPriority(a) > keyPriority(b));
    comboGeneratorTrans({ "value": g_combo.join("+") });
};

function handleInputBeforeGui(ev)
{
    if (ev !== undefined &&
        ev.keysym !== undefined &&
        ev.keysym.sym in g_SDL_keycode_value_to_0ad_key)
        comboBreaker(g_SDL_keycode_value_to_0ad_key[ev.keysym.sym]);

    return !(ev.type && ev.type.startsWith("mouse"));
}
