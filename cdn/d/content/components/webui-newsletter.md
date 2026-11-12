<webui-page-segment elevation="10">
    The `<webui-newsletter>` component shows a newsletter signup form backed by [My Fidelity](https://www.myfi.ws). Create the newsletter on a verified domain in My Fidelity, then put its key in the `key` attribute. The form only works on the newsletter's own domain, and only while the newsletter's subscription is active. Otherwise it hides itself, except on localhost, where it says why.
</webui-page-segment>

```html:Signup form
<webui-newsletter key="your-newsletter-key"></webui-newsletter>
```

The newsletter's name and description from My Fidelity are shown above the form. To write your own, add content: a `slot="title"` element replaces the name, and other content replaces the description.

```html:Your own offer text
<webui-newsletter key="your-newsletter-key" button="Join" success="Thanks! Check your inbox to confirm.">
    <h2 slot="title">Get our weekly notes</h2>
    <p>One short email every Friday.</p>
</webui-newsletter>
```

### Double opt-in

Signing up sends a confirmation email from Stoic Dreams. Nothing else is sent to the address until the visitor confirms. The confirmation link opens `https://www.myfi.ws/newsletter/confirm?token=...`, where this component asks the visitor to click before confirming, so mail scanners that open links can't confirm for them. Unsubscribe links work the same way.

```html:Confirm and unsubscribe pages
<webui-newsletter confirm></webui-newsletter>
<webui-newsletter unsubscribe></webui-newsletter>
```

Both read the token from the `token` attribute, or from `?token=` in the address.

### Attributes

| Attribute | Description |
|---|---|
| `key` | The newsletter's key from My Fidelity |
| `label` | The email field's label. Defaults to "Email" |
| `button` | The button text |
| `success` | The message shown after signing up |
| `confirm`, `unsubscribe` | Show the confirm or unsubscribe step instead of the form |
| `token` | The confirm or unsubscribe token, when it isn't in the address |

The component sets `state` to `loading`, `ready`, `done`, `error`, or `unavailable`, and fires `subscribed`, `confirmed`, and `unsubscribed` events. Its parts (`title`, `description`, `form`, `input`, `button`, `status`) can be styled with `::part()`. The form includes a hidden field that only bots fill in, and the API limits how many signups one address can send.

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/newsletter.js" language="javascript" label="newsletter.js"></webui-code>
