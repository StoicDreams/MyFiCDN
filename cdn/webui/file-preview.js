/*!
 * Web UI File Preview - https://webui.stoicdreams.com/components#webui-file-preview
 * A component for displaying file previews within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // Types for files whose type the browser left blank or generic, keyed by extension.
    const extTypes = {
        apng: 'image/apng', avif: 'image/avif', bmp: 'image/bmp', cur: 'image/x-icon', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
        ico: 'image/x-icon', jfif: 'image/jpeg', jpe: 'image/jpeg', jpeg: 'image/jpeg', jpg: 'image/jpeg', jxl: 'image/jxl', pjp: 'image/jpeg',
        pjpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', tif: 'image/tiff', tiff: 'image/tiff', webp: 'image/webp',
        '3g2': 'video/3gpp2', '3gp': 'video/3gpp', avi: 'video/x-msvideo', m4v: 'video/mp4', mkv: 'video/x-matroska', mov: 'video/quicktime',
        mp4: 'video/mp4', mpeg: 'video/mpeg', mpg: 'video/mpeg', ogv: 'video/ogg', webm: 'video/webm', wmv: 'video/x-ms-wmv',
        aac: 'audio/aac', aif: 'audio/aiff', aiff: 'audio/aiff', flac: 'audio/flac', m4a: 'audio/mp4', mp3: 'audio/mpeg', oga: 'audio/ogg',
        ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', weba: 'audio/webm',
        pdf: 'application/pdf',
        otf: 'font/otf', ttf: 'font/ttf', woff: 'font/woff', woff2: 'font/woff2',
        htm: 'text/html', html: 'text/html', xhtml: 'application/xhtml+xml',
        csv: 'text/csv', tsv: 'text/tab-separated-values',
        geojson: 'application/json', json: 'application/json', map: 'application/json', webmanifest: 'application/json',
    };
    // Extensions shown as plain text, for source code, config, and other text files the browser has no type for.
    const textExts = new Set(('bash bat c cc cfg cjs clj cmake cmd conf cpp cs csproj css cxx dart diff dockerfile editorconfig env erl ex exs '
        + 'fs gitattributes gitignore go gradle graphql groovy h hpp hs ini java jl js jsonc jsx kt kts less lock log lua m makefile md markdown mjs '
        + 'ml nim patch php pl properties proto ps1 psm1 py r rb rs rst sass scala scss sh sln sql srt svelte swift tex toml ts tsx txt vb vbs vtt '
        + 'vue webui xml xsd xsl yaml yml zig zsh').split(' '));
    const tableMaxRows = 500;
    const textMaxLength = 1000000;

    function extOf(name) {
        name = `${name || ''}`.split(/[?#]/)[0].split('/').pop().toLowerCase();
        if (!name.includes('.')) return name;
        return name.split('.').pop();
    }
    function dataUrlType(content) {
        if (typeof content !== 'string' || !content.startsWith('data:')) return '';
        return content.slice(5).split(/[;,]/)[0].toLowerCase();
    }
    function isGeneric(type) {
        return !type || type === 'application/octet-stream' || type === 'application/x-unknown' || type === 'binary/octet-stream';
    }
    function resolveType(file) {
        let type = `${file.type || ''}`.toLowerCase();
        if (isGeneric(type)) type = dataUrlType(file.content) || type;
        if (isGeneric(type) || type === 'text/plain' || type === 'application/ogg') {
            type = extTypes[extOf(file.name || file.url)] || type;
        }
        return type;
    }
    function kindOf(type, name) {
        const ext = extOf(name);
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        if (type === 'application/pdf') return 'pdf';
        if (type.startsWith('font/') || /^application\/(x-)?font/.test(type)) return 'font';
        if (type === 'text/html' || type === 'application/xhtml+xml') return 'html';
        if (type === 'text/csv' || type === 'text/tab-separated-values') return 'table';
        if (type === 'application/json' || type.endsWith('+json')) return 'json';
        if (type.startsWith('text/') || type.endsWith('+xml') || /^application\/(xml|javascript|ecmascript|x-sh|sql|toml|yaml|x-yaml)$/.test(type)) return 'text';
        if (textExts.has(ext)) return 'text';
        return 'file';
    }
    function dataUrlToBlob(content, type) {
        const comma = content.indexOf(',');
        const meta = content.slice(5, comma);
        const body = content.slice(comma + 1);
        if (!meta.endsWith(';base64')) {
            return new Blob([decodeURIComponent(body)], { type });
        }
        const binary = atob(body);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; ++index) {
            bytes[index] = binary.charCodeAt(index);
        }
        return new Blob([bytes], { type });
    }
    // Returns the file's data as a Blob of the given type, or null when the file only has a url.
    function toBlob(file, type) {
        let data = file instanceof Blob ? file : (file.file instanceof Blob ? file.file : file.content);
        if (data instanceof Blob) {
            return data.type === type ? data : new Blob([data], { type });
        }
        if (typeof data === 'string') {
            return data.startsWith('data:') ? dataUrlToBlob(data, type) : new Blob([data], { type });
        }
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            return new Blob([data], { type });
        }
        return null;
    }
    function splitDelimited(text, delimiter, maxRows) {
        const rows = [];
        let row = [];
        let cell = '';
        let quoted = false;
        let total = 0;
        for (let index = 0; index < text.length; ++index) {
            const char = text[index];
            if (quoted) {
                if (char === '"') {
                    if (text[index + 1] === '"') {
                        cell += '"';
                        ++index;
                    } else {
                        quoted = false;
                    }
                } else {
                    cell += char;
                }
            } else if (char === '"' && cell === '') {
                quoted = true;
            } else if (char === delimiter) {
                row.push(cell);
                cell = '';
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && text[index + 1] === '\n') ++index;
                row.push(cell);
                if (++total <= maxRows) rows.push(row);
                row = [];
                cell = '';
            } else {
                cell += char;
            }
        }
        if (cell !== '' || row.length) {
            row.push(cell);
            if (++total <= maxRows) rows.push(row);
        }
        return { rows, total };
    }

    webui.define('webui-file-preview', {
        preload: 'pagination',
        attr: ['height', 'max-height', 'src'],
        flags: ['details'],
        constructor() {
            const t = this;
            t._files = [];
            t._index = -1;
            t._urls = [];
            t._view = t.template.querySelector('.view');
            t._pager = t.template.querySelector('webui-pagination');
            t._details = t.template.querySelector('.details');
            t._pager.addEventListener('change', ev => {
                ev.stopPropagation();
                t.showFile((t._pager.page || 1) - 1);
            });
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    t.style.setProperty('--preview-height', webui.pxIfNumber(value) || 'auto');
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    t.style.setProperty('--preview-max-height', webui.pxIfNumber(value) || 'none');
                    break;
                case 'src':
                    t.setFile(value ? [{ url: value, name: value }] : []);
                    break;
            }
        },
        setValue(files) {
            this.setFile(files);
        },
        setFile(files) {
            const t = this;
            if (files instanceof FileList) files = Array.from(files);
            if (files && !Array.isArray(files)) files = [files];
            files = (files || []).filter(file => file && (file instanceof Blob || file.content || file.file || file.url));
            t.clear();
            t._files = files;
            if (!files.length) return;
            t.toggleAttribute('multiple', files.length > 1);
            t.showFile(0);
            // A src attribute can set files before webui-pagination has loaded.
            customElements.whenDefined('webui-pagination').then(() => {
                if (t._files !== files) return;
                if (!t._pager.setValue) customElements.upgrade(t._pager);
                t._pager.totalCount = files.length;
                t._pager.setValue(1);
            });
        },
        showFile(index) {
            const t = this;
            const file = t._files[index];
            if (!file || index === t._index) return;
            t._index = index;
            t.clearView();
            const name = file.name || (file.url ? file.url.split(/[?#]/)[0].split('/').pop() : '') || 'File';
            const type = resolveType(file);
            const kind = kindOf(type, file.name || file.url);
            const blob = toBlob(file, type);
            const info = { name, type, kind, size: blob ? blob.size : (file.size || 0) };
            info.url = blob ? t.objectUrl(blob) : file.url;
            t.setAttribute('kind', kind);
            t.renderDetails(info);
            const rid = t._rid = webui.uuid();
            const getText = () => blob ? blob.text() : fetch(file.url).then(r => r.ok ? r.text() : Promise.reject(r.status));
            const getBuffer = () => blob ? blob.arrayBuffer() : fetch(file.url).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status));
            const fail = () => {
                if (t._rid === rid) t.showFallback(info, 'This browser cannot preview this file.');
            };
            switch (kind) {
                case 'image': {
                    const img = webui.create('img', { class: 'media', alt: name, src: info.url });
                    img.addEventListener('error', fail);
                    t.showView(img);
                    break;
                }
                case 'video':
                case 'audio': {
                    const media = webui.create(kind, { class: 'media', controls: '', preload: 'metadata', title: name });
                    media.addEventListener('error', fail);
                    media.src = info.url;
                    t.showView(media);
                    break;
                }
                case 'pdf':
                    t.showView(webui.create('iframe', { class: 'frame', title: name, src: info.url }));
                    break;
                case 'html':
                    getText().then(text => {
                        if (t._rid !== rid) return;
                        // srcdoc inherits this page's origin, so a selected file must not be able to run scripts here.
                        const frame = webui.create('iframe', { class: 'frame', title: name, sandbox: '' });
                        frame.srcdoc = text;
                        t.showView(frame);
                    }).catch(fail);
                    break;
                case 'json':
                case 'text':
                    getText().then(text => {
                        if (t._rid !== rid) return;
                        if (kind === 'json') {
                            try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (_) { }
                        }
                        t.showText(text);
                    }).catch(fail);
                    break;
                case 'table':
                    getText().then(text => {
                        if (t._rid !== rid) return;
                        t.showTable(text, type === 'text/tab-separated-values' ? '\t' : ',');
                    }).catch(fail);
                    break;
                case 'font':
                    getBuffer().then(buffer => {
                        const family = `webui-file-preview-${rid}`;
                        const face = new FontFace(family, buffer);
                        return face.load().then(() => {
                            if (t._rid !== rid) return;
                            document.fonts.add(face);
                            t._font = face;
                            t.showFont(family);
                        });
                    }).catch(fail);
                    break;
                default:
                    t.showFallback(info, 'No preview is available for this type of file.');
                    break;
            }
        },
        objectUrl(blob) {
            const url = URL.createObjectURL(blob);
            this._urls.push(url);
            return url;
        },
        showView(el) {
            this._view.replaceChildren(el);
        },
        showText(text) {
            const t = this;
            const pre = webui.create('pre', { class: 'text', tabindex: '0' });
            pre.textContent = text.length > textMaxLength ? text.slice(0, textMaxLength) : text;
            const parts = [pre];
            if (text.length > textMaxLength) {
                parts.push(webui.create('p', { class: 'note', text: `Showing the first ${webui.formatBytes(textMaxLength, 0)} of text.` }));
            }
            t._view.replaceChildren(...parts);
        },
        showTable(text, delimiter) {
            const t = this;
            const { rows, total } = splitDelimited(text, delimiter, tableMaxRows + 1);
            const wrap = webui.create('div', { class: 'table', tabindex: '0' });
            const table = webui.create('table');
            rows.forEach((row, index) => {
                const tr = webui.create('tr');
                row.forEach(cell => {
                    // textContent keeps line breaks from quoted cells, which white-space:pre-wrap then shows.
                    tr.appendChild(webui.create(index ? 'td' : 'th')).textContent = cell;
                });
                (index ? (table.tBodies[0] || table.appendChild(webui.create('tbody'))) : table.createTHead()).appendChild(tr);
            });
            wrap.appendChild(table);
            const parts = [wrap];
            if (total > tableMaxRows + 1) {
                parts.push(webui.create('p', { class: 'note', text: `Showing the first ${tableMaxRows} of ${total - 1} rows.` }));
            }
            t._view.replaceChildren(...parts);
        },
        showFont(family) {
            const sample = webui.create('div', { class: 'font' });
            sample.style.fontFamily = `"${family}"`;
            ['3em', '1.5em', '1em'].forEach(size => {
                const line = webui.create('p', { text: 'The quick brown fox jumps over the lazy dog.' });
                line.style.fontSize = size;
                sample.appendChild(line);
            });
            sample.appendChild(webui.create('p', { text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !?&@#$%' }));
            this.showView(sample);
        },
        showFallback(info, message) {
            const t = this;
            t.setAttribute('kind', 'file');
            const card = webui.create('div', { class: 'fallback' });
            card.appendChild(webui.create('strong', { text: info.name }));
            const facts = [info.type || 'Unknown type'];
            if (info.size) facts.push(webui.formatBytes(info.size));
            card.appendChild(webui.create('span', { text: facts.join(' - ') }));
            card.appendChild(webui.create('span', { text: message }));
            if (info.url) {
                card.appendChild(webui.create('a', { href: info.url, download: info.name, text: 'Download' }));
            }
            t.showView(card);
        },
        renderDetails(info) {
            const t = this;
            const parts = [webui.create('strong', { text: info.name })];
            if (info.size) parts.push(webui.create('span', { text: webui.formatBytes(info.size) }));
            if (info.url) parts.push(webui.create('a', { href: info.url, download: info.name, text: 'Download' }));
            t._details.replaceChildren(...parts);
        },
        clearView() {
            const t = this;
            t._rid = null;
            t._view.replaceChildren();
            t._details.replaceChildren();
            t.removeAttribute('kind');
            if (t._font) {
                document.fonts.delete(t._font);
                t._font = null;
            }
            t._urls.forEach(url => URL.revokeObjectURL(url));
            t._urls = [];
        },
        clear() {
            const t = this;
            t.clearView();
            t._files = [];
            t._index = -1;
            t.removeAttribute('multiple');
        },
        shadowTemplate: `
<webui-pagination per-page="1" loop max-pages="5"></webui-pagination>
<div class="details"></div>
<div class="view"></div>
<style type="text/css">
:host {
display:flex;
flex-direction:column;
width:100%;
box-sizing:border-box;
}
:host(:not([height])) {
min-height:100px;
}
:host(:not([multiple])) webui-pagination,
:host(:not([details])) .details,
.details:empty {
display:none;
}
.details {
display:flex;
flex-wrap:wrap;
align-items:center;
gap:0.5em 1em;
padding:0.25em 0;
}
.view {
flex:1 1 auto;
min-height:0;
display:flex;
flex-direction:column;
}
.media {
display:block;
max-width:100%;
max-height:var(--preview-max-height, none);
margin:0 auto;
}
:host([height]) .media {
height:100%;
object-fit:contain;
}
video.media,
:host(:not([height])) img.media {
width:100%;
height:auto;
}
:host([height]) video.media {
height:100%;
}
audio.media {
width:100%;
height:auto;
}
.frame {
display:block;
width:100%;
height:var(--preview-height, 70vh);
max-height:var(--preview-max-height, none);
flex:1 1 auto;
box-sizing:border-box;
border:none;
outline:none;
background-color:white;
}
.text,
.table {
flex:1 1 auto;
margin:0;
overflow:auto;
max-height:var(--preview-max-height, none);
box-sizing:border-box;
}
.text {
padding:0.5em;
white-space:pre-wrap;
overflow-wrap:anywhere;
font-family:var(--font-family-mono, monospace);
}
table {
border-collapse:collapse;
}
th, td {
padding:0.25em 0.5em;
border:1px solid color-mix(in srgb, currentColor 25%, transparent);
text-align:left;
vertical-align:top;
white-space:pre-wrap;
}
th {
position:sticky;
top:0;
background-color:var(--theme-color, var(--color-background, Canvas));
}
.font {
overflow:auto;
overflow-wrap:anywhere;
}
.font p {
margin:0.25em 0;
}
.note {
margin:0.25em 0;
opacity:0.75;
font-size:0.9em;
}
.fallback {
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
gap:0.5em;
padding:1em;
flex:1 1 auto;
text-align:center;
overflow-wrap:anywhere;
}
a {
color:inherit;
}
a:focus-visible,
.text:focus-visible,
.table:focus-visible {
outline:2px solid var(--color-primary, currentColor);
outline-offset:2px;
}
</style>
`
    });
}
