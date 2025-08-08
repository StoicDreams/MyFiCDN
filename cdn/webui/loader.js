/*!
 * Web UI Loader - https://webui.stoicdreams.com
 * This script is used to dynamically load Web UI web components (webui-*) from cdn.myfi.ws and app components (app-*) from the local /wc (webui.appSrc) folder as they are encountered in the dom.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
/*  */
"use strict"
const webui = (() => {
    {
        const markdownSrc = location.host === '127.0.0.1:3180' ? '/js/mdparse.min.js' : 'https://cdn.myfi.ws/js/mdparse.min.js';
        import(markdownSrc).then(module => {
            webui.marked = new module.MarkdownParser();
            webui.loaded = true;
        });
    }
    const domain = location.hostname;
    const AsyncFunction = (async () => { }).constructor;
    window.AsyncFunction = AsyncFunction;
    const map = {
        subs: {}
    };
    // TODO: Temp debug
    window.subs = map.subs;
    const roles = {};
    let lastActive = Date.now();
    {
        const minTimeout = 1000 * 60 * 5;
        function checkForRoleRefresh() {
            if (webui.userRoles !== 0) {
                let autoSignout = (webui.getData('session-autosignout') || 30) * 60 * 1000;
                if (autoSignout < minTimeout) {
                    autoSignout = minTimeout;
                }
                let expiresAt = lastActive + autoSignout;
                if (Date.now() < expiresAt) {
                    setTimeout(() => checkForRoleRefresh(), autoSignout);
                    webui.loadRoles();
                } else {
                    setTimeout(() => checkForRoleRefresh(), minTimeout);
                }
            } else {
                setTimeout(() => checkForRoleRefresh(), minTimeout);
            }
        }
        setTimeout(() => checkForRoleRefresh(), minTimeout);
    }
    const appDataOnce = [];
    const appDataLimit = ['app-name', 'app-company-singular', 'app-company-possessive', 'app-domain', 'app-api', 'app-not-found-html', 'app-data-endpoint', 'app-content-endpoint'];
    const notifyForAppDataChanges = [];
    const notifyForSessionDataChanges = [];
    function notifyAppDataChanged(changeDetails) {
        notifyForAppDataChanges.forEach(handler => {
            if (!handler) return;
            handler(changeDetails, watchedAppData);
        });
    }
    function notifySessionDataChanged(changeDetails) {
        notifyForSessionDataChanges.forEach(handler => {
            if (!handler) return;
            handler(changeDetails, watchedSessionData);
        });
        storage.setItem('session-data', JSON.stringify(watchedSessionData));
    }
    function getHandler(notifyHandler) {
        const handler = {
            set(target, property, value, receiver) {
                const oldValue = target[property];
                const changeType = property in target ? 'update' : 'add';
                const success = Reflect.set(target, property, value, receiver);
                if (success && oldValue !== value) {
                    notifyHandler({
                        type: changeType,
                        property: property,
                        oldValue: oldValue,
                        newValue: value,
                        timestamp: new Date()
                    });
                }
                return success;
            },
            deleteProperty(target, property) {
                if (property in target) {
                    const oldValue = target[property];
                    const success = Reflect.deleteProperty(target, property);
                    if (success) {
                        notifyHandler({
                            type: 'delete',
                            property: property,
                            oldValue: oldValue,
                            timestamp: new Date()
                        });
                    }
                    return success;
                }
                return true;
            }
        };
        return handler;
    }
    const watchedAppData = (() => {
        const appData = {
            'app-name': 'App',
            'app-company-singular': 'Company',
            'app-company-possessive': `Company's`,
            'app-content-endpoint': '/d/en-US',
            'app-domain': domain.toLowerCase(),
            'page-title': '',
            'page-subtitle': '',
            'page-path': location.pathname,
        };
        return new Proxy(appData, getHandler(notifyAppDataChanged));
    })();
    // TODO: debug
    window.appData = watchedAppData;
    let isProcessing = false;
    const watchedSessionData = (() => {
        let sessionData = {
            'session-user-role': 0,
            'session-username': 'Guest',
            'session-full-name': 'Guest',
            'session-first-name': 'Guest',
            'session-last-name': '',
            'session-autosignout': 30
        };
        return new Proxy(sessionData, getHandler(notifySessionDataChanged));
    })();
    // TODO: debug
    window.sessionData = watchedSessionData;
    const appSettings = {
        appType: 'website',
        isDesktopApp: false,
        rootPage: 'root',
        contentExtension: '.md',
        pageContentEndpoint: '/d/en-US',
        encryptPageContent: false,
        encryptPageData: 'base64'
    };
    let debug = false;
    const memStorageCache = {};
    const STORAGE_ACCEPTED_KEY = 'storage_accepted';
    const ACCEPT_SESSION_STORAGE = '1';
    const ACCEPT_LOCAL_STORAGE = '2';
    const cachedFetches = {};
    let acceptedStorage = ACCEPT_SESSION_STORAGE;
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
    }
    const storage = new MemStorage();
    class WebUI {
        appSrc = '/wc';
        appMin = '.min';
        appConfig = {};
        marked = { parse(...args) { console.log('Unhandled parse', args); return ''; } }
        constructor() {
            this._appSettings = appSettings;
            this.storage = storage;
            let cachedSessionData = this.storage.getItem('session-data') || {};
            if (typeof cachedSessionData === 'string') {
                cachedSessionData = JSON.parse(cachedSessionData);
            }
            Object.keys(cachedSessionData).forEach(key => {
                watchedSessionData[key] = cachedSessionData[key];
            });
        }
        applyAppDataToContent(content, preTrim) {
            let data = typeof preTrim !== undefined && typeof preTrim !== 'boolean' ? preTrim : undefined;
            let pt = typeof preTrim == 'boolean' ? preTrim : undefined;
            return this.parseWebuiMarkdown(this.replaceAppData(content, data), pt);
        }
        applyDynamicStyles() { }
        applyProperties(t) { }
        clone(data) {
            if (data === undefined || data === null) return data;
            if (typeof data !== 'object') return data;
            try {
                return structuredClone(data);
            } catch {
                data = { ...data };
                return structuredClone(data);
            }
        }
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
        closest(target, selector) {
            if (!target) return null;
            if (target.composedPath instanceof Function) {
                const path = target.composedPath();
                for (const el of path) {
                    if (el instanceof Element && el.matches(selector)) return el;
                }
            } else {
                let el = target;
                while (el) {
                    if (el.matches instanceof Function && el.matches(selector)) return el;
                    el = el.parentNode || el.host;
                }
            }
            return null;
        }
        async copyToClipboard(value) {
            await navigator.clipboard.writeText(value);
            webui.alert('Copied code to clipboard', 'success');
        }
        define(name, options) {
            options = options || {};
            options.attr = options.attr || [];
            options.flags = options.flags || [];
            ['class'].forEach(attr => {
                if (options.attr.indexOf(attr) === -1) {
                    options.attr.push(attr);
                }
            });
            let defineOptions = {};
            let shadowTemplate = 0;
            if (options.shadowTemplate) {
                shadowTemplate = webui.create('template');
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
                disconnectHandlers = [];
                constructor() {
                    super();
                    const t = this;
                    if (isInput) {
                        t.internals_ = t.attachInternals();
                        t.addEventListener('keyup', ev => {
                            if (ev.key === 'Enter' && !ev.ctrlKey && !ev.shiftKey) {
                                let form = t.internals_.form;
                                ev.preventDefault();
                                ev.stopPropagation();
                                form?.requestSubmit();
                            }
                        });
                    }
                    if (options.props) {
                        Object.keys(options.props).forEach(key => {
                            Object.defineProperty(t, key, options.props[key]);
                        });
                    }
                    if (isInput) {
                        Object.defineProperty(t, 'name', {
                            get() { return t.getAttribute('name'); },
                            set(v) { t.setAttribute('name', v); }
                        });
                        if (!t.formResetCallback) {
                            t.formResetCallback = () => { t.value = ''; }
                        }
                        if (!t.formStateRestoreCallback) {
                            t.formStateRestoreCallback = (state) => { t.value = state; }
                        }
                        t.addEventListener('input', _ => {
                            t.internals_.setFormValue(t.value);
                        });
                        t.addEventListener('change', _ => {
                            t.internals_.setFormValue(t.value);
                        });
                    }
                    t._id = `d${webui.uuid()}`.split('-').join('').toLowerCase();
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
                            scrollMargin: '30px',
                            threshold: 0, // percentage of target's visible area. Triggers "onIntersection"
                            delay: 100
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
                            webui.querySelectorAll(selector, t.template).forEach(el => {
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
                addDataset(key, value) {
                    const t = this;
                    if (t.hasDataset(key, value)) {
                        webui.log.info('Dataset already has that value', key, value);
                        return;
                    }
                    let ds = t.getAttribute(`data-${key}`);
                    ds = ds ? ds.split('|') : [];
                    ds.push(value);
                    t.setAttribute(`data-${key}`, ds.join('|'));
                }
                hasDataset(key, value) {
                    const t = this;
                    let ds = t.getAttribute(`data-${key}`);
                    ds = ds ? ds.split('|') : [];
                    if (value === undefined) {
                        return ds.length !== 0;
                    }
                    let found = false;
                    ds.forEach(item => {
                        let k = item.split(':')[0];
                        if (k === key) {
                            found = true;
                        }
                    });
                    return found;
                }
                attributeChangedCallback(property, oldValue, newValue) {
                    const t = this;
                    if (oldValue === newValue) return;
                    let propDefined = property;
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
                    if (options.flags.indexOf(propDefined) !== -1 || options.flags.indexOf(property) !== -1) {
                        newValue = webui.setFlag(this, property, newValue);
                    } else {
                        webui.setProperty(this, property, newValue);
                    }
                    if (options.attrChanged) {
                        options.attrChanged(this, property, newValue);
                    }
                }
                connectedCallback() {
                    const t = this;
                    if (options.content) {
                        t.classList.add('content');
                    }
                    if (t._connectedInit) {
                        if (typeof options.reconnected === 'function') {
                            setTimeout(() => {
                                options.reconnected(t);
                            }, 1);
                        }
                        return;
                    }
                    t._connectedInit = true;
                    t._isConnected = true;
                    checkAddedNode(t);
                    if (options.preload) {
                        t.setAttribute('preload', options.preload);
                    }
                    if (typeof options.connected === 'function') {
                        setTimeout(() => {
                            options.connected(t);
                        }, 1);
                    }
                    if (t.shadowRoot && t.shadowRoot && t.shadowRoot.childNodes) {
                        t.setAttribute('has-shadow', true);
                        t.shadowRoot.childNodes.forEach(node => {
                            if (node.nodeName === 'SLOT') {
                                node.classList = t.classList;
                            }
                        });
                    }
                    if (isInput) {
                        t.internals_.setFormValue(t.value);
                    }
                }
                disconnectedCallback() {
                    this._isConnected = false;
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
                snapshot() {
                    const t = this;
                    let snapshot = {};
                    if (t.options?.attr?.length) {
                        t.options.attr.forEach(attr => {
                            let key = webui.toCamel(attr);
                            snapshot[key] = t[key];
                        });
                    }
                    if (t.props) {
                        Object.keys(t.props).forEach(key => {
                            snapshot[key] = t[key];
                        });
                    }
                    if (typeof t.value !== 'undefined') {
                        snapshot.value = t.value;
                    }
                    snapshot.classList = Array.from(t.classList).sort();
                    t._snapshot = JSON.stringify(snapshot);
                    return t._snapshot;
                }
                get hasChanges() {
                    let a = this._snapshot;
                    let b = this.snapshot();
                    if (a === undefined) {
                        return true;
                    }
                    return a !== b;
                }
            }
            customElements.define(name, CustomElement, defineOptions);
        }
        displaySeconds(value, onZero = '0 seconds') {
            let seconds = parseFloat(value) || 0;
            if (seconds === 0) return onZero;
            if (seconds < 60) return `${value} seconds`;
            let min = Math.floor(seconds / 60);
            seconds = seconds % 60;
            if (min < 60) return `${min} min, ${seconds} sec`;
            let hr = Math.floor(min / 60);
            min = min % 60;
            if (hr < 24) return `${(hr)} hr${hr > 1 ? 's' : ''}, ${min} min, ${seconds} sec`;
            let days = Math.floor(hr / 24);
            hr = hr % 24;
            let result = [];
            result.push(`${days} day${days > 1 ? 's' : ''}`);
            min = min + (hr * 60);
            seconds = seconds + (min * 60);
            if (seconds > 0) {
                result.push(webui.displaySeconds(seconds));
            }
            return result.join(' ');
        }
        displayMinutes(value, onZero = '0 minutes') {
            let min = parseFloat(value) || 0;
            if (min === 0) return onZero;
            if (min < 60) return `${(min)} minutes`;
            let hr = Math.floor(min / 60);
            min = min % 60;
            if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''}, ${min} min`;
            let days = Math.floor(hr / 24);
            hr = hr % 24;
            let result = [];
            result.push(`${days} day${days > 1 ? 's' : ''}`);
            min = min + (hr * 60);
            if (min > 0) {
                result.push(webui.displayMinutes(min));
            }
            return result.join(' ');
        }
        displayLeadingZero(number, count = 1) {
            let pad = 1 + count - `${number}`.length;
            if (pad <= 0) return `${number}`;
            return `${'0'.repeat(pad)}${number}`;
        }
        escapeForHTML(text) {
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;")
                .replace(/\//g, "&#x2F;")
                .replace(/`/g, "&#96;");
        }
        async fetchApi(url, data, method = 'POST') {
            const t = this;
            if (!url.startsWith('http')) {
                let count = 0;
                while (!t.appConfig.appApi && count < 500) {
                    await t.wait(10);
                }
                const api = t.appConfig.appApi || '';
                url = url[0] === '/' ? `${api}${url}` : `${api}/${url}`;
            }
            let headers = {};
            if (data && data.headers) {
                headers = data.headers;
                delete data.headers;
            }
            let body = data;
            headers['Content-Type'] = 'text/plain';
            if (!headers['x-cookie-age']) {
                headers['x-cookie-age'] = webui.getData('session-autosignout') || 30;
            }
            if (['get'].indexOf(method.toLowerCase()) !== -1) {
                body = undefined;
            } else if (data instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
            } else if (typeof data !== 'string') {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
            }
            return await fetch(url, {
                method: method.toUpperCase(),
                credentials: 'include',
                mode: 'cors',
                cache: 'no-cache',
                body: body,
                headers: headers
            });
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
        fromBase64(encoded) {
            encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
            while (encoded.length % 4 !== 0) {
                encoded = `${encoded}=`;
            }
            return atob(encoded);
        }
        getData(...args) {
            if (args.length === 0) return undefined;
            if (args.length > 1) {
                let result = [];
                args.forEach(key => {
                    result.push(webui.getData(key));
                });
                return result;
            }
            if (typeof args[0] !== 'string') {
                console.error('Invalid key for webui.getData', args[0], args);
                return;
            }
            let key = args[0].split(':')[0];
            let dataContainer = webui.toSnake(key, '-').startsWith('session-') ? watchedSessionData : watchedAppData;
            let data = webui.getNestedData(key, dataContainer);
            if (data === undefined) {
                data = webui.getNestedData(`session-${key}`, watchedSessionData);
                if (data !== undefined) return webui.clone(data);
                data = webui.getNestedData(`app-${key}`, watchedAppData);
                if (data !== undefined) return webui.clone(data);
                return undefined
            }
            if (typeof data !== 'object') return data;
            return webui.clone(data);
        }
        getNestedData(key, data) {
            let segments = key.split('.');
            if (!data) return undefined;
            if (segments.length === 1) {
                let skey = webui.toSnake(key, '-');
                return webui.getDefined(data[skey], data[key], undefined);
            }
            key = segments.shift();
            let skey = webui.toSnake(key, '-');
            data = webui.getDefined(data[skey], data[key], undefined);
            while (segments.length > 0) {
                if (!data) return undefined;
                key = segments.shift();
                skey = webui.toSnake(key, '-');
                data = webui.getDefined(data[skey], data[key], undefined);
            }
            return data;
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
        getQueryData(key) {
            let data = location.search;
            if (!data || data[0] !== '?') return null;
            let dict = {};
            data.substring(1).split('&').forEach(kv => {
                kv = kv.split('=');
                dict[kv[0]] = kv[1];
            });
            if (!key) return dict;
            return dict[key];
        }
        getResponseHeader(resp, ...keys) {
            let message = undefined;
            keys.forEach(key => {
                if (message) return;
                message = resp.headers.get(key);
            });
            return message;
        }
        getSearchData(key) {
            return webui.getQueryData(key);
        }
        hasSetter(el, field) {
            if (!el || typeof field !== 'string') return false;
            let proto = el;
            while (proto) {
                const descriptor = Object.getOwnPropertyDescriptor(proto, field);
                if (descriptor && typeof descriptor.set === 'function') {
                    return true;
                }
                proto = Object.getPrototypeOf(proto);
            }
            return false;
        }
        isEqual(a, b) {
            if (a === b) return true;
            if (typeof a !== typeof b) return false;
            if (a !== a && b !== b) return true;
            return JSON.stringify(a) === JSON.stringify(b);
        }
        get isLocalhost() {
            if (domain === 'localhost') return true;
            if (parseInt(domain).toString() !== 'NaN') return true;
            return false;
        }
        isTextOverflowing(el) {
            return el.scrollWidth > el.clientWidth + 1;
        }
        get isSignedIn() {
            const t = this;
            let role = t.getDefined(t.getData('session-user-role'), 0);
            return !!((role && 1) !== 0);
        }
        limitChars(text, limit) {
            if (!text || !text.length || text.length <= limit) return text;
            let words = text.split(' ');
            let count = 0;
            let result = [];
            result.push(words.unshift());
            function addWord(word) {
                count += word.length;
                result.push(word);
            }
            addWord(words.unshift());
            while (words.length > 0) {
                let word = words.unshift();
                if (count + word.length > limit) {
                    break;
                }
                addWord(words.unshift());
            }
            return result.join(' ');
        }
        log = (() => {
            let log = (...args) => console.log(...args);
            log.assert = (...args) => console.assert(...args);
            log.info = (...args) => console.info(...args);
            log.dir = (...args) => console.dir(...args);
            log.trace = (...args) => console.trace(...args);
            log.error = (...args) => console.error(...args);
            log.warn = (...args) => console.warn(...args);
            log.time = (key) => console.time(key);
            log.timeEnd = (key) => console.timeEnd(key);
            return log;
        })()
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
        async closeSharedDrawer() {
            let el = document.querySelector('webui-drawer.shared');
            if (!el) return;
            if (el.classList.contains('open')) {
                el.classList.remove('open');
                await webui.wait(400);
            }
        }
        async openSharedDrawer(header, content) {
            if (content === undefined) {
                content = header;
                header = undefined;
            }
            if (typeof header === 'function') {
                if (header.constructor == AsyncFunction) {
                    header = await header();
                } else {
                    header = header();
                }
            }
            if (typeof header === 'string') {
                const container = webui.create('header');
                container.style.padding = 'var(--padding)';
                container.setAttribute('slot', 'header');
                container.innerHTML = header;
                header = container;
            } else {
                let hc = header;
                header = webui.create('header');
                header.style.padding = 'var(--padding)';
                header.setAttribute('slot', 'header');
                if (hc) {
                    header.appendChild(hc);
                }
            }
            if (typeof content === 'function') {
                if (content.constructor == AsyncFunction) {
                    content = await content();
                } else {
                    content = content();
                }
            }
            if (typeof content === 'string') {
                const container = webui.create('section');
                container.style.padding = 'var(--padding)';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.flexGrow = '1';
                container.style.overflow = 'auto';
                container.style.gap = 'var(--padding)';
                container.innerHTML = content;
                content = container;
            }
            let el = document.querySelector('webui-drawer.shared');
            if (!el) {
                webui.dialog({
                    title: header,
                    content: content,
                    confirm: 'Close',
                });
                return;
            }
            if (el.classList.contains('open')) {
                el.classList.remove('open');
                await webui.wait(400);
            }
            el.innerHTML = '';
            el.appendChild(header);
            el.appendChild(content);
            await webui.wait(100);
            el.classList.add('open');
            return content;
        }
        parseWebuiMarkdown(md, preTrim) {
            return this.parseMarkdown(md, preTrim);
        }
        parseMarkdown(md, preTrim) {
            const t = this;
            if (typeof md !== 'string') return md;
            if (preTrim) {
                md = t.trimLinePreWhitespce(md);
            }
            return t.marked.parse(md) || '';
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
        repeat(digit, length) {
            if (!length) return '';
            let digits = [];
            let index = 0;
            while (index++ < length) {
                digits.push(digit);
            }
            return digits.join('');
        }
        replaceAppData(text, data) {
            if (typeof text !== 'string') return text;
            if (data) {
                text = this.replaceData(text, data);
            }
            [watchedAppData, watchedSessionData].forEach(dataContainer => {
                Object.keys(dataContainer).forEach(key => {
                    let keys = [];
                    keys.push(`{${this.toSnake(key).toUpperCase()}}`);
                    if (key.startsWith('session-')) {
                        keys.push(`{${this.toSnake(key.substring(8)).toUpperCase()}}`);
                    } else if (key.startsWith('app-')) {
                        keys.push(`{${this.toSnake(key.substring(4)).toUpperCase()}}`);
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
            if (text.indexOf("{TEMPLATE_ROWDATA}") !== -1) {
                let rowData = webui.escapeForHTML(JSON.stringify(data));
                while (text.indexOf("{TEMPLATE_ROWDATA}") !== -1) {
                    text = text.replace('{TEMPLATE_ROWDATA}', rowData);
                }
            }
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
        resolveFunctionFromString(value, context = window) {
            let t = this;
            const parts = value.split('.');
            if (parts.length === 0) return undefined;
            if (parts[0] === 'webui') {
                context = t;
                parts.shift();
            }
            let func = parts.reduce((acc, part) => {
                if (acc && typeof acc === 'object' && part in acc) {
                    return acc[part];
                }
                return undefined;
            }, context);
            if (typeof func === 'function') {
                return func;
            }
            return null;
        }
        setApp(app) {
            appSettings.app = app;
        }
        setData(key, value) {
            if (!key) return;
            key = key.split(':')[0];
            let sections = key.split('.');
            let baseKey = webui.toSnake(sections[0], '-');
            if (appDataLimit.indexOf(baseKey) !== -1) {
                if (appDataOnce.indexOf(baseKey) !== -1) {
                    webui.log.warn(`${key} is a reserved key and cannot be set again after initialization`);
                    return;
                }
                appDataOnce.push(baseKey);
            }
            let dataContainer = key.startsWith('session-') ? watchedSessionData : watchedAppData;
            value = webui.clone(value);
            if (sections.length === 1) {
                key = webui.toSnake(key, '-');
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
                skey = webui.toSnake(skey, '-');
                if (!dataContainer[skey]) {
                    dataContainer[skey] = {};
                }
                let segment = dataContainer[skey];
                while (sections.length > 1) {
                    skey = sections.shift();
                    skey = webui.toSnake(skey, '-');
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
            Object.keys(map.subs).forEach(skey => {
                let bkey = skey.split('.')[0];
                if (bkey !== baseKey) return;
                map.subs[skey].forEach(node => {
                    setDataToEl(node, skey);
                });
            });
        }
        querySelectorAll(selector, rootNode = document) {
            const results = [];
            if (!rootNode || typeof (rootNode.querySelectorAll) !== 'function') {
                return [];
            }
            rootNode.querySelectorAll(selector).forEach(element => {
                results.push(element);
            });
            rootNode.querySelectorAll('[has-shadow]').forEach(element => {
                if (element.shadowRoot) {
                    const nestedResults = webui.querySelectorAll(selector, element.shadowRoot);
                    results.push(...nestedResults);
                }
            });
            return results;
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
                return false;
            } else {
                t[property] = true;
                return true;
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
                target = target.parentNode || target.host;
            }
        }
        toSnake(key, delim = '_') {
            return key.trim().replace(/[A-Z]{1}/g, letter => `${delim}${letter.toLowerCase()}`).replace(/[-_ ]+/g, _ => delim);
        }
        toCamel(key) {
            return key.trim().replace(/((-| )[A-Za-z0-9]{1})/g, a => { return a[1].toUpperCase(); })
                .replace(/^[A-Z]{1}/, a => { return a.toLowerCase(); });
        }
        toPascel(key) {
            return key.trim().replace(/((-| )[A-Za-z0-9]{1})/g, a => { return a[1].toUpperCase(); })
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
        trimLinePreTabs(html, tabLength = 4) {
            let lines = [], ls = 0;
            let tabRepl = webui.repeat(' ', tabLength);
            let startLines = html.replace(/\t/g, tabRepl).split('\n');
            let tabLen = 999;
            let index = 0;
            for (let line of startLines) {
                if (index++ == 0) continue;
                let m = line.match(/^([ ]*)/)[0].length;
                if (m === 0) return html;
                if (m < tabLen) {
                    tabLen = m;
                }
            };
            if (tabLen === 999) {
                tabLen = 0;
            }
            if (tabLen === 0) return html;
            let rgx = new RegExp(`^[ ]{1,${tabLen}}`);
            for (let line of startLines) {
                lines.push(line.replace(rgx, ''));
            }
            return lines.join('\n');
        }
        trimLinePreWhitespce(html) {
            let lines = [];
            html.split('\n').forEach(l => {
                lines.push(l.trim());
            });
            return lines.join('\n');
        }
        async try(handler, onError, onFinally) {
            if (typeof handler !== 'function') {
                console.error('Invalid handler for webui.try - expecting function', handler, onError);
                return;
            }
            try {
                if (handler.constructor == AsyncFunction) {
                    return await handler();
                } else {
                    return handler();
                }
            } catch (ex) {
                if (typeof onError === 'function') {
                    onError(ex);
                }
            } finally {
                if (typeof onFinally === 'function') {
                    onFinally(ex);
                }
            }
        }
        async trySoloProcess(handler, onError) {
            if (typeof handler !== 'function') {
                console.error('Invalid handler for webui.trySoloProcess - expecting function', handler, onError);
                return;
            }
            if (isProcessing) return;
            isProcessing = true;
            try {
                if (handler.constructor == AsyncFunction) {
                    return await handler();
                } else {
                    return handler();
                }
            } catch (ex) {
                if (typeof onError === 'function') {
                    onError(ex);
                }
            } finally {
                isProcessing = false;
            }
        }
        eventSoloProcess(handler, onError) {
            if (typeof handler !== 'function') {
                console.error('Invalid handler for webui.eventSoloProcess - expecting function', handler, onError);
                return;
            }
            return async () => {
                if (isProcessing) return;
                isProcessing = true;
                try {
                    if (handler.constructor == AsyncFunction) {
                        return await handler();
                    } else {
                        return handler();
                    }
                } catch (ex) {
                    if (typeof onError === 'function') {
                        onError(ex);
                    }
                } finally {
                    isProcessing = false;
                }
            }
        }
        async loadRoles() {
            let t = this;
            if (t.appConfig && t.appConfig.rolesApi) {
                let resp = await t.fetchApi(t.appConfig.rolesApi, null, 'get');
                if (resp.status === 200) {
                    let cookieAge = parseInt(resp.headers.get('X-Cookie-Age') || '') || 30;
                    if (cookieAge > 0) {
                        t.setData('session-autosignout', cookieAge);
                    }
                    let r = parseInt(await resp.text());
                    if (r >= -1) {
                        t.setData('session-user-role', r);
                    } else {
                        t.setData('session-user-role', 0);
                    }
                }
            } else {
                console.warn("Cannot load roles, missing configuration.");
            }
        }
        hasRole(role) {
            return (this.userRoles & role) === role;
        }
        get roles() {
            return roles;
        }
        get userRoles() {
            return this.getData('session-user-role');
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
        watchData(data, handler) {
            return new Proxy(data, getHandler(handler));
        }
        watchAppDataChanges(handler) {
            notifyForAppDataChanges.push(handler);
        }
        watchSessionDataChanges(handler) {
            notifyForSessionDataChanges.push(handler);
        }
        unwatchAppDataChanges(handler) {
            let index = notifyForAppDataChanges.indexOf(handler);
            if (index === -1) return;
            notifyForAppDataChanges.splice(index, 1);
        }
        unwatchSessionDataChanges(handler) {
            let index = notifyForSessionDataChanges.indexOf(handler);
            if (index === -1) return;
            notifyForSessionDataChanges.splice(index, 1);
        }
        wait(milliseconds) {
            return new Promise(resolve => {
                setTimeout(resolve, milliseconds);
            });
        }
    }
    const webui = new WebUI();
    webui.fetchWithCache('https://cdn.myfi.ws/roles.json', true)
        .then(r => {
            Object.assign(roles, r);
            Object.freeze(roles);
        })
        .catch(ex => {
            webui.log.warn("Failed to load roles: %o", ex);
        });
    //storage_accepted
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
        storage.setItem(key, JSON.stringify(state));
    }
    function loadState(node) {
        let key = getNodeKey(node);
        let item = storage.getItem(key);
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
        webui.querySelectorAll('[data-hide]').forEach(el => {
            let sel = el.dataset.hide;
            if (!sel) return;
            let found = document.querySelector(sel);
            el.style.display = found ? '' : 'none';
        });
    }
    function checkDataStateMutations(mutations) {
        updateActivity();
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
    }
    // Data signalling/transfers
    function handleDataClick(ev) {
        let key = ev.dataset.click;
        if (!key) { return; }
        webui.querySelectorAll(`[data-subscribe*="${key}:click"]`).forEach(sub => {
            sub.click();
        });
    }
    async function handleDataTrigger(ev) {
        let el = ev.srcElement || ev.target || ev;
        if (ev.composedPath) {
            for (let path of ev.composedPath()) {
                if (path.dataset && path.dataset.trigger) {
                    el = path;
                    break;
                }
            }
        }
        let tick = 0;
        if (el.nodeName.startsWith('APP-') || el.nodeName.startsWith('WEBUI-')) {
            while (el._isConnected === undefined && ++tick < 100) {
                await webui.wait(10);
            }
            if (!el._isConnected) {
                webui.log.warn('Unexpected: Element is not connected', tick, el);
                return;
            }
        }
        let key = el.dataset.trigger;
        if (!key) return;
        key.split('|').forEach(key => {
            let oldData = webui.getData(key);
            if (key.indexOf(':') !== -1) {
                let kp = key.split(':');
                key = kp[0];
                let getter = kp[1];
                let value = typeof el[getter] === 'function' ? el[getter]() : webui.getDefined(el[getter], el.dataset[getter]);
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
    function setDataToEl(el, key, value) {
        if (typeof key !== 'string') {
            console.error('Invalid key for webui.setDataToEl', key, el);
            return;
        }
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
            let toSet = getToSet(key);
            if (toSet === 'click') return;
            if (key.indexOf(':') !== -1) {
                key = key.split(':')[0];
            }
            let a = 0;
            (function attempt() {
                try {
                    value = webui.getData(key);
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
                            } else if (['number', 'string', 'object'].indexOf(typeof el[fsetter]) !== -1) {
                                el[fsetter] = value;
                            } else if (['number', 'string', 'object'].indexOf(typeof el[field]) !== -1) {
                                el[field] = value;
                            } else {
                                if (a++ < 5) {
                                    setTimeout(() => {
                                        attempt();
                                    }, Math.min(1000, Math.pow(2, a)));
                                } else if (webui.hasSetter(el, 'value')) {
                                    el.value = value;
                                }
                            }
                            break;
                        case 'text':
                        case 'innerText':
                            if (!isNull) {
                                el.innerText = webui.applyAppDataToContent(value, false, true);
                            }
                            break;
                        case 'html':
                        case 'innerHTML':
                            if (!isNull) {
                                el.innerHTML = webui.applyAppDataToContent(value, false, true);
                            }
                            break;
                        default:
                            if (typeof el[toSet] === 'function') {
                                el[toSet](value, key);
                            } else if (['number', 'string', 'object'].indexOf(typeof el[toSet]) !== -1) {
                                el[toSet] = value;
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
        const pageState = { appData: JSON.stringify(watchedAppData) };
        window.history.pushState(pageState, document.title, url);
        loadPage(url);
    }
    function updateActivity() {
        lastActive = Date.now();
    }
    function checkForSubscription(node) {
        if (!node || !node.getAttribute) return;
        let dataKey = node.getAttribute('data-subscribe');
        if (dataKey) {
            dataKey.split('|').forEach(dk => {
                let dataKey = dk.split(':')[0];
                if (!map.subs[dataKey]) {
                    map.subs[dataKey] = [];
                }
                if (map.subs[dataKey].indexOf(node) === -1) {
                    map.subs[dataKey].push(node);
                }
                setDataToEl(node, dataKey);
            });
        }
    }
    function checkAttributeMutations(mutation) {
        if (mutation.type !== 'attributes') return;
        if (mutation.target && mutation.target.nodeName === 'INPUT' && mutation.target.getAttribute('type') === 'hidden' && mutation.attributeName === 'value') {
            handleDataTrigger(mutation.target);
        }
        let t = mutation.target;
        applyAttributeSettings(t, mutation.attributeName);
    }
    function applyAttributeSettings(target, attr) {
        if (webui.closest(target.parentNode, 'webui-code,code,template')) {
            return;
        }
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
    function checkForSubscriptionAttr(node) {
        checkForSubscription(node);
        webui.querySelectorAll('[data-subscribe]', node).forEach(node => {
            checkForSubscription(node);
        });
    }
    function removeNodeFromSubs(node) {
        Object.keys(map.subs).forEach(key => {
            let index = map.subs[key].indexOf(node);
            if (index !== -1) {
                map.subs[key].splice(index, 1);
            }
        });
    }
    function handleRemovedNodes(node) {
        if (node.dataset && node.dataset.subscribe) {
            removeNodeFromSubs(node);
        }
        webui.querySelectorAll('[data-subscribe]', node).forEach(node => {
            removeNodeFromSubs(node);
        });
    }
    function checkDataSubscriptionMutations(mutations) {
        mutations.forEach(function (mutation) {
            checkAttributeMutations(mutation);
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-subscribe') {
                checkForSubscription(mutation.target);
            }
            Array.from(mutation.addedNodes).forEach(el => {
                applyAttributeSettings(el);
                checkForSubscriptionAttr(el);
            });
            Array.from(mutation.removedNodes).forEach(el => {
                handleRemovedNodes(el);
            });
        });
    }
    function transitionDelay(ms) {
        return new Promise((resolve, _) => {
            setTimeout(() => resolve(), ms);
        });
    }
    function clearPageData() {
        Object.keys(watchedAppData).forEach(key => {
            let keepKey = key.startsWith('app-') || key.startsWith('session-') || ['page-path'].indexOf(key) !== -1;
            if (!keepKey) {
                webui.setData(key, '');
            }
        });
    }
    async function fetchRemoteData() {
        const pageDataEndpoint = webui.getData('app-data-endpoint');
        if (pageDataEndpoint) {
            let data = await fetch(`${pageDataEndpoint}${dataUrl}`);
            if (!data.ok) {
                webui.log.warn('Returned page data was not ok for %o', dataUrl);
                return {};
            }
            return await data.json();
        }
        return {};
    }
    async function loadPage() {
        if (!appSettings.app || !webui.appConfig.appName) {
            setTimeout(() => {
                loadPage();
            }, 10);
            return;
        }
        let page = location.pathname === '/' ? '/' + appSettings.rootPage : location.pathname;
        let contentPage = page.toLowerCase();
        if (webui.appConfig.dynNavRoutes && webui.appConfig.dynNavRoutes.length) {
            for (let index = 0; index < webui.appConfig.dynNavRoutes.length; ++index) {
                if (contentPage.startsWith(webui.appConfig.dynNavRoutes[index])) {
                    contentPage = webui.appConfig.dynNavRoutes[index];
                    break;
                }
            }
        }
        if (contentPage.endsWith('/')) {
            contentPage = contentPage.substring(0, contentPage.length - 1);
        }
        let contentUrl = `${contentPage}${appSettings.contentExtension}${location.search}`;
        if (appSettings.encryptPageContent) {
            contentUrl = encryptUrl(contentUrl, appSettings.encryptPageContent);
        }
        let fullContentUrl = `${webui.getData('app-content-endpoint')}${contentUrl}`;
        let fetchContent = fetch(fullContentUrl);
        let fetchData = fetchRemoteData();
        appSettings.app.main.classList.add('transition');
        webui.setData('page-path', page);
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
            appSettings.app.setPageContent('', watchedAppData, fullContentUrl);
            clearPageData();
            if (body.startsWith(`<!DOCTYPE`)) {
                throw Error(`Invalid page content loaded from ${fullContentUrl}`);
            }
            let content = webui.applyAppDataToContent(body);
            appSettings.app.setPageContent(content, watchedAppData, fullContentUrl);
            setTimeout(() => {
                checkNodes(document.body.childNodes);
            }, 100);
        } catch (ex) {
            webui.log.error('Failed loading page content', ex);
            let elapsed = Date.now() - timerStart;
            if (elapsed < 300) {
                await transitionDelay(300 - elapsed);
            }
            clearPageData();
            appSettings.app.setPageContent('<webui-page-not-found></webui-page-not-found>', watchedAppData);
        }
        try {
            let data = await fetchData;
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
        let script = webui.create('script');
        script.setAttribute('async', true);
        script.setAttribute('src', `${wcRoot}webui/${wc}${wcMin}.js`)
        document.head.append(script);
    }
    function loadAppComponent(wc) {
        if (appLoaded[wc]) return;
        appLoaded[wc] = true;
        let script = webui.create('script');
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
        //checkForSubscription(el);
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
            checkDataStateMutations(mutations);
            checkDataSubscriptionMutations(mutations);
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
    function runWhenBodyIsReady(setup) {
        if (!document.body || !webui.loaded) {
            setTimeout(() => runWhenBodyIsReady(setup), 1);
            return;
        }
        setup();
    }
    runWhenBodyIsReady(() => {
        checkNodes(document.childNodes);
        applyDataHide();
        webui.querySelectorAll('[data-subscribe]').forEach(el => {
            let key = el.dataset.subscribe;
            setDataToEl(el, key);
        });
        webui.querySelectorAll('[theme]').forEach(el => {
            applyAttributeSettings(el, 'theme');
        });
        webui.querySelectorAll('[elevation]').forEach(el => {
            applyAttributeSettings(el, 'elevation');
        });
        ['app-config', 'app', 'data'].forEach(preload => {
            componentPreload(document.querySelector(`webui-${preload}`));
        });
        startObserving(document.body);
        checkForSubscriptionAttr(document.body);
        loadPage();
        loadWebUIComponent('alert');
        loadWebUIComponent('content');
        document.body.addEventListener('input', handleDataTrigger);
        document.body.addEventListener('change', handleDataTrigger);
        document.body.addEventListener('click', ev => {
            let target = ev.composedPath ? ev.composedPath()[0] : ev.target;
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
                if (!target.hasAttribute) {
                    target = target.parentNode || target.host;
                    continue;
                }
                if (target.hasAttribute && target.hasAttribute('disabled') && target.getAttribute('disabled') !== 'false' && !ev.ctrlKey) {
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
                        webui.querySelectorAll(sel).forEach(el => {
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
                        webui.querySelectorAll(sel).forEach(el => toggleClass(el, cls));
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
                            webui.querySelectorAll(sel).forEach(el => removeClass(el, cls));
                        } else {
                            removeClass(target, cls);
                        }
                    });
                    applyDynStyles = true;
                }
                if (target.dataset.toggleattr) {
                    let [attr, sel] = target.dataset.toggleattr.split('|').reverse();
                    if (sel) {
                        webui.querySelectorAll(sel).forEach(el => toggleAttr(el, attr));
                    } else {
                        toggleAttr(target, attr);
                    }
                    applyDynStyles = true;
                }
                if (applyDynStyles) {
                    webui.applyDynamicStyles();
                    break;
                }
                target = target.parentNode || target.host;
            }
            return retValue;
        });
    });
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('popstate', ev => {
        changePage(`${location.pathname}${location.search}`);
        if (ev.state) {
            if (ev.state.appData) {
                const appData = JSON.parse(ev.state.appData);
                Object.keys(appData).forEach(key => {
                    if (['page-path', 'page-title', 'page-subtitle'].indexOf(key) !== -1) return;
                    watchedAppData[key] = appData[key];
                });
                Object.keys(watchedAppData).forEach(key => {
                    if (Object.keys(appData).indexOf(key) !== -1) return;
                    delete watchedAppData[key];
                });
            }
        }
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

setTimeout(() => {
    if (window.tooltipsEnabled === undefined) {
        window.tooltipsEnabled = true;
    }
    const Tooltip = webui.create('div');
    Tooltip.className = 'tooltip closed';
    let capturedElement = null;
    document.body.appendChild(Tooltip);
    let isShowing = false;
    function CloseIfOpen() {
        if (!isShowing) { return; }
        isShowing = false;
        capturedElement = null;
        Tooltip.className = 'tooltip closed';
    }
    function CheckContainersForAriaLabel(target) {
        while (target && target !== target.parentNode) {
            if (!target.getAttribute) {
                target = target.parentNode || target.host;
                continue;
            }
            let title = target.getAttribute('title');
            if (title && title != 'null') {
                target.setAttribute('aria-label', title);
                target.removeAttribute('title');
            } else if (title === 'null') {
                target.removeAttribute('title');
            }
            let ariaLabel = target.getAttribute('aria-label');
            if (ariaLabel) { return [target, ariaLabel]; }
            target = target.parentNode || target.host;
        }
        return [null, null];
    }
    let tooltipDistancePadding = 30;
    document.body.addEventListener('click', CloseIfOpen);
    document.body.addEventListener('input', CloseIfOpen);
    document.body.addEventListener('mousemove', ev => {
        if (!window.tooltipsEnabled) return;
        let [target, display] = CheckContainersForAriaLabel(ev.composedPath()[0]);
        if (!target) { CloseIfOpen(); return; }
        if (target === capturedElement) { return; }
        let client = target.getBoundingClientRect();
        isShowing = true;
        let targetDisplay = `${target.innerText}`.trim();
        if (targetDisplay === display && !webui.isTextOverflowing(target)) {
            return;
        }
        capturedElement = target;
        Tooltip.innerText = display;
        Tooltip.className = 'tooltip open';
        let myposition = {
            x: client.left + (client.width / 2) - (Tooltip.clientWidth / 2),
            y: client.top - tooltipDistancePadding
        };
        if (myposition.x + Tooltip.clientWidth > window.innerWidth) { myposition.x = window.innerWidth - Tooltip.clientWidth - 10; }
        if (myposition.x < 0) { myposition.x = 10; }
        if (myposition.y < 0) { myposition.y = client.top + client.height; }

        Tooltip.style.left = `${myposition.x}px`;
        Tooltip.style.top = `${myposition.y}px`;
    });
}, 100);
