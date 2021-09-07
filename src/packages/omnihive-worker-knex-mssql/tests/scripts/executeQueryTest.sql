insert into dbo.test_table (
    test_data
)
values (
    'Testing Values 1'
)

select tt.test_data
from dbo.test_table as tt