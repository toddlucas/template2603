# Workflow Invocation Guide

Quick reference for invoking workflows. Copy and paste these phrases to get started.

## 🎯 For Brief Generation (Before Detailed Plan)

Use these to generate an implementation brief:

```
"Make a brief for US-11.1"
"Create a feature brief for activity logging"
"Brief me on the reply ingestion feature"
"What's involved in implementing US-8.1?"
```

**What happens:**
1. AI reads the user story from PRD
2. Determines tier (Feature/Entity/Modification) and scope (Server/Client/Fullstack)
3. Identifies namespace and key types
4. Generates concise brief (20-30 lines)
5. Recommends which workflow to follow
6. Ends with "Ready to proceed?"

**Reference**: [brief-generation.md](./brief-generation.md)

---

## 🚀 For Detailed Plan & Implementation (After Brief Approved)

### Starting Detailed Plan

```
"Let's implement this following the brief"
"Start implementing US-11.1"
"Begin with the server-feature workflow"
"Let's build this"
```

### During Implementation

```
"Continue with the next step"
"What's next?"
"Skip ahead to the controller step"
"I think step 3 is done, move to step 4"
```

### Getting Help

```
"I'm stuck on the mapper step"
"How do I test this query?"
"What's the pattern for RLS policies?"
"Show me an example of a detail mapper"
```

---

## 📋 Common Scenarios

### Scenario 1: New Feature (Never Built Before)

```
User: "Let's implement activity tracking"
AI: "Make a brief for US-11.1"
  → Generates brief
  → "Ready to proceed?"
User: "Yes, let's do it"
AI: Follows server-feature.md workflow (detailed plan)
```

### Scenario 2: Adding to Existing Feature

```
User: "Add a 'status' field to Contact"
AI: "Make a brief for this modification"
  → Identifies as Server Modification
  → Shows which files to change
  → "Ready to proceed?"
User: "Go ahead"
AI: Follows server-modification.md workflow (detailed plan)
```

### Scenario 3: Full-Stack Feature

```
User: "Build the activity timeline view"
AI: "Make a brief for US-11.2"
  → Identifies as Fullstack Entity
  → Shows server API + client UI needed
  → "Ready to proceed?"
User: "Yes, server first"
AI: Follows server-entity.md, then client-entity.md (detailed plans)
```

---

## 🤖 For AI Models: Decision Tree

```
User mentions feature/US
  ↓
Is there a brief already?
├─ No → Generate brief (brief-generation.md)
│        └─ Wait for "Ready to proceed?"
│
└─ Yes → Follow appropriate workflow for detailed plan
         ├─ Server Feature? → server-feature.md
         ├─ Server Entity? → server-entity.md
         ├─ Server Modification? → server-modification.md
         ├─ Client Feature? → client-feature.md
         ├─ Client Entity? → client-entity.md
         ├─ Client Modification? → client-modification.md
         ├─ Fullstack Feature? → fullstack-feature.md
         ├─ Fullstack Entity? → fullstack-entity.md
         └─ Fullstack Modification? → fullstack-modification.md
```

---

## ✅ Recognition Patterns

### Brief Generation Triggers
If the user says any of these, use **brief-generation.md**:
- "Make a brief for..."
- "Create a feature brief..."
- "Brief me on..."
- "What's involved in..."
- "How should we implement..."
- "Let's think about how to build..."

### Detailed Plan/Implementation Triggers
If the user says any of these, follow the **appropriate workflow**:
- "Let's implement..."
- "Start implementing..."
- "Build this..."
- "Follow the brief"
- "Begin implementation"
- "Let's code this"

### Help Triggers
If the user says any of these, **reference the appropriate pattern**:
- "I'm stuck on..."
- "How do I..."
- "What's the pattern for..."
- "Show me an example of..."
- "Need help with..."

---

## 🎓 Learning Examples

### Good Flow (With Brief)
```
User: "Let's add activity logging"
AI: "Make a brief for US-11.1"
AI: [Generates brief]
AI: "Ready to proceed?"
User: "Yes"
AI: "Following server-feature.md workflow..."
AI: [Generates detailed plan, implements step by step]
```

### Rushed Flow (Without Brief)
```
User: "Add activity logging"
AI: [Starts detailed plan/coding without brief]
User: "Wait, where are you putting this?"
AI: [Confusion about namespace/structure]
```
❌ **Don't do this!** Always create a brief first for medium/large features.

### Simple Change (Planning Optional)
```
User: "Add a 'notes' field to Contact"
AI: "This is a simple modification to Contact.cs"
AI: [Makes the change]
```
✅ **OK** - Trivial changes don't need formal planning

---

## 🔍 When to Skip Brief Generation

You can skip the formal brief for:
- ✅ Adding a simple field to existing entity
- ✅ Fixing a bug in existing code
- ✅ Updating documentation
- ✅ Trivial UI changes

You should **always create a brief** for:
- 🎯 New features/namespaces
- 🎯 New entities with CRUD
- 🎯 Complex modifications
- 🎯 Full-stack features
- 🎯 Anything marked complexity: M or L

---

## 📖 References

- **Brief Generation**: [brief-generation.md](./brief-generation.md)
- **Workflows**: [README.md](./README.md)
- **Start Guide**: [../start/new-feature.md](../start/new-feature.md)
- **Documentation Hub**: [../README.md](../README.md)
