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

// initializer, list is each childen data
class GridBrowser {

	// GUI object container of the children
	container: GUIObject;
	// GUI object type="text" for the numbering of each page
	pageCounter: GUIObject;
	// list of direct GUI objects of the container
	children: GUIObject[];
	childFunction: Function;
	childWidth: number;
	childHeight: number;
	list: Array<any>;
	selectedIndex: number;
	currentPage: number;
	nColumns: number;
	nRows: number;

	constructor(containerName: string, pageCounterName: string, list: Array<any>, childWidth: number, childHeight: number, childFunction: Function) {
		this.container = Engine.GetGUIObjectByName(containerName);
		this.pageCounter = Engine.GetGUIObjectByName(pageCounterName);
		this.children = this.container.children;
		this.childFunction = childFunction.bind(this);
		this.childWidth = childWidth;
		this.childHeight = childHeight;
		this.list = list;
		this.selectedIndex = -1;
		this.currentPage = 0;
		this.nColumns = 0;
		this.nRows = 0;

		this._generateGrid(true);
	}

	goToPageOfSelected(): void {
		this.goToPage(this.getPageOfIndex(this.selectedIndex));
	}

	goToPage(pageNumber: number): void {

		this.currentPage = pageNumber;
		this.pageCounter.caption = `${this.currentPage + 1}/${Math.max(1, this.getNumOfPages())}`;

		let offset = this.currentPage * this.getBoxesPerPage();
		let maxBoxes = this.getBoxesPerPage();
		for (let i = 0; i < this.children.length; ++i) {
			if (offset + i >= this.list.length || i >= maxBoxes) {
				this.children[i].hidden = true;
				continue;
			}
			this.children[i].hidden = false;
			this.childFunction(this.children[i], i, this.list[offset + i], offset + i);
		}
	};

	getPageOfIndex(index: number): number {
		return Math.floor(index / this.getBoxesPerPage());
	};

	getBoxesPerPage(): number {
		return Math.min(this.nColumns * this.nRows, this.children.length);
	};

	getNumOfPages(): number {
		return Math.ceil(this.list.length / this.getBoxesPerPage());
	};

	setList(list: Array<any>): void {
		this.list = list;
		this.goToPage(0);
	};

	setChildDimensions(width: number, height: number): void {
		let isSelectedInPage = this.selectedIndex != -1 &&
			this.getPageOfIndex(this.selectedIndex) == this.currentPage;
		let firstChildIndex = this.currentPage * this.getBoxesPerPage();
		this.childWidth = width;
		this.childHeight = height;
		this._generateGrid(false);
		if (isSelectedInPage)
			this.goToPageOfSelected();
		else
			this.goToPage(this.getPageOfIndex(firstChildIndex));
	};

	generateGrid(): void {
		this._generateGrid(false);
		this.goToPage(this.getPageOfIndex(this.selectedIndex));
	};

	_generateGrid(noAnimation: boolean): void {
		// Update number of columns and rows
		let rect = this.container.getComputedSize();
		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;

		this.nColumns = Math.max(1, Math.floor(rect.width / this.childWidth));
		this.nRows = Math.max(1, Math.floor(rect.height / this.childHeight));
		let xCenter = this.childWidth * this.nColumns / 2;
		// let yCenter = this.childHeight * this.nRows / 2;

		// Update child position, dimensions
		for (let i = 0; i < this.children.length; ++i) {
			let x = i % this.nColumns;
			let y = Math.floor(i / this.nColumns);
			//@ts-ignore
			animate(this.children[i]).add({
				"size":
				{
					"left": this.childWidth * x - xCenter,
					"right": this.childWidth * (x + 1) - xCenter,
					"top": this.childHeight * y,
					"bottom": this.childHeight * (y + 1),
					"rleft": 50,
					"rright": 50,
					"rtop": 0,
					"rbottom": 0
				},
				"duration": noAnimation ? 0 : 0
			});
		}
	};

	nextPage(): void {
		if (this.getNumOfPages())
			this.goToPage((this.currentPage + 1) % this.getNumOfPages());
	};

	previousPage(): void {
		if (this.getNumOfPages())
			this.goToPage((this.currentPage + this.getNumOfPages() - 1) % this.getNumOfPages());
	};
};
