"use strict"
{
    const emojiSource = webui.getData('appName') === 'MyFi CDN' ? '/i/emojis.json/' : 'https://cdn.myfi.ws/i/emojis.json';
    webui.define("webui-emoji-search", {
        linkCss: false,
        preload: 'input-range grid input-text',
        constructor: (t) => {
            t._search = t.template.querySelector('[label="Search"]');
            t._size = t.template.querySelector('[label="Size"]');
            t._grid = t.template.querySelector('.grid');
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
        connected: function (t) {
            webui.fetchWithCache(emojiSource, true).then(emojis=>{
                t.emojis = emojis;
                t.render();
            });
            t._search.addEventListener('input', _=>{
                t._filter = t._search.value.trim();
                t.render();
            });
            t._size.addEventListener('change', _=>{
                t.style.setProperty('--font-size', `${t._size.value}em`);
            });
            setTimeout(()=>{
                t._size.value = '2';
            },100);
        },
        render: function() {
            const t = this;
            if (!t.emojis) { return; }
            t._grid.innerText = '';
            Object.keys(t.emojis).forEach(key=>{
                if (t._filter && key.indexOf(t._filter.toLowerCase()) === -1) return;
                const code = `:${key}:`;
                let el=webui.create('a', {title:code, html:t.emojis[key]});
                t._grid.appendChild(el);
                el.addEventListener('click', ev=>{
                    ev.stopPropagation();
                    ev.preventDefault();
                    webui.copyToClipboard(code);
                })
            });
        },
        shadowTemplate: `
<webui-flex gap="10">
<webui-input-text label="Search"></webui-input-text>
<webui-input-range label="Size" min="1" max="5" step="0.5"></webui-input-range>
</webui-flex>
<webui-flex wrap gap="20" justify="center" class="pa-1 grid" theme="inherit"></webui-flex>
<style type="text/css">
:host {
display:block;
overflow:auto;
overflow-x:hidden;
}
a {
display:block;
font-size:var(--font-size);
ratio:1;
width:var(--font-size);
cursor:pointer;
}
webui-flex {
width:100%;
}
</style>
<slot></slot>
<slot name="something"></slot>
`
    });
}
