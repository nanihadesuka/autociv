
// WE NO LONGER KNOWN IF GAME IF STUN OR PORTFORWARD SO THIS IS USELESS
// autociv_patchApplyN(GameList.prototype, "rebuildGameList", function (target, that, args)
// {
//     let result = target.apply(that, args);

//     if (Engine.ConfigDB_GetValue("user", "autociv.lobby.gamelist.markStunGames") == "true")
//     {
//         let gamesBox = Engine.GetGUIObjectByName(g_autociv_isFGod ? "gameList" : "gamesBox");
//         gamesBox.list_gameName = gamesBox.list_gameName.map((v, i) =>
//         {
//             if (i > that.gameList.length - 1)
//                 return v;

//             return `${v} [color="90 90 90"]\\ ${that.gameList[i].stunIP ? "stun" : "port forward"}[/color]`;
//         });
//         gamesBox.list = gamesBox.list;
//     }
//     return result;
// })
