const cheerio = require('cheerio');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.size ? Number(req.query.size) : null;

  try {
    const topics = await fetch('https://s.weibo.com/top/summary/').then(res =>
      res.text()
    );

    const $ = cheerio.load(topics);

    const list = $('.data tbody tr');

    const topicsData = [];

    list.each((index, element) => {
      const topicData = () => {
        const node = $(element).find('a');
        const title = node.text();
        const relatedUrl = node.attr('href').startsWith('/weibo')
          ? node.attr('href')
          : '';
        const link = `https://s.weibo.com${relatedUrl}`;
        topicsData.push({ title, link });
      };
      if (!pageSize) {
        topicData();
      } else if (index + 1 > (page - 1) * pageSize && index < page * pageSize) {
        topicData();
      }
    });
    res.json(topicsData);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};
