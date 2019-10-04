function AnimateGUIObject(guiObject, settings)
{
	this.guiObject = guiObject;
	this.settings = deepfreeze(settings);

	this.values = {};
	for (let value in AnimateGUIObject.defaults)
		this.values[value] = clone(this.settings[value] === undefined ?
			AnimateGUIObject.defaults[value] : this.settings[value]);

	this.values.curve = typeof this.values.curve == "string" ?
		AnimateGUIObject.curves[this.values.curve] : this.values.curve;


	let parse = rawSettings =>
	{
		let q = {};
		for (let type in rawSettings)
			if (type in this.identity)
				q[type] = typeof rawSettings[type] == "object" ?
					this.identity[type].fromObject(rawSettings[type]) :
					this.identity[type].fromString(rawSettings[type]);
		return q;
	}

	/**
	 * Stores the initial settings parsed data that is defined in this.indentity.
	 * Input must be "String" or "object".
	 */
	this.startTypes = this.settings.start ? parse(this.settings.start) : {};
	this.types = parse(this.settings);

	/**
	 * Stores this.types parsed actions.
	 * Filled in stage this.Start.
	 */
	this.attributes = {};

	this.stagesChain = [
		this.stageInit,
		this.stageDelay,
		this.stageStart,
		this.stageTick,
		this.stageComplete
	];
	this.stage = this.stagesChain[0];
}

AnimateGUIObject.defaults = {
	"duration": 200,
	"curve": "easeOutQuint",
	"delay": 0,
	"queue": false
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
 * Each defined in its animateGUIObject_*.js
 */
AnimateGUIObject.prototype.identity = {};

AnimateGUIObject.prototype.parseAction = function (type)
{
	let attribute = { "parameters": {} };

	let original = this.identity[type].get(this.guiObject);
	for (let parameter in this.types[type])
	{
		let start = original[parameter];
		let end = this.types[type][parameter];
		attribute.parameters[parameter] = x => start + x * (end - start);
	}

	attribute.calc = x =>
	{
		let object = this.identity[type].get(this.guiObject);
		for (let parameter in attribute.parameters)
			object[parameter] = attribute.parameters[parameter](x);
		this.identity[type].set(this.guiObject, object);
	}

	this.attributes[type] = attribute;
	return this;
}

AnimateGUIObject.prototype.run = function (time)
{
	// Loop if there are stages or a change of stage
	while (true)
	{
		if (!this.stage || !this.stage(time))
			break;
		this.stage = this.stagesChain.shift();
	};
	return this;
};

AnimateGUIObject.prototype.hasRemainingStages = function ()
{
	return !!this.stage;
};

AnimateGUIObject.prototype.stageInit = function (time)
{
	this.values.start = time + this.values.delay;
	this.values.end = this.values.start + this.values.duration;
	return true;
};

AnimateGUIObject.prototype.stageDelay = function (time)
{
	return time >= this.values.start;
};

AnimateGUIObject.prototype.stageStart = function (time)
{

	// Set starting type settings if any.
	for (let type in this.startTypes)
	{
		let object = this.identity[type].get(this.guiObject);
		for (let parameter in this.startTypes[type])
			object[parameter] = this.startTypes[type][parameter];
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

AnimateGUIObject.prototype.stageTick = function (time)
{
	let running = time < this.values.end;
	let uniformTime = running ?
		(time - this.values.start) / this.values.duration :
		1;
	let x = this.values.curve(uniformTime);

	if (!this.noAttributesUpdate)
		for (let attribute in this.attributes)
			this.attributes[attribute].calc(x);

	if (this.settings.onTick)
		this.settings.onTick(this.guiObject, this);

	return !running;
};

AnimateGUIObject.prototype.stageComplete = function (time)
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
	return this;
};

/**
 * Jump to the end of the animation.
 * onStart/onTick/onComplete behaviour doesn't change.
 * @param {Boolean} noAttributesUpdate Ends animations witout updating attributes.
 */
AnimateGUIObject.prototype.complete = function (noAttributesUpdate = false)
{
	this.noAttributesUpdate = noAttributesUpdate;
	this.values.end = Date.now();
	return this;
}

function GUIObjectSet(GUIObject, settings)
{
	const identity = AnimateGUIObject.prototype.identity;
	const guiObject = typeof GUIObject == "string" ?
		Engine.GetGUIObjectByName(GUIObject) : GUIObject;

	let types = {};

	if (settings !== undefined)
		for (let type in identity)
			if (settings[type])
				types[type] = typeof settings[type] == "object" ?
					identity[type].fromObject(settings[type]) :
					identity[type].fromString(settings[type]);

	for (let type in types)
	{
		let object = identity[type].get(guiObject);
		for (let parameter in types[type])
			object[parameter] = types[type][parameter];
		identity[type].set(guiObject, object);
	}

	return guiObject;
}
