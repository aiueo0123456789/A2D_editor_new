import { app } from '../app.js';
import { changeObjectName } from '../app/Hierarchy.js';
import { keysDown, stateMachine } from '../main.js';
import { createCheckbox, createIcon, managerForDOMs } from './制御.js';
import { activeOrClear } from '../コンテキストメニュー/制御.js';
import { changeParameter } from './utility.js';

export function select(a,b,bool) {
    return bool ? a : b;
}

function updateObject(object, groupID, DOM) {
    /** @type {HTMLElement} */
    const container = DOM.querySelector("div");

    const nameInputTag = container.querySelector("input[type=text]");
    if (nameInputTag.value != object.name) nameInputTag.value = object.name;
    if (object.type == "グラフィックメッシュ") {
        const zIndexInputTag = container.querySelector("input[type=number]");
        if (zIndexInputTag.value != object.zIndex) zIndexInputTag.value = object.zIndex;
    }
}

function updateHierarchy(objects, groupID, DOM) {
    /** @type {HTMLElement} */
    const ul = DOM;

    const pairData = new Map();

    // タグがないオブジェクトにタグを作る
    for (const object of app.hierarchy.allObject) {
        if (object.type != "アニメーションコレクター") {
            let listItem = managerForDOMs.getDOMInObjectAndGroupID(object, groupID);

            if (!listItem) {
                listItem = document.createElement("li");
                const tagsGroup = document.createElement("div");
                tagsGroup.className = "hierarchy";

                const childrenTag = document.createElement("ul");
                childrenTag.className = "children";

                const childrenHidBtn = createCheckbox("hidden-checkbox");
                childrenHidBtn.inputDOM.checked = true;
                tagsGroup.append(childrenHidBtn);

                childrenHidBtn.inputDOM.addEventListener("change", () => {
                    childrenTag.classList.toggle('hidden');
                })

                const nameInputTag = document.createElement("input");
                nameInputTag.type = "text";
                nameInputTag.value = object.name;
                nameInputTag.setAttribute('readonly', true);
                nameInputTag.classList.add("dblClickInput");

                const depthAndNameDiv = document.createElement("div");
                depthAndNameDiv.className = "hierarchy-name";
                depthAndNameDiv.append(nameInputTag);
                createIcon(depthAndNameDiv, object.type);

                if (object.type == "グラフィックメッシュ") {
                    const zIndexInput = document.createElement("input");
                    zIndexInput.className = "hierarchy-zIndex";
                    zIndexInput.type = "number";
                    zIndexInput.min = 0;
                    zIndexInput.max = 1000;
                    zIndexInput.step = 1;
                    zIndexInput.value = object.zIndex;

                    const visibleCheckbox = createCheckbox();
                    visibleCheckbox.classList.add("hierarchy-hide");
                    visibleCheckbox.inputDOM.checked = object.visible;

                    tagsGroup.append(childrenHidBtn,depthAndNameDiv, zIndexInput, visibleCheckbox);

                    zIndexInput.addEventListener('change', () => {
                        changeParameter(object, "zIndex", Number(zIndexInput.value));
                    });

                    visibleCheckbox.inputDOM.addEventListener('change', () => {
                        object.visible = visibleCheckbox.querySelector("input").checked;
                    });
                } else {
                    tagsGroup.append(childrenHidBtn,depthAndNameDiv);
                }

                tagsGroup.addEventListener('click', () => {
                    stateMachine.externalInputs["ヒエラルキーのオブジェクト選択"] = object;
                });

                nameInputTag.addEventListener('dblclick', () => {
                    nameInputTag.removeAttribute('readonly');
                    nameInputTag.focus();
                });

                nameInputTag.addEventListener('blur', () => {
                    changeObjectName(object, nameInputTag.value);
                    nameInputTag.setAttribute('readonly', true);
                });

                listItem.append(tagsGroup, childrenTag);

                listItem.dataset.parentName = "none";
                ul.append(listItem);
                managerForDOMs.set(object, groupID, listItem, updateObject);
            }
            activeOrClear(listItem.querySelector("div"), stateMachine.state.data.activeObject == object);
            if (stateMachine.state.data.activeObject != object && stateMachine.state.data.selectObjects) {
                activeOrClear(listItem.querySelector("div"), stateMachine.state.data.selectObjects.includes(object), true);
            }
            // activeOrClear(listItem.querySelector("ul"), stateMachine.state.data.activeObject == object, true);
            pairData.set(object, listItem);
        }
    }

    const fn = (targetID, target, objects) => {
        for (const child of objects) {
            /** @type {HTMLElement} */
            const childTag = pairData.get(child);
            if (childTag.dataset.parentName != targetID) {
                childTag.dataset.parentName = targetID;
                target.append(childTag);
            }
            if (child.children) {
                objectChildrenRoop(child);
            }
        }
    }

    const objectChildrenRoop = (object = "") => {
        if (object == "") {
            fn("hierarchyRoot", ul, app.hierarchy.root);
        } else {
            fn(object.id, pairData.get(object).querySelector("ul"), object.children.objects);
        }
    }

    objectChildrenRoop();
}

export function displayHierarchy(targetTag, groupID) {
    console.log("displayHierarchy")
    targetTag.className = 'grid-main'; // クラスを全て消す
    targetTag.replaceChildren();
    const scrollable = document.createElement("ul");
    scrollable.classList.add("scrollable","color2");
    targetTag.append(scrollable);

    const scrollableTag = targetTag.querySelector("ul");

    managerForDOMs.set("ヒエラルキー",groupID,scrollableTag,updateHierarchy);
    managerForDOMs.update("ヒエラルキー");
}