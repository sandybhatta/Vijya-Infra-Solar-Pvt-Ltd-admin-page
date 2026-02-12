
-- 1. Check Table Columns (Names, Types, Nullability)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'projects'
ORDER BY 
    ordinal_position;

-- 2. Check Constraints (To verify valid 'project_status' values)
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(oid) as definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'projects'::regclass
    AND contype = 'c'; -- 'c' for check constraints

-- 3. Check if tasks table exists
SELECT * FROM information_schema.tables WHERE table_name = 'tasks';
