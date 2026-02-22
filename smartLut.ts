class LookupTable {
    private min: number
    private factor: number
    private factor2: number
    private table: Float32Array | Float64Array
    constructor(func: (x: number) => number, max: number, min: number, samples: number, precision: 32 | 64 = 32) {
        this.min = min
        this.factor = (samples - 1) / (max - min)
        this.factor2 = (max - min) / (samples - 1)
        this.table = precision === 32 ? new Float32Array(samples) : new Float64Array(samples)
        for (let i = 0; i < samples; i++) {
            this.table[i] = func(i * this.factor2 + min)
        }
    }

    get(x: number): number | undefined {
        const index = ((x - this.min) * this.factor) | 0
        return this.table[index]
    }
}

const sinLUT = new LookupTable(Math.sin, Math.PI * 2, 0, 2)
const cosLUT = new LookupTable(Math.cos, Math.PI * 2, 0, 2)

console.log(sinLUT.get(2), Math.sin(2))