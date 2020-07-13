declare namespace Engine
{
	function ProfileStart(name: string): undefined;
	function ProfileStop(): undefined;
	function ProfileAttribute(name: string): undefined;

	/**
	 * Return an array of pathname strings, one for each matching entry
	 * in the specified directory.
	 * @param path - Relative path
	 * @param filterStr - [=""] - String match; see vfs_next_dirent
	 * @param recurse - [=false] - Subdirectories be included in the search
	 */
	function ListDirectoryFiles(path: string, filterStr?: string, recurse?: boolean): string[];

	/**
	 * Return true if the file exits
	 */
	function FileExists(filePath: string): boolean;

	function ReadJSONFile(filePath: string): object | null;
}

/**
 * Prints to stdout if in debug mode
 */
declare function print(...text: string[]): undefined;

declare function log(text: string): undefined;
declare function warn(text: string): undefined;
declare function error(text: string): undefined;

/**
 * Deep copy
 */
declare function clone(data: any): any | undefined;

declare function deepfreeze(object: object): object | undefined;
