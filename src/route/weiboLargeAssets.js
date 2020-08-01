const request = require('request');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { src } = req.query;
    const topic = await fetch(src).then((res) => res.text());
    const $_topic = cheerio.load(topic);
    const imgSrc = $_topic('img').attr('src');
    // const options = {
    //   url: src.startsWith('//') ? `http:${src}` : src,
    //   headers: {
    //     Referer: encodeURI(referer),
    //   },
    // };
    console.log(topic);
    res.json({ imgSrc });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
