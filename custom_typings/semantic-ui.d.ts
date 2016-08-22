interface visibilityOptions {
    once?: boolean;
    continuous?: boolean;
    onBottomPassed?(e?: JQueryEventObject);
    onBottomPassedReverse?(e?: JQueryEventObject);
}

interface dropdownOptions {
    allowAdditions?: boolean;
    onChange?(changed:string):void;
    onAdd?(added:string)
}

interface calendarOptions {
    type?: string;
    onChange?(e:string):void;
}

interface modalOptions {
    onApprove(e?:any);
}


interface JQuery {
  visibility(options?: visibilityOptions) : JQuery;
  transition(transition:string) : JQuery;
  dropdown(options?: dropdownOptions | string, values?:any) : JQuery;
  calendar(options?: calendarOptions | string, values?:any) : JQuery;
  modal(options?: modalOptions | string) : JQuery;
  form(options?: Object | string, message?:string) : JQuery;
  checkbox(options?: Object | string, message?:string) : JQuery;
}
