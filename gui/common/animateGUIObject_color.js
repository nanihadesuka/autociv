AnimateGUIObject.prototype.identity.color = {
	"types": deepfreeze(["r", "g", "b", "a"]),
	"set": function (guiObject, object)
	{
		guiObject.sprite = "color: " + this.toString(object);
	},
	"get": function (guiObject)
	{
		let color = this.fromString(guiObject.sprite.match(/:(.+)$/)[1]);
		color.a = color.a === undefined ? 1 : color.a;
		return color;
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
