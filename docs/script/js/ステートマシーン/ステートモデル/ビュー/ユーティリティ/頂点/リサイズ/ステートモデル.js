import { activeView, editorParameters, keysDown } from "../../../../../../main.js";
import { managerForDOMs, updateDataForUI } from "../../../../../../UI/制御.js";
import { transform } from "../../../../../../機能/オペレーター/変形/変形.js";
import { vec2 } from "../../../../../../ベクトル計算.js";
import { calculateAllAverage } from "../../../../../../平均.js";
import { createNextStateData } from "../../../../../状態遷移.js";

export class StateModel_Vertices_Resize {
    constructor() {
        this.名前 = "頂点リサイズ";
        this.options = [0,0];
        this.ツールバー = "&all";
        this.シェリフ = [
            {
                name: "リサイズ編集",
                targetObject: this.options,
                argumentArray: [
                    {name: "X", type: {type: "入力", inputType: "数字", option: {min: -10000, max: 10000, step: 0.00001, initValue: 1}}},
                    {name: "Y", type: {type: "入力", inputType: "数字", option: {min: -10000, max: 10000, step: 0.00001, initValue: 1}}},
                ]
            }
        ];
        this.データ構造 = {
            activeObject: "&-",
            selectAnimation: {isInclude: "&-", not: null},
            selectIndexs: "&-",
            selectIndexsGroup: "&-",
            selectBBoxForCenterPoint: "&-",
            selectBBoxBuffer: "&-",
            referenceCoordinatesBuffer: "&-",
            selectBBoxRenderGroup: "&-",
            referenceCoordinatesRenderGroup: "&-",
            calculateSelectVerticesBBoxCenterGroup: "&-",
            transformValueMouseStartPosition: [0,0],
            transformValue: [0,0],
        };
        this.遷移ステート = [
            createNextStateData([["/s"],["クリック"]], "$-1", {object: transform, targetFn: "createUndoData"}),
            createNextStateData([["右クリック"]], "$-1", {object: transform, targetFn: "cancel"}),
        ]
    }

    init(stateData) {
        if (stateData.selectIndexs.length == 0) return {cancel: true};
        calculateAllAverage(stateData.calculateSelectVerticesBBoxCenterGroup, 2);
        transform.setPointOfEffort(stateData.selectBBoxForCenterPoint);
        if (stateData.selectAnimation) {
            transform.init(stateData.selectAnimation, stateData.selectIndexs);
        } else {
            transform.init(stateData.activeObject, stateData.selectIndexs);
        }
        stateData.transformValueMouseStartPosition = activeView.mouseState.positionForGPU;
        stateData.transformValue = [0,0];
    }

    // 頂点を移動
    update(stateData) {
        vec2.div(stateData.transformValue, vec2.subR(activeView.mouseState.positionForGPU, stateData.selectBBoxForCenterPoint), vec2.subR(stateData.transformValueMouseStartPosition, stateData.selectBBoxForCenterPoint));
        if (keysDown["x"]) {
            vec2.set(stateData.transformValue, [stateData.transformValue[0],1])
        } else if (keysDown["y"]) {
            vec2.set(stateData.transformValue, [1,stateData.transformValue[1]])
        }
        transform.resize(stateData.transformValue, "ローカル", editorParameters.smoothType, editorParameters.smoothRadius);
    }

    finish(stateData) {
        managerForDOMs.update("ヒエラルキー")
        updateDataForUI["インスペクタ"] = true;
    }
}