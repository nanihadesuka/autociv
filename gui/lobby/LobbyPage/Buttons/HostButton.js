/**
 * This class manages the button that enables the player to configure the start a new hosted multiplayer match.
 */
class HostButton
{
	constructor(dialog, xmppMessages, button, loadSavedGame)
	{
		this.hostButton = button;
		this.hostButton.onPress = this.onPress.bind(this, loadSavedGame);
		this.hostButton.hidden = dialog;

		let onConnectionStatusChange = this.onConnectionStatusChange.bind(this);
		xmppMessages.registerXmppMessageHandler("system", "connected", onConnectionStatusChange);
		xmppMessages.registerXmppMessageHandler("system", "disconnected", onConnectionStatusChange);
		this.onConnectionStatusChange();
	}

	onConnectionStatusChange()
	{
		this.hostButton.enabled = Engine.IsXmppClientConnected();
	}

	onPress(loadSavedGame)
	{
		Engine.PushGuiPage("page_gamesetup_mp.xml", {
			"loadSavedGame": loadSavedGame,
			"multiplayerGameType": "host",
			"name": g_Nickname,
			"rating": Engine.LobbyGetPlayerRating(g_Nickname)
		});
	}
}
