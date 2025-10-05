function scrollToBottom() {
    var messageBody = document.getElementById("messageFormeight");
    messageBody.scrollTop = messageBody.scrollHeight;
}

$(document).ready(function () {
    $("#messageArea").on("submit", function (event) {
        event.preventDefault();
        const date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const str_time = hours + ':' + minutes + ' ' + ampm;
        var rawText = $("#text").val();

        if (rawText.trim() === "") {
            return;
        }

        var userHtml =
            '<div class="d-flex justify-content-end mb-4"><div class="msg_container_send">' +
            rawText +
            '<span class="msg_time_send">' +
            str_time +
            '</span></div><div class="img_cont_msg"><img src="/static/images/Seventh_College_logo2.png" class="rounded-circle user_img_msg"></div></div>';

        $("#text").val("");
        $("#messageFormeight").append(userHtml);
        scrollToBottom();

        $.ajax({
            data: {
                prompt: rawText,
            },
            type: "POST",
            url: "/chat",
        }).done(function (data) {
            const botContainerId = "bot-msg-" + Date.now();
            var botHtml =
                '<div class="d-flex justify-content-start mb-4"><div class="img_cont_msg"><img src="/static/images/placeholder.png" class="rounded-circle user_img_msg"></div><div class="msg_container" id="' +
                botContainerId +
                '">' +
                '</div></div>';
            $("#messageFormeight").append($.parseHTML(botHtml));
            scrollToBottom();

            const words = data.response_text.split(" ");
            let i = 0;
            const interval = setInterval(function () {
                if (i < words.length) {
                    $("#" + botContainerId).append(words[i] + " ");
                    i++;
                    scrollToBottom();
                } else {
                    clearInterval(interval);
                    $("#" + botContainerId).append(
                        '<span class="msg_time">' + str_time + "</span>"
                    );
                    scrollToBottom();

                    // Update stats
                    $("#total_wh").text(data.total_wh);
                    $("#total_ml").text(data.total_ml);
                    $("#total_co2").text(data.total_co2);
                    $("#total_usd").text(data.total_usd);
                    $("#total_tokens").text(data.total_tokens);
                }
            }, 50);
        });
    });
});