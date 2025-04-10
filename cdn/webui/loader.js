
/* This script is used to dynamically load Web UI web components (webui-*) from cdn.myfi.ws and app components (app-*) from the local /wc (webui.appSrc) folder as they are encountered in the dom. */
"use strict"
const webui = (() => {
    const markdownOptions = {
        gfm: true,
    };
    const appData = {
        'app-name': 'App',
        'app-company-singular': 'Company',
        'app-company-possessive': `Company's`,
        'page-title': '',
        'page-subtitle': '',
        'page-path': location.pathname,
        'app-domain': location.hostname.toLowerCase()
    };
    let sessionData = {
        'session-user-role': 0,
        'session-username': 'Guest',
        'session-full-name': 'Guest',
        'session-first-name': 'Guest',
        'session-last-name': ''
    };
    const appSettings = {
        appType: 'website',
        isDesktopApp: false,
        rootPage: 'root',
        contentExtension: '.md',
        pageContentEndpoint: '/d/en-US',
        pageDataEndpoint: 'https://api.myfi.ws/data/page/',
        encryptPageContent: false,
        encryptPageData: 'base64'
    };
    function runWhenBodyIsReady(setup) {
        if (!document.body) {
            setTimeout(() => runWhenBodyIsReady(setup), 1);
            return;
        }
        setup();
    }
    let debug = false;
    const memStorageCache = {};
    const STORAGE_ACCEPTED_KEY = 'storage_accepted';
    const REJECT_STORAGE_CACHING = '0';
    const ACCEPT_SESSION_STORAGE = '1';
    const ACCEPT_LOCAL_STORAGE = '2';
    const cachedFetches = {};
    let acceptedStorage = REJECT_STORAGE_CACHING;
    if (localStorage.key(STORAGE_ACCEPTED_KEY) && localStorage.getItem(STORAGE_ACCEPTED_KEY) === ACCEPT_LOCAL_STORAGE) {
        acceptedStorage = ACCEPT_LOCAL_STORAGE;
        Object.keys(localStorage).forEach(key => {
            memStorageCache[key] = localStorage.getItem(key);
        });
        sessionStorage.clear();
    } else if (sessionStorage.key(STORAGE_ACCEPTED_KEY) && sessionStorage.getItem(STORAGE_ACCEPTED_KEY) === ACCEPT_SESSION_STORAGE) {
        acceptedStorage = ACCEPT_SESSION_STORAGE;
        Object.keys(sessionStorage).forEach(key => {
            memStorageCache[key] = sessionStorage.getItem(key);
        });
        localStorage.clear();
    } else {
        sessionStorage.clear();
        localStorage.clear();
    }
    function getCache() {
        return new Promise((resolve, reject) => {
            if (localStorage.getItem(STORAGE_ACCEPTED_KEY)) {
                resolve(localStorage);
            } else if (sessionStorage.getItem(STORAGE_ACCEPTED_KEY)) {
                resolve(sessionStorage);
            } else {
                reject('Caching not accepted');
            }
        });
    }
    class MemStorage {
        STORAGE_ACCEPTED_KEY = STORAGE_ACCEPTED_KEY;
        REJECT_STORAGE_CACHING = REJECT_STORAGE_CACHING;
        ACCEPT_SESSION_STORAGE = ACCEPT_SESSION_STORAGE;
        ACCEPT_LOCAL_STORAGE = ACCEPT_LOCAL_STORAGE;
        key(key) {
            return Object.keys(memStorageCache).filter(m => m == key).length > 0 ? key : null;
        }
        clear() {
            Object.keys(memStorageCache).forEach(key => {
                this.removeItem(key);
            });
            getCache().then(cache => {
                cache.clear();
            });
        }
        removeItem(key) {
            delete memStorageCache[key];
            getCache().then(cache => {
                cache.removeItem(key);
            }).catch(_ => { });
        }
        setItem(key, value) {
            memStorageCache[key] = value;
            getCache().then(cache => {
                cache.setItem(key, value);
            }).catch(_ => {
                // Caching not accepted
            });
        }
        getItem(key) {
            return memStorageCache[key] ?? "";
        }
        acceptLocalStorage() {
            acceptedStorage = ACCEPT_LOCAL_STORAGE;
            this.setItem(STORAGE_ACCEPTED_KEY, acceptedStorage);
            sessionStorage.clear();
            Object.keys(memStorageCache).forEach(key => {
                localStorage.setItem(key, memStorageCache[key]);
            });
        }
        acceptSessionStorage() {
            acceptedStorage = ACCEPT_SESSION_STORAGE;
            this.setItem(STORAGE_ACCEPTED_KEY, acceptedStorage);
            localStorage.clear();
            Object.keys(memStorageCache).forEach(key => {
                sessionStorage.setItem(key, memStorageCache[key]);
            });
        }
        rejectCachedStorage() {
            acceptedStorage = REJECT_STORAGE_CACHING;
            this.setItem(STORAGE_ACCEPTED_KEY, acceptedStorage);
            sessionStorage.clear();
            localStorage.clear();
        }
    }
    class WebUI {
        appSrc = '/wc';
        appMin = '.min';
        constructor() {
            this._appSettings = appSettings;
            this.storage = new MemStorage();
            let cachedSessionData = this.storage.getItem('session-data') || {};
            if (typeof cachedSessionData === 'string') {
                cachedSessionData = JSON.parse(cachedSessionData);
            }
            Object.keys(cachedSessionData).forEach(key => {
                sessionData[key] = cachedSessionData[key];
            });
            window.addEventListener('unload', _ => {
                this.storage.setItem('session-data', JSON.stringify(sessionData));
            });
        }
        applyAppDataToContent(content, preTrim) {
            let data = typeof preTrim !== undefined && typeof preTrim !== 'boolean' ? preTrim : undefined;
            let pt = typeof preTrim == 'boolean' ? preTrim : undefined;
            return this.parseMarkdown(this.replaceAppData(content, data), pt);
        }
        applyDynamicStyles() { }
        applyProperties(t) { }
        create(name, attr) {
            let el = document.createElement(name);
            return this.attachAttributes(el, attr);
        }
        createFromHTML(html, attr) {
            let container = this.create('div');
            container.innerHTML = html;
            let el = container.childNodes[0];
            if (!el) return el;
            return this.attachAttributes(el, attr);
        }
        attachAttributes(el, attr) {
            if (attr) {
                Object.keys(attr).forEach(key => {
                    switch (key) {
                        case 'innerHTML':
                        case 'html':
                            el.innerHTML = attr[key];
                            break;
                        case 'innerText':
                        case 'text':
                            el.innerText = attr[key];
                            break;
                        default:
                            if (typeof attr[key] === 'function') {
                                el.addEventListener(key, attr[key]);
                            } else {
                                el.setAttribute(key, attr[key]);
                            }
                            break;
                    }
                });
            }
            return el;
        }
        define(name, options) {
            options = options || {};
            options.attr = options.attr || [];
            options.flags = options.flags || [];
            ['class'].forEach(attr=>{
                if (options.attr.indexOf(attr) === -1) {
                    options.attr.push(attr);
                }
            });
            let defineOptions = {};
            let shadowTemplate = 0;
            if (options.shadowTemplate) {
                shadowTemplate = document.createElement('template');
                shadowTemplate.setAttribute('shadowrootmode', true);
                if (options.linkCss) {
                    shadowTemplate.innerHTML = `<link rel="stylesheet" href="https://cdn.myfi.ws/css/webui.min.css">${options.shadowTemplate}`;
                } else {
                    shadowTemplate.innerHTML = options.shadowTemplate;
                }
                delete options.shadowTemplate;
            }
            if (options.watchVisibility && options.attr.indexOf('visible') === -1) {
                options.attr.push('visible');
            }
            let isInput = options.isInput || name.indexOf('input') !== -1;
            class CustomElement extends HTMLElement {
                static formAssociated = isInput;
                internals;
                disconnectHandlers = [];
                constructor() {
                    super();
                    let t = this;
                    if (options.props) {
                        Object.keys(options.props).forEach(key => {
                            Object.defineProperty(t, key, options.props[key]);
                        });
                    }
                    t._id = `d${crypto.randomUUID()}`.split('-').join('').toLowerCase();
                    t.options = options;
                    if (shadowTemplate) {
                        t.template = shadowTemplate.content.cloneNode(true);
                    }
                    Object.keys(options).forEach(key => {
                        t[key] = options[key];
                    });
                    if (!options.isInline) {
                        //webui.removeFromParentPTag(t);
                    }
                    if (options.constructor) {
                        options.constructor(t);
                    }
                    if (options.watchVisibility) {
                        let observer = new IntersectionObserver(onIntersection, {
                            root: null,   // default is the viewport
                            threshold: .1 // percentage of target's visible area. Triggers "onIntersection"
                        });

                        // callback is called on intersection change
                        function onIntersection(entries, _opts) {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    entry.target.setAttribute('visible', 1);
                                } else {
                                    entry.target.removeAttribute('visible');
                                }
                            });
                        }
                        observer.observe(t);
                        this.disconnectHandlers.push(() => {
                            observer.unobserve(t);
                        });
                    }
                    if (shadowTemplate) {
                        const shadow = t.attachShadow({ mode: 'open' });
                        // Something is copying attributes from the parent webui-dropdown to the input/select elements on the first click in Edge browser.
                        function removeBugAttributes(el) {
                            ['value', 'preload', 'data-options', 'data-trigger', 'data-subscribe'].forEach(key => {
                                el.removeAttribute(key);
                            });
                        }
                        ['input', 'select'].forEach(selector => {
                            t.template.querySelectorAll(selector).forEach(el => {
                                ['event', 'click', 'blur'].forEach(evname => {
                                    el.addEventListener(evname, ev => {
                                        setTimeout(() => {
                                            removeBugAttributes(el);
                                        }, 0);
                                    });
                                });
                            });
                        });
                        shadow.appendChild(t.template);
                    }
                }
                static get observedAttributes() {
                    return options.attr.concat(options.flags);
                }
                attributeChangedCallback(property, oldValue, newValue) {
                    let t=this;
                    if (oldValue === newValue) return;
                    property = webui.toCamel(property);
                    if (['class'].indexOf(property) !== -1) {
                        property = `_${property}`;
                    }
                    if (property === '_class' && t.shadowRoot && t.shadowRoot.childNodes) {
                        t.shadowRoot.childNodes.forEach(node => {
                            if (node.nodeName === 'SLOT') {
                                node.className = newValue;
                            }
                        });
                    }
                    if (options.flags.indexOf(property) !== -1) {
                        webui.setFlag(this, property, newValue);
                    } else {
                        webui.setProperty(this, property, newValue);
                    }
                    if (options.attrChanged) {
                        options.attrChanged(this, property, newValue);
                    }
                }
                connectedCallback() {
                    let t=this;
                    t._isConnected = true;
                    checkAddedNode(t);
                    if (options.preload) {
                        t.setAttribute('preload', options.preload);
                    }
                    if (typeof options.connected === 'function') {
                        options.connected(t);
                    }
                    if (t.shadowRoot && t.shadowRoot && t.shadowRoot.childNodes) {
                        t.shadowRoot.childNodes.forEach(node=>{
                            if (node.nodeName === 'SLOT') {
                                node.classList = t.classList;
                            }
                        });
                    }
                }
                disconnectedCallback() {
                    if (typeof options.disconnected === 'function') {
                        options.disconnected(this);
                    }
                    this.disconnectHandlers.forEach(h => {
                        h();
                    });
                }
                getSlot(name) {
                    let node = null;
                    this.childNodes.forEach(n => {
                        if (n.slot === name) {
                            node = n;
                        }
                    })
                    return node;
                }
                isFlagged(name) {
                    return this[name] !== undefined && this[name] !== false;
                }
                setTheme(value) {
                    this.style.setProperty('--theme-color', `var(--color-${value})`);
                    this.style.setProperty('--theme-color-offset', `var(--color-${value}-offset)`);
                }
                setHeight(value) {
                    let num = webui.pxIfNumber(value);
                    this.style.height = num;
                    this.style.minHeight = num;
                }
            }
            customElements.define(name, CustomElement, defineOptions);
        }
        fetchWithCache(url, isJson) {
            return new Promise((resolve, reject) => {
                if (cachedFetches[url]) {
                    resolve(cachedFetches[url]);
                } else {
                    fetch(url).then(res => {
                        if (isJson) {
                            res.json().then(json => {
                                cachedFetches[url] = json;
                                resolve(json);
                            });
                        } else {
                            res.text().then(text => {
                                cachedFetches[url] = text;
                                resolve(text);
                            });
                        }
                    }).catch(ex => {
                        reject(ex);
                    });
                }
            });
        }
        getData(key) {
            key = key.split(':')[0];
            let dataContainer = webui.toSnake(key).startsWith('session-') ? sessionData : appData;
            let segments = key.split('.');
            if (segments.length === 1) {
                key = webui.toSnake(key);
                return structuredClone(dataContainer[key]);
            }
            let skey = webui.toSnake(segments.shift());
            let data = dataContainer[skey];
            while (segments.length > 0) {
                if (!data) return undefined;
                skey = webui.toSnake(segments.shift());
                data = data[skey];
            }
            return structuredClone(data);
        }
        getDefined(...args) {
            for (let index = 0; index < args.length; ++index) {
                if (args[index] !== undefined && args[index] !== null) {
                    return args[index];
                }
            }
            return undefined;
        }
        getHtmlFromTemplate(template, data) {
            if (!template || typeof template.assignedElements !== 'function') return '';
            let html = [];
            template.assignedElements().forEach(t => {
                let v = t.innerHTML;
                if (v) {
                    html.push(v);
                }
            });
            return this.applyAppDataToContent(html.join('\n'), data);
        }
        unitIfNumber(input, unit) {
            let num = parseFloat(input);
            if (num === input || `${num}` === input) {
                return `${num}${unit}`;
            }
            return input;
        }
        pxIfNumber(input) {
            return this.unitIfNumber(input, 'px');
        }
        msIfNumber(input) {
            return this.unitIfNumber(input, 'ms');
        }
        marked = { parse: () => { } };
        navigateTo(href) {
            changePage(href);
        }
        removeWrappingPTags(html, tagPattern) {
            while (html.match(`<p><(${tagPattern})[\> ]{1}`)) {
                let orig = html;
                html = html.replace(new RegExp(`\<p\>(\<(${tagPattern}).+\<\/\\2\>)\<\/p\>`, 'g'), '$1');
                if (html === orig) {
                    break;
                }
            }
            return html;
        }
        parseMarkdown(md, preTrim) {
            let t = this;
            if (typeof md !== 'string') return md;
            md = md.replace(/(\r\n|\r)+/mg, '\n');
            if (preTrim) {
                md = this.trimLinePreWhitespce(md);
            } else {
                md = this.trimLinePreTabs(md);
            }
            md = md.replace(/(\n)/mg, '\n\n');
            let html = t.marked.parse(md, markdownOptions) || '';
            html = t.removeWrappingPTags(html, 'webui-[A-Za-z-]+|app-[A-Za-z-]+|select|option|div|label|section|article|footer|header');
            return html;
        }
        removeFromParentPTag(el) {
            if (el.parentNode && el.parentNode.nodeName === 'P') {
                let p = el.parentNode;
                if (p.parentNode) {
                    p.parentNode.insertBefore(el, p);
                    if (p.innerHTML.trim() === '') {
                        p.remove();
                    }
                }
            }
            return el;
        }
        removeChildren(t, condition) {
            let tr = [];
            t.childNodes.forEach(ch => {
                if (typeof condition === 'function') {
                    if (condition(ch)) {
                        tr.push(ch);
                    }
                } else {
                    tr.push(ch);
                }
            });
            tr.forEach(ch => {
                ch.remove();
            });
            return tr;
        }
        removeClass(t, prefix) {
            let r = [];
            t.classList.forEach(c => {
                if (c.startsWith(prefix)) { r.push(c); }
            });
            r.forEach(c => t.classList.remove(c));
        }
        removeElements(parent, selector, action) {
            let tr = [];
            parent.querySelectorAll(selector).forEach(n => {
                tr.push(n);
                if (typeof action === 'function') {
                    action(n);
                }
            });
            tr.forEach(n => {
                n.remove();
            });
        }
        replaceAppData(text, data) {
            if (typeof text !== 'string') return text;
            if (data) {
                text = this.replaceData(text, data);
            }
            [appData, sessionData].forEach(dataContainer => {
                Object.keys(dataContainer).forEach(key => {
                    let keys = [];
                    keys.push(`{${this.toSnake(key).replace(/-/g, '_').toUpperCase()}}`);
                    if (key.startsWith('session-')) {
                        keys.push(`{${this.toSnake(key.substring(8)).replace(/-/g, '_').toUpperCase()}}`);
                    } else if (key.startsWith('app-')) {
                        keys.push(`{${this.toSnake(key.substring(4)).replace(/-/g, '_').toUpperCase()}}`);
                    }
                    let val = webui.getData(key);
                    if (val === undefined || val === null) {
                        val = '';
                    }
                    keys.forEach(rkey => {
                        let limit = 0;
                        try {
                            while (text.indexOf(rkey) !== -1 && limit < 1000) {
                                ++limit;
                                text = text.replace(rkey, val);
                            }
                        } catch (ex) { console.error('text', text, ex); }
                    });
                });
            });
            return text;
        }
        replaceData(text, data) {
            Object.keys(data).forEach(key => {
                let keyName = `${key.replace(/-/g, '_').toUpperCase()}`;
                let rkey = `{${keyName}}`;
                let tkey = `{TEMPLATE_${key.replace(/-/g, '_').toUpperCase()}}`
                let val = data[key];
                if (val === undefined || val === null) {
                    val = '';
                }
                let limit = 0;
                while (text.indexOf(rkey) !== -1 && limit < 1000) {
                    ++limit;
                    text = text.replace(rkey, val);
                }
                limit = 0;
                while (text.indexOf(tkey) !== -1 && limit < 1000) {
                    ++limit;
                    text = text.replace(tkey, val);
                }
            });
            return text;
        }
        setApp(app) {
            appSettings.app = app;
        }
        setData(key, value) {
            if (!key) return;
            value = structuredClone(value);
            key = key.split(':')[0];
            let sections = key.split('.');
            let baseKey = webui.toSnake(sections[0]);
            let dataContainer = key.startsWith('session-') ? sessionData : appData;
            if (sections.length === 1) {
                key = webui.toSnake(key);
                if (JSON.stringify(dataContainer[key]) === JSON.stringify(value)) {
                    return;
                }
                if (value === null || value === undefined) {
                    delete dataContainer[key];
                } else {
                    dataContainer[key] = value;
                }
            } else {
                let skey = sections.shift();
                skey = webui.toSnake(skey);
                if (!dataContainer[skey]) {
                    dataContainer[skey] = {};
                }
                let segment = dataContainer[skey];
                while (sections.length > 1) {
                    skey = sections.shift();
                    skey = webui.toSnake(skey);
                    if (!segment[skey]) {
                        segment[skey] = {};
                    }
                    segment = segment[skey];
                }
                skey = sections.shift();
                if (JSON.stringify(segment[skey]) === JSON.stringify(value)) {
                    return;
                }
                if (value === null || value === undefined) {
                    delete segment[skey];
                } else {
                    segment[skey] = value;
                }
            }
            document.querySelectorAll(`[data-subscribe*="${baseKey}"]`).forEach(sub => {
                sub.dataset.subscribe.split('|').forEach(k => {
                    let ts = k.split(':')
                    let sections = ts[0].split('.');
                    let skeys = [];
                    let mk = ts[0];
                    while (sections.length > 0) {
                        skeys.push(sections.shift());
                        let skey = skeys.join('.');
                        if (mk === skey) {
                            setTimeout(() => {
                                setDataToEl(sub, skey);
                            }, 10);
                        }
                    }
                });
            });
        }
        setDefaultData(data, defaultData) {
            if (!data || !defaultData) return data;
            defaultData = JSON.parse(JSON.stringify(defaultData));
            Object.keys(defaultData).forEach(key => {
                if ([undefined, null].indexOf(data[key]) !== -1) {
                    data[key] = defaultData[key];
                }
            });
            return data;
        }
        setFlag(t, property, value) {
            if ([undefined, null, 0, false, 'false', 'null', 'undefined', '0'].indexOf(value) !== -1) {
                t[property] = false;
            } else {
                t[property] = true;
            }
        }
        setProperty(t, property, value) {
            if (property !== 'value' && (value === null || value === undefined)) {
                delete t[property];
            } else {
                t[property] = value;
            }
            switch (property) {
                case 'elevation':
                    webui.removeClass(t, 'elevation-');
                    if (value > 0) {
                        t.classList.add(`elevation-${value}`);
                    } else if (value < 0) {
                        t.classList.add(`elevation-n${(value * -1)}`);
                    }
                    break;
            }
        }
        setTheme(el, value) {
            el.style.setProperty('--theme-color', `var(--color-${value})`);
            el.style.setProperty('--theme-color-offset', `var(--color-${value}-offset)`);
        }
        targetMatchesCheck(parent, target, check, onSuccess) {
            while (true) {
                if (!target) return false;
                if (parent === target) return false;
                switch (typeof check) {
                    case 'function':
                        if (check(target)) {
                            if (typeof onSuccess === 'function') {
                                onSuccess(target);
                            }
                            return true;
                        }
                        break;
                    case 'string':
                        if (target.nodeName === check) {
                            if (typeof onSuccess === 'function') {
                                onSuccess(target);
                            }
                            return true;
                        }
                        break;
                    default:
                        return false;
                }
                target = target.parentNode;
            }
        }
        toSnake(key) {
            return key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        }
        toCamel(key) {
            return key.replace(/((-| )[A-Za-z0-9]{1})/g, a => { return a[1].toUpperCase(); })
                .replace(/^[A-Z]{1}/, a => { return a.toLowerCase(); });
        }
        toPascel(key) {
            return key.replace(/((-| )[A-Za-z0-9]{1})/g, a => { return a[1].toUpperCase(); })
                .replace(/^[A-Z]{1}/, a => { return a.toUpperCase(); });
        }
        transferChildren(from, to) {
            let nodes = [];
            from.childNodes.forEach(ch => {
                nodes.push(ch);
            });
            nodes.forEach(ch => {
                to.appendChild(ch);
            });
        }
        trimLinePreTabs(html) {
            let lines = [], ls = 0;
            html.split('\n').forEach(l => {
                let isListItem = l.match(/^[ ]+-/);
                if (isListItem && isListItem.length === 1) {
                    if (isListItem[0].length > ls) {
                        lines.push(l.substr(ls));
                    } else {
                        lines.push(l);
                    }
                } else {
                    let nl = l.replace(/^([ ]{4}|\t)+/, a => { return ''; });
                    ls = l.length - nl.length;
                    lines.push(nl);
                }
            });
            return lines.join('\n');
        }
        trimLinePreWhitespce(html) {
            let lines = [];
            html.split('\n').forEach(l => {
                lines.push(l.trim());
            });
            return lines.join('\n');
        }
        uuid() {
            try {
                return crypto.randomUUID();
            } catch (ex) {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        }
    }
    const webui = new WebUI();

    //storage_accepted
    {
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
            let key = getNodeKey(node);
            let state = {};
            node.dataset.state.split('|').forEach(attr => {
                let val = node.attributes[attr];
                if (val && val.value && val.value !== 'undefined') {
                    state[attr] = val.value;
                }
            });
            webui.storage.setItem(key, JSON.stringify(state));
        }
        function loadState(node) {
            let key = getNodeKey(node);
            let item = webui.storage.getItem(key);
            if (!item) return;
            let state = JSON.parse(item);
            node.dataset.state.split('|').forEach(attr => {
                if (state[attr]) {
                    node.setAttribute(attr, state[attr]);
                } else {
                    node.removeAttribute(attr);
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
                        saveState(mutation.target, mutation.attributeName);
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
        runWhenBodyIsReady(() => {
            observerDataStates(document.body);
            checkNodes(document.childNodes);
            applyDataHide();
        });
    }
    // Data signalling/transfers
    function handleDataClick(ev) {
        let key = ev.dataset.click;
        if (!key) { return; }
        document.querySelectorAll(`[data-subscribe*="${key}:click"]`).forEach(sub => {
            sub.click();
        });
    }
    function handleDataTrigger(ev) {
        let el = ev.srcElement || ev.target || ev;
        let key = el.dataset.trigger;
        if (!key) return;
        key.split('|').forEach(key => {
            let oldData = webui.getData(key);
            if (key.indexOf(':') !== -1) {
                let kp = key.split(':');
                key = kp[0];
                let getter = kp[1];
                let field = el[getter];
                let value = typeof el[getter] === 'function' ? el[field]() : webui.getDefined(el[getter], el.dataset[getter]);
                if (oldData !== value) {
                    webui.setData(key, value);
                }
            } else {
                let value = webui.getDefined(typeof el.getValue === 'function' ? el.getValue() : undefined, el.value, el.dataset.value);
                if (oldData !== value) {
                    webui.setData(key, value);
                }
            }
        });
    }
    function setDataToEl(el, key) {
        function getToSet(key) {
            let toSet = 'setter';
            el.dataset.subscribe.split('|').forEach(ds => {
                let kts = ds.trim().split(':');
                if (!(key === ds || kts[0] === key)) return;
                if (kts.length === 2) {
                    toSet = kts[1];
                }
            });
            return toSet;
        }
        key.split('|').forEach(key => {
            key = key.trim();
            let a = 0;
            (function attempt() {
                try {
                    let toSet = getToSet(key);
                    if (key.indexOf(':') !== -1) {
                        key = key.split(':')[0];
                    }
                    if (toSet === 'click') return;
                    let value = webui.getData(key);
                    let isNull = value === null || value === undefined;
                    switch (toSet) {
                        case 'setter':
                            let field = webui.toCamel(key);
                            let fsetter = webui.toCamel(`set-${field}`);
                            if (typeof el[fsetter] === 'function') {
                                el[fsetter](value, key);
                            } else if (typeof el[field] === 'function') {
                                el[field](value, key);
                            } else if (typeof el.setValue === 'function' && a > 1) {
                                el.setValue(value, key);
                            } else {
                                if (a++ < 5) {
                                    setTimeout(() => {
                                        attempt();
                                    }, Math.min(1000, Math.pow(2, a)));
                                } else {
                                    //console.error(`Element is missing expected setter (${field}|${fsetter}|setValue): typeof == (${typeof el[field]}|${typeof el[fsetter]}|${typeof el.setValue})`, a, el, el._isConnected, el.nodeName, el.parentNode);
                                    //console.dir(el);
                                }
                            }
                            break;
                        case 'text':
                        case 'innerText':
                            if (!isNull) {
                                el.innerText = webui.applyAppDataToContent(value);
                            }
                            break;
                        case 'html':
                        case 'innerHTML':
                            if (!isNull) {
                                el.innerHTML = webui.applyAppDataToContent(value);
                            }
                            break;
                        default:
                            if (typeof el[toSet] === 'function') {
                                el[toSet](value, key);
                            } else {
                                if (a++ < 4) {
                                    setTimeout(() => {
                                        attempt();
                                    }, Math.min(1000, Math.pow(2, a)));
                                } else {
                                    switch (toSet) {
                                        case 'class':
                                            if (isNull) {
                                                el.classList.remove(value);
                                            } else {
                                                el.classList.add(value);
                                            }
                                            break;
                                        case 'src':
                                        case 'href':
                                        case 'value':
                                        case 'style':
                                        case 'theme':
                                        case 'elevation':
                                        case 'slot':
                                            if (isNull) {
                                                el.removeAttribute(toSet);
                                            } else {
                                                el.setAttribute(toSet, value);
                                            }
                                            break;
                                        default:
                                            if (isNull) {
                                                delete el.dataset[toSet];
                                            } else {
                                                el.dataset[toSet] = value;
                                            }
                                            break;
                                    }
                                }
                            }
                            break;
                    }
                } catch (ex) {
                    console.error(`Error setting data to ${el.nodeName}`, el, ex, key);
                }
            })();
        });
    }
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

    runWhenBodyIsReady(() => {
        document.body.addEventListener('input', handleDataTrigger);
        document.body.addEventListener('change', handleDataTrigger);
        document.body.addEventListener('click', ev => {
            let target = ev.target;
            let retValue = true;
            let breakAtEnd = false;
            let applyDynStyles = false;
            function stop() {
                ev.stopPropagation();
                ev.preventDefault();
                retValue = false;
                breakAtEnd = true;
            }
            while (!breakAtEnd && target !== document.body && target !== null && target !== undefined) {
                if (target.hasAttribute('disabled') && target.getAttribute('disabled') !== 'false' && !ev.ctrlKey) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    return false;
                }
                if (target.dataset.click) {
                    stop();
                    handleDataClick(target);
                }
                if (target.dataset.trigger && ['A', 'BUTTON', 'WEBUI-BUTTON'].indexOf(target.nodeName) !== -1) {
                    stop();
                    handleDataTrigger(target);
                }
                let href = target.getAttribute('href');
                if (href && href.indexOf(':') !== -1 && href.substr(0, 4) !== 'http') {
                    return true;
                }
                if (href && target.getAttribute('target') !== 'blank' && (href[0] === '/' || href.substr(0, 4) !== 'http')) {
                    stop();
                    changePage(href);
                }
                if (target.hasAttribute('data-stopclick')) {
                    stop();
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
                    applyDynStyles = true;
                    break;
                }
                if (target.dataset.toggleclass) {
                    let [cls, sel] = target.dataset.toggleclass.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => toggleClass(el, cls));
                    } else {
                        toggleClass(target, cls);
                    }
                    applyDynStyles = true;
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
                    applyDynStyles = true;
                }
                if (target.dataset.toggleattr) {
                    let [attr, sel] = target.dataset.toggleattr.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => toggleAttr(el, attr));
                    } else {
                        toggleAttr(target, attr);
                    }
                    applyDynStyles = true;
                }
                if (applyDynStyles) {
                    webui.applyDynamicStyles();
                    break;
                }
                target = target.parentNode;
            }
            return retValue;
        });
    });

    function checkForSubscription(node) {
        if (!node || !node.getAttribute) return;
        let dataKey = node.getAttribute('data-subscribe');
        if (dataKey) {
            setDataToEl(node, dataKey);
        }
        node.childNodes.forEach(n => {
            checkForSubscription(n);
        });
    }

    function checkAttributeMutations(mutation) {
        if (mutation.type !== 'attributes') return;
        let t = mutation.target;
        applyAttributeSettings(t, mutation.attributeName);
    }

    function applyAttributeSettings(target, attr) {
        if (!attr) {
            if (target && typeof target.getAttribute === 'function') {
                ['elevation', 'theme', 'data-subscribe', 'top', 'right', 'bottom', 'left'].forEach(attr => {
                    if (target.hasAttribute(attr)) {
                        applyAttributeSettings(target, attr);
                    }
                });
            }
            return;
        }
        let value = target.getAttribute(attr);
        switch (attr) {
            case 'top':
                target.style.top = webui.pxIfNumber(value);
                break;
            case 'right':
                target.style.right = webui.pxIfNumber(value);
                break;
            case 'bottom':
                target.style.bottom = webui.pxIfNumber(value);
                break;
            case 'left':
                target.style.left = webui.pxIfNumber(value);
                break;
            case 'data-subscribe':
                checkForSubscription(target);
                break;
            case 'elevation':
                webui.removeClass(target, 'elevation-');
                value = parseInt(value) || 0;
                if (value > 0) {
                    target.classList.add(`elevation-${value}`);
                } else if (value < 0) {
                    target.classList.add(`elevation-n${(value * -1)}`);
                }
                break;
            case 'theme':
                if (typeof target.setTheme === 'function') {
                    target.setTheme(value);
                }
                else if (value) {
                    target.style.setProperty('--theme-color', `var(--color-${value})`);
                    target.style.setProperty('--theme-color-offset', `var(--color-${value}-offset)`);
                } else {
                    target.style.removeProperty('--theme-color');
                    target.style.removeProperty('--theme-color-offset');
                }
                break;
        }
    }

    const observeDataSubscriptions = (domNode) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
                checkAttributeMutations(mutation);
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-subscribe') {
                    checkForSubscription(mutation.target);
                }
                Array.from(mutation.addedNodes).forEach(el => {
                    applyAttributeSettings(el);
                    checkForSubscription(el);
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
    runWhenBodyIsReady(() => {
        observeDataSubscriptions(document.body);
        document.querySelectorAll('[data-subscribe]').forEach(el => {
            let key = el.dataset.subscribe;
            setDataToEl(el, key);
        });
        document.querySelectorAll('[theme]').forEach(el => {
            applyAttributeSettings(el, 'theme');
        });
        document.querySelectorAll('[elevation]').forEach(el => {
            applyAttributeSettings(el, 'elevation');
        });
    });

    function transitionDelay(ms) {
        return new Promise((resolve, _) => {
            setTimeout(() => resolve(), ms);
        });
    }
    async function loadPage() {
        if (!appSettings.app) {
            setTimeout(() => {
                loadPage();
            }, 10);
            return;
        }
        let page = location.pathname === '/' ? '/' + appSettings.rootPage : location.pathname;
        let url = page + location.search;
        let dataUrl = encryptUrl(url, appSettings.encryptPageData);
        let contentUrl = encryptUrl(url, appSettings.encryptPageContent);
        let fullContentUrl = `${appSettings.pageContentEndpoint}${contentUrl}${appSettings.contentExtension}`;
        let fetchContent = fetch(fullContentUrl);
        let fetchData = fetch(`${appSettings.pageDataEndpoint}${dataUrl}`);
        appSettings.app.main.classList.add('transition');
        let timerStart = Date.now();
        // Clear page data
        Object.keys(appData).forEach(key => {
            let keepKey = key.startsWith('app-') || key.startsWith('session-');
            if (!keepKey) {
                webui.setData(key, '');
            }
        });

        webui.setData('page-path', page);
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
            if (body.startsWith(`<!DOCTYPE`)) {
                throw Error(`Invalid page content loaded from ${fullContentUrl}`);
            }
            let content = webui.applyAppDataToContent(body);
            appSettings.app.setPageContent(content, appData, fullContentUrl);
            setTimeout(() => {
                checkNodes(document.body.childNodes);
            }, 100);
        } catch (ex) {
            console.error('Failed loading page content', ex);
            let elapsed = Date.now() - timerStart;
            if (elapsed < 300) {
                await transitionDelay(300 - elapsed);
            }
            appSettings.app.setPageContent('<webui-page-not-found></webui-page-not-found>', appData);
        }
        try {
            let dataResult = await fetchData;
            if (!dataResult.ok) {
                throw Error("Returned page data was not ok");
            }
            let data = await dataResult.json();
            webui.setData('page-data', data);
            if (!data.forEach) {
                Object.keys(data).forEach(key => {
                    webui.setData(key, data[key]);
                });
            }
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
    // Component Watcher
    const appPrefix = `APP-`;
    const wuiPrefix = `WEBUI-`;
    const wcLoading = {};
    const wcLoaded = {};
    const appLoaded = {};
    const wcRoot = location.hostname === '127.0.0.1' && location.port === '3180' ? '' : 'https://cdn.myfi.ws/';
    const wcMin = '.min';
    function processNode(nodeName) {
        if (wcLoading[nodeName]) return;
        wcLoading[nodeName] = true;
        let wc = nodeName.split('-').splice(1).join('-').toLowerCase();
        if (nodeName.startsWith(appPrefix)) {
            loadAppComponent(wc);
        } else {
            loadWebUIComponent(wc);
        }
    }
    function loadWebUIComponent(wc) {
        if (wcLoaded[wc]) return;
        wcLoaded[wc] = true;
        let script = document.createElement('script');
        script.setAttribute('async', true);
        script.setAttribute('src', `${wcRoot}webui/${wc}${wcMin}.js`)
        document.head.append(script);
    }
    function loadAppComponent(wc) {
        if (appLoaded[wc]) return;
        appLoaded[wc] = true;
        let script = document.createElement('script');
        script.setAttribute('async', true);
        script.setAttribute('src', `${webui.appSrc}/${wc}${webui.appMin}.js`)
        document.head.append(script);
    }
    function componentPreload(el) {
        if (!el) return;
        if (el.nodeName.startsWith(wuiPrefix) || el.nodeName.startsWith(appPrefix)) {
            processNode(el.nodeName);
        }
        let pl = el.getAttribute('preload');
        if (pl) {
            pl.replace(';', ' ').replace(',', ' ').split(' ').forEach(loadWebUIComponent);
        }
    }

    function checkMutation(mutation) {
        checkAttributeMutations(mutation);
        let nodeName = mutation.target.nodeName;
        if ((nodeName.startsWith(wuiPrefix) || nodeName.startsWith(appPrefix))
            && mutation.type === 'attributes'
            && mutation.attributeName === 'preload') {
            componentPreload(mutation.target);
        }
        Array.from(mutation.addedNodes).forEach(el => {
            checkAddedNode(el);
        });
    }

    function checkAddedNode(el) {
        applyAttributeSettings(el);
        if (el.shadowRoot) {
            if (!el._isObserved) {
                el._isObserved = 1;
                startObserving(el.shadowRoot);
            }
            checkNodes(el.shadowRoot.childNodes);
        }
        if (el.nodeName && el.nodeName.startsWith(wuiPrefix) || el.nodeName.startsWith(appPrefix)) {
            processNode(el.nodeName);
        }
        checkNodes(el.childNodes);
    }

    function checkNodes(nodes) {
        if (nodes.length === 0) return;
        nodes.forEach(node => {
            checkAddedNode(node);
        });
    }
    const startObserving = (domNode) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
                checkMutation(mutation);
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

    runWhenBodyIsReady(() => {
        ['app-config', 'app', 'data'].forEach(preload => {
            componentPreload(document.querySelector(`webui-${preload}`));
        });
        startObserving(document.body);
        loadPage();
    });
    window.addEventListener('resize', _ev => {
        webui.applyDynamicStyles();
    });
    (function applyDynamicStylesTimer() {
        webui.applyDynamicStyles();
        setTimeout(() => applyDynamicStylesTimer(), 1000);
    })();
    return webui;
})();

/**
* marked v13.0.0 - a markdown parser
* Copyright (c) 2011-2024, Christopher Jeffrey. (MIT Licensed)
* https://github.com/markedjs/marked
*/
webui.marked = (function () {
    const e = {};
    function t() {
        return {
            async: !1,
            breaks: !1,
            extensions: null,
            gfm: !0,
            hooks: null,
            pedantic: !1,
            renderer: null,
            silent: !1,
            tokenizer: null,
            walkTokens: null
        }
    }
    function n(t) {
        e.defaults = t
    }
    e.defaults = {
        async: !1,
        breaks: !1,
        extensions: null,
        gfm: !0,
        hooks: null,
        pedantic: !1,
        renderer: null,
        silent: !1,
        tokenizer: null,
        walkTokens: null
    };
    const s = /[&<>"']/
        , r = new RegExp(s.source, "g")
        , i = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/
        , l = new RegExp(i.source, "g")
        , o = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }
        , a = e => o[e];
    function c(e, t) {
        if (t) {
            if (s.test(e))
                return e.replace(r, a)
        } else if (i.test(e))
            return e.replace(l, a);
        return e
    }
    const h = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi;
    const p = /(^|[^\[])\^/g;
    function u(e, t) {
        let n = "string" == typeof e ? e : e.source;
        t = t || "";
        const s = {
            replace: (e, t) => {
                let r = "string" == typeof t ? t : t.source;
                return r = r.replace(p, "$1"),
                    n = n.replace(e, r),
                    s
            }
            ,
            getRegex: () => new RegExp(n, t)
        };
        return s
    }
    function k(e) {
        try {
            e = encodeURI(e).replace(/%25/g, "%")
        } catch (e) {
            return null
        }
        return e
    }
    const g = {
        exec: () => null
    };
    function f(e, t) {
        const n = e.replace(/\|/g, ((e, t, n) => {
            let s = !1
                , r = t;
            for (; --r >= 0 && "\\" === n[r];)
                s = !s;
            return s ? "|" : " |"
        }
        )).split(/ \|/);
        let s = 0;
        if (n[0].trim() || n.shift(),
            n.length > 0 && !n[n.length - 1].trim() && n.pop(),
            t)
            if (n.length > t)
                n.splice(t);
            else
                for (; n.length < t;)
                    n.push("");
        for (; s < n.length; s++)
            n[s] = n[s].trim().replace(/\\\|/g, "|");
        return n
    }
    function d(e, t, n) {
        const s = e.length;
        if (0 === s)
            return "";
        let r = 0;
        for (; r < s;) {
            const i = e.charAt(s - r - 1);
            if (i !== t || n) {
                if (i === t || !n)
                    break;
                r++
            } else
                r++
        }
        return e.slice(0, s - r)
    }
    function x(e, t, n, s) {
        const r = t.href
            , i = t.title ? c(t.title) : null
            , l = e[1].replace(/\\([\[\]])/g, "$1");
        if ("!" !== e[0].charAt(0)) {
            s.state.inLink = !0;
            const e = {
                type: "link",
                raw: n,
                href: r,
                title: i,
                text: l,
                tokens: s.inlineTokens(l)
            };
            return s.state.inLink = !1,
                e
        }
        return {
            type: "image",
            raw: n,
            href: r,
            title: i,
            text: c(l)
        }
    }
    class b {
        options;
        rules;
        lexer;
        constructor(t) {
            this.options = t || e.defaults
        }
        space(e) {
            const t = this.rules.block.newline.exec(e);
            if (t && t[0].length > 0)
                return {
                    type: "space",
                    raw: t[0]
                }
        }
        code(e) {
            const t = this.rules.block.code.exec(e);
            if (t) {
                const e = t[0].replace(/^ {1,4}/gm, "");
                return {
                    type: "code",
                    raw: t[0],
                    codeBlockStyle: "indented",
                    text: this.options.pedantic ? e : d(e, "\n")
                }
            }
        }
        fences(e) {
            const t = this.rules.block.fences.exec(e);
            if (t) {
                const e = t[0]
                    , n = function (e, t) {
                        const n = e.match(/^(\s+)(?:```)/);
                        if (null === n)
                            return t;
                        const s = n[1];
                        return t.split("\n").map((e => {
                            const t = e.match(/^\s+/);
                            if (null === t)
                                return e;
                            const [n] = t;
                            return n.length >= s.length ? e.slice(s.length) : e
                        }
                        )).join("\n")
                    }(e, t[3] || "");
                return {
                    type: "code",
                    raw: e,
                    lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
                    text: n
                }
            }
        }
        heading(e) {
            const t = this.rules.block.heading.exec(e);
            if (t) {
                let e = t[2].trim();
                if (/#$/.test(e)) {
                    const t = d(e, "#");
                    this.options.pedantic ? e = t.trim() : t && !/ $/.test(t) || (e = t.trim())
                }
                return {
                    type: "heading",
                    raw: t[0],
                    depth: t[1].length,
                    text: e,
                    tokens: this.lexer.inline(e)
                }
            }
        }
        hr(e) {
            const t = this.rules.block.hr.exec(e);
            if (t)
                return {
                    type: "hr",
                    raw: d(t[0], "\n")
                }
        }
        blockquote(e) {
            const t = this.rules.block.blockquote.exec(e);
            if (t) {
                let e = d(t[0], "\n").split("\n")
                    , n = ""
                    , s = "";
                const r = [];
                for (; e.length > 0;) {
                    let t = !1;
                    const i = [];
                    let l;
                    for (l = 0; l < e.length; l++)
                        if (/^ {0,3}>/.test(e[l]))
                            i.push(e[l]),
                                t = !0;
                        else {
                            if (t)
                                break;
                            i.push(e[l])
                        }
                    e = e.slice(l);
                    const o = i.join("\n")
                        , a = o.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, "\n    $1").replace(/^ {0,3}>[ \t]?/gm, "");
                    n = n ? `${n}\n${o}` : o,
                        s = s ? `${s}\n${a}` : a;
                    const c = this.lexer.state.top;
                    if (this.lexer.state.top = !0,
                        this.lexer.blockTokens(a, r, !0),
                        this.lexer.state.top = c,
                        0 === e.length)
                        break;
                    const h = r[r.length - 1];
                    if ("code" === h?.type)
                        break;
                    if ("blockquote" === h?.type) {
                        const t = h
                            , i = t.raw + "\n" + e.join("\n")
                            , l = this.blockquote(i);
                        r[r.length - 1] = l,
                            n = n.substring(0, n.length - t.raw.length) + l.raw,
                            s = s.substring(0, s.length - t.text.length) + l.text;
                        break
                    }
                    if ("list" !== h?.type)
                        ;
                    else {
                        const t = h
                            , i = t.raw + "\n" + e.join("\n")
                            , l = this.list(i);
                        r[r.length - 1] = l,
                            n = n.substring(0, n.length - h.raw.length) + l.raw,
                            s = s.substring(0, s.length - t.raw.length) + l.raw,
                            e = i.substring(r[r.length - 1].raw.length).split("\n")
                    }
                }
                return {
                    type: "blockquote",
                    raw: n,
                    tokens: r,
                    text: s
                }
            }
        }
        list(e) {
            let t = this.rules.block.list.exec(e);
            if (t) {
                let n = t[1].trim();
                const s = n.length > 1
                    , r = {
                        type: "list",
                        raw: "",
                        ordered: s,
                        start: s ? +n.slice(0, -1) : "",
                        loose: !1,
                        items: []
                    };
                n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`,
                    this.options.pedantic && (n = s ? n : "[*+-]");
                const i = new RegExp(`^( {0,3}${n})((?:[\t ][^\\n]*)?(?:\\n|$))`);
                let l = ""
                    , o = ""
                    , a = !1;
                for (; e;) {
                    let n = !1;
                    if (!(t = i.exec(e)))
                        break;
                    if (this.rules.block.hr.test(e))
                        break;
                    l = t[0],
                        e = e.substring(l.length);
                    let s = t[2].split("\n", 1)[0].replace(/^\t+/, (e => " ".repeat(3 * e.length)))
                        , c = e.split("\n", 1)[0]
                        , h = 0;
                    this.options.pedantic ? (h = 2,
                        o = s.trimStart()) : (h = t[2].search(/[^ ]/),
                            h = h > 4 ? 1 : h,
                            o = s.slice(h),
                            h += t[1].length);
                    let p = !1;
                    if (!s && /^ *$/.test(c) && (l += c + "\n",
                        e = e.substring(c.length + 1),
                        n = !0),
                        !n) {
                        const t = new RegExp(`^ {0,${Math.min(3, h - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`)
                            , n = new RegExp(`^ {0,${Math.min(3, h - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)
                            , r = new RegExp(`^ {0,${Math.min(3, h - 1)}}(?:\`\`\`|~~~)`)
                            , i = new RegExp(`^ {0,${Math.min(3, h - 1)}}#`);
                        for (; e;) {
                            const a = e.split("\n", 1)[0];
                            if (c = a,
                                this.options.pedantic && (c = c.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")),
                                r.test(c))
                                break;
                            if (i.test(c))
                                break;
                            if (t.test(c))
                                break;
                            if (n.test(e))
                                break;
                            if (c.search(/[^ ]/) >= h || !c.trim())
                                o += "\n" + c.slice(h);
                            else {
                                if (p)
                                    break;
                                if (s.search(/[^ ]/) >= 4)
                                    break;
                                if (r.test(s))
                                    break;
                                if (i.test(s))
                                    break;
                                if (n.test(s))
                                    break;
                                o += "\n" + c
                            }
                            p || c.trim() || (p = !0),
                                l += a + "\n",
                                e = e.substring(a.length + 1),
                                s = c.slice(h)
                        }
                    }
                    r.loose || (a ? r.loose = !0 : /\n *\n *$/.test(l) && (a = !0));
                    let u, k = null;
                    this.options.gfm && (k = /^\[[ xX]\] /.exec(o),
                        k && (u = "[ ] " !== k[0],
                            o = o.replace(/^\[[ xX]\] +/, ""))),
                        r.items.push({
                            type: "list_item",
                            raw: l,
                            task: !!k,
                            checked: u,
                            loose: !1,
                            text: o,
                            tokens: []
                        }),
                        r.raw += l
                }
                r.items[r.items.length - 1].raw = l.trimEnd(),
                    r.items[r.items.length - 1].text = o.trimEnd(),
                    r.raw = r.raw.trimEnd();
                for (let e = 0; e < r.items.length; e++)
                    if (this.lexer.state.top = !1,
                        r.items[e].tokens = this.lexer.blockTokens(r.items[e].text, []),
                        !r.loose) {
                        const t = r.items[e].tokens.filter((e => "space" === e.type))
                            , n = t.length > 0 && t.some((e => /\n.*\n/.test(e.raw)));
                        r.loose = n
                    }
                if (r.loose)
                    for (let e = 0; e < r.items.length; e++)
                        r.items[e].loose = !0;
                return r
            }
        }
        html(e) {
            const t = this.rules.block.html.exec(e);
            if (t) {
                return {
                    type: "html",
                    block: !0,
                    raw: t[0],
                    pre: "pre" === t[1] || "script" === t[1] || "style" === t[1],
                    text: t[0]
                }
            }
        }
        def(e) {
            const t = this.rules.block.def.exec(e);
            if (t) {
                const e = t[1].toLowerCase().replace(/\s+/g, " ")
                    , n = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : ""
                    , s = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
                return {
                    type: "def",
                    tag: e,
                    raw: t[0],
                    href: n,
                    title: s
                }
            }
        }
        table(e) {
            const t = this.rules.block.table.exec(e);
            if (!t)
                return;
            if (!/[:|]/.test(t[2]))
                return;
            const n = f(t[1])
                , s = t[2].replace(/^\||\| *$/g, "").split("|")
                , r = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split("\n") : []
                , i = {
                    type: "table",
                    raw: t[0],
                    header: [],
                    align: [],
                    rows: []
                };
            if (n.length === s.length) {
                for (const e of s)
                    /^ *-+: *$/.test(e) ? i.align.push("right") : /^ *:-+: *$/.test(e) ? i.align.push("center") : /^ *:-+ *$/.test(e) ? i.align.push("left") : i.align.push(null);
                for (let e = 0; e < n.length; e++)
                    i.header.push({
                        text: n[e],
                        tokens: this.lexer.inline(n[e]),
                        header: !0,
                        align: i.align[e]
                    });
                for (const e of r)
                    i.rows.push(f(e, i.header.length).map(((e, t) => ({
                        text: e,
                        tokens: this.lexer.inline(e),
                        header: !1,
                        align: i.align[t]
                    }))));
                return i
            }
        }
        lheading(e) {
            const t = this.rules.block.lheading.exec(e);
            if (t)
                return {
                    type: "heading",
                    raw: t[0],
                    depth: "=" === t[2].charAt(0) ? 1 : 2,
                    text: t[1],
                    tokens: this.lexer.inline(t[1])
                }
        }
        paragraph(e) {
            const t = this.rules.block.paragraph.exec(e);
            if (t) {
                const e = "\n" === t[1].charAt(t[1].length - 1) ? t[1].slice(0, -1) : t[1];
                return {
                    type: "paragraph",
                    raw: t[0],
                    text: e,
                    tokens: this.lexer.inline(e)
                }
            }
        }
        text(e) {
            const t = this.rules.block.text.exec(e);
            if (t)
                return {
                    type: "text",
                    raw: t[0],
                    text: t[0],
                    tokens: this.lexer.inline(t[0])
                }
        }
        escape(e) {
            const t = this.rules.inline.escape.exec(e);
            if (t)
                return {
                    type: "escape",
                    raw: t[0],
                    text: c(t[1])
                }
        }
        tag(e) {
            const t = this.rules.inline.tag.exec(e);
            if (t)
                return !this.lexer.state.inLink && /^<a /i.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(t[0]) && (this.lexer.state.inLink = !1),
                    !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t[0]) && (this.lexer.state.inRawBlock = !1),
                {
                    type: "html",
                    raw: t[0],
                    inLink: this.lexer.state.inLink,
                    inRawBlock: this.lexer.state.inRawBlock,
                    block: !1,
                    text: t[0]
                }
        }
        link(e) {
            const t = this.rules.inline.link.exec(e);
            if (t) {
                const e = t[2].trim();
                if (!this.options.pedantic && /^</.test(e)) {
                    if (!/>$/.test(e))
                        return;
                    const t = d(e.slice(0, -1), "\\");
                    if ((e.length - t.length) % 2 == 0)
                        return
                } else {
                    const e = function (e, t) {
                        if (-1 === e.indexOf(t[1]))
                            return -1;
                        let n = 0;
                        for (let s = 0; s < e.length; s++)
                            if ("\\" === e[s])
                                s++;
                            else if (e[s] === t[0])
                                n++;
                            else if (e[s] === t[1] && (n--,
                                n < 0))
                                return s;
                        return -1
                    }(t[2], "()");
                    if (e > -1) {
                        const n = (0 === t[0].indexOf("!") ? 5 : 4) + t[1].length + e;
                        t[2] = t[2].substring(0, e),
                            t[0] = t[0].substring(0, n).trim(),
                            t[3] = ""
                    }
                }
                let n = t[2]
                    , s = "";
                if (this.options.pedantic) {
                    const e = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(n);
                    e && (n = e[1],
                        s = e[3])
                } else
                    s = t[3] ? t[3].slice(1, -1) : "";
                return n = n.trim(),
                    /^</.test(n) && (n = this.options.pedantic && !/>$/.test(e) ? n.slice(1) : n.slice(1, -1)),
                    x(t, {
                        href: n ? n.replace(this.rules.inline.anyPunctuation, "$1") : n,
                        title: s ? s.replace(this.rules.inline.anyPunctuation, "$1") : s
                    }, t[0], this.lexer)
            }
        }
        reflink(e, t) {
            let n;
            if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
                const e = t[(n[2] || n[1]).replace(/\s+/g, " ").toLowerCase()];
                if (!e) {
                    const e = n[0].charAt(0);
                    return {
                        type: "text",
                        raw: e,
                        text: e
                    }
                }
                return x(n, e, n[0], this.lexer)
            }
        }
        emStrong(e, t, n = "") {
            let s = this.rules.inline.emStrongLDelim.exec(e);
            if (!s)
                return;
            if (s[3] && n.match(/[\p{L}\p{N}]/u))
                return;
            if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
                const n = [...s[0]].length - 1;
                let r, i, l = n, o = 0;
                const a = "*" === s[0][0] ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
                for (a.lastIndex = 0,
                    t = t.slice(-1 * e.length + n); null != (s = a.exec(t));) {
                    if (r = s[1] || s[2] || s[3] || s[4] || s[5] || s[6],
                        !r)
                        continue;
                    if (i = [...r].length,
                        s[3] || s[4]) {
                        l += i;
                        continue
                    }
                    if ((s[5] || s[6]) && n % 3 && !((n + i) % 3)) {
                        o += i;
                        continue
                    }
                    if (l -= i,
                        l > 0)
                        continue;
                    i = Math.min(i, i + l + o);
                    const t = [...s[0]][0].length
                        , a = e.slice(0, n + s.index + t + i);
                    if (Math.min(n, i) % 2) {
                        const e = a.slice(1, -1);
                        return {
                            type: "em",
                            raw: a,
                            text: e,
                            tokens: this.lexer.inlineTokens(e)
                        }
                    }
                    const c = a.slice(2, -2);
                    return {
                        type: "strong",
                        raw: a,
                        text: c,
                        tokens: this.lexer.inlineTokens(c)
                    }
                }
            }
        }
        codespan(e) {
            const t = this.rules.inline.code.exec(e);
            if (t) {
                let e = t[2].replace(/\n/g, " ");
                const n = /[^ ]/.test(e)
                    , s = /^ /.test(e) && / $/.test(e);
                return n && s && (e = e.substring(1, e.length - 1)),
                    e = c(e, !0),
                {
                    type: "codespan",
                    raw: t[0],
                    text: e
                }
            }
        }
        br(e) {
            const t = this.rules.inline.br.exec(e);
            if (t)
                return {
                    type: "br",
                    raw: t[0]
                }
        }
        del(e) {
            const t = this.rules.inline.del.exec(e);
            if (t)
                return {
                    type: "del",
                    raw: t[0],
                    text: t[2],
                    tokens: this.lexer.inlineTokens(t[2])
                }
        }
        autolink(e) {
            const t = this.rules.inline.autolink.exec(e);
            if (t) {
                let e, n;
                return "@" === t[2] ? (e = c(t[1]),
                    n = "mailto:" + e) : (e = c(t[1]),
                        n = e),
                {
                    type: "link",
                    raw: t[0],
                    text: e,
                    href: n,
                    tokens: [{
                        type: "text",
                        raw: e,
                        text: e
                    }]
                }
            }
        }
        url(e) {
            let t;
            if (t = this.rules.inline.url.exec(e)) {
                let e, n;
                if ("@" === t[2])
                    e = c(t[0]),
                        n = "mailto:" + e;
                else {
                    let s;
                    do {
                        s = t[0],
                            t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? ""
                    } while (s !== t[0]);
                    e = c(t[0]),
                        n = "www." === t[1] ? "http://" + t[0] : t[0]
                }
                return {
                    type: "link",
                    raw: t[0],
                    text: e,
                    href: n,
                    tokens: [{
                        type: "text",
                        raw: e,
                        text: e
                    }]
                }
            }
        }
        inlineText(e) {
            const t = this.rules.inline.text.exec(e);
            if (t) {
                let e;
                return e = this.lexer.state.inRawBlock ? t[0] : c(t[0]),
                {
                    type: "text",
                    raw: t[0],
                    text: e
                }
            }
        }
    }
    const w = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/
        , m = /(?:[*+-]|\d{1,9}[.)])/
        , y = u(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, m).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex()
        , $ = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/
        , z = /(?!\s*\])(?:\\.|[^\[\]\\])+/
        , T = u(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", z).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex()
        , R = u(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, m).getRegex()
        , _ = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul"
        , A = /<!--(?:-?>|[\s\S]*?(?:-->|$))/
        , S = u("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", A).replace("tag", _).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex()
        , I = u($).replace("hr", w).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _).getRegex()
        , E = {
            blockquote: u(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", I).getRegex(),
            code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
            def: T,
            fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
            heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
            hr: w,
            html: S,
            lheading: y,
            list: R,
            newline: /^(?: *(?:\n|$))+/,
            paragraph: I,
            table: g,
            text: /^[^\n]+/
        }
        , q = u("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", w).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _).getRegex()
        , Z = {
            ...E,
            table: q,
            paragraph: u($).replace("hr", w).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", q).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _).getRegex()
        }
        , L = {
            ...E,
            html: u("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", A).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
            def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
            heading: /^(#{1,6})(.*)(?:\n+|$)/,
            fences: g,
            lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
            paragraph: u($).replace("hr", w).replace("heading", " *#{1,6} *[^\n]").replace("lheading", y).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
        }
        , P = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/
        , v = /^( {2,}|\\)\n(?!\s*$)/
        , Q = "\\p{P}\\p{S}"
        , B = u(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Q).getRegex()
        , C = u(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Q).getRegex()
        , M = u("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Q).getRegex()
        , O = u("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Q).getRegex()
        , j = u(/\\([punct])/, "gu").replace(/punct/g, Q).getRegex()
        , D = u(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex()
        , H = u(A).replace("(?:--\x3e|$)", "--\x3e").getRegex()
        , F = u("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", H).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex()
        , U = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/
        , X = u(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", U).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex()
        , N = u(/^!?\[(label)\]\[(ref)\]/).replace("label", U).replace("ref", z).getRegex()
        , G = u(/^!?\[(ref)\](?:\[\])?/).replace("ref", z).getRegex()
        , J = {
            _backpedal: g,
            anyPunctuation: j,
            autolink: D,
            blockSkip: /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g,
            br: v,
            code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
            del: g,
            emStrongLDelim: C,
            emStrongRDelimAst: M,
            emStrongRDelimUnd: O,
            escape: P,
            link: X,
            nolink: G,
            punctuation: B,
            reflink: N,
            reflinkSearch: u("reflink|nolink(?!\\()", "g").replace("reflink", N).replace("nolink", G).getRegex(),
            tag: F,
            text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
            url: g
        }
        , K = {
            ...J,
            link: u(/^!?\[(label)\]\((.*?)\)/).replace("label", U).getRegex(),
            reflink: u(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", U).getRegex()
        }
        , V = {
            ...J,
            escape: u(P).replace("])", "~|])").getRegex(),
            url: u(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
            _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
            del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
            text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
        }
        , W = {
            ...V,
            br: u(v).replace("{2,}", "*").getRegex(),
            text: u(V.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
        }
        , Y = {
            normal: E,
            gfm: Z,
            pedantic: L
        }
        , ee = {
            normal: J,
            gfm: V,
            breaks: W,
            pedantic: K
        };
    class te {
        tokens;
        options;
        state;
        tokenizer;
        inlineQueue;
        constructor(t) {
            this.tokens = [],
                this.tokens.links = Object.create(null),
                this.options = t || e.defaults,
                this.options.tokenizer = this.options.tokenizer || new b,
                this.tokenizer = this.options.tokenizer,
                this.tokenizer.options = this.options,
                this.tokenizer.lexer = this,
                this.inlineQueue = [],
                this.state = {
                    inLink: !1,
                    inRawBlock: !1,
                    top: !0
                };
            const n = {
                block: Y.normal,
                inline: ee.normal
            };
            this.options.pedantic ? (n.block = Y.pedantic,
                n.inline = ee.pedantic) : this.options.gfm && (n.block = Y.gfm,
                    this.options.breaks ? n.inline = ee.breaks : n.inline = ee.gfm),
                this.tokenizer.rules = n
        }
        static get rules() {
            return {
                block: Y,
                inline: ee
            }
        }
        static lex(e, t) {
            return new te(t).lex(e)
        }
        static lexInline(e, t) {
            return new te(t).inlineTokens(e)
        }
        lex(e) {
            e = e.replace(/\r\n|\r/g, "\n"),
                this.blockTokens(e, this.tokens);
            for (let e = 0; e < this.inlineQueue.length; e++) {
                const t = this.inlineQueue[e];
                this.inlineTokens(t.src, t.tokens)
            }
            return this.inlineQueue = [],
                this.tokens
        }
        blockTokens(e, t = [], n = !1) {
            let s, r, i;
            for (e = this.options.pedantic ? e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e.replace(/^( *)(\t+)/gm, ((e, t, n) => t + "    ".repeat(n.length))); e;)
                if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((n => !!(s = n.call({
                    lexer: this
                }, e, t)) && (e = e.substring(s.raw.length),
                    t.push(s),
                    !0)))))
                    if (s = this.tokenizer.space(e))
                        e = e.substring(s.raw.length),
                            1 === s.raw.length && t.length > 0 ? t[t.length - 1].raw += "\n" : t.push(s);
                    else if (s = this.tokenizer.code(e))
                        e = e.substring(s.raw.length),
                            r = t[t.length - 1],
                            !r || "paragraph" !== r.type && "text" !== r.type ? t.push(s) : (r.raw += "\n" + s.raw,
                                r.text += "\n" + s.text,
                                this.inlineQueue[this.inlineQueue.length - 1].src = r.text);
                    else if (s = this.tokenizer.fences(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.heading(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.hr(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.blockquote(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.list(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.html(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.def(e))
                        e = e.substring(s.raw.length),
                            r = t[t.length - 1],
                            !r || "paragraph" !== r.type && "text" !== r.type ? this.tokens.links[s.tag] || (this.tokens.links[s.tag] = {
                                href: s.href,
                                title: s.title
                            }) : (r.raw += "\n" + s.raw,
                                r.text += "\n" + s.raw,
                                this.inlineQueue[this.inlineQueue.length - 1].src = r.text);
                    else if (s = this.tokenizer.table(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else if (s = this.tokenizer.lheading(e))
                        e = e.substring(s.raw.length),
                            t.push(s);
                    else {
                        if (i = e,
                            this.options.extensions && this.options.extensions.startBlock) {
                            let t = 1 / 0;
                            const n = e.slice(1);
                            let s;
                            this.options.extensions.startBlock.forEach((e => {
                                s = e.call({
                                    lexer: this
                                }, n),
                                    "number" == typeof s && s >= 0 && (t = Math.min(t, s))
                            }
                            )),
                                t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1))
                        }
                        if (this.state.top && (s = this.tokenizer.paragraph(i)))
                            r = t[t.length - 1],
                                n && "paragraph" === r?.type ? (r.raw += "\n" + s.raw,
                                    r.text += "\n" + s.text,
                                    this.inlineQueue.pop(),
                                    this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : t.push(s),
                                n = i.length !== e.length,
                                e = e.substring(s.raw.length);
                        else if (s = this.tokenizer.text(e))
                            e = e.substring(s.raw.length),
                                r = t[t.length - 1],
                                r && "text" === r.type ? (r.raw += "\n" + s.raw,
                                    r.text += "\n" + s.text,
                                    this.inlineQueue.pop(),
                                    this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : t.push(s);
                        else if (e) {
                            const t = "Infinite loop on byte: " + e.charCodeAt(0);
                            if (this.options.silent) {
                                console.error(t);
                                break
                            }
                            throw new Error(t)
                        }
                    }
            return this.state.top = !0,
                t
        }
        inline(e, t = []) {
            return this.inlineQueue.push({
                src: e,
                tokens: t
            }),
                t
        }
        inlineTokens(e, t = []) {
            let n, s, r, i, l, o, a = e;
            if (this.tokens.links) {
                const e = Object.keys(this.tokens.links);
                if (e.length > 0)
                    for (; null != (i = this.tokenizer.rules.inline.reflinkSearch.exec(a));)
                        e.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))
            }
            for (; null != (i = this.tokenizer.rules.inline.blockSkip.exec(a));)
                a = a.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
            for (; null != (i = this.tokenizer.rules.inline.anyPunctuation.exec(a));)
                a = a.slice(0, i.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
            for (; e;)
                if (l || (o = ""),
                    l = !1,
                    !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((s => !!(n = s.call({
                        lexer: this
                    }, e, t)) && (e = e.substring(n.raw.length),
                        t.push(n),
                        !0)))))
                    if (n = this.tokenizer.escape(e))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (n = this.tokenizer.tag(e))
                        e = e.substring(n.raw.length),
                            s = t[t.length - 1],
                            s && "text" === n.type && "text" === s.type ? (s.raw += n.raw,
                                s.text += n.text) : t.push(n);
                    else if (n = this.tokenizer.link(e))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (n = this.tokenizer.reflink(e, this.tokens.links))
                        e = e.substring(n.raw.length),
                            s = t[t.length - 1],
                            s && "text" === n.type && "text" === s.type ? (s.raw += n.raw,
                                s.text += n.text) : t.push(n);
                    else if (n = this.tokenizer.emStrong(e, a, o))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (n = this.tokenizer.codespan(e))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (n = this.tokenizer.br(e))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (n = this.tokenizer.del(e))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (n = this.tokenizer.autolink(e))
                        e = e.substring(n.raw.length),
                            t.push(n);
                    else if (this.state.inLink || !(n = this.tokenizer.url(e))) {
                        if (r = e,
                            this.options.extensions && this.options.extensions.startInline) {
                            let t = 1 / 0;
                            const n = e.slice(1);
                            let s;
                            this.options.extensions.startInline.forEach((e => {
                                s = e.call({
                                    lexer: this
                                }, n),
                                    "number" == typeof s && s >= 0 && (t = Math.min(t, s))
                            }
                            )),
                                t < 1 / 0 && t >= 0 && (r = e.substring(0, t + 1))
                        }
                        if (n = this.tokenizer.inlineText(r))
                            e = e.substring(n.raw.length),
                                "_" !== n.raw.slice(-1) && (o = n.raw.slice(-1)),
                                l = !0,
                                s = t[t.length - 1],
                                s && "text" === s.type ? (s.raw += n.raw,
                                    s.text += n.text) : t.push(n);
                        else if (e) {
                            const t = "Infinite loop on byte: " + e.charCodeAt(0);
                            if (this.options.silent) {
                                console.error(t);
                                break
                            }
                            throw new Error(t)
                        }
                    } else
                        e = e.substring(n.raw.length),
                            t.push(n);
            return t
        }
    }
    class ne {
        options;
        parser;
        constructor(t) {
            this.options = t || e.defaults
        }
        space(e) {
            return ""
        }
        code({ text: e, lang: t, escaped: n }) {
            const s = (t || "").match(/^\S*/)?.[0]
                , r = e.replace(/\n$/, "") + "\n";
            return s ? '<pre><code class="language-' + c(s) + '">' + (n ? r : c(r, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? r : c(r, !0)) + "</code></pre>\n"
        }
        blockquote({ tokens: e }) {
            return `<blockquote>\n${this.parser.parse(e)}</blockquote>\n`
        }
        html({ text: e }) {
            return e
        }
        heading({ tokens: e, depth: t }) {
            return `<h${t}>${this.parser.parseInline(e)}</h${t}>\n`
        }
        hr(e) {
            return "<hr>\n"
        }
        list(e) {
            const t = e.ordered
                , n = e.start;
            let s = "";
            for (let t = 0; t < e.items.length; t++) {
                const n = e.items[t];
                s += this.listitem(n)
            }
            const r = t ? "ol" : "ul";
            return "<" + r + (t && 1 !== n ? ' start="' + n + '"' : "") + ">\n" + s + "</" + r + ">\n"
        }
        listitem(e) {
            let t = "";
            if (e.task) {
                const n = this.checkbox({
                    checked: !!e.checked
                });
                e.loose ? e.tokens.length > 0 && "paragraph" === e.tokens[0].type ? (e.tokens[0].text = n + " " + e.tokens[0].text,
                    e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && "text" === e.tokens[0].tokens[0].type && (e.tokens[0].tokens[0].text = n + " " + e.tokens[0].tokens[0].text)) : e.tokens.unshift({
                        type: "text",
                        raw: n + " ",
                        text: n + " "
                    }) : t += n + " "
            }
            return t += this.parser.parse(e.tokens, !!e.loose),
                `<li>${t}</li>\n`
        }
        checkbox({ checked: e }) {
            return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">'
        }
        paragraph({ tokens: e }) {
            return `<p>${this.parser.parseInline(e)}</p>\n`
        }
        table(e) {
            let t = ""
                , n = "";
            for (let t = 0; t < e.header.length; t++)
                n += this.tablecell(e.header[t]);
            t += this.tablerow({
                text: n
            });
            let s = "";
            for (let t = 0; t < e.rows.length; t++) {
                const r = e.rows[t];
                n = "";
                for (let e = 0; e < r.length; e++)
                    n += this.tablecell(r[e]);
                s += this.tablerow({
                    text: n
                })
            }
            return s && (s = `<tbody>${s}</tbody>`),
                "<table>\n<thead>\n" + t + "</thead>\n" + s + "</table>\n"
        }
        tablerow({ text: e }) {
            return `<tr>\n${e}</tr>\n`
        }
        tablecell(e) {
            const t = this.parser.parseInline(e.tokens)
                , n = e.header ? "th" : "td";
            return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>\n`
        }
        strong({ tokens: e }) {
            return `<strong>${this.parser.parseInline(e)}</strong>`
        }
        em({ tokens: e }) {
            return `<em>${this.parser.parseInline(e)}</em>`
        }
        codespan({ text: e }) {
            return `<code>${e}</code>`
        }
        br(e) {
            return "<br>"
        }
        del({ tokens: e }) {
            return `<del>${this.parser.parseInline(e)}</del>`
        }
        link({ href: e, title: t, tokens: n }) {
            const s = this.parser.parseInline(n)
                , r = k(e);
            if (null === r)
                return s;
            let i = '<a href="' + (e = r) + '"';
            return t && (i += ' title="' + t + '"'),
                i += ">" + s + "</a>",
                i
        }
        image({ href: e, title: t, text: n }) {
            const s = k(e);
            if (null === s)
                return n;
            let r = `<img src="${e = s}" alt="${n}"`;
            return t && (r += ` title="${t}"`),
                r += ">",
                r
        }
        text(e) {
            return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : e.text
        }
    }
    class se {
        strong({ text: e }) {
            return e
        }
        em({ text: e }) {
            return e
        }
        codespan({ text: e }) {
            return e
        }
        del({ text: e }) {
            return e
        }
        html({ text: e }) {
            return e
        }
        text({ text: e }) {
            return e
        }
        link({ text: e }) {
            return "" + e
        }
        image({ text: e }) {
            return "" + e
        }
        br() {
            return ""
        }
    }
    class re {
        options;
        renderer;
        textRenderer;
        constructor(t) {
            this.options = t || e.defaults,
                this.options.renderer = this.options.renderer || new ne,
                this.renderer = this.options.renderer,
                this.renderer.options = this.options,
                this.renderer.parser = this,
                this.textRenderer = new se
        }
        static parse(e, t) {
            return new re(t).parse(e)
        }
        static parseInline(e, t) {
            return new re(t).parseInline(e)
        }
        parse(e, t = !0) {
            let n = "";
            for (let s = 0; s < e.length; s++) {
                const r = e[s];
                if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) {
                    const e = r
                        , t = this.options.extensions.renderers[e.type].call({
                            parser: this
                        }, e);
                    if (!1 !== t || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(e.type)) {
                        n += t || "";
                        continue
                    }
                }
                const i = r;
                switch (i.type) {
                    case "space":
                        n += this.renderer.space(i);
                        continue;
                    case "hr":
                        n += this.renderer.hr(i);
                        continue;
                    case "heading":
                        n += this.renderer.heading(i);
                        continue;
                    case "code":
                        n += this.renderer.code(i);
                        continue;
                    case "table":
                        n += this.renderer.table(i);
                        continue;
                    case "blockquote":
                        n += this.renderer.blockquote(i);
                        continue;
                    case "list":
                        n += this.renderer.list(i);
                        continue;
                    case "html":
                        n += this.renderer.html(i);
                        continue;
                    case "paragraph":
                        n += this.renderer.paragraph(i);
                        continue;
                    case "text":
                        {
                            let r = i
                                , l = this.renderer.text(r);
                            for (; s + 1 < e.length && "text" === e[s + 1].type;)
                                r = e[++s],
                                    l += "\n" + this.renderer.text(r);
                            n += t ? this.renderer.paragraph({
                                type: "paragraph",
                                raw: l,
                                text: l,
                                tokens: [{
                                    type: "text",
                                    raw: l,
                                    text: l
                                }]
                            }) : l;
                            continue
                        }
                    default:
                        {
                            const e = 'Token with "' + i.type + '" type was not found.';
                            if (this.options.silent)
                                return console.error(e),
                                    "";
                            throw new Error(e)
                        }
                }
            }
            return n
        }
        parseInline(e, t) {
            t = t || this.renderer;
            let n = "";
            for (let s = 0; s < e.length; s++) {
                const r = e[s];
                if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) {
                    const e = this.options.extensions.renderers[r.type].call({
                        parser: this
                    }, r);
                    if (!1 !== e || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
                        n += e || "";
                        continue
                    }
                }
                const i = r;
                switch (i.type) {
                    case "escape":
                    case "text":
                        n += t.text(i);
                        break;
                    case "html":
                        n += t.html(i);
                        break;
                    case "link":
                        n += t.link(i);
                        break;
                    case "image":
                        n += t.image(i);
                        break;
                    case "strong":
                        n += t.strong(i);
                        break;
                    case "em":
                        n += t.em(i);
                        break;
                    case "codespan":
                        n += t.codespan(i);
                        break;
                    case "br":
                        n += t.br(i);
                        break;
                    case "del":
                        n += t.del(i);
                        break;
                    default:
                        {
                            const e = 'Token with "' + i.type + '" type was not found.';
                            if (this.options.silent)
                                return console.error(e),
                                    "";
                            throw new Error(e)
                        }
                }
            }
            return n
        }
    }
    class ie {
        options;
        constructor(t) {
            this.options = t || e.defaults
        }
        static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens"]);
        preprocess(e) {
            return e
        }
        postprocess(e) {
            return e
        }
        processAllTokens(e) {
            return e
        }
    }
    class le {
        defaults = {
            async: !1,
            breaks: !1,
            extensions: null,
            gfm: !0,
            hooks: null,
            pedantic: !1,
            renderer: null,
            silent: !1,
            tokenizer: null,
            walkTokens: null
        };
        options = this.setOptions;
        parse = this.#e(te.lex, re.parse);
        parseInline = this.#e(te.lexInline, re.parseInline);
        Parser = re;
        Renderer = ne;
        TextRenderer = se;
        Lexer = te;
        Tokenizer = b;
        Hooks = ie;
        constructor(...e) {
            this.use(...e)
        }
        walkTokens(e, t) {
            let n = [];
            for (const s of e)
                switch (n = n.concat(t.call(this, s)),
                s.type) {
                    case "table":
                        {
                            const e = s;
                            for (const s of e.header)
                                n = n.concat(this.walkTokens(s.tokens, t));
                            for (const s of e.rows)
                                for (const e of s)
                                    n = n.concat(this.walkTokens(e.tokens, t));
                            break
                        }
                    case "list":
                        {
                            const e = s;
                            n = n.concat(this.walkTokens(e.items, t));
                            break
                        }
                    default:
                        {
                            const e = s;
                            this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((s => {
                                const r = e[s].flat(1 / 0);
                                n = n.concat(this.walkTokens(r, t))
                            }
                            )) : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t)))
                        }
                }
            return n
        }
        use(...e) {
            const t = this.defaults.extensions || {
                renderers: {},
                childTokens: {}
            };
            return e.forEach((e => {
                const n = {
                    ...e
                };
                if (n.async = this.defaults.async || n.async || !1,
                    e.extensions && (e.extensions.forEach((e => {
                        if (!e.name)
                            throw new Error("extension name required");
                        if ("renderer" in e) {
                            const n = t.renderers[e.name];
                            t.renderers[e.name] = n ? function (...t) {
                                let s = e.renderer.apply(this, t);
                                return !1 === s && (s = n.apply(this, t)),
                                    s
                            }
                                : e.renderer
                        }
                        if ("tokenizer" in e) {
                            if (!e.level || "block" !== e.level && "inline" !== e.level)
                                throw new Error("extension level must be 'block' or 'inline'");
                            const n = t[e.level];
                            n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer],
                                e.start && ("block" === e.level ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : "inline" === e.level && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start]))
                        }
                        "childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens)
                    }
                    )),
                        n.extensions = t),
                    e.renderer) {
                    const t = this.defaults.renderer || new ne(this.defaults);
                    for (const n in e.renderer) {
                        if (!(n in t))
                            throw new Error(`renderer '${n}' does not exist`);
                        if (["options", "parser"].includes(n))
                            continue;
                        const s = n;
                        let r = e.renderer[s];
                        const i = t[s];
                        t[s] = (...n) => {
                            e.useNewRenderer || (r = this.#t(r, s, t));
                            let l = r.apply(t, n);
                            return !1 === l && (l = i.apply(t, n)),
                                l || ""
                        }
                    }
                    n.renderer = t
                }
                if (e.tokenizer) {
                    const t = this.defaults.tokenizer || new b(this.defaults);
                    for (const n in e.tokenizer) {
                        if (!(n in t))
                            throw new Error(`tokenizer '${n}' does not exist`);
                        if (["options", "rules", "lexer"].includes(n))
                            continue;
                        const s = n
                            , r = e.tokenizer[s]
                            , i = t[s];
                        t[s] = (...e) => {
                            let n = r.apply(t, e);
                            return !1 === n && (n = i.apply(t, e)),
                                n
                        }
                    }
                    n.tokenizer = t
                }
                if (e.hooks) {
                    const t = this.defaults.hooks || new ie;
                    for (const n in e.hooks) {
                        if (!(n in t))
                            throw new Error(`hook '${n}' does not exist`);
                        if ("options" === n)
                            continue;
                        const s = n
                            , r = e.hooks[s]
                            , i = t[s];
                        ie.passThroughHooks.has(n) ? t[s] = e => {
                            if (this.defaults.async)
                                return Promise.resolve(r.call(t, e)).then((e => i.call(t, e)));
                            const n = r.call(t, e);
                            return i.call(t, n)
                        }
                            : t[s] = (...e) => {
                                let n = r.apply(t, e);
                                return !1 === n && (n = i.apply(t, e)),
                                    n
                            }
                    }
                    n.hooks = t
                }
                if (e.walkTokens) {
                    const t = this.defaults.walkTokens
                        , s = e.walkTokens;
                    n.walkTokens = function (e) {
                        let n = [];
                        return n.push(s.call(this, e)),
                            t && (n = n.concat(t.call(this, e))),
                            n
                    }
                }
                this.defaults = {
                    ...this.defaults,
                    ...n
                }
            }
            )),
                this
        }
        #t(e, t, n) {
            switch (t) {
                case "heading":
                    return function (s) {
                        return s.type && s.type === t ? e(n.parser.parseInline(s.tokens), s.depth, function (e) {
                            return e.replace(h, ((e, t) => "colon" === (t = t.toLowerCase()) ? ":" : "#" === t.charAt(0) ? "x" === t.charAt(1) ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""))
                        }(n.parser.parseInline(s.tokens, n.parser.textRenderer))) : e.apply(this, arguments)
                    }
                        ;
                case "code":
                    return function (n) {
                        return n.type && n.type === t ? e(n.text, n.lang, !!n.escaped) : e.apply(this, arguments)
                    }
                        ;
                case "table":
                    return function (n) {
                        if (!n.type || n.type !== t)
                            return e.apply(this, arguments);
                        let s = ""
                            , r = "";
                        for (let e = 0; e < n.header.length; e++)
                            r += this.tablecell({
                                text: n.header[e].text,
                                tokens: n.header[e].tokens,
                                header: !0,
                                align: n.align[e]
                            });
                        s += this.tablerow({
                            text: r
                        });
                        let i = "";
                        for (let e = 0; e < n.rows.length; e++) {
                            const t = n.rows[e];
                            r = "";
                            for (let e = 0; e < t.length; e++)
                                r += this.tablecell({
                                    text: t[e].text,
                                    tokens: t[e].tokens,
                                    header: !1,
                                    align: n.align[e]
                                });
                            i += this.tablerow({
                                text: r
                            })
                        }
                        return e(s, i)
                    }
                        ;
                case "blockquote":
                    return function (n) {
                        if (!n.type || n.type !== t)
                            return e.apply(this, arguments);
                        const s = this.parser.parse(n.tokens);
                        return e(s)
                    }
                        ;
                case "list":
                    return function (n) {
                        if (!n.type || n.type !== t)
                            return e.apply(this, arguments);
                        const s = n.ordered
                            , r = n.start
                            , i = n.loose;
                        let l = "";
                        for (let e = 0; e < n.items.length; e++) {
                            const t = n.items[e]
                                , s = t.checked
                                , r = t.task;
                            let o = "";
                            if (t.task) {
                                const e = this.checkbox({
                                    checked: !!s
                                });
                                i ? t.tokens.length > 0 && "paragraph" === t.tokens[0].type ? (t.tokens[0].text = e + " " + t.tokens[0].text,
                                    t.tokens[0].tokens && t.tokens[0].tokens.length > 0 && "text" === t.tokens[0].tokens[0].type && (t.tokens[0].tokens[0].text = e + " " + t.tokens[0].tokens[0].text)) : t.tokens.unshift({
                                        type: "text",
                                        text: e + " "
                                    }) : o += e + " "
                            }
                            o += this.parser.parse(t.tokens, i),
                                l += this.listitem({
                                    type: "list_item",
                                    raw: o,
                                    text: o,
                                    task: r,
                                    checked: !!s,
                                    loose: i,
                                    tokens: t.tokens
                                })
                        }
                        return e(l, s, r)
                    }
                        ;
                case "html":
                    return function (n) {
                        return n.type && n.type === t ? e(n.text, n.block) : e.apply(this, arguments)
                    }
                        ;
                case "paragraph":
                case "strong":
                case "em":
                case "del":
                    return function (n) {
                        return n.type && n.type === t ? e(this.parser.parseInline(n.tokens)) : e.apply(this, arguments)
                    }
                        ;
                case "escape":
                case "codespan":
                case "text":
                    return function (n) {
                        return n.type && n.type === t ? e(n.text) : e.apply(this, arguments)
                    }
                        ;
                case "link":
                    return function (n) {
                        return n.type && n.type === t ? e(n.href, n.title, this.parser.parseInline(n.tokens)) : e.apply(this, arguments)
                    }
                        ;
                case "image":
                    return function (n) {
                        return n.type && n.type === t ? e(n.href, n.title, n.text) : e.apply(this, arguments)
                    }
            }
            return e
        }
        setOptions(e) {
            return this.defaults = {
                ...this.defaults,
                ...e
            },
                this
        }
        lexer(e, t) {
            return te.lex(e, t ?? this.defaults)
        }
        parser(e, t) {
            return re.parse(e, t ?? this.defaults)
        }
        #e(e, t) {
            return (n, s) => {
                const r = {
                    ...s
                }
                    , i = {
                        ...this.defaults,
                        ...r
                    };
                !0 === this.defaults.async && !1 === r.async && (i.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."),
                    i.async = !0);
                const l = this.#n(!!i.silent, !!i.async);
                if (null == n)
                    return l(new Error("marked(): input parameter is undefined or null"));
                if ("string" != typeof n)
                    return l(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
                if (i.hooks && (i.hooks.options = i),
                    i.async)
                    return Promise.resolve(i.hooks ? i.hooks.preprocess(n) : n).then((t => e(t, i))).then((e => i.hooks ? i.hooks.processAllTokens(e) : e)).then((e => i.walkTokens ? Promise.all(this.walkTokens(e, i.walkTokens)).then((() => e)) : e)).then((e => t(e, i))).then((e => i.hooks ? i.hooks.postprocess(e) : e)).catch(l);
                try {
                    i.hooks && (n = i.hooks.preprocess(n));
                    let s = e(n, i);
                    i.hooks && (s = i.hooks.processAllTokens(s)),
                        i.walkTokens && this.walkTokens(s, i.walkTokens);
                    let r = t(s, i);
                    return i.hooks && (r = i.hooks.postprocess(r)),
                        r
                } catch (e) {
                    return l(e)
                }
            }
        }
        #n(e, t) {
            return n => {
                if (n.message += "\nPlease report this to https://github.com/markedjs/marked.",
                    e) {
                    const e = "<p>An error occurred:</p><pre>" + c(n.message + "", !0) + "</pre>";
                    return t ? Promise.resolve(e) : e
                }
                if (t)
                    return Promise.reject(n);
                throw n
            }
        }
    }
    const oe = new le;
    function ae(e, t) {
        return oe.parse(e, t)
    }
    ae.options = ae.setOptions = function (e) {
        return oe.setOptions(e),
            ae.defaults = oe.defaults,
            n(ae.defaults),
            ae
    }
        ,
        ae.getDefaults = t,
        ae.defaults = e.defaults,
        ae.use = function (...e) {
            return oe.use(...e),
                ae.defaults = oe.defaults,
                n(ae.defaults),
                ae
        }
        ,
        ae.walkTokens = function (e, t) {
            return oe.walkTokens(e, t)
        }
        ,
        ae.parseInline = oe.parseInline,
        ae.Parser = re,
        ae.parser = re.parse,
        ae.Renderer = ne,
        ae.TextRenderer = se,
        ae.Lexer = te,
        ae.lexer = te.lex,
        ae.Tokenizer = b,
        ae.Hooks = ie,
        ae.parse = ae;
    const ce = ae.options
        , he = ae.setOptions
        , pe = ae.use
        , ue = ae.walkTokens
        , ke = ae.parseInline
        , ge = ae
        , fe = re.parse
        , de = te.lex;
    e.Hooks = ie,
        e.Lexer = te,
        e.Marked = le,
        e.Parser = re,
        e.Renderer = ne,
        e.TextRenderer = se,
        e.Tokenizer = b,
        e.getDefaults = t,
        e.lexer = de,
        e.marked = ae,
        e.options = ce,
        e.parse = ge,
        e.parseInline = ke,
        e.parser = fe,
        e.setOptions = he,
        e.use = pe,
        e.walkTokens = ue;
    return e;
})();
