<webui-page-segment elevation="10">
    The `<webui-myfi-info>` component provides a user account button that toggles a shared side-panel drawer. It automatically adjusts its appearance and behavior based on the user's authentication state (`session-user-role`). When authenticated, it opens a customizable account panel equipped with default buttons for Site Settings and Sign-Out, and ends with a link to the visitor's Stoic Dreams account page (`https://www.stoicdreams.com/account`), where they manage their subscriptions and the sites they sign in to.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-myfi-info header="Account Overview">
            <template slot="panel-content">
                <webui-alert show variant="success">Welcome to your account panel!</webui-alert>
                <p>This content is dynamically injected into the shared drawer.</p>
            </template>
        </webui-myfi-info>
    ```
    <webui-page-segment elevation="10">
        <webui-flex justify="center" align="center">
            <webui-myfi-info header="Account Overview">
                <template slot="panel-content">
                    <webui-alert show variant="success">Welcome to your account panel!</webui-alert>
                    <p>This content is dynamically injected into the shared drawer.</p>
                </template>
            </webui-myfi-info>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Sign-in label

Set `sign-in-label` to show a labeled button while the visitor is signed out, such as `sign-in-label="Sign in"`. Without it, signed-out visitors see only the sign-in icon. Once signed in, the button goes back to the account icon.

```html:Code Snippet
<webui-myfi-info sign-in-label="Sign in"></webui-myfi-info>
```

### Leaving out panel items

Set `exclude` to a `|` separated list of the items to leave out of the panel: `site-settings`, `signout`, `account` (the account page link), and `grow` (the space that pushes the buttons to the bottom).

```html:Code Snippet
<webui-myfi-info exclude="site-settings|account"></webui-myfi-info>
```

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/myfi-info.js" language="javascript" label="myfi-info.js"></webui-code>
