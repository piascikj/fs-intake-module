import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpMePickComponent } from './help-me-pick.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('HelpMePickComponent', () => {
  let component: HelpMePickComponent;
  let fixture: ComponentFixture<HelpMePickComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        declarations: [HelpMePickComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpMePickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
