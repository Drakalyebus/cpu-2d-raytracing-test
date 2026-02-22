class Optimizer {
    constructor(func, inLength, outLength) {
        this.func = func;
        this.inLength = inLength;
        this.outLength = outLength;
        this.points = [];
        this.limit = 100; 
    }

    call(...args) {
        if (this.points.length < 2) return this.learn(args);

        // Находим две ближайшие точки ПО ВХОДУ (args)
        const sorted = this.points
            .map(p => ({
                p,
                // Считаем евклидово расстояние по входу
                dist: Math.sqrt(p.ins.reduce((acc, v, i) => acc + (v - args[i]) ** 2, 0))
            }))
            .sort((a, b) => a.dist - b.dist);

        const p1 = sorted[0];
        const p2 = sorted[1];

        // Если ближайшая точка слишком далеко (например, > 0.05), 
        // значит мы не знаем эту область — надо учить.
        if (p1.dist > 0.05) {
            return this.learn(args);
        }

        // Вместо среднего арифметического — взвешенное среднее (интерполяция)
        const d1 = p1.dist;
        const d2 = p2.dist;
        const total = d1 + d2;

        // Чем МЕНЬШЕ дистанция d1, тем БОЛЬШЕ веса у точки p1
        return p1.p.outs.map((y1, i) => {
            const y2 = p2.p.outs[i];
            return (y1 * d2 + y2 * d1) / total;
        });
    }

    learn(...args) {
        const result = this.func(...args);
        this.points.push({ ins: args, outs: result });
        if (this.points.length > this.limit) this.points.shift();
        return result;
    }
}

const func = (x) => {
    let sum = 0;
    for (let i = 0; i < x * 10000; i++) {
        sum += Math.random()
    }
    return [sum];
};

const sinOpt = new Optimizer(func, 1, 1);

for (let epoch = 0; epoch < 50; epoch++) {
    sinOpt.learn(Math.random() * Math.PI * 2);
}

for (let epoch = 0; epoch < 10000; epoch++) {
    console.log(sinOpt.call(Math.random() * Math.PI * 2));
    console.log(func(Math.random() * Math.PI * 2)[0]);
}