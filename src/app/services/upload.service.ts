import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  public isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: any
  ) {}

  imageBasedPrompt(data: any) {
    return this.http.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
      data,
      {
        params: {
          key: this.environment.googleApiKey,
        },
      }
    );
  }

  startLoader() {
    this.isLoading.next(true);
  }

  stopLoader() {
    this.isLoading.next(false);
  }
}
