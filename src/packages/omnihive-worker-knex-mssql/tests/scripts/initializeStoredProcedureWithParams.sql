create procedure test_stored_procedure_with_params
    (@paramString varchar(1000),
     @paramNumber int)
as
begin

select convert(varchar(1000), @paramString) + ' ' + convert(varchar(1000), @paramNumber) as dataresult

end