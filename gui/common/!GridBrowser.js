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
    function GridBrowser(containerName, pageCounterName, list, selectedIndex, childDimensions, childFunction) {
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
    GridBrowser.prototype.setIndexOfSelected = function (index) {
        this.selectedIndex = Math.max(0, Math.min(index, this.list.length - 1));
    };
    ;
    GridBrowser.prototype.goToPage = function (pageNumber) {
        // Set current page
        this.currentPage = Math.max(0, Math.min(pageNumber, this.getNumOfPages() - 1));
        // Update page counter
        this.pageCounter.caption = (this.getCurrentPage() + 1) + "/" + this.getNumOfPages();
        // Update childs' content (generate page)
        var nubOfBoxesToShow = this.list.length == 0 ?
            0 :
            this.getCurrentPage() == this.getNumOfPages() - 1 ?
                (this.list.length - 1) % this.getMaxNumBoxesInPage() + 1 :
                this.getMaxNumBoxesInPage();
        var startIndex = this.getCurrentPage() * this.getMaxNumBoxesInPage();
        var subList = this.list.slice(startIndex, startIndex + nubOfBoxesToShow);
        var subListChildren = this.children.slice(0, nubOfBoxesToShow);
        for (var i = 0; i < nubOfBoxesToShow; ++i) {
            this.children[i].hidden = false;
            this.childFunction(subList[i], i, subList, startIndex + i, this.list, this.helperList, this.children[i], subListChildren, this.children);
        }
        for (var i = nubOfBoxesToShow; i < this.numBoxesCreated; ++i)
            this.children[i].hidden = true;
    };
    ;
    GridBrowser.prototype.getCurrentPage = function () {
        return this.list.length == 0 ? 0 : this.currentPage;
    };
    ;
    GridBrowser.prototype.getPageOfIndex = function (index) {
        return this.list.length == 0 || index == -1 ?
            0 :
            Math.floor(index / this.getMaxNumBoxesInPage());
    };
    ;
    GridBrowser.prototype.getPageOfSelected = function () {
        return this.getPageOfIndex(this.selectedIndex);
    };
    ;
    GridBrowser.prototype.getPageIndexOfSelected = function () {
        return this.selectedIndex == -1 || this.list.length == 0 ?
            -1 :
            this.selectedIndex % this.getMaxNumBoxesInPage();
    };
    ;
    GridBrowser.prototype.getMaxNumBoxesInPage = function () {
        return Math.min(this.nColumns * this.nRows, this.numBoxesCreated);
    };
    ;
    // Update number of pages. Always at least 1 page.
    GridBrowser.prototype.getNumOfPages = function () {
        return Math.max(1, Math.ceil(this.list.length / this.getMaxNumBoxesInPage()));
    };
    ;
    GridBrowser.prototype.setList = function (list) {
        this.list = list;
        this.goToPage(0);
    };
    ;
    GridBrowser.prototype.setChildDimensions = function (childDimensions) {
        var inSelectedPage = this.getPageOfSelected() == this.getCurrentPage();
        var firstChildIndex = this.getCurrentPage() * this.getMaxNumBoxesInPage();
        this.child = childDimensions;
        this._generateGrid(false);
        var page = inSelectedPage ?
            this.getPageOfSelected() :
            this.getPageOfIndex(firstChildIndex);
        this.goToPage(page);
    };
    ;
    GridBrowser.prototype.generateGrid = function () {
        this._generateGrid(false);
        this.goToPage(this.getPageOfSelected());
    };
    ;
    GridBrowser.prototype._generateGrid = function (noAnimation) {
        // Update number of columns and rows
        var rect = this.container.getComputedSize();
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
        this.nColumns = Math.max(1, Math.floor(rect.width / this.child.width));
        this.nRows = Math.max(1, Math.floor(rect.height / this.child.height));
        var xCenter = this.child.width * this.nColumns / 2;
        // let yCenter = this.child.height * this.nRows / 2;
        // Update child position, dimensions
        for (var i = 0; i < this.numBoxesCreated; ++i) {
            var x = i % this.nColumns;
            var y = Math.floor(i / this.nColumns);
            //@ts-ignore
            animateObject(this.children[i], {
                "size": {
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
            });
        }
    };
    ;
    GridBrowser.prototype.nextPage = function () {
        this.goToPage((this.getCurrentPage() + 1) % this.getNumOfPages());
    };
    ;
    GridBrowser.prototype.previousPage = function () {
        this.goToPage((this.getCurrentPage() + this.getNumOfPages() - 1) % this.getNumOfPages());
    };
    ;
    return GridBrowser;
}());
;
