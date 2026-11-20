# My Fidelity CDN

[Version: 0.11.132](https://github.com/StoicDreams/MyFiCDN)

CDN Services for Stoic Dreams

## Ideas

- Holds static assets for Stoic Dreams website products and projects.

## Development

### Setup

Before running this project, follow the [Web CLI Setup](https://webui.stoicdreams.com/tools/cli) guide to install the necessary tools and dependencies for local deployment.

### Running the Project

To run the project locally, you can use the following command:

```pwsh:Run the project from the root directory
./PowerShell/RunLocal.ps1 -port 3210
```

### Testing

Tests need no running server, since they serve files directly from `cdn/`, and nothing leaves your machine during a test run. They test the `.min.js` and `.min.css` files, which are what sites load.

- **Unit tests** ([Vitest](https://vitest.dev) with [jsdom](https://github.com/jsdom/jsdom)) load the real Web UI loader and components into a simulated page. Most tests are here, and all of them run in about 20 seconds.
- **Browser tests** ([Playwright](https://playwright.dev)) cover what needs a real browser: layout and sizes, real media, mouse positions, scrolling, and navigation.

```terminal:One time setup from the root directory
npm install
npx playwright install chromium
```

On Linux the browser tests use `/usr/bin/chromium` if it exists, so the second command can be skipped. Set `PW_CHROMIUM_PATH` to use a different browser.

| Command | Purpose |
|---|---|
| `npm test` | Run the unit tests, then the browser tests. `npm run test:min` is the same, for Publish and CI |
| `npm run test:unit` | Run only the unit tests |
| `npx vitest` | Watch the unit tests, rerunning the ones a change affects |
| `npm run test:browser` | Run only the browser tests |
| `npm run test:ui` | Open the interactive runner for the browser tests |
| `npm run test:report` | Open the last browser test report, with a screenshot and trace for each failure |
| `npx vitest run tests/unit/components/alert.test.mjs` | Run one unit test file |
| `npx playwright test tests/browser/components/drawer.spec.mjs` | Run one browser test file |
| `npx vitest run -t "webui.clone"`, `npx playwright test -g "webui.clone"` | Run tests by name |

Test files:

- `tests/unit/components/{name}.test.mjs` and `tests/browser/components/{name}.spec.mjs` test a component, named after its file in `cdn/webui/`. A component has one or both.
- `tests/unit/methods/` and `tests/unit/loader/` cover the `webui.*` methods, `webui.define`, and data binding; `tests/browser/methods/` and `tests/browser/loader/` the parts that need a browser, such as routing and real site pages.
- `tests/unit/coverage.test.mjs` fails when a component or `webui.*` member has no tests, and names what is missing.
- `tests/unit/support/webui.mjs` provides `test`, `expect`, and `mount(page, html)` for unit tests, with a `page` that works like Playwright's. `tests/browser/support/webui.mjs` provides the same for browser tests.
- `tests/scripts.spec.mjs` and `tests/service-worker.spec.mjs` test the PowerShell scripts and service worker shared with every site, and run with the browser tests.

Any uncaught error during a test fails that test, even if its checks pass. A unit test that needs layout (`boundingBox`, `page.mouse`, screenshots) fails with a message saying it belongs in `tests/browser`. Nothing in a unit test has a size, so checks of sizes, scrolling, or computed styles from stylesheets belong there too.

## Author

**[Erik Gassler](https://www.erikgassler.com) - [Stoic Dreams](https://www.stoicdreams.com)** - Forging solutions for tomorrow's software development.

**Support** - Visit [Stoic Dreams' GitHub Sponsor page](https://github.com/sponsors/StoicDreams) if you would like to provide support to Stoic Dreams.

## License

[MIT](LICENSE)
