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
 *   "scenario": ....
 * }
 */
var g_Maps = {
    "types": arrayToKeys(g_Settings_for_MapBrowser.MapTypes, "Name"),
    "filters": arrayToKeys(g_Settings_for_MapBrowser.MapFilters, "id"),
    "byType": {}
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

var g_TickCount = 0;

/**
 * Stores what is the current selected map if any
 */
var g_MapSelected = {
    "set": selectedListIndex =>
    {
        g_MapBrowser.setIndexOfSelected(selectedListIndex);
        if (selectedListIndex == -1)
            return;

        let map = g_MapBrowser.list[selectedListIndex];
        if (!map)
            return;

        let isSameMap = !g_MapSelected.map ?
            false :
            g_MapSelected.map.name == map.name;

        g_MapSelected.map = map;
        g_MapSelected.filter = getFilter();
        if (isSameMap)
            return;

        kinetic("previewSelectedOverlay").chain(
            g_AnimationSettings.previewSelectedOverlay.chain,
            g_AnimationSettings.previewSelectedOverlay.shared
        );

        kinetic("descriptionSelected").chain(
            g_AnimationSettings.descriptionSelected.chain,
            g_AnimationSettings.descriptionSelected.shared
        );
    }
};

/**
 *  Stores zoom in/out functions and level of zoom
 */
var g_MapZoom = {
    "originalSize": { "width": 400, "height": 300 },
    "levels": [0.35, 0.40, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.4, 2.9],
    "levelsIndexSelected": 5,
    "getSize": () =>
    {
        let level = g_MapZoom.levels[g_MapZoom.levelsIndexSelected];
        return {
            "width": g_MapZoom.originalSize.width * level,
            "height": g_MapZoom.originalSize.height * level
        };
    },
    "zoom": step =>
    {
        // step > 0 makes previews bigger
        let newIndex = Math.min(
            Math.max(g_MapZoom.levelsIndexSelected + step, 0),
            g_MapZoom.levels.length - 1
        );

        if (newIndex == g_MapZoom.levelsIndexSelected)
            return;

        g_MapZoom.levelsIndexSelected = newIndex;
        g_MapBrowser.setChildDimensions(g_MapZoom.getSize());
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
        "onWindowResized": () => g_MapBrowser.generateGrid(),
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

            g_MapSelected.set(0);
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
        "onSelectionChange": () =>
        {
            if (!getType() || !getFilter())
                return;

            g_MapBrowser.setList(g_Maps.byType[getType()][getFilter()]);
            g_MapBrowser.goToPage(0);
        }
    },
    "mapFilterDropdown":
    {
        "list": Object.keys(g_Maps.filters).map(filter => g_Maps.filters[filter].name),
        "list_data": Object.keys(g_Maps.filters),
        "onSelectionChange": () =>
        {
            if (!getType() || !getFilter())
                return;

            g_MapBrowser.setList(g_Maps.byType[getType()][getFilter()]);
            g_MapBrowser.goToPage(0);
        }
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
    initData(type, filter);
    initGUIObjects(data, type, filter);
    initActions();
}

function initData()
{
    for (let mapType in g_Maps.types)
        g_Maps.byType[mapType] = getMapsByFilter(getMapsOfType(mapType));
}

function initGUIObjects(data, type, filter)
{
    let mapList = g_Maps.byType[type][filter];
    //"random" is not a map. Map name from gamesetup has path included
    let fullMapName = (data && data.map && data.map.name != "random") ?
        data.map.name :
        mapList[0].file.path + mapList[0].file.name;

    let mapListSelectedIndex = mapList.
        map(map => map.file.path + map.file.name).
        indexOf(fullMapName);

    g_MapBrowser = new GridBrowser(
        "MapBrowserContainer",
        "currentPageNum",
        mapList,
        mapListSelectedIndex,
        g_MapZoom.getSize(),
        childFunction
    );

    // Define normal objects
    for (let objectName in g_GUIObjects)
        for (let parameter in g_GUIObjects[objectName])
            Engine.GetGUIObjectByName(objectName)[parameter] = g_GUIObjects[objectName][parameter];

    // Needs to be set after the other data has been defined.
    Engine.GetGUIObjectByName("mapTypeDropdown").selected = g_GUIObjects.mapTypeDropdown.list_data.indexOf(type);
    Engine.GetGUIObjectByName("mapFilterDropdown").selected = g_GUIObjects.mapFilterDropdown.list_data.indexOf(filter);
}

function initActions()
{
    // Simulate a click from mouse
    if (g_MapBrowser.getPageIndexOfSelected() != -1)
        g_MapBrowser.
            children[g_MapBrowser.getPageIndexOfSelected()].
            onMouseLeftPress();

    Engine.GetGUIObjectByName("mapsSearchBox").focus();
}

/**
 * Handles the behaviour of each map preview in the map browser grid
 * All parameters are feeded to the each child that is is shown in the grid
 * @param {Object} map
 * @param {Number} pageIndex
 * @param {List} pageList
 * @param {Number} listIndex
 * @param {List} list
 * @param {List} selectedChild Helper list that can store flags of each children, in this case is used to know the selected state of each child
 * @param {Object} childObject
 * @param {List} pageChildObjectList
 * @param {List} childObjectList
 */
function childFunction(map, pageIndex, pageList, listIndex, list, selectedChild, childObject, pageChildObjectList, childObjectList)
{
    let getObject = (name, index) =>
    {
        return Engine.GetGUIObjectByName(name + "[" + (index === undefined ? pageIndex : index) + "]")
    };
    let mapPreview = getObject("mapPreview");
    let mapButton = getObject("mapButton");
    let mapBox = getObject("mapBox");
    let mapName = getObject("mapName");

    // Outline if this box is the current selected map otherwise remove outline
    selectedChild[pageIndex] = !g_MapSelected.map ?
        false :
        g_MapSelected.map.file.name == map.file.name;

    kinetic(mapButton).add(selectedChild[pageIndex] ?
        g_AnimationSettings.childButton.selected :
        g_AnimationSettings.childButton.unselected
    );

    mapName.caption = map.name;
    mapPreview.sprite = map.preview;
    childObject.tooltip = map.description;
    childObject.onMouseLeftPress = () =>
    {
        g_MapSelected.set(listIndex);
        // Unselect others
        for (let i = 0; i < selectedChild.length; ++i)
        {
            if (i == pageIndex || selectedChild[i] == 0)
                continue;
            kinetic(getObject("mapButton", i)).
                add(g_AnimationSettings.childButton.unselected);
            selectedChild[i] = false;
        }
        selectedChild[pageIndex] = true;
        kinetic(mapButton).add(g_AnimationSettings.childButton.selected);
        kinetic(mapPreview).add(g_AnimationSettings.childPreview.press);

    };
    childObject.onMouseLeftRelease = () =>
    {
        kinetic(mapPreview).add(g_AnimationSettings.childPreview.release);
    };
    childObject.onMouseLeftDoubleClick = () =>
    {
        g_MapSelected.set(listIndex);
        mapBrowserReturn(true);
    };
    childObject.onMouseEnter = () =>
    {
        kinetic(mapBox).add(g_AnimationSettings.childMap.enter);
    };
    childObject.onMouseLeave = () =>
    {
        kinetic(mapBox).add(g_AnimationSettings.childMap.leave);
    };
    childObject.onMouseWheelUp = () =>
    {
        g_MapZoom.zoom(1);
    };
    childObject.onMouseWheelDown = () =>
    {
        g_MapZoom.zoom(-1);
    };
};

/**
 * Uses one element of the object as key to make a dictionary
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

/**
 * Returns a list of MapData objects of all maps of given type
 */
function getMapsOfType(type)
{
    if (!g_Maps.types[type])
        return [];
    return listFiles(g_Maps.types[type].Path, g_Maps.types[type].Extension, false).
        filter(fileName => !fileName.startsWith("_")).
        map(fileName => new MapData(fileName, type));
};

/**
 * Returns a dictionary: each key is the filter with its corresponding map list
 * mapList is a list of MapData objects
 */
function getMapsByFilter(mapList)
{
    let mapsFiltered = {};
    for (let filter in g_Maps.filters)
        mapsFiltered[filter] = mapList.filter(map => g_Maps.filters[filter].filter(map.filter));
    return mapsFiltered;
};

function getType()
{
    let mapTypeDropdown = Engine.GetGUIObjectByName("mapTypeDropdown");
    if (mapTypeDropdown.selected == -1)
        return;
    return mapTypeDropdown.list_data[mapTypeDropdown.selected];
}

function getFilter()
{
    let mapFilterDropdown = Engine.GetGUIObjectByName("mapFilterDropdown");
    if (mapFilterDropdown.selected == -1)
        return;
    return mapFilterDropdown.list_data[mapFilterDropdown.selected];
}

function MapsSearchBoxInput(inputObjectName, inputObjectNameNotice)
{
    this.lastTime = Date.now();
    this.refresh = 100;
    this.lastCaption = "";
    this.mapsSearchBox = Engine.GetGUIObjectByName(inputObjectName);
    this.mapsSearchBox.caption = "";
    this.mapsSearchBoxNotice = Engine.GetGUIObjectByName(inputObjectNameNotice);
}

MapsSearchBoxInput.prototype.onTick = function ()
{
    let time = Date.now();
    if (this.lastTime + this.refresh > time)
        return;

    let caption = this.mapsSearchBox.caption.trim().toLowerCase();
    if (caption == this.lastCaption)
        return;

    if ((this.lastCaption && !caption) || (!this.lastCaption && caption))
        kinetic(this.mapsSearchBoxNotice).
            add({ "textcolor": { "a": !caption ? "1" : "0" } });

    if (!caption)
    {
        // Normal map list filtered by type and filter
        g_MapBrowser.setList(g_Maps.byType[getType()][getFilter()]);
    }
    else
    {
        let mapFilter = getFilter();
        // List of all maps with current filter
        let allListFilter = [];
        for (let type in g_Maps.types)
            if (g_Maps.byType[type][mapFilter] !== undefined)
                allListFilter = [...allListFilter, ...g_Maps.byType[type][mapFilter]];

        let mapsMatch = fuzzysort.go(caption, allListFilter, {
            key: 'name',
            allowTypo: true,
            threshold: -10000
        }).map(result => result.obj);

        g_MapBrowser.setList(mapsMatch);
    }
    g_MapBrowser.goToPage(0);

    this.lastCaption = caption;
    this.lastTime = time;
}

function mapBrowserReturn(sendSelected)
{
    /**
     * Pop the page before calling the callback so the
     * callback runs in the parent GUI page's context.
     */

    autocivCL.Engine.PopGUIPage(sendSelected && !!g_MapSelected.map ? {
        "map":
        {
            "path": g_MapSelected.map.file.path,
            "name": g_MapSelected.map.file.name,
            "type": g_MapSelected.map.type,
            "filter": g_MapSelected.filter
        }
    } : {}, true);
}

function onTick()
{
    /**
     * Hack so it doesn't process the last keyboard event
     * from parent page in the child page (e.g hotkey, enter).
     */
    switch (g_TickCount)
    {
        case 0:
            break;
        case 1:
            g_MapsSearchBoxInput = new MapsSearchBoxInput("mapsSearchBox", "mapsSearchBoxNotice");
            break;
        default:
            g_MapsSearchBoxInput.onTick();
    }

    ++g_TickCount;
}
