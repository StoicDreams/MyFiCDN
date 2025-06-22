/* Display button for opening MyFi Account Info panel. */
"use strict"
{
    const domain = location.hostname;
    const flowGrow = `
<webui-flex grow></webui-flex>`;
    const signoutContent = `
<webui-button name="signout" theme="danger">Sign-Out</webui-button>`;
    function isLocalHost() {
        if (domain === 'localhost') return true;
        if (parseInt(domain).toString() !== 'NaN') return true;
        return false;
    }
    webui.define('webui-myfi-info', {
        constructor: (t) => {
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
                    if (excludes.indexOf('signout') === -1) {
                        content = `${content}${signoutContent}`;
                    }
                    let title = t.getAttribute('header') || 'Account Panel';
                    content = await webui.openSharedDrawer(
                        title,
                        content
                    );
                    if (excludes.indexOf('signout') === -1) {
                        let btnSignout = content.querySelector('[name="signout"]');
                        btnSignout.addEventListener('click', async _ => {
                            if (isLocalHost()) {
                                webui.setData('session-user-role', 0);
                            } else {
                                await webui.fetchApi('user/signout');
                                await webui.loadRoles();
                            }
                            webui.closeSharedDrawer();
                            webui.alert('You have been signed out.', 'success');
                        });
                    }
                } else {
                    if (isLocalHost()) {
                        webui.setData('session-user-role', 1);
                        webui.alert('Simulated sign-in for LocalHost testing.', 'success');
                    } else {
                        location.href = `https://www.stoicdreams.com/signin?domain=${domain}`;
                    }
                }
            });
        },
        attr: ['exclude'],
        connected: function (t) {
            t.setupComponent();
        },
        setupComponent: function () {
            const t = this;
            t.addDataset('subscribe', 'session-user-role:render');
            t.render();
        },
        render: function () {
            const t = this;
            if (t._lastRender == webui.isSignedIn) return;
            let isSignedIn = webui.isSignedIn;
            t._lastRender = isSignedIn;
            if (isSignedIn) {
                t._icon.setAttribute('icon', 'account');
                t._icon.setAttribute('theme', 'success');
                t.setAttribute('title', 'Toggle Account Panel');
            } else {
                t._icon.setAttribute('icon', 'signin');
                t._icon.setAttribute('theme', 'warning');
                t.setAttribute('title', 'Sign-In through Stoic Dreams account');
            }
        },
        shadowTemplate: `
<webui-icon icon="signin" fill></webui-icon>
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