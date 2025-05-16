import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface SaveDataProps {
  location: { latitude: number; longitude: number };
  onSave: (data: SaveData) => void;
}

interface SaveData {
  name: string;
  location_name: string;
  date: Date;
  note: string;
  location: { latitude: number; longitude: number };
}

export default function SaveScreen({ location, onSave }: SaveDataProps) {
  const [name, setName] = useState('');
  const [location_name, setLocationName] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isFuture, setIsFuture] = useState(false);
  const [noData, setNoData] = useState(false); // 🔧 new state
  const [message, setMessage] = useState('');

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  const clearInputs = () => {
    setName('');
    setLocationName('');
    setNote('');
  };

  const loadDataForDate = async (selectedDate: Date) => {
    const key = getDateKey(selectedDate);
    const json = await AsyncStorage.getItem(key);
    if (json) {
      const data: SaveData = JSON.parse(json);
      setName(data.name);
      setLocationName(data.location_name);
      setNote(data.note);
      setNoData(false); // 🔧 data exists
    } else {
      clearInputs();
      setNoData(true); // 🔧 no data found
    }
  };

  const handleSave = async () => {
    const dataToSave: SaveData = {
      name,
      location_name,
      date,
      note,
      location,
    };

    const key = getDateKey(date);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
      setMessage('Data saved successfully.');
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Failed to save data.');
    }
    setTimeout(() => {
      setMessage('');
    }, 3000); // clears after 3 seconds

  };


  const handlePost = async () => {
    if (!note) {
      alert('Please enter a note to share.');
      return;
    }
    try {
      // 1. Save note text to a temp file
      const fileUri = FileSystem.cacheDirectory + 'note.txt';
      await FileSystem.writeAsStringAsync(fileUri, note, { encoding: FileSystem.EncodingType.UTF8 });

      // 2. Share the file
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Sharing failed:', error);
      alert('Sharing failed. Please try again.');
    }
  };

  const handleDateChange = async (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(false);
    setDate(currentDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const isSelectedFuture = currentDate > today;
    const isSelectedToday = currentDate.getTime() === today.getTime();

    setIsFuture(isSelectedFuture);

    if (isSelectedFuture) {
      clearInputs();
      setNoData(false);
      return;
    }

    // For past or today — try to load data
    const key = getDateKey(currentDate);
    const json = await AsyncStorage.getItem(key);

    if (json) {
      const data: SaveData = JSON.parse(json);
      setName(data.name);
      setLocationName(data.location_name);
      setNote(data.note);
      setNoData(false);
    } else {
      clearInputs();
      setNoData(!isSelectedToday); // noData = true only if past & no data
    }
  };


  const isDisabled = isFuture || noData;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Note</Text>

      <TextInput
        style={styles.nameInput}
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
        editable={!isDisabled}
      />

      <TextInput
        style={styles.nameInput}
        placeholder="Destination"
        placeholderTextColor="#aaa"
        value={location_name}
        onChangeText={setLocationName}
        editable={!isDisabled}
      />

      <Pressable onPress={() => setShowPicker(true)} style={styles.datePicker}>
        <Text style={styles.dateText}>
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
        />
      )}

      <TextInput
        style={styles.noteInput}
        placeholder="Add a note..."
        placeholderTextColor="#666"
        value={note}
        onChangeText={setNote}
        editable={!isDisabled}
        multiline
        numberOfLines={4}
      />

      {/* 🔧 Show "no data" message if needed */}
      {noData && (
        <Text style={styles.noDataText}>There is no data.</Text>
      )}
      {message !== '' && (
        <Text style={{ color: 'lightgreen', marginBottom: 15, textAlign: 'center' }}>
          {message}
        </Text>
      )}


      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={isDisabled}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.postButton]} onPress={handlePost}>
          <Text style={styles.buttonText}>Post</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 20,
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 70,
    alignSelf: 'center',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 25,
  },
  datePicker: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    backgroundColor: '#222',
    marginBottom: 15,
  },
  dateText: {
    color: '#fff',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    color: '#000',
    marginBottom: 20,
    height: 120,
    textAlignVertical: 'top',
  },
  noDataText: {
    color: '#ff6666',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  postButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
