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

<webui-flex column>
    <webui-loading-bar striped indeterminate height="6"></webui-loading-bar>
    <webui-loading-bar theme="success" percent="50" height="20"></webui-loading-bar>
</webui-flex>

<webui-condition data-subscribe="page-loaded">
    <webui-flex column>
        Page is loaded
    </webui-flex>
    <webui-loading-bar slot="invalid" indeterminate theme="info" height="5"></webui-loading-bar>
</webui-condition>
<webui-alert data-subscribe="page-alert"></webui-alert>
<webui-data data-page-loaded="1"></webui-data>
<webui-quote theme="info" cite="Erik Gassler">
    This is a an example of webui-quote web component. Visit [webui.StoicDreams.com for documentation on Stoic Dreams' Web UI web components](https://webui.stoicdreams.com).
</webui-quote>

## Data Subscriptions

<webui-page-segment class="elevation-10">
    #### Test Page Data (Clears when navigating to new page)
    <webui-side-by-side>
        <section>
            <webui-input-text label="Page Struct Test - subscribed to page-test.name" compact theme="success"   placeholder="Data entered here will be removed when page is changed" data-trigger="page-test.name" data-subscribe="page-test.name" data-set="value"></webui-input-text>
        </section>
        <section>
            <webui-code lang="json" data-subscribe="page-test"></webui-code>
        </section>
    </webui-side-by-side>
    #### Test App Data (Persists until page reloaded or closed)
    <webui-side-by-side>
        <webui-flex column>
            <webui-input-text label="App Struct Test - subscribed to test.name" compact theme="danger" placeholder="Data entered here will persist through page navigations." data-trigger="test.name" data-subscribe="test.name" data-set="value"></webui-input-text>
            <webui-input-text theme="info" label="App Test.One" placeholder="One" data-trigger="test.one" data-subscribe="test.one" data-set="value"></webui-input-text>
            <webui-input-text theme="tertiary" label="App Test.Two" placeholder="Two" data-trigger="test.two" data-subscribe="test.two" data-set="value"></webui-input-text>
            <webui-input-text theme="secondary" label="App Test.Three" placeholder="Three" data-trigger="test.three" data-subscribe="test.three" data-set="value"></webui-input-text>
            <webui-dropdown data-name="page-test-selected" icon="flask-vial" label="Dropdown Test" newlabel="Select an Option!" data-trigger="test.dropdown" data-subscribe="test.dropdown" data-options="page-dropdown-test">
                <option slot="template">{TEMPLATE_NAME}</option>
            </webui-dropdown>
        </webui-flex>
        <webui-paper>
            <webui-code label="test" lang="json" data-subscribe="test"></webui-code>
            <webui-code theme="tertiary" label="page-test-selected" lang="json" data-subscribe="page-test-selected"></webui-code>
            <webui-code theme="primary" label="page-test-selected.name" lang="json" data-subscribe="page-test-selected.name"></webui-code>
        </webui-paper>
    </webui-side-by-side>
    <webui-side-by-side>
        <webui-flex column>
            <webui-input-text label="Data Trigger From webui-input-text" data-trigger="test1" data-subscribe="test1" data-set="value"></webui-input-text>
            <webui-flex>
                <label for="test2" class="nowrap">Data Trigger From input</label>
                <input id="test2" type="text" data-trigger="test1" data-subscribe="test1" data-set="value">
            </webui-flex>
        </webui-flex>
        <webui-flex column>
            <webui-flex>
                <span>Subscribe InnerHTML:</span>
                <span data-subscribe="test1" data-set="innerHTML"></span>
            </webui-flex>
            <webui-flex gap="5">
                <label class="nowrap">Subscribe value (readonly):</label>
                <input type="text" readonly data-subscribe="test1" data-set="value" />
            </webui-flex>
        </webui-flex>
    </webui-side-by-side>
</webui-page-segment>

<webui-side-by-side>
    <webui-page-segment>
        ### Display Lists
        This is a list.
        - One
        - Two
        - Three
        - Sub 1
        - Sub 2
            - Deep Sub 3
            - Deep Sub 4
    </webui-page-segment>
    <webui-page-segment>
        ### Display Tables / Reports
        <webui-table theme="tertiary" columns="Id;Test One; Test Two ;" data-subscribe="page-report" data-set="setData" bordered class="my-3"></webui-table>
        <webui-data data-page-report='[{"id":1,"testOne":"hello","TestTwo":"World"}]'></webui-data>
    </webui-page-segment>
</webui-side-by-side>

## Current Web UI Projects

Sample of our current projects to demonstrate our `webui-cards` and `webui-card` components.

<webui-cards src="https://webui.stoicdreams.com/cards/webui-powered-websites.json" card-width="500"></webui-cards>
