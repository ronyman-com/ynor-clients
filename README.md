# YNOR BROWSER
[![npm version](https://img.shields.io/npm/v/ynor-browser.svg?style=flat-square)](https://www.npmjs.com/package/ynor)
[![npm downloads](https://img.shields.io/npm/dm/ynor.svg?style=flat-square)](https://www.npmjs.com/package/ynor)
[![GitHub stars](https://img.shields.io/github/stars/ronyman-com/ynor-clients.svg?style=social)](https://github.com/ronyman-com/ynor-clients)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)



# WHAT IS YNOR BROWSER ?

TYNOR is a next-generation browser framework that allows users to create web shortcuts that function like native apps across all platforms. Instead of building separate desktop and mobile apps, YNOR generates platform-agnostic shortcuts that work universally.

---

## OVERVIEW ✨

## Architecture
- Core Components
- Backend Service (Node.js)

## Web Interface

- Shortcut Generator
- Profile/URL Management
- File Structure




```
ynor-browser/
├── database/
│   └── ynor.db                 # SQLite database file containing all application data
│
├── node_modules/               # Contains all npm dependencies
│
├── server/
│   ├── app.js                  # Main Express application setup and configuration
│   │
│   ├── routes/
│   │   ├── auth.js             # Authentication routes (login, register, logout)
│   │   ├── config.js           # Application configuration routes
│   │   ├── shortcuts.js        # CRUD routes for keyboard shortcuts
│   │   └── profiles.js         # User profile management routes

    |__ src/
        |__commands
           |__build,js
           |__start.js

        |__data
           |__activity.json
           |__activityLoader.json
           |__histroyLoader.json
           |__user.json
           |__userLoader.js
│   │
│   ├── models/
│   │   ├── db.js               # SQLite database connection and initialization
│   │   ├── User.js             # User model with schema and methods
│   │   ├── Shortcut.js         # Shortcut model with schema and methods
│   │   └── Profile.js          # User profile model with schema
│   │
│   ├── services/
│   │   ├── generator.js        # Service for generating shortcut combinations
│   │   └── validator.js       # Input validation service
│   │
│   ├── config/
│   │   ├── auth.js            # Authentication configuration (JWT secrets, strategies)
│   │   ├── errors.js          # Custom error definitions and handlers
│   │   └── middleware.js      # Custom Express middleware
│   │
│   ├── controllers/
│   │   ├── authControllers.js  # Authentication logic (login, registration)
│   │   └── shortcutsController.js # Shortcut management logic
│   │
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware for protected routes
│   │
│   └── utils/
│       └── helpers.js          # Utility functions used across the application
│
├── public/                     # Static files served to clients
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css       # Main stylesheet for the application
│   │   │
│   │   ├── js/
│   │   │   ├── services/
│   │   │   │   ├── auth.js    # Client-side auth service (API calls)
│   │   │   │   ├── shortcut.js # Shortcut management service
│   │   │   │   ├── app.js     # Main application logic
│   │   │   │   ├── main.js    # Entry point for client-side JS
│   │   │   │   ├── route.js   # Client-side routing
│   │   │   │   └── utils.js   # Client-side utility functions
│   │   │
│   │   └── images/            # Application images and icons
│   │
│   └── favicon.ico            # Application favicon
│
├── templates/                  # HTML templates
│   ├── index.html              # Main application entry point
|       ====================
    |__defaults
         |__footer/
             |__df/footer.ejs
         |__head/
             |__brand.ejs
             |__head.ejs
             |__nav.ejs
         |__pages/
             |__bookmarks.ejs
             |__browse.ejs
             |__history.ejs
             |__home.ejs
             |__profile.ejs
             |__settings.ejs

         |__sodebar
             |__L-menu.ejs
             |__R-menuu.ejs
             |__top_menu.ejs

         |__index.ejs

       ====================
    |__desktop/
         |__footer/
             |__dk/footer.ejs
         |__head/
             |__brand.ejs
             |__head.ejs
             |__nav.ejs
         |__pages/
             |__bookmarks.ejs
             |__browse.ejs
             |__history.ejs
             |__home.ejs
             |__profile.ejs
             |__settings.ejs

         |__sodebar
             |__L-menu.ejs
             |__R-menuu.ejs
             |__top_menu.ejs
             
         |__index.ejs

       =====================
    |__home/
         |__footer/
             |__home/footer.ejs
         |__head/
             |__brand.ejs
             |__head.ejs
             |__nav.ejs
         |__pages/
             |__bookmarks.ejs
             |__browse.ejs
             |__history.ejs
             |__home.ejs
             |__profile.ejs
             |__settings.ejs

         |__sodebar
             |__L-menu.ejs
             |__R-menuu.ejs
             |__top_menu.ejs
             
         |__index.ejs
    |__inc/
       |__css/
          |__login.css
          |__logout.css
          |__scripts.css
          |__styles.css
       |__ejs/
          |__login.ejs
          |__logout.ejs
          |__scripts.ejs
          |__signup.ejs

       |__js/
          |__login.js
          |__logout.js
          |__scripts.js
          |__signup.js

       |__partials/

       =====================
    |__ipad/
       |__footer/
             |__ipad/footer.ejs
         |__head/
             |__brand.ejs
             |__head.ejs
             |__nav.ejs
         |__pages/
             |__bookmarks.ejs
             |__browse.ejs
             |__history.ejs
             |__home.ejs
             |__profile.ejs
             |__settings.ejs

         |__sodebar
             |__L-menu.ejs
             |__R-menuu.ejs
             |__top_menu.ejs
             
         |__index.ejs

        ====================
    |__mobile/
       |__footer/
             |__mb/footer.ejs
         |__head/
             |__brand.ejs
             |__head.ejs
             |__nav.ejs
         |__pages/
             |__bookmarks.ejs
             |__browse.ejs
             |__history.ejs
             |__home.ejs
             |__profile.ejs
             |__settings.ejs

         |__sodebar
             |__L-menu.ejs
             |__R-menuu.ejs
             |__top_menu.ejs
             
         |__index.ejs

         ===================
    |__web/
        |__footer/
             |__mb/footer.ejs
         |__head/
             |__brand.ejs
             |__head.ejs
             |__nav.ejs
         |__pages/
             |__bookmarks.ejs
             |__browse.ejs
             |__history.ejs
             |__home.ejs
             |__profile.ejs
             |__settings.ejs

         |__sodebar
             |__L-menu.ejs
             |__R-menuu.ejs
             |__top_menu.ejs
             
         |__index.ejs
    |__
│   └── inl/                    # Included templates
│       ├── dashboard.html      # Dashboard template
│       └── shortcut.html       # Shortcut management template
│
├── package.json                # Node.js project configuration and dependencies
├── .env                        # Environment variables (database config, secrets)
├── .gitignore                  # Specifies intentionally untracked files to ignore
└── README.md                   # Project documentation and setup instructions
```



```
graph TD
  A[Incoming Request] --> B[Global Middleware]
  B --> C{Public Route?}
  C -->|Yes| D[Public Router]
  C -->|No| E[Auth Check]
  E --> F{Authenticated?}
  F -->|Yes| G[Authenticated Router]
  F -->|No| H[Optional Auth Handler]
  G --> I[Controller]
  H --> I

```

[![graph](/public/assets/images/ynor_grahp_1.png)]