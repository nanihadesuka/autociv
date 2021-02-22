var autociv_minimapExpand = {
	"toggle": function ()
	{
		if (!this.defaultSize)
		{
			this.defaultSize = this.GUI.size;
			this.defaultSizeParent = this.GUIParent.size;
		}

		if (this.expanded)
		{
			this.GUIParent.size = this.defaultSizeParent;
			this.GUI.size = this.defaultSize;
		}
		else
		{
			let windowSize = Engine.GetGUIObjectByName("session").getComputedSize();
			let halfHeight = (windowSize.bottom - windowSize.top) / 2 - 70;

			let sizeParent = `50% 50% 50% 50%`;
			this.GUIParent.size = sizeParent;

			let size = `50%-${halfHeight - 75} 50%-${halfHeight} 50%+${halfHeight - 75} 50%+${halfHeight - 150}`;
			this.GUI.size = size;
		}

		this.expanded = !this.expanded;
	},
	"expanded": false,
	get GUI()
	{
		return "_GUIObject" in this ? this._GUIObject :
			this._GUIObject = Engine.GetGUIObjectByName("minimapPanel");
	},
	get GUIParent() { return this.GUI.parent }
};
