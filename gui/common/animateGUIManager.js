/**
 * GUI animator addon
 * Use:
 *  animate(GUIObject).add(settings)
 *  animate(GUIObject).chain(chainSettingsList, [defaultSettings])
 *  animate(GUIObject).complete().add(setting).chain([...],{"queue":true})
 *	etc ...
 *
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
 * · "textcolor" only works if object has caption.
 * · "color" only works if object has a defined sprite = "color: R G B A" in the XML.
 * · "size" always works.
 *
 * · AnimateGUIObject.default for defaults that can be changed.
 * · AnimateGUIObject.curves for animations normalized step functions
 *
 * · Each setting can be set independent (including individual parameters).
 * · In case of two animations with the same setting the new animation
 *   setting will overrite the old one.
 */

class AnimateGUIManager
{
	objects = new Set()

	get(GUIObject)
	{
		if (!GUIObject.onAutocivAnimate)
		{
			GUIObject.onAutocivAnimate = function () { }
			GUIObject.onAutocivAnimate.manager = new AnimateGUIObjectManager(GUIObject, this)
		}
		this.objects.add(GUIObject.onAutocivAnimate.manager)
		return GUIObject.onAutocivAnimate.manager
	}

	// Adds GUIObjectManager instance back to this.objects so it can onTick again
	setTicking(AnimateGUIObjectManagerInstance)
	{
		this.objects.add(AnimateGUIObjectManagerInstance)
	}

	onTick()
	{
		for (let object of this.objects)
			if (!object.onTick().isAlive())
				this.objects.delete(object)
	}
}

/**
 * @param {object | string} object
 * @returns {AnimateGUIObjectManager} instance
 */
function animate(object)
{
	let GUIObject = typeof object == "string" ? Engine.GetGUIObjectByName(object) : object
	return animate.instance.get(GUIObject)
}

animate.instance = new AnimateGUIManager()

// onTick routine always called on all pages with global.xml included (all?)
animate.onTick = function () { animate.instance.onTick() }
