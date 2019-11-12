declare namespace Engine {
    function GetGUIObjectByName(name: string): GUIObject
    function ConfigDB_GetValue(config: string, key: string): string
    function ConfigDB_RemoveValue(config: string, key: string): void
    function GetMicroseconds(): number
    function OpenURL(url: string): string

    function FileExists(filePath: string): boolean;
    function ReadJSONFile(filePath: string): object;
    function WriteJSONFile(filePath: string, JSONObject: object): void;
    function ConfigDB_CreateValue(configSpace: string, key: string, value: string): boolean;
    function ConfigDB_WriteValueToFile(configSpace: string, key: string, value: string, configFile: string): void;
}

declare class GUIObject {
    hidden: boolean
    caption: string
    children: GUIObject[]
    size: GUISize
    getComputedSize(): GUISize
}

declare enum GUISizeSide {
    left = "left",
    right = "right",
    top = "top",
    bottom = "bottom",
    rleft = "rleft",
    rright = "rright",
    rtop = "rtop",
    rbottom = "rbottom"
}

declare class GUISize {
    [GUISizeSide.left]: number
    [GUISizeSide.right]: number
    [GUISizeSide.top]: number
    [GUISizeSide.bottom]: number
    [GUISizeSide.rleft]: number
    [GUISizeSide.rright]: number
    [GUISizeSide.rtop]: number
    [GUISizeSide.rbottom]: number
    width: number
    height: number
}

declare function setTimeout(callback: Function, time: number): void
declare function saveSettingAndWriteToUserConfig(key: string, value: string): void
declare function warn(text: string | number): void
declare function error(text: string | number): void
