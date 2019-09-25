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

	return;
}

/**
 * Select a building from the construction panel given the current unit(s) selected.
 * @param return - true if buildings exist and is selected to place.
 */
function autociv_placeBuildingByGenericName(genericName)
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

function autociv_selectEntityWithGenericName(genericName, selectAll, accumulateSelection)
{
	let entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithGenericName", genericName);
	return autociv_selectFromList(entities, selectAll, accumulateSelection);
}

function autociv_selectEntityWithClassesExpression(classesExpression, selectAll, accumulateSelection)
{
	let entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithClassesExpression", classesExpression);
	return autociv_selectFromList(entities, selectAll, accumulateSelection);
}

function autociv_selectFromList(entities, selectAll, accumulateSelection)
{
	if (selectAll === undefined)
		selectAll = Engine.HotkeyIsPressed("selection.offscreen");

	if (accumulateSelection === undefined)
		accumulateSelection = Engine.HotkeyIsPressed("selection.add");

	if (entities.length === undefined || !entities.length)
		return;

	// CASE 1: wants to select all entities of the same type.
	if (selectAll)
	{
		// CASE 1 + 3: doesn't want to keep current selection.
		if (!accumulateSelection)
			g_Selection.reset();

		g_Selection.addList(entities);
		return true;
	}

	// CASE 2: cycle between entities of the same type one at a time.
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
			if (!accumulateSelection)
				g_Selection.reset();

			g_Selection.addList([entity]);
			return true;
		}
	}

	return;
}

var g_autociv_hotkeys = {
	"autociv.session.building.autotrain.enable": function (ev)
	{
		if (ev.type == "hotkeydown")
		{
			Engine.GuiInterfaceCall("autociv_SetAutotrain", {
				"active": true,
				"entities": g_Selection.toList()
			});
			return true;
		}
	},
	"autociv.session.building.autotrain.disable": function (ev)
	{
		if (ev.type == "hotkeydown")
		{
			Engine.GuiInterfaceCall("autociv_SetAutotrain", {
				"active": false,
				"entities": g_Selection.toList()
			});
			return true;
		}
	},
	"autociv.open.autociv_settings": function (ev)
	{
		autocivCL.Engine.PushGuiPage("page_autociv_settings.xml");
		return true;
	}
}

var g_autociv_SpecialHotkeyCalled = false;

var g_autociv_SpecialHotkeys = {
	// Hotkeys for building placement
	"autociv.session.building.place.": function (ev, hotkeyPrefix)
	{
		let buildingGenericName = ev.hotkey.split(hotkeyPrefix)[1].replace(/_/g, " ");
		return autociv_placeBuildingByGenericName(buildingGenericName);
	},
	// Hotkeys for unit or buildings selection by generic name
	"autociv.session.entity.select.": function (ev, hotkeyPrefix)
	{
		let entityGenericName = ev.hotkey.split(hotkeyPrefix)[1].replace(/_/g, " ");
		return autociv_selectEntityWithGenericName(entityGenericName);
	},
	// Hotkeys for unit or buildings selection by classes
	"autociv.session.entity.by.class.select.": function (ev, hotkeyPrefix)
	{
		let enitytClassesExpression = ev.hotkey.split(hotkeyPrefix)[1];
		return autociv_selectEntityWithClassesExpression(enitytClassesExpression, true);
	}
};

handleInputAfterGui = (function (originalFunction)
{
	return function (ev)
	{
		// Special case hotkeys
		if (!g_autociv_SpecialHotkeyCalled && ev.type == "hotkeydown")
			for (let hotkeyPrefix in g_autociv_SpecialHotkeys)
				if (ev.hotkey && ev.hotkey.startsWith(hotkeyPrefix))
					return !!g_autociv_SpecialHotkeys[hotkeyPrefix](ev, hotkeyPrefix);

		// Hotkey with normal behaviour
		if (ev.hotkey && g_autociv_hotkeys[ev.hotkey])
			return !!g_autociv_hotkeys[ev.hotkey](ev);

		return originalFunction(ev);
	}
})(handleInputAfterGui);
