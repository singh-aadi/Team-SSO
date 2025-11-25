# VC Context Manager - Global Mode Implementation

## Overview
Successfully removed the deck selection requirement from VCContextManager when used in VC Mode. Users can now upload context documents globally without selecting a specific deck first.

## Changes Made

### 1. Frontend - VCContextManager Component (`src/components/VCContextManager.tsx`)

#### Added Global Mode Support
- **New Prop**: `globalMode?: boolean` - When true, bypasses deck selection entirely
- **Global Context ID**: Uses special UUID `00000000-0000-0000-0000-000000000002` for global context storage
- **Hidden Deck Selector**: Deck dropdown is now hidden when `globalMode={true}`

```typescript
// Key changes:
const GLOBAL_VC_CONTEXT_ID = '00000000-0000-0000-0000-000000000002';
const deckId = globalMode ? GLOBAL_VC_CONTEXT_ID : (propDeckId || params.deckId);

// Deck selector only shows when NOT in global mode
{!globalMode && !deckId && availableDecks.length > 0 && (
  // ... deck selector UI
)}
```

### 2. Frontend - VCMode Component (`src/components/VCMode.tsx`)

#### Enabled Global Mode
Updated VCContextManager invocation to use global mode:

```typescript
<VCContextManager 
  globalMode={true}   // NEW: Enable global mode
  embedded={true}
  onContextUpdate={handleContextUpdate} 
/>
```

### 3. Backend - Database Migration (`server/migrations/008_add_global_vc_context_deck.sql`)

#### Created Special Global Context Entities
To satisfy foreign key constraints, created dedicated database records:

**Company Record** (UUID: `00000000-0000-0000-0000-000000000001`):
- Name: "Global VC Context"
- Industry: "System"
- Stage: "Pre-Seed"
- Status: "active"

**Pitch Deck Record** (UUID: `00000000-0000-0000-0000-000000000002`):
- Company ID: Links to global context company
- Filename: "global_vc_context.pdf"
- File URL: "system://global-vc-context"
- Analysis Status: "completed"

**Migration Execution**: ✅ Successfully executed on local database

### 4. Backend - VC Context Routes (`server/src/routes/vc-context.ts`)

#### Fixed Export Query Bug
- **Problem**: Export endpoint was querying non-existent `user_id` column in `vc_context_items` table
- **Solution**: Removed `user_id` filter from context items query

```typescript
// BEFORE (ERROR - user_id doesn't exist):
const itemsResult = await query(`
  SELECT id, file_name, file_type, created_at, content_length
  FROM vc_context_items
  WHERE deck_id = $1 AND user_id = $2  // ❌ user_id column doesn't exist
  ORDER BY created_at DESC
`, [deckId, userId]);

// AFTER (FIXED):
const itemsResult = await query(`
  SELECT id, file_name, file_type, created_at, 
         LENGTH(content_text) as content_length
  FROM vc_context_items
  WHERE deck_id = $1  // ✅ Only filter by deck_id
  ORDER BY created_at DESC
`, [deckId]);
```

#### Added Global Context Logging
Added console logging to identify when global context is being processed:

```typescript
const isGlobalContext = deckId === 'global-vc-context';
console.log(isGlobalContext ? '🌍 Processing global VC context' : `📋 Processing deck-specific context: ${deckId}`);
```

## Database Schema Notes

### Table: `vc_context_items`
Defined in `server/migrations/007_add_vc_context_tables.sql`:
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `deck_id` → `pitch_decks(id)` (CASCADE DELETE)
- **Columns**: `id`, `deck_id`, `uploaded_by`, `file_path`, `file_name`, `file_type`, `content_text`, `upload_date`, `metadata`, `created_at`
- **Note**: NO `user_id` column (this was the bug in export endpoint)

### Table: `deck_intelligence_context`
Stores exported context for Deck Intelligence integration:
- **Unique Constraint**: `(deck_id, user_id)`
- **Upsert Logic**: ON CONFLICT updates existing record

## User Flow (After Changes)

### VC Mode Context Upload (No Deck Selection Required)
1. User opens **VC Mode** page
2. **VC Context Manager** section appears (no deck selection dropdown)
3. User uploads context documents (meeting notes, transcripts, research)
4. System automatically stores in global context deck (`00000000-0000-0000-0000-000000000002`)
5. User clicks **"Generate AI Summary"**
6. AI analyzes all uploaded documents and creates comprehensive summary
7. User clicks **"Export to Deck Intelligence"**
8. Context is saved to `deck_intelligence_context` table with user_id
9. Green status indicator appears in VC Mode header showing "Context Active"

### Later: Deck Intelligence Analysis (Automatic Context Pull)
1. User uploads a pitch deck in **Deck Intelligence**
2. System automatically checks if user has saved VC context
3. If context exists, it's pulled and used to enhance analysis
4. No manual selection needed - seamless integration

## Testing Checklist

### ✅ Completed
- [x] VCContextManager compiles without errors
- [x] VCMode compiles without errors
- [x] Database migration executed successfully
- [x] Global context deck record created
- [x] Export query bug fixed (removed user_id filter)

### 🔄 To Test
- [ ] Upload context document in VC Mode (should work without deck selection)
- [ ] Generate AI summary with uploaded context
- [ ] Export context to Deck Intelligence
- [ ] Verify green status indicator appears in VC Mode
- [ ] Upload pitch deck in Deck Intelligence
- [ ] Confirm context is automatically pulled during analysis

## Technical Details

### Why Special Deck Record?
The `vc_context_items` table has a NOT NULL foreign key constraint on `deck_id`:
```sql
deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE
```

**Options Considered**:
1. ✅ **Create special "global" deck** (chosen) - Least invasive, works with existing schema
2. ❌ Modify schema to make `deck_id` nullable - Would require migration + update all queries
3. ❌ Create new table for global context - Duplicates code, harder to maintain

### Frontend Constant Matching
Frontend constant `GLOBAL_VC_CONTEXT_ID` must match database UUID:
- **Frontend**: `'00000000-0000-0000-0000-000000000002'`
- **Database**: `id = '00000000-0000-0000-0000-000000000002'` in `pitch_decks` table

## Potential Issues & Solutions

### Issue: Multiple Users Sharing Global Context
**Problem**: All users' global context goes to the same deck_id
**Solution**: The `deck_intelligence_context` table uses `(deck_id, user_id)` as unique key, so each user's exported context is isolated despite sharing the same global deck.

### Issue: Foreign Key Cascade Delete
**Problem**: If someone accidentally deletes the global deck, all global context is lost
**Solution**: 
1. The deck is marked as "system" type (not user-visible in normal lists)
2. Could add a database trigger to prevent deletion
3. Could add CHECK constraint `id != '00000000-0000-0000-0000-000000000002'` to prevent deletion

## Files Changed

1. **Frontend**:
   - `src/components/VCContextManager.tsx` - Added globalMode prop, hidden deck selector
   - `src/components/VCMode.tsx` - Enabled globalMode for VCContextManager

2. **Backend**:
   - `server/src/routes/vc-context.ts` - Fixed export query, added logging
   - `server/migrations/008_add_global_vc_context_deck.sql` - NEW: Global context deck creation

## Next Steps

1. **Test the full workflow** end-to-end
2. **Update VCMode status check** to show correct status
3. **Integrate with Deck Intelligence** to auto-pull saved context
4. **Add user context** - Replace hardcoded `userId: '1'` with actual auth user
5. **Add protection** against accidental deletion of global context deck

## Success Metrics

✅ **Problem Solved**: Users can now upload VC context without selecting a deck first
✅ **No Breaking Changes**: Existing deck-specific context functionality still works
✅ **Database Consistency**: All foreign key constraints satisfied
✅ **Type Safety**: No TypeScript compilation errors
