/* Display social links for Stoic Dreams */
"use strict"
webui.define('webui-stoic-social-links', {
    connected: (t) => {
        if (!t.innerHTML) {
            t.innerHTML = webui.trimLinePreTabs(`
            <webui-paper class="mx-a">
                <a class="pa-1" title="Sponser us to help support development" href="https://github.com/sponsors/StoicDreams">
                <webui-fa icon="badge-dollar" family="solid"></webui-fa>
                </a>
                <a class="pa-1" title="Link to Stoic Dreams Discord server" href="https://discord.com/channels/972856291909332993/1025781071608037466">
                <webui-fa icon="discord" family="brands"></webui-fa>
                </a>
                <a class="pa-1" title="Link to Stoic Dreams on Facebook" href="https://www.facebook.com/stoicdreams">
                <webui-fa icon="facebook" family="brands"></webui-fa>
                </a>
                <a class="pa-1" title="Link to Stoic Dreams on Instagram" href="https://www.instagram.com/stoicdreamsllc">
                <webui-fa icon="instagram" family="brands"></webui-fa>
                </a>
            </webui-paper>
            `);
        }
    }
});
