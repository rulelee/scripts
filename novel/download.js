window.addEventListener("load", async () => {

  const selectors = {
    chapters: ".listmain dd+dt~dd a"
  };

  // 章节列表
  const chapters = [...document.querySelectorAll(selectors.chapters)].map(elm => {
    return {
      name: elm.text,
      url: elm.href,
    }
  });

  console.log(">>>>>>>>>>>>>>>>>>>>> 小说下载", chapters);

});