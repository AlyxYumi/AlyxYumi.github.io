/* ============================================
   博客应用逻辑 — 路由 / 渲染 / 交互
   ============================================ */

(function () {
  "use strict";

  /* ---------- Markdown 配置 ---------- */
  if (typeof marked !== "undefined") {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false,
    });
  }

  /* ---------- DOM 引用 ---------- */
  const app = document.getElementById("app");
  const themeToggle = document.getElementById("themeToggle");
  const readingProgress = document.getElementById("readingProgress");
  const backToTop = document.getElementById("backToTop");
  const navLinks = document.querySelectorAll(".nav-link");

  /* ---------- 工具函数 ---------- */

  /** 计算预计阅读时间（分钟） */
  function calcReadingTime(content) {
    // 中文按字数估算，英文按词数估算
    const charCount = content.replace(/\s/g, "").length;
    const minutes = Math.max(1, Math.ceil(charCount / 400));
    return minutes;
  }

  /** 格式化日期 */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = [
      "一月", "二月", "三月", "四月", "五月", "六月",
      "七月", "八月", "九月", "十月", "十一月", "十二月"
    ];
    return `${d.getFullYear()} 年 ${months[d.getMonth()]} ${d.getDate()} 日`;
  }

  /** 转义 HTML */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /** 从 Markdown 提取纯文本摘要 */
  function extractExcerpt(markdown, maxLen) {
    if (!maxLen) maxLen = 100;
    var text = markdown
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
      .replace(/[#>*_`~-]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    if (text.length > maxLen) {
      text = text.slice(0, maxLen) + "...";
    }
    return text;
  }

  /* ---------- 视图渲染 ---------- */

  /** 首页 — 文章列表 */
  function renderHome() {
    const sortedPosts = POSTS.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var listHtml = sortedPosts
      .map(function (post) {
        var tagClass = post.category === "\u6e38\u620f" ? "tag mc-tag" : "tag";
        var tagsHtml = post.tags
          .map(function (tag) {
            return '<span class="' + tagClass + '">' + escapeHtml(tag) + "</span>";
          })
          .join("");

        var excerpt = post.excerpt || extractExcerpt(post.content, 120);

        return (
          '<a class="post-card" href="#/post/' + post.id + '">' +
          '<div class="post-card-meta">' +
          '<span class="post-card-date">' + formatDate(post.date) + "</span>" +
          '<span class="post-card-dot"></span>' +
          '<span class="post-card-category">' + escapeHtml(post.category) + "</span>" +
          "</div>" +
          '<h2 class="post-card-title">' + escapeHtml(post.title) + "</h2>" +
          '<p class="post-card-excerpt">' + escapeHtml(excerpt) + "</p>" +
          '<div class="post-card-tags">' + tagsHtml + "</div>" +
          "</a>"
        );
      })
      .join("");

    app.innerHTML =
      '<div class="fade-in">' +
      '<section class="hero">' +
      '<h1 class="hero-title">墨迹</h1>' +
      '<p class="hero-subtitle">用文字记录思考、技术与生活。<br>在喧嚣的世界里，留一片安静的角落。</p>' +
      '<hr class="hero-divider">' +
      "</section>" +
      '<div class="post-list">' +
      listHtml +
      "</div>" +
      "</div>";

    updateNavActive("/");
    window.scrollTo(0, 0);
  }

  /** 文章详情 */
  function renderPost(id) {
    var post = POSTS.find(function (p) {
      return p.id === id;
    });

    if (!post) {
      app.innerHTML =
        '<div class="empty-state fade-in">' +
        '<div class="empty-state-icon">&#128533;</div>' +
        "<p>文章不存在或已被移除</p>" +
        '<p style="margin-top:12px"><a href="#/">返回首页</a></p>' +
        "</div>";
      return;
    }

    var htmlContent = "";
    if (typeof marked !== "undefined") {
      htmlContent = marked.parse(post.content);
    } else {
      htmlContent = "<pre>" + escapeHtml(post.content) + "</pre>";
    }

    var tagClass = post.category === "\u6e38\u620f" ? "tag mc-tag" : "tag";
    var tagsHtml = post.tags
      .map(function (tag) {
        return '<span class="' + tagClass + '">' + escapeHtml(tag) + "</span>";
      })
      .join("");

    var readingTime = calcReadingTime(post.content);

    app.innerHTML =
      '<article class="post-detail fade-in">' +
      '<a href="#/" class="post-back">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="19" y1="12" x2="5" y2="12"></line>' +
      '<polyline points="12 19 5 12 12 5"></polyline>' +
      "</svg>" +
      "返回文章列表" +
      "</a>" +
      '<header class="post-header">' +
      '<h1 class="post-title">' + escapeHtml(post.title) + "</h1>" +
      '<div class="post-meta">' +
      '<span class="post-card-date">' + formatDate(post.date) + "</span>" +
      '<span class="post-meta-dot"></span>' +
      '<span class="post-card-category">' + escapeHtml(post.category) + "</span>" +
      '<span class="post-meta-dot"></span>' +
      '<span class="post-meta-reading">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"></circle>' +
      '<polyline points="12 6 12 12 16 14"></polyline>' +
      "</svg>" +
      readingTime + " 分钟阅读" +
      "</span>" +
      "</div>" +
      '<div class="post-card-tags" style="margin-top:14px">' + tagsHtml + "</div>" +
      "</header>" +
      (post.category === "\u6e38\u620f" ? '<hr class="mc-grass-bar">' : "") +
      '<div class="markdown-body">' + htmlContent + "</div>" +
      "</article>";

    // 代码高亮
    if (typeof hljs !== "undefined") {
      app.querySelectorAll("pre code").forEach(function (block) {
        hljs.highlightElement(block);
      });
    }

    updateNavActive("");
    window.scrollTo(0, 0);
  }

  /** 导航页面 — 外部链接收藏 */
  function renderLinks() {
    var categories = [
      {
        title: "\u2b50 \u6211\u7684\u6536\u85cf",
        links: [
          { name: "\u54d4\u54e9\u54d4\u54e9", url: "https://www.bilibili.com", desc: "\u56fd\u5185\u77e5\u540d\u5f39\u5e55\u89c6\u9891\u7f51\u7ad9\uff0c\u5b66\u4e60\u4e0e\u5a31\u4e50\u7684\u5b9d\u85cf\u5e73\u53f0", icon: "&#127916;", badge: "" },
          { name: "\u5fc5\u5e94\u641c\u7d22", url: "https://www.bing.com", desc: "\u5fae\u8f6f\u65d7\u4e0b\u7684\u641c\u7d22\u5f15\u64ce\uff0c\u6bcf\u65e5\u7cbe\u9009\u7cbe\u7f8e\u58c1\u7eb8", icon: "&#128269;", badge: "" },
          { name: "GitHub", url: "https://github.com", desc: "\u5168\u7403\u6700\u5927\u7684\u4ee3\u7801\u6258\u7ba1\u5e73\u53f0\uff0c\u5f00\u53d1\u8005\u7684\u793e\u4ea4\u7f51\u7edc", icon: "&#128187;", badge: "" },
          { name: "\u7f16\u7a0b\u732b", url: "https://edu.codemao.cn", desc: "\u9752\u5c11\u5e74\u7f16\u7a0b\u6559\u80b2\u5e73\u53f0\uff0c\u8da3\u5473\u5b66\u4e60\u7f16\u7a0b\u77e5\u8bc6", icon: "&#128049;", badge: "" },
          { name: "Bible.txt", url: "https://alyxyumi.github.io/bible.txt", desc: "\u5723\u7ecf\u6587\u672c\u8d44\u6e90\uff0c\u5728\u7ebf\u9605\u8bfb\u5b8c\u6574\u5185\u5bb9", icon: "&#128214;", badge: "TXT", badgeClass: "text" },
          { name: "ChromeGPT \u5b89\u88c5\u7a0b\u5e8f", url: "https://alyxyumi.github.io/ChromeGPT_installer.exe", desc: "ChromeGPT \u6d4f\u89c8\u5668\u6269\u5c55\u5b89\u88c5\u5305\uff0c\u70b9\u51fb\u4e0b\u8f7d", icon: "&#128230;", badge: "EXE", badgeClass: "download" },
          { name: "GitHub Pages", url: "https://alyxyumi.github.io", desc: "\u6211\u7684\u4e2a\u4eba\u535a\u5ba2\u7f51\u7ad9\uff0c\u5c31\u662f\u4f60\u73b0\u5728\u770b\u7684\u8fd9\u4e2a", icon: "&#127748;", badge: "" }
        ]
      },
      {
        title: "\u23e9 Minecraft",
        links: [
          { name: "Minecraft \u5b98\u7f51", url: "https://www.minecraft.net", desc: "Minecraft \u5b98\u65b9\u7f51\u7ad9\uff0c\u6700\u65b0\u8d44\u8baf\u4e0e\u5546\u5e97", icon: "&#9962;", badge: "" },
          { name: "Minecraft Wiki", url: "https://minecraft.wiki", desc: "\u6700\u5168\u9762\u7684 MC \u767e\u79d1\uff0c\u542b\u7269\u54c1\u3001\u751f\u7269\u3001\u65b9\u5757\u7b49\u8be6\u7ec6\u6570\u636e", icon: "&#128218;", badge: "" },
          { name: "CurseForge", url: "https://www.curseforge.com/minecraft", desc: "\u6700\u5927\u7684 MC Mod \u4e0b\u8f7d\u5e73\u53f0", icon: "&#128230;", badge: "" },
          { name: "Modrinth", url: "https://modrinth.com", desc: "\u5f00\u6e90\u53cb\u597d\u7684 Mod \u5206\u53d1\u5e73\u53f0\uff0c\u901f\u5ea6\u5feb", icon: "&#128230;", badge: "" },
          { name: "PlanetMinecraft", url: "https://www.planetminecraft.com", desc: "\u793e\u533a\u521b\u4f5c\u5e73\u53f0\uff0c\u542b\u5730\u56fe\u3001\u76ae\u80a4\u3001\u5efa\u7b51\u4f5c\u54c1", icon: "&#127757;", badge: "" },
          { name: "MCreator", url: "https://mcreator.net", desc: "\u53ef\u89c6\u5316 Mod \u5236\u4f5c\u5de5\u5177\uff0c\u96f6\u57fa\u7840\u4e0a\u624b", icon: "&#128295;", badge: "" },
          { name: "Minecraft Forum", url: "https://www.minecraftforum.net", desc: "\u8001\u724c MC \u793e\u533a\u8bba\u575b\uff0c\u8ba8\u8bba\u4e30\u5bcc", icon: "&#128172;", badge: "" },
          { name: "PaperMC", url: "https://papermc.io", desc: "\u9ad8\u6027\u80fd\u670d\u52a1\u7aef\uff0c\u63d2\u4ef6\u751f\u6001\u4e30\u5bcc", icon: "&#128196;", badge: "" },
          { name: "FabricMC", url: "https://fabricmc.net", desc: "\u8f7b\u91cf\u7ea7 Mod \u52a0\u8f7d\u5668\uff0c\u66f4\u65b0\u5feb", icon: "&#129518;", badge: "" },
          { name: "MCBBS", url: "https://www.mcbbs.net", desc: "\u4e2d\u6587 Minecraft \u793e\u533a\uff0c\u8d44\u6e90\u4e30\u5bcc", icon: "&#127468;", badge: "" }
        ]
      }
    ];

    var sectionsHtml = categories
      .map(function (cat) {
        var isMc = cat.title.indexOf("Minecraft") !== -1;
        var cardClass = isMc ? "link-card mc-card" : "link-card";
        var iconClass = isMc ? "link-card-icon mc-icon" : "link-card-icon";
        var cardsHtml = cat.links
          .map(function (link) {
            var badgeHtml = link.badge
              ? '<span class="link-card-badge ' + (link.badgeClass || "") + '">' + escapeHtml(link.badge) + "</span>"
              : "";
            return (
              '<a class="' + cardClass + '" href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer">' +
              '<div class="' + iconClass + '">' + link.icon + "</div>" +
              '<div class="link-card-body">' +
              '<div class="link-card-name">' + escapeHtml(link.name) + badgeHtml + "</div>" +
              '<div class="link-card-desc">' + escapeHtml(link.desc) + "</div>" +
              '<div class="link-card-url">' + escapeHtml(link.url) + "</div>" +
              "</div>" +
              "</a>"
            );
          })
          .join("");

        var sectionClass = isMc ? "links-section mc-section fade-in" : "links-section fade-in";
        var titleClass = isMc ? "links-section-title pixel-title" : "links-section-title";
        return (
          '<section class="' + sectionClass + '">' +
          '<h2 class="' + titleClass + '">' + escapeHtml(cat.title) + "</h2>" +
          '<div class="links-grid">' + cardsHtml + "</div>" +
          "</section>"
        );
      })
      .join("");

    app.innerHTML =
      '<div class="links-page">' +
      '<div class="links-header fade-in">' +
      "<h1>\u7f51\u9875\u5bfc\u822a</h1>" +
      "<p>\u6211\u7684\u6536\u85cf\u4e0e Minecraft \u8d44\u6e90\u5bfc\u822a</p>" +
      "</div>" +
      sectionsHtml +
      "</div>";

    updateNavActive("/links");
    window.scrollTo(0, 0);
  }

  /** 关于页面 */
  function renderAbout() {
    var aboutContent = marked
      ? marked.parse(`
## 关于墨迹

**墨迹** 是一个个人博客，名字取自"墨"的书写之意——用文字留下痕迹。

## 关于我

一个热爱技术与设计的开发者，相信好的产品源于对细节的执着和对简洁的追求。

- 前端工程师，专注 Web 开发
- 设计爱好者，信奉"少即是多"
- 旅行爱好者，在路上寻找灵感
- 终身学习者，保持好奇心

## 技术栈

这个博客使用以下技术构建：

| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 样式与动画 |
| JavaScript | 交互逻辑 |
| Marked.js | Markdown 解析 |
| Highlight.js | 代码高亮 |

## 联系方式

- **邮箱**：q2q7y@outlook.com
- **GitHub**：[github.com/AlyxYumi](https://github.com/AlyxYumi)
- **GitHub Pages**：[alyxyumi.github.io](https://alyxyumi.github.io)

---

> 感谢你的关注。如果你喜欢这里的内容，欢迎常来看看。
`.trim())
      : "<pre>关于页面需要 Markdown 支持</pre>";

    app.innerHTML =
      '<div class="about-page fade-in">' +
      '<header class="about-header">' +
      '<div class="about-avatar">&#9999;</div>' +
      '<h1 class="about-title">关于</h1>' +
      '<p class="about-subtitle">用文字记录思考与生活</p>' +
      "</header>" +
      '<div class="markdown-body">' + aboutContent + "</div>" +
      "</div>";

    // 代码高亮
    if (typeof hljs !== "undefined") {
      app.querySelectorAll("pre code").forEach(function (block) {
        hljs.highlightElement(block);
      });
    }

    updateNavActive("/about");
    window.scrollTo(0, 0);
  }

  /** 404 页面 */
  function renderNotFound() {
    app.innerHTML =
      '<div class="empty-state fade-in">' +
      '<div class="empty-state-icon">&#128270;</div>' +
      "<p>页面不存在</p>" +
      '<p style="margin-top:12px"><a href="#/">返回首页</a></p>' +
      "</div>";
    updateNavActive("");
    window.scrollTo(0, 0);
  }

  /* ---------- 导航高亮 ---------- */
  function updateNavActive(route) {
    navLinks.forEach(function (link) {
      var linkRoute = link.getAttribute("data-route");
      if (linkRoute === route) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  /* ---------- 路由 ---------- */
  function router() {
    var hash = window.location.hash.slice(1) || "/";
    var parts = hash.split("/").filter(Boolean); // ["post", "xxx"] or ["about"]

    if (parts.length === 0) {
      renderHome();
    } else if (parts[0] === "post" && parts[1]) {
      renderPost(parts[1]);
    } else if (parts[0] === "links") {
      renderLinks();
    } else if (parts[0] === "about") {
      renderAbout();
    } else {
      renderNotFound();
    }

    // 重置阅读进度
    if (parts[0] !== "post") {
      readingProgress.style.width = "0%";
    }
  }

  /* ---------- 主题切换 ---------- */
  function initTheme() {
    var savedTheme = localStorage.getItem("blog-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = savedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("blog-theme", next);
  }

  /* ---------- 阅读进度 ---------- */
  function updateReadingProgress() {
    var postDetail = app.querySelector(".post-detail");
    if (!postDetail) {
      readingProgress.style.width = "0%";
      return;
    }

    var articleHeight = postDetail.offsetHeight;
    var scrollTop = window.scrollY;
    var windowHeight = window.innerHeight;
    var scrollableHeight = articleHeight - windowHeight + 200; // 补偿 header offset

    if (scrollableHeight <= 0) {
      readingProgress.style.width = "100%";
      return;
    }

    var progress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
    readingProgress.style.width = progress + "%";
  }

  /* ---------- 回到顶部 ---------- */
  function handleScroll() {
    if (window.scrollY > 400) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
    updateReadingProgress();
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    // 路由
    window.addEventListener("hashchange", router);

    // 主题切换
    themeToggle.addEventListener("click", toggleTheme);

    // 滚动
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 回到顶部
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    initTheme();
    bindEvents();
    router();
  }

  // DOM 就绪后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
