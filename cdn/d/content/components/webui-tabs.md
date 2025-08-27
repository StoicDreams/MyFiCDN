
<webui-page-segment elevation="10">
    This component renders a tabbed interface for displaying content, allowing users to switch between different sections of information.
    It is commonly used for organizing content into manageable sections, such as settings, documentation, or any other categorized information.
</webui-page-segment>

## Static Tabs Example

<webui-side-by-side>
    ```html:Code Snippet
        <webui-tabs theme="secondary" index="1" transition-timing="200">
            <webui-button slot="tabs">One</webui-button>
            <webui-content slot="content">This is the content for tab one.</webui-content>
            <webui-button slot="tabs">Two</webui-button>
            <webui-content slot="content">This is the content for tab two.</webui-content>
            <webui-button slot="tabs">Three</webui-button>
            <webui-content slot="content">This is the content for tab three.</webui-content>
        </webui-tabs>
    ```
    <webui-page-segment elevation="10">
        <webui-tabs theme="secondary" index="1" transition-timing="200">
            <webui-button slot="tabs">One</webui-button>
            <webui-content slot="content">This is the content for tab one.</webui-content>
            <webui-button slot="tabs">Two</webui-button>
            <webui-content slot="content">This is the content for tab two.</webui-content>
            <webui-button slot="tabs">Three</webui-button>
            <webui-content slot="content">This is the content for tab three.</webui-content>
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
        <webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="session-demo-dynamic-tabs:setData">
            <template slot="template" name="label">
                {TEMPLATE_NAME}
            </template>
            <template slot="template" name="content">
                This is tab page {TAB_PAGE}.
                <webui-button class="p-abs" top="5" right="5" title="Delete Tab" start-icon="trash-can" theme="danger" data-remove-item="session-demo-dynamic-tabs:{TAB_INDEX}"></webui-button>
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
        <webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="session-demo-dynamic-tabs:setData">
            <template slot="template" name="label">
                {TEMPLATE_NAME}
            </template>
            <template slot="template" name="content">
                This is tab page {TAB_PAGE}.
                <webui-button class="p-abs" top="5" right="5" title="Delete Tab" start-icon="trash-can" theme="danger" data-remove-item="session-demo-dynamic-tabs:{TAB_INDEX}"></webui-button>
            </template>
        </webui-tabs>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/tabs.js" language="javascript" label="tabs.js"></webui-code>
