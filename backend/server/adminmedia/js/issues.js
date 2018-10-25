var IssueChatManager = {
    ajaxCall: null,
    container: null,
    chatId: 0,
    urlDefaultAvatar: null,
    urlGetData: null,
    urlPostMessage: null,
    csrfToken: '',
    init: function(options) {
        var that = this;
        that.container = options.el;
        that.interval = options.interval;
        that.chatId = options.chatId;
        that.urlDefaultAvatar = options.urlDefaultAvatar;
        that.urlGetData = options.urlGetData;
        that.urlPostMessage = options.urlPostMessage;
        that.csrfToken = options.csrfToken,
        that.bindDom();
        that.initChat()
    },
    bindDom: function() {
        var that = this;
        that.container.find("[name=chat_text_send_button]").on("click", function(e){
            return that.sendMessage(e);
        });
    },
    leftMessageHtml: function(message) {
        var that = this;
        var el = $('<div class="chat_message_left"/>');
        el.attr("id", "chat_message_left_"+message.id);
        var elContainerImg = $('<div class="chat_message_left_img"/>');
        elContainerImg.attr("id", "chat_message_left_img_"+message.id);
        elContainerImg.html('<img/>');
        if (message.senderAvatar) {
            elContainerImg.find("img").attr("src", message.senderAvatar);
        } else {
            elContainerImg.find("img").attr("src", that.urlDefaultAvatar);
        }
        var elContainerData = $('<div class="chat_message_left_data"/>');
        elContainerData.attr("id", "chat_message_left_data_"+message.id);
        elContainerData.html('<div class="chat_message_username"/><div class="chat_message_datetime"/>');
        elContainerData.find(".chat_message_username").html(message.sender.username);
        elContainerData.find(".chat_message_datetime").html(message.dateCreated);
        var elContainerText = $('<div class="chat_message_left_text"/>');
        elContainerText.attr("id", "chat_message_left_text_"+message.id);
        var elContainerTextImg = $('<img/>');
        if (message.image) {
            elContainerTextImg.attr("src", message.image);
            elContainerText.append(elContainerTextImg);
        }
        elContainerText.append(message.text);
        el.append(elContainerImg);
        el.append(elContainerData);
        el.append(elContainerText);
        that.container.find(".chat_messages").append(el);
    },
    rightMessageHtml: function(message) {
        var that = this;
        var el = $('<div class="chat_message_right"/>');
        el.attr("id", "chat_message_right_"+message.id);
        var elContainerImg = $('<div class="chat_message_right_img"/>');
        elContainerImg.attr("id", "chat_message_right_img_"+message.id);
        elContainerImg.html('<img/>');
        if (message.senderAvatar) {
            elContainerImg.find("img").attr("src", message.senderAvatar);
        } else {
            elContainerImg.find("img").attr("src", that.urlDefaultAvatar);
        }
        var elContainerData = $('<div class="chat_message_right_data"/>');
        elContainerData.attr("id", "chat_message_right_data_"+message.id);
        elContainerData.html('<div class="chat_message_username"/><div class="chat_message_datetime"/>');
        elContainerData.find(".chat_message_username").html(message.sender.username);
        elContainerData.find(".chat_message_datetime").html(message.dateCreated);
        var elContainerText = $('<div class="chat_message_right_text"/>');
        elContainerText.attr("id", "chat_message_right_text_"+message.id);
        var elContainerTextImg = $('<img/>');
        if (message.image) {
            elContainerTextImg.attr("src", message.image);
            elContainerText.append(elContainerTextImg);
        }
        elContainerText.append(message.text);
        el.append(elContainerImg);
        el.append(elContainerData);
        el.append(elContainerText);
        that.container.find(".chat_messages").append(el);
    },
    initChat: function() {
        var that = this;
        that.ajaxCall = $.ajax({
            method: 'GET',
            dataType: 'json',
            data: {
                chatId: that.chatId
            },
            url: that.urlGetData,
            success: function(response) {
                if (response.success) {
                    that.initMessages(response.chat.messages);
                }
            },
            error: function(xhr) {
                alert("Sorry an error occurred!");
                console.log(xhr.responseText);
            }
        });
    },
    initMessages: function(data) {
        var that = this;
        data.forEach(function(message, index) {
            if (message.adminMessage) {
                that.rightMessageHtml(message);
            } else {
                that.leftMessageHtml(message);
            }
        });
        setTimeout(function(){
            that.scrollDown();
        }, 500);
    },
    scrollDown: function() {
        var that = this;
        that.container.find(".chat_messages").scrollTop(that.container.find(".chat_messages")[0].scrollHeight);
    },
    sendMessage: function(e) {
        var that = this;
        var message = that.container.find("[name=chat_text_send]").val();
        if (message.replace(" ", "").length > 0) {
            that.ajaxCall = $.ajax({
                method: 'POST',
                dataType: 'json',
                data: {
                    chatId: that.chatId,
                    message: message,
                    csrfmiddlewaretoken: that.csrfToken
                },
                url: that.urlPostMessage,
                success: function(response) {
                    if (response.success) {
                        if (response.message.adminMessage) {
                            that.rightMessageHtml(response.message);
                        } else {
                            that.leftMessageHtml(response.message);
                        }
                        that.container.find("[name=chat_text_send]").val("");
                        setTimeout(function(){
                            that.scrollDown();
                        }, 500);
                    }
                },
                error: function(xhr) {
                    alert("Sorry an error occurred!");
                    console.log(xhr.responseText);
                }
            });
        }
    }
}

function closeIssue(csrfToken, issueId) {
    var conf = confirm("Are you sure?");
    if (conf) {
        $.ajax({
            method: 'POST',
            dataType: 'json',
            data: {
                issueId: issueId,
                csrfmiddlewaretoken: csrfToken
            },
            url: getBaseUrl() + 'admin/ajax/issue_close.html',
            success: function (response) {
                if (response.success) {
                    parent.$.colorbox.close();
                    parent.location.reload(true);
                }
            },
            error: function (xhr) {
                alert("Sorry an error occurred!");
                console.log(xhr.responseText);
            }
        });
    }
}