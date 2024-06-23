<webui-data data-page-title="Stoic Dreams Content Delivery" data-page-subtitle=""></webui-data>

<webui-sideimage reverse src="https://cdn.myfi.ws/v/Vecteezy/cartoon-style-cloud-storage-data-processing-message.svg">
    Welcome to Stoic Dreams' MyFi Content Delivery Network (CDN) website.
    This website is home to many common files used across Stoid Dreams' websites and software applications. As well as a CDN provider for users subscribed to Stoid Dreams' MyFi services, users using Stoic Dreams' WebUI framework, or users using Stoic Dreams' WebUI component library.
    This website showcases the use of raw WebUI web components, without the use of any other frameworks or languages. In other words, this website only uses raw HTML, CSS, and Vanilla JavaScript. No Rust, Node, React, C#, or any other languages are powering this website's frontend interface.
    Please don't hesitate to share your <a data-click="feedback">questions, comments, or any other feedback</a>.
</webui-sideimage>

<webui-quote theme="info" cite="Erik Gassler">
    This is a an example of webui-quote web component. Visit [webui.StoicDreams.com for documentation on Stoic Dreams' Web UI web components](https://webui.stoicdreams.com).
</webui-quote>

## Data Subscriptions

<webui-page-segment class="elevation-10">
    <webui-flex>
        <webui-inputtext label="Data Trigger From webui-inputtext" type="text" data-trigger="test1" data-subscribe="test1" data-set="value"></webui-inputtext>
    </webui-flex>
    <webui-flex>
        <label for="test2" class="nowrap">Data Trigger From input</label>
        <input id="test2" type="text" data-trigger="test1" data-subscribe="test1" data-set="value"></webui-inputtext>
    </webui-flex>
    <webui-flex>
        <span>Subscribe InnerHTML:</span>
        <span data-subscribe="test1" data-set="innerHTML"></span>
    </webui-flex>
    <webui-flex gap="5">
        <label class="nowrap">Subscribe value (readonly):</label>
        <input type="text" readonly data-subscribe="test1" data-set="value"></textarea>
    </webui-flex>
</webui-page-segment>
<webui-page-segment>
    This is a list.
    - One
    - Two
    - Three
      - Sub 1
      - Sub 2
        - Deep Sub 3
        - Deep Sub 4
</webui-page-segment>

<webui-table theme="tertiary" columns="Id;Test One; Test Two ;" data-subscribe="page-report" data-set="setData" bordered class="my-3"></webui-table>

<webui-data data-page-report='[{"id":1,"testOne":"hello","TestTwo":"World"}]'></webui-data>

## Current Web UI Projects

Sample of our current projects to demonstrate our `webui-cards` and `webui-card` components.

<webui-cards src="https://webui.stoicdreams.com/cards/webui-powered-websites.json" card-width="500"></webui-cards>

<webui-next-page name="About MyFi CDN" href="/about"></webui-next-page>
