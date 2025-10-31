# Export VC Context to Deck Intelligence - Implementation Plan

## Overview
Enable VCs to build rich context (notes, emails, meeting reports) in VC Context Manager, then export it to Deck Intelligence for enhanced pitch deck analysis.

## User Flow
```
1. VC uploads notes/docs in VC Context Manager
   ↓
2. AI generates synthesis/summary
   ↓
3. Click "Export to Deck Intelligence" button
   ↓
4. Context sent to Deck Intelligence (stored in session/localStorage)
   ↓
5. VC uploads pitch deck + checklist as usual
   ↓
6. Gemini analyzes WITH the additional context
   ↓
7. Context persists across refreshes until cleared
   ↓
8. "Clear Context" button removes imported context
```

## Technical Implementation

### Phase 1: Frontend State Management (30 min)
**Files to modify:**
- `src/components/VCContextManager.tsx` - Add export button
- `src/components/DeckIntelligence.tsx` - Show imported context, use in analysis
- `src/services/vcContextApi.ts` - Add export helper function

**Features:**
1. Export button in VCContextManager (next to Generate Summary)
2. Store context in localStorage: `importedContext` object with:
   - `deckId`: source deck
   - `summary`: AI synthesis
   - `items`: list of documents
   - `timestamp`: when exported
3. Visual indicator in DeckIntelligence showing context is active
4. Clear context button in DeckIntelligence

### Phase 2: Enhanced Analysis Prompt (20 min)
**Files to modify:**
- `server/src/services/gemini.ts` - Update analysis prompt

**Changes:**
1. Add optional `additionalContext` parameter to analysis function
2. Include context in Gemini prompt:
```
You are analyzing this pitch deck.

ADDITIONAL VC CONTEXT:
[Summary of meetings, notes, and communications]

KEY DOCUMENTS REVIEWED:
- Meeting notes from [date]
- Email communications
- Due diligence checklist

Now analyze the pitch deck considering this background...
```

### Phase 3: API Integration (25 min)
**Files to modify:**
- `src/services/api.ts` - Update uploadDualDeck to include context
- `server/src/routes/decks.ts` - Accept optional context in upload

**Changes:**
1. Frontend: Check localStorage for `importedContext` before upload
2. Include context in FormData if present
3. Backend: Extract context from request, pass to Gemini service

### Phase 4: Persistence & UI (25 min)
**Features:**
1. Context badge in DeckIntelligence header:
   ```
   [📝 Using Context from: Startup XYZ] [Clear ×]
   ```
2. Expandable panel showing:
   - Summary text
   - List of source documents (3-5 items)
   - Export timestamp
3. Context survives page refresh
4. Context cleared when:
   - User clicks "Clear Context"
   - User starts fresh analysis (optional warning)
   - 24 hours pass (optional expiry)

## Database Changes
**None required!** Everything stored in localStorage (client-side).

## API Changes
**Backward compatible** - context is optional parameter.

## Testing Checklist
- [ ] Export context from VCContextManager
- [ ] See context indicator in DeckIntelligence
- [ ] Upload deck with context → verify enhanced analysis
- [ ] Refresh page → context still present
- [ ] Clear context → indicator disappears
- [ ] Upload deck without context → works as before
- [ ] Multiple deck analyses with same context

## Estimated Time
- Phase 1: 30 min
- Phase 2: 20 min  
- Phase 3: 25 min
- Phase 4: 25 min
- Testing: 20 min
**Total: ~2 hours**

## Benefits
1. **Richer analysis** - Gemini has full context from meetings/notes
2. **Streamlined workflow** - No need to re-upload documents
3. **Persistent state** - Context survives refresh
4. **Flexible** - Can use with/without context
5. **No backend changes** - All state in localStorage

## Future Enhancements
- Store context in database (linked to user session)
- Context versioning (track what was used for each analysis)
- Share context across team members
- Auto-suggest relevant context based on company name
