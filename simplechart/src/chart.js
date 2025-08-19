// see pancake for inspiration, https://github.com/Rich-Harris/pancake/tree/master/src/lib/components
// https://dev.to/richharris/a-new-technique-for-making-responsive-javascript-free-charts-gmp

const svgns = "http://www.w3.org/2000/svg"

let protoOf = Object.getPrototypeOf
let alwaysConnectedDom = {isConnected: 1}
let objProto = protoOf(alwaysConnectedDom)

import "./simplechart.css"
import * as curveutils from "./curveutils"

function vaninspired(tag, ns, ...args) {
    let [{...props}, ...children] = protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args]
    let dom = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
    for (const [key, value] of Object.entries(props)) dom.setAttribute(key,value);
    for (let c of children.flat(Infinity)) dom.append(c);
    return dom;
}

const div = (...args)=>vaninspired('div',undefined,...args)
const svg = (...args)=>vaninspired('svg',svgns,...args)
const path = (...args)=>vaninspired('path',svgns,...args)
const g = (...args)=>vaninspired('g',svgns,...args)


function BestTick(largest, mostticks) {
    let minimum = largest / mostticks
    let magnitude = 10 ** Math.floor(Math.log10(minimum))
    let residual = minimum / magnitude
    // this table must begin with 1 and end with 10
    let table = [1, 2, 2.5, 5, 10]
    let tick = residual < 10 ? table.find(number => number > residual) : 10;
    return tick * magnitude
}

function nearest(x,multiple) {
    return Math.round(x / multiple) * multiple
}

function scale(domain, range) {
  const m = (range[1] - range[0]) / (domain[1] - domain[0]);
  return num => range[0] + m * (num - domain[0]);
}

function xaxisdate(minmax,xtick,xtickstart,fmter) {
        if (xtick/1000 < 2) { // less than 2sec, use ms or whaterever scale
            fmter = {format:(n)=>(n-minmax.Xmin)}
        }
        else if (xtick/1000/60 < 2) { // less than 2min, use seconds scale, decimal
            fmter = {format:(n)=>(n-minmax.Xmin)/1000}
        }
        else if (xtick/1000/60/60 < 2) { // less than 2hours, use minute scale
            const minute = 1000*60;
            xtickstart = nearest(minmax.Xmin,minute);
            let xtickrange = minmax.Xmax - xtickstart;
            xtick = BestTick(xtickrange/minute, 10) * minute;
            fmter = new Intl.DateTimeFormat(undefined,{hour: "numeric", minute:"numeric",hour12: false});
        }
        else if (xtick/1000/60/60/24 < 2) { // less than 2days, use hour scale
            const hour = 1000 * 60 * 60;
            xtickstart = nearest(minmax.Xmin,hour);
            let xtickrange = minmax.Xmax - xtickstart;
            xtick = BestTick(xtickrange/hour, 12) * hour;
            fmter = new Intl.DateTimeFormat(undefined,{hour: "numeric",hour12: false});
        }
        else if (xtick/1000/60/60/24 < 60) { // less than 2months, use day-month scale
            const day = 1000 * 60 * 60 * 24;
            xtickstart = nearest(minmax.Xmin,day);
            let xtickrange = minmax.Xmax - xtickstart;
            xtick = BestTick(xtickrange/day, 12) * day;
            fmter = new Intl.DateTimeFormat(undefined,{month: "numeric",day: "numeric",});
        }
        else if (xtick/1000/60/60/24 > 360*10) { // more than 10years, use years
            xtick = BestTick(minmax.Xrange/1000/60/60, 10) * 1000 * 60 * 60;
            fmter = new Intl.DateTimeFormat(undefined,{year: "numeric"});
        } else {
            fmter = new Intl.DateTimeFormat(undefined,{year: "numeric",month:"numeric"});
        }
        xtickstart = Number(xtickstart);


    return [xtick,xtickstart,fmter]
}

const canvas_width = 1500;
const canvas_height = 1000;
export const GraphCanvas = (...args) => {
    let [{...props}, ...children] = protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args]

    const epsilon = (10 ** -6);
    let content = children.filter(c=>c instanceof GenericPlot);
    let other = children.filter(c=>!(c instanceof GenericPlot));
    let minmaxes = content.map(c=>c.minmax());
    let minmax = {
            Ymin: Math.floor(10*Math.min(...minmaxes.map(p=>p.Ymin)))/10,
            Ymax: Math.ceil(10*Math.max(...minmaxes.map(p=>p.Ymax))  +1)/10,
            Xmin: props?.xaxis?.min || Math.min(...minmaxes.map(p=>p.Xmin)),
            Xmax: props?.xaxis?.max || Math.max(...minmaxes.map(p=>p.Xmax)),
        }
    minmax.Xrange = minmax.Xmax - minmax.Xmin;
    minmax.Yrange = minmax.Ymax - minmax.Ymin;
    const yscale = scale([minmax.Ymin, minmax.Ymax], [canvas_height, 0]);
    const xscale = scale([minmax.Xmin, minmax.Xmax], [0, canvas_width]);

    let ytick = BestTick(minmax.Yrange, 5);
    let xtick = BestTick(minmax.Xrange, 10);
    let ytickstart = nearest(minmax.Ymin, 10 ** Math.floor(Math.log10(ytick)));
    let xtickstart = props?.xaxis?.tickstart || minmax.Xmin;

    let fmter = {format:(n)=>n.toFixed(Math.max(0,-Math.floor(Math.log10(xtick))))}
    let yfmter = {format:(n)=>n.toFixed(Math.max(0,-Math.floor(Math.log10(ytick))))}
    const xisdate = content[0].points[0][0] instanceof Date;
    if(xisdate) {
        [xtick,xtickstart,fmter] = xaxisdate(minmax,xtick,xtickstart,fmter);
        xtickstart = props?.xaxis?.tickstart || xtickstart;
    }

    let xticks = Math.ceil(minmax.Xrange / xtick);
    let xlabels = Array.from({length: xticks}, (_,idx)=>{
        const t = xtickstart + idx * xtick;
        return [100*xscale(t)/canvas_width, fmter.format(t)]
    });
    if (xlabels[xlabels.length-1][0]>100) xlabels.pop();
    let yticks = Math.ceil(minmax.Yrange / ytick);
    if (yticks <= 3) {yticks*=2; ytick /=2};
    let ylabels = Array.from({length: yticks}, (_,idx)=>{
        const t = ytickstart + ytick*idx;
        return [100*yscale(t)/canvas_height, yfmter.format(t)];
    });

    let graphs=content.map((gr,idx)=>g({'class':`series-${idx}`},gr.draw(xscale,yscale)));


    const labels = [
        div({'class':'chart-yticks-area onegridcell'},ylabels.map(x=>div({'class':'axis-tick-label-y','style':`margin-top:${x[0]}%`}, div({'class':'chart-tick-label'},x[1])))),
        div({'class':'chart-xticks-area onegridcell'},xlabels.map(x=>div({'class':'axis-tick-label-x','style':`margin-left:${x[0]}%`}, div({'class':'chart-tick-label'},x[1])))),
    ]


    return div({'class':'chart-container'},
        div({'class':'chart-plot-area'},
            ...ylabels.map((x,idx)=>div({'class':"grid-axis grid-axis-x", style:`top:${x[0]}%`})),
            ...xlabels.map((x,idx)=>div({'class':"grid-axis grid-axis-y", style:`left:${x[0]}%`})),
            svg({
                viewBox:`${0} ${0} ${canvas_width} ${canvas_height}`,
                preserveAspectRatio: "none",
                },
                ...graphs,
            ),
        ),
        ...labels,
        ...other
    );
//             text({x:500,y:500,'fill':'white',style:'font:bold 80px sans-serif;'},"No data");
}

class GenericPlot {
    constructor(points) {
        this.points = points;
    }
    minmax() {
        return {
            Ymin: Math.min(...this.points.map(p=>p[1])),
            Ymax: Math.max(...this.points.map(p=>p[1])),
            Xmin: Math.min(...this.points.map(p=>p[0])),
            Xmax: Math.max(...this.points.map(p=>p[0])),
        }
    }
}

class BarLinePlot_ extends GenericPlot {
    draw(xscale,yscale) {
        const drawSquare = (p) => {
            p = p.map(([x,y])=>[xscale(x),yscale(y)]);
            p.push([canvas_width,p[p.length-1][1]]);
            
            let d = `M${p[0][0]} ${p[0][1]}`
            let xprev = p[0][0], yprev = p[0][1];
            d += p.slice(1).map(([x,y],idx)=>{
              let seg = (Math.abs(y - yprev) < 50) 
                ? `L${x} ${yprev}L${x} ${y}`
                : `L${x-10} ${yprev} C${x+10} ${yprev} ${x-25} ${y} ${x+10} ${y}`
                xprev = x;
                yprev = y;
                return seg;
            }).join("")

            return d;
        }
        return path({ d:drawSquare(this.points)});

    }
}

export function BarLinePlot(points) { return new BarLinePlot_(points)}


class LinePlot_ extends GenericPlot {
    draw(xscale,yscale) {
        const drawLine = (p) => {
            p = p.map(([x,y])=>[xscale(x),yscale(y)]);
            let d = `M${p[0][0]} ${p[0][1]}`
            d += p.slice(1).map(([x,y],idx)=>`L${x} ${y}`).join("")
            return d;
        }
        return path({ d:drawLine(this.points)});
    }
}

export function LinePlot(points) { return new LinePlot_(points)}

class CurvedLinePlot_ extends GenericPlot {
    draw(xscale,yscale) {
        let p = this.points.map(([x,y])=>[xscale(x),yscale(y)]);
        return path({d:curveutils.drawCurve(p)})
    }
}
export function CurvedLinePlot(points) { return new CurvedLinePlot_(points)}


class ScatterPlot_ extends GenericPlot {
    draw(xscale,yscale) {
        const Point = (x,y, opacity="1")=>{
            return path({'class':'point',
                  'stroke-opacity':opacity,
                  d:`M${x} ${y} A0 0 0 0 1 ${x} ${y}`
            })
        }

        let p = this.points.map(([x,y])=>[xscale(x),yscale(y)]);
        return g(...p.map(p=>Point(p[0],p[1],1)));
    }
}
export function ScatterPlot(points) { return new ScatterPlot_(points)}


class ErrorBarPlot_ extends GenericPlot {
    minmax() {
        return {
            Ymin: Math.min(...this.points.map(p=>p.min)),
            Ymax: Math.max(...this.points.map(p=>p.max)),
            Xmin: Math.min(...this.points.map(p=>p.x)),
            Xmax: Math.max(...this.points.map(p=>p.x)),
        }
    }
    draw(xscale,yscale) {
        const Point = (x,y, opacity="1")=>{
            return path({'class':'point pointerr',
                  'stroke-opacity':opacity,
                  d:`M${x} ${y} A0 0 0 0 1 ${x} ${y}`
            })
        }
        const pfn = (v) => {
            if (isNaN(v.max) || isNaN(v.min))
                return Point(v.x, v.y);
            else return g({'stroke-width': "1"},
                path({d:`M${v.x-10} ${v.max}l20 0M${v.x-10} ${v.min}l20 0M${v.x} ${v.min}L${v.x} ${v.max}`}),
                Point(v.x, v.y)
            )
        }


        let p = this.points.map(({x,y,min,max})=>({x:xscale(x),y:yscale(y),min:yscale(min),max:yscale(max)}));
        return g(...p.map(p=>pfn(p)));
    }
}
export function ErrorBarPlot(points) { return new ErrorBarPlot_(points)}


