
<webui-page-segment elevation="10">
    This component renders a tabbed interface for displaying content, allowing users to switch between different sections of information.
    It is commonly used for organizing content into manageable sections, such as settings, documentation, or any other categorized information.

    The `vertical` flag puts the tab buttons down the side of the content, rather than across the top. Windows narrower than 900 pixels show them across the top anyway, where there is room for the content. `setVertical(true)` or `setVertical(false)` switches it, so `data-subscribe="key:setVertical"` lets a toggle switch it, as in the examples below, where one toggle switches all three.

    `label` puts a title before the tab buttons, on their row, such as a drawer's name, so it takes no row of its own. For more than text, give an element `slot="label"` instead.

    A toggle at the end of the tab buttons switches them between their names and just their icons, with each name then shown as a tooltip and read by screen readers. A tab button without an icon shows two letters of its name instead, such as "SK" for Security Key and "Pr" for Projects. `tab-display` sets the views offered: `label|icon` (the default) and `icon|label` offer both, starting on the first, while `label` or `icon` alone fixes the view and leaves out the toggle. With `tab-display-key="name"`, each person's choice is remembered under that name.

    With the `sortable` flag, people can put the tabs in their own order: drag a tab button, or focus it and press Alt with an arrow key. Its content moves with it, the tab that was shown stays shown, and a `reorder` event carries the tab buttons in their new order in `detail.order`, so a page can save it and build the tabs in that order next time.
</webui-page-segment>

## Static Tabs Example

<webui-side-by-side>
    ```html:Code Snippet
        <webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
        <webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="vertical-tabs:setVertical">
            <webui-button slot="tabs">One</webui-button>
            <webui-content slot="content">This is the content for tab one.</webui-content>
            <webui-button slot="tabs">Two</webui-button>
            <webui-content slot="content">This is the content for tab two.</webui-content>
            <webui-button slot="tabs">Three</webui-button>
            <webui-content slot="content">This is the content for tab three.</webui-content>
        </webui-tabs>
    ```
    <webui-page-segment elevation="10">
        <webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
        <webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="vertical-tabs:setVertical">
            <webui-button slot="tabs">One</webui-button>
            <webui-content slot="content">This is the content for tab one.</webui-content>
            <webui-button slot="tabs">Two</webui-button>
            <webui-content slot="content">This is the content for tab two.</webui-content>
            <webui-button slot="tabs">Three</webui-button>
            <webui-content slot="content">This is the content for tab three.</webui-content>
        </webui-tabs>
    </webui-page-segment>
</webui-side-by-side>

## Icon Tabs Example

<webui-side-by-side>
    ```html:Code Snippet
        <webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
        <webui-tabs theme="secondary" tab-display="icon|label" data-subscribe="vertical-tabs:setVertical">
            <webui-button slot="tabs" start-icon="home">Home page</webui-button>
            <webui-content slot="content">The tabs start as icons. Hover one to see its name.</webui-content>
            <webui-button slot="tabs" start-icon="gear">Settings and options</webui-button>
            <webui-content slot="content">The toggle at the end shows their names.</webui-content>
            <webui-button slot="tabs">Security Key</webui-button>
            <webui-content slot="content">A tab without an icon shows SK.</webui-content>
        </webui-tabs>
    ```
    <webui-page-segment elevation="10">
        <webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
        <webui-tabs theme="secondary" tab-display="icon|label" data-subscribe="vertical-tabs:setVertical">
            <webui-button slot="tabs" start-icon="home">Home page</webui-button>
            <webui-content slot="content">The tabs start as icons. Hover one to see its name.</webui-content>
            <webui-button slot="tabs" start-icon="gear">Settings and options</webui-button>
            <webui-content slot="content">The toggle at the end shows their names.</webui-content>
            <webui-button slot="tabs">Security Key</webui-button>
            <webui-content slot="content">A tab without an icon shows SK.</webui-content>
        </webui-tabs>
    </webui-page-segment>
</webui-side-by-side>

## Dynamic Tabs Example

<webui-side-by-side>
    ```html:Code Snippet
        <webui-data data-subscribe="session-demo-dynamic-tabs:setDefault">
            <template slot="json" name="session-demo-dynamic-tabs">[]</template>
        </webui-data>
        <webui-data data-subscribe="page-new-tab-input-create:pushItem">
            <template slot="json" name="page-new-tab-input-create" data-update="session-demo-dynamic-tabs">{}</template>
        </webui-data>
        <webui-flex>
            <webui-input-text label="New Tab Name" placeholder="Enter a name for a new tab" data-trigger="page-new-tab-input.name" data-subscribe="page-new-tab-input.name" maxlength="10"></webui-input-text>
            <webui-button theme="action" data-transfer="page-new-tab-input:page-new-tab-input-create" data-clear="page-new-tab-input">Add Tab</webui-button>
        </webui-flex>
        <webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
        <webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="session-demo-dynamic-tabs:setData|vertical-tabs:setVertical">
            <template slot="template" name="label">
                {TEMPLATE_NAME}
            </template>
            <template slot="template" name="content">
                This is tab page {TAB_PAGE}.
                <webui-button class="p-abs" top="5" right="5" title="Delete Tab" start-icon="trash" theme="danger" data-remove-item="session-demo-dynamic-tabs:{TAB_INDEX}"></webui-button>
            </template>
        </webui-tabs>
    ```
    <webui-page-segment elevation="10">
        <webui-data data-subscribe="session-demo-dynamic-tabs:setDefault">
            <template slot="json" name="session-demo-dynamic-tabs">[]</template>
        </webui-data>
        <webui-data data-subscribe="page-new-tab-input-create:pushItem">
            <template slot="json" name="page-new-tab-input-create" data-update="session-demo-dynamic-tabs">{}</template>
        </webui-data>
        <webui-flex>
            <webui-input-text label="New Tab Name" placeholder="Enter a name for a new tab" data-trigger="page-new-tab-input.name" data-subscribe="page-new-tab-input.name" maxlength="10"></webui-input-text>
            <webui-button theme="action" data-transfer="page-new-tab-input:page-new-tab-input-create" data-clear="page-new-tab-input">Add Tab</webui-button>
        </webui-flex>
        <webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
        <webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="session-demo-dynamic-tabs:setData|vertical-tabs:setVertical">
            <template slot="template" name="label">
                {TEMPLATE_NAME}
            </template>
            <template slot="template" name="content">
                This is tab page {TAB_PAGE}.
                <webui-button class="p-abs" top="5" right="5" title="Delete Tab" start-icon="trash" theme="danger" data-remove-item="session-demo-dynamic-tabs:{TAB_INDEX}"></webui-button>
            </template>
        </webui-tabs>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/tabs.js" language="javascript" label="tabs.js"></webui-code>
