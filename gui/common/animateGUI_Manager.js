/**
 * GUI animator addon
 * Use:
 *  kinetic(guiObject).add(settings)
 *  kinetic(guiObject).complete([completeQueue])
 *  kinetic(guiObject).end([endQueue])
 *  kinetic(guiObject).chain(chainSettingsList, [defaultSettings])
 *	etc ...
 *  · Methods can be chained
 *
 * 	Example of settings:
 *  {
 *	  "color"     : "255 255 255 12",
 *	  "color"     : { "r": 255, "g": 255, "b": 255, "a": 12 },
 *	  "textcolor" : "140 140 140 28",
 *	  "textcolor" : { "r": 140, "g": 140, "b": 140, "a": 28 },
 *	  "size"      : "rleft%left rtop%top rright%right rbottom%bottom",
 *	  "size"      : { "left" : 0,  "top" : 10, "right" : 250, "bottom" : 300,
 *	                  "rleft": 50, "rtop": 50, "rright": 50,  "rbottom": 100 },
 *	  "duration"  : 1000,
 *	  "delay"     : 100,
 *	  "curve"     : "linear",
 *	  "curve"     : x => x*x*x - 1,
 *	  "onStart"   : guiObject => warn("animation has started"),
 *	  "onTick"    : guiObject => warn("animation has ticked"),
 *	  "onComplete": guiObject => warn("animation has completed"),
 *	  "queue"     : false
 *	};
 *
 * · "textcolor" only works with objects that can have text.
 * · "color" only works if the object parameter sprite is defined
 *    as sprite = "color: R G B A".
 * · "size" always works.
 *
 * · AnimateGUIObject.default for defaults that can be changed.
 * · AnimateGUIObject.curves for animation transitions types="string"
 *   that can be changed.
 *
 * · Each setting can be set independent from the other (including
 *   individual values of each setting).
 * · In case of two animations with the same setting the new animation
 *   setting will overrite the old one.
 */

function AnimateGUIManager() { this.objects = new Map(); };

AnimateGUIManager.prototype.get = function (guiObject)
{
	if (!this.objects.has(guiObject.name))
		this.objects.set(guiObject.name, new AnimateGUIObjectManager(guiObject));

	return this.objects.get(guiObject.name);
};

AnimateGUIManager.prototype.onTick = function ()
{
	for (let [name, object] of this.objects)
		if (!object.onTick().isAlive())
			this.objects.delete(name);
};



function kinetic(guiObject)
{
	let name = typeof guiObject == "string" ? Engine.GetGUIObjectByName(guiObject) : guiObject;
	return kinetic.instance.get(name);
}

kinetic.instance = new AnimateGUIManager();
kinetic.onTick = function () { kinetic.instance.onTick(); }
