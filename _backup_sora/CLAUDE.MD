I want to refactor an existing React-based frontend (originally built for Clevernote, an AI note-taking app) into a new mobile-first app called Healthlyst.

This is a FRONTEND-ONLY refactor for now.
Do not assume backend exists.
Use mock data and service abstractions.

-----------------------------------------
PROJECT GOAL
-----------------------------------------

Transform Clevernote UI into a health product analysis app.

Old domain:
- Notes
- AI summaries
- Editor
- Quizzes

New domain:
- Product search
- Barcode scanning
- Health scoring
- Ingredient analysis
- Subscription-based unlocking

-----------------------------------------
TECH STACK
-----------------------------------------

-  Expo
- TypeScript
- Functional components
- Hooks
- Clean modular folder structure
- Mobile-first UI
- Minimal modern design (health-tech aesthetic)
- Optimistic UI updates
-----------------------------------------
REMOVE FROM CLEVERNOTE
-----------------------------------------

- Tiptap editor
- Note page
- Quiz components
- Leaderboard
- Crossword features
- Audio features

Keep:
- Auth flow (if exists)
- Subscription state structure
- Layout system
- Shared UI components (buttons, cards, modals)

-----------------------------------------
NEW APP STRUCTURE
-----------------------------------------

Create OR edit the following screens:

1. HomeScreen
2. ProductScreen
3. CategoryScreen
4. ScannerScreen
5. SavedScreen
6. ProfileScreen

-----------------------------------------
NAVIGATION STRUCTURE
-----------------------------------------

Bottom Tab Navigation:

- Home
- Saved
- Profile

Scanner should be accessible via:
- Floating action button on Home

-----------------------------------------
HOME SCREEN
-----------------------------------------

Sections:
- Search input
- Big "Scan Barcode" button
- Category grid
- Recently viewed products (mock)
- Trending products (mock)

-----------------------------------------
PRODUCT SCREEN
-----------------------------------------

Layout:

- Product Image
- Product Name
- Brand
- Category
- Locked or Unlocked Health Score

If user is not premium:
- Show blurred score
- Show "Unlock Full Analysis" button

If premium:
- Show circular score (0–100)
- Show classification:
  - Excellent
  - Good
  - Moderate
  - Avoid

Then:
- Ingredients list
  - Badge per ingredient:
    good / neutral / caution / high_risk
  - Expandable explanation
- AI Summary section (mock text)
- Save button

-----------------------------------------
CATEGORY SCREEN
-----------------------------------------

- Grid or list of products
- Sort options:
  - Popular
  - Recently Added
  - Health Score (Premium only)

If free user selects "Sort by Score":
- Show PaywallModal

-----------------------------------------
SCANNER SCREEN
-----------------------------------------

Mock barcode scanner interface.
Simulate result after 2 seconds:
- Navigate to ProductScreen

-----------------------------------------
SAVED SCREEN
-----------------------------------------

- List of saved products
- Filter:
  - Safe
  - Avoid

Limit saved items to 5 for free users.
Show paywall when limit reached.

-----------------------------------------
PROFILE SCREEN
-----------------------------------------

Sections:
- User info
- Subscription status
- Preferences:
  - Lactose intolerant
  - Vegan
  - Low carb
  - Gut sensitive
- Toggle switches
- Manage subscription button

-----------------------------------------
STATE MANAGEMENT
-----------------------------------------

Use context or Zustand for:

- User subscription status
- User preferences
- Saved products

-----------------------------------------
SCORING DISPLAY LOGIC
-----------------------------------------

Do not calculate real scoring yet.
Use mock score values.

Classification mapping:
- 85–100 → Excellent
- 70–84 → Good
- 50–69 → Moderate
- <50 → Avoid

-----------------------------------------
DESIGN DIRECTION
-----------------------------------------

- Clean white background
- Soft green as primary accent
- Rounded cards
- Subtle shadows
- Minimal clutter
- High readability
- Health-tech feel

Font figtree:
- Light
- Regular
- Medium
- Semi-bold

-----------------------------------------
OUTPUT REQUEST
-----------------------------------------

Generate:

1. Folder structure
2. Navigation setup
3. Screen components skeleton
4. Mock data structure
5. Global state example
7. Example ProductScreen implementation
