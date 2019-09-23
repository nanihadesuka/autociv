AnimateGUIObject.prototype.identity.textcolor = {
	"types": deepfreeze(["r", "g", "b", "a"]),
	"set": function (guiObject, object)
	{
		guiObject.textcolor = this.toString(object);
	},
	"get": guiObject =>
	{
		let color = guiObject.textcolor;
		if (color.a === undefined)
			color.a = 1;
		return color;
	},
	"fromString": text =>
	{
		let color = text.split(" ").filter(t => t != "");
		return color.length == 4 ?
			{
				"r": (+color[0]) / 255,
				"g": (+color[1]) / 255,
				"b": (+color[2]) / 255,
				"a": (+color[3]) / 255
			} : color.length == 3 ? {
				"r": (+color[0]) / 255,
				"g": (+color[1]) / 255,
				"b": (+color[2]) / 255
			} : {
					"r": (+color[0]) / 255,
					"g": (+color[0]) / 255,
					"b": (+color[0]) / 255
				};
	},
	"fromObject": object => Object.assign({}, object),
	"toString": object =>
	{
		return (object.r * 255).toFixed(0) + " " +
			(object.g * 255).toFixed(0) + " " +
			(object.b * 255).toFixed(0) +
			(object.a === undefined ? "" :
				" " + (object.a * 255).toFixed(0));
	}
};
