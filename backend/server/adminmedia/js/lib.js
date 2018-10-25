if (!$) {
    $ = django.jQuery;
}
/* hide change image on field */
$(document).ready(function(){
    $('.adminimagefilewidget').next().hide();
});

$(document).ready(function() {
    //colorbox
    try {
        $('a.colorbox').colorbox({
            iframe: true,
            innerWidth: 640,
            innerHeight: 480,
            escKey: false,
            overlayClose: false
        });
    } catch (e) {
        console.log(e);
    }
    try {
        $('a.colorbox_big').colorbox({
            iframe: true,
            innerWidth: 800,
            innerHeight: 600,
            escKey: false,
            overlayClose: false
        });
    } catch (e) {
        console.log(e);
    }
});

function setAsPaidWithdrawRequest(sKey, wrId) {
    /*
    set paid a withdrawrequest
     */
    var conf = confirm("Set withdraw request as paid?");
    if (conf) {
        var transactionId = prompt("Please enter the transaction ID");

        if (transactionId == null || transactionId == "") {
            alert('Invalid transaction ID!')
        } else {
            var ajaxCall = $.ajax({
                url: getBaseUrl() + 'api/transaction/setAsPaidWithdrawRequest/',
                method: 'POST',
                dataType: 'json',
                data: {
                    sKey: sKey,
                    wrId: wrId,
                    transactionId: transactionId
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
}

function forceCompletePaymentTransaction(sKey, ptId) {
    /*
    Force Complete Payment Transaction
     */
    var conf = confirm("Force complete payment transaction?");
    if (conf) {
        var ajaxCall = $.ajax({
            url: getBaseUrl()+'api/transaction/forceCompletePaymentTransaction/',
            method: 'POST',
            dataType: 'json',
            data: {
                sKey: sKey,
                ptId: ptId
            },
            success: function (resp) {
                if (resp.success) {
                    alert("Success!");
                    window.location.reload(true);
                } else {
                    alert("Sorry an error occurred! (" + resp.error + ")");
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


function forceCompleteInstantDeliveryPaymentTransaction(sKey, ptId) {
    /*
    Force Complete Instant Delivery Payment Transaction
     */
    var conf = confirm("Force complete instant delivery payment transaction?");
    if (conf) {
        var ajaxCall = $.ajax({
            url: getBaseUrl()+'api/transaction/forceCompleteInstantDeliveryPaymentTransaction/',
            method: 'POST',
            dataType: 'json',
            data: {
                sKey: sKey,
                ptId: ptId
            },
            success: function (resp) {
                if (resp.success) {
                    alert("Success!");
                    window.location.reload(true);
                } else {
                    alert("Sorry an error occurred! (" + resp.error + ")");
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