if (!GuiInterface.prototype.Init)
    GuiInterface.prototype.Init = function () { };


autociv_patchApplyN(GuiInterface.prototype, "Init", function (target, that, args)
{
    that.autociv = {
        corpse: {
            "entities": new Set(),
            "max": Infinity
        },
        StatusBar: {
            "showNumberOfGatherers": false,
        }
    };
    return target.apply(that, args);
})

GuiInterface.prototype.autociv_SetStatusBar_showNumberOfGatherers = function (player, show)
{
    this.autociv.StatusBar.showNumberOfGatherers = !!show;
}

GuiInterface.prototype.autociv_CorpseUpdate = function ()
{
    for (let entity of this.autociv.corpse.entities)
    {
        if (this.autociv.corpse.entities.size <= this.autociv.corpse.max)
            break;
        this.autociv.corpse.entities.delete(entity);
        Engine.DestroyEntity(entity)
    }
}

GuiInterface.prototype.autociv_CorpseAdd = function (entity)
{
    if (!entity ||
        entity == INVALID_ENTITY ||
        this.autociv.corpse.max == Infinity)
        return;

    this.autociv.corpse.entities.add(entity);
    this.autociv_CorpseUpdate();
}

GuiInterface.prototype.autociv_SetCorpsesMax = function (player, max = Infinity)
{
    let value = +max;
    if (value === Infinity)
    {
        this.autociv.corpse.entities.clear();
        this.autociv.corpse.max = Infinity;
        return;
    }

    value = parseInt(value);
    if (!Number.isInteger(value) || value < 0)
    {
        warn("Invalid max corpses value " + max);
        return;
    }

    this.autociv.corpse.max = value;
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
    let includesAll = list => classesList.every(v => list.indexOf(v) != -1);

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


// Revision https://code.wildfiregames.com/D2079?id=8905
// ONLY MEANT FOR 23b
GuiInterface.prototype.autociv_D2079_8905_LoadSnappingEdges = function ()
{
    // ################################################
    // binaries/data/mods/public/simulation/components/GuiInterface.js
    GuiInterface.prototype.GetFoundationSnapData = function(player, data)
    {
        let template = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager).GetTemplate(data.template);
        if (!template)
        {
            warn("[GetFoundationSnapData] Failed to load template '" + data.template + "'");
            return false;
        }

        if (data.snapEntities && data.snapRadius && data.snapRadius > 0)
        {
            // see if {data.x, data.z} is inside the snap radius of any of the snap entities; and if so, to which it is closest
            // (TODO: break unlikely ties by choosing the lowest entity ID)

            let minDist2 = -1;
            let minDistEntitySnapData = null;
            let radius2 = data.snapRadius * data.snapRadius;

            for (let ent of data.snapEntities)
            {
                let cmpPosition = Engine.QueryInterface(ent, IID_Position);
                if (!cmpPosition || !cmpPosition.IsInWorld())
                    continue;

                let pos = cmpPosition.GetPosition();
                let dist2 = (data.x - pos.x) * (data.x - pos.x) + (data.z - pos.z) * (data.z - pos.z);
                if (dist2 > radius2)
                    continue;

                if (minDist2 < 0 || dist2 < minDist2)
                {
                    minDist2 = dist2;
                    minDistEntitySnapData = {
                            "x": pos.x,
                            "z": pos.z,
                            "angle": cmpPosition.GetRotation().y,
                            "ent": ent
                    };
                }
            }

            if (minDistEntitySnapData != null)
                return minDistEntitySnapData;
        }

        if (template.BuildRestrictions.PlacementType == "shore")
        {
            let angle = GetDockAngle(template, data.x, data.z);
            if (angle !== undefined)
                return {
                    "x": data.x,
                    "z": data.z,
                    "angle": angle
                };
        }

        return false;
    };

    Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);

    // ################################################
    // binaries/data/mods/public/simulation/helpers/Placement.js
    function GetObstructionEdges(entity)
    {
        let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
        let template = cmpTemplateManager.GetTemplate(cmpTemplateManager.GetCurrentTemplateName(entity));
        if (!template || !template.Obstruction || !template.Obstruction.Static)
            return [];
        let cmpPosition = Engine.QueryInterface(entity, IID_Position);
        if (!cmpPosition)
            return [];

        let halfWidth = template.Obstruction.Static["@width"] / 2;
        let halfDepth = template.Obstruction.Static["@depth"] / 2;

        // All corners of a foundation in clockwise order.
        let corners = [
            new Vector2D(-halfWidth, -halfDepth),
            new Vector2D(-halfWidth, halfDepth),
            new Vector2D(halfWidth, halfDepth),
            new Vector2D(halfWidth, -halfDepth)
        ];

        let angle = cmpPosition.GetRotation().y;
        for (let i = 0; i < 4; ++i)
            corners[i].rotate(angle).add(cmpPosition.GetPosition2D());

        let edges = [];
        for (let i = 0; i < 4; ++i)
            edges.push({
                'entity': entity,
                'begin': corners[i],
                'end': corners[(i + 1) % 4],
                'angle': angle,
                'normal': corners[(i + 1) % 4].clone().sub(corners[i]).perpendicular().normalize(),
                'order': 'cw',
            });
        return edges;
    }

    Engine.RegisterGlobal("GetObstructionEdges", GetObstructionEdges);
};

// Adding a new key to the exposedFunctions object doesn't work,
// must patch the original function
let autociv_exposedFunctions = {
    "autociv_SetAutotrain": 1,
    "autociv_FindEntitiesWithGenericName": 1,
    "autociv_FindEntitiesWithClasses": 1,
    "autociv_FindEntitiesWithClassesExpression": 1,
    "autociv_SetCorpsesMax": 1,
    "autociv_SetStatusBar_showNumberOfGatherers": 1,
    "autociv_D2079_8905_LoadSnappingEdges": 1,
};

autociv_patchApplyN(GuiInterface.prototype, "ScriptCall", function (target, that, args)
{
    let [player, name, vargs] = args;
    if (name in autociv_exposedFunctions)
        return that[name](player, vargs);

    return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);
