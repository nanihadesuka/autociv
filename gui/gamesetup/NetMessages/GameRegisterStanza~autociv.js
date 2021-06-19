// STANZA REREGISTER CODE
autociv_patchApplyN(LobbyGameRegistrationController.prototype, "sendImmediately", function (target, that, args)
{
    let result = target.apply(that, args);

    if (g_IsController && that.lastStanza != undefined)
        that.autociv_stanza.setValue("gamesetup", that.lastStanza);

    return result;
})

LobbyGameRegistrationController.prototype.autociv_stanza = new ConfigJSON("stanza", false);
LobbyGameRegistrationController.prototype.autociv_stanza.removeAllValues();
