# Markdown Link Checker

A Python utility to validate markdown links in the `docuscribe/llm` documentation directory.

## Usage

From the workspace root:

```bash
python lab/check-markdown-links.py
```

Or specify a custom directory:

```bash
python lab/check-markdown-links.py path/to/markdown/directory
```

## What It Checks

- Validates all markdown links in `.md` files
- Checks that linked files exist on the filesystem
- Skips external links (http://, https://, mailto:, etc.)
- Handles relative links (./file.md, ../file.md)
- Supports anchor fragments (#section)

## Output

The script will:
- List all broken links grouped by source file
- Show line numbers where broken links appear
- Display the target path that doesn't exist
- Exit with code 1 if issues found, 0 if all links valid

## Example Output

```
Checking 103 markdown files in C:\Users\me\Source\docuscribe\docuscribe\llm...

[ERROR] Found 2 broken link(s):

File: README.md
   Line 49: [Step Execution Creation]
   Target: C:\Users\me\Source\docuscribe\docuscribe\llm\concepts\orchestration\step-execution-creation.md
   Reason: File does not exist
```

## Requirements

- Python 3.7+
- No external dependencies (uses only standard library)
