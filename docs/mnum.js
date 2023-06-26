
// Graph plotting //////////////////////////////////////////////////////////////
const MAX_DEPTH = 16; // maximum expression complexity

var graph = {
	w: 256.0,
	h: 256.0,
	xmin: -10.0,
	xmax: 10.0,
	ymin: 10.0,
	ymax: -10.0,

	stack: Array.from(Array(MAX_DEPTH), () => new Array(256)),
	si: 0, // stack index
}

function graphOpReset() {
	//console.log("reset");
	graph.si = 0;
	for (x = 0; x < graph.w; x++) {
		graph.stack[graph.si][x] = 0;
	}
}

function graphOpFloat(f) {
	//console.log("float " + f + ", si = ", graph.si);
	for (x = 0; x < graph.w; x++) {
		graph.stack[graph.si][x] = f;
	}
	if (graph.si < MAX_DEPTH - 1) {
		graph.si++;
	} else {
		console.log("stack overflow");
	}
}

function graphOpVar() {
	//console.log("variable " + graph.si);
	for (x = 0; x < graph.w; x++) {
		graph.stack[graph.si][x] = lerp(graph.xmin, graph.xmax, (x / graph.w));
	}
	if (graph.si < MAX_DEPTH - 1) {
		graph.si++;
	} else {
		console.log("stack overflow");
	}
}

function graphOpFunc(fi, argCount) {
	//console.log("func " + fi + " " + argCount);
	for (x = 0; x < graph.w; x++) {
		switch (argCount) {
			case 1:
				const res1 = funcs[fi](graph.stack[graph.si - 1][x]);
				graph.stack[graph.si - 1][x] = res1;
				break;
			case 2:
				const a0 = graph.stack[graph.si - 2][x];
				const a1 = graph.stack[graph.si - 1][x];
				const res2 = funcs[fi](a0, a1);
				graph.stack[graph.si - 2][x] = res2;
				break;
			default:
				break;
		}
	}
	graph.si -= (argCount - 1);
	return true;
}

/// Modulo that works correctly on negative numbers
function modP(x, n) { return ((x % n) + n) % n; }
function lerp(a, b, t) { return a + (b - a) * t; }
function invLerp(a, b, x) { return (x - a) / (b - a); }

funcs = [
	(x, y) => (x + y), //FTag_sum
	(x, y) => (x * y), //FTag_product
	(x, y) => (x - y), //FTag_subtract
	(x, y) => (x / y), //FTag_divide
	modP, // (x, y) => (x % y), //FTag_modulo
	Math.pow, //FTag_power
	(x, y) => (x == y), //FTag_equals
	(x, y) => (x > y), //FTag_gt
	(x, y) => (x >= y), //FTag_gte
	(x, y) => (x < y), //FTag_lt
	(x, y) => (x <= y), //FTag_lte
	(x, y) => NaN, //FTag_gcd
	(x, y) => NaN, //FTag_lcm
	(x, y) => NaN, //FTag_ncr
	(x, y) => NaN, //FTag_npr
	(x, y) => (+x), //FTag_unaryPlus
	(x, y) => (-x), //FTag_negate
	(x, y) => NaN, //FTag_factorial
	(x) => (x), //FTag_re
	(x) => 0, //FTag_im
	(x, y) => NaN, //FTag_derivative
	(x, y) => NaN, //FTag_integral
	Math.sqrt, //FTag_sqrt
	(x) => (Math.pow(x, 1.0 / 3.0)), //FTag_cbrt
	(x) => x == 0 ? 0 : (x < 0 ? -1 : 1), //FTag_sgn
	Math.abs, //FTag_abs
	Math.log, //FTag_ln
	(x, y) => Math.log(x) / Math.log(y), //FTag_logBase
	Math.sin,      //FTag_sin
	Math.cos,      //FTag_cos
	Math.tan,      //FTag_tan
	Math.asin,      //FTag_asin
	Math.acos,      //FTag_acos
	Math.atan,      //FTag_atan
	Math.sinh,      //FTag_sinh
	Math.cosh,      //FTag_cosh
	Math.tanh,      //FTag_tanh
	Math.asinh,     //FTag_asinh
	Math.acosh,     //FTag_acosh
	Math.atanh,     //FTag_atanh
	(x) => (1.0 / Math.sin(x)), //FTag_csc
	(x) => (1.0 / Math.cos(x)), //FTag_sec
	(x) => (1.0 / Math.tan(x)), //FTag_cot
	(x) => (1.0 / Math.sinh(x)), //FTag_csch
	(x) => (1.0 / Math.cosh(x)), //FTag_sech
	(x) => (1.0 / Math.tanh(x)), //FTag_coth
	(x, y) => (Math.sin(x) / x), //FTag_sinc
	Math.atan2,    //FTag_atan2
	Math.round,    //FTag_round
	Math.floor,    //FTag_floor
	Math.ceil,     //FTag_ceil
	Math.trunc,    //FTag_trunc
	(x, y) => NaN, //FTag_vector
];

var canvas;

function getCanvas() {
	if (canvas) {
		return canvas;
	}
	canvas = document.getElementById("graph-canvas");
	canvas.addEventListener('wheel', (evt) => {
		graph.yscale += evt.deltaY * 0.01;
	}, false);

	if (!canvas) {
		return;
	}
	ctx = canvas.getContext("2d");
}

// Multiply / divide by 10 until grid has reasonable spacing
function scaleGridSpacing(x) {
	const lg = Math.log10(x);
	return Math.pow(10, lg - Math.round(lg-1));
}

function drawGraphBackground(ctx, graph) {
	ctx.strokeStyle = "#00000040";
	ctx.lineWidth = 1;
	ctx.beginPath();

	// Draw the grid
	const w = scaleGridSpacing(graph.w / Math.abs(graph.xmax - graph.xmin));
	// const lg = Math.log10(w);
	// w = Math.pow(10, lg - Math.round(lg))
	const h = scaleGridSpacing(graph.h / Math.abs(graph.ymax - graph.ymin));

	// console.log(w + " " + h, " (" + modP(graph.xmin, w) + " " + modP(graph.ymin, h))
	const ox = invLerp(graph.xmin, graph.xmax, 0) * graph.w;
	const oy = invLerp(graph.ymin, graph.ymax, 0) * graph.h;

	for (let x = modP(ox, w); x < canvas.width; x += w) {
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvas.height);
	}
	for (let y = modP(oy, h); y < canvas.height; y += h) {
		ctx.moveTo(0, y);
		ctx.lineTo(canvas.width, y);
	}
	ctx.stroke();

	// draw numbers on the axes
	ctx.fillStyle = "#000000FF";
	ctx.font = "12px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for (let x = modP(ox, w); x < canvas.width; x += w) {
		const value = lerp(graph.xmin, graph.xmax, x / graph.w);
		ctx.fillText(value.toFixed(2), x, oy);
	}
	for (let y = modP(oy, h); y < canvas.height; y += h) {
		const value = lerp(graph.ymin, graph.ymax, y / graph.h);
		ctx.fillText(value.toFixed(2), ox, y);
	}

	// Draw the axes
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#808080FF";
	ctx.beginPath();

	ctx.moveTo(ox, 0);
	ctx.lineTo(ox, canvas.height);
	ctx.moveTo(0, oy);
	ctx.lineTo(canvas.width, oy);
	ctx.stroke();
}

function drawGraph() {
	canvas = document.getElementById("graph-canvas");
	if (!canvas) {
		return;
	}
	ctx = canvas.getContext("2d");

	// draw a simple grid on a white background
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	drawGraphBackground(ctx, graph);

	// draw the graph
	ctx.strokeStyle = "#FF0000";
	ctx.lineWidth = 2;
	ctx.beginPath();

	// set undefined values to 0
	for (let x = 0; x < canvas.width; x += 1) {
		if (graph.stack[0][x] === undefined) {
			console.log("undefined at " + x)
			graph.stack[0][x] = 0;
		}
	}

	// get a sorted copy of the stack
	const values = graph.stack[0].slice().sort((a, b) => (a - b));

	for (let x = 0; x < canvas.width; x += 1) {
		if (values[x] === undefined) {
			console.log("undefined at " + x)
			values[x] = 0;
		}
	}

	// graph.ymin = values[values.length - 1];
	// graph.ymax = values[0];
	// console.log(values);
	const bl = values[values.length * 7 / 8];
	const bh = values[values.length * 1 / 8];
	const br = Math.abs(bl - bh);
	graph.ymin = bl + br * 0.25;
	graph.ymax = bh - br * 0.25;

	ctx.moveTo(0, graph.oy);
	for (let x = 0; x < canvas.width; x += 1) {
		const yy = graph.stack[0][x];
		const fy = invLerp(graph.ymin, graph.ymax, yy) * graph.h;
		ctx.lineTo(x, fy);
	}
	ctx.stroke();
}

/// exported so webassembly can send strings to JS
function mnumSendString(ptr, len, type) {
	const s = toJsString(ptr, len);
	switch (type) {
		case 0:
			console.log(s);
			break;
		case 1:
			document.getElementById("mnum-error").innerHTML = s;
			// console.log("error: " + s);
			// document.getElementById("mnum-input").setSelectionRange(1, 3);
			break;
		case 2:
			document.getElementById("mnum-output").innerHTML = s;
			break;
	}
}

// Don't display errors while user is still typing
let timer;

function onMnumInput(str) {
	wasmSendString(str, 0);
	clearTimeout(timer);
	timer = setTimeout(() => {


		wasmSendString(str, 1);
	}, /*msec*/ 500);
}

function mathOp1(ftag, arg) {
	return funcs[ftag](arg);
}
function mathOp2(ftag, lhs, rhs) {
	return funcs[ftag](lhs, rhs);
}

async function initWasm() {
	wasmInstance = await loadWasm('mnum.wasm', {
		mnumSendString, drawGraph, graphOpFloat, graphOpFunc, graphOpVar, graphOpReset, mathOp1, mathOp2,
	});
	document.getElementById('mnum-input').addEventListener('input', (ev) => onMnumInput(ev.target.innerText));

	//document.getElementById('mnum-radix').addEventListener('input', (ev) => setRadix(ev.target.value));
	//setRadix(document.getElementById('mnum-radix').value);

	wasmInstance.exports.mnumInit();
}

window.addEventListener('load', initWasm);
