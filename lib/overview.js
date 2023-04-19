//全局变量global_nodes:所有对话的节点
let nodes = []

let brushView = d3.select('#brushView');

let chatMultilevelvis = d3.select("#overallChatContainer")

let wordcloud_data = [];
var bigcolor = [
    '#fc9373',
    '#05acac',
    '#92da89',
    '#5e88c3',
    '#817373',
    '#816bac',
    '#fbf585',


    '#f57a70',


    '#65c098',
    '#feb34d',


    '#f6efef',


];
const colorScale = d3.scaleOrdinal(bigcolor);

function drawChatVisualization() {
    d3.json('../dataProcessing/data.json', function (error, chatHistory) {
        if (error) throw error;
        console.log(chatHistory);
        const data = chatHistory['data'].slice(0, 20);
        const topicLayerMapping = chatHistory['topicLayerMapping'];

        // Prepare data for visualization
        data.forEach(d => {
            d.layer = topicLayerMapping[d.topic];
        });

        const overview = d3.select('#overview');

        const width = overview.node().getBoundingClientRect().width;
        const height = overview.node().getBoundingClientRect().height;

        const margin = {top: 20, right: 20, bottom: 20, left: 20};

        const xScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.timestamp) * 0.95, d3.max(data, d => d.timestamp) * 1.05])
            .range([margin.left + 30, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([-0.5, d3.max(data, d => d.layer) + 0.5])
            .range([height - margin.bottom, margin.top]);


        //const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const svg = d3.select('#chat-visualization')
            .attr('width', width)
            .attr('height', height);

        // Add Y-axis
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => {
                for (const key in topicLayerMapping) {
                    if (topicLayerMapping[key] === d) {
                        return key;
                    }
                }
            });

        // Draw background rectangles for rows
        const numRows = Object.keys(topicLayerMapping).length;
        const rowHeight = (height - margin.top - margin.bottom) / numRows;
        const rowPadding = 0; // Space between rows

        Object.keys(topicLayerMapping).forEach((topic, i) => {
            svg.append('rect')
                .attr('x', margin.left)
                .attr('y', yScale(topicLayerMapping[topic]) - rowHeight / 2 + rowPadding / 2)
                .attr('width', width - margin.left - margin.right)
                .attr('height', rowHeight - rowPadding)
                .attr('fill', i % 2 === 0 ? 'rgba(230, 230, 230, 0.5)' : 'rgba(250, 250, 250, 0.5)');
        });

        // Draw lines
        data.slice(0, -1).forEach((d, i) => {
            // Create a linear gradient for each line
            const gradient = svg.append("defs")
                .append("linearGradient")
                .attr("id", `line-gradient-${i}`)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", xScale(d.timestamp))
                .attr("y1", yScale(d.layer))
                .attr("x2", xScale(data[i + 1].timestamp))
                .attr("y2", yScale(data[i + 1].layer));

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", colorScale(d.topic));

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", colorScale(data[i + 1].topic));

            svg.append('line')
                .attr('x1', xScale(d.timestamp))
                .attr('y1', yScale(d.layer))
                .attr('x2', xScale(data[i + 1].timestamp))
                .attr('y2', yScale(data[i + 1].layer))
                .attr('stroke', `url(#line-gradient-${i})`)
                .attr('stroke-width', 5); // Increase the stroke width
        });

        // Draw points
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.timestamp))
            .attr('cy', d => yScale(d.layer))
            .attr('r', 20) // Increase the size of the points
            .attr('fill', d => colorScale(d.topic));

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis);
    });
}

function test() {
    console.log("test");
    d3.json('../dataProcessing/step1+2(1).json', function (error, chatHistory) {
        tempnodes = chatHistory['results'][0]['data'][0];
        nodes['data'] = tempnodes['allNodes'];
        nodes['topicLayerMapping'] = tempnodes['topicLayerMapping'];
        const width = chatMultilevelvis.node().getBoundingClientRect().width;
        MultiLevelCenters("test", 0, width, nodes['data'].slice(0, 20));
        //DrawBottomContextView();
        focusandcontextbrush();

    });
    d3.json('../dataProcessing/wordcloud_data.json', function (error, data) {
        console.log(data)
        wordcloud_data = data;
        drawWordCloud(data['Erato系统的相关问题']);
    });

}

//绘制overviw视图中间的部分
function MultiLevelCenters(svgid, left, widthtemp, selectedgroups) {
    /**
     * @param svgid: the id of the svg element
     * @param left: the left position of the svg element
     * @param widthtemp: the width of the svg element
     * @param selectedgroups: the selected groups
     * @return: the centers of the selected groups
     */
    d3.selectAll("#" + svgid).remove();
    d3.selectAll("#test").remove();
    const data = selectedgroups;
    const topicLayerMapping = nodes['topicLayerMapping'];

    // Prepare data for visualization
    data.forEach(d => {
        d.layer = topicLayerMapping[d.topic];
    });

    const overview = chatMultilevelvis;

    const width = widthtemp;
    const height = overview.node().getBoundingClientRect().height;

    const margin = {top: 20, right: 10, bottom: 20, left: 10};

    // const xScale = d3.scaleLinear()
    //     .domain([d3.min(data, d => d.timestamp) * 0.95, d3.max(data, d => d.timestamp) * 1.05])
    //     .range([margin.left + 30, width - margin.right]);
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => parseInt(d.timestamp)), d3.max(data, d => parseInt(d.timestamp))])
        .range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear()
        .domain([-0.5, d3.max(nodes['data'], d => d.layer) + 0.5])
        .range([height - margin.bottom, margin.top]);

    // console.log("The xScale domain is", xScale.domain());
    // console.log("The xScale range is", xScale.range());

    //const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // const svg = d3.select('#chat-visualization')
    //     .attr('width', width)
    //     .attr('height', height);
    const svg = chatMultilevelvis.append("svg")
        .attr("id", svgid)
        .attr("width", widthtemp)
        .attr("height", height)
        .attr("left", left)
        .attr("position", "absolute")
    // 在左侧绘制红色线
    svg.append('line')
        .attr('x1', 0)
        .attr('y1', margin.top)
        .attr('x2', 0)
        .attr('y2', height - margin.bottom)
        .attr('stroke', 'red')
        .attr('stroke-width', 2).raise();

// 在右侧绘制红色线
    svg.append('line')
        .attr('x1', width)
        .attr('y1', margin.top)
        .attr('x2', width)
        .attr('y2', height - margin.bottom)
        .attr('stroke', 'red')
        .attr('stroke-width', 2).raise();
    // // Add Y-axis
    // const yAxis = d3.axisLeft(yScale)
    //     .tickFormat(d => {
    //         for (const key in topicLayerMapping) {
    //             if (topicLayerMapping[key] === d) {
    //                 return key;
    //             }
    //         }
    //     });

    // Draw background rectangles for rows
    const numRows = Object.keys(topicLayerMapping).length;
    const rowHeight = (height - margin.top - margin.bottom) / numRows;
    const rowPadding = 0; // Space between rows

    Object.keys(topicLayerMapping).forEach((topic, i) => {
        svg.append('rect')
            .attr('x', 2)
            .attr('y', yScale(topicLayerMapping[topic]) - 3 * rowHeight / 8 + rowPadding / 2)
            .attr('width', width - 2)
            .attr('height', rowHeight * 0.75)
            .attr('fill', i % 2 === 0 ? 'rgba(255, 242, 224, 0.5)' : 'rgba(227, 233, 240, 0.5)');
    });

    // Draw lines
    data.slice(0, -1).forEach((d, i) => {
        // Create a linear gradient for each line
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", `line-gradient-${i}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", xScale(d.timestamp))
            .attr("y1", yScale(d.layer))
            .attr("x2", xScale(data[i + 1].timestamp))
            .attr("y2", yScale(data[i + 1].layer));

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(d.topic));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(data[i + 1].topic));

        svg.append('line')
            .attr('x1', xScale(d.timestamp))
            .attr('y1', yScale(d.layer))
            .attr('x2', xScale(data[i + 1].timestamp))
            .attr('y2', yScale(data[i + 1].layer))
            .attr('stroke', `url(#line-gradient-${i})`)
            .attr('stroke-width', 5); // Increase the stroke width
    });

    // // Draw points
    // svg.selectAll('circle')
    //     .data(data)
    //     .enter()
    //     .append('circle')
    //     .attr('cx', d => xScale(d.timestamp))
    //     .attr('cy', d => yScale(d.layer))
    //     .attr('r', 10) // Increase the size of the points
    //     .attr('fill', d => colorScale(d.topic))
    //     .attr('id', d => 'point-' + d.timestamp)
    //     .attr('title', d => d.summary) // 添加title属性
    //     .on('mouseover', function (d) {
    //         const tooltip = d3.select(this.parentNode).append('div')
    //             .attr('class', 'tooltip')
    //             .html(d.summary)
    //             .style('top', d3.event.pageY + 'px')
    //             .style('left', d3.event.pageX + 'px');
    //     })
    //     .on('mouseout', function (d) {
    //         d3.select(this.parentNode).select('.tooltip').remove();
    //     });//为每个点添加id，后续判断刷选的时候可以用;


    // Add a tooltip div
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    /// Add mouseover and mouseout events to the points
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.timestamp))
        .attr('cy', d => yScale(d.layer))
        .attr('r', 10) // Increase the size of the points
        .attr('fill', d => colorScale(d.topic))
        .attr('id', d => 'point-' + d.timestamp)
        .on('mouseover', (d) => {
            console.log(d.summary);
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(d.summary)
                .style('left', (d3.event.pageX + 10) + 'px')
                .style('top', (d3.event.pageY - 10) + 'px');
            console.log(d.summary + " " + d3.event.pageX + " " + d3.event.pageY);
        })
        .on('mouseout', () => {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
// // Add topic labels to the topics div
//     const topicsDiv = d3.select('#topics');
//
//     Object.keys(topicLayerMapping).forEach((topic, i) => {
//         topicsDiv.append('div')
//             .attr('class', 'topic-label')
//             .style('left', '10px')
//             .style('top', (yScale(topicLayerMapping[topic]) - rowHeight / 8) + 'px')
//             .text(topic);
//
//     });
    createTopicLabels();

}

function createTopicLabels() {
    const overview = chatMultilevelvis;
    const margin = {top: 20, right: 10, bottom: 20, left: 10};
    const height = overview.node().getBoundingClientRect().height;

    const topicLayerMapping = nodes['topicLayerMapping'];
    const yScale = d3.scaleLinear()
        .domain([-0.5, d3.max(nodes['data'], d => d.layer) + 0.5])
        .range([height - margin.bottom, margin.top]);
    const numRows = Object.keys(topicLayerMapping).length;
    const rowHeight = (height - margin.top - margin.bottom) / numRows;

    const rowPadding = 0; // Space between rows
    const topicsDiv = d3.select('#topics');

    const labelWidth = 50;
    const labelHeight = labelWidth * 0.4;
    const fontSize = 10; // Adjust the font size as needed
    const backgroundColorOpacity = 0.8; // Adjust the opacity as needed

    Object.keys(topicLayerMapping).forEach((topic, i) => {
        const topicDiv = topicsDiv.append('div')
            .attr('class', 'topic-label')
            .style('right', '10px')
            .style('top', (yScale(topicLayerMapping[topic]) - rowHeight / 4) + 'px')
            .style('width', labelWidth + 'px')
            .style('height', labelHeight + 'px')
            .style('background-color', colorScale(topic))
            .style('line-height', labelHeight + 'px')
            .style('font-size', fontSize + 'px')
            .style('opacity', backgroundColorOpacity)
        // .text(topic);

        topicDiv.attr('title', topic);

        // Add a bar chart to the left of the label
        const barHeight = labelHeight / 2;
        const barWidth = 20; // Adjust the bar width as needed
        const barPadding = 5; // Adjust the padding between the bar and the label as needed
        topicDiv.append('svg')
            .attr('width', barWidth)
            .attr('height', barHeight)
            .style('position', 'absolute')
            .style('left', (-barWidth - barPadding) + 'px')
            .style('top', (labelHeight - barHeight) / 2 + 'px')
            .append('rect')
            .attr('width', barWidth)
            .attr('height', barHeight)
            .attr('fill', colorScale(topic));
    });
}

//绘制overviw视图中间的部分
function MultiLevelSide1(svgid, left, widthtemp, selectedgroups) {
    /**
     * @param svgid: the id of the svg element
     * @param left: the left position of the svg element
     * @param widthtemp: the width of the svg element
     * @param selectedgroups: the selected groups
     * @return: the side of the selected groups
     */
    d3.selectAll("#" + svgid).remove();
    d3.selectAll("#test").remove();
    const data = selectedgroups;
    const topicLayerMapping = nodes['topicLayerMapping'];

    // Prepare data for visualization
    data.forEach(d => {
        d.layer = topicLayerMapping[d.topic];
    });

    const overview = chatMultilevelvis;

    const width = widthtemp;
    const height = overview.node().getBoundingClientRect().height;

    const margin = {top: 20, right: 10, bottom: 20, left: 10};

    // const xScale = d3.scaleLinear()
    //     .domain([d3.min(data, d => d.timestamp) * 0.95, d3.max(data, d => d.timestamp) * 1.05])
    //     .range([margin.left + 30, width - margin.right]);
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => parseInt(d.timestamp)), d3.max(data, d => parseInt(d.timestamp))])
        .range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear()
        .domain([-0.5, d3.max(nodes['data'], d => d.layer) + 0.5])
        .range([height - margin.bottom, margin.top]);


    //const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // const svg = d3.select('#chat-visualization')
    //     .attr('width', width)
    //     .attr('height', height);
    const svg = chatMultilevelvis.append("svg")
        .attr("id", svgid)
        .attr("width", widthtemp)
        .attr("height", height)
        .attr("left", left)
        .attr("position", "absolute")
    if (svgid == "svg_multilevel_transition1") {// 在左侧绘制红色线
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', margin.top)
            .attr('x2', 0)
            .attr('y2', height - margin.bottom)
            .attr('stroke', 'blue')
            .attr('stroke-width', 2).raise();
    }

    if (svgid == "svg_multilevel_transition2") {// 在右侧绘制红色线
        svg.append('line')
            .attr('x1', width)
            .attr('y1', margin.top)
            .attr('x2', width)
            .attr('y2', height - margin.bottom)
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .raise();
    }

    // // Add Y-axis
    // const yAxis = d3.axisLeft(yScale)
    //     .tickFormat(d => {
    //         for (const key in topicLayerMapping) {
    //             if (topicLayerMapping[key] === d) {
    //                 return key;
    //             }
    //         }
    //     });

    // Draw background rectangles for rows
    const numRows = Object.keys(topicLayerMapping).length;
    const rowHeight = (height - margin.top - margin.bottom) / numRows;
    const rowPadding = 0; // Space between rows

    Object.keys(topicLayerMapping).forEach((topic, i) => {
        svg.append('rect')
            .attr('x', 2)
            .attr('y', yScale(topicLayerMapping[topic]) - rowHeight / 4 + rowPadding / 2)
            .attr('width', width - 2)
            .attr('height', rowHeight * 0.5)
            .attr('fill', i % 2 === 0 ? 'rgba(255, 242, 224, 0.5)' : 'rgba(227, 233, 240, 0.5)');
    });


    // Draw points
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.timestamp))
        .attr('cy', d => yScale(d.layer))
        .attr('r', 5) // Increase the size of the points
        .attr('fill', d => colorScale(d.topic))
        .attr('id', d => 'point-' + d.timestamp);//为每个点添加id，后续判断刷选的时候可以用;

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .attr("transform", `translate(${margin.left}, 0)`)
    //     .call(yAxis);
}

//绘制overviw视图中间的部分
function MultiLevelSide2(svgid, left, widthtemp, selectedgroups) {
    /**
     * @param svgid: the id of the svg element
     * @param left: the left position of the svg element
     * @param widthtemp: the width of the svg element
     * @param selectedgroups: the selected groups
     * @return: the side of the selected groups
     */
    d3.selectAll("#" + svgid).remove();
    d3.selectAll("#test").remove();
    const data = selectedgroups;
    const topicLayerMapping = nodes['topicLayerMapping'];

    // Prepare data for visualization
    data.forEach(d => {
        d.layer = topicLayerMapping[d.topic];
    });

    const overview = chatMultilevelvis;

    const width = widthtemp;
    const height = overview.node().getBoundingClientRect().height;

    const margin = {top: 20, right: 10, bottom: 20, left: 10};

    // const xScale = d3.scaleLinear()
    //     .domain([d3.min(data, d => d.timestamp) * 0.95, d3.max(data, d => d.timestamp) * 1.05])
    //     .range([margin.left + 30, width - margin.right]);
    ddd = [d3.min(data, d => parseInt(d.timestamp)), d3.max(data, d => parseInt(d.timestamp))]
    rrr = [margin.left, width - margin.right]
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => parseInt(d.timestamp)), d3.max(data, d => parseInt(d.timestamp))])
        .range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear()
        .domain([-0.5, d3.max(nodes['data'], d => d.layer) + 0.5])
        .range([height - margin.bottom, margin.top]);
    console.log(xScale(30))

    //const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // const svg = d3.select('#chat-visualization')
    //     .attr('width', width)
    //     .attr('height', height);
    const svg = chatMultilevelvis.append("svg")
        .attr("id", svgid)
        .attr("width", widthtemp)
        .attr("height", height)
        .attr("left", left)
        .attr("position", "absolute")

    // // Add Y-axis
    // const yAxis = d3.axisLeft(yScale)
    //     .tickFormat(d => {
    //         for (const key in topicLayerMapping) {
    //             if (topicLayerMapping[key] === d) {
    //                 return key;
    //             }
    //         }
    //     });

    // Draw background rectangles for rows
    const numRows = Object.keys(topicLayerMapping).length;
    const rowHeight = (height - margin.top - margin.bottom) / numRows;
    const rowPadding = 0; // Space between rows

    Object.keys(topicLayerMapping).forEach((topic, i) => {
        svg.append('rect')
            .attr('x', 2)
            .attr('y', yScale(topicLayerMapping[topic]) - rowHeight / 8 + rowPadding / 2)
            .attr('width', width - 2)
            .attr('height', rowHeight * 0.25)
            .attr('fill', i % 2 === 0 ? 'rgba(255, 242, 224, 0.5)' : 'rgba(227, 233, 240, 0.5)');
    });


    // Draw points
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.timestamp))
        .attr('cy', d => yScale(d.layer))
        .attr('r', 2) // Increase the size of the points
        .attr('fill', d => colorScale(d.topic))
        .attr('id', d => 'point-' + d.timestamp);//为每个点添加id，后续判断刷选的时候可以用

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .attr("transform", `translate(${margin.left}, 0)`)
    //     .call(yAxis);
}

//绘制下面刷选的总体小视图
function DrawBottomContextView() {
    const data = nodes['data']
    const topicLayerMapping = nodes['topicLayerMapping'];

    // Prepare data for visualization
    data.forEach(d => {
        d.layer = topicLayerMapping[d.topic];
    });

    const overview = brushView;

    const width = overview.node().getBoundingClientRect().width;
    const height = overview.node().getBoundingClientRect().height;

    const margin = {top: 5, right: 5, bottom: 5, left: 5};

    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.timestamp) * 0.95, d3.max(data, d => d.timestamp) * 1.05])
        .range([margin.left + 10, width]);

    const yScale = d3.scaleLinear()
        .domain([-0.5, d3.max(data, d => d.layer) + 0.5])
        .range([height - margin.bottom, margin.top]);
    // const xScale = d3.scaleLinear()
    //     .domain([0, d3.max(data, d => d.timestamp)])
    //     .range([margin.left, width - margin.right]);
    //
    // const yScale = d3.scaleLinear()
    //     .domain([0, d3.max(data, d => d.layer)])
    //     .range([height - margin.bottom, margin.top]);

    // const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // const svg = d3.select('#chat-visualization')
    //     .attr('width', width)
    //     .attr('height', height);
    const svg = brushView.append("svg")
        .style('z-index', 1)
        .attr("id", 'Draw12_Contex')
        .attr("width", width)
        .attr("height", height)

        .attr("position", "absolute")


    // Draw background rectangles for rows
    const numRows = Object.keys(topicLayerMapping).length;
    const rowHeight = (height - margin.top - margin.bottom) / numRows;
    const rowPadding = 0; // Space between rows

    Object.keys(topicLayerMapping).forEach((topic, i) => {
        svg.append('rect')
            .attr('x', margin.left)
            .attr('y', yScale(topicLayerMapping[topic]) - rowHeight / 2 + rowPadding / 2)
            .attr('width', width - margin.left - margin.right)
            .attr('height', rowHeight - rowPadding)
            .attr('fill', i % 2 === 0 ? 'rgba(230, 230, 230, 0.5)' : 'rgba(250, 250, 250, 0.5)');
    });

    // Draw points
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .classed('bottomPoints', true) // 添加类
        .attr('cx', d => xScale(d.timestamp))
        .attr('cy', d => yScale(d.layer))
        .attr('r', 2) // Increase the size of the points
        .attr('fill', d => colorScale(d.topic))
        .attr('class', 'bottomPoints')
        .attr('id', d => 'point-' + d.timestamp);//为每个点添加id，后续判断刷选的时候可以用


}

function focusandcontextbrush() {

    //绘制下面的总览视图
    DrawBottomContextView();
    //绘制上面的刷选视图
    let margin = {top: 25, right: 10, bottom: 0, left: 10},
        padding = {top: 200, right: 10, bottom: 0, left: 10},
        // width = document.getElementById("CausalityVis").offsetWidth
        width = 600,
        height = 100;

    var x = d3.scaleLinear().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        // x2 = d3.scaleLinear().range([0, document.getElementById("CausalityVis").getAttribute("width")]),
        // y2 = d3.scaleLinear().range([document.getElementById("CausalityVis").getAttribute("height"), 0]);
        x2 = d3.scaleLinear().range([0, width]),
        y2 = d3.scaleLinear().range([200, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("brush", brushended)
    // .on("end", brushended)

    // let svg_causalityBrushview = d3.select("#brushView")
    //     .append("svg")
    //     .style('z-index', 2)
    //     .style('top', '0')
    //     .style('left', '0')
    //     .attr("class", "svg_Brushview").style("position", "absolute")
    //     .attr("backgroud", "blue")
    //     .style("border", "1px solid #e1e1e1")
    //     .style("border-radius", "4px")
    //     .attr("width", width)
    //     .attr("height", height)
    // svg_causalityBrushview.append("defs").append("clipPath")
    //     .attr("id", "clip").append("rect")
    //     .attr("width", width)
    //     .attr("height", height);


    // var context = svg_causalityBrushview.append("g")
    //     .attr("class", "context")
    var context = d3.select("#Draw12_Contex").append("g")
        .attr("class", "context")

    console.log("initial ")
    console.log(width / 2)
    console.log(width * 5 / 8)
    context.append("g")
        .attr("class", "brush")
        .call(brush)
        // .call(brush.move, [width / 2, width * 5 / 8]);
        .call(brush.move, [brushleft, brushright]);
    // .call(brush.move, x.range());

    var brushflag = 0

    function brushended() {
        var selectioncenter = d3.event.selection;

        let transition_width = (selectioncenter[1] - selectioncenter[0]) * 0.5
        let x_array = []
        x_array.push(0)
        x_array.push(Math.max(0, selectioncenter[0] - transition_width))
        x_array.push(selectioncenter[0])
        x_array.push(selectioncenter[1])
        x_array.push(Math.min(width, selectioncenter[1] + transition_width))
        x_array.push(width)
        //console.log(x_array)
        brushleft = selectioncenter[0]
        brushright = selectioncenter[1]

        //console.log(".........Brush End............" + selectioncenter)

        brushflag = brushflag + 1
        let selectedgroups = d3.selectAll("#Draw12_Contex").selectAll(".bottomPoints")._groups[0]
        //记录事件数量
        //let event_count = (d3.selectAll("#Draw12_Contex").selectAll(".bottomLines")._groups[0]).length;

        if (brushflag != 0) {

            ////////////////////明天从这里开始写,提取数据
            //方法1.一组一组地复制path到另一个svg;  var node= document.getElementById("Draw12_Contex").cloneNode(true);document.getElementById("CausalityVis").appendChild(node);

            brusheddata_center = []

            brusheddata_side1 = []
            brusheddata_side2 = []

            brusheddata_transition1 = []
            brusheddata_transition2 = []

            brusheddataOriginal_center = []

            brusheddataOriginal_side1 = []
            brusheddataOriginal_side2 = []

            brusheddataOriginal_transition1 = []
            brusheddataOriginal_transition2 = []

            center_left = 0;
            for (let i = 0; i < selectedgroups.length; i++) {
                let gropup_x = selectedgroups[i].getAttribute("cx");
                console.log(gropup_x, x_array[0], x_array[1], x_array[2], x_array[3], x_array[4]);
                let id = selectedgroups[i].getAttribute("id");
                let group = id.substring(6); //获取id的数字

                if (gropup_x >= x_array[0] && gropup_x < x_array[1]) {
                    brusheddata_side1.push(group)

                    center_left += 1;
                } else if (gropup_x >= x_array[1] && gropup_x < x_array[2]) {
                    brusheddata_transition1.push(group)

                    center_left += 1;
                } else if (gropup_x >= x_array[2] && gropup_x < x_array[3]) {
                    brusheddata_center.push(group)

                } else if (gropup_x >= x_array[3] && gropup_x < x_array[4]) {
                    brusheddata_transition2.push(group)

                } else {
                    brusheddata_side2.push(group)

                }
            }
            let first = parseInt(brusheddata_side1[0])
            let last = parseInt(brusheddata_side1[brusheddata_side1.length - 1])
            brusheddata_side1 = nodes['data'].slice(first, last + 1)

            first = parseInt(brusheddata_side2[0])
            last = parseInt(brusheddata_side2[brusheddata_side2.length - 1])
            brusheddata_side2 = nodes['data'].slice(first, last + 1)

            first = parseInt(brusheddata_center[0])
            last = parseInt(brusheddata_center[brusheddata_center.length - 1])
            brusheddata_center = nodes['data'].slice(first, last + 1)

            first = parseInt(brusheddata_transition1[0])
            last = parseInt(brusheddata_transition1[brusheddata_transition1.length - 1])
            brusheddata_transition1 = nodes['data'].slice(first, last + 1)

            first = parseInt(brusheddata_transition2[0])
            last = parseInt(brusheddata_transition2[brusheddata_transition2.length - 1])
            brusheddata_transition2 = nodes['data'].slice(first, last + 1)

            //下面示意图的长度
            let bottom_all = d3.select("#Draw12_Contex").node().getBoundingClientRect().width
            let bottom_center = parseFloat(selectioncenter[1] - selectioncenter[0])
            let bottom_left = parseFloat(selectioncenter[0])
            let bottom_right = d3.select("#Draw12_Contex").node().getBoundingClientRect().width - selectioncenter[1]

            //上面focus——context的部分
            //总长度
            //let svgmultilevelwidth = parseFloat(document.getElementById("overallChatContainer").getAttribute("width"))
            let svgmultilevelwidth = chatMultilevelvis.node().getBoundingClientRect().width
            //center
            let multilevelscale = d3.scalePow().exponent(1 / 4).domain([0, width]).range([0, svgmultilevelwidth * 7 / 8]);
            centerwidth = multilevelscale(selectioncenter[1] - selectioncenter[0]) //svgmultilevelwidth * ((selectioncenter[1]-selectioncenter[0])/width)

            //side
            let sidwidth = svgmultilevelwidth - centerwidth
            var side12_width1 = sidwidth * (bottom_left / (bottom_left + bottom_right)),
                side12_width2 = sidwidth * (bottom_right / (bottom_left + bottom_right))

            //transition
            let multilevelscale_left = d3.scalePow().exponent(1 / 2).domain([0, x_array[2]]).range([0, side12_width1]);
            var transition12_width1 = multilevelscale_left(x_array[2] - x_array[1])
            let multilevelscale_right = d3.scalePow().exponent(1 / 2).domain([0, x_array[5] - x_array[3]]).range([0, side12_width2]);
            var transition12_width2 = multilevelscale_right(x_array[4] - x_array[3])

            var mini_side12_width1 = side12_width1 - transition12_width1
            var mini_side12_width2 = side12_width2 - transition12_width2

            // MultiLevel_Draw12_Side12("svg_multilevel_side1", 0, mini_side12_width1, brusheddata_side1, "blue", event_count, brusheddataOriginal_side1, nodes)
            // MultiLevel_Draw12_Side12("svg_multilevel_transition1", mini_side12_width1, transition12_width1, brusheddata_side1, "blue", event_count, brusheddataOriginal_transition1, nodes)
            //
            // MultiLevel_Draw12_Focus_Center("svg_multilevel_focus", side12_width1, centerwidth, brusheddata_center, event_count, brusheddataOriginal_center, nodes)//比例和左距离和id
            //
            // MultiLevel_Draw12_Side12("svg_multilevel_transition2", centerwidth + side12_width1, transition12_width2, brusheddata_side2, "blue", event_count, brusheddataOriginal_transition2, nodes)
            // MultiLevel_Draw12_Side12("svg_multilevel_side2", centerwidth + side12_width1 + transition12_width2, mini_side12_width2, brusheddata_side2, "blue", event_count, brusheddataOriginal_side2, nodes)
            MultiLevelSide2("svg_multilevel_side1", 0, mini_side12_width1 * 0.98, brusheddata_side1)//比例和左距离和id
            MultiLevelSide1("svg_multilevel_transition1", mini_side12_width1, transition12_width1, brusheddata_transition1)//比例和左距离和id

            MultiLevelCenters("svg_multilevel_focus", side12_width1, centerwidth, brusheddata_center)//比例和左距离和id

            MultiLevelSide1("svg_multilevel_transition2", centerwidth + side12_width1, transition12_width2, brusheddata_transition2)//比例和左距离和id
            MultiLevelSide2("svg_multilevel_side2", centerwidth + side12_width1 + transition12_width2, mini_side12_width2 * 0.98, brusheddata_side2)//比例和左距离和id

            // //下面的，
            // //let paohvisdata=getAnotherLineList(brusheddataOriginal_center)
            // console.log('brusheddataOriginal_center')
            // console.log(brusheddataOriginal_center)
            // //console.log("another_paohvis")
            // //console.log(paohvisdata)
            // //DrawFocusacausality("svg_BottomFocusContainer_focus", 200+side12_width1, centerwidth, brusheddata_center, event_count, paohvisdata, nodes)//比例和左距离和id
            //
            // d3.selectAll(".gInteractionLine").remove()
            //
            // let wwwheight = 20
            // var InteractionLine = d3.selectAll("#mcv-multicausalContainer")
            //     .append("svg")
            //     .attr("class", "gInteractionLine")
            //     .style("width", svgmultilevelwidth)
            //     .style("height", wwwheight)
            //     .style("top", "620px")
            //     .style("left", d3.select("#div__multilevel").style("left"))
            //     .style("position", "absolute")
            //
            // let wwwlag = document.getElementById("Brushview").offsetLeft - document.getElementById("div__multilevel").offsetLeft;
            // let line1X1 = side12_width1,
            //     line1Y1 = 0,
            //     // line1X2 = document.getElementById(".selection").offsetLeft + bottom_left;
            //     line1X2 = wwwlag + bottom_left,
            //     line1Y2 = wwwheight
            //
            // let line2X1 = centerwidth + side12_width1,
            //     line2Y1 = 0,
            //     line2X2 = wwwlag + bottom_left + bottom_center,
            //     line2Y2 = wwwheight
            //
            // let line3X1 = side12_width1 - transition12_width1,
            //     line3Y1 = 0,
            //     line3X2 = wwwlag + bottom_left - (x_array[2] - x_array[1]),
            //     line3Y2 = wwwheight
            //
            //
            // let line4X1 = centerwidth + side12_width1 + transition12_width2,
            //     line4Y1 = 0,
            //     line4X2 = wwwlag + bottom_left + bottom_center + (x_array[4] - x_array[3]),
            //     line4Y2 = wwwheight
            //
            // InteractionLine.append("line").attr("class", "InteractionLine")
            //     .style("stroke", "red").style("stroke-width", 1.5)
            //     .style("stroke-dasharray", "5,5")
            //     .attr("x1", line1X1)
            //     .attr("y1", line1Y1)
            //     .attr("x2", line1X2)
            //     .attr("y2", line1Y2);
            //
            // InteractionLine.append("line").attr("class", "InteractionLine")
            //     .style("stroke", "red").style("stroke-width", 1.5)
            //     .style("stroke-dasharray", "5,5")
            //     .attr("x1", line2X1)
            //     .attr("y1", line2Y1)
            //     .attr("x2", line2X2)
            //     .attr("y2", line2Y2);
            //
            // InteractionLine.append("line").attr("class", "InteractionLine")
            //     .style("stroke", "#3fc1c0").style("stroke-width", 1)
            //     .style("stroke-dasharray", "5,5")
            //     .attr("x1", line3X1)
            //     .attr("y1", line3Y1)
            //     .attr("x2", line3X2)
            //     .attr("y2", line3Y2);
            // InteractionLine.append("line").attr("class", "InteractionLine")
            //     .style("stroke", "#3fc1c0").style("stroke-width", 1)
            //     .style("stroke-dasharray", "5,5")
            //     .attr("x1", line4X1)
            //     .attr("y1", line4Y1)
            //     .attr("x2", line4X2)
            //     .attr("y2", line4Y2);
            //
            // InteractionLine.append("line")
            //     .attr("class", "InteractionLine")
            //     .style("stroke", "red")
            //     .style("stroke-width", 2)
            //     .style("stroke-dasharray", "5,5")
            //     .attr("x1", line3X2)
            //     .attr("y1", line3Y2)
            //     .attr("x2", line3X2)
            //     .attr("y2", line3Y2 + 100);
            //
            // InteractionLine.append("line")
            //     .attr("class", "InteractionLine")
            //     .style("stroke", "red")
            //     .style("stroke-width", 2)
            //     .style("stroke-dasharray", "5,5")
            //     .attr("x1", line4X2)
            //     .attr("y1", line4Y2)
            //     .attr("x2", line4X2)
            //     .attr("y2", line4Y2 + 100);

        }
        // d3.selectAll(".target_center").attr("fill", "#f8f6f6").attr("stroke", "#f45252").attr("stroke-width", "2")
        // d3.selectAll(".target").attr("fill", "#f8f6f6").attr("stroke", "#f45252").attr("stroke-width", "1")
        // d3.selectAll(".target_slide").attr("fill", "#f8f6f6").attr("stroke", "#f45252").attr("stroke-width", "1")

    }

}

function drawWordCloud(wordFreqs) {
    let topN = 30;  // 仅展示词频最高的前 N 个单词
    let words = Object.entries(wordFreqs)
        .map(([text, size]) => ({
            text,
            size: size/1.3,
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, topN);
    let svg = d3.select("#word-cloud");
    let width = svg.node().getBoundingClientRect().width;
    let height = svg.node().getBoundingClientRect().height;


    let g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

    let cloud = d3.layout
        .cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(0)  // 不旋转单词
        .fontSize((d) => d.size)
        .on("end", draw);

    cloud.start();

    function draw(words) {
        let color = d3.scaleOrdinal().range(bigcolor);

        g.selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .style("font-size", (d) => `${d.size}px`)
            .style("fill", (d, i) => color(i))
            .attr("text-anchor", "middle")
            .attr("transform", (d) => `translate(${d.x}, ${d.y})rotate(${d.rotate})`)
            .text((d) => d.text);
    }

}
