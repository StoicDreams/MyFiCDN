/*!
 * MDParse - https://webui.stoicdreams.com
 * Web UI Specific Markdown Parser
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"

const RX_CODE_SPAN = /`([^`]+)`/g;
const RX_HTML_TAG = /<[a-zA-Z\/!][^>]*>/g;
const RX_EMOJI = /:([a-zA-Z0-9_+-]+):/g;
const RX_IMG_TITLE = /!\[(.*?)\]\((.*?) "(.*?)"\)/g;
const RX_LINK_TITLE = /\[(.*?)\]\((.*?) "(.*?)"\)/g;
const RX_IMG = /!\[(.*?)\]\((.*?)\)/g;
const RX_LINK = /\[(.*?)\]\((.*?)\)/g;
const RX_AST = /\\\*/g;
const RX_STRONG_AST = /\*\*(.+?)\*\*/g;
const RX_STRONG_US = /__(.+?)__/g;
const RX_EM_AST = /\*(?!\s)(.+?)(?!\s)\*/g;
const RX_EM_US = /(?<!\S)_(?!\s)(.+?)(?<!\s)_(?!\.\,\S)/g;
const RX_HTML_ESCAPE = /[&"'<>]/g;
const RX_CODE_ESCAPE = /[&<>]/g;
const RX_QUOTE_ESCAPE = /[&"]/g;

export class MarkdownParser {
    emojiMap = {};
    cache = {};
    rules = [];
    renderers = {
        'blank': (html, token, parser) => `${html}\n`,
        'html_block': (html, token, parser) => {
            const body = token.content.replace(new RegExp(`^<${token.tag}[^>]*>`), '').replace(new RegExp(`</${token.tag}>$`), '');
            return `${html}<${token.tag}${token.attrs}>${parser.parse(body)}</${token.tag}>\n`;
        },
        'literal': (html, token, parser) => `${html}${token.content}\n`,
        'literal_inline': (html, token, parser) => `${html}${parser.renderInline(token.content)}\n`,
        'paragraph': (html, token, parser) => `${html}<p>${parser.renderInline(token.content)}</p>\n`,
        'no_paragraph': (html, token, parser) => `${html}${parser.renderInline(token.content)}\n`
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
        const makeListRenderer = (listTag) => (html, token, parser, stack) => {
            const last = stack[stack.length - 1];
            if (!last || token.indent < last.indent || last.tag !== listTag) {
                html = parser.closeListsAbove(html, stack, token.indent);
            }
            const top = stack[stack.length - 1];
            if (!top || top.tag !== listTag || top.indent < token.indent) {
                html += `<${listTag}>`;
                stack.push({ tag: listTag, indent: token.indent });
            }
            if (token.check) {
                return html + `<li class="${parser.escapeQuote(token.check)}">${parser.renderInline(token.content)}</li>\n`;
            }
            return html + `<li>${parser.renderInline(token.content)}</li>\n`;
        };
        t.addRule('line-break', (line, state) => /^[\s]*---.*/.test(line) && state.tableBuffer.length === 0,
        (line, state) => {
            const res = line.match(/^[\s]*[-]+([^-]+).*/);
            return res ? { type: "line-break", theme: res[1] } : { type: "line-break" };
        }, (html, token, parser) => {
            return token.theme
                ? `${html}<webui-line theme="${parser.escapeQuote(token.theme)}"></webui-line>\n`
                : `${html}<webui-line></webui-line>\n`;
        });
        t.addRule('heading', /^[\s]*#{1,6} /, (line, state) => {
            line = line.trim();
            const level = line.match(/^#+/)[0].length;
            return { type: "heading", level, content: line.slice(level + 1).trim() };
        }, (html, token, parser) => `${html}<h${token.level}>${parser.renderInline(token.content)}</h${token.level}>\n`);
        t.addRule('ul_item', /^[\s]*[\-\*]{1} /, (line, state) => {
            const indent = line.match(/^\s*/)[0].length;
            let [, check] = line.match(/^\s*[\-\*]{1} ?(\[( \vert{}x)?\])?/);
            if (check !== undefined) check = check === '[x]' ? 'checked' : 'unchecked';
            return { type: "ul_item", content: line.replace(/^\s*[\-\*]{1}( \[( \vert{}x)?\])?/, '').trim(), indent, check };
        }, makeListRenderer('ul'));
        t.addRule('ol_item', /^[\s]*\d+\. /, (line, state) => {
            const indent = line.match(/^\s*/)[0].length;
            return { type: "ol_item", content: line.replace(/^\s*\d+\.\s+/, "").trim(), indent };
        }, makeListRenderer('ol'));
        t.addRule('blockquote_group', /^[\s]*> ?/, (line, state) => {
            line = line.trim();
            if (state.inCodeBlock || state.inTemplate) return { type: 'literal', content: line };
            let [, , , theme, cite, content] = line.match(/^[\s]*(>| )*(\[([a-z]+)?\:?([A-Za-z-_ ]+)?\])?(.*)/);
            theme = theme?.replace(/(\[\vert{}\])/g, '') || 'info';
            state.inBlockquote = true;
            return { type: "blockquote", content: line.replace(/^> ?(\[([a-z]+)?:?([A-Za-z-_ ]+)?\])? ?/, ""), theme, cite };
        }, (html, token, parser) => {
            let theme = token.theme || 'info';
            let cite = token.cite || '';
            return `${html}<webui-quote theme="${parser.escapeQuote(theme)}" cite="${parser.escapeQuote(cite)}">${parser.parse(token.content.join('\n'))}</webui-quote>\n`;
        });
        t.addRule('html_line', (line, state) => {
            if (state.inCodeBlock || state.inTemplate) return false;
            return /^<([a-z0-9-_]+|\/[a-z0-9-_]+|!--|!DOCTYPE)[^>]*>/i.test(line.trim());
        }, (line, state) => {
            if (/^[\s]*<pre><code>/i.test(line) && !/<\/code><\/pre>/i.test(line)) {
                state.inCodeBlock = true; state.codeBlockTag = '<pre><code>';
                return { type: 'literal', content: line };
            }
            if (/^[\s]*<webui-code\b[^>]*>/i.test(line) && !/<\/webui-code>/i.test(line)) {
                state.inCodeBlock = true; state.codeBlockTag = '<webui-code>';
                return { type: "literal", content: line };
            }
            if (/^[\s]*<template\b[^>]*>/i.test(line) && !/<\/template>/i.test(line)) {
                state.templateLayer++; state.inTemplate = true;
            }
            return { type: 'literal_inline', content: line };
        }, (html, token, parser) => `${html}${parser.renderInline(token.content)}\n`);
        t.addRule('code_block_start', /^[\s]*```/, (line, state) => {
            line = line.trim();
            let [, tag, lang, , label] = line.match(/^([`]+)([^:\|;]*)(:|\||;)?(.*)/);
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
            return token.label
                ? `${html}<webui-code lang="${parser.escapeQuote(token.lang)}" label="${parser.escapeQuote(token.label)}">\n`
                : `${html}<webui-code lang="${parser.escapeQuote(token.lang)}">\n`;
        });
        t.addRule('code_block_end', /^[\s]*```/, () => {
            webui.log.warn('Unexpected use of code_block_end');
        }, (html, token, parser) => `${html}</webui-code>\n`);
        t.addRule('code_line', (line, state) => state.inCodeBlock && !/^[\s]*```/.test(line),
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
            const rows = token.rows.map(r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split("|").map(c => c.trim()));
            const head = rows[0];
            const alignments = (rows[1] || []).map(cell => {
                const trimmed = cell.trim();
                if (/^:-+:$/.test(trimmed)) return 'center';
                if (/^-+:$/.test(trimmed)) return 'right';
                if (/^:-+$/.test(trimmed)) return 'justify';
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
    normalizeMultiLineTags(text) {
        let inTag = false, inStr = false, strChar = '', out = '';
        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            if (!inTag && c === '<' && /[a-zA-Z\/!]/.test(text[i + 1] || '')) inTag = true;
            else if (inTag && !inStr && (c === '"' || c === "'")) { inStr = true; strChar = c; }
            else if (inTag && inStr && c === strChar) inStr = false;
            else if (inTag && !inStr && c === '>') inTag = false;
            if (inTag && c === '\n') out += ' ';
            else if (inTag && c === '\r');
            else out += c;
        }
        return out;
    }
    parse(text, noParagraph) {
        if (!text) return '';
        if (this.cache[text]) return this.cache[text];
        let cleanText = this.normalizeMultiLineTags(text);
        const tokens = this.tokenize(this.trimLinePreTabs(cleanText), noParagraph);
        let html = this.render(tokens);
        this.cache[text] = html;
        return html;
    }
    tokenize(text, noParagraph) {
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
            if (state.tableBuffer.length > 0) {
                state.tokens.push({ type: "table", rows: [...state.tableBuffer] });
                state.tableBuffer = [];
            }
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
                // ✨ FIX: Safely push the closing tag as a literal and skip the paragraph wrap
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
            state.tokens.push({ type: noParagraph ? 'no_paragraph' : 'paragraph', content: line.trim() });
        }
        flushTable(); flushBlockquote();
        return state.tokens;
    }
    render(tokens) {
        let html = "";
        const stack = [];
        for (const token of tokens) {
            if (!['ol_item', 'ul_item'].includes(token.type) && stack.length > 0) {
                html = this.closeListsAbove(html, stack, -1);
            }
            const render = this.renderers[token.type];
            if (typeof render === 'function') {
                html = render(html, token, this, stack);
            }
        }
        return this.closeListsAbove(html, stack, -1);
    }
    closeListsAbove(html, stack, level) {
        while (stack.length && stack[stack.length - 1].indent > level) {
            html += `</${stack.pop().tag}>\n`;
        }
        return html;
    }
    trimLinePreTabs(html, tabLength = 4) {
        const tabRepl = ' '.repeat(tabLength);
        const startLines = html.replace(/\t/g, tabRepl).split('\n');
        let tabLen = 999;
        for (let i = 1; i < startLines.length; i++) {
            let m = startLines[i].match(/^([ ]*)/)[0].length;
            if (m === 0) return html;
            if (m < tabLen) tabLen = m;
        }
        if (tabLen === 999 || tabLen === 0) return html;
        const rgx = new RegExp(`^[ ]{1,${tabLen}}`);
        return startLines.map(line => line.replace(rgx, '')).join('\n');
    }
    renderInline(text) {
        const t = this;
        const codeSpans = [], htmlTags = [], emojis = [];
        text = text.replace(RX_CODE_SPAN, (_, code) => {
            const token = `^^CODE${codeSpans.length}^^`;
            const [, , theme, refined] = code.match(/^(([a-z]+):)?(.*)/);
            codeSpans.push(theme
                ? `<code theme="${t.escapeQuote(theme)}">${t.escapeCode(refined)}</code>`
                : `<code>${t.escapeCode(code)}</code>`);
            return token;
        });
        text = text.replace(RX_HTML_TAG, (match) => {
            const token = `^^HTML${htmlTags.length}^^`;
            htmlTags.push(match);
            return token;
        });
        text = text.replace(RX_EMOJI, (_, emoji) => {
            const token = `^^EMOJI${emojis.length}^^`;
            emojis.push(`<webui-emoji emoji="${t.escapeQuote(emoji)}"></webui-emoji>`);
            return token;
        });
        text = text
            .replace(RX_IMG_TITLE, '<img alt="$1" src="$2" title="$3" />')
            .replace(RX_LINK_TITLE, '<a href="$2" title="$3">$1</a>')
            .replace(RX_IMG, '<img alt="$1" src="$2" />')
            .replace(RX_LINK, '<a href="$2">$1</a>')
            .replace(RX_AST, '&ast;')
            .replace(RX_STRONG_AST, '<strong>$1</strong>')
            .replace(RX_STRONG_US, '<strong>$1</strong>')
            .replace(RX_EM_AST, '<em>$1</em>')
            .replace(RX_EM_US, '<em>$1</em>');
        codeSpans.forEach((val, i) => text = text.replace(`^^CODE${i}^^`, val));
        emojis.forEach((val, i) => text = text.replace(`^^EMOJI${i}^^`, val));
        htmlTags.forEach((val, i) => text = text.replace(`^^HTML${i}^^`, val));

        return text;
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