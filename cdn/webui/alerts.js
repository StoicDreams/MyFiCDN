/*!
 * Web UI Alerts - https://webui.stoicdreams.com/components#webui-alerts
 * Displays Alert icon and enables webui.alert(message:string|html, variant:string[success|warning|danger|info]) for displaying popup alerts.
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
        constructor: (t) => {
            t.count = 0;
            t.icon = t.template.querySelector('webui-icon');
            if (!window.webuiAlert) {
                webui.alert = async (message, variant) => {
                    const msg = message.nodeName ? message.innerText : message;
                    const hc = await webui.hashSHA256(`${variant}-${msg}`);
                    let index = -1;
                    alertList.forEach(al => {
                        index++;
                        if (!al.userclosed) return;
                        alertList.splice(index, 1);
                        index--;
                        al.remove();
                    });
                    let alert = alertList.filter(i => i._hashCode === hc)[0];
                    if (alert) {
                        alert.increment();
                        popup.appendChild(alert);
                        alert.display();
                        setTimeout(() => {
                            if (alert.parentNode === popup) {
                                alert.removeAttribute('show');
                            }
                        }, popupTiming);
                        return;
                    }
                    alert = webui.create('webui-alert');
                    alert._hashCode = hc;
                    if (message.nodeName) {
                        alert.appendChild(message);
                    } else {
                        alert.innerHTML = message;
                    }
                    alert.setAttribute('variant', variant || 'danger');
                    alert.display();
                    alert.style.margin = '0 10px 10px 0'
                    alert.userclosed = false;
                    alertList.push(alert);
                    t.setCount(t.count + 1);
                    popup.appendChild(alert);
                    setTimeout(() => {
                        if (alert.parentNode === popup) {
                            alert.removeAttribute('show');
                        }
                    }, popupTiming);
                };
                window.webuiAlert = webui.alert;
            }
            t.addEventListener('click', _ev => {
                if (!t.drawer) {
                    showAlertsInDialog.bind(t)();
                } else {
                    showAlertsInDrawer.bind(t)(t.drawer);
                }
                return true;
            });
            setTimeout(() => t.checkCounts(), 1000);
        },
        attr: ['data-toggleclass', 'data-title'],
        attrChanged: (t, property, value) => {
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
        setCount: function (value) {
            this.count = value;
            this.icon.setAttribute('count', value === 0 ? '' : value.toLocaleString());
            if (this.count === 0) {
                this.icon.setAttribute('theme', 'info');
            } else {
                this.icon.setAttribute('theme', 'success');
            }
        },
        checkCounts: function () {
            let newCount = 0;
            alertList.map(a => {
                if (!a.userclosed) {
                    newCount++;
                }
            });
            if (newCount != this.count) {
                this.setCount(newCount);
            }
            setTimeout(() => this.checkCounts(), 1000);
        },
        triggerAlert: function (data, a) {
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
            t._lastTrigger =
                data.message = '';
            data.show = undefined;
            webui.setData(alertTrigger, data);
            webui.alert(message, variant);
            setTimeout(() => {
                if (t._lastTrigger !== lastTriggered) return;
                t._lastTrigger = undefined;
            }, 100);
        },
        connected: function (t) {
            if (t.dataset.subscribe) {
                alertTrigger = t.dataset.subscribe;
            };
            t.dataset.subscribe = `${alertTrigger}:triggerAlert`;
        },
        shadowTemplate: `
<webui-icon icon="bell|fill|shade:tri|theme:info"></webui-icon>
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:1px;
align-items:center;
justify-content:center;
}
</style>
`
    });
}
