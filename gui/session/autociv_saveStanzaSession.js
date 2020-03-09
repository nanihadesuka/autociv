var g_autociv_stanza = new ConfigJSON("stanza", false);

function autociv_saveStanzaSession()
{
    if (!g_IsController ||  Engine.IsAtlasRunning())
        return;

    // Extract the relevant player data and minimize packet load
    let minPlayerData = [];
    for (let playerID in g_GameAttributes.settings.PlayerData)
    {
        if (+playerID == 0)
            continue;

        let pData = g_GameAttributes.settings.PlayerData[playerID];

        let minPData = { "Name": pData.Name, "Civ": pData.Civ };

        if (g_GameAttributes.settings.LockTeams)
            minPData.Team = pData.Team;

        if (pData.AI)
        {
            minPData.AI = pData.AI;
            minPData.AIDiff = pData.AIDiff;
            minPData.AIBehavior = pData.AIBehavior;
        }

        if (g_Players[playerID].offline)
            minPData.Offline = true;

        // Whether the player has won or was defeated
        let state = g_Players[playerID].state;
        if (state != "active")
            minPData.State = state;

        minPlayerData.push(minPData);
    }

    // Add observers
    let connectedPlayers = 0;
    for (let guid in g_PlayerAssignments)
    {
        let pData = g_GameAttributes.settings.PlayerData[g_PlayerAssignments[guid].player];

        if (pData)
            ++connectedPlayers;
        else
            minPlayerData.push({
                "Name": g_PlayerAssignments[guid].name,
                "Team": "observer"
            });
    }

    g_autociv_stanza.setValue("session", {
        "connectedPlayers": connectedPlayers,
        "minPlayerData": playerDataToStringifiedTeamList(minPlayerData)
    });
}
