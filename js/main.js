// Docstring
//     - This is the main js file for the page
//     - It dictates the process of capturing text, updating a table and storing it in excel

// Bug fixes
//     - Cannot import functions by specifying this script as a module

// functions
//     - Convert json to csv 
//     - Export to csv for R

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

// Start main

// Initialize object DOMS
const recorder = document.getElementById('record');
const stoper = document.getElementById('stop');
const session_complete = document.getElementById('complete');
const session_status = document.getElementById('session-status');
const fetch_results = document.getElementById("complete");
const r_code = document.getElementById('r_code');
const export_csv = document.getElementById("export-csv");
var question = document.getElementById('question');
var results_card = document.getElementById("results");
var table = document.getElementById("data-table");
var output = document.getElementById('output');

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

