if (!GuiInterface.prototype.Init)
    GuiInterface.prototype.Init = function () { };

GuiInterface.prototype.Init = (function (originalFunction)
{
    return function ()
    {
        this.autociv_corpse = {
            "entities": new Set(),
            "max": Infinity
        };
        return originalFunction.apply(this, arguments);
    }
})(GuiInterface.prototype.Init);


GuiInterface.prototype.autociv_CorpseAdd = function (entity)
{
    if (!entity || (this.autociv_corpse.max === Infinity))
        return;

    let c = this.autociv_corpse;
    c.entities.add(entity);
    if (c.entities.size <= c.max)
        return;

    let iterator = c.entities.values();
    while (c.entities.size > c.max)
    {
        let response = iterator.next();
        if (response.done)
            break;
        c.entities.delete(response.value);
        if (response.value != INVALID_ENTITY)
            Engine.DestroyEntity(response.value)
    }
}

GuiInterface.prototype.autociv_SetCorpsesMax = function (player, max = Infinity)
{
    if (max === Infinity || /Infinity/i.test(max))
    {
        this.autociv_corpse.entities.clear();
        this.autociv_corpse.max = Infinity;
        return;
    }

    let number = parseInt(max);
    if (!Number.isInteger(number) || number < 0)
        return warn("Invalid max corpses value " + max);

    this.autociv_corpse.max = number;
};

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
    let includesAll = list => classesList.every(v => list.includes(v));

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
            includesAll(cmpIdentity.GetClassesList());
    });
};
GuiInterface.prototype.autociv_FindEntitiesWithClassesExpression = function (player, classesExpression)
{
    // /([^&!|()]+)/g  regex matches anything that is not a boolean operator
    const genExpression = classesList =>
        classesExpression.replace(/([^&!|()]+)/g, match =>
            classesList.indexOf(match.replace(/_/g, " ")) == -1 ? "0" : "1")

    // Test if classesExpression is a valid expression ([] as dummy data)
    const testExpression = genExpression([]);
    // /^[01&!|()]+$/ regex matches only 0 1 and boolean operators
    if (!/^[01&!|()]+$/.test(testExpression))
    {
        // Known pitfall:
        // & and && ( | and || ) are equivalent for 1 bit operations.
        // Use & and | or && and || but do not mix both in the same expression.
        warn("INVALID HOTKEY CLASS EXPRESSION: " + classesExpression + "  Only operators allowed are: & ! | ( )");
        return [];
    }
    // Test expression is well defined (doesn't throw errors)
    try { !!Function("return " + testExpression)() }
    catch (err)
    {
        warn("INVALID HOTKEY CLASS EXPRESSION: " + classesExpression + " Expression wrongly defined")
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

// Adding a new key to the exposedFunctions object doesn't work,
// must patch the original function
let autociv_exposedFunctions = {
    "autociv_SetAutotrain": 1,
    "autociv_FindEntitiesWithGenericName": 1,
    "autociv_FindEntitiesWithClasses": 1,
    "autociv_FindEntitiesWithClassesExpression": 1,
    "autociv_SetCorpsesMax": 1
};

GuiInterface.prototype.ScriptCall = (function (originalFunction)
{
    return function (player, name, args)
    {
        return autociv_exposedFunctions[name] ?
            this[name](player, args) :
            originalFunction.apply(this, arguments);
    }
})(GuiInterface.prototype.ScriptCall);


Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);
