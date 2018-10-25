function uploadFile() {
    var formData = new FormData($(this)[0]);
    $('#response-update-text').text('Updating Prices...');
    $.ajax({
        processData: false,
        contentType: false,
        data: formData,
        type: $(this).attr('method'),
        url: $(this).attr('action'),
        success: function (response) {
            console.log(response);
            if (response.success) {
                $('#response-update-text').text('Prices updated: ' + response.pricesUpdated + ', Prices created: ' + response.pricesCreated)
            } else {
                $('#response-update-text').text(response.errors.join());
            }
        }
    });
    return false;
}

function deleteCourierPrices(event) {
    event.preventDefault();
    var formData = new FormData($(this)[0]);
    if (confirm("Delete all " + formData.get('type') + " prices")) {
        $('#response-delete-text').text('Deleting Prices...');
        $.ajax({
            processData: false,
            contentType: false,
            data: formData,
            type: $(this).attr('method'),
            url: $(this).attr('action'),
            success: function (response) {
                console.log(response);
                if (response.success) {
                    $('#response-delete-text').text('Prices deleted: ' + response.pricesDeleted)
                } else {
                    $('#response-delete-text').text(response.errors.join());
                }
            }
        });
    }
    return false;
}

$(function () {
    $('#file-upload-form').submit(uploadFile);
    $('#delete-form').submit(deleteCourierPrices);
});