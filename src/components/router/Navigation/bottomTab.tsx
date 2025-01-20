import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RFPercentage} from 'react-native-responsive-fontsize';
const Tab = createBottomTabNavigator();
const StackNavigator = createStackNavigator();
import {createStackNavigator} from '@react-navigation/stack';
import Favorite from '../../screens/Favorite';
import Profile from '../../screens/Profile';
import Categories from '../../screens/Categories';
import MyHome from '../../screens/MyHome';
import CategoryProducts from '../../screens/Categories/CategoryProducts';
import ProductDetail from '../../screens/MyHome/ProductDetail';


const HomeStackScreen = () => {
  return (
    <StackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        gesturesEnabled: false,
        swipeEnabled: false,
      }}
      gestureHandlerProps={{
        maxPointers: 1,
        swipeEnabled: false,
      }}
      navigationOptions={{
        cardStack: {
          gesturesEnabled: false,
          swipeEnabled: false,
        },
      }}
      options={{
        gestureEnabled: false,
      }}
      initialRouteName="Login">
      <StackNavigator.Screen
        navigationOptions={{
          drawerLockMode: 'locked-closed',
          cardStack: {
            gesturesEnabled: false,
            swipeEnabled: false,
            header: null,
          },
        }}
        options={{
          gestureEnabled: false,
          swipeEnabled: false,
        }}
        name="Home"
        component={MyHome}
      />
        <StackNavigator.Screen
            navigationOptions={{
                drawerLockMode: 'locked-closed',
                cardStack: {
                    gesturesEnabled: false,
                    swipeEnabled: false,
                    header: null,
                },
            }}
            options={{
                gestureEnabled: false,
                swipeEnabled: false,
            }}
            name="CategoryProducts"
            component={CategoryProducts}
        />

        <StackNavigator.Screen
            navigationOptions={{
                drawerLockMode: 'locked-closed',
                cardStack: {
                    gesturesEnabled: false,
                    swipeEnabled: false,
                    header: null,
                },
            }}
            options={{
                gestureEnabled: false,
                swipeEnabled: false,
            }}
            name="ProductDetail"
            component={ProductDetail}
        />
    </StackNavigator.Navigator>
  );
};
const FavoriesStackScreen = () => {
  return (
    <StackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        gesturesEnabled: false,
        swipeEnabled: false,
      }}
      gestureHandlerProps={{
        maxPointers: 1,
        swipeEnabled: false,
      }}
      navigationOptions={{
        cardStack: {
          gesturesEnabled: false,
          swipeEnabled: false,
        },
      }}
      options={{
        gestureEnabled: false,
      }}
      initialRouteName="Favorite">
      <StackNavigator.Screen
        navigationOptions={{
          drawerLockMode: 'locked-closed',
          cardStack: {
            gesturesEnabled: false,
            swipeEnabled: false,
            header: null,
          },
        }}
        options={{
          gestureEnabled: false,
          swipeEnabled: false,
        }}
        name="Favorite"
        component={Favorite}
      />

    </StackNavigator.Navigator>
  );
};
const CartStackScreen = () => {
  return (
    <StackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        gesturesEnabled: false,
        swipeEnabled: false,
      }}
      gestureHandlerProps={{
        maxPointers: 1,
        swipeEnabled: false,
      }}
      navigationOptions={{
        cardStack: {
          gesturesEnabled: false,
          swipeEnabled: false,
        },
      }}
      options={{
        gestureEnabled: false,
      }}
      initialRouteName="Login">
      <StackNavigator.Screen
        navigationOptions={{
          drawerLockMode: 'locked-closed',
          cardStack: {
            gesturesEnabled: false,
            swipeEnabled: false,
            header: null,
          },
        }}
        options={{
          gestureEnabled: false,
          swipeEnabled: false,
        }}
        name="Profile"
        component={Profile}
      />
    </StackNavigator.Navigator>
  );
};
const CategoriesStackScreen = () => {
  return (
    <StackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        gesturesEnabled: false,
        swipeEnabled: false,
      }}
      gestureHandlerProps={{
        maxPointers: 1,
        swipeEnabled: false,
      }}
      navigationOptions={{
        cardStack: {
          gesturesEnabled: false,
          swipeEnabled: false,
        },
      }}
      options={{
        gestureEnabled: false,
      }}
      initialRouteName="Categorie">
      <StackNavigator.Screen
        navigationOptions={{
          drawerLockMode: 'locked-closed',
          cardStack: {
            gesturesEnabled: false,
            swipeEnabled: false,
            header: null,
          },
        }}
        options={{
          gestureEnabled: false,
          swipeEnabled: false,
        }}
        name="Categorie"
        component={Categories}
      />
        <StackNavigator.Screen
            navigationOptions={{
                drawerLockMode: 'locked-closed',
                cardStack: {
                    gesturesEnabled: false,
                    swipeEnabled: false,
                    header: null,
                },
            }}
            options={{
                gestureEnabled: false,
                swipeEnabled: false,
            }}
            name="CategoryProducts"
            component={CategoryProducts}
        />
    </StackNavigator.Navigator>
  );
};

const SearchStackScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({route}) => ({
        safeAreaInset: {bottom: 'never', top: 'never'},
        labelStyle: {
          fontSize: RFPercentage(1.6),
        },
        tabStyle: {
          fontSize: RFPercentage(1.6),
        },
        tabBarActiveTintColor: '#28AF6E',
        tabBarInactiveTintColor: 'gray',
        style: {
          elevation: 0,
          backgroundColor: '#f2f2f2',
          borderBottomColor: '#f2f2f2',
          ...styles.shadow,
        },
        tabBarStyle: {backgroundColor: '#fff', height: 90},
        header: () => null,
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused
                ? require('../../../components/images/home.png')
                : require('../../../components/images/home.png');
              break;
            case 'My Lists':
              iconName = focused
                ? require('../../../components/images/heart.png')
                :  require('../../../components/images/heart.png');
              break;
              case 'My Account':
                  iconName = focused
                      ? require('../../../components/images/profile.png')
                      :  require('../../../components/images/profile.png');
                  break;
              case 'Categories':
                  iconName = focused
                      ? require('../../../components/images/basket.png')
                      :  require('../../../components/images/basket.png');
                  break;
            default:
              iconName = null;
          }
          return (
            iconName && (
              <Image source={iconName} style={{width: 30, height: 30}} />
            )
          );
        },
      })}>
      <Tab.Screen name={'Home'} component={HomeStackScreen} />
      <Tab.Screen name={'My Lists'} component={FavoriesStackScreen} />
      <Tab.Screen name="My Account" component={CartStackScreen}  />
      <Tab.Screen name="Categories" component={CategoriesStackScreen}  />
    </Tab.Navigator>
  );
};
export default SearchStackScreen;
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#f55524',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});
