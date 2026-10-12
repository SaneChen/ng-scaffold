/**
 * Card demo with grouped content, headers, imagery and actions.
 * How this file was built: generated with `yarn ng g component routes/material/card`,
 * then replaced the placeholder with translated examples and signal-backed actions.
 * Why: local gallery imagery keeps this demo independent of external image hosts.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  imports: [NgOptimizedImage, MatButtonModule, MatCardModule, TranslatePipe, PageHeader],
  selector: 'app-material-card',
  styleUrl: './card.scss',
  templateUrl: './card.html',
})
export class MaterialCard {
  protected readonly groups = ['mountains', 'lakes', 'forests', 'coast'];
  protected readonly liked = signal(false);
  protected readonly shared = signal(false);
}
