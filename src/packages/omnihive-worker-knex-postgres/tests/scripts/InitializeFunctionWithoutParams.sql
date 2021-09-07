create function test_function_without_params()
returns varchar(100)
language plpgsql
as
$$
begin   
   return 'Success';
end;
$$;