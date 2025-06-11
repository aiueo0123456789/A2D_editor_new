import { GPU } from "./webGPU.js";
import { calculateAllBBoxPipeline } from "./GPUObject.js";
import { vec2 } from "./ベクトル計算.js";

const aaaBuffer = GPU.createStorageBuffer((2 + 2) * 4, undefined, ["f32"]);
const aaaGroup = GPU.createGroup(GPU.getGroupLayout("Csrw"), [{item: aaaBuffer, type: "b"}]);
export function calculateBBoxFromAllVertices(group, verticesNum) {
    GPU.runComputeShader(calculateAllBBoxPipeline, [group, aaaGroup], Math.ceil(verticesNum / 20 / 64));
}

// export function BBox(points) {
//     console.log(points)
//     if (!points.length) return {max: [NaN, NaN], min: [NaN, NaN]};
//     let maxX = points[0];
//     let maxY = points[1];
//     let minX = points[0];
//     let minY = points[1];
//     for (let i = 2; i < points.length; i += 2) {
//         maxX = Math.max(points[i], maxX);
//         maxY = Math.max(points[i + 1], maxY);
//         minX = Math.min(points[i], minX);
//         minY = Math.min(points[i + 1], minY);
//     }
//     return {max: [maxX,maxY], min: [minX,minY]};
// }

export function BBox(points) {
    if (!points.length) return {max: [NaN, NaN], min: [NaN, NaN]};
    let maxX = points[0][0];
    let maxY = points[0][1];
    let minX = points[0][0];
    let minY = points[0][1];
    for (let i = 1; i < points.length; i ++) {
        maxX = Math.max(points[i][0], maxX);
        maxY = Math.max(points[i][1], maxY);
        minX = Math.min(points[i][0], minX);
        minY = Math.min(points[i][1], minY);
    }
    return {max: [maxX,maxY], min: [minX,minY]};
}

export function createBBox(coordinates = {min: [0,0], max: [0,0]}) {
    if ("top" in coordinates) {
        coordinates = {min: [coordinates.left, -coordinates.bottom], max: [coordinates.right, -coordinates.top]};
    }
    return {
        min: coordinates.min,
        max: coordinates.max,
        width: coordinates.max[0] - coordinates.min[0],
        height: coordinates.max[1] - coordinates.min[1],
        center: vec2.reverseScaleR(vec2.addR(coordinates.max, coordinates.min), 2)
    };
}