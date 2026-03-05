import React, { Component } from 'react';
import { Text, View } from 'react-native';
// import { Container, Title, SlapHole, ArrowBack } from './styles';
import { router } from 'expo-router';
import  * as Icons  from "react-native-heroicons/outline";
import { StatusBar } from 'expo-status-bar';

const Header = (props) => {

  var {arrowBack, title, saveButton, saveButtonOnPress, popToTop, actions} = props
  
  const getIconAction = () => {

    if(arrowBack) {
      return <Icons.ArrowLeftIcon 
      size={20}
      color={'black'}
      onPress={() => router.back()} />

    }else if(popToTop) {
      return <Icons.ArrowLeftIcon 
      size={28}
      color={'black'}
      onPress={() => router.push('/home')} />
    }

    return <></>
  } 

  return (
      <View {...props} className="font-psemibold flex flex-row items-center px-2 justify-between">
          <StatusBar backgroundColor="#FF9001" style="dark" />

          {getIconAction()}
          <Text className="font-psemibold text-lg">{title}</Text>
        
        {actions ? (
          <View className="flex flex-row ">
            {actions}
          </View>
        ) :
          <View></View>}
      </View>
  );
}

export default (Header);

