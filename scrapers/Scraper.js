exports.initialize = async (page, link) => {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setRequestInterception(true);
    blockImages(page);
    await page.goto(link);
}

exports.linkNavigate = async (page, selector) => {
    return Promise.all([
        page.click(selector),
        page.waitForNavigation({waitUntil: 'networkidle2'})
    ]);
}

function blockImages(page) {
    page.on('request', req => {
        if (req.resourceType() === 'image')
          req.abort();
        else
          req.continue();
      });
}

