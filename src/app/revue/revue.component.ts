import { Component, computed, signal, Signal, inject, Injector } from '@angular/core';
import { collection, collectionData, Firestore, DocumentData, query, where } from "@angular/fire/firestore";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder } from "@angular/forms";

/*interface revue {
  num_revue: number;
  date_sortie: Date;
  titre_revue: string;
}*/

@Component({
  selector: 'app-revue',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './revue.component.html',
  styleUrls: ['./revue.component.css']
})
export class RevueComponent {

  /*revueList: Signal<revue[]>; // 👈 nouveau nom*/
  revueList: Signal<(DocumentData | (DocumentData & {
   titre_revue: string;
   date_sortie: Date;
   num_revue: number; }))[]>;
  Une_revue: Signal<(DocumentData | (DocumentData & {
    titre_revue: string;
    date_sortie: Date;
    num_revue: number; }))[]>;
  injector = inject(Injector);
  selectedTitre = signal<string | null>(null); 
  firestore: Firestore = inject(Firestore);

  constructor() {
    const itemCollection = collection(this.firestore, "revue");
    const revue_collection = query(itemCollection, where("num_revue", "==", 2));
    const revueObservable = collectionData(itemCollection);
    /* Test : est-ce que les données arrivent ?
    revueObservable.subscribe(data => {
      console.log("📚 Données chargées depuis Firestore :", data);
    });*/
    

      this.revueList = toSignal( collectionData(itemCollection),{initialValue: [], injector: this.injector}) ;
      this.Une_revue = toSignal( collectionData(revue_collection),{initialValue: [], injector: this.injector}) ;
    /*this.revueList = toSignal(revueObservable, { initialValue: [], injector: this.injector });*/
  }

  /*filteredRevue = computed(() =>
  !this.selectedTitre()
    ? this.revueList()
    : this.revueList().filter(item => item.titre_revue === this.selectedTitre())
);*/
}