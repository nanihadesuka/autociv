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
	// key = objectName , value = [animation1,animation2,animation3,...]
	// If a value is [] its entry should be deleted
	this.running = new Map();
	this.queue = new Map();
};

AnimateGUIManager.prototype.addAnimation = function (guiObject, settings)
{
	let newAnimation = new AnimateGUIObject(guiObject, settings);

	// If no animation running.
	if (!this.running.has(guiObject.name))
	{
		this.running.set(guiObject.name, [newAnimation]);
		this.queue.delete(guiObject.name);
	}
	// If animation(s) running and new animation doesn't queue.
	else if (!newAnimation.values.queue)
	{
		/**
		 * Delete parts of the other animations that conflict with
		 * the new one and delete queue animations.
		 */
		let animations = this.running.get(guiObject.name).filter(animation =>
			animation.removeIntersections(newAnimation).isAlive()
		);
		animations.push(newAnimation);
		this.running.set(guiObject.name, animations);
		this.queue.delete(guiObject.name);
	}
	// If animaton(s) running and new animation does queue.
	else
	{
		if (this.queue.has(guiObject.name))
			this.queue.get(guiObject.name).push(newAnimation);
		else
			this.queue.set(guiObject.name, [newAnimation]);
	}
	return newAnimation;
};


/**
 * Checks if there are animations waiting for processing in this same tick.
 * Not to confuse with queue.
 */
AnimateGUIManager.prototype.pendingAnimations = function (objectName)
{
	if (this.running.has(objectName) && !this.running.get(objectName).length)
		this.running.delete(objectName);

	// If there are animations running
	if (this.running.has(objectName))
		return false;

	// If there are no animations running and no animations pending
	if (!this.queue.has(objectName))
	{
		this.running.delete(objectName);
		return false;
	}

	let nextAnimation = this.queue.get(objectName).shift();

	// If queue empty, delete queue.
	if (!nextAnimation)
	{
		this.queue.delete(objectName);
		return false;
	}

	// If there are no animations running but has animations pending
	this.running.set(objectName, [nextAnimation]);

	return true;
}

AnimateGUIManager.prototype.onTick = function ()
{
	let finishedAnimation = animation =>
	{
		let running = animation.run(time);
		if (!running && animation.values.loop)
		{
			animateObject.gui.addAnimation(
				animation.guiObject,
				animation.settings
			).values.loop = animation.values.loop;
		}
		return running;
	};

	/**
	 * Repeat loop in case there are multiple animations
	 * queued that have delay:0 and duration:0
	 * (AnimateGUIManager.prototype.complete case)
	 */
	let time = Date.now();
	for (let name of this.running.keys())
		do
		{
			let runningAnimation = this.running.get(name).filter(finishedAnimation);
			this.running.set(name, runningAnimation);
		}
		while (this.pendingAnimations(name))
};

AnimateGUIManager.prototype.complete = function (guiObject, completeQueue = false)
{
	if (!this.running.has(guiObject.name))
		return;

	for (let animation of this.running.get(guiObject.name))
		animation.complete();

	if (!completeQueue || !this.queue.has(guiObject.name))
		return;

	for (let animation of this.queue.get(guiObject.name))
	{
		animation.values.delay = 0;
		animation.values.duration = 0;
	}
}

AnimateGUIManager.prototype.finish = function (guiObject, completeQueue = false)
{
	if (!this.running.has(guiObject.name))
		return;

	for (let animation of this.running.get(guiObject.name))
		animation.finish();

	if (!completeQueue || !this.queue.has(guiObject.name))
		return;

	for (let animation of this.queue.get(guiObject.name))
	{
		animation.values.delay = 0;
		animation.values.duration = 0;
	}
}

AnimateGUIManager.prototype.end = function (guiObject, endQueue = false)
{
	this.running.delete(guiObject.name);
	if (endQueue)
		this.queue.delete(guiObject.name);
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
	animateObject.gui.addAnimation(
		animateObject.parseGUIObject(guiObject),
		settings
	);
}

animateObject.parseGUIObject = function (guiObject)
{
	return typeof guiObject == "string" ?
		Engine.GetGUIObjectByName(guiObject) :
		guiObject;
}

/**
 * Tick routine always called on all pages with
 * global.xml included (all?).
 */
animateObject.onTick = function ()
{
	animateObject.gui.onTick();
}

animateObject.gui = new AnimateGUIManager();

/**
 * Ends animation as if had reached end time.
 * onStart/onTick/onComplete called as usual.
 * Optional argument to complete all remaining queues.
 */
animateObject.complete = function (guiObject, completeQueue = false)
{
	animateObject.gui.complete(
		animateObject.parseGUIObject(guiObject),
		completeQueue
	);
}

/**
 * Ends animation as if had reached end time but without
 * updating attributes.
 * onStart/onTick/onComplete called as usual.
 * Optional argument to complete all remaining queues.
 */
animateObject.finish = function (guiObject, completeQueue = false)
{
	animateObject.gui.finish(
		animateObject.parseGUIObject(guiObject),
		completeQueue
	);
}

/**
 * Ends animation at given time of command.
 * onStart/onTick/onComplete not called.
 * Optional argument to end all remaining queues.
 */
animateObject.end = function (guiObject, endQueue = false)
{
	animateObject.gui.end(
		animateObject.parseGUIObject(guiObject),
		endQueue
	);
}

/**
 * Makes a chained animation
 * @param {Object} guiObject
 * @param {Object[]} chainSettingsList
 * @param {Object} sharedSettings
 */
animateObject.chain = function (guiObject, chainSettingsList, sharedSettings = {})
{
	for (let settings of chainSettingsList)
		animateObject(
			guiObject,
			Object.assign({}, sharedSettings, settings)
		);
}
