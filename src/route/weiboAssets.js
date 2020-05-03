const request = require('request');

module.exports = async (req, res) => {
  try {
    const { src, referer } = req.query;
    const options = {
      url: src.startsWith('//') ? `http:${src}` : src,
      headers: {
        Referer: encodeURI(referer),
      },
    };
    req.pipe(request(options)).pipe(res);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
