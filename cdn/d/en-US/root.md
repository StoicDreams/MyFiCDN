<webui-data data-page-title="{COMPANY_SINGULAR} Content Delivery" data-page-subtitle="" data-page-dropdown-test='[{"id":"1","name":"One"},{"id":"2","name":"Two"}]'></webui-data>
<webui-data data-page-next-page='{"name":"About MyFi CDN","href":"/about"}'></webui-data>

<webui-sideimage reverse src="https://cdn.myfi.ws/v/Vecteezy/cartoon-style-cloud-storage-data-processing-message.svg">
    <webui-page-segment elevation="10">
        Welcome to Stoic Dreams' MyFi Content Delivery Network (CDN) website.
        This website is home to many common files used across Stoid Dreams' websites and software applications. As well as a CDN provider for users subscribed to Stoid Dreams' MyFi services, users using Stoic Dreams' WebUI framework, or users using Stoic Dreams' WebUI component library.
        This website showcases the use of raw WebUI web components, without the use of any other frameworks or languages. In other words, this website only uses raw HTML, CSS, and Vanilla JavaScript. No Rust, Node, React, C#, or any other languages are powering this website's frontend interface.
        Please don't hesitate to share your <a data-click="feedback">questions, comments, or any other feedback</a>.
    </webui-page-segment>
</webui-sideimage>

<webui-tabs pad="var(--padding)" data-subscribe="test-tab-index">
    <webui-button slot="tabs">Loading Bars</webui-button>
    <webui-content slot="content" src="/d/en-US/content/loading-bars.md"></webui-content>
    <webui-button slot="tabs">Condition</webui-button>
    <webui-content slot="content" src="/d/en-US/content/condition.md"></webui-content>
    <webui-button slot="tabs">Quote</webui-button>
    <webui-content slot="content" src="/d/en-US/content/quote.md"></webui-content>
</webui-tabs>

<webui-alert data-subscribe="page-alert"></webui-alert>
<webui-data data-page-loaded="1"></webui-data>

## Data Subscriptions

<webui-tabs pad="var(--padding)" index="1">
    <webui-button slot="tabs">Test Page Data</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-page-data.md"></webui-content>
    <webui-button slot="tabs">Test App Data</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-app-data.md"></webui-content>
    <webui-button slot="tabs">Test Input Transfer</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-input.md"></webui-content>
</webui-tabs>

## Data Display

<webui-tabs pad="var(--padding)">
    <webui-button slot="tabs">Data Lists</webui-button>
    <webui-content slot="content" src="/d/en-US/content/lists.md"></webui-content>
    <webui-button slot="tabs">Data Table</webui-button>
    <webui-content slot="content" src="/d/en-US/content/table.md"></webui-content>
</webui-tabs>

## Current Web UI Projects

Sample of our current projects to demonstrate our `webui-cards` and `webui-card` components.

<webui-cards src="https://webui.stoicdreams.com/cards/webui-powered-websites.json" card-width="500"></webui-cards>
