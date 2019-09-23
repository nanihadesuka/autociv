function AnimateGUIObject(guiObject, settings)
{
	this.guiObject = guiObject;
	this.settings = deepfreeze(settings);

	this.values = {};
	for (let value in AnimateGUIObject.defaults)
		this.values[value] = clone(settings[value] === undefined ?
			AnimateGUIObject.defaults[value] : this.settings[value]);

	this.values.curve = typeof this.values.curve == "string" ?
		AnimateGUIObject.curves[this.values.curve] : this.values.curve;

	/**
	 * Stores the initial settings parsed data that is defined in this.indentity.
	 * Make sure that each type data is a copy of the original, no references.
	 * Input must be "String" or "object".
	 */
	this.startTypes = {};
	if (this.settings.start !== undefined)
		for (let type in this.identity)
			if (this.settings.start[type])
				this.startTypes[type] = typeof this.settings.start[type] == "object" ?
					this.identity[type].fromObject(this.settings.start[type]) :
					this.identity[type].fromString(this.settings.start[type]);



	/**
	 * Stores the settings parsed data tht is defined in this.indentity.
	 * Make sure that each type data is a copy of the original, no references.
	 * Input must be "String" or "object".
	 */
	this.types = {};
	for (let type in this.identity)
		if (this.settings[type])
			this.types[type] = typeof this.settings[type] == "object" ?
				this.identity[type].fromObject(this.settings[type]) :
				this.identity[type].fromString(this.settings[type]);

	/**
	 * Stores this.types parsed actions.
	 * Filled in stage this.Start.
	 */
	this.attributes = {};

	this.stagesChain = [
		this.Init,
		this.Delay,
		this.Start,
		this.Tick,
		this.Complete
	];
	this.stage = this.stagesChain[0];
}

AnimateGUIObject.defaults = {
	"duration": 200,
	"curve": "easeOutQuint",
	"delay": 0,
	"queue": false,
	"loop": 0
};

AnimateGUIObject.curves = {
	"linear": x => x,
	"easeInOut": x => x * x * x * (x * (x * 6 - 15) + 10),
	"easeInSine": x => 1 - Math.cos(x * Math.PI / 2),
	"easeOutSine": x => Math.sin(x * Math.PI / 2),
	"easeInQuint": x => Math.pow(x, 5),
	"easeOutQuint": x => 1 - Math.pow(1 - x, 5)
};

/**
 * Types specialized methods (size, color, textcolor, ...)
 * Defined each in animateGUIObject_*.js
 */
AnimateGUIObject.prototype.identity = {};

AnimateGUIObject.prototype.parseAction = function (type)
{
	let attribute = { "parameters": {} };

	let original = this.identity[type].get(this.guiObject);
	for (let parameter in this.types[type])
	{
		// Important, don't simplify. Values most not be references.
		let start = original[parameter];
		let end = this.types[type][parameter];
		attribute.parameters[parameter] = x => start + x * (end - start);
	}

	attribute.calc = x =>
	{
		let object = this.identity[type].get(this.guiObject);
		for (let parameter in attribute.parameters)
			object[parameter] = attribute.parameters[parameter](x)
		this.identity[type].set(this.guiObject, object);
	}

	this.attributes[type] = attribute;
}

/**
 * @returns {Bool} - True means animation is still alive, false ends
 */
AnimateGUIObject.prototype.run = function (time)
{
	// If this.stage returns true it goes to the next stage.
	while (this.stage(time))
	{
		// Animation ends
		if (!this.stagesChain.length)
		{
			this.values.loop = Math.max(0, this.values.loop - 1);
			return false;
		}
		this.stage = this.stagesChain.shift();
	}
	return true;
};

AnimateGUIObject.prototype.Init = function (time)
{
	this.values.start = time + this.values.delay;
	this.values.end = this.values.start + this.values.duration;
	return true;
};

AnimateGUIObject.prototype.Delay = function (time)
{
	return time >= this.values.start;
};

AnimateGUIObject.prototype.Start = function (time)
{
	/**
	 * Set starting type settings if any.
	 */
	for (let type in this.startTypes)
	{
		let object = this.identity[type].get(this.guiObject);
		for (let parameter in this.startTypes[type])
			object[parameter] = this.startTypes[type][parameter]
		this.identity[type].set(this.guiObject, object);
	}


	if (this.settings.onStart)
		this.settings.onStart(this.guiObject, this);

	/**
	 * Parse action is called here given that the user might want
	 * to modify the object's initial values while the delay
	 * animation is running.
	 */
	for (let type in this.types)
		this.parseAction(type);

	return true;
};

AnimateGUIObject.prototype.Tick = function (time)
{
	let running = time < this.values.end;
	let uniformTime = !running ? 1 :
		(time - this.values.start) / this.values.duration;
	let x = this.values.curve(uniformTime);

	for (let attribute in this.attributes)
		this.attributes[attribute].calc(x);

	if (this.settings.onTick)
		this.settings.onTick(this.guiObject, this);

	return !running;
};

AnimateGUIObject.prototype.Complete = function (time)
{
	if (this.settings.onComplete)
		this.settings.onComplete(this.guiObject, this);

	return true;
};

/**
 * Checks if the animation has any type that still
 * modifies the guiObject.
 */
AnimateGUIObject.prototype.isAlive = function ()
{
	return !!Object.keys(this.types).length;
}

/**
 * Removes types/attributes from the old animation that the
 * new animation has
 */
AnimateGUIObject.prototype.removeIntersections = function (newAnimation)
{
	for (let type of Object.keys(this.types))
		this.removePropertyIntersections(newAnimation, type);

	return this;
};

AnimateGUIObject.prototype.removePropertyIntersections = function (newAnimation, type)
{
	if (!newAnimation.types[type])
		return;

	for (let parameter of Object.keys(this.types[type]))
	{
		if (newAnimation.types[type][parameter] === undefined)
			continue;

		delete this.types[type][parameter];
		if (this.attributes[type])
			delete this.attributes[type].parameters[parameter];
	}

	if (Object.keys(this.types[type]).length)
		return;

	delete this.types[type];
	delete this.attributes[type];
};

/**
 * Jump to the end of the animation.
 * onStart/onTick/onComplete behaviour doesn't change.
 */
AnimateGUIObject.prototype.complete = function ()
{
	this.value.end = Date.now();
}



function GUIObjectSet(GUIObject, settings)
{
	const identity = AnimateGUIObject.prototype.identity;
	const guiObject = typeof GUIObject == "string" ?
		Engine.GetGUIObjectByName(GUIObject) :
		GUIObject;
	let startTypes = {};


	if (settings !== undefined)
		for (let type in identity)
			if (settings[type])
				startTypes[type] = typeof settings[type] == "object" ?
					identity[type].fromObject(settings[type]) :
					identity[type].fromString(settings[type]);

	// warn(JSON.stringify(startTypes, null, 2))

	for (let type in startTypes)
	{
		let object = identity[type].get(guiObject);
		for (let parameter in startTypes[type])
			object[parameter] = startTypes[type][parameter]
		identity[type].set(guiObject, object);
	}
}
