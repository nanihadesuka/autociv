function autociv_SetCorpsesMax(value)
{
    Engine.GuiInterfaceCall("autociv_SetCorpsesMax", value);
}

function autociv_SetAutotrain(active, entities = g_Selection.toList())
{
    Engine.GuiInterfaceCall("autociv_SetAutotrain", {
        "active": active,
        "entities": entities
    });
}

function autociv_SetStatusBar_showNumberOfGatherers(show)
{
    Engine.GuiInterfaceCall("autociv_SetStatusBar_showNumberOfGatherers", show);
    recalculateStatusBarDisplay(show)
}

function autociv_D2079_8905_LoadSnappingEdges()
{
    autociv_input_D2079_8905_LoadSnappingEdges();
    Engine.GuiInterfaceCall("autociv_D2079_8905_LoadSnappingEdges");
}
