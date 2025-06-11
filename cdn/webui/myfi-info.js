/* Display button for opening MyFi Account Info panel. */
"use strict"
{
    webui.define('webui-myfi-info', {
        constructor: (t) => {
            t._icon = t.template.querySelector('webui-icon');
            t._slotContent = t.template.querySelector('slot[name="panel-content"]');
            t.addEventListener('click', ev => {
                if (ev.shiftKey) {
                    if (webui.isSignedIn) {
                        webui.setData('session-user-role', 0);
                        webui.alert('Simulated user sign-out', 'info');
                    } else {
                        webui.setData('session-user-role', 1);
                        webui.alert('Simulated user sign-in', 'info');
                    }
                    return;
                }
                if (webui.isSignedIn) {
                    let template = t._slotContent.assignedElements()[0];
                    let content = template ? template.innerHTML : `<webui-alert variant="info" show>Coming Soon!</webui-alert>`;
                    let title = t.getAttribute('header') || 'Account Panel';
                    webui.openSharedDrawer(
                        title,
                        content
                    );
                } else {
                    webui.alert('Sign-In Coming Soon!', 'info');
                }
            });
        },
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
                t.setAttribute('title', 'Signin');
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