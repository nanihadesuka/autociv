'''
 Function that arranges a list of "boxed-like" GUI objects with width-centering
 (currently) and page based way mode.

 Needs an object as container and a object to display the page numbering (if not
 make hidden object and assign it to it).

 To add advanced, more detailed, objects inside each box add a custom childFunction:
 childFunction(page_list_element, page_list_element_index, page_list,
 global_list_element_index, global_list,child_object).

 For example look at mapbrowser.js / mapbrowser.xml implementation.
'''
class GridBrowser:
    def __init__(self, containerName, pageCounterName, list, selectedIndex, childDimensions, childFunction):
        # GUI object container of the children
        self.container = Engine.GetGUIObjectByName(containerName)
        # GUI object type="text" for the numbering of each page
        self.pageCounter = Engine.GetGUIObjectByName(pageCounterName)
        # list of GUI objects
        self.children = self.container.children
        # hardcoded in the GUI file, maximum children capable of showing at a time
        self.numBoxesCreated = self.children.length
        self.childFunction = childFunction
        self.list = list
        self.selectedIndex = selectedIndex
        self.child = childDimensions
        # Array to set flag for each child
        self.helperList = new Uint8Array(self.numBoxesCreated)
        self.currentPage = 0
        self.nColumns = 0
        self.nRows = 0

        self._generateGrid(true)
        self.goToPage(self.getPageOfSelected())

    def setIndexOfSelected(self, index):
        self.selectedIndex = max(0, min(index, self.list.length - 1))

    def goToPage(self, pageNumber):
        # Set current page
        self.currentPage = max(0, min(pageNumber, self.getNumOfPages() - 1))

        # Update page counter
        self.pageCounter.caption = (
            self.getCurrentPage() + 1) + "/" + self.getNumOfPages()

        # Update childs' content(generate page)
        if self.list.length == 0:
            numOfBoxesToShow = 0
        elif self.getCurrentPage() == self.getNumOfPages() - 1:
            numOfBoxesToShow = (self.list.length -
                                1) % self.getMaxNumBoxesInPage() + 1
        else:
            numOfBoxesToShow = self.getMaxNumBoxesInPage()

        startIndex = self.getCurrentPage() * self.getMaxNumBoxesInPage()
        subList = self.list.slice(startIndex, startIndex + numOfBoxesToShow)
        subListChildren = self.children.slice(0, numOfBoxesToShow)
        for i in range(numOfBoxesToShow):
            self.children[i].hidden = False
            self.childFunction(subList[i], i, subList, startIndex + i, self.list,
                               self.helperList, self.children[i], subListChildren, self.children)

        for i in range(numOfBoxesToShow, self.numBoxesCreated):
            self.children[i].hidden = True

    def getCurrentPage(self):
        if self.list.length is 0:
            return 0
        return self.currentPage

    def getPageOfIndex(self, index):
        if self.list.length is 0 or index is -1:
            return 0
        return Math.floor(index / self.getMaxNumBoxesInPage())

    def getPageOfSelected(self):
        return self.getPageOfIndex(self.selectedIndex)

    def getPageIndexOfSelected(self):
        if self.selectedIndex is -1 or self.list.length is 0:
            return -1
        return self.selectedIndex % self.getMaxNumBoxesInPage()

    def getMaxNumBoxesInPage(self):
        return min(self.nColumns * self.nRows, self.numBoxesCreated)

    # Update number of pages. Always at least 1 page.
    def getNumOfPages(self):
        return max(1, Math.ceil(self.list.length / self.getMaxNumBoxesInPage()))

    def setList(self, list):
        self.list = list
        self.goToPage(0)

    def setChildDimensions(self, childDimensions):
        inSelectedPage = self.getPageOfSelected() is self.getCurrentPage()
        firstChildIndex = self.getCurrentPage() * self.getMaxNumBoxesInPage()
        self.child = childDimensions
        self._generateGrid(False)
        if inSelectedPage:
            page = self.getPageOfSelected()
        else:
            page = self.getPageOfIndex(firstChildIndex)
        self.goToPage(page)

    def generateGrid(self):
        self._generateGrid(False)
        self.goToPage(self.getPageOfSelected())

    def _generateGrid(self, noAnimation):
        # Update number of columns and rows
        rect = self.container.getComputedSize()
        rect.width = rect.right - rect.left
        rect.height = rect.bottom - rect.top

        self.nColumns = max(1, Math.floor(rect.width / self.child.width))
        self.nRows = max(1, Math.floor(rect.height / self.child.height))
        xCenter = self.child.width * self.nColumns / 2
        # yCenter = self.child.height * self.nRows / 2;

        for i in range(self.numBoxesCreated):
            x = i % self.nColumns
            y = Math.floor(i / self.nColumns)
            kinetic(self.children[i]).add({
                "size":	{
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
            })

    def nextPage(self):
        self.goToPage((self.getCurrentPage() + 1) % self.getNumOfPages())

    def previousPage(self):
        self.goToPage((self.getCurrentPage() + self.getNumOfPages() - 1) % self.getNumOfPages())
