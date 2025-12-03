if (('serial' in navigator) == false) {
    alert("Ваш браузер не поддерживает Web Serial API");
    console.log("Your browser doesn't support Web Serial API");
}
function baudRate() {
    return parseInt($("#baudRate").val());
}
function updateConnectInfo() {
    $("#connectInfo").html(`Подключено: ${window.port.connected}<br>
Время подключения: ${new Date().toLocaleTimeString("ru")}<br>
baudRate: ${baudRate()}<br>
usbProductId: ${window.port.getInfo()["usbProductId"]}<br>
usbVendorId: ${window.port.getInfo()["usbVendorId"]}<br>`);
}

let isPlotter = true;
let nowRead = false;
let autoSize = false;
let xMax = 100;
let yMax = 2048;
let allData = [];
let colors = ["green", "red", "blue", "purple", "orange"];
let autoScroll = true;
let autoShowTime = false;
let autoNewLine = true;
let mxLines = 100;

function changeRead() {
    nowRead = !nowRead;
    if (nowRead) {
        $(".stopRead").html("Остановить чтение");
    } else {
        $(".stopRead").html("Продолжить чтение");

    }
}

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
$("#autoshowtime").change((event) => {
    autoShowTime = $("#autoshowtime").is(":checked");
});
$("#autonewline").change((event) => {
    autoNewLine = $("#autonewline").is(":checked");
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

// ctx.textAlign = 'left';
// ctx.textBaseline = 'middle';
// ctx.font = '20px SegoeUI';

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
        // ctx.fillStyle = "grey";

        // ctx.fillRect(20, middle, canvas.width, 1);
        // ctx.fillText("0", 3, middle);

        // ctx.fillRect(20, Math.round((canvas.height / yMax) * (yMax - (yMax * 0.1))), canvas.width, 1);
        // ctx.fillText((yMax - (yMax * 0.1)).toString(), 3, Math.round(middle - ((canvas.height / yMax) * (yMax - (yMax * 0.1)))));

        // ctx.fillRect(20, (canvas.height / yMax) * (0 + (yMax * 0.1)), canvas.width, 1);
        // ctx.fillText((0 + (yMax * 0.1)).toString(), 3, middle - (canvas.height / yMax) * (0 + (yMax * 0.1)));
        // console.log(Math.round(((canvas.height / yMax) * (yMax - (yMax * 0.1)))));

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
    let preModifier = "";
    let postModifier = "";
    if (autoShowTime) {
        preModifier += "[" + new Date().toLocaleTimeString("ru") + "." + new Date().getMilliseconds() + "] ";
    }
    if (autoNewLine) {
        postModifier += "&NewLine;";
    }
    $("#port").append(preModifier + data + postModifier);

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
        updateConnectInfo();

        nowRead = false;
        allData = [];

        await readFromPort();
    } catch (error) {
        alert(error);
    }
}
async function disconnectFromSerial() {
    try {
        nowRead = false;
        window.reader.releaseLock();
        await window.port.close();
        console.log("Port closed");
    } catch (error) {
        alert(error);
    }
}
let buffer = '';

async function readFromPort() {
    window.reader = window.port.readable.getReader();
    nowRead = true;

    try {
        while (true) {
            const { value, done } = await window.reader.read();
            if (done) {
                nowRead = false;
                break;
            }
            if (nowRead) {
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
        }
    } catch (error) {
        console.log("Error when reading port: ", error);
    } finally {
        window.reader.releaseLock();
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