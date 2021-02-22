var g_autociv_stanza = new ConfigJSON("stanza", false);

autociv_patchApplyN(LobbyGamelistReporter.prototype, "sendGamelistUpdate", function (target, that, args)
{
    g_autociv_stanza.setValue("session", {
        "connectedPlayers": that.countConnectedPlayers(),
        "minPlayerData": playerDataToStringifiedTeamList([...that.getPlayers(), ...that.getObservers()])
    });
    return target.apply(that, args);
})
