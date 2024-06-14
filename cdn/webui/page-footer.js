/* Display page footer - component is replaced with appropriate footer content. */
{
    const template = ``;
    function flexGrow() {
        let fg = document.createElement('webui-flex');
        fg.setAttribute('grow', true);
        return fg;
    }
    class PageFooter extends HTMLElement {
        constructor() {
            super();
            const t = this;
            t._footer = document.createElement('footer');
            t._footer.setAttribute('slot', 'footer');
            t.parentNode.appendChild(t._footer);
            t._copyright = document.createElement('webui-paper');
            t._footer.appendChild(flexGrow());
            t._footer.appendChild(t._copyright);
            t._footer.appendChild(flexGrow());
            t._footer.appendChild(document.createElement('webui-poweredby'));
        }
        static get observedAttributes() {
            return ['copyright', 'company'];
        }
        buildCopyright() {
            let currentYear = new Date().getFullYear();
            let company = this.company || '';
            let year = parseInt(this.copyright || currentYear);
            if (!year) { year = currentYear; }
            if (year <= (currentYear - 2000)) { year += 2000; }
            if (year < 100) { year += 1900; }
            if (year < currentYear) {
                this._copyright.innerText = `© ${year}-${currentYear} ${company} All Rights Reserved`;
            } else {
                this._copyright.innerText = `© ${currentYear} ${company} All Rights Reserved`;
            }
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'company':
                    this.buildCopyright();
                    break;
                case 'copyright':
                    this.buildCopyright();
                    break;
            }
        }
        connectedCallback() {
            this.remove();
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-page-footer', PageFooter);
}