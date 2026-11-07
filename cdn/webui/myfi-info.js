/*!
 * Web UI MyFi Info - https://webui.stoicdreams.com/components#webui-myfi-info
 * Display button for opening My Fidelity Account Info panel.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const domain = location.hostname;
    const flowGrow = `
<webui-flex grow></webui-flex>`;
    const panelBottomButtons = [
        {
            name: 'site-settings', theme: 'info', display: 'Site Settings', click: _ => {
                webui.closeSharedDrawer();
                webui.dialog({
                    title: 'Site Settings',
                    minWidth: '80%',
                    content: '<webui-site-settings></webui-site-settings>',
                    cancel: null,
                    confirm: 'Close'
                });
            }
        },
        {
            name: 'signout', theme: 'danger', display: 'Sign-Out', click: async _ => {
                webui.closeSharedDrawer();
                if (webui.isLocalhost) {
                    webui.setData('session-user-role', 0);
                } else {
                    await webui.fetchApi('user/signout');
                    await webui.loadRoles();
                }
                webui.alert('You have been signed out.', 'success');
            }
        },
    ];
    if (webui.isLocalhost) {
        panelBottomButtons.push({
            name: 'dev', theme: 'warning', display: 'Dev Settings', click: _ => {
                webui.closeSharedDrawer();
                webui.dialog({
                    title: 'Developer Settings',
                    minWidth: '80%',
                    content: '<webui-myfi-dev-settings></webui-myfi-dev-settings>',
                    cancel: null,
                    confirm: 'Close'
                });
            }
        });
    }
    webui.define('webui-myfi-info', {
        constructor() {
            const t = this;
            t._icon = t.template.querySelector('webui-icon');
            t._slotContent = t.template.querySelector('slot[name="panel-content"]');
            t.addEventListener('click', async ev => {
                ev.stopPropagation();
                ev.preventDefault();
                if (webui.isSignedIn) {
                    let template = t._slotContent.assignedElements()[0];
                    let content = template ? template.innerHTML : `<webui-alert variant="info" show>Coming Soon!</webui-alert>`;
                    let excludes = (t.exclude || '').split('|').map(e => e.trim());
                    if (excludes.indexOf('grow') === -1) {
                        content = `${content}${flowGrow}`;
                    }
                    let title = t.getAttribute('header') || 'Account Panel';
                    content = await webui.openSharedDrawer(
                        title,
                        content
                    );
                    if (!content) return;
                    panelBottomButtons.map(cfg => {
                        if (excludes.indexOf(cfg.name) === -1) {
                            var btn = webui.create('webui-button', { theme: cfg.theme, name: cfg.name, html: cfg.display });
                            btn.addEventListener('click', cfg.click);
                            content.appendChild(btn);
                        }
                    });
                } else {
                    if (webui.isLocalhost) {
                        webui.setData('session-user-role', 1);
                        webui.alert('Simulated sign-in for LocalHost testing.', 'success');
                    } else {
                        location.href = `https://www.stoicdreams.com/signin?domain=${domain}`;
                    }
                }
            });
        },
        attr: ['exclude'],
        connected() {
            this.setupComponent();
        },
        setupComponent() {
            const t = this;
            // This opens the sign-in or account panel when clicked, so keyboard users need it to work as a button too.
            if (!t.hasAttribute('role')) t.setAttribute('role', 'button');
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0');
            if (!t._keyboardReady) {
                t._keyboardReady = true;
                t.addEventListener('keydown', ev => {
                    if (ev.key !== 'Enter' && ev.key !== ' ') return;
                    ev.preventDefault();
                    t.click();
                });
            }
            t.addDataset('subscribe', 'session-user-role:render');
            t.render();
        },
        render() {
            const t = this;
            if (t._lastRender == webui.isSignedIn) return;
            let isSignedIn = webui.isSignedIn;
            t._lastRender = isSignedIn;
            if (isSignedIn) {
                t._icon.setAttribute('icon', 'person|fill|bordered|shade:tri|shape:circle|backing|rotate:0');
                t._icon.setAttribute('theme', 'success');
                t.setAttribute('title', 'Toggle Account Panel');
            } else {
                t._icon.setAttribute('icon', 'arrow-side-into-square|rotate:180');
                t._icon.setAttribute('theme', 'warning');
                if (webui.isLocalhost) {
                    t.setAttribute('title', 'Simulate Sign-In for Dev Testing');
                } else {
                    t.setAttribute('title', 'Sign-In through Stoic Dreams account');
                }
            }
            // The button's name follows its title, which changes when the visitor signs in or out.
            t.setAttribute('aria-label', t.getAttribute('title'));
        },
        shadowTemplate: `
<webui-icon icon="arrow-side-into-square|rotate:180" fill></webui-icon>
<slot name="panel-content"></slot>
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