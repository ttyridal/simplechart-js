import './style.css'
import van from "vanjs-core"
const {div, h1, span} = van.tags
import {GraphCanvas, ErrorBarPlot, CurvedLinePlot,BarLinePlot,LinePlot,ScatterPlot} from "simplechart"


function makesomedata() {
    const sampletime = (new Date(2024,10,21,21)).getTime();
    const H = 1000 * 60 * 60;
    return [1,2,1,2,1,2,1, 2,1,2,1,2,1,2,1,2,1,2,1 ].map((y,i)=>[new Date(sampletime+i*H), y]);
}

const App = () => {
    let simval = makesomedata()
    let Xmin = new Date(simval[0][0]);
    Xmin.setMinutes(30);

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
            div({'class':'chart-title'},"SimpleChart"),
            div({'class':'chart-axis-label chart-axis-label-y'},"Fuel/h [ºC]"),
            div({'class':'chart-axis-label chart-axis-label-x'},"Time [m]",span("what",span("now")))
        ),
    );
}

van.add(document.body, App())
