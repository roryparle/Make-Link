#!/bin/bash

pushd chrome
zip makelink.jar $(find content skin locale -type f -or -type d | grep -v '\(/\|^\)\.')
popd
zip makelink.xpi chrome/ chrome/makelink.jar chrome.manifest install.rdf defaults/ defaults/preferences/defaults.js

