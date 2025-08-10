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
        },
        'no_paragraph': (html, token, commands) => {
            return `${html}${commands.renderInline(token.content)}\n`;
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
    insertRule(index, test, processor, render) {
        this.rules.splice(index, 0, { test, processor });
        this.renderers[type] = render;
    }
    initDefaultRules() {
        const t = this;
        const makeListRenderer = (listTag) => (html, token, commands) => {
            const last = commands.stack[commands.stack.length - 1];
            if (!last || token.indent < last.indent || last.tag !== listTag) {
                html = commands.closeListsAbove(html, token.indent);
            }
            const top = commands.stack[commands.stack.length - 1];
            if (!top || top.tag !== listTag || top.indent < token.indent) {
                html += `<${listTag}>`;
                commands.stack.push({ tag: listTag, indent: token.indent });
            }
            if (token.check) {
                return html + `<li class="${token.check}">${commands.renderInline(token.content)}</li>\n`;
            }
            return html + `<li>${commands.renderInline(token.content)}</li>\n`;
        };
        t.addRule('line-break', (line, state) => {
            return /^[\s]*---.*/.test(line) && state.tableBuffer.length === 0;
        }, (line, state) => {
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
        t.addRule('ul_item', /^[\s]*[\-\*]{1} /, (line, state) => {
            const indent = line.match(/^\s*/)[0].length;
            let [, check] = line.match(/^\s*[\-\*]{1} ?(\[( |x)?\])?/);
            if (check !== undefined) {
                check = check === '[x]' ? 'checked' : 'unchecked';
            }
            return { type: "ul_item", content: line.replace(/^\s*[\-\*]{1}( \[( |x)?\])?/, '').trim(), indent, check };
        }, makeListRenderer('ul'));
        t.addRule('ol_item', /^[\s]*\d+\. /, (line, state) => {
            const indent = line.match(/^\s*/)[0].length;
            return { type: "ol_item", content: line.replace(/^\s*\d+\.\s+/, "").trim(), indent };
        }, makeListRenderer('ol'));
        t.addRule('blockquote_group', /^[\s]*> ?/, (line, state) => {
            line = line.trim();
            if (state.inCodeBlock || state.inTemplate) return { type: 'literal', content: line };
            let [, , , theme, cite, content] = line.match(/^[\s]*(>| )*(\[([a-z]+)?\:?([A-Za-z-_ ]+)?\])?(.*)/);
            theme = theme?.replace(/(\[|\])/g, '') || 'info';
            state.inBlockquote = true;
            return { type: "blockquote", content: line.replace(/^> ?(\[([a-z]+)?:?([A-Za-z-_ ]+)?\])? ?/, ""), theme, cite };
        }, (html, token, commands) => {
            let theme = token.theme || 'info';
            let cite = token.cite || '';
            return `${html}<webui-quote theme="${theme}" cite="${cite}">` + t.parse(token.content.join('\n')) + `</webui-quote>\n`;
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
            let [, tag, lang, , label] = line.match(/^([`]+)([^:\|;]*)(:|\||;)?(.*)/);
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
                return { type: "code_block_start", lang, label };
            }
        }, (html, token, commands) => {
            if (token.label) {
                return `${html}<webui-code lang="${token.lang}" label="${token.label}">`;
            }
            return `${html}<webui-code lang="${token.lang}">`;
        });
        t.addRule('code_block_end', /^[\s]*```/, (line, state) => {
            webui.log.warn('Unexpected use of code_block_end');
        }, (html, token, commands) => {
            return `${html}</webui-code>\n`;
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
            const rows = token.rows.map(r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split("|").map(c => c.trim()));
            const head = rows[0];
            const alignments = (rows[1] || []).map(cell => {
                const trimmed = cell.trim();
                if (/^:-+:$/.test(trimmed)) return 'center';
                if (/^-+:$/.test(trimmed)) return 'right';
                if (/^:-+$/.test(trimmed)) return 'justify';
                return 'justify';
            });
            const body = rows.slice(2);
            html += `<table class="bordered" theme="info"><thead><tr>` + head.map((h, i) => {
                const align = alignments[i];
                const cls = align ? ` class="text-${align}"` : '';
                return `<th${cls}>${commands.renderInline(h)}</th>`;
            }).join('') + "</tr></thead><tbody>";
            for (const row of body) {
                html += "<tr>" + row.map((c, i) => {
                    const align = alignments[i];
                    const cls = align ? ` class="text-${align}"` : '';
                    return `<td${cls}>${commands.renderInline(c)}</td>`;
                }).join('') + "</tr>";
            }
            return `${html}</tbody></table>\n`;
        });
    }
    parse(text, noParagraph) {
        if (text === undefined || text === null || text === '') return '';
        const t = this;
        if (t.cache[text]) return t.cache[text];
        const tokens = t.tokenize(t.trimLinePreTabs(text), noParagraph);
        let html = t.render(tokens);
        t.cache[text] = html;
        return html;
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
                state.tokens.push({
                    type: "blockquote_group",
                    content: [...state.blockquoteBuffer.map(b => b.content)],
                    theme: state.blockquoteBuffer[0].theme,
                    cite: state.blockquoteBuffer[0].cite
                });
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
            if (state.inTemplate || state.inCodeBlock) {
                state.tokens.push({ type: 'literal', content: line });
                continue;
            }
            if (state.inBlockquote) {
                flushBlockquote();
                state.inBlockquote = false;
            }
            flushTable();
            const type = noParagraph ? 'no_paragraph' : 'paragraph';
            state.tokens.push({ type, content: line.trim() });
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
            closeListsAbove: (html, level) => {
                while (stack.length && stack[stack.length - 1].indent > level) {
                    const tag = stack.pop().tag;
                    html += `</${tag}>\n`;
                }
                return html;
            },
            escapeCode: t.escapeCode,
            escapeHtml: t.escapeHtml,
            parse: t.parse,
            renderInline: t.renderInline
        }
        for (const token of tokens) {
            if (['ol_item', 'ul_item'].indexOf(token.type) === -1 && stack.length > 0) {
                html = commands.closeListsAbove(html, -1);
            }
            const render = t.renderers[token.type];
            if (typeof render !== 'function') {
                continue;
            }
            html = render(html, token, commands);
        }
        html = commands.closeListsAbove(html, -1);
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
        const t = this;
        const codeSpans = [];
        text = text.replace(/`([^`]+)`/g, (_, code) => {
            const token = `^^CODE${codeSpans.length}^^`;
            const [, , theme, refined] = code.match(/^(([a-z]+):)?(.*)/);
            if (theme) {
                codeSpans.push(`<code theme="${theme}">${t.escapeCode(refined)}</code>`);
            } else {
                codeSpans.push(`<code>${t.escapeCode(code)}</code>`);
            }
            return token;
        });
        const emojis = [];
        text = text.replace(/:([a-zA-Z0-9_+-]+):/g, (_, emoji) => {
            const token = `^^EMOJI${emojis.length}^^`;
            emojis.push(`<webui-emoji emoji="${emoji}"></webui-emoji>`);
            return token;
        });
        text = text
            .replace(/!\[(.*?)\]\((.*?) "(.*?)"\)/g, '<img alt="$1" src="$2" title="$3" />')
            .replace(/\[(.*?)\]\((.*?) "(.*?)"\)/g, '<a href="$2" title="$3">$1</a>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        text = text.replace(/\\\*/g, '&ast;');
        text = text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            .replace(/\*(?!\s)(.+?)(?!\s)\*/g, '<em>$1</em>')
            .replace(/_(?!\s)(.+?)(?!\s)_/g, '<em>$1</em>');

        codeSpans.forEach((val, i) => {
            text = text.replace(`^^CODE${i}^^`, val);
        });
        emojis.forEach((val, i) => {
            text = text.replace(`^^EMOJI${i}^^`, val);
        });
        return text;
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
