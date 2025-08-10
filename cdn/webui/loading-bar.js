/*!
 * Web UI Loading Bar - https://webui.stoicdreams.com/components#loading-bars
 * A component for displaying and managing loading bars within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-loading-bar", {
        constructor: (t) => {
            t._box = t.template.querySelector('div:nth-child(2)');
        },
        flags: ['indeterminate', 'striped'],
        attr: ['height', 'percent'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.setHeight(value);
                    break;
                case 'percent':
                    let num = parseFloat(value) || 0;
                    t._box.style.width = `${num}%`;
                    break;
            }
            t.render();
        },
        connected: (t) => {
            t.render();
        },
        render: function () {
            const t = this;
        },
        shadowTemplate: `
<div></div>
<div></div>
<div></div>
<style type="text/css">
:host {
display:flex;
flex-direction:row;
height:auto;
overflow:hidden;
box-sizing:border-box;
flex-grow:1;
position:relative;
--theme-color: var(--color-title);
--my-theme: rgba(from var(--theme-color) R G B / 0.25);
--my-background: rgba(from var(--theme-color) R G B / 0.50);
}
:host(:not([height])) {
min-height:1px;
}
div {
height:102%;
width: auto;
position:relative;
transition-property: width;
transition-duration: 100ms;
transform-origin: left;
overflow: hidden;
box-sizing: border-box;
}
div:nth-child(1) {
background-color: inherit;
background-image: none;
width: 0%;
}
div:nth-child(2) {
background: transparent;
width: 0%;
}
div:nth-child(3) {
flex-grow: 1;
}
div:nth-child(1)::before,
div:nth-child(3)::before {
content: " ";
display: block;
position: absolute;
width: 100%;
height: 100%;
background-color: var(--my-background);
}
:host([indeterminate]) > div:nth-child(1)::before,
:host([indeterminate]) > div:nth-child(3)::before {
background: linear-gradient(to right, rgba(0,0,0,0) 3%, rgba(0,0,0,0) 5%, var(--my-background) 30%, var(--theme-color) 40%, var(--theme-color) 50%, var(--my-background) 60%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 97%);
}
:host([indeterminate]) > div {
transition-duration: 0s;
}
:host(:not([indeterminate])) > div:nth-child(2) {
background-color: var(--theme-color);
}
:host([indeterminate][striped]) > div {
animation: 50s 0s linear infinite reverse linear-striped-loading;
}
:host([indeterminate]) > div:nth-child(1) {
animation: 2.6s 0s cubic-bezier(.65, .815, .735, .395) infinite forwards horizontal-keyframes-indeterminate1;
}
:host([indeterminate]) > div:nth-child(2) {
animation: 2.6s 0s cubic-bezier(.65, .815, .735, .395) infinite forwards horizontal-keyframes-indeterminate2;
}
:host([striped]) {
background-image: linear-gradient(135deg, var(--my-theme) 25%, transparent 0, transparent 50%, var(--my-theme) 0, var(--my-theme) 75%, transparent 0, transparent);
background-size: 2rem 2rem;
animation: linear-striped-loading 90s linear infinite reverse;
}
:host([striped]) > div {
background-repeat: repeat;
}
@keyframes horizontal-keyframes-indeterminate1 {
0% {
width: 0%;
}
25% {
width: 40%;
}
50% {
width: 100%;
}
51% {
width: 0%;
}
75% {
width: 20%;
}
100% {
width: 100%;
}
}
@-webkit-keyframes horizontal-keyframes-indeterminate1 {
0% {
width: 0%;
}
25% {
width: 40%;
}
50% {
width: 100%;
}
51% {
width: 0%;
}
75% {
width: 20%;
}
100% {
width: 100%;
}
}
@keyframes horizontal-keyframes-indeterminate2 {
0% {
width: 0%;
}
25% {
width: 50%;
}
50% {
width: 0%;
}
51% {
width: 0%;
}
75% {
width: 80%;
}
99% {
width: 100%;
}
100% {
width: 0%;
}
}
@-webkit-keyframes horizontal-keyframes-indeterminate2 {
0% {
width: 0%;
}
25% {
width: 50%;
}
50% {
width: 0%;
}
51% {
width: 0%;
}
75% {
width: 80%;
}
99% {
width: 100%;
}
100% {
width: 0%;
}
}
@keyframes linear-striped-loading {
0% {
background-position: 0 0;
}
100% {
background-position: 100rem 0;
}
}
@-webkit-keyframes linear-striped-loading {
0% {
background-position: 0 0;
}
100% {
background-position: 100rem 0;
}
}
</style>
`
    });
}