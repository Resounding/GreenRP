export class DateFormatValueConverter {
    toView(value:string, format:string):string {
        var m = moment(value);
        if(!m.isValid()) return '';

        format = format || 'DD-MMM-YYYY';

        return m.format(format);
    }
}
