/**
 * Unit tests for `FormsElements`.
 *
 * How this file was built:
 *   1. `yarn ng g component routes/forms/elements` generated the "should create" test.
 *   2. Replaced it with tests of the inline form echoing its values and of the two layouts of the
 *      profile form.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideDemoDates } from '../../demo/demo-dates';
import { FormsElements } from './elements';

describe('FormsElements', () => {
  let fixture: ComponentFixture<FormsElements>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), provideDemoDates()],
    });
    fixture = TestBed.createComponent(FormsElements);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should echo the values of the inline form', async () => {
    const username: HTMLInputElement = fixture.nativeElement.querySelector('.inline input');
    username.value = 'ada';
    username.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('code').textContent).toContain('"username": "ada"');
  });

  it('should show the profile form in one and in two columns', () => {
    const forms = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('app-profile-form')
    );

    expect(forms).toHaveLength(2);
    expect(forms[0].querySelector('.col-sm-6')).toBeNull();
    expect(forms[1].querySelector('.col-sm-6')).not.toBeNull();
  });
});
