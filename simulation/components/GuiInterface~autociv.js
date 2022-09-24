if (!GuiInterface.prototype.Init)
    GuiInterface.prototype.Init = function () { };


autociv_patchApplyN(GuiInterface.prototype, "Init", function (target, that, args)
{
    that.autociv = {
        corpse: {
            "entities": new Set(),
            "max": Infinity
        },
        setHealersInitialStanceAggressive: true,
    };
    return target.apply(that, args);
})

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

GuiInterface.prototype.autociv_SetCorpsesMax = function (player, max = 200)
{
    let value = +max;
    if (value >= 200)
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

GuiInterface.prototype.autociv_FindEntitiesWithTemplateName = function (player, templateName)
{
    const rangeMan = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
    const cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
    return rangeMan.GetEntitiesByPlayer(player).filter(function (e)
    {
        let cmpIdentity = Engine.QueryInterface(e, IID_Identity);
        let cmpUnitAI = Engine.QueryInterface(e, IID_UnitAI);
        let cmpFoundation = Engine.QueryInterface(e, IID_Foundation);
        let cmpMirage = Engine.QueryInterface(e, IID_Mirage);
        return cmpIdentity &&
            !cmpFoundation &&
            !cmpMirage &&
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
            cmpTemplateManager.GetCurrentTemplateName(e).endsWith(templateName);
    });
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
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
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
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
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

    return list => !!Function("return " + genExpression(list))();
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
            (cmpUnitAI ? !cmpUnitAI.isGarrisoned : true) &&
            evalExpression(cmpIdentity.GetClassesList());
    });
};

/**
 * Opimitzed stats function for autociv stats overlay
 */
GuiInterface.prototype.autociv_GetStatsOverlay = function ()
{
    const ret = {
        "players": []
    };

    const cmpPlayerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
    const numPlayers = cmpPlayerManager.GetNumPlayers();
    for (let player = 0; player < numPlayers; ++player)
    {
        const playerEnt = cmpPlayerManager.GetPlayerByID(player);
        const cmpPlayer = Engine.QueryInterface(playerEnt, IID_Player);
   		const cmpIdentity = Engine.QueryInterface(playerEnt, IID_Identity);

        // Work out which phase we are in.
        let phase = 0;
		const cmpTechnologyManager = Engine.QueryInterface(playerEnt, IID_TechnologyManager);
        if (cmpTechnologyManager)
        {
            if (cmpTechnologyManager.IsTechnologyResearched("phase_city"))
                phase = 3;
            else if (cmpTechnologyManager.IsTechnologyResearched("phase_town"))
                phase = 2;
            else if (cmpTechnologyManager.IsTechnologyResearched("phase_village"))
                phase = 1;
        }

        const cmpPlayerStatisticsTracker = QueryPlayerIDInterface(player, IID_StatisticsTracker);
        const classCounts = cmpTechnologyManager?.GetClassCounts()

        ret.players.push({
            "name": cmpIdentity.GetName(),
            "popCount": cmpPlayer.GetPopulationCount(),
            "resourceCounts": cmpPlayer.GetResourceCounts(),
            "state": cmpPlayer.GetState(),
            "team": cmpPlayer.GetTeam(),
            "hasSharedLos": cmpPlayer.HasSharedLos(),
            "phase": phase,
            "researchedTechsCount": cmpTechnologyManager?.GetResearchedTechs().size ?? 0,
            "classCounts_Support": classCounts?.Support ?? 0,
            "classCounts_Infantry": classCounts?.Infantry ?? 0,
            "classCounts_Cavalry": classCounts?.Cavalry ?? 0,
            "classCounts_Seige": (classCounts?.Siege ?? 0),
            "classCounts_Champion": (classCounts?.Champion ?? 0),
            "enemyUnitsKilledTotal": cmpPlayerStatisticsTracker?.enemyUnitsKilled.total ?? 0
        });
    }

    return ret;
};

GuiInterface.prototype.autociv_setHealersInitialStanceAggressive = function (player, active)
{
    this.autociv.setHealersInitialStanceAggressive = active
}

// Original variable declaration is prefixed with let instead of var so we can't
// just add new entries directly (global let declaration rules)
var autociv_exposedFunctions = {
    "autociv_FindEntitiesWithTemplateName": 1,
    "autociv_FindEntitiesWithGenericName": 1,
    "autociv_FindEntitiesWithClasses": 1,
    "autociv_FindEntitiesWithClassesExpression": 1,
    "autociv_SetCorpsesMax": 1,
    "autociv_GetStatsOverlay": 1,
    "autociv_setHealersInitialStanceAggressive": 1
};

autociv_patchApplyN(GuiInterface.prototype, "ScriptCall", function (target, that, args)
{
    let [player, name, vargs] = args;
    if (name in autociv_exposedFunctions)
        return that[name](player, vargs);

    return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);
