
/* This script is used to dynamically load Web UI web components (webui-*) from cdn.myfi.ws and app components (app-*) from the local /wc (webui.appSrc) folder as they are encountered in the dom. */
"use strict"
const webui = (() => {
    const domain = location.hostname;
    const AsyncFunction = (async () => { }).constructor;
    const markdownOptions = {
        gfm: true,
    };
    const map = {
        subs: {}
    };
    // TODO: Temp debug
    window.subs = map.subs;
    const roles = {};
    let lastActive = Date.now();
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
    function updateActivity() {
        lastActive = Date.now();
    }
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    const appDataOnce = [];
    const appDataLimit = ['app-name', 'app-company-singular', 'app-company-possessive', 'app-domain', 'app-api', 'app-not-found-html', 'app-data-endpoint', 'app-content-endpoint'];
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
    const notifyForAppDataChanges = [];
    const notifyForSessionDataChanges = [];
    function notifyAppDataChanged(changeDetails) {
        notifyForAppDataChanges.forEach(handler => {
            if (!handler) return;
            handler(changeDetails, appData, watchedAppData);
        });
    }
    function notifySessionDataChanged(changeDetails) {
        notifyForSessionDataChanges.forEach(handler => {
            if (!handler) return;
            handler(changeDetails, sessionData, watchedSessionData);
        });
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
    const watchedAppData = new Proxy(appData, getHandler(notifyAppDataChanged));
    let isProcessing = false;
    let sessionData = {
        'session-user-role': 0,
        'session-username': 'Guest',
        'session-full-name': 'Guest',
        'session-first-name': 'Guest',
        'session-last-name': '',
        'session-autosignout': 30
    };
    const watchedSessionData = new Proxy(sessionData, getHandler(notifySessionDataChanged));
    const appSettings = {
        appType: 'website',
        isDesktopApp: false,
        rootPage: 'root',
        contentExtension: '.md',
        pageContentEndpoint: '/d/en-US',
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
    class WebUI {
        appSrc = '/wc';
        appMin = '.min';
        appConfig = {};
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
        applyAppDataToContent(content, preTrim, removeWrappingPTags) {
            let data = typeof preTrim !== undefined && typeof preTrim !== 'boolean' ? preTrim : undefined;
            let pt = typeof preTrim == 'boolean' ? preTrim : undefined;
            let html = this.parseWebuiMarkdown(this.replaceAppData(content, data), pt, removeWrappingPTags);
            return html;
        }
        applyDynamicStyles() { }
        applyProperties(t) { }
        clone(data, seen = new WeakMap) {
            if (data === null || typeof data !== 'object') return data;
            if (seen.has(data)) return seen.get(data);
            let copy;
            if (data instanceof Date) {
                copy = new Date(data);
            } else if (data instanceof RegExp) {
                copy = new RegExp(data.source, data.flags);
            } else if (data instanceof Map) {
                copy = new Map();
                seen.set(data, copy);
                data.forEach((value, key) => {
                    copy.set(webui.clone(key, seen), webui.clone(value, seen));
                });
            } else if (data instanceof Set) {
                copy = new Set();
                seen.set(data, copy);
                data.forEach(value => {
                    copy.add(webui.clone(value, seen));
                });
            } else if (Array.isArray(data)) {
                copy = [];
                seen.set(data, copy);
                data.forEach((item, index) => {
                    copy[index] = webui.clone(item, seen);
                });
            } else if (ArrayBuffer.isView(data)) {
                copy = new data.constructor(data);
            } else if (data instanceof ArrayBuffer) {
                copy = data.slice(0);
            } else {
                copy = {};
                seen.set(data, copy);
                Object.keys(data).forEach(key => {
                    copy[key] = webui.clone(data[key], seen);
                });
                Object.getOwnPropertySymbols(data).forEach(sym => {
                    copy[sym] = webui.clone(data[sym], seen);
                });
            }
            return copy;
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
            let segments = key.split('.');
            if (segments.length === 1) {
                key = webui.toSnake(key, '-');
                return structuredClone(dataContainer[key]);
            }
            let skey = webui.toSnake(segments.shift(), '-');
            let data = dataContainer[skey];
            while (segments.length > 0) {
                if (!data) return undefined;
                skey = segments.shift();
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
        parseWebuiSmartMarkdown(raw) {
            const noTrimTags = ['code', 'template', 'webui-code'];
            const insideBlock = { codeBlock: false, htmlBlock: false, tagStack: [] };
            const lines = raw.split(/\r?\n/);
            const output = [];
            for (let line of lines) {
                if (line.trim().startsWith('```')) {
                    insideBlock.codeBlock = !insideBlock.codeBlock;
                    output.push(line);
                    continue;
                }
                if (insideBlock.codeBlock) {
                    output.push(line);
                    continue;
                }
                const openTag = line.match(/^<([a-zA-Z0-9-_]+)(\s|>|\/)/);
                const closeTag = line.match(/^<\/([a-zA-Z0-9-_]+)>/);
                if (openTag && noTrimTags.includes(openTag[1])) {
                    insideBlock.tagStack.push(openTag[1]);
                } else if (closeTag && insideBlock.tagStack.includes(closeTag[1])) {
                    insideBlock.tagStack.pop();
                }
                if (/^<\w/.test(line) && insideBlock.tagStack.length === 0) {
                    output.push(line.replace(/^\s+/, ''));
                } else {
                    output.push(line);
                }
            }
            return output.join('\n');
        }
        parseWebuiMarkdown(md, preTrim, removeWrappingPTags) {
            const t = this;
            if (typeof md !== 'string') return md;
            md = md.replace(/(\r\n|\r){1}/mg, '\n');
            if (preTrim) {
                md = this.trimLinePreWhitespce(md);
            } else {
                md = this.trimLinePreTabs(md);
            }
            //clean = md.replace(/\n/g, '\n\n');
            let clean = t.parseWebuiSmartMarkdown(md).trim();
            let html = t.marked.parse(clean, markdownOptions) || '';
            html = t.removeWrappingPTags(html, 'webui-[A-Za-z-]+|app-[A-Za-z-]+|select|option|div|label|section|article|footer|header');
            html = html.trim();
            if (removeWrappingPTags && html.startsWith('<p>') && !html.startsWith('<p><')) {
                return html.replace(/^\<p\>(.*)\<\/p\>$/, '$1');
            }
            return html;
        }
        parseMarkdown(md, preTrim) {
            const t = this;
            if (typeof md !== 'string') return md;
            md = md.replace(/(\r\n|\r){1}/mg, '\n');
            if (preTrim) {
                md = this.trimLinePreWhitespce(md);
            } else {
                md = this.trimLinePreTabs(md);
            }
            md = md.replace(/(\n)/mg, '\n');
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
            value = structuredClone(value);
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
            /*
            webui.querySelectorAll(`[data-subscribe*="${baseKey}"]`).forEach(sub => {
                setDataToEl(sub, baseKey);
            });
            */
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
            webui.querySelectorAll('[data-hide]').forEach(el => {
                let sel = el.dataset.hide;
                if (!sel) return;
                let found = document.querySelector(sel);
                el.style.display = found ? '' : 'none';
            });
        }
        const observerDataStates = (domNode) => {
            const observer = new MutationObserver(mutations => {
                lastActive = Date.now();
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
    function setDataToEl(el, key) {
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
                            console.log('check setter', {
                                't-fsetter': typeof el[fsetter],
                                't-field': typeof el[field],
                                't-setValue': typeof el.setValue,
                                'field': field,
                                'fsetter': fsetter
                            });
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
        window.history.pushState(appData, document.title, url);
        loadPage(url);
    }
    window.addEventListener('popstate', ev => {
        if (ev.state) {
            webui.log.trace("TODO: handle history updates", ev);
        }
    });

    runWhenBodyIsReady(() => {
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
        // node.childNodes.forEach(n => {
        //     checkForSubscription(n);
        // });
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
        function checkForSubscriptionAttr(node) {
            checkForSubscription(node);
            webui.querySelectorAll('[data-subscribe]', node).forEach(node => {
                checkForSubscription(node);
            });
        }
        checkForSubscriptionAttr(domNode);
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
        const observer = new MutationObserver(mutations => {
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
    });

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
            appSettings.app.setPageContent('', appData, fullContentUrl);
            clearPageData();
            if (body.startsWith(`<!DOCTYPE`)) {
                throw Error(`Invalid page content loaded from ${fullContentUrl}`);
            }
            let content = webui.applyAppDataToContent(body);
            appSettings.app.setPageContent(content, appData, fullContentUrl);
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
            appSettings.app.setPageContent('<webui-page-not-found></webui-page-not-found>', appData);
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
        loadWebUIComponent('alert');
        loadWebUIComponent('content');
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
    'use strict';
    window.tooltipsEnabled = true;
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
            //if (target.ariaLabel) { return [target, target.ariaLabel]; }
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
}, 1000);

/**
* marked v15.0.11 - a markdown parser
* Copyright (c) 2011-2025, Christopher Jeffrey. (MIT Licensed)
* https://github.com/markedjs/marked
* https://cdn.jsdelivr.net/npm/marked/marked.min.js
*/
webui.marked = (function () {
    !function (e, t) {
        "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).marked = {})
    }(this, (function (e) {
        "use strict";
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
        const s = {
            exec: () => null
        };
        function r(e, t = "") {
            let n = "string" == typeof e ? e : e.source;
            const s = {
                replace: (e, t) => {
                    let r = "string" == typeof t ? t : t.source;
                    return r = r.replace(i.caret, "$1"),
                        n = n.replace(e, r),
                        s
                }
                ,
                getRegex: () => new RegExp(n, t)
            };
            return s
        }
        const i = {
            codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
            outputLinkReplace: /\\([\[\]])/g,
            indentCodeCompensation: /^(\s+)(?:```)/,
            beginningSpace: /^\s+/,
            endingHash: /#$/,
            startingSpaceChar: /^ /,
            endingSpaceChar: / $/,
            nonSpaceChar: /[^ ]/,
            newLineCharGlobal: /\n/g,
            tabCharGlobal: /\t/g,
            multipleSpaceGlobal: /\s+/g,
            blankLine: /^[ \t]*$/,
            doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
            blockquoteStart: /^ {0,3}>/,
            blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
            blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
            listReplaceTabs: /^\t+/,
            listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
            listIsTask: /^\[[ xX]\] /,
            listReplaceTask: /^\[[ xX]\] +/,
            anyLine: /\n.*\n/,
            hrefBrackets: /^<(.*)>$/,
            tableDelimiter: /[:|]/,
            tableAlignChars: /^\||\| *$/g,
            tableRowBlankLine: /\n[ \t]*$/,
            tableAlignRight: /^ *-+: *$/,
            tableAlignCenter: /^ *:-+: *$/,
            tableAlignLeft: /^ *:-+ *$/,
            startATag: /^<a /i,
            endATag: /^<\/a>/i,
            startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
            endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
            startAngleBracket: /^</,
            endAngleBracket: />$/,
            pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
            unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
            escapeTest: /[&<>"']/,
            escapeReplace: /[&<>"']/g,
            escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
            escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
            unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,
            caret: /(^|[^\[])\^/g,
            percentDecode: /%25/g,
            findPipe: /\|/g,
            splitPipe: / \|/,
            slashPipe: /\\\|/g,
            carriageReturn: /\r\n|\r/g,
            spaceLine: /^ +$/gm,
            notSpaceStart: /^\S*/,
            endingNewline: /\n$/,
            listItemRegex: e => new RegExp(`^( {0,3}${e})((?:[\t ][^\\n]*)?(?:\\n|$))`),
            nextBulletRegex: e => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`),
            hrRegex: e => new RegExp(`^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
            fencesBeginRegex: e => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
            headingBeginRegex: e => new RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
            htmlBeginRegex: e => new RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, "i")
        }
            , l = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/
            , o = /(?:[*+-]|\d{1,9}[.)])/
            , a = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/
            , c = r(a).replace(/bull/g, o).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex()
            , h = r(a).replace(/bull/g, o).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex()
            , p = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/
            , u = /(?!\s*\])(?:\\.|[^\[\]\\])+/
            , g = r(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", u).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex()
            , k = r(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, o).getRegex()
            , d = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul"
            , f = /<!--(?:-?>|[\s\S]*?(?:-->|$))/
            , x = r("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i").replace("comment", f).replace("tag", d).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex()
            , b = r(p).replace("hr", l).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", d).getRegex()
            , m = {
                blockquote: r(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", b).getRegex(),
                code: /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,
                def: g,
                fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
                heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
                hr: l,
                html: x,
                lheading: c,
                list: k,
                newline: /^(?:[ \t]*(?:\n|$))+/,
                paragraph: b,
                table: s,
                text: /^[^\n]+/
            }
            , w = r("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", l).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}\t)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", d).getRegex()
            , y = {
                ...m,
                lheading: h,
                table: w,
                paragraph: r(p).replace("hr", l).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", w).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", d).getRegex()
            }
            , $ = {
                ...m,
                html: r("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", f).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
                def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
                heading: /^(#{1,6})(.*)(?:\n+|$)/,
                fences: s,
                lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
                paragraph: r(p).replace("hr", l).replace("heading", " *#{1,6} *[^\n]").replace("lheading", c).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
            }
            , R = /^( {2,}|\\)\n(?!\s*$)/
            , S = /[\p{P}\p{S}]/u
            , T = /[\s\p{P}\p{S}]/u
            , z = /[^\s\p{P}\p{S}]/u
            , A = r(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, T).getRegex()
            , _ = /(?!~)[\p{P}\p{S}]/u
            , P = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/
            , I = r(P, "u").replace(/punct/g, S).getRegex()
            , L = r(P, "u").replace(/punct/g, _).getRegex()
            , B = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)"
            , C = r(B, "gu").replace(/notPunctSpace/g, z).replace(/punctSpace/g, T).replace(/punct/g, S).getRegex()
            , q = r(B, "gu").replace(/notPunctSpace/g, /(?:[^\s\p{P}\p{S}]|~)/u).replace(/punctSpace/g, /(?!~)[\s\p{P}\p{S}]/u).replace(/punct/g, _).getRegex()
            , E = r("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, z).replace(/punctSpace/g, T).replace(/punct/g, S).getRegex()
            , Z = r(/\\(punct)/, "gu").replace(/punct/g, S).getRegex()
            , v = r(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex()
            , D = r(f).replace("(?:--\x3e|$)", "--\x3e").getRegex()
            , M = r("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", D).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex()
            , O = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/
            , Q = r(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", O).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex()
            , j = r(/^!?\[(label)\]\[(ref)\]/).replace("label", O).replace("ref", u).getRegex()
            , N = r(/^!?\[(ref)\](?:\[\])?/).replace("ref", u).getRegex()
            , G = {
                _backpedal: s,
                anyPunctuation: Z,
                autolink: v,
                blockSkip: /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g,
                br: R,
                code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
                del: s,
                emStrongLDelim: I,
                emStrongRDelimAst: C,
                emStrongRDelimUnd: E,
                escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
                link: Q,
                nolink: N,
                punctuation: A,
                reflink: j,
                reflinkSearch: r("reflink|nolink(?!\\()", "g").replace("reflink", j).replace("nolink", N).getRegex(),
                tag: M,
                text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
                url: s
            }
            , H = {
                ...G,
                link: r(/^!?\[(label)\]\((.*?)\)/).replace("label", O).getRegex(),
                reflink: r(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", O).getRegex()
            }
            , X = {
                ...G,
                emStrongRDelimAst: q,
                emStrongLDelim: L,
                url: r(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
                _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
                del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
                text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
            }
            , F = {
                ...X,
                br: r(R).replace("{2,}", "*").getRegex(),
                text: r(X.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
            }
            , U = {
                normal: m,
                gfm: y,
                pedantic: $
            }
            , J = {
                normal: G,
                gfm: X,
                breaks: F,
                pedantic: H
            }
            , K = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }
            , V = e => K[e];
        function W(e, t) {
            if (t) {
                if (i.escapeTest.test(e))
                    return e.replace(i.escapeReplace, V)
            } else if (i.escapeTestNoEncode.test(e))
                return e.replace(i.escapeReplaceNoEncode, V);
            return e
        }
        function Y(e) {
            try {
                e = encodeURI(e).replace(i.percentDecode, "%")
            } catch {
                return null
            }
            return e
        }
        function ee(e, t) {
            const n = e.replace(i.findPipe, ((e, t, n) => {
                let s = !1
                    , r = t;
                for (; --r >= 0 && "\\" === n[r];)
                    s = !s;
                return s ? "|" : " |"
            }
            )).split(i.splitPipe);
            let s = 0;
            if (n[0].trim() || n.shift(),
                n.length > 0 && !n.at(-1)?.trim() && n.pop(),
                t)
                if (n.length > t)
                    n.splice(t);
                else
                    for (; n.length < t;)
                        n.push("");
            for (; s < n.length; s++)
                n[s] = n[s].trim().replace(i.slashPipe, "|");
            return n
        }
        function te(e, t, n) {
            const s = e.length;
            if (0 === s)
                return "";
            let r = 0;
            for (; r < s;) {
                if (e.charAt(s - r - 1) !== t)
                    break;
                r++
            }
            return e.slice(0, s - r)
        }
        function ne(e, t, n, s, r) {
            const i = t.href
                , l = t.title || null
                , o = e[1].replace(r.other.outputLinkReplace, "$1");
            s.state.inLink = !0;
            const a = {
                type: "!" === e[0].charAt(0) ? "image" : "link",
                raw: n,
                href: i,
                title: l,
                text: o,
                tokens: s.inlineTokens(o)
            };
            return s.state.inLink = !1,
                a
        }
        class se {
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
                    const e = t[0].replace(this.rules.other.codeRemoveIndent, "");
                    return {
                        type: "code",
                        raw: t[0],
                        codeBlockStyle: "indented",
                        text: this.options.pedantic ? e : te(e, "\n")
                    }
                }
            }
            fences(e) {
                const t = this.rules.block.fences.exec(e);
                if (t) {
                    const e = t[0]
                        , n = function (e, t, n) {
                            const s = e.match(n.other.indentCodeCompensation);
                            if (null === s)
                                return t;
                            const r = s[1];
                            return t.split("\n").map((e => {
                                const t = e.match(n.other.beginningSpace);
                                if (null === t)
                                    return e;
                                const [s] = t;
                                return s.length >= r.length ? e.slice(r.length) : e
                            }
                            )).join("\n")
                        }(e, t[3] || "", this.rules);
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
                    if (this.rules.other.endingHash.test(e)) {
                        const t = te(e, "#");
                        this.options.pedantic ? e = t.trim() : t && !this.rules.other.endingSpaceChar.test(t) || (e = t.trim())
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
                        raw: te(t[0], "\n")
                    }
            }
            blockquote(e) {
                const t = this.rules.block.blockquote.exec(e);
                if (t) {
                    let e = te(t[0], "\n").split("\n")
                        , n = ""
                        , s = "";
                    const r = [];
                    for (; e.length > 0;) {
                        let t = !1;
                        const i = [];
                        let l;
                        for (l = 0; l < e.length; l++)
                            if (this.rules.other.blockquoteStart.test(e[l]))
                                i.push(e[l]),
                                    t = !0;
                            else {
                                if (t)
                                    break;
                                i.push(e[l])
                            }
                        e = e.slice(l);
                        const o = i.join("\n")
                            , a = o.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
                        n = n ? `${n}\n${o}` : o,
                            s = s ? `${s}\n${a}` : a;
                        const c = this.lexer.state.top;
                        if (this.lexer.state.top = !0,
                            this.lexer.blockTokens(a, r, !0),
                            this.lexer.state.top = c,
                            0 === e.length)
                            break;
                        const h = r.at(-1);
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
                                e = i.substring(r.at(-1).raw.length).split("\n")
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
                    const i = this.rules.other.listItemRegex(n);
                    let l = !1;
                    for (; e;) {
                        let n = !1
                            , s = ""
                            , o = "";
                        if (!(t = i.exec(e)))
                            break;
                        if (this.rules.block.hr.test(e))
                            break;
                        s = t[0],
                            e = e.substring(s.length);
                        let a = t[2].split("\n", 1)[0].replace(this.rules.other.listReplaceTabs, (e => " ".repeat(3 * e.length)))
                            , c = e.split("\n", 1)[0]
                            , h = !a.trim()
                            , p = 0;
                        if (this.options.pedantic ? (p = 2,
                            o = a.trimStart()) : h ? p = t[1].length + 1 : (p = t[2].search(this.rules.other.nonSpaceChar),
                                p = p > 4 ? 1 : p,
                                o = a.slice(p),
                                p += t[1].length),
                            h && this.rules.other.blankLine.test(c) && (s += c + "\n",
                                e = e.substring(c.length + 1),
                                n = !0),
                            !n) {
                            const t = this.rules.other.nextBulletRegex(p)
                                , n = this.rules.other.hrRegex(p)
                                , r = this.rules.other.fencesBeginRegex(p)
                                , i = this.rules.other.headingBeginRegex(p)
                                , l = this.rules.other.htmlBeginRegex(p);
                            for (; e;) {
                                const u = e.split("\n", 1)[0];
                                let g;
                                if (c = u,
                                    this.options.pedantic ? (c = c.replace(this.rules.other.listReplaceNesting, "  "),
                                        g = c) : g = c.replace(this.rules.other.tabCharGlobal, "    "),
                                    r.test(c))
                                    break;
                                if (i.test(c))
                                    break;
                                if (l.test(c))
                                    break;
                                if (t.test(c))
                                    break;
                                if (n.test(c))
                                    break;
                                if (g.search(this.rules.other.nonSpaceChar) >= p || !c.trim())
                                    o += "\n" + g.slice(p);
                                else {
                                    if (h)
                                        break;
                                    if (a.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4)
                                        break;
                                    if (r.test(a))
                                        break;
                                    if (i.test(a))
                                        break;
                                    if (n.test(a))
                                        break;
                                    o += "\n" + c
                                }
                                h || c.trim() || (h = !0),
                                    s += u + "\n",
                                    e = e.substring(u.length + 1),
                                    a = g.slice(p)
                            }
                        }
                        r.loose || (l ? r.loose = !0 : this.rules.other.doubleBlankLine.test(s) && (l = !0));
                        let u, g = null;
                        this.options.gfm && (g = this.rules.other.listIsTask.exec(o),
                            g && (u = "[ ] " !== g[0],
                                o = o.replace(this.rules.other.listReplaceTask, ""))),
                            r.items.push({
                                type: "list_item",
                                raw: s,
                                task: !!g,
                                checked: u,
                                loose: !1,
                                text: o,
                                tokens: []
                            }),
                            r.raw += s
                    }
                    const o = r.items.at(-1);
                    if (!o)
                        return;
                    o.raw = o.raw.trimEnd(),
                        o.text = o.text.trimEnd(),
                        r.raw = r.raw.trimEnd();
                    for (let e = 0; e < r.items.length; e++)
                        if (this.lexer.state.top = !1,
                            r.items[e].tokens = this.lexer.blockTokens(r.items[e].text, []),
                            !r.loose) {
                            const t = r.items[e].tokens.filter((e => "space" === e.type))
                                , n = t.length > 0 && t.some((e => this.rules.other.anyLine.test(e.raw)));
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
                    const e = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " ")
                        , n = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : ""
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
                if (!this.rules.other.tableDelimiter.test(t[2]))
                    return;
                const n = ee(t[1])
                    , s = t[2].replace(this.rules.other.tableAlignChars, "").split("|")
                    , r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : []
                    , i = {
                        type: "table",
                        raw: t[0],
                        header: [],
                        align: [],
                        rows: []
                    };
                if (n.length === s.length) {
                    for (const e of s)
                        this.rules.other.tableAlignRight.test(e) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(e) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(e) ? i.align.push("left") : i.align.push(null);
                    for (let e = 0; e < n.length; e++)
                        i.header.push({
                            text: n[e],
                            tokens: this.lexer.inline(n[e]),
                            header: !0,
                            align: i.align[e]
                        });
                    for (const e of r)
                        i.rows.push(ee(e, i.header.length).map(((e, t) => ({
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
                        text: t[1]
                    }
            }
            tag(e) {
                const t = this.rules.inline.tag.exec(e);
                if (t)
                    return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1),
                        !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1),
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
                    if (!this.options.pedantic && this.rules.other.startAngleBracket.test(e)) {
                        if (!this.rules.other.endAngleBracket.test(e))
                            return;
                        const t = te(e.slice(0, -1), "\\");
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
                            return n > 0 ? -2 : -1
                        }(t[2], "()");
                        if (-2 === e)
                            return;
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
                        const e = this.rules.other.pedanticHrefTitle.exec(n);
                        e && (n = e[1],
                            s = e[3])
                    } else
                        s = t[3] ? t[3].slice(1, -1) : "";
                    return n = n.trim(),
                        this.rules.other.startAngleBracket.test(n) && (n = this.options.pedantic && !this.rules.other.endAngleBracket.test(e) ? n.slice(1) : n.slice(1, -1)),
                        ne(t, {
                            href: n ? n.replace(this.rules.inline.anyPunctuation, "$1") : n,
                            title: s ? s.replace(this.rules.inline.anyPunctuation, "$1") : s
                        }, t[0], this.lexer, this.rules)
                }
            }
            reflink(e, t) {
                let n;
                if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
                    const e = t[(n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
                    if (!e) {
                        const e = n[0].charAt(0);
                        return {
                            type: "text",
                            raw: e,
                            text: e
                        }
                    }
                    return ne(n, e, n[0], this.lexer, this.rules)
                }
            }
            emStrong(e, t, n = "") {
                let s = this.rules.inline.emStrongLDelim.exec(e);
                if (!s)
                    return;
                if (s[3] && n.match(this.rules.other.unicodeAlphaNumeric))
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
                    let e = t[2].replace(this.rules.other.newLineCharGlobal, " ");
                    const n = this.rules.other.nonSpaceChar.test(e)
                        , s = this.rules.other.startingSpaceChar.test(e) && this.rules.other.endingSpaceChar.test(e);
                    return n && s && (e = e.substring(1, e.length - 1)),
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
                    return "@" === t[2] ? (e = t[1],
                        n = "mailto:" + e) : (e = t[1],
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
                        e = t[0],
                            n = "mailto:" + e;
                    else {
                        let s;
                        do {
                            s = t[0],
                                t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? ""
                        } while (s !== t[0]);
                        e = t[0],
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
                    const e = this.lexer.state.inRawBlock;
                    return {
                        type: "text",
                        raw: t[0],
                        text: t[0],
                        escaped: e
                    }
                }
            }
        }
        class re {
            tokens;
            options;
            state;
            tokenizer;
            inlineQueue;
            constructor(t) {
                this.tokens = [],
                    this.tokens.links = Object.create(null),
                    this.options = t || e.defaults,
                    this.options.tokenizer = this.options.tokenizer || new se,
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
                    other: i,
                    block: U.normal,
                    inline: J.normal
                };
                this.options.pedantic ? (n.block = U.pedantic,
                    n.inline = J.pedantic) : this.options.gfm && (n.block = U.gfm,
                        this.options.breaks ? n.inline = J.breaks : n.inline = J.gfm),
                    this.tokenizer.rules = n
            }
            static get rules() {
                return {
                    block: U,
                    inline: J
                }
            }
            static lex(e, t) {
                return new re(t).lex(e)
            }
            static lexInline(e, t) {
                return new re(t).inlineTokens(e)
            }
            lex(e) {
                e = e.replace(i.carriageReturn, "\n"),
                    this.blockTokens(e, this.tokens);
                for (let e = 0; e < this.inlineQueue.length; e++) {
                    const t = this.inlineQueue[e];
                    this.inlineTokens(t.src, t.tokens)
                }
                return this.inlineQueue = [],
                    this.tokens
            }
            blockTokens(e, t = [], n = !1) {
                for (this.options.pedantic && (e = e.replace(i.tabCharGlobal, "    ").replace(i.spaceLine, "")); e;) {
                    let s;
                    if (this.options.extensions?.block?.some((n => !!(s = n.call({
                        lexer: this
                    }, e, t)) && (e = e.substring(s.raw.length),
                        t.push(s),
                        !0))))
                        continue;
                    if (s = this.tokenizer.space(e)) {
                        e = e.substring(s.raw.length);
                        const n = t.at(-1);
                        1 === s.raw.length && void 0 !== n ? n.raw += "\n" : t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.code(e)) {
                        e = e.substring(s.raw.length);
                        const n = t.at(-1);
                        "paragraph" === n?.type || "text" === n?.type ? (n.raw += "\n" + s.raw,
                            n.text += "\n" + s.text,
                            this.inlineQueue.at(-1).src = n.text) : t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.fences(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.heading(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.hr(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.blockquote(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.list(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.html(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.def(e)) {
                        e = e.substring(s.raw.length);
                        const n = t.at(-1);
                        "paragraph" === n?.type || "text" === n?.type ? (n.raw += "\n" + s.raw,
                            n.text += "\n" + s.raw,
                            this.inlineQueue.at(-1).src = n.text) : this.tokens.links[s.tag] || (this.tokens.links[s.tag] = {
                                href: s.href,
                                title: s.title
                            });
                        continue
                    }
                    if (s = this.tokenizer.table(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.lheading(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    let r = e;
                    if (this.options.extensions?.startBlock) {
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
                            t < 1 / 0 && t >= 0 && (r = e.substring(0, t + 1))
                    }
                    if (this.state.top && (s = this.tokenizer.paragraph(r))) {
                        const i = t.at(-1);
                        n && "paragraph" === i?.type ? (i.raw += "\n" + s.raw,
                            i.text += "\n" + s.text,
                            this.inlineQueue.pop(),
                            this.inlineQueue.at(-1).src = i.text) : t.push(s),
                            n = r.length !== e.length,
                            e = e.substring(s.raw.length)
                    } else if (s = this.tokenizer.text(e)) {
                        e = e.substring(s.raw.length);
                        const n = t.at(-1);
                        "text" === n?.type ? (n.raw += "\n" + s.raw,
                            n.text += "\n" + s.text,
                            this.inlineQueue.pop(),
                            this.inlineQueue.at(-1).src = n.text) : t.push(s)
                    } else if (e) {
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
                let n = e
                    , s = null;
                if (this.tokens.links) {
                    const e = Object.keys(this.tokens.links);
                    if (e.length > 0)
                        for (; null != (s = this.tokenizer.rules.inline.reflinkSearch.exec(n));)
                            e.includes(s[0].slice(s[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))
                }
                for (; null != (s = this.tokenizer.rules.inline.anyPunctuation.exec(n));)
                    n = n.slice(0, s.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
                for (; null != (s = this.tokenizer.rules.inline.blockSkip.exec(n));)
                    n = n.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
                let r = !1
                    , i = "";
                for (; e;) {
                    let s;
                    if (r || (i = ""),
                        r = !1,
                        this.options.extensions?.inline?.some((n => !!(s = n.call({
                            lexer: this
                        }, e, t)) && (e = e.substring(s.raw.length),
                            t.push(s),
                            !0))))
                        continue;
                    if (s = this.tokenizer.escape(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.tag(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.link(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.reflink(e, this.tokens.links)) {
                        e = e.substring(s.raw.length);
                        const n = t.at(-1);
                        "text" === s.type && "text" === n?.type ? (n.raw += s.raw,
                            n.text += s.text) : t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.emStrong(e, n, i)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.codespan(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.br(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.del(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (s = this.tokenizer.autolink(e)) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    if (!this.state.inLink && (s = this.tokenizer.url(e))) {
                        e = e.substring(s.raw.length),
                            t.push(s);
                        continue
                    }
                    let l = e;
                    if (this.options.extensions?.startInline) {
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
                            t < 1 / 0 && t >= 0 && (l = e.substring(0, t + 1))
                    }
                    if (s = this.tokenizer.inlineText(l)) {
                        e = e.substring(s.raw.length),
                            "_" !== s.raw.slice(-1) && (i = s.raw.slice(-1)),
                            r = !0;
                        const n = t.at(-1);
                        "text" === n?.type ? (n.raw += s.raw,
                            n.text += s.text) : t.push(s)
                    } else if (e) {
                        const t = "Infinite loop on byte: " + e.charCodeAt(0);
                        if (this.options.silent) {
                            console.error(t);
                            break
                        }
                        throw new Error(t)
                    }
                }
                return t
            }
        }
        class ie {
            options;
            parser;
            constructor(t) {
                this.options = t || e.defaults
            }
            space(e) {
                return ""
            }
            code({ text: e, lang: t, escaped: n }) {
                const s = (t || "").match(i.notSpaceStart)?.[0]
                    , r = e.replace(i.endingNewline, "") + "\n";
                return s ? '<pre><code class="language-' + W(s) + '">' + (n ? r : W(r, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? r : W(r, !0)) + "</code></pre>\n"
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
                    e.loose ? "paragraph" === e.tokens[0]?.type ? (e.tokens[0].text = n + " " + e.tokens[0].text,
                        e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && "text" === e.tokens[0].tokens[0].type && (e.tokens[0].tokens[0].text = n + " " + W(e.tokens[0].tokens[0].text),
                            e.tokens[0].tokens[0].escaped = !0)) : e.tokens.unshift({
                                type: "text",
                                raw: n + " ",
                                text: n + " ",
                                escaped: !0
                            }) : t += n + " "
                }
                return t += this.parser.parse(e.tokens, !!e.loose),
                    `<li>${t}</li>\n`
            }
            checkbox({ checked: e }) {
                return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">'
            }
            paragraph({ tokens: e, raw: a, text: b }) {
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
                return `<code>${W(e, !0)}</code>`
            }
            br(e) {
                return "<br>"
            }
            del({ tokens: e }) {
                return `<del>${this.parser.parseInline(e)}</del>`
            }
            link({ href: e, title: t, tokens: n }) {
                const s = this.parser.parseInline(n)
                    , r = Y(e);
                if (null === r)
                    return s;
                let i = '<a href="' + (e = r) + '"';
                return t && (i += ' title="' + W(t) + '"'),
                    i += ">" + s + "</a>",
                    i
            }
            image({ href: e, title: t, text: n, tokens: s }) {
                s && (n = this.parser.parseInline(s, this.parser.textRenderer));
                const r = Y(e);
                if (null === r)
                    return W(n);
                let i = `<img src="${e = r}" alt="${n}"`;
                return t && (i += ` title="${W(t)}"`),
                    i += ">",
                    i
            }
            text(e) {
                return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : W(e.text)
            }
        }
        class le {
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
        class oe {
            options;
            renderer;
            textRenderer;
            constructor(t) {
                this.options = t || e.defaults,
                    this.options.renderer = this.options.renderer || new ie,
                    this.renderer = this.options.renderer,
                    this.renderer.options = this.options,
                    this.renderer.parser = this,
                    this.textRenderer = new le
            }
            static parse(e, t) {
                return new oe(t).parse(e)
            }
            static parseInline(e, t) {
                return new oe(t).parseInline(e)
            }
            parse(e, t = !0) {
                let n = "";
                for (let s = 0; s < e.length; s++) {
                    const r = e[s];
                    if (this.options.extensions?.renderers?.[r.type]) {
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
                                        text: l,
                                        escaped: !0
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
            parseInline(e, t = this.renderer) {
                let n = "";
                for (let s = 0; s < e.length; s++) {
                    const r = e[s];
                    if (this.options.extensions?.renderers?.[r.type]) {
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
        class ae {
            options;
            block;
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
            provideLexer() {
                return this.block ? re.lex : re.lexInline
            }
            provideParser() {
                return this.block ? oe.parse : oe.parseInline
            }
        }
        class ce {
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
            parse = this.parseMarkdown(!0);
            parseInline = this.parseMarkdown(!1);
            Parser = oe;
            Renderer = ie;
            TextRenderer = le;
            Lexer = re;
            Tokenizer = se;
            Hooks = ae;
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
                        const t = this.defaults.renderer || new ie(this.defaults);
                        for (const n in e.renderer) {
                            if (!(n in t))
                                throw new Error(`renderer '${n}' does not exist`);
                            if (["options", "parser"].includes(n))
                                continue;
                            const s = n
                                , r = e.renderer[s]
                                , i = t[s];
                            t[s] = (...e) => {
                                let n = r.apply(t, e);
                                return !1 === n && (n = i.apply(t, e)),
                                    n || ""
                            }
                        }
                        n.renderer = t
                    }
                    if (e.tokenizer) {
                        const t = this.defaults.tokenizer || new se(this.defaults);
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
                        const t = this.defaults.hooks || new ae;
                        for (const n in e.hooks) {
                            if (!(n in t))
                                throw new Error(`hook '${n}' does not exist`);
                            if (["options", "block"].includes(n))
                                continue;
                            const s = n
                                , r = e.hooks[s]
                                , i = t[s];
                            ae.passThroughHooks.has(n) ? t[s] = e => {
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
            setOptions(e) {
                return this.defaults = {
                    ...this.defaults,
                    ...e
                },
                    this
            }
            lexer(e, t) {
                return re.lex(e, t ?? this.defaults)
            }
            parser(e, t) {
                return oe.parse(e, t ?? this.defaults)
            }
            parseMarkdown(e) {
                return (t, n) => {
                    const s = {
                        ...n
                    }
                        , r = {
                            ...this.defaults,
                            ...s
                        }
                        , i = this.onError(!!r.silent, !!r.async);
                    if (!0 === this.defaults.async && !1 === s.async)
                        return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
                    if (null == t)
                        return i(new Error("marked(): input parameter is undefined or null"));
                    if ("string" != typeof t)
                        return i(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected"));
                    r.hooks && (r.hooks.options = r,
                        r.hooks.block = e);
                    const l = r.hooks ? r.hooks.provideLexer() : e ? re.lex : re.lexInline
                        , o = r.hooks ? r.hooks.provideParser() : e ? oe.parse : oe.parseInline;
                    if (r.async)
                        return Promise.resolve(r.hooks ? r.hooks.preprocess(t) : t).then((e => l(e, r))).then((e => r.hooks ? r.hooks.processAllTokens(e) : e)).then((e => r.walkTokens ? Promise.all(this.walkTokens(e, r.walkTokens)).then((() => e)) : e)).then((e => o(e, r))).then((e => r.hooks ? r.hooks.postprocess(e) : e)).catch(i);
                    try {
                        r.hooks && (t = r.hooks.preprocess(t));
                        let e = l(t, r);
                        r.hooks && (e = r.hooks.processAllTokens(e)),
                            r.walkTokens && this.walkTokens(e, r.walkTokens);
                        let n = o(e, r);
                        return r.hooks && (n = r.hooks.postprocess(n)),
                            n
                    } catch (e) {
                        return i(e)
                    }
                }
            }
            onError(e, t) {
                return n => {
                    if (n.message += "\nPlease report this to https://github.com/markedjs/marked.",
                        e) {
                        const e = "<p>An error occurred:</p><pre>" + W(n.message + "", !0) + "</pre>";
                        return t ? Promise.resolve(e) : e
                    }
                    if (t)
                        return Promise.reject(n);
                    throw n
                }
            }
        }
        const he = new ce;
        function pe(e, t) {
            return he.parse(e, t)
        }
        pe.options = pe.setOptions = function (e) {
            return he.setOptions(e),
                pe.defaults = he.defaults,
                n(pe.defaults),
                pe
        }
            ,
            pe.getDefaults = t,
            pe.defaults = e.defaults,
            pe.use = function (...e) {
                return he.use(...e),
                    pe.defaults = he.defaults,
                    n(pe.defaults),
                    pe
            }
            ,
            pe.walkTokens = function (e, t) {
                return he.walkTokens(e, t)
            }
            ,
            pe.parseInline = he.parseInline,
            pe.Parser = oe,
            pe.parser = oe.parse,
            pe.Renderer = ie,
            pe.TextRenderer = le,
            pe.Lexer = re,
            pe.lexer = re.lex,
            pe.Tokenizer = se,
            pe.Hooks = ae,
            pe.parse = pe;
        const ue = pe.options
            , ge = pe.setOptions
            , ke = pe.use
            , de = pe.walkTokens
            , fe = pe.parseInline
            , xe = pe
            , be = oe.parse
            , me = re.lex;
        e.Hooks = ae,
            e.Lexer = re,
            e.Marked = ce,
            e.Parser = oe,
            e.Renderer = ie,
            e.TextRenderer = le,
            e.Tokenizer = se,
            e.getDefaults = t,
            e.lexer = me,
            e.marked = pe,
            e.options = ue,
            e.parse = xe,
            e.parseInline = fe,
            e.parser = be,
            e.setOptions = ge,
            e.use = ke,
            e.walkTokens = de
    }
    ));
    return window.marked;
})();

/**
 * https://cdn.jsdelivr.net/npm/marked-emoji@2.0.0/lib/index.umd.min.js
 */
{
    !function (e, o) {
        "object" == typeof exports && "undefined" != typeof module ? o(exports) : "function" == typeof define && define.amd ? define(["exports"], o) : o((e = "undefined" != typeof globalThis ? globalThis : e || self).markedEmoji = {})
    }(this, (function (e) {
        "use strict";
        const o = {
            renderer: void 0
        };
        e.markedEmoji = function (e) {
            if (!(e = {
                ...o,
                ...e
            }).emojis)
                throw new Error("Must provide emojis to markedEmoji");
            const n = Object.keys(e.emojis).map((e => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("|")
                , i = new RegExp(`:(${n}):`)
                , r = new RegExp(`^${i.source}`);
            return {
                extensions: [{
                    name: "emoji",
                    level: "inline",
                    start: e => e.match(i)?.index,
                    tokenizer(o, n) {
                        const i = r.exec(o);
                        if (!i)
                            return;
                        const t = i[1]
                            , s = e.emojis[t];
                        return s ? {
                            type: "emoji",
                            raw: i[0],
                            name: t,
                            emoji: s
                        } : void 0
                    },
                    renderer: o => e.renderer ? e.renderer(o) : `<img alt="${o.name}" src="${o.emoji}" class="marked-emoji-img">`
                }]
            }
        }
    }
    ));
    webui.fetchWithCache('https://cdn.myfi.ws/i/emojis.json', true)
        .then(emojiMap => {
            const emojiOptions = {
                emojis: emojiMap,
                renderer: (token) => token.emoji
            };
            webui.marked.use(markedEmoji.markedEmoji(emojiOptions));
        })
        .catch(ex => {
            webui.log.warn("Failed to load emojis: %o", ex);
        });
}
