require.config({
    paths: {
        'd3': './../bower_components/d3/d3',
        'jquery': './../bower_components/jquery/dist/jquery.min'
    }
});

require(['./chart', './data'], function (chart, data) {
    chart.create('#chart', data.usd['1 month'], {
        width: '100%',
        height: 265
    });
});
