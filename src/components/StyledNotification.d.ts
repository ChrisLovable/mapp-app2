import React from 'react';
declare const StyledNotification: React.FC<{
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}>;
export default StyledNotification;
