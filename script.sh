#!/bin/bash

export DISPLAY=:10
cd /home/ubuntu/Skvallra
git pull
nightwatch -c /home/ubuntu/Skvallra/Tests/settings.json > Logs/`date "+%m-%d-%Y"`.testlog
rm -rf tests_output
git add Logs/*
git commit -m "Automated Testing Logs For `date '+%m-%d-%Y'`"
git push
