GameRegisterStanza = new Proxy(GameRegisterStanza, {
    construct: function (target, args)
    {
        let instance = new target(...args);
        let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
        instance.mods = JSON.stringify(JSON.parse(instance.mods).filter(mod));
        return instance;
    }
});

autociv_patchApplyN(GameRegisterStanza.prototype, "sendImmediately", function (target, that, args)
{
    let result = target.apply(that, args);
    if (g_IsController && that.lastStanza != undefined)
        g_autociv_stanza.setValue("gamesetup", that.lastStanza);
    return result;
})
