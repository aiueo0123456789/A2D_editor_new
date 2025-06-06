import { app } from "../../../app.js";
import { InputManager } from "../../../app/InputManager.js";
import { managerForDOMs } from "../../../UI/制御.js";
import { GPU } from "../../../webGPU.js";
import { TranslateCommand } from "../../../機能/オペレーター/変形/トランスフォーム.js";
import { ModalOperator } from "../../補助/ModalOperator.js";

export class TranslateModal {
    constructor(/** @type {ModalOperator} */operator) {
        this.operator = operator;
        this.command = null;
        this.values = [
            0,0, // スライド量
            app.appConfig.areasConfig["Viewer"].proportionalEditType, // proportionalEditType
            app.appConfig.areasConfig["Viewer"].proportionalSize // proportionalSize
        ];
        this.modal = {
            inputObject: {"value": this.values},
            struct: {
                DOM: [
                    {type: "div", class: "shelfe", children: [
                        {type: "input", label: "x", withObject: {object: "value", parameter: "0"}, options: {type: "number",min: -1000, max: 1000}, custom: {visual: "1"}},
                        {type: "input", label: "y", withObject: {object: "value", parameter: "1"}, options: {type: "number",min: -1000, max: 1000}, custom: {visual: "1"}},
                        {type: "input", label: "スムーズ", withObject: {object: "value", parameter: "2"}, options: {type: "number",min: 0, max: 2}},
                        {type: "input", label: "半径", withObject: {object: "value", parameter: "3"}, options: {type: "number",min: 0, max: 10000}},
                    ]}
                ]
            }
        };
        this.activateKey = "g";

        const update = () => {
            this.command.update([this.values[0],this.values[1]], "ローカル", this.values[2], this.values[3]);
        }
        managerForDOMs.set(this.values, "_", null, update, null, "0");
        managerForDOMs.set(this.values, "_", null, update, null, "1");
        managerForDOMs.set(this.values, "_", null, update, null, "2");
        managerForDOMs.set(this.values, "_", null, update, null, "3");
    }

    async init() {
        if (app.scene.state.currentMode == "メッシュ編集") {
            this.command = new TranslateCommand(app.scene.state.selectedObject, await GPU.getSelectIndexFromBufferBit(app.scene.gpuData.graphicMeshData.selectedVertices));
            this.center = await app.scene.getSelectVerticesCenter(app.scene.gpuData.graphicMeshData.renderingVertices, app.scene.gpuData.graphicMeshData.selectedVertices);
        } else if (app.scene.state.currentMode == "頂点アニメーション編集") {
            // this.command = new TranslateCommand(app.scene.state.selectedObject);
        } else if (app.scene.state.currentMode == "ボーン編集") {
            this.command = new TranslateCommand(app.scene.state.selectedObject, await GPU.getSelectIndexFromBufferBit(app.scene.gpuData.boneModifierData.selectedVertices));
            this.center = await app.scene.getSelectVerticesCenter(app.scene.gpuData.boneModifierData.renderingVertices, app.scene.gpuData.boneModifierData.selectedVertices);
        } else if (app.scene.state.currentMode == "ベジェ編集") {
            this.command = new TranslateCommand(app.scene.state.selectedObject, await GPU.getSelectIndexFromBufferBit(app.scene.gpuData.bezierModifierData.selectedVertices));
            this.center = await app.scene.getSelectVerticesCenter(app.scene.gpuData.bezierModifierData.renderingVertices, app.scene.gpuData.bezierModifierData.selectedVertices);
        }
        this.command.setCenterPoint(this.center);
    }

    mousemove(/** @type {InputManager} */inputManager) {
        this.values[0] += inputManager.movement[0];
        this.values[1] += inputManager.movement[1];
        managerForDOMs.update(this.values);
    }

    mousedown(/** @type {InputManager} */inputManager) {
        this.operator.execute();
    }
}