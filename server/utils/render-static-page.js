
module.exports = function renderStaticPage(page, locals) {
  return function(req, res) {
    res.render(page, locals);
  };
};
