/*!
 * MDParse - https://webui.stoicdreams.com
 * Web UI Specific Markdown Parser
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"

// Bare urls, leaving off trailing punctuation that ends the sentence rather than the url.
const RX_AUTOLINK = /(?<![\w"'=\/])(https?:\/\/[^\s<]*[^\s<.,;:!?'")\]])/g;
const RX_AUTOLINK_ANGLE = /<(https?:\/\/[^\s<>]+)>/g;
const RX_AUTOLINK_EMAIL = /<([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/g;
const RX_CODE_SPAN = /(`+)(.+?)\1/g;
const RX_HTML_TAG = /<[a-zA-Z\/!][^>]*>/g;
// Not right after or before a letter or digit, so times such as 10:30:00 are left alone.
const RX_EMOJI = /(?<![\w\/]):([a-zA-Z0-9_+-]+):(?!\w)/g;
// A url may hold one level of parentheses, as in https://en.wikipedia.org/wiki/A_(b), and spaces, as in mailto:a@b.com?subject=Two Words.
const URL_PART = String.raw`<?((?:[^()<>"\n]|\([^()\n]*\))*?)>?`;
const TITLE_PART = String.raw`(?:\s+(?:"([^"]*)"|'([^']*)'))?`;
const RX_IMG = new RegExp(String.raw`!\[([^\]]*)\]\(\s*${URL_PART}${TITLE_PART}\s*\)`, 'g');
const RX_LINK = new RegExp(String.raw`\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]\(\s*${URL_PART}${TITLE_PART}\s*\)`, 'g');
const RX_IMG_REF = /!\[([^\]]*)\]\[([^\]]*)\]/g;
const RX_LINK_REF = /\[([^\[\]]+)\]\[([^\]]*)\]/g;
const RX_LINK_SHORTCUT = /\[([^\[\]]+)\](?![\[(:])/g;
const RX_FOOTNOTE_REF = /\[\^([^\]\s]+)\]/g;
const RX_STRONG_EM = /\*\*\*(?!\s)(.+?)(?<!\s)\*\*\*/g;
const RX_STRONG_AST = /\*\*(.+?)\*\*/g;
const RX_STRONG_US = /__(.+?)__/g;
const RX_EM_AST = /\*(?!\s)(.+?)(?!\s)\*/g;
const RX_EM_US = /(?<!\S)_(?!\s)(.+?)(?<!\s)_(?!\.\,\S)/g;
const RX_STRIKE_DOUBLE = /~~(.+?)~~/g;
const RX_STRIKE_SINGLE = /(?<!~)~([^\s~]+)~(?!~)/g;
const RX_SUP = /\^([^\s^]+)\^/g;
const RX_MARK = /==(?!\s)(.+?)(?<!\s)==/g;
const RX_HTML_ESCAPE = /[&"'<>]/g;
const RX_CODE_ESCAPE = /[&<>]/g;
const RX_QUOTE_ESCAPE = /[&"]/g;
const RX_ESCAPE = /\\([\\*_{}[\]()#+\-.!|~=^<>:"'])/g;
const RX_PLACEHOLDER = /\uE000([A-Z])(\d+)\uE001/g;
const RX_FENCE = /^[\s]*(```|~~~)/;
const RX_HR = /^\s*(?:(?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})$/;
const RX_HR_THEME = /^\s*-{3,}\s*([A-Za-z][\w-]*)\s*$/;
const RX_UL_ITEM = /^\s*[-*+]\s+/;
const RX_OL_ITEM = /^\s*(\d{1,9})[.)]\s+/;
const RX_TASK = /^\[([ xX])\](?:\s+|$)/;
const RX_REF_DEF = /^\s*\[([^\]^][^\]]*)\]:\s*<?([^\s>]+)>?(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/;
const RX_FOOTNOTE_DEF = /^\s*\[\^([^\]\s]+)\]:\s+(.*)$/;
const RX_DELIMITER_CELL = /^:?-+:?$/;
const LIST_TYPES = new Set(['ul_item', 'ol_item', 'list_continuation']);

const refLabel = (label) => label.trim().replace(/\s+/g, ' ').toLowerCase();
const noteId = (id) => id.replace(/[^\w-]/g, '-');

export class MarkdownParser {
    emojiMap = {};
    cache = {};
    rules = [];
    _depth = 0;
    _refs = new Map();
    _notes = new Map();
    _noteOrder = [];
    renderers = {
        'blank': (html, token, parser) => `${html}\n`,
        'html_block': (html, token, parser) => {
            const body = token.content.replace(new RegExp(`^<${token.tag}[^>]*>`), '').replace(new RegExp(`</${token.tag}>$`), '');
            return `${html}<${token.tag}${token.attrs}>${parser.parse(body)}</${token.tag}>\n`;
        },
        'literal': (html, token, parser) => `${html}${token.content}\n`,
        'literal_inline': (html, token, parser) => `${html}${parser.renderInline(token.content)}\n`,
        'paragraph': (html, token, parser) => `${html}<p>${parser.renderInline(token.content)}</p>\n`,
        'no_paragraph': (html, token, parser) => `${html}${parser.renderInline(token.content)}\n`,
        'webui_code_start': (html, token, parser) => `${html}${token.content}\n`,
        // Text indented under a list item, which stays in that item on its own line.
        'list_continuation': (html, token, parser, stack) => stack.length
            ? `${html}<br>${parser.renderInline(token.content)}`
            : `${html}<p>${parser.renderInline(token.content)}</p>\n`,
        'dt': (html, token, parser) => `${html}<dt>${parser.renderInline(token.content)}</dt>\n`,
        'dd': (html, token, parser) => `${html}<dd>${parser.renderInline(token.content)}</dd>\n`
    };
    constructor() {
        this.initDefaultRules();
    }
    addRule(type, test, processor, render) {
        this.rules.push({ test, processor });
        this.renderers[type] = render;
    }
    insertRule(index, type, test, processor, render) {
        this.rules.splice(index, 0, { test, processor });
        this.renderers[type] = render;
    }
    initDefaultRules() {
        const t = this;
        // Each item stays open until the next item at its level, so a nested list goes inside it, as HTML requires.
        const makeListRenderer = (listTag) => (html, token, parser, stack) => {
            html = parser.closeListsAbove(html, stack, token.indent);
            let top = stack[stack.length - 1];
            if (top && top.indent === token.indent && top.tag !== listTag) {
                html = parser.closeListsAbove(html, stack, token.indent - 1);
                top = stack[stack.length - 1];
            }
            if (!top || top.indent < token.indent) {
                const start = listTag === 'ol' && token.start !== undefined && token.start !== 1 ? ` start="${token.start}"` : '';
                html += `<${listTag}${start}>`;
                stack.push({ tag: listTag, indent: token.indent });
            } else {
                html += `</li>\n`;
            }
            if (token.check) {
                // The class draws the box. The disabled checkbox, hidden by CSS, tells screen readers the task state.
                const checked = token.check === 'checked' ? ' checked' : '';
                return html + `<li class="${token.check}"><input type="checkbox" class="task" disabled${checked}>${parser.renderInline(token.content)}`;
            }
            return html + `<li>${parser.renderInline(token.content)}`;
        };
        const listItem = (type, marker, line) => {
            const indent = line.match(/^\s*/)[0].length;
            const match = line.match(marker);
            let content = line.slice(match[0].length);
            const token = { type, indent };
            if (type === 'ol_item') token.start = parseInt(match[1], 10);
            const task = content.match(RX_TASK);
            if (task) {
                token.check = task[1] === ' ' ? 'unchecked' : 'checked';
                content = content.slice(task[0].length);
            }
            token.content = content.trim();
            return token;
        };
        const renderHeading = (html, token, parser) => {
            const id = token.id ? ` id="${parser.escapeQuote(token.id)}" hash="${parser.escapeQuote(token.id)}"` : '';
            return `${html}<h${token.level}${id}>${parser.renderInline(token.content)}</h${token.level}>\n`;
        };
        t.addRule('setext_heading', (line, state) => {
            return /^[\s]*(=+|-+)[\s]*$/.test(line) && state.tableBuffer.length === 0 && state.tokens.length > 0 && state.tokens[state.tokens.length - 1].type === 'paragraph';
        }, (line, state) => {
            const isH1 = line.includes('=');
            const prev = state.tokens.pop();
            return { type: "heading", level: isH1 ? 1 : 2, content: prev.content };
        }, renderHeading);
        t.addRule('line-break', (line, state) => RX_HR.test(line) || RX_HR_THEME.test(line),
        (line, state) => {
            const res = line.match(RX_HR_THEME);
            return res ? { type: "line-break", theme: res[1] } : { type: "line-break" };
        }, (html, token, parser) => {
            return token.theme
                ? `${html}<webui-line theme="${parser.escapeQuote(token.theme)}"></webui-line>\n`
                : `${html}<webui-line></webui-line>\n`;
        });
        t.addRule('heading', /^[\s]*#{1,6} /, (line, state) => {
            line = line.trim();
            const level = line.match(/^#+/)[0].length;
            // Closing hashes, as in "## Title ##", are not part of the title.
            let content = line.slice(level).trim().replace(/(^|\s+)#+\s*$/, '');
            let id;
            const custom = content.match(/\s*\{#([\w-]+)\}\s*$/);
            if (custom) {
                id = custom[1];
                content = content.slice(0, custom.index);
            }
            return { type: "heading", level, content, id };
        }, renderHeading);
        t.addRule('ul_item', RX_UL_ITEM, (line, state) => listItem('ul_item', RX_UL_ITEM, line), makeListRenderer('ul'));
        t.addRule('ol_item', RX_OL_ITEM, (line, state) => listItem('ol_item', RX_OL_ITEM, line), makeListRenderer('ol'));
        t.addRule('definition', (line, state) => {
            if (state.inCodeBlock || state.inTemplate || !/^\s*:\s+\S/.test(line)) return false;
            const prev = state.tokens[state.tokens.length - 1];
            return !!prev && ['paragraph', 'no_paragraph', 'dt', 'dd'].includes(prev.type);
        }, (line, state) => {
            const prev = state.tokens[state.tokens.length - 1];
            if (prev.type === 'paragraph' || prev.type === 'no_paragraph') prev.type = 'dt';
            return { type: 'dd', content: line.replace(/^\s*:\s+/, '').trim() };
        }, t.renderers.dd);
        t.addRule('blockquote_group', /^[\s]*> ?/, (line, state) => {
            if (state.inCodeBlock || state.inTemplate) return { type: 'literal', content: line };
            let lineContent = line.replace(/^[\s]*> ?/, '');
            let themeMatch = lineContent.match(/^\[([a-z]+)?\:?([A-Za-z-_ ]+)?\] ?/);
            let theme = 'info';
            let cite = '';
            if (themeMatch) {
                theme = themeMatch[1] || 'info';
                cite = themeMatch[2] || '';
                lineContent = lineContent.substring(themeMatch[0].length);
            }
            state.inBlockquote = true;
            return { type: "blockquote", content: lineContent, theme, cite };
        }, (html, token, parser) => {
            let theme = token.theme || 'info';
            let cite = token.cite || '';
            return `${html}<webui-quote theme="${parser.escapeQuote(theme)}" cite="${parser.escapeQuote(cite)}">${parser.parse(token.content.join('\n'))}</webui-quote>\n`;
        });
        t.addRule('html_line', (line, state) => {
            if (state.inCodeBlock || state.inTemplate) return false;
            line = line.trim();
            // <https://...> and <name@example.com> are links, not tags.
            if (/^<(https?:\/\/[^\s<>]+|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/i.test(line)) return false;
            return /^<([a-z0-9-_]+|\/[a-z0-9-_]+|!--|!DOCTYPE)[^>]*>/i.test(line);
        }, (line, state) => {
            if (/^[\s]*<pre><code>/i.test(line) && !/<\/code><\/pre>/i.test(line)) {
                state.inCodeBlock = true; state.codeBlockTag = '<pre><code>';
                return { type: 'webui_code_start', content: line };
            }
            if (/^[\s]*<webui-code\b[^>]*>/i.test(line) && !/<\/webui-code>/i.test(line)) {
                state.inCodeBlock = true; state.codeBlockTag = '<webui-code>';
                return { type: "webui_code_start", content: line };
            }
            if (/^[\s]*<template\b[^>]*>/i.test(line) && !/<\/template>/i.test(line)) {
                state.templateLayer++; state.inTemplate = true;
            }
            return { type: 'literal_inline', content: line };
        }, (html, token, parser) => `${html}${parser.renderInline(token.content)}\n`);
        t.addRule('code_block_start', RX_FENCE, (line, state) => {
            line = line.trim();
            let [, tag, lang, , label] = line.match(/^(`{3,}|~{3,})([^:\|;]*)(:|\||;)?(.*)/);
            if (state.inCodeBlock) {
                if (state.codeBlockTag === tag) {
                    state.inCodeBlock = false;
                    state.codeBlockTag = '';
                    return { type: "code_block_end" };
                }
                return { type: 'literal', content: line };
            }
            state.inCodeBlock = true;
            state.codeBlockTag = tag;
            return { type: "code_block_start", lang: lang ? lang.trim() : 'text', label };
        }, (html, token, parser) => {
            // language, not lang: lang is the HTML attribute for a human language, so lang="js" told screen
            // readers to read the code in an unknown language.
            return token.label
                ? `${html}<webui-code language="${parser.escapeQuote(token.lang)}" label="${parser.escapeQuote(token.label)}">\n`
                : `${html}<webui-code language="${parser.escapeQuote(token.lang)}">\n`;
        });
        t.addRule('code_block_end', RX_FENCE, () => {
            webui.log.warn('Unexpected use of code_block_end');
        }, (html, token, parser) => `${html}</webui-code>\n`);
        t.addRule('code_line', (line, state) => state.inCodeBlock && !RX_FENCE.test(line),
        (line, state) => {
            if (state.codeBlockTag === '<pre><code>' && /<\/code><\/pre>/i.test(line)) {
                state.inCodeBlock = false; state.codeBlockTag = '';
                return { type: 'literal', content: line };
            }
            if (state.codeBlockTag === '<webui-code>' && /<\/webui-code>/i.test(line)) {
                state.inCodeBlock = false; state.codeBlockTag = '';
                return { type: 'literal', content: line };
            }
            return { type: 'code_line', content: line };
        }, (html, token, parser) => `${html}${parser.escapeCode(token.content)}\n`);
        t.addRule('table', (line, state) => !state.inCodeBlock && !state.inTemplate && line.includes("|"),
        (line, state) => {
            state.tableBuffer.push(line);
            return false;
        }, (html, token, parser) => {
            const rows = token.rows.map(r => parser.splitTableRow(r));
            const head = rows[0];
            const alignments = (rows[1] || []).map(cell => {
                if (/^:-+:$/.test(cell)) return 'center';
                if (/^-+:$/.test(cell)) return 'right';
                if (/^:-+$/.test(cell)) return 'left';
                return 'justify';
            });
            html += `<table class="bordered" theme="info"><thead><tr>` + head.map((h, i) => {
                const align = alignments[i];
                const cls = align ? ` class="text-${parser.escapeQuote(align)}"` : '';
                return `<th${cls}>${parser.renderInline(h)}</th>`;
            }).join('') + "</tr></thead><tbody>";
            for (const row of rows.slice(2)) {
                html += "<tr>" + row.map((c, i) => {
                    const align = alignments[i];
                    const cls = align ? ` class="text-${parser.escapeQuote(align)}"` : '';
                    return `<td${cls}>${parser.renderInline(c)}</td>`;
                }).join('') + "</tr>";
            }
            return `${html}</tbody></table>\n`;
        });
    }
    // Splits a table row on pipes, except escaped pipes and pipes inside code spans.
    splitTableRow(row, ignoreCode) {
        row = row.trim();
        const cells = [];
        let cell = '';
        let tick = 0;
        for (let index = 0; index < row.length; ++index) {
            const char = row[index];
            if (char === '\\' && row[index + 1] === '|') {
                cell += tick ? '|' : '\\|';
                ++index;
            } else if (char === '`' && !ignoreCode) {
                let count = 1;
                while (row[index + count] === '`') ++count;
                if (!tick) tick = count;
                else if (tick === count) tick = 0;
                cell += '`'.repeat(count);
                index += count - 1;
            } else if (char === '|' && !tick) {
                cells.push(cell);
                cell = '';
            } else {
                cell += char;
            }
        }
        if (tick) return this.splitTableRow(row, true);
        cells.push(cell);
        if (row.startsWith('|')) cells.shift();
        if (row.endsWith('|') && !row.endsWith('\\|') && cells.length > 1) cells.pop();
        return cells.map(c => c.trim());
    }
    // The second row of a table, as in |---|:--:|. A row of dashes alone is a delimiter only under a one-column header,
    // so text with a pipe above a --- line stays text.
    isTableDelimiter(line, header) {
        if (!line.includes('-')) return false;
        const cells = this.splitTableRow(line);
        if (!cells.every(cell => RX_DELIMITER_CELL.test(cell))) return false;
        return line.includes('|') || this.splitTableRow(header).length === 1;
    }
    normalizeMultiLineTags(text) {
        let inTag = false, inStr = false, strChar = '', out = '';
        let inCodeBlock = false;
        let fence = '';
        for (let i = 0; i < text.length; i++) {
            const marker = text.substring(i, i + 3);
            if (marker === '```' || marker === '~~~') {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    fence = marker;
                } else if (marker === fence) {
                    inCodeBlock = false;
                }
                out += marker;
                i += 2;
                continue;
            }
            let c = text[i];
            if (!inCodeBlock) {
                if (!inTag && c === '<' && /[a-zA-Z\/!]/.test(text[i + 1] || '')) inTag = true;
                else if (inTag && !inStr && (c === '"' || c === "'")) { inStr = true; strChar = c; }
                else if (inTag && inStr && c === strChar) inStr = false;
                else if (inTag && !inStr && c === '>') inTag = false;

                if (inTag && c === '\n') {
                    out += ' ';
                } else if (inTag && c === '\r') {
                    // Ignore \r
                } else {
                    out += c;
                }
            } else {
                out += c;
            }
        }
        return out;
    }
    // Takes out link reference and footnote definitions, such as [id]: https://example.com, for use anywhere in the content.
    collectDefinitions(text) {
        const t = this;
        let fence = '';
        return text.split(/\r?\n/).filter(line => {
            const marker = line.match(/^\s*(`{3,}|~{3,})/);
            if (marker) {
                if (!fence) fence = marker[1];
                else if (marker[1] === fence) fence = '';
                return true;
            }
            if (fence) return true;
            const note = line.match(RX_FOOTNOTE_DEF);
            if (note) {
                t._notes.set(note[1], note[2].trim());
                return false;
            }
            const ref = line.match(RX_REF_DEF);
            if (ref) {
                const label = refLabel(ref[1]);
                if (!t._refs.has(label)) t._refs.set(label, { url: ref[2], title: ref[3] ?? ref[4] ?? ref[5] });
                return false;
            }
            return true;
        }).join('\n');
    }
    parse(text, noParagraph) {
        if (!text) return '';
        const t = this;
        const top = t._depth === 0;
        const key = noParagraph ? `\u0000${text}` : text;
        // Nested content can use the outer content's links and footnotes, so it is only cached when there are none.
        const cacheable = top || (!t._refs.size && !t._notes.size);
        if (cacheable && t.cache[key] !== undefined) return t.cache[key];
        if (top) {
            t._refs = new Map();
            t._notes = new Map();
            t._noteOrder = [];
        }
        t._depth++;
        try {
            let cleanText = t.normalizeMultiLineTags(text);
            if (top) cleanText = t.collectDefinitions(cleanText);
            const tokens = t.tokenize(t.trimLinePreTabs(cleanText), noParagraph);
            let html = t.render(tokens);
            if (top) html += t.renderFootnotes();
            if (cacheable) t.cache[key] = html;
            return html;
        } finally {
            t._depth--;
            if (top) {
                t._refs = new Map();
                t._notes = new Map();
                t._noteOrder = [];
            }
        }
    }
    tokenize(text, noParagraph) {
        const t = this;
        const state = {
            tokens: [],
            lines: text.split(/\r?\n/),
            inCodeBlock: false,
            inBlockquote: false,
            inTemplate: false,
            codeBlockTag: '',
            tableBuffer: [],
            blockquoteBuffer: [],
            templateLayer: 0
        };
        const flushTable = () => {
            if (state.tableBuffer.length === 0) return;
            if (state.tableBuffer.length > 1) {
                state.tokens.push({ type: "table", rows: [...state.tableBuffer] });
            } else {
                // A line with a pipe but no delimiter row after it is ordinary text, not a table.
                state.tokens.push({ type: noParagraph ? 'no_paragraph' : 'paragraph', content: state.tableBuffer[0].trim() });
            }
            state.tableBuffer = [];
        };
        const flushBlockquote = () => {
            if (!state.inBlockquote) return;
            state.inBlockquote = false;
            if (state.blockquoteBuffer.length) {
                state.tokens.push({
                    type: "blockquote_group",
                    content: state.blockquoteBuffer.map(b => b.content),
                    theme: state.blockquoteBuffer[0].theme,
                    cite: state.blockquoteBuffer[0].cite
                });
                state.blockquoteBuffer.length = 0;
            }
        };
        for (let line of state.lines) {
            let matched = false;
            if (line.trim() === '') {
                flushTable(); flushBlockquote();
                state.tokens.push({ type: "blank" });
                continue;
            }
            if (state.tableBuffer.length === 1 && !t.isTableDelimiter(line, state.tableBuffer[0])) {
                flushTable();
            }
            for (let rule of this.rules) {
                if (typeof rule.test === 'function' ? rule.test(line, state) : rule.test.test(line)) {
                    matched = true;
                    const result = rule.processor(line, state);
                    if (state.inTemplate && result.type !== 'literal_inline') {
                        state.tokens.push({ type: 'literal', content: line });
                    } else if (state.inCodeBlock && result.type === 'code_block_end') {
                        state.tokens.push({ type: 'literal', content: line });
                    } else if (state.inCodeBlock && !['code_block_start', 'webui_code_start'].includes(result.type)) {
                        state.tokens.push({ type: 'code_line', content: line });
                    } else if (result) {
                        if (result.type !== 'table') flushTable();
                        if (result.type === "blockquote") {
                            state.blockquoteBuffer.push(result);
                            continue;
                        }
                        flushBlockquote();
                        state.tokens.push(result);
                    }
                    break;
                }
            }
            if (matched) continue;
            if (state.inTemplate && /<\/template>/i.test(line)) {
                state.templateLayer--;
                if (state.templateLayer <= 0) {
                    state.templateLayer = 0;
                    state.inTemplate = false;
                }
                state.tokens.push({ type: 'literal', content: line });
                continue;
            }
            if (state.inTemplate || state.inCodeBlock) {
                state.tokens.push({ type: 'literal', content: line });
                continue;
            }
            if (state.inBlockquote) {
                flushBlockquote();
                state.inBlockquote = false;
            }
            flushTable();
            // Text indented further than the list item above it continues that item.
            const last = state.tokens[state.tokens.length - 1];
            if (last && LIST_TYPES.has(last.type) && line.match(/^\s*/)[0].length > last.indent) {
                state.tokens.push({ type: 'list_continuation', content: line.trim(), indent: last.indent });
                continue;
            }
            state.tokens.push({ type: noParagraph ? 'no_paragraph' : 'paragraph', content: line.trim() });
        }
        flushTable(); flushBlockquote();
        let equalizedTokens = [];
        let blockBuf = [];
        let inEqBlock = false;
        for (let i = 0; i < state.tokens.length; i++) {
            let t = state.tokens[i];
            if (!inEqBlock && (t.type === 'code_block_start' || t.type === 'webui_code_start' || (t.type === 'literal_inline' && /^[\s]*<template\b[^>]*>/i.test(t.content)))) {
                inEqBlock = true;
            }
            if (inEqBlock) {
                blockBuf.push(t);
                if (t.type === 'code_block_end' ||
                   (t.type === 'literal' && /<\/webui-code>/i.test(t.content)) ||
                   (t.type === 'literal' && /<\/code><\/pre>/i.test(t.content)) ||
                   (t.type === 'literal' && /<\/template>/i.test(t.content))) {
                    const text = blockBuf.map(b => b.content).join('\n');
                    const equalized = this.trimLinePreTabs(text);
                    const equalizedLines = equalized.split('\n');
                    for (let j = 0; j < equalizedLines.length; j++) {
                        equalizedTokens.push({ ...blockBuf[j], content: equalizedLines[j] });
                    }
                    blockBuf = [];
                    inEqBlock = false;
                }
            } else {
                equalizedTokens.push(t);
            }
        }
        if (blockBuf.length > 0) {
            const text = blockBuf.map(b => b.content).join('\n');
            const equalized = this.trimLinePreTabs(text);
            const equalizedLines = equalized.split('\n');
            for (let j = 0; j < equalizedLines.length; j++) {
                equalizedTokens.push({ ...blockBuf[j], content: equalizedLines[j] });
            }
        }
        return equalizedTokens;
    }
    render(tokens) {
        let html = "";
        const stack = [];
        let inDl = false;
        for (let index = 0; index < tokens.length; ++index) {
            const token = tokens[index];
            if (token.type === 'blank' && stack.length) {
                // Blank lines between items keep them in one list.
                let next = index + 1;
                while (tokens[next] && tokens[next].type === 'blank') ++next;
                if (tokens[next] && (tokens[next].type === 'ul_item' || tokens[next].type === 'ol_item')) continue;
            }
            if (!LIST_TYPES.has(token.type) && stack.length > 0) {
                html = this.closeListsAbove(html, stack, -1);
            }
            const isDefinition = token.type === 'dt' || token.type === 'dd';
            if (inDl && !isDefinition) {
                html += '</dl>\n';
                inDl = false;
            } else if (!inDl && isDefinition) {
                html += '<dl>';
                inDl = true;
            }
            const render = this.renderers[token.type];
            if (typeof render === 'function') {
                html = render(html, token, this, stack);
            }
        }
        if (inDl) html += '</dl>\n';
        return this.closeListsAbove(html, stack, -1);
    }
    closeListsAbove(html, stack, level) {
        while (stack.length && stack[stack.length - 1].indent > level) {
            html += `</li>\n</${stack.pop().tag}>\n`;
        }
        return html;
    }
    trimLinePreTabs(html, tabLength = 4) {
        const tabRepl = ' '.repeat(tabLength);
        const startLines = html.replace(/\t/g, tabRepl).split('\n');
        let tabLen = 999;
        for (let i = 1; i < startLines.length; i++) {
            if (startLines[i].trim() === '') continue;
            let m = startLines[i].match(/^([ ]*)/)[0].length;
            if (m === 0) return html;
            if (m < tabLen) tabLen = m;
        }
        if (tabLen === 999 || tabLen === 0) return html;
        const rgx = new RegExp(`^[ ]{1,${tabLen}}`);
        return startLines.map(line => line.replace(rgx, '')).join('\n');
    }
    renderFootnotes() {
        const t = this;
        if (!t._noteOrder.length) return '';
        let items = '';
        // A footnote can refer to another, which adds to the order while this runs.
        for (let index = 0; index < t._noteOrder.length; ++index) {
            const id = noteId(t._noteOrder[index]);
            const text = t.renderInline(t._notes.get(t._noteOrder[index]));
            items += `<li id="fn-${id}" hash="fn-${id}" tabindex="-1">${text} <a href="#fnref-${id}" aria-label="Back to reference ${index + 1}">↩</a></li>\n`;
        }
        return `<section class="footnotes" aria-label="Footnotes"><webui-line></webui-line><ol>\n${items}</ol></section>\n`;
    }
    renderInline(text) {
        const t = this;
        const held = { A: [], C: [], E: [], H: [], S: [] };
        const hold = (kind, value) => {
            held[kind].push(value);
            return `\uE000${kind}${held[kind].length - 1}\uE001`;
        };
        const anchor = (url, title) => {
            const titleAttr = title !== undefined ? ` title="${t.escapeQuote(title)}"` : '';
            return hold('H', `<a href="${t.escapeQuote(url)}"${titleAttr}>`);
        };
        const image = (alt, url, title) => {
            const titleAttr = title !== undefined ? ` title="${t.escapeQuote(title)}"` : '';
            return hold('A', `<img alt="${t.escapeQuote(alt)}" src="${t.escapeQuote(url)}"${titleAttr} />`);
        };
        // Escaped backticks first, so they cannot start a code span. Other escapes are left as written inside code.
        text = text.replace(/\\`/g, () => hold('S', '`'));
        text = text.replace(RX_CODE_SPAN, (_, backticks, code) => {
            if (code.startsWith(' ') && code.endsWith(' ') && code.trim().length > 0) {
                code = code.substring(1, code.length - 1);
            }
            const match = code.match(/^(([a-z]+):)?(.*)/);
            const theme = match && match[2] ? match[2] : null;
            const refined = match ? match[3] : code;
            return hold('C', theme
                ? `<code theme="${t.escapeQuote(theme)}">${t.escapeCode(refined)}</code>`
                : `<code>${t.escapeCode(code)}</code>`);
        });
        text = text.replace(RX_ESCAPE, (_, char) => hold('S', t.escapeHtml(char)));
        text = text.replace(RX_AUTOLINK_ANGLE, (_, url) => hold('A', `<a href="${t.escapeQuote(url)}">${t.escapeCode(url)}</a>`));
        text = text.replace(RX_AUTOLINK_EMAIL, (_, email) => hold('A', `<a href="mailto:${t.escapeQuote(email)}">${t.escapeCode(email)}</a>`));
        text = text.replace(RX_HTML_TAG, (match) => hold('H', match));
        text = text.replace(RX_EMOJI, (_, emoji) => hold('E', `<webui-emoji emoji="${t.escapeQuote(emoji)}"></webui-emoji>`));
        if (t._notes.size) {
            text = text.replace(RX_FOOTNOTE_REF, (match, id) => {
                if (!t._notes.has(id)) return match;
                let number = t._noteOrder.indexOf(id) + 1;
                const first = !number;
                if (first) number = t._noteOrder.push(id);
                const sid = noteId(id);
                const target = first ? ` id="fnref-${sid}" hash="fnref-${sid}"` : '';
                return hold('A', `<sup class="footnote-ref"><a href="#fn-${sid}"${target} aria-label="Footnote ${number}">${number}</a></sup>`);
            });
        }
        text = text.replace(RX_IMG, (_, alt, url, titleDouble, titleSingle) => image(alt, url, titleDouble ?? titleSingle));
        if (t._refs.size) {
            text = text.replace(RX_IMG_REF, (match, alt, label) => {
                const ref = t._refs.get(refLabel(label || alt));
                return ref ? image(alt, ref.url, ref.title) : match;
            });
        }
        // The link text stays in place between held tags, so emphasis inside it still applies.
        text = text.replace(RX_LINK, (_, label, url, titleDouble, titleSingle) => `${anchor(url, titleDouble ?? titleSingle)}${label}${hold('H', '</a>')}`);
        if (t._refs.size) {
            text = text.replace(RX_LINK_REF, (match, label, ref) => {
                const found = t._refs.get(refLabel(ref || label));
                return found ? `${anchor(found.url, found.title)}${label}${hold('H', '</a>')}` : match;
            });
            text = text.replace(RX_LINK_SHORTCUT, (match, label) => {
                const found = t._refs.get(refLabel(label));
                return found ? `${anchor(found.url, found.title)}${label}${hold('H', '</a>')}` : match;
            });
        }
        text = t.autolink(text, held, hold);
        text = text
            .replace(RX_STRONG_EM, '<strong><em>$1</em></strong>')
            .replace(RX_STRONG_AST, '<strong>$1</strong>')
            .replace(RX_STRONG_US, '<strong>$1</strong>')
            .replace(RX_EM_AST, '<em>$1</em>')
            .replace(RX_EM_US, '<em>$1</em>')
            .replace(RX_STRIKE_DOUBLE, '<del>$1</del>')
            .replace(RX_STRIKE_SINGLE, '<sub>$1</sub>')
            .replace(RX_SUP, '<sup>$1</sup>')
            .replace(RX_MARK, '<mark>$1</mark>');
        // Held values can hold others, such as a code span inside a link, so restore until none are left.
        for (let pass = 0; pass < 5 && text.includes('\uE000'); ++pass) {
            text = text.replace(RX_PLACEHOLDER, (match, kind, index) => held[kind]?.[index] ?? match);
        }
        return text;
    }
    // Turns bare urls into links, except in the text of a link that is already there.
    autolink(text, held, hold) {
        let depth = 0;
        return text.split(/(\uE000H\d+\uE001)/).map(part => {
            const tag = part.match(/^\uE000H(\d+)\uE001$/);
            if (tag) {
                const html = held.H[tag[1]];
                if (/^<a\b/i.test(html)) ++depth;
                else if (/^<\/a>/i.test(html)) depth = Math.max(0, depth - 1);
                return part;
            }
            if (depth) return part;
            return part.replace(RX_AUTOLINK, (_, url) => hold('A', `<a href="${this.escapeQuote(url)}">${this.escapeCode(url)}</a>`));
        }).join('');
    }
    escapeHtml(text) {
        const map = { '&': '&amp;', '"': '&quot;', "'": '&#039;', '<': '&lt;', '>': '&gt;' };
        return text.replace(RX_HTML_ESCAPE, m => map[m]);
    }
    escapeCode(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
        return text.replace(RX_CODE_ESCAPE, m => map[m]);
    }
    escapeQuote(text) {
        const map = { '&': '&amp;', '"': '&quot;' };
        return text.replace(RX_QUOTE_ESCAPE, m => map[m]);
    }
}
