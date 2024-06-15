/* Wrapper element for application - contains several app-level features for managing state and transferring data between elements within the app */
"use strict"
{
    const markdownOptions = {
        gfm: true,
    };
    const appData = {
        'app-name': 'App',
        'company-singular': 'Company',
        'company-possessive': `Company's`,
        'page-title': '',
        'page-subtitle': '',
        'domain': location.hostname.toLowerCase()
    };
    const appSettings = {
        rootPage: 'root',
        contentExtension: '.md',
        pageContentEndpoint: '/d/en-US',
        pageDataEndpoint: 'https://api.myfi.ws/data/page/',
        encryptPageContent: false,
        encryptPageData: 'base64'
    };
    function applyAppDataToContent(content) {
        Object.keys(appData).forEach(key => {
            let rkey = `{${key.replace(/-/g, '_').toUpperCase()}}`;
            let val = appData[key];
            let limit = 0;
            while (content.indexOf(rkey) !== -1 && limit < 1000) {
                ++limit;
                content = content.replace(rkey, val);
            }
        });
        return marked.parse(content, markdownOptions);
    }
    window.webuiApplyAppData = applyAppDataToContent;
    //storage_accepted
    {
        function getStorage() {
            if (localStorage.storage_accepted) return localStorage;
            return sessionStorage;
        }
        function getNodeKey(node) {
            let segments = [];
            segments.push(node.nodeName.toLowerCase());
            if (node.classList.length) {
                segments.push(node.classList[0]);
            }
            ['id', 'name'].forEach(attr => {
                let val = node.attributes[attr];
                if (val && val.value) {
                    segments.join(`${attr}-${val.value}`);
                }
            });
            return segments.join('_');
        }
        function saveState(node) {
            let storage = getStorage();
            let key = getNodeKey(node);
            let state = {};
            node.dataset.state.split('|').forEach(attr => {
                let val = node.attributes[attr];
                if (val && val.value && val.value !== 'undefined') {
                    state[attr] = val.value;
                }
            });
            storage[key] = JSON.stringify(state);
        }
        function loadState(node) {
            let storage = getStorage();
            let key = getNodeKey(node);
            if (!storage[key]) return;
            let state = JSON.parse(storage[key]);
            node.dataset.state.split('|').forEach(attr => {
                if (state[attr]) {
                    node.setAttribute(attr, state[attr]);
                }
            });
        }
        function checkNodes(nodes) {
            if (nodes.length === 0) return;
            nodes.forEach(node => {
                if (node.dataset && node.dataset.state) {
                    loadState(node);
                }
                checkNodes(node.childNodes);
            });
        }
        function applyDataHide() {
            document.querySelectorAll('[data-hide]').forEach(el => {
                let sel = el.dataset.hide;
                if (!sel) return;
                let found = document.querySelector(sel);
                el.style.display = found ? '' : 'none';
            });
        }
        const observerDataStates = (domNode) => {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(function (mutation) {
                    if (mutation.target && mutation.target.dataset && mutation.target.dataset.state) {
                        saveState(mutation.target);
                    }
                    Array.from(mutation.addedNodes).forEach(el => {
                        if (el.dataset && el.dataset.state) {
                            loadState(el);
                        }
                    });
                });
                applyDataHide();
            });
            observer.observe(domNode, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true,
            });
            return observer;
        };
        observerDataStates(document.body);
        checkNodes(document.childNodes);
        applyDataHide();
    }
    // Data signalling/transfers
    {
        function handleDataClick(ev) {
            let key = ev.dataset.click;
            if (!key) { return; }
            document.querySelectorAll(`[data-subscribe="${key}"][data-set="click"]`).forEach(sub => {
                sub.click();
            });
        }
        function handleDataTrigger(ev) {
            let el = ev.srcElement || ev.target;
            let key = el.dataset.trigger;
            if (!key) return;
            let value = el.value;
            dataChanged(key, value);
        }
        function setDataToEl(el, key) {
            let toSet = el.dataset.set || key;
            let value = appData[key];
            if (value === null || value === undefined) return;
            switch (toSet) {
                case 'innerText':
                    el.innerText = appData[key];
                    break;
                case 'innerHTML':
                    el.innerHTML = appData[key];
                    break;
                default:
                    el.setAttribute(toSet, appData[key]);
                    break;
            }
        }
        function camelToSnake(key) {
            return key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        }
        function dataChanged(key, value) {
            key = camelToSnake(key);
            if (value === null || value === undefined) {
                delete appData[key];
            } else {
                appData[key] = typeof value === 'string' ? value : JSON.stringify(value);
            }
            document.querySelectorAll(`[data-subscribe="${key}"]`).forEach(sub => {
                setDataToEl(sub, key);
            });
        }
        window.webuiSetData = dataChanged;
        function toggleAttr(el, attr) {
            if (el.getAttribute(attr)) {
                el.removeAttribute(attr);
            } else {
                el.setAttribute(attr, true);
            }
        }
        function toggleClass(el, cls) {
            if (el.classList.contains(cls)) {
                el.classList.remove(cls);
            } else {
                el.classList.add(cls);
            }
        }
        function removeClass(el, cls) {
            if (el.classList.contains(cls)) {
                el.classList.remove(cls);
            }
        }
        function setAttr(el, attr, val) {
            el.setAttribute(attr, val);
        }
        function changePage(url) {
            window.history.pushState(appData, document.title, url);
            loadPage(url);
        }
        window.addEventListener('popstate', ev => {
            if (ev.state) {
                console.log("TODO: handle history updates", ev);
            }
        });
        document.body.addEventListener('input', handleDataTrigger);
        document.body.addEventListener('change', handleDataTrigger);
        document.body.addEventListener('click', ev => {
            let target = ev.target;
            while (target !== document.body) {
                let href = target.getAttribute('href');
                if (target.dataset.click) {
                    handleDataClick(target);
                    ev.stopPropagation();
                    ev.preventDefault();
                    return false;
                }
                if (href && target.getAttribute('target') !== 'blank' && (href[0] === '/' || href.substr(0, 4) !== 'http')) {
                    changePage(href);
                    ev.stopPropagation();
                    ev.preventDefault();
                    return false;
                }
                if (target.hasAttribute('data-stopclick')) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    return false;
                }
                if (target.dataset.setattr) {
                    let [val, attr, sel] = target.dataset.setattr.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => {
                            setAttr(el, attr, val);
                        });
                    } else {
                        setAttr(target, attr, val);
                    }
                    us();
                    break;
                }
                if (target.dataset.toggleclass) {
                    let [cls, sel] = target.dataset.toggleclass.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => toggleClass(el, cls));
                    } else {
                        toggleClass(target, cls);
                    }
                    us();
                    break;
                }
                if (target.dataset.removeclass) {
                    target.dataset.removeclass.split(';').forEach(ds => {
                        let [cls, sel] = ds.split('|').reverse();
                        if (sel) {
                            document.querySelectorAll(sel).forEach(el => removeClass(el, cls));
                        } else {
                            removeClass(target, cls);
                        }
                    });
                    us();
                }
                if (target.dataset.toggleattr) {
                    let [attr, sel] = target.dataset.toggleattr.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => toggleAttr(el, attr));
                    } else {
                        toggleAttr(target, attr);
                    }
                    us();
                    break;
                }
                target = target.parentNode;
            }
        });

        const observeDataSubscriptions = (domNode) => {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(function (mutation) {
                    Array.from(mutation.addedNodes).forEach(el => {
                        if (!el || !el.getAttribute) return;
                        let dataKey = el.getAttribute('data-subscribe');
                        if (!dataKey) return;
                        setDataToEl(el, dataKey);
                    });
                });
            });
            observer.observe(domNode, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true,
            });
            return observer;
        };
        observeDataSubscriptions(document.body);
        document.querySelectorAll('[data-subscribe]').forEach(el => {
            let key = el.dataset.subscribe;
            setDataToEl(el, key);
        })
    }
    function transitionDelay(ms) {
        return new Promise((resolve, _) => {
            setTimeout(() => resolve(), ms);
        });
    }
    async function loadPage() {
        let page = location.pathname === '/' ? '/' + appSettings.rootPage : location.pathname;
        let url = page + location.search;
        let dataUrl = encryptUrl(url, appSettings.encryptPageData);
        let contentUrl = encryptUrl(url, appSettings.encryptPageContent);
        let fullContentUrl = `${appSettings.pageContentEndpoint}${contentUrl}${appSettings.contentExtension}`;
        let fetchContent = fetch(fullContentUrl);
        let fetchData = fetch(`${appSettings.pageDataEndpoint}${dataUrl}`);
        appSettings.app.main.classList.add('transition');
        let timerStart = Date.now();
        try {
            let contentResult = await fetchContent;
            if (!contentResult.ok) {
                throw Error("Returned page content was not ok");
            }
            let body = await contentResult.text();
            let elapsed = Date.now() - timerStart;
            if (elapsed < 300) {
                await transitionDelay(300 - elapsed);
            }
            appSettings.app.setPageContent(body, fullContentUrl);
        } catch (ex) {
            console.error('Failed loading page content', ex);
            let elapsed = Date.now() - timerStart;
            if (elapsed < 300) {
                await transitionDelay(300 - elapsed);
            }
            appSettings.app.setPageContent('<webui-page-not-found></webui-page-not-found>');
        }
        try {
            let dataResult = await fetchData;
            if (!dataResult.ok) {
                throw Error("Returned page data was not ok");
            }
            let data = await dataResult.json();
        } catch (ex) {
            console.error('Failed loading page data', ex);
        }
        let elapsed = Date.now() - timerStart;
        if (elapsed < 300) {
            await transitionDelay(300 - elapsed);
        } else {
            await transitionDelay(100);
        }
        appSettings.app.main.classList.remove('transition');
    }
    function encryptUrl(url, encryption) {
        if (!encryption) return url;
        switch (encryption) {
            case 'base64':
                return btoa(url);
            default:
                return url;
        }
    }
    // Web component
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
background-color: var(--site-background-color, white);
color: var(--site-background-offset, black);
display: grid;
grid-template-columns: min-content auto min-content;
grid-template-rows: min-content min-content auto min-content min-content;
position: fixed;
left: 0;
top: 0;
width: 100%;
height: 100%;
max-width: 100%;
max-height: 100%;
overflow: hidden;
}
::slotted([slot="header"]) {
grid-row: 2;
grid-column: 2;
display: flex!important;
align-items: start;
justify-items: start;
font-size: 1.2rem;
gap:var(--padding, 1em);
padding:var(--padding,1em);
height:min-content;
max-height:min-content;
}
::slotted([slot="footer"]) {
grid-row: 4;
grid-column: 2;
display: flex!important;
font-size: 0.8rem;
align-items:center;
padding:var(--padding, 1em);
vertical-align:middle;
gap:var(--padding, 1em);
height:min-content;
max-height:min-content;
}
::slotted([slot="left"]) {
grid-column: 1;
z-index: 10;
}
::slotted([slot="right"]) {
grid-column: 3;
z-index: 11;
}
::slotted([slot="bottom"]) {
height:min-content;
grid-row: 5;
z-index: 12;
}
::slotted([slot="top"]) {
height:min-content;
grid-row: 1;
z-index: 13;
}
::slotted([slot="left"]),
::slotted([slot="right"]) {
max-width: calc(0.5 * var(--window-width));
grid-row: 2/5;
display: flex!important;
flex-direction: column;
}
::slotted([slot="top"]),
::slotted([slot="bottom"]) {
max-height: calc(0.5 * var(--window-height));
grid-column: 2;
}
::slotted(:not([slot])) {
}
main {
display:block;
overflow:auto;
box-sizing:border-box;
height:var(--main-height);
flex-grow:1;
padding:var(--padding,1em);
grid-row: 3;
grid-column: 2;
transition:
opacity 0.4s ease-out,
transform 0.4s ease-out
;
}
main.transition {
transform:rotateY(90deg);
opacity:0;
}
</style>
<slot name="header"></slot>
<main><slot></slot></main>
<slot name="footer"></slot>
<slot name="left"></slot>
<slot name="right"></slot>
<slot name="top"></slot>
<slot name="bottom"></slot>
<webui-dialogs></webui-dialogs>
`;
    let _adsrCache = '';
    let us = () => { };
    window.addEventListener('resize', _ev => {
        us();
    });
    class App extends HTMLElement {
        constructor() {
            super();
            appSettings.app = this;
            const shadow = this.attachShadow({ mode: 'open' });
            this.dynstyles = document.createElement('style');
            this.dynstyles.setAttribute('type', 'text/css');
            this.template = template.content.cloneNode(true);
            this.headerSlot = this.template.querySelector('slot[name=header]');
            this.footerSlot = this.template.querySelector('slot[name=footer]');
            this.leftPanelSlot = this.template.querySelector('slot[name=left]');
            this.rightPanelSlot = this.template.querySelector('slot[name=right]');
            this.topPanelSlot = this.template.querySelector('slot[name=top]');
            this.bottomPanelSlot = this.template.querySelector('slot[name=bottom]');
            this.main = this.template.querySelector('main');
            this.mainSlot = this.template.querySelector('main>slot');
            shadow.appendChild(this.template);
            document.head.appendChild(this.dynstyles);
            if (!this.getAttribute('preload')) {
                this.setAttribute('preload', 'dialogs');
            }
            us = () => { this.applyDynamicStyles(); };
            this.applyDynamicStylesTimer();
            setTimeout(() => loadPage(), 10);
        }
        static get observedAttributes() {
            return ['page-content', 'page-data', 'page-content-encrypt', 'page-data-encrypt', 'root-page', 'content-extension'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'root-page':
                    appSettings.rootPage = newValue;
                    break;
                case 'content-extension':
                    appSettings.contentExtension = newValue;
                    break;
                case 'page-content':
                    appSettings.pageContentEndpoint = newValue;
                    break;
                case 'page-data':
                    appSettings.pageDataEndpoint = newValue;
                    break;
                case 'page-data-encrypt':
                    appSettings.encryptPageData = newValue;
                    break;
                case 'page-content-encrypt':
                    appSettings.encryptPageContent = newValue;
                    break;
            }
        }
        setPageContent(content, source) {
            if (!window.marked) {
                setTimeout(() => this.setPageContent(content), 10);
                return;
            }
            this.mainSlot.assignedElements().forEach(node => {
                node.remove();
            });
            // Clear page data
            Object.keys(appData).forEach(key => {
                if (key.startsWith('page-')) {
                    webuiSetData(key, '');
                }
            });
            if (content.startsWith(`<!DOCTYPE`)) {
                console.error('Invalid page content loaded:', source);
                return;
            }
            content = applyAppDataToContent(content);
            let temp = document.createElement('div');
            temp.innerHTML = content;
            temp.childNodes.forEach(node => {
                this.appendChild(node);
            });
        }
        connectedCallback() { }
        disconnectedCallback() { }
        getSlot(name) {
            let node = null;
            this.childNodes.forEach(n => {
                if (n.slot === name) {
                    node = n;
                }
            })
            return node;
        }
        setBodyClasses() {
            let winWidth = window.innerWidth;
            // Flag general width by class
            let w = winWidth > 3800 ? 'w-4k'
                : winWidth > 3400 ? 'w-wqhd'
                    : winWidth > 2500 ? 'w-qhd'
                        : winWidth > 1900 ? 'w-fhd'
                            : winWidth > 1500 ? 'w-hdp'
                                : winWidth > 1300 ? 'w-hd'
                                    : winWidth > 500 ? 'w-tab'
                                        : 'w-mob'
                ;
            let hasClass = false;
            document.body.classList.forEach(cl => {
                if (cl.startsWith('w-') && cl !== w) {
                    document.body.classList.remove(cl);
                } else if (cl === w) {
                    hasClass = true;
                }
            });
            if (!hasClass) {
                document.body.classList.add(`${w}`);
            }
        }
        applyDynamicStyles() {
            this.setBodyClasses();
            let h = this.getSlot('header') || { clientHeight: 0 };
            let f = this.getSlot('footer') || { clientHeight: 0 };
            let t = this.getSlot('top') || { clientHeight: 0 };
            let r = this.getSlot('right') || { clientWidth: 0 };
            let b = this.getSlot('bottom') || { clientHeight: 0 };
            let l = this.getSlot('left') || { clientWidth: 0 };
            let m = this.shadowRoot.children[2];
            let w = window;
            let wb = document.body;
            let ww = w.innerWidth || wb.clientWidth;
            let wh = w.innerHeight || wb.clientHeight;
            let mw = m.clientWidth;
            let mh = wh - (h.clientHeight + f.clientHeight + t.clientHeight + b.clientHeight);
            let value = `
        :root {
        --window-width: ${ww}px;
        --window-height: ${wh}px;
        --main-width: ${mw}px;
        --main-height: ${mh}px;
        --header-height: ${h.clientHeight}px;
        --footer-height: ${f.clientHeight}px;
        --drawer-left-width: ${l.clientWidth}px;
        --drawer-right-width: ${r.clientWidth}px;
        --drawer-top-height: ${t.clientHeight}px;
        --drawer-bottom-height: ${b.clientHeight}px;
        }
        `;
            if (_adsrCache !== value) {
                _adsrCache = value;
                this.dynstyles.innerHTML = value;
            }
        }
        applyDynamicStylesTimer() {
            us();
            setTimeout(() => this.applyDynamicStylesTimer(), 1000);
        }
    }
    customElements.define('webui-app', App);
}
