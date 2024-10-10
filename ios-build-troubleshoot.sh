#!/bin/bash

echo "Cleaning iOS build..."
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData

echo "Cleaning node_modules and reinstalling dependencies..."
rm -rf node_modules
rm yarn.lock
yarn install

echo "Cleaning React Native cache..."
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

echo "Cleaning Pod cache and reinstalling..."
cd ios
rm -rf Pods
rm Podfile.lock
pod deintegrate
pod setup
pod install

echo "Rebuilding iOS project..."
cd ..
npx react-native run-ios --verbose

echo "If the build fails again, please check the error message and consider opening the project in Xcode for more detailed debugging."
