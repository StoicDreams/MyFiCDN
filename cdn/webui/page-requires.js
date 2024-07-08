/* Place at top of page and subscribe to data that is required for page to be viewed.
 - Data must pass through setter process (i.e. webui.setData('key',value))
 - If data equates to false (e.g. 0, -1, '', null, undefined) then component will redirect user to home ('/').
 - Example usage:
   - Have authentication that sets "account" data when user is logged in, and undefined when user is not logged in.
   - Use this component `<webui-page-requires data-subscribe="account"></webui-page-requires>` at the start of any page content that you want to restrict to only logged in users.
*/
"use strict"
{
    webui.define("webui-page-requires", {
        constructor: (t) => {
            Object.keys(t.dataset).forEach(key => {
                let subTo = t.dataset[key];
                let setter = webui.toCamel(`set-${subTo}`);
                t[setter] = (value) => {
                    if (!value) {
                        webui.navigateTo('/');
                    }
                }
            });
        }
    });
}