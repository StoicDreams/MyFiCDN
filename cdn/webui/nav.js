/*!
 * Web UI Nav - https://webui.stoicdreams.com/components#webui-nav
 * A component for displaying and managing navigation links within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const show = {};
    const sessionKey = 'session-nav-show';
    webui.define('webui-nav', {
        preload: 'fa paper nav-group nav-link',
        attr: ['routes', 'nav-routes'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'routes':
                    t.loadRoutes(value);
                    break;
                case 'navRoutes':
                    t.buildNav(value);
                    break;
            }
        },
        connected() {
            const t = this;
            t.userRole = 0;
            t.addDataset('subscribe', 'session-user-role:setUserRole');
            t._buildNav();
            let cachedShow = webui.getData(sessionKey);
            if (!cachedShow) return;
            Object.keys(cachedShow).forEach(key => {
                show[key] = cachedShow[key];
            });
        },
        setUserRole(userRole) {
            const t = this;
            t.userRole = userRole || 0;
            t._buildNav();
        },
        setNavRoutes(data) {
            this.buildNav(data);
        },
        async loadRoutes(url) {
            if (!url) return;
            let loaded = await fetch(url);
            if (!loaded.ok) return;
            let data = await loaded.text();
            this.buildNav(data);
        },
        buildLink(parent, link) {
            const t = this;
            let el = null;
            if (link.role && link.role > 0 && (link.role & t.userRole) === 0) {
                return;
            }
            if (link.url) {
                el = webui.create('webui-nav-link');
                el.setAttribute('url', link.url);
            } else if (link.children) {
                el = webui.create('webui-nav-group');
                if (show[link.name] === undefined) {
                    show[link.name] = false;
                }
                if (show[link.name]) {
                    setTimeout(async () => {
                        while (el.parentNode && typeof el.setShow !== 'function') {
                            await webui.wait(100);
                        }
                        if (typeof el.setShow === 'function') {
                            el.setShow(true);
                        }
                    }, 100);
                }
                el.addEventListener('change', _ => {
                    show[link.name] = el.isOpen;
                    webui.setData(sessionKey, show);
                });
                link.children.forEach(child => {
                    t.buildLink(el, child);
                });
            } else {
                console.error('Invalid nav item', link);
                return;
            }
            if (link.icon) {
                el.setAttribute('icon', link.icon);
                if (link.iconFamily) {
                    el.setAttribute('family', link.iconFamily);
                }
            }
            el.setAttribute('name', link.name);
            parent.appendChild(el);
        },
        buildNav(navJson) {
            if (!navJson) return;
            let nav = typeof navJson === 'string' ? JSON.parse(navJson) : typeof navJson.forEach === 'function' ? navJson : [];
            const t = this;
            t._navData = nav;
            t._buildNav();
        },
        _buildNav() {
            const t = this;
            let nav = t._navData;
            if (!nav) return;
            t.classList.add('building');
            t.innerHTML = '';
            nav.forEach(link => {
                t.buildLink(t, link);
            });
            setTimeout(() => {
                t.classList.remove('building');
            }, 100);
        }
    });

}