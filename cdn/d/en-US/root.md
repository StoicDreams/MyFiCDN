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

<webui-sideimage src="https://cdn.myfi.ws/v/Vecteezy/cartoon-style-cloud-storage-data-processing-message.svg">

I am very excited to be sharing this tool with you, as well as my journey into the world of Rust development.

One of my last major projects at Stoic Dreams was working on a UI framework utilizing the C# Blazor framework, which allows for C# code and Razor pages to be compiled to webassembly, thus allowing for C# native libraries and code to be used for developing front-end web applications.

Blazor was a very interesting framework for me, as I have always loved the C# language and I was very excited by the prospect of getting to use if for both front-end and back-end development.

But Blazor is not without it's major issues, which I will not dive into here. But, you can check out my [Blazor UI project](https://blazorui.stoicdreams.com "Blazor UI documentation and website demo") to see for yourself the differences between it and what I am accomplishing here.

</webui-sideimage>
