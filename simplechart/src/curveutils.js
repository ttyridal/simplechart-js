
let t = 1 / 10;// change this to change the curvature

export function drawCurve(p) {

  var pc = controlPoints(p); // the control points array

  let d="";
  d += `M${p[0][0]}, ${p[0][1]}`
  
  // the first & the last curve are quadratic Bezier
  // because I'm using push(), pc[i][1] comes before pc[i][0]
  d += `Q${pc[1][1].x}, ${pc[1][1].y}, ${p[1][0]}, ${p[1][1]}`;


  if (p.length > 2) {
    // central curves are cubic Bezier
    for (var i = 1; i < p.length - 2; i++) {
      
     d+= `C${pc[i][0].x}, ${pc[i][0].y} ${pc[i + 1][1].x},${pc[i + 1][1].y} ${p[i + 1][0]},${p[i + 1][1]}`; 

    }//end for
    // the first & the last curve are quadratic Bezier
    let n = p.length - 1;
    d+=`Q${pc[n - 1][0].x}, ${pc[n - 1][0].y} ${p[n][0]},${p[n][1]}`;
  }
  return d;
}

function controlPoints(p) {
  // given the points array p calculate the control points
  let pc = [];
  for (var i = 1; i < p.length - 1; i++) {
    let dx = p[i - 1][0] - p[i + 1][0]; // difference x
    let dy = p[i - 1][1] - p[i + 1][1]; // difference y
    // the first control point
    let x1 = p[i][0] - dx * t;
    let y1 = p[i][1] - dy * t;
    let o1 = {
      x: x1,
      y: y1
    };

    // the second control point
    var x2 = p[i][0] + dx * t;
    var y2 = p[i][1] + dy * t;
    var o2 = {
      x: x2,
      y: y2
    };

    // building the control points array
    pc[i] = [];
    pc[i].push(o1);
    pc[i].push(o2);
  }
  return pc;
}
