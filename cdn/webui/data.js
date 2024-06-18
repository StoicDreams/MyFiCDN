/* Component used for posting data to app from loaded html */
{
    function trimLinePreWhitespce(html) {
        let lines = [];
        html.split('\n').forEach(l => {
            lines.push(l.trim());
        });
        return lines.join('\n');
    }
    class Data extends HTMLElement {
        constructor() {
            super();
            const t = this;
            Object.keys(t.dataset).forEach(key => {
                switch (t.dataset[key]) {
                    case 'innerText':
                        webuiSetData(key, trimLinePreWhitespce(t.innerText));
                        break;
                    case 'innerHTML':
                        webuiSetData(key, trimLinePreWhitespce(t.innerHTML));
                        break;
                    default:
                        webuiSetData(key, t.dataset[key]);
                        break;
                }
            });
            t.remove();
        }
        static get observedAttributes() {
            return [];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-data', Data);
}
