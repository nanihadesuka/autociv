AnimateGUIObject.types.textcolor = {
	"parameters": AnimateGUIObject.types.color.parameters,
	"set": function (GUIObject, object)
	{
		GUIObject.textcolor = this.toString(object);
	},
	"get": GUIObject => Object.assign({ "a": 1 }, GUIObject.textcolor),
	"fromString": AnimateGUIObject.types.color.fromString,
	"fromObject": AnimateGUIObject.types.color.fromObject,
	"toString": AnimateGUIObject.types.color.toString
};
