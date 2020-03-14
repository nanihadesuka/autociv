var g_SDL_keycode_value_to_0ad_key = Engine.ReadJSONFile("autociv_data/SDL_keycode_value_to_0ad_key.json");
var g_combo = [];
var g_changes = false;
var g_data = {};

function close(save = false)
{
    if (save && g_changes)
        autocivCL.Engine.PopGuiPage({
            "saveNewCombo": true,
            "value": g_combo.join("+"),
            "i": g_data.data.i
        }, true);
    else
        autocivCL.Engine.PopGuiPage();
}

function clearCombo()
{
    g_combo = [];
    g_changes = true;
    comboGeneratorTrans({ "value": g_combo.join("+") });
    animate("options_clear").complete().add({ "color": { "b": 70 / 255 } })
}

function init(data)
{
    g_data = data;
    Engine.GetGUIObjectByName("dialogBackground").onMouseLeftPress = () => close(false);

    animate("dialog").complete().add({
        "start": {
            "size": {
                "left": -7.5,
                "top": g_data.absoluteSize.top,
                "bottom": g_data.absoluteSize.bottom,
                "right": g_data.absoluteSize.right - g_data.absoluteSize.left - 7.5
            }
        },
        "color": "40 40 40 255"
    });

    animate("setting_value_border").complete().add({ "color": "60 60 60 255", });
    animate("setting_value_text").complete().add({ "color": "20 20 20 255" });
    animate("options").complete().add({ "size": { "bottom": 30 }, "color": "60 60 60 255" });

    let color = (btn, t, v) => btn.complete().add({ "color": { [t]: v / 255 } });

    // Save button
    let options_save = Engine.GetGUIObjectByName("options_save");
    let saveBtn = animate(options_save);
    color(saveBtn, "g", 50);
    options_save.onMouseLeftPress = () => color(saveBtn, "g", 150);
    options_save.onMouseLeftRelease = () => close(true);
    options_save.onMouseEnter = () => color(saveBtn, "g", 70);
    options_save.onMouseLeave = () => color(saveBtn, "g", 50);

    // Clear button
    let options_clear = Engine.GetGUIObjectByName("options_clear");
    let clearBtn = animate(options_clear);
    color(clearBtn, "b", 50);
    options_clear.onMouseLeftPress = () => color(clearBtn, "b", 150);
    options_clear.onMouseLeftRelease = () => clearCombo();
    options_clear.onMouseEnter = () => color(clearBtn, "b", 70);
    options_clear.onMouseLeave = () => color(clearBtn, "b", 50);

    // Cancel button
    let options_cancel = Engine.GetGUIObjectByName("options_cancel");
    let cancelBtn = animate(options_cancel);
    color(cancelBtn, "r", 50);
    options_cancel.onMouseLeftPress = () => color(cancelBtn, "r", 150);
    options_cancel.onMouseLeftRelease = () => close(false);
    options_cancel.onMouseEnter = () => color(cancelBtn, "r", 70);
    options_cancel.onMouseLeave = () => color(cancelBtn, "r", 50);

    comboGenerator(g_data.data)
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
var accumulateArray = list => list.reduce((acum, value, i) => [...acum, value + acum[i]], [0]);
var getComboFromText = text => text.split("+").filter(t => ["unused", ""].indexOf(t) == -1);

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
            animate(child).complete().add({
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
            animate(child).complete().add({
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
            animate(child).complete().add({
                "onComplete": object => object.caption = "",
                "color": "40 40 40 0",
                "textcolor": "150 150 150 0",
            });
        else
            animate(child).complete().add({
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
    if (g_combo.length >= 4 || (g_combo.indexOf(newEntry) != -1) || !newEntry)
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
