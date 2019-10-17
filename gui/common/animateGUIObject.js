function AnimateGUIObject(GUIObject, settings)
{
	this.GUIObject = GUIObject;
	this.settings = deepfreeze(settings);

	this.data = AnimateGUIObject.getData(this.settings);
	this.startValues = AnimateGUIObject.getValues(this.settings.start || {});
	this.endValues = AnimateGUIObject.getValues(this.settings);
	this.actions = AnimateGUIObject.getActions(this.settings);
	this.tasks = {}; // Filled in stageStart

	this.stages = [
		this.stageInit,
		this.stageDelay,
		this.stageStart,
		this.stageTick,
		this.stageComplete
	];
	this.stage = this.stages[0];
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
 * Specialized methods for each type (size, color, textcolor, ...)
 * Each defined in its animateGUIObject_*.js
 */
AnimateGUIObject.types = {};

AnimateGUIObject.getData = function (raw)
{
	let data = {};
	for (let v in AnimateGUIObject.defaults)
		data[v] = clone(v in raw ? raw[v] : AnimateGUIObject.defaults[v]);

	// Curve input can be string or function and is outputed as function
	data.curve = AnimateGUIObject.curves[data.curve] || data.curve;

	return data;
};

AnimateGUIObject.getValues = function (raw)
{
	let values = {};
	for (let type in AnimateGUIObject.types) if (type in raw)
		values[type] = typeof raw[type] == "object" ?
			AnimateGUIObject.types[type].fromObject(raw[type]) :
			AnimateGUIObject.types[type].fromString(raw[type]);

	return values;
};

AnimateGUIObject.getActions = function (raw)
{
	return {
		"onStart": raw.onStart || function () { },
		"onTick": raw.onTick || function () { },
		"onComplete": raw.onComplete || function () { },
	};
};

AnimateGUIObject.getTask = function (raw, type, GUIObject)
{
	let task = { "parameters": {} };
	let identity = AnimateGUIObject.types[type];
	let original = identity.get(GUIObject);

	for (let parameter of identity.parameters) if (parameter in raw)
	{
		let start = original[parameter];
		let end = raw[parameter];
		task.parameters[parameter] = x => start + x * (end - start);
	}

	task.calc = x =>
	{
		let object = identity.get(GUIObject);
		for (let parameter in task.parameters)
			object[parameter] = task.parameters[parameter](x);
		identity.set(GUIObject, object);
	}

	return task;
};

AnimateGUIObject.getTasks = function (raw, GUIObject)
{
	let tasks = {};
	for (let type in AnimateGUIObject.types) if (type in raw)
		tasks[type] = AnimateGUIObject.getTask(raw[type], type, GUIObject)

	return tasks;
};

AnimateGUIObject.setValues = function (values, GUIObject)
{
	for (let type in values)
	{
		let object = AnimateGUIObject.types[type].get(GUIObject);
		for (let parameter in values[type])
			object[parameter] = values[type][parameter];
		AnimateGUIObject.types[type].set(GUIObject, object);
	}
};

AnimateGUIObject.prototype.run = function (time)
{
	while (this.stage && this.stage(time))
		this.stage = this.stages.shift();

	return this;
};

AnimateGUIObject.prototype.hasRemainingStages = function ()
{
	return !!this.stage;
};

AnimateGUIObject.prototype.stageInit = function (time)
{
	this.data.start = time + this.data.delay;
	this.data.end = this.data.start + this.data.duration;

	return true;
};

AnimateGUIObject.prototype.stageDelay = function (time)
{
	return time >= this.data.start;
};

AnimateGUIObject.prototype.stageStart = function (time)
{
	AnimateGUIObject.setValues(this.startValues, this.GUIObject);
	// delete this.startValues;
	this.actions.onStart(this.GUIObject, this);
	this.tasks = AnimateGUIObject.getTasks(this.endValues, this.GUIObject);
	// delete this.endValues;

	return true;
};

AnimateGUIObject.prototype.stageTick = function (time)
{
	let running = time < this.data.end;
	let unitary = running ? (time - this.data.start) / this.data.duration : 1;
	let x = this.data.curve(unitary);

	if (!this.noTasksUpdate) for (let type in this.tasks)
		this.tasks[type].calc(x);

	this.actions.onTick(this.GUIObject, this);

	return !running;
};

AnimateGUIObject.prototype.stageComplete = function (time)
{
	this.actions.onComplete(this.GUIObject, this);

	return true;
};

/**
 * Checks if the animation has any task that still modifies the GUIObject.
 */
AnimateGUIObject.prototype.isAlive = function ()
{
	return !!Object.keys(this.tasks).length;
};

/**
 * Removes types/tasks that the old animation has with the new animation.
 */
AnimateGUIObject.prototype.removeIntersections = function (newAnimation)
{
	for (let type in this.tasks) if (type in newAnimation.endValues)
		this.removeValueIntersections(newAnimation, type);

	return this;
};

AnimateGUIObject.prototype.removeValueIntersections = function (newAnimation, type)
{
	for (let parameter in this.tasks[type])
		if (parameter in newAnimation.endValues[type])
			delete this.tasks[type][parameter];

	if (!Object.keys(this.tasks[type]).length)
		delete this.tasks[type];
};

/**
 * Jump to the end of the animation.
 * onStart/onTick/onComplete behaviour doesn't change.
 * @param {Boolean} noTasksUpdate Ends animations witout updating tasks.
 */
AnimateGUIObject.prototype.complete = function (noTasksUpdate = false)
{
	this.noTasksUpdate = noTasksUpdate;
	this.data.end = Date.now();

	return this;
};

function GUIObjectSet(object, settings)
{
	let values = AnimateGUIObject.getValues(settings);
	const GUIObject = typeof object == "string" ? Engine.GetGUIObjectByName(object) : object;
	AnimateGUIObject.setValues(values, GUIObject);

	return GUIObject;
}
