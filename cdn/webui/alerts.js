/*!
 * Web UI Alerts - https://webui.stoicdreams.com/components#webui-alerts
 * Displays Alert icon and enables webui.alert(message:string|html, variant:string[success|warning|danger|info]) for displaying popup alerts,
 * webui.addAlert(message, variant, { popup }) which resolves to the alert, and webui.clearAlerts({ close }) which removes them all.
 * With the panel flag it shows the list of alerts in place, such as in a tab, rather than a bell: newest first, with Clear
 * All. Closed alerts slide away and the rest move up, and a new alert that pops up while a panel is in view moves from
 * its popup into its place at the top. Whenever the number of alerts not closed changes, the document gets a
 * webui-alerts-count event with { count } in its detail.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const alertList = [];
    let alertTrigger = 'trigger-alert';
    const popup = webui.create('section');
    popup.classList.add('webui-alerts-popup');
    // Screen readers read each alert that pops up, as people see it arrive, without interrupting them.
    popup.setAttribute('aria-live', 'polite');
    popup.setAttribute('aria-relevant', 'additions');
    popup.style.display = 'block';
    popup.style.position = 'fixed';
    popup.style.bottom = '30px';
    popup.style.right = 0;
    popup.style.overflow = 'visible';
    // Above drawers, since an alert can move from here into a drawer's list of alerts.
    popup.style.zIndex = '1000';
    document.body.appendChild(popup);

    let popupTiming = 5000;
    /** The webui-alerts that owns the list and its count, and the panels showing it. */
    let owner = null;
    const panels = new Set();
    /** How long a popup shows before it moves into a panel in view, so it is seen arriving where alerts appear. */
    const ARRIVE_DELAY = 700;
    const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        || document.documentElement.hasAttribute('data-reduce-motion');
    /** Runs an animation, or nothing when motion is reduced, resolving once it ends. */
    function animate(el, frames, options) {
        if (reducedMotion() || typeof el.animate !== 'function') return Promise.resolve();
        const animation = el.animate(frames, options);
        return animation.finished.catch(() => { });
    }
    /** Moves the elements from where they were, in `before`, to where they are now, as one moves up or down. */
    function slideFrom(before) {
        before.forEach((top, el) => {
            if (!el.isConnected) return;
            const dy = top - el.getBoundingClientRect().top;
            if (Math.abs(dy) < 1) return;
            animate(el, [{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 250, easing: 'ease-out' });
        });
    }
    const topsOf = elements => new Map(elements.map(el => [el, el.getBoundingClientRect().top]));
    /**
     * Moves an alert to another parent without the alert's own entrance replaying, since the alert is already
     * showing: its transitions are off for the move.
     */
    function moveQuietly(alert, place) {
        alert.style.transition = 'none';
        place(alert);
        getComputedStyle(alert).opacity;
        requestAnimationFrame(() => alert.style.removeProperty('transition'));
    }
    /** A panel the user can see now, to move a new alert into. */
    function panelInView() {
        for (const panel of panels) {
            if (!panel.isConnected || panel.checkVisibility?.() === false) continue;
            const rect = panel.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth) return panel;
        }
        return null;
    }
    const openAlerts = () => alertList.filter(alert => !alert.userclosed);

    function getAlertHeader() {
        const t = this;
        const container = webui.create('header');
        container.style.padding = 'var(--padding)';
        container.setAttribute('slot', 'header');
        container.innerHTML = t.alertTitle;
        return container;
    }

    function getAlertContent() {
        const container = webui.create('section');
        container.style.padding = 'var(--padding)';
        if (alertList.length === 0) {
            container.innerHTML = '<webui-alert variant="info" show fixed>You have no alerts at this time.</webui-alert>';
        } else {
            let index = 0;
            while (index < alertList.length) {
                let alert = alertList[index];
                if (alert.userclosed) {
                    alertList.splice(index, 1);
                    continue;
                }
                alert.setAttribute('show', true);
                index++;
                container.appendChild(alert);
            }
        }
        return container;
    }

    function showAlertsInDialog() {
        const t = this;
        webui.dialog({
            title: getAlertHeader.bind(t)(),
            content: getAlertContent.bind(t)(),
            confirm: 'Close',
        });
    }

    function showAlertsInDrawer(drawer) {
        const t = this;
        let el = document.querySelector(drawer);
        if (!el) {
            showAlertsInDialog.bind(t)();
            return;
        }
        if (el.classList.contains('open')) {
            el.classList.remove('open');
            setTimeout(() => showAlertsInDrawer.bind(t)(drawer), 500);
            return;
        }
        el.innerHTML = '';
        el.appendChild(getAlertHeader.bind(t)());
        el.appendChild(getAlertContent.bind(t)());
        setTimeout(() => {
            el.classList.add('open');
        }, 100);
    }

    webui.define("webui-alerts", {
        preload: "icon alert dialogs",
        alertTitle: 'Alerts',
        constructor() {
            const t = this;
            t.count = 0;
            t.icon = t.template.querySelector('webui-icon');
            if (!window.webuiAlert && !t.hasAttribute('panel')) {
                owner = t;
                // Like webui.alert, but resolves to the alert, which fires close when the user closes it. With
                // { popup: false }, the alert only joins the list the bell opens, as for notifications loaded all
                // at once. webui.alert itself resolves to nothing, since it is often a .catch handler whose result
                // callers test.
                webui.addAlert = async (message, variant, options = {}) => {
                    const showPopup = options?.popup !== false;
                    const msg = message.nodeName ? message.innerText : message;
                    const hc = await webui.hashSHA256(`${variant}-${msg}`);
                    for (let index = alertList.length - 1; index >= 0; --index) {
                        if (!alertList[index].userclosed) continue;
                        alertList[index].remove();
                        alertList.splice(index, 1);
                    }
                    let alert = alertList.filter(i => i._hashCode === hc)[0];
                    if (alert) {
                        alert.increment();
                        // Already in a panel in view, it moves to the top, where new alerts are, rather than popping up.
                        const holder = [...panels].find(panel => panel.holds(alert));
                        if (holder && holder === panelInView()) {
                            holder.toTop(alert);
                            return alert;
                        }
                        if (!showPopup) {
                            panels.forEach(panel => panel.place(alert));
                            return alert;
                        }
                        popup.appendChild(alert);
                        alert.display();
                        hideLater(alert);
                        return alert;
                    }
                    alert = webui.create('webui-alert');
                    alert._hashCode = hc;
                    if (message.nodeName) {
                        alert.appendChild(message);
                    } else {
                        alert.innerHTML = message;
                    }
                    alert.setAttribute('variant', variant || 'danger');
                    alert.setAttribute('show', true);
                    alert.style.margin = '0 10px 10px 0'
                    alert.userclosed = false;
                    alertList.push(alert);
                    t.setCount(t.count + 1);
                    if (!showPopup) {
                        panels.forEach(panel => panel.place(alert));
                        return alert;
                    }
                    popup.appendChild(alert);
                    hideLater(alert);
                    return alert;
                };
                /**
                 * A popup hides after a while. While a panel is in view, it moves into the panel instead, once it
                 * has been seen popping up.
                 */
                const hideLater = alert => {
                    const shown = alert._shown = (alert._shown || 0) + 1;
                    const stillUp = () => alert._shown === shown && alert.parentNode === popup && !alert._arriving && !alert.userclosed;
                    setTimeout(() => {
                        if (stillUp()) panelInView()?.arrive(alert);
                    }, ARRIVE_DELAY);
                    setTimeout(() => {
                        if (!stillUp()) return;
                        // A panel opened since it popped up takes it, so it never just disappears from view.
                        const panel = panelInView();
                        if (panel) panel.arrive(alert);
                        else alert.removeAttribute('show');
                    }, popupTiming);
                };
                // Removes every alert, from the popup and from the list the bell opens. Alerts are removed quietly,
                // like alert.dismiss(), unless { close: true } is passed, which fires close on each as if the user
                // closed it, such as to mark notifications read.
                webui.clearAlerts = (options = {}) => {
                    const fireClose = options?.close === true;
                    const cleared = alertList.splice(0, alertList.length);
                    cleared.forEach(alert => {
                        const wasOpen = !alert.userclosed;
                        alert.dismiss();
                        if (fireClose && wasOpen) {
                            alert.dispatchEvent(new CustomEvent('close', { bubbles: true }));
                        }
                    });
                    t.setCount(0);
                    panels.forEach(panel => panel.showEmpty());
                };
                webui.alert = async (message, variant) => {
                    await webui.addAlert(message, variant);
                };
                window.webuiAlert = webui.alert;
            }
            t.addEventListener('click', _ev => {
                if (t.hasAttribute('panel')) return true;
                if (!t.drawer) {
                    showAlertsInDialog.bind(t)();
                } else {
                    showAlertsInDrawer.bind(t)(t.drawer);
                }
                return true;
            });
            t._isCheckingCounts = true;
            setTimeout(() => t.checkCounts(), 1000);
        },
        attr: ['data-toggleclass', 'data-title', 'data-popup'],
        flags: ['panel'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'dataTitle':
                    t.alertTitle = value;
                    break;
                case 'dataPopup':
                    let timing = parseInt(value);
                    if (timing) {
                        popupTiming = timing;
                    }
                    break;
                case 'dataToggleclass':
                    t.drawer = value ? value.split('|')[0] : undefined;
                    break;
            }
        },
        setCount(value) {
            const t = this;
            const changed = t.count !== value;
            t.count = value;
            if (changed) document.dispatchEvent(new CustomEvent('webui-alerts-count', { detail: { count: value } }));
            t.icon.setAttribute('count', value === 0 ? '' : value.toLocaleString());
            if (t.count === 0) {
                t.icon.setAttribute('theme', 'info');
            } else {
                t.icon.setAttribute('theme', 'success');
            }
        },
        checkCounts() {
            const t = this;
            let newCount = 0;
            alertList.map(a => {
                if (!a.userclosed) {
                    newCount++;
                }
            });
            if (newCount != t.count) {
                t.setCount(newCount);
            }
            if (!t.isConnected) {
                t._isCheckingCounts = false;
                return;
            }
            setTimeout(() => t.checkCounts(), 1000);
        },
        triggerAlert(data, a) {
            const t = this;
            if (!data) return;
            if (!data.message || !data.show) {
                if (data.show) {
                    data.show = undefined;
                    webui.setData(alertTrigger, data);
                }
                return;
            };
            const lastTriggered = webui.hashCode(JSON.stringify(data));
            if (t._lastTrigger === lastTriggered) {
                if (data.show) {
                    data.show = undefined;
                    webui.setData(alertTrigger, data);
                }
                return;
            };
            t._lastTrigger = lastTriggered;
            let message = data.message;
            let variant = data.variant || data.theme || 'info';
            data.message = '';
            data.show = undefined;
            webui.setData(alertTrigger, data);
            webui.alert(message, variant);
            setTimeout(() => {
                if (t._lastTrigger !== lastTriggered) return;
                t._lastTrigger = undefined;
            }, 100);
        },
        /** Counts the alerts not closed again, such as after one is closed in a panel. */
        recount() {
            const t = this;
            const count = openAlerts().length;
            if (count !== t.count) t.setCount(count);
        },
        /**
         * Shows the alerts in place, for the panel flag, newest first, with Clear All above them. It is drawn once
         * and then follows each alert as it comes and goes, so the others never redraw.
         */
        renderPanel() {
            const t = this;
            if (!t.hasAttribute('panel')) return;
            if (!t._list) {
                t._head = webui.create('div', { class: 'alerts-head' });
                t._head.style.cssText = 'display:flex;justify-content:flex-end;padding:0 0 var(--padding) 0;';
                t._clearAll = webui.create('webui-button', { theme: 'secondary', label: 'Clear All', 'start-icon': 'eraser', title: 'Close every alert' });
                t._clearAll.addEventListener('click', () => t.clearAll());
                t._head.appendChild(t._clearAll);
                t._list = webui.create('section', { class: 'alerts-list', role: 'list', 'aria-label': 'Alerts' });
                t._list.style.cssText = 'display:flex;flex-direction:column;';
                t._empty = webui.create('webui-alert', { variant: 'info', show: '', fixed: '', class: 'alerts-empty' });
                t._empty.textContent = 'You have no alerts at this time.';
                // Closing an alert here slides it away, and the alerts below move up into its place.
                t.addEventListener('close', ev => {
                    const alert = ev.target;
                    if (t._clearing || !alert || alert.parentNode !== t._list || !ev.cancelable) return;
                    ev.preventDefault();
                    t.leave(alert);
                });
            }
            // An alert still popping up stays where it is seen, and moves in from there when the panel is in view.
            const popping = alert => alert.parentNode === popup && alert.hasAttribute('show');
            const alerts = openAlerts().reverse();
            const listed = alerts.filter(alert => !popping(alert));
            listed.forEach(alert => alert.setAttribute('show', true));
            t._list.replaceChildren(...listed);
            t.replaceChildren(t._head, t._list);
            t.showEmpty();
            requestAnimationFrame(() => {
                if (panelInView() !== t) return;
                alerts.filter(popping).reverse().forEach(alert => t.arrive(alert));
            });
        },
        holds(alert) {
            return !!this._list && alert.parentNode === this._list;
        },
        /** Shows the message for no alerts, or Clear All, whichever applies. */
        showEmpty() {
            const t = this;
            if (!t._list) return;
            const items = [...t._list.children].filter(el => el !== t._empty && el.localName === 'webui-alert' && !el.userclosed);
            t._clearAll.hidden = items.length === 0;
            if (items.length === 0 && t._empty.parentNode !== t._list) t._list.replaceChildren(t._empty);
            else if (items.length > 0 && t._empty.parentNode === t._list) t._empty.remove();
        },
        /** Puts an alert at the top of the list, with the others moving down to make room. */
        place(alert) {
            const t = this;
            if (!t._list || alert.userclosed) return;
            const others = [...t._list.children].filter(el => el !== alert && el !== t._empty);
            const before = topsOf(others);
            t._empty.remove();
            alert.setAttribute('show', true);
            moveQuietly(alert, el => t._list.prepend(el));
            slideFrom(before);
            t.showEmpty();
        },
        /** An alert already listed moves to the top, as a new one would. */
        toTop(alert) {
            if (this._list?.firstElementChild === alert) return;
            this.place(alert);
        },
        /**
         * A new alert moves from its popup into its place at the top of the list: left until it clears the drawer's
         * edge, up level with its place, then right into it, while the alerts below move down to make room.
         */
        async arrive(alert) {
            const t = this;
            if (!t._list || alert._arriving) return;
            if (reducedMotion()) {
                t.place(alert);
                return;
            }
            alert._arriving = true;
            const others = [...t._list.children].filter(el => el !== t._empty);
            const before = topsOf(others);
            t._empty.remove();
            const listRect = t._list.getBoundingClientRect();
            // Drawn as wide as it will be in the list, so it doesn't change shape as it lands.
            alert.style.width = `${listRect.width}px`;
            alert.style.boxSizing = 'border-box';
            const start = alert.getBoundingClientRect();
            const slot = webui.create('div', { class: 'alerts-slot', 'aria-hidden': 'true' });
            slot.style.height = `${start.height}px`;
            slot.style.margin = getComputedStyle(alert).margin;
            t._list.prepend(slot);
            t._clearAll.hidden = false;
            slideFrom(before);
            const end = slot.getBoundingClientRect();
            const edge = (t.closest('webui-drawer') || t).getBoundingClientRect().left;
            const out = Math.min(0, edge - 16 - start.right);
            const dy = end.top - start.top;
            const dx = end.left - start.left;
            await animate(alert, [
                { transform: 'translate(0, 0)' },
                { transform: `translate(${out}px, 0)`, offset: 0.3 },
                { transform: `translate(${out}px, ${dy}px)`, offset: 0.7 },
                { transform: `translate(${dx}px, ${dy}px)` },
            ], { duration: 1100, easing: 'ease-in-out' });
            alert._arriving = false;
            alert.style.removeProperty('width');
            alert.style.removeProperty('box-sizing');
            if (!slot.isConnected || alert.userclosed) {
                slot.remove();
                t.showEmpty();
                return;
            }
            moveQuietly(alert, el => slot.replaceWith(el));
            t.showEmpty();
        },
        /** A closed alert slides right and fades away, then the alerts below move up into its place. */
        async leave(alert) {
            const t = this;
            alert.userclosed = true;
            await animate(alert, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(110%)', opacity: 0 }], { duration: 250, easing: 'ease-in', fill: 'forwards' });
            const others = [...t._list.children].filter(el => el !== alert);
            const before = topsOf(others);
            alert.remove();
            alert.getAnimations?.().forEach(animation => animation.cancel());
            alert.removeAttribute('show');
            slideFrom(before);
            t.showEmpty();
            owner?.recount();
        },
        /** Clear All: every alert slides away, one just after another, and they are closed. */
        async clearAll() {
            const t = this;
            if (t._clearing) return;
            t._clearing = true;
            const items = [...t._list.children].filter(el => el !== t._empty);
            await Promise.all(items.map((alert, index) => animate(alert,
                [{ transform: 'none', opacity: 1 }, { transform: 'translateX(110%)', opacity: 0 }],
                { duration: 250, delay: index * 40, easing: 'ease-in', fill: 'forwards' })));
            webui.clearAlerts({ close: true });
            items.forEach(alert => {
                alert.remove();
                alert.getAnimations?.().forEach(animation => animation.cancel());
            });
            t._clearing = false;
            t.showEmpty();
        },
        connected() {
            const t = this;
            if (t.hasAttribute('panel')) {
                panels.add(t);
                t.renderPanel();
                return;
            }
            // These open a dialog or panel when clicked, so keyboard users need them to work as buttons too.
            if (!t.hasAttribute('role')) t.setAttribute('role', 'button');
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0');
            if (!t.hasAttribute('aria-label')) t.setAttribute('aria-label', t.getAttribute('title') || 'Notifications');
            if (!t._keyboardReady) {
                t._keyboardReady = true;
                t.addEventListener('keydown', ev => {
                    if (ev.key !== 'Enter' && ev.key !== ' ') return;
                    ev.preventDefault();
                    t.click();
                });
            }
            // The first key in data-subscribe or data-bind, without a method named after it.
            const boundKey = [t.dataset.subscribe, t.dataset.bind].filter(Boolean).join('|')
                .split('|').map(ds => ds.split(':')[0].trim()).find(Boolean);
            if (boundKey) {
                alertTrigger = boundKey;
            }
            t.dataset.subscribe = `${alertTrigger}:triggerAlert`;
        },
        disconnected() {
            panels.delete(this);
        },
        reconnected() {
            const t = this;
            if (t.hasAttribute('panel')) {
                panels.add(t);
                t.renderPanel();
                return;
            }
            if (t._isCheckingCounts) return;
            t._isCheckingCounts = true;
            t.checkCounts();
        },
        shadowTemplate: `
<webui-icon icon="circle_bell|fill|backing|bordered|shade:tri|theme:info"></webui-icon>
<slot></slot>
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:1px;
align-items:center;
justify-content:center;
}
:host([panel]) {
display:block;
cursor:auto;
padding:0;
}
:host([panel]) webui-icon {
display:none;
}
</style>
`
    });
}
