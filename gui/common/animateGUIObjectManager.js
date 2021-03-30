class AnimateGUIObjectManager
{
	constructor(GUIObject, GUIManagerInstance)
	{
		this.GUIManagerInstance = GUIManagerInstance
		this.GUIObject = GUIObject
		this.running = []
		this.queue = []
	}

	isAlive()
	{
		return this.running.length || this.queue.length
	}

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
	add(settings)
	{
		this.GUIManagerInstance.setTicking(this)
		let newAnimation = new AnimateGUIObject(this.GUIObject, settings)

		if (newAnimation.data.queue)
			this.queue.push(newAnimation)
		else
		{
			this.running = this.running.filter(animation => animation.removeIntersections(newAnimation).isAlive())
			this.running.push(newAnimation)
		}

		return this
	}

	onTick()
	{
		const time = Date.now()

		do this.running = this.running.filter(animation => animation.run(time).hasRemainingStages())
		while (!this.running.length && this.queue.length && this.running.push(this.queue.shift()))

		return this
	}

	/**
	 * Ends animation as if had reached end time.
	 * onStart/onTick/onComplete called as usual.
	 */
	complete()
	{
		this.GUIManagerInstance.setTicking(this)
		for (let animation of this.running)
			animation.complete(false)

		return this
	}

	/**
	 * Ends animation as if had reached end time but without updating attributes.
	 * onStart/onTick/onComplete called as usual.
	 */
	finish()
	{
		this.GUIManagerInstance.setTicking(this)
		for (let animation of this.running)
			animation.complete(true)

		return this
	}

	/**
	 * Chain animations
	 * @param {Object} GUIObject
	 * @param {Object[]} chainSettingsList
	 * @param {Object} sharedSettings
	 */
	chain(chainSettingsList, sharedSettings)
	{
		this.GUIManagerInstance.setTicking(this)
		for (let settings of chainSettingsList)
			this.add(Object.assign({}, sharedSettings, settings))

		return this
	}
}
