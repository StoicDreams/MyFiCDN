/* Display navigation links from a list */
"use strict"
{
    const show = {};
    webui.define('webui-nav', {
        preload: 'fa paper nav-group nav-link',
        attr: ['routes', 'nav-routes'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'routes':
                    t.loadRoutes(value);
                    break;
                case 'navRoutes':
                    t.buildNav(value);
                    break;
            }
        },
        connected: (t) => {
            t.userRole = 0;
            t.addDataset('subscribe', 'session-user-role:setUserRole');
            t._buildNav();
        },
        setUserRole: function (userRole) {
            const t = this;
            t.userRole = userRole || 0;
            t._buildNav();
        },
        setNavRoutes: function (data) {
            this.buildNav(data);
        },
        loadRoutes: async function (url) {
            if (!url) return;
            let loaded = await fetch(url);
            if (!loaded.ok) return;
            let data = await loaded.text();
            this.buildNav(data);
        },
        buildLink: function (parent, link) {
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
                    show[link.name] = true;
                }
                if (show[link.name]) {
                    if (typeof el.setShow === 'function') {
                        el.setShow(true);
                    } else {
                        setTimeout(() => {
                            el.setShow(true);
                        }, 100);
                    }
                }
                el.addEventListener('change', _ => {
                    show[link.name] = el.isOpen;
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
        buildNav: function (navJson) {
            if (!navJson) return;
            let nav = typeof navJson === 'string' ? JSON.parse(navJson) : typeof navJson.forEach === 'function' ? navJson : [];
            const t = this;
            t._navData = nav;
            t._buildNav();
        },
        _buildNav: function () {
            const t = this;
            let nav = t._navData;
            if (!nav) return;
            t.innerHTML = '';
            t.classList.add('building');
            nav.forEach(link => {
                t.buildLink(t, link);
            });
            t.classList.remove('building');
        }
    });

}