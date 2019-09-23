var GUIReact = {
    "rooms": {},
    "broadcast": function (eventName)
    {
        for (let roomName in this.rooms)
            this.emit(roomName, eventName)
    },
    "emit": function (roomName, eventName)
    {
        if (this.rooms[roomName] && this.rooms[roomName][eventName])
            this.rooms[roomName][eventName]();
    },
    "register": function (roomName, object)
    {
        this.rooms[roomName] = {};
        const engineActionsHook = typeof object.assignedGUIObjectName == "string";
        Object.keys(object).forEach(key =>
        {
            if (typeof object[key] != "function")
                return;
            if (key.match(/^on[A-Z].*/) === null)
                return;

            if (engineActionsHook && this.engineActions.has(key))
                Engine.GetGUIObjectByName(object.assignedGUIObjectName)[key] = () => object[key]();

            this.rooms[roomName][key] = () => object[key]();
        });
    },
    "engineActions": new Set([
        "onMouseEnter",
        "onMouseLeave",
        "onMouseLeftPress",
        "onMouseLeftRelease",
        "onMouseMove",
        "onPress",
        "onTick",
        "onUpdate",
        "onPress",
        "onSelectionChange",
        "onTab",
        "onMouseWheelDown",
        "onMouseWheelUp",
        "onTextEdit"
    ])
};
