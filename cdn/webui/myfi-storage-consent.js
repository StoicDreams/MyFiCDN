/* Component for displaying user storage consent */
"use strict"
{
    let isDesktopApp = webui._appSettings.isDesktopApp;
    let appType = webui._appSettings.appType || 'website';
    let hostType = isDesktopApp ? 'app' : 'browser';
    function build_options() {
        let currentState = isDesktopApp ? '2' : webui.storage.getItem(webui.storage.STORAGE_ACCEPTED_KEY) || '1';
        let btnSesTheme = 'warning';
        let btnLocTheme = 'warning';
        switch (currentState) {
            case '2':
                btnLocTheme = 'active';
                break;
            default:
                btnSesTheme = 'active';
                break;
        }
        let options = [
            {
                name: 'Long-term Storage (Lowest Security)',
                theme: btnLocTheme,
                body: `
<webui-paper class="pa-1">
    With this storage option, you only need to consent and login once. Your login will persist even after closing and reopening this ${appType}.
</webui-paper>
###### Use this option when:
<webui-paper class="pa-1">
- You are on your personal device.
- Your device is secure from other people accessing it.
- You want to remain logged in until you explicitely logout.
</webui-paper>
<webui-flex grow></webui-flex>
<webui-button wrap theme="${btnLocTheme}" data-trigger="${webui.storage.STORAGE_ACCEPTED_KEY}" data-value="${webui.storage.ACCEPT_LOCAL_STORAGE}">
I confirm that I am using my personal device and that I understand the above statements and I accept the use of storing my data in the ${hostType} so my login and other data will be remembered any time I access this ${appType}.
</webui-button>
`
            }
        ];
        if (!isDesktopApp) {
            options.splice(0, 0, {
                name: 'Single Session/Tab Storage (Medium Security)',
                theme: btnSesTheme,
                body: `
<webui-paper class="pa-1">
With this storage option, browser data is only stored until you either close your tab or browser. Opening a new tab will start a new session.
</webui-paper>
###### With this default option:
<webui-paper class="pa-1">
- Make sure you close the browser when you are done with the computer.
- You will logout before leaving your device accessible to others.
- You will stay logged in if you refresh the page, but be logged out once you close your ${hostType} or if visiting this ${appType} in a new tab or window.
</webui-paper>
<webui-flex grow></webui-flex>
<webui-button wrap theme="${btnSesTheme}" data-trigger="${webui.storage.STORAGE_ACCEPTED_KEY}" data-value="${webui.storage.ACCEPT_SESSION_STORAGE}">
    I confirm that I am using my personal device and that I understand the above statements and I accept the use of storing my data in the ${hostType} so my login and other data will be remembered until the I close the ${hostType}.
</webui-button>
`
            });
        }
        webui.setData('page-storage-consent-options', JSON.stringify(options));
    }

    webui.define('webui-myfi-storage-consent', {
        constructor: (t) => {
        },
        setAcceptedKey: function (value) {
            switch (value) {
                case webui.storage.ACCEPT_LOCAL_STORAGE:
                    webui.storage.acceptLocalStorage();
                    this.render();
                    break;
                case webui.storage.ACCEPT_SESSION_STORAGE:
                    webui.storage.acceptSessionStorage();
                    this.render();
                    break;
                default:
                    // expected on page loading
                    break;
            }
        },
        render: function () {
            build_options();
            if (isDesktopApp) return;
            this.innerHTML = webui.applyAppDataToContent(`
## Storage Concent
<webui-page-segment elevation="10">
    <webui-paper>
        This ${appType} has multiple levels of data storage available for you to choose from, which will determine how data is stored on your device for this ${appType}.
    </webui-paper>
    <webui-cards card-width="500" data-subscribe="page-storage-consent-options:setCards"></webui-cards>
</webui-page-segment>
`);
        },
        connected: (t) => {
            t.setAttribute('data-subscribe', `${webui.storage.STORAGE_ACCEPTED_KEY}:setAcceptedKey`);
            t.render();
        }
    });
}
