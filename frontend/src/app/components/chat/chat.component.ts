import {AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ChatService} from "../../services/chat.service";
import {Lightbox, LightboxConfig} from "angular2-lightbox";
import {DefaultLocale, Language, Currency} from "angular-l10n";
import {animate, state, style, transition, trigger} from "@angular/animations";

const DEFAULT_UPLOAD_IMAGE = 'assets/images/orders/upload-photo-btn.png';

@Component({
    selector: 'chat',
    templateUrl: './templates/chat.component.html',
    styleUrls: [
        './chat.component.scss',
        '../../pages/page.component.scss',
        '../../pages/orders/orders.component.scss'
    ],
    animations: [
        trigger('transitionMessage', [
            state('enter', style({opacity: 1, transform: 'translateY(100%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(0%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
    encapsulation: ViewEncapsulation.None
})
export class ChatComponent implements OnInit, AfterViewChecked {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('comments') private commentsContainer: ElementRef;

    @Input() chat;
    @Input() profile;
    @Input() enabled = true;
    @Input() issue;

    newNoteUploadSrc = DEFAULT_UPLOAD_IMAGE;
    newMessageDate = new Date();
    uploadForm: FormGroup;
    showSpinner: boolean;
    showUpload = false;

    images = [];
    errorTooBig: boolean = false;
    otherError: boolean = false;

    constructor(private chatService: ChatService,
                private lightbox: Lightbox,
                private _lightboxConfig: LightboxConfig) {

        this.uploadForm = new FormGroup({
                message: new FormControl('', [Validators.required]),
                uploadError: new FormControl('', []),
            },
            {updateOn: 'submit'}
        );

        _lightboxConfig.disableScrolling = true;
        _lightboxConfig.centerVertically = true;

    }

    ngOnInit(): void {
        this.updateImageGallery();
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private updateImageGallery() {
        this.images = this.chat
            .messages
            .filter(message => message.image)
            .map(message => {
                return {src: message.image};
            });
    }

    scrollToBottom(): void {
        try {
            this.commentsContainer.nativeElement.scrollTop = this.commentsContainer.nativeElement.scrollHeight;
        } catch (err) {
        }
    }

    showUploadImage(event) {
        event.stopPropagation();
        this.showUpload = !this.showUpload;
    }

    setNewNoteUploadSrc(newNoteUploadSrc) {
        this.newNoteUploadSrc = newNoteUploadSrc;
        this.uploadForm.controls['uploadError'].setErrors(null);
    }

    messageSenderClass(message) {
        return message.sender.username === this.profile.user.username ?
            'user-message' :
            'other-message';
    }


    uploadMessage({value, valid}: { value: FormGroup, valid: boolean }) {
        if (valid) {
            this.errorTooBig = false;
            this.otherError = false;
            this.showSpinner = true;
            this.chatService
                .createChatMessage(
                    this.newNoteUploadSrc === DEFAULT_UPLOAD_IMAGE ? null : this.newNoteUploadSrc,
                    this.uploadForm.get("message").value,
                    this.chat.id
                )
                .then((response: any) => {
                    this.showSpinner = false;
                    this.newNoteUploadSrc = 'assets/images/orders/upload-photo-btn.png';
                    if (response.success) {
                        this.chat = response.issue.chat;
                        this.updateImageGallery();
                        this.uploadForm.reset();
                        this.uploadForm.clearValidators();
                        this.showUpload = false;
                    }
                })
                .catch(error => {
                    this.showSpinner = false;
                    console.log(error);
                    try {
                        if (error.error.error === 'file.toobig') {
                            this.errorTooBig = true;
                            this.uploadForm.controls['uploadError'].setErrors({
                                backend: {uploadError: "the file size is too big, please select another file (max 6MB)."}
                            });
                            return
                        }
                    } catch (e) {}
                    this.otherError = true;
                    this.uploadForm.controls['uploadError'].setErrors({
                        backend: {uploadError: "Error on sending message, please try again."}
                    });
                });
        }
    }

    openImage(message) {
        if (!message.image) {
            return;
        }
        let index = this.images.findIndex(image => image.src == message.image);
        this.lightbox.open(this.images, index);
    }

}