import {FormGroup, FormControl} from "@angular/forms";

export class FormValidators {

    static passwordMatchValidator(g: FormGroup) {
        let password = g.get('password');
        let confirmPassword = g.get('confirmPassword');
        let validPasswordConfirmation = password && confirmPassword && password.value === confirmPassword.value;
        if (!validPasswordConfirmation) {
            password.setErrors({mismatch: true});
            confirmPassword.setErrors({mismatch: true});
        }
        return validPasswordConfirmation ? null : {'mismatch': true};
    }

    static changePasswordMatchValidator(g: FormGroup) {
        let password = g.get('newPassword');
        let confirmPassword = g.get('newPasswordConfirm');
        let validPasswordConfirmation = password && confirmPassword && password.value === confirmPassword.value;
        if (!validPasswordConfirmation) {
            password.setErrors({mismatch: true});
            confirmPassword.setErrors({mismatch: true});
        }
        return validPasswordConfirmation ? null : {'mismatch': true};
    }

    static noWhitespaceValidator(control: FormControl) {
        let isWhitespace = control.value.search(" ") > -1;
        let isValid = !isWhitespace;
        return isValid ? null : {'whitespace': true}
    }

    static weekdaysCllValidator(g: FormGroup) {
        let daysInvalid = false;
        let sunday = g.get('sunday').value;
        let monday = g.get('monday').value;
        let tuesday = g.get('tuesday').value;
        let wednesday = g.get('wednesday').value;
        let thursday = g.get('thursday').value;
        let friday = g.get('friday').value;
        let saturday = g.get('saturday').value;
        if (!sunday && !monday && !tuesday && !wednesday
            && !thursday && !friday && !saturday) {
            daysInvalid = true;
        }
        return daysInvalid ? {'weekdaysError': true} : null
    }

    static timeslotsCllValidator(g: FormGroup) {
        let timeValid = true;
        let dawn = g.get('deliveryOnDawn').value;
        let morning = g.get('deliveryOnMorning').value;
        let afternoon = g.get('deliveryOnAfternoon').value;
        let evening = g.get('deliveryOnEvening').value;
        let lunchtime = g.get('deliveryOnLunchTime').value;
        let night = g.get('deliveryOnNight').value;
        if (!dawn && !morning && !lunchtime && !afternoon
            && !evening && !night) {
            timeValid = false;
        }
        return timeValid ? null : {'timeslotsError': true}
    }

    static validateWithdrawAmount(g: FormGroup) {
        let amountValid = true;
        let amount = g.get("amount");
        let credit = parseFloat(g.get("credit").value);
        if (amount.value > credit) {
            amountValid = false;
            amount.setErrors({mismatch: true});
        }
        return amountValid ? null : {'amountError': true}
    }

    static validatePaypalAmount(g: FormGroup) {
        let amountValid = true;
        let amount = g.get("amount");
        if (amount.value < 1) {
            amountValid = false;
            amount.setErrors({mismatch: true});
        }
        return amountValid ? null : {'amountError': true}
    }

    static validateAllFormFields(g: FormGroup) {
        Object.keys(g.controls).forEach(field => {
            const control = g.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({onlySelf: true});
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    static validateWeight(g: FormGroup) {
        let weightValid = true;
        let parcelWeight = g.get('parcelWeight');
        let shippingWeight = g.get('shippingWeight');
        if (parcelWeight.value === 0 && shippingWeight.value > 3 ||
            parcelWeight.value === 1 && shippingWeight.value > 7) {
            weightValid = false;
            shippingWeight.setErrors({mismatch: true});
        }
        return weightValid ? null : {'weightError': true}
    }
}