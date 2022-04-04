// All possible "autociv.session.entity." possible entries
var g_autociv_hotkey_entity = {
    "by": function (ev, expression)
    {
        if (this.by.rate.rate(expression))
            return

        // "filter1.parameter1.parameter2.by.filter2.parameter1" ... =>
        // [["filter1", "parameter1", "parameter2"], ["filter2", "parameter1", ...], ...]
        const filters = expression.split(".by.").map(v => v.split("."))

        let list = Engine.GuiInterfaceCall("GetPlayerEntities")
        for (let [filter, ...parameters] of filters)
        {
            if (filter in g_autociv_hotkey_entity_by_filter)
                list = g_autociv_hotkey_entity_by_filter[filter](ev, list, parameters)
            else
                warn(`Hotkey "${ev.hotkey}" has invalid filter "${filter}"`)
        }
        g_Selection.reset()
        g_Selection.addList(list)
        return true
    },
    "select": function (ev, templateName)
    {
        autociv_select.entityWithTemplateName(templateName)
        return true
    }
}

// Time rate "by" function, given is expensive
g_autociv_hotkey_entity.by.rate = {
    "interval": 1000 * 1000,
    "last": {
        "time": Engine.GetMicroseconds(),
        "input": ""
    },
    "rate": function (input)
    {
        if (Engine.GetMicroseconds() - this.last.time < this.interval && this.last.input == input)
            return true

        this.last.time = Engine.GetMicroseconds()
        this.last.input = input
    }
}

// All possible "autociv.session.entity.by." possible entries
var g_autociv_hotkey_entity_by_filter = {
    "health": function (ev, list, parameters)
    {
        switch (parameters[0])
        {
            case "wounded":
                return list.filter(unitFilters.isWounded)
            case "nowounded":
                return list.filter(unitFilters.autociv_isNotWounded)
            default:
                error(`Invalid hotkey "${ev.hotkey}" for by.health. parameter "${parameters[0]}"`)
                return list
        }
    },
    "class": function (ev, list, parameters)
    {
        switch (parameters[0])
        {
            case "select":
                return Engine.GuiInterfaceCall("autociv_FindEntitiesWithClassesExpression", {
                    "classesExpression": parameters[1].replace("_", " "),
                    "list": list
                })
            default:
                error(`Invalid hotkey "${ev.hotkey}" for by.class. parameter "${parameters[0]}"`)
                return list
        }
    },
    "rank": function (ev, list, parameters)
    {
        let expression = parameters[0]
        for (let [id, rank] of [[1, "Basic"], [2, "Advanced"], [3, "Elite"]])
            expression = expression.replace(id, rank)

        const evalExpression = autociv_getExpressionEvaluator(expression)
        if (!evalExpression)
        {
            error(`Invalid hotkey "${ev.hotkey}" for by.rank. parameter "${parameters[0]}"`)
            return list
        }

        return list.filter(entity =>
        {
            const entityState = GetEntityState(entity)
            return entityState?.identity && evalExpression([entityState.identity.rank])
        })
    },
    "group": function (ev, list, parameters)
    {
        const expression = parameters[0]
        switch (expression)
        {
            case "none": {
                const entitiesNotGrouped = new Set(list)
                for (let group of g_Groups.groups)
                    for (let entity in group.ents)
                        entitiesNotGrouped.delete(+entity)

                return Array.from(entitiesNotGrouped)
            }
            default:
                error(`Invalid hotkey "${ev.hotkey}" for by.group. parameter "${expression}"`)
                return list
        }
    },
    "state": function (ev, list, parameters)
    {
        const expression = parameters[0].replace("idle", "INDIVIDUAL.IDLE")
        const evalExpression = autociv_getExpressionEvaluator(expression)
        if (!evalExpression)
        {
            error(`Invalid hotkey "${ev.hotkey}" for by.state. parameter "${parameters[0]}"`)
            return list
        }

        return list.filter(entity =>
        {
            const state = GetEntityState(entity)
            return state?.unitAI && evalExpression([state.unitAI.state])
        })
    },
    "screen" : function (ev, list, parameters)
    {
        const expression = parameters[0]
        const entitiesOnScreen = new Set(Engine.PickPlayerEntitiesOnScreen())
        switch(expression){
            case "yes": {
                return list.filter(entity => entitiesOnScreen.has(entity))
            }
            case "no" : {
                return list.filter(entity => !entitiesOnScreen.has(entity))
            }
            default: {
                error(`Invalid hotkey "${ev.hotkey}" for by.group. parameter "${expression}". Only "yes" or "no" are valid.`)
                return list
            }
        }
    }
}


/**
 * COPY&PASTE FROM GUI INTERFACE DUE IMPOSSIBILITY TO PASS FUNCTIONS
 * @param {String} expression
 * @returns {Function} function that evaluates if the input array matches with the expression
 */
function autociv_getExpressionEvaluator(expression)
{
    // /([^&!|()]+)/g  regex matches anything that is not a boolean operator
    const genExpression = list =>
        expression.replace(/([^&!|()]+)/g, match =>
            list.indexOf(match) == -1 ? "0" : "1")

    // Test if expression is a valid expression ([] as dummy data)
    const testExpression = genExpression([])
    // /^[01&!|()]+$/ regex matches only 0 1 and boolean operators
    if (!/^[01&!|()]+$/.test(testExpression))
    {
        // Known pitfall:
        // & and && ( | and || ) are equivalent for 1 bit operations.
        // Use & and | or && and || but do not mix both in the same expression.
        warn(`INVALID EXPRESSION: "${expression}" Only allowed operators are: & ! | ( )`)
        return
    }

    // Test expression is well defined (doesn't throw errors)
    try { !!Function("return " + testExpression)() }
    catch (err)
    {
        warn(`INVALID EXPRESSION: "${expression}" Expression wrongly defined`)
        return
    }

    return list => !!Function("return " + genExpression(list))()
}
