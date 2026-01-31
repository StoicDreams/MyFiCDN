/*!
 * Web UI Data - https://webui.stoicdreams.com/components#webui-code
 * A component for managing data within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    function extractJSON(template, key) {
        if (!key) {
            key = template.getAttribute('name');
            if (!key) return;
        }
        let current = webui.getData(key);
        if (current) return { key, value: undefined };
        let value = template.innerHTML;
        try {
            value = JSON.parse(value);
            return { key, value };
        } catch (ex) { console.error('Failed to parse JSON from template data', value, t); }
    }
    function extractHTML(template, key) {
        if (!key) {
            key = template.getAttribute('name');
            if (!key) return;
        }
        let current = webui.getData(key);
        if (current) return;
        let value = template.innerHTML;
        value = webui.trimLinePreWhitespce(value);
        return { key, value };
    }
    function extractText(template, key) {
        if (!key) {
            key = template.getAttribute('name');
            if (!key) return;
        }
        let current = webui.getData(key);
        if (current) return;
        let value = template.innerHTML;
        value = webui.trimLinePreWhitespce(value);
        return { key, value };
    }
    webui.define("webui-data", {
        constructor() {
            const t = this;
            t._slot = t.template.querySelector('slot:not([name])');
            t._slotHtml = t.template.querySelector('slot[name="html"]');
            t._slotText = t.template.querySelector('slot[name="text"]');
            t._slotJson = t.template.querySelector('slot[name="json"]');
        },
        connected() {
            const t = this;
            t._slotText.assignedElements().forEach(template => {
                let { key, value } = extractText(template);
                if (key && value) {
                    webui.setData(key, value);
                }
            });
            t._slotHtml.assignedElements().forEach(template => {
                let { key, value } = extractHTML(template);
                if (key && value) {
                    webui.setData(key, value);
                }
            });
            t._slotJson.assignedElements().forEach(template => {
                let { key, value } = extractJSON(template);
                if (key && value) {
                    webui.setData(key, value);
                }
            });
            Object.keys(t.dataset).forEach(key => {
                switch (key) {
                    case 'subscribe':
                    case 'trigger':
                    case 'click':
                        // ignore these data sets
                        return;
                }
                let value = t.dataset[key];
                try {
                    value = JSON.parse(value);
                } catch (ex) { }
                webui.setData(key, value);
            });
        },
        pushItem(value, key) {
            const t = this;
            if (!key || !value) return;
            let template = t.querySelector('template[slot="json"][data-update]');
            if (!template) {
                console.error('pushItem subscriptions should have an associated template[slot="json"][data-update="key-of-array-to-update"] template.');
                return;
            }
            let setKey = template.dataset.update;
            if (!setKey) {
                console.error('[data-update] does not have a valid value');
                return;
            }
            webui.setData(key, undefined);
            let data = webui.getData(setKey);
            if (!data) {
                console.error('Data not found for key', setKey);
                return;
            }
            if (typeof data.push !== 'function') {
                console.error('Data not in expected format', setKey, data);
                return;
            }
            data.push(value);
            webui.setData(setKey, data);
        },
        setDefault(value, key) {
            let current = webui.getData(key);
            if (current) return;
            const t = this;
            if (value) return;
            let template = t.querySelector(`template[name="${key}"]`);
            if (!template) {
                console.error('Expected template not found for key', key);
                return;
            }
            let slot = template.getAttribute('slot');
            if (!slot) {
                console.error('Templates in webui-data require a slot assignment');
                return;
            }
            try {
                let result = undefined;
                switch (slot) {
                    case 'json':
                        result = extractJSON(template, key);
                        break;
                    case 'html':
                        result = extractHTML(template, key);
                        break;
                    case 'text':
                        result = extractText(template, key);
                        break;
                }
                if (result !== undefined && result.key !== undefined && result.value !== undefined) {
                    webui.setData(result.key, result.value);
                }
            } catch (ex) { console.error(ex); }

        },
        shadowTemplate: `
<slot name="html"></slot>
<slot name="text"></slot>
<slot name="json"></slot>
<slot></slot>
<style type="text/css">
:host {
display:none;
}
</style>
`
    });
}
