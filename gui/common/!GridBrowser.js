"use strict";
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
        this._generateGrid(true);
    }
    GridBrowser.prototype.goToPageOfSelected = function () {
        this.goToPage(this.getPageOfIndex(this.selectedIndex));
    };
    GridBrowser.prototype.goToPage = function (pageNumber) {
        this.currentPage = pageNumber;
        this.pageCounter.caption = this.currentPage + 1 + "/" + Math.max(1, this.getNumOfPages());
        var offset = this.currentPage * this.getBoxesPerPage();
        var maxBoxes = this.getBoxesPerPage();
        for (var i = 0; i < this.children.length; ++i) {
            if (offset + i >= this.list.length || i >= maxBoxes) {
                this.children[i].hidden = true;
                continue;
            }
            this.children[i].hidden = false;
            this.childFunction(this.children[i], i, this.list[offset + i], offset + i);
        }
    };
    ;
    GridBrowser.prototype.getPageOfIndex = function (index) {
        return Math.floor(index / this.getBoxesPerPage());
    };
    ;
    GridBrowser.prototype.getBoxesPerPage = function () {
        return Math.min(this.nColumns * this.nRows, this.children.length);
    };
    ;
    GridBrowser.prototype.getNumOfPages = function () {
        return Math.ceil(this.list.length / this.getBoxesPerPage());
    };
    ;
    GridBrowser.prototype.setList = function (list) {
        this.list = list;
        this.goToPage(0);
    };
    ;
    GridBrowser.prototype.setChildDimensions = function (width, height) {
        var isSelectedInPage = this.selectedIndex != -1 &&
            this.getPageOfIndex(this.selectedIndex) == this.currentPage;
        var firstChildIndex = this.currentPage * this.getBoxesPerPage();
        this.childWidth = width;
        this.childHeight = height;
        this._generateGrid(false);
        if (isSelectedInPage)
            this.goToPageOfSelected();
        else
            this.goToPage(this.getPageOfIndex(firstChildIndex));
    };
    ;
    GridBrowser.prototype.generateGrid = function () {
        this._generateGrid(false);
        this.goToPage(this.getPageOfIndex(this.selectedIndex));
    };
    ;
    GridBrowser.prototype._generateGrid = function (noAnimation) {
        // Update number of columns and rows
        var rect = this.container.getComputedSize();
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
        this.nColumns = Math.max(1, Math.floor(rect.width / this.childWidth));
        this.nRows = Math.max(1, Math.floor(rect.height / this.childHeight));
        var xCenter = this.childWidth * this.nColumns / 2;
        // let yCenter = this.childHeight * this.nRows / 2;
        // Update child position, dimensions
        for (var i = 0; i < this.children.length; ++i) {
            var x = i % this.nColumns;
            var y = Math.floor(i / this.nColumns);
            //@ts-ignore
            animate(this.children[i]).add({
                "size": {
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
