if (StatusBars.prototype.Sprites.indexOf("_autociv_NumberOfGatherers") == -1)
    StatusBars.prototype.Sprites.push("_autociv_NumberOfGatherers");

if (!StatusBars.prototype.OnResourceSupplyNumGatherersChanged)
    StatusBars.prototype.OnResourceSupplyNumGatherersChanged = function (msg)
    {
        if (this.enabled)
            this.RegenerateSprites();
    };

StatusBars.prototype.Add_autociv_NumberOfGatherers = function (cmpOverlayRenderer, yoffset)
{
    let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
    if (!cmpGUIInterface.autociv.StatusBar.showNumberOfGatherers)
        return 0;

    if (!this.enabled)
        return 0;

    let cmpResourceSupply = Engine.QueryInterface(this.entity, IID_ResourceSupply);
    if (!cmpResourceSupply || cmpResourceSupply.GetMaxGatherers() == 0)
        return 0;

    return this.AddBar(cmpOverlayRenderer, yoffset, "upgrade", cmpResourceSupply.GetNumGatherers() / cmpResourceSupply.GetMaxGatherers());
};

Engine.ReRegisterComponentType(IID_StatusBars, "StatusBars", StatusBars);
