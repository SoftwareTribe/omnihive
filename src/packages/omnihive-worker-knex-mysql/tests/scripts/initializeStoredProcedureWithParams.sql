create procedure test_stored_procedure_with_params
    (IN paramString char(255),
     IN paramNumber int)
begin

select concat(paramString, ' ', paramNumber) as dataresult;

end