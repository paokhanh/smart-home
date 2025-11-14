# 🏗️ Architecture Diagram - House Management

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART HOME APPLICATION                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FRONTEND (React)                    BACKEND (Node.js)       │
│  ═════════════════                   ════════════════        │
│                                                               │
│  ┌──────────────────────────┐     ┌──────────────────────┐  │
│  │    Pages/Components      │     │   Routes/Controllers │  │
│  ├──────────────────────────┤     ├──────────────────────┤  │
│  │ • Dashboard.jsx          │────→│ • houseRoutes.js     │  │
│  │ • Houses.jsx             │────→│ • GET /api/houses    │  │
│  │ • HouseSelector.jsx      │     │ • POST /api/houses   │  │
│  │ • Members.jsx            │     │ • PUT /api/houses/:id│  │
│  └──────────────────────────┘     │ • DELETE /api/...    │  │
│           ↓                        │ • POST ...invite     │  │
│  ┌──────────────────────────┐     └──────────────────────┘  │
│  │   Services & Hooks       │             ↓                 │
│  ├──────────────────────────┤     ┌──────────────────────┐  │
│  │ • houseService.js        │────→│ Models / Schema      │  │
│  │ • HouseContext.jsx       │     │ • House.js           │  │
│  │ • useHouses()            │     │ • User.js            │  │
│  └──────────────────────────┘     └──────────────────────┘  │
│                                            ↓                 │
│                                   ┌──────────────────────┐  │
│                                   │   Database (MongoDB) │  │
│                                   ├──────────────────────┤  │
│                                   │ • houses collection  │  │
│                                   │ • users collection   │  │
│                                   └──────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.jsx (Router)
├── Navbar.jsx (with link to /houses)
│   └── Logo, Links, Profile
├── Routes
│   ├── /houses
│   │   └── Houses.jsx (Page)
│   │       ├── House List (Grid)
│   │       │   └── Card (for each house)
│   │       │       ├── Edit Button
│   │       │       ├── Delete Button
│   │       │       └── Members Button → Members Modal
│   │       │           └── Members.jsx
│   │       │               ├── Invite Form
│   │       │               └── Members List
│   │       └── Form Modal
│   │           ├── House Name Input
│   │           └── Address Input
│   │
│   ├── / (Dashboard)
│   │   └── Dashboard.jsx (Page)
│   │       ├── HouseSelector.jsx (Dropdown)
│   │       ├── House Info Bar
│   │       └── Devices Grid
│   │           └── Device Cards
│   │
│   └── Other Routes (/sensors, /schedules, etc.)
```

---

## Data Flow Diagram

### Scenario: Create New House

```
┌────────────┐
│   User     │
│   (Owner)  │
└─────┬──────┘
      │
      │ 1. Click "+ Create House"
      ↓
┌──────────────────────────────┐
│   Houses.jsx Page            │
│   (showForm = true)          │
└──────────┬───────────────────┘
           │
           │ 2. Fill Form & Submit
           ↓
┌──────────────────────────────┐
│   createHouse()              │
│   (houseService.js)          │
└──────────┬───────────────────┘
           │
           │ 3. POST /api/houses
           │ {name, address}
           ↓
┌──────────────────────────────┐
│   Backend API                │
│   (houseRoutes.js)           │
│   POST /                     │
└──────────┬───────────────────┘
           │
           │ 4. Save to DB
           ↓
┌──────────────────────────────┐
│   MongoDB                    │
│   houses.insert()            │
└──────────┬───────────────────┘
           │
           │ 5. Return new house {_id, name...}
           ↓
┌──────────────────────────────┐
│   houseService receives       │
│   response                   │
└──────────┬───────────────────┘
           │
           │ 6. setHouses([...old, newHouse])
           ↓
┌──────────────────────────────┐
│   Houses.jsx re-renders      │
│   New house in list          │
└──────────────────────────────┘
      ✅ SUCCESS
```

---

### Scenario: Select House on Dashboard

```
┌────────────┐
│   User     │
└─────┬──────┘
      │
      │ 1. Click dropdown in HouseSelector
      ↓
┌──────────────────────────────┐
│   HouseSelector.jsx          │
│   renders: <select>          │
└──────────┬───────────────────┘
           │
           │ 2. User selects house
           │ onChange event
           ↓
┌──────────────────────────────┐
│   handleHouseChange()        │
│   const house = find(id)     │
└──────────┬───────────────────┘
           │
           │ 3. onHouseChange(house)
           │ callback props
           ↓
┌──────────────────────────────┐
│   Dashboard.jsx              │
│   setCurrentHouse(house)     │
└──────────┬───────────────────┘
           │
           │ 4. Re-render Dashboard
           ↓
┌──────────────────────────────┐
│   house-info-bar updates     │
│   ✅ House name displayed     │
│   ✅ Address displayed        │
└──────────────────────────────┘
      ✅ SUCCESS
```

---

## API Call Flow

```
Request Flow:
─────────────

Frontend                          Backend
   │                                │
   │ 1. POST /api/houses            │
   │────────────────────────────────→ 
   │    + JWT Token                 │
   │                                │ 2. Verify Token
   │                                │
   │                                │ 3. Validate Input
   │                                │
   │                                │ 4. Save to DB
   │                                │
   │ Response: { _id, name, ... }   │
   │←────────────────────────────────
   │                                │
   │ 5. Update Local State          │
   │    Re-render Components        │
   │                                │
```

---

## State Management Flow

```
HouseContext (Global State)
└── houses: Array<House>
│   └── From API: GET /api/houses
│
└── selectedHouse: House | null
    └── Set by: selectHouse(houseId)
    └── Or: Auto-selected first house

Component State (Local)
├── Dashboard.jsx
│   └── currentHouse: House (from prop)
│
├── Houses.jsx
│   ├── showForm: boolean
│   ├── editingHouse: House | null
│   ├── formData: {name, address}
│   └── selectedHouseForMembers: House | null
│
├── HouseSelector.jsx
│   ├── houses: Array<House>
│   └── selectedHouse: string (houseId)
│
└── Members.jsx
    ├── house: House
    ├── inviteForm: {email, role}
    └── message: {type, text}
```

---

## Authentication & Authorization

```
┌─────────────────────────────────────────────────┐
│            Middleware Chain                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Frontend                                       │
│  ├─ Check localStorage.getItem('token')        │
│  ├─ Add to Authorization header                │
│  └─ Send request                               │
│         ↓                                       │
│  Backend                                        │
│  ├─ authMiddleware extracts token              │
│  ├─ Verify JWT signature                       │
│  ├─ Get req.user._id from token                │
│  └─ Continue to route handler                  │
│         ↓                                       │
│  houseRoutes.js                                │
│  ├─ GET /houses                                │
│  │   └── Find houses where user is member      │
│  │                                             │
│  ├─ POST /houses/:id/invite                    │
│  │   └── Check if user is owner (authorization)
│  │       ├── If YES: Allow                     │
│  │       └── If NO: Return 403 Forbidden       │
│  └─ ...                                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## File Dependencies

```
App.jsx
├── Imports: Houses, Dashboard, Navbar
│
Navbar.jsx
├── Link to /houses
│
Houses.jsx
├── houseService (getAllHouses, createHouse, etc.)
├── Members.jsx
├── Card.jsx
├── ProtectedRoute.jsx
└── houses.css

Dashboard.jsx
├── HouseSelector.jsx
│   └── houseService (getAllHouses)
├── Card.jsx
└── dashboard.css

HouseSelector.jsx
├── houseService (getAllHouses)
└── houseselector.css

Members.jsx
├── houseService (inviteUserToHouse, getHouseById)
├── Card.jsx
└── members.css

HouseContext.jsx
├── houseService (getAllHouses)
└── useHouses() hook

houseService.js
├── axios (HTTP client)
├── API base URL: http://localhost:5000/api/houses
└── JWT token from localStorage
```

---

## Request/Response Examples

### Create House Request

```
POST /api/houses HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "Nhà Bình Thạnh",
  "address": "123 Đường ABC, Q1"
}

---

HTTP/1.1 200 OK
Content-Type: application/json

{
  "_id": "60d5ec49c1234567890abcd",
  "name": "Nhà Bình Thạnh",
  "address": "123 Đường ABC, Q1",
  "owners": ["60d5ec49c1234567890user1"],
  "members": [
    {
      "userId": "60d5ec49c1234567890user1",
      "role": "Owner",
      "canControlDevices": true,
      "_id": "60d5ec49c1234567890mem1"
    }
  ],
  "metadata": {},
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "__v": 0
}
```

### Invite User Request

```
POST /api/houses/60d5ec49c1234567890abcd/invite HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "Member"
}

---

HTTP/1.1 200 OK

{
  "message": "User added to house"
}
```

---

## Error Handling Flow

```
Try to Get Houses
        ↓
┌──────────────────────────────┐
│ getAllHouses()               │
│ try block                    │
└──────────────────────────────┘
        ↓
   Success?
    / \
   /   \
  YES  NO
   |    |
   |    └─→ catch (err)
   |        ├── console.error()
   |        └── throw error
   |
   ↓
Component catches error
   ├── setError(err.message)
   ├── Show error message to user
   └── Render error UI

Frontend User sees:
"⚠️ Lỗi: Cannot GET /api/houses"
```

---

## CSS Cascade

```
index.css (Global)
├── Base styles
├── Reset styles
└── Utility classes
    ↓
    Imported by each component CSS:
    ├── dashboard.css
    ├── houses.css
    ├── houseselector.css
    ├── members.css
    └── component.css
        ├── .dashboard-container
        ├── .houses-grid
        ├── .house-selector
        ├── .modal-overlay
        └── ...
```

---

## Mobile Responsiveness

```
Desktop (1200px+)
├── Houses Grid: 3 columns
└── HouseSelector: inline dropdown

Tablet (768px - 1199px)
├── Houses Grid: 2 columns
└── HouseSelector: inline dropdown

Mobile (< 768px)
├── Houses Grid: 1 column
└── HouseSelector: stacked (flex-direction: column)
```

---

**Diagram berakhir. Referensi kembali untuk memahami arsitektur! 📐**
