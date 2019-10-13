/**
 * GUI animator addon
 * Use:
 *  animate(GUIObject).add(settings)
 *  animate(GUIObject).chain(chainSettingsList, [defaultSettings])
 *	etc ...
 *  · Methods can be chained
 *
 * 	Example of settings:
 *  {
 * 	  "start"     : { "color": ... , "textcolor": ... , "size": ... }
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
 *	  "onStart"   : GUIObject => warn("animation has started"),
 *	  "onTick"    : GUIObject => warn("animation has ticked"),
 *	  "onComplete": GUIObject => warn("animation has completed"),
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

function AnimateGUIManager()
{
	this.objects = new Set();
};

AnimateGUIManager.prototype.get = function (GUIObject)
{
	if (!GUIObject.onACAnimate)
	{
		GUIObject.onACAnimate = function () { };
		GUIObject.onACAnimate.manager = new AnimateGUIObjectManager(GUIObject, this);
	}
	this.objects.add(GUIObject.onACAnimate.manager);
	return GUIObject.onACAnimate.manager;
};

AnimateGUIManager.prototype.setTicking = function (AnimateGUIObjectManagerInstance)
{
	this.objects.add(AnimateGUIObjectManagerInstance);
};

AnimateGUIManager.prototype.onTick = function ()
{
	for (let object of this.objects)
		if (!object.onTick().isAlive())
			this.objects.delete(object);
};

/**
 * @param {object | string} object
 */
function animate(object)
{
	let GUIObject = typeof object == "string" ? Engine.GetGUIObjectByName(object) : object;
	return animate.instance.get(GUIObject);
}

animate.instance = new AnimateGUIManager();

// onTick routine always called on all pages with global.xml included (all?)
animate.onTick = function () { animate.instance.onTick(); }
