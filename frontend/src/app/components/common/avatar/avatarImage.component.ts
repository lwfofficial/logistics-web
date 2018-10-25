import {Component, EventEmitter, Input, Output, ViewEncapsulation} from "@angular/core";


@Component({
    selector: 'avatar-image',
    styleUrls: ['./avatarImage.component.scss'],
    templateUrl: './avatarImage.component.html',
    encapsulation: ViewEncapsulation.None
})
export class AvatarImageComponent {


    @Input()
    editable = true;
    @Input()
    src = 'assets/images/account/default_avatar.png';
    @Input()
    id: string;
    @Input()
    altText = '';
    @Input()
    accept: string;

    @Output()
    imageChanged = new EventEmitter();



    readURL(event) {
        if (this.editable
            && event.target.files
            && event.target.files[0]) {
            let reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageChanged.emit(e.target.result);
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    }

    click() {
        document.getElementById(this.id + '_input').click();
    }

    isImage() {
        let extension = this.getFileType();
        return ['jpeg', 'jpg', 'png', 'svg'].includes(extension);
    }

    private getFileType() {
        if(!this.src){
            return '';
        }
        return this.src.startsWith("data") ?
            this.src.substr(this.src.indexOf("/") + 1, this.src.indexOf(";") - 1 - this.src.indexOf("/")) :
            this.src.substr(this.src.lastIndexOf('.') + 1);
    }
}

