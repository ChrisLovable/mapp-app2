import React from 'react';
import type { FormData, EditingFormData } from '../../types/calendar';
interface EventFormProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
    editingFormData: EditingFormData;
    setEditingFormData: (data: EditingFormData) => void;
    selectedEvent: any;
    isEditing: boolean;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
    showDeleteConfirm: boolean;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
    sttHandlers: any;
}
export declare const EventForm: React.FC<EventFormProps>;
export {};
