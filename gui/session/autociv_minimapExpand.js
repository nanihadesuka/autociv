let autociv_minimapExpand = {
    "toggle": function ()
    {
        if (!this.GUIObject)
            this.GUIObject = Engine.GetGUIObjectByName("minimapPanel");

        if (!this.defaultSize)
            this.defaultSize = this.GUIObject.size;

        this.GUIObject.size = this.expanded ? this.defaultSize : this.getExpandedSize();
        this.expanded = !this.expanded;
    },
    "getExpandedSize": function ()
    {
        let windowSize = Engine.GetGUIObjectByName("session").getComputedSize();
        let halfHeight = (windowSize.bottom - windowSize.top) / 2 - 70;
        return `50%-${halfHeight - 75} 50%-${halfHeight} 50%+${halfHeight - 75} 50%+${halfHeight - 150}`;
    },
    "expanded": false,
    "GUIObject": undefined,
    "defaultSize": undefined
};
