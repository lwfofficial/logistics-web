import {Component, ElementRef, Input, ViewChild} from '@angular/core';

@Component({
    selector: 'script-wrapper',
    templateUrl: './script-wrapper.component.html'
})
export class ScriptWrapperComponent {

    @Input()
    src: string;

    @Input()
    type: string;

    @ViewChild('script') script: ElementRef;

    ngAfterViewInit() {
        let element = this.script.nativeElement;
        let script = document.createElement("script");
        script.type = this.type ? this.type : "text/javascript";
        if (this.src) {
            script.src = this.src;
        }
        if (element.innerHTML) {
            script.innerHTML = element.innerHTML;
        }
        let parent = element.parentElement;
        parent.parentElement.replaceChild(script, parent);
    }
}