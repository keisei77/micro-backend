const cheerio = require('cheerio');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const link = req.query.link.replace(/#/g, '%23') || '';
  console.log(link);
  const topicInfo = {};
  try {
    if (link) {
      const topic = await fetch(link).then((res) => res.text());

      const $_topic = cheerio.load(topic);

      const feedList = $_topic('#pl_feedlist_index .card-wrap');

      // 导语 有可能为空
      const lead = feedList.find('.card-topic-lead p').text();

      const feedItems = feedList.filter(
        (_index, element) =>
          $_topic(element).attr('action-type') === 'feed_list_item'
      );

      const feedContent = [];
      feedItems.each((_index, element) => {
        const content =
          $_topic('p[node-type=feed_list_content_full]', element)
            .text()
            .trim()
            .slice(0, -6) ||
          $_topic('p[node-type=feed_list_content]', element).text().trim();
        const images = [];
        const imageSource = $_topic(
          'div[node-type=feed_list_media_prev] li',
          element
        );
        imageSource.each((_imageIdx, imageEl) => {
          const imgEl = $_topic('img', imageEl);
          const thumbSrc = imgEl.attr('src');
          const thumbSrcFragment = thumbSrc.split('/');
          const originSrc =
            thumbSrcFragment.length === 5
              ? thumbSrcFragment
                  .slice(0, 3)
                  .concat('bmiddle')
                  .concat(thumbSrcFragment.slice(4))
                  .join('/')
              : thumbSrc;
          images.push({ thumbSrc, originSrc });
        });
        let video = '';
        try {
          const videoSource = $_topic('a[node-type=fl_h5_video]', element);
          const videoData = videoSource.attr('action-data');
          video = videoData
            ? videoData
                .split('&')
                .find((_) => _.startsWith('video_src'))
                .slice('video_src'.length + 1)
            : '';
        } catch (err) {}
        feedContent.push({ content, images, video });
      });
      topicInfo['lead'] = lead;
      topicInfo['feedContent'] = feedContent;
    }

    res.json(topicInfo);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
