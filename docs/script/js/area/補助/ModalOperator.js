import { app } from "../../app.js";
import { InputManager } from "../../app/InputManager.js";
import { createTag } from "../../UI/制御.js";
import { CreatorForUI } from "./UIの自動生成.js";

export class ModalOperator {
    constructor(dom, modals) {
        if (dom) {
            this.dom = createTag(dom, "div", {style: "width: 100%; height: 100%; position: absolute; pointerEvents: none;"});
        } else {
            this.dom = null;
        }
        this.modals = modals;
        this.nowModal = null;
        this.creatorForUI = new CreatorForUI();
    }

    execute() {
        this.nowModal = null;
    }

    setModal(model) {
        this.nowModal = new model(this);
        this.nowModal.init(app.scene.state.currentMode);
        if (this.dom) {
            this.creatorForUI.remove();
            const template = {type: "div", style: "backgroundColor: rgba(0,0,0,0.5)"};
            if (this.nowModal.modal) {
                // struct1.struct.DOM
                this.creatorForUI.shelfeCreate(this.dom, this.nowModal.modal);
            }
        }
    }

    keyInput(/** @type {InputManager} */inputManager) {
        if (this.nowModal) {
            if (inputManager.consumeKeys([this.nowModal.activateKey])) {
                // this.nowModal.command.execute();
                app.operator.appendCommand(this.nowModal.command);
                app.operator.update();
                this.nowModal = null;
            } else {
                this.nowModal.update(inputManager);
            }
        } else {
            for (const key in this.modals) {
                if (inputManager.consumeKeys([key])) {
                    this.setModal(this.modals[key]);
                }
            }
        }
    }

    mousemove(/** @type {InputManager} */inputManager) {
        if (this.nowModal) {
            this.nowModal.mousemove?.(inputManager);
            return true;
        }
        return false;
    }
    mousedown(/** @type {InputManager} */inputManager) {
        if (this.nowModal) {
            app.operator.appendCommand(this.nowModal.command);
            app.operator.update();
            this.nowModal = null;
            return true;
        }
        return false;
    }
}