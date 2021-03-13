PlayerList = new Proxy(PlayerList, {
    construct: function (target, args)
    {
        const autociv_playersBox_preferences = new ConfigJSON("playersBox", true, false);
        const playersBox = Engine.GetGUIObjectByName("playersBox");

        for (let id of autociv_playersBox_preferences.getIds())
            playersBox[id] = autociv_playersBox_preferences.getValue(id);

        let instance = new target(...args);
        instance.autociv_playersBox_preferences = autociv_playersBox_preferences
        return instance;
    }
});

autociv_patchApplyN(PlayerList.prototype, "onPlayerListSelection", function (target, that, args)
{
    if (that.autociv_playersBox_preferences)
    {
        for (let id of ["selected_column", "selected_column_order"])
            that.autociv_playersBox_preferences.setValue(id, that.playersBox[id])
        that.autociv_playersBox_preferences.save()
    }

    return target.apply(that, args);
})
