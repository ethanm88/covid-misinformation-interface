var color1 = "#ffffff";
var color2 = "#d90429";

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

function salience_map(tokens, scores, span_treatment) {
    var html = "";
    for (var i = 0; i < tokens.length; i++) {
        if (span_treatment[0] <= i && i <= span_treatment[1]-1) {
            var word = tokens[i];
            var color = "#ffba08";
            html += "<u style='text-decoration-color:" + color + "'>&nbsp;" + word + "&nbsp;</u>";
        } else {
            // get the word from the array
            var word = tokens[i];
            var score = scores[i];
            if (score < 0.2){
                score = -1
            }
            var color = getcolor(color1, color2, score);
            html += "<span style='background-color:" + color + "'>&nbsp;" + word + "&nbsp;</span>";
        }
    }
    html += "";
    return html;
}

function display_time(seconds) {
    var minutes = Math.floor(seconds / 60);
    var seconds = seconds % 60;
    // display seconds 00
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    // display minutes 00
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    $(".timer").html(minutes + ":" + seconds);
}

var filename = "https://raw.githubusercontent.com/edchengg/covid-misinformation-interface/main/data/tweet_saliency_map.csv";
var round_index = 1;

var annotations = {};
var timer = {}
var timer_interval = null

$(document).ready(function() {
    Papa.parse(filename, {
        worker: true,
        download: true,
        complete: function (results) {
            function display_ith_example(i) {
                // random sample from true and false
                var whether_display_cls = Math.random() < 0.5;
                if (whether_display_cls) {
                    $("#classification").show();
                } else {
                    $("#classification").hide();
                }

                clearInterval(timer_interval);
                var data = results.data;
                var example = data[i];
                var tweet = example[0];
                var treatment = example[1];
                var confidence = example[3]
                var span_treatment = example[5].split(" ");
                var link = example[6];

                // add link to id=tweet-link
                $("#tweet-link").attr("href", link);
                
                $("#confidence-span").html(confidence+"%");
                var scores = example[4].split(" ");
                // scores to float
                for (var i = 0; i < scores.length; i++) {
                    scores[i] = parseFloat(scores[i]);
                }
                // span to int
                for (var i = 0; i < span_treatment.length; i++) {
                    span_treatment[i] = parseInt(span_treatment[i]);
                }

                var whether_display_salience = Math.random() < 0.5;
                if (whether_display_salience) {
                    $("#tweet").html(salience_map(tweet.split(" "), scores, span_treatment));
                } else {
                    $("#tweet").html(tweet);
                }

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
                // check if round_index is in timer
                if (timer[round_index] == undefined) {
                    timer[round_index] = 0;
                }
                display_time(timer[round_index]);
                timer_interval = setInterval(() => {
                    timer[round_index] += 1;
                    seconds = timer[round_index];
                    display_time(seconds);
                }, 1000);
                $("#guidelines").fadeOut(0.2)
                $("#guidelines-button").html("Guidelines");

                $("#progress-bar-span").animate(
                    {
                      width: confidence + "%",
                    },
                    0
                );
                $("#progress-bar-span").text(confidence + "%");
            }
            display_ith_example(1);
            
            $("#prev").on("click", function(e) {
                round_index--;
                if (round_index < 1) {
                    round_index = 1;
                } else {
                    $("#index-span").html(round_index);
                    display_ith_example(round_index)
                }
            });

            $("#next").on("click", function(e) {
                round_index++;
                if (round_index > results.data.length - 1) {
                    round_index = results.data.length - 1;
                } else {
                    $("#index-span").html(round_index);
                    display_ith_example(round_index)
                }
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
                // download the timer as json
                var json = JSON.stringify(timer);
                var blob = new Blob([json], {type: "application/json"});
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = "timer.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            $( "#guidelines" ).draggable();
        }});
});
