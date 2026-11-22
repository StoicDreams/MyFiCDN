<webui-page-segment elevation="10">
    The `<webui-dropdown>` component renders an enhanced select menu. It supports loading options directly from JSON arrays, delimited strings, or external API endpoints. It features customizable icons, labels, and support for multiple selections.
</webui-page-segment>

### Attributes

- **`options`:** the choices, as JSON (an array of strings, or of objects with `id` or `value`, and `display`), or as text such as `Display|id, Other|id2` (`Display:id` works too).
- **`data-id`** and **`data-display`:** name other fields of each option to read its id and name from.
- **`value`:** the chosen option's id. With `multiple`, several ids, separated by commas.
- **`label`:** the field's name, shown beside it and read by screen readers. Without one, its `aria-label` or `title` names it.
- **`icon`** (or **`start-icon`**), **`mid-icon`**, and **`end-icon`:** icons before the label, after the label, and after the field.
- **`stack`:** puts the label above the field rather than beside it.
- **`multiple`:** lets several options be chosen.
- **`html-options`:** shows options as HTML, as described below.
- **`disabled`:** shows the choice, but it can't be changed or focused.
- **`newid`** and **`newlabel`:** add an option at the top, such as "Add new", with that id and name.
- **`api`:** loads the options from an API, with its method in front, such as `get|/api/teams`. `data-api` names a data key whose value is sent with the request (as the query for `get`), and `data-fields`, separated by `|`, the fields it must have before the request is sent.
- **`data-name`:** the data key that gets the whole chosen option (or the list of them with `multiple`), not only its id.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-dropdown label="Static Options" theme="primary" options="Option 1:opt1,Option 2:opt2,Option 3:opt3" icon="list"></webui-dropdown>
            <webui-dropdown label="JSON Options" theme="secondary" options='[{"id":"1","display":"Item A"},{"id":"2","display":"Item B"}]'></webui-dropdown>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-dropdown label="Static Options" theme="primary" options="Option 1:opt1,Option 2:opt2,Option 3:opt3" icon="list"></webui-dropdown>
            <webui-dropdown label="JSON Options" theme="secondary" options='[{"id":"1","display":"Item A"},{"id":"2","display":"Item B"}]'></webui-dropdown>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### HTML options

Options open in the dropdown's own list, so every dropdown looks the same in every browser. The list has the same keyboard support as a select: arrow keys, Home, End, Enter or Space to pick, Escape to close, and typing a letter to jump to an option. A hidden `<select>` underneath holds the value and fires `input` and `change`. On touch screens, plain dropdowns use the device's native picker instead.

When options load and the dropdown's value, such as a saved `data-subscribe` value or none at all, is not among them, it shows the first option. A dropdown with `data-trigger` or `data-bind` then fires `change`, so its data holds the option shown, and a page whose user has only one choice still loads what depends on it. It also fires `change` when its value is among the options but one of its `data-trigger` or `data-bind` keys holds something else, such as a page filter cleared on navigation beside a saved `session-` choice, so a revisited page loads for the choice it shows.

By default option text is plain text. Add the `html-options` flag to show options as HTML instead, such as an icon or color swatch beside each name. It uses the list on touch screens too.

Each option's HTML comes from its `html` field (or the field named by `data-html`), then from a `slot="template"` with `{FIELD}` or `{TEMPLATE_FIELD}` placeholders (use the second form in page markdown, where `{NAME}` style placeholders are filled from app data first), then from its display text. Values put into a template are escaped, but an `html` field is used as it is, so only fill it from content you trust, never from user text. `value`, `display`, `data-name`, and `multiple` work the same in both modes.

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-dropdown html-options label="Status" options='[{"id":"open","html":"<webui-icon icon=circle theme=success></webui-icon> Open"},{"id":"hold","html":"<webui-icon icon=circle theme=warning></webui-icon> On hold"},{"id":"closed","html":"<webui-icon icon=circle theme=danger></webui-icon> Closed"}]'></webui-dropdown>
            <webui-dropdown html-options multiple label="Tags" options='[{"id":"a","name":"Alpha"},{"id":"b","name":"Beta"}]'>
                <template slot="template"><webui-icon icon="tag"></webui-icon> <strong>{TEMPLATE_NAME}</strong></template>
            </webui-dropdown>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-dropdown html-options label="Status" options='[{"id":"open","html":"<webui-icon icon=circle theme=success></webui-icon> Open"},{"id":"hold","html":"<webui-icon icon=circle theme=warning></webui-icon> On hold"},{"id":"closed","html":"<webui-icon icon=circle theme=danger></webui-icon> Closed"}]'></webui-dropdown>
            <webui-dropdown html-options multiple label="Tags" options='[{"id":"a","name":"Alpha"},{"id":"b","name":"Beta"}]'>
                <template slot="template"><webui-icon icon="tag"></webui-icon> <strong>{TEMPLATE_NAME}</strong></template>
            </webui-dropdown>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Icons, a new option, and turned off

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-dropdown label="Stacked with Icons" stack start-icon="folder" mid-icon="star" end-icon="gear" value="b" newid="new" newlabel="Add a project" options="Alpha|a, Beta|b, Gamma|c"></webui-dropdown>
            <webui-dropdown label="Turned Off" disabled value="b" options="Alpha|a, Beta|b"></webui-dropdown>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-dropdown label="Stacked with Icons" stack start-icon="folder" mid-icon="star" end-icon="gear" value="b" newid="new" newlabel="Add a project" options="Alpha|a, Beta|b, Gamma|c"></webui-dropdown>
            <webui-dropdown label="Turned Off" disabled value="b" options="Alpha|a, Beta|b"></webui-dropdown>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/dropdown.js" language="javascript" label="dropdown.js"></webui-code>
