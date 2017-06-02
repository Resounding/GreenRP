const toString = Object.prototype.toString;

export class SortValueConverter {
  toView(array:Array<any>, propertyName:string, direction?:string) {
    if(!array) return 0;

    const factor = direction === 'descending' ? -1 : 1;
    return array
      .slice(0)
      .sort((a, b) => {
        var first = a[propertyName],
          second = b[propertyName];

        if(typeof first === 'number' && typeof(second === 'number')) {
          return (first < second ? -1 : 1) * factor;
        }

        if(toString.call(first) === '[object Date]' && toString.call(second) === '[object Date]') {
          return (first < second ? -1 : 1) * factor;
        }

        first = (first || '').toString().toLowerCase();
        second = (second || '').toString().toLowerCase();
        return (first < second ? -1 : 1) * factor;
      });
  }
}