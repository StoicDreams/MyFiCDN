/* Placeholder page content for pages under construction */
"use strict"
webui.define("webui-under-construction", {
    connected: (t) => {
        let container = document.createElement('webui-sideimage');
        container.setAttribute('src', 'https://cdn.myfi.ws/v/Vecteezy/people-are-building-a-spaceship-rocket-cohesive-teamwork-in.svg');
        container.innerHTML = webui.applyAppDataToContent(`
<webui-flex column data-subscribe="under-construction" data-set="innerHTML">

<p>{APP_NAME} <span data-subscribe="domain"></span> is under construction.</p>

</webui-flex>
`);
        t.parentNode.insertBefore(container, t);
        t.remove();
    }
});
