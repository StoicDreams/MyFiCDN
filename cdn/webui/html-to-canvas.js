"use strict"
{
    webui.define("webui-html-to-canvas", {
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor: (t) => {
            t._canvas = t.template.querySelector('canvas');
            t._ctx = t._canvas.getContext('2d');
            t._textLines = [];
            t._lineHeight = 20;
            t._scrollTop = 0;
            t._visibleLines = 0;
            t._contentHeight = 0;
        },
        attr: ['height','max-height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        setHTML: function(html){
            const t=this;
            const div = webui.create('div');
            div.innerHTML = html;
            let text = div.textContent || div.innerText || '';
            if (text === t._textLines) return;
            t._textLines = text.split(/\r?\n/);
        },
        render: function() {
            const t=this;
            t.wrapAllLines();
            t._contentHeight = t._wrappedLines.length * t._lineHeight;
            t.updateCanvas();
        },
        wrapAllLines() {
            const t = this;
            t._ctx.font = t._font;
            const maxWidth = t._canvas.width - 20;
            t._wrappedLines = [];
            for (let line of t._textLines) {
                let words = line.split(/\s+/);
                let currentLine = '';
                for (let word of words) {
                    const testLine = currentLine + word + ' ';
                    const metrics = t._ctx.measureText(testLine);
                    if (metrics.width > maxWidth && currentLine !== '') {
                        t._wrappedLines.push(currentLine.trim());
                        currentLine = word + ' ';
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) {
                    t._wrappedLines.push(currentLine.trim());
                }
            }
        },
        updateCanvas: function() {
            const t = this;
            t._font = getComputedStyle(t).font;
            const height = t._canvas.height;
            const width = t._canvas.width;
            t._ctx.clearRect(0, 0, width, height);
            const startLine = Math.floor(t._scrollTop / t._lineHeight);
            const endLine = Math.min(startLine + t._visibleLines, t._wrappedLines.length);
            t._ctx.fillStyle = '#24292e';
            t._ctx.font = t._font;
            for (let i = startLine; i < endLine; i++) {
                const y = (i - startLine) * t._lineHeight + t._lineHeight;
                t._ctx.fillText(t._wrappedLines[i], 10, y);
            }
            if (t._contentHeight > height) {
                const scrollbarHeight = Math.max((height / t._contentHeight) * height, 20);
                const scrollbarY = (t._scrollTop / t._contentHeight) * height;
                t._ctx.fillStyle = '#c0c0c0';
                t._ctx.fillRect(width - 8, scrollbarY, 6, scrollbarHeight);
            }
        },
        onScroll: function(e) {
            let t=this;
            t._scrollTop = t.scrollTop;
            t.updateCanvas();
        },
        copyText: function() {
            let t=this;
            navigator.clipboard.writeText(t._textLines.join('\n'));
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