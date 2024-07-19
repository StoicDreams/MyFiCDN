/* Component for displaying user storage consent */
"use strict"
{
    let isDesktopApp = webui._appSettings.isDesktopApp;
    let appType = webui._appSettings.appType || 'website';
    let hostType = isDesktopApp ? 'app' : 'browser';
    function build_options() {
        let currentState = webui.storage.getItem(webui.storage.STORAGE_ACCEPTED_KEY);
        let btnMemTheme = 'warning';
        let btnSesTheme = 'warning';
        let btnLocTheme = 'warning';
        switch (currentState) {
            case '2':
                btnLocTheme = 'active';
                break;
            case '1':
                btnSesTheme = 'active';
                break;
            default:
                btnMemTheme = 'active';
                break;
        }
        let options = [
            {
                name: 'Memory-only Storage (Maximum Security)',
                theme: btnMemTheme,
                body: `
<webui-paper class="pa-1">
    With this storage option, any login, settings, or other persistable information will only be retained in memory, and will be gone when the ${appType} is either closed or refreshed.
</webui-paper>
###### Use this option when:
<webui-paper class="pa-1">
- You are on a public computer, or some other device that is not yours.
- You do not want any personal data stored in any storage that will persist beyond a page refresh.
- You want to make sure you are required to login everytime you access this ${appType}, even when you simply reload the page.
- You have opted-in to storing your data on this computer. Selecting this option now will result in clearing any data saved from storage.
</webui-paper>
<webui-flex grow></webui-flex>
<webui-button wrap theme="${btnMemTheme}" data-trigger="${webui.storage.STORAGE_ACCEPTED_KEY}" data-value="${webui.storage.REJECT_STORAGE_CACHING}">
    I confirm this is not my personal device or I simply want to assure a login is required everytime I access this ${appType}.
</webui-button>
`
            }, {
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
            options.splice(1, 0, {
                name: 'Single Session/Tab Storage (Medium Security)',
                theme: btnSesTheme,
                body: `
<webui-paper class="pa-1">
With this storage option, any time you open a new tab and visit this ${appType}, you will need to consent to storage and login in order to access your account features.
</webui-paper>
###### Use this option when:
<webui-paper class="pa-1">
- You are on your personal device.
- You will logout before leaving your device accessible to others.
- You want to stay logged in if you refresh the page, but be logged out once you close your ${hostType} or if visiting this ${appType} in a new tab or window.
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
                case webui.storage.REJECT_STORAGE_CACHING:
                    webui.storage.rejectCachedStorage();
                    this.render();
                    break;
                default:
                    // expected on page loading
                    break;
            }
        },
        render: function () {
            build_options();
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
