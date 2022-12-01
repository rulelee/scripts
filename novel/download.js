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
 * 注册事件
 */
document.addEventListener("downloadNovel", async (e) => {

  // 选择器
  const selectors = Object(e.detail);

  const novel = {
    name: "",
    chapters: [],
  }

  // 小说名称
  novel.name = document.querySelector(selectors.name)?.innerText || "未命名";

  const chapterElms = await (async () => {
    const sections = [...document.querySelectorAll(selectors.chapterSections)];
    if (!sections.length) {
      return [...document.querySelectorAll(selectors.chapters)];
    }
    return Promise.all(sections.map((elm) => {
      return fetch(elm.value).then(r => r.text()).then(text => {
        const dom = new DOMParser().parseFromString(text, "text/html");
        return [...dom.querySelectorAll(selectors.chapters)];
      });
    }));
  })();

  // 章节列表
  novel.chapters = chapterElms.flat().map(elm => {
    return {
      title: elm.text,
      url: elm.href,
      raw: "",
    }
  });

  console.log(">>>", novel.chapters);

  // 加载下一章
  await (async function loadNext(index = 0) {
    const progress = `[${index + 1}/${novel.chapters.length}]`;
    try {
      const chapter = novel.chapters[index];
      if (chapter) {
        const blob = await fetch(chapter.url).then(r => r.blob());
        chapter.raw = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.addEventListener("load", (e) => resolve(e.target.result));
          reader.readAsText(blob, document.characterSet);
        });
      }
      console.log(progress);
      // 继续下一章
      const nextIndex = index + 1;
      nextIndex in novel.chapters && await loadNext(nextIndex);
    } catch (error) {
      console.error(progress, "下载失败...");
      await loadNext(index);
    }
  })();

  // 小说内容
  const novelContent = novel.chapters.map((chapter) => {
    const dom = new DOMParser().parseFromString(chapter.raw, "text/html");
    const contentElm = dom.querySelector(selectors.content);
    if (contentElm) {
      // 清除内容被排除的元素
      if (selectors.excludeContent) {
        for (const elm of contentElm.querySelectorAll(selectors.excludeContent)) elm.remove?.();
      }
      return [chapter.title].concat(contentElm.innerText.trim().split(/[\s\n]{2,}/)).join(`\n\n  `);
    }
    return "章节内容为空";
  }).join("\n\n\n\n");

  // 保存小说
  saveAs(new Blob([novelContent], { type: `text/plain` }), novel.name);

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
