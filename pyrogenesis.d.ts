declare namespace Engine
{
	// ProfileStart
	// ProfileStop
	// ProfileAttribute
	// ConfigDB_HasChanges
	// ConfigDB_SetChanges
	function ConfigDB_GetValue(config: string, key: string): string
	function ConfigDB_CreateValue(configSpace: string, key: string, value: string): boolean;
	function ConfigDB_RemoveValue(config: string, key: string): void
	// ConfigDB_WriteFile
	function ConfigDB_WriteValueToFile(configSpace: string, key: string, value: string, configFile: string): void;
	// ConfigDB_SetFile
	// ConfigDB_Reload
	// Console_GetVisibleEnabled
	// Console_SetVisibleEnabled
	function GetMicroseconds(): number
	// Crash
	// DebugWarn
	// DisplayErrorDialog
	// GetBuildTimestamp
	// PushGuiPage
	// SwitchGuiPage
	// PopGuiPage
	// PopGuiPageCB
	function GetGUIObjectByName(name: string): GUIObject
	// SetCursor
	// ResetCursor
	// TemplateExists
	// GetTemplate
	// StartGame
	// EndGame
	// GetPlayerID
	// SetPlayerID
	// SetViewedPlayer
	// GetSimRate
	// SetSimRate
	// IsPaused
	// SetPaused
	// IsVisualReplay
	// GetCurrentReplayDirectory
	// EnableTimeWarpRecording
	// RewindTimeWarp
	// DumpTerrainMipmap
	// GameView_GetCullingEnabled
	// GameView_SetCullingEnabled
	// GameView_GetLockCullCameraEnabled
	// GameView_SetLockCullCameraEnabled
	// GameView_GetConstrainCameraEnabled
	// GameView_SetConstrainCameraEnabled
	// CameraGetX
	// CameraGetZ
	// CameraMoveTo
	// SetCameraTarget
	// SetCameraData
	// CameraFollow
	// CameraFollowFPS
	// GetFollowedEntity
	// GetTerrainAtScreenPoint
	// Translate
	// TranslateWithContext
	// TranslatePlural
	// TranslatePluralWithContext
	// TranslateLines
	// TranslateArray
	// FormatMillisecondsIntoDateStringLocal
	// FormatMillisecondsIntoDateStringGMT
	// FormatDecimalNumberIntoString
	// GetSupportedLocaleBaseNames
	// GetSupportedLocaleDisplayNames
	// GetCurrentLocale
	// GetAllLocales
	// GetDictionaryLocale
	// GetDictionariesForLocale
	// UseLongStrings
	// GetLocaleLanguage
	// GetLocaleBaseName
	// GetLocaleCountry
	// GetLocaleScript
	// GetFallbackToAvailableDictLocale
	// ValidateLocale
	// SaveLocale
	// ReevaluateCurrentLocaleAndReload
	// HasXmppClient
	// IsRankedGame
	// SetRankedGame
	// StartXmppClient
	// StartRegisterXmppClient
	// StopXmppClient
	// ConnectXmppClient
	// DisconnectXmppClient
	// IsXmppClientConnected
	// SendGetBoardList
	// SendGetProfile
	// SendRegisterGame
	// SendGameReport
	// SendUnregisterGame
	// SendChangeStateGame
	// GetPlayerList
	// LobbyClearPresenceUpdates
	// GetGameList
	// GetBoardList
	// GetProfile
	// LobbyGuiPollNewMessage
	// LobbyGuiPollHistoricMessages
	// LobbySendMessage
	// LobbySetPlayerPresence
	// LobbySetNick
	// LobbyGetNick
	// LobbyKick
	// LobbyBan
	// LobbyGetPlayerPresence
	// LobbyGetPlayerRole
	// EncryptPassword
	// LobbyGetRoomSubject
	// Exit
	// RestartInAtlas
	// AtlasIsAvailable
	// IsAtlasRunning
	function OpenURL(url: string): string
	// GetSystemUsername
	// GetMatchID
	// LoadMapSettings
	// HotkeyIsPressed
	// GetFPS
	// GetTextWidth
	// CalculateMD5
	// GetEngineInfo
	// GetAvailableMods
	// RestartEngine
	// SetMods
	// ModIoStartGetGameId
	// ModIoStartListMods
	// ModIoStartDownloadMod
	// ModIoAdvanceRequest
	// ModIoCancelRequest
	// ModIoGetMods
	// ModIoGetDownloadProgress
	// GetDefaultPort
	// HasNetServer
	// HasNetClient
	// FindStunEndpoint
	// StartNetworkHost
	// StartNetworkJoin
	// DisconnectNetworkGame
	// GetPlayerGUID
	// PollNetworkClient
	// SetNetworkGameAttributes
	// AssignNetworkPlayer
	// KickPlayer
	// SendNetworkChat
	// SendNetworkReady
	// ClearAllPlayerReady
	// StartNetworkGame
	// SetTurnLength
	// Renderer_GetRenderPath
	// Renderer_SetRenderPath
	// Renderer_RecreateShadowMap
	// TextureExists
	// Renderer_GetShadowsEnabled
	// Renderer_SetShadowsEnabled
	// Renderer_GetShadowPCFEnabled
	// Renderer_SetShadowPCFEnabled
	// Renderer_GetParticlesEnabled
	// Renderer_SetParticlesEnabled
	// Renderer_GetPreferGLSLEnabled
	// Renderer_SetPreferGLSLEnabled
	// Renderer_GetWaterEffectsEnabled
	// Renderer_SetWaterEffectsEnabled
	// Renderer_GetWaterFancyEffectsEnabled
	// Renderer_SetWaterFancyEffectsEnabled
	// Renderer_GetWaterRealDepthEnabled
	// Renderer_SetWaterRealDepthEnabled
	// Renderer_GetWaterReflectionEnabled
	// Renderer_SetWaterReflectionEnabled
	// Renderer_GetWaterRefractionEnabled
	// Renderer_SetWaterRefractionEnabled
	// Renderer_GetWaterShadowsEnabled
	// Renderer_SetWaterShadowsEnabled
	// Renderer_GetFogEnabled
	// Renderer_SetFogEnabled
	// Renderer_GetSilhouettesEnabled
	// Renderer_SetSilhouettesEnabled
	// Renderer_GetShowSkyEnabled
	// Renderer_SetShowSkyEnabled
	// Renderer_GetSmoothLOSEnabled
	// Renderer_SetSmoothLOSEnabled
	// Renderer_GetPostprocEnabled
	// Renderer_SetPostprocEnabled
	// Renderer_GetDisplayFrustumEnabled
	// Renderer_SetDisplayFrustumEnabled
	// GetSavedGames
	// DeleteSavedGame
	// SaveGame
	// SaveGamePrefix
	// QuickSave
	// QuickLoad
	// StartSavedGame
	// GetInitAttributes
	// GuiInterfaceCall
	// PostNetworkCommand
	// DumpSimState
	// GetAIs
	// PickEntityAtPoint
	// PickPlayerEntitiesInRect
	// PickPlayerEntitiesOnScreen
	// PickNonGaiaEntitiesOnScreen
	// PickSimilarPlayerEntities
	// SetBoundingBoxDebugOverlay
	// StartMusic
	// StopMusic
	// ClearPlaylist
	// AddPlaylistItem
	// StartPlaylist
	// PlayMusic
	// PlayUISound
	// PlayAmbientSound
	// MusicPlaying
	// SetMasterGain
	// SetMusicGain
	// SetAmbientGain
	// SetActionGain
	// SetUIGain
	// IsUserReportEnabled
	// SetUserReportEnabled
	// GetUserReportStatus
	// GetUserReportLogPath
	// GetUserReportConfigPath
	// ListDirectoryFiles
	function FileExists(filePath: string): boolean;
	// GetFileMTime
	// GetFileSize
	// ReadFile
	// ReadFileLines
	function ReadJSONFile(filePath: string): object;
	function WriteJSONFile(filePath: string, JSONObject: object): void;
	// GetReplays
	// DeleteReplay
	// StartVisualReplay
	// GetReplayAttributes
	// GetReplayMetadata
	// HasReplayMetadata
	// AddReplayToCache
	// GetReplayDirectoryName
}

declare class GUIObject
{
	hidden: boolean
	caption: string
	children: GUIObject[]
	size: GUISize
	getComputedSize(): GUISize
}

declare enum GUISizeSide
{
	left = "left",
	right = "right",
	top = "top",
	bottom = "bottom",
	rleft = "rleft",
	rright = "rright",
	rtop = "rtop",
	rbottom = "rbottom"
}

declare class GUISize
{
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
