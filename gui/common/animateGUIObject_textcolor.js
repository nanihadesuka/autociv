AnimateGUIObject.prototype.identities.textcolor = {
	"parameters": AnimateGUIObject.prototype.identities.color.parameters,
	"set": function (GUIObject, object)
	{
		GUIObject.textcolor = this.toString(object);
	},
	"get": GUIObject =>
	{
		return Object.assign({ "a": 1 }, GUIObject.textcolor);
	},
	"fromString": AnimateGUIObject.prototype.identities.color.fromString,
	"fromObject": AnimateGUIObject.prototype.identities.color.fromObject,
	"toString": AnimateGUIObject.prototype.identities.color.toString
};
