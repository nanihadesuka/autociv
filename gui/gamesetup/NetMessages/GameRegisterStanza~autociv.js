// MODS FILTER CODE
if (!GameRegisterStanza.prototype.autociv_filterModsList)
{
    GameRegisterStanza.prototype.autociv_filterModsList = []
    GameRegisterStanza.prototype.autociv_filterMods = function ()
    {
        if (!g_IsController || !Engine.HasXmppClient())
            return;

        const filter = mod => this.autociv_filterModsList.every(f => f(...mod))
        this.mods = JSON.stringify(Engine.GetEngineInfo().mods.filter(filter))
    }

    autociv_patchApplyN(GameRegisterStanza.prototype, "sendImmediately", function (target, that, args)
    {
        that.autociv_filterMods()
        return target.apply(that, args)
    })
}

/**
 * MOD FILTER
 * @returns False: removes mod from mods list
 */
GameRegisterStanza.prototype.autociv_filterModsList.push((name, version) =>
{
    return !/^AutoCiv.*/i.test(name)
})

// STANZA REREGISTER CODE
autociv_patchApplyN(GameRegisterStanza.prototype, "sendImmediately", function (target, that, args)
{
    let result = target.apply(that, args);

    if (g_IsController && that.lastStanza != undefined)
        that.autociv_stanza.setValue("gamesetup", that.lastStanza);

    return result;
})

GameRegisterStanza.prototype.autociv_stanza = new ConfigJSON("stanza", false);
GameRegisterStanza.prototype.autociv_stanza.removeAllValues();
