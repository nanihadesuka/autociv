/**
 * Function that arranges a list of "boxed-like" GUI objects with width-centering
 * (currently) and page based way mode.
 *
 * Needs an object as container and a object to display the page numbering (if not
 * make hidden object and assign it to it).
 *
 * To add advanced, more detailed, objects inside each box add a custom childFunction:
 * childFunction(page_list_element, page_list_element_index, page_list,
 * global_list_element_index, global_list,child_object).
 *
 * For example look at mapbrowser.js / mapbrowser.xml implementation.
 */

interface Dimensions {
	width: number;
	height: number;
}

// initializer, list is each childen data
class GridBrowser {

	// GUI object container of the children
	container: GUIObject;
	// GUI object type="text" for the numbering of each page
	pageCounter: GUIObject;
	// list of GUI objects
	children: GUIObject[];
	// hardcoded in the GUI file, maximum children capable of showing at a time
	numBoxesCreated: number;
	childFunction: Function;
	list: Array<any>;
	selectedIndex: number;
	currentPage: number;
	child: Dimensions;
	// Array to set flag for each child
	helperList: Uint8Array;
	nColumns: number;
	nRows: number;

	constructor(containerName: string, pageCounterName: string, list: Array<any>, selectedIndex: number, childDimensions: Dimensions, childFunction: Function) {
		this.container = Engine.GetGUIObjectByName(containerName);
		this.pageCounter = Engine.GetGUIObjectByName(pageCounterName);
		this.children = this.container.children;
		this.numBoxesCreated = this.children.length;
		this.childFunction = childFunction;
		this.list = list;
		this.selectedIndex = selectedIndex;
		this.child = childDimensions;
		this.helperList = new Uint8Array(this.numBoxesCreated);
		this.currentPage = 0;
		this.nColumns = 0;
		this.nRows = 0;

		this._generateGrid(true);
		this.goToPage(this.getPageOfSelected());
	}

	setIndexOfSelected(index: number): void {
		this.selectedIndex = Math.max(0, Math.min(index, this.list.length - 1));
	};

	goToPage(pageNumber: number): void {
		// Set current page
		this.currentPage = Math.max(0, Math.min(pageNumber, this.getNumOfPages() - 1));

		// Update page counter
		this.pageCounter.caption = (this.getCurrentPage() + 1) + "/" + this.getNumOfPages();

		// Update childs' content (generate page)
		let nubOfBoxesToShow = this.list.length == 0 ?
			0 :
			this.getCurrentPage() == this.getNumOfPages() - 1 ?
				(this.list.length - 1) % this.getMaxNumBoxesInPage() + 1 :
				this.getMaxNumBoxesInPage();

		const startIndex = this.getCurrentPage() * this.getMaxNumBoxesInPage();
		let subList = this.list.slice(startIndex, startIndex + nubOfBoxesToShow);
		let subListChildren = this.children.slice(0, nubOfBoxesToShow);
		for (let i = 0; i < nubOfBoxesToShow; ++i) {
			this.children[i].hidden = false;
			this.childFunction(
				subList[i],
				i,
				subList,
				startIndex + i,
				this.list,
				this.helperList,
				this.children[i],
				subListChildren,
				this.children
			);
		}
		for (let i = nubOfBoxesToShow; i < this.numBoxesCreated; ++i)
			this.children[i].hidden = true;
	};

	getCurrentPage(): number {
		return this.list.length == 0 ? 0 : this.currentPage;
	};

	getPageOfIndex(index: number): number {
		return this.list.length == 0 || index == -1 ?
			0 :
			Math.floor(index / this.getMaxNumBoxesInPage());
	};

	getPageOfSelected(): number {
		return this.getPageOfIndex(this.selectedIndex);
	};

	getPageIndexOfSelected(): number {
		return this.selectedIndex == -1 || this.list.length == 0 ?
			-1 :
			this.selectedIndex % this.getMaxNumBoxesInPage();
	};

	getMaxNumBoxesInPage(): number {
		return Math.min(this.nColumns * this.nRows, this.numBoxesCreated);
	};

	// Update number of pages. Always at least 1 page.
	getNumOfPages(): number {
		return Math.max(1, Math.ceil(this.list.length / this.getMaxNumBoxesInPage()));
	};

	setList(list: Array<any>): void {
		this.list = list;
		this.goToPage(0);
	};

	setChildDimensions(childDimensions: Dimensions): void {
		const inSelectedPage = this.getPageOfSelected() == this.getCurrentPage();
		const firstChildIndex = this.getCurrentPage() * this.getMaxNumBoxesInPage();
		this.child = childDimensions;
		this._generateGrid(false);
		const page = inSelectedPage ?
			this.getPageOfSelected() :
			this.getPageOfIndex(firstChildIndex);
		this.goToPage(page);
	};

	generateGrid(): void {
		this._generateGrid(false);
		this.goToPage(this.getPageOfSelected());
	};

	_generateGrid(noAnimation: boolean): void {
		// Update number of columns and rows
		let rect = this.container.getComputedSize();
		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;

		this.nColumns = Math.max(1, Math.floor(rect.width / this.child.width));
		this.nRows = Math.max(1, Math.floor(rect.height / this.child.height));
		let xCenter = this.child.width * this.nColumns / 2;
		// let yCenter = this.child.height * this.nRows / 2;

		// Update child position, dimensions
		for (let i = 0; i < this.numBoxesCreated; ++i) {
			const x = i % this.nColumns;
			const y = Math.floor(i / this.nColumns);
			//@ts-ignore
			animateObject(
				this.children[i],
				{
					"size":
					{
						"left": this.child.width * x - xCenter,
						"right": this.child.width * (x + 1) - xCenter,
						"top": this.child.height * y,
						"bottom": this.child.height * (y + 1),
						"rleft": 50,
						"rright": 50,
						"rtop": 0,
						"rbottom": 0
					},
					"duration": noAnimation ? 0 : 0
				}
			)
		}
	};

	nextPage(): void {
		this.goToPage((this.getCurrentPage() + 1) % this.getNumOfPages());
	};

	previousPage(): void {
		this.goToPage((this.getCurrentPage() + this.getNumOfPages() - 1) % this.getNumOfPages());
	};
};
