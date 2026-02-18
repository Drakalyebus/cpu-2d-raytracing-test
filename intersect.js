/**
 * Проверка: находится ли точка внутри многоугольника (выпуклого или невыпуклого)
 * @param {{x:number, y:number}} point - точка для проверки
 * @param {{x:number, y:number}[]} polygon - массив вершин многоугольника
 * @returns {boolean} true если точка внутри, иначе false
 */
function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export default pointInPolygon;