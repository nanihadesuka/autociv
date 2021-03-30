class AnimateGUIObject
{
	constructor(GUIObject, settings)
	{
		this.GUIObject = GUIObject
		this.settings = deepfreeze(settings)

		this.data = AnimateGUIObject.getData(this.settings)
		this.startValues = AnimateGUIObject.getValues(this.settings.start ?? {})
		this.endValues = AnimateGUIObject.getValues(this.settings)
		this.actions = AnimateGUIObject.getActions(this.settings)
		this.tasks = {} // Filled in stageStart

		this.stages = [
			this.stageInit,
			this.stageDelay,
			this.stageStart,
			this.stageTick,
			this.stageComplete
		]
		this.stage = this.stages[0]
	}

	static defaults = {
		"duration": 200,
		"curve": "easeOutQuint",
		"delay": 0,
		"queue": false
	}

	static curves = {
		"linear": x => x,
		"easeInOut": x => x * x * x * (x * (x * 6 - 15) + 10),
		"easeInSine": x => 1 - Math.cos(x * Math.PI / 2),
		"easeOutSine": x => Math.sin(x * Math.PI / 2),
		"easeInQuint": x => Math.pow(x, 5),
		"easeOutQuint": x => 1 - Math.pow(1 - x, 5)
	}

	/**
	 * Specialized methods for each type (size, color, textcolor, ...)
	 * Each defined in its animateGUIObject_*.js
	 */
	static types = {}

	static getData(raw)
	{
		let data = {}
		for (let v in AnimateGUIObject.defaults)
			data[v] = clone(raw[v] ?? AnimateGUIObject.defaults[v])

		// Curve input can be string or function and is outputed as function
		data.curve = AnimateGUIObject.curves[data.curve] || data.curve

		return data
	}

	static getValues(raw)
	{
		let values = {}
		for (let type in AnimateGUIObject.types) if (type in raw)
			values[type] = typeof raw[type] == "object" ?
				AnimateGUIObject.types[type].fromObject(raw[type]) :
				AnimateGUIObject.types[type].fromString(raw[type])

		return values
	}

	static getActions(raw)
	{
		return {
			"onStart": raw.onStart ?? function () { },
			"onTick": raw.onTick ?? function () { },
			"onComplete": raw.onComplete ?? function () { },
		}
	}

	static getTask(raw, type, GUIObject)
	{
		let task = { "parameters": {} }
		let identity = AnimateGUIObject.types[type]
		let original = identity.get(GUIObject)

		for (let parameter of identity.parameters) if (parameter in raw)
		{
			let start = original[parameter]
			let end = raw[parameter]
			task.parameters[parameter] = x => start + x * (end - start)
		}

		task.calc = x =>
		{
			let object = identity.get(GUIObject)
			for (let parameter in task.parameters)
				object[parameter] = task.parameters[parameter](x)
			identity.set(GUIObject, object)
		}

		return task
	}

	static getTasks(raw, GUIObject)
	{
		let tasks = {}
		for (let type in AnimateGUIObject.types) if (type in raw)
			tasks[type] = AnimateGUIObject.getTask(raw[type], type, GUIObject)

		return tasks
	}

	static setValues(values, GUIObject)
	{
		for (let type in values)
		{
			let object = AnimateGUIObject.types[type].get(GUIObject)
			for (let parameter in values[type])
				object[parameter] = values[type][parameter]
			AnimateGUIObject.types[type].set(GUIObject, object)
		}
	}

	run(time)
	{
		while (this.stage?.(time))
			this.stage = this.stages.shift()

		return this
	}

	hasRemainingStages()
	{
		return !!this.stage
	}

	stageInit(time)
	{
		this.data.start = time + this.data.delay
		this.data.end = this.data.start + this.data.duration

		return true
	}

	stageDelay(time)
	{
		return time >= this.data.start
	}

	stageStart(time)
	{
		AnimateGUIObject.setValues(this.startValues, this.GUIObject)
		// delete this.startValues
		this.actions.onStart(this.GUIObject, this)
		this.tasks = AnimateGUIObject.getTasks(this.endValues, this.GUIObject)
		// delete this.endValues

		return true
	}

	stageTick(time)
	{
		let running = time < this.data.end
		let unitary = running ? (time - this.data.start) / this.data.duration : 1
		let x = this.data.curve(unitary)

		if (!this.noTasksUpdate) for (let type in this.tasks)
			this.tasks[type].calc(x)

		this.actions.onTick(this.GUIObject, this)

		return !running
	}

	stageComplete(time)
	{
		this.actions.onComplete(this.GUIObject, this)

		return true
	}

	/**
	 * Checks if the animation has any task that still modifies the GUIObject.
	 */
	isAlive()
	{
		return !!Object.keys(this.tasks).length
	}

	/**
	 * Removes types/tasks that the old animation has with the new animation.
	 */
	removeIntersections(newAnimation)
	{
		for (let type in this.tasks) if (type in newAnimation.endValues)
			this.removeValueIntersections(newAnimation, type)

		return this
	}

	removeValueIntersections(newAnimation, type)
	{
		for (let parameter in this.tasks[type])
			if (parameter in newAnimation.endValues[type])
				delete this.tasks[type][parameter]

		if (!Object.keys(this.tasks[type]).length)
			delete this.tasks[type]
	}

	/**
	 * Jump to the end of the animation.
	 * onStart/onTick/onComplete behaviour doesn't change.
	 * @param {Boolean} noTasksUpdate Ends animations witout updating tasks.
	 */
	complete(noTasksUpdate = false)
	{
		this.noTasksUpdate = noTasksUpdate
		this.data.end = Date.now()

		return this
	}
}

function GUIObjectSet(object, settings)
{
	let values = AnimateGUIObject.getValues(settings)
	const GUIObject = typeof object == "string" ? Engine.GetGUIObjectByName(object) : object
	AnimateGUIObject.setValues(values, GUIObject)

	return GUIObject
}
