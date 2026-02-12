
-- Check constraints for invoices table
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(oid) as definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'invoices'::regclass;

-- Check columns of invoices
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'invoices';
