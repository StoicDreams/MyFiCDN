# My Fidelity CDN

[Version: 0.11.50](https://github.com/StoicDreams/MyFiCDN)

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

Tests use [Playwright](https://playwright.dev) and need no running server, since they serve files directly from `cdn/`. Nothing leaves your machine during a test run.

```terminal:One time setup from the root directory
npm install
npx playwright install chromium
```

On Linux the tests use `/usr/bin/chromium` if it exists, so the second command can be skipped. Set `PW_CHROMIUM_PATH` to use a different browser.

| Command | Purpose |
|---|---|
| `npm test` | Run everything against the source files. Use this while working |
| `npm run test:ui` | Open the interactive runner, with watch mode and a timeline for each test |
| `npm run test:min` | Run everything against the `.min.js` files. Use this before pushing |
| `npm run test:report` | Open the last report, with a screenshot and trace for each failure |
| `npx playwright test tests/components/alert.spec.mjs` | Run one file |
| `npx playwright test -g "webui.clone"` | Run tests by name |

Test files:

- `tests/components/` has one file per component, named after its file in `cdn/webui/`.
- `tests/methods/` covers the `webui.*` methods and `webui.define`.
- `tests/loader/` covers data binding, routing, clicks, and real site pages.
- `tests/coverage.spec.mjs` fails when a component or `webui.*` member has no tests, and names what is missing.
- `tests/support/webui.mjs` provides `test`, `expect`, and `mount(page, html)`.

Any uncaught error during a test fails that test, even if its checks pass.

A test marked `test.fail(true, 'Known bug: ...')` documents a bug that has not been fixed yet. Once the bug is fixed the test reports `Expected to fail, but passed`, which is the cue to delete that line.

## Author

**[Erik Gassler](https://www.erikgassler.com) - [Stoic Dreams](https://www.stoicdreams.com)** - Forging solutions for tomorrow's software development.

**Support** - Visit [Stoic Dreams' GitHub Sponsor page](https://github.com/sponsors/StoicDreams) if you would like to provide support to Stoic Dreams.

## License

[MIT](LICENSE)
