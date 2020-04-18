// All possible "autociv.session.entity." possible entries
var g_autociv_hotkey_entity = {
    "by": function (ev, expression)
    {
        // [["filter1", "param1", "param2"], ["filter2", "param1", ...], ...]
        let filters = expression.split(".by.").map(v => v.split("."));

        let list = Engine.GuiInterfaceCall("GetPlayerEntities");
        for (let [filter, ...parameters] of filters)
        {
            if (filter in g_autociv_hotkey_entity_by_filter)
                list = g_autociv_hotkey_entity_by_filter[filter](ev, list, parameters);
            else
                warn(`Hotkey "${ev.hotkey}" with has invalid filter "${filter}"`);
        }

        g_Selection.reset();
        g_Selection.addList(list);
        return true;
    },
    "select": function (ev, expression)
    {
        let entityGenericName = expression.replace(/_/g, " ");
        autociv_select.entityWithGenericName(entityGenericName);
        return true;
    }
};

// All possible "autociv.session.entity.by." possible entries
var g_autociv_hotkey_entity_by_filter = {
    "health": function (ev, list, parameters)
    {
        switch (parameters[0])
        {
            case "wounded":
                return list.filter(unitFilters.isWounded);
            case "nowounded":
                return list.filter(unitFilters.autociv_isNotWounded);
            default:
                error(`Invalid hotkey "${ev.hotkey}" for by.health. parameter "${parameters[0]}"`);
                return list;
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
                });
            default:
                error(`Invalid hotkey "${ev.hotkey}" for by.class. parameter "${parameters[0]}"`);
                return list;
        }
    }
};
