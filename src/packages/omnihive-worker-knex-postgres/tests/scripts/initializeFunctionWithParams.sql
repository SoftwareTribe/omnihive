create function test_function_with_params(paramString varchar(100), paramNumber int)
returns varchar(100)
language plpgsql
as
$$
declare
   return_value varchar(100);
begin
   select paramString || ' ' || paramNumber::varchar(100)
   into return_value;
   
   return return_value;
end;
$$;