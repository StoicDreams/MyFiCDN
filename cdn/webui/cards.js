/* Display a card component wrapper */
"use strict"
webui.define("webui-cards", {
    attr: ['elevation', 'card-width', 'src', 'theme'],
    buildContentFromSource: async function (t) {
        if (!t.src) return;
        let result = await fetch(t.src);
        if (!result.ok) return;
        let cards = await result.json();
        t.innerHTML = '';
        cards.forEach(cd => {
            let card = document.createElement('webui-card');
            if (cd.theme) { card.setAttribute('theme', cd.theme); }
            else if (t.theme) { card.setAttribute('theme', t.theme); }
            if (cd.name) { card.setAttribute('name', cd.name); }
            if (cd.width) { card.setAttribute('width', cd.width); }
            else if (t.cardWidth) { card.setAttribute('width', t.cardWidth); }
            if (cd.avatar) { card.setAttribute('avatar', cd.avatar); }
            if (cd.link) { card.setAttribute('link', cd.link); }
            if (cd.elevation) { card.setAttribute('elevation', cd.elevation); }
            if (cd.class) { cd.class.split(' ').forEach(c => card.classList.add(c)); }
            if (cd.body) { card.innerHTML = webui.applyAppDataToContent(cd.body); }
            t.appendChild(card);
        });
    },
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'src':
                t.options.buildContentFromSource(t);
                break;
            case 'cardWidth':
                t.querySelectorAll('webui-card').forEach(n => {
                    n.setAttribute('width', value);
                });
                break;
        }
    }
});
