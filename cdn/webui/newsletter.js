/*!
 * Web UI Newsletter - https://webui.stoicdreams.com/components#webui-newsletter
 * Newsletter signup form backed by My Fidelity (api.myfi.ws), plus the confirm and unsubscribe steps.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // Messages from the API are plain text, so they are always shown with textContent.
    async function readMessage(resp, fallback) {
        let text = '';
        try { text = (await resp.text()).trim(); } catch (_) { }
        if (text.startsWith('{')) {
            try { text = JSON.parse(text).message || ''; } catch (_) { }
        }
        return text || fallback;
    }

    const isLocal = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.hostname.endsWith('.localhost');

    webui.define('webui-newsletter', {
        attr: ['key', 'token', 'label', 'button', 'success'],
        flags: ['confirm', 'unsubscribe'],
        constructor() {
            const t = this;
            const root = t.template;
            t._title = root.querySelector('#title');
            t._desc = root.querySelector('#desc');
            t._form = root.querySelector('form');
            t._email = root.querySelector('#email');
            t._emailLabel = root.querySelector('label[for="email"]');
            t._trap = root.querySelector('#website');
            t._submit = root.querySelector('#submit');
            t._action = root.querySelector('#action');
            t._status = root.querySelector('#status');
            t._form.addEventListener('submit', ev => {
                ev.preventDefault();
                t.subscribe();
            });
            t._action.addEventListener('click', _ => t.runTokenAction());
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'label':
                    t._emailLabel.textContent = value || 'Email';
                    break;
                case 'button':
                    if (t.mode === 'signup') t._submit.textContent = value || 'Subscribe';
                    break;
                case 'key':
                case 'confirm':
                case 'unsubscribe':
                    if (t._ready) t.setup();
                    break;
            }
        },
        connected() {
            const t = this;
            t._ready = true;
            t.setup();
        },
        props: {
            mode: {
                get() {
                    if (this.hasAttribute('confirm')) return 'confirm';
                    if (this.hasAttribute('unsubscribe')) return 'unsubscribe';
                    return 'signup';
                }
            }
        },
        setStatus(message, variant) {
            const t = this;
            t._status.textContent = message || '';
            if (message) t._status.setAttribute('data-variant', variant || 'info');
            else t._status.removeAttribute('data-variant');
        },
        setState(state) {
            const t = this;
            t.setAttribute('state', state);
        },
        setup() {
            const t = this;
            t.setStatus('');
            t.removeAttribute('unavailable');
            if (t.mode === 'signup') {
                t._form.hidden = false;
                t._action.hidden = true;
                t._submit.textContent = t.button || 'Subscribe';
                t.loadInfo();
                return;
            }
            t._form.hidden = true;
            const confirm = t.mode === 'confirm';
            t._title.textContent = confirm ? 'Confirm your subscription' : 'Unsubscribe';
            t._desc.textContent = confirm
                ? 'Confirm that you want to receive this newsletter.'
                : 'Stop receiving this newsletter. You can sign up again at any time.';
            t._action.textContent = t.button || (confirm ? 'Confirm my subscription' : 'Unsubscribe');
            // A link scanner opening the email link must not confirm or unsubscribe, so this waits for a click.
            if (!t.getToken()) {
                t._action.hidden = true;
                t.setStatus('This link is missing its token. Please use the link from your email.', 'warning');
                t.setState('error');
                return;
            }
            t._action.hidden = false;
            t.setState('ready');
        },
        getToken() {
            const t = this;
            return t.token || webui.getQueryData('token') || '';
        },
        async loadInfo() {
            const t = this;
            const key = (t.key || '').trim();
            if (!key) {
                t.markUnavailable('Set the key attribute to a newsletter key from My Fidelity.');
                return;
            }
            const lid = webui.uuid();
            t._lid = lid;
            t.setState('loading');
            try {
                const resp = await webui.fetchApi(`newsletter/info?key=${encodeURIComponent(key)}`, null, 'get');
                if (t._lid !== lid) return;
                if (resp.status !== 200) {
                    t.markUnavailable('This newsletter is not available on this domain, or its subscription is not active.');
                    return;
                }
                const info = await resp.json();
                if (t._lid !== lid) return;
                t._title.textContent = info.name || '';
                t._desc.textContent = info.description || '';
                t.setState('ready');
            } catch (ex) {
                if (t._lid !== lid) return;
                t.markUnavailable(`${ex}`);
            }
        },
        markUnavailable(reason) {
            const t = this;
            t.setState('unavailable');
            // Visitors see nothing, but a developer running the site locally sees why.
            if (isLocal()) {
                t.setStatus(`Newsletter signup unavailable: ${reason}`, 'warning');
                return;
            }
            t.setAttribute('unavailable', '');
        },
        async subscribe() {
            const t = this;
            if (t._busy) return;
            const email = t._email.value.trim();
            if (!email || !t._email.checkValidity()) {
                t.setStatus('Please enter a valid email address.', 'warning');
                t._email.focus();
                return;
            }
            const success = t.success || 'Thank you! Please check your email to confirm your subscription.';
            // Bots fill every field. People never see this one.
            if (t._trap.value) {
                t.finish(success);
                return;
            }
            t._busy = true;
            t._submit.disabled = true;
            t.setStatus('');
            try {
                const resp = await webui.fetchApi('newsletter/signup', { key: t.key, email: email });
                if (resp.status === 200) {
                    t.finish(success);
                    t.dispatchEvent(new CustomEvent('subscribed', { bubbles: true, composed: true }));
                } else {
                    t.setStatus(await readMessage(resp, 'We could not sign you up. Please try again later.'), 'danger');
                }
            } catch (_) {
                t.setStatus('We could not reach the server. Please try again later.', 'danger');
            } finally {
                t._busy = false;
                t._submit.disabled = false;
            }
        },
        finish(message) {
            const t = this;
            t._form.hidden = true;
            t.setStatus(message, 'success');
            t.setState('done');
        },
        async runTokenAction() {
            const t = this;
            if (t._busy) return;
            const mode = t.mode;
            t._busy = true;
            t._action.disabled = true;
            t.setStatus('');
            try {
                const resp = await webui.fetchApi(`newsletter/${mode}`, { token: t.getToken() });
                const fallback = resp.status === 200
                    ? (mode === 'confirm' ? 'Your subscription is confirmed.' : 'You are unsubscribed.')
                    : 'Something went wrong. Please try again later.';
                const message = await readMessage(resp, fallback);
                if (resp.status === 200) {
                    t._action.hidden = true;
                    t.setStatus(message, 'success');
                    t.setState('done');
                    t.dispatchEvent(new CustomEvent(mode === 'confirm' ? 'confirmed' : 'unsubscribed', { bubbles: true, composed: true }));
                } else {
                    t.setStatus(message, 'danger');
                    t.setState('error');
                }
            } catch (_) {
                t.setStatus('We could not reach the server. Please try again later.', 'danger');
            } finally {
                t._busy = false;
                t._action.disabled = false;
            }
        },
        shadowTemplate: `
<div class="offer">
<slot name="title"><h3 id="title" part="title"></h3></slot>
<slot><p id="desc" part="description"></p></slot>
</div>
<form id="form" part="form" novalidate>
<label for="email">Email</label>
<div class="row">
<input id="email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="320" required part="input" />
<button id="submit" type="submit" part="button">Subscribe</button>
</div>
<div class="trap" aria-hidden="true"><input id="website" name="website" type="text" tabindex="-1" autocomplete="off" /></div>
</form>
<button id="action" type="button" part="button" hidden></button>
<p id="status" role="status" aria-live="polite" part="status"></p>
<style type="text/css">
:host {
display:block;
}
:host([unavailable]) {
display:none;
}
[hidden] {
display:none !important;
}
#title {
margin:0 0 var(--padding, 0.5em) 0;
color:var(--color-title, inherit);
}
#title:empty, #desc:empty, #status:empty {
display:none;
}
#desc {
margin:0 0 var(--padding, 0.5em) 0;
white-space:pre-line;
}
label {
display:block;
margin-bottom:0.25em;
font-size:0.9em;
}
.row {
display:flex;
flex-wrap:wrap;
gap:0.5em;
}
input {
flex:1 1 14em;
min-width:0;
font:inherit;
padding:0.5em 0.75em;
color:inherit;
background-color:transparent;
border:var(--theme-border-width, 1px) solid currentColor;
border-radius:var(--corner-radius, 4px);
}
button {
font:inherit;
padding:0.5em 1em;
cursor:pointer;
color:var(--theme-color-offset, var(--color-primary-offset, #fff));
background-color:var(--theme-color, var(--color-primary, #333));
border:none;
border-radius:var(--corner-radius, 4px);
}
button:disabled {
cursor:wait;
opacity:0.6;
}
input:focus-visible, button:focus-visible {
outline:2px solid var(--color-focus, currentColor);
outline-offset:2px;
}
.trap {
position:absolute;
left:-10000px;
width:1px;
height:1px;
overflow:hidden;
}
#status {
margin:var(--padding, 0.5em) 0 0 0;
}
#status[data-variant="success"] { color:var(--color-success, inherit); }
#status[data-variant="warning"] { color:var(--color-warning, inherit); }
#status[data-variant="danger"] { color:var(--color-danger, inherit); }
</style>
`
    });
}
