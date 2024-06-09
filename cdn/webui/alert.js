/* Display inline alert message */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
display:none;
flex-direction:row;
gap:var(--padding);
padding:var(--padding, 1em);
align-items:center;
justify-content:start;
opacity:0;
transform:scaleY(0);
transition:all 0.4s ease-out allow-discrete;
background-color:inherit;
color:inherit;
}
:host>div {
flex-grow:1;
}
:host([show]) {
display:flex;
opacity:1;
transform:scaleY(1);
}
@starting-style {
:host([show]) {
opacity:0;
transform:scaleY(0);
}
}
button {
display:inline-flex;
cursor:pointer;
padding:var(--button-padding, 0.5em 1em);
align-items:center;
justify-content:center;
border:none;
background:none;
color:inherit;
border-radius:var(--corners);
}
</style>
<webui-fa id="icon" icon="" family="solid"></webui-fa>
<div><slot></slot></div>
<button id="close"><webui-fa icon="xmark" family="solid"></webui-fa></button>
`;
    class Alert extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            const t = this;
            t.template = template.content.cloneNode(true);
            t.icon = t.template.querySelector('#icon');
            t.btnClose = t.template.querySelector('#close');
            t.btnClose.addEventListener('click', ev => {
                t.userclosed = true;
                t.removeAttribute('show');
            });
            shadow.appendChild(t.template);
        }
        static get observedAttributes() {
            return ['variant', 'show'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            switch (property) {
                case 'variant':
                    this.setVariant(newValue);
                    break;
                case 'show':
                    break;
            }
        }
        clearThemes() {
            this.classList.forEach(c => {
                if (c.startsWith('theme-')) {
                    this.classList.remove(c);
                }
            });
        }
        setVariant(variant) {
            this.clearThemes();
            this.style.backgroundColor = `var(--color-${variant})`;
            this.style.color = `var(--color-${variant}-offset)`;
            this.classList.add(`theme-${variant}`);
            switch (variant) {
                case "danger":
                    this.icon.setAttribute('icon', 'hexagon-exclamation');
                    break;
                case "success":
                    this.icon.setAttribute('icon', 'thumbs-up');
                    break;
                case "info":
                    this.icon.setAttribute('icon', 'circle-exclamation');
                    break;
                default:
                    this.icon.setAttribute('icon', 'triangle-exclamation');
                    break;
            }
        }
        connectedCallback() {
            if (!this.variant) {
                this.setVariant('warning');
            }
            if (!this.getAttribute('preload')) {
                this.setAttribute('preload', 'fa');
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-alert', Alert);
}
