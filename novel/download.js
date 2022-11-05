
async function downloadNovel() {

  const selectors = {
    name: ".info>.h2",
    chapters: ".listmain dd+dt~dd a",
    content: "#content"
  };

  // 小说名称
  const name = document.querySelector(selectors.name)?.innerText || "未命名";

  // 章节列表
  const chapters = [...document.querySelectorAll(selectors.chapters)].map(elm => {
    return {
      title: elm.text,
      url: elm.href,
    }
  });

  async function next(index = 0) {
    const chapter = chapters[index];

    if (chapter) {
      chapter.raw = await fetch(chapter.url).then(r => r.text());
    }

    // 继续下一章
    const nextIndex = index + 1;
    nextIndex in chapters && next(nextIndex);
  }

  next();

  console.log(">>>>>>>>>>>>>>>>>>>>> 小说下载", chapters);

}