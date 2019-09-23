GuiInterface.prototype.autociv_SetAutotrain = function (player, data)
{
    for (let ent of data.entities)
    {
        let cmpProductionQueue = Engine.QueryInterface(ent, IID_ProductionQueue);
        if (cmpProductionQueue)
            cmpProductionQueue.autociv_SetAutotrain(data.active);
    }
};

GuiInterface.prototype.autociv_FindEntitiesByGenericName = function (player, genericName)
{
    let rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    return rangeMan.GetEntitiesByPlayer(player).filter(function (e)
    {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.IsGarrisoned() : true) &&
            cmpIdentity.GetGenericName() == genericName;
    });
};

let autociv_exposedFunctions = {
    "autociv_SetAutotrain": 1,
    "autociv_FindEntitiesByGenericName": 1
};

// Adding a new key to the exposedFunctions object doesn't work,
// must patch the original function

GuiInterface.prototype.ScriptCall = (function (originalFunction)
{
    return function (player, name, args)
    {
        if (autociv_exposedFunctions[name])
            return this[name](player, args);

        return originalFunction.apply(this, arguments);
    }
})(GuiInterface.prototype.ScriptCall);
