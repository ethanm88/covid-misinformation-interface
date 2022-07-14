var color1 = "#6df3ff";
var color2 = "#5469f5";

function getcolor(color1, color2, percentage) {
    var r1 = parseInt(color1.substring(1, 3), 16);
    var g1 = parseInt(color1.substring(3, 5), 16);
    var b1 = parseInt(color1.substring(5, 7), 16);
    var r2 = parseInt(color2.substring(1, 3), 16);
    var g2 = parseInt(color2.substring(3, 5), 16);
    var b2 = parseInt(color2.substring(5, 7), 16);
    var r = Math.round((r1 + (r2 - r1) * percentage)).toString(16);
    var g = Math.round((g1 + (g2 - g1) * percentage)).toString(16);
    var b = Math.round((b1 + (b2 - b1) * percentage)).toString(16);
    return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
}

function salience_map(tokens, scores) {
    var html = "";
    for (var i = 0; i < tokens.length; i++) {
        // get the word from the array
        var word = tokens[i];
        var score = scores[i];
        var color = getcolor(color1, color2, score);
        if (score > 0.85) {
            html += "<span style='color:white; background-color:" + color + "'>" + word + "</span> ";
        } else {
            html += "<span style='background-color:" + color + "'>" + word + "</span> ";
        }
        
    }
    return html;
}

var filename = "https://raw.githubusercontent.com/Yao-Dou/covid-misinformation-interface/main/data/covid.csv";
var round_index = 1;

var annotations = {};

$(document).ready(function() {
    Papa.parse(filename, {
        worker: true,
        download: true,
        complete: function (results) {
            function display_ith_example(i) {
                var data = results.data;
                var example = data[i];
                var tweet = example[0];
                var treatment = example[1];
                var confidence = example[3]
                $("#confidence-span").html(confidence+"%");
                var scores = example[4].split(" ");
                // scores to float
                for (var i = 0; i < scores.length; i++) {
                    scores[i] = parseFloat(scores[i]);
                }
                $("#tweet").html(salience_map(tweet.split(" "), scores));
                $("#treatment-span").html(treatment);
                $("#treatment-span-2").html(treatment);
                // check if round_index is in annotations
                if (annotations[round_index] != undefined) {
                    annotation = annotations[round_index];
                    var $radios = $('input:radio[name=violation]');
                    $radios.filter("[value=" + annotation +"]").prop('checked', true);
                } else {
                    $("input:radio[name=violation]").prop('checked', false);
                }
                $("#guidelines").fadeOut(0.2)
                $("#guidelines-button").html("Guidelines");
                // console.log(scores);
            }
            display_ith_example(1);
            $("#prev").on("click", function(e) {
                round_index--;
                if (round_index < 1) {
                    round_index = 1;
                }
                $("#index-span").html(round_index);
                display_ith_example(round_index)
            });

            $("#next").on("click", function(e) {
                round_index++;
                if (round_index > results.data.length - 1) {
                    round_index = results.data.length - 1;
                }
                $("#index-span").html(round_index);
                display_ith_example(round_index)
            });
    
            $('input[type=radio][name=violation]').change(function() {
                annotations[round_index] = this.value;
                console.log(annotations);
            });

            $("#guidelines-button").on("click", function(e) {
                var left  = e.pageX - 60  + "px";
                var top  = e.pageY + 25 + "px";
                var div = document.getElementById("guidelines");
                div.style.left = left;
                div.style.top = top;
                if (div.style.display == "" || div.style.display == "none") {
                    $("#guidelines").fadeIn(0.2)
                    $(this).html("Close");
                } else {
                    $("#guidelines").fadeOut(0.2)
                    $(this).html("Guidelines");
                }
                return false;
            });

            $("#submit-button").on("click", function(e) {
                // download the annotations as json
                var json = JSON.stringify(annotations);
                var blob = new Blob([json], {type: "application/json"});
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = "annotations.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            $( "#guidelines" ).draggable();
        }});
});