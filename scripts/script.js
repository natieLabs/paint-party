var canvas, stage, carve;
var ctx, ctxcarve;
var side, w, h;
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
var COOKIE = [];
var colors = ["#FF1D25", "#7AC943", "#0071BC", "#FF931E", "#FFE200", "#29ABE2", "#009245", "#FBB03B", "#FFFFFF", "#f2f2f2", "#CCCCCC", "#000000"];

var imgdb = ["assets/img0.svg", "assets/img1.svg", "assets/img2.svg", "assets/img3.svg", "assets/cat.svg", "assets/img5.svg", "assets/fish.svg", "assets/music.svg", "assets/hand.svg", "assets/guitar.svg", "assets/black.svg", "assets/mic.svg", "assets/headphones.svg", "assets/multimedia.svg", "assets/video.svg", "assets/backpack.svg", "assets/car.svg", "assets/boat.svg", "assets/zombie.svg", "assets/converse.svg", "assets/elephant.svg", "assets/camel.svg"];

function init() {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');

    carve = document.getElementById('carveout');
    ctxcarve = carve.getContext("2d");

    w = window.innerWidth || e.clientWidth || g.clientWidth;
    h = window.innerHeight * 0.7 || e.clientHeight * 0.7 || g.clientHeight * 0.7;
    side = Math.min(w, h);

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

    for (var i = 0; i < colors.length; i++) {
        jsonColors.push({
            "i": i,
            "color": colors[i]
        })
    }

    make_palette();
    make_bgPicker();

    // set up listeners
    $('img').on('click', handleCanvasSwitch);
    $("#save").on("click", save_img);
    $("#share").on("click", share_page);
    $("#clear").on("click", handleCanvasClear);


    // $("#img1").click();
    $("button").tipsy({
        gravity: 's',
        html: true,
        title: function() {
            return this.id;
        },
        fade: true,
    })



    make_carve(currentCanvas);
}

function handleCanvasSwitch(event) {
    // housekeeping for current canvas
    CANVAS_CACHE[currentCanvas] = cloneCanvas(canvas);
    // ctx.drawImage(carve, 0, 0);
    // $('#img' + currentCanvas).attr("src", canvas.toDataURL());

    // update current canvas to point to chosen canvas
    currentCanvas = $(this).attr('id').substring(3);

    var dataURL = $(this).attr('src');

    if (CANVAS_CACHE[currentCanvas] == null) {
        clearBoard();
        make_carve(currentCanvas);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctxcarve.clearRect(0, 0, carve.width, carve.height);
        make_carve(currentCanvas);
        ctx.drawImage(CANVAS_CACHE[currentCanvas], 0, 0, side, side);
    }
}

function handleCanvasClear() {
    clearBoard();
    make_carve(currentCanvas);
    CANVAS_CACHE[currentCanvas] = null;
    localStorage.removeItem(currentCanvas);
    $('#img' + currentCanvas).attr("src", imgdb[currentCanvas]);
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
    var dataURL = canvas.toDataURL()
    $('#img' + currentCanvas).attr("src", dataURL);
    stage.removeEventListener("stagemousemove", handleMouseMove);
    // Cookies.set(currentCanvas, dataURL);
    // console.log(dataURL);
    // console.log(Cookies.get(currentCanvas));
    localStorage.setItem(currentCanvas, dataURL);
}

function make_palette() {

    var svgContainer = d3.select("#paletteWrapper").append("svg").attr("id", "palette");

    var circles = svgContainer.selectAll("circle")
        .data(jsonColors)
        .enter()
        .append("circle");

    var circleAttributes = circles
        .style("fill", function(d) {
            return d.color;
        })
        .filter(function(d) {
            return d.i == 0
        })
        .style("stroke", "#0d0d0d").style("stroke-width", 4);

    // stroke the circle that represents the eraser so it's visible against background
    circles.filter(function(d) {
            return d.color == "#f2f2f2"
        })
        .style("stroke", "white").style("stroke-width", 4)

    // var r = Math.max(0.06 * $("#palette").height(), 15);

    var r;

    if (w > 1000) {
        r = "6%";
        circles.attr("cx", function(d) {
            if (d.i < colors.length / 2) {
                return (d.i * 12 + 16) + "%";
            } else {
                return ((d.i - colors.length / 2) * 12 + 22) + "%";
            }
        }).attr("cy", function(d) {
            var cy = (~~(d.i / (colors.length / 2)) * 33 + 33) + "%";
            return cy
        });
        circles.on('click', function(d) {
            color = d.color;
            circles.transition().attr("r", r).style("stroke", function(d) {
                return ((d.color == "#f2f2f2") ? "white" : "none")
            });

            d3.select(this).transition().attr("r", parseFloat(r) * 1.3 + "%")
                .transition().attr("r", r)
                .style("stroke", "#0d0d0d")
                .style("stroke-width", 4);
        });
    } else {
        // mobile mode
        var r = 15;
        var di = r * 2;
        var gutter = 5;
        var numPerRow = ~~($("#palette").width() / (di + gutter)) - 1;


        circles.attr("cx", function(d) {
            var x = d.i % numPerRow;
            var y = ~~(d.i / numPerRow);
            return x * di + gutter * (x + 1) + r + y % 2 * r;
        }).attr("cy", function(d) {
            var y = ~~(d.i / numPerRow);
            return y * di + gutter * (y + 1) + r;
        });
        d3.select("svg").style("height", function() {
            return (Math.floor(jsonColors.length / numPerRow) + 1) * (di + gutter) + gutter;
        });
        circles.on('click', function(d) {
            color = d.color;
            circles.transition().attr("r", r).style("stroke", function(d) {
                return ((d.color == "#f2f2f2") ? "white" : "none")
            });

            d3.select(this).transition().attr("r", r * 1.3)
                .transition().attr("r", r)
                .style("stroke", "#0d0d0d")
                .style("stroke-width", 4);
        });

    }

    d3.selectAll("circle").attr("r", r);
}

// create carved canvas to cover artwork
// src can be url of image or dataURL of canvas
function make_carve(i) {
    var carveImageSrc = imgdb[currentCanvas]
    var base_image = new Image();
    carve.width = carve.height = side;

    base_image.onload = function() {
        ctxcarve.drawImage(base_image, 0, 0, side, side);
        ctxcarve.fill();
    }
    base_image.src = carveImageSrc;
}

function clearBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxcarve.clearRect(0, 0, carve.width, carve.height);
}

function make_bgPicker() {
    var src;
    for (var i = 0; i < imgdb.length; i++) {
        var dataURL = localStorage.getItem(i);
        if (dataURL == null) {
            src = imgdb[i];
            CANVAS_CACHE.push(null);
        } else {
            src = dataURL;
            CANVAS_CACHE[i] = canvasFromDataURL(dataURL);
        }
        $("#bgPicker").append("<img id='img" + i + "' src='" + src + "'></img>");

    }
    if (CANVAS_CACHE[currentCanvas] != null) {
        // console.log(CANVAS_CACHE[currentCanvas]);
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(CANVAS_CACHE[currentCanvas], 0, 0, side, side);
    }
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

function canvasFromDataURL(dataURL) {
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');
    newCanvas.width = side;
    newCanvas.height = side;

    var base_image = new Image();

    base_image.onload = function() {
        context.drawImage(base_image, 0, 0, side, side);
        context.fill();
    }
    base_image.src = dataURL;
    return newCanvas;

}

function resize(previous) {

    w = window.innerWidth || e.clientWidth || g.clientWidth;
    h = window.innerHeight * 0.7 || e.clientHeight * 0.7 || g.clientHeight * 0.7;
    side = Math.min(w, h);

    scale = side / previous;

    CANVAS_CACHE[currentCanvas] = cloneCanvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxcarve.clearRect(0, 0, carve.width, carve.height);
    ctx.canvas.height = side;
    ctx.canvas.width = side;
    make_carve(currentCanvas);
    ctx.drawImage(CANVAS_CACHE[currentCanvas], 0, 0, side, side);

    d3.select("svg").remove();
    make_palette();
}
window.onresize = resize;
