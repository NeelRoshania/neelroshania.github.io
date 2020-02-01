// Docstring
//     - This is the main js file for the page
//     - It dictates the process of capturing text, updating a table and storing it in excel

// Bug fixes
//     - Cannot import functions by specifying this script as a module

// Initialize object DOMS
const recorder = document.getElementById('record');
const stoper = document.getElementById('stop');
const session_complete = document.getElementById('complete');
const session_status = document.getElementById('session-status');
var question = document.getElementById('question');
var results_card = document.getElementById("results");
var table = document.getElementById("data-table");
var output = document.getElementById('output');
var _speech_transcript, text, space

// Initialize recorder and DOM elements
var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
var responses = "";
var json_to_table = [];
results_card.style.visibility = 'hidden'

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
    session_status.textContent = "Recording stopped..."
    recognition.stop()
    responses = ""
}

// Fail safe to stop the recorder
recognition.onspeechend = function(event) {
    console.log("Service stopped...")
    session_status.textContent = "No sound detected, service stopped..."
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
            space = document.createTextNode(". ")
            output.appendChild(text);
            output.appendChild(space)
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
    session_status.textContent = "Session stopped. Ask another question?"
    results_card.style.visibility = 'visible'  

    for (let index = 0; index < json_to_table.length; index++) {
        // console.log(index)
        var row = table.insertRow(index+1);
        var cell_question = row.insertCell(0);
        var cell_response = row.insertCell(1);
        cell_question.innerHTML = json_to_table[index].question
        cell_response.innerHTML = json_to_table[index].response
    }
}

// Insert R script to fetch information
