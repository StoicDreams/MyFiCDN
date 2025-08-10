<webui-data data-page-title="{APP_COMPANY_SINGULAR} Content Delivery" data-page-subtitle="">
    <template slot="json" name="page-next-page">
        {
            "name":"About My Fidelity CDN",
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
    <webui-button align="left" hash="welcome" slot="tabs">Welcome</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/welcome.md"></webui-content>
    <webui-button align="left" hash="markdown" slot="tabs">Markdown</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/markdown.md"></webui-content>
    <webui-button align="left" hash="icon-search" slot="tabs">Icon Search</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/icon-search.md"></webui-content>
    <webui-button align="left" hash="icon-create" slot="tabs">Icon Creator</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/icon-creator.md"></webui-content>
    <webui-button align="left" hash="loading-bars" slot="tabs">Loading Bars</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/loading-bars.md"></webui-content>
    <webui-button align="left" hash="file-loading" slot="tabs">File Loading</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/file-select.md"></webui-content>
    <webui-button align="left" hash="condition" slot="tabs">Condition</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/condition.md"></webui-content>
    <webui-button align="left" hash="quote" slot="tabs">Quote</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/quote.md"></webui-content>
    <webui-button align="left" hash="test-page-data" slot="tabs">Test Page Data</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-page-data.md"></webui-content>
    <webui-button align="left" hash="test-app-data" slot="tabs">Test App Data</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-app-data.md"></webui-content>
    <webui-button align="left" hash="test-session-data" slot="tabs">Test Session Data</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-session-data.md"></webui-content>
    <webui-button align="left" hash="test-input-transfer" slot="tabs">Test Input Transfer</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-input.md"></webui-content>
    <webui-button align="left" hash="pagination" slot="tabs">Pagination</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/pagination.md"></webui-content>
    <webui-button align="left" hash="data-lists" slot="tabs">Data Lists</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/lists.md"></webui-content>
    <webui-button align="left" hash="data-table" slot="tabs">Data Table</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/table.md"></webui-content>
    <webui-button align="left" hash="mock-report" slot="tabs">Mock Report</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/mock-report.md"></webui-content>
    <webui-button align="left" hash="grid" slot="tabs">Grid</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/grid.md"></webui-content>
    <webui-button align="left" hash="dynamic-tabs" slot="tabs">Dynamic Tabs</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/dynamic-tabs.md"></webui-content>
    <webui-button align="left" hash="html-to-canvas" slot="tabs">HTML to Canvas</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-canvas.md"></webui-content>
    <webui-button align="left" hash="code" slot="tabs">Code</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-code.md"></webui-content>
    <webui-button align="left" hash="emojis" slot="tabs">Emojis</webui-button>
    <webui-content cache slot="content" src="/d/en-US/content/test-emojis.md"></webui-content>
</webui-tabs>

<webui-data data-page-loaded="1"></webui-data>

## Current Web UI Projects :tada:

Our top priority projects we are currently working on.

<webui-cards src="https://webui.stoicdreams.com/cards/webui-powered-websites.json" card-width="500"></webui-cards>
