import { useRouter } from 'expo-router';
import { View, Text, Button, StyleSheet, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useState, useEffect } from 'react';
import 'expo-router/entry';


export default function HomeScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [time, setTime] = useState(new Date());
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();
  const formatTime = (n: number) => n.toString().padStart(2, '0');


  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second
    return () => clearInterval(interval);
  }, []);

  const languageOptions = [
    { label: '🇺🇸 English', value: 'en' },
    { label: '🇵🇱 Polski', value: 'pl' }, // Added Poland
    { label: '🇫🇷 Français', value: 'fr' },
    { label: '🇩🇪 Deutsch', value: 'de' },
    { label: '🇯🇵 日本語', value: 'jp' },
  ];
  

  return (

    <View style={styles.container}>
      {/* Language Picker at top-right */}
         {/* Main Content */}

     <View style={styles.languagePicker}>
       <Picker
         selectedValue={language}
         onValueChange={(value) => setLanguage(value)}
         style={{ color: 'white', backgroundColor: 'black', height: 60, width: 120 }}
         dropdownIconColor="white"
       >
         {languageOptions.map((option) => (
           <Picker.Item
             key={option.value}
             label={option.label}
             value={option.value}
           />
         ))}
       </Picker>
     </View>
      <View style={styles.content}>
        {/* Top Image */}
        {/* <Image
          source={{ uri: 'https://via.placeholder.com/150' }} // replace with your image URL
          style={styles.image}
          resizeMode="contain"
        /> */}

        {/* Title */}
        {/* <Text style={styles.title}>Welcome to boilerplate</Text> */}

        {/* Clock Circles */}
        <View style={styles.clockLayout}>
          {/* Hour Circle (left) */}
          <View style={[styles.circle, styles.bigCircle, { backgroundColor: '#00D36F' }]}>
            <Text style={styles.circleLabel}>Hour</Text>
            <Text style={styles.circleValue}>{formatTime(hour)}</Text>
          </View>

          {/* Vertical stack: Minute above, Second below */}
          <View style={styles.rightColumn}>
            <View style={[styles.circle, styles.mediumCircle, { backgroundColor: '#00C6FF' }]}>
              <Text style={styles.circleLabel}>Min</Text>
              <Text style={styles.circleValueSmall}>{formatTime(minute)}</Text>
            </View>
            <View style={[styles.circle, styles.smallCircle, { backgroundColor: '#E55AFF' }]}>
              <Text style={styles.circleLabel}>Sec</Text>
              <Text style={styles.circleValueSmall}>{formatTime(second)}</Text>
            </View>
          </View>
        </View>
        <Image
          source={require('../../assets/images/slash.png')}
          style={styles.slashImage}
        />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'black' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 20, color: "white" },
  languagePicker: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    width: 100,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  clockContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 30,
  },
  timeText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  bigCircle: {
    width: 250,
    height: 250,
    borderRadius: 200,
  },
  mediumCircle: {
    width: 110,
    height: 110,
    borderRadius: 70,
  },
  smallCircle: {
    width: 100,
    height: 100,
    borderRadius: 70,
  },
  smallCirclesContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  circleLabel: {
    color: 'white',
    fontSize: 24,
    marginBottom: 5,
  },
  circleValue: {
    color: 'white',
    fontSize: 72,
    fontWeight: 'bold',
  },
  circleValueSmall: {
    color: 'white',
    fontSize: 38,
    fontWeight: 'bold',
  },
  clockLayout: {
    position: 'absolute',
    top: 160, // move closer to the top (adjust as needed)
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },


  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
    slashImage: {
      position: 'absolute',
      bottom: -20,
      left: -20,
      width: 250,
      height: 250,
      resizeMode: 'contain',
    },

});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 12,
    paddingVertical: 20,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'white',
    backgroundColor: 'black',
  },
  inputAndroid: {
    fontSize: 10,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'white',
    backgroundColor: 'black',
  },
});
