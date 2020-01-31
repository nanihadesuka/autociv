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
