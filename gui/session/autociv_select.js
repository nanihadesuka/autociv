var autociv_select = {
    "entityWithGenericName": function (genericName, selectAll, accumulateSelection)
    {
        let entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithGenericName", genericName);
        return this.fromList(entities, selectAll, accumulateSelection);
    },
    "entityWithClassesExpression": function (classesExpression, selectAll, accumulateSelection)
    {
        let args = [classesExpression, selectAll, accumulateSelection];
        if (Engine.GetMicroseconds() - this.rate.last.time < this.rate.interval &&
            this.rate.last.args.every((v, i) => v == args[i]))
            return;
        this.rate.last.time = Engine.GetMicroseconds();
        this.rate.last.args = args;

        let entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithClassesExpression", classesExpression);
        return this.fromList(entities, selectAll, accumulateSelection);
    },
    "rate": {
        "interval": 1000 * 1000,
        "last": {
            "time": Engine.GetMicroseconds(),
            "args": []
        }
    },
    "fromList": function (entities,
        selectAll = Engine.HotkeyIsPressed("selection.offscreen"),
        accumulateSelection = Engine.HotkeyIsPressed("selection.add"))
    {
        if (!entities || !entities.length)
            return;

        // CASE 1: wants to select all entities of the same type.

        if (selectAll)
        {
            // CASE 1 + 3: doesn't want to keep current selection.
            if (!accumulateSelection)
                g_Selection.reset();

            g_Selection.addList(entities);
            return true;
        }

        // CASE 2: cycle between entities of the same type one at a time.

        let lastSelectedIndex = entities.findIndex(entity => entity in g_Selection.selected);
        if (lastSelectedIndex == -1)
            lastSelectedIndex = 0;

        // Find the first entity after lastSelectedIndex not in the current selection (cyclic)
        for (let index = 0; index < entities.length; ++index)
        {
            let cyclicIndex = (index + lastSelectedIndex) % entities.length;
            let entity = entities[cyclicIndex];
            if (entity in g_Selection.selected)
                continue;

            // CASE 2 + 3: doesn't want to keep current selection.
            if (!accumulateSelection)
                g_Selection.reset();

            g_Selection.addList([entity]);
            return true;
        }
    }
}
