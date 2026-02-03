/*!
 * Web UI OpenAPI - https://webui.stoicdreams.com/components#webui-openapi
 * Render OpenAPI documentation with testing capability.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    function generatePlaceholderJson(schema) {
        if (!schema) {
            return {};
        }

        switch (schema.type) {
            case 'object':
                const obj = {};
                if (schema.properties) {
                    for (const key in schema.properties) {
                        obj[key] = generatePlaceholderJson(schema.properties[key]);
                    }
                }
                return obj;
            case 'array':
                if (schema.items) {
                    return [generatePlaceholderJson(schema.items)];
                }
                return [];
            case 'string':
                return '';
            case 'number':
            case 'integer':
                return 0;
            case 'boolean':
                return false;
            default:
                return null;
        }
    }
    webui.define('webui-openapi', {
        preload: 'dropdown alert flex button tabs input-message input-text grid',
        constructor() {
            this.baseUrl = '';
        },
        attr: ['src', 'hash'],
        attrChanged(property, _) {
            const t = this;
            console.log('attr changed', t.src);
            switch (property) {
                case 'src':
                    t.loadDoc();
                    break;
            }
        },
        connected() {
            this.loadDoc();
        },
        setSource(value) {
            const t = this;
            t.src = value;
            t.loadDoc();
        },
        async loadDoc() {
            const t = this;
            t.innerHTML = `<webui-alert theme="info" show>Enter your URL to view</webui-alert>`;
            console.log('source', t.src, webui.validateUrl(t.src));
            if (!t.src) return;
            if (t._loadedSrc === t.src) return;
            if (!webui.validateUrl(t.src)) return;
            t.innerHTML = `<webui-alert theme="info" show>Loading</webui-alert>`;
            t._loadedSrc = t.src;
            try {
                let doc = await webui.fetchWithCache(t.src, true);
                if (typeof doc === 'string') {
                    doc = JSON.parse(doc);
                }
                t.doc = doc;
                t.baseUrl = (doc.servers && doc.servers[0] && doc.servers[0].url) || '';
                t.render();
            } catch (ex) {
                t.innerHTML = `<webui-alert theme="danger" show>Failed to load OpenAPI: ${ex}</webui-alert>`;
            }
        },
        render() {
            const t = this;
            t.innerHTML = '';
            if (!t.doc || !t.doc.paths) return;
            const serverOptions = [];
            for (let index = 0; index < t.doc.servers.length; ++index) {
                const url = t.doc.servers[index].url;
                serverOptions.push({ value: url, display: url });
            }
            {
                const wrap = webui.create('webui-flex');
                t.appendChild(wrap);
                const serverSel = webui.create('webui-dropdown', { label: 'Servers' });
                wrap.appendChild(serverSel);
                serverSel.setOptions(serverOptions);
                serverSel.dataset.subscribe = `openapi-server-url:value`;
                serverSel.dataset.trigger = 'openapi-server-url:value';
                serverSel.addEventListener('change', _ => {
                    t.baseUrl = serverSel.value;
                });
            }
            const tabs = webui.create('webui-tabs', { vertical: true, pad: 'var(--padding)' });
            Object.keys(t.doc.paths).forEach(path => {
                const pathItem = t.doc.paths[path];
                Object.keys(pathItem).forEach(method => {
                    const ep = pathItem[method];
                    const label = `${method.toUpperCase()} ${path}`;
                    const btn = webui.create('webui-button', { slot: 'tabs', text: label, align: 'left' });
                    if (typeof t.hash === 'string') {
                        let hash = [];
                        if (t.hash) { hash.push(hash); }
                        hash.push(method.toLowerCase());
                        hash.push(path.replace(/[\/\\]+/g, '-'));
                        btn.setAttribute('hash', `${t.hash}${webui.toSnake(hash.join('-'), '-')}`);
                    }
                    tabs.appendChild(btn);
                    const content = webui.create('webui-content', { slot: 'content' });
                    tabs.appendChild(content);
                    content.loadSrc = (async function () {
                        content.innerHTML = '';
                        const header = webui.create('h3', { text: label });
                        content.appendChild(header);
                        const wrap = webui.create('webui-flex', { column: true });
                        content.appendChild(wrap);
                        if (ep.summary) {
                            const s = webui.create('webui-flex', { gap: 'var(--padding)' });
                            wrap.appendChild(s);
                            s.appendChild(webui.create('strong', { text: 'Summary:' }));
                            s.appendChild(webui.create('p', { text: ep.summary }));
                            if (ep.summary !== 'Missing Summary') {
                                btn.setAttribute('title', ep.summary);
                            }
                        }
                        if (ep.description) {
                            const d = webui.create('webui-flex', { gap: 'var(--padding)' });
                            wrap.appendChild(d);
                            d.appendChild(webui.create('strong', { text: 'Description' }));
                            d.appendChild(webui.create('p', { text: ep.description }));
                        }
                        content.appendChild(webui.create('h3', { text: 'Parameters' }));
                        const form = webui.create('form');
                        content.appendChild(form);
                        const params = webui.create('webui-flex', { column: true, align: 'center', justify: 'end' });
                        form.appendChild(params);
                        if (ep.parameters && ep.parameters.forEach) {
                            ep.parameters.forEach(param => {
                                const input = webui.create('webui-input-text', { label: `<strong class="color-info">[${webui.escapeCode(param.in)}]</strong> ${webui.escapeCode(param.name)}`, required: param.required, theme: 'primary' });
                                params.appendChild(input);
                                switch (`${param.in.toLowerCase()}-${param.name.toLowerCase()}`) {
                                    case 'header-cookie':
                                        input.setAttribute('disabled', true);
                                        input.value = 'Cookies must be controlled by the API server.';
                                        break;
                                    case 'header-origin':
                                        input.setAttribute('disabled', true);
                                        input.value = 'Origin is included by the browser.';
                                        break;
                                    case 'header-user-agent':
                                        input.setAttribute('disabled', true);
                                        input.value = 'User Agent is included by the browser.';
                                        break;
                                    default:
                                        input.dataset.paramName = param.name;
                                        input.dataset.paramIn = param.in;
                                        if (param.description) {
                                            input.setAttribute('placeholder', param.description);
                                        }
                                        break;
                                }
                            });
                        }
                        if (ep.requestBody && ep.requestBody.content && ep.requestBody.content['application/json']) {
                            const schema = ep.requestBody.content['application/json'].schema;
                            switch (schema.type) {
                                case 'object':
                                    if (schema.properties) {
                                        for (const key in schema.properties) {
                                            let info = schema.properties[key];
                                            switch (info.type) {
                                                case 'object':
                                                    {
                                                        let field = webui.create('webui-input-message', { name: key, label: key, placeholder: '{}', theme: 'primary', title: info.type });
                                                        if (info.items) {
                                                            const placeholderJson = generatePlaceholderJson(info.items);
                                                            field.value = JSON.stringify(placeholderJson, null, 2);
                                                        } else {
                                                            field.value = '{}';
                                                        }
                                                        params.appendChild(field);
                                                    }
                                                    break;
                                                case 'array':
                                                    {
                                                        let field = webui.create('webui-input-message', { name: key, label: key, placeholder: '[]', theme: 'primary', title: info.type });
                                                        if (info.items) {
                                                            const placeholderJson = generatePlaceholderJson(info.items);
                                                            field.value = JSON.stringify(placeholderJson, null, 2);
                                                        } else {
                                                            field.value = '[]';
                                                        }
                                                        params.appendChild(field);
                                                    }
                                                    break;
                                                case 'string':
                                                    {
                                                        let field = webui.create('webui-input-message', { name: key, label: key, placeholder: '', theme: 'primary', title: info.type });
                                                        params.appendChild(field);
                                                    }
                                                    break;
                                                case 'number':
                                                case 'integer':
                                                case 'boolean':
                                                    {
                                                        let field = webui.create('webui-input-text', { name: key, label: key, placeholder: '', theme: 'primary', title: info.type });
                                                        params.appendChild(field);
                                                    }
                                                    break;
                                                default:
                                                    console.warn("Unexpected schema type %s for %s", info.type, key);
                                                    break;
                                            }
                                        }
                                    } else {
                                        let field = webui.create('webui-input-message', { name: 'body', label: 'body - object', placeholder: '{}', theme: 'primary' });
                                        params.appendChild(field);
                                    }
                                    break;
                                case 'array':
                                    {
                                        let field = webui.create('webui-input-message', { name: 'body', label: 'body - array', placeholder: '[]', theme: 'primary' });
                                        params.appendChild(field);
                                        if (schema.items) {
                                            const placeholderJson = generatePlaceholderJson(schema.items);
                                            field.value = JSON.stringify(placeholderJson, null, 2);
                                        } else {
                                            field.value = '[]';
                                        }
                                    }
                                    break;
                                case 'string':
                                    {
                                        let field = webui.create('webui-input-message', { name: 'body', label: 'body - string', placeholder: '', theme: 'primary' });
                                        params.appendChild(field);
                                    }
                                    break;
                                case 'number':
                                case 'integer':
                                    {
                                        let field = webui.create('webui-input-message', { name: 'body', label: `body - ${schema.type}`, placeholder: '0', theme: 'primary' });
                                        params.appendChild(field);
                                    }
                                    break;
                                case 'boolean':
                                    {
                                        let field = webui.create('webui-input-message', { name: 'body', label: 'body - boolean', placeholder: 'true|false', theme: 'primary' });
                                        params.appendChild(field);
                                    }
                                    break;
                                default:
                                    console.warn("Unexpected schema type", schema.type);
                                    break;
                            }
                        }
                        const sendBtn = webui.create('webui-button', { text: 'Send', theme: 'primary' });
                        params.appendChild(sendBtn);
                        content.appendChild(webui.create('h4', { text: 'Response' }));
                        const result = webui.create('webui-flex', { column: true, class: "content" });
                        content.appendChild(result);
                        sendBtn.addEventListener('click', async ev => {
                            ev.preventDefault();
                            let url = path;
                            const query = [];
                            const headers = { 'Content-Type': 'application/json' };
                            webui.querySelectorAll('[data-param-name]', form).forEach(inp => {
                                const val = inp.value;
                                const name = inp.dataset.paramName;
                                switch (inp.dataset.paramIn) {
                                    case 'path':
                                        url = url.replace(`{${name}}`, val);
                                        break;
                                    case 'query':
                                        if (val) query.push(`${encodeURIComponent(name)}=${encodeURIComponent(val)}`);
                                        break;
                                    case 'header':
                                        headers[name] = val;
                                        break;
                                    default:
                                        console.warn('unhandled param in', inp.dataset.paramIn);
                                        break;
                                }
                            });
                            url = `${t.baseUrl}${url}${query.length ? '?' + query.join('&') : ''}`;
                            const options = {
                                method: method.toUpperCase(),
                                credentials: 'include',
                                mode: 'cors',
                                cache: 'no-cache',
                                headers
                            };
                            let formData = new FormData(form);
                            const jsonData = Object.fromEntries(formData);
                            if (jsonData.body) {
                                options.body = jsonData.body;
                            } else if (Object.keys(jsonData).length > 0) {
                                options.body = JSON.stringify(jsonData, null, 2);
                            }
                            result.innerHTML = '';
                            try {
                                const resp = await fetch(url, options);
                                let text = await resp.text();
                                let lang = 'Text';
                                try {
                                    text = JSON.stringify(JSON.parse(text), null, 2);
                                    lang = "Json";
                                } catch (_) { }
                                let label = `[${resp.status}]`;
                                const respDisplay = webui.create('webui-grid', { columns: 'max-content 1fr' });
                                result.appendChild(respDisplay);
                                ['url', 'status', 'statusText', 'ok'].forEach(key => {
                                    respDisplay.appendChild(webui.create('strong', { text: key }));
                                    let value = resp[key];
                                    try {
                                        if (typeof value === 'object') {
                                            value = JSON.stringify(value, null, 2);
                                        }
                                    } catch { }
                                    respDisplay.appendChild(webui.create('code', { text: value, class: 'px-1' }))

                                });
                                result.appendChild(webui.create('h5', { text: 'Response Headers' }));
                                const headersDisplay = webui.create('webui-grid', { columns: 'max-content 1fr', gap: '8px' });
                                for (const [key, value] of resp.headers.entries()) {
                                    headersDisplay.appendChild(webui.create('strong', { text: key, class: "px-1" }));
                                    headersDisplay.appendChild(webui.create('code', { text: value, class: 'px-1' }));
                                }
                                result.appendChild(headersDisplay);
                                result.appendChild(webui.create('h6', { text: 'Response Body' }));
                                const code = webui.create('webui-code', { lang, label });
                                result.appendChild(code);
                                code.setValue(text);
                            } catch (ex) {
                                result.appendChild(webui.create('webui-alert', { variant: 'danger', text: ex.toString(), show: true }));
                            }
                        });
                    });
                });
            });
            t.appendChild(tabs);
        }
    });
}
