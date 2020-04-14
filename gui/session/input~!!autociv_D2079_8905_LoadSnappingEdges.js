// Revision https://code.wildfiregames.com/D2079?id=8905
// ONLY MEANT FOR 23b
function autociv_input_D2079_8905_LoadSnappingEdges()
{
    global["handleInputBeforeGui"] = function (ev, hoveredObject)
    {
        if (GetSimState().cinemaPlaying)
            return false;

        // Capture mouse position so we can use it for displaying cursors,
        // and key states
        switch (ev.type)
        {
            case "mousebuttonup":
            case "mousebuttondown":
            case "mousemotion":
                mouseX = ev.x;
                mouseY = ev.y;
                break;
        }

        // Remember whether the mouse is over a GUI object or not
        mouseIsOverObject = (hoveredObject != null);

        // Close the menu when interacting with the game world
        if (!mouseIsOverObject && (ev.type == "mousebuttonup" || ev.type == "mousebuttondown")
            && (ev.button == SDL_BUTTON_LEFT || ev.button == SDL_BUTTON_RIGHT))
            closeMenu();

        // State-machine processing:
        //
        // (This is for states which should override the normal GUI processing - events will
        // be processed here before being passed on, and propagation will stop if this function
        // returns true)
        //
        // TODO: it'd probably be nice to have a better state-machine system, with guaranteed
        // entry/exit functions, since this is a bit broken now

        switch (inputState)
        {
            case INPUT_BANDBOXING:
                var bandbox = Engine.GetGUIObjectByName("bandbox");
                switch (ev.type)
                {
                    case "mousemotion":
                        var rect = updateBandbox(bandbox, ev, false);

                        var ents = Engine.PickPlayerEntitiesInRect(rect[0], rect[1], rect[2], rect[3], g_ViewedPlayer);
                        var preferredEntities = getPreferredEntities(ents);
                        g_Selection.setHighlightList(preferredEntities);

                        return false;

                    case "mousebuttonup":
                        if (ev.button == SDL_BUTTON_LEFT)
                        {
                            var rect = updateBandbox(bandbox, ev, true);

                            // Get list of entities limited to preferred entities
                            var ents = getPreferredEntities(Engine.PickPlayerEntitiesInRect(rect[0], rect[1], rect[2], rect[3], g_ViewedPlayer));

                            // Remove the bandbox hover highlighting
                            g_Selection.setHighlightList([]);

                            // Update the list of selected units
                            if (Engine.HotkeyIsPressed("selection.add"))
                            {
                                g_Selection.addList(ents);
                            }
                            else if (Engine.HotkeyIsPressed("selection.remove"))
                            {
                                g_Selection.removeList(ents);
                            }
                            else
                            {
                                g_Selection.reset();
                                g_Selection.addList(ents);
                            }

                            inputState = INPUT_NORMAL;
                            return true;
                        }
                        else if (ev.button == SDL_BUTTON_RIGHT)
                        {
                            // Cancel selection
                            bandbox.hidden = true;

                            g_Selection.setHighlightList([]);

                            inputState = INPUT_NORMAL;
                            return true;
                        }
                        break;
                }
                break;

            case INPUT_UNIT_POSITION:
                switch (ev.type)
                {
                    case "mousemotion":
                        return positionUnitsFreehandSelectionMouseMove(ev);
                    case "mousebuttonup":
                        return positionUnitsFreehandSelectionMouseUp(ev);
                }
                break;

            case INPUT_BUILDING_CLICK:
                switch (ev.type)
                {
                    case "mousemotion":
                        // If the mouse moved far enough from the original click location,
                        // then switch to drag-orientation mode
                        let maxDragDelta = 16;
                        if (g_DragStart.distanceTo(ev) >= maxDragDelta)
                        {
                            inputState = INPUT_BUILDING_DRAG;
                            return false;
                        }
                        break;

                    case "mousebuttonup":
                        if (ev.button == SDL_BUTTON_LEFT)
                        {
                            // If shift is down, let the player continue placing another of the same building
                            var queued = Engine.HotkeyIsPressed("session.queue");
                            if (tryPlaceBuilding(queued))
                            {
                                if (queued)
                                    inputState = INPUT_BUILDING_PLACEMENT;
                                else
                                    inputState = INPUT_NORMAL;
                            }
                            else
                            {
                                inputState = INPUT_BUILDING_PLACEMENT;
                            }
                            return true;
                        }
                        break;

                    case "mousebuttondown":
                        if (ev.button == SDL_BUTTON_RIGHT)
                        {
                            // Cancel building
                            placementSupport.Reset();
                            inputState = INPUT_NORMAL;
                            return true;
                        }
                        break;
                }
                break;

            case INPUT_BUILDING_WALL_CLICK:
                // User is mid-click in choosing a starting point for building a wall. The build process can still be cancelled at this point
                // by right-clicking; releasing the left mouse button will 'register' the starting point and commence endpoint choosing mode.
                switch (ev.type)
                {
                    case "mousebuttonup":
                        if (ev.button === SDL_BUTTON_LEFT)
                        {
                            inputState = INPUT_BUILDING_WALL_PATHING;
                            return true;
                        }
                        break;

                    case "mousebuttondown":
                        if (ev.button == SDL_BUTTON_RIGHT)
                        {
                            // Cancel building
                            placementSupport.Reset();
                            updateBuildingPlacementPreview();

                            inputState = INPUT_NORMAL;
                            return true;
                        }
                        break;
                }
                break;

            case INPUT_BUILDING_WALL_PATHING:
                // User has chosen a starting point for constructing the wall, and is now looking to set the endpoint.
                // Right-clicking cancels wall building mode, left-clicking sets the endpoint and builds the wall and returns to
                // normal input mode. Optionally, shift + left-clicking does not return to normal input, and instead allows the
                // user to continue building walls.
                switch (ev.type)
                {
                    case "mousemotion":
                        placementSupport.wallEndPosition = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);

                        // Update the building placement preview, and by extension, the list of snapping candidate entities for both (!)
                        // the ending point and the starting point to snap to.
                        //
                        // TODO: Note that here, we need to fetch all similar entities, including any offscreen ones, to support the case
                        // where the snap entity for the starting point has moved offscreen, or has been deleted/destroyed, or was a
                        // foundation and has been replaced with a completed entity since the user first chose it. Fetching all towers on
                        // the entire map instead of only the current screen might get expensive fast since walls all have a ton of towers
                        // in them. Might be useful to query only for entities within a certain range around the starting point and ending
                        // points.

                        placementSupport.wallSnapEntitiesIncludeOffscreen = true;
                        var result = updateBuildingPlacementPreview(); // includes an update of the snap entity candidates

                        if (result && result.cost)
                        {
                            var neededResources = Engine.GuiInterfaceCall("GetNeededResources", { "cost": result.cost });
                            placementSupport.tooltipMessage = [
                                getEntityCostTooltip(result),
                                getNeededResourcesTooltip(neededResources)
                            ].filter(tip => tip).join("\n");
                        }

                        break;

                    case "mousebuttondown":
                        if (ev.button == SDL_BUTTON_LEFT)
                        {
                            var queued = Engine.HotkeyIsPressed("session.queue");
                            if (tryPlaceWall(queued))
                            {
                                if (queued)
                                {
                                    // continue building, just set a new starting position where we left off
                                    placementSupport.position = placementSupport.wallEndPosition;
                                    placementSupport.wallEndPosition = undefined;

                                    inputState = INPUT_BUILDING_WALL_CLICK;
                                }
                                else
                                {
                                    placementSupport.Reset();
                                    inputState = INPUT_NORMAL;
                                }
                            }
                            else
                                placementSupport.tooltipMessage = translate("Cannot build wall here!");

                            updateBuildingPlacementPreview();
                            return true;
                        }
                        else if (ev.button == SDL_BUTTON_RIGHT)
                        {
                            // reset to normal input mode
                            placementSupport.Reset();
                            updateBuildingPlacementPreview();

                            inputState = INPUT_NORMAL;
                            return true;
                        }
                        break;
                }
                break;

            case INPUT_BUILDING_DRAG:
                switch (ev.type)
                {
                    case "mousemotion":
                        let maxDragDelta = 16;
                        if (g_DragStart.distanceTo(ev) >= maxDragDelta)
                        {
                            // Rotate in the direction of the mouse
                            placementSupport.angle = placementSupport.position.horizAngleTo(Engine.GetTerrainAtScreenPoint(ev.x, ev.y));
                        }
                        else
                        {
                            // If the mouse is near the center, snap back to the default orientation
                            placementSupport.SetDefaultAngle();
                        }

                        var snapToEdge = !Engine.HotkeyIsPressed("autociv.session.snaptoedgeOff") &&
                            Engine.ConfigDB_GetValue("user", "autociv.session.snaptoedge.enabled") === "true";
                        var snapData = Engine.GuiInterfaceCall("GetFoundationSnapData", {
                            "template": placementSupport.template,
                            "x": placementSupport.position.x,
                            "z": placementSupport.position.z,
                            "angle": placementSupport.angle,
                            "snapToEdgeEntities": snapToEdge && Engine.PickPlayerEntitiesOnScreen(g_ViewedPlayer)
                        });
                        if (snapData)
                        {
                            placementSupport.angle = snapData.angle;
                            placementSupport.position.x = snapData.x;
                            placementSupport.position.z = snapData.z;
                        }

                        // If snap position can't place use mouse position
                        let success = updateBuildingPlacementPreview();
                        if (!success && snapToEdge)
                        {
                            placementSupport.position = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);
                            updateBuildingPlacementPreview();
                        }

                        break;

                    case "mousebuttonup":
                        if (ev.button == SDL_BUTTON_LEFT)
                        {
                            // If shift is down, let the player continue placing another of the same building
                            var queued = Engine.HotkeyIsPressed("session.queue");
                            if (tryPlaceBuilding(queued))
                            {
                                if (queued)
                                    inputState = INPUT_BUILDING_PLACEMENT;
                                else
                                    inputState = INPUT_NORMAL;
                            }
                            else
                            {
                                inputState = INPUT_BUILDING_PLACEMENT;
                            }
                            return true;
                        }
                        break;

                    case "mousebuttondown":
                        if (ev.button == SDL_BUTTON_RIGHT)
                        {
                            // Cancel building
                            placementSupport.Reset();
                            inputState = INPUT_NORMAL;
                            return true;
                        }
                        break;
                }
                break;

            case INPUT_MASSTRIBUTING:
                if (ev.type == "hotkeyup" && ev.hotkey == "session.masstribute")
                {
                    g_FlushTributing();
                    inputState = INPUT_NORMAL;
                }
                break;

            case INPUT_BATCHTRAINING:
                if (ev.type == "hotkeyup" && ev.hotkey == "session.batchtrain")
                {
                    flushTrainingBatch();
                    inputState = INPUT_NORMAL;
                }
                break;
        }

        return false;
    }

    global["handleInputAfterGui"] = function (ev)
    {
        if (GetSimState().cinemaPlaying)
            return false;

        if (ev.hotkey === undefined)
            ev.hotkey = null;

        // Handle the time-warp testing features, restricted to single-player
        if (!g_IsNetworked && Engine.GetGUIObjectByName("devTimeWarp").checked)
        {
            if (ev.type == "hotkeydown" && ev.hotkey == "session.timewarp.fastforward")
                Engine.SetSimRate(20.0);
            else if (ev.type == "hotkeyup" && ev.hotkey == "session.timewarp.fastforward")
                Engine.SetSimRate(1.0);
            else if (ev.type == "hotkeyup" && ev.hotkey == "session.timewarp.rewind")
                Engine.RewindTimeWarp();
        }

        if (ev.hotkey == "session.highlightguarding")
        {
            g_ShowGuarding = (ev.type == "hotkeydown");
            updateAdditionalHighlight();
        }
        else if (ev.hotkey == "session.highlightguarded")
        {
            g_ShowGuarded = (ev.type == "hotkeydown");
            updateAdditionalHighlight();
        }

        if (inputState != INPUT_NORMAL && inputState != INPUT_SELECTING)
            clickedEntity = INVALID_ENTITY;

        // State-machine processing:

        switch (inputState)
        {
        case INPUT_NORMAL:
            switch (ev.type)
            {
            case "mousemotion":
                // Highlight the first hovered entity (if any)
                var ent = Engine.PickEntityAtPoint(ev.x, ev.y);
                if (ent != INVALID_ENTITY)
                    g_Selection.setHighlightList([ent]);
                else
                    g_Selection.setHighlightList([]);

                return false;

            case "mousebuttondown":
                if (ev.button == SDL_BUTTON_LEFT)
                {
                    g_DragStart = new Vector2D(ev.x, ev.y);
                    inputState = INPUT_SELECTING;
                    // If a single click occured, reset the clickedEntity.
                    // Also set it if we're double/triple clicking and missed the unit earlier.
                    if (ev.clicks == 1 || clickedEntity == INVALID_ENTITY)
                        clickedEntity = Engine.PickEntityAtPoint(ev.x, ev.y);
                    return true;
                }
                else if (ev.button == SDL_BUTTON_RIGHT)
                {
                    g_DragStart = new Vector2D(ev.x, ev.y);
                    inputState = INPUT_UNIT_POSITION_START;
                }
                break;

            case "hotkeydown":
                    if (ev.hotkey.indexOf("selection.group.") == 0)
                    {
                        let now = Date.now();
                        if (now - doublePressTimer < doublePressTime && ev.hotkey == prevHotkey)
                        {
                            if (ev.hotkey.indexOf("selection.group.select.") == 0)
                            {
                                var sptr = ev.hotkey.split(".");
                                performGroup("snap", sptr[3]);
                            }
                        }
                        else
                        {
                            var sptr = ev.hotkey.split(".");
                            performGroup(sptr[2], sptr[3]);

                            doublePressTimer = now;
                            prevHotkey = ev.hotkey;
                        }
                    }
                    break;
            }
            break;

        case INPUT_PRESELECTEDACTION:
            switch (ev.type)
            {
            case "mousemotion":
                // Highlight the first hovered entity (if any)
                var ent = Engine.PickEntityAtPoint(ev.x, ev.y);
                if (ent != INVALID_ENTITY)
                    g_Selection.setHighlightList([ent]);
                else
                    g_Selection.setHighlightList([]);

                return false;

            case "mousebuttondown":
                if (ev.button == SDL_BUTTON_LEFT && preSelectedAction != ACTION_NONE)
                {
                    var action = determineAction(ev.x, ev.y);
                    if (!action)
                        break;
                    if (!Engine.HotkeyIsPressed("session.queue"))
                    {
                        preSelectedAction = ACTION_NONE;
                        inputState = INPUT_NORMAL;
                    }
                    return doAction(action, ev);
                }
                else if (ev.button == SDL_BUTTON_RIGHT && preSelectedAction != ACTION_NONE)
                {
                    preSelectedAction = ACTION_NONE;
                    inputState = INPUT_NORMAL;
                    break;
                }
                // else
            default:
                // Slight hack: If selection is empty, reset the input state
                if (g_Selection.toList().length == 0)
                {
                    preSelectedAction = ACTION_NONE;
                    inputState = INPUT_NORMAL;
                    break;
                }
            }
            break;

        case INPUT_SELECTING:
            switch (ev.type)
            {
            case "mousemotion":
                // If the mouse moved further than a limit, switch to bandbox mode
                if (g_DragStart.distanceTo(ev) >= g_MaxDragDelta)
                {
                    inputState = INPUT_BANDBOXING;
                    return false;
                }

                var ent = Engine.PickEntityAtPoint(ev.x, ev.y);
                if (ent != INVALID_ENTITY)
                    g_Selection.setHighlightList([ent]);
                else
                    g_Selection.setHighlightList([]);
                return false;

            case "mousebuttonup":
                if (ev.button == SDL_BUTTON_LEFT)
                {
                    if (clickedEntity == INVALID_ENTITY)
                        clickedEntity = Engine.PickEntityAtPoint(ev.x, ev.y);
                    // Abort if we didn't click on an entity or if the entity was removed before the mousebuttonup event.
                    if (clickedEntity == INVALID_ENTITY || !GetEntityState(clickedEntity))
                    {
                        clickedEntity = INVALID_ENTITY;
                        if (!Engine.HotkeyIsPressed("selection.add") && !Engine.HotkeyIsPressed("selection.remove"))
                        {
                            g_Selection.reset();
                            resetIdleUnit();
                        }
                        inputState = INPUT_NORMAL;
                        return true;
                    }

                    // If camera following and we select different unit, stop
                    if (Engine.GetFollowedEntity() != clickedEntity)
                        Engine.CameraFollow(0);

                    var ents = [];
                    if (ev.clicks == 1)
                        ents = [clickedEntity];
                    else
                    {
                        // Double click or triple click has occurred
                        var showOffscreen = Engine.HotkeyIsPressed("selection.offscreen");
                        var matchRank = true;
                        var templateToMatch;

                        // Check for double click or triple click
                        if (ev.clicks == 2)
                        {
                            // Select similar units regardless of rank
                            templateToMatch = GetEntityState(clickedEntity).identity.selectionGroupName;
                            if (templateToMatch)
                                matchRank = false;
                            else
                                // No selection group name defined, so fall back to exact match
                                templateToMatch = GetEntityState(clickedEntity).template;

                        }
                        else
                            // Triple click
                            // Select units matching exact template name (same rank)
                            templateToMatch = GetEntityState(clickedEntity).template;

                        // TODO: Should we handle "control all units" here as well?
                        ents = Engine.PickSimilarPlayerEntities(templateToMatch, showOffscreen, matchRank, false);
                    }

                    // Update the list of selected units
                    if (Engine.HotkeyIsPressed("selection.add"))
                        g_Selection.addList(ents);
                    else if (Engine.HotkeyIsPressed("selection.remove"))
                        g_Selection.removeList(ents);
                    else
                    {
                        g_Selection.reset();
                        g_Selection.addList(ents);
                    }

                    inputState = INPUT_NORMAL;
                    return true;
                }
                break;
            }
            break;

        case INPUT_UNIT_POSITION_START:
            switch (ev.type)
            {
            case "mousemotion":
                // If the mouse moved further than a limit, switch to unit position mode
                if (g_DragStart.distanceToSquared(ev) >= Math.square(g_MaxDragDelta))
                {
                    inputState = INPUT_UNIT_POSITION;
                    return false;
                }
                break;
            case "mousebuttonup":
                inputState = INPUT_NORMAL;
                if (ev.button == SDL_BUTTON_RIGHT)
                {
                    let action = determineAction(ev.x, ev.y);
                    if (action)
                        return doAction(action, ev);
                }
                break;
            }
            break;

        case INPUT_BUILDING_PLACEMENT:
            switch (ev.type)
            {
            case "mousemotion":

                placementSupport.position = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);

                if (placementSupport.mode === "wall")
                {
                    // Including only the on-screen towers in the next snap candidate list is sufficient here, since the user is
                    // still selecting a starting point (which must necessarily be on-screen). (The update of the snap entities
                    // itself happens in the call to updateBuildingPlacementPreview below).
                    placementSupport.wallSnapEntitiesIncludeOffscreen = false;
                    updateBuildingPlacementPreview();
                }
                else
                {
                    // cancel if not enough resources
                    if (placementSupport.template && Engine.GuiInterfaceCall("GetNeededResources", { "cost": GetTemplateData(placementSupport.template).cost }))
                    {
                        placementSupport.Reset();
                        inputState = INPUT_NORMAL;
                        return true;
                    }
                    var snapToEdge = !Engine.HotkeyIsPressed("autociv.session.snaptoedgeOff") &&
                        Engine.ConfigDB_GetValue("user", "autociv.session.snaptoedge.enabled") === "true";
                    var snapData = Engine.GuiInterfaceCall("GetFoundationSnapData", {
                        "template": placementSupport.template,
                        "x": placementSupport.position.x,
                        "z": placementSupport.position.z,
                        "snapToEdgeEntities": snapToEdge && Engine.PickPlayerEntitiesOnScreen(g_ViewedPlayer)
                    });
                    if (snapData)
                    {
                        placementSupport.angle = snapData.angle;
                        placementSupport.position.x = snapData.x;
                        placementSupport.position.z = snapData.z;
                    }

                    // If snap position can't place use mouse position
                    let success = updateBuildingPlacementPreview();
                    if (!success && snapToEdge)
                    {
                        placementSupport.position = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);
                        updateBuildingPlacementPreview();
                    }
                }

                return false; // continue processing mouse motion

            case "mousebuttondown":
                if (ev.button == SDL_BUTTON_LEFT)
                {
                    if (placementSupport.mode === "wall")
                    {
                        var validPlacement = updateBuildingPlacementPreview();
                        if (validPlacement !== false)
                            inputState = INPUT_BUILDING_WALL_CLICK;
                    }
                    else
                    {
                        placementSupport.position = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);

                        var snapToEdge = !Engine.HotkeyIsPressed("autociv.session.snaptoedgeOff") &&
                            Engine.ConfigDB_GetValue("user", "autociv.session.snaptoedge.enabled") === "true";
                        if (snapToEdge)
                        {
                            var snapData = Engine.GuiInterfaceCall("GetFoundationSnapData", {
                                "template": placementSupport.template,
                                "x": placementSupport.position.x,
                                "z": placementSupport.position.z,
                                "snapToEdgeEntities": Engine.PickPlayerEntitiesOnScreen(g_ViewedPlayer)
                            });
                            if (snapData)
                            {
                                placementSupport.angle = snapData.angle;
                                placementSupport.position.x = snapData.x;
                                placementSupport.position.z = snapData.z;
                            }
                        }

                        // If snap position can't place use mouse position
                        let success = updateBuildingPlacementPreview();
                        if (!success && snapToEdge)
                        {
                            placementSupport.position = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);
                            updateBuildingPlacementPreview();
                        }

                        g_DragStart = new Vector2D(ev.x, ev.y);
                        inputState = INPUT_BUILDING_CLICK;
                    }
                    return true;
                }
                else if (ev.button == SDL_BUTTON_RIGHT)
                {
                    // Cancel building
                    placementSupport.Reset();
                    inputState = INPUT_NORMAL;
                    return true;
                }
                break;

            case "hotkeydown":

                var rotation_step = Math.PI / 12; // 24 clicks make a full rotation

                switch (ev.hotkey)
                {
                case "session.rotate.cw":
                    placementSupport.angle += rotation_step;
                    updateBuildingPlacementPreview();
                    break;
                case "session.rotate.ccw":
                    placementSupport.angle -= rotation_step;
                    updateBuildingPlacementPreview();
                    break;
                }
                break;

            }
            break;
        }
        return false;
    }
}
