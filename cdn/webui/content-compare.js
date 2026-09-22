"use strict"
{
    webui.define("webui-content-compare", {
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        constructor() {
            const t = this;
            t._paneOld = t.template.querySelector('.pane-old');
            t._paneNew = t.template.querySelector('.pane-new');
            t._container = t.template.querySelector('.compare-container');
            let isSyncingLeft = false;
            let isSyncingRight = false;
            t._paneOld.addEventListener('scroll', () => {
                if (!isSyncingLeft) {
                    isSyncingRight = true;
                    t._paneNew.scrollTop = t._paneOld.scrollTop;
                    t._paneNew.scrollLeft = t._paneOld.scrollLeft;
                }
                isSyncingLeft = false;
            });
            t._paneNew.addEventListener('scroll', () => {
                if (!isSyncingRight) {
                    isSyncingLeft = true;
                    t._paneOld.scrollTop = t._paneNew.scrollTop;
                    t._paneOld.scrollLeft = t._paneNew.scrollLeft;
                }
                isSyncingRight = false;
            });
        },
        clear() {
            const t = this;
            t._paneOld.innerHTML = '';
            t._paneNew.innerHTML = '';
        },
        setDiff(oldLines, newLines, changeType) {
            const t = this;
            t._container.className = `compare-container mode-${(changeType || 'compare').toLowerCase()}`;
            t._paneOld.innerHTML = t._buildHtml(oldLines || []);
            t._paneNew.innerHTML = t._buildHtml(newLines || []);
        },
        _buildHtml(lines) {
            if (!lines || lines.length === 0) return '';
            let buffer = [];
            for (let i = 0; i < lines.length; i++) {
                let entry = lines[i];
                if (!entry) continue;
                let bg = entry.background ? (entry.background.startsWith('--') ? `var(${entry.background})` : entry.background) : '';
                let fg = entry.color ? (entry.color.startsWith('--') ? `var(${entry.color})` : entry.color) : '';
                let style = '';
                if (bg) style += `background-color: ${bg}; `;
                if (fg) style += `color: ${fg};`;
                style = style ? `style="${style}"` : '';
                let num = entry.isFiller ? '' : (entry.lineNumber || '');
                let text = (entry.line || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                buffer.push(`<div class="line" ${style}><span class="num">${num}</span><span class="txt">${text}</span></div>`);
            }
            return buffer.join('');
        },
        shadowTemplate: `
<style type="text/css">
:host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 3em;
    background-color: var(--theme-color, #1e1e1e);
    color: var(--theme-color-offset, #ccc);
    font-family: monospace;
    font-size: 14px;
}
.compare-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    width: 100%;
    height: 100%;
    background-color: #333;
}
/* Layout overrides based on git change status */
.compare-container.mode-add { grid-template-columns: 0fr 1fr; }
.compare-container.mode-delete { grid-template-columns: 1fr 0fr; }
.mode-add .pane-old, .mode-delete .pane-new { display: none; }
.pane {
    overflow: auto;
    background-color: var(--theme-color, #1e1e1e);
    height: 100%;
}
.line {
    display: flex;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
}
.line:hover {
    background-color: rgba(255, 255, 255, 0.05);
}
.num {
    display: inline-block;
    min-width: 45px;
    padding: 0 8px;
    text-align: right;
    color: #858585;
    user-select: none;
    border-right: 1px solid #444;
    margin-right: 8px;
    flex-shrink: 0;
}
.txt {
    display: inline-block;
}
</style>
<div class="compare-container mode-compare">
    <div class="pane pane-old"></div>
    <div class="pane pane-new"></div>
</div>
`
    });
}
