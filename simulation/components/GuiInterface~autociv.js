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

/**
 * @param {String} expression
 * @returns {Function} function that evaluates if the input array matches with the expression
 */
GuiInterface.prototype.autociv_getExpressionEvaluator = function (expression)
{
    // /([^&!|()]+)/g  regex matches anything that is not a boolean operator
    const genExpression = list =>
        expression.replace(/([^&!|()]+)/g, match =>
            list.indexOf(match) == -1 ? "0" : "1")

    // Test if expression is a valid expression ([] as dummy data)
    const testExpression = genExpression([]);
    // /^[01&!|()]+$/ regex matches only 0 1 and boolean operators
    if (!/^[01&!|()]+$/.test(testExpression))
    {
        // Known pitfall:
        // & and && ( | and || ) are equivalent for 1 bit operations.
        // Use & and | or && and || but do not mix both in the same expression.
        warn(`INVALID EXPRESSION: "${expression}" Only allowed operators are: & ! | ( )`);
        return;
    }

    // Test expression is well defined (doesn't throw errors)
    try { !!Function("return " + testExpression)() }
    catch (err)
    {
        warn(`INVALID EXPRESSION: "${expression}" Expression wrongly defined`);
        return;
    }
    return genExpression;
};

/**
 * @param {Object} data
 * @param {String} settings.classesExpression
 * @param {Number[]} [settings.list] Initial list of entities to search from
 */
GuiInterface.prototype.autociv_FindEntitiesWithClassesExpression = function (player, data)
{
    const evalExpression = this.autociv_getExpressionEvaluator(data.classesExpression);
    if (!evalExpression)
        return [];

    let rangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    let entities = data.list || rangeManager.GetEntitiesByPlayer(player);

    return entities.filter(e =>
    {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.IsGarrisoned() : true) &&
            !!Function("return " + evalExpression(cmpIdentity.GetClassesList()))();
    });
};


// Revision https://code.wildfiregames.com/D2079?id=8905
// ONLY MEANT FOR 23b
GuiInterface.prototype.autociv_D2079_8905_LoadSnappingEdges = function ()
{
    if (this.autociv_D2079_8905_LoadSnappingEdges_loaded)
        return;
    this.autociv_D2079_8905_LoadSnappingEdges_loaded = true;

    // ################################################
    // binaries/data/mods/public/simulation/components/GuiInterface.js
    GuiInterface.prototype.GetFoundationSnapData = function (player, data)
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

        if (data.snapToEdgeEntities && template.Obstruction && template.Obstruction.Static)
        {
            let width = template.Obstruction.Static["@depth"] / 2;
            let depth = template.Obstruction.Static["@width"] / 2;
            const maxSide = Math.max(width, depth);
            let templatePos = new Vector2D(data.x, data.z);
            let templateAngle = data.angle ? data.angle : 0.0;

            // Get edges of all entities together.
            let allEdges = [];
            for (let ent of data.snapToEdgeEntities)
                allEdges = allEdges.concat(GetObstructionEdges(ent));
            const minimalDistanceToSnap = 5.0;
            const getValidEdges = (allEdges, position) =>
            {
                let edges = [];
                for (let edge of allEdges)
                {
                    let signedDistance = edge.normal.dot(position) - edge.normal.dot(edge.begin);
                    // Negative signed distance means that the template position
                    // is lying behind the edge.
                    if (signedDistance < -minimalDistanceToSnap - maxSide ||
                        signedDistance > minimalDistanceToSnap + maxSide)
                        continue;
                    let dir1 = edge.begin.clone().sub(edge.end).normalize();
                    let dir2 = new Vector2D(-dir1.x, -dir1.y);
                    let offsetDistance = Math.max(
                        dir1.dot(position) - dir1.dot(edge.begin),
                        dir2.dot(position) - dir2.dot(edge.end)
                    );
                    if (offsetDistance > minimalDistanceToSnap + maxSide)
                        continue;
                    // If a projection of the template position on the edge is
                    // lying inside the edge then obviously we don't need to
                    // account the offset distance.
                    if (offsetDistance < 0.0)
                        offsetDistance = 0.0;
                    edge.signedDistance = signedDistance;
                    edge.offsetDistance = offsetDistance;
                    edges.push(edge);
                }
                return edges;
            }

            let edges = getValidEdges(allEdges, templatePos);
            if (edges.length)
            {
                // Pick a base edge, it will be the first axis and fix the angle.
                // We can't just pick an edge by signed distance, because we might have
                // a case when one segment is closer by signed distance than another
                // one but much farther by actual (euclid) distance.
                const compare = (a, b) =>
                {
                    const EPS = 1e-3;
                    const behindA = a.signedDistance < -EPS;
                    const behindB = b.signedDistance < -EPS;
                    const scoreA = Math.abs(a.signedDistance) + a.offsetDistance;
                    const scoreB = Math.abs(b.signedDistance) + b.offsetDistance;
                    if (Math.abs(scoreA - scoreB) < EPS)
                    {
                        if (behindA != behindB)
                            return behindA - behindB;
                        if (!behindA)
                            return a.offsetDistance - b.offsetDistance;
                        else
                            return -a.signedDistance - -b.signedDistance;
                    }
                    return scoreA - scoreB;
                };

                let baseEdge = edges[0];
                for (let edge of edges)
                    if (compare(edge, baseEdge) < 0.0)
                        baseEdge = edge;
                // Now we have the normal, we need to determine an angle,
                // which side will be snapped first.
                for (let dir = 0; dir < 4; ++dir)
                {
                    const EPS = 1e-3;
                    const angleCandidate = baseEdge.angle + dir * Math.PI / 2.0;
                    // We need to find a minimal angle difference.
                    let difference = Math.abs(angleCandidate - templateAngle);
                    difference = Math.min(difference, Math.PI * 2.0 - difference);
                    if (difference < Math.PI / 4.0 + EPS)
                    {
                        // We need to swap sides for orthogonal cases.
                        if (dir % 2 == 0)
                            [width, depth] = [depth, width];
                        templateAngle = angleCandidate;
                        break;
                    }
                }

                // We need a small padding to avoid unnecessary collisions
                // because of loss of accuracy.
                const getPadding = (edge) =>
                {
                    const snapPadding = 0.05;
                    // We don't need to padding for edges with normals directed inside
                    // its entity, as we try to snap from an internal side of the edge.
                    return edge.order == 'ccw' ? 0.0 : snapPadding;
                };

                let distance = baseEdge.normal.dot(templatePos) - baseEdge.normal.dot(baseEdge.begin);
                templatePos.sub(Vector2D.mult(baseEdge.normal, distance - width - getPadding(baseEdge)));
                edges = getValidEdges(allEdges, templatePos);
                if (edges.length > 1)
                {
                    let pairedEdges = [];
                    for (let edge of edges)
                    {
                        const EPS = 1e-3;
                        // We have to place a rectangle, so the angle between
                        // edges should be 90 degrees.
                        if (Math.abs(baseEdge.normal.dot(edge.normal)) > EPS)
                            continue;
                        let newEdge = {
                            'begin': edge.end,
                            'end': edge.begin,
                            'normal': new Vector2D(-edge.normal.x, -edge.normal.y),
                            'signedDistance': -edge.signedDistance,
                            'offsetDistance': edge.offsetDistance,
                            'order': 'ccw',
                        };
                        pairedEdges.push(edge);
                        pairedEdges.push(newEdge);
                    }
                    pairedEdges.sort(compare);
                    if (pairedEdges.length)
                    {
                        let secondEdge = pairedEdges[0];
                        for (let edge of pairedEdges)
                            if (compare(edge, secondEdge) < 0.0)
                                secondEdge = edge;
                        let distance = secondEdge.normal.dot(templatePos) - secondEdge.normal.dot(secondEdge.begin);
                        templatePos.sub(Vector2D.mult(secondEdge.normal, distance - depth - getPadding(secondEdge)));
                    }
                }
                return {
                    "x": templatePos.x,
                    "z": templatePos.y,
                    "angle": templateAngle
                };
            }
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

// Original variable declaration is prefixed with let instead of var so we can't
// just add new entries directly (global let declaration rules)
var autociv_exposedFunctions = {
    "autociv_SetAutotrain": 1,
    "autociv_FindEntitiesWithGenericName": 1,
    "autociv_FindEntitiesWithClasses": 1,
    "autociv_FindEntitiesWithClassesExpression": 1,
    "autociv_getExpressionEvaluator": 1,
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
