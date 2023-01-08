//Data Tools
//把標示為空值的字串("NA")變成JavaScript認知的空值
const parseNA = string => (string == '' ? undefined : string);
//const parseNAs = int =>(int == '' ? undefined : int);
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);

function type(d){
    const date = parseDate(d.release_date);
    return {
        Rank:+d.Rank,
        Country_Code:parseNA(d.Country_Code),
        Gold_Medal:+d.Gold_Medal,
        Silver_Medal:+d.Silver_Medal,
        Bronze_Medal:+d.Bronze_Medal,
        Total:+d.Total,
        Country:parseNA(d.Country),
        Population:+d.Population,
        GDP_per_capita:+d.GDP_per_capita,
        Continent:parseNA(d.Continent),
    }
}

function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}

// //Data Selection
function filterData(data){
    return data.filter(
        d => {
            return(
                d.Rank > 0 && d.Rank < 21 && 
                d.Total > 0 &&
                d.Population > 0 && 
                d.GDP_per_capita > 0 && 
                d.Country_Code && 
                d.Country &&
                d.Continent
            );
        }
    );
}

function prepareBarChartData(data){
    console.log(data);
    const dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.Total),
        d => d.Country
    );
//     // debugger;
    const dataArray = Array.from(dataMap, d=>({Country:d[0], Total:d[1]}));
//     // debugger;
    return dataArray;
}
function setupCanvas(barChartData, medalClean){

    let metric = 'Total';

    function click(){
//         // debugger;
        metric = this.dataset.name;
        const thisData = chooseData(metric, medalClean);
        update(thisData);
    }

    d3.selectAll('button').on('click',click);

    function update(data){
        console.log(data);
        //Update Scale
        xMax = d3.max(data, d=>d[metric]);
        xScale_v3 = d3.scaleLinear([0, xMax],[0, barchart_width]);

        yScale = d3.scaleBand().domain(data.map(d=>d.Country))
        .rangeRound([0, barchart_height]).paddingInner(0.25);

        //Transition Settings
        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update Header
        header.select('tspan').text(`Top 20  country by ${metric} ${metric === 'country by population' ? '' : 'in medal ranking Tokyo Olympic'}`);

        //Update Bar
        bars.selectAll('.bar').data(data, d=>d.Country).join(
            enter => {
                enter.append('rect').attr('class', 'bar')   
                .attr('x',0).attr('y',d=>yScale(d.Country))
                .attr('height',yScale.bandwidth())
                .style('fill','lightcyan')
                .transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('width',d=>xScale_v3(d[metric]))
                .style('fill','dodgerblue');
            },
            update => {
                update.transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('y',d=>yScale(d.Country))
                .attr('width',d=>xScale_v3(d[metric]));
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                .style('fill-opacity',0)
                .remove();
            }
        );

//         //add event listenser
        d3.selectAll('.bar')
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);
    }

    const svg_width = 700;
    const svg_height = 500;
    const barchart_margin = {top:80, right:40, bottom:40,left:250};
    const barchart_width = svg_width - (barchart_margin.left + barchart_margin.right);
    const barchart_height = svg_height - (barchart_margin.top + barchart_margin.bottom);

    const this_svg = d3.select('.bar-chart-container').append('svg')
    .attr('width', svg_width).attr('height', svg_height).append('g')
        .attr('transform', `translate(${barchart_margin.left}, ${barchart_margin.top})`);
    // .attr('transform', 'translate('+chart_margin.left+','+chart_margin.top+')');

    //scale
    // d3.extent -> find min & max
    //const xExtent = d3.extent(barChartData, d=> d.revenue);
    const xExtent = d3.extent(barChartData, d=> d.Total);
    // debugger;
    //v1 (min, max)
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, barchart_width]);
    //v2 (0, max)
   // let xMax = d3.max(barChartData, d=> d.revenue);
    let xMax = d3.max(barChartData, d=> d.Total);
    let xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0, barchart_width]);
    //v3 short writing for v2
    let xScale_v3 = d3.scaleLinear([0, xMax], [0, barchart_width]);
    
    //y
    let yScale = d3.scaleBand().domain(barChartData.map(d=>d.Country))
        .rangeRound([0, barchart_height])
                                 .paddingInner(0.1);
    //Draw bars
    // const bars = this_svg.selectAll('.bar').data(barChartData).enter()
    //              .append('rect').attr('class', 'bar')
    //              .attr('x',0).attr('y', d=>yScale(d.Country_Code))
    //              .attr('width', d=>xScale_v3(d.Total))
    //              .attr('height', yScale.bandwidth())
    //              .style('fill', 'dodgerblue');

    const bars = this_svg.append('g').attr('class', 'bars');

    //Draw Header
    let header = this_svg.append('g').attr('class','bar-header')
                   .attr('transform',`translate(0,${-barchart_margin.top/2})`)
                   .append('text');
    // header.append('tspan').text('Total revenue by genre in $US');
    header.append('tspan').text('Top 20 Country');
    header.append('tspan').text('In 2020')
          .attr('x',0).attr('y',20).style('font-size','0.8em').style('fill','#555');

    //Draw X axis & Y axis
    let xAxis = d3.axisTop(xScale_v3).tickFormat(formatTicks)
                    .tickSizeInner(-barchart_height)
                    .tickSizeOuter(0);
                   

    // const xAxisDraw = this_svg.append('g').attr('class','x axis').call(xAxis);
    let xAxisDraw = this_svg.append('g').attr('class', 'x axis');

    //tickSize : set tickSizeInner & tickSizeOuter at the same time with the same value
    let yAxis = d3.axisLeft(yScale).tickSize(0);

    // const yAxisDraw = this_svg.append('g').attr('class','y axis').call(yAxis);
    let yAxisDraw = this_svg.append('g').attr('class', 'y axis');
    yAxisDraw.selectAll('text').attr('dx','-0.6em');
    
    update(barChartData);

    //interactive
    const tip = d3.select('.tooltip');
    //e -> event
    function mouseover(e){
        // debugger;
        // alert("hi");
        //get data
        const thisBarData = d3.select(this).data()[0];
        // debugger;
        const bodyData = [
           ['Total', thisBarData.Total],
           ['Population', thisBarData.Population],
           ['TMBD Gdp per capita', Math.round(thisBarData.GDP_per_capita)],
           ['Country',thisBarData.Country],
           ['Gold medal', thisBarData.Gold_Medal],
           ['Silver medal', thisBarData.Silver_Medal],
           ['Bronze medal', thisBarData.Bronze_Medal],
           ['Continent', thisBarData.Continent],
        ];

        // debugger;
        tip.style('left',(e.clientX+15)+'px')
           .style('top',e.clientY+'px')
           .transition()
           .style('opacity',0.98);
        
        //show this data
        tip.select('h3').html(`${thisBarData.Country }${thisBarData.Rank}`);
       tip.select('h4').html(`${thisBarData.Country}, ${thisBarData.Rank} `);

        d3.select('.tip-body').selectAll('p').data(bodyData)
          .join('p').attr('class','tip-info').html(d => `${d[0]} : ${d[1]}`);

    }

    function mousemove(e) {
        tip.style('left', (e.clientX+15) + 'px')
            .style('top', e.clientY + 'px');
    }

    function mouseout(e) {
        tip.transition()
        .style('opacity', 0);
    }

    d3.selectAll('.bar')
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);
}

// Main
function ready(medal){
    const medalClean = filterData(medal);
    // console.log(medalClean);
    // const barChartData = prepareBarChartData(medalClean).sort(
    //     (a,b)=>{
    //         return d3.descending(a.total,b.total);
    //     }
    // );
    // console.log(barChartData);
    // Get Top 20 total medals country
    const TotalData = chooseData("Total", medalClean);
    console.log(TotalData);
    setupCanvas(TotalData, medalClean);
 }

d3.csv('data/medal.csv', type).then(
    res => { 
        console.log('CSV:',res);
        // console.log('CSV:',res[0]);
        ready(res);
        // debugger;
    }
);

function chooseData(metric, medalClean){
    const thisData = medalClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<20);
    return thisData;
}