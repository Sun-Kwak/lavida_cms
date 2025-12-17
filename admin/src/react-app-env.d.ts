/// <reference types="react-scripts" />
/// <reference types="react-scripts" />

declare module 'dayjs' {
  const dayjs: any;
  export default dayjs;
}

declare module 'xlsx' {
  export const utils: any;
  export const writeFile: any;
}

declare module 'react-datepicker' {
  const DatePicker: any;
  export default DatePicker;
}

declare module 'date-fns/locale' {
  export const ko: any;
}
