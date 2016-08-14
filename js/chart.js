define(['d3', 'jquery'], function (d3, $) {
    return {
        created: false,
        cachedInitialHeight: undefined,
        selector: undefined,
        settings: undefined,
        timers: undefined,
        data: undefined,
        container: undefined,
        svg: undefined,
        mainSvgGroup: undefined,
        width: undefined,
        height: undefined,
        vizWidth: undefined,
        vizHeight: undefined,
        vizVerticalPadding: 30,
        vizHorizontalPadding: 35,
        yScale: undefined,
        xScale: undefined,
        xAxis: undefined,
        yAxis: undefined,
        dateParser: undefined,
        currentDataXDomain: undefined,
        currentDataYDomain: undefined,
        currencyColors: ['#FF784E', '#9BCC63', '#2CB7F6'],
        currencyRates: {
            'ask': undefined,
            'mar': undefined,
            'bid': undefined
        },
        pointer: undefined,
        mouseoverTracker: undefined,
        collisionRange: 15,
        allDataPoints: undefined,
        allDataPointsCoordinates: undefined,
        mainSvgGroupDimensions: undefined,
        appendSvg: function () {
            this.svg = this.container.append('svg');
        },
        initSvgAttrs: function () {
            var width = undefined,
                height = undefined;

            if (this.settings) {
                width = this.settings.width;
                height = this.settings.height;
            }

            this.width = width || 640;
            this.height = height || 480;

            this.svg.attr({
                width: this.width,
                height: this.height
            });

            if (width && ~width.toString().indexOf('%')) {
                var svgWidth = this.svg.style('width');
                this.width = window.parseInt(svgWidth);
            }
        },
        initDateParser: function () {
            this.dateParser = d3.time.format('%Y-%m-%d');
        },
        initXScale: function () {
            this.xScale = d3.time.scale().range([0, this.vizWidth]);
            this.xScale.domain(this.currentDataXDomain);
        },
        initYScale: function () {
            var settings = this.settings;

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
        removeDataPoints: function () {
            d3.selectAll('.data-point').remove();
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
                    'display': 'none',
                    'class': 'data-point data-point--' + currencyIndex,
                    'transform': genereateTransformValue
                })
                .append('circle')
                .attr({
                    'r': 3,
                    'fill': renderColor
                });

            this.allDataPoints = d3.selectAll('g.data-point');
        },
        /*removeConnectLines: function (curencyIndex) {
         d3.selectAll('.connect-line').remove();
         },*/
        removeConnectPaths: function (curencyIndex) {
            d3.selectAll('.connect-path').remove();
        },
        renderConnectPathLine: function (currencyData, renderColor, currencyIndex) {
            var className = 'connect-path connect-path--' + currencyIndex;/*,
             currentPath = undefined;*/

            this.mainSvgGroup.append('path')
                .datum(currencyData)
                .attr({
                    'fill': 'transparent',
                    'stroke': renderColor,
                    'stroke-width': 3,
                    'class': className,
                    'd': this.pathDAttribute
                });
        },
        handlePathsDrawAnimation: function () {
            var pathLengths = [];

            document.querySelectorAll('path.connect-path').forEach(function (item, index, array) {
                pathLengths.push( window.parseInt(item.getTotalLength()) );
            });

            pathLengths.forEach(function (item, index, array) {
                var path = d3.select('path.connect-path--' + index);
                path.attr({
                    'stroke-dasharray': pathLengths[index],
                    'stroke-dashoffset': pathLengths[index]
                });
            });
        },
        /*renderConnectLines: function (currencyData, renderColor, currencyIndex) {
         this.mainSvgGroup.selectAll('line.connect-line--' + currencyIndex)
         .data(currencyData)
         .enter()
         .append('line')
         .attr({
         'class': 'connect-line connect-line--' + currencyIndex,
         'stroke': renderColor,
         'stroke-width': 3,
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
         },*/
        resetAxis: function () {
            d3.selectAll('.x-axis, .y-axis').remove();
            this.xAxis = undefined;
            this.yAxis = undefined;
            this.initAxis();
        },
        initAxis: function () {
            var transform = ['translate(0, ', this.vizHeight, ')'].join('');

            this.xAxis = d3.svg.axis().scale(this.xScale)
                .orient('bottom')
                .tickFormat(function (d) {
                    var month = d.getMonth() + 1,
                        date = d.getDate();
                    return [date > 9 ? date : '0' + date, '.', month > 9 ? month : '0' + month].join('');
                })
                .ticks(8);
            this.yAxis = d3.svg.axis().scale(this.yScale)
                .orient('left')
                .innerTickSize(-this.vizWidth)
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
        initWindowResizeEvents: function () {
            var timers = this.timers || [];
            $(window).on('resize', (function (e) {
                var timeoutPromise = undefined;

                timers.forEach(function (item, index, array) {
                    window.clearTimeout(item);
                });

                timeoutPromise = window.setTimeout((function () {
                    this.hardReset();
                }).bind(this), 1000);

                timers.push(timeoutPromise);
            }).bind(this));
        },
        initUserInteractionEvents: function () {
            var mouseCoordinates = [],
                self = this,
                mouseoverTracker = this.mouseoverTracker;

            mouseoverTracker.on('mousemove', null);

            mouseoverTracker.on('mousemove', function () {
                d3.event.stopPropagation();

                mouseCoordinates = d3.mouse(this);
                var x = mouseCoordinates[0],
                    y = mouseCoordinates[1];

                if (!self.pointer) {
                    self.appendPointerLine();
                }

                self.pointer.attr({
                    'x1': x,
                    'x2': x
                });

                self.allDataPoints.attr('display', 'none');

                self.allDataPointsCoordinates.forEach(function (item, index, array) {
                    var itemXPosition = window.parseFloat(item.coordinates[0]);

                    if ( (x >= itemXPosition - self.collisionRange) && (x <= itemXPosition + self.collisionRange) ) {
                        var itemNode = item.node,
                            itemNodeData = itemNode.__data__;

                        self.currencyRates[itemNodeData.type] = itemNodeData.value;
                        d3.select(itemNode).attr('display', null);
                    }
                });
            });
        },
        appendPointerLine: function () {
            this.pointer = this.mainSvgGroup.append('line')
                .attr({
                    'class': 'pointer',
                    'y1': 0,
                    'y2': this.vizHeight,
                    'stroke': '#c1c1c1',
                    'stroke-width': 1
                });
        },
        initAllDataPointsCoordinates: function () {
            this.allDataPointsCoordinates = d3.selectAll('g.data-point')[0].map(function (item, index, array) {
                return {
                    node: item,
                    coordinates: item.getAttribute('transform').replace('translate(', '').replace(')', '').split(',')
                };
            });
        },
        calculateMainSvgGroupSize: function () {
            this.mainSvgGroupDimensions = this.mainSvgGroup.node().getBBox();
        },
        removeInvisibleRect: function () {
            d3.selectAll('.mouseover-tracker').remove();
            this.mouseoverTracker = undefined;
        },
        placeInvisibleRectToMainGroup: function () {
            this.mouseoverTracker = this.mainSvgGroup.append('rect')
                .attr({
                    'class': 'mouseover-tracker',
                    'width': this.mainSvgGroupDimensions.width,
                    'height': this.mainSvgGroupDimensions.height,
                    'fill': 'transparent'
                });
        },
        update: function (data, collisionRange) {
            this.data = data;
            if (collisionRange || (collisionRange === 0)) {
                this.collisionRange = collisionRange;
            }
            this.initCurrentDataMaxAndMinValues();
            this.yScale.domain(this.currentDataYDomain);
            this.xScale.domain(this.currentDataXDomain);
            this.resetAxis();
            this.removeDataPoints();
            this.removeConnectPaths();
            // this.removeConnectLines();
            this.data.forEach((function (item, index, array) {
                this.renderDataPoints(item, this.currencyColors[index], index);
                this.renderConnectPathLine(item, this.currencyColors[index], index);
                // this.renderConnectLines(item, this.currencyColors[index], index);
            }).bind(this));
            this.initAllDataPointsCoordinates();
            this.removeInvisibleRect();
            this.placeInvisibleRectToMainGroup();
            this.initUserInteractionEvents();
            this.handlePathsDrawAnimation();
        },
        initPathDAttribute: function () {
            this.pathDAttribute = d3.svg.line()
                .x((function (d) { return this.xScale( this.dateParser.parse(d.date) ) }).bind(this))
                .y((function (d) { return this.yScale(d.value ) }).bind(this))
        },
        setInitalHeight: function (settings) {
            if (settings.height !== 150) {
                this.cachedInitialHeight = settings.height;
            }

            if (settings.height && $(window).width() < 400) {
                settings.height = 150;
            } else if ($(window).width() > 400) {
                settings.height = this.cachedInitialHeight;
            }
        },
        hardReset: function () {
            this.svg.remove();
            this.created = false;
            this.create(this.selector, this.data, this.settings);
        },
        create: function (selector, data, settings) {
            this.setInitalHeight(settings);
            this.selector = selector;
            this.settings = settings;
            this.container = d3.select(this.selector);
            this.data = data;
            this.appendSvg();
            this.initSvgAttrs();
            this.appendMainSvgGroup();
            this.initDateParser();
            this.initYScale();
            this.initXScale();
            this.initAxis();
            this.initPathDAttribute();
            this.data.forEach((function (item, index, array) {
                this.renderDataPoints(item, this.currencyColors[index], index);
                this.renderConnectPathLine(item, this.currencyColors[index], index);
                // this.renderConnectLines(item, this.currencyColors[index], index);
            }).bind(this));
            this.initAllDataPointsCoordinates();
            this.calculateMainSvgGroupSize();
            this.placeInvisibleRectToMainGroup();
            this.initUserInteractionEvents();
            this.initWindowResizeEvents();
            this.created = true;
            this.handlePathsDrawAnimation();
        }
    }
});