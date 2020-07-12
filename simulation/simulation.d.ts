declare namespace Engine
{
	// ProfileStart
	// ProfileStop
	// ProfileAttribute
	// ListDirectoryFiles
	function FileExists(filePath: string): boolean;
	function ReadJSONFile(filePath: string): object;
	// RegisterComponentType
	// RegisterSystemComponentType
	// ReRegisterComponentType
	// RegisterInterface
	// RegisterMessageType
	// RegisterGlobal
	// QueryInterface
	// GetEntitiesWithInterface
	// GetComponentsWithInterface
	// PostMessage
	// BroadcastMessage
	// AddEntity
	// AddLocalEntity
	// DestroyEntity
	// FlushDestroyedEntities
}

declare function warn(text: string | number): void
declare function error(text: string | number): void
