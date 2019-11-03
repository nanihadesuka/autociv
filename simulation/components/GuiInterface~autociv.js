if (!GuiInterface.prototype.Init)
    GuiInterface.prototype.Init = function () { };


patchApplyN(GuiInterface.prototype, "Init", function (target, that, args)
{
    that.autociv_corpse = {
        "entities": new Set(),
        "max": Infinity
    };
    return target.apply(that, args);
})

GuiInterface.prototype.autociv_CorpseUpdate = function ()
{
    for (let entity of this.autociv_corpse.entities)
    {
        if (this.autociv_corpse.entities.size <= this.autociv_corpse.max)
            break;
        this.autociv_corpse.entities.delete(entity);
        Engine.DestroyEntity(entity)
    }
}

GuiInterface.prototype.autociv_CorpseAdd = function (entity)
{
    if (!entity ||
        entity == INVALID_ENTITY ||
        this.autociv_corpse.max == Infinity)
        return;

    this.autociv_corpse.entities.add(entity);
    this.autociv_CorpseUpdate();
}

GuiInterface.prototype.autociv_SetCorpsesMax = function (player, max = Infinity)
{
    let value = +max;
    if (value === Infinity)
    {
        this.autociv_corpse.entities.clear();
        this.autociv_corpse.max = Infinity;
        return;
    }

    value = parseInt(value);
    if (!Number.isInteger(value) || value < 0)
    {
        warn("Invalid max corpses value " + max);
        return;
    }

    this.autociv_corpse.max = value;
    this.autociv_CorpseUpdate();
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
        warn("INVALID HOTKEY CLASS EXPRESSION: " + classesExpression + "  Only allowed operators are: & ! | ( )");
        return [];
    }
    // Test expression is well defined (doesn't throw errors)
    try { !!Function("return " + testExpression)() }
    catch (err)
    {
        warn("INVALID HOTKEY CLASS EXPRESSION: " + classesExpression + " Expression wrongly defined")
        return [];
    }

    let rangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    return rangeManager.GetEntitiesByPlayer(player).filter(e =>
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

patchApplyN(GuiInterface.prototype, "ScriptCall", function (target, that, args)
{
    let [player, name, vargs] = args;
    return name in autociv_exposedFunctions ? that[name](player, vargs) :
        target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);
