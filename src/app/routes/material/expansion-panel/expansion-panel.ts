/**
 * Single expansion panel and accordion, including a disabled panel and close actions.
 * How this file was built: `yarn ng g component routes/material/expansion-panel`, then
 * replaced the placeholder with translated breed descriptions and public Material controls.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [MatButtonModule, MatExpansionModule, TranslatePipe, PageHeader],
  selector: 'app-material-expansion-panel',
  styleUrl: './expansion-panel.scss',
  templateUrl: './expansion-panel.html',
})
export class MaterialExpansionPanel {
  protected readonly breeds = ['retriever', 'beagle', 'dachshund'];
}
