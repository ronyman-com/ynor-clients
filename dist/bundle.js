var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/browsers/layouts/pages/header/menu.js
var menu_exports = {};
__export(menu_exports, {
  initHeader: () => initHeader
});
function initHeader(container) {
  if (!container)
    return;
  container.innerHTML = `
        <header class="main-header">
            <nav class="main-nav">
                <div class="logo">YNOR</div>
                <ul class="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/browser">Browser</a></li>
                    <li><a href="/settings">Settings</a></li>
                </ul>
            </nav>
        </header>
    `;
  container.querySelector(".nav-links").addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      console.log("Navigation:", e.target.href);
    }
  });
}
var init_menu = __esm({
  "src/browsers/layouts/pages/header/menu.js"() {
  }
});

// src/browsers/layouts/pages/footer/menu.js
var menu_exports2 = {};
var init_menu2 = __esm({
  "src/browsers/layouts/pages/footer/menu.js"() {
  }
});

// src/browsers/layouts/pages/sidebar/L-sidebar.js
var L_sidebar_exports = {};
var init_L_sidebar = __esm({
  "src/browsers/layouts/pages/sidebar/L-sidebar.js"() {
  }
});

// src/browsers/layouts/pages/sidebar/R-sidebar.js
var R_sidebar_exports = {};
var init_R_sidebar = __esm({
  "src/browsers/layouts/pages/sidebar/R-sidebar.js"() {
  }
});

// src/browsers/layouts/index.js
async function initializeApp() {
  const { initHeader: initHeader2 } = await Promise.resolve().then(() => (init_menu(), menu_exports));
  const { initFooter } = await Promise.resolve().then(() => (init_menu2(), menu_exports2));
  const { initLeftSidebar } = await Promise.resolve().then(() => (init_L_sidebar(), L_sidebar_exports));
  const { initRightSidebar } = await Promise.resolve().then(() => (init_R_sidebar(), R_sidebar_exports));
  document.addEventListener("DOMContentLoaded", () => {
    initHeader2(document.getElementById("header"));
    initFooter(document.getElementById("footer"));
    initLeftSidebar(document.getElementById("left-sidebar"));
    initRightSidebar(document.getElementById("right-sidebar"));
    console.log("Application initialized");
  });
}
initializeApp();
export {
  initializeApp
};
//# sourceMappingURL=bundle.js.map
