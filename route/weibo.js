const cheerio = require('cheerio');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.size ? Number(req.query.size) : 5;

  try {
    const topics = await fetch('https://s.weibo.com/top/summary/').then(res =>
      res.text()
    );

    const $ = cheerio.load(topics);

    const list = $('.data tbody tr');

    const topicsData = [];

    list.each((index, element) => {
      if (index + 1 > (page - 1) * pageSize && index < page * pageSize) {
        const node = $(element).find('a');
        const title = node.text();
        const relatedUrl = node.attr('href').startsWith('/weibo')
          ? node.attr('href')
          : '';
        const link = `https://s.weibo.com${relatedUrl}`;
        topicsData.push({ title, link });
      }
    });

    for (let index = 0; index < topicsData.length; index++) {
      if (topicsData[index].link) {
        const topic = await fetch(topicsData[index].link).then(res =>
          res.text()
        );

        const $_topic = cheerio.load(topic);

        const feedList = $_topic('#pl_feedlist_index .card-wrap');

        // 导语 有可能为空
        const lead = feedList.find('.card-topic-lead p').text();

        const feedItems = feedList.filter(
          (_index, element) =>
            $(element).attr('action-type') === 'feed_list_item'
        );

        const feedContent = [];
        feedItems.each((_index, element) => {
          const content =
            $('p[node-type=feed_list_content_full]', element)
              .text()
              .trim()
              .slice(0, -6) ||
            $('p[node-type=feed_list_content]', element)
              .text()
              .trim();
          feedContent.push(content);
        });
        topicsData[index]['lead'] = lead;
        topicsData[index]['feedContent'] = feedContent;
      }
    }

    res.json(topicsData);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};
