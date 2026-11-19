/*!
 * Web UI Alerts - https://webui.stoicdreams.com/components#webui-alerts
 * Displays Alert icon and enables webui.alert(message:string|html, variant:string[success|warning|danger|info]) for displaying popup alerts,
 * webui.addAlert(message, variant, { popup }) which resolves to the alert, and webui.clearAlerts({ close }) which removes them all.
 * With the panel flag it shows the list of alerts in place, such as in a tab, rather than a bell. Whenever the number of
 * alerts not closed changes, the document gets a webui-alerts-count event with { count } in its detail.
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
    popup.style.display = 'block';
    popup.style.position = 'fixed';
    popup.style.bottom = '30px';
    popup.style.right = 0;
    popup.style.overflow = 'visible';
    document.body.appendChild(popup);

    let popupTiming = 5000;

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
            container.innerHTML = '<webui-alert variant="info" show>You have no alerts at this time.</webui-alert>';
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
            if (!window.webuiAlert) {
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
                        if (!showPopup) return alert;
                        popup.appendChild(alert);
                        alert.display();
                        setTimeout(() => {
                            if (alert.parentNode === popup) {
                                alert.removeAttribute('show');
                            }
                        }, popupTiming);
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
                    if (!showPopup) return alert;
                    popup.appendChild(alert);
                    setTimeout(() => {
                        if (alert.parentNode === popup) {
                            alert.removeAttribute('show');
                        }
                    }, popupTiming);
                    return alert;
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
                    t.drawer = value.split('|')[0];
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
        /** Shows the alerts in place, for the panel flag, and again whenever how many there are changes. */
        renderPanel() {
            const t = this;
            if (!t.hasAttribute('panel')) return;
            t.replaceChildren(getAlertContent());
        },
        connected() {
            const t = this;
            if (t.hasAttribute('panel')) {
                t._panelListener ??= () => t.renderPanel();
                document.addEventListener('webui-alerts-count', t._panelListener);
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
            if (t.dataset.subscribe) {
                alertTrigger = t.dataset.subscribe;
            };
            t.dataset.subscribe = `${alertTrigger}:triggerAlert`;
        },
        disconnected() {
            if (this._panelListener) document.removeEventListener('webui-alerts-count', this._panelListener);
        },
        reconnected() {
            const t = this;
            if (t.hasAttribute('panel')) {
                document.addEventListener('webui-alerts-count', t._panelListener);
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
