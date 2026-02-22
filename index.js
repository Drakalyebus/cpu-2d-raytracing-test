const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const W = canvas.width;
const H = canvas.height;
import pointInPolygon from "./intersect.js";
import FPS from "./fpsCounter.js";
const fpsEl = document.getElementById('fps');

/**
 * Находит пересечение двух отрезков.
 * @param {Object} s1 - Отрезок 1 {p1: {x, y}, p2: {x, y}}
 * @param {Object} s2 - Отрезок 2 {p1: {x, y}, p2: {x, y}}
 */
function getIntersection(s1, s2) {
    const x1 = s1.p1.x, y1 = s1.p1.y;
    const x2 = s1.p2.x, y2 = s1.p2.y;
    const x3 = s2.p1.x, y3 = s2.p1.y;
    const x4 = s2.p2.x, y4 = s2.p2.y;

    // Знаменатель (определитель)
    const det = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);

    // Если det равен 0, отрезки параллельны
    if (det === 0) {
        return { haveIntersection: false };
    }

    const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / det;
    const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / det;

    // Отрезки пересекаются, если параметры t и u лежат в диапазоне [0, 1]
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            haveIntersection: true,
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }

    return { haveIntersection: false };
}

// Прямоугольник
function generateRectangle(w, h, dx = 0, dy = 0) {
    return {
            shape: [
                { x: W/2 - w/2 + dx, y: H/2 - h/2 + dy },
                { x: W/2 + w/2 + dx, y: H/2 - h/2 + dy },
                { x: W/2 + w/2 + dx, y: H/2 + h/2 + dy },
                { x: W/2 - w/2 + dx, y: H/2 + h/2 + dy }
            ],
            color: { r: 100, g: 200, b: 100 }
        }
}

// Правильный многоугольник (углы тупые)
function generatePolygon(sides, radius, dx = 0, dy = 0) {
    const points = [];
    for (let i = 0; i < sides; i++) {
        const angle = (2 * Math.PI * i) / sides;
        points.push({
            x: Math.cos(angle) * radius + W/2 + dx,
            y: Math.sin(angle) * radius + H/2 + dy
        });
    }
    return {
        shape: points,
        //color: { r: 200, g: 100, b: 100 }
        color: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 }
        //color: { r: 128, g: 128, b: 128 }
    };
}

// Массив объектов
// const objects = [
//     generatePolygon(9, 100, -250, -150),        // октагон справа
//     //generateRectangle(200, 100, -250, -150), // прямоугольник слева сверху
//     generatePolygon(9, 120, 250, 50),        // октагон справа
//     generatePolygon(9, 80, -200, 200),      // додекагон снизу слева
//     generatePolygon(9, 80, 200, 250),       // додекагон снизу справа
//     //generateRectangle(150, 150, 200, -200)   // квадрат справа сверху
// ];

const objects = new Array(4).fill(null).map(() => generatePolygon(9, 80, Math.random() * W-W/2, Math.random() * H-H/2 ));

const boundingBoxes = objects.map(obj => {
    const min = { x: Infinity, y: Infinity };
    const max = { x: -Infinity, y: -Infinity };
    obj.shape.forEach(point => {
        min.x = Math.min(min.x, point.x);
        min.y = Math.min(min.y, point.y);
        max.x = Math.max(max.x, point.x);
        max.y = Math.max(max.y, point.y);
    });
    return { min, max };
});

const boundingCircles = boundingBoxes.map((obj, i) => {
    const realObj = objects[i];
    const center = { x: (obj.min.x + obj.max.x) / 2, y: (obj.min.y + obj.max.y) / 2 };
    const radius = Math.max(...realObj.shape.map(p => Math.hypot(p.x - center.x, p.y - center.y)));
    return { center, radius };
})

const points = objects.flatMap(obj => obj);


function getNormalAt(px, py, shape) {
    let minDist = Infinity;
    let normal = { x: 0, y: 0 };

    for (let i = 0; i < shape.length; i++) {
        const p1 = shape[i];
        const p2 = shape[(i + 1) % shape.length];

        // Вектор ребра
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        // Находим проекцию точки на прямую (параметр t)
        const l2 = dx * dx + dy * dy;
        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));

        // Ближайшая точка на текущем ребре
        const nearestX = p1.x + t * dx;
        const nearestY = p1.y + t * dy;

        const dist = Math.hypot(px - nearestX, py - nearestY);

        if (dist < minDist) {
            minDist = dist;
            // Нормаль к ребру (перпендикуляр)
            // Для порядка обхода по часовой стрелке: {y, -x}
            const mag = Math.sqrt(l2);
            normal.x = -dy / mag;
            normal.y = dx / mag;
        }
    }

    return normal;
}


function angleMid(a, b) {
    let diff = b - a;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff / 2;
}

const light = { x: 0, y: 0, r: 255, g: 255, b: 255, radius: 100 };

function draw(x, y, rayCount, depth, step, optimize = 1) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    const theta = Math.PI * 2 / rayCount;
    let rays = [];
//     const trace = (a, step = 5, prevRay = {x, y, theta: a, r: 255, g: 255, b: 255}) => {
//     if (step === 0) {
//         return { ...prevRay };
//     }
//     let dir = { x: Math.cos(a), y: Math.sin(a) };
//     // Отрезок луча (от игрока в бесконечность)
//     const l1 = { p1: { x: prevRay.x, y: prevRay.y }, p2: { x: prevRay.x + dir.x * 2000, y: prevRay.y + dir.y * 2000 } };
    
//     let closestHit = null;
//     let minDistance = Infinity;

//     let hitObj = null

//     // Перебираем все объекты
//     for (let i = 0; i < objects.length; i++) {
//         const obj = objects[i];
        
//         // Перебираем все грани объекта
//         for (let j = 0; j < obj.shape.length; j++) {
//             const p1 = obj.shape[j];
//             const p2 = obj.shape[(j + 1) % obj.shape.length];
            
//             const hit = getIntersection(l1, { p1, p2 });
            
//             if (hit.haveIntersection) {
//                 // Считаем расстояние до точки пересечения
//                 const dx = hit.x - prevRay.x;
//                 const dy = hit.y - prevRay.y;
//                 const dist = dx * dx + dy * dy; // Используем квадрат расстояния (быстрее)

//                 if (dist > 0.1 && dist < minDistance) {
//                     hitObj = obj
//                     minDistance = dist;
//                     closestHit = {
//                         x: hit.x,
//                         y: hit.y,
//                         theta: a,
//                         r: obj.color.r * prevRay.r / 255,
//                         g: obj.color.g * prevRay.g / 255,
//                         b: obj.color.b * prevRay.b / 255
//                     };
//                 }
//             }
//         }
//     }
//     if (closestHit) {
//         const normal = getNormalAt(closestHit.x, closestHit.y, hitObj.shape);
//         // Отражаем вектор направления относительно нормали
//         const dot = dir.x * normal.x + dir.y * normal.y;
//         const rx = dir.x - 2 * dot * normal.x;
//         const ry = dir.y - 2 * dot * normal.y;
//         const nextAngle = Math.atan2(ry, rx);
        
//         return trace(nextAngle, step - 1, closestHit);
//     }

//     // Если нашли пересечение — возвращаем его, иначе — конец луча
//     return { 
//         x: l1.p2.x, 
//         y: l1.p2.y, 
//         theta: a, 
//         r: 0, g: 0, b: 0 
//     };
// }

    const trace = (a, step) => {
        let dir = { x: Math.cos(a), y: Math.sin(a) };
        let accumulatedColor = { r: 255, g: 255, b: 255 };
        let lastHitPoint = {x, y}
        let ray = { x, y };
        let hitCount = 0;
        for (let j = 0; j < depth; j += step) {
            if (hitCount >= 5) {
                return { x: ray.x, y: ray.y, theta: a, depth: j, r: accumulatedColor.r, g: accumulatedColor.g, b: accumulatedColor.b };
            }
            ctx.fillStyle = `rgb(${accumulatedColor.r}, ${accumulatedColor.g}, ${accumulatedColor.b})`;
            ctx.strokeStyle = `rgb(${accumulatedColor.r}, ${accumulatedColor.g}, ${accumulatedColor.b})`;
            // const hitWithLight = (ray.x - light.x) ** 2 + (ray.y - light.y) ** 2 < light.radius ** 2;
            // if (hitWithLight) {
            //     return { x: ray.x, y: ray.y, theta: a, depth: j, r: accumulatedColor.r * light.r / 255, g: accumulatedColor.g * light.g / 255, b: accumulatedColor.b * light.b / 255 };
            // }
            const hit = objects.filter((_, i) => {
                const obj = boundingBoxes[i];
                const isInBoundingBox = ray.x >= obj.min.x && ray.x <= obj.max.x && ray.y >= obj.min.y && ray.y <= obj.max.y;
                return isInBoundingBox
            }).find(obj => pointInPolygon(ray, obj.shape));
            // const hit = objects.filter((_, i) => {
            //     const obj = boundingCircles[i];
            //     const isInBoundingCircle = (ray.x - obj.center.x) ** 2 + (ray.y - obj.center.y) ** 2 < obj.radius ** 2;
            //     return isInBoundingCircle
            // }).find(obj => pointInPolygon(ray, obj.shape));
            if (hit) {
                for (let epoch = 0; epoch < step; epoch++) {
                    if (j - step + epoch < 0) return { x: ray.x, y: ray.y, theta: a, depth: j, r: accumulatedColor.r, g: accumulatedColor.g, b: accumulatedColor.b };
                    const newJ = epoch - step;
                    const newRay = { x: dir.x * newJ + ray.x, y: dir.y * newJ + ray.y };
                    //ctx.fillRect(newRay.x, newRay.y, 1, 1);
                    // const newHit = objects.filter((_, i) => {
                    //     const obj = boundingBoxes[i];
                    //     const isInBoundingBox = newRay.x >= obj.min.x && newRay.x <= obj.max.x && newRay.y >= obj.min.y && newRay.y <= obj.max.y;
                    //     return isInBoundingBox
                    // }).find(obj => pointInPolygon(newRay, obj.shape));
                    const newHit = pointInPolygon(newRay, hit.shape);
                    if (newHit) {
                        ctx.beginPath()
                        ctx.moveTo(lastHitPoint.x, lastHitPoint.y)
                        ctx.lineTo(newRay.x, newRay.y)
                        ctx.stroke()
                        const totalJ = j + newJ;
                        hitCount++;
                        const hitColor = { r: hit.color.r , g: hit.color.g, b: hit.color.b };
                        // accumulatedColor = { r: accumulatedColor.r * hitColor.r / 255, g: accumulatedColor.g * hitColor.g / 255, b: accumulatedColor.b * hitColor.b / 255 };
                        // return { x: newRay.x, y: newRay.y, theta: a, depth: j, r: accumulatedColor.r, g: accumulatedColor.g, b: accumulatedColor.b };
                        lastHitPoint = {x: newRay.x, y: newRay.y}
                        accumulatedColor = { r: accumulatedColor.r * hitColor.r / 255 / totalJ * 100, g: accumulatedColor.g * hitColor.g / 255 / totalJ * 100, b: accumulatedColor.b * hitColor.b / 255 / totalJ * 100 };
                        const normal = getNormalAt(newRay.x, newRay.y, hit.shape, 1);
                        const dot = dir.x * normal.x + dir.y * normal.y;
                        dir.x = dir.x - 2 * dot * normal.x;
                        dir.y = dir.y - 2 * dot * normal.y;
                        ray = { x: newRay.x - normal.x, y: newRay.y - normal.y }; // {x: newRay.x, y: newRay.y};
                        break;
                    }
                }
            }
            ray = {x: ray.x + step * dir.x, y: ray.y + step * dir.y}
            //lastRay = { x: ray.x + step * dir.x, y: ray.y + step * dir.y };
        }
        ctx.beginPath()
        ctx.moveTo(lastHitPoint.x, lastHitPoint.y)
        ctx.lineTo(ray.x, ray.y)
        ctx.stroke()
        if (hitCount === 0) {
            accumulatedColor = { r: 0, g: 0, b: 0 };
        }
        //return { x: Math.floor(ray.x), y: Math.floor(ray.y), theta: a, depth: depth, r: 0, g: 0, b: 0 };
        return { x: ray.x, y: ray.y, theta: a, depth: depth, r: accumulatedColor.r, g: accumulatedColor.g, b: accumulatedColor.b };
    }
    for (let i = 0; i < Math.PI * 2; i += theta) {
        rays.push(trace(i, step));
    }
    const constant = 255 * 3

    for (let epoch = 0; epoch < optimize; epoch++) {
        const nextRays = [];
        for (let i = 0; i < rays.length; i++) {
            const r1 = rays[i];
            const r2 = rays[(i + 1) % rays.length];
            nextRays.push(r1);
            //const midDist = (Math.hypot(x - r1.x, y - r1.y) + Math.hypot(x - r2.x, y - r2.y)) / 2;
            //const distBetweenHits = Math.abs(Math.hypot(x - r1.x, y - r1.y) - Math.hypot(x - r2.x, y - r2.y));
            //const angleDiff = Math.abs(Math.atan2(r1.y - y, r1.x - x) - Math.atan2(r2.y - y, r2.x - x))
            const colorDiff = (Math.abs(Math.min(r1.r, 255) - Math.min(r2.r, 255)) + Math.abs(Math.min(r1.g, 255) - Math.min(r2.g, 255)) + Math.abs(Math.min(r1.b, 255) - Math.min(r2.b, 255))) / constant;
            if (colorDiff >= 0.01) {
                const midAngle = angleMid(r1.theta, r2.theta);
                const newRay = trace(midAngle, step);
                //rays = [...rays.slice(0, i), newRay, ...rays.slice(i + 1)];
                nextRays.push(newRay);
            }
        }
        rays = nextRays
        //rays = [...rays, ...nextRays].sort((a, b) => a.theta - b.theta);
    }
    return rays;
}

function applyBloom(ctx, canvas, bloomCtx, bloomCanvas) {
    
    bloomCtx.filter = 'blur(20px)';
    bloomCtx.drawImage(canvas, 0, 0);

    // Настраиваем режим наложения
    ctx.globalAlpha = 1; // Степень "прозрачности" блюма
    ctx.globalCompositeOperation = 'screen'; // 'screen' или 'lighter' идеально подходят для Bloom
    
    ctx.drawImage(bloomCanvas, 0, 0);
    
    // Сбрасываем настройки обратно, чтобы не испортить следующий цикл рисования
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
}

const bloomCanvas = document.createElement('canvas');
const bloomCtx = bloomCanvas.getContext('2d');
bloomCanvas.width = W;
bloomCanvas.height = 100;

const bloomCanvas2 = document.createElement('canvas');
const bloomCtx2 = bloomCanvas2.getContext('2d');
bloomCanvas2.width = W;
bloomCanvas2.height = H;

const traceCanvas = document.getElementById('canvas2');
traceCanvas.width = W;
traceCanvas.height = 100;
const traceCtx = traceCanvas.getContext('2d');

const diagonal = Math.hypot(W, H);

let mouseX = 0;
let mouseY = 0;
let x = 0;
let y = 0;

const render = () => {
    const e = { offsetX: x, offsetY: y };
    traceCtx.clearRect(0, 0, W, H);
    const rays = draw(e.offsetX, e.offsetY, 128, diagonal * 2, 50, 4);
    //rays.sort((a, b) => a.theta - b.theta);
    // const grad = traceCtx.createLinearGradient(0, 0, W, 0);
    // rays.forEach((ray) => {
    //     grad.addColorStop(((((ray.theta + Math.PI / 2) / (Math.PI * 2)) % 1) + 1) % 1, `rgb(${ray.r}, ${ray.g}, ${ray.b})`);
    // })
    // traceCtx.fillStyle = grad;
    // traceCtx.fillRect(0, 0, W, H);
    // //draw(e.offsetX, e.offsetY, 320, diagonal, 1, 0);
    rays.slice(1).forEach((r2, i) => {
        const r1 = rays[i]
        const x1 = r1.theta / (Math.PI * 2) * W
        const x2 = r2.theta / (Math.PI * 2) * W
        const grad = traceCtx.createLinearGradient(x1, 0, x2, 0);
        grad.addColorStop(0, `rgb(${r1.r}, ${r1.g}, ${r1.b})`);
        grad.addColorStop(1, `rgb(${r2.r}, ${r2.g}, ${r2.b})`);
        traceCtx.fillStyle = grad;
        traceCtx.fillRect(Math.round(x1), 0, x2 - x1 + 1, H);
    })
    applyBloom(traceCtx, traceCanvas, bloomCtx, bloomCanvas);
    applyBloom(ctx, canvas, bloomCtx2, bloomCanvas2);
    x += (mouseX - x) / 1;
    y += (mouseY - y) / 1;
    requestAnimationFrame(render);
}
canvas.onmousemove = (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
}

const fpsCounter = new FPS(100);
fpsCounter.subscribe((fps) => fpsEl.textContent = fps.toString());
fpsCounter.start();

render();