"use strict";
/**
 * Function that arranges a list of "boxed-like" GUI objects with width-centering
 * (currently) and page based way mode.
 *
 * Needs an object as container with childrens and a object to display the page numbering (if not
 * make hidden object and assign it to it).
 *
 * To add advanced, more detailed, objects inside each box add a custom childFunction:
 * childFunction(page_list_element, page_list_element_index, page_list,
 * global_list_element_index, global_list,child_object).
 *
 * For example look at mapbrowser.js and mapbrowser.xml implementation.
 */
var GridBrowser = /** @class */ (function () {
    function GridBrowser(containerName, pageCounterName, list, childWidth, childHeight, childFunction) {
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
    }
    GridBrowser.prototype.goToPageOfSelected = function () {
        this.goToPage(this.getPageOfIndex(this.selectedIndex));
    };
    GridBrowser.prototype.goToPage = function (pageNumber) {
        this.currentPage = pageNumber;
        this.pageCounter.caption = this.currentPage + 1 + "/" + Math.max(1, this.getNumOfPages());
        var offset = this.currentPage * this.getBoxesPerPage();
        var maxVisible = Math.max(Math.min(this.getBoxesPerPage(), this.list.length - offset), 0);
        for (var i = 0; i < maxVisible; ++i) {
            this.children[i].hidden = false;
            this.childFunction(this.children[i], i, this.list[offset + i], offset + i);
        }
        for (var i = maxVisible; i < this.children.length; ++i) {
            if (this.children[i].hidden)
                break;
            this.children[i].hidden = true;
        }
    };
    ;
    GridBrowser.prototype.getPageOfIndex = function (index) {
        return Math.max(0, Math.floor(index / this.getBoxesPerPage()));
    };
    ;
    GridBrowser.prototype.getBoxesPerPage = function () {
        return Math.max(1, Math.min(this.nColumns * this.nRows, this.children.length));
    };
    ;
    GridBrowser.prototype.getNumOfPages = function () {
        return Math.ceil(this.list.length / this.getBoxesPerPage());
    };
    ;
    GridBrowser.prototype.getChildOfIndex = function (index) {
        return this.children[index % this.getBoxesPerPage()];
    };
    ;
    GridBrowser.prototype.setList = function (list) {
        this.list = list;
        this.goToPage(0);
    };
    ;
    GridBrowser.prototype.setSelectedIndex = function (index) {
        this.selectedIndex = index;
    };
    ;
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
    };
    ;
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
    };
    ;
    GridBrowser.prototype.nextPage = function () {
        if (this.getNumOfPages())
            this.goToPage((this.currentPage + 1) % this.getNumOfPages());
    };
    ;
    GridBrowser.prototype.previousPage = function () {
        if (this.getNumOfPages())
            this.goToPage((this.currentPage + this.getNumOfPages() - 1) % this.getNumOfPages());
    };
    ;
    return GridBrowser;
}());
;
