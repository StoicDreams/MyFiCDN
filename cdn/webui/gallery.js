/*!
 * Web UI Gallery - https://webui.stoicdreams.com/components#webui-gallery
 * A component for displaying and managing image and video galleries within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const videoFile = /\.(mp4|webm|ogv|mov)([?#]|$)/i;
    const fileName = src => decodeURIComponent(`${src || ''}`.split(/[?#]/)[0].split('/').pop() || '');
    /** A gallery item from JSON: `{ name, src, poster, type }`, where `type: 'video'` or a video file makes it a video. */
    const fromJson = item => ({
        name: `${item.name ?? fileName(item.src)}`,
        src: `${item.src || ''}`,
        poster: item.poster ? `${item.poster}` : '',
        video: item.type === 'video' || (item.type !== 'image' && videoFile.test(item.src || '')),
    });
    /** A gallery item from an `<img>`, `<video>`, or `<webui-loop-video>` written inside the gallery. */
    const fromElement = el => {
        const tag = el.localName;
        const src = el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || '';
        const name = el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('aria-label') || fileName(src);
        return { name, src, poster: el.getAttribute('poster') || '', video: tag !== 'img' };
    };
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
    webui.define("webui-gallery", {
        preload: 'flex cards card',
        attr: ['src', 'card-width'],
        constructor() {
            const t = this;
            t.flexImage = webui.create('webui-flex');
            t.flexName = webui.create('webui-flex');
            t.cards = webui.create('webui-cards');
        },
        /** The items written inside the gallery, which it shows in their place. */
        childItems() {
            return Array.from(this.querySelectorAll(':scope > img, :scope > video, :scope > webui-loop-video'))
                .map(fromElement)
                .filter(item => item.src);
        },
        async loadItems() {
            const t = this;
            let items = t.childItems();
            if (!items.length && !t.src) {
                // Children parsed after the gallery was connected are there by the next frame.
                await nextFrame();
                items = t.childItems();
            }
            if (items.length || !t.src) return items;
            try {
                const result = await fetch(t.src);
                if (!result.ok) return [];
                const list = await result.json();
                return Array.isArray(list) ? list.filter(item => item && item.src).map(fromJson) : [];
            } catch {
                return [];
            }
        },
        cardHeight() {
            const t = this;
            if (!t.cardWidth) return '100px';
            const dim = parseFloat(t.cardWidth);
            return `${dim}` === `${t.cardWidth}` ? `calc(${dim}px - (2 * var(--padding)))` : `calc(${t.cardWidth} - (2 * var(--padding)))`;
        },
        /** Shows an item in the main viewer: an image, or a video with controls. */
        show(item) {
            const t = this;
            t.currentImage = item;
            t._img.hidden = item.video;
            t._video.hidden = !item.video;
            if (item.video) {
                t._img.removeAttribute('src');
                if (t._video.getAttribute('src') !== item.src) {
                    t._video.poster = item.poster || '';
                    t._video.src = item.src;
                }
                t._video.setAttribute('aria-label', item.name);
            } else {
                t._video.pause();
                t._video.removeAttribute('src');
                t._video.load();
                t._img.src = item.src;
                // The image's name doubles as its description for screen readers.
                t._img.alt = item.name;
            }
            t._name.innerText = item.name;
            t._cardList.forEach(({ card, item: cardItem }) => card.setAttribute('aria-pressed', cardItem === item ? 'true' : 'false'));
        },
        async loadGallery() {
            const t = this;
            const items = await t.loadItems();
            if (!items.length) {
                t.replaceChildren();
                return;
            }
            t.style.display = 'block';

            t.flexImage.setAttribute('justify', 'center');
            t.flexImage.setAttribute('align', 'center');
            t.flexImage.setAttribute('column', 'true');
            t.flexImage.classList.add('pa-2');
            t.flexImage.style.height = 'calc(0.8 * var(--main-height))';
            const fit = 'max-width:100%;max-height:100%;object-fit:contain;';
            t._img = webui.create('img', { style: fit, alt: '' });
            t._video = webui.create('video', { style: fit, controls: '', playsinline: '', preload: 'metadata', hidden: '' });
            t.flexImage.appendChild(t._img);
            t.flexImage.appendChild(t._video);

            t.flexName.setAttribute('justify', 'center');
            t.flexName.classList.add('pa-1', 'ma-1');
            t._name = webui.create('p');
            t.flexName.appendChild(t._name);

            t.cards.classList.add('mb-5');
            if (t.cardWidth) {
                t.cards.setAttribute('card-width', t.cardWidth);
            }

            const height = t.cardHeight();
            t._cardList = items.map(item => {
                const card = webui.create('webui-card', { title: item.name, role: 'button', tabindex: '0', 'aria-label': item.name });
                card.style.cursor = 'pointer';
                const thumb = item.video && !item.poster
                    ? webui.create('video', { src: item.src, muted: '', preload: 'metadata', 'aria-hidden': 'true' })
                    : webui.create('div');
                thumb.style.height = height;
                thumb.style.width = '100%';
                if (thumb.localName === 'video') {
                    thumb.style.objectFit = 'cover';
                } else {
                    thumb.style.backgroundImage = `url("${(item.video ? item.poster : item.src).replace(/"/g, '%22')}")`;
                    thumb.style.backgroundRepeat = 'no-repeat';
                    thumb.style.backgroundSize = 'cover';
                    thumb.style.backgroundPosition = 'center center';
                }
                card.appendChild(thumb);
                if (item.video) {
                    card.appendChild(webui.create('webui-icon', { icon: 'circle_play|backing', 'aria-hidden': 'true' }));
                }
                card.addEventListener('click', () => t.show(item));
                card.addEventListener('keydown', ev => {
                    if (ev.key !== 'Enter' && ev.key !== ' ') return;
                    ev.preventDefault();
                    t.show(item);
                });
                t.cards.appendChild(card);
                return { card, item };
            });

            // Built off the page, then put in place of the items it was given, at once.
            const content = document.createDocumentFragment();
            content.append(t.flexImage, t.flexName, t.cards);
            t.replaceChildren(content);
            t.show(items[0]);
        },
        connected() {
            this.loadGallery();
        }
    });
}
