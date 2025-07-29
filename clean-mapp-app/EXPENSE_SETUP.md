# Expense Tracker Setup

## Overview
The Expense Tracker feature allows users to manage their expenses with automatic parsing from receipt images and manual entry capabilities. It follows the same UI/UX patterns as other modals in the application.

## Features
- **Image Upload & Parsing**: Upload receipt/expense images for automatic parsing using OpenAI Vision
- **HEIC Support**: Automatic conversion of HEIC images to JPEG format
- **Manual Entry**: Option to enter expenses manually without image upload
- **Multi-item Support**: Parse multiple expense items from a single image
- **CRUD Operations**: Create, read, update, and delete expense entries
- **Category Management**: Automatic categorization of expenses
- **Currency Formatting**: Proper display of monetary amounts

## Database Setup

### Table Structure
The `expense_tracker` table includes the following fields:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `expense_date` (DATE, Required)
- `vendor` (TEXT)
- `amount` (DECIMAL(10,2), Required)
- `description` (TEXT)
- `category` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Setup Instructions
1. Run the SQL script `expense_tracker_table.sql` in your Supabase database
2. The script will create the table, indexes, RLS policies, and triggers automatically

## Usage

### Image Upload Flow
1. Click the "Expenses" button in the app grid
2. Choose to upload an image or enter manually
3. Select an image file (supports JPEG, PNG, HEIC)
4. Click "Parse Image" to extract expense data
5. Review and edit parsed data if needed
6. Click "Confirm Expenses" to save

### Manual Entry Flow
1. Click the "Expenses" button in the app grid
2. Click "Enter Manually"
3. Fill in expense details (date, amount, vendor, category, description)
4. Add multiple expenses if needed
5. Click "Confirm Expenses" to save

### Parsing Capabilities
The AI parser extracts:
- **Date**: From receipt or defaults to today
- **Vendor**: Store/company name
- **Amount**: Numeric value only
- **Description**: Item description
- **Category**: Common categories (Food, Gas, Utilities, etc.)

## Technical Implementation

### Dependencies
- `heic2any`: For HEIC image conversion
- `@supabase/supabase-js`: Database operations
- OpenAI Vision API: Image parsing

### Key Components
- `ExpenseModal.tsx`: Main modal component
- `expense_tracker_table.sql`: Database schema
- Integration with existing modal patterns

### Security
- Row Level Security (RLS) enabled
- User-specific data access
- Secure image handling

## Testing
1. Test image upload with various formats (JPEG, PNG, HEIC)
2. Test manual entry functionality
3. Verify parsing accuracy with different receipt types
4. Test CRUD operations (create, read, delete)
5. Verify currency formatting and display

## Future Enhancements
- Export functionality (CSV, PDF)
- Expense analytics and reporting
- Receipt image storage
- Budget tracking
- Category customization
- Multi-currency support 