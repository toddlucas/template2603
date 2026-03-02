# Streaming HTML Validation Tests

**Version:** 0.1  
**Date:** February 25, 2026  
**Status:** Planning

---

## Summary

There are two distinct "chunk emission" contexts in the streaming pipeline, and each has different HTML validity risks:

1. **LLM text chunks** — the AI's explanation text accumulates as `text` SSE events arrive. The client renders each accumulated partial string as markdown via `MarkdownContent.tsx`. Partial markdown (e.g., an opened bold span or an unclosed table) can produce malformed HTML.

2. **Provisional edit chunks** — one `provisional_edit` SSE event per reconciled operation. Each causes a DOM patch in `DocumentCenterPane`. After each patch, the document DOM should remain structurally valid HTML.

The goal is a test suite that gives confidence that neither stream degrades into broken DOM at any intermediate point.

---

## Architecture Recap

```
Server
  LLM stream ──► ChatService ──► text SSE events        ──► client accumulates → MarkdownContent.tsx renders
                             ──► provisional_edit events ──► DocumentCenterPane patches DOM
                                   (one per reconciled op)

Server: AnnotatingHtmlRenderer.RenderAnnotatedHtml(markdown, metadata)
  → full-document annotated HTML served by GET /preview
  → loaded into DocumentCenterPane as base content before patches
```

The server-side renderer (`AnnotatingHtmlRenderer`) always receives the full document markdown, so Markdig handles structure correctly. The risk zones are:

| Zone | Risk | Test target |
|------|------|-------------|
| `AnnotatingHtmlRenderer` | Malformed HTML on edge-case documents | Server unit tests |
| `MarkdownContent.tsx` (chat text) | Unclosed tags from partial LLM markdown | Client unit tests |
| `DocumentCenterPane` DOM patcher | Invalid DOM after sequential patches | Client integration tests |

---

## Zone 1: `AnnotatingHtmlRenderer` (Server)

**Risk:** Real DOCX documents contain markdown that may stress Markdig in unexpected ways — deeply nested lists, mixed table styles, special characters, empty paragraphs.

**Strategy:** Unit tests using [AngleSharp](https://anglesharp.github.io/) to parse the emitted HTML and assert no error nodes.

**Test project:** `Base2.Docs.Test` (existing)

**Test file:** `Rendering/AnnotatingHtmlRendererTests.cs` (new)

**Test pattern:**
```csharp
[Theory]
[MemberData(nameof(MarkdownCases))]
public void RenderAnnotatedHtml_ProducesWellFormedHtml(string markdown, DocumentMetadata metadata)
{
    string html = AnnotatingHtmlRenderer.RenderAnnotatedHtml(markdown, metadata);

    var context = BrowsingContext.New(Configuration.Default);
    var document = await context.OpenAsync(req => req.Content(html));

    document.QuerySelectorAll("parseerror").Should().BeEmpty();
    // Optionally: check that data-element-id count matches expected
}
```

**Cases to cover:**

| Case | Description |
|------|-------------|
| Empty document | Zero elements; should produce empty string or whitespace |
| All elements annotated | Every block matches a metadata entry |
| No elements annotated | No metadata (fresh parse); all blocks render without attribute |
| Heading levels 1–6 | Correct `<h1>`–`<h6>` nesting |
| Bold, italic, code spans | Inline formatting doesn't break tag structure |
| Markdown table | Produces `<table>` with correct `<thead>` / `<tbody>` |
| Special characters | `<`, `>`, `&`, `"` in content are HTML-escaped |
| Element ID collision | Two elements with same content hash — first match wins, no crash |
| Large document | 200+ elements; no stack overflow or timeout |

**AngleSharp dependency:** Add to `Base2.Docs.Test.csproj`:
```xml
<PackageReference Include="AngleSharp" Version="*" />
```

---

## Zone 2: `MarkdownContent.tsx` (Client — Chat Text)

**Risk:** The LLM streams its text response as incremental chunks. The client appends each chunk to the accumulated string and re-renders. At intermediate points, the string is incomplete markdown. The current `MarkdownContent.tsx` uses simple regex replacements and does not balance tags.

**Example failure modes:**

| Partial input | Rendered output | Problem |
|---------------|-----------------|---------|
| `**bold` | `<strong>bold` | Unclosed `<strong>` |
| `\| col1 \| col2` | `<table><thead>...` | No `</table>` |
| `` `code `` | `<code>code` | Unclosed `<code>` |

**Strategy:** Two-part approach:

### Part A — Test current behavior (document what breaks)

Write Vitest tests that feed partial strings to `MarkdownContent.tsx` (or its underlying render function) and record what HTML is produced. Use the browser's `DOMParser` (available in `jsdom`) to check if it is well-formed. Failures become known-bad cases.

```typescript
// MarkdownContent.test.tsx
it.each([
  ['**bold', false],          // known broken
  ['**bold**', true],         // known good
  ['partial table |', false], // known broken
])('renders "%s" → valid HTML: %s', (input, expectValid) => {
  render(<MarkdownContent content={input} />);
  // use container.innerHTML + DOMParser to check validity
});
```

### Part B — Harden the renderer

Once the failure modes are documented, decide on a remediation strategy:

| Option | Trade-off |
|--------|-----------|
| **Sanitize with DOMPurify** | Closes unclosed tags automatically; zero behavior change for complete markdown; easiest |
| **Rewrite with Markdig (server-side render)** | Perfect HTML always; requires a round-trip per text chunk; too slow |
| **Use a streaming-aware markdown parser** | `marked.js` or `micromark` handle partial input better; requires swapping the renderer |
| **Append placeholder to complete structures** | Hack: append `**` / ` ` / `\|` before rendering to close open spans; fragile |

**Recommendation:** DOMPurify is the lowest-risk option — it post-processes the regex-rendered HTML and closes any unclosed tags. Add it as a post-pass over the rendered string before `dangerouslySetInnerHTML`. This also improves security (XSS protection) as a side benefit.

**Test target files:**
- `src/client/common/src/apps/workspace/features/chat/components/MarkdownContent.tsx`

---

## Zone 3: `DocumentCenterPane` DOM Patcher (Client)

**Risk:** `provisional_edit` events arrive one at a time. Each causes a DOM mutation. After a sequence of updates, inserts, and deletes, the resulting DOM should still be valid HTML — no orphaned elements, no duplicate IDs, no broken nesting.

**Strategy:** Vitest + jsdom tests that simulate the full SSE sequence.

**Test file:** `DocumentCenterPane.patcher.test.tsx` (new, or colocated with existing component tests)

**Test pattern:**
```typescript
describe('DOM patcher', () => {
  it('applies a sequence of provisional edits and produces valid HTML', () => {
    // 1. Render component with base annotated HTML
    const { container } = render(
      <DocumentCenterPane content={baseAnnotatedHtml} provisionalEdits={[]} />
    );

    // 2. Re-render with each edit appended
    for (const edit of provisionalEdits) {
      rerender(<DocumentCenterPane content={baseAnnotatedHtml} provisionalEdits={[...prev, edit]} />);
      assertValidHtml(container.innerHTML);
    }
  });
});

function assertValidHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('parseerror')).toBeNull();
}
```

**Cases to cover:**

| Case | Description |
|------|-------------|
| Single update | One element's content is replaced with `<s>` + `<ins>` wrapping |
| Sequential updates | Three updates in order; all annotated elements still present |
| Insert at top | `positionAfter: null`; new `<p><ins>` inserted before first element |
| Insert after element | `<p><ins>` inserted after the target `[data-element-id]` |
| Delete | Target element wrapped in `<s class="provisional-del">` |
| Mixed sequence | Update + insert + delete in one stream; DOM valid at each step |
| Unknown element ID | `provisional_edit` references an ID not in base HTML; silently skipped |
| Idempotent re-render | Base HTML reset correctly between different `content` values |

---

## Test Infrastructure Notes

### Server

- No new test project needed — add to `Base2.Docs.Test`
- AngleSharp for HTML parsing
- Tests in `test/Rendering/` subdirectory

### Client

- Use the existing Vitest setup (check for `vitest.config.ts` in the client project)
- `jsdom` environment for DOM access (likely already configured)
- DOMPurify or `DOMParser` for HTML validation
- No new test files outside the existing component test pattern

---

## What This Does Not Cover

| Out of scope | Reason |
|---|---|
| Streaming markdown → HTML on the server (character-by-character) | Not a current use case; `AnnotatingHtmlRenderer` always gets the full document |
| Server-Sent Event delivery reliability | Network-level concern; handled by existing SSE infrastructure |
| Visual regression of rendered redlines | Belongs in a browser automation test (Playwright), not a unit test |
| HTML accessibility (ARIA roles, etc.) | A separate concern; not part of streaming validity |

---

## Open Questions

- **DOMPurify vs. alternative:** Is DOMPurify already in the client dependency tree? If so, adoption is near-zero cost. If not, confirm it doesn't conflict with the CSP configuration before adopting.
- **Vitest setup:** Confirm the client project has Vitest configured with `jsdom`. If it uses a different test runner, adjust test tooling accordingly.
- **Streaming text re-render frequency:** Does `MarkdownContent.tsx` re-render on every `text` chunk, or does it debounce? The answer changes how many intermediate states actually reach the DOM, and thus how urgent the partial-markdown hardening is.
