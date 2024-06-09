/* Displays Alert icon and enables webuiAlert(message:string|html, variant:string[success|warning|danger|info]) for displaying popup alerts. */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:var(--button-padding, 0.5em 1em);
align-items:center;
justify-content:center;
}
</style>
<webui-fa icon="bell" family="solid"></webui-fa>
`;
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
            confirm: 'Close'
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

    class Alerts extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            const t = this;
            t.template = template.content.cloneNode(true);
            t.icon = t.template.querySelector('#icon');
            t.btnClose = t.template.querySelector('#close');
            if (!window.webuiAlert) {
                window.webuiAlert = (message, variant) => {
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
                    popup.appendChild(alert);
                    setTimeout(() => {
                        if (alert.parentNode === popup) {
                            alert.removeAttribute('show');
                        }
                    }, popupTiming)
                };
            }
            t.addEventListener('click', ev => {
                if (!t.drawer) {
                    showAlertsInDialog();
                } else {
                    showAlertsInDrawer(t.drawer);
                }
                return true;
            });
            shadow.appendChild(t.template);
        }
        static get observedAttributes() {
            return ['data-toggleclass', 'data-title'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            switch (property) {
                case 'data-title':
                    alertTitle = newValue;
                    break;
                case 'data-popup':
                    let timing = parseInt(newValue);
                    if (timing) {
                        popupTiming = timing;
                    }
                    break;
                case 'data-toggleclass':
                    this.drawer = newValue.split('|')[0];
                    break;
            }
        }
        setVariant(alert, variant) {
            alert.style.backgroundColor = `var(--color-${variant})`;
            alert.style.color = `var(--color-${variant}-offset)`;
            alert.className = `theme-${variant}`;
            switch (variant) {
                case "danger":
                    alert.icon.setAttribute('icon', 'hexagon-exclamation');
                    break;
                case "success":
                    alert.icon.setAttribute('icon', 'thumbs-up');
                    break;
                case "info":
                    alert.icon.setAttribute('icon', 'circle-exclamation');
                    break;
                default:
                    alert.icon.setAttribute('icon', 'triangle-exclamation');
                    break;
            }
        }
        connectedCallback() {
            if (!this.getAttribute('preload')) {
                this.setAttribute('preload', 'fa alert dialogs');
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-alerts', Alerts);
}
