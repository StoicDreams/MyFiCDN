<webui-data data-page-title="{APP_COMPANY_SINGULAR} Content Delivery" data-page-subtitle="">
    <template slot="json" name="page-next-page">
        {
            "name":"About MyFi CDN",
            "href":"/about"
        }
    </template>
    <template slot="json" name="page-dropdown-test">
        [{"id":"1","name":"One"},{"id":"2","name":"Two"}]
    </template>
</webui-data>
<webui-data-loader src="/mock-data.json" data-trigger="mock-report"></webui-data-loader>

<webui-alert data-subscribe="page-alert"></webui-alert>

<webui-tabs pad="var(--padding)" vertical transition-timing="200" data-subscribe="session-home-tab-index:setTab">
    <webui-button align="left" slot="tabs">Welcome</webui-button>
    <webui-content slot="content" src="/d/en-US/content/welcome.md"></webui-content>
    <webui-button align="left" slot="tabs">Icon Search</webui-button>
    <webui-content slot="content" src="/d/en-US/content/icon-search.md"></webui-content>
    <webui-button align="left" slot="tabs">Icon Creator</webui-button>
    <webui-content slot="content" src="/d/en-US/content/icon-creator.md"></webui-content>
    <webui-button align="left" slot="tabs">Loading Bars</webui-button>
    <webui-content slot="content" src="/d/en-US/content/loading-bars.md"></webui-content>
    <webui-button align="left" slot="tabs">File Loading</webui-button>
    <webui-content slot="content" src="/d/en-US/content/file-select.md"></webui-content>
    <webui-button align="left" slot="tabs">Condition</webui-button>
    <webui-content slot="content" src="/d/en-US/content/condition.md"></webui-content>
    <webui-button align="left" slot="tabs">Quote</webui-button>
    <webui-content slot="content" src="/d/en-US/content/quote.md"></webui-content>
    <webui-button align="left" slot="tabs">Test Page Data</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-page-data.md"></webui-content>
    <webui-button align="left" slot="tabs">Test App Data</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-app-data.md"></webui-content>
    <webui-button align="left" slot="tabs">Test Session Data</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-session-data.md"></webui-content>
    <webui-button align="left" slot="tabs">Test Input Transfer</webui-button>
    <webui-content slot="content" src="/d/en-US/content/test-input.md"></webui-content>
    <webui-button align="left" slot="tabs">Pagination</webui-button>
    <webui-content slot="content" src="/d/en-US/content/pagination.md"></webui-content>
    <webui-button align="left" slot="tabs">Data Lists</webui-button>
    <webui-content slot="content" src="/d/en-US/content/lists.md"></webui-content>
    <webui-button align="left" slot="tabs">Data Table</webui-button>
    <webui-content slot="content" src="/d/en-US/content/table.md"></webui-content>
    <webui-button align="left" slot="tabs">Grid</webui-button>
    <webui-content slot="content" src="/d/en-US/content/grid.md"></webui-content>
    <webui-button align="left" slot="tabs">Dynamic Tabs</webui-button>
    <webui-content slot="content" src="/d/en-US/content/dynamic-tabs.md"></webui-content>
</webui-tabs>

<webui-data data-page-loaded="1"></webui-data>

## Current Web UI Projects

Sample of our current projects to demonstrate our `webui-cards` and `webui-card` components.

<webui-cards src="https://webui.stoicdreams.com/cards/webui-powered-websites.json" card-width="500"></webui-cards>
