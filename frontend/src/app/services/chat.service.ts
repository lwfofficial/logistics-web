import {BaseService} from "./base.service";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";


@Injectable()
export class ChatService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/chat";
    }

    createChatMessage(imageData, text, chatId) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/createIssueChatMessage/`,
                {
                    messageImage: imageData,
                    messageText: text,
                    chatId: chatId
                },
                {headers: headers}
            ).toPromise();
    }
}