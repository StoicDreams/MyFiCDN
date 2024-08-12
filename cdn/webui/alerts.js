/* Displays Alert icon and enables webuiAlert(message:string|html, variant:string[success|warning|danger|info]) for displaying popup alerts. */
"use strict"
{
    const alertList = [];
    const popup = document.createElement('section');
    popup.classList.add('webui-alerts-popup');
    popup.style.display = 'block';
    popup.style.position = 'fixed';
    popup.style.bottom = 0;
    popup.style.right = 0;
    popup.style.overflow = 'visible';
    document.body.appendChild(popup);

    let alertTitle = 'Alerts';
    let popupTiming = 5000;

    function getAlertHeader() {
        const container = document.createElement('header');
        container.style.padding = 'var(--padding)';
        container.setAttribute('slot', 'header');
        container.innerHTML = alertTitle;
        return container;
    }

    function getAlertContent() {
        const container = document.createElement('section');
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
        webuiDialog({
            title: getAlertHeader(),
            content: getAlertContent(),
            confirm: 'Close',
        });
    }

    function showAlertsInDrawer(drawer) {
        let el = document.querySelector(drawer);
        if (!el) {
            showAlertsInDialog();
            return;
        }
        if (el.classList.contains('open')) {
            el.classList.remove('open');
            setTimeout(() => showAlertsInDrawer(drawer), 500);
            return;
        }
        el.innerHTML = '';
        el.appendChild(getAlertHeader());
        el.appendChild(getAlertContent());
        setTimeout(() => {
            el.classList.add('open');
        }, 100);
    }

    webui.define("webui-alerts", {
        "preload": "icon alert dialogs",
        constructor: (t) => {
            t.count = 0;
            t.icon = t.template.querySelector('webui-icon');
            t.btnClose = t.template.querySelector('#close');
            if (!window.webuiAlert) {
                webui.alert = (message, variant) => {
                    let alert = document.createElement('webui-alert');
                    if (message.nodeName) {
                        alert.appendChild(message);
                    } else {
                        alert.innerHTML = message;
                    }
                    alert.setAttribute('variant', variant || 'danger');
                    alert.setAttribute('show', true);
                    alert.userclosed = false;
                    alertList.push(alert);
                    t.count += 1;
                    t.icon.setAttribute('count', t.count.toLocaleString());
                    popup.appendChild(alert);
                    setTimeout(() => {
                        if (alert.parentNode === popup) {
                            alert.removeAttribute('show');
                        }
                    }, popupTiming)
                };
                window.webuiAlert = webui.alert;
            }
            t.addEventListener('click', _ev => {
                if (!t.drawer) {
                    showAlertsInDialog();
                } else {
                    showAlertsInDrawer(t.drawer);
                }
                return true;
            });
            setTimeout(() => t.checkCounts(), 1000);
        },
        attr: ['data-toggleclass', 'data-title'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'dataTitle':
                    alertTitle = value;
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
        checkCounts: function () {
            let newCount = 0;
            alertList.map(a => {
                if (!a.userclosed) {
                    newCount++;
                }
            });
            if (newCount != this.count) {
                this.count = newCount;
                this.icon.setAttribute('count', newCount === 0 ? '' : newCount.toLocaleString());
            }
            setTimeout(() => this.checkCounts(), 1000);
        },
        shadowTemplate: `
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:1px;
align-items:center;
justify-content:center;
}
</style>
<webui-icon icon="bell"></webui-icon>
`
    });
}
