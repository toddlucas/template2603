# Filename Date Prefix Instructions

## Format
Generate a date prefix in the format: `yyyy-mm-dd_`

Where:
- `yyyy` = 4-digit year
- `mm` = 2-digit month (zero-padded, 01-12)
- `dd` = 2-digit day (zero-padded, 01-31)
- Use hyphens (`-`) between year, month, and day
- Use an underscore (`_`) after the date prefix, before the rest of the filename

## Instructions

> **Note for AI Models**: The current date and time are typically provided in the system information at the start of each conversation. You can use this information directly without needing to call any time functions.

1. **Get the current date** in local time or UTC (as appropriate for your context)
   - For AI models: Use the date/time from system information if available
   - For code: Use your language's date/time API
2. **Format each component**:
   - Year: 4 digits (e.g., `2025`)
   - Month: 2 digits, zero-padded (e.g., `11` → `11`, `1` → `01`)
   - Day: 2 digits, zero-padded (e.g., `6` → `06`, `15` → `15`)
3. **Combine** with hyphens: `yyyy-mm-dd`
4. **Append** an underscore: `yyyy-mm-dd_`

## Examples

- Current date: November 6, 2025 → `2025-11-06_`
- Current date: January 3, 2025 → `2025-01-03_`
- Current date: December 25, 2024 → `2024-12-25_`

## Usage in Filenames

Apply the prefix to the beginning of the filename:

- `2025-11-06_session-lifecycle-management-plan.md`
- `2025-11-06_meeting-notes.md`
- `2025-01-03_project-proposal.md`

## Why This Format?

This format ensures files sort chronologically when sorted alphabetically, making it easy to:
- Find recent documents
- Browse files in chronological order
- Organize date-based documentation

## Common Implementation Patterns

### JavaScript/TypeScript
```javascript
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const prefix = `${year}-${month}-${day}_`;
```

### Python
```python
from datetime import datetime
now = datetime.now()
prefix = f"{now.year}-{now.month:02d}-{now.day:02d}_"
```

### PowerShell
```powershell
$date = Get-Date
$prefix = "{0:yyyy}-{0:MM}-{0:dd}_" -f $date
```

