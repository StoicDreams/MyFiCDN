/*!
 * Web UI Json Condensed - https://webui.stoicdreams.com/components#webui-json-condensed
 * A component for condensing and displaying JSON data within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    function condense(data, maxLength) {
        switch (typeof data) {
            case 'string':
                if (data.length <= maxLength) return data;
                return `${data.substring(0, maxLength)}...`;
            case 'number':
                return data;
            default:
                if (data.forEach && typeof data.forEach === 'function') {
                    let ret = [];
                    data.forEach(item => {
                        ret.push(condense(item, maxLength));
                    });
                    return ret;
                }
                let ret = {};
                Object.keys(data).forEach(key => {
                    ret[key] = condense(data[key], maxLength);
                });
                return ret;
        }
    }
    function condenseJson(json, maxLength) {
        if (json === undefined || json === null) return '';
        try {
            if (typeof json !== 'string') {
                json = JSON.stringify(json);
            }
            let data = JSON.parse(json, null, 2);
            return condense(data, maxLength);
        } catch (ex) {
            console.error('Invalid data to condense', ex);
        }
    }
    webui.define('webui-json-condensed', {
        preload: "message",
        constructor: (t) => {
            t.limit = 20;
        },
        attr: ['limit', 'data-subscribe', 'data-trigger', 'value'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'limit':
                    t.limit = parseInt(value) || 20;
                    break;
                case 'value':
                    t.setValue(value);
                    break;
            }
        },
        connected: (t) => { },
        setValue: function (value) {
            const t = this;
            t.condensed = condenseJson(value, t.limit);
            if (t.dataTrigger) {
                webui.setData(t.dataTrigger, t.condensed);
            }
        },
        shadowTemplate: `
<slot name="template"></slot>
<style type="text/css">
:host {
display:none;
}
</style>`
    });
}
