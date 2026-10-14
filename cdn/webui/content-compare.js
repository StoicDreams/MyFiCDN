"use strict"
{
    webui.define("webui-content-compare", {
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        constructor() {
            const t = this;
            t._scrollContainer = t.template.querySelector('.compare-container');
            t._toggle = t.template.querySelector('.toggle-mode');
            t._viewMode = 'changes'; // changes|full
            t._renderId = 0;
            t._toggle.addEventListener('change', (e) => {
                t._viewMode = e.target.checked ? 'full' : 'changes';
                t._scrollContainer.scrollTop = 0;
                if (t._oldLinesOriginal) {
                    t._buildDisplayMap();
                }
            });
        },
        clear() {
            const t = this;
            t._oldLinesOriginal = [];
            t._newLinesOriginal = [];
            t._displayMap = [];
            t._renderId++;
            t._scrollContainer.innerHTML = '';
        },
        setDiff(oldLines, newLines, changeType) {
            const t = this;
            t._scrollContainer.className = `compare-container mode-${(changeType || 'compare').toLowerCase()}`;
            t._oldLinesOriginal = oldLines || [];
            t._newLinesOriginal = newLines || [];
            t._buildDisplayMap();
        },
        _isChange(oldEntry, newEntry) {
            if (!oldEntry && !newEntry) return false;
            if (!oldEntry || !newEntry) return true;
            if (oldEntry.isFiller || newEntry.isFiller) return true;
            if (oldEntry.background || newEntry.background) return true;
            if (oldEntry.color || newEntry.color) return true;
            return false;
        },
        _buildDisplayMap() {
            const t = this;
            t._displayMap = [];
            const len = Math.max(t._oldLinesOriginal.length, t._newLinesOriginal.length);
            if (t._viewMode === 'full') {
                for (let i = 0; i < len; i++) {
                    t._displayMap.push(i);
                }
            } else {
                const contextLines = 3;
                let visibleSet = new Set();
                for (let i = 0; i < len; i++) {
                    if (t._isChange(t._oldLinesOriginal[i], t._newLinesOriginal[i])) {
                        for (let j = Math.max(0, i - contextLines); j <= Math.min(len - 1, i + contextLines); j++) {
                            visibleSet.add(j);
                        }
                    }
                }
                let sortedVisible = Array.from(visibleSet).sort((a,b) => a - b);
                let lastIdx = -1;
                for (let idx of sortedVisible) {
                    if (lastIdx !== -1 && idx > lastIdx + 1) {
                        t._displayMap.push('gap');
                    }
                    t._displayMap.push(idx);
                    lastIdx = idx;
                }
            }
            t._renderChunked();
        },
        _renderChunked() {
            const t = this;
            t._scrollContainer.innerHTML = '';
            t._renderId++;
            const currentRenderId = t._renderId;
            let i = 0;
            const CHUNK_SIZE = 150;
            function renderNextChunk() {
                if (t._renderId !== currentRenderId) return;
                if (i >= t._displayMap.length) return;
                let htmlBuffer = [];
                let end = Math.min(i + CHUNK_SIZE, t._displayMap.length);
                for (let j = i; j < end; j++) {
                    let mapVal = t._displayMap[j];
                    if (mapVal === 'gap') {
                        htmlBuffer.push(`<div class="diff-row"><div class="diff-cell gap"><span>...</span></div></div>`);
                    } else {
                        let oldEntry = t._oldLinesOriginal[mapVal];
                        let newEntry = t._newLinesOriginal[mapVal];
                        htmlBuffer.push(`
                            <div class="diff-row">
                                ${t._buildCellHtml(oldEntry)}
                                ${t._buildCellHtml(newEntry)}
                            </div>
                        `);
                    }
                }
                t._scrollContainer.insertAdjacentHTML('beforeend', htmlBuffer.join(''));
                i = end;
                if (i < t._displayMap.length) {
                    window.requestAnimationFrame(renderNextChunk);
                }
            }
            window.requestAnimationFrame(renderNextChunk);
        },
        _buildCellHtml(entry) {
            if (!entry || entry.isFiller) {
                return `<div class="diff-cell empty"></div>`;
            }
            let bg = entry.background ? (entry.background.startsWith('--') ? `var(${entry.background})` : entry.background) : '';
            let fg = entry.color ? (entry.color.startsWith('--') ? `var(${entry.color})` : entry.color) : '';
            let style = '';
            if (bg) style += `background-color: ${bg}; `;
            if (fg) style += `color: ${fg};`;
            style = style ? `style="${style}"` : '';
            let num = entry.lineNumber || '';
            let text = (entry.line || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `
                <div class="diff-cell" ${style}>
                    <div class="line">
                        <span class="num">${num}</span>
                        <span class="txt">${text}</span>
                    </div>
                </div>
            `;
        },
        shadowTemplate: `
<style type="text/css">
:host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 3em;
    background-color: var(--theme-color, #1e1e1e);
    color: var(--theme-color-offset, #ccc);
    font-family: monospace;
    font-size: 14px;
}
.toolbar {
    padding: 8px 16px;
    background-color: #252525;
    border-bottom: 1px solid #444;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.toggle-label {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: sans-serif;
    font-size: 13px;
    color: #ccc;
    user-select: none;
}
.compare-container {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background-color: #333;
    contain: strict;
}
.diff-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    width: 100%;
    content-visibility: auto;
    contain-intrinsic-size: 24px;
}
.mode-add .diff-row { grid-template-columns: 0fr 1fr; }
.mode-delete .diff-row { grid-template-columns: 1fr 0fr; }
.diff-cell {
    display: flex;
    min-width: 0; /* Allows 0fr grid columns to properly hide */
    background-color: var(--theme-color, #1e1e1e);
}
.diff-cell.empty {
    background-color: transparent;
}
.diff-cell.gap {
    grid-column: 1 / -1;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.02);
    color: #858585;
    font-weight: bold;
    letter-spacing: 2px;
    padding: 4px 0;
}
.line {
    display: flex;
    width: 100%;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
    padding: 2px 0;
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
    flex-grow: 1;
}
</style>
<div class="toolbar">
    <label class="toggle-label">
        <input type="checkbox" class="toggle-mode" />
        Show Full File
    </label>
</div>
<div class="compare-container mode-compare"></div>
`
    });
}
