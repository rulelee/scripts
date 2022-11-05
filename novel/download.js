

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

document.addEventListener("downloadNovel", (e) => {

  // 选择器
  const selectors = Object(e.detail);

  // 小说名称
  const name = document.querySelector(selectors.name)?.innerText || "未命名";

  // 章节列表
  const chapters = [...document.querySelectorAll(selectors.chapters)].map(elm => {
    return {
      title: elm.text,
      url: elm.href,
    }
  });

  // 加载下一章
  async function loadNext(index = 0) {
    const chapter = chapters[index];

    if (chapter) {
      chapter.raw = await fetch(chapter.url).then(r => r.text());
    }

    // 继续下一章
    const nextIndex = index + 1;
    nextIndex in chapters && loadNext(nextIndex);
  }

  loadNext();

  // 小说内容
  const novelContent = chapters.map((chapter) => {
    const dom = new DOMParser().parseFromString(chapter.raw);
    const content = dom.querySelector(selectors.content)?.innerText.trim() || "";
    return content.split(/[\s\n]{2,}/).join(`\n\n  `);
  }).join("\n\n");

  // 保存小说
  saveAs(new Blob([novelContent], { type: "text/plain" }), name);

});