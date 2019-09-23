// Snaps building placement to cursor and previews it
function showBuildingPlacementTerrainSnap(mousePosX, mousePosY)
{
	placementSupport.position = Engine.GetTerrainAtScreenPoint(mousePosX, mousePosY);

	if (placementSupport.mode === "wall")
	{
		// Including only the on-screen towers in the next snap candidate list is sufficient here, since the user is
		// still selecting a starting point (which must necessarily be on-screen). (The update of the snap entities
		// itself happens in the call to updateBuildingPlacementPreview below).
		placementSupport.wallSnapEntitiesIncludeOffscreen = false;
	}
	else
	{
		// Cancel if not enough resources
		if (placementSupport.template && Engine.GuiInterfaceCall("GetNeededResources", { "cost": GetTemplateData(placementSupport.template).cost }))
		{
			placementSupport.Reset();
			inputState = INPUT_NORMAL;
			return true;
		}

		let snapData = Engine.GuiInterfaceCall("GetFoundationSnapData", {
			"template": placementSupport.template,
			"x": placementSupport.position.x,
			"z": placementSupport.position.z,
		});
		if (snapData)
		{
			placementSupport.angle = snapData.angle;
			placementSupport.position.x = snapData.x;
			placementSupport.position.z = snapData.z;
		}
	}

	// Includes an update of the snap entity candidates
	updateBuildingPlacementPreview();

	return false;
}

/**
 * Select a building from the construction panel given the current unit(s) selected.
 * @param return - true if buildings exist and is selected to place.
 */
function hotkeyPlaceBuildingType(genericName)
{
	let translatedGenericName = translate(genericName);
	let playerState = GetSimState().players[Engine.GetPlayerID()];
	let selection = g_Selection.toList();

	if (!playerState || !selection.length || Engine.GetGUIObjectByName("unitConstructionPanel").hidden)
		return;

	let index = g_SelectionPanels.Construction.getItems().
		map(item => GetTemplateData(item).name.generic).
		indexOf(translatedGenericName);

	if (index == -1)
		return;

	let unitConstructionButton = Engine.GetGUIObjectByName("unitConstructionButton[" + index + "]");

	if (!unitConstructionButton || unitConstructionButton.hidden || !unitConstructionButton.enabled || !unitConstructionButton.onPress)
		return;

	unitConstructionButton.onPress();
	showBuildingPlacementTerrainSnap(mouseX, mouseY);

	return true;
}

function hotkeyCycleEntities(genericName)
{
	let entities = Engine.GuiInterfaceCall("autociv_FindEntitiesByGenericName", genericName);
	if (entities.length === undefined || !entities.length)
		return false;


	// CASE 1: wants to select all entities of the same type.

	if (Engine.HotkeyIsPressed("selection.offscreen"))
	{
		// CASE 1 + 3: doesn't want to keep current selection.
		if (!Engine.HotkeyIsPressed("selection.add"))
			g_Selection.reset();

		g_Selection.addList(entities);
		return true;
	}


	// CASE 2: cycle between entities of the same type once at a time.

	let entityIsCurrentlySelected = (entity) => g_Selection.selected[entity] !== undefined;

	// Find the index in entities of the first entity inside current selection.
	let entityIndex = 0;
	for (; entityIndex < entities.length; ++entityIndex)
		if (entityIsCurrentlySelected(entities[entityIndex]))
			break;

	// Find the first entity not in the current selection
	for (let index = 0; index < entities.length; ++index)
	{
		let entity = entities[(index + entityIndex) % entities.length];
		if (!entityIsCurrentlySelected(entity))
		{
			// CASE 2 + 3: doesn't want to keep current selection.
			if (!Engine.HotkeyIsPressed("selection.add"))
				g_Selection.reset();

			g_Selection.addList([entity]);
			return true;
		}
	}

	return false;
}

var g_autociv_Hotkeys = {
	"autociv.session.building.autotrain.enable": function (ev)
	{
		if (ev.type == "hotkeydown")
			Engine.GuiInterfaceCall("autociv_SetAutotrain", {
				"active": true,
				"entities": g_Selection.toList()
			});

	},
	"autociv.session.building.autotrain.disable": function (ev)
	{
		if (ev.type == "hotkeydown")
			Engine.GuiInterfaceCall("autociv_SetAutotrain", {
				"active": false,
				"entities": g_Selection.toList()
			});
	},
	"autociv.open.autociv_settings": function (ev)
	{
		autocivCL.Engine.PushGuiPage("page_autociv_settings.xml");
	}
}

var g_autociv_SpecialHotkeyCalled = false;

var g_autociv_SpecialHotkeys = {
	// Hotkeys for building placement
	"autociv.session.building.place.": function (ev, hotkeyPrefix)
	{
		let buildingGenericName = ev.hotkey.split(hotkeyPrefix)[1].replace(/_/g, " ");
		if (!hotkeyPlaceBuildingType(buildingGenericName))
			return;

		g_autociv_SpecialHotkeyCalled = true;
	},
	// Hotkeys for unit or buildings selection, cycle
	"autociv.session.entity.select.": function (ev, hotkeyPrefix)
	{
		let entityGenericName = ev.hotkey.split(hotkeyPrefix)[1].replace(/_/g, " ");
		if (!hotkeyCycleEntities(entityGenericName))
			return;
		g_autociv_SpecialHotkeyCalled = true;
	}
};

handleInputAfterGui = (function (originalFunction)
{
	return function (ev)
	{
		// Special case hotkeys
		if (!g_autociv_SpecialHotkeyCalled && ev.type == "hotkeydown")
		{
			for (let hotkeyPrefix in g_autociv_SpecialHotkeys)
				if (ev.hotkey && ev.hotkey.startsWith(hotkeyPrefix))
					if (g_autociv_SpecialHotkeys[hotkeyPrefix](ev, hotkeyPrefix))
						break;
		}

		// Hotkey with normal behaviour
		if (ev.hotkey && g_autociv_Hotkeys[ev.hotkey])
			g_autociv_Hotkeys[ev.hotkey](ev);

		return originalFunction(ev);
	}
})(handleInputAfterGui);
