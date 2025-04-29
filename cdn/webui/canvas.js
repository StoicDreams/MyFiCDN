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
        },
        setFromText: function(text) {
            const t=this;
            if (text === t._textLines) return;
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
            for (let lineObj of t._lines) {
                if (!lineObj || lineObj.line === undefined) {
                    t._wrappedLines.push({ lineObj });
                    continue;
                }
                let words = lineObj.line.split(/\s+/);
                let currentLine = '';
                for (let word of words) {
                    const testLine = currentLine + word + ' ';
                    const metrics = t._ctx.measureText(testLine);
                    if (metrics.width > maxWidth && currentLine !== '') {
                        t._wrappedLines.push({ text: currentLine.trim(), lineObj });
                        currentLine = word + ' ';
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) {
                    t._wrappedLines.push({ text: currentLine.trim(), lineObj });
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
            ctx.font = t._font;
            let digits = t._lines.length.toString().length;
            let padLeft = t.lineNumbers ? t._ctx.measureText(webui.repeat('0',digits)).width + 10 : 5;
            function correctColor(color) {
                if (!color) return color;
                if (color.startsWith('--')) {
                    return getComputedStyle(t).getPropertyValue(color);
                }
                return color;
            }
            for (let i = startLine; i < endLine; i++) {
                const y = (i - startLine) * t._lineHeight + t._lineHeight;
                const entry = t._wrappedLines[i];
                const style = entry.lineObj || {};
                const textColor = correctColor(style.color || '--theme-color-offset');
                const backgroundColor = correctColor(style.background || (i%2==1 ? t.altColor : '--theme-color'));
                const showLineNumber = t.lineNumbers && entry.text !== undefined;

                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, y - t._lineHeight + 4, width, t._lineHeight);
                }

                if (showLineNumber) {
                    ctx.fillStyle = textColor;
                    ctx.fillText((i + 1).toString().padStart(digits, '0'), 4, y);
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
        onScroll: function(e) {
            let t=this;
            t._scrollTop = t.scrollTop;
            t.updateCanvas();
        },
        copyText() {
            const t = this;
            const allText = t._lines.map(l => l.line || '').join('\n');
            navigator.clipboard.writeText(allText);
        },
        onWheel(e) {
            const t = this;
            e.preventDefault();
            t._scrollTop += (e.deltaY * 0.2);
            const maxScroll = Math.max(0, t._contentHeight - t._canvas.height);
            if (t._scrollTop < 0) t._scrollTop = 0;
            if (t._scrollTop > maxScroll) t._scrollTop = maxScroll;
            t.updateCanvas();
        },
        connected: function (t) {
            const resizeObserver = new ResizeObserver(() => {
                const rect = t.getBoundingClientRect();
                t._canvas.width = rect.width;
                t._canvas.height = rect.height;
                t._visibleLines = Math.floor(rect.height / t._lineHeight);
                t.wrapAllLines();
                t._contentHeight = t._wrappedLines.length * t._lineHeight;
                t.updateCanvas();
            });
            resizeObserver.observe(t);
            t._resizeObserver = resizeObserver;

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
background-color: #fafbfc;
cursor: text;
}
</style>
`
    });
}