
// NOTE: in a24 we can no longer know if host is stun or port forward
autociv_patchApplyN(GameList.prototype, "rebuildGameList", function (target, that, args)
{
    let result = target.apply(that, args);

    if (Engine.ConfigDB_GetValue("user", "autociv.lobby.gamelist.showHostName") != "true")
        return;

    let gamesBox = Engine.GetGUIObjectByName("gamesBox");
    gamesBox.list_gameName = gamesBox.list_gameName.map((v, i) =>
        `${v} [color="90 90 90"]\\ - ${that.gameList[i]?.stanza?.hostUsername ?? ""}[/color]`
    );

    gamesBox.list = gamesBox.list;
    return result;
})
