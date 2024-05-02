import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { UploadService } from './services/upload.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterContentChecked {
  title = 'AllSol';
  loader = new BehaviorSubject(false);
  showNext = false;
  showDetails = false;
  resetSubject = new Subject<boolean>();
  submitSubject = new Subject<boolean>();
  imageData = {
    edited: false,
    base64: '',
    src: '',
    alt: '',
    type: '',
  };

  constructor(
    private uploadService: UploadService,
    private cdref: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loader = this.uploadService.isLoading;
  }

  reset() {
    this.showDetails = false;
    this.resetSubject.next(true);
  }

  next() {
    this.submitSubject.next(true);
  }

  handleImageData(event: any) {
    if (event) {
      this.imageData = event;
    }
    this.showNext = event ? true : false;
  }

  handleShowDetails(event: any) {
    if (event) {
      this.showDetails = true;
    }
  }

  ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }
}
