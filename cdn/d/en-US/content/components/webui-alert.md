
<webui-page-segment elevation="10">
    Web UI alerts are used to display important messages to users. They can be used to inform users about errors, warnings, or other significant information that requires attention.
    The alert only displays when the `show` attribute is set to true. Alerts can be dismissed by the user, which will remove the `show` attribute.
    It is common to include an alert within a group of HTML when you want an alert to appear in context with other content, and have your functionality trigger the alert to show or hide.
</webui-page-segment>

###### Recommended Variants

<webui-side-by-side>
    <webui-page-segment elevation="10">
        ```html:Example Info
            <webui-alert show variant="info">Example Info</webui-alert>
        ```
        ```html:Example Warning
            <webui-alert show variant="warning">Example Warning</webui-alert>
        ```
        ```html:Example Danger
            <webui-alert show variant="danger">Example Danger</webui-alert>
        ```
        ```html:Example Success
            <webui-alert show variant="success">Example Success</webui-alert>
        ```
        ```html:Example Primary
            <webui-alert show variant="primary">Example Primary</webui-alert>
        ```
        ```html:Example Secondary
            <webui-alert show variant="secondary">Example Secondary</webui-alert>
        ```
        ```html:Example Tertiary
            <webui-alert show variant="tertiary">Example Tertiary</webui-alert>
        ```
        ```html:Example Title
            <webui-alert show variant="title">Example Title</webui-alert>
        ```
    </webui-page-segment>
    <webui-page-segment elevation="10">
        <webui-alert show variant="info">Example Info</webui-alert>
        <webui-alert show variant="warning">Example Warning</webui-alert>
        <webui-alert show variant="danger">Example Danger</webui-alert>
        <webui-alert show variant="success">Example Success</webui-alert>
        <webui-alert show variant="primary">Example Primary</webui-alert>
        <webui-alert show variant="secondary">Example Secondary</webui-alert>
        <webui-alert show variant="tertiary">Example Tertiary</webui-alert>
        <webui-alert show variant="title">Example Title</webui-alert>
    </webui-page-segment>
</webui-side-by-side>

###### Additional Themed Variants

<webui-side-by-side>
    <webui-page-segment elevation="10">
        ```html:Example Background
            <webui-alert show variant="background">Example Background</webui-alert>
        ```
        ```html:Example Site
            <webui-alert show variant="site">Example Site</webui-alert>
        ```
        ```html:Example Black
            <webui-alert show variant="black">Example Black</webui-alert>
        ```
        ```html:Example White
            <webui-alert show variant="white">Example White</webui-alert>
        ```
        ```html:Example Shade
            <webui-alert show variant="shade">Example Shade</webui-alert>
        ```
        ```html:Example Active
            <webui-alert show variant="active">Example Active</webui-alert>
        ```
        ```html:Example Button
            <webui-alert show variant="button">Example Button</webui-alert>
        ```
        ```html:Example Action
            <webui-alert show variant="action">Example Action</webui-alert>
        ```
        ```html:Example Footer
            <webui-alert show variant="footer">Example Footer</webui-alert>
        ```
        ```html:Example Theme
            <webui-alert show variant="theme">Example Theme</webui-alert>
        ```
    </webui-page-segment>
    <webui-page-segment elevation="10">
        <webui-alert show variant="background">Example Background</webui-alert>
        <webui-alert show variant="site">Example Site</webui-alert>
        <webui-alert show variant="black">Example Black</webui-alert>
        <webui-alert show variant="white">Example White</webui-alert>
        <webui-alert show variant="shade">Example Shade</webui-alert>
        <webui-alert show variant="active">Example Active</webui-alert>
        <webui-alert show variant="button">Example Button</webui-alert>
        <webui-alert show variant="action">Example Action</webui-alert>
        <webui-alert show variant="footer">Example Footer</webui-alert>
        <webui-alert show variant="theme">Example Theme</webui-alert>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/alert.js" language="javascript" label="alert.js"></webui-code>
