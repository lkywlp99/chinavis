(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.Neo4jd3 = f()
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {exports: {}};
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }

        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function (_dereq_, module, exports) {
            'use strict';

            var neo4jd3 = _dereq_('./scripts/neo4jd3');

            module.exports = neo4jd3;

        }, {"./scripts/neo4jd3": 2}], 2: [function (_dereq_, module, exports) {
            /* global d3, document */
            /* jshint latedef:nofunc */
            'use strict';

            function Neo4jD3(_selector, _options) {//创建 Neo4jD3 图形对象
                var container, graph, info, node, nodes, relationship, relationshipOutline, relationshipOverlay,
                    relationshipText, relationships, selector, simulation, svg, svgNodes, svgRelationships, svgScale,
                    svgTranslate,
                    classes2colors = {},//用于将节点类别映射到颜色。
                    justLoaded = false,//用于跟踪图形是否刚刚被加载。
                    numClasses = 0,// 定义一个计数器，用于跟踪类别数量。
                    options = {
                        arrowSize: 4,
                        colors: colors(),
                        highlight: undefined,
                        iconMap: fontAwesomeIcons(),
                        icons: undefined,
                        imageMap: {},
                        images: undefined,
                        infoPanel: true,
                        minCollision: undefined,
                        neo4jData: undefined,
                        neo4jDataUrl: undefined,
                        nodeOutlineFillColor: undefined,
                        colormap: [
                            "#efbc18",
                            "#1194a6",
                            "#3cd27c",
                            "#d94904",
                            "#164a96",
                            "#d9a0a0",
                            "#9191e3",
                        ],
                        topicmap: [],
                        nodenumber: 0,
                        relationnumber: 0,
                        nodeRadius: 25,
                        relationshipColor: '#aabee3',
                        zoomFit: false
                    },
                    VERSION = '0.0.1';

                function appendGraph(container) {//创建 Neo4jD3 图形时动态创建SVG和组元素并添加到容器，以便可以将节点和关系添加到这些组元素中
                    svg = container.append('svg')
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .attr('class', 'neo4jd3-graph')//svg的类名
                        .call(d3.zoom().on('zoom', function () {// 启用缩放和平移功能，并在缩放或平移时更新 SVG 元素的位置和大小。
                            var scale = d3.event.transform.k,
                                translate = [d3.event.transform.x, d3.event.transform.y];

                            if (svgTranslate) {
                                translate[0] += svgTranslate[0];
                                translate[1] += svgTranslate[1];
                            }

                            if (svgScale) {
                                scale *= svgScale;
                            }

                            svg.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
                        }))
                        .on('dblclick.zoom', null)
                        .append('g')// 在 SVG 元素中添加一个新的组元素，并将其赋值给变量"svg"。
                        .attr('width', '100%')// 设置新的组元素的宽高度
                        .attr('height', '100%');

                    svgRelationships = svg.append('g')//在 SVG 组元素中添加一个新的组元素用于显示关系，并将其赋值给变量"svgRelationships"变量
                        .attr('class', 'relationships');

                    svgNodes = svg.append('g')//新的组元素用于显示节点，并将其赋值给变量"svgNodes"变量。
                        .attr('class', 'nodes');
                }

                function appendImageToNode(node) {//将图标或图像添加到节点上
                    return node.append('image')
                        .attr('height', function (d) {
                            return icon(d) ? '24px' : '30px';
                        })
                        .attr('x', function (d) {
                            return icon(d) ? '5px' : '-15px';
                        })
                        .attr('xlink:href', function (d) {
                            return image(d);
                        })
                        .attr('y', function (d) {
                            return icon(d) ? '5px' : '-16px';
                        })
                        .attr('width', function (d) {
                            return icon(d) ? '24px' : '30px';
                        });
                }

                function appendInfoPanel(container) {//创建div，添加 Neo4jD3 图形的信息面板
                    return container.append('div')
                        .attr('class', 'neo4jd3-info');//将"neo4jd3-info"类添加到 DIV 中，以便为其应用样式。
                }

                function appendInfoElement(cls, isNode, property, value) {//往信息面板中添加一个信息元素。用于显示节点或关系的详细信息
                    var elem = info.append('a');//在信息面板中添加一个锚

                    elem.attr('href', '#')// 将锚的 href 属性设置为"#"，以便不会发生任何跳转。
                        .attr('class', cls)//设置类名
                        .html('<strong>' + property + '</strong>' + (value ? (': ' + value) : ''));//设置锚元素的 HTML 内容，以便它显示传递的"property"和"value"参数。

                    if (!value) {//如果没有传递值
                        console.log("没有传递值,执行102行代码")
                        elem.style('background-color', function (d) {//设置锚元素的背景颜色，以便与节点或关系的类对应。
                            return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : (isNode ? class2color(property) : defaultColor());
                        })
                            .style('border-color', function (d) {// 设置锚元素的边框颜色，以便与节点或关系的类对应。
                                return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : (isNode ? class2darkenColor(property) : defaultDarkenColor());
                            })
                            .style('color', function (d) {//设置锚元素的文本颜色，以便与节点或关系的类对应。
                                return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : '#fff';
                            });
                    }
                }

                function appendInfoElementClass(cls, node) {//添加一个节点类别信息【人、狗】
                    appendInfoElement(cls, true, node);
                }

                function appendInfoElementProperty(cls, property, value) {//添加一个节点或关系的属性信息【年龄、相似度】
                    appendInfoElement(cls, false, property, value);
                }

                function appendInfoElementRelationship(cls, relationship) {//添加一个关系的信息【某个关系的类型和属性】
                    appendInfoElement(cls, false, relationship);
                }

                function appendNode() {
                    return node.enter()//创建一个新的节点
                        .append('g')
                        .attr('class', function (d) {//d是被创建的 当前节点的数据对象
                            var highlight, i,
                                classes = 'node',
                                label = d.labels[0];//取节点的第一个标签，因为可能有多个标签。

                            if (icon(d)) {
                                classes += ' node-icon';
                            }

                            if (image(d)) {
                                classes += ' node-image';
                            }

                            if (options.highlight) {//高亮节点
                                for (i = 0; i < options.highlight.length; i++) {
                                    highlight = options.highlight[i];//highlight 是一个对象，包含 class、property、value属性，分别用于指定高亮的节点类别和属性、属性值

                                    if (d.labels[0] === highlight.class && d.properties[highlight.property] === highlight.value) {
                                        classes += ' node-highlighted';
                                        break;
                                    }
                                }
                            }

                            return classes;
                        })

                        .on('click', function (d) {
                            console.log(d.id)
                        })
                        .on('dblclick', function (d) {
                            // stickNode(d);
                            //
                            // if (typeof options.onNodeDoubleClick === 'function') {
                            //     options.onNodeDoubleClick(d);
                            // }
                        })
                        .on('mouseenter', function (d) {
                            if (info) {
                                updateInfo(d);
                            }

                            if (typeof options.onNodeMouseEnter === 'function') {
                                options.onNodeMouseEnter(d);
                            }
                        })
                        .on('mouseleave', function (d) {
                            if (info) {
                                clearInfo(d);
                            }

                            if (typeof options.onNodeMouseLeave === 'function') {
                                options.onNodeMouseLeave(d);
                            }
                        })
                        .call(d3.drag()//为节点添加拖拽事件
                            .on('start', dragStarted)//开始拖拽时调用
                            .on('drag', dragged)//拖拽时调用
                            .on('end', dragEnded));//结束拖拽时调用
                }

                function appendNodeToGraph() {
                    var n = appendNode();//添加节点
                    n.each(function (d) {
                        appendOutlineToNode(d3.select(this), d);
                    });
                    appendRingToNode(n);//添加外环
                    // appendOutlineToNode(n);//添加圆

                    if (options.icons) {
                        appendTextToNode(n);
                    }

                    if (options.images) {
                        appendImageToNode(n);
                    }

                    return n;
                }

                // function appendOutlineToNode(node) {//添加圆圈
                //     return node.append('circle')
                //                .attr('class', 'outline')
                //                .attr('r', options.nodeRadius)
                //                .style('fill', function(d) {//填充色
                //                    return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
                //                })
                //                .style('stroke', function(d) {//边框色
                //                    return options.nodeOutlineFillColor ? class2darkenColor(options.nodeOutlineFillColor) : class2darkenColor(d.labels[0]);
                //                })
                //                .append('title').text(function(d) {
                //                    return toString(d);
                //                });
                // }
                // 获取图例容器元素


                function appendOutlineToNode(node) {
                    console.log(node.data()[0])
                    const g = node.append('g') // 创建一个<g>元素，用于容纳图表元素
                        .attr('class', 'outline');

                    var subcolor = options.colormap;
                    var bigcolor = [

                        '#05acac',
                        '#5e88c3',
                        '#65c098',
                        '#feb34d',
                        '#fc9373',
                        '#816bac',
                        '#f57a70',
                        '#fbf585',
                        '#f6efef',
                        '#92da89',
                        '#817373',


                    ];

//  const color = d3.scaleOrdinal(d3.schemeCategory10);

                    const pie = d3
                        .pie()
                        .sort(null)
                        .value(d => d.value);

                    const innerRadius = 0;
                    const outerRadius1 = 0.5 * options.nodeRadius;
                    const outerRadius2 = 1 * options.nodeRadius;

                    const arc1 = d3
                        .arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius1);

                    const arc2 = d3
                        .arc()
                        .innerRadius(outerRadius1 * 1.2)
                        .outerRadius(outerRadius2);
//子主题规定分为
                    //similarity是SubTopicSimilarity数组中的元素（相似度值），i是下标
                    const subtopicdata = node.data()[0].SubTopicSimilarity.map((similarity, i) => ({//map()方法对数组中的每个元素执行指定的操作，并返回一个新数组
                        value: similarity,
                        name: node.data()[0].SubTopicIndex[i]
                    }));
                    console.log(subtopicdata)
                    //
                    const bigtopicdata = node.data()[0].BigTopicSimilarity.map((similarity, i) => ({
                        value: similarity,
                        name: node.data()[0].BigTopicIndex[i]
                    }));
                    console.log(bigtopicdata)
                    const g1 = g.append('g');
                    const g2 = g.append('g');

                    g1.selectAll('path')
                        .data(pie(subtopicdata))
                        .enter()
                        .append('path')
                        .attr('d', arc1)
                        .attr('fill', d => subcolor[d.data.name])//node.data()[0].BigTopicIndex[i]下标对应的颜色
                        .attr('stroke', 'white')
                        .attr('stroke-width', 1);

                    g2.selectAll('path')
                        .data(pie(bigtopicdata))
                        .enter()
                        .append('path')
                        .attr('d', arc2)
                        .attr('fill', d => bigcolor[d.data.name])
                        .attr('stroke', 'white')
                        .attr('stroke-width', 1);
                    return g.append('title').text(function (d) {
                        return toString(d);
                    });
                }


                function appendRingToNode(node) {//添加节点外圈光环
                    return node.append('circle')
                        .attr('class', 'ring')
                        .attr('r', options.nodeRadius * 1.16)
                        .append('title').text(function (d) {
                            return toString(d);
                        });
                }

                function appendTextToNode(node) {//添加节点文字
                    // return node.append('text')
                    //            .attr('class', function(d) {
                    //                return 'text' + (icon(d) ? ' icon' : '');
                    //            })
                    //            .attr('fill', '#000000')
                    //            .attr('font-size', function(d) {//如果节点包含图标，返回节点半径 options.nodeRadius，否则返回 '8px'。
                    //                return icon(d) ? (options.nodeRadius + 'px') : '10px';
                    //            })
                    //            .attr('pointer-events', 'none')//元素不参与鼠标事件。
                    //            .attr('text-anchor', 'middle')//居中
                    //            .attr('y', function(d) {//垂直偏移量。
                    //                return icon(d) ? (parseInt(Math.round(options.nodeRadius * 0.32)) + 'px') : '4px';
                    //            })
                    //            .html(function(d) {//
                    //                var _icon = icon(d);
                    //                var len=d.labels[0].length;
                    //                console.log(d.labels);
                    //                if (len >= 4) {//长度大于5，将节点标签的前n个字符和省略号赋值给 s
                    //                    var s=d.labels[0].slice(0,4);
                    //                    return s+"...";
                    //                } else {
                    //                    return _icon ? '&#x' + _icon : d.labels;
                    //                }
                    //            });
                }

                function appendRandomDataToNode(d, maxNodesToGenerate) {///生成随机的D3数据到视图中
                    var data = randomD3Data(d, maxNodesToGenerate);//生成随机的D3数据
                    updateWithNeo4jData(data);//先将Neo4j数据转换为D3数据格式，再更新到视图中
                }

                function appendRelationship() {//添加关系到g中
                    return relationship.enter()
                        .append('g')
                        .attr('class', 'relationship')
                        .on('dblclick', function (d) {
                            if (typeof options.onRelationshipDoubleClick === 'function') {
                                options.onRelationshipDoubleClick(d);
                            }
                        })
                        .on('mouseenter', function (d) {
                            if (info) {
                                updateInfo(d);
                            }
                        });
                }

                function appendOutlineToRelationship(r) {//添加边
                    return r.append('path')//这里的路径元素用于绘制关系的边
                        .attr('class', 'outline')//边的类名

                        .attr('stroke', 'none');
                }

                function appendOverlayToRelationship(r) {// 扩大范围 用于捕获鼠标
                    return r.append('path')
                        .attr('class', 'overlay');
                }

                function appendTextToRelationship(r) {
                    return r.append('text')
                        .attr('class', 'text')
                        .attr('fill', '#000000')
                        .attr('font-size', '8px')
                        .attr('pointer-events', 'none')
                        .attr('text-anchor', 'middle')
                        .text(function (d) {
                            //return d.properties.weight;边上显示权重
                        });
                }

                function appendRelationshipToGraph() {//添加关系到视图中
                    var relationship = appendRelationship(),
                        text = appendTextToRelationship(relationship),
                        outline = appendOutlineToRelationship(relationship),
                        overlay = appendOverlayToRelationship(relationship);

                    return {//返回一个对象 包含以下四个属性
                        outline: outline,
                        overlay: overlay,
                        relationship: relationship,
                        text: text
                    };
                }

                function class2color(cls) {//根据类名返回颜色
//         var color = classes2colors[cls];
//
//         if (!color) {//。如果类尚未分配颜色，它将从选项中的颜色列表中按序列选择一个颜色，并将其与该类关联。
// //            color = options.colors[Math.min(numClasses, options.colors.length - 1)];
//             color = options.colors[numClasses % options.colors.length];
//             classes2colors[cls] = color;
//             numClasses++;
//         }
//         return color;
                    var color = classes2colors[cls];
                    var maxWeight = d3.max(relationship.data(), function (d) {
                        return d.properties.weight;
                    });
                    var colorScale = d3.scaleLinear()//颜色比例尺设置节点渐变颜色
                        .domain([0, maxWeight])
                        .range(['#d4e0e0', '#034647']);
                    if (!color) {//根据节点总数与已分配颜色的节点数量的比例来计算灰度
                        var greyShade = 220 - Math.round((numClasses / options.nodenumber) * 120); // [100, 220]越小颜色越深
                        // var greyShade = Math.round((numClasses / options.nodenumber) * 120) + 100;//[100,220]round四舍五入
                        //  color = "rgb(" + greyShade + "," + greyShade + "," + greyShade + ")";//灰色
                        //  color = "rgb(" + (200 - numClasses * 3) + "," + (220 - numClasses * 3) + "," + (255 - numClasses * 3) + ")";
                        color = colorScale(numClasses);
                        classes2colors[cls] = color;
                        numClasses++;
                    }
                    return color;
                }

                function class2darkenColor(cls) {//返回与该类关联的颜色的较暗版本。
                    return d3.rgb(class2color(cls));
                }

                function clearInfo() {//清空信息
                    info.html('');
                }

                function color() {//文中未调用
                    return options.colors[options.colors.length * Math.random() << 0];
                }

                function colors() {//一开始调用option.colors = colors(),
                    // d3.schemeCategory10,
                    // d3.schemeCategory20,
                    return ["#F5F5F5",
                        "#F2F2F2",
                        "#EBEBEB",
                        "#E5E5E5"
                    ]

                        ;
                }

                function contains(array, id) {//返回该ID是否存在于数组中
                    var filter = array.filter(function (elem) {
                        return elem.id === id;
                    });

                    return filter.length > 0;
                }

                function defaultColor() {//关系边默认的颜色。
                    return options.relationshipColor;
                }

                function defaultDarkenColor() {
                    return d3.rgb(options.colors[options.colors.length - 1]).darker(1);
                }

                function dragEnded(d) {//该函数在节点拖拽结束时调用
                    if (!d3.event.active) {
                        simulation.alphaTarget(0);
                    }

                    if (typeof options.onNodeDragEnd === 'function') {
                        options.onNodeDragEnd(d);
                    }
                }

                function dragged(d) {//该函数在节点拖拽时调用
                    stickNode(d);
                }

                function dragStarted(d) {//该函数在节点拖拽开始时调用
                    if (!d3.event.active) {
                        simulation.alphaTarget(0.3).restart();
                    }

                    d.fx = d.x;
                    d.fy = d.y;

                    if (typeof options.onNodeDragStart === 'function') {
                        options.onNodeDragStart(d);
                    }
                }

                function extend(obj1, obj2) {//没调用  两个对象合并为一个新的对象
                    var obj = {};

                    merge(obj, obj1);
                    merge(obj, obj2);

                    return obj;
                }

                function fontAwesomeIcons() {//返回一个对象，其中包含所有Font Awesome图标的名称和代码。
                    return {
                        'glass': 'f000',
                        'music': 'f001',
                        'search': 'f002',
                        'envelope-o': 'f003',
                        'heart': 'f004',
                        'star': 'f005',
                        'star-o': 'f006',
                        'user': 'f007',
                        'film': 'f008',
                        'th-large': 'f009',
                        'th': 'f00a',
                        'th-list': 'f00b',
                        'check': 'f00c',
                        'remove,close,times': 'f00d',
                        'search-plus': 'f00e',
                        'search-minus': 'f010',
                        'power-off': 'f011',
                        'signal': 'f012',
                        'gear,cog': 'f013',
                        'trash-o': 'f014',
                        'home': 'f015',
                        'file-o': 'f016',
                        'clock-o': 'f017',
                        'road': 'f018',
                        'download': 'f019',
                        'arrow-circle-o-down': 'f01a',
                        'arrow-circle-o-up': 'f01b',
                        'inbox': 'f01c',
                        'play-circle-o': 'f01d',
                        'rotate-right,repeat': 'f01e',
                        'refresh': 'f021',
                        'list-alt': 'f022',
                        'lock': 'f023',
                        'flag': 'f024',
                        'headphones': 'f025',
                        'volume-off': 'f026',
                        'volume-down': 'f027',
                        'volume-up': 'f028',
                        'qrcode': 'f029',
                        'barcode': 'f02a',
                        'tag': 'f02b',
                        'tags': 'f02c',
                        'book': 'f02d',
                        'bookmark': 'f02e',
                        'print': 'f02f',
                        'camera': 'f030',
                        'font': 'f031',
                        'bold': 'f032',
                        'italic': 'f033',
                        'text-height': 'f034',
                        'text-width': 'f035',
                        'align-left': 'f036',
                        'align-center': 'f037',
                        'align-right': 'f038',
                        'align-justify': 'f039',
                        'list': 'f03a',
                        'dedent,outdent': 'f03b',
                        'indent': 'f03c',
                        'video-camera': 'f03d',
                        'photo,image,picture-o': 'f03e',
                        'pencil': 'f040',
                        'map-marker': 'f041',
                        'adjust': 'f042',
                        'tint': 'f043',
                        'edit,pencil-square-o': 'f044',
                        'share-square-o': 'f045',
                        'check-square-o': 'f046',
                        'arrows': 'f047',
                        'step-backward': 'f048',
                        'fast-backward': 'f049',
                        'backward': 'f04a',
                        'play': 'f04b',
                        'pause': 'f04c',
                        'stop': 'f04d',
                        'forward': 'f04e',
                        'fast-forward': 'f050',
                        'step-forward': 'f051',
                        'eject': 'f052',
                        'chevron-left': 'f053',
                        'chevron-right': 'f054',
                        'plus-circle': 'f055',
                        'minus-circle': 'f056',
                        'times-circle': 'f057',
                        'check-circle': 'f058',
                        'question-circle': 'f059',
                        'info-circle': 'f05a',
                        'crosshairs': 'f05b',
                        'times-circle-o': 'f05c',
                        'check-circle-o': 'f05d',
                        'ban': 'f05e',
                        'arrow-left': 'f060',
                        'arrow-right': 'f061',
                        'arrow-up': 'f062',
                        'arrow-down': 'f063',
                        'mail-forward,share': 'f064',
                        'expand': 'f065',
                        'compress': 'f066',
                        'plus': 'f067',
                        'minus': 'f068',
                        'asterisk': 'f069',
                        'exclamation-circle': 'f06a',
                        'gift': 'f06b',
                        'leaf': 'f06c',
                        'fire': 'f06d',
                        'eye': 'f06e',
                        'eye-slash': 'f070',
                        'warning,exclamation-triangle': 'f071',
                        'plane': 'f072',
                        'calendar': 'f073',
                        'random': 'f074',
                        'comment': 'f075',
                        'magnet': 'f076',
                        'chevron-up': 'f077',
                        'chevron-down': 'f078',
                        'retweet': 'f079',
                        'shopping-cart': 'f07a',
                        'folder': 'f07b',
                        'folder-open': 'f07c',
                        'arrows-v': 'f07d',
                        'arrows-h': 'f07e',
                        'bar-chart-o,bar-chart': 'f080',
                        'twitter-square': 'f081',
                        'facebook-square': 'f082',
                        'camera-retro': 'f083',
                        'key': 'f084',
                        'gears,cogs': 'f085',
                        'comments': 'f086',
                        'thumbs-o-up': 'f087',
                        'thumbs-o-down': 'f088',
                        'star-half': 'f089',
                        'heart-o': 'f08a',
                        'sign-out': 'f08b',
                        'linkedin-square': 'f08c',
                        'thumb-tack': 'f08d',
                        'external-link': 'f08e',
                        'sign-in': 'f090',
                        'trophy': 'f091',
                        'github-square': 'f092',
                        'upload': 'f093',
                        'lemon-o': 'f094',
                        'phone': 'f095',
                        'square-o': 'f096',
                        'bookmark-o': 'f097',
                        'phone-square': 'f098',
                        'twitter': 'f099',
                        'facebook-f,facebook': 'f09a',
                        'github': 'f09b',
                        'unlock': 'f09c',
                        'credit-card': 'f09d',
                        'feed,rss': 'f09e',
                        'hdd-o': 'f0a0',
                        'bullhorn': 'f0a1',
                        'bell': 'f0f3',
                        'certificate': 'f0a3',
                        'hand-o-right': 'f0a4',
                        'hand-o-left': 'f0a5',
                        'hand-o-up': 'f0a6',
                        'hand-o-down': 'f0a7',
                        'arrow-circle-left': 'f0a8',
                        'arrow-circle-right': 'f0a9',
                        'arrow-circle-up': 'f0aa',
                        'arrow-circle-down': 'f0ab',
                        'globe': 'f0ac',
                        'wrench': 'f0ad',
                        'tasks': 'f0ae',
                        'filter': 'f0b0',
                        'briefcase': 'f0b1',
                        'arrows-alt': 'f0b2',
                        'group,users': 'f0c0',
                        'chain,link': 'f0c1',
                        'cloud': 'f0c2',
                        'flask': 'f0c3',
                        'cut,scissors': 'f0c4',
                        'copy,files-o': 'f0c5',
                        'paperclip': 'f0c6',
                        'save,floppy-o': 'f0c7',
                        'square': 'f0c8',
                        'navicon,reorder,bars': 'f0c9',
                        'list-ul': 'f0ca',
                        'list-ol': 'f0cb',
                        'strikethrough': 'f0cc',
                        'underline': 'f0cd',
                        'table': 'f0ce',
                        'magic': 'f0d0',
                        'truck': 'f0d1',
                        'pinterest': 'f0d2',
                        'pinterest-square': 'f0d3',
                        'google-plus-square': 'f0d4',
                        'google-plus': 'f0d5',
                        'money': 'f0d6',
                        'caret-down': 'f0d7',
                        'caret-up': 'f0d8',
                        'caret-left': 'f0d9',
                        'caret-right': 'f0da',
                        'columns': 'f0db',
                        'unsorted,sort': 'f0dc',
                        'sort-down,sort-desc': 'f0dd',
                        'sort-up,sort-asc': 'f0de',
                        'envelope': 'f0e0',
                        'linkedin': 'f0e1',
                        'rotate-left,undo': 'f0e2',
                        'legal,gavel': 'f0e3',
                        'dashboard,tachometer': 'f0e4',
                        'comment-o': 'f0e5',
                        'comments-o': 'f0e6',
                        'flash,bolt': 'f0e7',
                        'sitemap': 'f0e8',
                        'umbrella': 'f0e9',
                        'paste,clipboard': 'f0ea',
                        'lightbulb-o': 'f0eb',
                        'exchange': 'f0ec',
                        'cloud-download': 'f0ed',
                        'cloud-upload': 'f0ee',
                        'user-md': 'f0f0',
                        'stethoscope': 'f0f1',
                        'suitcase': 'f0f2',
                        'bell-o': 'f0a2',
                        'coffee': 'f0f4',
                        'cutlery': 'f0f5',
                        'file-text-o': 'f0f6',
                        'building-o': 'f0f7',
                        'hospital-o': 'f0f8',
                        'ambulance': 'f0f9',
                        'medkit': 'f0fa',
                        'fighter-jet': 'f0fb',
                        'beer': 'f0fc',
                        'h-square': 'f0fd',
                        'plus-square': 'f0fe',
                        'angle-double-left': 'f100',
                        'angle-double-right': 'f101',
                        'angle-double-up': 'f102',
                        'angle-double-down': 'f103',
                        'angle-left': 'f104',
                        'angle-right': 'f105',
                        'angle-up': 'f106',
                        'angle-down': 'f107',
                        'desktop': 'f108',
                        'laptop': 'f109',
                        'tablet': 'f10a',
                        'mobile-phone,mobile': 'f10b',
                        'circle-o': 'f10c',
                        'quote-left': 'f10d',
                        'quote-right': 'f10e',
                        'spinner': 'f110',
                        'circle': 'f111',
                        'mail-reply,reply': 'f112',
                        'github-alt': 'f113',
                        'folder-o': 'f114',
                        'folder-open-o': 'f115',
                        'smile-o': 'f118',
                        'frown-o': 'f119',
                        'meh-o': 'f11a',
                        'gamepad': 'f11b',
                        'keyboard-o': 'f11c',
                        'flag-o': 'f11d',
                        'flag-checkered': 'f11e',
                        'terminal': 'f120',
                        'code': 'f121',
                        'mail-reply-all,reply-all': 'f122',
                        'star-half-empty,star-half-full,star-half-o': 'f123',
                        'location-arrow': 'f124',
                        'crop': 'f125',
                        'code-fork': 'f126',
                        'unlink,chain-broken': 'f127',
                        'question': 'f128',
                        'info': 'f129',
                        'exclamation': 'f12a',
                        'superscript': 'f12b',
                        'subscript': 'f12c',
                        'eraser': 'f12d',
                        'puzzle-piece': 'f12e',
                        'microphone': 'f130',
                        'microphone-slash': 'f131',
                        'shield': 'f132',
                        'calendar-o': 'f133',
                        'fire-extinguisher': 'f134',
                        'rocket': 'f135',
                        'maxcdn': 'f136',
                        'chevron-circle-left': 'f137',
                        'chevron-circle-right': 'f138',
                        'chevron-circle-up': 'f139',
                        'chevron-circle-down': 'f13a',
                        'html5': 'f13b',
                        'css3': 'f13c',
                        'anchor': 'f13d',
                        'unlock-alt': 'f13e',
                        'bullseye': 'f140',
                        'ellipsis-h': 'f141',
                        'ellipsis-v': 'f142',
                        'rss-square': 'f143',
                        'play-circle': 'f144',
                        'ticket': 'f145',
                        'minus-square': 'f146',
                        'minus-square-o': 'f147',
                        'level-up': 'f148',
                        'level-down': 'f149',
                        'check-square': 'f14a',
                        'pencil-square': 'f14b',
                        'external-link-square': 'f14c',
                        'share-square': 'f14d',
                        'compass': 'f14e',
                        'toggle-down,caret-square-o-down': 'f150',
                        'toggle-up,caret-square-o-up': 'f151',
                        'toggle-right,caret-square-o-right': 'f152',
                        'euro,eur': 'f153',
                        'gbp': 'f154',
                        'dollar,usd': 'f155',
                        'rupee,inr': 'f156',
                        'cny,rmb,yen,jpy': 'f157',
                        'ruble,rouble,rub': 'f158',
                        'won,krw': 'f159',
                        'bitcoin,btc': 'f15a',
                        'file': 'f15b',
                        'file-text': 'f15c',
                        'sort-alpha-asc': 'f15d',
                        'sort-alpha-desc': 'f15e',
                        'sort-amount-asc': 'f160',
                        'sort-amount-desc': 'f161',
                        'sort-numeric-asc': 'f162',
                        'sort-numeric-desc': 'f163',
                        'thumbs-up': 'f164',
                        'thumbs-down': 'f165',
                        'youtube-square': 'f166',
                        'youtube': 'f167',
                        'xing': 'f168',
                        'xing-square': 'f169',
                        'youtube-play': 'f16a',
                        'dropbox': 'f16b',
                        'stack-overflow': 'f16c',
                        'instagram': 'f16d',
                        'flickr': 'f16e',
                        'adn': 'f170',
                        'bitbucket': 'f171',
                        'bitbucket-square': 'f172',
                        'tumblr': 'f173',
                        'tumblr-square': 'f174',
                        'long-arrow-down': 'f175',
                        'long-arrow-up': 'f176',
                        'long-arrow-left': 'f177',
                        'long-arrow-right': 'f178',
                        'apple': 'f179',
                        'windows': 'f17a',
                        'android': 'f17b',
                        'linux': 'f17c',
                        'dribbble': 'f17d',
                        'skype': 'f17e',
                        'foursquare': 'f180',
                        'trello': 'f181',
                        'female': 'f182',
                        'male': 'f183',
                        'gittip,gratipay': 'f184',
                        'sun-o': 'f185',
                        'moon-o': 'f186',
                        'archive': 'f187',
                        'bug': 'f188',
                        'vk': 'f189',
                        'weibo': 'f18a',
                        'renren': 'f18b',
                        'pagelines': 'f18c',
                        'stack-exchange': 'f18d',
                        'arrow-circle-o-right': 'f18e',
                        'arrow-circle-o-left': 'f190',
                        'toggle-left,caret-square-o-left': 'f191',
                        'dot-circle-o': 'f192',
                        'wheelchair': 'f193',
                        'vimeo-square': 'f194',
                        'turkish-lira,try': 'f195',
                        'plus-square-o': 'f196',
                        'space-shuttle': 'f197',
                        'slack': 'f198',
                        'envelope-square': 'f199',
                        'wordpress': 'f19a',
                        'openid': 'f19b',
                        'institution,bank,university': 'f19c',
                        'mortar-board,graduation-cap': 'f19d',
                        'yahoo': 'f19e',
                        'google': 'f1a0',
                        'reddit': 'f1a1',
                        'reddit-square': 'f1a2',
                        'stumbleupon-circle': 'f1a3',
                        'stumbleupon': 'f1a4',
                        'delicious': 'f1a5',
                        'digg': 'f1a6',
                        'pied-piper-pp': 'f1a7',
                        'pied-piper-alt': 'f1a8',
                        'drupal': 'f1a9',
                        'joomla': 'f1aa',
                        'language': 'f1ab',
                        'fax': 'f1ac',
                        'building': 'f1ad',
                        'child': 'f1ae',
                        'paw': 'f1b0',
                        'spoon': 'f1b1',
                        'cube': 'f1b2',
                        'cubes': 'f1b3',
                        'behance': 'f1b4',
                        'behance-square': 'f1b5',
                        'steam': 'f1b6',
                        'steam-square': 'f1b7',
                        'recycle': 'f1b8',
                        'automobile,car': 'f1b9',
                        'cab,taxi': 'f1ba',
                        'tree': 'f1bb',
                        'spotify': 'f1bc',
                        'deviantart': 'f1bd',
                        'soundcloud': 'f1be',
                        'database': 'f1c0',
                        'file-pdf-o': 'f1c1',
                        'file-word-o': 'f1c2',
                        'file-excel-o': 'f1c3',
                        'file-powerpoint-o': 'f1c4',
                        'file-photo-o,file-picture-o,file-image-o': 'f1c5',
                        'file-zip-o,file-archive-o': 'f1c6',
                        'file-sound-o,file-audio-o': 'f1c7',
                        'file-movie-o,file-video-o': 'f1c8',
                        'file-code-o': 'f1c9',
                        'vine': 'f1ca',
                        'codepen': 'f1cb',
                        'jsfiddle': 'f1cc',
                        'life-bouy,life-buoy,life-saver,support,life-ring': 'f1cd',
                        'circle-o-notch': 'f1ce',
                        'ra,resistance,rebel': 'f1d0',
                        'ge,empire': 'f1d1',
                        'git-square': 'f1d2',
                        'git': 'f1d3',
                        'y-combinator-square,yc-square,hacker-news': 'f1d4',
                        'tencent-weibo': 'f1d5',
                        'qq': 'f1d6',
                        'wechat,weixin': 'f1d7',
                        'send,paper-plane': 'f1d8',
                        'send-o,paper-plane-o': 'f1d9',
                        'history': 'f1da',
                        'circle-thin': 'f1db',
                        'header': 'f1dc',
                        'paragraph': 'f1dd',
                        'sliders': 'f1de',
                        'share-alt': 'f1e0',
                        'share-alt-square': 'f1e1',
                        'bomb': 'f1e2',
                        'soccer-ball-o,futbol-o': 'f1e3',
                        'tty': 'f1e4',
                        'binoculars': 'f1e5',
                        'plug': 'f1e6',
                        'slideshare': 'f1e7',
                        'twitch': 'f1e8',
                        'yelp': 'f1e9',
                        'newspaper-o': 'f1ea',
                        'wifi': 'f1eb',
                        'calculator': 'f1ec',
                        'paypal': 'f1ed',
                        'google-wallet': 'f1ee',
                        'cc-visa': 'f1f0',
                        'cc-mastercard': 'f1f1',
                        'cc-discover': 'f1f2',
                        'cc-amex': 'f1f3',
                        'cc-paypal': 'f1f4',
                        'cc-stripe': 'f1f5',
                        'bell-slash': 'f1f6',
                        'bell-slash-o': 'f1f7',
                        'trash': 'f1f8',
                        'copyright': 'f1f9',
                        'at': 'f1fa',
                        'eyedropper': 'f1fb',
                        'paint-brush': 'f1fc',
                        'birthday-cake': 'f1fd',
                        'area-chart': 'f1fe',
                        'pie-chart': 'f200',
                        'line-chart': 'f201',
                        'lastfm': 'f202',
                        'lastfm-square': 'f203',
                        'toggle-off': 'f204',
                        'toggle-on': 'f205',
                        'bicycle': 'f206',
                        'bus': 'f207',
                        'ioxhost': 'f208',
                        'angellist': 'f209',
                        'cc': 'f20a',
                        'shekel,sheqel,ils': 'f20b',
                        'meanpath': 'f20c',
                        'buysellads': 'f20d',
                        'connectdevelop': 'f20e',
                        'dashcube': 'f210',
                        'forumbee': 'f211',
                        'leanpub': 'f212',
                        'sellsy': 'f213',
                        'shirtsinbulk': 'f214',
                        'simplybuilt': 'f215',
                        'skyatlas': 'f216',
                        'cart-plus': 'f217',
                        'cart-arrow-down': 'f218',
                        'diamond': 'f219',
                        'ship': 'f21a',
                        'user-secret': 'f21b',
                        'motorcycle': 'f21c',
                        'street-view': 'f21d',
                        'heartbeat': 'f21e',
                        'venus': 'f221',
                        'mars': 'f222',
                        'mercury': 'f223',
                        'intersex,transgender': 'f224',
                        'transgender-alt': 'f225',
                        'venus-double': 'f226',
                        'mars-double': 'f227',
                        'venus-mars': 'f228',
                        'mars-stroke': 'f229',
                        'mars-stroke-v': 'f22a',
                        'mars-stroke-h': 'f22b',
                        'neuter': 'f22c',
                        'genderless': 'f22d',
                        'facebook-official': 'f230',
                        'pinterest-p': 'f231',
                        'whatsapp': 'f232',
                        'server': 'f233',
                        'user-plus': 'f234',
                        'user-times': 'f235',
                        'hotel,bed': 'f236',
                        'viacoin': 'f237',
                        'train': 'f238',
                        'subway': 'f239',
                        'medium': 'f23a',
                        'yc,y-combinator': 'f23b',
                        'optin-monster': 'f23c',
                        'opencart': 'f23d',
                        'expeditedssl': 'f23e',
                        'battery-4,battery-full': 'f240',
                        'battery-3,battery-three-quarters': 'f241',
                        'battery-2,battery-half': 'f242',
                        'battery-1,battery-quarter': 'f243',
                        'battery-0,battery-empty': 'f244',
                        'mouse-pointer': 'f245',
                        'i-cursor': 'f246',
                        'object-group': 'f247',
                        'object-ungroup': 'f248',
                        'sticky-note': 'f249',
                        'sticky-note-o': 'f24a',
                        'cc-jcb': 'f24b',
                        'cc-diners-club': 'f24c',
                        'clone': 'f24d',
                        'balance-scale': 'f24e',
                        'hourglass-o': 'f250',
                        'hourglass-1,hourglass-start': 'f251',
                        'hourglass-2,hourglass-half': 'f252',
                        'hourglass-3,hourglass-end': 'f253',
                        'hourglass': 'f254',
                        'hand-grab-o,hand-rock-o': 'f255',
                        'hand-stop-o,hand-paper-o': 'f256',
                        'hand-scissors-o': 'f257',
                        'hand-lizard-o': 'f258',
                        'hand-spock-o': 'f259',
                        'hand-pointer-o': 'f25a',
                        'hand-peace-o': 'f25b',
                        'trademark': 'f25c',
                        'registered': 'f25d',
                        'creative-commons': 'f25e',
                        'gg': 'f260',
                        'gg-circle': 'f261',
                        'tripadvisor': 'f262',
                        'odnoklassniki': 'f263',
                        'odnoklassniki-square': 'f264',
                        'get-pocket': 'f265',
                        'wikipedia-w': 'f266',
                        'safari': 'f267',
                        'chrome': 'f268',
                        'firefox': 'f269',
                        'opera': 'f26a',
                        'internet-explorer': 'f26b',
                        'tv,television': 'f26c',
                        'contao': 'f26d',
                        '500px': 'f26e',
                        'amazon': 'f270',
                        'calendar-plus-o': 'f271',
                        'calendar-minus-o': 'f272',
                        'calendar-times-o': 'f273',
                        'calendar-check-o': 'f274',
                        'industry': 'f275',
                        'map-pin': 'f276',
                        'map-signs': 'f277',
                        'map-o': 'f278',
                        'map': 'f279',
                        'commenting': 'f27a',
                        'commenting-o': 'f27b',
                        'houzz': 'f27c',
                        'vimeo': 'f27d',
                        'black-tie': 'f27e',
                        'fonticons': 'f280',
                        'reddit-alien': 'f281',
                        'edge': 'f282',
                        'credit-card-alt': 'f283',
                        'codiepie': 'f284',
                        'modx': 'f285',
                        'fort-awesome': 'f286',
                        'usb': 'f287',
                        'product-hunt': 'f288',
                        'mixcloud': 'f289',
                        'scribd': 'f28a',
                        'pause-circle': 'f28b',
                        'pause-circle-o': 'f28c',
                        'stop-circle': 'f28d',
                        'stop-circle-o': 'f28e',
                        'shopping-bag': 'f290',
                        'shopping-basket': 'f291',
                        'hashtag': 'f292',
                        'bluetooth': 'f293',
                        'bluetooth-b': 'f294',
                        'percent': 'f295',
                        'gitlab': 'f296',
                        'wpbeginner': 'f297',
                        'wpforms': 'f298',
                        'envira': 'f299',
                        'universal-access': 'f29a',
                        'wheelchair-alt': 'f29b',
                        'question-circle-o': 'f29c',
                        'blind': 'f29d',
                        'audio-description': 'f29e',
                        'volume-control-phone': 'f2a0',
                        'braille': 'f2a1',
                        'assistive-listening-systems': 'f2a2',
                        'asl-interpreting,american-sign-language-interpreting': 'f2a3',
                        'deafness,hard-of-hearing,deaf': 'f2a4',
                        'glide': 'f2a5',
                        'glide-g': 'f2a6',
                        'signing,sign-language': 'f2a7',
                        'low-vision': 'f2a8',
                        'viadeo': 'f2a9',
                        'viadeo-square': 'f2aa',
                        'snapchat': 'f2ab',
                        'snapchat-ghost': 'f2ac',
                        'snapchat-square': 'f2ad',
                        'pied-piper': 'f2ae',
                        'first-order': 'f2b0',
                        'yoast': 'f2b1',
                        'themeisle': 'f2b2',
                        'google-plus-circle,google-plus-official': 'f2b3',
                        'fa,font-awesome': 'f2b4'
                    };
                }

                function icon(d) {
                    var code;

                    if (options.iconMap && options.showIcons && options.icons) {
                        if (options.icons[d.labels[0]] && options.iconMap[options.icons[d.labels[0]]]) {
                            code = options.iconMap[options.icons[d.labels[0]]];
                        } else if (options.iconMap[d.labels[0]]) {
                            code = options.iconMap[d.labels[0]];
                        } else if (options.icons[d.labels[0]]) {
                            code = options.icons[d.labels[0]];
                        }
                    }

                    return code;
                }

                function image(d) {//获取节点图片
                    var i, imagesForLabel, img, imgLevel, label, labelPropertyValue, property, value;

                    if (options.images) {
                        imagesForLabel = options.imageMap[d.labels[0]];

                        if (imagesForLabel) {
                            imgLevel = 0;

                            for (i = 0; i < imagesForLabel.length; i++) {
                                labelPropertyValue = imagesForLabel[i].split('|');

                                switch (labelPropertyValue.length) {
                                    case 3:
                                        value = labelPropertyValue[2];
                                    /* falls through */
                                    case 2:
                                        property = labelPropertyValue[1];
                                    /* falls through */
                                    case 1:
                                        label = labelPropertyValue[0];
                                }

                                if (d.labels[0] === label &&
                                    (!property || d.properties[property] !== undefined) &&
                                    (!value || d.properties[property] === value)) {
                                    if (labelPropertyValue.length > imgLevel) {
                                        img = options.images[imagesForLabel[i]];
                                        imgLevel = labelPropertyValue.length;
                                    }
                                }
                            }
                        }
                    }

                    return img;
                }

                function init(_selector, _options) {
                    initIconMap();

                    merge(options, _options);

                    if (options.icons) {
                        options.showIcons = true;
                    }

                    if (!options.minCollision) {
                        options.minCollision = options.nodeRadius * 2;
                    }

                    initImageMap();

                    selector = _selector;

                    container = d3.select(selector);

                    container.attr('class', 'neo4jd3')
                        .html('');

                    appendGraph(container);

                    simulation = initSimulation();

                    if (options.neo4jData) {
                        loadNeo4jData(options.neo4jData);
                    } else if (options.neo4jDataUrl) {
                        loadNeo4jDataFromUrl(options.neo4jDataUrl);
                    } else {
                        console.error('Error: both neo4jData and neo4jDataUrl are empty!');
                    }

                }

                function drawLegend() {
                    // 获取画布的宽度和高度
                    var width = parseInt(svg.style("width").replace("px", ""));
                    var height = parseInt(svg.style("height").replace("px", ""));
                    console.log(width, height)
                    // 如果宽度和高度未设置，使用默认值
                    if (isNaN(width)) {
                        width = 1200; // 默认宽度
                    }
                    if (isNaN(height)) {
                        height = 800; // 默认高度
                    }

                    // 定义图例的宽度和高度
                    var legendWidth = 120;
                    var legendHeight = options.topicmap.length * 32 + 20;

                    // 在画布上添加一个矩形框，用于显示图例
                    svg.append("rect")
                        .attr("x", width - legendWidth - 10)
                        .attr("y", height - legendHeight - 10)
                        .attr("width", legendWidth)
                        .attr("height", legendHeight)
                        .style("fill", "rgba(255, 255, 255, 0)");

                    // 在矩形框中添加标签
                    svg.append("text")
                        .attr("x", width - legendWidth + 20)
                        .attr("y", height - legendHeight + 30)
                        .attr("font-size", "15px")
                        .text("SubTopic:");

                    // 使用for循环遍历节点类型并添加圆形和文本
                    for (var i = 0; i < options.topicmap.length; i++) {
                        var yPos = height - legendHeight + 50 + (i * 32);

                        svg.append("circle")
                            .attr("cx", width - legendWidth + 30)
                            .attr("cy", yPos)
                            .attr("r", 9)
                            .style("fill", options.colormap[i]);

                        svg.append("text")
                            .attr("x", width - legendWidth + 40)
                            .attr("y", yPos + 5)
                            .attr("font-size", "12px")
                            .text(options.topicmap[i]);
                    }
                }


                function initIconMap() {
                    Object.keys(options.iconMap).forEach(function (key, index) {
                        var keys = key.split(','),
                            value = options.iconMap[key];

                        keys.forEach(function (key) {
                            options.iconMap[key] = value;
                        });
                    });
                }

                function initImageMap() {
                    var key, keys, selector;

                    for (key in options.images) {
                        if (options.images.hasOwnProperty(key)) {
                            keys = key.split('|');

                            if (!options.imageMap[keys[0]]) {
                                options.imageMap[keys[0]] = [key];
                            } else {
                                options.imageMap[keys[0]].push(key);
                            }
                        }
                    }
                }

                function initSimulation() {
                    var simulation = d3.forceSimulation()//力导向图 部分节点会被吸引到中心位置，这些节点通常与其他节点有着较强的连线关系。
                        //                           .velocityDecay(0.8)
                        //                           .force('x', d3.force().strength(0.002))
                        //                           .force('y', d3.force().strength(0.002))
                        .force("x", d3.forceX(200))//设置 X 和 Y 方向上的力
                        .force("y", d3.forceY(200))
                        .force('collide', d3.forceCollide().radius(function (d) {//设置节点之间的间距
                            return options.minCollision;
                        }).iterations(2))
                        .force('charge', d3.forceManyBody().strength(-10))//设置节点间的斥力
                        .force('link', d3.forceLink().id(function (d) {//将连接线拉紧到节点上
                            return d.id;
                        }))
                        //中心点设置为力导向图布局的中心点
                        .force('center', d3.forceCenter(svg.node().parentElement.parentElement.clientWidth / 2, svg.node().parentElement.parentElement.clientHeight / 2))
                        .on('tick', function () {//更新节点和连接线的位置
                            tick();
                        })
                        .on('end', function () {
                            if (options.zoomFit && !justLoaded) {
                                justLoaded = true;
                                zoomFit(2);//进行缩放
                            }
                        });

                    return simulation;
                }

                function loadNeo4jData() {
                    nodes = [];
                    relationships = [];

                    updateWithNeo4jData(options.neo4jData);
                }

                function loadNeo4jDataFromUrl(neo4jDataUrl) {
                    nodes = [];
                    relationships = [];

                    d3.json(neo4jDataUrl, function (error, data) {
                        if (error) {
                            throw error;
                        }

                        updateWithNeo4jData(data);
                    });
                }

                function merge(target, source) {
                    Object.keys(source).forEach(function (property) {
                        target[property] = source[property];
                    });
                }

                function neo4jDataToD3Data(data) {
                    var graph = {
                        nodes: [],
                        relationships: []
                    };

                    data.results.forEach(function (result) {
                        result.data.forEach(function (data) {
                            data.graph=data.graph[0];
                            data.graph.nodes.forEach(function (node) {
                                if (!contains(graph.nodes, node.id)) {
                                    graph.nodes.push(node);
                                }
                            });
                            //将 startNode 和 endNode 属性分别设置为 source 和 target 属性。
                            data.graph.relationships.forEach(function (relationship) {
                                relationship.source = relationship.startNode;
                                relationship.target = relationship.endNode;
                                graph.relationships.push(relationship);
                            });
                            //对 graph 中的边按照 source 和 target 进行排序
                            data.graph.relationships.sort(function (a, b) {
                                if (a.source > b.source) {
                                    return 1;
                                } else if (a.source < b.source) {
                                    return -1;
                                } else {
                                    if (a.target > b.target) {
                                        return 1;
                                    }

                                    if (a.target < b.target) {
                                        return -1;
                                    } else {
                                        return 0;
                                    }
                                }
                            });
                            //为每条边添加 linknum 属性表示该边是源节点和目标节点之间的第几条边。
                            for (var i = 0; i < data.graph.relationships.length; i++) {
                                if (i !== 0 && data.graph.relationships[i].source === data.graph.relationships[i - 1].source && data.graph.relationships[i].target === data.graph.relationships[i - 1].target) {
                                    data.graph.relationships[i].linknum = data.graph.relationships[i - 1].linknum + 1;
                                } else {
                                    data.graph.relationships[i].linknum = 1;
                                }
                            }
                        });
                    });
                    options.nodenumber = graph.nodes.length;
                    console.log("节点数量" + options.nodenumber);
                    options.relationnumber = graph.relationships.length;
                    console.log("边数量" + options.relationnumber);
                    options.topicmap = data.results[0].data[0].graph.AllSubTopic;
                    console.log("主题数量" + options.topicmap);
                    drawLegend();
                    return graph;
                }

                function randomD3Data(d, maxNodesToGenerate) {//生成随机数据
                    var data = {
                            nodes: [],
                            relationships: []
                        },
                        i,
                        label,
                        node,
                        numNodes = (maxNodesToGenerate * Math.random() << 0) + 1,
                        relationship,
                        s = size();

                    for (i = 0; i < numNodes; i++) {
                        label = randomLabel();

                        node = {
                            id: s.nodes + 1 + i,
                            labels: [label],
                            properties: {
                                random: label
                            },
                            x: d.x,
                            y: d.y
                        };

                        data.nodes[data.nodes.length] = node;

                        relationship = {
                            id: s.relationships + 1 + i,
                            type: label.toUpperCase(),
                            startNode: d.id,
                            endNode: s.nodes + 1 + i,
                            properties: {
                                from: Date.now()
                            },
                            source: d.id,
                            target: s.nodes + 1 + i,
                            linknum: s.relationships + 1 + i
                        };

                        data.relationships[data.relationships.length] = relationship;
                    }

                    return data;
                }

                function randomLabel() {//生成随机标签
                    var icons = Object.keys(options.iconMap);
                    return icons[icons.length * Math.random() << 0];
                }

                function rotate(cx, cy, x, y, angle) {//点 (x, y)，以 (cx, cy) 为中心点，旋转 angle 度。
                    var radians = (Math.PI / 180) * angle,
                        cos = Math.cos(radians),
                        sin = Math.sin(radians),
                        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
                        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

                    return {x: nx, y: ny};
                }

                function rotatePoint(c, p, angle) {//
                    return rotate(c.x, c.y, p.x, p.y, angle);
                }

                function rotation(source, target) {//计算两个节点之间的角度
                    return Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
                }

                function size() {// 返回节点和边的数量
                    return {
                        nodes: nodes.length,
                        relationships: relationships.length
                    };
                }

                /*
                    function smoothTransform(elem, translate, scale) {
                        var animationMilliseconds = 5000,
                            timeoutMilliseconds = 50,
                            steps = parseInt(animationMilliseconds / timeoutMilliseconds);

                        setTimeout(function() {
                            smoothTransformStep(elem, translate, scale, timeoutMilliseconds, 1, steps);
                        }, timeoutMilliseconds);
                    }

                    function smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step, steps) {
                        var progress = step / steps;

                        elem.attr('transform', 'translate(' + (translate[0] * progress) + ', ' + (translate[1] * progress) + ') scale(' + (scale * progress) + ')');

                        if (step < steps) {
                            setTimeout(function() {
                                smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step + 1, steps);
                            }, timeoutMilliseconds);
                        }
                    }
                */
                function stickNode(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }

                function tick() {//更新节点和边的位置。
                    tickNodes();
                    tickRelationships();
                }

                function tickNodes() {//更新节点位置。
                    if (node) {
                        node.attr('transform', function (d) {
                            return 'translate(' + d.x + ', ' + d.y + ')';
                        });
                    }
                }

                function tickRelationships() {////更新边位置。
                    if (relationship) {
                        relationship.attr('transform', function (d) {
                            var angle = rotation(d.source, d.target);
                            return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
                        });

                        tickRelationshipsTexts();
                        tickRelationshipsOutlines();//画边
                        tickRelationshipsOverlays();//绘制边的覆盖层。
                    }
                }

//    function tickRelationshipsOutlines() {//按不同权重绘制线条粗细
//     relationship.each(function(d) {
//         var rel = d3.select(this),
//             outline = rel.select('.outline'),
//             weight = d.properties.weight;
//
//         outline.style('stroke-width', weight*0.05) // 根据 weight 设置边的粗细
//             .style('stroke', '#b9b8b8') // 设置线条外轮廓颜色
//              .attr('fill', '#b9b8b8')//边的内轮廓颜色
//             .attr('d', function(d) {
//                 var center = { x: 0, y: 0 },
//                     angle = rotation(d.source, d.target),
//                     text = rel.select('.text'), // 添加这一行来修复问题
//                     textBoundingBox = text.node().getBBox(),
//                     textPadding = 5,
//                     u = unitaryVector(d.source, d.target),
//                     textMargin = { x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5, y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5 },
//                     n = unitaryNormalVector(d.source, d.target),
//                     rotatedPointA = rotatePoint(center, { x: 0 - n.x, y: 0 - n.y }, angle),
//                     rotatedPointB = rotatePoint(center, { x: d.target.x - d.source.x - n.x, y: d.target.y - d.source.y - n.y }, angle),
//                     rotatedPointC = rotatePoint(center, { x: d.target.x - d.source.x + n.x, y: d.target.y - d.source.y + n.y }, angle),
//                     rotatedPointD = rotatePoint(center, { x: 0 + n.x, y: 0 + n.y }, angle);
//
//                 return 'M ' + rotatedPointA.x + ' ' + rotatedPointA.y +
//                        ' L ' + rotatedPointB.x + ' ' + rotatedPointB.y +
//                        ' L ' + rotatedPointC.x + ' ' + rotatedPointC.y +
//                        ' L ' + rotatedPointD.x + ' ' + rotatedPointD.y +
//                        ' Z';
//             });
//     });
// }
                function tickRelationshipsOutlines() {//按不同权重绘制线条透明度
                    var maxWeight = d3.max(relationship.data(), function (d) {
                        return d.properties.weight;
                    });

                    var colorScale = d3.scaleLinear()//颜色比例尺设置线条渐变
                        .domain([0, maxWeight])
                        // .range(['#ededed', '#adadad']);
                        .range(['#f5f1f1', '#9cc2a9']);
                    relationship.each(function (d) {
                        var rel = d3.select(this),
                            outline = rel.select('.outline'),
                            weight = d.properties.weight;

                        outline.style('stroke-width', 0.01)
                            .style('stroke', colorScale(weight))
                            .attr('fill', colorScale(weight))
                            .attr('d', function (d) {
                                var center = {x: 0, y: 0},
                                    angle = rotation(d.source, d.target),
                                    text = rel.select('.text'), // 添加这一行来修复问题
                                    textBoundingBox = text.node().getBBox(),
                                    textPadding = 5,
                                    u = unitaryVector(d.source, d.target),
                                    textMargin = {
                                        x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5,
                                        y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5
                                    },
                                    n = unitaryNormalVector(d.source, d.target),
                                    rotatedPointA = rotatePoint(center, {x: 0 - n.x, y: 0 - n.y}, angle),
                                    rotatedPointB = rotatePoint(center, {
                                        x: d.target.x - d.source.x - n.x,
                                        y: d.target.y - d.source.y - n.y
                                    }, angle),
                                    rotatedPointC = rotatePoint(center, {
                                        x: d.target.x - d.source.x + n.x,
                                        y: d.target.y - d.source.y + n.y
                                    }, angle),
                                    rotatedPointD = rotatePoint(center, {x: 0 + n.x, y: 0 + n.y}, angle);

                                return 'M ' + rotatedPointA.x + ' ' + rotatedPointA.y +
                                    ' L ' + rotatedPointB.x + ' ' + rotatedPointB.y +
                                    ' L ' + rotatedPointC.x + ' ' + rotatedPointC.y +
                                    ' L ' + rotatedPointD.x + ' ' + rotatedPointD.y +
                                    ' Z';
                            });
                    });
                }

                function tickRelationshipsOverlays() {//绘制边的覆盖层。
                    relationshipOverlay.attr('d', function (d) {
                        var center = {x: 0, y: 0},
                            angle = rotation(d.source, d.target),
                            n1 = unitaryNormalVector(d.source, d.target),
                            n = unitaryNormalVector(d.source, d.target, 50),
                            rotatedPointA = rotatePoint(center, {x: 0 - n.x, y: 0 - n.y}, angle),
                            rotatedPointB = rotatePoint(center, {
                                x: d.target.x - d.source.x - n.x,
                                y: d.target.y - d.source.y - n.y
                            }, angle),
                            rotatedPointC = rotatePoint(center, {
                                x: d.target.x - d.source.x + n.x - n1.x,
                                y: d.target.y - d.source.y + n.y - n1.y
                            }, angle),
                            rotatedPointD = rotatePoint(center, {x: 0 + n.x - n1.x, y: 0 + n.y - n1.y}, angle);

                        return 'M ' + rotatedPointA.x + ' ' + rotatedPointA.y +
                            ' L ' + rotatedPointB.x + ' ' + rotatedPointB.y +
                            ' L ' + rotatedPointC.x + ' ' + rotatedPointC.y +
                            ' L ' + rotatedPointD.x + ' ' + rotatedPointD.y +
                            ' Z';
                    });
                }

                function tickRelationshipsTexts() {//更新边上的文字标签的位置和旋转角度
                    relationshipText.attr('transform', function (d) {
                        var angle = (rotation(d.source, d.target) + 360) % 360,
                            mirror = angle > 90 && angle < 270,
                            center = {x: 0, y: 0},
                            n = unitaryNormalVector(d.source, d.target),
                            nWeight = mirror ? 2 : -3,
                            point = {
                                x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight,
                                y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight
                            },
                            rotatedPoint = rotatePoint(center, point, angle);

                        return 'translate(' + rotatedPoint.x + ', ' + rotatedPoint.y + ') rotate(' + (mirror ? 180 : 0) + ')';
                    });

                }

                function toString(d) {
                    var s = d.labels ? d.labels[0] : d.type;

                    // s += ' (<id>: ' + d.id;

                    Object.keys(d.properties).forEach(function (property) {
                        s += ', ' + property + ': ' + JSON.stringify(d.properties[property]);
                    });

                    //s += ')';

                    return s;
                }

                function unitaryNormalVector(source, target, newLength) {
                    var center = {x: 0, y: 0},
                        vector = unitaryVector(source, target, newLength);

                    return rotatePoint(center, vector, 90);
                }

                function unitaryVector(source, target, newLength) {
                    var length = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)) / Math.sqrt(newLength || 1);

                    return {
                        x: (target.x - source.x) / length,
                        y: (target.y - source.y) / length,
                    };
                }

                function updateWithD3Data(d3Data) {
                    updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
                }

                function updateWithNeo4jData(neo4jData) {
                    var d3Data = neo4jDataToD3Data(neo4jData);//neo4j数据转D3数据
                    updateWithD3Data(d3Data);//更新到视图中
                }

                function updateInfo(d) {
                    clearInfo();

                    if (d.labels) {
                        appendInfoElementClass('class', d.labels[0]);
                    } else {
                        appendInfoElementRelationship('class', d.type);
                    }

                    appendInfoElementProperty('property', '&lt;id&gt;', d.id);

                    Object.keys(d.properties).forEach(function (property) {
                        appendInfoElementProperty('property', property, JSON.stringify(d.properties[property]));
                    });
                }

                function updateNodes(n) {
                    n.forEach(node => {
                        // Add BigTopicSimilarity and SubTopicSimilarity properties to each node
                        node.BigTopicSimilarity = node.BigTopicSimilarity || [];
                        node.SubTopicSimilarity = node.SubTopicSimilarity || [];
                    });
                    Array.prototype.push.apply(nodes, n);

                    node = svgNodes.selectAll('.node')
                        .data(nodes, function (d) {
                            console.log(d);
                            return d.id;
                        });
                    var nodeEnter = appendNodeToGraph();
                    node = nodeEnter.merge(node);
                }

                function updateNodesAndRelationships(n, r) {
                    updateRelationships(r);
                    updateNodes(n);

                    simulation.nodes(nodes);
                    simulation.force('link').links(relationships);
                }

                function updateRelationships(r) {
                    Array.prototype.push.apply(relationships, r);

                    relationship = svgRelationships.selectAll('.relationship')
                        .data(relationships, function (d) {
                            return d.id;
                        });

                    var relationshipEnter = appendRelationshipToGraph();

                    relationship = relationshipEnter.relationship.merge(relationship);

                    relationshipOutline = svg.selectAll('.relationship .outline');
                    relationshipOutline = relationshipEnter.outline.merge(relationshipOutline);

                    relationshipOverlay = svg.selectAll('.relationship .overlay');
                    relationshipOverlay = relationshipEnter.overlay.merge(relationshipOverlay);

                    relationshipText = svg.selectAll('.relationship .text');
                    relationshipText = relationshipEnter.text.merge(relationshipText);
                }

                function version() {
                    return VERSION;
                }

                function zoomFit(transitionDuration) {
                    var bounds = svg.node().getBBox(),
                        parent = svg.node().parentElement.parentElement,
                        fullWidth = parent.clientWidth,
                        fullHeight = parent.clientHeight,
                        width = bounds.width,
                        height = bounds.height,
                        midX = bounds.x + width / 2,
                        midY = bounds.y + height / 2;

                    if (width === 0 || height === 0) {
                        return; // nothing to fit
                    }

                    svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
                    svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

                    svg.attr('transform', 'translate(' + svgTranslate[0] + ', ' + svgTranslate[1] + ') scale(' + svgScale + ')');
//        smoothTransform(svgTranslate, svgScale);
                }

                init(_selector, _options);

                return {
                    appendRandomDataToNode: appendRandomDataToNode,
                    neo4jDataToD3Data: neo4jDataToD3Data,
                    randomD3Data: randomD3Data,
                    size: size,
                    updateWithD3Data: updateWithD3Data,
                    updateWithNeo4jData: updateWithNeo4jData,
                    version: version
                };
            }

            module.exports = Neo4jD3;//将Neo4jD3作为本模块的输出。在其他文件中加载本模块时，使用该函数来创建Neo4jD3图形

        }, {}]
    }, {}, [1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi9pbmRleC5qcyIsInNyYy9tYWluL3NjcmlwdHMvbmVvNGpkMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBuZW80amQzID0gcmVxdWlyZSgnLi9zY3JpcHRzL25lbzRqZDMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZW80amQzO1xuIiwiLyogZ2xvYmFsIGQzLCBkb2N1bWVudCAqL1xyXG4vKiBqc2hpbnQgbGF0ZWRlZjpub2Z1bmMgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gTmVvNGpEMyhfc2VsZWN0b3IsIF9vcHRpb25zKSB7XHJcbiAgICB2YXIgY29udGFpbmVyLCBncmFwaCwgaW5mbywgbm9kZSwgbm9kZXMsIHJlbGF0aW9uc2hpcCwgcmVsYXRpb25zaGlwT3V0bGluZSwgcmVsYXRpb25zaGlwT3ZlcmxheSwgcmVsYXRpb25zaGlwVGV4dCwgcmVsYXRpb25zaGlwcywgc2VsZWN0b3IsIHNpbXVsYXRpb24sIHN2Zywgc3ZnTm9kZXMsIHN2Z1JlbGF0aW9uc2hpcHMsIHN2Z1NjYWxlLCBzdmdUcmFuc2xhdGUsXHJcbiAgICAgICAgY2xhc3NlczJjb2xvcnMgPSB7fSxcclxuICAgICAgICBqdXN0TG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgbnVtQ2xhc3NlcyA9IDAsXHJcbiAgICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgYXJyb3dTaXplOiA0LFxyXG4gICAgICAgICAgICBjb2xvcnM6IGNvbG9ycygpLFxyXG4gICAgICAgICAgICBoaWdobGlnaHQ6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgaWNvbk1hcDogZm9udEF3ZXNvbWVJY29ucygpLFxyXG4gICAgICAgICAgICBpY29uczogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBpbWFnZU1hcDoge30sXHJcbiAgICAgICAgICAgIGltYWdlczogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBpbmZvUGFuZWw6IHRydWUsXHJcbiAgICAgICAgICAgIG1pbkNvbGxpc2lvbjogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBuZW80akRhdGE6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgbmVvNGpEYXRhVXJsOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIG5vZGVPdXRsaW5lRmlsbENvbG9yOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIG5vZGVSYWRpdXM6IDI1LFxyXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBDb2xvcjogJyNhNWFiYjYnLFxyXG4gICAgICAgICAgICB6b29tRml0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgVkVSU0lPTiA9ICcwLjAuMSc7XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwZW5kR3JhcGgoY29udGFpbmVyKSB7XHJcbiAgICAgICAgc3ZnID0gY29udGFpbmVyLmFwcGVuZCgnc3ZnJylcclxuICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCAnMTAwJScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsICcxMDAlJylcclxuICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbmVvNGpkMy1ncmFwaCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLmNhbGwoZDMuem9vbSgpLm9uKCd6b29tJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnRyYW5zZm9ybS5rLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlID0gW2QzLmV2ZW50LnRyYW5zZm9ybS54LCBkMy5ldmVudC50cmFuc2Zvcm0ueV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3ZnVHJhbnNsYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGVbMF0gKz0gc3ZnVHJhbnNsYXRlWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlWzFdICs9IHN2Z1RyYW5zbGF0ZVsxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN2Z1NjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSAqPSBzdmdTY2FsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ZnLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHRyYW5zbGF0ZVswXSArICcsICcgKyB0cmFuc2xhdGVbMV0gKyAnKSBzY2FsZSgnICsgc2NhbGUgKyAnKScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgIC5vbignZGJsY2xpY2suem9vbScsIG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnZycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgJzEwMCUnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAnMTAwJScpO1xyXG5cclxuICAgICAgICBzdmdSZWxhdGlvbnNoaXBzID0gc3ZnLmFwcGVuZCgnZycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdyZWxhdGlvbnNoaXBzJyk7XHJcblxyXG4gICAgICAgIHN2Z05vZGVzID0gc3ZnLmFwcGVuZCgnZycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbm9kZXMnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBlbmRJbWFnZVRvTm9kZShub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUuYXBwZW5kKCdpbWFnZScpXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpY29uKGQpID8gJzI0cHgnOiAnMzBweCc7XHJcbiAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGljb24oZCkgPyAnNXB4JzogJy0xNXB4JztcclxuICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cigneGxpbms6aHJlZicsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW1hZ2UoZCk7XHJcbiAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGljb24oZCkgPyAnNXB4JzogJy0xNnB4JztcclxuICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGljb24oZCkgPyAnMjRweCc6ICczMHB4JztcclxuICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpIHtcclxuICAgICAgICByZXR1cm4gY29udGFpbmVyLmFwcGVuZCgnZGl2JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ25lbzRqZDMtaW5mbycpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50KGNscywgaXNOb2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgZWxlbSA9IGluZm8uYXBwZW5kKCdhJyk7XHJcblxyXG4gICAgICAgIGVsZW0uYXR0cignaHJlZicsICcjJylcclxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgY2xzKVxyXG4gICAgICAgICAgICAuaHRtbCgnPHN0cm9uZz4nICsgcHJvcGVydHkgKyAnPC9zdHJvbmc+JyArICh2YWx1ZSA/ICgnOiAnICsgdmFsdWUpIDogJycpKTtcclxuXHJcbiAgICAgICAgaWYgKCF2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlKCdiYWNrZ3JvdW5kLWNvbG9yJywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yID8gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA6IChpc05vZGUgPyBjbGFzczJjb2xvcihwcm9wZXJ0eSkgOiBkZWZhdWx0Q29sb3IoKSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdib3JkZXItY29sb3InLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKSA6IChpc05vZGUgPyBjbGFzczJkYXJrZW5Db2xvcihwcm9wZXJ0eSkgOiBkZWZhdWx0RGFya2VuQ29sb3IoKSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdjb2xvcicsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/IGNsYXNzMmRhcmtlbkNvbG9yKG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IpIDogJyNmZmYnO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoY2xzLCBub2RlKSB7XHJcbiAgICAgICAgYXBwZW5kSW5mb0VsZW1lbnQoY2xzLCB0cnVlLCBub2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KGNscywgcHJvcGVydHksIHZhbHVlKSB7XHJcbiAgICAgICAgYXBwZW5kSW5mb0VsZW1lbnQoY2xzLCBmYWxzZSwgcHJvcGVydHksIHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudFJlbGF0aW9uc2hpcChjbHMsIHJlbGF0aW9uc2hpcCkge1xyXG4gICAgICAgIGFwcGVuZEluZm9FbGVtZW50KGNscywgZmFsc2UsIHJlbGF0aW9uc2hpcCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwZW5kTm9kZSgpIHtcclxuICAgICAgICByZXR1cm4gbm9kZS5lbnRlcigpXHJcbiAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCdnJylcclxuICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICB2YXIgaGlnaGxpZ2h0LCBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzID0gJ25vZGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IGQubGFiZWxzWzBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWNvbihkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzICs9ICcgbm9kZS1pY29uJztcclxuICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgIGlmIChpbWFnZShkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzICs9ICcgbm9kZS1pbWFnZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oaWdobGlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHQgPSBvcHRpb25zLmhpZ2hsaWdodFtpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZC5sYWJlbHNbMF0gPT09IGhpZ2hsaWdodC5jbGFzcyAmJiBkLnByb3BlcnRpZXNbaGlnaGxpZ2h0LnByb3BlcnR5XSA9PT0gaGlnaGxpZ2h0LnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NlcyArPSAnIG5vZGUtaGlnaGxpZ2h0ZWQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2xhc3NlcztcclxuICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGQuZnggPSBkLmZ5ID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZUNsaWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMub25Ob2RlQ2xpY2soZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgIC5vbignZGJsY2xpY2snLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgc3RpY2tOb2RlKGQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRG91YmxlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5vbk5vZGVEb3VibGVDbGljayhkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUluZm8oZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VFbnRlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uTm9kZU1vdXNlRW50ZXIoZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgIC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5mbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhckluZm8oZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VMZWF2ZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uTm9kZU1vdXNlTGVhdmUoZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgIC5jYWxsKGQzLmRyYWcoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ3N0YXJ0JywgZHJhZ1N0YXJ0ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbignZHJhZycsIGRyYWdnZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbignZW5kJywgZHJhZ0VuZGVkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwZW5kTm9kZVRvR3JhcGgoKSB7XHJcbiAgICAgICAgdmFyIG4gPSBhcHBlbmROb2RlKCk7XHJcblxyXG4gICAgICAgIGFwcGVuZFJpbmdUb05vZGUobik7XHJcbiAgICAgICAgYXBwZW5kT3V0bGluZVRvTm9kZShuKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5pY29ucykge1xuICAgICAgICAgICAgYXBwZW5kVGV4dFRvTm9kZShuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLmltYWdlcykge1xuICAgICAgICAgICAgYXBwZW5kSW1hZ2VUb05vZGUobik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBlbmRPdXRsaW5lVG9Ob2RlKG5vZGUpIHtcclxuICAgICAgICByZXR1cm4gbm9kZS5hcHBlbmQoJ2NpcmNsZScpXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnb3V0bGluZScpXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cigncicsIG9wdGlvbnMubm9kZVJhZGl1cylcclxuICAgICAgICAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/IG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgOiBjbGFzczJjb2xvcihkLmxhYmVsc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgPyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKSA6IGNsYXNzMmRhcmtlbkNvbG9yKGQubGFiZWxzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCd0aXRsZScpLnRleHQoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b1N0cmluZyhkKTtcclxuICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZFJpbmdUb05vZGUobm9kZSkge1xyXG4gICAgICAgIHJldHVybiBub2RlLmFwcGVuZCgnY2lyY2xlJylcclxuICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdyaW5nJylcclxuICAgICAgICAgICAgICAgICAgIC5hdHRyKCdyJywgb3B0aW9ucy5ub2RlUmFkaXVzICogMS4xNilcclxuICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJ3RpdGxlJykudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvU3RyaW5nKGQpO1xyXG4gICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwZW5kVGV4dFRvTm9kZShub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUuYXBwZW5kKCd0ZXh0JylcclxuICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RleHQnICsgKGljb24oZCkgPyAnIGljb24nIDogJycpO1xyXG4gICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgJyNmZmZmZmYnKVxyXG4gICAgICAgICAgICAgICAgICAgLmF0dHIoJ2ZvbnQtc2l6ZScsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWNvbihkKSA/IChvcHRpb25zLm5vZGVSYWRpdXMgKyAncHgnKSA6ICcxMHB4JztcclxuICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcclxuICAgICAgICAgICAgICAgICAgIC5hdHRyKCd5JywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpY29uKGQpID8gKHBhcnNlSW50KE1hdGgucm91bmQob3B0aW9ucy5ub2RlUmFkaXVzICogMC4zMikpICsgJ3B4JykgOiAnNHB4JztcclxuICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAuaHRtbChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9pY29uID0gaWNvbihkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2ljb24gPyAnJiN4JyArIF9pY29uIDogZC5pZDtcclxuICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZFJhbmRvbURhdGFUb05vZGUoZCwgbWF4Tm9kZXNUb0dlbmVyYXRlKSB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSByYW5kb21EM0RhdGEoZCwgbWF4Tm9kZXNUb0dlbmVyYXRlKTtcclxuICAgICAgICB1cGRhdGVXaXRoTmVvNGpEYXRhKGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZFJlbGF0aW9uc2hpcCgpIHtcclxuICAgICAgICByZXR1cm4gcmVsYXRpb25zaGlwLmVudGVyKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnZycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdyZWxhdGlvbnNoaXAnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ2RibGNsaWNrJywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2soZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlSW5mbyhkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwZW5kT3V0bGluZVRvUmVsYXRpb25zaGlwKHIpIHtcclxuICAgICAgICByZXR1cm4gci5hcHBlbmQoJ3BhdGgnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ291dGxpbmUnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnI2E1YWJiNicpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignc3Ryb2tlJywgJ25vbmUnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBlbmRPdmVybGF5VG9SZWxhdGlvbnNoaXAocikge1xyXG4gICAgICAgIHJldHVybiByLmFwcGVuZCgncGF0aCcpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnb3ZlcmxheScpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZFRleHRUb1JlbGF0aW9uc2hpcChyKSB7XHJcbiAgICAgICAgcmV0dXJuIHIuYXBwZW5kKCd0ZXh0JylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICd0ZXh0JylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgJyMwMDAwMDAnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2ZvbnQtc2l6ZScsICc4cHgnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXHJcbiAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQudHlwZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZFJlbGF0aW9uc2hpcFRvR3JhcGgoKSB7XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcCA9IGFwcGVuZFJlbGF0aW9uc2hpcCgpLFxyXG4gICAgICAgICAgICB0ZXh0ID0gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHJlbGF0aW9uc2hpcCksXHJcbiAgICAgICAgICAgIG91dGxpbmUgPSBhcHBlbmRPdXRsaW5lVG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKSxcclxuICAgICAgICAgICAgb3ZlcmxheSA9IGFwcGVuZE92ZXJsYXlUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBvdXRsaW5lOiBvdXRsaW5lLFxyXG4gICAgICAgICAgICBvdmVybGF5OiBvdmVybGF5LFxyXG4gICAgICAgICAgICByZWxhdGlvbnNoaXA6IHJlbGF0aW9uc2hpcCxcclxuICAgICAgICAgICAgdGV4dDogdGV4dFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xhc3MyY29sb3IoY2xzKSB7XHJcbiAgICAgICAgdmFyIGNvbG9yID0gY2xhc3NlczJjb2xvcnNbY2xzXTtcclxuXHJcbiAgICAgICAgaWYgKCFjb2xvcikge1xyXG4vLyAgICAgICAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvcnNbTWF0aC5taW4obnVtQ2xhc3Nlcywgb3B0aW9ucy5jb2xvcnMubGVuZ3RoIC0gMSldO1xyXG4gICAgICAgICAgICBjb2xvciA9IG9wdGlvbnMuY29sb3JzW251bUNsYXNzZXMgJSBvcHRpb25zLmNvbG9ycy5sZW5ndGhdO1xyXG4gICAgICAgICAgICBjbGFzc2VzMmNvbG9yc1tjbHNdID0gY29sb3I7XHJcbiAgICAgICAgICAgIG51bUNsYXNzZXMrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjb2xvcjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbGFzczJkYXJrZW5Db2xvcihjbHMpIHtcclxuICAgICAgICByZXR1cm4gZDMucmdiKGNsYXNzMmNvbG9yKGNscykpLmRhcmtlcigxKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhckluZm8oKSB7XHJcbiAgICAgICAgaW5mby5odG1sKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjb2xvcigpIHtcclxuICAgICAgICByZXR1cm4gb3B0aW9ucy5jb2xvcnNbb3B0aW9ucy5jb2xvcnMubGVuZ3RoICogTWF0aC5yYW5kb20oKSA8PCAwXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjb2xvcnMoKSB7XHJcbiAgICAgICAgLy8gZDMuc2NoZW1lQ2F0ZWdvcnkxMCxcclxuICAgICAgICAvLyBkMy5zY2hlbWVDYXRlZ29yeTIwLFxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICcjNjhiZGY2JywgLy8gbGlnaHQgYmx1ZVxyXG4gICAgICAgICAgICAnIzZkY2U5ZScsIC8vIGdyZWVuICMxXHJcbiAgICAgICAgICAgICcjZmFhZmMyJywgLy8gbGlnaHQgcGlua1xyXG4gICAgICAgICAgICAnI2YyYmFmNicsIC8vIHB1cnBsZVxyXG4gICAgICAgICAgICAnI2ZmOTI4YycsIC8vIGxpZ2h0IHJlZFxyXG4gICAgICAgICAgICAnI2ZjZWE3ZScsIC8vIGxpZ2h0IHllbGxvd1xyXG4gICAgICAgICAgICAnI2ZmYzc2NicsIC8vIGxpZ2h0IG9yYW5nZVxyXG4gICAgICAgICAgICAnIzQwNWY5ZScsIC8vIG5hdnkgYmx1ZVxyXG4gICAgICAgICAgICAnI2E1YWJiNicsIC8vIGRhcmsgZ3JheVxyXG4gICAgICAgICAgICAnIzc4Y2VjYicsIC8vIGdyZWVuICMyLFxyXG4gICAgICAgICAgICAnI2I4OGNiYicsIC8vIGRhcmsgcHVycGxlXHJcbiAgICAgICAgICAgICcjY2VkMmQ5JywgLy8gbGlnaHQgZ3JheVxyXG4gICAgICAgICAgICAnI2U4NDY0NicsIC8vIGRhcmsgcmVkXHJcbiAgICAgICAgICAgICcjZmE1Zjg2JywgLy8gZGFyayBwaW5rXHJcbiAgICAgICAgICAgICcjZmZhYjFhJywgLy8gZGFyayBvcmFuZ2VcclxuICAgICAgICAgICAgJyNmY2RhMTknLCAvLyBkYXJrIHllbGxvd1xyXG4gICAgICAgICAgICAnIzc5N2I4MCcsIC8vIGJsYWNrXHJcbiAgICAgICAgICAgICcjYzlkOTZmJywgLy8gcGlzdGFjY2hpb1xyXG4gICAgICAgICAgICAnIzQ3OTkxZicsIC8vIGdyZWVuICMzXHJcbiAgICAgICAgICAgICcjNzBlZGVlJywgLy8gdHVycXVvaXNlXHJcbiAgICAgICAgICAgICcjZmY3NWVhJyAgLy8gcGlua1xyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29udGFpbnMoYXJyYXksIGlkKSB7XHJcbiAgICAgICAgdmFyIGZpbHRlciA9IGFycmF5LmZpbHRlcihmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmlkID09PSBpZDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpbHRlci5sZW5ndGggPiAwO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlZmF1bHRDb2xvcigpIHtcclxuICAgICAgICByZXR1cm4gb3B0aW9ucy5yZWxhdGlvbnNoaXBDb2xvcjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWZhdWx0RGFya2VuQ29sb3IoKSB7XHJcbiAgICAgICAgcmV0dXJuIGQzLnJnYihvcHRpb25zLmNvbG9yc1tvcHRpb25zLmNvbG9ycy5sZW5ndGggLSAxXSkuZGFya2VyKDEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYWdFbmRlZChkKSB7XHJcbiAgICAgICAgaWYgKCFkMy5ldmVudC5hY3RpdmUpIHtcclxuICAgICAgICAgICAgc2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEcmFnRW5kID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMub25Ob2RlRHJhZ0VuZChkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ2dlZChkKSB7XHJcbiAgICAgICAgc3RpY2tOb2RlKGQpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYWdTdGFydGVkKGQpIHtcclxuICAgICAgICBpZiAoIWQzLmV2ZW50LmFjdGl2ZSkge1xyXG4gICAgICAgICAgICBzaW11bGF0aW9uLmFscGhhVGFyZ2V0KDAuMykucmVzdGFydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZC5meCA9IGQueDtcclxuICAgICAgICBkLmZ5ID0gZC55O1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRHJhZ1N0YXJ0ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMub25Ob2RlRHJhZ1N0YXJ0KGQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBleHRlbmQob2JqMSwgb2JqMikge1xyXG4gICAgICAgIHZhciBvYmogPSB7fTtcclxuXHJcbiAgICAgICAgbWVyZ2Uob2JqLCBvYmoxKTtcclxuICAgICAgICBtZXJnZShvYmosIG9iajIpO1xyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZvbnRBd2Vzb21lSWNvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHsnZ2xhc3MnOidmMDAwJywnbXVzaWMnOidmMDAxJywnc2VhcmNoJzonZjAwMicsJ2VudmVsb3BlLW8nOidmMDAzJywnaGVhcnQnOidmMDA0Jywnc3Rhcic6J2YwMDUnLCdzdGFyLW8nOidmMDA2JywndXNlcic6J2YwMDcnLCdmaWxtJzonZjAwOCcsJ3RoLWxhcmdlJzonZjAwOScsJ3RoJzonZjAwYScsJ3RoLWxpc3QnOidmMDBiJywnY2hlY2snOidmMDBjJywncmVtb3ZlLGNsb3NlLHRpbWVzJzonZjAwZCcsJ3NlYXJjaC1wbHVzJzonZjAwZScsJ3NlYXJjaC1taW51cyc6J2YwMTAnLCdwb3dlci1vZmYnOidmMDExJywnc2lnbmFsJzonZjAxMicsJ2dlYXIsY29nJzonZjAxMycsJ3RyYXNoLW8nOidmMDE0JywnaG9tZSc6J2YwMTUnLCdmaWxlLW8nOidmMDE2JywnY2xvY2stbyc6J2YwMTcnLCdyb2FkJzonZjAxOCcsJ2Rvd25sb2FkJzonZjAxOScsJ2Fycm93LWNpcmNsZS1vLWRvd24nOidmMDFhJywnYXJyb3ctY2lyY2xlLW8tdXAnOidmMDFiJywnaW5ib3gnOidmMDFjJywncGxheS1jaXJjbGUtbyc6J2YwMWQnLCdyb3RhdGUtcmlnaHQscmVwZWF0JzonZjAxZScsJ3JlZnJlc2gnOidmMDIxJywnbGlzdC1hbHQnOidmMDIyJywnbG9jayc6J2YwMjMnLCdmbGFnJzonZjAyNCcsJ2hlYWRwaG9uZXMnOidmMDI1Jywndm9sdW1lLW9mZic6J2YwMjYnLCd2b2x1bWUtZG93bic6J2YwMjcnLCd2b2x1bWUtdXAnOidmMDI4JywncXJjb2RlJzonZjAyOScsJ2JhcmNvZGUnOidmMDJhJywndGFnJzonZjAyYicsJ3RhZ3MnOidmMDJjJywnYm9vayc6J2YwMmQnLCdib29rbWFyayc6J2YwMmUnLCdwcmludCc6J2YwMmYnLCdjYW1lcmEnOidmMDMwJywnZm9udCc6J2YwMzEnLCdib2xkJzonZjAzMicsJ2l0YWxpYyc6J2YwMzMnLCd0ZXh0LWhlaWdodCc6J2YwMzQnLCd0ZXh0LXdpZHRoJzonZjAzNScsJ2FsaWduLWxlZnQnOidmMDM2JywnYWxpZ24tY2VudGVyJzonZjAzNycsJ2FsaWduLXJpZ2h0JzonZjAzOCcsJ2FsaWduLWp1c3RpZnknOidmMDM5JywnbGlzdCc6J2YwM2EnLCdkZWRlbnQsb3V0ZGVudCc6J2YwM2InLCdpbmRlbnQnOidmMDNjJywndmlkZW8tY2FtZXJhJzonZjAzZCcsJ3Bob3RvLGltYWdlLHBpY3R1cmUtbyc6J2YwM2UnLCdwZW5jaWwnOidmMDQwJywnbWFwLW1hcmtlcic6J2YwNDEnLCdhZGp1c3QnOidmMDQyJywndGludCc6J2YwNDMnLCdlZGl0LHBlbmNpbC1zcXVhcmUtbyc6J2YwNDQnLCdzaGFyZS1zcXVhcmUtbyc6J2YwNDUnLCdjaGVjay1zcXVhcmUtbyc6J2YwNDYnLCdhcnJvd3MnOidmMDQ3Jywnc3RlcC1iYWNrd2FyZCc6J2YwNDgnLCdmYXN0LWJhY2t3YXJkJzonZjA0OScsJ2JhY2t3YXJkJzonZjA0YScsJ3BsYXknOidmMDRiJywncGF1c2UnOidmMDRjJywnc3RvcCc6J2YwNGQnLCdmb3J3YXJkJzonZjA0ZScsJ2Zhc3QtZm9yd2FyZCc6J2YwNTAnLCdzdGVwLWZvcndhcmQnOidmMDUxJywnZWplY3QnOidmMDUyJywnY2hldnJvbi1sZWZ0JzonZjA1MycsJ2NoZXZyb24tcmlnaHQnOidmMDU0JywncGx1cy1jaXJjbGUnOidmMDU1JywnbWludXMtY2lyY2xlJzonZjA1NicsJ3RpbWVzLWNpcmNsZSc6J2YwNTcnLCdjaGVjay1jaXJjbGUnOidmMDU4JywncXVlc3Rpb24tY2lyY2xlJzonZjA1OScsJ2luZm8tY2lyY2xlJzonZjA1YScsJ2Nyb3NzaGFpcnMnOidmMDViJywndGltZXMtY2lyY2xlLW8nOidmMDVjJywnY2hlY2stY2lyY2xlLW8nOidmMDVkJywnYmFuJzonZjA1ZScsJ2Fycm93LWxlZnQnOidmMDYwJywnYXJyb3ctcmlnaHQnOidmMDYxJywnYXJyb3ctdXAnOidmMDYyJywnYXJyb3ctZG93bic6J2YwNjMnLCdtYWlsLWZvcndhcmQsc2hhcmUnOidmMDY0JywnZXhwYW5kJzonZjA2NScsJ2NvbXByZXNzJzonZjA2NicsJ3BsdXMnOidmMDY3JywnbWludXMnOidmMDY4JywnYXN0ZXJpc2snOidmMDY5JywnZXhjbGFtYXRpb24tY2lyY2xlJzonZjA2YScsJ2dpZnQnOidmMDZiJywnbGVhZic6J2YwNmMnLCdmaXJlJzonZjA2ZCcsJ2V5ZSc6J2YwNmUnLCdleWUtc2xhc2gnOidmMDcwJywnd2FybmluZyxleGNsYW1hdGlvbi10cmlhbmdsZSc6J2YwNzEnLCdwbGFuZSc6J2YwNzInLCdjYWxlbmRhcic6J2YwNzMnLCdyYW5kb20nOidmMDc0JywnY29tbWVudCc6J2YwNzUnLCdtYWduZXQnOidmMDc2JywnY2hldnJvbi11cCc6J2YwNzcnLCdjaGV2cm9uLWRvd24nOidmMDc4JywncmV0d2VldCc6J2YwNzknLCdzaG9wcGluZy1jYXJ0JzonZjA3YScsJ2ZvbGRlcic6J2YwN2InLCdmb2xkZXItb3Blbic6J2YwN2MnLCdhcnJvd3Mtdic6J2YwN2QnLCdhcnJvd3MtaCc6J2YwN2UnLCdiYXItY2hhcnQtbyxiYXItY2hhcnQnOidmMDgwJywndHdpdHRlci1zcXVhcmUnOidmMDgxJywnZmFjZWJvb2stc3F1YXJlJzonZjA4MicsJ2NhbWVyYS1yZXRybyc6J2YwODMnLCdrZXknOidmMDg0JywnZ2VhcnMsY29ncyc6J2YwODUnLCdjb21tZW50cyc6J2YwODYnLCd0aHVtYnMtby11cCc6J2YwODcnLCd0aHVtYnMtby1kb3duJzonZjA4OCcsJ3N0YXItaGFsZic6J2YwODknLCdoZWFydC1vJzonZjA4YScsJ3NpZ24tb3V0JzonZjA4YicsJ2xpbmtlZGluLXNxdWFyZSc6J2YwOGMnLCd0aHVtYi10YWNrJzonZjA4ZCcsJ2V4dGVybmFsLWxpbmsnOidmMDhlJywnc2lnbi1pbic6J2YwOTAnLCd0cm9waHknOidmMDkxJywnZ2l0aHViLXNxdWFyZSc6J2YwOTInLCd1cGxvYWQnOidmMDkzJywnbGVtb24tbyc6J2YwOTQnLCdwaG9uZSc6J2YwOTUnLCdzcXVhcmUtbyc6J2YwOTYnLCdib29rbWFyay1vJzonZjA5NycsJ3Bob25lLXNxdWFyZSc6J2YwOTgnLCd0d2l0dGVyJzonZjA5OScsJ2ZhY2Vib29rLWYsZmFjZWJvb2snOidmMDlhJywnZ2l0aHViJzonZjA5YicsJ3VubG9jayc6J2YwOWMnLCdjcmVkaXQtY2FyZCc6J2YwOWQnLCdmZWVkLHJzcyc6J2YwOWUnLCdoZGQtbyc6J2YwYTAnLCdidWxsaG9ybic6J2YwYTEnLCdiZWxsJzonZjBmMycsJ2NlcnRpZmljYXRlJzonZjBhMycsJ2hhbmQtby1yaWdodCc6J2YwYTQnLCdoYW5kLW8tbGVmdCc6J2YwYTUnLCdoYW5kLW8tdXAnOidmMGE2JywnaGFuZC1vLWRvd24nOidmMGE3JywnYXJyb3ctY2lyY2xlLWxlZnQnOidmMGE4JywnYXJyb3ctY2lyY2xlLXJpZ2h0JzonZjBhOScsJ2Fycm93LWNpcmNsZS11cCc6J2YwYWEnLCdhcnJvdy1jaXJjbGUtZG93bic6J2YwYWInLCdnbG9iZSc6J2YwYWMnLCd3cmVuY2gnOidmMGFkJywndGFza3MnOidmMGFlJywnZmlsdGVyJzonZjBiMCcsJ2JyaWVmY2FzZSc6J2YwYjEnLCdhcnJvd3MtYWx0JzonZjBiMicsJ2dyb3VwLHVzZXJzJzonZjBjMCcsJ2NoYWluLGxpbmsnOidmMGMxJywnY2xvdWQnOidmMGMyJywnZmxhc2snOidmMGMzJywnY3V0LHNjaXNzb3JzJzonZjBjNCcsJ2NvcHksZmlsZXMtbyc6J2YwYzUnLCdwYXBlcmNsaXAnOidmMGM2Jywnc2F2ZSxmbG9wcHktbyc6J2YwYzcnLCdzcXVhcmUnOidmMGM4JywnbmF2aWNvbixyZW9yZGVyLGJhcnMnOidmMGM5JywnbGlzdC11bCc6J2YwY2EnLCdsaXN0LW9sJzonZjBjYicsJ3N0cmlrZXRocm91Z2gnOidmMGNjJywndW5kZXJsaW5lJzonZjBjZCcsJ3RhYmxlJzonZjBjZScsJ21hZ2ljJzonZjBkMCcsJ3RydWNrJzonZjBkMScsJ3BpbnRlcmVzdCc6J2YwZDInLCdwaW50ZXJlc3Qtc3F1YXJlJzonZjBkMycsJ2dvb2dsZS1wbHVzLXNxdWFyZSc6J2YwZDQnLCdnb29nbGUtcGx1cyc6J2YwZDUnLCdtb25leSc6J2YwZDYnLCdjYXJldC1kb3duJzonZjBkNycsJ2NhcmV0LXVwJzonZjBkOCcsJ2NhcmV0LWxlZnQnOidmMGQ5JywnY2FyZXQtcmlnaHQnOidmMGRhJywnY29sdW1ucyc6J2YwZGInLCd1bnNvcnRlZCxzb3J0JzonZjBkYycsJ3NvcnQtZG93bixzb3J0LWRlc2MnOidmMGRkJywnc29ydC11cCxzb3J0LWFzYyc6J2YwZGUnLCdlbnZlbG9wZSc6J2YwZTAnLCdsaW5rZWRpbic6J2YwZTEnLCdyb3RhdGUtbGVmdCx1bmRvJzonZjBlMicsJ2xlZ2FsLGdhdmVsJzonZjBlMycsJ2Rhc2hib2FyZCx0YWNob21ldGVyJzonZjBlNCcsJ2NvbW1lbnQtbyc6J2YwZTUnLCdjb21tZW50cy1vJzonZjBlNicsJ2ZsYXNoLGJvbHQnOidmMGU3Jywnc2l0ZW1hcCc6J2YwZTgnLCd1bWJyZWxsYSc6J2YwZTknLCdwYXN0ZSxjbGlwYm9hcmQnOidmMGVhJywnbGlnaHRidWxiLW8nOidmMGViJywnZXhjaGFuZ2UnOidmMGVjJywnY2xvdWQtZG93bmxvYWQnOidmMGVkJywnY2xvdWQtdXBsb2FkJzonZjBlZScsJ3VzZXItbWQnOidmMGYwJywnc3RldGhvc2NvcGUnOidmMGYxJywnc3VpdGNhc2UnOidmMGYyJywnYmVsbC1vJzonZjBhMicsJ2NvZmZlZSc6J2YwZjQnLCdjdXRsZXJ5JzonZjBmNScsJ2ZpbGUtdGV4dC1vJzonZjBmNicsJ2J1aWxkaW5nLW8nOidmMGY3JywnaG9zcGl0YWwtbyc6J2YwZjgnLCdhbWJ1bGFuY2UnOidmMGY5JywnbWVka2l0JzonZjBmYScsJ2ZpZ2h0ZXItamV0JzonZjBmYicsJ2JlZXInOidmMGZjJywnaC1zcXVhcmUnOidmMGZkJywncGx1cy1zcXVhcmUnOidmMGZlJywnYW5nbGUtZG91YmxlLWxlZnQnOidmMTAwJywnYW5nbGUtZG91YmxlLXJpZ2h0JzonZjEwMScsJ2FuZ2xlLWRvdWJsZS11cCc6J2YxMDInLCdhbmdsZS1kb3VibGUtZG93bic6J2YxMDMnLCdhbmdsZS1sZWZ0JzonZjEwNCcsJ2FuZ2xlLXJpZ2h0JzonZjEwNScsJ2FuZ2xlLXVwJzonZjEwNicsJ2FuZ2xlLWRvd24nOidmMTA3JywnZGVza3RvcCc6J2YxMDgnLCdsYXB0b3AnOidmMTA5JywndGFibGV0JzonZjEwYScsJ21vYmlsZS1waG9uZSxtb2JpbGUnOidmMTBiJywnY2lyY2xlLW8nOidmMTBjJywncXVvdGUtbGVmdCc6J2YxMGQnLCdxdW90ZS1yaWdodCc6J2YxMGUnLCdzcGlubmVyJzonZjExMCcsJ2NpcmNsZSc6J2YxMTEnLCdtYWlsLXJlcGx5LHJlcGx5JzonZjExMicsJ2dpdGh1Yi1hbHQnOidmMTEzJywnZm9sZGVyLW8nOidmMTE0JywnZm9sZGVyLW9wZW4tbyc6J2YxMTUnLCdzbWlsZS1vJzonZjExOCcsJ2Zyb3duLW8nOidmMTE5JywnbWVoLW8nOidmMTFhJywnZ2FtZXBhZCc6J2YxMWInLCdrZXlib2FyZC1vJzonZjExYycsJ2ZsYWctbyc6J2YxMWQnLCdmbGFnLWNoZWNrZXJlZCc6J2YxMWUnLCd0ZXJtaW5hbCc6J2YxMjAnLCdjb2RlJzonZjEyMScsJ21haWwtcmVwbHktYWxsLHJlcGx5LWFsbCc6J2YxMjInLCdzdGFyLWhhbGYtZW1wdHksc3Rhci1oYWxmLWZ1bGwsc3Rhci1oYWxmLW8nOidmMTIzJywnbG9jYXRpb24tYXJyb3cnOidmMTI0JywnY3JvcCc6J2YxMjUnLCdjb2RlLWZvcmsnOidmMTI2JywndW5saW5rLGNoYWluLWJyb2tlbic6J2YxMjcnLCdxdWVzdGlvbic6J2YxMjgnLCdpbmZvJzonZjEyOScsJ2V4Y2xhbWF0aW9uJzonZjEyYScsJ3N1cGVyc2NyaXB0JzonZjEyYicsJ3N1YnNjcmlwdCc6J2YxMmMnLCdlcmFzZXInOidmMTJkJywncHV6emxlLXBpZWNlJzonZjEyZScsJ21pY3JvcGhvbmUnOidmMTMwJywnbWljcm9waG9uZS1zbGFzaCc6J2YxMzEnLCdzaGllbGQnOidmMTMyJywnY2FsZW5kYXItbyc6J2YxMzMnLCdmaXJlLWV4dGluZ3Vpc2hlcic6J2YxMzQnLCdyb2NrZXQnOidmMTM1JywnbWF4Y2RuJzonZjEzNicsJ2NoZXZyb24tY2lyY2xlLWxlZnQnOidmMTM3JywnY2hldnJvbi1jaXJjbGUtcmlnaHQnOidmMTM4JywnY2hldnJvbi1jaXJjbGUtdXAnOidmMTM5JywnY2hldnJvbi1jaXJjbGUtZG93bic6J2YxM2EnLCdodG1sNSc6J2YxM2InLCdjc3MzJzonZjEzYycsJ2FuY2hvcic6J2YxM2QnLCd1bmxvY2stYWx0JzonZjEzZScsJ2J1bGxzZXllJzonZjE0MCcsJ2VsbGlwc2lzLWgnOidmMTQxJywnZWxsaXBzaXMtdic6J2YxNDInLCdyc3Mtc3F1YXJlJzonZjE0MycsJ3BsYXktY2lyY2xlJzonZjE0NCcsJ3RpY2tldCc6J2YxNDUnLCdtaW51cy1zcXVhcmUnOidmMTQ2JywnbWludXMtc3F1YXJlLW8nOidmMTQ3JywnbGV2ZWwtdXAnOidmMTQ4JywnbGV2ZWwtZG93bic6J2YxNDknLCdjaGVjay1zcXVhcmUnOidmMTRhJywncGVuY2lsLXNxdWFyZSc6J2YxNGInLCdleHRlcm5hbC1saW5rLXNxdWFyZSc6J2YxNGMnLCdzaGFyZS1zcXVhcmUnOidmMTRkJywnY29tcGFzcyc6J2YxNGUnLCd0b2dnbGUtZG93bixjYXJldC1zcXVhcmUtby1kb3duJzonZjE1MCcsJ3RvZ2dsZS11cCxjYXJldC1zcXVhcmUtby11cCc6J2YxNTEnLCd0b2dnbGUtcmlnaHQsY2FyZXQtc3F1YXJlLW8tcmlnaHQnOidmMTUyJywnZXVybyxldXInOidmMTUzJywnZ2JwJzonZjE1NCcsJ2RvbGxhcix1c2QnOidmMTU1JywncnVwZWUsaW5yJzonZjE1NicsJ2NueSxybWIseWVuLGpweSc6J2YxNTcnLCdydWJsZSxyb3VibGUscnViJzonZjE1OCcsJ3dvbixrcncnOidmMTU5JywnYml0Y29pbixidGMnOidmMTVhJywnZmlsZSc6J2YxNWInLCdmaWxlLXRleHQnOidmMTVjJywnc29ydC1hbHBoYS1hc2MnOidmMTVkJywnc29ydC1hbHBoYS1kZXNjJzonZjE1ZScsJ3NvcnQtYW1vdW50LWFzYyc6J2YxNjAnLCdzb3J0LWFtb3VudC1kZXNjJzonZjE2MScsJ3NvcnQtbnVtZXJpYy1hc2MnOidmMTYyJywnc29ydC1udW1lcmljLWRlc2MnOidmMTYzJywndGh1bWJzLXVwJzonZjE2NCcsJ3RodW1icy1kb3duJzonZjE2NScsJ3lvdXR1YmUtc3F1YXJlJzonZjE2NicsJ3lvdXR1YmUnOidmMTY3JywneGluZyc6J2YxNjgnLCd4aW5nLXNxdWFyZSc6J2YxNjknLCd5b3V0dWJlLXBsYXknOidmMTZhJywnZHJvcGJveCc6J2YxNmInLCdzdGFjay1vdmVyZmxvdyc6J2YxNmMnLCdpbnN0YWdyYW0nOidmMTZkJywnZmxpY2tyJzonZjE2ZScsJ2Fkbic6J2YxNzAnLCdiaXRidWNrZXQnOidmMTcxJywnYml0YnVja2V0LXNxdWFyZSc6J2YxNzInLCd0dW1ibHInOidmMTczJywndHVtYmxyLXNxdWFyZSc6J2YxNzQnLCdsb25nLWFycm93LWRvd24nOidmMTc1JywnbG9uZy1hcnJvdy11cCc6J2YxNzYnLCdsb25nLWFycm93LWxlZnQnOidmMTc3JywnbG9uZy1hcnJvdy1yaWdodCc6J2YxNzgnLCdhcHBsZSc6J2YxNzknLCd3aW5kb3dzJzonZjE3YScsJ2FuZHJvaWQnOidmMTdiJywnbGludXgnOidmMTdjJywnZHJpYmJibGUnOidmMTdkJywnc2t5cGUnOidmMTdlJywnZm91cnNxdWFyZSc6J2YxODAnLCd0cmVsbG8nOidmMTgxJywnZmVtYWxlJzonZjE4MicsJ21hbGUnOidmMTgzJywnZ2l0dGlwLGdyYXRpcGF5JzonZjE4NCcsJ3N1bi1vJzonZjE4NScsJ21vb24tbyc6J2YxODYnLCdhcmNoaXZlJzonZjE4NycsJ2J1Zyc6J2YxODgnLCd2ayc6J2YxODknLCd3ZWlibyc6J2YxOGEnLCdyZW5yZW4nOidmMThiJywncGFnZWxpbmVzJzonZjE4YycsJ3N0YWNrLWV4Y2hhbmdlJzonZjE4ZCcsJ2Fycm93LWNpcmNsZS1vLXJpZ2h0JzonZjE4ZScsJ2Fycm93LWNpcmNsZS1vLWxlZnQnOidmMTkwJywndG9nZ2xlLWxlZnQsY2FyZXQtc3F1YXJlLW8tbGVmdCc6J2YxOTEnLCdkb3QtY2lyY2xlLW8nOidmMTkyJywnd2hlZWxjaGFpcic6J2YxOTMnLCd2aW1lby1zcXVhcmUnOidmMTk0JywndHVya2lzaC1saXJhLHRyeSc6J2YxOTUnLCdwbHVzLXNxdWFyZS1vJzonZjE5NicsJ3NwYWNlLXNodXR0bGUnOidmMTk3Jywnc2xhY2snOidmMTk4JywnZW52ZWxvcGUtc3F1YXJlJzonZjE5OScsJ3dvcmRwcmVzcyc6J2YxOWEnLCdvcGVuaWQnOidmMTliJywnaW5zdGl0dXRpb24sYmFuayx1bml2ZXJzaXR5JzonZjE5YycsJ21vcnRhci1ib2FyZCxncmFkdWF0aW9uLWNhcCc6J2YxOWQnLCd5YWhvbyc6J2YxOWUnLCdnb29nbGUnOidmMWEwJywncmVkZGl0JzonZjFhMScsJ3JlZGRpdC1zcXVhcmUnOidmMWEyJywnc3R1bWJsZXVwb24tY2lyY2xlJzonZjFhMycsJ3N0dW1ibGV1cG9uJzonZjFhNCcsJ2RlbGljaW91cyc6J2YxYTUnLCdkaWdnJzonZjFhNicsJ3BpZWQtcGlwZXItcHAnOidmMWE3JywncGllZC1waXBlci1hbHQnOidmMWE4JywnZHJ1cGFsJzonZjFhOScsJ2pvb21sYSc6J2YxYWEnLCdsYW5ndWFnZSc6J2YxYWInLCdmYXgnOidmMWFjJywnYnVpbGRpbmcnOidmMWFkJywnY2hpbGQnOidmMWFlJywncGF3JzonZjFiMCcsJ3Nwb29uJzonZjFiMScsJ2N1YmUnOidmMWIyJywnY3ViZXMnOidmMWIzJywnYmVoYW5jZSc6J2YxYjQnLCdiZWhhbmNlLXNxdWFyZSc6J2YxYjUnLCdzdGVhbSc6J2YxYjYnLCdzdGVhbS1zcXVhcmUnOidmMWI3JywncmVjeWNsZSc6J2YxYjgnLCdhdXRvbW9iaWxlLGNhcic6J2YxYjknLCdjYWIsdGF4aSc6J2YxYmEnLCd0cmVlJzonZjFiYicsJ3Nwb3RpZnknOidmMWJjJywnZGV2aWFudGFydCc6J2YxYmQnLCdzb3VuZGNsb3VkJzonZjFiZScsJ2RhdGFiYXNlJzonZjFjMCcsJ2ZpbGUtcGRmLW8nOidmMWMxJywnZmlsZS13b3JkLW8nOidmMWMyJywnZmlsZS1leGNlbC1vJzonZjFjMycsJ2ZpbGUtcG93ZXJwb2ludC1vJzonZjFjNCcsJ2ZpbGUtcGhvdG8tbyxmaWxlLXBpY3R1cmUtbyxmaWxlLWltYWdlLW8nOidmMWM1JywnZmlsZS16aXAtbyxmaWxlLWFyY2hpdmUtbyc6J2YxYzYnLCdmaWxlLXNvdW5kLW8sZmlsZS1hdWRpby1vJzonZjFjNycsJ2ZpbGUtbW92aWUtbyxmaWxlLXZpZGVvLW8nOidmMWM4JywnZmlsZS1jb2RlLW8nOidmMWM5JywndmluZSc6J2YxY2EnLCdjb2RlcGVuJzonZjFjYicsJ2pzZmlkZGxlJzonZjFjYycsJ2xpZmUtYm91eSxsaWZlLWJ1b3ksbGlmZS1zYXZlcixzdXBwb3J0LGxpZmUtcmluZyc6J2YxY2QnLCdjaXJjbGUtby1ub3RjaCc6J2YxY2UnLCdyYSxyZXNpc3RhbmNlLHJlYmVsJzonZjFkMCcsJ2dlLGVtcGlyZSc6J2YxZDEnLCdnaXQtc3F1YXJlJzonZjFkMicsJ2dpdCc6J2YxZDMnLCd5LWNvbWJpbmF0b3Itc3F1YXJlLHljLXNxdWFyZSxoYWNrZXItbmV3cyc6J2YxZDQnLCd0ZW5jZW50LXdlaWJvJzonZjFkNScsJ3FxJzonZjFkNicsJ3dlY2hhdCx3ZWl4aW4nOidmMWQ3Jywnc2VuZCxwYXBlci1wbGFuZSc6J2YxZDgnLCdzZW5kLW8scGFwZXItcGxhbmUtbyc6J2YxZDknLCdoaXN0b3J5JzonZjFkYScsJ2NpcmNsZS10aGluJzonZjFkYicsJ2hlYWRlcic6J2YxZGMnLCdwYXJhZ3JhcGgnOidmMWRkJywnc2xpZGVycyc6J2YxZGUnLCdzaGFyZS1hbHQnOidmMWUwJywnc2hhcmUtYWx0LXNxdWFyZSc6J2YxZTEnLCdib21iJzonZjFlMicsJ3NvY2Nlci1iYWxsLW8sZnV0Ym9sLW8nOidmMWUzJywndHR5JzonZjFlNCcsJ2Jpbm9jdWxhcnMnOidmMWU1JywncGx1Zyc6J2YxZTYnLCdzbGlkZXNoYXJlJzonZjFlNycsJ3R3aXRjaCc6J2YxZTgnLCd5ZWxwJzonZjFlOScsJ25ld3NwYXBlci1vJzonZjFlYScsJ3dpZmknOidmMWViJywnY2FsY3VsYXRvcic6J2YxZWMnLCdwYXlwYWwnOidmMWVkJywnZ29vZ2xlLXdhbGxldCc6J2YxZWUnLCdjYy12aXNhJzonZjFmMCcsJ2NjLW1hc3RlcmNhcmQnOidmMWYxJywnY2MtZGlzY292ZXInOidmMWYyJywnY2MtYW1leCc6J2YxZjMnLCdjYy1wYXlwYWwnOidmMWY0JywnY2Mtc3RyaXBlJzonZjFmNScsJ2JlbGwtc2xhc2gnOidmMWY2JywnYmVsbC1zbGFzaC1vJzonZjFmNycsJ3RyYXNoJzonZjFmOCcsJ2NvcHlyaWdodCc6J2YxZjknLCdhdCc6J2YxZmEnLCdleWVkcm9wcGVyJzonZjFmYicsJ3BhaW50LWJydXNoJzonZjFmYycsJ2JpcnRoZGF5LWNha2UnOidmMWZkJywnYXJlYS1jaGFydCc6J2YxZmUnLCdwaWUtY2hhcnQnOidmMjAwJywnbGluZS1jaGFydCc6J2YyMDEnLCdsYXN0Zm0nOidmMjAyJywnbGFzdGZtLXNxdWFyZSc6J2YyMDMnLCd0b2dnbGUtb2ZmJzonZjIwNCcsJ3RvZ2dsZS1vbic6J2YyMDUnLCdiaWN5Y2xlJzonZjIwNicsJ2J1cyc6J2YyMDcnLCdpb3hob3N0JzonZjIwOCcsJ2FuZ2VsbGlzdCc6J2YyMDknLCdjYyc6J2YyMGEnLCdzaGVrZWwsc2hlcWVsLGlscyc6J2YyMGInLCdtZWFucGF0aCc6J2YyMGMnLCdidXlzZWxsYWRzJzonZjIwZCcsJ2Nvbm5lY3RkZXZlbG9wJzonZjIwZScsJ2Rhc2hjdWJlJzonZjIxMCcsJ2ZvcnVtYmVlJzonZjIxMScsJ2xlYW5wdWInOidmMjEyJywnc2VsbHN5JzonZjIxMycsJ3NoaXJ0c2luYnVsayc6J2YyMTQnLCdzaW1wbHlidWlsdCc6J2YyMTUnLCdza3lhdGxhcyc6J2YyMTYnLCdjYXJ0LXBsdXMnOidmMjE3JywnY2FydC1hcnJvdy1kb3duJzonZjIxOCcsJ2RpYW1vbmQnOidmMjE5Jywnc2hpcCc6J2YyMWEnLCd1c2VyLXNlY3JldCc6J2YyMWInLCdtb3RvcmN5Y2xlJzonZjIxYycsJ3N0cmVldC12aWV3JzonZjIxZCcsJ2hlYXJ0YmVhdCc6J2YyMWUnLCd2ZW51cyc6J2YyMjEnLCdtYXJzJzonZjIyMicsJ21lcmN1cnknOidmMjIzJywnaW50ZXJzZXgsdHJhbnNnZW5kZXInOidmMjI0JywndHJhbnNnZW5kZXItYWx0JzonZjIyNScsJ3ZlbnVzLWRvdWJsZSc6J2YyMjYnLCdtYXJzLWRvdWJsZSc6J2YyMjcnLCd2ZW51cy1tYXJzJzonZjIyOCcsJ21hcnMtc3Ryb2tlJzonZjIyOScsJ21hcnMtc3Ryb2tlLXYnOidmMjJhJywnbWFycy1zdHJva2UtaCc6J2YyMmInLCduZXV0ZXInOidmMjJjJywnZ2VuZGVybGVzcyc6J2YyMmQnLCdmYWNlYm9vay1vZmZpY2lhbCc6J2YyMzAnLCdwaW50ZXJlc3QtcCc6J2YyMzEnLCd3aGF0c2FwcCc6J2YyMzInLCdzZXJ2ZXInOidmMjMzJywndXNlci1wbHVzJzonZjIzNCcsJ3VzZXItdGltZXMnOidmMjM1JywnaG90ZWwsYmVkJzonZjIzNicsJ3ZpYWNvaW4nOidmMjM3JywndHJhaW4nOidmMjM4Jywnc3Vid2F5JzonZjIzOScsJ21lZGl1bSc6J2YyM2EnLCd5Yyx5LWNvbWJpbmF0b3InOidmMjNiJywnb3B0aW4tbW9uc3Rlcic6J2YyM2MnLCdvcGVuY2FydCc6J2YyM2QnLCdleHBlZGl0ZWRzc2wnOidmMjNlJywnYmF0dGVyeS00LGJhdHRlcnktZnVsbCc6J2YyNDAnLCdiYXR0ZXJ5LTMsYmF0dGVyeS10aHJlZS1xdWFydGVycyc6J2YyNDEnLCdiYXR0ZXJ5LTIsYmF0dGVyeS1oYWxmJzonZjI0MicsJ2JhdHRlcnktMSxiYXR0ZXJ5LXF1YXJ0ZXInOidmMjQzJywnYmF0dGVyeS0wLGJhdHRlcnktZW1wdHknOidmMjQ0JywnbW91c2UtcG9pbnRlcic6J2YyNDUnLCdpLWN1cnNvcic6J2YyNDYnLCdvYmplY3QtZ3JvdXAnOidmMjQ3Jywnb2JqZWN0LXVuZ3JvdXAnOidmMjQ4Jywnc3RpY2t5LW5vdGUnOidmMjQ5Jywnc3RpY2t5LW5vdGUtbyc6J2YyNGEnLCdjYy1qY2InOidmMjRiJywnY2MtZGluZXJzLWNsdWInOidmMjRjJywnY2xvbmUnOidmMjRkJywnYmFsYW5jZS1zY2FsZSc6J2YyNGUnLCdob3VyZ2xhc3Mtbyc6J2YyNTAnLCdob3VyZ2xhc3MtMSxob3VyZ2xhc3Mtc3RhcnQnOidmMjUxJywnaG91cmdsYXNzLTIsaG91cmdsYXNzLWhhbGYnOidmMjUyJywnaG91cmdsYXNzLTMsaG91cmdsYXNzLWVuZCc6J2YyNTMnLCdob3VyZ2xhc3MnOidmMjU0JywnaGFuZC1ncmFiLW8saGFuZC1yb2NrLW8nOidmMjU1JywnaGFuZC1zdG9wLW8saGFuZC1wYXBlci1vJzonZjI1NicsJ2hhbmQtc2Npc3NvcnMtbyc6J2YyNTcnLCdoYW5kLWxpemFyZC1vJzonZjI1OCcsJ2hhbmQtc3BvY2stbyc6J2YyNTknLCdoYW5kLXBvaW50ZXItbyc6J2YyNWEnLCdoYW5kLXBlYWNlLW8nOidmMjViJywndHJhZGVtYXJrJzonZjI1YycsJ3JlZ2lzdGVyZWQnOidmMjVkJywnY3JlYXRpdmUtY29tbW9ucyc6J2YyNWUnLCdnZyc6J2YyNjAnLCdnZy1jaXJjbGUnOidmMjYxJywndHJpcGFkdmlzb3InOidmMjYyJywnb2Rub2tsYXNzbmlraSc6J2YyNjMnLCdvZG5va2xhc3NuaWtpLXNxdWFyZSc6J2YyNjQnLCdnZXQtcG9ja2V0JzonZjI2NScsJ3dpa2lwZWRpYS13JzonZjI2NicsJ3NhZmFyaSc6J2YyNjcnLCdjaHJvbWUnOidmMjY4JywnZmlyZWZveCc6J2YyNjknLCdvcGVyYSc6J2YyNmEnLCdpbnRlcm5ldC1leHBsb3Jlcic6J2YyNmInLCd0dix0ZWxldmlzaW9uJzonZjI2YycsJ2NvbnRhbyc6J2YyNmQnLCc1MDBweCc6J2YyNmUnLCdhbWF6b24nOidmMjcwJywnY2FsZW5kYXItcGx1cy1vJzonZjI3MScsJ2NhbGVuZGFyLW1pbnVzLW8nOidmMjcyJywnY2FsZW5kYXItdGltZXMtbyc6J2YyNzMnLCdjYWxlbmRhci1jaGVjay1vJzonZjI3NCcsJ2luZHVzdHJ5JzonZjI3NScsJ21hcC1waW4nOidmMjc2JywnbWFwLXNpZ25zJzonZjI3NycsJ21hcC1vJzonZjI3OCcsJ21hcCc6J2YyNzknLCdjb21tZW50aW5nJzonZjI3YScsJ2NvbW1lbnRpbmctbyc6J2YyN2InLCdob3V6eic6J2YyN2MnLCd2aW1lbyc6J2YyN2QnLCdibGFjay10aWUnOidmMjdlJywnZm9udGljb25zJzonZjI4MCcsJ3JlZGRpdC1hbGllbic6J2YyODEnLCdlZGdlJzonZjI4MicsJ2NyZWRpdC1jYXJkLWFsdCc6J2YyODMnLCdjb2RpZXBpZSc6J2YyODQnLCdtb2R4JzonZjI4NScsJ2ZvcnQtYXdlc29tZSc6J2YyODYnLCd1c2InOidmMjg3JywncHJvZHVjdC1odW50JzonZjI4OCcsJ21peGNsb3VkJzonZjI4OScsJ3NjcmliZCc6J2YyOGEnLCdwYXVzZS1jaXJjbGUnOidmMjhiJywncGF1c2UtY2lyY2xlLW8nOidmMjhjJywnc3RvcC1jaXJjbGUnOidmMjhkJywnc3RvcC1jaXJjbGUtbyc6J2YyOGUnLCdzaG9wcGluZy1iYWcnOidmMjkwJywnc2hvcHBpbmctYmFza2V0JzonZjI5MScsJ2hhc2h0YWcnOidmMjkyJywnYmx1ZXRvb3RoJzonZjI5MycsJ2JsdWV0b290aC1iJzonZjI5NCcsJ3BlcmNlbnQnOidmMjk1JywnZ2l0bGFiJzonZjI5NicsJ3dwYmVnaW5uZXInOidmMjk3Jywnd3Bmb3Jtcyc6J2YyOTgnLCdlbnZpcmEnOidmMjk5JywndW5pdmVyc2FsLWFjY2Vzcyc6J2YyOWEnLCd3aGVlbGNoYWlyLWFsdCc6J2YyOWInLCdxdWVzdGlvbi1jaXJjbGUtbyc6J2YyOWMnLCdibGluZCc6J2YyOWQnLCdhdWRpby1kZXNjcmlwdGlvbic6J2YyOWUnLCd2b2x1bWUtY29udHJvbC1waG9uZSc6J2YyYTAnLCdicmFpbGxlJzonZjJhMScsJ2Fzc2lzdGl2ZS1saXN0ZW5pbmctc3lzdGVtcyc6J2YyYTInLCdhc2wtaW50ZXJwcmV0aW5nLGFtZXJpY2FuLXNpZ24tbGFuZ3VhZ2UtaW50ZXJwcmV0aW5nJzonZjJhMycsJ2RlYWZuZXNzLGhhcmQtb2YtaGVhcmluZyxkZWFmJzonZjJhNCcsJ2dsaWRlJzonZjJhNScsJ2dsaWRlLWcnOidmMmE2Jywnc2lnbmluZyxzaWduLWxhbmd1YWdlJzonZjJhNycsJ2xvdy12aXNpb24nOidmMmE4JywndmlhZGVvJzonZjJhOScsJ3ZpYWRlby1zcXVhcmUnOidmMmFhJywnc25hcGNoYXQnOidmMmFiJywnc25hcGNoYXQtZ2hvc3QnOidmMmFjJywnc25hcGNoYXQtc3F1YXJlJzonZjJhZCcsJ3BpZWQtcGlwZXInOidmMmFlJywnZmlyc3Qtb3JkZXInOidmMmIwJywneW9hc3QnOidmMmIxJywndGhlbWVpc2xlJzonZjJiMicsJ2dvb2dsZS1wbHVzLWNpcmNsZSxnb29nbGUtcGx1cy1vZmZpY2lhbCc6J2YyYjMnLCdmYSxmb250LWF3ZXNvbWUnOidmMmI0J307XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaWNvbihkKSB7XHJcbiAgICAgICAgdmFyIGNvZGU7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmljb25NYXAgJiYgb3B0aW9ucy5zaG93SWNvbnMgJiYgb3B0aW9ucy5pY29ucykge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV0gJiYgb3B0aW9ucy5pY29uTWFwW29wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dXSkge1xyXG4gICAgICAgICAgICAgICAgY29kZSA9IG9wdGlvbnMuaWNvbk1hcFtvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXV07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pY29uTWFwW2QubGFiZWxzWzBdXSkge1xyXG4gICAgICAgICAgICAgICAgY29kZSA9IG9wdGlvbnMuaWNvbk1hcFtkLmxhYmVsc1swXV07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV0pIHtcclxuICAgICAgICAgICAgICAgIGNvZGUgPSBvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvZGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW1hZ2UoZCkge1xyXG4gICAgICAgIHZhciBpLCBpbWFnZXNGb3JMYWJlbCwgaW1nLCBpbWdMZXZlbCwgbGFiZWwsIGxhYmVsUHJvcGVydHlWYWx1ZSwgcHJvcGVydHksIHZhbHVlO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy5pbWFnZXMpIHtcclxuICAgICAgICAgICAgaW1hZ2VzRm9yTGFiZWwgPSBvcHRpb25zLmltYWdlTWFwW2QubGFiZWxzWzBdXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbWFnZXNGb3JMYWJlbCkge1xyXG4gICAgICAgICAgICAgICAgaW1nTGV2ZWwgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbWFnZXNGb3JMYWJlbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsUHJvcGVydHlWYWx1ZSA9IGltYWdlc0ZvckxhYmVsW2ldLnNwbGl0KCd8Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBsYWJlbFByb3BlcnR5VmFsdWVbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZVswXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkLmxhYmVsc1swXSA9PT0gbGFiZWwgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCFwcm9wZXJ0eSB8fCBkLnByb3BlcnRpZXNbcHJvcGVydHldICE9PSB1bmRlZmluZWQpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICghdmFsdWUgfHwgZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSA9PT0gdmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbFByb3BlcnR5VmFsdWUubGVuZ3RoID4gaW1nTGV2ZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZyA9IG9wdGlvbnMuaW1hZ2VzW2ltYWdlc0ZvckxhYmVsW2ldXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ0xldmVsID0gbGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGltZztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KF9zZWxlY3RvciwgX29wdGlvbnMpIHtcclxuICAgICAgICBpbml0SWNvbk1hcCgpO1xyXG5cclxuICAgICAgICBtZXJnZShvcHRpb25zLCBfb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmljb25zKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuc2hvd0ljb25zID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9ucy5taW5Db2xsaXNpb24pIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5taW5Db2xsaXNpb24gPSBvcHRpb25zLm5vZGVSYWRpdXMgKiAyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5pdEltYWdlTWFwKCk7XHJcblxyXG4gICAgICAgIHNlbGVjdG9yID0gX3NlbGVjdG9yO1xyXG5cclxuICAgICAgICBjb250YWluZXIgPSBkMy5zZWxlY3Qoc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBjb250YWluZXIuYXR0cignY2xhc3MnLCAnbmVvNGpkMycpXHJcbiAgICAgICAgICAgICAgICAgLmh0bWwoJycpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy5pbmZvUGFuZWwpIHtcclxuICAgICAgICAgICAgaW5mbyA9IGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwZW5kR3JhcGgoY29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgc2ltdWxhdGlvbiA9IGluaXRTaW11bGF0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLm5lbzRqRGF0YSkge1xyXG4gICAgICAgICAgICBsb2FkTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubmVvNGpEYXRhVXJsKSB7XHJcbiAgICAgICAgICAgIGxvYWROZW80akRhdGFGcm9tVXJsKG9wdGlvbnMubmVvNGpEYXRhVXJsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogYm90aCBuZW80akRhdGEgYW5kIG5lbzRqRGF0YVVybCBhcmUgZW1wdHkhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRJY29uTWFwKCkge1xyXG4gICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMuaWNvbk1hcCkuZm9yRWFjaChmdW5jdGlvbihrZXksIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KCcsJyksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdGlvbnMuaWNvbk1hcFtrZXldO1xyXG5cclxuICAgICAgICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5pY29uTWFwW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEltYWdlTWFwKCkge1xyXG4gICAgICAgIHZhciBrZXksIGtleXMsIHNlbGVjdG9yO1xyXG5cclxuICAgICAgICBmb3IgKGtleSBpbiBvcHRpb25zLmltYWdlcykge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5pbWFnZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAga2V5cyA9IGtleS5zcGxpdCgnfCcpO1xyXG5cbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXSA9IFtrZXldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbml0U2ltdWxhdGlvbigpIHtcclxuICAgICAgICB2YXIgc2ltdWxhdGlvbiA9IGQzLmZvcmNlU2ltdWxhdGlvbigpXHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgLnZlbG9jaXR5RGVjYXkoMC44KVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JjZSgneCcsIGQzLmZvcmNlKCkuc3RyZW5ndGgoMC4wMDIpKVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JjZSgneScsIGQzLmZvcmNlKCkuc3RyZW5ndGgoMC4wMDIpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAuZm9yY2UoJ2NvbGxpZGUnLCBkMy5mb3JjZUNvbGxpZGUoKS5yYWRpdXMoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWluQ29sbGlzaW9uO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5pdGVyYXRpb25zKDIpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAuZm9yY2UoJ2NoYXJnZScsIGQzLmZvcmNlTWFueUJvZHkoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZvcmNlKCdsaW5rJywgZDMuZm9yY2VMaW5rKCkuaWQoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAuZm9yY2UoJ2NlbnRlcicsIGQzLmZvcmNlQ2VudGVyKHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMiwgc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gMikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbigndGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuem9vbUZpdCAmJiAhanVzdExvYWRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvb21GaXQoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc2ltdWxhdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkTmVvNGpEYXRhKCkge1xyXG4gICAgICAgIG5vZGVzID0gW107XHJcbiAgICAgICAgcmVsYXRpb25zaGlwcyA9IFtdO1xyXG5cclxuICAgICAgICB1cGRhdGVXaXRoTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkTmVvNGpEYXRhRnJvbVVybChuZW80akRhdGFVcmwpIHtcclxuICAgICAgICBub2RlcyA9IFtdO1xyXG4gICAgICAgIHJlbGF0aW9uc2hpcHMgPSBbXTtcclxuXHJcbiAgICAgICAgZDMuanNvbihuZW80akRhdGFVcmwsIGZ1bmN0aW9uKGVycm9yLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHVwZGF0ZVdpdGhOZW80akRhdGEoZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWVyZ2UodGFyZ2V0LCBzb3VyY2UpIHtcclxuICAgICAgICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0W3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbmVvNGpEYXRhVG9EM0RhdGEoZGF0YSkge1xyXG4gICAgICAgIHZhciBncmFwaCA9IHtcclxuICAgICAgICAgICAgbm9kZXM6IFtdLFxyXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBzOiBbXVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGRhdGEucmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb250YWlucyhncmFwaC5ub2Rlcywgbm9kZS5pZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JhcGgubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHMuZm9yRWFjaChmdW5jdGlvbihyZWxhdGlvbnNoaXApIHtcclxuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNoaXAuc291cmNlID0gcmVsYXRpb25zaGlwLnN0YXJ0Tm9kZTtcclxuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNoaXAudGFyZ2V0ID0gcmVsYXRpb25zaGlwLmVuZE5vZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGgucmVsYXRpb25zaGlwcy5wdXNoKHJlbGF0aW9uc2hpcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHMuc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEuc291cmNlID4gYi5zb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhLnNvdXJjZSA8IGIuc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS50YXJnZXQgPiBiLnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLnRhcmdldCA8IGIudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IDAgJiYgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLnNvdXJjZSA9PT0gZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ktMV0uc291cmNlICYmIGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS50YXJnZXQgPT09IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpLTFdLnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0ubGlua251bSA9IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0ubGlua251bSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLmxpbmtudW0gPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncmFwaDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByYW5kb21EM0RhdGEoZCwgbWF4Tm9kZXNUb0dlbmVyYXRlKSB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBub2RlczogW10sXHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnNoaXBzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpLFxyXG4gICAgICAgICAgICBsYWJlbCxcclxuICAgICAgICAgICAgbm9kZSxcclxuICAgICAgICAgICAgbnVtTm9kZXMgPSAobWF4Tm9kZXNUb0dlbmVyYXRlICogTWF0aC5yYW5kb20oKSA8PCAwKSArIDEsXHJcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcCxcclxuICAgICAgICAgICAgcyA9IHNpemUoKTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcclxuICAgICAgICAgICAgbGFiZWwgPSByYW5kb21MYWJlbCgpO1xyXG5cclxuICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBzLm5vZGVzICsgMSArIGksXHJcbiAgICAgICAgICAgICAgICBsYWJlbHM6IFtsYWJlbF0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tOiBsYWJlbFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHg6IGQueCxcclxuICAgICAgICAgICAgICAgIHk6IGQueVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZGF0YS5ub2Rlc1tkYXRhLm5vZGVzLmxlbmd0aF0gPSBub2RlO1xyXG5cclxuICAgICAgICAgICAgcmVsYXRpb25zaGlwID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IHMucmVsYXRpb25zaGlwcyArIDEgKyBpLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogbGFiZWwudG9VcHBlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0Tm9kZTogZC5pZCxcclxuICAgICAgICAgICAgICAgIGVuZE5vZGU6IHMubm9kZXMgKyAxICsgaSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBmcm9tOiBEYXRlLm5vdygpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc291cmNlOiBkLmlkLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBzLm5vZGVzICsgMSArIGksXHJcbiAgICAgICAgICAgICAgICBsaW5rbnVtOiBzLnJlbGF0aW9uc2hpcHMgKyAxICsgaVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZGF0YS5yZWxhdGlvbnNoaXBzW2RhdGEucmVsYXRpb25zaGlwcy5sZW5ndGhdID0gcmVsYXRpb25zaGlwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmFuZG9tTGFiZWwoKSB7XHJcbiAgICAgICAgdmFyIGljb25zID0gT2JqZWN0LmtleXMob3B0aW9ucy5pY29uTWFwKTtcclxuICAgICAgICByZXR1cm4gaWNvbnNbaWNvbnMubGVuZ3RoICogTWF0aC5yYW5kb20oKSA8PCAwXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByb3RhdGUoY3gsIGN5LCB4LCB5LCBhbmdsZSkge1xyXG4gICAgICAgIHZhciByYWRpYW5zID0gKE1hdGguUEkgLyAxODApICogYW5nbGUsXHJcbiAgICAgICAgICAgIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxyXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKSxcclxuICAgICAgICAgICAgbnggPSAoY29zICogKHggLSBjeCkpICsgKHNpbiAqICh5IC0gY3kpKSArIGN4LFxyXG4gICAgICAgICAgICBueSA9IChjb3MgKiAoeSAtIGN5KSkgLSAoc2luICogKHggLSBjeCkpICsgY3k7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHg6IG54LCB5OiBueSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJvdGF0ZVBvaW50KGMsIHAsIGFuZ2xlKSB7XHJcbiAgICAgICAgcmV0dXJuIHJvdGF0ZShjLngsIGMueSwgcC54LCBwLnksIGFuZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByb3RhdGlvbihzb3VyY2UsIHRhcmdldCkge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRhcmdldC55IC0gc291cmNlLnksIHRhcmdldC54IC0gc291cmNlLngpICogMTgwIC8gTWF0aC5QSTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzaXplKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5vZGVzOiBub2Rlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMubGVuZ3RoXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuLypcclxuICAgIGZ1bmN0aW9uIHNtb290aFRyYW5zZm9ybShlbGVtLCB0cmFuc2xhdGUsIHNjYWxlKSB7XHJcbiAgICAgICAgdmFyIGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9IDUwMDAsXHJcbiAgICAgICAgICAgIHRpbWVvdXRNaWxsaXNlY29uZHMgPSA1MCxcclxuICAgICAgICAgICAgc3RlcHMgPSBwYXJzZUludChhbmltYXRpb25NaWxsaXNlY29uZHMgLyB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCAxLCBzdGVwcyk7XHJcbiAgICAgICAgfSwgdGltZW91dE1pbGxpc2Vjb25kcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCBzdGVwLCBzdGVwcykge1xyXG4gICAgICAgIHZhciBwcm9ncmVzcyA9IHN0ZXAgLyBzdGVwcztcclxuXHJcbiAgICAgICAgZWxlbS5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyAodHJhbnNsYXRlWzBdICogcHJvZ3Jlc3MpICsgJywgJyArICh0cmFuc2xhdGVbMV0gKiBwcm9ncmVzcykgKyAnKSBzY2FsZSgnICsgKHNjYWxlICogcHJvZ3Jlc3MpICsgJyknKTtcclxuXHJcbiAgICAgICAgaWYgKHN0ZXAgPCBzdGVwcykge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCBzdGVwICsgMSwgc3RlcHMpO1xyXG4gICAgICAgICAgICB9LCB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiovXHJcbiAgICBmdW5jdGlvbiBzdGlja05vZGUoZCkge1xyXG4gICAgICAgIGQuZnggPSBkMy5ldmVudC54O1xyXG4gICAgICAgIGQuZnkgPSBkMy5ldmVudC55O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRpY2soKSB7XHJcbiAgICAgICAgdGlja05vZGVzKCk7XHJcbiAgICAgICAgdGlja1JlbGF0aW9uc2hpcHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0aWNrTm9kZXMoKSB7XHJcbiAgICAgICAgaWYgKG5vZGUpIHtcclxuICAgICAgICAgICAgbm9kZS5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgZC54ICsgJywgJyArIGQueSArICcpJztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzKCkge1xyXG4gICAgICAgIGlmIChyZWxhdGlvbnNoaXApIHtcclxuICAgICAgICAgICAgcmVsYXRpb25zaGlwLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhbmdsZSA9IHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgZC5zb3VyY2UueCArICcsICcgKyBkLnNvdXJjZS55ICsgJykgcm90YXRlKCcgKyBhbmdsZSArICcpJztcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aWNrUmVsYXRpb25zaGlwc1RleHRzKCk7XHJcbiAgICAgICAgICAgIHRpY2tSZWxhdGlvbnNoaXBzT3V0bGluZXMoKTtcclxuICAgICAgICAgICAgdGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc091dGxpbmVzKCkge1xyXG4gICAgICAgIHJlbGF0aW9uc2hpcC5lYWNoKGZ1bmN0aW9uKHJlbGF0aW9uc2hpcCkge1xyXG4gICAgICAgICAgICB2YXIgcmVsID0gZDMuc2VsZWN0KHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZSA9IHJlbC5zZWxlY3QoJy5vdXRsaW5lJyksXHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gcmVsLnNlbGVjdCgnLnRleHQnKSxcclxuICAgICAgICAgICAgICAgIGJib3ggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCksXHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nID0gMztcclxuXHJcbiAgICAgICAgICAgIG91dGxpbmUuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcclxuICAgICAgICAgICAgICAgICAgICBhbmdsZSA9IHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCksXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dEJvdW5kaW5nQm94ID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRQYWRkaW5nID0gNSxcclxuICAgICAgICAgICAgICAgICAgICB1ID0gdW5pdGFyeVZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRNYXJnaW4gPSB7IHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtICh0ZXh0Qm91bmRpbmdCb3gud2lkdGggKyB0ZXh0UGFkZGluZykgKiB1LngpICogMC41LCB5OiAoZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAodGV4dEJvdW5kaW5nQm94LndpZHRoICsgdGV4dFBhZGRpbmcpICogdS55KSAqIDAuNSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXHJcbiAgICAgICAgICAgICAgICAgICAgcm90YXRlZFBvaW50QTEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCwgeTogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueSB9LCBhbmdsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgcm90YXRlZFBvaW50QjEgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogdGV4dE1hcmdpbi54IC0gbi54LCB5OiB0ZXh0TWFyZ2luLnkgLSBuLnkgfSwgYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludEMxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IHRleHRNYXJnaW4ueCwgeTogdGV4dE1hcmdpbi55IH0sIGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICByb3RhdGVkUG9pbnREMSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54LCB5OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IH0sIGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICByb3RhdGVkUG9pbnRBMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIHRleHRNYXJnaW4ueCAtIG4ueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSB0ZXh0TWFyZ2luLnkgLSBuLnkgfSwgYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludEIyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54IC0gbi54IC0gdS54ICogb3B0aW9ucy5hcnJvd1NpemUsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55IC0gbi55IC0gdS55ICogb3B0aW9ucy5hcnJvd1NpemUgfSwgYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludEMyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54IC0gbi54ICsgKG4ueCAtIHUueCkgKiBvcHRpb25zLmFycm93U2l6ZSwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSBuLnkgKyAobi55IC0gdS55KSAqIG9wdGlvbnMuYXJyb3dTaXplIH0sIGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICByb3RhdGVkUG9pbnREMiA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgfSwgYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludEUyID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54ICsgKC0gbi54IC0gdS54KSAqIG9wdGlvbnMuYXJyb3dTaXplLCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSArICgtIG4ueSAtIHUueSkgKiBvcHRpb25zLmFycm93U2l6ZSB9LCBhbmdsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgcm90YXRlZFBvaW50RjIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSB1LnggKiBvcHRpb25zLmFycm93U2l6ZSwgeTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSB1LnkgKiBvcHRpb25zLmFycm93U2l6ZSB9LCBhbmdsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgcm90YXRlZFBvaW50RzIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSB0ZXh0TWFyZ2luLngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gdGV4dE1hcmdpbi55IH0sIGFuZ2xlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ00gJyArIHJvdGF0ZWRQb2ludEExLnggKyAnICcgKyByb3RhdGVkUG9pbnRBMS55ICtcclxuICAgICAgICAgICAgICAgICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEIxLnggKyAnICcgKyByb3RhdGVkUG9pbnRCMS55ICtcclxuICAgICAgICAgICAgICAgICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEMxLnggKyAnICcgKyByb3RhdGVkUG9pbnRDMS55ICtcclxuICAgICAgICAgICAgICAgICAgICAgICAnIEwgJyArIHJvdGF0ZWRQb2ludEQxLnggKyAnICcgKyByb3RhdGVkUG9pbnREMS55ICtcclxuICAgICAgICAgICAgICAgICAgICAgICAnIFogTSAnICsgcm90YXRlZFBvaW50QTIueCArICcgJyArIHJvdGF0ZWRQb2ludEEyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50QjIueCArICcgJyArIHJvdGF0ZWRQb2ludEIyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50QzIueCArICcgJyArIHJvdGF0ZWRQb2ludEMyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RDIueCArICcgJyArIHJvdGF0ZWRQb2ludEQyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RTIueCArICcgJyArIHJvdGF0ZWRQb2ludEUyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RjIueCArICcgJyArIHJvdGF0ZWRQb2ludEYyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgTCAnICsgcm90YXRlZFBvaW50RzIueCArICcgJyArIHJvdGF0ZWRQb2ludEcyLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICcgWic7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzT3ZlcmxheXMoKSB7XHJcbiAgICAgICAgcmVsYXRpb25zaGlwT3ZlcmxheS5hdHRyKCdkJywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXHJcbiAgICAgICAgICAgICAgICBhbmdsZSA9IHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCksXHJcbiAgICAgICAgICAgICAgICBuMSA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0KSxcclxuICAgICAgICAgICAgICAgIG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCwgNTApLFxyXG4gICAgICAgICAgICAgICAgcm90YXRlZFBvaW50QSA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwIC0gbi54LCB5OiAwIC0gbi55IH0sIGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludEIgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSBuLngsIHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gbi55IH0sIGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludEMgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogZC50YXJnZXQueCAtIGQuc291cmNlLnggKyBuLnggLSBuMS54LCB5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSArIG4ueSAtIG4xLnkgfSwgYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgcm90YXRlZFBvaW50RCA9IHJvdGF0ZVBvaW50KGNlbnRlciwgeyB4OiAwICsgbi54IC0gbjEueCwgeTogMCArIG4ueSAtIG4xLnkgfSwgYW5nbGUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuICdNICcgKyByb3RhdGVkUG9pbnRBLnggKyAnICcgKyByb3RhdGVkUG9pbnRBLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRCLnggKyAnICcgKyByb3RhdGVkUG9pbnRCLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRDLnggKyAnICcgKyByb3RhdGVkUG9pbnRDLnkgK1xyXG4gICAgICAgICAgICAgICAgICAgJyBMICcgKyByb3RhdGVkUG9pbnRELnggKyAnICcgKyByb3RhdGVkUG9pbnRELnkgK1xyXG4gICAgICAgICAgICAgICAgICAgJyBaJztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc1RleHRzKCkge1xyXG4gICAgICAgIHJlbGF0aW9uc2hpcFRleHQuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICB2YXIgYW5nbGUgPSAocm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSArIDM2MCkgJSAzNjAsXHJcbiAgICAgICAgICAgICAgICBtaXJyb3IgPSBhbmdsZSA+IDkwICYmIGFuZ2xlIDwgMjcwLFxyXG4gICAgICAgICAgICAgICAgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXHJcbiAgICAgICAgICAgICAgICBuID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpLFxyXG4gICAgICAgICAgICAgICAgbldlaWdodCA9IG1pcnJvciA/IDIgOiAtMyxcclxuICAgICAgICAgICAgICAgIHBvaW50ID0geyB4OiAoZC50YXJnZXQueCAtIGQuc291cmNlLngpICogMC41ICsgbi54ICogbldlaWdodCwgeTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55KSAqIDAuNSArIG4ueSAqIG5XZWlnaHQgfSxcclxuICAgICAgICAgICAgICAgIHJvdGF0ZWRQb2ludCA9IHJvdGF0ZVBvaW50KGNlbnRlciwgcG9pbnQsIGFuZ2xlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyByb3RhdGVkUG9pbnQueCArICcsICcgKyByb3RhdGVkUG9pbnQueSArICcpIHJvdGF0ZSgnICsgKG1pcnJvciA/IDE4MCA6IDApICsgJyknO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRvU3RyaW5nKGQpIHtcclxuICAgICAgICB2YXIgcyA9IGQubGFiZWxzID8gZC5sYWJlbHNbMF0gOiBkLnR5cGU7XHJcblxyXG4gICAgICAgIHMgKz0gJyAoPGlkPjogJyArIGQuaWQ7XHJcblxyXG4gICAgICAgIE9iamVjdC5rZXlzKGQucHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICBzICs9ICcsICcgKyBwcm9wZXJ0eSArICc6ICcgKyBKU09OLnN0cmluZ2lmeShkLnByb3BlcnRpZXNbcHJvcGVydHldKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcyArPSAnKSc7XHJcblxyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVuaXRhcnlOb3JtYWxWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xyXG4gICAgICAgIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcclxuICAgICAgICAgICAgdmVjdG9yID0gdW5pdGFyeVZlY3Rvcihzb3VyY2UsIHRhcmdldCwgbmV3TGVuZ3RoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdGF0ZVBvaW50KGNlbnRlciwgdmVjdG9yLCA5MCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW5pdGFyeVZlY3Rvcihzb3VyY2UsIHRhcmdldCwgbmV3TGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydChNYXRoLnBvdyh0YXJnZXQueCAtIHNvdXJjZS54LCAyKSArIE1hdGgucG93KHRhcmdldC55IC0gc291cmNlLnksIDIpKSAvIE1hdGguc3FydChuZXdMZW5ndGggfHwgMSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6ICh0YXJnZXQueCAtIHNvdXJjZS54KSAvIGxlbmd0aCxcclxuICAgICAgICAgICAgeTogKHRhcmdldC55IC0gc291cmNlLnkpIC8gbGVuZ3RoLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpIHtcclxuICAgICAgICB1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMoZDNEYXRhLm5vZGVzLCBkM0RhdGEucmVsYXRpb25zaGlwcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlV2l0aE5lbzRqRGF0YShuZW80akRhdGEpIHtcclxuICAgICAgICB2YXIgZDNEYXRhID0gbmVvNGpEYXRhVG9EM0RhdGEobmVvNGpEYXRhKTtcbiAgICAgICAgdXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUluZm8oZCkge1xyXG4gICAgICAgIGNsZWFySW5mbygpO1xyXG5cclxuICAgICAgICBpZiAoZC5sYWJlbHMpIHtcclxuICAgICAgICAgICAgYXBwZW5kSW5mb0VsZW1lbnRDbGFzcygnY2xhc3MnLCBkLmxhYmVsc1swXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXBwZW5kSW5mb0VsZW1lbnRSZWxhdGlvbnNoaXAoJ2NsYXNzJywgZC50eXBlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoJ3Byb3BlcnR5JywgJyZsdDtpZCZndDsnLCBkLmlkKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgIGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoJ3Byb3BlcnR5JywgcHJvcGVydHksIEpTT04uc3RyaW5naWZ5KGQucHJvcGVydGllc1twcm9wZXJ0eV0pKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVOb2RlcyhuKSB7XHJcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkobm9kZXMsIG4pO1xyXG5cclxuICAgICAgICBub2RlID0gc3ZnTm9kZXMuc2VsZWN0QWxsKCcubm9kZScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQ7IH0pO1xyXG4gICAgICAgIHZhciBub2RlRW50ZXIgPSBhcHBlbmROb2RlVG9HcmFwaCgpO1xyXG4gICAgICAgIG5vZGUgPSBub2RlRW50ZXIubWVyZ2Uobm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlTm9kZXNBbmRSZWxhdGlvbnNoaXBzKG4sIHIpIHtcclxuICAgICAgICB1cGRhdGVSZWxhdGlvbnNoaXBzKHIpO1xyXG4gICAgICAgIHVwZGF0ZU5vZGVzKG4pO1xyXG5cclxuICAgICAgICBzaW11bGF0aW9uLm5vZGVzKG5vZGVzKTtcclxuICAgICAgICBzaW11bGF0aW9uLmZvcmNlKCdsaW5rJykubGlua3MocmVsYXRpb25zaGlwcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlUmVsYXRpb25zaGlwcyhyKSB7XHJcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkocmVsYXRpb25zaGlwcywgcik7XHJcblxyXG4gICAgICAgIHJlbGF0aW9uc2hpcCA9IHN2Z1JlbGF0aW9uc2hpcHMuc2VsZWN0QWxsKCcucmVsYXRpb25zaGlwJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmRhdGEocmVsYXRpb25zaGlwcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZDsgfSk7XHJcblxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBFbnRlciA9IGFwcGVuZFJlbGF0aW9uc2hpcFRvR3JhcGgoKTtcclxuXHJcbiAgICAgICAgcmVsYXRpb25zaGlwID0gcmVsYXRpb25zaGlwRW50ZXIucmVsYXRpb25zaGlwLm1lcmdlKHJlbGF0aW9uc2hpcCk7XHJcblxyXG4gICAgICAgIHJlbGF0aW9uc2hpcE91dGxpbmUgPSBzdmcuc2VsZWN0QWxsKCcucmVsYXRpb25zaGlwIC5vdXRsaW5lJyk7XHJcbiAgICAgICAgcmVsYXRpb25zaGlwT3V0bGluZSA9IHJlbGF0aW9uc2hpcEVudGVyLm91dGxpbmUubWVyZ2UocmVsYXRpb25zaGlwT3V0bGluZSk7XHJcblxyXG4gICAgICAgIHJlbGF0aW9uc2hpcE92ZXJsYXkgPSBzdmcuc2VsZWN0QWxsKCcucmVsYXRpb25zaGlwIC5vdmVybGF5Jyk7XHJcbiAgICAgICAgcmVsYXRpb25zaGlwT3ZlcmxheSA9IHJlbGF0aW9uc2hpcEVudGVyLm92ZXJsYXkubWVyZ2UocmVsYXRpb25zaGlwT3ZlcmxheSk7XHJcblxyXG4gICAgICAgIHJlbGF0aW9uc2hpcFRleHQgPSBzdmcuc2VsZWN0QWxsKCcucmVsYXRpb25zaGlwIC50ZXh0Jyk7XHJcbiAgICAgICAgcmVsYXRpb25zaGlwVGV4dCA9IHJlbGF0aW9uc2hpcEVudGVyLnRleHQubWVyZ2UocmVsYXRpb25zaGlwVGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdmVyc2lvbigpIHtcclxuICAgICAgICByZXR1cm4gVkVSU0lPTjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB6b29tRml0KHRyYW5zaXRpb25EdXJhdGlvbikge1xyXG4gICAgICAgIHZhciBib3VuZHMgPSBzdmcubm9kZSgpLmdldEJCb3goKSxcclxuICAgICAgICAgICAgcGFyZW50ID0gc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQsXHJcbiAgICAgICAgICAgIGZ1bGxXaWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aCxcclxuICAgICAgICAgICAgZnVsbEhlaWdodCA9IHBhcmVudC5jbGllbnRIZWlnaHQsXHJcbiAgICAgICAgICAgIHdpZHRoID0gYm91bmRzLndpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBtaWRYID0gYm91bmRzLnggKyB3aWR0aCAvIDIsXHJcbiAgICAgICAgICAgIG1pZFkgPSBib3VuZHMueSArIGhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgIGlmICh3aWR0aCA9PT0gMCB8fCBoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGZpdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3ZnU2NhbGUgPSAwLjg1IC8gTWF0aC5tYXgod2lkdGggLyBmdWxsV2lkdGgsIGhlaWdodCAvIGZ1bGxIZWlnaHQpO1xyXG4gICAgICAgIHN2Z1RyYW5zbGF0ZSA9IFtmdWxsV2lkdGggLyAyIC0gc3ZnU2NhbGUgKiBtaWRYLCBmdWxsSGVpZ2h0IC8gMiAtIHN2Z1NjYWxlICogbWlkWV07XHJcblxyXG4gICAgICAgIHN2Zy5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBzdmdUcmFuc2xhdGVbMF0gKyAnLCAnICsgc3ZnVHJhbnNsYXRlWzFdICsgJykgc2NhbGUoJyArIHN2Z1NjYWxlICsgJyknKTtcclxuLy8gICAgICAgIHNtb290aFRyYW5zZm9ybShzdmdUcmFuc2xhdGUsIHN2Z1NjYWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KF9zZWxlY3RvciwgX29wdGlvbnMpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYXBwZW5kUmFuZG9tRGF0YVRvTm9kZTogYXBwZW5kUmFuZG9tRGF0YVRvTm9kZSxcclxuICAgICAgICBuZW80akRhdGFUb0QzRGF0YTogbmVvNGpEYXRhVG9EM0RhdGEsXHJcbiAgICAgICAgcmFuZG9tRDNEYXRhOiByYW5kb21EM0RhdGEsXHJcbiAgICAgICAgc2l6ZTogc2l6ZSxcclxuICAgICAgICB1cGRhdGVXaXRoRDNEYXRhOiB1cGRhdGVXaXRoRDNEYXRhLFxyXG4gICAgICAgIHVwZGF0ZVdpdGhOZW80akRhdGE6IHVwZGF0ZVdpdGhOZW80akRhdGEsXHJcbiAgICAgICAgdmVyc2lvbjogdmVyc2lvblxyXG4gICAgfTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOZW80akQzO1xyXG4iXX0=
