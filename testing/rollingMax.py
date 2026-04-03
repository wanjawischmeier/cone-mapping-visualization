from random import randrange

iteration_count = 100
window_size = 5

# Generate list
data = []
for index in range(iteration_count):
    value = randrange(0, 10)
    if value < 4:
        value = None
    
    data.append(value)
    
print(f'Data:\n{data}')

# Iterate with rolling max
rolling_max = data[0]
rolling_max_index = 0
print(f'[0]: Initialized max {rolling_max}')

for index in range(1, iteration_count):
    value = data[index]
    if value == None:
        print(f'[{index}]: Skipped <None> value')
        continue
    
    if index - rolling_max_index >= window_size:
        # Last max outside window, always set max to new value
        print(f'[{index}]: Last max {rolling_max} at index {rolling_max_index} outside of window, setting new max {value}')
        rolling_max = value
        rolling_max_index = index
    
    elif rolling_max == None or value >= rolling_max:
        # Else only update when value is actually greater
        print(f'[{index}]: Last max {rolling_max} at index {rolling_max_index} less than current, setting new max {value}')
        rolling_max = value
        rolling_max_index = index
    
    else:
        print(f'[{index}]: Last max {rolling_max} at index {rolling_max_index} greater than current {value}')

print(f'Max: {rolling_max} at index {rolling_max_index}')
