"use strict"
{
    function parseWebUIMethods(source) {
        const body = extractClassBody(source, "WebUI");
        if (!body) return [];

        const methods = [];
        const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;

        // For line numbers
        const lineStarts = [0];
        for (let i = 0; i < body.length; i++) if (body[i] === '\n') lineStarts.push(i + 1);
        const idxToLine = (idx) => {
            let lo = 0, hi = lineStarts.length - 1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (lineStarts[mid] <= idx) lo = mid + 1; else hi = mid - 1;
            }
            return hi + 1;
        };

        // Scan the class body with a small tokenizer so we only match at top-level depth
        let i = 0, depth = 0;

        while (i < body.length) {
            const ch = body[i];

            // Skip strings/comments/template literals
            if (ch === '"' || ch === "'") { i = skipString(body, i, ch); continue; }
            if (ch === '`') { i = skipTemplate(body, i); continue; }
            if (ch === '/' && body[i + 1] === '/') { i = skipLineComment(body, i); continue; }
            if (ch === '/' && body[i + 1] === '*') { i = skipBlockComment(body, i); continue; }

            if (ch === '{') { depth++; i++; continue; }
            if (ch === '}') { depth = Math.max(0, depth - 1); i++; continue; }

            // Only look for members at top-level of the class body
            if (depth === 0) {
                // Try accessor: get|set name(args) {
                let m =
                    matchHere(body, i,
                        /^\s*(?:\/\*\*[\s\S]*?\*\/\s*)?(get|set)\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/);

                if (!m) {
                    // Try method: [async] name(args) {
                    m = matchHere(body, i,
                        /^\s*(?:\/\*\*[\s\S]*?\*\/\s*)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/);
                }

                if (m) {
                    const [full, g1, g2, g3] = m;
                    const start = i + m.index;
                    const line = idxToLine(start);

                    // Find the immediate JSDoc (if present) directly above
                    let jsdoc = null;
                    {
                        const lookback = body.slice(Math.max(0, start - 4000), start);
                        let last = null, jm;
                        jsdocRegex.lastIndex = 0;
                        while ((jm = jsdocRegex.exec(lookback))) last = jm;
                        if (last) {
                            const tail = lookback.slice(last.index + last[0].length);
                            if (/^\s*$/.test(tail)) jsdoc = last[0];
                        }
                    }

                    let kind, name, paramsRaw;
                    if (g1 === 'get' || g1 === 'set') {
                        kind = g1;
                        name = g2;
                        paramsRaw = g3;
                    } else {
                        // This branch matched the second regex
                        const asyncMatch = full.match(/^\s*(?:\/\*\*[\s\S]*?\*\/\s*)?(async\s+)?/);
                        const isAsync = !!(asyncMatch && asyncMatch[1]);
                        kind = isAsync ? 'async' : 'method';
                        name = g1;
                        paramsRaw = g2;
                    }

                    if (name !== 'constructor' && !name.startsWith('#')) {
                        const params = splitParams(paramsRaw);
                        methods.push({
                            name,
                            kind,
                            async: kind === 'async',
                            params,
                            jsdoc: parseJSDoc(jsdoc),
                            signature: `${kind === 'async' ? 'async ' : (kind === 'get' || kind === 'set') ? kind + ' ' : ''}${name}(${paramsRaw})`,
                            line
                        });
                    }

                    // Advance just past this opening brace so we don’t re-match the same one
                    i = start + full.length;
                    continue;
                }
            }

            i++;
        }

        // Keep source order
        methods.sort((a, b) => a.line - b.line);
        return methods;

    }
    // ---------------- helpers ----------------
    function splitParams(raw) {
        raw = raw.trim();
        if (!raw) return [];
        // naive split (good enough for identifiers/defaults); keeps destructuring as one chunk
        return raw.split(',').map(s => s.trim()).filter(Boolean).map(p => {
            const eq = p.indexOf('=');
            if (eq !== -1) return { name: p.slice(0, eq).trim(), default: p.slice(eq + 1).trim(), raw: p };
            return { name: p, default: undefined, raw: p };
        });
    }

    function parseJSDoc(block) {
        if (!block) return null;
        const out = { description: '', params: [], returns: null, examples: [], throws: [] };
        const lines = block.replace(/^\/\*\*|\*\/$/g, '').split('\n').map(l => l.replace(/^\s*\*\s?/, ''));
        let inDesc = true, buf = [];

        const flushDesc = () => { if (inDesc && buf.length) { out.description = buf.join('\n').trim(); buf = []; inDesc = false; } };
        const tagR = /^@(\w+)\s*(.*)$/;

        for (const raw of lines) {
            const line = raw.trim();
            const m = line.match(tagR);
            if (!m) { buf.push(line); continue; }
            flushDesc();

            const [, tag, restRaw] = m;
            const rest = restRaw.trim();
            const typeM = rest.match(/^\{([^}]+)\}\s*(.*)$/);
            let type = null, tail = rest;
            if (typeM) { type = typeM[1].trim(); tail = typeM[2].trim(); }

            switch (tag) {
                case 'param': {
                    let name = tail, desc = '';
                    const split = tail.split(/\s+-\s+|\s+—\s+/);
                    if (split.length > 1) { name = split.shift(); desc = split.join(' - '); }
                    let def; const defM = name.match(/^(\[?[\w.$[\]]+\]?)(?:\s*=\s*(.+))?$/);
                    if (defM) { name = defM[1]; if (defM[2] !== undefined) def = defM[2]; }
                    out.params.push({ name, type, description: desc || '', default: def });
                    break;
                }
                case 'returns':
                case 'return': {
                    let desc = tail;
                    if (type !== null) desc = tail.replace(/^\{[^}]+\}\s*/, '');
                    out.returns = { type, description: desc.trim() };
                    break;
                }
                case 'example': out.examples.push(tail); break;
                case 'throws': {
                    let desc = tail;
                    if (type !== null) desc = tail.replace(/^\{[^}]+\}\s*/, '');
                    out.throws.push({ type, description: desc.trim() });
                    break;
                }
                default:
                    (out.other ||= []).push({ tag, raw: rest });
            }
        }
        if (inDesc && buf.length) out.description = buf.join('\n').trim();
        return out;
    }

    function matchHere(str, idx, re) {
        const sub = str.slice(idx);
        const m = sub.match(re);
        if (!m) return null;
        m.index = m.index ?? 0; // ensure index exists
        return m;
    }

    function extractClassBody(src, className) {
        console.log('extract', src, className);
        let i = 0;
        while (i < src.length) {
            const c = src[i];
            if (c === '"' || c === "'") { i = skipString(src, i, c); continue; }
            if (c === '`') { i = skipTemplate(src, i); continue; }
            if (c === '/' && src[i + 1] === '/') { i = skipLineComment(src, i); continue; }
            if (c === '/' && src[i + 1] === '*') { i = skipBlockComment(src, i); continue; }

            if (src.startsWith('class', i) && !/\w/.test(src[i - 1] || '')) {
                let j = i + 5;
                while (/\s/.test(src[j])) j++;
                if (src.startsWith(className, j)) {
                    let k = j + className.length;
                    // skip 'extends ...' etc until first '{'
                    while (k < src.length && src[k] !== '{') {
                        const ch = src[k];
                        if (ch === '"' || ch === "'") { k = skipString(src, k, ch); continue; }
                        if (ch === '`') { k = skipTemplate(src, k); continue; }
                        if (ch === '/' && src[k + 1] === '/') { k = skipLineComment(src, k); continue; }
                        if (ch === '/' && src[k + 1] === '*') { k = skipBlockComment(src, k); continue; }
                        k++;
                    }
                    if (k >= src.length) return null;
                    // balanced braces for the class body
                    let depth = 1, start = ++k;
                    while (k < src.length && depth > 0) {
                        const ch2 = src[k];
                        if (ch2 === '"' || ch2 === "'") { k = skipString(src, k, ch2); continue; }
                        if (ch2 === '`') { k = skipTemplate(src, k); continue; }
                        if (ch2 === '/' && src[k + 1] === '/') { k = skipLineComment(src, k); continue; }
                        if (ch2 === '/' && src[k + 1] === '*') { k = skipBlockComment(src, k); continue; }
                        if (ch2 === '{') depth++;
                        else if (ch2 === '}') depth--;
                        k++;
                    }
                    if (depth !== 0) return null;
                    return src.slice(start, k - 1);
                }
            }
            i++;
        }
        return null;
    }

    function skipString(str, i, quote) {
        i++;
        while (i < str.length) {
            if (str[i] === '\\') { i += 2; continue; }
            if (str[i] === quote) return i + 1;
            i++;
        }
        return i;
    }

    function skipLineComment(str, i) {
        i += 2;
        while (i < str.length && str[i] !== '\n') i++;
        return i;
    }

    function skipBlockComment(str, i) {
        i += 2;
        while (i + 1 < str.length && !(str[i] === '*' && str[i + 1] === '/')) i++;
        return i + 2;
    }

    function skipTemplate(str, i) {
        i++;
        while (i < str.length) {
            if (str[i] === '\\') { i += 2; continue; }
            if (str[i] === '`') return i + 1;
            if (str[i] === '$' && str[i + 1] === '{') {
                i += 2;
                let depth = 1;
                while (i < str.length && depth > 0) {
                    const ch = str[i];
                    if (ch === '\\') { i += 2; continue; }
                    if (ch === '"' || ch === "'") { i = skipString(str, i, ch); continue; }
                    if (ch === '`') { i = skipTemplate(str, i); continue; }
                    if (ch === '/' && str[i + 1] === '/') { i = skipLineComment(str, i); continue; }
                    if (ch === '/' && str[i + 1] === '*') { i = skipBlockComment(str, i); continue; }
                    if (ch === '{') depth++;
                    else if (ch === '}') depth--;
                    i++;
                }
                continue;
            }
            i++;
        }
        return i;
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
                //console.log(data);
                console.log(extractClassBody(data, 'WebUI'));
                console.log(!!extractClassBody(data, 'WebUI'));
                data = parseWebUIMethods(data);
                console.log(data);
            }).catch(ex => {
                alert.setValue({ text: `Failed to load method data:${ex}` }, 'danger');
            });
        },
    });
}