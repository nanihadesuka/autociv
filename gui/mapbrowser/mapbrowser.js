/**
 * @var g_Maps {Object}
 * @var g_Maps.byType {Object}
 * Object with filters by map type from which each
 * map type has an object with maps by filter.
 * {
 *   "random" : {
 *      "default": [new MapData, ...],
 *      "naval": [new MapData, ...],
 *      "new": [new MapData, ...],
 *      "trigger": [new MapData, ...],
 *      "all": [new MapData, ...],
 *      ...
 *   },
 *   "skirmisher": {
 *       "default" : [new MapData, ...],
 *       ....
 *   },
 *   "scenario": ....,
 * }
 */
var g_Maps = {
	"types": arrayToKeys(g_Settings_for_MapBrowser.MapTypes, "Name"),
	"filters": arrayToKeys(g_Settings_for_MapBrowser.MapFilters, "id"),
	"byTypeAndFilter": {}, // Lazy loaded
	"byFilter": {}, // Lazy loaded
	"getMaps": function (type, filter)
	{
		if (!(type in this.types) || !(filter in this.filters))
			return [];

		if (!(type in this.byTypeAndFilter))
			this.byTypeAndFilter[type] = {
				"all": listFiles(this.types[type].Path, this.types[type].Extension, false).
					filter(fileName => !fileName.startsWith("_")).
					map(fileName => new MapData(fileName, type))
			};

		if (!(filter in this.byTypeAndFilter[type]))
			this.byTypeAndFilter[type][filter] = this.byTypeAndFilter[type].all.
				filter(map => this.filters[filter].filter(map.filter));

		return this.byTypeAndFilter[type][filter];
	},
	"getMapsByFilter": function (filter)
	{
		if (!(filter in this.filters))
			return [];

		if (!(filter in this.byFilter))
		{
			this.byFilter[filter] = [];
			for (let type in g_Maps.types)
				this.byFilter[filter].push(...this.getMaps(type, filter));
		}

		return this.byFilter[filter];
	}
};


var g_AnimationSettings = {
	"childButton":
	{
		"selected":
		{
			"color": { "a": 0.4 },
			"size": "4 4 -4 -4",
			"duration": 350
		},
		"unselected":
		{
			"color": { "a": 0 },
			"size": "10 10 -10 -10",
			"duration": 350
		},
	},
	"childPreview":
	{
		"press":
		{
			"size": "3 3 -3 -3",
			"duration": 100
		},
		"release":
		{
			"size": "2 2 -2 -2",
			"duration": 100
		}
	},
	"childMap":
	{
		"enter": { "size": "-10 -10 10 10" },
		"leave": { "size": "0 0 0 0" }
	},
	"previewSelectedOverlay":
	{
		"chain": [
			{
				"color": { "a": 0.6 },
				"onComplete": () =>
				{
					Engine.GetGUIObjectByName("nameSelected").caption = g_MapSelected.map.name;
					Engine.GetGUIObjectByName("previewSelected").sprite = g_MapSelected.map.preview;
				},
			},
			{
				"size": { left: 0 },
				"color": { "a": 0 },
			}
		],
		"shared":
		{
			"queue": true,
			"duration": 200,
			"curve": "easeInOut"
		}
	},
	"descriptionSelected":
	{
		"chain": [
			{
				"textcolor": { "a": 0.5 },
				"onComplete": object => object.caption = g_MapSelected.map.description
			},
			{
				"textcolor": { "a": 1 }
			}
		],
		"shared":
		{
			"queue": true,
			"duration": 100,
			"curve": "easeInOut"
		}
	}
};

/**
 * GridBrowser instance, manages the maps preview grid
 */
var g_MapBrowser;

/**
 * Handles map list search behaviour
 */
var g_MapsSearchBoxInput;

/**
 * Stores what is the current selected map if any
 */
var g_MapSelected = {
	"select": function (map)
	{
		if (!map.file.path || !map.file.name || !map.type)
			return;

		this.filter = currentFilter();
		if (this.map == map)
			return;

		this.selected = true;
		this.map = map;

		animate("previewSelectedOverlay").chain(
			g_AnimationSettings.previewSelectedOverlay.chain,
			g_AnimationSettings.previewSelectedOverlay.shared
		);

		animate("descriptionSelected").chain(
			g_AnimationSettings.descriptionSelected.chain,
			g_AnimationSettings.descriptionSelected.shared
		);
	},
	"unselect": function ()
	{
		this.selected = false;
	},
	"selected": false,
	"map": {}
};

/**
 *  Stores zoom in/out functions and level of zoom
 */
var g_MapZoom = {
	"originalSize": { "width": 400, "height": 300 },
	"scale": 0.6,
	"multiplier": 1.1,
	"getSize": function ()
	{
		return {
			"width": this.originalSize.width * this.scale,
			"height": this.originalSize.height * this.scale
		};
	},
	"zoom": function (step)
	{
		this.scale *= Math.pow(this.multiplier, step)
		this.scale = Math.max(Math.min(this.scale, 2.0), 0.35);
		let size = this.getSize();
		g_MapBrowser.setChildDimensions(size.width, size.height);
	}
};

var g_GUIObjects = {
	"mapsZoomIn":
	{
		"tooltip": translate(setStringTags("\\[" + "MouseWheelUp" + "]", g_HotkeyTags) + ": Make map previews bigger."),
		"onPress": () => g_MapZoom.zoom(1)
	},
	"mapsZoomOut":
	{
		"tooltip": translate(setStringTags("\\[" + "MouseWheelDown" + "]", g_HotkeyTags) + ": Make map previews smaller?"),
		"onPress": () => g_MapZoom.zoom(-1)
	},
	"prevButton":
	{
		"tooltip": colorizeHotkey(translate("%(hotkey)s: Goes to previous page."), "tab.prev"),
		"onPress": () => g_MapBrowser.previousPage()
	},
	"nextButton":
	{
		"tooltip": colorizeHotkey(translate("%(hotkey)s: Goes to next page."), "tab.next"),
		"onPress": () => g_MapBrowser.nextPage()
	},
	"selectMapButton":
	{
		"tooltip": translate("Select map."),
		"onPress": () => mapBrowserReturn(true)
	},
	"closeButton":
	{
		"tooltip": colorizeHotkey(translate("%(hotkey)s: Close map browser."), "cancel"),
		"onPress": () => mapBrowserReturn(false)
	},
	"dialog":
	{
		"onWindowResized": () =>
		{
			g_MapBrowser.generateGrid();
			g_MapBrowser.goToPageOfSelected();
		},
		"onTick": () => onTick(),
		"onMouseWheelUp": () => g_MapZoom.zoom(1),
		"onMouseWheelDown": () => g_MapZoom.zoom(-1)
	},
	"mapsSearchBox":
	{
		"onTab": () => g_MapBrowser.nextPage(),
		"onMouseLeftPress": () =>
		{
			// Makes MapsSearchBoxInput.prototype.onTick process current caption as a new caption
			// as type="input" doesn't have a onFocus event
			if (g_MapsSearchBoxInput)
				g_MapsSearchBoxInput.lastCaption = "";
		},
		"onPress": () =>
		{
			// Select first map if text inputed
			if (!g_MapBrowser.list.length
				|| !g_MapsSearchBoxInput
				|| !g_MapsSearchBoxInput.mapsSearchBox.caption.trim())
				return;

			g_MapBrowser.children[0].onSelect();
			mapBrowserReturn(true);
		}
	},
	"MapBrowserContainer":
	{
		"onMouseWheelUp": () => g_MapZoom.zoom(1),
		"onMouseWheelDown": () => g_MapZoom.zoom(-1)
	},
	"mapTypeDropdown":
	{
		"list": g_Settings_for_MapBrowser.MapTypes.map(type => type.Title),
		"list_data": g_Settings_for_MapBrowser.MapTypes.map(type => type.Name),
		"onSelectionChange": () => g_MapBrowser.setList(g_Maps.getMaps(currentType(), currentFilter()))
	},
	"mapFilterDropdown":
	{
		"list": Object.keys(g_Maps.filters).map(filter => g_Maps.filters[filter].name),
		"list_data": Object.keys(g_Maps.filters),
		"onSelectionChange": () => g_MapBrowser.setList(g_Maps.getMaps(currentType(), currentFilter()))
	}
};

/**
 * @param {Object} data - context data sent by the gamesetup
 */
function init(data)
{
	// Sets map type, filter depending of data input
	let type = data && data.map ? data.map.type : "random";
	let filter = data && data.map ? data.map.filter : "default";
	let mapList = g_Maps.getMaps(type, filter);

	//"random" is not a map. Map name from gamesetup has path included
	let fullMapName = (data && data.map && data.map.name != "random") ?
		data.map.name :
		mapList[0].file.path + mapList[0].file.name;

	let size = g_MapZoom.getSize();
	g_MapBrowser = new GridBrowser(
		"MapBrowserContainer",
		"currentPageNum",
		mapList,
		size.width,
		size.height,
		childFunction
	);
	g_MapBrowser.generateGrid();

	for (let objectName in g_GUIObjects)
		for (let parameter in g_GUIObjects[objectName])
			Engine.GetGUIObjectByName(objectName)[parameter] = g_GUIObjects[objectName][parameter];

	Engine.GetGUIObjectByName("mapTypeDropdown").selected = g_GUIObjects.mapTypeDropdown.list_data.indexOf(type);
	Engine.GetGUIObjectByName("mapFilterDropdown").selected = g_GUIObjects.mapFilterDropdown.list_data.indexOf(filter);

	// Simulate a click for starting map if any
	let selectedIndex = mapList.findIndex(map => map.file.path + map.file.name == fullMapName);
	if (selectedIndex != -1)
	{
		g_MapBrowser.setSelectedIndex(selectedIndex);
		g_MapBrowser.goToPageOfSelected();
		g_MapBrowser.children[selectedIndex % g_MapBrowser.getBoxesPerPage()].onSelect();
	}

	Engine.GetGUIObjectByName("mapsSearchBox").focus();
}

/**
 * Handles the behaviour of each map preview in the map browser grid
 * All parameters are feeded to the each child that is is shown in the grid
 * This function will be binded with the GridBrowser instance.
 * @param {GUIObject} child
 * @param {Number} childIndex
 * @param {Any} data
 * @param {Number} dataIndex
 */
function childFunction(child, childIndex, map, mapIndex)
{
	if (child.onUnselect)
		child.onUnselect();

	let getObject = (name, index = childIndex) => Engine.GetGUIObjectByName(`${name}[${index}]`);
	let mapPreview = getObject("mapPreview");
	let mapButton = getObject("mapButton");
	let mapBox = getObject("mapBox");
	let mapName = getObject("mapName");

	let selected = false;

	child.onMouseLeftPress = () =>
	{
		if (this.selectedChild)
			this.selectedChild.onUnselect();

		g_MapSelected.select(map);
		animate(mapButton).complete().add(g_AnimationSettings.childButton.selected);
		animate(mapPreview).complete().add(g_AnimationSettings.childPreview.press);
		this.selectedChild = child;
		this.setSelectedIndex(mapIndex);
		selected = true;
	};
	child.onUnselect = () =>
	{
		if (!selected)
			return;

		animate(mapButton).complete().add(g_AnimationSettings.childButton.unselected);
		selected = false;
	};
	child.onSelect = child.onMouseLeftPress;
	child.onMouseEnter = () => animate(mapBox).complete().add(g_AnimationSettings.childMap.enter);
	child.onMouseLeave = () => animate(mapBox).complete().add(g_AnimationSettings.childMap.leave);
	child.onMouseWheelUp = () => g_MapZoom.zoom(1);
	child.onMouseWheelDown = () => g_MapZoom.zoom(-1);
	child.onMouseLeftRelease = () => animate(mapPreview).complete().add(g_AnimationSettings.childPreview.release);
	child.onMouseLeftDoubleClick = () => mapBrowserReturn(true);

	if (map == g_MapSelected.map)
		child.onSelect();

	mapName.caption = map.name;
	mapPreview.sprite = map.preview;
	child.tooltip = map.description;
};

/**
 * Uses one element of the array as key to make a dictionary
 * @param {Array} dict
 * @param {String} element
 * @return {Object}
 */
function arrayToKeys(objectsArray, element)
{
	let dict = {};
	for (let object of objectsArray)
	{
		dict[object[element]] = {};
		for (let key in object)
			if (key != element)
				dict[object[element]][key] = object[key];
	}
	return dict;
}

/**
 * Each map has all his data in this object
 */
function MapData(fileName, type)
{
	this.loaded = false;
	this.type = type;
	this.file = {
		"path": g_Maps.types[type].Path,
		"name": fileName,
		"extension": g_Maps.types[type].Extension
	};
	this.load();
}

/**
 * Load data from settings
 */
MapData.prototype.load = function ()
{
	this.data = this.type == "random" ?
		Engine.ReadJSONFile(this.file.path + this.file.name + this.file.extension) :
		Engine.LoadMapSettings(this.file.path + this.file.name);

	let setting = (key, alternative) => this.data && this.data.settings && this.data.settings[key] || alternative;

	let imagePath = "cropped:" + 400 / 512 + "," + 300 / 512 + ":session/icons/mappreview/";

	this.name = translate(setting("Name", "No map name."));
	this.description = translate(setting("Description", "No map description."));
	this.preview = imagePath + setting("Preview", "nopreview.png");
	this.filter = setting("Keywords", ["all"]);
};

function currentType()
{
	let mapTypeDropdown = Engine.GetGUIObjectByName("mapTypeDropdown");
	if (mapTypeDropdown.selected == -1)
		return;
	return mapTypeDropdown.list_data[mapTypeDropdown.selected];
}

function currentFilter()
{
	let mapFilterDropdown = Engine.GetGUIObjectByName("mapFilterDropdown");
	if (mapFilterDropdown.selected == -1)
		return;
	return mapFilterDropdown.list_data[mapFilterDropdown.selected];
}

function MapsSearchBoxInput(inputObjectName, inputObjectNameNotice)
{
	this.lastTime = Date.now();
	this.waitTime = 100; // ms
	this.lastCaption = "";
	this.mapsSearchBox = Engine.GetGUIObjectByName(inputObjectName);
	this.mapsSearchBox.caption = "";
	this.mapsSearchBoxNotice = Engine.GetGUIObjectByName(inputObjectNameNotice);
}

MapsSearchBoxInput.prototype.onTick = function ()
{
	let time = Date.now();
	if (this.lastTime + this.waitTime > time)
		return;

	let caption = this.mapsSearchBox.caption.trim().toLowerCase();
	if (caption == this.lastCaption)
		return;

	if (!this.lastCaption != !caption)
		animate(this.mapsSearchBoxNotice).add({
			"textcolor": { "a": !caption ? "1" : "0" }
		});

	let list = !caption ? g_Maps.getMaps(currentType(), currentFilter()) :
		fuzzysort.go(caption, g_Maps.getMapsByFilter(currentFilter()), {
			key: 'name',
			allowTypo: true,
			threshold: -10000
		}).map(result => result.obj);

	g_MapBrowser.setList(list);
	g_MapBrowser.goToPage(0);

	this.lastCaption = caption;
	this.lastTime = time;
}

function mapBrowserReturn(sendSelected)
{
	if (sendSelected && g_MapSelected.selected)
		autocivCL.Engine.PopGUIPage({
			"map": {
				"path": g_MapSelected.map.file.path,
				"name": g_MapSelected.map.file.name,
				"type": g_MapSelected.map.type,
				"filter": g_MapSelected.filter
			}
		}, true);
	else
		autocivCL.Engine.PopGUIPage({}, true)
}

function onTick()
{
	if (!g_MapsSearchBoxInput)
		g_MapsSearchBoxInput = new MapsSearchBoxInput("mapsSearchBox", "mapsSearchBoxNotice");
	else
		g_MapsSearchBoxInput.onTick();
}
