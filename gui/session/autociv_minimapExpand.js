var autociv_minimapExpand = {
	"toggle": function ()
	{
		if (!this.defaultSize)
			this.defaultSize = this.GUI.size;

		this.GUI.size = this.expanded ? this.defaultSize : this.getExpandedSize();
		this.expanded = !this.expanded;
	},
	"getExpandedSize": function ()
	{
		let windowSize = Engine.GetGUIObjectByName("session").getComputedSize();
		let halfHeight = (windowSize.bottom - windowSize.top) / 2 - 70;
		return `50%-${halfHeight - 75} 50%-${halfHeight} 50%+${halfHeight - 75} 50%+${halfHeight - 150}`;
	},
	"expanded": false,
	"defaultSize": undefined,
	get GUI()
	{
		return "_GUIObject" in this ? this._GUIObject :
			this._GUIObject = Engine.GetGUIObjectByName("minimapPanel");
	}
};
