# Web UI Markdown Cheat Sheet

Web UI is designed to use a tweaked version of Markdown when loading site content.

This Markdown cheat sheet provides a quick overview of all the syntax elements supported by Web UI Markdown.

## Headings

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```
</webui-page-segment>
<webui-page-segment elevation="10">
# H1
## H2
### H3
#### H4
##### H5
###### H6
</webui-page-segment>
</webui-side-by-side>

<script type="text/javascript">console.log('hello world')</script>
## Emphasis

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
*Italic* or _Italic_
**Bold** or __Bold__
***Bold and Italic***
```
</webui-page-segment>
<webui-page-segment elevation="10">
*Italic* or _Italic_
**Bold** or __Bold__
***Bold and Italic***
</webui-page-segment>
</webui-side-by-side>

## Blockquotes

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
Before blockquote
> This is a blockquote.
>> Nested blockquote.
>> Continue Nested
>>> [This is a cite] More Nested with cite
> Back to parent
After blockquote
```

```markdown
Before blockquote
> [success] This is a blockquote.
>> [warning] Nested blockquote.
>> Continue Nested
>>> [danger:This is a cite] More Nested with cite
> Back to parent
After blockquote
```
</webui-page-segment>
<webui-page-segment elevation="10">
Before blockquote
> This is a blockquote.
>> Nested blockquote.
>> Continue Nested
>>> [This is a cite] More Nested with cite
> Back to parent
After blockquote

Before blockquote
> [success] This is a blockquote.
>> [warning] Nested blockquote.
>> Continue Nested
>>> [danger:This is a cite] More Nested with cite
> Back to parent
After blockquote
</webui-page-segment>
</webui-side-by-side>

## Lists

### Unordered

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
- Item 1
- Item 2
  - Item 2a
  - Item 2b
    - Item 2ai
    - Item 2bii
- Item 3
```
</webui-page-segment>
<webui-page-segment elevation="10">
- Item 1
- Item 2
  - Item 2a
  - Item 2b
    - Item 2ai
    - Item 2bii
- Item 3
</webui-page-segment>
</webui-side-by-side>

### Ordered

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
1. Item 1
1. Item 2
  1. Item 2a
  2. Item 2b
    1. Item 2ai
    1. Item 2bii
2. Item 3
```
</webui-page-segment>
<webui-page-segment elevation="10">
1. Item 1
2. Item 2
  1. Item 2a
  2. Item 2b
    1. Item 2ai
    1. Item 2bii
3. Item 3
</webui-page-segment>
</webui-side-by-side>

### Mixed

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
1. Item 1
2. Item 2
  - Item 2a
  - Item 2b
    1. Item 2ai
    1. Item 2bii

- Item 1
- Item 2
  1. Item 2a
  1. Item 2b
    - Item 2ai
    - Item 2bii
```
</webui-page-segment>
<webui-page-segment elevation="10">
1. Item 1
2. Item 2
  - Item 2a
  - Item 2b
    1. Item 2ai
    1. Item 2bii

- Item 1
- Item 2
  1. Item 2a
  1. Item 2b
    - Item 2ai
    - Item 2bii
</webui-page-segment>
</webui-side-by-side>

## Code

### Inline

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
Use `code` inside text.
```
</webui-page-segment>
<webui-page-segment elevation="10">
Use `code` inside text.
</webui-page-segment>
</webui-side-by-side>

### Block

<webui-side-by-side>
<webui-page-segment elevation="10">
````markdown
```javascript
function test() {
  console.log("Hello world!");
}
```
````
</webui-page-segment>
<webui-page-segment elevation="10">
```javascript
function test() {
  console.log("Hello world!");
}
```
</webui-page-segment>
</webui-side-by-side>

## Horizontal Rule

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
---
---success
---danger
---warning
```
</webui-page-segment>
<webui-page-segment elevation="10">
---
---success
---danger
---warning
</webui-page-segment>
</webui-side-by-side>

## Links

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
[Text](https://cdn.myfi.ws)
[Text with title](https://cdn.myfi.ws "Title")
```
</webui-page-segment>
<webui-page-segment elevation="10">
[Text](https://cdn.myfi.ws)
[Text with title](https://cdn.myfi.ws "Title")
</webui-page-segment>
</webui-side-by-side>

## Images

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
![Alt text](https://cdn.myfi.ws/ms-icon-310x310.png)
![Alt text with title](https://cdn.myfi.ws/ms-icon-310x310.png "Title")
```
</webui-page-segment>
<webui-page-segment elevation="10">
![Alt text](https://cdn.myfi.ws/ms-icon-310x310.png)
![Alt text with title](https://cdn.myfi.ws/ms-icon-310x310.png "Title")
</webui-page-segment>
</webui-side-by-side>

## Tables

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
| Header 1 | Header 2 | H-Left | H-Center | H-Right |
|----------|----------|:-------|:--------:|--------:|
| Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5  |
| Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10 |
```

```markdown
Header 1 | Header 2 | H-Left | H-Center | H-Right
---------|----------|:-------|:--------:|--------:
Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5
Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10
```
</webui-page-segment>
<webui-page-segment elevation="10">
| Header 1 | Header 2 | H-Left | H-Center | H-Right |
|----------|----------|:-------|:--------:|--------:|
| Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5  |
| Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10 |

Header 1 | Header 2 | H-Left | H-Center | H-Right
---------|----------|:-------|:--------:|--------:
Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5
Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10
</webui-page-segment>
</webui-side-by-side>

## Task Lists

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
- [x] Task 1
- [ ] Task 2
- [ ] Task 3
```
</webui-page-segment>
<webui-page-segment elevation="10">
- [x] Task 1
- [ ] Task 2
- [ ] Task 3
</webui-page-segment>
</webui-side-by-side>

## Escaping Characters

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
\*literal asterisks\*
```
</webui-page-segment>
<webui-page-segment elevation="10">
\*literal asterisks\*
</webui-page-segment>
</webui-side-by-side>

## HTML in Markdown

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
<p>This is a paragraph with <strong>HTML</strong> formatting.</p>
```
</webui-page-segment>
<webui-page-segment elevation="10">
<p>This is a paragraph with <strong>HTML</strong> formatting.</p>
</webui-page-segment>
</webui-side-by-side>

## Emojis

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown
:100:
```
</webui-page-segment>
<webui-page-segment elevation="10">
:100:
</webui-page-segment>
</webui-side-by-side>
