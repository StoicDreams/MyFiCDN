/*!
 * Web UI OpenAPI - https://webui.stoicdreams.com/components#webui-openapi
 * Render OpenAPI documentation with testing capability.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025-2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /*
     * <webui-openapi src="https://api.example.com/openapi.json" hash="api" credentials="omit"></webui-openapi>
     *
     * src: the URL of an OpenAPI document in JSON. setSource(url) does the same.
     * setDoc(doc, { baseUrl }): show a document that is already parsed, such as one pasted or converted from YAML.
     *   baseUrl is where the document came from, used to resolve relative server URLs.
     * hash: when set, opening an endpoint puts a link to it in the address bar, and that link opens it again.
     * credentials: whether Send includes cookies (include, the default, same-origin, or omit). APIs that allow any
     *   origin reject requests with cookies, so a public viewer should use omit.
     *
     * Everything from the document is shown as text, never as HTML, since documents can come from anywhere.
     * Endpoint and schema details are built the first time they are opened, so large documents stay fast.
     */
    const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
    const METHOD_THEMES = { get: 'info', post: 'success', put: 'warning', patch: 'tertiary', delete: 'danger' };
    const MAX_DEPTH = 12;

    /** Create an element with optional text and attributes. Text is always set as text. */
    function el(tag, className, text, attributes) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null && text !== '') node.textContent = `${text}`;
        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                if (value === undefined || value === null || value === false) continue;
                node.setAttribute(key, value === true ? '' : `${value}`);
            }
        }
        return node;
    }

    /** A link, only for http, https, and mailto addresses. Anything else is shown as text. */
    function safeLink(href, text) {
        const value = `${href || ''}`.trim();
        if (/^(https?:|mailto:)/i.test(value)) {
            return el('a', '', text || value, { href: value, target: '_blank', rel: 'noopener noreferrer' });
        }
        return el('span', '', text || value);
    }

    /** Follow a local reference such as #/components/schemas/User. Returns undefined when it cannot be found. */
    function pointer(doc, ref) {
        if (typeof ref !== 'string' || !ref.startsWith('#')) return undefined;
        const parts = ref.slice(1).split('/').filter(Boolean).map(p => decodeURIComponent(p).replace(/~1/g, '/').replace(/~0/g, '~'));
        let node = doc;
        for (const part of parts) {
            if (node === null || typeof node !== 'object' || !(part in node)) return undefined;
            node = node[part];
        }
        return node;
    }

    /** The last part of a reference, used as a type name. */
    const refName = ref => `${ref}`.split('/').pop();

    /**
     * Resolve an object that may be a $ref, following chains of references.
     * Returns { value, ref, missing } where ref is the last reference followed.
     */
    function deref(doc, value) {
        let ref = null;
        let guard = 0;
        while (value && typeof value === 'object' && typeof value.$ref === 'string' && guard++ < 20) {
            ref = value.$ref;
            const found = pointer(doc, ref);
            if (found === undefined) return { value: {}, ref, missing: true };
            value = found;
        }
        return { value: value || {}, ref, missing: false };
    }

    /** Combine allOf parts into one schema: properties and required lists are joined. */
    function mergeAllOf(doc, schema, depth = 0) {
        if (!schema || !Array.isArray(schema.allOf) || depth > MAX_DEPTH) return schema;
        const merged = { ...schema, properties: { ...(schema.properties || {}) }, required: [...(schema.required || [])] };
        delete merged.allOf;
        for (const part of schema.allOf) {
            const resolved = mergeAllOf(doc, deref(doc, part).value, depth + 1);
            Object.assign(merged.properties, resolved.properties || {});
            merged.required.push(...(resolved.required || []));
            for (const key of ['type', 'description', 'format', 'items', 'enum', 'additionalProperties']) {
                if (merged[key] === undefined && resolved[key] !== undefined) merged[key] = resolved[key];
            }
        }
        if (!Object.keys(merged.properties).length) delete merged.properties;
        if (!merged.required.length) delete merged.required;
        if (!merged.type && merged.properties) merged.type = 'object';
        return merged;
    }

    /** A short type name for a schema, such as "string (email)", "array of User", or "integer | null". */
    function typeLabel(doc, schema, depth = 0) {
        if (!schema || depth > 4) return 'any';
        const { value, ref, missing } = deref(doc, schema);
        if (missing) return `${refName(ref)} (missing)`;
        if (ref && depth > 0) return refName(ref);
        if (value.oneOf) return `one of ${value.oneOf.map(s => typeLabel(doc, s, depth + 1)).join(', ')}`;
        if (value.anyOf) return `any of ${value.anyOf.map(s => typeLabel(doc, s, depth + 1)).join(', ')}`;
        if (value.allOf && !value.type) {
            const named = value.allOf.filter(s => s && s.$ref);
            if (named.length === 1 && value.allOf.length === 1) return refName(named[0].$ref);
        }
        let types = Array.isArray(value.type) ? value.type : [value.type || (value.properties || value.allOf ? 'object' : value.items ? 'array' : 'any')];
        let label = types.map(type => {
            if (type === 'array') return `array of ${typeLabel(doc, value.items, depth + 1)}`;
            return value.format && type !== 'null' ? `${type} (${value.format})` : type;
        }).join(' | ');
        if (value.nullable) label += ' | null';
        if (ref && depth === 0) label = `${refName(ref)}: ${label}`;
        return label;
    }

    /** Notes about a schema's limits and values, such as enum values, defaults, and lengths. */
    function constraints(schema) {
        const notes = [];
        if (!schema) return notes;
        if (Array.isArray(schema.enum)) notes.push(`one of: ${schema.enum.map(v => JSON.stringify(v)).join(', ')}`);
        if (schema.const !== undefined) notes.push(`always ${JSON.stringify(schema.const)}`);
        if (schema.default !== undefined) notes.push(`default ${JSON.stringify(schema.default)}`);
        if (schema.minimum !== undefined) notes.push(`min ${schema.minimum}`);
        if (schema.maximum !== undefined) notes.push(`max ${schema.maximum}`);
        if (schema.minLength !== undefined) notes.push(`min length ${schema.minLength}`);
        if (schema.maxLength !== undefined) notes.push(`max length ${schema.maxLength}`);
        if (schema.minItems !== undefined) notes.push(`min items ${schema.minItems}`);
        if (schema.maxItems !== undefined) notes.push(`max items ${schema.maxItems}`);
        if (schema.pattern) notes.push(`pattern ${schema.pattern}`);
        if (schema.readOnly) notes.push('read only');
        if (schema.writeOnly) notes.push('write only');
        if (schema.example !== undefined) notes.push(`example ${JSON.stringify(schema.example)}`);
        return notes;
    }

    const FORMAT_EXAMPLES = {
        'date-time': '2026-01-31T12:00:00Z', date: '2026-01-31', time: '12:00:00', email: 'user@example.com',
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6', uri: 'https://example.com', url: 'https://example.com',
        hostname: 'example.com', ipv4: '192.0.2.1', ipv6: '2001:db8::1', password: 'string', byte: 'U3RyaW5n',
    };

    /** A sample value for a schema: its example, default, or first enum value, or one made up from its type. */
    function exampleFor(doc, schema, seen = new Set(), depth = 0) {
        if (!schema || depth > MAX_DEPTH) return null;
        const { value: raw, ref } = deref(doc, schema);
        if (ref) {
            if (seen.has(ref)) return null;
            seen = new Set(seen).add(ref);
        }
        const value = mergeAllOf(doc, raw);
        if (value.example !== undefined) return value.example;
        if (Array.isArray(value.examples) && value.examples.length) return value.examples[0];
        if (value.default !== undefined) return value.default;
        if (value.const !== undefined) return value.const;
        if (Array.isArray(value.enum) && value.enum.length) return value.enum[0];
        if (value.oneOf || value.anyOf) return exampleFor(doc, (value.oneOf || value.anyOf)[0], seen, depth + 1);
        const type = Array.isArray(value.type) ? value.type.find(t => t !== 'null') : value.type || (value.properties ? 'object' : value.items ? 'array' : undefined);
        switch (type) {
            case 'object': {
                const obj = {};
                for (const [key, prop] of Object.entries(value.properties || {})) {
                    if (deref(doc, prop).value.readOnly) continue;
                    obj[key] = exampleFor(doc, prop, seen, depth + 1);
                }
                return obj;
            }
            case 'array': return value.items ? [exampleFor(doc, value.items, seen, depth + 1)] : [];
            case 'string': return FORMAT_EXAMPLES[value.format] || 'string';
            case 'integer': return value.minimum !== undefined ? value.minimum : 0;
            case 'number': return value.minimum !== undefined ? value.minimum : 0;
            case 'boolean': return true;
            default: return null;
        }
    }

    /** The example for a media type: its own example, its first named example, or one made from its schema. */
    function mediaExample(doc, media) {
        if (!media) return undefined;
        if (media.example !== undefined) return media.example;
        if (media.examples && typeof media.examples === 'object') {
            const first = Object.values(media.examples)[0];
            const resolved = deref(doc, first).value;
            if (resolved && resolved.value !== undefined) return resolved.value;
        }
        if (media.schema) return exampleFor(doc, media.schema);
        return undefined;
    }

    const asText = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    /** A code block for an example or response body. */
    function codeBlock(text, label) {
        const wrap = el('div', 'code');
        if (label) wrap.appendChild(el('div', 'code-label', label));
        wrap.appendChild(el('pre', '', text));
        return wrap;
    }

    /** Fill a details element the first time it opens. */
    function lazyDetails(details, build) {
        let built = false;
        const fill = () => {
            if (built || !details.open) return;
            built = true;
            build();
        };
        details.addEventListener('toggle', fill);
        // A details element created open fires toggle too, but build now so tests and links see it at once.
        queueMicrotask(fill);
    }

    /**
     * One property or schema in the schema tree: its name, type, required mark, notes, and description, with its
     * properties, items, or variants inside a details element that fills when opened.
     */
    function schemaRow(doc, name, schema, required, seen, depth) {
        const row = el('div', 'prop');
        const { value: raw, ref, missing } = deref(doc, schema);
        const circular = ref && seen.has(ref);
        const value = mergeAllOf(doc, raw);
        const head = el('div', 'prop-head');
        if (name !== null) head.appendChild(el('span', 'prop-name', name));
        head.appendChild(el('span', 'type', typeLabel(doc, schema, name === null ? 0 : 1)));
        if (required) head.appendChild(el('span', 'badge required', 'required'));
        if (value.deprecated) head.appendChild(el('span', 'badge deprecated', 'deprecated'));
        if (circular) head.appendChild(el('span', 'note', '(refers to itself, shown above)'));
        if (missing) head.appendChild(el('span', 'note', `(cannot find ${ref})`));
        const notes = constraints(value);
        if (notes.length) head.appendChild(el('span', 'note', notes.join(' · ')));
        row.appendChild(head);
        if (value.description) row.appendChild(el('p', 'desc', value.description));
        if (circular || missing || depth > MAX_DEPTH) return row;
        const nextSeen = ref ? new Set(seen).add(ref) : seen;
        const children = schemaChildren(value);
        if (!children) return row;
        const details = el('details', 'children');
        details.open = depth < 1;
        details.appendChild(el('summary', '', children.label));
        const body = el('div', 'child-list');
        details.appendChild(body);
        lazyDetails(details, () => {
            const required = new Set(value.required || []);
            const list = document.createDocumentFragment();
            if (children.properties) {
                for (const [key, prop] of Object.entries(children.properties)) {
                    list.appendChild(schemaRow(doc, key, prop, required.has(key), nextSeen, depth + 1));
                }
            }
            if (children.items) list.appendChild(schemaRow(doc, 'items', children.items, false, nextSeen, depth + 1));
            if (children.variants) {
                children.variants.forEach((variant, index) => list.appendChild(schemaRow(doc, `option ${index + 1}`, variant, false, nextSeen, depth + 1)));
            }
            if (children.additional) list.appendChild(schemaRow(doc, 'any other key', children.additional, false, nextSeen, depth + 1));
            body.appendChild(list);
        });
        row.appendChild(details);
        return row;
    }

    /** What a schema contains, for the schema tree, or null when it has nothing inside. */
    function schemaChildren(value) {
        if (value.properties && Object.keys(value.properties).length) {
            return { label: `${Object.keys(value.properties).length} properties`, properties: value.properties, additional: typeof value.additionalProperties === 'object' ? value.additionalProperties : null };
        }
        if (value.items && typeof value.items === 'object') return { label: 'items', items: value.items };
        const variants = value.oneOf || value.anyOf;
        if (Array.isArray(variants) && variants.length) return { label: `${variants.length} options`, variants };
        if (typeof value.additionalProperties === 'object') return { label: 'values', additional: value.additionalProperties };
        return null;
    }

    /** The color theme for a response status, such as success for 2XX. */
    function statusTheme(code) {
        const first = `${code}`[0];
        return { 2: 'success', 3: 'info', 4: 'warning', 5: 'danger' }[first] || 'secondary';
    }

    /** Each operation in the document, with path-level parameters merged in and its tags. */
    function operations(doc) {
        const list = [];
        for (const [path, rawItem] of Object.entries(doc.paths || {})) {
            const item = deref(doc, rawItem).value;
            const shared = Array.isArray(item.parameters) ? item.parameters : [];
            for (const method of METHODS) {
                const op = item[method];
                if (!op || typeof op !== 'object') continue;
                // Operation parameters replace path-level ones with the same name and location.
                const params = new Map();
                for (const p of [...shared, ...(Array.isArray(op.parameters) ? op.parameters : [])]) {
                    const resolved = deref(doc, p).value;
                    if (!resolved || !resolved.name) continue;
                    params.set(`${resolved.in}:${resolved.name}`, resolved);
                }
                list.push({
                    path, method, op,
                    parameters: [...params.values()],
                    tags: Array.isArray(op.tags) && op.tags.length ? op.tags : ['Other'],
                    servers: op.servers || item.servers,
                });
            }
        }
        return list;
    }

    /** The server URLs to choose from, with variables filled in and relative URLs made absolute. */
    function serverUrls(servers, baseUrl) {
        return (servers || []).map(server => {
            let url = `${server && server.url || ''}`;
            for (const [name, variable] of Object.entries((server && server.variables) || {})) {
                url = url.split(`{${name}}`).join(variable && variable.default !== undefined ? variable.default : '');
            }
            if (baseUrl && !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
                try { url = new URL(url || '/', baseUrl).href; } catch (_) { }
            }
            return { url: url.replace(/\/+$/, ''), description: server && server.description };
        }).filter(server => server.url);
    }

    /** The link name for an endpoint, the same format earlier versions gave their tabs. */
    function hashFor(prefix, method, path) {
        const parts = [];
        if (prefix) parts.push(prefix);
        parts.push(method.toLowerCase());
        parts.push(path.replace(/[\/\\]+/g, '-'));
        return webui.toSnake(parts.join('-'), '-');
    }

    webui.define('webui-openapi', {
        attr: ['src', 'hash', 'credentials'],
        constructor() {
            const t = this;
            t.baseUrl = '';
            t.doc = null;
            t._message = t.template.querySelector('.message');
            t._view = t.template.querySelector('.view');
            t._title = t.template.querySelector('.title');
            t._versions = t.template.querySelector('.versions');
            t._description = t.template.querySelector('.description');
            t._links = t.template.querySelector('.links');
            t._serverBox = t.template.querySelector('.server');
            t._server = t.template.querySelector('select');
            t._search = t.template.querySelector('input[type=search]');
            t._count = t.template.querySelector('.count');
            t._tags = t.template.querySelector('.tags');
            t._schemas = t.template.querySelector('.schemas');
            t._schemaList = t.template.querySelector('.schema-list');
            t._server.addEventListener('change', ev => {
                ev.stopPropagation();
                t.baseUrl = t._server.value;
            });
            t._search.addEventListener('input', ev => {
                ev.stopPropagation();
                t.filter(t._search.value);
            });
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'src':
                    if (t._connected) t.loadDoc();
                    break;
            }
        },
        connected() {
            const t = this;
            t._connected = true;
            if (!t.doc) t.loadDoc();
        },
        /** Load the document at a URL. */
        setSource(value) {
            const t = this;
            t.src = value;
            t.loadDoc();
        },
        /** Show a document that is already parsed. baseUrl is where it came from, for relative server URLs. */
        setDoc(doc, options = {}) {
            const t = this;
            t._loadedSrc = undefined;
            t._showDoc(doc, options.baseUrl || '');
        },
        _showMessage(text, theme = 'info') {
            const t = this;
            t._view.hidden = true;
            t._message.hidden = false;
            t._message.dataset.theme = theme;
            t._message.textContent = text;
        },
        async loadDoc() {
            const t = this;
            if (t._loadedSrc && t._loadedSrc === t.src && t.doc) return;
            t._loadedSrc = t.src;
            if (!t.src) {
                t._showMessage('Enter your URL to view an OpenAPI document.');
                return;
            }
            if (!webui.validateUrl(t.src)) {
                t._showMessage('URL is not valid.', 'danger');
                return;
            }
            t._showMessage('Loading...');
            const src = t.src;
            try {
                const text = await webui.fetchWithCache(src, false);
                if (t._loadedSrc !== src) return;
                let doc;
                try {
                    doc = typeof text === 'string' ? JSON.parse(text) : text;
                } catch (_) {
                    throw new Error('The document is not valid JSON.');
                }
                t._showDoc(doc, src);
            } catch (ex) {
                if (t._loadedSrc !== src) return;
                t._showMessage(`Failed to load OpenAPI: ${ex && ex.message ? ex.message : ex}`, 'danger');
            }
        },
        _showDoc(doc, sourceUrl) {
            const t = this;
            if (!doc || typeof doc !== 'object' || (!doc.paths && !doc.components && !doc.definitions)) {
                t.doc = null;
                t._showMessage('This is not an OpenAPI document. It needs at least paths or components.', 'danger');
                return;
            }
            t.doc = doc;
            t._sourceUrl = sourceUrl;
            t.render();
        },
        render() {
            const t = this;
            const doc = t.doc;
            if (!doc) return;
            const info = doc.info || {};
            t._title.textContent = info.title || 'API';
            t._versions.replaceChildren();
            if (info.version) t._versions.appendChild(el('span', 'badge version', `v${info.version}`));
            const specVersion = doc.openapi ? `OpenAPI ${doc.openapi}` : doc.swagger ? `Swagger ${doc.swagger}` : '';
            if (specVersion) t._versions.appendChild(el('span', 'badge spec', specVersion));
            t._description.textContent = info.description || '';
            t._description.hidden = !info.description;
            t._links.replaceChildren();
            const links = [];
            if (info.contact) {
                if (info.contact.url) links.push(safeLink(info.contact.url, info.contact.name || info.contact.url));
                if (info.contact.email) links.push(safeLink(`mailto:${info.contact.email}`, info.contact.email));
            }
            if (info.license && info.license.name) links.push(info.license.url ? safeLink(info.license.url, `License: ${info.license.name}`) : el('span', '', `License: ${info.license.name}`));
            if (info.termsOfService) links.push(safeLink(info.termsOfService, 'Terms of service'));
            if (doc.swagger) links.push(el('span', 'note', 'Swagger 2.0 documents are shown as well as possible. Some details may be missing.'));
            links.forEach(link => t._links.appendChild(link));
            t._links.hidden = !links.length;

            // Servers. Swagger 2.0 gives a host and base path instead.
            let servers = doc.servers;
            if (!servers && doc.swagger && doc.host) {
                servers = [{ url: `${(doc.schemes && doc.schemes[0]) || 'https'}://${doc.host}${doc.basePath || ''}` }];
            }
            const urls = serverUrls(servers, t._sourceUrl);
            t._server.replaceChildren(...urls.map(server => el('option', '', server.url, { value: server.url })));
            t._serverBox.hidden = !urls.length;
            t.baseUrl = urls.length ? urls[0].url : '';

            // Endpoints, grouped by tag in the document's tag order, then the order they first appear.
            const ops = operations(doc);
            t._ops = [];
            const tagInfo = new Map();
            for (const tag of Array.isArray(doc.tags) ? doc.tags : []) {
                if (tag && tag.name) tagInfo.set(tag.name, { description: tag.description, ops: [] });
            }
            for (const op of ops) {
                for (const tag of op.tags) {
                    if (!tagInfo.has(tag)) tagInfo.set(tag, { ops: [] });
                    tagInfo.get(tag).ops.push(op);
                }
            }
            const fragment = document.createDocumentFragment();
            for (const [name, group] of tagInfo) {
                if (!group.ops.length) continue;
                const section = el('section', 'tag');
                section.appendChild(el('h3', 'tag-name', name));
                if (group.description) section.appendChild(el('p', 'desc', group.description));
                for (const op of group.ops) {
                    const details = t._operation(op);
                    section.appendChild(details);
                    t._ops.push({ op, details, section, text: `${op.method} ${op.path} ${op.op.summary || ''} ${op.op.operationId || ''} ${op.tags.join(' ')}`.toLowerCase() });
                }
                fragment.appendChild(section);
            }
            if (!ops.length) fragment.appendChild(el('p', 'note', 'This document has no endpoints.'));
            t._tags.replaceChildren(fragment);
            t._opCount = ops.length;

            // Schemas from components (or definitions in Swagger 2.0).
            const schemas = (doc.components && doc.components.schemas) || doc.definitions || {};
            const schemaFragment = document.createDocumentFragment();
            for (const [name, schema] of Object.entries(schemas)) {
                const details = el('details', 'schema', null, { 'data-schema': name });
                details.appendChild(el('summary', '', name));
                const body = el('div', 'schema-body');
                details.appendChild(body);
                const ref = doc.components && doc.components.schemas ? `#/components/schemas/${name}` : `#/definitions/${name}`;
                lazyDetails(details, () => body.appendChild(schemaRow(doc, null, schema, false, new Set([ref]), 0)));
                schemaFragment.appendChild(details);
            }
            t._schemaList.replaceChildren(schemaFragment);
            t._schemas.hidden = !Object.keys(schemas).length;

            t._search.value = '';
            t.filter('');
            t._message.hidden = true;
            t._view.hidden = false;
            t._openFromHash();
        },
        /** Show only the endpoints whose method, path, summary, operation ID, or tag contain the text. */
        filter(text) {
            const t = this;
            const words = `${text || ''}`.toLowerCase().split(/\s+/).filter(Boolean);
            let shown = 0;
            const visibleSections = new Set();
            const counted = new Set();
            for (const entry of t._ops || []) {
                const match = words.every(word => entry.text.includes(word));
                entry.details.hidden = !match;
                if (match) {
                    visibleSections.add(entry.section);
                    if (!counted.has(entry.op)) {
                        counted.add(entry.op);
                        shown++;
                    }
                }
            }
            for (const entry of t._ops || []) entry.section.hidden = !visibleSections.has(entry.section);
            const total = t._opCount || 0;
            t._count.textContent = words.length ? `${shown} of ${total} endpoints` : `${total} endpoint${total === 1 ? '' : 's'}`;
        },
        _openFromHash() {
            const t = this;
            if (typeof t.hash !== 'string' || !location.hash) return;
            const target = decodeURIComponent(location.hash.slice(1));
            const entry = (t._ops || []).find(e => e.details.dataset.hash === target);
            if (!entry) return;
            entry.details.open = true;
            requestAnimationFrame(() => entry.details.scrollIntoView({ block: 'start' }));
        },
        /** One endpoint: a summary line, and its details, built when first opened. */
        _operation(entry) {
            const t = this;
            const { path, method, op } = entry;
            const details = el('details', 'op', null, { 'data-method': method });
            if (op.deprecated) details.classList.add('deprecated');
            const summary = el('summary');
            summary.appendChild(el('span', `method ${METHOD_THEMES[method] || 'secondary'}`, method.toUpperCase()));
            summary.appendChild(el('code', 'path', path));
            if (op.summary) summary.appendChild(el('span', 'summary-text', op.summary));
            if (op.deprecated) summary.appendChild(el('span', 'badge deprecated', 'deprecated'));
            details.appendChild(summary);
            if (typeof t.hash === 'string') {
                details.dataset.hash = hashFor(t.hash, method, path);
                details.addEventListener('toggle', () => {
                    if (details.open) history.replaceState(history.state, '', `#${details.dataset.hash}`);
                });
            }
            const body = el('div', 'op-body');
            details.appendChild(body);
            lazyDetails(details, () => t._operationBody(entry, body));
            return details;
        },
        _operationBody(entry, body) {
            const t = this;
            const doc = t.doc;
            const { op, parameters } = entry;
            if (op.description) body.appendChild(el('p', 'desc', op.description));
            if (op.operationId) body.appendChild(el('p', 'note', `Operation ID: ${op.operationId}`));

            // Parameters
            if (parameters.length) {
                body.appendChild(el('h4', '', 'Parameters'));
                const table = el('table', 'params');
                const head = el('tr');
                ['Name', 'In', 'Type', 'Description'].forEach(h => head.appendChild(el('th', '', h)));
                table.appendChild(el('thead')).appendChild(head);
                const rows = el('tbody');
                for (const p of parameters) {
                    const row = el('tr');
                    const name = el('td');
                    name.appendChild(el('code', '', p.name));
                    if (p.required) name.appendChild(el('span', 'badge required', 'required'));
                    if (p.deprecated) name.appendChild(el('span', 'badge deprecated', 'deprecated'));
                    row.appendChild(name);
                    row.appendChild(el('td', '', p.in));
                    // Swagger 2.0 puts the type on the parameter itself.
                    const schema = p.schema || (p.type ? p : null);
                    row.appendChild(el('td', 'type', schema ? typeLabel(doc, schema) : 'any'));
                    const desc = el('td');
                    if (p.description) desc.appendChild(el('div', '', p.description));
                    const notes = constraints(schema ? deref(doc, schema).value : null);
                    if (p.example !== undefined) notes.push(`example ${JSON.stringify(p.example)}`);
                    if (notes.length) desc.appendChild(el('div', 'note', notes.join(' · ')));
                    row.appendChild(desc);
                    rows.appendChild(row);
                }
                table.appendChild(rows);
                const scroll = el('div', 'table-scroll');
                scroll.appendChild(table);
                body.appendChild(scroll);
            }

            // Request body
            const requestBody = op.requestBody ? deref(doc, op.requestBody).value : null;
            if (requestBody && requestBody.content) {
                const heading = el('h4', '', 'Request Body');
                if (requestBody.required) heading.appendChild(el('span', 'badge required', 'required'));
                body.appendChild(heading);
                if (requestBody.description) body.appendChild(el('p', 'desc', requestBody.description));
                for (const [type, media] of Object.entries(requestBody.content)) {
                    body.appendChild(t._media(type, media));
                }
            }

            // Responses
            const responses = Object.entries(op.responses || {});
            if (responses.length) {
                body.appendChild(el('h4', '', 'Responses'));
                for (const [code, rawResponse] of responses) {
                    const response = deref(doc, rawResponse).value;
                    const block = el('div', 'response', null, { 'data-status': code });
                    const head = el('div', 'response-head');
                    head.appendChild(el('span', `status ${statusTheme(code)}`, code));
                    head.appendChild(el('span', '', response.description || ''));
                    block.appendChild(head);
                    for (const [type, media] of Object.entries(response.content || {})) {
                        block.appendChild(t._media(type, media));
                    }
                    if (!response.content && response.schema) block.appendChild(t._media('', { schema: response.schema }));
                    const headers = Object.entries(response.headers || {});
                    if (headers.length) {
                        const list = el('div', 'response-headers');
                        list.appendChild(el('div', 'code-label', 'Headers'));
                        for (const [name, rawHeader] of headers) {
                            const header = deref(doc, rawHeader).value;
                            const line = el('div');
                            line.appendChild(el('code', '', name));
                            line.appendChild(el('span', 'type', ` ${typeLabel(doc, header.schema || header)}`));
                            if (header.description) line.appendChild(el('span', 'note', ` ${header.description}`));
                            list.appendChild(line);
                        }
                        block.appendChild(list);
                    }
                    body.appendChild(block);
                }
            }

            body.appendChild(t._tryIt(entry, requestBody));
        },
        /** A media type's schema tree and example. */
        _media(type, media) {
            const t = this;
            const wrap = el('div', 'media');
            if (type) wrap.appendChild(el('div', 'media-type', type));
            if (media && media.schema) {
                wrap.appendChild(schemaRow(t.doc, null, media.schema, false, new Set(), 0));
            }
            const example = mediaExample(t.doc, media);
            if (example !== undefined && example !== null) {
                wrap.appendChild(codeBlock(asText(example), 'Example'));
            }
            return wrap;
        },
        /** A form to send a request to the endpoint, and the response. */
        _tryIt(entry, requestBody) {
            const t = this;
            const { method, path, parameters } = entry;
            const box = el('details', 'try');
            box.appendChild(el('summary', '', 'Try it'));
            const form = el('form');
            box.appendChild(form);
            const fields = [];
            for (const p of parameters) {
                if (p.in === 'cookie') continue;
                const key = `${p.in}-${p.name}`.toLowerCase();
                const label = el('label', 'field');
                label.appendChild(el('span', '', `${p.name} (${p.in})${p.required ? ' *' : ''}`));
                const input = el('input', '', null, { type: 'text', placeholder: p.description || '', required: p.required && p.in === 'path' });
                if (key === 'header-origin' || key === 'header-user-agent') {
                    input.disabled = true;
                    input.value = 'Set by the browser';
                } else {
                    const schema = deref(t.doc, p.schema || p).value;
                    const example = p.example !== undefined ? p.example : schema.example !== undefined ? schema.example : schema.default;
                    if (example !== undefined && p.in === 'path') input.value = `${example}`;
                    fields.push({ p, input });
                }
                label.appendChild(input);
                form.appendChild(label);
            }
            const canHaveBody = !['get', 'head', 'delete', 'options', 'trace'].includes(method) || requestBody;
            let bodyInput = null;
            let contentType = null;
            if (canHaveBody && requestBody && requestBody.content) {
                const types = Object.keys(requestBody.content);
                contentType = types.find(type => /json/i.test(type)) || types[0];
                const label = el('label', 'field body');
                label.appendChild(el('span', '', `Body (${contentType})`));
                bodyInput = el('textarea', '', null, { rows: 8, spellcheck: 'false' });
                const example = mediaExample(t.doc, requestBody.content[contentType]);
                if (example !== undefined && example !== null) bodyInput.value = asText(example);
                label.appendChild(bodyInput);
                form.appendChild(label);
            }
            const send = el('button', 'send', 'Send', { type: 'submit' });
            form.appendChild(send);
            const result = el('div', 'result', null, { 'aria-live': 'polite' });
            box.appendChild(result);
            form.addEventListener('submit', async ev => {
                ev.preventDefault();
                let url = path;
                const query = new URLSearchParams();
                const headers = {};
                for (const { p, input } of fields) {
                    const value = input.value;
                    switch (p.in) {
                        case 'path':
                            url = url.split(`{${p.name}}`).join(encodeURIComponent(value));
                            break;
                        case 'query':
                            if (value !== '') query.append(p.name, value);
                            break;
                        case 'header':
                            if (value !== '') headers[p.name] = value;
                            break;
                    }
                }
                const search = query.toString();
                url = `${t.baseUrl}${url}${search ? `?${search}` : ''}`;
                const options = { method: method.toUpperCase(), credentials: t.credentials || 'include', mode: 'cors', cache: 'no-cache', headers };
                if (bodyInput && bodyInput.value.trim()) {
                    headers['Content-Type'] = contentType;
                    options.body = bodyInput.value;
                }
                result.replaceChildren(el('p', 'note', `Sending ${options.method} ${url}`));
                send.disabled = true;
                const started = performance.now();
                try {
                    const resp = await fetch(url, options);
                    let text = await resp.text();
                    const ms = Math.round(performance.now() - started);
                    try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (_) { }
                    const head = el('div', 'response-head');
                    head.appendChild(el('span', `status ${statusTheme(resp.status)}`, resp.status));
                    head.appendChild(el('span', '', resp.statusText || ''));
                    head.appendChild(el('span', 'note', `${ms} ms`));
                    const headerLines = [...resp.headers.entries()].map(([key, value]) => `${key}: ${value}`).join('\n');
                    result.replaceChildren(el('p', 'note', `${options.method} ${resp.url || url}`), head, codeBlock(headerLines || '(none the browser can read)', 'Response headers'), codeBlock(text || '(empty)', 'Response body'));
                } catch (ex) {
                    result.replaceChildren(el('p', 'error', `The request failed: ${ex && ex.message ? ex.message : ex}. The API may not allow requests from this site (CORS), or it may be unreachable.`));
                } finally {
                    send.disabled = false;
                }
            });
            return box;
        },
        shadowTemplate: `
<p class="message" role="status">Enter your URL to view an OpenAPI document.</p>
<div class="view" hidden>
<header class="overview">
<div class="title-row"><h2 class="title"></h2><span class="versions"></span></div>
<p class="description desc"></p>
<p class="links"></p>
</header>
<div class="controls">
<label class="server"><span>Server</span><select></select></label>
<label class="search"><span>Search</span><input type="search" placeholder="Path, method, summary, or tag"></label>
<span class="count" aria-live="polite"></span>
</div>
<div class="tags"></div>
<section class="schemas"><h3 class="tag-name">Schemas</h3><div class="schema-list"></div></section>
</div>
<style type="text/css">
:host {
display:block;
--oa-line:color-mix(in srgb, currentColor 22%, transparent);
--oa-panel:color-mix(in srgb, currentColor 6%, transparent);
--oa-mono:var(--font-family-mono, ui-monospace, Consolas, monospace);
}
[hidden] { display:none !important; }
.message { padding:var(--padding, 0.5rem); border-radius:var(--corners, 3px); background-color:var(--color-info); color:var(--color-info-offset); margin:0; }
.message[data-theme=danger] { background-color:var(--color-danger); color:var(--color-danger-offset); }
.overview { margin-bottom:var(--padding, 0.5rem); }
.title-row { display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem; }
h2, h3, h4 { margin:0.75em 0 0.4em; }
h2 { margin-top:0; }
.desc { white-space:pre-line; margin:0.25em 0 0.5em; }
.links { display:flex; flex-wrap:wrap; gap:0.5rem 1rem; margin:0.25em 0; }
a { color:inherit; }
a:focus-visible, summary:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline:var(--focus-outline, 2px solid currentColor); outline-offset:var(--focus-offset, 2px); }
.badge { display:inline-block; padding:0 0.45em; border-radius:var(--corners, 3px); font-size:0.8em; font-weight:bold; margin-left:0.35em; border:1px solid var(--oa-line); }
.badge.version, .badge.spec { margin-left:0; }
.badge.required { background-color:var(--color-danger); color:var(--color-danger-offset); border-color:transparent; }
.badge.deprecated { background-color:var(--color-warning); color:var(--color-warning-offset); border-color:transparent; }
.note { opacity:0.8; font-size:0.9em; margin:0.2em 0; }
.error { padding:var(--padding, 0.5rem); border-radius:var(--corners, 3px); background-color:var(--color-danger); color:var(--color-danger-offset); }
.controls { display:flex; flex-wrap:wrap; align-items:end; gap:var(--padding, 0.5rem); margin:var(--padding, 0.5rem) 0; }
.controls label { display:flex; flex-direction:column; gap:0.2rem; font-weight:bold; font-size:0.9em; }
.controls .search { flex:1 1 16rem; }
select, input, textarea, button { font:inherit; color:inherit; background-color:var(--oa-panel); border:1px solid var(--oa-line); border-radius:var(--corners, 3px); padding:0.4em 0.6em; box-sizing:border-box; }
select option { color:#000; background-color:#fff; }
.count { opacity:0.8; padding-bottom:0.45em; }
.tag { margin-bottom:var(--padding, 0.5rem); }
details.op { border:1px solid var(--oa-line); border-radius:var(--corners, 3px); margin:0.35rem 0; background-color:var(--oa-panel); }
details.op > summary { display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem; padding:0.45rem 0.6rem; cursor:pointer; list-style:none; }
details.op > summary::-webkit-details-marker { display:none; }
details.op > summary::before { content:"▸"; opacity:0.7; transition:transform 0.15s; }
details.op[open] > summary::before { transform:rotate(90deg); }
details.op.deprecated .path { text-decoration:line-through; }
.method, .status { display:inline-block; min-width:4.2em; text-align:center; padding:0.15em 0.4em; border-radius:var(--corners, 3px); font-weight:bold; font-size:0.85em; font-family:var(--oa-mono); background-color:var(--color-secondary); color:var(--color-secondary-offset); }
.status { min-width:3em; }
.info { background-color:var(--color-info); color:var(--color-info-offset); }
.success { background-color:var(--color-success); color:var(--color-success-offset); }
.warning { background-color:var(--color-warning); color:var(--color-warning-offset); }
.danger { background-color:var(--color-danger); color:var(--color-danger-offset); }
.tertiary { background-color:var(--color-tertiary); color:var(--color-tertiary-offset); }
.path { font-family:var(--oa-mono); font-weight:bold; overflow-wrap:anywhere; }
.summary-text { opacity:0.85; }
.op-body { padding:0 0.8rem 0.8rem; border-top:1px solid var(--oa-line); }
.table-scroll { overflow-x:auto; }
table.params { border-collapse:collapse; width:100%; font-size:0.95em; }
.params th, .params td { text-align:left; vertical-align:top; padding:0.35em 0.5em; border-bottom:1px solid var(--oa-line); }
code, .type, .media-type, pre { font-family:var(--oa-mono); }
.type { opacity:0.9; }
.media { margin:0.4rem 0; padding:0.4rem 0.6rem; border-left:3px solid var(--oa-line); }
.media-type { font-weight:bold; font-size:0.9em; margin-bottom:0.25rem; }
.response { margin:0.5rem 0; }
.response-head { display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem; }
.response-headers { margin:0.3rem 0 0 0.6rem; font-size:0.9em; }
.prop { margin:0.15rem 0; }
.prop-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:0.4rem; }
.prop-name { font-family:var(--oa-mono); font-weight:bold; }
.prop .desc { margin:0.1em 0 0.2em; font-size:0.95em; }
details.children { margin-left:0.3rem; }
details.children > summary { cursor:pointer; font-size:0.85em; opacity:0.8; }
.child-list { margin-left:0.6rem; padding-left:0.6rem; border-left:1px dashed var(--oa-line); }
.code { margin:0.4rem 0; }
.code-label { font-size:0.8em; font-weight:bold; opacity:0.8; margin-bottom:0.15rem; }
pre { margin:0; padding:0.5rem 0.6rem; border-radius:var(--corners, 3px); background-color:rgba(0, 0, 0, 0.3); overflow:auto; max-height:24rem; white-space:pre; font-size:0.9em; }
details.try { margin-top:0.75rem; border-top:1px solid var(--oa-line); padding-top:0.5rem; }
details.try > summary { cursor:pointer; font-weight:bold; }
form { display:grid; grid-template-columns:repeat(auto-fill, minmax(14rem, 1fr)); gap:0.5rem; margin:0.5rem 0; }
.field { display:flex; flex-direction:column; gap:0.2rem; font-size:0.9em; }
.field span { font-family:var(--oa-mono); }
.field.body { grid-column:1 / -1; }
textarea { font-family:var(--oa-mono); resize:vertical; }
button.send { grid-column:1 / -1; justify-self:start; background-color:var(--color-button, var(--color-info)); color:var(--color-button-offset, #fff); border:none; padding:0.5em 1.4em; font-weight:bold; cursor:pointer; }
button.send:disabled { opacity:0.6; cursor:wait; }
details.schema { border:1px solid var(--oa-line); border-radius:var(--corners, 3px); margin:0.3rem 0; background-color:var(--oa-panel); }
details.schema > summary { cursor:pointer; padding:0.4rem 0.6rem; font-family:var(--oa-mono); font-weight:bold; }
.schema-body { padding:0 0.8rem 0.6rem; }
</style>
`
    });
}
