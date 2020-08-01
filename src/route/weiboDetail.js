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
        const avatar = $_topic('.avator img', element).attr('src');
        const nickname = $_topic(
          'p[node-type=feed_list_content]',
          element
        ).attr('nick-name');
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
        const mid = $_topic(element).attr('mid');
        imageSource.each((_imageIdx, imageEl) => {
          const imgEl = $_topic('img', imageEl);
          const actionData = imgEl
            .attr('action-data')
            .split('&')
            .reduce((acc, curr) => {
              const [key, value] = curr.split('=');
              acc[key] = value;
              return acc;
            }, {});
          const { uid, pic_id: pid } = actionData;
          const thumbSrc = imgEl.attr('src');
          const originSrc =
            uid && mid && pid
              ? `https://photo.weibo.com/${uid}/wbphotos/large/mid/${mid}/pid/${pid}?Refer=weibofeedv5`
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
        feedContent.push({
          userInfo: { avatar, nickname },
          content,
          images,
          video,
        });
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
