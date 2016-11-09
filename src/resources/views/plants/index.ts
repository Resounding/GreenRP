import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService, DialogResult} from 'aurelia-dialog';
import {ReferenceService} from '../../services/data/reference-service'
import {Plant,Spacings} from '../../models/plant';
import {PlantDetail} from './plant-detail';

@autoinject
export class CropIndex {
    plants:Plant[];
    
    constructor(private referenceService:ReferenceService, private dialogService:DialogService) {
        this.loadPlants();
    }

    loadPlants() {
        return this.referenceService.plants()
            .then(result => this.plants = result);
    }

    cuttingsPerTable(plant:Plant) {
        if(typeof plant.cuttingsPerTable === 'number') return plant.cuttingsPerTable;

        return _.reduce([Spacings.Tight, Spacings.Half, Spacings.Full], (memo:string[], space:string) => {
            var value = plant.cuttingsPerTable[space]; 
            if(typeof value !== 'undefined') {
                memo.push(`${space}: ${value}`);
            }
            return memo;
        }, []).join(', ');
    }

    detail(plant:Plant) {
        this.dialogService.open({
            viewModel: PlantDetail,
            model: plant
        }).then((result:DialogResult) => {
            if(result.wasCancelled) return;

            this.loadPlants();
        });
    }
}