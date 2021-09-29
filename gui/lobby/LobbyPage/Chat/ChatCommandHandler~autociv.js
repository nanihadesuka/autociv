ChatCommandHandler.prototype.ChatCommands["pingall"] = {
    "description": translate("Ping all 'Online' and 'Observer' players."),
    "handler": function (args)
    {
        const selfNick = Engine.LobbyGetNick();
        const ignore = new Set([selfNick, "Ratings", "WFGBot", "Triumvir", "user1", "Dunedan", "Rollo"]);
        const candidatesToAnnoy = new Set();

        const gameList = g_LobbyHandler.lobbyPage.lobbyPage.panels.gameList.gameList;
        for (let game of gameList)
        {
            const players = game.players;
            const selfInHost = players.some(player => splitRatingFromNick(player.Name).nick == selfNick);
            for (let player of players)
                if (selfInHost)
                    ignore.add(splitRatingFromNick(player.Name).nick);
                else if (player.Team == "observer")
                    candidatesToAnnoy.add(splitRatingFromNick(player.Name).nick);
        }

        for (let player of Engine.GetPlayerList())
            if (player.presence == "available")
                candidatesToAnnoy.add(player.name);

        for (let v of ignore)
            candidatesToAnnoy.delete(v);

        const annoyList = Array.from(candidatesToAnnoy).join(", ");

        Engine.LobbySendMessage(annoyList);
        if (args.trim())
            Engine.LobbySendMessage(args)

        return true;
    }
};

ChatCommandHandler.prototype.ChatCommands["pingall"]["playing"] = {
    "description": translate("Set your state to 'Playing'."),
    "handler": function ()
    {
        Engine.LobbySetPlayerPresence("playing");
        return true;
    }
};
