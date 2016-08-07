require.config({
    paths: {
        'd3': './../bower_components/d3/d3'
    }
});

require(['./chart', './data'], function (chart, data) {
    chart.create('#chart', data);
});
