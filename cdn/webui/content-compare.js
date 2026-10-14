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
            t._rafId = null;
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
            if (t._rafId !== null) {
                window.cancelAnimationFrame(t._rafId);
                t._rafId = null;
            }
            t._scrollContainer.innerHTML = '';
        },
        setDiff(oldLines, newLines, changeType) {
            const t = this;
            const rawMode = (changeType || 'compare').toLowerCase();
            let mode = 'compare';
            if (rawMode === 'add' || rawMode === 'added' || rawMode === 'create' || rawMode === 'created' || rawMode === 'new') {
                mode = 'add';
            } else if (rawMode === 'delete' || rawMode === 'deleted' || rawMode === 'remove' || rawMode === 'removed') {
                mode = 'delete';
            }
            t._scrollContainer.className = `compare-container mode-${mode}`;
            t._scrollContainer.scrollTop = 0;
            const normalized = t._normalizeDiffLines(oldLines || [], newLines || []);
            t._oldLinesOriginal = normalized.oldLines;
            t._newLinesOriginal = normalized.newLines;
            t._buildDisplayMap();
        },
        _isFiller(entry) {
            if (!entry || entry.isFiller || entry.is_filler) return true;
            const hasLineNum = entry.lineNumber !== undefined && entry.lineNumber !== null && entry.lineNumber !== '' && entry.lineNumber > 0;
            const hasText = entry.line !== undefined && entry.line !== null && entry.line !== '';
            const hasStyle = Boolean(entry.background || entry.color);
            return !hasLineNum && !hasText && !hasStyle;
        },
        _hasHighlight(entry) {
            return Boolean(entry && !this._isFiller(entry) && (entry.background || entry.color));
        },
        _normalizeDiffLines(oldInput, newInput) {
            const t = this;
            const len = Math.max(oldInput.length, newInput.length);
            const oldLines = new Array(len);
            const newLines = new Array(len);
            for (let i = 0; i < len; i++) {
                oldLines[i] = t._isFiller(oldInput[i]) ? { isFiller: true } : { ...oldInput[i] };
                newLines[i] = t._isFiller(newInput[i]) ? { isFiller: true } : { ...newInput[i] };
            }
            const deduplicateSide = (primaryLines, oppositeLines) => {
                const byLineNumber = new Map();
                for (let i = 0; i < len; i++) {
                    const entry = primaryLines[i];
                    if (t._isFiller(entry)) continue;
                    const num = entry.lineNumber ?? entry.line_number;
                    if (num === undefined || num === null || num === '' || num <= 0) continue;
                    let group = byLineNumber.get(num);
                    if (!group) {
                        group = [];
                        byLineNumber.set(num, group);
                    }
                    group.push(i);
                }
                for (const indices of byLineNumber.values()) {
                    if (indices.length <= 1) continue;
                    let bestIdx = indices[0];
                    let bestRank = 4;
                    for (const idx of indices) {
                        const p = primaryLines[idx];
                        const o = oppositeLines[idx];
                        const pHighlighted = t._hasHighlight(p);
                        const oFiller = t._isFiller(o);
                        const oHighlighted = t._hasHighlight(o);
                        let rank = 4;
                        if (!pHighlighted && !oFiller && !oHighlighted && (p.line ?? '') === (o.line ?? '')) {
                            rank = 1;
                        } else if (pHighlighted && !oFiller) {
                            rank = 2;
                        } else if (pHighlighted && oFiller) {
                            rank = 3;
                        }
                        if (rank < bestRank) {
                            bestRank = rank;
                            bestIdx = idx;
                        }
                    }
                    for (const idx of indices) {
                        if (idx !== bestIdx) {
                            primaryLines[idx] = { isFiller: true };
                        }
                    }
                }
            };
            deduplicateSide(oldLines, newLines);
            deduplicateSide(newLines, oldLines);
            const filteredOld = [];
            const filteredNew = [];
            for (let i = 0; i < len; i++) {
                const oldIsFiller = t._isFiller(oldLines[i]);
                const newIsFiller = t._isFiller(newLines[i]);
                const wasOriginallyBothEmpty = t._isFiller(oldInput[i]) && t._isFiller(newInput[i]);
                if (oldIsFiller && newIsFiller && !wasOriginallyBothEmpty) {
                    continue;
                }
                filteredOld.push(oldLines[i]);
                filteredNew.push(newLines[i]);
            }
            return { oldLines: filteredOld, newLines: filteredNew };
        },
        _isChange(oldEntry, newEntry) {
            const t = this;
            const oldFiller = t._isFiller(oldEntry);
            const newFiller = t._isFiller(newEntry);
            if (oldFiller && newFiller) return false;
            if (oldFiller || newFiller) return true;
            if (oldEntry.background || newEntry.background) return true;
            if (oldEntry.color || newEntry.color) return true;
            if ((oldEntry.line ?? '') !== (newEntry.line ?? '')) return true;
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
                const visibleSet = new Set();
                for (let i = 0; i < len; i++) {
                    if (t._isChange(t._oldLinesOriginal[i], t._newLinesOriginal[i])) {
                        const start = Math.max(0, i - contextLines);
                        const end = Math.min(len - 1, i + contextLines);
                        for (let j = start; j <= end; j++) {
                            visibleSet.add(j);
                        }
                    }
                }
                const sortedVisible = Array.from(visibleSet).sort((a, b) => a - b);
                let lastIdx = -1;
                for (const idx of sortedVisible) {
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
            if (t._rafId !== null) {
                window.cancelAnimationFrame(t._rafId);
                t._rafId = null;
            }
            t._scrollContainer.innerHTML = '';
            t._renderId++;
            const currentRenderId = t._renderId;
            let i = 0;
            const CHUNK_SIZE = 150;
            function renderNextChunk() {
                if (t._renderId !== currentRenderId) return;
                if (i >= t._displayMap.length) {
                    t._rafId = null;
                    return;
                }
                const htmlBuffer = [];
                const end = Math.min(i + CHUNK_SIZE, t._displayMap.length);
                for (let j = i; j < end; j++) {
                    const mapVal = t._displayMap[j];
                    if (mapVal === 'gap') {
                        htmlBuffer.push(`<div class="diff-row"><div class="diff-cell gap"><span>...</span></div></div>`);
                    } else {
                        const oldEntry = t._oldLinesOriginal[mapVal];
                        const newEntry = t._newLinesOriginal[mapVal];
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
                    t._rafId = window.requestAnimationFrame(renderNextChunk);
                } else {
                    t._rafId = null;
                }
            }
            t._rafId = window.requestAnimationFrame(renderNextChunk);
        },
        _buildCellHtml(entry) {
            if (this._isFiller(entry)) {
                return `<div class="diff-cell empty"></div>`;
            }
            const bg = entry.background ? (entry.background.startsWith('--') ? `var(${entry.background})` : entry.background) : '';
            const fg = entry.color ? (entry.color.startsWith('--') ? `var(${entry.color})` : entry.color) : '';
            let style = '';
            if (bg) style += `background-color: ${bg}; `;
            if (fg) style += `color: ${fg};`;
            style = style ? `style="${style}"` : '';
            const num = entry.lineNumber ?? entry.line_number ?? '';
            const text = String(entry.line ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
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
    flex-shrink: 0;
    content-visibility: auto;
    contain-intrinsic-size: auto 24px;
}
.mode-add .diff-row,
.mode-delete .diff-row {
    grid-template-columns: 1fr;
}
.mode-add .diff-row > .diff-cell:first-child,
.mode-delete .diff-row > .diff-cell:last-child {
    display: none;
}
.diff-cell {
    display: flex;
    min-width: 0;
    overflow: hidden;
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
    min-width: 0;
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
