import { TestBed } from '@angular/core/testing';
import { App } from './app';
// [ng-scaffold] Step 2: App hides the start-up loader after the router's first navigation.
import { Component } from '@angular/core';
import { Router } from '@angular/router';

// [ng-scaffold] Step 2: a lazily loaded page, like every routed page of the application.
@Component({ template: '<h1>Home</h1>' })
class HomePage {}

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

  // [ng-scaffold] Step 2: the start-up loader of index.html fades out once the first page has
  // rendered: after the router's first navigation, not after App's own (empty) first render.
  it('should start hiding the start-up loader once the first page has rendered', async () => {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    document.body.append(loader);
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: '', loadComponent: () => Promise.resolve(HomePage) }]);

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(loader.classList).not.toContain('global-loader-fade-out');

    // provideRouter() starts this navigation in a real application, right after bootstrap.
    await router.navigateByUrl('/');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('Home');
    expect(loader.classList).toContain('global-loader-fade-out');
    loader.remove();
  });
});
