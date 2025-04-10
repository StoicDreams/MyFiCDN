/* Display gallery images */
"use strict"
webui.define("webui-gallery", {
    preload: 'flex cards card',
    constructor: (t) => {
        t.flexImage = webui.create('webui-flex');
        t.flexName = webui.create('webui-flex');
        t.cards = webui.create('webui-cards');
    },
    attr: ['src', 'card-width'],
    loadGallery: async function (t) {
        if (!t.src) { return; }
        let result = await fetch(t.src);
        if (!result.ok) { return; }
        let images = await result.json();
        if (!images.length) { return; }
        t.parentNode.insertBefore(t.flexImage, t);
        t.parentNode.insertBefore(t.flexName, t);
        t.parentNode.insertBefore(t.cards, t);

        t.currentImage = images[0];
        t.flexImage.setAttribute('justify', 'center');
        t.flexImage.setAttribute('align', 'center');
        t.flexImage.setAttribute('column', 'true');
        t.flexImage.classList.add('pa-2');
        t.flexImage.style.height = 'calc(0.8 * var(--main-height))';

        let img = webui.create('img');
        img.setAttribute('data-subscribe', 'page-gallery-image:src');
        t.flexImage.appendChild(img);

        t.flexName.setAttribute('justify', 'center');
        t.flexName.classList.add('pa-1', 'ma-1');
        let nm = webui.create('p');
        t.flexName.appendChild(nm);
        nm.setAttribute('data-subscribe', 'page-gallery-image-name:innerHTML');

        t.cards.classList.add('mb-5');
        if (t.cardWidth) {
            t.cards.setAttribute('card-width', t.cardWidth);
        }

        let cardTemplate = webui.create('webui-card');
        images.forEach(image => {
            let card = cardTemplate.cloneNode(false);
            t.cards.appendChild(card);
            card.setAttribute('title', image.name);
            let img = webui.create('div');
            if (t.cardWidth) {
                let dim = parseFloat(t.cardWidth);
                if (`${dim}` === t.cardWidth) {
                    img.style.height = `calc(${dim}px - (2 * var(--padding)))`;
                } else {
                    img.style.height = `calc(${t.cardWidth} - (2 * var(--padding)))`;
                }
            } else {
                img.style.height = '100px';
            }
            img.style.width = '100%';
            img.style.backgroundImage = `url(${image.src})`;
            img.style.backgroundRepeat = 'no-repeat';
            img.style.backgroundSize = 'cover';
            img.style.backgroundPosition = 'center center';
            card.appendChild(img);
            card.style.cursor = 'pointer';
            card.addEventListener('click', _ev => {
                webui.setData('page-gallery-image', image.src);
                webui.setData('page-gallery-image-name', image.name);
            });
        });

        webui.setData('page-gallery-image', t.currentImage.src);
        webui.setData('page-gallery-image-name', t.currentImage.name);
    },
    connected: (t) => {
        t.loadGallery(t);
    }
});