import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WorkoutsToday from './WorkoutsTodayTab';

const Tab = createBottomTabNavigator();

const TabNavigation = ({ userDetails }) => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Workouts Today">
        {props => <WorkoutsToday {...props} userDetails={userDetails} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TabNavigation;