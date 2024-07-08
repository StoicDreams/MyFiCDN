/* Restrict display of contents to a user role.
 - Auto-subscribes to user-role data.
 - Intended for use in .md or static html content. Do not use when dynamically creating or updating innerHTML content.
*/
"use strict"
{
    webui.define("webui-restrict-to-role", {
        constructor: (t) => {
            t._cache = t.innerHTML;
            t.innerHTML = '';
        },
        attr: ['role'],
        attrChanged: (t, _property, _value) => {
            t.checkRole();
        },
        connected: (t) => {
            t.hideContent();
            t.setAttribute('data-subscribe', 'user-role');
        },
        setUserRole: function (userRole) {
            let t = this;
            t.userRole = userRole || 0;
            t.checkRole();
        },
        checkRole: function () {
            let t = this;
            if (t.userRole === undefined || t.role === undefined) {
                t.hideContent();
                return;
            }
            let role = parseInt(t.role);
            let userRole = parseInt(t.userRole);
            if (role === 0) {
                if (userRole === 0) {
                    t.showContent();
                } else {
                    t.hideContent();
                }
            } else {
                if (userRole & role > 0) {
                    t.showContent();
                } else {
                    t.hideContent();
                }
            }
        },
        showContent: function () {
            let t = this;
            if (t._cache) {
                t.innerHTML = t._cache;
            }
            t.style.display = '';
        },
        hideContent: function () {
            let t = this;
            if (t.style.display === 'none') { return; }
            t._cache = t.innerHTML;
            t.innerHTML = '';
            t.style.display = 'none';
        }
    });
}