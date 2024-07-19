/* Component used for posting data to app from loaded html */
"use strict"
webui.define("webui-data", {
    constructor: (t) => {
        t._slot = t.template.querySelector('slot:not([name])');
        t._slotHtml = t.template.querySelector('slot[name="html"]');
        t._slotText = t.template.querySelector('slot[name="text"]');
        t._slotJson = t.template.querySelector('slot[name="json"]');
    },
    connected: (t) => {
        t._slotText.assignedElements().forEach(template => {
            let key = template.getAttribute('name');
            if (!key) return;
            // TODO: Update me once I can rewrite the markdown parser to ignore template content
            let value = template.innerHTML.replace(/\<p\>/g, '').replace(/\<\/p\>/g, '');
            webui.setData(key, webui.trimLinePreWhitespce(value));
        });
        t._slotHtml.assignedElements().forEach(template => {
            let key = template.getAttribute('name');
            if (!key) return;
            let value = template.innerHTML;
            webui.setData(key, webui.trimLinePreWhitespce(value));
        });
        t._slotJson.assignedElements().forEach(template => {
            let key = template.getAttribute('name');
            if (!key) return;
            // TODO: Update me once I can rewrite the markdown parser to ignore template content
            let value = template.innerHTML.replace(/\<p\>/g, '').replace(/\<\/p\>/g, '');
            try {
                value = JSON.parse(value);
                webui.setData(key, value);
            } catch (ex) { console.error('Failed to parse JSON from template data', value, t); }
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