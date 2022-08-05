var color1 = "#ffffff";
var color2 = "#d90429";
var color3 = "#0077b6";

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

function salience_map_adaptive(tokens, scores, span_treatment) {
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
            
            if (score > 0){
                //var color = getcolor(color1, color2, score);
                var color  = "#ff758f"
            } else if (score < 0) {
                // console.log(score);
                // score = Math.abs(score);
                // console.log(score);
                // var color = getcolor(color1, color3, score);
                var color = "#90e0ef";
            } else {
                var color = "#ffffff";
            }
            html += "<span style='background-color:" + color + "'>&nbsp;" + word + "&nbsp;</span>";
        }
    }
    html += "";
    return html;
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

function underline(tokens, span_treatment) {
    var html = "";
    for (var i = 0; i < tokens.length; i++) {
        if (span_treatment[0] <= i && i <= span_treatment[1]-1) {
            var word = tokens[i];
            var color = "#ffba08";
            html += "<u style='text-decoration-color:" + color + "'>&nbsp;" + word + "&nbsp;</u>";
        } else {
            // get the word from the array
            var word = tokens[i];
            html += word + " ";
        }
    }
    html += "";
    return html;
}

function display_time(milliseconds) {
    var minutes = Math.floor(milliseconds / 6000);
    var seconds = Math.floor(milliseconds /100) % 60;
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

var filename = "https://raw.githubusercontent.com/edchengg/covid-misinformation-interface/main/data/tweet_lime_withid.csv";
var round_index = 1;

var annotations = {};
var annotation_formats = {};
var annotation_ids = {}
var timer = {}
var timer_interval = null
var data_length = 0;

$(document).ready(function() {
    Papa.parse(filename, {
        worker: true,
        download: true,
        complete: function (results) {
            $("#index-span-total").html(results.data.length);
            data_length = results.data.length - 1;
            // iterate through 1 to data_length
            for (var i = 1; i <= data_length; i++) {
                annotation_formats[i] = Math.random()
            }
            // console.log(annotation_formats);

            function display_ith_example() {

                clearInterval(timer_interval);
                var data = results.data;
                
                var example = data[round_index];
                var tweet = example[0];
                var treatment = example[1];
                var confidence1 = example[2];
                var stance1 = example[3];
                var score1 = example[4].split(" ");
                var confidence2 = example[5];
                var stance2 = example[6];
                var score2 = example[7].split(" ");
                var span_treatment = example[8].split(" ");
                var ids = example[9];
                var adaptive = example[10];
                //var adaptive = 0;
                if (ids.includes("NA")){
                    var link = "https://twitter.com/erg1951/status/13420529946328432";
                } else {
                    var link = "https://twitter.com/erg1951/status/" + ids;
                    
                }

                annotation_ids[round_index] = ids

                // add link to id=tweet-link
                $("#tweet-link").attr("href", link);
                
                if (stance1 == "Support"){
                    $("#prediction-span").html("supports");
                }

                if (stance2 == "Refuting"){
                    $("#prediction-span2").html("refutes");
                } else if (stance2 == "No Stance"){
                    $("#prediction-span2").html("has no stance");
                }

                $("#confidence-span").html(confidence1+"%");
                $("#confidence-span2").html(confidence2+"%");
  
                // scores to float
                for (var i = 0; i < score1.length; i++) {
                    score1[i] = parseFloat(score1[i]);
                }
                for (var i = 0; i < score2.length; i++) {
                    score2[i] = parseFloat(score2[i]);
                }
                // span to int
                for (var i = 0; i < span_treatment.length; i++) {
                    span_treatment[i] = parseInt(span_treatment[i]);
                }
                if (annotation_formats[round_index] < 0.33) {
                    // adaptive lime
                    $("#classification").show();
                    if (adaptive == 1){
                        $("#classification2").hide();
                        $("#tweet").html(salience_map_adaptive(tweet.split(" "), score1, span_treatment));
                        // $("#tweet").html(salience_map(tweet.split(" "), score1, span_treatment));
                    } else {
                        $("#tweet").html(salience_map_adaptive(tweet.split(" "), score2, span_treatment));
                        $("#classification2").show();
                    }
                } else if (annotation_formats[round_index] < 0.66) {
                    // confidence
                    $("#classification").show();
                    $("#classification2").hide();
                    $("#tweet").html(underline(tweet.split(" "), span_treatment));
                } else {
                    // human
                    $("#classification").hide();
                    $("#classification2").hide();
                    $("#tweet").html(underline(tweet.split(" "), span_treatment));
                }

                $("#treatment-span").html(treatment);
                $("#treatment-span2").html(treatment);
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
                }, 10);
                $("#guidelines").fadeOut(0.2)
                $("#guidelines-button").html("Guidelines");

                $("#progress-bar-span").animate(
                    {
                      width: confidence1 + "%",
                    },
                    0
                );

                $("#progress-bar-span2").animate(
                    {
                      width: confidence2 + "%",
                    },
                    0
                );
                $("#progress-bar-span").text(confidence1 + "%");
                $("#progress-bar-span2").text(confidence2 + "%");
            }
            display_ith_example();
            
            $("#prev").on("click", function(e) {
                round_index--;
                if (round_index < 1) {
                    round_index = 1;
                } else {
                    $("#index-span").html(round_index);
                    display_ith_example()
                }
            });

            $("#next").on("click", function(e) {
                round_index++;
                if (round_index > results.data.length - 1) {
                    round_index = results.data.length - 1;
                } else {
                    $("#index-span").html(round_index);
                    display_ith_example()
                }
            });
    
            $('input[type=radio][name=violation]').change(function() {
                annotations[round_index] = this.value;
                // console.log(annotations);
            });

            $("#break-button").on("click", function(e) {
                $('.popup').css('display', 'flex');
                clearInterval(timer_interval);
                console.log(timer)
            });

            $("#continue-button").on("click", function(e) {
                $(".popup").fadeOut(1);
                timer_interval = setInterval(() => {
                    timer[round_index] += 1;
                    seconds = timer[round_index];
                    display_time(seconds);
                }, 10);
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
                let data = {}
                // iterate from 1 to data_length
                for (var i = 1; i <= data_length; i++) {
                    if (annotation_formats[i] < 0.33) {
                        format = "adaptive explanation lime"
                    } else if (annotation_formats[i] < 0.66) {
                        format = "confidence"
                    } else {
                        format = "human"
                    }
                    data[i] = {"ids": annotation_ids[i], "annotation": annotations[i], "time": timer[i], "format": format}
                }
                console.log(data)
                // download the annotations as json
                var json = JSON.stringify(data);
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
