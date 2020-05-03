const fs = require('fs');

module.exports = function writeToFile(filename, content) {
  // write to a new file named filename
  fs.writeFile(filename, content, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('content saved!');
  });
};
