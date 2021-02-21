function autociv_reregister()
{
	const autociv_stanza = new ConfigJSON("stanza", false);

	if (!autociv_stanza.hasValue("gamesetup"))
		return;
	const gamesetup = autociv_stanza.getValue("gamesetup");

	const registered = () => g_GameList.findIndex(entry => entry.hostUsername == gamesetup.hostUsername) != -1;

	setTimeout(() =>
	{
		if (!Engine.HasNetServer() ||
			!Engine.IsXmppClientConnected())
			return;

		warn("Autociv: Reregistering game to lobby")
		Engine.SendRegisterGame(gamesetup);

		setTimeout(() =>
		{
			if (!Engine.HasNetServer() ||
				!Engine.IsXmppClientConnected() ||
				!autociv_stanza.hasValue("session"))
				return;

			if (!registered())
				return;

			warn("Autociv: Sending last game changes")
			let session = autociv_stanza.getValue("session");
			Engine.SendChangeStateGame(session.connectedPlayers, session.minPlayerData);

		}, 2500)

	}, 2500)

}

function autociv_reconnect()
{
	Engine.ConnectXmppClient();
	autociv_reregister();
}

autociv_patchApplyN(ConnectionHandler.prototype, "askReconnect", function (target, that, args)
{
	messageBox(
		400, 200,
		translate("You have been disconnected from the lobby. Do you want to reconnect?"),
		translate("Confirmation"),
		[translate("No"), translate("Yes")],
		[null, autociv_reconnect]);
})
