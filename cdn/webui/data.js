/* Component used for posting data to app from loaded html */
"use strict"
{
    function extractJSON(template, key) {
        if (!key) {
            key = template.getAttribute('name');
            if (!key) return;
        }
        // TODO: Update me once I can rewrite the markdown parser to ignore template content
        let value = template.innerHTML.replace(/\<p\>/g, '').replace(/\<\/p\>/g, '');
        try {
            value = JSON.parse(value);
            webui.setData(key, value);
        } catch (ex) { console.error('Failed to parse JSON from template data', value, t); }
    }
    function extractHTML(template, key) {
        if (!key) {
            key = template.getAttribute('name');
            if (!key) return;
        }
        let value = template.innerHTML;
        webui.setData(key, webui.trimLinePreWhitespce(value));
    }
    function extractText(template, key) {
        if (!key) {
            key = template.getAttribute('name');
            if (!key) return;
        }
        // TODO: Update me once I can rewrite the markdown parser to ignore template content
        let value = template.innerHTML.replace(/\<p\>/g, '').replace(/\<\/p\>/g, '');
        webui.setData(key, webui.trimLinePreWhitespce(value));
    }
    webui.define("webui-data", {
        constructor: (t) => {
            t._slot = t.template.querySelector('slot:not([name])');
            t._slotHtml = t.template.querySelector('slot[name="html"]');
            t._slotText = t.template.querySelector('slot[name="text"]');
            t._slotJson = t.template.querySelector('slot[name="json"]');
        },
        connected: (t) => {
            t._slotText.assignedElements().forEach(template => {
                extractText(template);
            });
            t._slotHtml.assignedElements().forEach(template => {
                extractHTML(template);
            });
            t._slotJson.assignedElements().forEach(template => {
                extractJSON(template);
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
        pushItem: function (value, key) {
            let t = this;
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
        setDefault: function (value, key) {
            let t = this;
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
                switch (slot) {
                    case 'json':
                        extractJSON(template, key);
                        break;
                    case 'html':
                        extractHTML(template, key);
                        break;
                    case 'text':
                        extractText(template, key);
                        break;
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
