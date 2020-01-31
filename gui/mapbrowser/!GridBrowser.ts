/**
 * Function that arranges a list of "boxed-like" GUI objects with width-centering
 * (currently) and page based mode.
 *
 * Needs an object as container with childrens and a object to display the page numbering (if not
 * make hidden object and assign it to it).
 *
 * To add advanced, more detailed, objects inside each box add a custom childFunction:
 * childFunction(page_list_element, page_list_element_index, page_list,
 * global_list_element_index, global_list,child_object).
 *
 * For example look at mapbrowser.js and mapbrowser.xml implementation.
 *
 * @param {function} [childFunction] - (child, childIndex, listEntry, listIndex)
 */
class GridBrowser {

	// GUI object container of the children
	container: GUIObject;
	// GUI object type="text" for the numbering of each page
	pageCounter: GUIObject | undefined;
	childWidth: number;
	childHeight: number;
	childFunction: Function;
	// GUI object childrens of the container
	children: GUIObject[];
	_list: Array<any>;
	selectedIndex: number;
	currentPage: number;
	nColumns: number;
	nRows: number;

	constructor(containerName: string, pageCounterName: string | undefined = "", list: Array<any>, childWidth: number, childHeight: number, childFunction: Function = () => { }) {
		this.container = Engine.GetGUIObjectByName(containerName);
		this.pageCounter = Engine.GetGUIObjectByName(pageCounterName);
		this.children = this.container.children;
		this.childFunction = childFunction.bind(this);
		this.childWidth = childWidth;
		this.childHeight = childHeight;
		this._list = list;
		this.selectedIndex = -1;
		this.currentPage = 0;
		this.nColumns = 0;
		this.nRows = 0;
	}

	clamp(value: number, min: number, max: number): number {
		return Math.max(Math.min(value, max), min);
	}

	clampIndex(index: number): number {
		return this.clamp(index, -1, this._list.length)
	}

	goToPageOfIndex(index: number): this {
		this.goToPage(this.getPageOfIndex(this.clampIndex(index)))
		return this;
	}

	goToPageOfSelected(): this {
		this.goToPageOfIndex(this.selectedIndex);
		return this;
	}

	goToPage(pageNumber: number): this {
		this.currentPage = this.clamp(pageNumber, 0, this.getNumOfPages());

		if (this.pageCounter)
			this.pageCounter.caption = `${this.currentPage + 1}/${Math.max(1, this.getNumOfPages())}`;

		let offset = this.currentPage * this.getBoxesPerPage();
		let maxVisible = this.clamp(this.getBoxesPerPage(), 0, this._list.length - offset);
		for (let i = 0; i < maxVisible; ++i) {
			this.children[i].hidden = false;
			this.childFunction(this.children[i], i, this._list[offset + i], offset + i);
		}
		for (let i = maxVisible; i < this.children.length; ++i) {
			if (this.children[i].hidden)
				break;
			this.children[i].hidden = true;
		}
		return this;
	}

	getPageOfIndex(index: number): number {
		return Math.max(0, Math.floor(this.clampIndex(index) / this.getBoxesPerPage()));
	}

	getBoxesPerPage(): number {
		return this.clamp(this.nColumns * this.nRows, 1, this.children.length);
	}

	getNumOfPages(): number {
		return Math.ceil(this._list.length / this.getBoxesPerPage());
	}

	getChildOfIndex(index: number): GUIObject {
		return this.children[this.clampIndex(index) % this.getBoxesPerPage()];
	}


	get list() {
		return this._list;
	}

	set list(list) {
		this.setList(list);
	}

	setList(list: Array<any>): this {
		this._list = list;
		this.goToPage(0);
		return this;
	}

	setSelectedIndex(index: number): this {
		this.selectedIndex = this.clampIndex(index);
		return this;
	}

	setChildDimensions(width: number, height: number): this {
		let isSelectedInPage = this.selectedIndex != -1 &&
			this.getPageOfIndex(this.selectedIndex) == this.currentPage;
		let firstChildIndex = this.currentPage * this.getBoxesPerPage();

		this.childWidth = width;
		this.childHeight = height;
		this.generateGrid();

		if (isSelectedInPage)
			this.goToPageOfSelected();
		else
			this.goToPage(this.getPageOfIndex(firstChildIndex));
		return this;
	}

	generateGrid(): this {
		// Update number of columns and rows
		let rect = this.container.getComputedSize();
		let width = rect.right - rect.left;
		let height = rect.bottom - rect.top;

		this.nColumns = Math.max(1, Math.floor(width / this.childWidth));
		this.nRows = Math.max(1, Math.floor(height / this.childHeight));
		let xCenter = this.childWidth * this.nColumns / 2;
		// let yCenter = this.childHeight * this.nRows / 2;

		// Update child position, dimensions
		for (let i = 0; i < this.children.length; ++i) {
			let x = i % this.nColumns;
			let y = Math.floor(i / this.nColumns);
			let sizeChild = this.children[i].size;
			sizeChild.left = this.childWidth * x - xCenter;
			sizeChild.right = this.childWidth * (x + 1) - xCenter;
			sizeChild.top = this.childHeight * y;
			sizeChild.bottom = this.childHeight * (y + 1);
			sizeChild.rleft = 50;
			sizeChild.rright = 50;
			sizeChild.rtop = 0;
			sizeChild.rbottom = 0;
			this.children[i].size = sizeChild;
		}
		return this;
	}

	nextPage(): this {
		this.goToPage((this.currentPage + 1) % this.getNumOfPages());
		return this;
	}

	previousPage(): this {
		this.goToPage((this.currentPage + this.getNumOfPages() - 1) % this.getNumOfPages());
		return this;
	}
}
