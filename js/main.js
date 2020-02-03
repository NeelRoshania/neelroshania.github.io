// Docstring
//     - This is the main js file for the page
//     - It dictates the process of capturing text, updating a table and storing it in excel

// Bug fixes
//     - Cannot import functions by specifying this script as a module

// functions
//     - Convert json to csv 
//     - Export to csv for R

function getMean(data_array){
    return data_array.reduce(function (a, b) {
        return Number(a) + Number(b);
    }) / data_array.length;
}


function getStd(data_array){
    return Math.sqrt(data_array.reduce(function (sq, n) {
        return sq + Math.pow(n - getMean(data_array), 2);
    }, 0) / (data_array.length - 1));
}

function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','
            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
}

function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }

    // Convert Object to JSON
    var jsonObject = JSON.stringify(items);

    var csv = this.convertToCSV(jsonObject);

    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Headers for the csv file
var headers = {
    question: 'Question Number',
    responses: "Participant Response"
};

// Draw calibration bars
var draw = function(analyser, canvasCtx) {

    analyser.fftSize = 256;
    var bufferLengthAlt = analyser.frequencyBinCount;
    console.log(bufferLengthAlt);
    var dataArrayAlt = new Uint8Array(bufferLengthAlt);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw bars
    var drawAlt = function() {
        drawVisual = requestAnimationFrame(drawAlt);
        analyser.getByteFrequencyData(dataArrayAlt);
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
        var barHeight;
        var x = 0;

        //   Use average and std of frequency magnitudes to check microphone, calibrate user voice and detect a noisy environment
        // decibel_approx.textContent = getMean(dataArrayAlt)
        // decibel_variation.textContent = getStd(dataArrayAlt)

        // Manage calibration output
        frequency_mean = getMean(dataArrayAlt);
        frequency_std = getStd(dataArrayAlt);

        // Check microphone output, if ok then make recording unit visible
        if (frequency_mean > 0) {
            decibel_approx.style.color = "#61d800";
            decibel_approx.textContent = "Microphone detected";
            recording_unit.style.visibility = 'visible'

            // Calibrate voice
            if (frequency_mean > 25) {
                decibel_approx.textContent = "Voice amplitude OK";
            } 
            
            // Detect environment
            if (frequency_mean > 50 && (frequency_std > 65)) {
                decibel_approx.style.color = "#ee6002"
                decibel_approx.textContent = "Too noisy to talk";
            } 
        } else {
            decibel_approx.style.color = "#ee6002"
            decibel_approx.textContent = "No sound detected"
        };

        // Manage bar chart visualization
        for(var i = 0; i < bufferLengthAlt; i++) {
            barHeight = dataArrayAlt[i];

            canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
            canvasCtx.fillRect(x,HEIGHT-barHeight/2.5,barWidth,barHeight/2.5);

            x += barWidth + 1;
            };
        };
        drawAlt();
    };

// Start main

// Initialize object DOMS
const recorder = document.getElementById('record');
const stoper = document.getElementById('stop');
const session_complete = document.getElementById('complete');
const session_status = document.getElementById('session-status');
const fetch_results = document.getElementById("complete");
const r_code = document.getElementById('r_code');
const export_csv = document.getElementById("export-csv");
const calibration = document.getElementById("calibration");
const recording_unit = document.getElementById("recording-unit");
var question = document.getElementById('question');
var results_card = document.getElementById("results");
var table = document.getElementById("data-table");
var output = document.getElementById('output'); 
var decibel_approx = document.getElementById('decibel_approx'); 
var decibel_variation = document.getElementById('decibel_variation'); 

// Initialize recorder and DOM elements
var _speech_transcript, text, space
var fileTitle = 'speech_to_text'; // or 'my-unique-title'
var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
var responses = "";
var json_to_table = [];
results_card.style.visibility = 'hidden'
fetch_results.style.visibility = 'hidden'
r_code.style.visibility = 'hidden'
recording_unit.style.visibility = 'hidden'

// Start calibration
//     - To extract data from your audio source, you need an AnalyserNode
//     - This node is then connected to your audio source at some point between your source and your destination
//     - The analyser node will then capture audio data using a Fast Fourier Transform (fft) in a certain frequency domain, depending on what you specify as the AnalyserNode.fftSize property value 
//     - To capture data, you need to use the methods AnalyserNode.getFloatFrequencyData() and AnalyserNode.getByteFrequencyData() to capture frequency data, and AnalyserNode.getByteTimeDomainData() and AnalyserNode.getFloatTimeDomainData() to capture waveform data.
//     - These methods copy data into a specified array, so you need to create a new array to receive the data before invoking one.
//     - Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData
    
calibration.onclick = function(stream) {
    if (navigator.mediaDevices.getUserMedia) {

        // setup canvas object properties
        console.log('getUserMedia supported.');
        var canvas = document.querySelector('.visualizer');
        var canvasCtx = canvas.getContext("2d");
        WIDTH = canvas.width;
        HEIGHT = canvas.height;

        // Detect streaming content using WebAudio API
        navigator.mediaDevices.getUserMedia ({ audio: true, video: false })
           .then(
             function(stream) {
                var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                var analyser = audioCtx.createAnalyser();
                source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 2048;

                // Start drawing calibration rectangles
                canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
                draw(analyser, canvasCtx);
           })
           .catch( function(err) { console.log('The following gUM error occured: ' + err);})
     } else {
        alert("Hmm...are you a MAC user? I think you're using a browser that doesn't support our tech. Try using Chrome V79.0.")
        console.log('getUserMedia not supported on this browser.');
     }
}

// Start recording, only if a question number has been submitted
recorder.onclick = function() {
    if (question.value.length > 0) {
        session_status.textContent = "Recording..."
        recognition.start()
    } else {
        alert("Enter a question number for this response...")
    }
}

// Stop recording
stoper.onclick = function() {
    session_status.textContent = "Recording stopped...";
    recognition.stop();
    fetch_results.style.visibility = 'visible';
    responses = "";
}

// Fail safe to stop the recorder
recognition.onspeechend = function(event) {
    console.log("Service stopped...");
    session_status.textContent = "No sound detected, service stopped...";
    recognition.stop();
}

// Manage data structure for table output
recognition.onresult = function(event) {
    
    // update output and call transcript of response list length (+ 1)
    console.clear();
    output.textContent = "";

    output.appendChild(document.createTextNode("\""));
    // Iterate between questions responses, and output to DOM
    if (event.results.length > 0) {
        for (let index = 0; index < event.results.length; index++) {
            _speech_transcript = event.results[index][0].transcript;
            if (_speech_transcript[0] == " ") {
                text = document.createTextNode(_speech_transcript[1].toUpperCase() + _speech_transcript.slice(2));
            } else {
                text = document.createTextNode(_speech_transcript[0].toUpperCase() + _speech_transcript.slice(1));
            }
            
            // console.log(text)
            space = document.createTextNode(". ");
            output.appendChild(text);
            output.appendChild(space);
        }
    }
    output.appendChild(document.createTextNode("\""));

    // Append json struction with additional responses to a question
    json_to_table.push({question: question.value, response: event.results[event.results.length-1][0].transcript.trim()});
    console.log(json_to_table);
    
};

// Update table when session is complete
session_complete.onclick = function() {

    // Stop recorder, update status and make table visible
    recognition.stop();
    session_status.textContent = "Session stopped. Ask another question?";
    results_card.style.visibility = 'visible';
    r_code.style.visibility = 'visible';
    
    for (let index = 0; index < json_to_table.length; index++) {
        // console.log(index)
        var row = table.insertRow(index+1);
        var cell_question = row.insertCell(0);
        var cell_response = row.insertCell(1);
        cell_question.innerHTML = json_to_table[index].question;
        cell_response.innerHTML = json_to_table[index].response;
    }
}

// Export table to excel
export_csv.onclick = function() {
    // console.log(convertToCSV(json_to_table))
    exportCSVFile(headers, json_to_table, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download   
}

