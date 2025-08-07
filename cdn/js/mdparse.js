/*!
 * MDParse - https://webui.stoicdreams.com
 * Web UI Specific Markdown Parser
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
export class MarkdownParser {
    emojiMap = {};
    cache = {};
    renderers = {
        'blank': (html, token, commands) => {
            return `${html}\n`;
        },
        'html_block': (html, token, commands) => {
            const body = token.content.replace(new RegExp(`^<${token.tag}[^>]*>`), '').replace(new RegExp(`</${token.tag}>$`), '');
            return `${html}<${token.tag}${token.attrs}>${commands.parse(body)}</${token.tag}>\n`;
        },
        'literal': (html, token, commands) => {
            return `${html}${token.content}\n`;
        },
        'paragraph': (html, token, commands) => {
            return `${html}<p>${commands.renderInline(token.content)}</p>\n`;
        }
    };
    rules = [];
    constructor() {
        this.initDefaultRules();
    }
    addRule(type, test, processor, render) {
        this.rules.push({ test, processor });
        this.renderers[type] = render;
    }
    insertRule(index, test, processor) {
        this.rules.splice(index, 0, { test, processor });
    }
    initDefaultRules() {
        const t = this;
        t.addRule('line-break', /^[\s]*---.*/, (line, state) => {
            const res = line.match(/^[\s]*[-]+([^-]+).*/);
            if (res) {
                const [, theme] = res;
                return { type: "line-break", theme };
            }
            return { type: "line-break" };
        }, (html, token, commands) => {
            if (token.theme) {
                return `${html}<webui-line theme="${token.theme}"></webui-line>\n`;
            }
            return `${html}<webui-line></webui-line>\n`;
        });
        t.addRule('heading', /^[\s]*#{1,6} /, (line, state) => {
            line = line.trim();
            const level = line.match(/^#+/)[0].length;
            return { type: "heading", level, content: line.slice(level + 1).trim() };
        }, (html, token, commands) => {
            return `${html}<h${token.level}>${commands.renderInline(token.content)}</h${token.level}>\n`;
        });
        t.addRule('ul_item', /^\s{0,3}\* /, (line, state) => {
            const indent = line.match(/^\s*/)[0].length;
            return { type: "ul_item", content: line.trim().slice(2).trim(), indent };
        }, (html, token, commands) => {
            commands.closeListsAbove(token.indent);
            if (!commands.stack.length || commands.stack[commands.stack.length - 1].tag !== "ul") {
                html += "<ul>";
                commands.stack.push({ tag: "ul", indent: token.indent });
            }
            return `${html}<li>${commands.renderInline(token.content)}</li>\n`;
        });
        t.addRule('ol_item', /^\s{0,3}\d+\. /, (line, state) => {
            const indent = line.match(/^\s*/)[0].length;
            return { type: "ol_item", content: line.replace(/^\s*\d+\.\s+/, "").trim(), indent };
        }, (html, token, commands) => {
            commands.closeListsAbove(token.indent);
            if (!commands.stack.length || commands.stack[commands.stack.length - 1].tag !== "ol") {
                html += "<ol>";
                commands.stack.push({ tag: "ol", indent: token.indent });
            }
            return `${html}<li>${commands.renderInline(token.content)}</li>\n`;
        });
        t.addRule('blockquote_group', /^[\s]*> ?/, (line, state) => {
            line = line.trim();
            if (state.inCodeBlock || state.inTemplate) return { type: 'literal', content: line };
            state.inBlockquote = true;
            return { type: "blockquote", content: line.replace(/^> ?/, "") };
        }, (html, token, commands) => {
            return `${html}<webui-quote theme="info">` + t.parse(token.content.join('\n')) + `</webui-quote>\n`;
        });
        t.addRule('precode_start', /^[\s]*<pre><code>.*/, (line, state) => {
            if (state.inCodeBlock || state.inTemplate) return { type: 'literal', content: line };
            // TODO: Needs more refinement
            state.inCodeBlock = true;
            state.codeBlockTag = '<pre><code>'
            return { type: 'literal', content: line };
        }, (html, token, commands) => {
            return html;
        });
        t.addRule('precode_end', /^.*<\/code><\/pre>.*/, (line, state) => {
            // TODO: Needs more refinement
            if (state.codeBlockTag === '<pre><code>') {
                state.inCodeBlock = false;
            }
            return { type: 'literal', content: line };
        }, (html, token, commands) => {
            return html;
        });
        t.addRule('code_block_start', /^[\s]*```/, (line, state) => {
            line = line.trim();
            let [, tag, lang] = line.match(/^([`]+)(.*)/);
            if (state.inCodeBlock) {
                if (state.codeBlockTag === tag) {
                    state.inCodeBlock = false;
                    state.codeBlockTag = '';
                    return { type: "code_block_end" };
                } else {
                    return { type: 'literal', content: line };
                }
            } else {
                state.inCodeBlock = true;
                state.codeBlockTag = tag;
                lang = !!lang ? lang.trim() : 'text';
                return { type: "code_block_start", lang };
            }
        }, (html, token, commands) => {
            return `${html}<pre><code class="lang-${token.lang}">`;
        });
        t.addRule('code_block_end', /^[\s]*```/, (line, state) => {
            console.log('Unexpected use of code_block_end');
        }, (html, token, commands) => {
            return `${html}</code></pre>\n`;
        });
        t.addRule('code_line', (line, state) => {
            return state.inCodeBlock && !/^[\s]*```/.test(line);
        }, (line, state) => {
            return { type: 'code_line', content: line };
        }, (html, token, commands) => {
            return `${html}${commands.escapeCode(token.content)}\n`;
        });
        t.addRule('html_selfclose', /^[\s]*<([a-z][a-z0-9-_]*)([^>]*)\/>[\s]*$/, (line, state) => {
            const [, tag, attrs] = line.match(/^[\s]*<([a-z][a-z0-9-_]*)([^>]*)\/>[\s]*$/);
            return { type: "html_selfclose", tag, attrs };
        }, (html, token, commands) => {
            return `${html}<${token.tag}${token.attrs} />\n`;
        });
        t.addRule('html_withclose', /^[\s]*<([a-z][a-z0-9-_]*)([^>]*)>.*<\/\1>[\s]*$/, (line, state) => {
            const [, tag, attrs, contents] = line.match(/^[\s]*<([a-z][a-z0-9-_]*)([^>]*)>(.*)<\/\1>[\s]*$/);
            return { type: "html_withclose", tag, attrs, contents };
        }, (html, token, commands) => {
            if (token.tag === 'template') {
                return `${html}<${token.tag}${token.attrs}>${token.contents}</${token.tag}>\n`;
            }
            return `${html}<${token.tag}${token.attrs}>${commands.renderInline(token.contents)}</${token.tag}>\n`;
        });
        t.addRule('template_open', /^[\s]*<template([^>]*)>.*$/, (line, state) => {
            if (state.inCodeBlock) return { type: 'literal', content: line };
            const [, attrs, contents] = line.match(/^[\s]*<template([^>]*)>(.*)$/);
            state.templateLayer++;
            if (!state.inTemplate) {
                state.inTemplate = true;
            }
            return { type: "template_open", attrs, contents };
        }, (html, token, commands) => {
            return `${html}<template${token.attrs}>${commands.renderInline(token.contents)}\n`;
        });
        t.addRule('template_close', /^[^<]*<\/template>.*$/, (line, state) => {
            if (state.inCodeBlock) return { type: 'literal', content: line };
            const [, prefix, contents] = line.match(/^([^<]*)<\/template>(.*)$/);
            state.templateLayer--;
            if (state.templateLayer === 0) {
                state.inTemplate = false;
            }
            return { type: "template_close", prefix, contents };
        }, (html, token, commands) => {
            return `${html}${token.prefix}</template>${commands.renderInline(token.contents)}\n`;
        });
        t.addRule('html_open', /^[\s]*<([a-z][a-z0-9-_]*)([^>]*)>.*$/, (line, state) => {
            const [, tag, attrs, contents] = line.match(/^[\s]*<([a-z][a-z0-9-_]*)([^>]*)>(.*)$/);
            return { type: "html_open", tag, attrs, contents };
        }, (html, token, commands) => {
            return `${html}<${token.tag}${token.attrs}>${commands.renderInline(token.contents)}\n`;
        });
        t.addRule('html_close', /^[\s]*<\/([a-z][a-z0-9-_]*)>.*$/, (line, state) => {
            const [, tag, contents] = line.match(/^[\s]*<\/([a-z][a-z0-9-_]*)>(.*)$/);
            return { type: "html_close", tag, contents };
        }, (html, token, commands) => {
            return `${html}</${token.tag}>${commands.renderInline(token.contents)}\n`;
        });
        t.addRule('table', (line, state) => {
            return line.includes("|");
        }, (line, state) => {
            state.tableBuffer.push(line);
            return false;
        }, (html, token, commands) => {
            const rows = token.rows.map(r => r.split("|").slice(1, -1).map(c => c.trim()));
            const head = rows[0];
            const align = rows[1] || [];
            const body = rows.slice(2);
            html += "<table><thead><tr>" + head.map(h => `<th>${commands.renderInline(h)}</th>`).join('') + "</tr></thead><tbody>";
            for (const row of body) {
                html += "<tr>" + row.map(c => `<td>${commands.renderInline(c)}</td>`).join('') + "</tr>";
            }
            return `${html}</tbody></table>\n`;
        });
    }
    parse(text) {
        if (text === undefined || text === null || text === '') return '';
        const t = this;
        if (t.cache[text]) return t.cache[text];
        const tokens = t.tokenize(t.trimLinePreTabs(text));
        let html = t.render(tokens);
        t.cache[text] = html;
        return html;
    }
    tokenize(text) {
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
            templateLayer: 0,
            captureLiteral: false
        };
        const flushTable = () => {
            if (state.tableBuffer.length !== 0) {
                state.tokens.push({ type: "table", rows: [...state.tableBuffer] });
                state.tableBuffer = [];
            }
        };
        const flushBlockquote = () => {
            if (!state.inBlockquote) return;
            state.inBlockquote = false;
            if (state.blockquoteBuffer.length) {
                state.tokens.push({ type: "blockquote_group", content: [...state.blockquoteBuffer] });
                state.blockquoteBuffer.length = 0;
            }
        };
        for (let line of state.lines) {
            let matched = false;
            if (line.trim() === '') {
                flushTable();
                flushBlockquote();
                state.tokens.push({ type: "blank" });
                continue;
            }
            for (let rule of t.rules) {
                if (typeof rule.test === 'function' ? rule.test(line, state) : rule.test.test(line)) {
                    matched = true;
                    const result = rule.processor(line, state);
                    if (state.inTemplate) {
                        state.tokens.push({ type: 'literal', content: line });
                    } else if (state.inCodeBlock && result.type === 'code_block_end') {
                        state.tokens.push({ type: 'literal', content: line });
                    } else if (state.inCodeBlock && result.type !== 'code_block_start') {
                        state.tokens.push({ type: 'code_line', content: line });
                    } else if (result) {
                        if (result.type !== 'table') {
                            flushTable();
                        }
                        if (result.type === "blockquote") {
                            state.blockquoteBuffer.push(result.content);
                            continue;
                        }
                        flushBlockquote();
                        state.tokens.push(result);
                    }
                    break;
                }
            }
            if (matched) continue;
            if (state.inTemplate || state.inCodeBlock) {
                state.tokens.push({ type: 'literal', content: line });
                continue;
            }
            if (state.inBlockquote) {
                flushBlockquote();
                state.inBlockquote = false;
            }
            flushTable();
            state.tokens.push({ type: "paragraph", content: line.trim() });
        }
        flushTable();
        flushBlockquote();
        return state.tokens;
    }
    render(tokens) {
        const t = this;
        let html = "";
        const stack = [];
        const commands = {
            stack: stack,
            closeListsAbove: level => {
                while (stack.length && stack[stack.length - 1].indent >= level) {
                    html += `</${stack.pop().tag}>\n`;
                }
            },
            escapeCode: t.escapeCode,
            escapeHtml: t.escapeHtml,
            parse: t.parse,
            renderInline: t.renderInline
        }
        for (const token of tokens) {
            if (['ol-item', 'ul-item'].indexOf(token.type) === -1 && stack.length > 0) {
                commands.closeListsAbove(0);
            }
            const render = t.renderers[token.type];
            if (typeof render !== 'function') {
                console.error('MarkdownParser error: Undefined token type %s', token.type, render, t.renderers);
                continue;
            }
            html = render(html, token, commands);
        }
        commands.closeListsAbove(0);
        return html;
    }
    trimLinePreTabs(html, tabLength = 4) {
        let lines = [], ls = 0;
        let tabRepl = webui.repeat(' ', tabLength);
        let startLines = html.replace(/\t/g, tabRepl).split('\n');
        let tabLen = 999;
        let index = 0;
        for (let line of startLines) {
            if (index++ == 0) continue;
            let m = line.match(/^([ ]*)/)[0].length;
            if (m === 0) return html;
            if (m < tabLen) {
                tabLen = m;
            }
        };
        if (tabLen === 999) {
            tabLen = 0;
        }
        if (tabLen === 0) return html;
        let rgx = new RegExp(`^[ ]{1,${tabLen}}`);
        for (let line of startLines) {
            lines.push(line.replace(rgx, ''));
        }
        return lines.join('\n');
    }
    renderInline(text) {
        return text
            .replace(/\\\*/g, '&ast;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/!\[(.*?)\]\((.*?) "(.*)"\)/g, '<img alt="$1" src="$2" title="$3" />')
            .replace(/\[(.*?)\]\((.*?) "(.*)"\)/g, '<a href="$2" title="$3">$1</a>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/:([a-zA-Z0-9_+-]+):/g, '<webui-emoji emoji="$1"></webui-emoji>');
    }
    escapeQuote(text) {
        return text.replace(/"/g, "&quot;");
    }
    escapeHtml(text) {
        return text
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
    escapeCode(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}
