/*!
 * Web UI Restrict To Role - https://webui.stoicdreams.com
 * A component for restricting content visibility based on user roles.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-restrict-to-role", {
        content: false,
        constructor: (t) => {
            t._slotValid = t.template.querySelector('slot[name="valid"]');
            t._slotInvalid = t.template.querySelector('slot[name="invalid"]');
        },
        attr: ['role'],
        attrChanged: (t, _property, _value) => {
            t.checkRole();
        },
        connected: (t) => {
            t.addDataset('subscribe', 'session-user-role:setUserRole');
            t.checkRole();
        },
        setSessionUserRole: function (userRole) {
            this.setUserRole(userRole);
        },
        setUserRole: function (userRole) {
            const t = this;
            t.userRole = userRole || 0;
            t.checkRole();
        },
        checkRole: function () {
            const t = this;
            if (t.userRole === undefined || t.role === undefined) {
                t.showInvalid();
                return;
            }
            let role = parseInt(t.role);
            let userRole = parseInt(t.userRole);
            if (role === 0) {
                if (userRole === 0) {
                    t.showValid();
                } else {
                    t.showInvalid();
                }
            } else {
                if (userRole & role > 0) {
                    t.showValid();
                } else {
                    t.showInvalid();
                }
            }
        },
        showValid: function () {
            const t = this;
            if (t._showing === 'content') return;
            t._showing = 'content';
            webui.removeChildren(t, ch => !ch.hasAttribute || !ch.hasAttribute('slot'));
            let html = webui.getHtmlFromTemplate(t._slotValid);
            webui.transferChildren(webui.create('div', { html: html }), t);
        },
        showInvalid: function () {
            const t = this;
            if (t._showing === 'invalid') return;
            t._showing = 'invalid';
            webui.removeChildren(t, ch => !ch.hasAttribute || !ch.hasAttribute('slot'));
            let html = webui.getHtmlFromTemplate(t._slotInvalid);
            webui.transferChildren(webui.create('div', { html: html }), t);
        },
        shadowTemplate: `
<slot name="valid"></slot>
<slot name="invalid"></slot>
<slot></slot>
<style type="text/css">
slot[name] {display:none;}
</style>
`
    });
}