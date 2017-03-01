'use strict';

module.exports = {
  // Note: this is actually a factory, not a handler itself. the only parameter is the Model
  // the function doesn't quite classify as a middleware, so I picked making it a controller
  makeHandler: function(Model) {
    return function(req, res) {
      // why does this end up becoming one col of data? so weird
      const selects = req.query.columns.reduce((c, col) => {
        c[col.data] = 1;
        return c;
      }, {});

      const query = req.query.columns.reduce((q, col) => {
        if (col.search.value && col.search.value.length) {
          q[col.data] = new RegExp(col.search.value, 'i');
        }
        return q;
      }, {});

      const sorter = req.query.order.reduce((s, orderInfo) => {
        const col = req.query.columns[orderInfo.column];
        s[col.data] = orderInfo.dir.toLowerCase() === 'asc' ? 1 : -1;
        return s;
      }, {});

      const start = parseInt(req.query.start, 10) || 0;
      const length = parseInt(req.query.length, 10);

      const totalPromise = Model.count({});
      const filtered = Model.find(query).select(selects).sort(sorter).skip(start).limit(length).lean();

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
