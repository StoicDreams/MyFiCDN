/*!
 * Web UI Code - https://webui.stoicdreams.com/components#webui-code
 * A component for displaying code snippets.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const template = `
<label class="d-flex align-center"><span></span><webui-icon icon="copy" shade="tri" shape="circle" fill title="Copy Code" style="height:1rem"></webui-icon></label>
<pre>
<code></code>
</pre>`;
    webui.define('webui-code', {
        preload: 'icon',
        constructor: (t) => {
            let code = t.innerHTML.replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&');
            t.innerHTML = '';
            t._template = webui.create('div', { html: template });
            t._label = t._template.querySelector('label > span');
            t._copy = t._template.querySelector('label > webui-icon');
            t._pre = t._template.querySelector('pre');
            t._code = t._template.querySelector('code');
            t._copy.addEventListener('click', async ev => {
                ev.stopPropagation();
                ev.preventDefault();
                webui.copyToClipboard(t.value);
                return false;
            });
            t._code.innerText = webui.trimLinePreTabs(code.trim());
        },
        attr: ['language', 'lang', 'label', 'lines', 'nocopy', 'src'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'label':
                    t._label.innerHTML = value;
                    t.applyLabelDisplay();
                    break;
                case 'language':
                case 'lang':
                    webui.removeClass(t._code, 'language-');
                    t._pre.removeAttribute('languagetag');
                    if (!value) return;
                    t._pre.setAttribute('languagetag', value);
                    t._code.classList.add(`language-${webui.toSnake(value.replace(/[ ]+/g, '-'))}`, '-');
                    break;
                case 'lines':
                    t._code.style.height = `calc((${value} * var(--line-height)) + (2 * var(--padding)))`;
                    t._code.style.maxHeight = `calc((${value} * var(--line-height)) + (2 * var(--padding)))`;
                    break;
                case 'nocopy':
                    if (value === null || value === 'undefined') {
                        t._copy.style.display = '';
                    } else {
                        t._copy.style.display = 'none';
                    }
                    t.applyLabelDisplay();
                    break;
                case 'src':
                    t.loadFromSrc();
                    break;
            }
        },
        loadFromSrc: function () {
            const t = this;
            let src = t.src;
            if (!src) return;
            webui.fetchWithCache(src, false).then(content => {
                t.setValue(content);
            }).catch(ex => {
                t.setValue(`Failed to load file ${src}: ${ex}`);
            });
        },
        props: {
            'value': {
                get() { return webui.getDefined(this._code.innerText, ''); },
                set(v) { this.setValue(v); }
            }
        },
        setValue: function (value) {
            const t = this;
            if (value === undefined) {
                value = '';
            }
            if (typeof value !== 'string') {
                value = JSON.stringify(value, null, 2);
            }
            t._code.innerText = webui.trimLinePreTabs(value.trim());
            t._code.removeAttribute('data-hl');
            delete t._code.dataset.highlighted;
        },
        applyLabelDisplay: function () {
            const t = this;
            if (t._label.innerHTML || !t.nocopy) {
                t.classList.remove('hide-label');
            } else {
                t.classList.add('hide-label');
            }
        },
        connected: (t) => {
            while (t._template.childNodes.length > 0) {
                t.appendChild(t._template.childNodes[0]);
            }
        }
    });
}