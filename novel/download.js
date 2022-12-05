/**
 * 另存为
 * ---
 * @param {string | Blob | File | MediaSource} target 目标对象
 * @param {string} fileName 文件名
 */
function saveAs(target, fileName) {
  // 创建链接元素
  const link = document.createElement("a");
  // 设置文件名称
  link.download = target instanceof File && target.name || fileName || "";
  // 创建或设置对象路径
  link.href = typeof target === "string" ? target : URL.createObjectURL(target);
  // 打开保存对话框
  link.click();
  // 销毁对象路径
  /^blob:/.test(link.href) && URL.revokeObjectURL(link.href);
}

/**
 * 获取DOM对象
 * ---
 * @param {string} url 页面网址
 * @returns {Promise<Document | Element>} 通过Promise返回DOM对象
 */
function getDOM(url) {
  return new Promise((resolve, reject) => {
    fetch(url).then(r => r.blob()).then((blob) => {
      const reader = new FileReader();
      reader.addEventListener("load", (e) => {
        resolve(new DOMParser().parseFromString(e.target.result, "text/html"));
      });
      reader.addEventListener("error", reject);
      reader.readAsText(blob, document.characterSet);
    }).catch(reject);
  });
}

/**
 * 获取章节列表
 * ---
 * @param {string} chapterSelector 章节选择器
 * @param {string} pagingSelector 分页选择器
 * @returns {Array<{
 *  title: string, // 章节标题
 *  url: string,   // 章节网址
 * }>} 通过Promise返回章节列表
 */
async function getChapters(chapterSelector, pagingSelector) {
  let chapterElms = [];

  if (pagingSelector) {
    const sections = await Promise.all([...document.querySelectorAll(pagingSelector)].map((elm) => {
      return getDOM(elm.value).then((dom) => [...dom.querySelectorAll(chapterSelector)]);
    }));
    chapterElms = sections.flat();
  } else {
    chapterElms = [...document.querySelectorAll(selectors.chapters)];
  }

  chapterElms.map(elm => {
    return {
      title: elm.text,
      url: elm.href
    }
  });
}

/**
 * 获取章节
 * ---
 * @param {string} url 章节网址
 * @param {string} titleSelector 标题选择器
 * @param {string} contentSelector 内容选择器
 * @param {string} nextSelector 下一页选择器
 * @returns {{
 *  title: string,           // 章节标题
 *  nextUrl: string,         // 下一页网址
 *  contentElement: Element, // 内容元素
 * }}
 */
function getChapter(url, titleSelector, contentSelector, nextSelector) {
  return getDOM(url).then((dom) => {
    return {
      url,
      title: dom.querySelector(titleSelector)?.innerText,
      nextUrl: dom.querySelector(nextSelector)?.href,
      contentElement: dom.querySelector(contentSelector),
    };
  });
}

/**
 * 注册下载事件
 * ---
 */
document.addEventListener("downloadNovel", async (e) => {

  // 选择器
  const selectors = Object(e.detail);

  // 小说
  const novel = {
    // 名称
    name: document.querySelector(selectors.name)?.innerText || "未命名",
    // 章节列表
    chapters: [],
  }

  // 章节列表
  const chapters = await getChapters(selectors.chapters, selectors.paging);

  // 加载下一章
  await (async function loadNext(url = chapters[0].url) {
    try {
      const chapter = await getChapter(url, selectors.chapterTitle, selectors.chapterContent, selectors.nextChapter);
      if (chapter.contentElement) {
        // 清除内容被排除的元素
        if (selectors.excludeContent) {
          for (const elm of chapter.contentElement.querySelectorAll(selectors.excludeContent)) elm.remove?.();
        }
        novel.chapters.push([chapter.title].concat(chapter.contentElement.innerText.trim().split(/[\s\n]{2,}/)).join(`\n\n  `));
      } else {
        novel.chapters.push("章节内容为空");
      }
      console.log(`[${chapter.title}]`);
      // 继续下一章
      chapter.nextUrl !== location.href && await loadNext(chapter.nextUrl);
    } catch (error) {
      console.error("下载失败...");
      await loadNext(url);
    }
  })();

  // 保存小说
  saveAs(new Blob([novel.chapters.join("\n\n\n\n")], { type: `text/plain` }), novel.name);

});

// (() => {
//   document.dispatchEvent(new CustomEvent("downloadNovel", {
//     detail: {
//       name: "#info>h1",
//       chapters: "#list a",
//       content: "#content",
//       excludeContent: "div,script,a"
//     }
//   }))
// }
// )();
