/*!
 * Web UI Markdown Guide - https://webui.stoicdreams.com/components#webui-markdown-guide
 * A short cheat sheet for people writing Markdown in a site or tool: what to type for each kind of formatting.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // Each row is what you get, then what to type. Strings in an array alternate between text and code.
    const rows = [
        { key: 'heading', label: 'A heading', type: ['', '## Heading'] },
        { key: 'bold', label: 'Bold', type: ['', '**bold**'] },
        { key: 'italic', label: 'Italic', type: ['', '*italic*'] },
        { key: 'strikethrough', label: 'Strikethrough', type: ['', '~~struck~~'], optional: true },
        { key: 'link', label: 'A link', type: ['', '[text](https://example.com)'] },
        { key: 'image', label: 'An image', type: ['', '![description](https://example.com/image.png)'], optional: true },
        { key: 'bullet-list', label: 'A bullet list', type: ['', '- item', ' on each line'] },
        { key: 'numbered-list', label: 'A numbered list', type: ['', '1. item', ' on each line'] },
        { key: 'task-list', label: 'A checklist', type: ['', '- [ ] item', ' or ', '- [x] done'], optional: true },
        { key: 'inline-code', label: 'Inline code', type: ['', '`code`'] },
        { key: 'code-block', label: 'A code block', type: ['', '```', ' on the lines before and after the code'] },
        { key: 'quote', label: 'A quote', type: ['', '> quoted text'] },
        { key: 'table', label: 'A table', type: ['', '| A | B |', ' for each row, with ', '| --- | --- |', ' under the header row'] },
        { key: 'rule', label: 'A dividing line', type: ['', '---', ' on its own line, after a blank line'], optional: true },
        { key: 'paragraph', label: 'A new paragraph', type: ['A blank line between paragraphs'], optional: true },
    ];
    const toKeys = value => new Set((value || '').split(/[\s,|]+/).map(key => key.trim().toLowerCase()).filter(Boolean));
    webui.define("webui-markdown-guide", {
        watchVisibility: false,
        isInput: false,
        preload: '',
        attr: ['include', 'exclude', 'theme', 'type-label', 'result-label'],
        attrChanged() {
            // Attributes often arrive together, so render once after them.
            const t = this;
            if (!t._connected || t._pending) return;
            t._pending = true;
            queueMicrotask(() => {
                t._pending = false;
                t.render();
            });
        },
        connected() {
            const t = this;
            t._connected = true;
            t.render();
        },
        /** The keys of the rows shown, in order. */
        rowKeys() {
            const t = this;
            const include = toKeys(t.getAttribute('include'));
            const exclude = toKeys(t.getAttribute('exclude'));
            const all = include.has('all');
            return rows
                .filter(row => (!row.optional || all || include.has(row.key)) && !exclude.has(row.key))
                .map(row => row.key);
        },
        render() {
            const t = this;
            const keys = t.rowKeys();
            const signature = JSON.stringify([keys, t.getAttribute('theme'), t.getAttribute('type-label'), t.getAttribute('result-label')]);
            if (signature === t._signature) return;
            t._signature = signature;
            const table = webui.create('table', { class: 'bordered', theme: t.getAttribute('theme') || 'info' });
            const head = webui.create('tr');
            head.appendChild(webui.create('th', { text: t.getAttribute('result-label') || 'To get' }));
            head.appendChild(webui.create('th', { text: t.getAttribute('type-label') || 'Type' }));
            table.appendChild(webui.create('thead')).appendChild(head);
            const body = webui.create('tbody');
            rows.filter(row => keys.includes(row.key)).forEach(row => {
                const tr = webui.create('tr', { 'data-key': row.key });
                tr.appendChild(webui.create('td', { text: row.label }));
                const cell = webui.create('td');
                row.type.forEach((part, index) => {
                    if (!part) return;
                    cell.appendChild(index % 2 ? webui.create('code', { text: part }) : document.createTextNode(part));
                });
                tr.appendChild(cell);
                body.appendChild(tr);
            });
            table.appendChild(body);
            t.replaceChildren(table);
        },
    });
}
