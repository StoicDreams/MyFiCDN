<webui-data data-page-title="Stoic Dreams Content Delivery" data-page-subtitle=""></webui-data>

<webui-page-segment>

Welcome to Stoic Dreams' MyFi Content Delivery Network (CDN) website.

This website is home to many common files used across Stoid Dreams' websites and software applications. As well as a CDN provider for users subscribed to Stoid Dreams' MyFi services, users using Stoic Dreams' WebUI framework, or users using Stoic Dreams' WebUI component library.

This website showcases the use of raw WebUI web components, without the use of any other frameworks or languages. In other words, this website only uses raw HTML, CSS, and Vanilla JavaScript. No Rust, Node, React, C#, or any other languages are powering this website's frontend interface.

</webui-page-segment>

<webui-quote theme="primary" cite="Erik Gassler">This is a an example of webui-quote web compont. Visit <a href="https://webui.stoicdreams.com">webui.StoicDreams.com for documentation on Stoic Dreams' Web UI web components</a>.</webui-quote>

## Data Subscriptions

<webui-page-segment class="elevation-10">

<webui-flex>
    <label for="test1" class="nowrap">Data Trigger test1</label>
    <input id="test1" type="text" data-trigger="test1" />
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

<webui-flex class="ma-10"></webui-flex>

<webui-fa icon="star" class=""></webui-fa>
<webui-fa icon="fish" class="fa-bounce"></webui-fa>
<webui-fa icon="user" class=""></webui-fa>

</webui-page-segment>
