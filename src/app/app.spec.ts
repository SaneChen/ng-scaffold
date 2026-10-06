import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // [ng-scaffold] Step 1: the `<h1>Hello, ng-scaffold</h1>` asserted here belonged to the deleted
    // welcome placeholder, so the template is checked for the router outlet instead. A later step
    // (page titles) turns this test back into a real "title" assertion.
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
