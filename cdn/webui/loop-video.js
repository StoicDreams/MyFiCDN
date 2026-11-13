/*!
 * Web UI Loop Video - https://webui.stoicdreams.com/components#webui-loop-video
 * A short, silent video that plays on a loop while it is on screen, in place of a screenshot, to show an action.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    webui.define('webui-loop-video', {
        attr: ['src', 'poster', 'alt', 'width', 'height'],
        constructor() {
            const t = this;
            t._video = t.template.querySelector('video');
            t._toggle = t.template.querySelector('button');
            t._fallback = t.template.querySelector('img');
            // Only paused by the viewer, not by scrolling away, stays paused when it scrolls back.
            t._pausedByViewer = false;
            t._visible = false;
            t._video.muted = true;
            t._video.addEventListener('play', () => t.renderToggle());
            t._video.addEventListener('pause', () => t.renderToggle());
            t._video.addEventListener('error', () => t.showFallback());
            t._toggle.addEventListener('click', ev => {
                ev.stopPropagation();
                if (t._video.paused) {
                    t._pausedByViewer = false;
                    // The viewer chose to play it, so it plays even when they asked their system for less motion.
                    t._playedByViewer = true;
                    t.play();
                } else {
                    t._pausedByViewer = true;
                    t._video.pause();
                }
            });
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'src':
                    t._fallback.hidden = true;
                    t._video.hidden = false;
                    t._video.src = value || '';
                    if (t._visible) t.play();
                    break;
                case 'poster':
                    t._video.poster = value || '';
                    t._fallback.src = value || '';
                    break;
                case 'alt':
                    t._video.setAttribute('aria-label', value || '');
                    t._fallback.alt = value || '';
                    t.renderToggle();
                    break;
                case 'width':
                case 'height':
                    t._video.setAttribute(property, value);
                    t._fallback.setAttribute(property, value);
                    break;
            }
        },
        connected() {
            const t = this;
            t.renderToggle();
            if (!('IntersectionObserver' in window)) {
                t._visible = true;
                t.play();
                return;
            }
            t._observer = new IntersectionObserver(entries => {
                t._visible = entries.some(entry => entry.isIntersecting);
                if (t._visible) t.play();
                else t._video.pause();
            }, { threshold: 0.25 });
            t._observer.observe(t);
        },
        disconnected() {
            const t = this;
            t._observer?.disconnect();
            t._video.pause();
        },
        /** Plays unless the viewer paused it, or asked their system for less motion. */
        play() {
            const t = this;
            if (t._pausedByViewer || (reducedMotion() && !t._playedByViewer) || !t._video.src || t._video.hidden) return;
            // A browser can refuse to play, such as to save power. The poster then shows, with Play to try again.
            t._video.play()?.catch(() => t.renderToggle());
        },
        /** Shows the poster as an image when the video cannot load. */
        showFallback() {
            const t = this;
            if (!t._fallback.src) return;
            t._video.hidden = true;
            t._toggle.hidden = true;
            t._fallback.hidden = false;
        },
        renderToggle() {
            const t = this;
            const paused = t._video.paused;
            const name = t.getAttribute('alt') || 'video';
            t._toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${name}`);
            t._toggle.setAttribute('aria-pressed', paused ? 'false' : 'true');
            t._toggle.dataset.state = paused ? 'paused' : 'playing';
        },
        shadowTemplate: `
<div class="frame" part="frame">
<video part="video" muted loop playsinline preload="metadata" disablepictureinpicture></video>
<img part="fallback" alt="" hidden />
<button type="button" part="toggle" data-state="paused">
<svg viewBox="0 0 24 24" aria-hidden="true"><path class="play" d="M8 5v14l11-7z"/><path class="pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>
</button>
</div>
<style type="text/css">
:host {
display: block;
max-width: 100%;
}
.frame {
position: relative;
display: inline-block;
max-width: 100%;
line-height: 0;
}
video,
img {
display: block;
max-width: 100%;
height: auto;
border-radius: var(--corners, 4px);
}
video[hidden],
img[hidden],
button[hidden] {
display: none;
}
button {
position: absolute;
right: 8px;
bottom: 8px;
width: 36px;
height: 36px;
padding: 6px;
border: none;
border-radius: 50%;
background: rgba(0, 0, 0, 0.55);
color: #fff;
cursor: pointer;
opacity: 0.7;
transition: opacity 0.2s;
}
button:hover,
button:focus-visible {
opacity: 1;
}
button:focus-visible {
outline: 2px solid var(--color-focus, #fff);
outline-offset: 2px;
}
svg {
width: 100%;
height: 100%;
fill: currentColor;
}
button[data-state="playing"] .play,
button[data-state="paused"] .pause {
display: none;
}
</style>
`
    });
}
