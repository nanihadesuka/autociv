"use strict";
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
var GridBrowser = /** @class */ (function () {
    function GridBrowser(containerName, pageCounterName, list, childWidth, childHeight, childFunction) {
        if (pageCounterName === void 0) { pageCounterName = ""; }
        if (childFunction === void 0) { childFunction = function () { }; }
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
    GridBrowser.prototype.clamp = function (value, min, max) {
        return Math.max(Math.min(value, max), min);
    };
    GridBrowser.prototype.clampIndex = function (index) {
        return this.clamp(index, -1, this._list.length);
    };
    GridBrowser.prototype.goToPageOfIndex = function (index) {
        this.goToPage(this.getPageOfIndex(this.clampIndex(index)));
        return this;
    };
    GridBrowser.prototype.goToPageOfSelected = function () {
        this.goToPageOfIndex(this.selectedIndex);
        return this;
    };
    GridBrowser.prototype.goToPage = function (pageNumber) {
        this.currentPage = this.clamp(pageNumber, 0, this.getNumOfPages());
        if (this.pageCounter)
            this.pageCounter.caption = this.currentPage + 1 + "/" + Math.max(1, this.getNumOfPages());
        var offset = this.currentPage * this.getBoxesPerPage();
        var maxVisible = this.clamp(this.getBoxesPerPage(), 0, this._list.length - offset);
        for (var i = 0; i < maxVisible; ++i) {
            this.children[i].hidden = false;
            this.childFunction(this.children[i], i, this._list[offset + i], offset + i);
        }
        for (var i = maxVisible; i < this.children.length; ++i) {
            if (this.children[i].hidden)
                break;
            this.children[i].hidden = true;
        }
        return this;
    };
    GridBrowser.prototype.getPageOfIndex = function (index) {
        return Math.max(0, Math.floor(this.clampIndex(index) / this.getBoxesPerPage()));
    };
    GridBrowser.prototype.getBoxesPerPage = function () {
        return this.clamp(this.nColumns * this.nRows, 1, this.children.length);
    };
    GridBrowser.prototype.getNumOfPages = function () {
        return Math.ceil(this._list.length / this.getBoxesPerPage());
    };
    GridBrowser.prototype.getChildOfIndex = function (index) {
        return this.children[this.clampIndex(index) % this.getBoxesPerPage()];
    };
    Object.defineProperty(GridBrowser.prototype, "list", {
        get: function () {
            return this._list;
        },
        set: function (list) {
            this.setList(list);
        },
        enumerable: true,
        configurable: true
    });
    GridBrowser.prototype.setList = function (list) {
        this._list = list;
        this.goToPage(0);
        return this;
    };
    GridBrowser.prototype.setSelectedIndex = function (index) {
        this.selectedIndex = this.clampIndex(index);
        return this;
    };
    GridBrowser.prototype.setChildDimensions = function (width, height) {
        var isSelectedInPage = this.selectedIndex != -1 &&
            this.getPageOfIndex(this.selectedIndex) == this.currentPage;
        var firstChildIndex = this.currentPage * this.getBoxesPerPage();
        this.childWidth = width;
        this.childHeight = height;
        this.generateGrid();
        if (isSelectedInPage)
            this.goToPageOfSelected();
        else
            this.goToPage(this.getPageOfIndex(firstChildIndex));
        return this;
    };
    GridBrowser.prototype.generateGrid = function () {
        // Update number of columns and rows
        var rect = this.container.getComputedSize();
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        this.nColumns = Math.max(1, Math.floor(width / this.childWidth));
        this.nRows = Math.max(1, Math.floor(height / this.childHeight));
        var xCenter = this.childWidth * this.nColumns / 2;
        // let yCenter = this.childHeight * this.nRows / 2;
        // Update child position, dimensions
        for (var i = 0; i < this.children.length; ++i) {
            var x = i % this.nColumns;
            var y = Math.floor(i / this.nColumns);
            var sizeChild = this.children[i].size;
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
    };
    GridBrowser.prototype.nextPage = function () {
        this.goToPage((this.currentPage + 1) % this.getNumOfPages());
        return this;
    };
    GridBrowser.prototype.previousPage = function () {
        this.goToPage((this.currentPage + this.getNumOfPages() - 1) % this.getNumOfPages());
        return this;
    };
    return GridBrowser;
}());
