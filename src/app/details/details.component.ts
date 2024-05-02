import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css'],
})
export class DetailsComponent implements OnInit {
  @Input() imageData: {
    edited: boolean;
    base64: string;
    src: string;
    alt: string;
    type: string;
  } = {
    edited: false,
    base64: '',
    src: '',
    alt: '',
    type: '',
  };
  text: SafeHtml = '';
  constructor(
    private uploadService: UploadService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.imageBasedProcessing();
  }

  imageBasedProcessing() {
    this.uploadService.startLoader();

    const formData = {
      contents: [
        {
          parts: [
            {
              text: this.imageData.edited
                ? 'Find the issue related to annotated area and highlight issue name with "**"** and provide the appropriate step-by-step 5-6 line solution'
                : 'Identify the image and highlight name with "**"** and Provide the 7-8 lines introduction about the image',
            },
            {
              inline_data: {
                mime_type: this.imageData.type,
                data: this.imageData.base64,
              },
            },
          ],
        },
      ],
    };
    this.uploadService.imageBasedPrompt(formData).subscribe({
      next: (res: any) => {
        let text = res?.candidates?.[0]?.content?.parts?.[0].text;
        const regex = new RegExp(/\*\*(.*?)\*\*/, 'gi'); // Case-insensitive global match
        text = text.replace(regex, '<strong class="text-primary">$1</strong>');
        this.text = this.sanitizer.bypassSecurityTrustHtml(text);
        this.uploadService.stopLoader();
      },
      error: (err: any) => {
        console.log(err);
        this.uploadService.stopLoader();
      },
    });
  }
}
