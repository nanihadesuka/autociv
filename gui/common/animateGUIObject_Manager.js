function AnimateGUIObjectManager(guiObject)
{
	this.guiObject = guiObject
	this.running = []
	this.queue = []
}

AnimateGUIObjectManager.prototype.isAlive = function ()
{
	return this.running.length || this.queue.length;
};

/**
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
AnimateGUIObjectManager.prototype.add = function (settings)
{
	let newAnimation = new AnimateGUIObject(this.guiObject, settings);

	if (newAnimation.values.queue)
		this.queue.push(newAnimation)
	else
		this.running = this.running.
			filter(animation => animation.removeIntersections(newAnimation).isAlive()).
			concat(newAnimation);

	return this;
}

AnimateGUIObjectManager.prototype.onTick = function ()
{
	const time = Date.now();

	do this.running = this.running.filter(animation => animation.run(time).hasRemainingStages());
	while (!this.running.length && this.queue.length && this.running.push(this.queue.shift()))

	return this;
};

/**
 * Ends animation as if had reached end time.
 * onStart/onTick/onComplete called as usual.
 * Optional argument to complete all remaining queues.
 */
AnimateGUIObjectManager.prototype.complete = function (completeQueue)
{
	for (let animation of this.running)
		animation.complete();

	if (completeQueue) for (let animation of this.queue)
	{
		animation.values.delay = 0;
		animation.values.duration = 0;
	}

	return this;
}

/**
 * Ends animation as if had reached end time but without
 * updating attributes.
 * onStart/onTick/onComplete called as usual.
 * Optional argument to complete all remaining queues.
 */
AnimateGUIObjectManager.prototype.finish = function (completeQueue)
{
	for (let animation of this.running)
		animation.complete(true);

	if (completeQueue) for (let animation of this.queue)
	{
		animation.values.delay = 0;
		animation.values.duration = 0;
	}

	return this;
}

/**
 * Ends animation at given time of command.
 * onStart/onTick/onComplete not called.
 * Optional argument to end all remaining queues.
 */
AnimateGUIObjectManager.prototype.end = function (endQueue)
{
	this.running = [];
	if (endQueue)
		this.queue = [];

	return this;
}

/**
 * Chain animations
 * @param {Object} guiObject
 * @param {Object[]} chainSettingsList
 * @param {Object} sharedSettings
 */
AnimateGUIObjectManager.prototype.chain = function (chainSettingsList, sharedSettings)
{
	for (let settings of chainSettingsList)
		this.add(Object.assign({}, sharedSettings, settings));

	return this;
}
