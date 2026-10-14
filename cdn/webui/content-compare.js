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
                if (t._alignedOld && t._alignedNew) {
                    t._buildDisplayMap();
                }
            });
        },
        clear() {
            const t = this;
            t._alignedOld = [];
            t._alignedNew = [];
            t._diffTypes = [];
            t._displayMap = [];
            t._renderId++;
            t._scrollContainer.innerHTML = '';
        },
        setDiff(oldLines, newLines, changeType) {
            const t = this;
            t.clear();
            t._scrollContainer.className = `compare-container mode-${(changeType || 'compare').toLowerCase()}`;
            const a = oldLines || [];
            const b = newLines || [];
            let diffSequence = t._computeMyersDiff(a, b);
            t._alignedOld = [];
            t._alignedNew = [];
            t._diffTypes = [];
            let i = 0;
            while (i < diffSequence.length) {
                let diff = diffSequence[i];
                if (diff.type === 'equal') {
                    t._alignedOld.push(diff.oldItem);
                    t._alignedNew.push(diff.newItem);
                    t._diffTypes.push('equal');
                    i++;
                } else {
                    let deletes = [];
                    let inserts = [];
                    while (i < diffSequence.length && diffSequence[i].type !== 'equal') {
                        if (diffSequence[i].type === 'delete') deletes.push(diffSequence[i].oldItem);
                        if (diffSequence[i].type === 'insert') inserts.push(diffSequence[i].newItem);
                        i++;
                    }
                    const maxLen = Math.max(deletes.length, inserts.length);
                    for (let j = 0; j < maxLen; j++) {
                        let oldItem = deletes[j] || { isFiller: true };
                        let newItem = inserts[j] || { isFiller: true };
                        t._alignedOld.push(oldItem);
                        t._alignedNew.push(newItem);
                        if (deletes[j] && inserts[j]) {
                            t._diffTypes.push('replace');
                        } else if (deletes[j]) {
                            t._diffTypes.push('delete');
                        } else {
                            t._diffTypes.push('insert');
                        }
                    }
                }
            }
            t._buildDisplayMap();
        },
        _lineKey(item) {
            return (item && item.line != null) ? String(item.line).replace(/\r/g, '') : '';
        },
        _computeMyersDiff(a, b) {
            const t = this;
            const N = a.length, M = b.length;
            const ak = a.map(item => t._lineKey(item));
            const bk = b.map(item => t._lineKey(item));
            let start = 0;
            while (start < N && start < M && ak[start] === bk[start]) start++;
            let endA = N, endB = M;
            while (endA > start && endB > start && ak[endA - 1] === bk[endB - 1]) {
                endA--; endB--;
            }
            const result = [];
            for (let i = 0; i < start; i++) {
                result.push({ oldItem: a[i], newItem: b[i], type: 'equal' });
            }
            const script = t._myersEditScript(ak.slice(start, endA), bk.slice(start, endB));
            for (const op of script) {
                if (op.type === 'equal') {
                    result.push({ oldItem: a[start + op.ai], newItem: b[start + op.bi], type: 'equal' });
                } else if (op.type === 'delete') {
                    result.push({ oldItem: a[start + op.ai], newItem: null, type: 'delete' });
                } else {
                    result.push({ oldItem: null, newItem: b[start + op.bi], type: 'insert' });
                }
            }
            for (let i = 0; i < N - endA; i++) {
                result.push({ oldItem: a[endA + i], newItem: b[endB + i], type: 'equal' });
            }
            return result;
        },
        _myersEditScript(a, b) {
            const N = a.length, M = b.length;
            if (N === 0 && M === 0) return [];
            if (N === 0) return b.map((_, j) => ({ type: 'insert', bi: j }));
            if (M === 0) return a.map((_, i) => ({ type: 'delete', ai: i }));
            const max = N + M;
            const off = max + 1;
            const V = new Int32Array(2 * max + 3);
            const trace = [];
            for (let d = 0; d <= max; d++) {
                trace.push(V.slice(off - d - 1, off + d + 2));
                for (let k = -d; k <= d; k += 2) {
                    let x;
                    if (k === -d || (k !== d && V[off + k - 1] < V[off + k + 1])) {
                        x = V[off + k + 1];
                    } else {
                        x = V[off + k - 1] + 1;
                    }
                    let y = x - k;
                    while (x < N && y < M && a[x] === b[y]) { x++; y++; }
                    V[off + k] = x;
                    if (x >= N && y >= M) {
                        return this._backtrackMyers(trace, N, M, d);
                    }
                }
            }
            return [];
        },
        _backtrackMyers(trace, N, M, d) {
            let x = N;
            let y = M;
            const ops = [];
            for (let p = d; p > 0; p--) {
                const snap = trace[p];
                const at = (kk) => snap[kk + p + 1];
                const k = x - y;
                const prevK = (k === -p || (k !== p && at(k - 1) < at(k + 1))) ? k + 1 : k - 1;
                const prevX = at(prevK);
                const prevY = prevX - prevK;
                while (x > prevX && y > prevY) {
                    x--; y--;
                    ops.push({ type: 'equal', ai: x, bi: y });
                }
                if (x === prevX) {
                    y--;
                    ops.push({ type: 'insert', bi: y });
                } else {
                    x--;
                    ops.push({ type: 'delete', ai: x });
                }
            }
            while (x > 0 && y > 0) {
                x--; y--;
                ops.push({ type: 'equal', ai: x, bi: y });
            }
            return ops.reverse();
        },
        _buildDisplayMap() {
            const t = this;
            t._displayMap = [];
            const len = t._alignedOld.length;
            if (t._viewMode === 'full') {
                for (let i = 0; i < len; i++) {
                    t._displayMap.push(i);
                }
            } else {
                const contextLines = 3;
                let visibleSet = new Set();
                for (let i = 0; i < len; i++) {
                    if (t._diffTypes[i] !== 'equal') {
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
                        let oldEntry = t._alignedOld[mapVal];
                        let newEntry = t._alignedNew[mapVal];
                        let type = t._diffTypes[mapVal];
                        let oldClass = (type === 'delete' || type === 'replace') ? 'delete' : '';
                        let newClass = (type === 'insert' || type === 'replace') ? 'insert' : '';
                        htmlBuffer.push(`
                            <div class="diff-row">
                                ${t._buildCellHtml(oldEntry, oldClass)}
                                ${t._buildCellHtml(newEntry, newClass)}
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
        _buildCellHtml(entry, typeClass) {
            if (!entry || entry.isFiller) {
                return `<div class="diff-cell empty ${typeClass}"></div>`;
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
                <div class="diff-cell ${typeClass}" ${style}>
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
    min-width: 0;
    background-color: var(--theme-color, #1e1e1e);
}
.diff-cell.empty {
    background-color: transparent;
}
.diff-cell.delete {
    background-color: rgba(248, 81, 73, 0.15);
}
.diff-cell.insert {
    background-color: rgba(46, 160, 67, 0.15);
}
.diff-cell.delete.empty {
    background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(248, 81, 73, 0.05) 10px, rgba(248, 81, 73, 0.05) 20px);
}
.diff-cell.insert.empty {
    background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(46, 160, 67, 0.05) 10px, rgba(46, 160, 67, 0.05) 20px);
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
.diff-cell.delete .num { color: #ff7b72; border-right-color: #ff7b72; }
.diff-cell.insert .num { color: #7ee787; border-right-color: #7ee787; }
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
