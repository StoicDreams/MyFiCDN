"use strict"
{
    webui.define('webui-code', {
        constructor: (t) => {
            let code = t.innerHTML;
            t.innerHTML = webui.trimLinePreTabs(`
            <label></label>
            <pre>
            <code></code>
            </pre>
            `);
            t._label = t.querySelector('label');
            t._pre = t.querySelector('pre');
            t._code = t.querySelector('code');
            t._code.innerText = code;
        },
        attr: ['language', 'lang', 'label', 'lines'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'label':
                    t._label.innerHTML = value;
                    break;
                case 'language':
                case 'lang':
                    webui.removeClass(t._code, 'language-');
                    t._pre.removeAttribute('languagetag');
                    if (!value) return;
                    t._pre.setAttribute('languagetag', value);
                    t._code.classList.add(`language-${webui.toSnake(value.replace(/[ ]+/g, '-'))}`);
                    break;
                case 'lines':
                    t._code.style.height = `calc((${value} * var(--line-height)) + (2 * var(--padding)))`;
                    t._code.style.maxHeight = `calc((${value} * var(--line-height)) + (2 * var(--padding)))`;
                    break;
            }
        },
        setValue: function (value) {
            let t = this;
            if (value === undefined) {
                value = '';
            }
            if (typeof value !== 'string') {
                value = JSON.stringify(value, null, 2);
            }
            t._code.innerText = value;
            t._code.removeAttribute('data-hl');
            delete t._code.dataset.highlighted;
        },
        connected: (t) => {
        }
    });
}