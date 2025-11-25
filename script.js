function baudRate() {
    return parseInt($("#baudRate").val());
}

let isPlotter = true;
let nowRead = false;
let autoSize = false;
let xMax = 100;
let yMax = 2048;
let allData = [];
let colors = ["green", "red", "blue", "white", "orange"];
let autoScroll = true;
let mxLines = 100;

$("#autosize").change((event) => {
    autoSize = $("#autosize").is(":checked");
    if (!autoSize) {
        xMax = $("#xmaxtext").val();
        yMax = $("#ymaxtext").val();
    }
});

$("#autoscroll").change((event) => {
    autoScroll = $("#autoscroll").is(":checked");
});

$("#sendMessage").click(async () => {
    await writeToPort($("#message").val());
    $("#message").val("");
});
$("#clsMessage").click(() => {
    $("#message").val("");
});

function max(data) {
    let mx = 0;
    data.forEach((element) => {
        if (element > mx)
            mx = element;
    });
    return mx;
}

$("#monport").hide();

$(".plotterActivate").click(() => {
    $("#plotter").show();
    $("#monport").hide();
    isPlotter = true;
});
$(".monPortActivate").click(() => {
    $("#plotter").hide();
    $("#monport").show();
    isPlotter = false;
});

let canvas = document.getElementById("canvas");
let forCanvas = document.getElementById("forCanvas");
canvas.width = forCanvas.offsetWidth;
canvas.height = forCanvas.offsetHeight;
console.log(canvas.height);
let middle = canvas.height / 2;
// let middle = 0;
let ctx = canvas.getContext("2d");

$("#xmaxtext").val(xMax);
$("#ymaxtext").val(yMax);
$("#mxlines").val(mxLines);

$("#xmaxtext").change((event) => {
    xMax = parseInt(event.target.value);
});
$("#ymaxtext").change((event) => {
    yMax = parseInt(event.target.value);
});
$("#mxlines").change((event) => {
    mxLines = parseInt(event.target.value);
});

function abs(x) {
    if (x < 0) return x * -1;
    return x;
}

function draw(all) {
    if (isPlotter) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        all.forEach((data, index) => {
            ctx.beginPath();
            ctx.moveTo(xMax * (canvas.width / xMax), (yMax / canvas.height) * (middle - data[abs(xMax)]));
            ctx.strokeStyle = colors[index];
            for (let i = xMax; i > 0; i--) {
                ctx.lineTo(Math.round(i * (canvas.width / xMax)), Math.round(middle - ((canvas.height / yMax) * (data[abs(xMax - i)]))));
                // console.log(middle - ((canvas.height / (yMax * 2)) * (data[abs(xMax - i)])));
            }
            ctx.stroke();
        });
    }
}
function newtext(data) {
    $("#port").append(data + "&NewLine;");

    if ($("#port").text().split('\n').length > mxLines) {
        let content = $("#port").text().split('\n').slice(-mxLines).join('\n');
        $("#port").val(content);
    }

    if (autoScroll) document.getElementById("port").scrollTop = document.getElementById("port").scrollHeight;
}

async function connectToSerial() {
    try {
        window.port = await navigator.serial.requestPort();
        await window.port.open({ baudRate: baudRate() });
        console.log("Port opened", baudRate());
        await readFromPort();
    } catch (error) {
        alert(error);
    }
}
async function disconnectFromSerial() {
    try {
        nowRead = false;
        await window.port.close();
        console.log("Port closed");
    } catch (error) {
        alert(error);
    }
}
let buffer = '';

async function readFromPort() {
    const reader = window.port.readable.getReader();
    nowRead = true;

    try {
        while (true) {
            if (!nowRead) break;

            const { value, done } = await reader.read();
            if (done) {
                nowRead = false;
                break;
            }

            buffer += new TextDecoder().decode(value);

            const lines = buffer.split('\n');

            buffer = lines.pop() || '';

            for (let line of lines) {
                line = line.replace('\r', '').trim();

                if (line) {
                    const stringInts = line.match(/-?\d+/g);

                    if (stringInts) {
                        const integers = stringInts.map(numStr => parseInt(numStr));

                        if (integers.length < allData.length) {
                            allData.length = integers.length;
                        }
                        let maxes = [];
                        integers.forEach((number, index) => {
                            if (!isNaN(number)) {
                                if (allData[index] === undefined)
                                    allData[index] = [];
                                allData[index].unshift(number);
                                allData[index].length = xMax;
                                maxes.push(max(allData[index]));
                            }
                        });
                        if (autoSize) {
                            let ymx = max(maxes);
                            yMax = 2 * ymx + (ymx * 0.15);
                        }

                        draw(allData);
                    }

                    newtext(line);
                }
            }
        }
    } catch (error) {
        console.log("Error when reading port: ", error);
    } finally {
        reader.releaseLock();
    }
}
async function writeToPort(data) {
    const writer = window.port.writable.getWriter();

    try {
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(data));
        console.log("Data sended:", data);
    } catch (error) {
        console.log("Error when write window.port: ", error);
    } finally {
        writer.releaseLock();
    }
}