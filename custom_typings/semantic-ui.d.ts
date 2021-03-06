interface visibilityOptions {
    once?: boolean;
    continuous?: boolean;
    onBottomPassed?(e?: JQueryEventObject);
    onBottomPassedReverse?(e?: JQueryEventObject);
    type?: 'fixed' | 'image';
    offset?: number;
}

interface dropdownOptions {
    allowAdditions?: boolean;
    forceSelection?: boolean;
    placeholder?: string;
    selectOnKeydown?: boolean;
    onChange?(changed:string):void;
    onAdd?(added:string)
}

interface calendarOptions {
    type?: string;
    firstDayOfWeek?: number;
    onChange?(e:string):void;
    initialDate?:Date;
    formatter?:any;
}

interface modalOptions {
    onApprove(e?:any);
}

interface transitionOptions {
    animation: string;
    onHide?(e?:any);
}

type sidebarCallback = () => void;

interface sidebarOptions {
    context?: string;
    exclusive?: boolean;
    closable?: boolean;
    dimPage?: boolean;
    scrollLock?: boolean;
    returnScroll?: boolean;
    delaySetup?: boolean;
    transition?: 'scale' | 'uncover' | 'overlay';
    onVisible?: sidebarCallback;
    onShow?: sidebarCallback;
    onChange?: sidebarCallback;
    onHide?: sidebarCallback;
    onHiddne?: sidebarCallback;
}

interface JQuery {
  visibility(options?: visibilityOptions | string) : JQuery;
  transition(transition:string|transitionOptions) : JQuery;
  dropdown(options?: dropdownOptions | string, values?:any) : JQuery;
  calendar(options?: calendarOptions | string, values?:any) : JQuery;
  modal(options?: modalOptions | string) : JQuery;
  form(options?: Object | string, message?:string) : JQuery;
  checkbox(options?: Object | string, message?:string) : JQuery;
  sidebar(options?: sidebarOptions | string) : JQuery;
  popup(options?:string) : JQuery;
}
