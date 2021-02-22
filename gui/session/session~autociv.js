
function autociv_initBots()
{
	botManager.get("playerReminder").load(true);
	botManager.get("mute").load(true);
	botManager.get("vote").load(false);
	botManager.get("link").load(true);
	botManager.setMessageInterface("ingame");
	autociv_InitSharedCommands();
}

function autociv_addVersionLabel()
{
	let label = Engine.GetGUIObjectByName("buildTimeLabel");
	if (!(label && label.caption))
		return;
	let mod = ([name, version]) => /^AutoCiv.*/i.test(name);
	let modInfo = Engine.GetEngineInfo().mods.find(mod);
	let version = modInfo && modInfo[1] && modInfo[1].split(".").slice(1).join(".") || "";
	label.caption = `${label.caption} [color="255 255 255 127"]${version}[/color]`;
}

function autociv_patchSession()
{
	autociv_patchApplyN("addChatMessage", function (target, that, args)
	{
		let [msg] = args;
		return botManager.react(msg) || target.apply(that, args);
	})

	if (g_autociv_is24)
		return;

	autociv_patchApplyN("sendLobbyPlayerlistUpdate", function (target, that, args)
	{
		autociv_saveStanzaSession();
		return target.apply(that, args);
	})
}

function autociv_SetChatTextFromConfig()
{
	if (Engine.ConfigDB_GetValue("user", "autociv.session.chatPanel.size.change") == "true")
		Engine.GetGUIObjectByName("chatPanel").size = Engine.ConfigDB_GetValue("user", "autociv.session.chatPanel.size");

	if (Engine.ConfigDB_GetValue("user", "autociv.session.chatText.font.change") == "true")
		Engine.GetGUIObjectByName("chatText").font = Engine.ConfigDB_GetValue("user", "autociv.session.chatText.font");
}


function autociv_patchMinimapFlare()
{
	autociv_patchApplyN("handleMinimapEvent", function (target, that, args)
	{
		if (!g_IsObserver && Engine.HotkeyIsPressed("autociv.minimap.mode.flare"))
		{
			let [ev] = args;
			Engine.PostNetworkCommand({
				"type": "dialog-answer",
				"autociv_minimap_flare": true,
				"mapPos": {
					"x": ev.x,
					"z": ev.z
				}
			})

			return;
		}

		return target.apply(that, args);
	})
}

// Might get wrong values when camera is near map border
function autociv_getCameraAngle()
{
	let p1 = new Vector2D(Engine.CameraGetX(), Engine.CameraGetZ());

	let windowSize = Engine.GetGUIObjectByName("gl_autociv_WindowSize").getComputedSize();
	let data = Engine.GetTerrainAtScreenPoint(windowSize.right / 2, windowSize.bottom);
	let p2 = new Vector2D(data.x, data.z);

	let dir1 = new Vector2D(1, 0);
	let dir2 = new Vector2D(p2.x - p1.x, p2.y - p1.y);

	return dir1.angleTo(dir2);
}

// Assumes 1 size unit = 4 tiles = 4 coordinates units
function autociv_getMapSizeInTiles()
{
	return g_GameAttributes.settings.Size * 4;
}

autociv_patchApplyN("onTick", function (target, that, args)
{
	return target.apply(that, args);
})

autociv_patchApplyN("init", function (target, that, args)
{
	let result = target.apply(that, args);
	autociv_initBots();
	autociv_patchSession();
	autociv_bugFix_openChat();
	autociv_bugFix_entity_unkown_reason();
	autociv_addVersionLabel();
	autociv_saveStanzaSession();
	autociv_SetCorpsesMax(Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"));
	autociv_SetChatTextFromConfig();
	return result;
})
