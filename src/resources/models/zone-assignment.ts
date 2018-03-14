export interface ZoneAssignment {
    _id:string;
    _rev:string;
    growers: GrowerAssignment;
    labour: LabourAssignment;
}

interface GrowerAssignment {
    [index:string]:string;
}

interface LabourAssignment {
    [index:string]:string;
}