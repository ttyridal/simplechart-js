import './style.css'
import van from "vanjs-core"
const {div, h1, span} = van.tags
import {GraphCanvas, ErrorBarPlot, CurvedLinePlot,BarLinePlot,LinePlot,ScatterPlot} from "simplechart"


const H = 1000 * 60 * 60;
function makesomedata(n) {
    const sampletime = (new Date(2024,10,21,21)).getTime();
    return Array.from({length: n}, (_,i)=>[new Date(sampletime+i*H), 1+i%2])
}

const App = () => {
    const hours_in_view = 19;
    const hours_history = 5;
    const simval = makesomedata(hours_in_view)
    const simvallong = makesomedata(hours_in_view+24)
    let Xmin = new Date(simval[0][0]);
    Xmin.setMinutes(30);

    let offset = van.state(0)
    let timewindow = van.derive(()=>{
        let m = new Date(simval[0][0]);
        let tickstart = m.getTime() + (m.getHours()%2 ? H : 0)
        m.setMinutes(offset.val);
        while (tickstart < m.getTime()) tickstart += 2*H;
        m = {
            min:m,
            max:new Date(m.getTime()+H*19),
            tickstart
            };
        return m
    });
    window.setInterval(()=>{offset.val = (offset.val+5)%240},500);

    const nowpos = hours_history * 100/hours_in_view;

    return div({id:"app"},
        div(h1("SimpleChart"),div("When all you need is a simple chart")),
        GraphCanvas(
            {xaxis:{min:Xmin}},
            CurvedLinePlot(simval),
            BarLinePlot(simval.map(([x,y])=>[x,y-1])),
            LinePlot(simval.map(([x,y])=>[x,y-0.5])),
            ScatterPlot(simval.map(([x,y])=>[x,y-0.25])),
            div({'class':'chart-title'},"SimpleChart"),
            div({'class':'chart-axis-label chart-axis-label-y'},"Temperature [ºC]"),
            div({'class':'chart-axis-label chart-axis-label-x'},"Time [h]")
        ),
        GraphCanvas(
            ErrorBarPlot(simval.map(([x,y],idx)=>({x:idx, y:y+100, min:y+100-Math.random(), max:y+100+Math.random()*0.5}))),
            div({'class':'chart-title'},"Errorbar chart"),
            div({'class':'chart-axis-label chart-axis-label-y'},"Fuel/h [ºC]"),
            div({'class':'chart-axis-label chart-axis-label-x'},"Time [m]",span("what",span("now")))
        ),
        ()=>GraphCanvas(
            {xaxis:{min:timewindow.val.min, max:timewindow.val.max, tickstart:timewindow.val.tickstart  }},
            LinePlot(simvallong.slice(Math.floor(offset.val/60)).map(([x,y])=>[x,y-0.5])),
            div({'class':'chart-plot-area nowline', style:`left:${nowpos}%`}),
            div({'class':'chart-title'},"Moving X-axis"),
            div({'class':'chart-axis-label chart-axis-label-y'},"Temperature [ºC]"),
            div({'class':'chart-axis-label chart-axis-label-x'},"Time [h]")
        ),

    );
}

van.add(document.body, App())
