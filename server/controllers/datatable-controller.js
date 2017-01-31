'use strict';

module.exports = {
  // Note: this is actually a factory, not a handler itself. the only parameter is the Model
  // the function doesn't quite classify as a middleware, so I picked making it a controller
  makeHandler: function(Model) {
    return function(req, res) {
      const columns = req.query.columns.reduce((c, col) => {
        c[col.data] = 1;
        return c;
      });

      const query = req.query.columns.reduce((q, col) => {
        q[col.data] = col.search.value;
        return q;
      }, {});

      const sorter = req.query.order.reduce((s, orderInfo) => {
        const col = req.query.columns[orderInfo.column];
        s[col.data] = orderInfo.dir.toLowerCase() === 'asc' ? 1 : -1;
        return s;
      }, {});

      const start = req.query.start;
      const length = req.query.length;

      const totalPromise = Model.count({});
      const filtered = Model.find(query).select(columns).sort(sorter).skip(start).limit(length);

      Promise.all([totalPromise, filtered]).then((results) => {
        const foundRecords = results[1];

        const ret = {
          draw: req.query.draw,
          recordsTotal: results[0],
          recordsFiltered: foundRecords.length,
          data: foundRecords
        };

        res.send(ret);
      }).catch((err) => {
        const ret = {
          draw: req.query.draw,
          error: err.message.toString()
        };
        res.status(err.status || 500);
        res.send(ret);
      });
    };
  }
};
