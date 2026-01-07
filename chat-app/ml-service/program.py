a = [1,8,23,9,2,3,7,4,6,45,23,10]
tar = 10
sum= 0
map = []
for x in a:
  comp = tar - x
  if map.contains(comp):
    print(comp)
    print(x)
  map.put(x, comp)