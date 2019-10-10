AnimateGUIObject.prototype.identity.textcolor = {
	"types": AnimateGUIObject.prototype.identity.color.types,
	"set": function (guiObject, object)
	{
		guiObject.textcolor = this.toString(object);
	},
	"get": guiObject =>
	{
		return Object.assign({ "a": 1 }, guiObject.textcolor);
	},
	"fromString": AnimateGUIObject.prototype.identity.color.fromString,
	"fromObject": AnimateGUIObject.prototype.identity.color.fromObject,
	"toString": AnimateGUIObject.prototype.identity.color.toString
};
