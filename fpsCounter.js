class FPS {
    constructor(period = 1000) {
        this.interval = null;
        this.frameCount = 0;
        this.fps = 0;
        this.onUpdate = () => {};
        this.enabled = false;
        this.period = period;
        this.values = [];
    }
    start() {
        this.enabled = true;
        this.interval = setInterval(() => {
            this.fps = this.frameCount * 1000 / this.period;
            this.values.push(this.fps);
            if (this.values.length > Math.ceil(1000 / this.period)) {
                this.values.shift();
            }
            const avg = this.values.reduce((a, b) => a + b, 0) / this.values.length;
            this.onUpdate(avg);
            this.frameCount = 0;
        }, this.period);
        const addFrame = () => {
            if (this.enabled) {
                this.frameCount++;
                requestAnimationFrame(addFrame);
            }
        }
        addFrame();
    }
    subscribe(callback) {
        this.onUpdate = callback;
    }
    unsubscribe() {
        this.onUpdate = () => {};
    }
    stop() {
        this.enabled = false;
        clearInterval(this.interval);
        this.interval = null;
        this.frameCount = 0;
        this.fps = 0;
    }
}

export default FPS;