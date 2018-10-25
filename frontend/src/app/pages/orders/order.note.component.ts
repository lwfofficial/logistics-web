import {Component, Input, OnInit} from "@angular/core";
import {FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {OrderService} from "../../services/order.service";
import {Currency, DefaultLocale, Language} from "angular-l10n";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
    selector: 'order-notes',
    templateUrl: './templates/order.note.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    animations: [
        trigger('transitionMessage', [
            state('enter', style({opacity: 1, transform: 'translateY(100%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(0%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
})
export class OrderNotesComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() order;
    @Input() profile;

    uploadForm: FormGroup;
    showSpinner: boolean;

    newNoteDate = new Date();

    newNoteUploadSrc = 'assets/images/orders/upload-photo.svg';

    errorTooBig = false;

    constructor(private orderService: OrderService) {
    }

    ngOnInit() {
        this.uploadForm = new FormGroup({
                noteText: new FormControl('', [Validators.required]),
                nullNote: new FormControl('', []),
                invalidNote: new FormControl('', []),
            },
            {updateOn: 'submit'}
        )
    }

    setNewNoteUploadSrc(newNoteUploadSrc) {
        this.newNoteUploadSrc = newNoteUploadSrc;
        // this.uploadForm.controls['nullNote'].setErrors(null);
        // this.uploadForm.controls['invalidNote'].setErrors(null);
    }

    upload({value, valid}: { value: FormGroup, valid: boolean }, formDirective: FormGroupDirective) {
        // if (!this.newNoteUploadSrc) {
        //     this.uploadForm.controls['nullNote'].setErrors({
        //         backend: {nullNote: "Please select an Image"}
        //     });
        // } else if (this.newNoteUploadSrc == 'assets/images/orders/upload-photo-btn.png') {
        //     this.uploadForm.controls['nullNote'].setErrors({
        //         backend: {nullNote: "Please select an Image"}
        //     });
        // } else {
        //     this.uploadForm.controls['nullNote'].setErrors(null);
        // }
        if (valid) {
            this.showSpinner = true;
            this.orderService
                .createOrderNote(this.newNoteUploadSrc, this.uploadForm.get("noteText").value, this.order.id)
                .then((response: any) => {
                    this.showSpinner = false;
                    if (response.success) {
                        this.order = response['order'];
                        this.newNoteUploadSrc = 'assets/images/orders/upload-photo.svg';
                        this.clearError(formDirective);
                    }
                })
                .catch(error => {
                    this.showSpinner = false;
                    console.log(error);
                    try {
                        if (error.error.error === "file.toobig") {
                            this.errorTooBig = true;
                            this.uploadForm.controls['invalidNote'].setErrors({
                                backend: {invalidNote: "Document size is too big, please select a valid document for upload and retry"}
                            });
                            setTimeout(() => {
                               this.clearError(formDirective);
                            }, 5000);
                            return
                        }
                    } catch (e) {
                    }
                    this.uploadForm.controls['invalidNote'].setErrors({
                        backend: {invalidNote: "Error on uploading document, please select a valid document for upload and retry"}
                    });
                    setTimeout(() => {
                        this.clearError(formDirective);
                    }, 5000);
                })
        }
    }

    clearError(formDirective) {
        this.uploadForm.setErrors(null);
        this.uploadForm.controls['invalidNote'].setErrors(null);
        this.uploadForm.controls['noteText'].setErrors(null);
        formDirective.resetForm();
        this.uploadForm.reset();

    }

    downloadDocument(url) {
        if (url) {
            window.open(url, '_blank');
        }
        return
    }
}