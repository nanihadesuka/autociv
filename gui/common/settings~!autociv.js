/**
 * All the modifications are additive.
 */

loadMapTypes = function ()
{
	return [
		{
			"Name": "skirmish",
			"Title": translateWithContext("map", "Skirmish"),
			"Description": translate("A map with a predefined landscape and number of players. Freely select the other gamesettings."),
			"Path": "maps/skirmishes/",
			"Extension": ".xml",
			"Default": true
		},
		{
			"Name": "random",
			"Title": translateWithContext("map", "Random"),
			"Description": translate("Create a unique map with a different resource distribution each time. Freely select the number of players and teams."),
			"Path": "maps/random/",
			"Extension": ".json"
		},
		{
			"Name": "scenario",
			"Title": translateWithContext("map", "Scenario"),
			"Description": translate("A map with a predefined landscape and matchsettings."),
			"Path": "maps/scenarios/",
			"Extension": ".xml"
		}
	];
}

function loadMapFilters()
{
	return [
		{
			"id": "default",
			"name": translateWithContext("map filter", "Default"),
			"tooltip": translateWithContext("map filter", "All maps except naval and demo maps."),
			"filter": mapKeywords => mapKeywords.every(keyword => ["naval", "demo", "hidden"].indexOf(keyword) == -1),
			"Default": true
		},
		{
			"id": "naval",
			"name": translate("Naval Maps"),
			"tooltip": translateWithContext("map filter", "Maps where ships are needed to reach the enemy."),
			"filter": mapKeywords => mapKeywords.indexOf("naval") != -1
		},
		{
			"id": "demo",
			"name": translate("Demo Maps"),
			"tooltip": translateWithContext("map filter", "These maps are not playable but for demonstration purposes only."),
			"filter": mapKeywords => mapKeywords.indexOf("demo") != -1
		},
		{
			"id": "new",
			"name": translate("New Maps"),
			"tooltip": translateWithContext("map filter", "Maps that are brand new in this release of the game."),
			"filter": mapKeywords => mapKeywords.indexOf("new") != -1
		},
		{
			"id": "trigger",
			"name": translate("Trigger Maps"),
			"tooltip": translateWithContext("map filter", "Maps that come with scripted events and potentially spawn enemy units."),
			"filter": mapKeywords => mapKeywords.indexOf("trigger") != -1
		},
		{
			"id": "all",
			"name": translate("All Maps"),
			"tooltip": translateWithContext("map filter", "Every map of the chosen maptype."),
			"filter": mapKeywords => true
		},
	];
}

loadSettingsValues = function ()
{
	var settings = {
		"AIDescriptions": loadAIDescriptions(),
		"AIDifficulties": loadAIDifficulties(),
		"AIBehaviors": loadAIBehaviors(),
		"Ceasefire": "loadCeasefire" in global ? loadCeasefire() : "",
		"VictoryDurations": loadVictoryDuration(),
		"GameSpeeds": loadSettingValuesFile("game_speeds.json"),
		"MapTypes": loadMapTypes(),
		"MapFilters": loadMapFilters(),
		"MapSizes": loadSettingValuesFile("map_sizes.json"),
		"Biomes": loadBiomes(),
		"PlayerDefaults": loadPlayerDefaults(),
		"PopulationCapacities": loadPopulationCapacities(),
		"StartingResources": loadSettingValuesFile("starting_resources.json"),
		"VictoryConditions": loadVictoryConditions(),
		"TriggerDifficulties": loadSettingValuesFile("trigger_difficulties.json")
	};

	if (Object.keys(settings).some(key => settings[key] === undefined))
		return undefined;

	return deepfreeze(settings);
}

/**
 * Forced to do this given that the original code has no flexibility :/
 */
const g_Settings_for_MapBrowser = loadSettingsValues();
