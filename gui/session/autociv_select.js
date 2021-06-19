var autociv_select = {
    "entityWithGenericName": function (genericName, selectAll, accumulateSelection)
    {
        const entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithGenericName", genericName);
        return this.fromList(entities, selectAll, accumulateSelection);
    },
    "entityWithTemplateName": function (templateName, selectAll, accumulateSelection)
    {
        const entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithTemplateName", templateName);
        return this.fromList(entities, selectAll, accumulateSelection);
    },
    "entityWithClassesExpression": function (classesExpression, selectAll, accumulateSelection)
    {
        // Time rate it, given is an expensive call
        const args = [classesExpression, selectAll, accumulateSelection];
        if (Engine.GetMicroseconds() - this.rate.last.time < this.rate.interval &&
            this.rate.last.args.every((v, i) => v == args[i]))
            return;
        this.rate.last.time = Engine.GetMicroseconds();
        this.rate.last.args = args;

        const entities = Engine.GuiInterfaceCall("autociv_FindEntitiesWithClassesExpression", { "classesExpression": classesExpression });
        return this.fromList(entities, selectAll, accumulateSelection);
    },
    "rate": {
        "interval": 1000 * 1000,
        "last": {
            "time": Engine.GetMicroseconds(),
            "args": []
        }
    },
    /**
     * Select all entities.
     */
    "selectAll": function (entities, accumulateSelection)
    {
        if (!entities?.length)
            return;

        if (!accumulateSelection)
            g_Selection.reset();

        g_Selection.addList(entities);
        return true;
    },
    /**
     * Cycle between entities.
     */
    "cycle": function (entities, accumulateSelection)
    {
        if (!entities?.length)
            return;

        let lastSelectedIndex = entities.findIndex(entity => g_Selection.selected.has(entity));
        if (lastSelectedIndex == -1)
            lastSelectedIndex = 0;

        // Find the first entity after lastSelectedIndex not in the current selection (cyclic)
        for (let index = 0; index < entities.length; ++index)
        {
            const cyclicIndex = (index + lastSelectedIndex) % entities.length;
            const entity = entities[cyclicIndex];
            if (g_Selection.selected.has(entity))
                continue;

            if (!accumulateSelection)
                g_Selection.reset();

            g_Selection.addList([entity]);
            return true;
        }
    },
    "fromList": function (entities,
        selectAll = Engine.HotkeyIsPressed("selection.offscreen"),
        accumulateSelection = Engine.HotkeyIsPressed("selection.add"))
    {
        return selectAll ?
            this.selectAll(entities, accumulateSelection) :
            this.cycle(entities, accumulateSelection);
    }
}
