import { Component, computed, signal, Signal, inject, Injector } from '@angular/core';
import { collection, collectionData, Firestore } from "@angular/fire/firestore";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

interface revue {
  num_revue: number;
  date_sortie: Date;
  titre_revue: string;
}

@Component({
  selector: 'app-revue',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './revue.component.html',
  styleUrls: ['./revue.component.css']
})
export class RevueComponent {

  revueList: Signal<revue[]>; // 👈 nouveau nom
  selectedTitre = signal<string | null>(null);
  injector = inject(Injector);
  firestore: Firestore = inject(Firestore);

  constructor() {
    const itemCollection = collection(this.firestore, "revue");
    const revueObservable = collectionData(itemCollection) as Observable<revue[]>;
    this.revueList = toSignal(revueObservable, { initialValue: [], injector: this.injector });
  }

  get filteredRevue() {
    return computed(() =>
      !this.selectedTitre()
        ? this.revueList()
        : this.revueList().filter(item => item.titre_revue === this.selectedTitre())
    )();
  }
}