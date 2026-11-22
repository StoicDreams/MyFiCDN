/*!
 * Web UI Canvas - https://webui.stoicdreams.com/components#webui-canvas
 * A component for displaying a canvas element.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-canvas", {
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor() {
            const t = this;
            t._canvas = t.template.querySelector('canvas');
            // The text the canvas draws, kept out of sight for screen readers, which can't read a drawing.
            t._text = t.template.querySelector('pre.text');
            t._ctx = t._canvas.getContext('2d');
            // The keyboard scrolls it, as it would any scrolling box.
            t.addEventListener('keydown', ev => t.onKey(ev));
            // A finger drags it, as the wheel scrolls it.
            t._canvas.addEventListener('pointerdown', ev => {
                if (ev.pointerType === 'mouse') return;
                t._drag = { id: ev.pointerId, y: ev.clientY, top: t._scrollTop };
                // Keeps the drag when the finger leaves the canvas. A pointer the browser has already let go of can't be captured.
                try { t._canvas.setPointerCapture?.(ev.pointerId); } catch { }
            });
            t._canvas.addEventListener('pointermove', ev => {
                if (!t._drag || t._drag.id !== ev.pointerId) return;
                t.setScroll(t._drag.top + (t._drag.y - ev.clientY));
            });
            const endDrag = ev => { if (t._drag?.id === ev.pointerId) t._drag = null; };
            t._canvas.addEventListener('pointerup', endDrag);
            t._canvas.addEventListener('pointercancel', endDrag);
            t._textLines = [];
            t._lines = [];
            t._lineHeight = 20;
            t._scrollTop = 0;
            t._visibleLines = 0;
            t._contentHeight = 0;
        },
        flags: ['line-numbers'],
        attr: ['height', 'max-height', 'alt-color'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
            t.updateCanvas();
        },
        setLines(lines) {
            const t = this;
            t._lines = [...(lines || []), {}];
            t._textLines = (lines || []).map(l => l.line || '').join('\n');
            t._text.textContent = t._textLines;
            t.wrapAllLines();
            t._contentHeight = t._wrappedLines.length * t._lineHeight;
            t.updateCanvas();
            t.setScroll(0);
        },
        setFromText(text) {
            const t = this;
            if (text === t._textLines) return;
            text = text || '';
            let lines = text.split(/\r?\n/).map(line => {
                return { line: line };
            });
            t.setLines(lines);
        },
        setFromHTML(html) {
            const t = this;
            const div = webui.create('div');
            div.innerHTML = html;
            let text = div.textContent || div.innerText || '';
            if (text === t._textLines) return;
            let lines = text.split(/\r?\n/).map(line => {
                return { line: line };
            });
            t.setLines(lines);
        },
        render() {
            const t = this;
            t.wrapAllLines();
            t._contentHeight = t._wrappedLines.length * t._lineHeight;
            t.updateCanvas();
        },
        wrapAllLines() {
            const t = this;
            t._ctx.font = getComputedStyle(t).font;
            const maxWidth = t._canvas.width - 50;
            t._wrappedLines = [];
            let lineNumber = 0;
            for (let lineObj of t._lines) {
                if (!lineObj || lineObj.line === undefined) {
                    t._wrappedLines.push({ text: '', ...lineObj });
                    continue;
                }
                if (!lineObj.isFiller) {
                    lineObj.lineNumber = ++lineNumber;
                }
                let originalLine = lineObj.line;
                let currentLine = '';
                if (originalLine.length > 0) {
                    let remaining = originalLine;
                    while (t._ctx.measureText(remaining).width > maxWidth && remaining.length > 1) {
                        // Binary search for the longest prefix that fits, measuring far fewer strings than per character.
                        let low = 1, high = remaining.length - 1;
                        while (low < high) {
                            const mid = Math.ceil((low + high) / 2);
                            if (t._ctx.measureText(remaining.substring(0, mid)).width > maxWidth) {
                                high = mid - 1;
                            } else {
                                low = mid;
                            }
                        }
                        t._wrappedLines.push({ text: remaining.substring(0, low), ...lineObj });
                        remaining = remaining.substring(low);
                    }
                    t._wrappedLines.push({ text: remaining, ...lineObj });
                } else {
                    t._wrappedLines.push({ text: currentLine, ...lineObj });
                }
            }
        },
        updateCanvas() {
            const t = this;
            if (!t._wrappedLines) return;
            const ctx = t._ctx;
            const height = t._canvas.height;
            const width = t._canvas.width;
            ctx.clearRect(0, 0, width, height);
            const startLine = Math.floor(t._scrollTop / t._lineHeight);
            const endLine = Math.min(startLine + t._visibleLines, t._wrappedLines.length);
            const computedStyle = getComputedStyle(t);
            ctx.font = computedStyle.font;
            let digits = t._lines.length.toString().length;
            let padLeft = t.lineNumbers ? t._ctx.measureText(webui.repeat('0', digits)).width + 10 : 5;
            const resolvedColors = {};
            function correctColor(color) {
                if (!color) return color;
                if (color.startsWith('--')) {
                    if (resolvedColors[color] === undefined) {
                        resolvedColors[color] = computedStyle.getPropertyValue(color);
                    }
                    return resolvedColors[color];
                }
                return color;
            }
            let lastLineNumber = '';
            let useAlt = false;
            for (let i = startLine; i < endLine; i++) {
                const y = (i - startLine) * t._lineHeight + t._lineHeight;
                const entry = t._wrappedLines[i];
                const textColor = entry.isFiller ? '#00000000' : correctColor(entry.color || '--theme-color-offset');
                if (entry.lineNumber) {
                    useAlt = entry.lineNumber % 2 == 1;
                }
                const backgroundColor = correctColor(entry.background || (!entry.isFiller && useAlt ? t.altColor || '--theme-color' : '--theme-color'));
                const showLineNumber = t.lineNumbers && entry.text !== undefined && !entry.isFiller;

                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, y - t._lineHeight + 4, width, t._lineHeight);
                }

                if (showLineNumber && entry.lineNumber && lastLineNumber !== entry.lineNumber) {
                    lastLineNumber = entry.lineNumber;
                    ctx.fillStyle = textColor;
                    ctx.fillText(entry.lineNumber.toString().padStart(digits, '0'), 4, y);
                }

                ctx.fillStyle = textColor;
                ctx.fillText(entry.text || '', padLeft, y);
            }
            if (t._contentHeight > t._canvas.height) {
                const viewHeight = t._canvas.height;
                const contentHeight = t._contentHeight;
                const scrollbarHeight = Math.max((viewHeight / contentHeight) * viewHeight, 20);
                const scrollbarY = (t._scrollTop / contentHeight) * viewHeight;
                const scrollbarX = t._canvas.width - 14;

                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(scrollbarX, scrollbarY, 14, scrollbarHeight);
            }
        },
        getScroll() {
            const t = this;
            return t._scrollTop;
        },
        setScroll(value) {
            const t = this;
            t._scrollTop = value || 0;
            const maxScroll = Math.max(0, t._contentHeight - t._canvas.height);
            if (t._scrollTop < 0) t._scrollTop = 0;
            if (t._scrollTop > maxScroll) t._scrollTop = maxScroll;
            t.updateCanvas();
        },
        copyText() {
            const t = this;
            const allText = t._lines.map(l => l.line || '').join('\n');
            navigator.clipboard.writeText(allText);
        },
        /** Arrow keys scroll a line, Page Up and Page Down a screen, and Home and End to either end. */
        onKey(ev) {
            const t = this;
            if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
            const page = Math.max(t._lineHeight, t._canvas.height - t._lineHeight);
            const moves = {
                ArrowDown: t._lineHeight, ArrowUp: -t._lineHeight, PageDown: page, PageUp: -page,
                ' ': ev.shiftKey ? -page : page, Home: -Infinity, End: Infinity,
            };
            if (!(ev.key in moves)) return;
            ev.preventDefault();
            const move = moves[ev.key];
            t.setScroll(move === -Infinity ? 0 : move === Infinity ? t._contentHeight : t._scrollTop + move);
        },
        onWheel(e) {
            const t = this;
            e.preventDefault();
            let multi = e.shiftKey && e.ctrlKey ? 4 : e.ctrlKey ? 3 : e.shiftKey ? 2 : 0.2;
            t.setScroll(t._scrollTop + (e.deltaY * multi));
        },
        checkDimensions() {
            const t = this;
            const rect = t.getBoundingClientRect();
            let height = Math.floor(rect.height);
            let width = Math.floor(rect.width);
            if (t._canvas.width === width && t._canvas.height === height) return;
            t._canvas.width = width;
            t._canvas.height = height;
            t._visibleLines = Math.floor(height / t._lineHeight);
            t.wrapAllLines();
            t._contentHeight = t._wrappedLines.length * t._lineHeight;
            t.updateCanvas();
            setTimeout(() => { t.checkDimensions(); }, 100);
        },
        connected() {
            const t = this;
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0');
            t.addEventListener('click', _ => {
                t.checkDimensions();
            });
            t.startWatching();
        },
        reconnected() {
            this.startWatching();
        },
        startWatching() {
            const t = this;
            if (t._resizeObserver) return;
            const resizeObserver = new ResizeObserver(() => {
                t.checkDimensions();
            });
            resizeObserver.observe(t);
            t._resizeObserver = resizeObserver;
            t._boundOnWheel = (e) => t.onWheel(e);
            t._canvas.addEventListener('wheel', t._boundOnWheel, { passive: false });
        },
        disconnected() {
            const t = this;
            if (t._resizeObserver) {
                t._resizeObserver.disconnect();
                t._resizeObserver = null;
            }
            if (t._boundOnWheel) {
                t._canvas.removeEventListener('wheel', t._boundOnWheel);
                t._boundOnWheel = null;
            }
        },
        shadowTemplate: `
<canvas aria-hidden="true"></canvas>
<pre class="text"></pre>
<style type="text/css">
:host {
display: block;
overflow: auto;
width: 100%;
height: 100%;
font-family: inherit;
min-height:3em;
}
canvas {
display: block;
width: 100%;
height: 100%;
background-color: var(--theme-color);
cursor: text;
touch-action: none;
}
.text {
position:absolute;
width:1px;
height:1px;
margin:-1px;
padding:0;
overflow:hidden;
clip:rect(0 0 0 0);
white-space:pre;
border:0;
}
:host(:focus-visible) {
outline:var(--focus-outline);
outline-offset:var(--focus-offset);
}
</style>
`
    });
}
