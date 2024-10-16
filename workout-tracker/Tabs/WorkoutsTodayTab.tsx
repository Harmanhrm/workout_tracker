import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert, Modal, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { SERVER_IP } from '@env';
import DateTimePicker from '@react-native-community/datetimepicker';


const WorkoutsToday = ({ userDetails }) => {
  const [workouts, setWorkouts] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [workoutType, setWorkoutType] = useState('cardio');
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    categoryId: null,
    typeId: null,
    userId: userDetails.id,
  });
  const [categories, setCategories] = useState([]);
  const [strengthSets, setStrengthSets] = useState([
    {
      set_number: 1,
      reps: 0,
      weight: 0,
      rpe: 0,
    },
  ]);
  const [completedStrengthSets, setCompletedStrengthSets] = useState([]);
  const [newCardioWorkout, setNewCardioWorkout] = useState({
    distance: '',
    calories: '',
    speed: '',
    time: '',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchTimer, setSearchTimer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    fetchWorkouts(selectedDate);
    fetchCategories();
  }, [selectedDate]);

  const fetchWorkouts = async (date) => {
    try {
      if (date === 'Today') {
        date = new Date().toISOString().split('T')[0]; // Format the date as YYYY-MM-DD
      }
      console.log('Fetching workouts for date:', date);
      const response = await axios.get(`http://${SERVER_IP}:3000/user-workouts`, { params: { userId: userDetails.id } });
      const filteredWorkouts = response.data.filter(workout => {
        const workoutDate = new Date(workout.date).toLocaleDateString('en-US');
        const selectedDate = new Date(date).toLocaleDateString('en-US');
        return workoutDate === selectedDate;
      });
      const sortedWorkouts = filteredWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkouts(sortedWorkouts);
    } catch (error) {
      console.log('Error', 'Failed to fetch workouts');
    }
  };
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`http://${SERVER_IP}:3000/categories`);
      setCategories(response.data);
    } catch (error) {
      console.log('Error', 'Failed to fetch categories');
    }
  };

  const searchWorkouts = async (name) => {
    try {
      const response = await axios.get(`http://${SERVER_IP}:3000/search-workouts`, { params: { name } });
      setSearchResults(response.data);
    } catch (error) {
      console.log('Error', 'Failed to search workouts');
    }
  };

  const handleNameChange = (text) => {
    setNewWorkout({ ...newWorkout, name: text });
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    if (text.trim() !== '') {
      setSearchTimer(setTimeout(() => searchWorkouts(text), 300));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddWorkout = async () => {
    try {
      const filteredStrengthSets = completedStrengthSets.filter(set => set.reps !== '' && set.weight !== '' && set.rpe !== '');
  
      const workoutData = {
        ...newWorkout,
        typeId: workoutType === 'cardio' ? 2 : 1,
        cardioDetails: workoutType === 'cardio' ? newCardioWorkout : null,
        strengthDetails: workoutType === 'strength' ? filteredStrengthSets : null,
        date: new Date().toISOString(),
      };
  
      console.log('Sending workout data:', workoutData);
  
      const workoutResponse = await axios.post(`http://${SERVER_IP}:3000/workout`, workoutData);
  
      console.log('Workout added successfully:', workoutResponse.data);
  
      fetchWorkouts(selectedDate);
      setModalVisible(false);
      setCompletedStrengthSets([]); // Clear completed sets after successful add
    } catch (error) {
      console.error('Error adding workout:', error);
      Alert.alert('Error', 'Failed to add workout');
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addStrengthSet = () => {
    const newSetNumber = completedStrengthSets.length + 1;
    const updatedStrengthSets = strengthSets.map((set, index) => ({
      ...set,
      set_number: newSetNumber + index,
    }));
    setCompletedStrengthSets([...completedStrengthSets, ...updatedStrengthSets]);
    setStrengthSets([
      {
        set_number: completedStrengthSets.length + updatedStrengthSets.length + 1,
        reps: strengthSets[0].reps,
        weight: strengthSets[0].weight,
        rpe: strengthSets[0].rpe,
      },
    ]);
  };

  const clearStrengthSet = () => {
    setStrengthSets([
      {
        set_number: 1,
        reps: 0,
        weight: 0,
        rpe: 0,
      },
    ]);
  };

  const incrementValue = (field) => {
    const newSets = [...strengthSets];
    if (field === 'weight') {
      newSets[0][field] = (parseInt(newSets[0][field]) || 0) + 5;
    } else {
      newSets[0][field] = (parseInt(newSets[0][field]) || 0) + 1;
      if (field === 'rpe' && newSets[0][field] > 10) {
        newSets[0][field] = 10; // Ensure the value does not exceed 10
      }
    }
    setStrengthSets(newSets);
  };

  const decrementValue = (field) => {
    const newSets = [...strengthSets];
    if (field === 'weight') {
      newSets[0][field] = (parseInt(newSets[0][field]) || 0) - 5;
    } else {
    newSets[0][field] = Math.max((parseInt(newSets[0][field]) || 0) - 1, 0);
    }
    setStrengthSets(newSets);
  };

  const removeCompletedSet = (index) => {
    const newCompletedSets = [...completedStrengthSets];
    newCompletedSets.splice(index, 1);
    setCompletedStrengthSets(newCompletedSets);
  };

  const renderWorkoutFields = () => {
    if (workoutType === 'cardio') {
      return (
        <>
          <TextInput
            style={styles.input}
            placeholder="Distance"
            value={newCardioWorkout.distance}
            onChangeText={(text) => setNewCardioWorkout({ ...newCardioWorkout, distance: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Calories"
            value={newCardioWorkout.calories}
            onChangeText={(text) => setNewCardioWorkout({ ...newCardioWorkout, calories: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Speed"
            value={newCardioWorkout.speed}
            onChangeText={(text) => setNewCardioWorkout({ ...newCardioWorkout, speed: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Time"
            value={newCardioWorkout.time}
            onChangeText={(text) => setNewCardioWorkout({ ...newCardioWorkout, time: text })}
          />
        </>
      );
    } else if (workoutType === 'strength') {
      return (
        <>
          <View style={styles.setRow}>
        <TextInput
          style={styles.inputSmall}
          placeholder="Reps"
          value={strengthSets[0].reps === 0 ? '' : strengthSets[0].reps.toString()}
          onChangeText={(text) => {
            const newSets = [...strengthSets];
            newSets[0].reps = parseInt(text) || 0;
            setStrengthSets(newSets);
          }}
        />
        <View style={styles.arrowContainer}>
          <TouchableOpacity onPress={() => incrementValue('reps')}>
            <Icon name="arrow-up" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => decrementValue('reps')}>
            <Icon name="arrow-down" size={20} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.inputSmall}
          placeholder="Weight"
          value={strengthSets[0].weight === 0 ? '' : strengthSets[0].weight.toString()}
          onChangeText={(text) => {
            const newSets = [...strengthSets];
            newSets[0].weight = parseInt(text) || 0;
            setStrengthSets(newSets);
          }}
        />
        <View style={styles.arrowContainer}>
          <TouchableOpacity onPress={() => incrementValue('weight')}>
            <Icon name="arrow-up" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => decrementValue('weight')}>
            <Icon name="arrow-down" size={20} />
          </TouchableOpacity>
        </View>
        <TextInput
           style={styles.inputSmall}
           placeholder="RPE"
           value={strengthSets[0].rpe === 0 ? '' : strengthSets[0].rpe.toString()}
           onChangeText={(text) => {
             const newSets = [...strengthSets];
             const rpeValue = parseInt(text) || 0;
             newSets[0].rpe = rpeValue > 10 ? 10 : rpeValue; // Ensure the value does not exceed 10
             setStrengthSets(newSets);
          }}
        />
        <View style={styles.arrowContainer}>
          <TouchableOpacity onPress={() => incrementValue('rpe')}>
            <Icon name="arrow-up" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => decrementValue('rpe')}>
            <Icon name="arrow-down" size={20} />
          </TouchableOpacity>
        </View>
          </View>
        </>
      );
    }
  };

  const renderCategoryDropdown = () => (
    <Picker
      selectedValue={newWorkout.categoryId}
      style={styles.input}
      onValueChange={(itemValue) => setNewWorkout({ ...newWorkout, categoryId: itemValue })}
    >
      {categories.map((category) => (
        <Picker.Item key={category.id} label={category.name} value={category.id} />
      ))}
    </Picker>
  );

  const renderSearchResults = () => (
    showSuggestions && newWorkout.name.trim() !== '' && searchResults.map((result) => (
      <TouchableOpacity key={result.id} onPress={() => setNewWorkout({ ...newWorkout, name: result.name })}>
        <Text style={styles.searchResult}>{result.name}</Text>
      </TouchableOpacity>
    ))
  );
  
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };
  
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };
  
  const formattedDate = (() => {
    const today = new Date();
    if (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  return (
    <View style={{ flex: 1, padding: 20, marginBottom: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.welcomeText}>Welcome, {userDetails.username}!</Text>
        <View style={[styles.dates, { flexDirection: 'row', alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Icon name="arrow-back" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={{ marginHorizontal: 10 }}>{formattedDate}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDate(1)}>
            <Icon name="arrow-forward" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      <Button title="Add Workout" onPress={() => setModalVisible(true)} />
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <List.Accordion
              title={
                <View>
                  <Text style={styles.accordionTitle}>{item.name}</Text>
                  <Text style={styles.detailText}>
                    {`${new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}, ${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </Text>
                </View>
              }
              expanded={expanded[item.id]}
              onPress={() => toggleExpand(item.id)}
              titleStyle={styles.accordionTitle}
              style={styles.accordion}
            >
              <View style={styles.workoutDetails}>
                <Text style={styles.detailText}>
                  Category: {categories.find(category => category.id === item.category_id)?.name || 'Uncategorized'}
                </Text>
                <Text style={styles.detailText}>Type: {item.type_id === 1 ? 'Strength' : 'Cardio'}</Text>
                {item.strength_workouts && item.strength_workouts.map((set, index) => (
                  <View key={index} style={styles.setContainer}>
                    <Text style={styles.detailText}>Set {set.set_number}: {set.reps} reps @ {set.weight} kg at RPE {set.rpe}</Text>
                  </View>
                ))}
                {item.cardio_workouts && item.cardio_workouts.map((cardio, index) => (
                  <View key={index} style={styles.setContainer}>
                    <Text style={styles.detailText}>Distance: {cardio.distance}, Calories: {cardio.calories}, Speed: {cardio.speed}, Time: {cardio.time}</Text>
                  </View>
                ))}
              </View>
            </List.Accordion>
            <View style={styles.separator} />
          </View>
        )}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView contentContainerStyle={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Icon name="close" size={24} color="black" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={newWorkout.name}
            onChangeText={handleNameChange}
          />
          <Button
            title={showSuggestions ? "Hide Suggestions" : "Show Suggestions"}
            onPress={() => setShowSuggestions(!showSuggestions)}
          />
          {renderSearchResults()}
          {renderCategoryDropdown()}
          <Picker
            selectedValue={workoutType}
            style={styles.input}
            onValueChange={(itemValue) => setWorkoutType(itemValue)}
          >
            <Picker.Item label="Cardio" value="cardio" />
            <Picker.Item label="Strength" value="strength" />
          </Picker>
          {renderWorkoutFields()}
          <View style={styles.buttonRow}>
            <Button title="Add Set" onPress={addStrengthSet} />
            <Button title="Add Workout" onPress={handleAddWorkout} />
            <Button title="Clear" onPress={clearStrengthSet} />
          </View>
          {completedStrengthSets.map((set, index) => (
            <View key={index} style={styles.setContainer}>
              <Text>{index + 1} </Text>
              <Text>{set.weight} kgs</Text>
              <Text>{set.reps} reps </Text>
              <Text> {set.rpe} RPE</Text>
              <TouchableOpacity onPress={() => removeCompletedSet(index)}>
                <Icon name="close" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 40,
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10
  },
  inputSmall: {
    width: '30%', // Adjust width to fit more items per row
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10
  },
  setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20, 
    marginBottom: 20,
    width: '100%', // Adjust width to fit more items per row
    margin: 5, // Add margin for spacing
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginRight: 50,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25,
  },
  arrowContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  searchResult: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    width: '80%',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dates: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 3,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutDetails: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
  },
  setHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: 'gray',
    marginVertical: 10,
    width: '0%', // Make the separator a horizontal line
  },
  accordion: {
    backgroundColor: 'white',
  },
});

export default WorkoutsToday;