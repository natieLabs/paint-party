var canvas, stage, carve;
var ctx, ctxcarve;
var side;
var drawingCanvas;
var oldPt;
var oldMidPt;
var title;
var color;
var stroke;
var jsonColors = [];
var savecircle;
var currentCanvas = 1;
const NUM_CARVES = 7;
var CANVAS_CACHE = [];
var colors = ["#FF1D25", "#7AC943", "#0071BC", "#FF931E", "#FFE200", "#29ABE2", "#009245", "#FBB03B", "#FFFFFF", "#f2f2f2", "#CCCCCC", "#000000"];

function init() {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');

    carve = document.getElementById('carveout');
    ctxcarve = carve.getContext("2d");

    var w = window.innerWidth || e.clientWidth || g.clientWidth;
    var h = window.innerHeight * 0.8 || e.clientHeight * 0.8 || g.clientHeight * 0.8;
    side = Math.min(w, h);

    // $("#myCanvas")[0].attr("width", width).attr("height", height);

    ctx.canvas.height = side;
    ctx.canvas.width = side;

    color = colors[0];

    //check to see if we are running in a browser with touch support
    stage = new createjs.Stage(canvas);
    stage.autoClear = false;
    stage.enableDOMEvents(true);

    createjs.Touch.enable(stage);
    createjs.Ticker.setFPS(24);

    drawingCanvas = new createjs.Shape();

    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.addChild(drawingCanvas);
    stage.update();

    make_carve(currentCanvas, "img" + currentCanvas + ".png", " ");
    make_palette();
    make_bgPicker();

    $('img').on('click', handleCanvasSwitch);
}

function handleCanvasSwitch(event) {
    // housekeeping for current canvas
    CANVAS_CACHE[currentCanvas] = cloneCanvas(canvas);
    // ctx.drawImage(carve, 0, 0);
    // $('#img' + currentCanvas).attr("src", canvas.toDataURL());

    // update current canvas to point to chosen canvas
    carveImageSrc = $(this).attr('id') + ".png";
    currentCanvas = $(this).attr('id').slice(-1);
    var dataURL = $(this).attr('src');

    if (CANVAS_CACHE[currentCanvas] == null) {
        clearBoard();
        make_carve(currentCanvas, carveImageSrc);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctxcarve.clearRect(0, 0, carve.width, carve.height);
        make_carve(currentCanvas, carveImageSrc);
        ctx.drawImage(CANVAS_CACHE[currentCanvas], 0, 0, side, side);
    }
}

function handleMouseDown(event) {
    if (!event.primary) {
        return;
    }
    if (stage.contains(title)) {
        stage.clear();
        stage.removeChild(title);
    }

    stroke = 40;
    oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
    oldMidPt = oldPt.clone();
    stage.addEventListener("stagemousemove", handleMouseMove);
}

function handleMouseMove(event) {
    if (!event.primary) {
        return;
    }
    var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, oldPt.y + stage.mouseY >> 1);
    drawingCanvas.graphics.clear()
        .setStrokeStyle(stroke, 'round', 'round')
        .beginStroke(color).moveTo(midPt.x, midPt.y)
        .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

    oldPt.x = stage.mouseX;
    oldPt.y = stage.mouseY;
    oldMidPt.x = midPt.x;
    oldMidPt.y = midPt.y;

    stage.update();
}

function handleMouseUp(event) {
    if (!event.primary) {
        return;
    }
    ctx.drawImage(carve, 0, 0);
    $('#img' + currentCanvas).attr("src", canvas.toDataURL());
    stage.removeEventListener("stagemousemove", handleMouseMove);
}

function make_palette() {
    for (var i = 0; i < colors.length; i++) {
        jsonColors.push({
            "i": i,
            "color": colors[i]
        })
    }
    var svgContainer = d3.select("#paletteWrapper").append("svg").attr("id", "palette");

    var circles = svgContainer.selectAll("circle")
        .data(jsonColors)
        .enter()
        .append("circle");

    var circleAttributes = circles
        .attr("cx", function(d) {
            if (d.i < colors.length / 2) {
                return (d.i * 12 + 16) + "%";
            } else {
                return ((d.i - colors.length / 2) * 12 + 22) + "%";
            }
        })
        .attr("cy", function(d) {
            var cy = (~~(d.i / (colors.length / 2)) * 33 + 33) + "%";
            console.log(cy);
            return cy
        })
        .attr("r", function(d) {
            return "6%"
        })
        .style("fill", function(d) {
            return d.color;
        })
        .filter(function(d) {
            return d.i == 0
        })
        .style("stroke", "#0d0d0d").style("stroke-width", 4)

    // stroke the circle that represents the eraser so it's visible against background
    circles.filter(function(d) {
            return d.color == "#f2f2f2"
        })
        .style("stroke", "white").style("stroke-width", 4)

    circles.on('click', function(d) {
        color = d.color;
        circles.transition().attr("r", "6%").style("stroke", function(d) {
            return ((d.color == "#f2f2f2") ? "white" : "none")
        });

        d3.select(this).transition().attr("r", "8%")
            .transition().attr("r", "6%")
            .style("stroke", "#0d0d0d")
            .style("stroke-width", 4);
    });

    var controls = d3.select("#controlsWrapper").append("svg").attr("id", "controls");

    var savebutton = controls.append("g").attr("id", "save")
        .attr("style", "cursor: pointer")
        .on("click", save_img);

    savecircle = savebutton.append("circle")
        .attr("cx", function(d) {
            return "5%"
        })
        .attr("cy", function(d) {
            return "25%"
        })
        .attr("r", function(d) {
            return "6%"
        })
        .style("fill", "#CCCCCC")
        // .style("stroke-width", 4);

    savebutton.append("text").attr('font-family', 'FontAwesome')
        .attr("x", "5%")
        .attr("y", "25%")
        .attr("fill", "white")
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '2vmin')
        .text(function(d) {
            return '\uf063'
        });

    var sharebutton = controls.append("g").attr("id", "share")
        .attr("style", "cursor: pointer")
        .on("click", share_page);

    sharecircle = sharebutton.append("circle")
        .attr("cx", function(d) {
            return "18%" })
        .attr("cy", function(d) {
            return "25%" })
        .attr("r", function(d) {
            return "6%" })
        .style("fill", "#CCCCCC")
        // .style("stroke", "#0d0d0d")
        // .style("stroke-width", 4);

    sharebutton.append("text").attr('font-family', 'FontAwesome')
        .attr("x", "18%")
        .attr("y", "25%")
        .attr("fill", "white")
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '2vmin')
        .text(function(d) {
            return '\uf09a'
        });
}

// create carved canvas to cover artwork
// src can be url of image or dataURL of canvas
function make_carve(i, carveImageSrc) {
    // var d = $.Deferred();
    base_image = new Image();
    carve.width = carve.height = side;

    base_image.onload = function() {
        ctxcarve.drawImage(base_image, 0, 0, side, side);
        ctxcarve.fill();
    }
    base_image.src = carveImageSrc;

    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // setTimeout(function() {
    //     d.resolve();
    // }, 500);
    // return d;
}

function clearBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxcarve.clearRect(0, 0, carve.width, carve.height);
}

var imgdb = [{ "name": "emojis", "count": 2 },
    { "name": "emojis", "count": 2 },
]

function make_bgPicker() {
    // var d = $.Deferred();
    var src;
    for (var i = 0; i < NUM_CARVES; i++) {
        src = "img" + i + ".png";
        $("#bgPicker").append("<img id='img" + i + "' src='" + src + "'></img>");
        CANVAS_CACHE.push(null);
    }
    // setTimeout(function() {
    //     d.resolve();
    // }, 100);

    // return d;
}

function save_img() {
    ctx.drawImage(carve, 0, 0);
    ctx.fill();
    canvas.toBlob(function(blob) {
        saveAs(blob, "natie painted.png");
    });
}

function share_page() {
    var fbpopup = window.open("https://www.facebook.com/sharer/sharer.php?u=http://anniejiao.me/paintnatie/", "pop", "width=600, height=400, scrollbars=no");
    return false;
}

function cloneCanvas(oldCanvas) {

    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    context.drawImage(oldCanvas, 0, 0);

    return newCanvas;
}
