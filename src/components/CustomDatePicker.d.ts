import React from 'react';
interface CustomDatePickerProps {
    value?: Date;
    onChange: (date: Date) => void;
    selected?: Date;
    className?: string;
}
declare const CustomDatePicker: React.FC<CustomDatePickerProps>;
export default CustomDatePicker;
