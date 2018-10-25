function uploadFile() {
    var formData = new FormData($(this)[0]);
    var self = this;
    $('#response-text').text('Invio Nota Ordine...');
    $.ajax({
        processData: false,
        contentType: false,
        data: formData,
        type: $(this).attr('method'),
        url: $(this).attr('action'),
        success: function (response) {
            console.log(response);
            if (response.success) {
                $('#response-text').text('Nota ordine inviata con successo!');
                $(self)[0].reset();
            } else {
                $('#response-text').text(response.errors.join());
            }
        }
    });
    return false;
}

$(function () {
    $('#file-upload-form').submit(uploadFile);
});