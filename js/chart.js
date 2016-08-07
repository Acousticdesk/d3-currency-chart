define(['d3'], function (d3) {
    return {
        data: undefined,
        container: undefined,
        svg: undefined,
        mainSvgGroup: undefined,
        width: undefined,
        height: undefined,
        vizWidth: undefined,
        vizHeight: undefined,
        vizVerticalPadding: 30,
        vizHorizontalPadding: 30,
        yScale: undefined,
        xScale: undefined,
        xAxis: undefined,
        yAxis: undefined,
        dateParser: undefined,
        currentDataXDomain: undefined,
        currentDataYDomain: undefined,
        currencyColors: ['red', 'green', 'blue'],
        appendSvg: function () {
            this.svg = this.container.append('svg');
        },
        initSvgAttrs: function (width, height) {
            this.width = width || 640;
            this.height = height || 480;

            this.svg.attr({
                width: this.width,
                height: this.height
            });
        },
        initDateParser: function () {
            this.dateParser = d3.time.format('%Y-%m-%d');
        },
        initXScale: function () {
            this.xScale = d3.time.scale().range([0, this.vizWidth]);
            this.xScale.domain(this.currentDataXDomain);
        },
        initYScale: function (settings) {
            this.yScale = d3.scale.linear().range([this.vizHeight, 0]);
            this.initCurrentDataMaxAndMinValues();
            this.setDataDomainPaddings(settings && settings.scalesMultiplier ? settings.scalesMultiplier : 1);
            this.yScale.domain(this.currentDataYDomain);
        },
        initCurrentDataMaxAndMinValues: function () {
            var data = this.data,
                allCurrenciesMaxValues = [],
                allCurrenciesMinValues = [],
                minYValue = undefined,
                maxYValue = undefined;

            //var allCurrenciesDomains = this.data.map(function (item) {
            //    return d3.extent(item, function (current) { return current.value });
            //});

            /*this.currentDataYDomain = d3.extent(data, function (item) {
             return item.value;
             });*/

            allCurrenciesMaxValues = data.map(function (item) {
                return d3.max(item, function (current) { return current.value });
            });
            allCurrenciesMinValues = data.map(function (item) {
                return d3.min(item, function (current) { return current.value });
            });

            maxYValue = allCurrenciesMaxValues.sort().reverse()[0];
            minYValue = allCurrenciesMinValues.sort()[0];

            this.currentDataYDomain = [minYValue, maxYValue];
            //TODO: Gets only first element of data and builds chart with it's dates. Needs to be refactored.
            this.currentDataXDomain = d3.extent(data[0], (function (item) {
                return this.dateParser.parse(item.date);
            }).bind(this));
        },
        setDataDomainPaddings: function (multiplier) {
            this.currentDataYDomain[0] = this.currentDataYDomain[0] / (multiplier || 1);
            this.currentDataYDomain[1] = this.currentDataYDomain[1] * (multiplier || 1);
        },
        appendMainSvgGroup: function () {
            this.vizWidth = this.width - this.vizHorizontalPadding;
            this.vizHeight = this.height - this.vizVerticalPadding;

            this.mainSvgGroup = this.svg.append('g')
                .attr({
                    'class': 'main-group',
                    'transform': ['translate(',this.vizHorizontalPadding, ', 0)'].join('')
                });
        },
        renderDataPoints: function (currencyData, renderColor, currencyIndex) {
            var genereateTransformValue = (function (d) {
                var xTranslate = this.xScale( this.dateParser.parse(d.date) ),
                    yTranslate = this.yScale(d.value),
                    translate = [xTranslate, ',', yTranslate].join('');

                return ['translate(', translate, ')'].join('');
            }).bind(this);

            this.mainSvgGroup.selectAll('g.data-point--' + currencyIndex)
                .data(currencyData)
                .enter()
                .append('g')
                .attr({
                    'class': 'data-point--' + currencyIndex,
                    'transform': genereateTransformValue
                })
                .append('circle')
                .attr({
                    'r': 10,
                    'fill': renderColor
                });
        },
        renderConnectLines: function (currencyData, renderColor, currencyIndex) {
            this.mainSvgGroup.selectAll('line.connect-line--' + currencyIndex)
                .data(currencyData)
                .enter()
                .append('line')
                .attr({
                    'class': 'connect-line--' + currencyIndex,
                    'stroke': renderColor,
                    'stroke-width': 2,
                    'x1': (function (d, i) {
                        if (i !== currencyData.length - 1) {
                            return this.xScale( this.dateParser.parse(d.date) );
                        }
                        return null;
                    }).bind(this),
                    'x2': (function (d, i) {
                        if (i !== currencyData.length - 1) {
                            var nextItem = currencyData[i + 1];
                            return this.xScale( this.dateParser.parse( nextItem.date ) );
                        }
                        return null;
                    }).bind(this),
                    'y1': (function (d, i) {
                        if (i !== currencyData.length - 1) {
                            return this.yScale(d.value);
                        }
                        return null;
                    }).bind(this),
                    'y2': (function (d, i) {
                        if (i !== currencyData.length - 1) {
                            var nextItem = currencyData[i + 1];
                            return this.yScale(nextItem.value);
                        }
                        return null;
                    }).bind(this)
                })
        },
        initAxis: function () {
            var transform = ['translate(0, ', this.vizHeight, ')'].join('');

            this.xAxis = d3.svg.axis().scale(this.xScale)
                .orient('bottom')
                .ticks(8);
            this.yAxis = d3.svg.axis().scale(this.yScale)
                .orient('left')
                .ticks(10);
            this.mainSvgGroup.append('g')
                .attr({
                    'class': 'x-axis',
                    'transform': transform
                })
                .call(this.xAxis);
            this.mainSvgGroup.append('g')
                .attr('class', 'y-axis')
                .call(this.yAxis);
        },
        create: function (selector, data, settings) {
            this.container = d3.select(selector);
            this.data = data;
            this.appendSvg();
            this.initSvgAttrs();
            this.appendMainSvgGroup();
            this.initDateParser();
            this.initYScale(settings);
            this.initXScale();
            this.initAxis();
            this.data.forEach((function (item, index, array) {
                this.renderDataPoints(item, this.currencyColors[index], index);
                this.renderConnectLines(item, this.currencyColors[index], index);
            }).bind(this));
        }
    };
});