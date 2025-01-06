import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Home from "./src/components/screens/Home";
//import {Provider} from 'react-redux';

//import store, { persistor } from "./src/components/redux/store";
//import { PersistGate } from "redux-persist/integration/react";

const App = () => {
  return (

          <SafeAreaProvider>
            <Home />
          </SafeAreaProvider>
  );
};
export default App;
