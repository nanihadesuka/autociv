AnimateGUIObject.identities.textcolor = {
	"parameters": AnimateGUIObject.identities.color.parameters,
	"set": function (GUIObject, object)
	{
		GUIObject.textcolor = this.toString(object);
	},
	"get": GUIObject => Object.assign({ "a": 1 }, GUIObject.textcolor),
	"fromString": AnimateGUIObject.identities.color.fromString,
	"fromObject": AnimateGUIObject.identities.color.fromObject,
	"toString": AnimateGUIObject.identities.color.toString
};
