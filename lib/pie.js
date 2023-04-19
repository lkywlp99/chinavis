const width = 600;
const height = 600;
const innerRadius = 0;//内圆的半径
const outerRadius1 = 0.1 * Math.min(width, height) / 2;//内圆的外半径
const outerRadius2 = 0.2 * Math.min(width, height) / 2;//外圆的外半径

const svg = d3
  .select('#chart')//选择HTML中ID为'chart'的元素。
  .append('svg')//向该元素中添加一个SVG标签。
  .attr('width', width)//设置SVG的宽和高
  .attr('height', height)
  .append('g')//在SVG中添加一个g标签，用于容纳图表的所有元素。
  .attr('transform', `translate(${width / 2}, ${height / 2})`);//将g`标签移动到SVG的中心点，使图表居中显示。

const color = d3.scaleOrdinal(d3.schemeCategory10);//创建一个序数比例尺，用于为扇形分配颜色。

const pie = d3//创建一个饼图布局生成器。
  .pie()//调用D3的pie方法。
  .sort(null)//禁用排序，使数据按照输入顺序显示。
  .value(d => d.value);//设置value方法，用于计算每个扇形的占比。

const arc1 = d3//创建内环的弧生成器。
  .arc()
  .innerRadius(innerRadius)
  .outerRadius(outerRadius1);

const arc2 = d3//创建外环的弧生成器。
  .arc()
  .innerRadius(outerRadius1 * 1.2)//设置内半径为内环外半径的1.5倍。
  .outerRadius(outerRadius2);
//分别表示内环和外环的数据。
const data1 = [
  { value: 1548, name: 'Search Engine' },
  { value: 775, name: 'Direct' },
  { value: 679, name: 'Marketing', selected: true },
];
const data2 = [
  { value: 1048, name: 'Baidu' },
  { value: 335, name: 'Direct' },
  { value: 310, name: 'Email' },
];

const g1 = svg.append('g');
const g2 = svg.append('g');
const tooltip = svg.append('text')
  .attr('id', 'tooltip')
  .attr('text-anchor', 'middle')
  .attr('font-size', '10px')
  .attr('font-weight', 'bold')
   // .style('fill', 'white')
  .style('visibility', 'hidden');

g1.selectAll('path')//在内环的g元素（g1）中选择所有的path元素，这里实际上还没有path元素，但我们将为每个扇形创建一个。
  .data(pie(data1))//将data1传递给饼图布局生成器pie，并将结果绑定到path元素。
  .enter()//处理尚未创建的path元素。
  .append('path')//处理尚未创建的path元素。
  .attr('d', arc1)//使用弧生成器来生成弧形路径。
  .attr('fill', (d, i) => color(i))//为每个扇形设置填充颜色，使用颜色比例尺color为每个扇形分配一个颜色。
  .attr('stroke', 'white')//描边颜色为白色。
  .attr('stroke-width', 1)//描边宽度为2像素
  .on('mouseover', function(event, d) {
    const [x, y] = d3.pointer(event);
    tooltip
      .attr('x', x)
      .attr('y', y)
      .text(d.data.name)
      .style('visibility', 'visible');
  })
  .on('mouseout', function() {
    tooltip.style('visibility', 'hidden');
  });
g2.selectAll('path')
  .data(pie(data2))
  .enter()
  .append('path')
  .attr('d', arc2)
  .attr('fill', (d, i) => color(i))
  .attr('stroke', 'white')
  .attr('stroke-width', 1).on('mouseover', function(event, d) {
    const [x, y] = d3.pointer(event);
    tooltip
      .attr('x', x)
      .attr('y', y)
      .text(d.data.name)
      .style('visibility', 'visible');
  })
  .on('mouseout', function() {
    tooltip.style('visibility', 'hidden');
  });
// 添加标签等其他定制化内容...
