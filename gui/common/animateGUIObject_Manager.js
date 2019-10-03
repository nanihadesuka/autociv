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

	// If no animation running.
	if (!this.running.length)
	{
		this.running.push(newAnimation);
		// this.queue = [];
	}
	// If animation(s) running and new animation doesn't queue.
	else if (!newAnimation.values.queue)
	{
		/**
		 * Delete parts of the other animations that conflict with
		 * the new one and delete queue animations.
		 */
		let alive = animation => animation.removeIntersections(newAnimation).isAlive();
		this.running = this.running.filter(alive);
		this.running.push(newAnimation);
		this.queue = [];
	}
	// If animaton(s) running and new animation does queue.
	else
		this.queue.push(newAnimation)

	return this;
}

/**
 * Checks if there are animations waiting for processing in this same tick.
 * Not to confuse with queue.
 */
AnimateGUIObjectManager.prototype.pendingAnimations = function ()
{
	// If there are animations running
	if (this.running.length)
		return false;

	// If there are no animations running and no animations pending
	if (!this.queue.length)
		return false;

	// If there are no animations running but has animations pending
	this.running = [this.queue.shift()];

	return true;
}

/**
 * Tick routine always called on all pages with
 * global.xml included (all?).
 */
AnimateGUIObjectManager.prototype.onTick = function ()
{
	const time = Date.now();
	let finishedAnimation = animation => animation.run(time);

	/**
	 * For queued that have delay:0 and duration:0
	 * (AnimateGUIObjectManager.prototype.complete case)
	 */
	do { this.running = this.running.filter(finishedAnimation); }
	while (this.pendingAnimations())

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

	if (completeQueue)
		for (let animation of this.queue)
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
		animation.finish();

	if (completeQueue)
		for (let animation of this.queue)
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
