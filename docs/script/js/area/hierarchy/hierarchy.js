import { app } from "../../app.js";
import { CreatorForUI } from "../補助/UIの自動生成.js";

export class Area_Hierarchy {
    constructor(/** @type {HTMLElement} */dom) {
        this.dom = dom;

        this.inputObject = {"h": app.hierarchy, "scene": app.scene};

        this.struct = {
            DOM: [
                {type: "option", name: "情報", children: [
                    {type: "gridBox", axis: "c", allocation: "1fr auto auto auto auto auto 1fr", children: [
                        {type: "padding", size: "10px"},

                        {type: "flexBox", interval: "5px", name: "", children: [
                            {type: "button", name: "aa", icon: "test", label: "test", options: {textContent: "test"}},
                            {type: "button", name: "aa", icon: "test", label: "test", options: {textContent: "test"}},
                            {type: "button", name: "aa", icon: "test", label: "test", options: {textContent: "test"}},
                        ]},

                        {type: "separator", size: "10px"},

                        {type: "flexBox", interval: "5px", name: "", children: [
                            {type: "buttons", name: "aa", icon: "test", label: "test", options: {textContent: "test"}},
                        ]},

                        {type: "separator", size: "10px"},

                        {type: "flexBox", interval: "5px", name: "", children: [
                            {type: "radios", name: "aa", icon: "test", label: "test", options: {textContent: "test"}},
                        ]},

                        {type: "padding", size: "10px"},
                    ]}
                ]},
                {type: "input", options: {type: "text"}},
                {type: "section", resize: true, name: "ヒエラルキー", children: [
                    {type: "hierarchy", name: "hierarchy", withObject: {object: "h/root"}, loopTarget: "children/objects", structures: [
                        {type: "gridBox", axis: "c", allocation: "auto auto 50% 1fr 20%", children: [
                            {type: "input", name: "visibleCheck", withObject: {object: "", parameter: "visible"}, options: {type: "check", look: "eye-icon"}},
                            {type: "icon-img", name: "icon", withObject: {object: "", parameter: "type"}},
                            {type: "dbInput", withObject: {object: "", parameter: "name"}, options: {type: "text"}},
                            {type: "padding", size: "10px"},
                            {type: "input", withObject: {object: "", parameter: "zIndex"}, options: {type: "number", min: 0, max: 100, step: 1}},
                        ]},
                    ]},
                ]},
                {type: "section", name: "基本情報", children: [
                    {type: "input", label: "test1", name: "test1", withObject: {object: "h/root/0", parameter: "zIndex"}, options: {type: "number",min: 0, max: 10}},
                    // {type: "input", label: "test", name: "test3", withObject: {object: "scene/graphicMeshs/0", parameter: "name"}},
                    // {type: "select", name: "test3", withObject: {object: "h/root/0", parameter: "name"}}
                ]},
                {type: "if", options: {type: "=", value0: {object: "scene/state/activeObject", parameter: "type"}, value1: "グラフィックメッシュ"},
                    result0: {type: "input", label: "test1", name: "test1", withObject: {object: "h/root/0", parameter: "zIndex"}, options: {type: "number",min: 0, max: 10}},
                    result1: {type: "input", label: "test1", name: "test1", withObject: {object: "h/root/0", parameter: "zIndex"}, options: {type: "number",min: 0, max: 10}},
                }
            ],
            utility: {
                "testTest": {}
            }
        };

        this.creator = new CreatorForUI();
        this.creator.create(dom, this);

        this.update();
    }

    update() {
        for (const object of app.hierarchy.root) {
            const div = document.createElement("div");
            div.textContent = object.name;
        }
    }
}