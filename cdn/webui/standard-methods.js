"use strict"
{
    /**
     * TODO: Need to handle
     * - handle parameters with ...args syntax
     * - bug: description missing first word
     * - handle and document optional parameters
     */
    function parseWebUIMethods(source) {
        const body = extractClassBody(source);
        if (!body) return [];
        const methods = [];
        const lines = body.split(/[\r\n]+/);
        let currentMetadata = startCommentObject();
        let currentMethod = startMethodObject();
        let isExample = false;
        for (let index = 0; index < lines.length; index++) {
            if (lines[index].trim() === '') continue;
            let [, fieldName] = lines[index].match(/^[\s]{8}([A-Za-z0-9_]+) = .*;/) || [];
            if (!!fieldName) {
                currentMethod.name = fieldName;
                currentMethod.type = 'field';
                currentMethod.description = webui.escapeCode(currentMetadata.description.join('\n')).trim();
                currentMethod.returns = currentMetadata.returns;
                currentMethod.line = index;
                currentMethod.examples = currentMetadata.examples;
                methods.push(currentMethod);
                currentMetadata = startCommentObject();
                currentMethod = startMethodObject();
                continue;
            }
            if (/^[\s]{8}\/\*\*$/.test(lines[index])) {
                isExample = false;
                currentMetadata = startCommentObject();
                continue;
            }
            if (/^[\s]{9}\*\/$/.test(lines[index])) {
                isExample = false;
                continue;
            }
            let [, , key, , type, paramName, , text] = lines[index].match(/^[\s]{9}\*\s?(@([a-z]+))?\s?(\{([A-Za-z\|]+)\})?\s?([A-Za-z0-9_]+)?\s?(-)?\s?(.*)?$/) || [];
            if (key || type || paramName || text) {
                if (!key) {
                    text = lines[index].match(/^[\s]{9}\*\s?(.*)$/)[1];
                    if (isExample) {
                        currentMetadata.examples[currentMetadata.examples.length - 1] += `${text}\n`;
                        continue;
                    }
                    if (text) {
                        currentMetadata.description.push(text);
                    }
                } else {
                    switch (key) {
                        case 'param':
                            if (!paramName && text) {
                                paramName = text;
                                text = '';
                            }
                            if (!paramName) {
                                console.error('Param is missing paramName |%s|type:%s|text:%s|', lines[index], type, text, lines[index].match(/^[\s]{9}\*( \@([a-z]+))?( \{([A-Za-z\|]+)\})?( ([A-Za-z0-9_]+) -)? ?(.+)?$/));
                                continue;
                            }
                            let pd = {};
                            if (type) {
                                pd.type = type;
                            }
                            if (text) {
                                pd.description = webui.escapeCode(text);
                            }
                            currentMetadata.parameters[paramName] = pd;
                            break;
                        case 'returns':
                            if (type) {
                                currentMetadata.returns.type = type;
                            }
                            if (text) {
                                currentMetadata.returns.description = text.trim();
                            }
                            break;
                        case 'example':
                            currentMetadata.examples.push(paramName ? `[${paramName}]` : '');
                            isExample = true;;
                            break;
                        default:
                            console.error('unexpected key %s', key);
                            break;
                    }
                }
                continue;
            }
            isExample = false;
            let [, , getset, funcName, args, , closing] = lines[index].match(/^[\s]{8}((get|set) )?([A-Za-z0-9_]+)\(([^\)]+)?\) ?\{.*(\})?$/) || [];
            if (['constructor'].indexOf(funcName) !== -1) {
                continue;
            }
            if (funcName) {
                currentMethod.name = funcName;
                args = !!args ? args.split(',').map(m => m.trim()) : [];
                args.forEach(arg => {
                    arg = arg.split(/[ =]+/);
                    let name = arg[0].trim();
                    let def = arg.length > 1 ? arg[1] : '';
                    let p = { name };
                    if (def) {
                        p.default = def;
                    }
                    if (currentMetadata.parameters[name]) {
                        let mp = currentMetadata.parameters[name];
                        Object.keys(mp).forEach(key => {
                            p[key] = mp[key];
                        });
                    }
                    currentMethod.parameters.push(p);
                });
                currentMethod.type = getset ? getset : 'method';
                currentMethod.description = webui.escapeCode(currentMetadata.description.join('\n')).trim();
                currentMethod.returns = currentMetadata.returns;
                currentMethod.line = index;
                currentMethod.examples = currentMetadata.examples;
                methods.push(currentMethod);
                currentMetadata = startCommentObject();
                currentMethod = startMethodObject();
            }
        }
        return methods.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
    }
    function startCommentObject() {
        return {
            description: [],
            parameters: {},
            returns: { type: undefined, description: '' },
            examples: []
        };
    }
    function startMethodObject() {
        return {
            name: '',
            parameters: [],
            type: '',
            description: '',
            returns: undefined,
            examples: [],
            line: 0
        };
    }
    function extractClassBody(src) {
        return src.match(/(class WebUI \{(.*)\})[\n\s]+const webui/s)[2];
    }
    function fixSpecialCharacters(text) {
        return text.replace(/\|/g, '<i class="vl"></i>');
    }
    const isLocalDev = location.port === '3180';
    const srcRoot = isLocalDev ? '' : 'https://cdn.myfi.ws';
    webui.define("webui-standard-methods", {
        content: true,
        watchVisibility: false,
        isInput: false,
        preload: 'tabs content alert button',
        constructor: (t) => { },
        flags: [],
        attr: ['height', 'max-height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        connected: function (t) {
            t.setupComponent();
        },
        disconnected: function (t) { },
        reconnected: function (t) { },
        setupComponent: function () {
            const t = this;
            t.innerHTML = '';
            let alert = webui.create('webui-alert');
            t.appendChild(alert);
            alert.setValue({ text: 'Loading Web UI Methods' }, 'info');
            webui.fetchWithCache(`${srcRoot}/webui/loader.js`).then(data => {
                const extracted = extractClassBody(data);
                window.src = extracted;
                data = parseWebUIMethods(data);
                const tabs = webui.create('webui-tabs', { pad: 'var(--padding)', vertical: true, 'transition-timing': 200, 'data-subscribe': 'session-components-tab-index:setTab' });
                data.forEach(method => {
                    if (!method.name) {
                        console.error('Method is missing name %o', method);
                        return;
                    }
                    let button = webui.create('webui-button', { hash: method.name, align: 'left', slot: 'tabs', text: `webui.${method.name}` });
                    tabs.appendChild(button);
                    let content = webui.create('webui-content', { slot: 'content' });
                    content.loadSrc = (async function () {
                        let args = method.parameters.map(p => p.name).join(', ');
                        let post = '';
                        switch (method.type) {
                            case 'method':
                                post = `(${args})`;
                                break;
                            case 'field':
                                if (method.returns.type) {
                                    post = `:${method.returns.type}`;
                                }
                                if (method.returns.description) {
                                    post += ` - ${method.returns.description}`;
                                }
                                break;
                            case 'get':
                                if (method.returns.type) {
                                    post = `:${method.returns.type}`;
                                }
                                if (method.returns.description) {
                                    post += ` - ${method.returns.description}`;
                                }
                                break;
                            case 'set':
                                if (method.returns.type) {
                                    post = `:${method.returns.type}`;
                                }
                                break;
                            default:
                                console.error('Unexpected method type', method);
                                break;
                        }
                        let md = `
### webui.${method.name}${post}\n`;
                        if (method.description) {
                            md += `
<webui-page-segment elevation="10">
    ${method.description}
</webui-page-segment>
`;
                        }
                        if (args.length > 0) {
                            md += `\n#### Parameters\n`;
                            method.parameters.forEach(a => {
                                let type = a.type ? a.type : 'any';
                                let def = a.def ? `= ${a.def} ` : '';
                                md += `> [tertiary] **${a.name}**:${fixSpecialCharacters(type)} ${fixSpecialCharacters(def)}
`;
                                if (a.description) {
                                    let desk = fixSpecialCharacters(a.description).split(/[\r\n]+/).join('\n>>');
                                    md += `>>${desk}\n`;
                                }
                            });
                        }
                        if (method.examples.length > 0) {
                            md += '##### Examples\n';
                            method.examples.forEach(ex => {
                                let [, , type, text] = ex.trim().match(/^(\[([A-Za-z]+)\])?[\s]*(.*)$/s) || [];
                                text = text ? text : ex;
                                type = type ? type : 'javascript';
                                let lines = text.split(/[\r\n]+/);
                                let d = '';
                                if (lines[0].startsWith('//')) {
                                    d = ` - ${webui.escapeCode(lines.shift().substring(2).trim())}`;
                                    text = lines.join('\n');
                                }
                                md += `
\`\`\`${type}:Example${d}
${text}
\`\`\`
`;
                            });
                        } else if (method.type === 'method') {
                            md += '##### Examples\n';
                            md += `
\`\`\`javascript:Example
let result = webui.${method.name}(${args});
\`\`\`
`;
                        } else if (method.type === 'get') {
                            md += '##### Examples\n';
                            md += `
\`\`\`javascript:Example
let result = webui.${method.name};
\`\`\`
`;
                        } else if (method.type === 'set') {
                            md += '##### Examples\n';
                            md += `
\`\`\`javascript:Example
webui.${method.name} = value;
\`\`\`
`;
                        }
                        const html = webui.parseWebuiMarkdown(md);
                        content._content = html;
                    }).bind();
                    tabs.appendChild(content);
                });
                alert.remove();
                t.appendChild(tabs);
            }).catch(ex => {
                alert.setValue({ text: `Failed to load method data:${ex}` }, 'danger');
            });
        },
    });
}
