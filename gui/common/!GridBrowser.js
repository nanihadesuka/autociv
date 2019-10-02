var GridBrowser = /** @class */ (function () {
    function GridBrowser(containerName, pageCounterName, list, selectedIndex, childDimensions, childFunction) {
        var self = this;
        self.container = Engine.GetGUIObjectByName(containerName);
        self.pageCounter = Engine.GetGUIObjectByName(pageCounterName);
        self.children = self.container.children;
        self.numBoxesCreated = self.children.length;
        self.childFunction = childFunction;
        self.list = list;
        self.selectedIndex = selectedIndex;
        self.child = childDimensions;
        self.helperList = new Uint8Array(self.numBoxesCreated);
        self.currentPage = 0;
        self.nColumns = 0;
        self.nRows = 0;
        self._generateGrid(true);
        self.goToPage(self.getPageOfSelected());
    }
    GridBrowser.prototype.setIndexOfSelected = function (index) {
        var self = this;
        self.selectedIndex = max(0, min(index, self.list.length - 1));
    };
    GridBrowser.prototype.goToPage = function (pageNumber) {
        var ՐՏ_1, ՐՏ_2;
        var self = this;
        var numOfBoxesToShow, startIndex, subList, subListChildren, i;
        self.currentPage = max(0, min(pageNumber, self.getNumOfPages() - 1));
        self.pageCounter.caption = self.getCurrentPage() + 1 + "/" + self.getNumOfPages();
        if (self.list.length === 0) {
            numOfBoxesToShow = 0;
        }
        else if (((ՐՏ_1 = self.getCurrentPage()) === (ՐՏ_2 = self.getNumOfPages() - 1) || typeof ՐՏ_1 === "object" && ՐՏ_eq(ՐՏ_1, ՐՏ_2))) {
            numOfBoxesToShow = (self.list.length - 1) % self.getMaxNumBoxesInPage() + 1;
        }
        else {
            numOfBoxesToShow = self.getMaxNumBoxesInPage();
        }
        startIndex = self.getCurrentPage() * self.getMaxNumBoxesInPage();
        subList = self.list.slice(startIndex, startIndex + numOfBoxesToShow);
        subListChildren = self.children.slice(0, numOfBoxesToShow);
        for (i = 0; i < numOfBoxesToShow; i++) {
            self.children[i].hidden = false;
            self.childFunction(subList[i], i, subList, startIndex + i, self.list, self.helperList, self.children[i], subListChildren, self.children);
        }
        for (i = numOfBoxesToShow; i < self.numBoxesCreated; i++) {
            self.children[i].hidden = true;
        }
    };
    GridBrowser.prototype.getCurrentPage = function () {
        var self = this;
        if (self.list.length === 0) {
            return 0;
        }
        return self.currentPage;
    };
    GridBrowser.prototype.getPageOfIndex = function (index) {
        var self = this;
        if (self.list.length === 0 || index === -1) {
            return 0;
        }
        return Math.floor(index / self.getMaxNumBoxesInPage());
    };
    GridBrowser.prototype.getPageOfSelected = function () {
        var self = this;
        return self.getPageOfIndex(self.selectedIndex);
    };
    GridBrowser.prototype.getPageIndexOfSelected = function () {
        var self = this;
        if (self.selectedIndex === -1 || self.list.length === 0) {
            return -1;
        }
        return self.selectedIndex % self.getMaxNumBoxesInPage();
    };
    GridBrowser.prototype.getMaxNumBoxesInPage = function () {
        var self = this;
        return min(self.nColumns * self.nRows, self.numBoxesCreated);
    };
    GridBrowser.prototype.getNumOfPages = function () {
        var self = this;
        return max(1, Math.ceil(self.list.length / self.getMaxNumBoxesInPage()));
    };
    GridBrowser.prototype.setList = function (list) {
        var self = this;
        self.list = list;
        self.goToPage(0);
    };
    GridBrowser.prototype.setChildDimensions = function (childDimensions) {
        var self = this;
        var inSelectedPage, firstChildIndex, page;
        inSelectedPage = self.getPageOfSelected() === self.getCurrentPage();
        firstChildIndex = self.getCurrentPage() * self.getMaxNumBoxesInPage();
        self.child = childDimensions;
        self._generateGrid(false);
        if (inSelectedPage) {
            page = self.getPageOfSelected();
        }
        else {
            page = self.getPageOfIndex(firstChildIndex);
        }
        self.goToPage(page);
    };
    GridBrowser.prototype.generateGrid = function () {
        var self = this;
        self._generateGrid(false);
        self.goToPage(self.getPageOfSelected());
    };
    GridBrowser.prototype._generateGrid = function (noAnimation) {
        var self = this;
        var rect, xCenter, i, x, y;
        rect = self.container.getComputedSize();
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
        self.nColumns = max(1, Math.floor(rect.width / self.child.width));
        self.nRows = max(1, Math.floor(rect.height / self.child.height));
        xCenter = self.child.width * self.nColumns / 2;
        for (i = 0; i < self.numBoxesCreated; i++) {
            x = i % self.nColumns;
            y = Math.floor(i / self.nColumns);
            kinetic(self.children[i]).add({
                "size": {
                    "left": self.child.width * x - xCenter,
                    "right": self.child.width * (x + 1) - xCenter,
                    "top": self.child.height * y,
                    "bottom": self.child.height * (y + 1),
                    "rleft": 50,
                    "rright": 50,
                    "rtop": 0,
                    "rbottom": 0
                },
                "duration": 0
            });
        }
    };
    GridBrowser.prototype.nextPage = function () {
        var self = this;
        self.goToPage((self.getCurrentPage() + 1) % self.getNumOfPages());
    };
    GridBrowser.prototype.previousPage = function () {
        var self = this;
        self.goToPage((self.getCurrentPage() + self.getNumOfPages() - 1) % self.getNumOfPages());
    };
    return GridBrowser;
}());
