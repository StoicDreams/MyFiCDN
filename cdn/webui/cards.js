/*!
 * Web UI Cards - https://webui.stoicdreams.com/components#webui-cards
 * A component for displaying a collection of card elements.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-cards", {
    attr: ['elevation', 'card-width', 'src', 'theme'],
    buildContentFromSource: async function (t) {
        if (!t.src) return;
        let result = await fetch(t.src);
        if (!result.ok) return;
        let cards = await result.text();
        t.setCards(cards);
    },
    setCards: function (json) {
        const t = this;
        t.innerHTML = '';
        try {
            let cards = JSON.parse(json);
            cards.forEach(cd => {
                let card = webui.create('webui-card');
                if (cd.theme) { card.setAttribute('theme', cd.theme); }
                else if (t.theme) { card.setAttribute('theme', t.theme); }
                if (cd.name) { card.setAttribute('name', cd.name); }
                if (cd.width) { card.setAttribute('width', cd.width); }
                if (cd.avatar) { card.setAttribute('avatar', cd.avatar); }
                if (cd.link) { card.setAttribute('link', cd.link); }
                if (cd.elevation) { card.setAttribute('elevation', cd.elevation); }
                if (cd.class) { cd.class.split(' ').forEach(c => card.classList.add(c)); }
                if (cd.body) { card.innerHTML = webui.applyAppDataToContent(cd.body); }
                t.appendChild(card);
            });
        } catch (ex) {
            t.innerHTML = `Error parsing card information: ${ex}`;
        }
    },
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'src':
                t.options.buildContentFromSource(t);
                break;
            case 'cardWidth':
                t.style.gridTemplateColumns = `repeat(auto-fit, minmax(1em, ${value}px))`
                t.querySelectorAll('webui-card').forEach(n => {
                    n.setAttribute('width', value);
                });
                break;
        }
    }
});
