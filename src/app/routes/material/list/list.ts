/**
 * Lists: seasonings, mailbox navigation, avatar messages and grouped folders.
 * How this file was built: `yarn ng g component routes/material/list`, then added translated
 * examples with local avatars. Mailbox links change a query parameter instead of searching Google.
 */
import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { map } from 'rxjs';

@Component({
  imports: [
    NgOptimizedImage,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    TranslatePipe,
    PageHeader,
  ],
  selector: 'app-material-list',
  styleUrl: './list.scss',
  templateUrl: './list.html',
})
export class MaterialList {
  protected readonly seasonings = ['pepper', 'salt', 'paprika'];
  protected readonly folders = ['inbox', 'outbox', 'spam', 'trash'];
  protected readonly groups = [
    { name: 'folders', icon: 'folder', items: ['imported', 'important', 'unread'] },
    { name: 'notes', icon: 'note', items: ['screenshots', 'application'] },
  ];
  protected readonly messages = [
    { id: 'john', sender: 'John', avatar: 'aurora-labs' },
    { id: 'mary', sender: 'Mary', avatar: 'ember-works' },
    { id: 'bobby', sender: 'Bobby', avatar: 'nimbus-dev' },
  ];
  protected readonly folder = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map(params => {
        const value = params.get('folder');
        return value && this.folders.includes(value) ? value : 'inbox';
      })
    ),
    { initialValue: 'inbox' }
  );
}
