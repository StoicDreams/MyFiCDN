/*!
 * Web UI Email Preview - https://webui.stoicdreams.com/components#webui-email-preview
 * Shows an email as it will be received, as HTML or as plain text, with the HTML limited the way mail apps limit it.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // Mail apps such as Gmail and Outlook drop these, so the preview does too. Some keep their content (unknown tags),
    // but these are removed with everything inside them.
    const removedTags = new Set(['script', 'noscript', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'form', 'input',
        'button', 'select', 'textarea', 'option', 'video', 'audio', 'source', 'track', 'canvas', 'svg', 'math', 'template', 'slot',
        'dialog', 'portal', 'base']);
    const unsafeUrl = /^\s*(javascript|vbscript|data|file):/i;
    // Positioning outside the flow of the email is removed by most mail apps.
    const removedStyle = /(^|;)\s*position\s*:\s*(fixed|absolute|sticky)\s*(!important)?\s*(?=;|$)/gi;
    const viewNames = { html: 'HTML', text: 'Text' };

    // The email's HTML as mail apps would show it, and the names of what was removed, for the notice.
    function emailSafeHtml(html) {
        const removed = new Set();
        const doc = new DOMParser().parseFromString(`${html || ''}`, 'text/html');
        doc.querySelectorAll('*').forEach(el => {
            if (!el.isConnected) return;
            const tag = el.localName;
            if (removedTags.has(tag) || (tag === 'link' && /stylesheet/i.test(el.getAttribute('rel') || ''))
                || (tag === 'meta' && el.hasAttribute('http-equiv'))) {
                removed.add(`<${tag}>`);
                el.remove();
                return;
            }
            [...el.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on')) {
                    removed.add('event handlers');
                    el.removeAttribute(attr.name);
                } else if (['href', 'src', 'action', 'formaction', 'background', 'poster', 'xlink:href'].includes(name) && unsafeUrl.test(attr.value)) {
                    removed.add(name === 'src' && /^\s*data:/i.test(attr.value) ? 'embedded data images' : 'unsafe links');
                    el.removeAttribute(attr.name);
                } else if (name === 'style') {
                    const style = attr.value.replace(removedStyle, '$1');
                    if (style !== attr.value) {
                        removed.add('fixed or absolute positioning');
                        el.setAttribute('style', style);
                    }
                }
            });
            if (tag === 'style' && /@import/i.test(el.textContent)) {
                removed.add('@import');
                el.textContent = el.textContent.replace(/@import[^;]*;?/gi, '');
            }
            // Links open outside the preview, the way they open from an email.
            if (tag === 'a' && el.hasAttribute('href')) {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
        });
        return { html: `<!doctype html>${doc.documentElement.outerHTML}`, removed: [...removed] };
    }

    // body_html and bodyHtml both become bodyHtml.
    function camel(key) {
        return `${key}`.replace(/[_-]([a-z0-9])/gi, (_, c) => c.toUpperCase());
    }

    webui.define('webui-email-preview', {
        attr: ['api', 'height', 'view', 'placeholder'],
        constructor() {
            const t = this;
            t._fields = {};
            t._email = { subject: '', html: '', text: '' };
            t._view = 'html';
            t._apiMethod = 'POST';
            t._subject = t.template.querySelector('.subject-value');
            t._frame = t.template.querySelector('iframe');
            t._textView = t.template.querySelector('.text-view');
            t._notices = t.template.querySelector('.notices');
            t._status = t.template.querySelector('.status');
            t._toggle = t.template.querySelector('button.toggle');
            t._toggle.addEventListener('click', () => t.setView(t._view === 'html' ? 'text' : 'html'));
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'api': {
                    const segments = `${value || ''}`.split('|');
                    if (segments.length > 1 && ['get', 'post', 'put', 'patch'].includes(segments[0].toLowerCase())) {
                        t._apiMethod = segments[0].toUpperCase();
                        t._apiUrl = segments[1];
                    } else {
                        t._apiUrl = value || '';
                    }
                    t.queueUpdate();
                    break;
                }
                case 'height':
                    t.style.setProperty('--email-preview-height', webui.pxIfNumber(value));
                    break;
                case 'view':
                    t.setView(value);
                    break;
                case 'placeholder':
                    t.render();
                    break;
            }
        },
        connected() {
            const t = this;
            t.setView(t._view);
            t.render();
        },
        reconnected() {
            this.render();
        },
        /**
         * Takes fields of the email, such as { subject, bodyHtml, bodyText }, from data-subscribe. Each object adds to
         * what earlier ones gave, so one key can hold saved values and another the edits made since. Snake case names
         * such as body_html are read as bodyHtml. Values that are not objects are ignored.
         */
        setValue(value) {
            const t = this;
            if (!value || typeof value !== 'object' || Array.isArray(value)) return;
            Object.keys(value).forEach(key => {
                t._fields[camel(key)] = value[key];
            });
            t.queueUpdate();
        },
        /** Shows the 'html' or 'text' view. */
        setView(view) {
            const t = this;
            t._view = view === 'text' ? 'text' : 'html';
            const other = t._view === 'html' ? 'text' : 'html';
            t._toggle.textContent = `Show ${viewNames[other]}`;
            t._toggle.setAttribute('aria-label', `Showing the ${viewNames[t._view]} version. Show the ${viewNames[other]} version`);
            t._frame.hidden = t._view !== 'html';
            t._textView.hidden = t._view !== 'text';
            t.setAttribute('data-view', t._view);
        },
        queueUpdate() {
            const t = this;
            clearTimeout(t._timer);
            // Typing changes the fields on every key, so wait for a pause before asking the API.
            t._timer = setTimeout(() => t.update(), t._apiUrl ? 400 : 50);
        },
        async update() {
            const t = this;
            const f = t._fields;
            const email = {
                subject: `${f.subject ?? ''}`,
                bodyHtml: `${f.bodyHtml ?? f.html ?? ''}`,
                bodyText: `${f.bodyText ?? f.text ?? ''}`,
            };
            if (!t._apiUrl) {
                t._email = { subject: email.subject, html: email.bodyHtml, text: email.bodyText, notices: [] };
                t.render();
                return;
            }
            const request = Object.assign(t.getApiData(), f, email);
            const rid = webui.uuid();
            t._rid = rid;
            try {
                const resp = await webui.fetchApi(t._apiUrl, Object.assign(request, { headers: { 'Content-Type': 'application/json' } }), t._apiMethod);
                if (t._rid !== rid) return;
                if (resp.status !== 200) {
                    t.showStatus(await resp.text() || `The preview could not load (${resp.status}).`);
                    return;
                }
                const json = await resp.json();
                if (t._rid !== rid) return;
                t._email = {
                    subject: `${json.subject ?? email.subject}`,
                    html: `${json.html ?? ''}`,
                    text: `${json.text ?? ''}`,
                    notices: Array.isArray(json.notices) ? json.notices : [],
                };
                t.showStatus('');
                t.render();
            } catch (ex) {
                if (t._rid === rid) t.showStatus(`The preview could not load. ${ex.message || ex}`);
            }
        },
        // The object named by data-api, sent with each request, such as { newsletterId }.
        getApiData() {
            const key = this.dataset.api;
            if (!key) return {};
            const data = webui.getData(key);
            if (data === undefined || data === null) return {};
            if (typeof data === 'object') return Object.assign({}, data);
            return { [key.split('.').pop()]: data };
        },
        showStatus(message) {
            this._status.textContent = message || '';
            this._status.hidden = !message;
        },
        render() {
            const t = this;
            const email = t._email;
            t._subject.textContent = email.subject || '(no subject)';
            const empty = !email.html && !email.text;
            const placeholder = t.getAttribute('placeholder') || 'The email shows here as you write it.';
            const safe = emailSafeHtml(empty ? `<p style="font-family:sans-serif;color:#71717a;">${webui.escapeHtml(placeholder)}</p>` : email.html);
            if (t._frame.srcdoc !== safe.html) t._frame.srcdoc = safe.html;
            t._textView.textContent = empty ? placeholder : (email.text || '(no text version)');
            const notices = [...(email.notices || [])];
            if (safe.removed.length) {
                notices.push(`Mail apps remove some HTML, so this preview does too: ${safe.removed.join(', ')}.`);
            }
            t._notices.replaceChildren(...notices.map(n => webui.create('li', { text: `${n}` })));
            t._notices.hidden = !notices.length;
        },
        props: {
            // The email shown, as { subject, html, text, notices }.
            'email': {
                get() { return Object.assign({}, this._email); }
            }
        },
        shadowTemplate: `
<div class="bar" part="bar">
<div class="subject" part="subject"><span class="subject-label">Subject:</span> <span class="subject-value"></span></div>
<button type="button" class="toggle" part="toggle"></button>
</div>
<ul class="notices" part="notices" role="status" hidden></ul>
<div class="status" part="status" role="alert" hidden></div>
<iframe part="frame" title="Email preview" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>
<pre class="text-view" part="text" tabindex="0" hidden></pre>
<style type="text/css">
:host {
--email-preview-height: 480px;
display: flex;
flex-direction: column;
gap: calc(var(--padding, 1em) * 0.5);
min-width: 0;
}
.bar {
display: flex;
flex-wrap: wrap;
align-items: center;
justify-content: space-between;
gap: calc(var(--padding, 1em) * 0.5);
}
.subject {
font-weight: 600;
overflow-wrap: anywhere;
}
.subject-label {
font-weight: 400;
opacity: 0.8;
}
.toggle {
font: inherit;
color: var(--theme-color-offset, inherit);
background-color: var(--theme-color, transparent);
border: 1px solid currentColor;
border-radius: var(--corners, 4px);
padding: calc(var(--padding, 1em) * 0.25) calc(var(--padding, 1em) * 0.75);
cursor: pointer;
}
.toggle:focus-visible,
.text-view:focus-visible {
outline: var(--focus-outline, 2px solid currentColor);
outline-offset: var(--focus-offset, 2px);
}
.notices {
margin: 0;
padding: calc(var(--padding, 1em) * 0.5) calc(var(--padding, 1em) * 0.5) calc(var(--padding, 1em) * 0.5) calc(var(--padding, 1em) * 1.5);
border-radius: var(--corners, 4px);
background-color: var(--color-warning, #fef3c7);
color: var(--color-warning-offset, #451a03);
}
.status {
padding: calc(var(--padding, 1em) * 0.5);
border-radius: var(--corners, 4px);
background-color: var(--color-danger, #fee2e2);
color: var(--color-danger-offset, #450a0a);
}
iframe,
.text-view {
width: 100%;
height: var(--email-preview-height);
box-sizing: border-box;
border: 1px solid currentColor;
border-radius: var(--corners, 4px);
}
iframe {
background-color: #ffffff;
}
.text-view {
margin: 0;
padding: var(--padding, 1em);
overflow: auto;
white-space: pre-wrap;
overflow-wrap: anywhere;
font-family: var(--font-family-mono, monospace);
background-color: #ffffff;
color: #18181b;
}
[hidden] {
display: none !important;
}
</style>
`
    });
}
