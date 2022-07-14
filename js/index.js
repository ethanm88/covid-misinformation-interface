var color1 = "#6df3ff";
var color2 = "#5469f5";

function getcolor(color1, color2, percentage) {
    var r1 = parseInt(color1.substring(1, 3), 16);
    var g1 = parseInt(color1.substring(3, 5), 16);
    var b1 = parseInt(color1.substring(5, 7), 16);
    var r2 = parseInt(color2.substring(1, 3), 16);
    var g2 = parseInt(color2.substring(3, 5), 16);
    var b2 = parseInt(color2.substring(5, 7), 16);
    console.log(r1, g1, b1, r2, g2, b2);
    var r = Math.round((r1 + (r2 - r1) * percentage)).toString(16);
    var g = Math.round((g1 + (g2 - g1) * percentage)).toString(16);
    var b = Math.round((b1 + (b2 - b1) * percentage)).toString(16);
    console.log(r, g, b);
    return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
}

var filename = "";

$(document).ready(function() {
    Papa.parse(filename, {
        worker: true,
        download: true,
        complete: function (results) {

        }});

    $("#submit").on("click", function(e) {
        var textInput = $("#textInput").val();
        var scoreInput = $("#scoreInput").val();
        if (textInput === "" || scoreInput === "") {
            $("#salience-map").html("<span class='bg-gray'>&nbsp;Missing text input or score input &nbsp;</span>");
        } else {
            // split the input into an array of words
            var words = textInput.split(" ");
            var scores = scoreInput.split(" ");
            if (words.length != scores.length) {
                $("#salience-map").html("<span class='bg-gray'>&nbsp;Text input and score input must be the same length &nbsp;</span>");
                return;
            }
            // transform scores to float
            for (var i = 0; i < scores.length; i++) {
                scores[i] = parseFloat(scores[i]);
            }
            // normalize scores
            var max = Math.max.apply(null, scores);
            var min = Math.min.apply(null, scores);
            for (var i = 0; i < scores.length; i++) {
                scores[i] = (scores[i] - min) / (max - min);
            }
            console.log(scores);
            var html = "";
            for (var i = 0; i < words.length; i++) {
                // get the word from the array
                var word = words[i];
                var score = scores[i];
                var color = getcolor(color1, color2, score);
                // create the html for the word
                html += "<span style='background-color:" + color + "'>&nbsp;" + word + "&nbsp;</span> ";
            }
            $("#salience-map").html(html);
        }
    });
});