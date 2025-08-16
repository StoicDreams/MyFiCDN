/*!
 * Web UI Code - https://webui.stoicdreams.com/components#webui-code
 * A component for displaying code snippets.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    function quotedSegment(rgx, text) {
        return text.replace(rgx, '<span class="quote">"</span><span class="string">$1</span><span class="quote">"</span>');
    }
    function openTag(rgx, text) {
        return text.replace(rgx, () => {
            return text.replace(rgx, '<span class="symbol">&lt;</span><span class="selector-tag">$1</span>$2');
        });
    }
    function closeTag(rgx, text) {
        return text.replace(rgx, '<span class="symbol">&lt;/</span><span class="selector-tag">$1</span><span class="symbol c1">&gt;</span>');
    }
    function attributeEquals(rgx, text) {
        return text.replace(rgx, '<span class="attribute">$1</span><span class="symbol">=</span>');
    }
    function attribute(rgx, text) {
        return text.replace(rgx, '<span class="attribute">$1</span>');
    }
    function highlightHtmlTagDef(rgx, text) {
        return text.replace(rgx, (_, tag, tagdef) => {
            return `<span class="symbol">&lt;</span><span class="selector-tag">${tag}</span>${highlightCode(tagdef, 'htmltagdef')}<span class="symbol c2">&gt;</span>`;
        });
    }
    const jsPatterns = [
        { regex: /(".*?"|'.*?'|`.*?`)/g, class: 'string' },
        { regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g, class: 'comment' },
        { regex: /\b(const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|class|extends|super|import|export|await|async|of|console)\b/g, class: 'keyword' },
        { regex: /\b(\d+(\.\d+)?)\b/g, class: 'number' },
        { regex: /(=&gt;|&gt;|&lt;|&amp;)/g, class: 'symbol' },
        { regex: /[\+\-\*\/=><!&|\(\)\{\}\[\]\.]/g, class: 'operator' }
    ];
    const cssPatterns = [
        { regex: /(\/\*[\s\S]*?\*\/)/g, class: 'comment' },
        { regex: /(".*?"|'.*?')/g, class: 'string' },
        { regex: /\b(color|font-family|font-size|background-color|padding|margin|border|box-shadow|display|width|height)\b/g, class: 'property' },
        { regex: /\b(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|\b[a-zA-Z]+)/g, class: 'selector-tag' },
        { regex: /\b(\d+(\.\d+)?(px|em|rem|%|vh|vw|ch)?)\b/g, class: 'number' },
    ];
    const languages = {
        javascript: { patterns: jsPatterns },
        typescript: {
            patterns: [
                { regex: /\b(interface|type|public|private|protected|readonly|export)\b/g, class: 'keyword' },
                ...jsPatterns
            ]
        },
        python: {
            patterns: [
                { regex: /(".*?"|'.*?')/g, class: 'string' },
                { regex: /(#.*)/g, class: 'comment' },
                { regex: /\b(def|class|if|elif|else|for|in|while|return|import|as|from|with|try|except|finally|None|True|False)\b/g, class: 'keyword' },
                { regex: /\b(\d+(\.\d+)?)\b/g, class: 'number' },
                { regex: /[\+\-\*\/=><!&|\(\)\{\}\[\]\.]/g, class: 'operator' }
            ]
        },
        htmltagdef: {
            patterns: [
                { regex: /"([^"]*)"/g, class: quotedSegment },
                { regex: /([A-Za-z0-9-]+)=/g, class: attributeEquals },
                { regex: /([A-Za-z0-9-]+)/g, class: attribute },
            ]
        },
        html: {
            patterns: [
                { regex: /(&lt;!--[\s\S]*?--&gt;)/g, class: 'comment' },
                { regex: /&lt;(!?[A-Za-z0-9-]+)( ?\/?&gt;)/g, class: openTag },
                { regex: /&lt;(!?[A-Za-z0-9-]+)([A-Za-z0-9-_=\" \:\;\.\,\!\?\|\\\/\#\+\*\@\$\%\^\(\)\{\}\[\]]+)(\/?&gt;)/g, class: highlightHtmlTagDef },
                { regex: /&lt;\/([a-zA-Z0-9-]+)&gt;/g, class: closeTag },
                { regex: /(&lt;\/?)/g, class: 'symbol' },
                { regex: /(\/?&gt;)/g, class: 'symbol' },
                { regex: /(".*?"|'.*?')/g, class: 'string' },
            ]
        },
        css: {
            patterns: cssPatterns
        },
        rust: {
            patterns: [
                { regex: /(".*?")/g, class: 'string' },
                { regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g, class: 'comment' },
                { regex: /\b(fn|let|mut|if|else|for|in|return|mod|use|pub|crate|enum|struct|match)\b/g, class: 'keyword' },
                { regex: /\b(\d+(\.\d+)?)\b/g, class: 'number' },
                { regex: /[:;,\+\-\*\/=><!&|\(\)\{\}\[\]\.]/g, class: 'operator' }
            ]
        },
        csharp: {
            patterns: [
                { regex: /(".*?")/g, class: 'string' },
                { regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g, class: 'comment' },
                { regex: /\b(public|class|static|void|string|int|for|if|else|return|using|namespace|new|this|Console|System)\b/g, class: 'keyword' },
                { regex: /\b(\d+(\.\d+)?)\b/g, class: 'number' },
                { regex: /[\+\-\*\/=><!&|\(\)\{\}\[\]\.]/g, class: 'operator' }
            ]
        },
        markdown: {
            patterns: [
                { regex: /(`[^`]+`)/g, class: 'string' },
                { regex: /(```[\s\S]*?```)/g, class: 'comment' },
                { regex: /(^#+.*)/g, class: 'heading' },
                { regex: /\*\*([^\*]+)\*\*/g, class: 'markdown-bold' },
                { regex: /\*([^\*]+)\*/g, class: 'markdown-italic' },
                { regex: /(\[.*?\]\s*\([^\)]+\))/g, class: 'link' }
            ]
        },
        default: {
            patterns: [
                { regex: /(".*?"|'.*?')/g, class: 'string' },
                { regex: /(\/\/.*|#.*|--.*|\/\*[\s\S]*?\*\/)/g, class: 'comment' },
                { regex: /\b(\d+(\.\d+)?)\b/g, class: 'number' },
            ]
        }
    };

    /**
     * Applies syntax highlighting to a given code string based on language-specific rules.
     * The function iterates and builds the highlighted string, avoiding nested replacements.
     * @param {string} codeString The raw code text to highlight.
     * @param {string} languageName The name of the language to use for highlighting.
     * @returns {string} The HTML string with syntax highlighting applied.
     */
    function highlightCode(safeCode, languageName) {
        const langRules = languages[languageName] || languages.default;
        let result = '';
        let lastIndex = 0;
        let patterns = langRules.patterns;
        while (lastIndex < safeCode.length) {
            let bestMatch = null;
            let bestPattern = null;
            for (const pattern of patterns) {
                pattern.regex.lastIndex = lastIndex;
                let match = pattern.regex.exec(safeCode);
                if (match && match.index === lastIndex) {
                    if (!bestMatch || match[0].length > bestMatch[0].length) {
                        bestMatch = match;
                        bestPattern = pattern;
                    }
                }
            }
            if (bestMatch) {
                if (typeof bestPattern.class === 'function') {
                    result += bestPattern.class(bestPattern.regex, bestMatch[0]);
                } else {
                    result += `<span class="${bestPattern.class}">${bestMatch[0]}</span>`;
                }
                lastIndex = bestMatch.index + bestMatch[0].length;
            } else {
                result += safeCode[lastIndex];
                lastIndex++;
            }
        }

        return result;
    }
    const template = `
<label class="d-flex align-center"><span></span><webui-icon icon="copy" shade="tri" shape="circle" fill title="Copy Code" style="height:1rem"></webui-icon></label>
<pre>
<code></code>
</pre>`;
    webui.define('webui-code', {
        preload: 'icon',
        constructor: (t) => {
            let code = t.innerHTML;
            t.innerHTML = '';
            t._template = webui.create('div', { html: template });
            t._label = t._template.querySelector('label > span');
            t._copy = t._template.querySelector('label > webui-icon');
            t._pre = t._template.querySelector('pre');
            t._code = t._template.querySelector('code');
            t._copy.addEventListener('click', async ev => {
                ev.stopPropagation();
                ev.preventDefault();
                webui.copyToClipboard(t.value);
                return false;
            });
            t._code.innerHTML = highlightCode(webui.trimLinePreTabs(code.trim()), t.lang || t.language || t.getAttribute('lang') || t.getAttribute('language'));
        },
        attr: ['language', 'lang', 'label', 'lines', 'nocopy', 'src'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'label':
                    t._label.innerHTML = value;
                    t.applyLabelDisplay();
                    break;
                case 'language':
                case 'lang':
                    webui.removeClass(t._code, 'language-');
                    t._pre.removeAttribute('languagetag');
                    if (!value) return;
                    t._pre.setAttribute('languagetag', value);
                    t._code.classList.add(`language-${webui.toSnake(value.replace(/[ ]+/g, '-'), '-')}`);
                    break;
                case 'lines':
                    t._code.style.height = `calc((${value} * var(--line-height)) + (2 * var(--padding)))`;
                    t._code.style.maxHeight = `calc((${value} * var(--line-height)) + (2 * var(--padding)))`;
                    break;
                case 'nocopy':
                    if (value === null || value === 'undefined') {
                        t._copy.style.display = '';
                    } else {
                        t._copy.style.display = 'none';
                    }
                    t.applyLabelDisplay();
                    break;
                case 'src':
                    t.loadFromSrc();
                    break;
            }
        },
        loadFromSrc: function () {
            const t = this;
            let src = t.src;
            if (!src) return;
            webui.fetchWithCache(src, false).then(content => {
                t.setValue(content);
            }).catch(ex => {
                t.setValue(`Failed to load file ${src}: ${ex}`);
            });
        },
        props: {
            'value': {
                get() { return webui.getDefined(this._code.innerText, ''); },
                set(v) { this.setValue(v); }
            }
        },
        setValue: function (value) {
            const t = this;
            if (value === undefined) {
                value = '';
            }
            if (typeof value !== 'string') {
                value = JSON.stringify(value, null, 2);
            }
            value = webui.escapeCode(value);
            t._code.innerHTML = highlightCode(webui.trimLinePreTabs(value.trim()), t.lang || t.language || t.getAttribute('lang') || t.getAttribute('language'));
        },
        applyLabelDisplay: function () {
            const t = this;
            if (t._label.innerHTML || !t.nocopy) {
                t.classList.remove('hide-label');
            } else {
                t.classList.add('hide-label');
            }
        },
        connected: (t) => {
            while (t._template.childNodes.length > 0) {
                t.appendChild(t._template.childNodes[0]);
            }
        }
    });
}