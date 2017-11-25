export function equals(a:string | null, b:string | null):boolean {
    if(a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}

export function contains(value:string, ...args):boolean {
    for(const arg of args) {
        if(equals(value, arg)) return true;
    }

    return false;
}