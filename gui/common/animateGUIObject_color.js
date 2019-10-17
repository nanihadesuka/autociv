AnimateGUIObject.types.color = {
	"parameters": deepfreeze(["r", "g", "b", "a"]),
	"set": function (GUIObject, object)
	{
		GUIObject.sprite = "color: " + this.toString(object);
	},
	"get": function (GUIObject)
	{
		return Object.assign({ "a": 1 }, this.fromString(GUIObject.sprite.match(/:(.+)$/)[1]));
	},
	"fromString": text =>
	{
		let color = text.match(/[\w\.]+/g).map(v => v / 255);
		switch (color.length)
		{
			case 4: return { "r": color[0], "g": color[1], "b": color[2], "a": color[3] }
			case 3: return { "r": color[0], "g": color[1], "b": color[2] }
			default: return { "r": color[0], "g": color[0], "b": color[0] };
		}
	},
	"fromObject": object => Object.assign({}, object),
	"toString": object =>
	{
		let t = v => (v * 255).toFixed(0);
		return `${t(object.r)} ${t(object.g)} ${t(object.b)} ${object.a === undefined ? "" : t(object.a)}`;
	}
};
