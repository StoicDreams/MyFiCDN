/* Display side-by-side content where one side is an image */
"use strict"
{
    class SideImage extends HTMLElement {
        constructor() {
            super();
            let t = this;
            t._content = document.createElement('webui-flex');
            t._sideImage = document.createElement('img');
            t._imgContainer = document.createElement('webui-flex');
        }
        static get observedAttributes() {
            return ['elevation', 'reverse', 'src'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            let t = this;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                t[property] = newValue;
            }
            switch (property) {
                case 'src':
                    t._sideImage.setAttribute('src', newValue);
                    break;
                case 'elevation':
                    let v = parseInt(newValue);
                    if (v > 0) {
                        t.classList.add(`elevation-${v}`);
                    } else if (v < 0) {
                        t.classList.add(`elevation-n${v * -1}`);
                    }
                    break;
                case 'reverse':
                    t.reverse = true;
                    if (t._imgContainer.parentNode && t._content.parentNode) {
                        t.insertBefore(t._imgContainer, t._content);
                    }
                    break;
            }
        }
        connectedCallback() {
            let t = this;
            t.classList.add('side-by-side');
            t._content.setAttribute('column', true);
            t._content.setAttribute('align', 'center');
            t._content.setAttribute('justify', 'center');
            t.appendChild(t._content);
            t._imgContainer.setAttribute('align', 'center');
            t._imgContainer.setAttribute('justify', 'center');
            if (t.reverse) {
                t.insertBefore(t._imgContainer, t._content);
            } else {
                t.appendChild(t._imgContainer);
            }
            t._imgContainer.appendChild(t._sideImage);
            setTimeout(() => {
                let r = [];
                t.childNodes.forEach(node => {
                    if (node !== t._content && node !== t._imgContainer) {
                        r.push(node);
                    }
                });
                r.forEach(node => {
                    node.parentNode.removeChild(node);
                    t._content.appendChild(node);
                });
            }, 100);
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-sideimage', SideImage);
}
