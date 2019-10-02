/**
 * Simple GUI animator addon
 * guiObject can be a string or a GUI object
 * Use:
 * 	animateObject (guiObject | guiObjectName, settings)
 *  animateObject.complete (guiObject, [completeQueue])
 *  animateObject.end (guiObject, [endQueue])
 *  animateObject.chain (guiObject, chainSettingsList, [defaultSettings])
 *
 * 	Example of settings:
 *
 *	let settings = {
 *		"color"         : "255 255 255 12",
 *		"color"         : { "r": 255, "g": 255, "b": 255, "a": 12 },
 *		"textcolor"     : "140 140 140 28",
 *		"textcolor"     : { "r": 140, "g": 140, "b": 140, "a": 28},
 *		"size"          : "rleft%left rtop%top rright%right rbottom%bottom",
 *		"size"          : {
 *			"left" : 0,  "top" : 10, "right" : 250, "bottom" : 300,
 *			"rleft": 50, "rtop": 50, "rright": 50,  "rbottom": 100,
 *		},
 *		"duration"      : 1000,
 *		"delay"         : 100,
 *		"curve"         : "linear",
 *		"curve"         : x => x*x*x - 1,
 *		"onStart"       : (guiObject) => { warn("animation has started"); },
 *		"onTick"        : (guiObject) => { warn("animation has ticked"); },
 *		"onComplete"    : (guiObject) => { warn("animation has completed"); },
 *		"queue"         : false,
 *	};
 *
 * - "textcolor" only works with objects that can have text.
 * - "color" only works if the object parameter sprite is defined
 *    as sprite = "color: R G B A".
 * - "size" always works.
 *
 * - AnimateGUIObject.default for defaults that can be changed.
 * - AnimateGUIObject.curves for animation transitions types="string"
 *   that can be changed.
 *
 * Each setting can be set independent from the other (including
 * individual values of each setting).
 * In case of two animations with the same setting the new animation
 * setting will overrite the old one.
 */

function AnimateGUIManager()
{
	// key = objectName , value = AnimateGUIObjectManager instance
	this.objects = new Map();
};

AnimateGUIManager.prototype.addAnimation = function (guiObject, settings)
{
	if (!this.objects.has(guiObject.name))
		this.objects.set(guiObject.name, new AnimateGUIObjectManager(guiObject));

	this.objects.get(guiObject.name).add(settings);
};

AnimateGUIManager.prototype.onTick = function ()
{
	for (let [name, object] of this.objects)
		if (!object.onTick())
			this.objects.delete(name);
};

AnimateGUIManager.prototype.complete = function (guiObject, completeQueue = false)
{
	if (this.objects.has(guiObject.name))
		this.objects.get(guiObject.name).complete(completeQueue)
}

AnimateGUIManager.prototype.finish = function (guiObject, completeQueue = false)
{
	if (this.objects.has(guiObject.name))
		this.objects.get(guiObject.name).finish(completeQueue)
}

AnimateGUIManager.prototype.end = function (guiObject, endQueue = false)
{
	if (this.objects.has(guiObject.name))
		this.objects.get(guiObject.name).end(endQueue)
}

/**
 * @param {Object | String} guiObject
 * @param {Object} settings
 * @param {Number} [settings.duration]
 * @param {Number} [settings.delay]
 * @param {String | Function} [settings.curve]
 * @param {Function} [settings.onStart]
 * @param {Function} [settings.onTick]
 * @param {Function} [settings.onComplete]
 * @param {Boolean} [settings.queue]
 * @param {{r,g,b,a} | String} [settings.color]
 * @param {{r,g,b,a} | String} [settings.textcolor]
 * @param {{left,top,right,bottom,rleft,rtop,rright,rbottom} | String} settings.size
 */
let animateObject = function (guiObject, settings)
{
	animateObject.gui.addAnimation(animateObject.parseGUIObject(guiObject), settings);
}

Object.assign(animateObject, {
	"gui": new AnimateGUIManager(),
	"add": function (guiObject, settings)
	{
		this.gui.addAnimation(this.parseGUIObject(guiObject), settings);
	},
	"parseGUIObject": function (guiObject)
	{
		return typeof guiObject == "string" ?
			Engine.GetGUIObjectByName(guiObject) :
			guiObject;
	},
	/**
	 * Tick routine always called on all pages with
	 * global.xml included (all?).
	 */
	"onTick": function ()
	{
		this.gui.onTick();
	},
	/**
	 * Ends animation as if had reached end time.
	 * onStart/onTick/onComplete called as usual.
	 * Optional argument to complete all remaining queues.
	 */
	"complete": function (guiObject, completeQueue = true)
	{
		this.gui.complete(this.parseGUIObject(guiObject), completeQueue);
	},
	/**
	 * Ends animation as if had reached end time but without
	 * updating attributes.
	 * onStart/onTick/onComplete called as usual.
	 * Optional argument to complete all remaining queues.
	 */
	"finish": function (guiObject, completeQueue = true)
	{
		this.gui.finish(this.parseGUIObject(guiObject), completeQueue);
	},
	/**
	 * Ends animation at given time of command.
	 * onStart/onTick/onComplete not called.
	 * Optional argument to end all remaining queues.
	 */
	"end": function (guiObject, endQueue = true)
	{
		this.gui.end(this.parseGUIObject(guiObject), endQueue);
	},
	/**
	 * Makes a chained animation
	 * @param {Object} guiObject
	 * @param {Object[]} chainSettingsList
	 * @param {Object} sharedSettings
	 */
	"chain": function (guiObject, chainSettingsList = [], sharedSettings = {})
	{
		for (let settings of chainSettingsList)
			animateObject(guiObject, Object.assign({}, sharedSettings, settings));
	}
});
