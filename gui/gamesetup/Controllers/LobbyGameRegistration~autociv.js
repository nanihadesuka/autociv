LobbyGameRegistrationController.prototype.formatClientsForStanza = function ()
{
	let connectedPlayers = 0;
	let playerData = [];

	for (let guid in g_PlayerAssignments)
	{
		let pData = { "Name": g_PlayerAssignments[guid].name };

		if (g_PlayerAssignments[guid].player != -1)
			++connectedPlayers;
		else
			pData.Team = "observer";

		playerData.push(pData);
	}

	return {
		"list": playerDataToStringifiedTeamList(playerData),
		"connectedPlayers": connectedPlayers
	};
};
