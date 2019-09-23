class NonRepetitiveValListGet {
    previousIndex: number = 0;
    list: Array<any> = [];

    constructor(list: Array<any>) {
        this.list = list;
    }

    getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min)
    }

    random(): any {
        switch (this.list.length) {
            case 0: return '';
            case 1: return this.list[0];
            default:
                let nextIndex = this.getRandomInt(0 + 1, this.list.length - 1);
                this.previousIndex = nextIndex % this.list.length;
                return this.list[this.previousIndex];
        }
    }
}
