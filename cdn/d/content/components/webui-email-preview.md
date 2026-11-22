<webui-page-segment elevation="10">
    The `<webui-email-preview>` component shows an email as it will be received, so people writing one can see it before it is sent. It shows the subject, then the HTML version in a frame, and a button switches to the plain text version, which mail apps show when they don't display HTML.

    The HTML is limited the way mail apps such as Gmail and Outlook limit it. Scripts, forms and their fields, frames, video, audio, SVG, external style sheets, event handlers such as `onclick`, `javascript:` and `data:` links, and fixed or absolute positioning are removed, and a notice lists what was removed. The frame is sandboxed, so nothing in it can run script even if it got past the filter, and links open in a new tab, the way they open from an email.
</webui-page-segment>

<webui-page-segment elevation="10">
    ### Passing the email in

    The preview takes the email's fields with `data-subscribe`, as objects: `subject`, `bodyHtml`, and `bodyText` (`body_html` and `body_text` work too, so a report row can be passed as it is). Each object adds to the fields earlier ones gave, so one key can hold the saved email and another the edits made since. Values that are not objects are ignored, so a button that opens a form can reset the edits key by writing to it.

    Give the inputs that write an email `data-trigger` keys under one object, such as `page-draft.subject`, and subscribe the preview to that object.

    ### Asking an API for the finished email

    With `api`, the preview sends its fields to the API after a pause in typing, and shows the email the API returns as `{ "subject", "html", "text", "notices" }`. Use this when a service adds to the email, such as a newsletter's unsubscribe footer, so the preview shows exactly what is sent. `subject`, `bodyHtml`, and `bodyText` are always sent, empty when not given yet. `data-api` names a data key whose object is sent too, such as `{ "newsletterId": 7 }`. `notices` is a list of messages shown above the preview, such as what is missing before the email can be sent. An error response is shown as text.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-input-text label="Subject" data-trigger="demo-email.subject"></webui-input-text>
        <webui-input-message label="Body (HTML)" data-trigger="demo-email.bodyHtml"
            value="<h2>Hello</h2><p>Thanks for reading.</p><script>alert(1)</script>"></webui-input-message>
        <webui-email-preview data-subscribe="demo-email" height="300"></webui-email-preview>
    ```
    <webui-page-segment elevation="10">
        <webui-input-text label="Subject" data-trigger="demo-email.subject"></webui-input-text>
        <webui-input-message label="Body (HTML)" data-trigger="demo-email.bodyHtml"></webui-input-message>
        <webui-email-preview data-subscribe="demo-email" height="300"></webui-email-preview>
    </webui-page-segment>
</webui-side-by-side>

### Attributes

| Attribute | Description |
|:---|:---|
| `data-subscribe` | Keys holding the email's fields, as objects. |
| `api` | `method\|url` of an API that returns the finished email. The method defaults to `POST`. |
| `data-api` | A data key whose object is sent with each API request. |
| `height` | Height of the HTML and text views. Defaults to 480 pixels. |
| `view` | `html` (the default) or `text`, the view shown first. |
| `placeholder` | Shown before there is anything to preview. |

### Methods and properties

| Name | Description |
|:---|:---|
| `setValue(fields)` | Adds fields to the email, as `data-subscribe` does. |
| `setView(view)` | Shows the `html` or `text` view. |
| `email` | The email shown, as `{ subject, html, text, notices }`. |

### Opening on the plain text version

<webui-side-by-side>
    ```html:Code Snippet
        <webui-email-preview data-subscribe="demo-email" view="text" height="200" placeholder="Write the email to see it here."></webui-email-preview>
    ```
    <webui-page-segment elevation="10">
        <webui-email-preview data-subscribe="demo-email" view="text" height="200" placeholder="Write the email to see it here."></webui-email-preview>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/email-preview.js" language="javascript" label="email-preview.js"></webui-code>
