
<webui-page-segment elevation="10">
    Web UI Alerts component provides a way to display a full history of alert messages to users. It is typically used in conjunction with the Web UI Alert component, which is used to display individual alert messages. The Alerts component can be configured to show a title, and it can be toggled open or closed using a button or other element. When opened, it displays a list of all alert messages that have been generated, allowing users to review past notifications. This is particularly useful for applications that need to keep users informed about various events or actions that have occurred.
</webui-page-segment>

## Setting up the Component

<webui-page-segment elevation="10">
    The `<webui-alerts>` component can be added to any HTML page. It is typically placed in a header or navigation area, but it can be placed anywhere on the page.
    The component can be configured using attributes and data attributes to customize its behavior and appearance.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!--Code Comment-->
        <webui-alerts title="Example Notifications" data-title="Example Alerts" data-toggleclass=".shared|open"></webui-alerts>
    ```
    <webui-page-segment elevation="10">
        <webui-alerts title="Example Notifications" data-title="Example Alerts" data-toggleclass=".shared|open"></webui-alerts>
    </webui-page-segment>
</webui-side-by-side>

## Triggering Alerts through HTML

<webui-page-segment elevation="10">
    Alerts can be triggered using elements with `data-trigger` attributes. The following triggers are supported:
    - `trigger-alert.show` : Sets the `show` attribute to true, displaying the alert.
    - `trigger-alert.message` : Sets the message content of the alert.
    - `trigger-alert.variant` : Sets the variant (type) of the alert, such as info, success, warning, or danger. This will default to "info" if not specified.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-input-text label="Alert Message" compact placeholder="Enter an alert message" data-trigger="trigger-alert.message" data-subscribe="trigger-alert.message" maxlength="100"></webui-input-text>
            <webui-flex gap="6">
                <webui-dropdown label="Alert Type" theme="secondary" data-trigger="trigger-alert.variant" options="Info:info,Success:success,Warning:warning,Danger:danger"></webui-dropdown>
                <webui-button theme="action" data-trigger="trigger-alert.show">Add Alert</webui-button>
            </webui-flex>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-input-text label="Alert Message" compact placeholder="Enter an alert message" data-trigger="trigger-alert.message" data-subscribe="trigger-alert.message" maxlength="100"></webui-input-text>
            <webui-flex gap="6">
                <webui-dropdown label="Alert Type" theme="secondary" data-trigger="trigger-alert.variant" options="Info:info,Success:success,Warning:warning,Danger:danger"></webui-dropdown>
                <webui-button theme="action" data-trigger="trigger-alert.show">Add Alert</webui-button>
            </webui-flex>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

## Full context sample

```html:index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Code Sample</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="index, follow">
    <base href="/" />

    <link rel="dns-prefetch" href="https://cdn.myfi.ws" />
    <link rel="dns-prefetch" href="https://api.myfi.ws" />
	<link rel="preconnect" href="https://cdn.myfi.ws">
	<link rel="preconnect" href="https://api.myfi.ws">
    <link href="https://cdn.myfi.ws/css/webui.min.css" rel="preload" as="style" />
    <link href="https://cdn.myfi.ws/webui/loader.min.js" rel="preload" as="script" />
    <link href="Logo.svg" rel="icon" type="image/svg+xml" sizes="any" />
    <link rel="manifest" href="app.webmanifest">
    <link href="https://cdn.myfi.ws/css/webui.min.css" rel="stylesheet" />
    <script src="https://cdn.myfi.ws/webui/loader.min.js" async></script>

    <meta name="theme-color" content="#FF2E46" />
    <meta name="author" content="Erik Gassler">
    <meta name="description" content="This is a Web UI code sample.">
</head>

<body>
    <webui-app-config src="appConfig.json"></webui-app-config>
    <webui-app data-removeclass=".nav|open;.shared|open">
        <webui-drawer slot="left" class="nav elevation-20" docked="true" data-state="slot|docked" data-moveable data-dockable>
            <webui-flex justify="center" slot="header">
                <webui-stoic-dreams-logo title="My Fidelity CDN Logo" text="MyFi" text2="CDN"></webui-stoic-dreams-logo>
            </webui-flex>
            <webui-nav routes="/nav.json" data-subscribe="app-nav-routes:setNavRoutes"></webui-nav>
        </webui-drawer>
        <webui-drawer slot="right" class="shared elevation-20" data-stopclick data-moveable data-state="slot">
        </webui-drawer>
        <header slot="header">
            <button aria-label="open navigation menu" data-toggleclass=".nav|open" class="elevation-10 pa-1 mx-1">
                <webui-icon icon="hamburger"></webui-icon>
            </button>
            <h1 data-subscribe="page-title:innerHTML">My Fidelity CDN</h1>
            <h2 data-subscribe="page-subtitle:innerHTML">Web Component Testing</h2>
            <webui-flex grow></webui-flex>
            <webui-feedback theme="primary" flags="shape:circle backing border" title="Provide us your feedback" data-post="https://api.myfi.ws/feedback/new" data-json-name="message"></webui-feedback>
            <webui-alerts title="View your notifications" data-title="My Alerts" data-toggleclass=".shared|open"></webui-alerts>
            <webui-myfi-info>
                <template slot="panel-content">
                    <webui-alert show variant="info">Example Account Panel</webui-alert>
                </template>
            </webui-myfi-info>
        </header>
        <noscript>Javascript is required to view this site</noscript>
        <webui-page-footer copyright="2025" company="Your Company">
            <webui-line></webui-line>
            <webui-next-page theme="tertiary" data-subscribe="page-next-page"></webui-next-page>
            <webui-flex class="my-3" justify="center" wrap>
                <webui-link href="/about" icon="exclamation|shape:circle|backing|bordered">About {APP_NAME}</webui-link>
                <webui-link href="/contact" icon="messages|fill|shade:tri">Contact {COMPANY_SINGULAR}</webui-link>
                <webui-link href="/privacy" icon="exclamation|shape:shield|backing|bordered">Privacy</webui-link>
                <webui-link href="/terms" icon="handshake|fill|shade|tri">Terms & Conditions</webui-link>
            </webui-flex>
        </webui-page-footer>
    </webui-app>
</body>
</html>
```

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/alerts.js" language="javascript" label="alerts.js"></webui-code>
