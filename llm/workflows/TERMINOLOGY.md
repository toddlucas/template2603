# Workflow Terminology

Clear definitions to avoid confusion between briefs and plans.

## Two-Stage Planning Process

### Stage 1: Feature Brief (High-Level)
**File**: `brief-generation.md`  
**Purpose**: Get alignment on approach before detailed planning  
**Length**: 20-30 lines  
**Invocation**: "Make a brief for US-X.Y"

**Contains**:
- ✅ Workflow to follow
- ✅ Namespace and structure
- ✅ Key types (class names)
- ✅ Integration points
- ✅ Key decisions with recommendations

**Does NOT contain**:
- ❌ Implementation code
- ❌ Detailed steps
- ❌ Method signatures
- ❌ Testing instructions

**Ends with**: "Ready to proceed?"

---

### Stage 2: Detailed Plan (Step-by-Step)
**Files**: `server-feature.md`, `client-feature.md`, `fullstack-feature.md`, etc.  
**Purpose**: Execute the implementation with specific steps  
**Length**: Full workflow document  
**Invocation**: "Follow the server-feature workflow"

**Contains**:
- ✅ Step-by-step instructions
- ✅ Code examples and patterns
- ✅ Testing guidance
- ✅ RLS policies
- ✅ Migration steps
- ✅ Checklists

**Generated from**: Templates + Modules

---

## Flow Diagram

```
User Story (PRD)
    ↓
📋 Feature Brief (concise, 5-10 min)
    ↓ [approval]
📝 Detailed Plan (comprehensive workflow)
    ↓ [execution]
💻 Implementation
    ↓
✅ Testing
    ↓
📊 Update Tracking
```

---

## Why Two Stages?

### Without Brief (Problems)
```
❌ User: "Build activity logging"
❌ AI: [Starts detailed plan immediately]
❌ AI: [Shows 50 steps]
❌ User: "Wait, I wanted this in a different namespace!"
❌ Result: Wasted time, alignment issues
```

### With Brief (Efficient)
```
✅ User: "Build activity logging"
✅ AI: [Generates 20-line brief]
✅ AI: "Prospecting namespace, ContactActivity entity"
✅ User: "Perfect!" or "Actually, put it in Analytics"
✅ AI: [Updates brief]
✅ AI: [Follows detailed plan with correct approach]
✅ Result: Aligned from the start, efficient execution
```

---

## When to Use Each

### Always Create a Brief
- 🎯 New features (complexity: M or L)
- 🎯 New entities with CRUD
- 🎯 Complex modifications
- 🎯 When namespace is unclear
- 🎯 When approach needs discussion

### Skip Brief (Go Straight to Detailed Plan)
- ⚡ Simple field additions
- ⚡ Bug fixes
- ⚡ Documentation updates
- ⚡ When approach is obvious
- ⚡ When user provides detailed requirements

---

## Terminology Comparison

| Aspect | Feature Brief | Detailed Plan |
|--------|---------------|---------------|
| **File** | `brief-generation.md` | `server-feature.md`, etc. |
| **Length** | 20-30 lines | Full document |
| **Time** | 5-10 minutes | 2-6 hours |
| **Purpose** | Alignment | Execution |
| **Level** | High-level | Step-by-step |
| **Code** | None | Examples |
| **Testing** | Not included | Full guidance |
| **Ends with** | "Ready to proceed?" | Checklist |

---

## Common Phrases

### For Briefs
- "Make a brief for US-11.1"
- "Create a feature brief"
- "Brief me on this feature"
- "What's the high-level approach?"

### For Detailed Plans
- "Follow the server-feature workflow"
- "Start the detailed plan"
- "Let's implement this"
- "Begin step 1"

---

## Related Documents

- **Brief Generation**: [brief-generation.md](./brief-generation.md)
- **Workflows Overview**: [README.md](./README.md)
- **Invocation Guide**: [INVOCATION_GUIDE.md](./INVOCATION_GUIDE.md)
- **Start Guide**: [../start/new-feature.md](../start/new-feature.md)

