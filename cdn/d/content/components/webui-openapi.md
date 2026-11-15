
<webui-page-segment elevation="10">
    The Web UI OpenAPI component shows an OpenAPI document as readable API documentation, and lets visitors send requests to the API.
    It shows the API's title, version, and description, a server list, and its endpoints grouped by tag with a search box.
    Each endpoint shows its parameters, request body, and responses, with schemas, examples, and a Try it form.
    References ($ref) are followed, including ones that refer to themselves, and OpenAPI 3.0, 3.1, and Swagger 2.0 documents are supported.
    Endpoint and schema details are built when first opened, so large documents stay fast.
</webui-page-segment>

## Attributes and Methods

<webui-page-segment elevation="10">

| Name | Description |
|---|---|
| `src` | The URL of an OpenAPI document in JSON. `setSource(url)` does the same. |
| `setDoc(doc, { baseUrl })` | Show a document that is already parsed, such as one pasted by a visitor or converted from YAML. `baseUrl` is where it came from, used to resolve relative server URLs. |
| `hash` | When set, opening an endpoint puts a link to it in the address bar (`#{hash}-{method}-{path}`), and opening that link opens the endpoint. |
| `credentials` | Whether Send includes cookies: `include` (the default), `same-origin`, or `omit`. APIs that allow any origin reject requests with cookies, so a public viewer for other people's APIs should use `omit`. |
| `baseUrl` | The server URL Send uses, from the server list. |

Everything from the document is shown as text, never as HTML, and only `http`, `https`, and `mailto` links are made clickable.

</webui-page-segment>

## Example

```html:Code Snippet
<webui-openapi src="https://api.myfi.ws/openapi.json" hash="api"></webui-openapi>
```

<webui-openapi src="https://api.myfi.ws/openapi.json"></webui-openapi>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/openapi.js" language="javascript" label="openapi.js"></webui-code>
