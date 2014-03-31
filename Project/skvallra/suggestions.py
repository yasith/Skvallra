import math
import random

EPOCHS = 100

people = []
friends = {}

'''
TEST DATA

people = ["Chris", "Yuliya", "Yasith", "Andrew", "Gerhard", "Dan", "Anton", "Alex", "Sue",
          "Rackoff", "Abbas"]
friends = {}
friends["Chris"] = ["Yuliya", "Yasith", "Anton", "Alex"]
friends["Yuliya"] = ["Chris", "Yasith", "Anton", "Alex", "Rackoff"]
friends["Yasith"] = ["Chris", "Yuliya"]
friends["Andrew"] = ["Gerhard", "Dan", "Sue"]
friends["Gerhard"] = ["Andrew", "Dan", "Rackoff", "Abbas"]
friends["Dan"] = ["Andrew", "Gerhard", "Rackoff", "Abbas"]
friends["Anton"] = ["Alex"]
friends["Alex"] = ["Anton"]
friends["Sue"] = ["Andrew", "Gerhard", "Dan", "Abbas", "Rackoff"]
friends["Rackoff"] = ["Andrew"]
friends["Abbas"] = ["Yuliya", "Andrew", "Gerhard", "Dan", "Rackoff"]
'''

def euclidean_distance(p, q):
  ''' p and q are two person vectors '''

  dimension = len(people)

  squared = 0
  for i in range(dimension):
    squared += (p[i] - q[i]) ** 2

  distance = math.sqrt(squared)
  
  return distance

def create_vector(person):
  vector = []

  for other in people:
    if other in friends[person]:
      vector.append(1)
    else:
      vector.append(0)

  return vector

def create_vectors():
  vectors = {}
  for person in people:
    vectors[person] = create_vector(person)

  return vectors

def choose_random(k):
  chosen = people[:]
  random.shuffle(chosen)

  return chosen[:k]

def assign_groups(groups, vectors):
  
  cluster = [ [] for x in range(len(groups)) ]

  for i, person in enumerate(people): 
    person = people[i]
    pv = vectors[person]

    lowest_distance = euclidean_distance(pv, groups[0])
    lowest = 0
    for j, gv in enumerate(groups):
      gv = groups[j]
      dist = euclidean_distance(pv, gv)
      if dist < lowest_distance:
        lowest = j
        lowest_distance = dist

    cluster[lowest].append(person)

  return cluster

def average(group, vectors):
  vector = [0 for i in range(len(people))]

  for p in group:
    for i in range(len(people)):
      vector[i] += vectors[p][i]

  for i in range(len(vector)):
    vector[i] = float(vector[i]) / len(vector)

  return vector

def average_vectors(cluster, vectors):

  groups = []
  for group in cluster:
    groups.append(average(group, vectors))

  return groups

def kmeans(k, vectors):

  groups = [vectors[p] for p in choose_random(k)] # randomly chosen k vectors
  cluster = assign_groups(groups, vectors) # names of person clusters assigned wrt groups

  for i in range(EPOCHS):
    groups = average_vectors(cluster, vectors)
    cluster = assign_groups(groups, vectors)

  return cluster

def suggest_friends(person, clusters):

  suggested = []

  for cluster in clusters:
    if person in cluster:
      for other in cluster:
        if other is not person and other not in friends[person]:
          suggested.append(other)

  return suggested

def get_suggestion(user_id, _people, _friends):

  global people
  global friends
  people = _people
  friends = _friends

  vectors = create_vectors()

  clusters = kmeans(4, vectors)

  suggested = suggest_friends(user_id, clusters)
  return suggested

if __name__ == "__main__":
  people = ["Chris", "Yuliya", "Yasith", "Andrew", "Gerhard", "Dan", "Anton", "Alex", "Sue",
          "Rackoff", "Abbas"]
  friends = {}
  friends["Chris"] = ["Yuliya", "Yasith", "Anton", "Alex"]
  friends["Yuliya"] = ["Chris", "Yasith", "Anton", "Alex", "Rackoff"]
  friends["Yasith"] = ["Chris", "Yuliya"]
  friends["Andrew"] = ["Gerhard", "Dan", "Sue"]
  friends["Gerhard"] = ["Andrew", "Dan", "Rackoff", "Abbas"]
  friends["Dan"] = ["Andrew", "Gerhard", "Rackoff", "Abbas"]
  friends["Anton"] = ["Alex"]
  friends["Alex"] = ["Anton"]
  friends["Sue"] = ["Andrew", "Gerhard", "Dan", "Abbas", "Rackoff"]
  friends["Rackoff"] = ["Andrew"]
  friends["Abbas"] = ["Yuliya", "Andrew", "Gerhard", "Dan", "Rackoff"]
  get_suggestion("Yasith", people, friends)
	
