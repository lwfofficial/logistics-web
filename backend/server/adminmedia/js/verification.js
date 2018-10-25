function validateDocument(typeOfDocument, userId, csrfToken) {
    var conf = confirm('Are you sure to proceed?');
    if (conf) {
        var ajaxCall = $.ajax({
            url: getBaseUrl() + 'admin/ajax/verification_validate.html',
            method: 'POST',
            dataType: 'json',
            async: false,
            data: {
                typeOfDocument: typeOfDocument,
                userId: userId,
                csrfmiddlewaretoken: csrfToken
            },
            success: function (resp) {
                if (resp.success) {
                    alert("Success!");
                    window.location.reload(true);
                } else {
                    alert("Sorry an error occurred!");
                    console.log(resp);
                }
            },
            error: function (xhr, status, error) {
                alert("Sorry an error occurred!");
                console.log(error);
            }
        });
    }
}

function invalidateDocument(typeOfDocument, userId, csrfToken) {
    var conf = confirm('Are you sure to proceed?');
    if (conf) {
        var ajaxCall = $.ajax({
            url: getBaseUrl() + 'admin/ajax/verification_invalidate.html',
            method: 'POST',
            dataType: 'json',
            async: false,
            data: {
                typeOfDocument: typeOfDocument,
                userId: userId,
                csrfmiddlewaretoken: csrfToken
            },
            success: function (resp) {
                if (resp.success) {
                    alert("Success!");
                    window.location.reload(true);
                } else {
                    alert("Sorry an error occurred!");
                    console.log(resp);
                }
            },
            error: function (xhr, status, error) {
                alert("Sorry an error occurred!");
                console.log(error);
            }
        });
    }
}