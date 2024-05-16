/* Dynamically load font-awesome svg icons as requested */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
    :host {
        display: inline-flex;
        align-items: center;
        justify-items: center;
    }
    svg {
        height: 2ch;
        width: 3ch;
        fill: currentColor;
        line-height: 2ch;
        vertical-align: middle;
        stroke: currentColor;
        stroke-width: 10;
    }
    svg path {
        transition: 0.2s;
    }
</style>
<slot name="icon"></slot>
`;
    function getSvg(svgHtml) {
        let wrap = document.createElement('div');
        wrap.innerHTML = svgHtml;
        return wrap.querySelector('svg');
    }
    const faCache = {
        'regular': {
            'triangle-exclamation': getSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M27.4 432L0 480H55.3 456.7 512l-27.4-48L283.6 80.4 256 32 228.4 80.4 27.4 432zm401.9 0H82.7L256 128.7 429.3 432zM232 296v24h48V296 208H232v88zm48 104V352H232v48h48z"/></svg>`)
        }
    };
    class FontAwesome extends HTMLElement {
        constructor() {
            super();
            this.loadid = 0;
            this.svg = faCache.regular['triangle-exclamation'].cloneNode(true);
            this.icon = "triangle-exclamation";
            this.family = 'regular';
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this.iconSlot = this.template.querySelector('slot[name=icon]');
            this.iconSlot.appendChild(this.svg);
            this.paths = Array.from(this.svg.querySelectorAll('path'));
            shadow.appendChild(this.template);
        }
        static get observedAttributes() {
            return ['icon', 'family', 'class'];
        }
        attachSvg(svg) {
            let index = 0;
            let vb = svg.getAttribute('viewBox');
            this.svg.setAttribute('viewBox', vb);
            svg.childNodes.forEach(path => {
                if (path.nodeName === '#comment') return;
                if (index + 1 > this.paths.length) {
                    let newPath = document.createElement('path');
                    this.svg.appendChild(newPath);
                    this.paths.push(newPath);
                }
                this.paths[index++].setAttribute('d', path.getAttribute('d'));
            });
            while (++index < this.paths.length) {
                this.paths[index - 1].setAttribute('d', '');
            }
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            if (property === 'icon' || property === 'family') {
                let loadid = this.loadid + 1;
                this.loadid = loadid;
                setTimeout(() => {
                    if (this.loadid !== loadid) return;
                    this.updateIcon();
                }, 500);
            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
        async updateIcon() {
            let name = this.icon;
            let family = this.family;
            if (!name || !family) {
                this.svg = ``;
                return;
            }
            if (!faCache[family]) {
                faCache[family] = {};
            }
            if (!faCache[family][name]) {
                let result = await fetch(`https://cdn.myfi.ws/fa/svgs/${family}/${name}.svg`);
                if (!result.ok) return;
                let svg = await result.text();
                if (!svg.startsWith("<svg")) return;
                faCache[family][name] = getSvg(svg);
            }
            this.attachSvg(faCache[family][name]);
        }
    }
    customElements.define('webui-fa', FontAwesome);
}
