"use strict"
{
    webui.define("webui-canvas", {
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor: (t) => {
            t._canvas = t.template.querySelector('canvas');
            t._ctx = t._canvas.getContext('2d');
            t._textLines = [];
            t._lines = [];
            t._lineHeight = 20;
            t._scrollTop = 0;
            t._visibleLines = 0;
            t._contentHeight = 0;
        },
        flags: ['line-numbers'],
        attr: ['height','max-height', 'alt-color'],
        attrChanged: (t, property, value) => {
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
            t._lines = lines || [];
            t._lines.push({});
            t._textLines = lines.join('\n');
            t.wrapAllLines();
            t._contentHeight = t._wrappedLines.length * t._lineHeight;
            t.updateCanvas();
            t.setScroll(0);
        },
        setFromText: function(text) {
            const t=this;
            if (text === t._textLines) return;
            text = text || '';
            let lines = text.split(/\r?\n/).map(line=>{
                return {line:line};
            });
            t.setLines(lines);
        },
        setFromHTML: function(html){
            const t=this;
            const div = webui.create('div');
            div.innerHTML = html;
            let text = div.textContent || div.innerText || '';
            if (text === t._textLines) return;
            let lines = text.split(/\r?\n/).map(line=>{
                return {line:line};
            });
            t.setLines(lines);
        },
        render: function() {
            const t=this;
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
                    for (let i = 0; i < originalLine.length; i++) {
                        const testLine = currentLine + originalLine[i];
                        const metrics = t._ctx.measureText(testLine);
                        if (metrics.width > maxWidth && currentLine !== '') {
                            t._wrappedLines.push({ text: currentLine, ...lineObj });
                            currentLine = originalLine[i];
                        } else {
                            currentLine = testLine;
                        }
                    }
                    if (currentLine) {
                        t._wrappedLines.push({ text: currentLine, ...lineObj });
                    }
                } else {
                    t._wrappedLines.push({ text: currentLine, ...lineObj });
                }
            }
        },
        updateCanvas: function() {
            const t = this;
            if (!t._wrappedLines) return;
            const ctx = t._ctx;
            const height = t._canvas.height;
            const width = t._canvas.width;
            ctx.clearRect(0, 0, width, height);
            const startLine = Math.floor(t._scrollTop / t._lineHeight);
            const endLine = Math.min(startLine + t._visibleLines, t._wrappedLines.length);
            ctx.font = getComputedStyle(t).font;
            let digits = t._lines.length.toString().length;
            let padLeft = t.lineNumbers ? t._ctx.measureText(webui.repeat('0',digits)).width + 10 : 5;
            function correctColor(color) {
                if (!color) return color;
                if (color.startsWith('--')) {
                    return getComputedStyle(t).getPropertyValue(color);
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
                    useAlt = entry.lineNumber%2 == 1;
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
        getScroll: function() {
            const t=this;
            return t._scrollTop;
        },
        setScroll: function(value) {
            const t=this;
            t._scrollTop = value || 0;
            const maxScroll = Math.max(0, t._contentHeight - t._canvas.height);
            if (t._scrollTop < 0) t._scrollTop = 0;
            if (t._scrollTop > maxScroll) t._scrollTop = maxScroll;
            t.updateCanvas();
            if (t.dataset.trigger) {
                t.dispatchEvent(new Event('change', {bubbles:true}));
            }
        },
        copyText() {
            const t = this;
            const allText = t._lines.map(l => l.line || '').join('\n');
            navigator.clipboard.writeText(allText);
        },
        onWheel(e) {
            const t = this;
            e.preventDefault();
            let multi = e.shiftKey && e.ctrlKey ? 4 : e.ctrlKey ? 3 : e.shiftKey ? 2 : 0.2;
            t.setScroll(t._scrollTop + (e.deltaY * multi));
        },
        checkDimensions: function() {
            const t=this;
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
            setTimeout(()=>{t.checkDimensions();},100);
        },
        connected: function (t) {
            const resizeObserver = new ResizeObserver(() => {
                t.checkDimensions();
            });
            resizeObserver.observe(t);
            t._resizeObserver = resizeObserver;
            t.addEventListener('click',_=>{
                t.checkDimensions();
            });
            t._boundOnWheel = (e) => t.onWheel(e);
            t._canvas.addEventListener('wheel', t._boundOnWheel, { passive: false });
        },
        disconnected: function (t) {
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
<canvas></canvas>
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
}
</style>
`
    });
}