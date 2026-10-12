/**
 * Food tree with flat rendered nodes and a children accessor.
 * How this file was built: `yarn ng g component routes/material/tree`, then added translated
 * food nodes. Uses the current childrenAccessor API instead of deprecated FlatTreeControl.
 */
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '@shared';

interface FoodNode {
  name: string;
  children?: FoodNode[];
}

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTreeModule,
    TranslatePipe,
    PageHeader,
  ],
  selector: 'app-material-tree',
  styleUrl: './tree.scss',
  templateUrl: './tree.html',
})
export class MaterialTree {
  protected readonly data: FoodNode[] = [
    { name: 'fruit', children: [{ name: 'apple' }, { name: 'banana' }, { name: 'fruit_loops' }] },
    {
      name: 'vegetables',
      children: [
        { name: 'green', children: [{ name: 'broccoli' }, { name: 'sprouts' }] },
        { name: 'orange', children: [{ name: 'pumpkin' }, { name: 'carrot' }] },
      ],
    },
  ];
  protected readonly childrenAccessor = (node: FoodNode) => node.children ?? [];
}
