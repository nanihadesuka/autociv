AnimateGUIObject.prototype.identity.textcolor = {
	"types": AnimateGUIObject.prototype.identity.color.types,
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
	"fromString": AnimateGUIObject.prototype.identity.color.fromString,
	"fromObject": AnimateGUIObject.prototype.identity.color.fromObject,
	"toString": AnimateGUIObject.prototype.identity.color.toString
};
