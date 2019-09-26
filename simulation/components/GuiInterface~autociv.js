GuiInterface.prototype.autociv_SetAutotrain = function (player, data)
{
    for (let ent of data.entities)
    {
        let cmpProductionQueue = Engine.QueryInterface(ent, IID_ProductionQueue);
        if (cmpProductionQueue)
            cmpProductionQueue.autociv_SetAutotrain(data.active);
    }
};

GuiInterface.prototype.autociv_FindEntitiesWithGenericName = function (player, genericName)
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

GuiInterface.prototype.autociv_FindEntitiesWithClasses = function (player, classesList)
{
    let rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    let includes = list => classesList.every(v => list.indexOf(v) != -1);

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
            includes(cmpIdentity.GetClassesList());
    });
};
GuiInterface.prototype.autociv_FindEntitiesWithClassesExpression = function (player, classesExpression)
{
    const genExpression = classesList =>
        classesExpression.replace(/([\w ]+)/g, match =>
            classesList.indexOf(match.replace(/_/g, " ")) == -1 ? "0" : "1")

    // Test classExmpression is valid expression for all cases with dummy data (empty [])
    if (!/^[01&!|()]+$/.test(genExpression([])))
    {
        warn("INVALID HOTKEY EXPRESSION: " + classesExpression + "  Only operators allowed are: & ! | ( )");
        return [];
    }

    let rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);

    return rangeMan.GetEntitiesByPlayer(player).filter(e =>
    {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.IsGarrisoned() : true) &&
            !!Function("return " + genExpression(cmpIdentity.GetClassesList()))();
    });
};

let autociv_exposedFunctions = {
    "autociv_SetAutotrain": 1,
    "autociv_FindEntitiesWithGenericName": 1,
    "autociv_FindEntitiesWithClasses": 1,
    "autociv_FindEntitiesWithClassesExpression": 1
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
