# VC Mode Preferences Feature

## Overview
The VC Mode now allows users to save their customized evaluation criteria weights to the database. Each user can maintain personalized weight configurations for different industries.

## What Was Added

### 1. Database Schema
**File**: `server/migrations/007_add_vc_preferences.sql`
- Created `vc_preferences` table to store user-specific weights
- Stores criteria as JSONB for flexible structure
- Supports multiple preference sets per user
- Auto-updates timestamp on modifications

**Table Structure**:
```sql
CREATE TABLE vc_preferences (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    preferences_name VARCHAR(255) DEFAULT 'Default',
    industry VARCHAR(100),
    criteria JSONB NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. Backend API
**File**: `server/src/routes/vc-preferences.ts`

**Endpoints**:
- `GET /api/vc-preferences/:userId` - Get user's saved preferences
- `GET /api/vc-preferences/:userId/all` - Get all preference sets
- `POST /api/vc-preferences` - Save/update preferences
- `DELETE /api/vc-preferences/:userId/:preferencesName` - Delete preference set

**Registered in**: `server/src/index.ts` as `/api/vc-preferences`

### 3. Frontend Component
**File**: `src/components/VCMode.tsx`

**Changes**:
- Added `useAuth` hook to get current user
- Added state for saving status and messages
- Added `useEffect` to load saved preferences on mount
- Added `handleSavePreferences` function to save to API
- Added floating Save button at bottom-right with status indicators

**Features**:
- Automatically loads user's saved preferences when component mounts
- Filters by selected industry
- Shows success/error messages
- Disabled when user not logged in
- Floating action button for easy access

## How to Use

### 1. Run Migration
Make sure Cloud SQL Proxy is running, then:

```powershell
# From project root
node server/migrate-vc-preferences.js
```

### 2. Start the Server
```powershell
cd server
npm run dev
```

### 3. Start the Frontend
```powershell
# From project root
npm run dev
```

### 4. Test the Feature
1. Log in to the application
2. Navigate to VC Mode
3. Adjust the evaluation weights using the sliders
4. Change industry if needed
5. Click "Save Preferences" button (bottom-right)
6. Refresh the page - your preferences should persist

## Data Flow

```
User adjusts weights in VCMode component
    ↓
User clicks "Save Preferences"
    ↓
Frontend sends POST to /api/vc-preferences
    ↓
Backend stores in PostgreSQL vc_preferences table
    ↓
On next page load, useEffect fetches saved data
    ↓
Criteria state updated with saved preferences
```

## API Request Examples

### Save Preferences
```javascript
POST http://localhost:3000/api/vc-preferences
Content-Type: application/json

{
  "userId": "demo-001",
  "preferencesName": "Default",
  "industry": "healthcare",
  "criteria": [
    {
      "id": "team",
      "name": "Team",
      "weight": 35,
      "subcriteria": [...]
    },
    ...
  ]
}
```

### Load Preferences
```javascript
GET http://localhost:3000/api/vc-preferences/demo-001?industry=healthcare
```

## Testing

### Manual Testing
1. Login with demo account (demo@startup-scout.com / demo123)
2. Go to VC Mode
3. Adjust weights
4. Click Save
5. Check browser console for success/error messages
6. Refresh page and verify weights persisted

### Database Verification
```sql
-- Check saved preferences
SELECT * FROM vc_preferences WHERE user_id = 'demo-001';

-- View criteria JSON
SELECT 
  user_id, 
  preferences_name, 
  industry,
  criteria::text 
FROM vc_preferences;
```

## Notes
- Preferences are user-specific (tied to user.id from AuthContext)
- Industry filter is optional - selecting "all" loads general preferences
- Multiple preference sets can be saved per user (future enhancement)
- JSONB format allows flexible criteria structures
- Auto-loads on mount and industry change

## Future Enhancements
- Multiple named preference sets per user
- Import/Export preferences
- Share preferences with team members
- Preset templates for common industries
- Version history for preferences
