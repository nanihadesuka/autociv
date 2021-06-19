function autociv_SetCorpsesMax(value)
{
    Engine.GuiInterfaceCall("autociv_SetCorpsesMax", value);
}

function autociv_SetAutotrain(active, entities = g_Selection.toList())
{
    // TODO: USE NEW NATIVE "AUTOQUEUE"
}
