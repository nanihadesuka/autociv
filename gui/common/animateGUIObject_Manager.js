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

AnimateGUIObjectManager.prototype.add = function (settings)
{
	let newAnimation = new AnimateGUIObject(this.guiObject, settings);

	// If no animation running.
	if (!this.running.length)
	{
		this.running.push(newAnimation);
		this.queue = [];
	}
	// If animation(s) running and new animation doesn't queue.
	else if (!newAnimation.values.queue)
	{
		/**
		 * Delete parts of the other animations that conflict with
		 * the new one and delete queue animations.
		 */
		this.running = this.running.filter(animation =>
			animation.removeIntersections(newAnimation).isAlive());
		this.running.push(newAnimation);
		this.queue = [];
	}
	// If animaton(s) running and new animation does queue.
	else
		this.queue.push(newAnimation)

	return newAnimation;
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

	let nextAnimation = this.queue.shift();

	// If queue empty, delete queue.
	if (!nextAnimation)
		return false;

	// If there are no animations running but has animations pending
	this.running = [nextAnimation];

	return true;
}

AnimateGUIObjectManager.prototype.onTick = function ()
{
	let time = Date.now();
	let finishedAnimation = animation =>
	{
		let running = animation.run(time);
		if (!running && animation.values.loop)
			this.add(animation.settings).values.loop = animation.values.loop;
		return running;
	};

	/**
	 * Repeat loop in case there are multiple animations
	 * queued that have delay:0 and duration:0
	 * (AnimateGUIObjectManager.prototype.complete case)
	 */
	do { this.running = this.running.filter(finishedAnimation); }
	while (this.pendingAnimations())

	return this.isAlive();
};

AnimateGUIObjectManager.prototype.complete = function (completeQueue = false)
{
	if (!this.running.length)
		return;

	for (let animation of this.running)
		animation.complete();

	if (!completeQueue || !this.queue.length)
		return;

	for (let animation of this.queue)
	{
		animation.values.delay = 0;
		animation.values.duration = 0;
	}
}

AnimateGUIObjectManager.prototype.finish = function (completeQueue = false)
{
	if (!this.running.length)
		return;

	for (let animation of this.running)
		animation.finish();

	if (!completeQueue || !this.queue.length)
		return;

	for (let animation of this.queue)
	{
		animation.values.delay = 0;
		animation.values.duration = 0;
	}
}

AnimateGUIObjectManager.prototype.end = function (endQueue = false)
{
	this.running = [];
	if (endQueue)
		this.queue = [];
}
