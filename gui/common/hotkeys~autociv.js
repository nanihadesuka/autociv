hotkeySort = function (a, b)
{
    // Quick hack to put those first.
    if (hotkeySort.specialKeys.includes(a))
        a = ' ' + a;
    if (hotkeySort.specialKeys.includes(b))
        b = ' ' + b;
    return a.localeCompare(b, Engine.GetCurrentLocale().substr(0, 2), { "numeric": true });
}

if (!hotkeySort.specialKeys)
    hotkeySort.specialKeys = ["Shift", "Alt", "Ctrl", "Super"];

hotkeySort.specialKeys.push("Space")
