export interface IValidatable {
    validate():ValidationResult;
}

export interface ValidationResult {
    ok:boolean;
    errors:string[];
}