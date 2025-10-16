function scrollToBottom() {
    var messageBody = document.getElementById("messageFormeight");
    messageBody.scrollTop = messageBody.scrollHeight;
}

$(document).ready(function () {
    $("#messageArea").on("submit", function (event) {
        event.preventDefault();
        var rawText = $("#text").val();

        if (rawText.trim() === "") {
            return;
        }

        const userContainerId = "user-msg-" + Date.now();
        var userHtml =
            '<div class="d-flex justify-content-end mb-4"><div class="msg_container_send" id="' +
            userContainerId +
            '">' +
            rawText +
            '</div><div class="img_cont_msg"><img src="/static/images/Seventh_College_logo2.png" class="rounded-circle user_img_msg"></div></div>';

        $("#text").val("");
        $("#messageFormeight").append(userHtml);
        scrollToBottom();

        // Show loading animation
        var loadingHtml =
            '<div class="d-flex justify-content-start mb-4" id="loading-indicator">' +
            '<div class="img_cont_msg"><img src="/static/images/placeholder.png" class="rounded-circle user_img_msg"></div>' +
            '<div class="msg_container">' +
            '<div class="typing-indicator"><span></span><span></span><span></span></div>' +
            '</div></div>';
        $("#messageFormeight").append(loadingHtml);
        scrollToBottom();

        $.ajax({
            data: {
                prompt: rawText,
            },
            type: "POST",
            url: "/chat",
        }).done(function (data) {
            // Remove loading animation
            $("#loading-indicator").remove();

            // Update cached tokens display in the input area
            $("#cached-tokens-count").text(data.cached_tokens);
            $("#cached-tokens-display").fadeIn();

            // Add input tokens to user message with fade-in effect
            const inputTokensSpan = $('<span class="msg_tokens_send" style="display: none;">' + data.input_tokens + ' tokens</span>');
            $("#" + userContainerId).append(inputTokensSpan);
            inputTokensSpan.fadeIn(400);

            const botContainerId = "bot-msg-" + Date.now();
            var botHtml =
                '<div class="d-flex justify-content-start mb-4"><div class="img_cont_msg"><img src="/static/images/placeholder.png" class="rounded-circle user_img_msg"></div><div class="msg_container" id="' +
                botContainerId +
                '">' +
                '</div></div>';
            $("#messageFormeight").append($.parseHTML(botHtml));
            scrollToBottom();

            // Function to stream text word-by-word
            function typeStream(element, text, callback) {
                const words = text.split(' ');
                let i = 0;
                const interval = setInterval(function () {
                    if (i < words.length) {
                        element.append(words[i] + ' ');
                        i++;
                        scrollToBottom();
                    } else {
                        clearInterval(interval);
                        if (callback) {
                            callback();
                        }
                    }
                }, 30);
            }

            const $botContainer = $("#" + botContainerId);
            typeStream($botContainer, data.response_text, function () {
                // Once streaming is complete, render the markdown
                const renderedHtml = marked.parse(data.response_text);
                $botContainer.html(renderedHtml);

                // Add output tokens with fade-in effect
                const outputTokensSpan = $('<span class="msg_tokens" style="display: none;">' + data.output_tokens + ' tokens</span>');
                $botContainer.append(outputTokensSpan);
                outputTokensSpan.fadeIn(400);
                scrollToBottom();
            });


            // Update stats with totals
            $("#total_wh").text(data.total_wh);
            $("#total_ml").text(data.total_ml);
            $("#total_co2").text(data.total_co2);
            $("#total_usd").text(data.total_usd);
            $("#total_tokens").text(data.total_tokens);

            // Update incremental values with animation and units
            updateIncrement("#inc_wh", data.inc_wh, " Wh");
            updateIncrement("#inc_ml", data.inc_ml, " ml");
            updateIncrement("#inc_co2", data.inc_co2, " g");
            updateIncrement("#inc_usd", data.inc_usd, "", "$");
            updateIncrement("#inc_tokens", data.inc_tokens, " tokens");
        });

        // Function to update and animate increment display
        function updateIncrement(elementId, value, unit = "", prefix = "") {
            const $element = $(elementId);
            $element.text("+" + prefix + value + unit);
            $element.addClass("increment-flash");
            setTimeout(function () {
                $element.removeClass("increment-flash");
            }, 1000);
        }
    });
});