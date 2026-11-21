/*!
 * Web UI Tabs - https://webui.stoicdreams.com/components#webui-tabs
 * This component is used for creating tabbed sections of content on a page.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    function enableTabFields(content) {
        webui.querySelectorAll('[data-tab-disabled]:not(slot)', content).forEach(item => {
            item.removeAttribute('disabled');
            item.removeAttribute('data-tab-disabled');
        });
    }
    webui.define('webui-tabs', {
        preload: 'toggle-icon',
        constructor() {
            const t = this;
            t._index = 0;
            t._slotContent = t.template.querySelector('slot[name="content"]');
            t._slotTabs = t.template.querySelector('slot[name="tabs"]');
            t._slotTemplates = t.template.querySelector('slot[name="template"]');
            t._section = t.template.querySelector('section');
            t._label = t.template.querySelector('.label');
            t._slotLabel = t.template.querySelector('slot[name="label"]');
            t._slotLabel.addEventListener('slotchange', () => t.showLabel());
            t._bar = t.template.querySelector('.bar');
            // Buttons the tabs made icon-only, so a button the page made icon-only itself stays that way.
            t._iconOnlySet = new WeakSet();
            t._slotTabs.addEventListener('slotchange', () => t.applyCollapse());
            t._toggle = t.template.querySelector('.collapse-toggle');
            t._toggle.addEventListener('change', () => {
                // The toggle also reports the state this sets on it, which is not a person's choice.
                if (t._syncingToggle) return;
                t.chooseView(t._toggle.value ? 'icon' : 'label');
            });
            // The toggle loads after the tabs, so it takes their state once it can.
            customElements.whenDefined('webui-toggle-icon').then(() => t.applyCollapse());
            t.addEventListener('pointerdown', ev => t.dragTab(ev));
            t.addEventListener('keydown', ev => t.keyTab(ev));
        },
        attr: ['pad', 'transition-timing', 'index', 'theme', 'content-theme', 'label', 'tab-display', 'tab-display-key'],
        flags: ['sortable'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'pad':
                    {
                        t.style.setProperty('--theme-padding', webui.pxIfNumber(value));
                    }
                    break;
                case 'transitionTiming':
                    {
                        t._slotContent.style.setProperty('transition-duration', webui.msIfNumber(value));
                    }
                    break;
                case 'label':
                    t.showLabel();
                    break;
                case 'tabDisplay':
                case 'tabDisplayKey':
                    t.applyCollapse();
                    break;
                case 'index':
                    {
                        // Before the first render this is the starting tab. After it, it switches tabs.
                        const index = parseInt(value) || 0;
                        if (t._initiated) {
                            t.setTab(index);
                        } else {
                            t._index = index;
                        }
                    }
                    break;
            }
        },
        connected() {
            const t = this;
            t.showLabel();
            t.render();
            t.checkResponsiveVertical();
            // A new size moves where each tab sits, so the shown one is lined up again.
            t._alignObserver ??= new ResizeObserver(() => t.alignContent());
            t.observeSizes();
            t.applyCollapse();
        },
        reconnected() {
            // A move disconnects the observer, and connected does not run again.
            this.observeSizes();
        },
        disconnected() {
            this._alignObserver?.disconnect();
        },
        observeSizes() {
            const t = this;
            t._alignObserver?.observe(t._section);
            t._alignObserver?.observe(t._slotContent);
        },
        /**
         * The views the tab buttons can show, from tab-display: "label" for their names, "icon" for just their icons (or two
         * letters of a name without one), with the name as a tooltip. Both, as "label|icon" (the default) or
         * "icon|label", add a toggle to switch between them, starting on the first.
         */
        tabViews() {
            const views = [...new Set((this.getAttribute('tab-display') || '').split('|').map(view => view.trim().toLowerCase()))]
                .filter(view => view === 'label' || view === 'icon');
            return views.length ? views : ['label', 'icon'];
        },
        /** Where a person's choice of view is kept: tab-display-key="name" keeps it, under that name. */
        viewKey() {
            const name = (this.getAttribute('tab-display-key') || '').trim();
            return name ? `session-webui-tabs-view-${name}` : '';
        },
        /** The view shown: the one a person chose with the toggle, while tab-display still offers it, or else the first. */
        currentView() {
            const t = this;
            const views = t.tabViews();
            const key = t.viewKey();
            const chosen = t._chosenView ?? (key ? webui.getData(key) : undefined);
            return views.includes(chosen) ? chosen : views[0];
        },
        /** A person chose names or icons with the toggle. */
        chooseView(view) {
            const t = this;
            t._chosenView = view;
            const key = t.viewKey();
            if (key) webui.setData(key, view);
            t.applyCollapse();
        },
        /** Shows the current view, and the toggle when tab-display offers both. */
        applyCollapse() {
            const t = this;
            const collapsed = t.currentView() === 'icon';
            t._toggle.hidden = t.tabViews().length < 2;
            t.toggleAttribute('collapsed', collapsed);
            if (typeof t._toggle.setValue === 'function' && !!t._toggle.value !== collapsed) {
                t._syncingToggle = true;
                try { t._toggle.setValue(collapsed); } finally { t._syncingToggle = false; }
            }
            t.tabButtons().forEach(button => {
                if (collapsed) {
                    if (button.hasAttribute('icon-only')) return;
                    button.setAttribute('icon-only', '');
                    t._iconOnlySet.add(button);
                } else if (t._iconOnlySet.has(button)) {
                    button.removeAttribute('icon-only');
                    t._iconOnlySet.delete(button);
                }
            });
        },
        /**
         * Slides the row of tab contents so the shown one is in view. It moves by where the shown tab really is, rather
         * than by its index times the width, which drifted by a little more each tab whenever a column was not exactly
         * as wide as the tabs, as WebKit could leave them until the tabs were resized, cutting off the left of later tabs.
         */
        alignContent() {
            const t = this;
            const contents = t.tabContents();
            const shown = contents[t._index];
            const first = contents[0];
            if (!shown || !first) return;
            // Before the tabs are laid out there is nothing to measure, so the slide is by index until they are.
            const measured = shown.offsetWidth > 0 && first.offsetWidth > 0;
            const translate = measured ? `${first.offsetLeft - shown.offsetLeft}px 0` : `-${t._index * 100}% 0`;
            if (t._slotContent.style.translate !== translate) t._slotContent.style.translate = translate;
        },
        /** The index of the tab shown, counting from 0, for pages that keep or restore which tab was open. */
        currentTab() {
            return Math.max(0, parseInt(this._index) || 0);
        },
        tabButtons() {
            return Array.from(this.children).filter(item => item.getAttribute('slot') === 'tabs');
        },
        tabContents() {
            return Array.from(this.children).filter(item => item.getAttribute('slot') === 'content');
        },
        /** The tab button an event came from, when the tabs can be sorted. */
        tabFrom(ev) {
            const t = this;
            if (!t.hasAttribute('sortable')) return null;
            const buttons = t.tabButtons();
            return ev.composedPath().find(node => buttons.includes(node)) || null;
        },
        /**
         * Moves a tab, with its content, before or after another, keeps the tab that was showing shown, and sends a
         * reorder event with the tab buttons in their new order.
         */
        moveTab(tab, target, after) {
            const t = this;
            const buttons = t.tabButtons();
            const contents = t.tabContents();
            const from = buttons.indexOf(tab);
            const to = buttons.indexOf(target);
            if (from < 0 || to < 0 || tab === target) return false;
            const shown = buttons[t._index];
            const content = contents[from];
            const targetContent = contents[to];
            if (after) target.after(tab);
            else target.before(tab);
            if (content && targetContent && content !== targetContent) {
                if (after) targetContent.after(content);
                else targetContent.before(content);
            }
            if (t.tabButtons().indexOf(tab) === from) return false;
            const index = t.tabButtons().indexOf(shown);
            t._index = -1;
            t.setTab(index >= 0 ? index : 0);
            t.dispatchEvent(new CustomEvent('reorder', { bubbles: true, detail: { order: t.tabButtons() } }));
            return true;
        },
        /** Alt with an arrow key moves the focused tab one place, as dragging does, for people who do not use a mouse. */
        keyTab(ev) {
            const t = this;
            if (!ev.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(ev.key)) return;
            const tab = t.tabFrom(ev);
            if (!tab) return;
            ev.preventDefault();
            ev.stopPropagation();
            const buttons = t.tabButtons();
            const index = buttons.indexOf(tab);
            const forward = ev.key === 'ArrowRight' || ev.key === 'ArrowDown';
            const target = buttons[index + (forward ? 1 : -1)];
            const focused = ev.composedPath()[0];
            if (target) t.moveTab(tab, target, forward);
            focused?.focus?.();
        },
        /**
         * Dragging a tab, once the pointer has moved a little, so a click is still a click, moves it as it goes: over
         * another tab, it takes that tab's place. The pointer is captured, so the drag keeps every move however fast
         * it goes, and the browser's own dragging and text selection, which would cancel it, are stopped meanwhile.
         */
        dragTab(ev) {
            const t = this;
            if (ev.button !== 0 || !t.hasAttribute('sortable')) return;
            const tab = t.tabFrom(ev);
            if (!tab) return;
            const start = { x: ev.clientX, y: ev.clientY };
            const pointerId = ev.pointerId;
            let dragging = false;
            const block = e => e.preventDefault();
            const move = e => {
                if (e.pointerId !== pointerId) return;
                if (!dragging) {
                    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
                    dragging = true;
                    t.setAttribute('dragging', '');
                    tab.setAttribute('tab-moving', '');
                    try { t.setPointerCapture(pointerId); } catch { /* The pointer is already gone. */ }
                    document.getSelection?.()?.removeAllRanges();
                }
                e.preventDefault();
                const buttons = t.tabButtons();
                const target = buttons.find(button => {
                    if (button === tab) return false;
                    const rect = button.getBoundingClientRect();
                    return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
                });
                if (!target) return;
                // The tab takes the place of the one it is over: after it when coming from before it, before it otherwise.
                t.moveTab(tab, target, buttons.indexOf(target) > buttons.indexOf(tab));
            };
            const end = e => {
                if (e.pointerId !== pointerId) return;
                window.removeEventListener('pointermove', move, true);
                window.removeEventListener('pointerup', end, true);
                window.removeEventListener('pointercancel', end, true);
                window.removeEventListener('dragstart', block, true);
                window.removeEventListener('selectstart', block, true);
                try { if (t.hasPointerCapture?.(pointerId)) t.releasePointerCapture(pointerId); } catch { /* Already released. */ }
                if (!dragging) return;
                t.removeAttribute('dragging');
                tab.removeAttribute('tab-moving');
                // The click that ends a drag does not open the tab it ended on.
                const swallow = e => {
                    e.stopPropagation();
                    e.preventDefault();
                };
                window.addEventListener('click', swallow, { capture: true, once: true });
                setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
            };
            window.addEventListener('pointermove', move, true);
            window.addEventListener('pointerup', end, true);
            window.addEventListener('pointercancel', end, true);
            window.addEventListener('dragstart', block, true);
            window.addEventListener('selectstart', block, true);
        },
        /** A label before the tabs, on their row, from the label attribute or an element with slot="label". */
        showLabel() {
            const t = this;
            const text = t.getAttribute('label') || '';
            t._label.textContent = text;
            t._label.hidden = !text;
            t.toggleAttribute('labeled', !!text || t._slotLabel.assignedElements().length > 0);
        },
        onResize() {
            this.checkResponsiveVertical();
        },
        /** Puts the tabs down the side when given true, or across the top otherwise, such as from data-subscribe. */
        setVertical(value) {
            const vertical = value === true || value === 'true' || value === 1 || value === '1' || value === '';
            this.toggleAttribute('vertical', vertical);
        },
        setData: function (data, key) {
            const t = this;
            if (!data || !data.forEach) return;
            let templateLabel = '';
            let templateContent = '';
            t._slotTemplates.assignedElements().forEach(template => {
                switch (template.getAttribute('name')) {
                    case 'label':
                        templateLabel = template.innerHTML;
                        break;
                    case 'content':
                        templateContent = template.innerHTML;
                        break;
                }
            });
            webui.removeElements(t, '[data-dynamic]');
            let index = 0;
            data = data.filter(d => Object.keys(d).length > 0);
            data.forEach(item => {
                let displayItem = webui.setDefaultData(item, { name: 'Name', label: 'Missing Label', content: 'Missing Content' });
                displayItem['tab-index'] = index++;
                displayItem['tab-page'] = index;
                let btn = webui.create('webui-button', { slot: 'tabs', 'data-dynamic': '1' });
                let content = webui.create('webui-page-segment', { slot: 'content', 'data-dynamic': '1', 'theme': t.contentTheme || 'inherit' });
                if (templateLabel) {
                    btn.innerHTML = webui.applyAppDataToContent(templateLabel, displayItem);
                } else {
                    btn.innerHTML = displayItem.label;
                }
                if (templateContent) {
                    content.innerHTML = webui.applyAppDataToContent(templateContent, displayItem);
                } else {
                    content.innerHTML = displayItem.content;
                }
                t.appendChild(btn);
                t.appendChild(content);
            });
            t._initiated = false;
            t.render();
        },
        setTab: function (tabIndex) {
            const t = this;
            if (tabIndex === undefined || tabIndex === null) return;
            tabIndex = parseInt(tabIndex) || 0;
            if (!t._initiated) {
                // A tab named in the url is a direct link to it, so it wins over a saved or default tab.
                const linkedTab = t.getTabIndexFromUrl();
                if (linkedTab !== -1) {
                    tabIndex = linkedTab;
                }
            }
            // Showing the tab already shown does nothing, unless tabs added or removed put other content in its place.
            if (t._initiated && tabIndex === t._index && t.tabContents()[tabIndex] === t._shownContent) return;
            let index = 0;
            let foundIndex = false;
            Array.from(t.querySelectorAll('[slot="tabs"]')).filter(item => item.parentNode === t).forEach(tab => {
                if (tabIndex === index++) {
                    tab.setAttribute('theme', 'active');
                    // Screen readers hear which tab is showing.
                    tab.setAttribute('aria-current', 'true');
                    t._index = index - 1;
                    foundIndex = true;
                } else {
                    tab.removeAttribute('theme');
                    tab.removeAttribute('aria-current');
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find tab index', tabIndex);
                t.setTab(tabIndex - 1);
                return;
            }
            index = 0;
            foundIndex = false;
            Array.from(t.querySelectorAll('[slot="content"]')).filter(item => item.parentNode === t).forEach(c => {
                // Other tabs are only moved out of view, so inert keeps keyboard focus and screen readers out of them.
                c.inert = tabIndex !== index;
                if (tabIndex === index++) {
                    t._index = tabIndex;
                    t._shownContent = c;
                    t.alignContent();
                    foundIndex = true;
                    if (c.previousElementSibling && c.previousElementSibling.hasAttribute && c.previousElementSibling.hasAttribute('hash')) {
                        // Selecting the initial tab is not a navigation, so it adds no history entry or replaces a hash in the url.
                        if (t._initiated) {
                            webui.updateHash(c.previousElementSibling.getAttribute('hash'));
                        } else if (!location.hash) {
                            webui.updateHash(c.previousElementSibling.getAttribute('hash'), true);
                        }
                    }
                    if (t._initiated && t.hasAttribute('vertical') && !t.hasAttribute('narrow')) {
                        t.scrollIntoView({ behavior: 'smooth' });
                    }
                    if (c.nodeName === 'WEBUI-CONTENT') { c.removeAttribute('nofix'); }
                    enableTabFields(c);
                    if (c.nodeName === 'WEBUI-CONTENT' && !c.contentAttached) {
                        webui.wait(_ => {
                            return c.contentAttached;
                        }).then(async _ => {
                            await webui.wait(10);
                            enableTabFields(c);
                        });
                    }
                } else {
                    // Named fields in hidden tabs are disabled, so forms leave them out.
                    // Marked, so fields disabled for other reasons are left disabled.
                    webui.querySelectorAll('[name]:not([disabled]):not(slot)', c).forEach(item => {
                        item.setAttribute('disabled', true);
                        item.setAttribute('data-tab-disabled', '');
                    });
                    if (c.nodeName === 'WEBUI-CONTENT') { c.setAttribute('nofix', true); }
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find content index', tabIndex);
                setTimeout(() => {
                    t.setTab(tabIndex - 1);
                }, 1);
                return;
            }
            t._index = tabIndex;
            t.collapseHiddenTabs();
            if (t.dataset.subscribe) {
                t.dataset.subscribe.split('|').forEach(ds => {
                    let dss = ds.split(':');
                    if (dss[1] !== 'setTab') return;
                    let curTab = webui.getData(dss[0]);
                    if (curTab !== t._index) {
                        webui.setData(dss[0], t._index);
                    }
                });
            }
            t._initiated = true;
        },
        /**
         * Tabs sit side by side, so the tallest would set the height of all of them and leave space below a shorter one.
         * Hidden tabs collapse once the slide to the shown tab has finished, so the slide still shows both.
         */
        collapseHiddenTabs() {
            const t = this;
            const contents = Array.from(t.querySelectorAll('[slot="content"]')).filter(item => item.parentNode === t);
            contents[t._index]?.removeAttribute('tab-hidden');
            clearTimeout(t._collapseTimer);
            const collapse = () => contents.forEach((c, index) => c.toggleAttribute('tab-hidden', index !== t._index));
            const slide = t._initiated ? (parseFloat(getComputedStyle(t._slotContent).transitionDuration) || 0) * 1000 : 0;
            if (slide > 0) {
                t._collapseTimer = setTimeout(collapse, slide);
            } else {
                collapse();
            }
        },
        getTabIndexFromUrl() {
            const t = this;
            const hash = location.hash.substring(1);
            if (!hash) return -1;
            return Array.from(t.children)
                .filter(item => item.getAttribute('slot') === 'tabs')
                .findIndex(item => item.getAttribute('hash') === hash);
        },
        render: function () {
            const t = this;
            let nodes = Array.from(t.querySelectorAll('[slot="content"]')).filter(item => item.parentNode === t);
            t._slotContent.style.setProperty('grid-template-columns', (new Array(nodes.length).fill('100%')).join(' '));
            let tabIndex = 0;
            Array.from(t.querySelectorAll('[slot="tabs"]')).filter(item => item.parentNode === t).forEach(node => {
                const myIndex = tabIndex++;
                if (!node._isSetup) {
                    node._isSetup = true;
                    // The tab's place is read when it is clicked, so tabs moved since still open their own content.
                    node.addEventListener('click', _ => {
                        const index = t.tabButtons().indexOf(node);
                        t.setTab(index >= 0 ? index : myIndex);
                    });
                }
            });
            if (t.dataset.subscribe) {
                let tabIsSet = false;
                t.dataset.subscribe.split('|').forEach(ds => {
                    let dss = ds.split(':');
                    if (dss.length !== 2 || dss[1] !== 'setTab') return;
                    let cached = webui.getData(dss[0]);
                    if (cached !== undefined) {
                        t.setTab(cached);
                        tabIsSet = true;
                    }
                });
                if (tabIsSet) return;
            }
            t.setTab(t._index || 0);
        },
        checkResponsiveVertical: function () {
            const isNarrow = window.innerWidth < 900;
            const t = this;
            t._forceHorizontal = isNarrow;
            if (isNarrow) {
                if (!t.hasAttribute('narrow')) {
                    t.setAttribute('narrow', true);
                }
            } else if (t.hasAttribute('narrow')) {
                t.removeAttribute('narrow');
            }
        },
        shadowTemplate: `
<div class="bar" part="bar"><span class="label" part="label" hidden></span><slot name="label"></slot><slot name="tabs"></slot><webui-toggle-icon class="collapse-toggle" part="collapse-toggle" icon-on="expand" icon-off="compress" title-on="Show tab names" title-off="Show tabs as icons"></webui-toggle-icon></div>
<section>
<slot name="content"></slot>
</section>
<slot name="template"></slot>
<style type="text/css">
:host {
display:block;
overflow:hidden;
width:100%;
width:-webkit-fill-available;
--theme-color:var(--color-title);
--theme-color-offset:var(--color-title-offset);
--theme-padding: 0px;
}
:host([vertical]:not([narrow])) {
display:grid;
grid-template-columns:max-content auto;
}
slot[name="template"] {display:none;}
.bar {
display:flex;
flex-wrap:wrap;
align-items:stretch;
background-color:color-mix(in srgb, var(--theme-color) 30%, var(--color-background, #000));
color:var(--color-background-offset, inherit);
gap:var(--theme-padding);
border-radius:var(--corners) var(--corners) 0 0;
}
slot[name="tabs"] {
display:contents;
}
:host([vertical]:not([narrow])) .bar {
flex-direction:column;
}
.label[hidden],
.collapse-toggle[hidden] {
display:none;
}
.collapse-toggle {
align-self:center;
margin-inline-start:auto;
padding:0 calc(var(--padding, 8px) / 2);
}
:host([vertical]:not([narrow])) .collapse-toggle {
margin-inline-start:0;
margin-block-start:auto;
}
:host([dragging]) {
cursor:grabbing;
user-select:none;
}
::slotted([tab-moving]) {
opacity:0.6;
}
:host([sortable]) ::slotted([slot="tabs"]) {
touch-action:none;
-webkit-user-drag:none;
user-select:none;
}
.label,
::slotted([slot="label"]) {
align-self:center;
font-weight:bold;
padding:0 var(--padding, 8px);
}
slot[name="content"] {
display:grid;
padding:var(--theme-padding);
gap: calc(2 * var(--theme-padding));
width:100%;
box-sizing:border-box;
transition-duration:0;
min-height:100%;
}
/* The grid stretches the tab shown to fill the tabs' room, so it needs no min-height of its own. One of 100% kept
   WebKit from shrinking a tab after it had grown, such as when a page fits its content to the window, leaving the
   page to scroll by the difference. */
::slotted([slot="content"][tab-hidden]) {
height:0;
min-height:0;
overflow:hidden;
}
section {
display:block;
overflow:hidden;
box-sizing:border-box;
border-radius:0 0 var(--corners) var(--corners);
border:1px solid var(--theme-color);
}
</style>
`
    });
}
