autociv_patchApplyN(GameSettingControlManager.prototype, "addAutocompleteEntries", function (target, that, args)
{
    let [entries] = args
    entries[200] = entries[200] ?? []
    Array.prototype.push.apply(entries[200], Object.keys(g_NetworkCommands))
    return target.apply(that, args)
})
